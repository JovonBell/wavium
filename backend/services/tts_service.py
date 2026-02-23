"""
Text-to-Speech & Subliminal Audio Mixing Service
Uses edge-tts for TTS and FFmpeg for subliminal audio layering
"""

import os
import uuid
import asyncio
import subprocess
import edge_tts

# Available voices
VOICES = {
    "jenny": "en-US-JennyNeural",
    "guy": "en-US-GuyNeural",
    "aria": "en-US-AriaNeural",
    "sonia": "en-GB-SoniaNeural",
}

# Background ambient tracks are stored locally in the ambient/ directory
# Generated with FFmpeg: ocean-waves (pink noise), rainfall (white noise filtered),
# deep-focus (binaural beats 200/210Hz), cosmic-drift (low drone)

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "audio_output")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
AMBIENT_DIR = os.path.join(BASE_DIR, "ambient")

for d in [OUTPUT_DIR, TEMP_DIR, AMBIENT_DIR]:
    os.makedirs(d, exist_ok=True)


def _get_ambient_track(track: str) -> str:
    """Get path to a local ambient background track."""
    track_path = os.path.join(AMBIENT_DIR, f"{track}.mp3")
    if os.path.exists(track_path):
        return track_path
    # Fallback to ocean-waves if requested track doesn't exist
    fallback = os.path.join(AMBIENT_DIR, "ocean-waves.mp3")
    if os.path.exists(fallback):
        return fallback
    raise FileNotFoundError(f"Ambient track not found: {track}")


def _run_ffmpeg(args: list[str]) -> None:
    """Run an FFmpeg command, raising on failure"""
    result = subprocess.run(
        ["ffmpeg", "-y", *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-500:]}")


async def generate_audio(
    affirmations: list[str],
    voice: str = "jenny",
) -> str:
    """Generate basic TTS audio from affirmations (no mixing)"""
    voice_id = VOICES.get(voice.lower(), VOICES["jenny"])
    full_text = "... ".join(affirmations) + "..."

    filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    output_path = os.path.join(OUTPUT_DIR, filename)

    communicate = edge_tts.Communicate(full_text, voice_id)
    await communicate.save(output_path)
    return output_path


async def generate_subliminal(
    affirmations: list[str],
    voice: str = "jenny",
    track: str = "ocean-waves",
    voice_volume: float = 0.12,
    bg_volume: float = 0.85,
    duration_secs: int = 300,
) -> str:
    """
    Generate a complete subliminal audio file:
    1. Generate whisper-like TTS from affirmations using edge-tts
    2. Download/cache the ambient background track
    3. Mix voice (low volume, looped) under background using FFmpeg

    Returns path to the final mixed MP3.
    """
    voice_id = VOICES.get(voice.lower(), VOICES["jenny"])
    run_id = uuid.uuid4().hex[:8]

    # --- Step 1: Generate whisper TTS ---
    # Join affirmations with long pauses for a breathing, natural feel
    full_text = " ..... ".join(affirmations) + " ....."
    voice_path = os.path.join(TEMP_DIR, f"voice_{run_id}.mp3")

    communicate = edge_tts.Communicate(
        full_text,
        voice_id,
        rate="+8%",
        pitch="-3Hz",
    )
    await communicate.save(voice_path)

    # --- Step 2: Get ambient background track ---
    ambient_path = _get_ambient_track(track)

    # --- Step 3: Mix with FFmpeg ---
    output_filename = f"subliminal_{run_id}.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # voice loops infinitely under background; output trimmed to duration_secs
    # background also loops to fill the duration
    filter_complex = (
        f"[0:a]volume={bg_volume},aloop=-1:size=2e+09[bg];"
        f"[1:a]volume={voice_volume},aloop=-1:size=2e+09[voice];"
        f"[bg][voice]amix=inputs=2:duration=first:normalize=0[out]"
    )

    ffmpeg_args = [
        "-i", ambient_path,
        "-i", voice_path,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-t", str(duration_secs),
        "-c:a", "libmp3lame", "-q:a", "2",
        output_path,
    ]

    # Run FFmpeg in thread pool
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: _run_ffmpeg(ffmpeg_args))

    # Cleanup temp voice file
    try:
        os.remove(voice_path)
    except OSError:
        pass

    return output_path


async def get_available_voices() -> list[dict]:
    """Get list of available voices"""
    return [
        {"id": "jenny", "name": "Jenny", "description": "Warm, female (US)"},
        {"id": "guy", "name": "Guy", "description": "Calm, male (US)"},
        {"id": "aria", "name": "Aria", "description": "Soft, female (US)"},
        {"id": "sonia", "name": "Sonia", "description": "Warm, female (UK)"},
    ]
