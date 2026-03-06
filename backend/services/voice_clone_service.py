"""
WAVIUM - Voice Cloning Service
Orchestrates voice cloning via Modal serverless GPU + Supabase storage.

Architecture:
- Voice reference audio stored on Supabase Storage (persistent, shared across Railway instances)
- Voice metadata stored in Supabase Postgres (voice_profiles table)
- TTS synthesis runs on Modal (serverless T4 GPU, ~$0.003/call)
- Railway backend just orchestrates: convert audio → store on Supabase → call Modal → return result

No GPU required on Railway. No XTTS model loaded here.
"""

import os
import uuid
import asyncio
import subprocess
import tempfile
import base64
import httpx
from pathlib import Path

from services.supabase_storage_service import (
    upload_voice_sample,
    download_voice_sample,
    save_voice_metadata,
    get_voice_metadata,
    delete_voice_data,
)

AUDIO_DIR = Path(__file__).parent.parent / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)

TEMP_DIR = Path(tempfile.gettempdir()) / "wavium"
TEMP_DIR.mkdir(exist_ok=True)


def _get_modal_endpoint() -> str:
    """Get the Modal serverless endpoint URL."""
    url = os.getenv("MODAL_ENDPOINT_URL", "").strip()
    if not url:
        raise RuntimeError(
            "MODAL_ENDPOINT_URL not set. Deploy the Modal function first: "
            "modal deploy backend/modal_tts/app.py"
        )
    if not url.startswith("https://") and not url.startswith("http://"):
        raise RuntimeError(
            f"MODAL_ENDPOINT_URL is malformed (missing https://): '{url}'. "
            "Expected: https://jovonbell--wavium-voice-clone-synthesize-endpoint.modal.run"
        )
    return url


def _convert_to_wav(input_path: str, output_path: str) -> None:
    """Convert any audio format to WAV (22050 Hz mono, required by XTTS v2)."""
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "22050",
            "-ac", "1",
            "-sample_fmt", "s16",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg conversion failed: {result.stderr[-500:]}")


async def clone_voice(user_id: str, name: str, audio_path: str) -> str:
    """
    Clone a user's voice by converting and storing their reference audio on Supabase.

    No GPU work here — XTTS v2 uses the reference audio at inference time.
    We just store a clean WAV copy.

    Returns a voice_id string for future TTS calls.
    """
    voice_id = f"clone_{user_id}_{uuid.uuid4().hex[:8]}"

    # Convert uploaded audio to WAV format
    wav_path = str(TEMP_DIR / f"{voice_id}.wav")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _convert_to_wav(audio_path, wav_path))

    # Read the WAV and upload to Supabase Storage
    with open(wav_path, "rb") as f:
        wav_bytes = f.read()

    await loop.run_in_executor(
        None, lambda: upload_voice_sample(user_id, voice_id, wav_bytes)
    )

    # Save metadata — rollback storage upload if this fails
    try:
        await loop.run_in_executor(
            None, lambda: save_voice_metadata(user_id, voice_id, name)
        )
    except Exception as e:
        # Rollback: delete the orphaned Storage file so we don't have stale data
        import logging
        logging.warning(
            f"Postgres metadata save failed for voice {voice_id}, rolling back Storage upload: {e}"
        )
        try:
            await loop.run_in_executor(
                None, lambda: delete_voice_data(user_id)
            )
        except Exception as rollback_err:
            logging.error(f"Storage rollback also failed: {rollback_err}")
        raise  # Re-raise the original error so the endpoint returns 500

    # Clean up temp file
    try:
        os.remove(wav_path)
    except OSError:
        pass

    return voice_id


async def synthesize_cloned_voice(
    text: str,
    voice_id: str,
    user_id: str,
    output_filename: str | None = None,
) -> str:
    """
    Generate TTS audio using a user's cloned voice.

    1. Downloads reference audio from Supabase
    2. Sends text + reference to Modal serverless GPU
    3. Saves output locally and returns path

    Args:
        text: The text to synthesize (or joined affirmations)
        voice_id: The voice clone ID (from clone_voice)
        user_id: The user's ID
        output_filename: Optional custom filename

    Returns:
        Path to the generated audio file (WAV)
    """
    loop = asyncio.get_event_loop()

    # Download reference audio from Supabase
    ref_audio = await loop.run_in_executor(
        None, lambda: download_voice_sample(user_id, voice_id)
    )

    # Call Modal serverless endpoint
    modal_url = _get_modal_endpoint()
    payload = {
        "text": text,
        "reference_audio_b64": base64.b64encode(ref_audio).decode(),
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(modal_url, json=payload)
            if response.status_code != 200:
                # Read the actual error from Modal instead of generic raise_for_status
                try:
                    error_body = response.json()
                    error_msg = error_body.get("error", response.text[:500])
                except Exception:
                    error_msg = response.text[:500]
                raise RuntimeError(
                    f"Modal synthesis failed (HTTP {response.status_code}): {error_msg}"
                )
            result = response.json()
    except httpx.ConnectError as e:
        raise RuntimeError(
            f"Cannot reach Modal endpoint '{modal_url}': {e}. "
            "Check MODAL_ENDPOINT_URL env var on Railway and ensure the Modal app is deployed."
        ) from e

    # Decode returned audio
    audio_bytes = base64.b64decode(result["audio_b64"])

    # Save to local audio output dir
    if output_filename is None:
        output_filename = f"clone_tts_{uuid.uuid4().hex[:8]}.wav"
    output_path = str(AUDIO_DIR / output_filename)

    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    return output_path


async def synthesize_cloned_voice_lines(
    lines: list[str],
    voice_id: str,
    user_id: str,
    output_filename: str | None = None,
) -> str:
    """
    Synthesize multiple affirmation lines individually then concatenate.
    Faster than one giant text block — each line is ~1-2 sec GPU.

    Returns path to the generated audio file (WAV).
    """
    loop = asyncio.get_event_loop()

    # Download reference audio from Supabase
    ref_audio = await loop.run_in_executor(
        None, lambda: download_voice_sample(user_id, voice_id)
    )

    # Call Modal with lines array (triggers per-line synthesis + concat)
    modal_url = _get_modal_endpoint()
    payload = {
        "lines": lines,
        "reference_audio_b64": base64.b64encode(ref_audio).decode(),
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(modal_url, json=payload)
            if response.status_code != 200:
                try:
                    error_body = response.json()
                    error_msg = error_body.get("error", response.text[:500])
                except Exception:
                    error_msg = response.text[:500]
                raise RuntimeError(
                    f"Modal synthesis failed (HTTP {response.status_code}): {error_msg}"
                )
            result = response.json()
    except httpx.ConnectError as e:
        raise RuntimeError(
            f"Cannot reach Modal endpoint '{modal_url}': {e}. "
            "Check MODAL_ENDPOINT_URL env var on Railway and ensure the Modal app is deployed."
        ) from e

    audio_bytes = base64.b64decode(result["audio_b64"])

    if output_filename is None:
        output_filename = f"clone_tts_{uuid.uuid4().hex[:8]}.wav"
    output_path = str(AUDIO_DIR / output_filename)

    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    return output_path


def get_user_voice_id(user_id: str) -> str | None:
    """Get the current voice clone ID for a user from Supabase."""
    return get_voice_metadata(user_id)


async def delete_user_voice(user_id: str) -> bool:
    """Delete all voice clone data for a user from Supabase."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: delete_voice_data(user_id))
