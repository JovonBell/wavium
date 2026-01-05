"""
Text-to-Speech Service using edge-tts (FREE Microsoft TTS)
"""

import os
import uuid
import edge_tts

# Available voices
VOICES = {
    "jenny": "en-US-JennyNeural",      # Warm, female (default)
    "guy": "en-US-GuyNeural",          # Calm, male
    "aria": "en-US-AriaNeural",        # Soft, female
    "sonia": "en-GB-SoniaNeural",      # UK, female
}

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


async def generate_audio(
    affirmations: list[str],
    voice: str = "jenny",
    pause_between: float = 2.0
) -> str:
    """
    Generate audio from affirmations using edge-tts

    Args:
        affirmations: List of affirmation strings
        voice: Voice key (jenny, guy, aria, sonia)
        pause_between: Seconds of pause between affirmations

    Returns:
        Path to the generated audio file
    """
    # Get the voice ID
    voice_id = VOICES.get(voice.lower(), VOICES["jenny"])

    # Combine affirmations with pauses (using SSML-like breaks)
    # edge-tts doesn't support SSML, so we'll add periods for natural pauses
    full_text = "... ".join(affirmations) + "..."

    # Generate unique filename
    filename = f"subliminal_{uuid.uuid4().hex[:8]}.mp3"
    output_path = os.path.join(OUTPUT_DIR, filename)

    # Generate the audio
    communicate = edge_tts.Communicate(full_text, voice_id)
    await communicate.save(output_path)

    return output_path


async def get_available_voices() -> list[dict]:
    """
    Get list of available voices
    """
    return [
        {"id": "jenny", "name": "Jenny", "description": "Warm, female (US)", "voice_id": VOICES["jenny"]},
        {"id": "guy", "name": "Guy", "description": "Calm, male (US)", "voice_id": VOICES["guy"]},
        {"id": "aria", "name": "Aria", "description": "Soft, female (US)", "voice_id": VOICES["aria"]},
        {"id": "sonia", "name": "Sonia", "description": "Warm, female (UK)", "voice_id": VOICES["sonia"]},
    ]
