"""
WAVIUM Audio Pipeline
Intention → Affirmations → TTS → Mix → Upload
"""

import asyncio
import json
import uuid
import subprocess
from pathlib import Path
from typing import List, Optional
from fastapi import WebSocket
import logging

from groq import Groq
import edge_tts
import aioboto3

from app.core.config import settings

logger = logging.getLogger(__name__)


class AudioPipeline:
    """Complete audio generation pipeline"""

    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.temp_dir = Path(settings.AUDIO_TEMP_DIR)
        self.temp_dir.mkdir(exist_ok=True)

    async def generate_subliminal(
        self,
        user_intention: str,
        voice: str,
        background: str,
        duration_minutes: int,
        technique: str = "classic",
        websocket: Optional[WebSocket] = None,
    ) -> dict:
        """
        Complete pipeline: Intention → Affirmations → TTS → Mix → Upload
        Returns: Dict with audio_url, affirmations, and metadata
        """
        session_id = str(uuid.uuid4())

        try:
            # Stage 1: Generate affirmations from intention
            await self._send_progress(websocket, "Processing your intention...", 10)
            affirmations, title, category = await self._generate_affirmations(user_intention)

            # Stage 2: Generate TTS audio for each affirmation
            await self._send_progress(websocket, "Creating voice audio...", 30)
            voice_files = await self._generate_tts(affirmations, voice, session_id)

            # Stage 3: Prepare subliminal voice track
            await self._send_progress(websocket, "Preparing subliminal layer...", 50)
            subliminal_track = await self._create_subliminal_track(
                voice_files,
                duration_minutes,
                technique,
                session_id
            )

            # Stage 4: Mix with background
            await self._send_progress(websocket, "Mixing final audio...", 70)
            final_audio = await self._mix_with_background(
                subliminal_track,
                background,
                duration_minutes,
                session_id
            )

            # Stage 5: Upload to R2
            await self._send_progress(websocket, "Uploading...", 90)
            audio_url = await self._upload_to_r2(final_audio, session_id)

            # Cleanup temp files
            await self._cleanup(session_id)

            await self._send_progress(websocket, "Complete!", 100)

            return {
                "audio_url": audio_url,
                "affirmations": affirmations,
                "title": title,
                "category": category,
                "duration_seconds": duration_minutes * 60,
                "voice": voice,
                "background": background,
                "technique": technique,
            }

        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            await self._cleanup(session_id)
            raise e

    async def _generate_affirmations(self, intention: str) -> tuple[List[str], str, str]:
        """Use Groq LLM to generate personalized affirmations"""

        system_prompt = """You are an expert affirmation writer specializing in subliminal audio content.
Generate powerful, positive, first-person affirmations based on the user's intention.

Guidelines:
- Use present tense ("I am", "I have", "I attract")
- Be specific and personal
- Avoid negative words (no "not", "don't", "can't", etc.)
- Create 10-15 affirmations
- Each should be 5-15 words
- Make them emotionally resonant and believable

Also determine the best category for these affirmations from:
confidence, wealth, love, focus, sleep, health, creativity, spirituality, career, social

Return as JSON with this exact format:
{
    "affirmations": ["affirmation 1", "affirmation 2", ...],
    "title": "A short descriptive title (3-5 words)",
    "category": "the_category"
}"""

        response = self.groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create affirmations for: {intention}"}
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return (
            result.get("affirmations", []),
            result.get("title", "My Subliminal"),
            result.get("category", "custom")
        )

    async def _generate_tts(
        self,
        affirmations: List[str],
        voice: str,
        session_id: str
    ) -> List[Path]:
        """Generate TTS audio for each affirmation using edge-tts"""

        # Voice mapping (edge-tts voice names)
        voice_map = {
            "jenny": "en-US-JennyNeural",
            "guy": "en-US-GuyNeural",
            "aria": "en-US-AriaNeural",
            "davis": "en-US-DavisNeural",
            "sara": "en-US-SaraNeural",
            "tony": "en-US-TonyNeural",
            "nancy": "en-US-NancyNeural",
            "jason": "en-US-JasonNeural",
        }

        voice_name = voice_map.get(voice.lower(), "en-US-JennyNeural")
        output_files = []

        for i, affirmation in enumerate(affirmations):
            output_path = self.temp_dir / f"{session_id}_voice_{i}.mp3"

            communicate = edge_tts.Communicate(
                affirmation,
                voice_name,
                rate="-10%",  # Slightly slower for subliminal
            )
            await communicate.save(str(output_path))
            output_files.append(output_path)

        return output_files

    async def _create_subliminal_track(
        self,
        voice_files: List[Path],
        duration_minutes: int,
        technique: str,
        session_id: str
    ) -> Path:
        """
        Create the subliminal voice track based on technique:
        - classic: Low volume under background
        - speeded: 1.5x speed, low volume
        - silent: Ultrasonic (experimental)
        """

        output_path = self.temp_dir / f"{session_id}_subliminal.mp3"

        # Create concat file
        concat_list = self.temp_dir / f"{session_id}_concat.txt"
        with open(concat_list, "w") as f:
            for vf in voice_files:
                # Repeat each affirmation 3 times with pause
                for _ in range(3):
                    f.write(f"file '{vf}'\n")

        concat_output = self.temp_dir / f"{session_id}_concat.mp3"

        # Concatenate all voice files
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list),
            "-c", "copy",
            str(concat_output)
        ], check=True, capture_output=True)

        # Get duration and calculate loops
        probe = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(concat_output)
        ], capture_output=True, text=True)
        concat_duration = float(probe.stdout.strip())
        target_duration = duration_minutes * 60
        loops = int(target_duration / concat_duration) + 1

        # Apply technique-specific processing
        if technique == "speeded":
            audio_filter = "atempo=1.5,volume=0.12"
        elif technique == "silent":
            # Ultrasonic shift (experimental - may not work on all devices)
            audio_filter = "asetrate=44100*1.5,aresample=44100,volume=0.08"
        else:  # classic
            audio_filter = "volume=0.15"

        # Loop and process
        subprocess.run([
            "ffmpeg", "-y",
            "-stream_loop", str(loops),
            "-i", str(concat_output),
            "-t", str(target_duration),
            "-af", audio_filter,
            "-ar", "44100",
            str(output_path)
        ], check=True, capture_output=True)

        return output_path

    async def _mix_with_background(
        self,
        subliminal_track: Path,
        background: str,
        duration_minutes: int,
        session_id: str
    ) -> Path:
        """Mix subliminal track with background ambient audio"""

        # Background file path (should exist in assets)
        background_file = Path(f"assets/backgrounds/{background}.mp3")

        # If background doesn't exist, use silence
        if not background_file.exists():
            logger.warning(f"Background {background} not found, using subliminal only")
            return subliminal_track

        output_path = self.temp_dir / f"{session_id}_final.mp3"
        target_duration = duration_minutes * 60

        # Mix subliminal with background
        subprocess.run([
            "ffmpeg", "-y",
            "-stream_loop", "-1",  # Loop background
            "-i", str(background_file),
            "-i", str(subliminal_track),
            "-t", str(target_duration),
            "-filter_complex",
            "[0:a]volume=0.8[bg];[1:a]volume=1.0[sub];[bg][sub]amix=inputs=2:duration=first[out]",
            "-map", "[out]",
            "-ar", "44100",
            "-b:a", "192k",
            str(output_path)
        ], check=True, capture_output=True)

        return output_path

    async def _upload_to_r2(self, audio_file: Path, session_id: str) -> str:
        """Upload final audio to Cloudflare R2"""

        key = f"subliminals/{session_id}.mp3"

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
        ) as s3:
            with open(audio_file, "rb") as f:
                await s3.upload_fileobj(
                    f,
                    settings.R2_BUCKET,
                    key,
                    ExtraArgs={"ContentType": "audio/mpeg"}
                )

        return f"{settings.R2_PUBLIC_URL}/{key}"

    async def _send_progress(
        self,
        websocket: Optional[WebSocket],
        message: str,
        percent: int
    ):
        """Send progress update via WebSocket"""
        if websocket:
            try:
                await websocket.send_json({
                    "type": "progress",
                    "message": message,
                    "percent": percent
                })
            except Exception as e:
                logger.warning(f"Failed to send progress: {e}")

    async def _cleanup(self, session_id: str):
        """Remove temporary files"""
        for f in self.temp_dir.glob(f"{session_id}_*"):
            try:
                f.unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed to cleanup {f}: {e}")
