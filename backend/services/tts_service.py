"""
Text-to-Speech & Subliminal Audio Mixing Service
Uses edge-tts for TTS and FFmpeg for subliminal audio layering
"""

import os
import uuid
import asyncio
import subprocess
import random
import edge_tts

# Available voices
VOICES = {
    "ava": "en-US-AvaNeural",       # Warm, smooth female (US) -- newest, most natural
    "emma": "en-US-EmmaNeural",     # Gentle, soothing female (US)
    "andrew": "en-US-AndrewNeural", # Calm, deep male (US)
    "sonia": "en-GB-SoniaNeural",   # Warm, elegant female (UK)
    "brian": "en-US-BrianNeural",   # Steady, reassuring male (US)
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
    voice: str = "ava",
) -> str:
    """Generate basic TTS audio from affirmations (no mixing)"""
    voice_id = VOICES.get(voice.lower(), VOICES["ava"])
    full_text = "... ".join(affirmations) + "..."

    filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    output_path = os.path.join(OUTPUT_DIR, filename)

    communicate = edge_tts.Communicate(full_text, voice_id)
    await communicate.save(output_path)
    return output_path


async def generate_subliminal(
    affirmations: list[str],
    voice: str = "ava",
    track: str = "ocean-waves",
    voice_volume: float = 0.12,
    bg_volume: float = 0.85,
    duration_secs: int = 300,
    clone_voice_id: str | None = None,
    user_id: str | None = None,
) -> str:
    """
    Generate a complete subliminal audio file:
    1. Generate whisper-like TTS from affirmations (edge-tts or cloned voice)
    2. Get the ambient background track
    3. Mix voice (low volume, looped) under background using FFmpeg

    If clone_voice_id and user_id are provided, uses the user's cloned voice
    via XTTS v2 instead of edge-tts preset voices.

    Returns path to the final mixed MP3.
    """
    run_id = uuid.uuid4().hex[:8]

    # --- Step 1: Generate whisper TTS ---
    # Shuffle and repeat affirmations to reach ~30 items for variety
    working_affirmations = list(affirmations)
    if len(working_affirmations) < 25:
        extra = list(affirmations)
        random.shuffle(extra)
        working_affirmations = working_affirmations + extra
        working_affirmations = working_affirmations[:30]
    random.shuffle(working_affirmations)

    voice_path = os.path.join(TEMP_DIR, f"voice_{run_id}.mp3")

    if clone_voice_id and user_id:
        # Use cloned voice via XTTS v2
        from services.voice_clone_service import synthesize_cloned_voice

        # Join affirmations with pauses (XTTS handles pacing naturally)
        full_text = ". ".join(working_affirmations) + "."
        clone_wav = os.path.join(TEMP_DIR, f"voice_{run_id}.wav")
        await synthesize_cloned_voice(
            text=full_text,
            voice_id=clone_voice_id,
            user_id=user_id,
            output_filename=f"voice_{run_id}.wav",
        )
        # Convert WAV to MP3 for FFmpeg mixing pipeline
        _run_ffmpeg(["-i", os.path.join(OUTPUT_DIR, f"voice_{run_id}.wav"), "-q:a", "2", voice_path])
        # Clean up intermediate WAV
        try:
            os.remove(os.path.join(OUTPUT_DIR, f"voice_{run_id}.wav"))
        except OSError:
            pass
    else:
        # Use edge-tts preset voice
        voice_id = VOICES.get(voice.lower(), VOICES["ava"])
        full_text = " ..... ".join(working_affirmations) + " ....."
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
    fade_out_start = max(0, duration_secs - 2)
    filter_complex = (
        f"[0:a]volume={bg_volume},aloop=-1:size=2e+09[bg];"
        f"[1:a]volume={voice_volume},aloop=-1:size=2e+09,afade=t=in:st=0:d=2[voice];"
        f"[bg][voice]amix=inputs=2:duration=first:normalize=0,"
        f"afade=t=in:st=0:d=2,afade=t=out:st={fade_out_start}:d=2[out]"
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


PREVIEW_DIR = os.path.join(BASE_DIR, "audio_output", "previews")
os.makedirs(PREVIEW_DIR, exist_ok=True)

PREVIEW_PHRASES = {
    "ava": "You are worthy of all the good things coming your way.",
    "emma": "Every day you grow stronger, brighter, and more resilient.",
    "andrew": "Trust the journey. You are exactly where you need to be.",
    "sonia": "Breathe deeply. You are calm, centred, and at peace.",
    "brian": "You have the power to create the life you desire.",
}


async def generate_voice_preview(voice: str = "ava") -> str:
    """Generate (or return cached) a short voice preview clip."""
    voice_key = voice.lower()
    voice_id = VOICES.get(voice_key, VOICES["ava"])
    preview_path = os.path.join(PREVIEW_DIR, f"preview_{voice_key}.mp3")

    # Return cached preview if it exists
    if os.path.exists(preview_path):
        return preview_path

    phrase = PREVIEW_PHRASES.get(voice_key, PREVIEW_PHRASES["ava"])
    communicate = edge_tts.Communicate(phrase, voice_id)
    await communicate.save(preview_path)
    return preview_path


async def get_available_voices() -> list[dict]:
    """Get list of available voices"""
    return [
        {"id": "ava", "name": "Ava", "gender": "female", "description": "Warm & smooth (US)"},
        {"id": "emma", "name": "Emma", "gender": "female", "description": "Gentle & soothing (US)"},
        {"id": "andrew", "name": "Andrew", "gender": "male", "description": "Calm & deep (US)"},
        {"id": "sonia", "name": "Sonia", "gender": "female", "description": "Warm & elegant (UK)"},
        {"id": "brian", "name": "Brian", "gender": "male", "description": "Steady & reassuring (US)"},
    ]
