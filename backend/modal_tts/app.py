"""
WAVIUM - Modal Serverless XTTS v2 Voice Synthesis
Runs on a T4 GPU serverless — only pay for compute seconds (~$0.003/call).

Deploy: modal deploy backend/modal_tts/app.py
Test:   modal serve backend/modal_tts/app.py  (local dev server)

After deployment, set MODAL_ENDPOINT_URL on Railway to the web endpoint URL.
"""

import modal
import io
import uuid
import tempfile
import subprocess

# Build container image with XTTS v2 model baked in
# This means cold starts only boot the container, not download 1.8GB
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "TTS>=0.22.0",
        "torch>=2.0.0,<2.6.0",
        "numpy<2",
        "transformers<4.40",
        "fastapi[standard]",
    )
    .env({"COQUI_TOS_AGREED": "1"})
    .run_commands(
        # Pre-download XTTS v2 model into the image so cold starts are fast
        "python -c \"from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2', gpu=False)\""
    )
)

app = modal.App("wavium-voice-clone", image=image)


@app.cls(
    gpu="T4",
    timeout=300,
    scaledown_window=60,  # Keep warm for 60s after last call (saves on cold starts)
    image=image,
)
@modal.concurrent(max_inputs=4)  # Handle up to 4 concurrent requests per container
class VoiceSynthesizer:
    """XTTS v2 voice synthesizer running on T4 GPU."""

    @modal.enter()
    def load_model(self):
        """Load model once when container starts — cached across requests."""
        from TTS.api import TTS
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

    def _synthesize_internal(self, text: str, reference_audio: bytes) -> bytes:
        """Internal synthesis — no Modal decorator so it's always a local call."""
        import os

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_file:
            ref_file.write(reference_audio)
            ref_path = ref_file.name

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_file:
            out_path = out_file.name

        try:
            self.tts.tts_to_file(
                text=text,
                speaker_wav=ref_path,
                language="en",
                file_path=out_path,
            )

            with open(out_path, "rb") as f:
                return f.read()
        finally:
            try:
                os.remove(ref_path)
            except OSError:
                pass
            try:
                os.remove(out_path)
            except OSError:
                pass

    def _synthesize_lines_internal(self, lines: list[str], reference_audio: bytes) -> bytes:
        """
        Synthesize multiple lines individually then concatenate.
        Much faster than one giant text block — each line is ~1-2 sec GPU.

        Args:
            lines: List of affirmation lines
            reference_audio: WAV bytes of the user's voice sample

        Returns:
            WAV bytes of all lines concatenated with natural pauses
        """
        import os

        # UUID-based run_id prevents temp file collisions under concurrent requests
        run_id = uuid.uuid4().hex[:8]

        # Write reference audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_file:
            ref_file.write(reference_audio)
            ref_path = ref_file.name

        wav_parts = []
        try:
            for i, line in enumerate(lines):
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_file:
                    out_path = out_file.name

                self.tts.tts_to_file(
                    text=line,
                    speaker_wav=ref_path,
                    language="en",
                    file_path=out_path,
                )
                wav_parts.append(out_path)

            # Concatenate all parts with 0.8s silence between each line
            # Generate a short silence file using UUID-based path
            silence_path = f"/tmp/silence_{run_id}.wav"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-f", "lavfi", "-i",
                    "anullsrc=r=22050:cl=mono", "-t", "0.8",
                    "-sample_fmt", "s16", silence_path,
                ],
                capture_output=True,
            )

            # Build ffmpeg concat list using UUID-based path
            concat_list = f"/tmp/concat_{run_id}.txt"
            with open(concat_list, "w") as f:
                for j, part in enumerate(wav_parts):
                    f.write(f"file '{part}'\n")
                    if j < len(wav_parts) - 1:
                        f.write(f"file '{silence_path}'\n")

            final_path = f"/tmp/output_{run_id}.wav"
            concat_result = subprocess.run(
                [
                    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                    "-i", concat_list, "-c", "copy", final_path,
                ],
                capture_output=True,
                text=True,
            )
            if concat_result.returncode != 0:
                raise RuntimeError(f"FFmpeg concat failed: {concat_result.stderr[-500:]}")

            with open(final_path, "rb") as f:
                result = f.read()

            if len(result) < 1000:
                raise RuntimeError(f"Concatenated audio too small ({len(result)} bytes)")

            print(f"[XTTS] Synthesized {len(lines)} lines → {len(result)} bytes")
            return result
        finally:
            # Clean up all temp files
            try:
                os.remove(ref_path)
            except OSError:
                pass
            for part in wav_parts:
                try:
                    os.remove(part)
                except OSError:
                    pass
            try:
                os.remove(silence_path)
            except (OSError, UnboundLocalError):
                pass
            try:
                os.remove(concat_list)
            except (OSError, UnboundLocalError):
                pass
            try:
                os.remove(final_path)
            except (OSError, UnboundLocalError):
                pass

    @modal.fastapi_endpoint(method="POST")
    def web_endpoint(self, request: dict):
        """
        HTTP endpoint for voice synthesis — runs inside the same container
        as the loaded model, so self.tts is already available.

        POST body:
        {
            "text": "I am confident and strong.",         // single text block
            "lines": ["I am confident.", "I am strong."], // OR list of lines
            "reference_audio_b64": "<base64 WAV bytes>"
        }

        Returns: {"audio_b64": "<base64 WAV bytes>"}
        """
        import base64
        from fastapi.responses import JSONResponse

        if "reference_audio_b64" not in request:
            return JSONResponse(
                status_code=400,
                content={"error": "reference_audio_b64 is required"},
            )

        if "text" not in request and "lines" not in request:
            return JSONResponse(
                status_code=400,
                content={"error": "Either 'text' or 'lines' must be provided"},
            )

        try:
            ref_audio = base64.b64decode(request["reference_audio_b64"])

            if "lines" in request and request["lines"]:
                # Call internal methods directly (no @modal.method decorator to interfere)
                audio_bytes = self._synthesize_lines_internal(request["lines"], ref_audio)
            else:
                audio_bytes = self._synthesize_internal(request["text"], ref_audio)

            return {"audio_b64": base64.b64encode(audio_bytes).decode()}
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": f"Synthesis failed: {str(e)}"},
            )
