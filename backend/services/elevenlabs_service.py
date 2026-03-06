"""
WAVIUM - ElevenLabs Voice Cloning Service
Handles voice cloning and TTS generation via ElevenLabs API
"""

import os
import tempfile
from pathlib import Path
from elevenlabs.client import ElevenLabs

AUDIO_DIR = Path(__file__).parent.parent / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)


def _get_client() -> ElevenLabs:
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    return ElevenLabs(api_key=api_key)


async def clone_voice(name: str, audio_path: str) -> str:
    """
    Clone a voice from an audio sample using Instant Voice Cloning.
    Returns the ElevenLabs voice ID.
    """
    client = _get_client()
    with open(audio_path, "rb") as f:
        voice = client.voices.ivc.create(
            name=name,
            files=[f],
            description=f"Wavium user voice clone: {name}",
        )
    return voice.voice_id


async def generate_tts_elevenlabs(
    text: str,
    voice_id: str,
    output_filename: str | None = None,
) -> str:
    """
    Generate TTS audio using an ElevenLabs voice (cloned or preset).
    Returns the path to the output audio file.
    """
    client = _get_client()

    audio_generator = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )

    if output_filename is None:
        output_filename = f"el_tts_{os.urandom(8).hex()}.mp3"

    output_path = AUDIO_DIR / output_filename
    with open(output_path, "wb") as f:
        for chunk in audio_generator:
            f.write(chunk)

    return str(output_path)
