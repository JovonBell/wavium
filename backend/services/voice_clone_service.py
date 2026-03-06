"""
WAVIUM - Voice Cloning Service
Orchestrates voice cloning via Modal serverless GPU + Cloudflare R2 storage.

Architecture:
- Voice reference audio stored on R2 (persistent, shared across Railway instances)
- TTS synthesis runs on Modal (serverless T4 GPU, ~$0.003/call)
- Railway backend just orchestrates: convert audio → store on R2 → call Modal → return result

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

from services.r2_service import (
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
    url = os.getenv("MODAL_ENDPOINT_URL", "")
    if not url:
        raise RuntimeError(
            "MODAL_ENDPOINT_URL not set. Deploy the Modal function first: "
            "modal deploy backend/modal_tts/app.py"
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
    Clone a user's voice by converting and storing their reference audio on R2.

    No GPU work here — XTTS v2 uses the reference audio at inference time.
    We just store a clean WAV copy.

    Returns a voice_id string for future TTS calls.
    """
    voice_id = f"clone_{user_id}_{uuid.uuid4().hex[:8]}"

    # Convert uploaded audio to WAV format
    wav_path = str(TEMP_DIR / f"{voice_id}.wav")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _convert_to_wav(audio_path, wav_path))

    # Read the WAV and upload to R2
    with open(wav_path, "rb") as f:
        wav_bytes = f.read()

    await loop.run_in_executor(
        None, lambda: upload_voice_sample(user_id, voice_id, wav_bytes)
    )

    # Save metadata (which voice is current)
    await loop.run_in_executor(
        None, lambda: save_voice_metadata(user_id, voice_id)
    )

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

    1. Downloads reference audio from R2
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

    # Download reference audio from R2
    ref_audio = await loop.run_in_executor(
        None, lambda: download_voice_sample(user_id, voice_id)
    )

    # Call Modal serverless endpoint
    modal_url = _get_modal_endpoint()
    payload = {
        "text": text,
        "reference_audio_b64": base64.b64encode(ref_audio).decode(),
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(modal_url, json=payload)
        response.raise_for_status()
        result = response.json()

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

    # Download reference audio from R2
    ref_audio = await loop.run_in_executor(
        None, lambda: download_voice_sample(user_id, voice_id)
    )

    # Call Modal with lines array (triggers per-line synthesis + concat)
    modal_url = _get_modal_endpoint()
    payload = {
        "lines": lines,
        "reference_audio_b64": base64.b64encode(ref_audio).decode(),
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(modal_url, json=payload)
        response.raise_for_status()
        result = response.json()

    audio_bytes = base64.b64decode(result["audio_b64"])

    if output_filename is None:
        output_filename = f"clone_tts_{uuid.uuid4().hex[:8]}.wav"
    output_path = str(AUDIO_DIR / output_filename)

    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    return output_path


def get_user_voice_id(user_id: str) -> str | None:
    """Get the current voice clone ID for a user from R2."""
    return get_voice_metadata(user_id)


async def delete_user_voice(user_id: str) -> bool:
    """Delete all voice clone data for a user from R2."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: delete_voice_data(user_id))
