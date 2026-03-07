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
import logging
import httpx
from pathlib import Path

from services.supabase_storage_service import (
    upload_voice_sample,
    download_voice_sample,
    save_voice_metadata,
    get_voice_metadata,
    delete_voice_data,
    delete_specific_voice_file,
)

_logger = logging.getLogger("wavium.voice_clone")

AUDIO_DIR = Path(__file__).parent.parent / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)

TEMP_DIR = Path(tempfile.gettempdir()) / "wavium"
TEMP_DIR.mkdir(exist_ok=True)

MAX_REF_AUDIO_BYTES = 20 * 1024 * 1024  # 20MB


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
    # Fix #12: Clean up old voice data before creating new voice_id (idempotent uploads)
    try:
        existing_voice_id = await get_voice_metadata(user_id)
        if existing_voice_id:
            _logger.info(f"[VoiceClone] Cleaning up existing voice {existing_voice_id} for user {user_id}")
            await delete_voice_data(user_id)
    except Exception as e:
        _logger.warning(f"[VoiceClone] Could not clean up old voice data: {e}")

    voice_id = f"clone_{user_id}_{uuid.uuid4().hex[:8]}"

    # Convert uploaded audio to WAV format
    wav_path = str(TEMP_DIR / f"{voice_id}.wav")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _convert_to_wav(audio_path, wav_path))

    # Read the WAV and upload to Supabase Storage
    with open(wav_path, "rb") as f:
        wav_bytes = f.read()

    await upload_voice_sample(user_id, voice_id, wav_bytes)

    # Save metadata — rollback storage upload if this fails
    try:
        await save_voice_metadata(user_id, voice_id, name)
    except Exception as e:
        # Fix #9: Targeted rollback — only delete the specific failed file, not ALL user data
        _logger.warning(
            f"Postgres metadata save failed for voice {voice_id}, rolling back Storage upload: {e}"
        )
        try:
            await delete_specific_voice_file(user_id, voice_id)
        except Exception as rollback_err:
            _logger.error(f"Storage rollback also failed: {rollback_err}")
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
    """
    # Download reference audio from Supabase
    ref_audio = await download_voice_sample(user_id, voice_id)

    # Fix #10: Validate ref audio size before base64-encoding for Modal
    if len(ref_audio) > MAX_REF_AUDIO_BYTES:
        raise RuntimeError(
            f"Reference audio too large ({len(ref_audio)} bytes, max {MAX_REF_AUDIO_BYTES})"
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
            # Fix #11: Validate Modal JSON response
            try:
                result = response.json()
            except Exception as e:
                raise RuntimeError(f"Modal returned invalid JSON: {e}")
            if "audio_b64" not in result:
                raise RuntimeError(
                    f"Modal response missing 'audio_b64' key. Keys: {list(result.keys())}"
                )
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

    Returns path to the generated audio file (MP3).
    """
    # Download reference audio from Supabase
    ref_audio = await download_voice_sample(user_id, voice_id)

    # Fix #10: Validate ref audio size before base64-encoding for Modal
    if len(ref_audio) > MAX_REF_AUDIO_BYTES:
        raise RuntimeError(
            f"Reference audio too large ({len(ref_audio)} bytes, max {MAX_REF_AUDIO_BYTES})"
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
            # Fix #11: Validate Modal JSON response
            try:
                result = response.json()
            except Exception as e:
                raise RuntimeError(f"Modal returned invalid JSON: {e}")
            if "audio_b64" not in result:
                raise RuntimeError(
                    f"Modal response missing 'audio_b64' key. Keys: {list(result.keys())}"
                )
    except httpx.ConnectError as e:
        raise RuntimeError(
            f"Cannot reach Modal endpoint '{modal_url}': {e}. "
            "Check MODAL_ENDPOINT_URL env var on Railway and ensure the Modal app is deployed."
        ) from e

    audio_bytes = base64.b64decode(result["audio_b64"])

    if len(audio_bytes) < 1000:
        raise RuntimeError(
            f"Modal returned suspiciously small audio ({len(audio_bytes)} bytes) — "
            "synthesis may have failed silently"
        )

    # Save WAV temporarily, then convert to MP3 for iOS AVPlayer compatibility
    # (iOS AVFoundation error -11850 when streaming raw WAV from StaticFiles)
    run_id = uuid.uuid4().hex[:8]
    wav_path = str(AUDIO_DIR / f"clone_tts_{run_id}.wav")
    with open(wav_path, "wb") as f:
        f.write(audio_bytes)

    if output_filename is None:
        output_filename = f"clone_tts_{run_id}.mp3"
    mp3_path = str(AUDIO_DIR / output_filename)

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-q:a", "2", mp3_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"WAV→MP3 conversion failed: {result.stderr[-500:]}")

    # Clean up intermediate WAV
    try:
        os.remove(wav_path)
    except OSError:
        pass

    mp3_size = os.path.getsize(mp3_path)
    _logger.info(f"[VoiceClone] Saved synthesized audio: {mp3_path} ({mp3_size} bytes, converted from {len(audio_bytes)} WAV bytes)")

    return mp3_path


async def get_user_voice_id(user_id: str) -> str | None:
    """Get the current voice clone ID for a user from Supabase."""
    return await get_voice_metadata(user_id)


async def delete_user_voice(user_id: str) -> bool:
    """Delete all voice clone data for a user from Supabase."""
    return await delete_voice_data(user_id)
