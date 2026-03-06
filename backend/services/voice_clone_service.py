"""
WAVIUM - Self-Hosted Voice Cloning Service
Uses Coqui XTTS v2 for free, open-source voice cloning.
Replaces ElevenLabs ($300/month) with self-hosted inference (~$20-40/month).

How it works:
1. User records 30-60s of their voice in the app
2. Audio sample is saved per-user as a reference clip
3. When generating subliminals, XTTS v2 synthesizes text in the user's voice
   using that reference clip for speaker conditioning
"""

import os
import uuid
import shutil
import asyncio
import subprocess
from pathlib import Path

# Directory for storing per-user voice clone reference audio
BASE_DIR = Path(__file__).parent.parent
VOICE_CLONES_DIR = BASE_DIR / "voice_clones"
VOICE_CLONES_DIR.mkdir(exist_ok=True)

AUDIO_DIR = BASE_DIR / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)

TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

# Lazy-loaded TTS model (heavy, only load when needed)
_tts_model = None


def _get_tts_model():
    """Lazy-load the XTTS v2 model. First call downloads ~1.8GB."""
    global _tts_model
    if _tts_model is None:
        from TTS.api import TTS
        _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=_has_gpu())
    return _tts_model


def _has_gpu() -> bool:
    """Check if CUDA GPU is available."""
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def _get_user_voice_dir(user_id: str) -> Path:
    """Get the directory for a user's voice clone data."""
    user_dir = VOICE_CLONES_DIR / user_id
    user_dir.mkdir(exist_ok=True)
    return user_dir


def _convert_to_wav(input_path: str, output_path: str) -> None:
    """Convert any audio format to WAV (required by XTTS v2)."""
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "22050",     # XTTS v2 expects 22050 Hz
            "-ac", "1",         # Mono
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
    Clone a user's voice by saving their reference audio sample.

    With XTTS v2, there's no separate "training" step — the model uses
    the reference audio directly during inference for speaker conditioning.
    We just need to store a clean WAV copy of their recording.

    Returns a voice_id string for future TTS calls.
    """
    voice_id = f"clone_{user_id}_{uuid.uuid4().hex[:8]}"
    user_dir = _get_user_voice_dir(user_id)

    # Convert uploaded audio to WAV format for XTTS v2
    wav_path = user_dir / f"{voice_id}.wav"

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None, lambda: _convert_to_wav(audio_path, str(wav_path))
    )

    # Save metadata
    meta_path = user_dir / "current_voice.txt"
    meta_path.write_text(voice_id)

    return voice_id


async def synthesize_cloned_voice(
    text: str,
    voice_id: str,
    user_id: str,
    output_filename: str | None = None,
) -> str:
    """
    Generate TTS audio using a user's cloned voice via XTTS v2.

    Args:
        text: The text to synthesize
        voice_id: The voice clone ID (from clone_voice)
        user_id: The user's ID (to locate their reference audio)
        output_filename: Optional custom filename for the output

    Returns:
        Path to the generated audio file (WAV)
    """
    user_dir = _get_user_voice_dir(user_id)
    ref_audio = user_dir / f"{voice_id}.wav"

    if not ref_audio.exists():
        raise FileNotFoundError(
            f"Voice clone reference audio not found for voice_id={voice_id}"
        )

    if output_filename is None:
        output_filename = f"clone_tts_{uuid.uuid4().hex[:8]}.wav"

    output_path = str(AUDIO_DIR / output_filename)

    # Run XTTS v2 inference in thread pool (it's CPU/GPU bound)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: _get_tts_model().tts_to_file(
            text=text,
            speaker_wav=str(ref_audio),
            language="en",
            file_path=output_path,
        ),
    )

    return output_path


def get_user_voice_id(user_id: str) -> str | None:
    """Get the current voice clone ID for a user, or None if they haven't cloned."""
    user_dir = VOICE_CLONES_DIR / user_id
    meta_path = user_dir / "current_voice.txt"
    if meta_path.exists():
        return meta_path.read_text().strip()
    return None


async def delete_user_voice(user_id: str) -> bool:
    """Delete all voice clone data for a user."""
    user_dir = VOICE_CLONES_DIR / user_id
    if user_dir.exists():
        shutil.rmtree(user_dir)
        return True
    return False
