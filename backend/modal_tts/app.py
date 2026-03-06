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
    """XTTS v2 voice synthesizer running on T4 GPU with tuned voice cloning parameters."""

    @modal.enter()
    def load_model(self):
        """Load model once when container starts — cached across requests."""
        from TTS.api import TTS
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
        # Direct access to XTTS v2 model for lower-level API with full parameter control
        self.model = self.tts.synthesizer.tts_model

    def _preprocess_reference(self, input_path: str, output_path: str):
        """
        Preprocess reference audio for maximum voice cloning quality:
        1. High-pass filter to remove low-frequency rumble (AC, traffic, etc.)
        2. FFT-based noise reduction to clean background noise
        3. EBU R128 loudness normalization for consistent signal level
        4. Resample to 22050 Hz mono 16-bit (XTTS v2 requirement)
        """
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-af", ",".join([
                    "highpass=f=80",           # Remove sub-80Hz rumble
                    "afftdn=nf=-20",           # Moderate FFT noise reduction
                    "loudnorm=I=-16:TP=-1.5:LRA=11",  # EBU R128 normalization
                ]),
                "-ar", "22050", "-ac", "1", "-sample_fmt", "s16",
                output_path,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[XTTS] Preprocessing warning, falling back to simple conversion: {result.stderr[-300:]}")
            # Fallback: simple conversion without preprocessing filters
            subprocess.run(
                ["ffmpeg", "-y", "-i", input_path,
                 "-ar", "22050", "-ac", "1", "-sample_fmt", "s16", output_path],
                capture_output=True,
            )

    def _extract_conditioning(self, ref_path: str):
        """
        Extract voice conditioning latents from preprocessed reference audio.
        Computed ONCE and reused for all synthesis calls — ensures consistent
        voice across all lines and avoids redundant computation.

        Key parameters:
        - gpt_cond_len=30: Use 30s of reference for GPT conditioning (default is 6!)
        - gpt_cond_chunk_len=4: Process in 4s chunks for better averaging
        - max_ref_length=60: Use up to 60s for decoder conditioning
        """
        gpt_cond_latent, speaker_embedding = self.model.get_conditioning_latents(
            audio_path=[ref_path],
            gpt_cond_len=30,
            gpt_cond_chunk_len=4,
            max_ref_length=60,
        )
        return gpt_cond_latent, speaker_embedding

    def _synthesize_single(self, text: str, gpt_cond_latent, speaker_embedding) -> "numpy.ndarray":
        """
        Synthesize a single text string with tuned parameters for maximum voice fidelity.

        Parameters tuned for voice cloning accuracy:
        - temperature=0.3:  Low randomness → stays faithful to reference voice
        - top_k=20:         Narrow token selection → less variation
        - top_p=0.5:        Tight nucleus sampling → focused output
        - repetition_penalty=5.0: Reduce repetitive artifacts
        - speed=1.0:        Natural speaking pace

        Returns: 1D numpy array of audio samples at 24000 Hz
        """
        out = self.model.inference(
            text,
            "en",
            gpt_cond_latent,
            speaker_embedding,
            temperature=0.3,
            top_k=20,
            top_p=0.5,
            repetition_penalty=5.0,
            speed=1.0,
        )
        return out["wav"]

    def _save_wav(self, wav_data, out_path: str):
        """Save numpy audio array as 24kHz 16-bit mono WAV."""
        import wave
        import numpy as np

        pcm = (wav_data * 32767).astype(np.int16)
        with wave.open(out_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(24000)
            wf.writeframes(pcm.tobytes())

    def _synthesize_internal(self, text: str, reference_audio: bytes) -> bytes:
        """Synthesize single text block with full voice cloning pipeline."""
        import os

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_raw:
            ref_raw.write(reference_audio)
            ref_raw_path = ref_raw.name

        ref_path = ref_raw_path + "_processed.wav"
        out_path = f"/tmp/single_{uuid.uuid4().hex[:8]}.wav"

        try:
            self._preprocess_reference(ref_raw_path, ref_path)
            gpt_cond_latent, speaker_embedding = self._extract_conditioning(ref_path)
            wav = self._synthesize_single(text, gpt_cond_latent, speaker_embedding)
            self._save_wav(wav, out_path)

            with open(out_path, "rb") as f:
                return f.read()
        finally:
            for p in [ref_raw_path, ref_path, out_path]:
                try:
                    os.remove(p)
                except OSError:
                    pass

    def _synthesize_lines_internal(self, lines: list[str], reference_audio: bytes) -> bytes:
        """
        Synthesize multiple lines with voice conditioning computed ONCE.
        Each line is synthesized individually with the same voice fingerprint,
        then concatenated with natural pauses.
        """
        import os

        run_id = uuid.uuid4().hex[:8]

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_raw:
            ref_raw.write(reference_audio)
            ref_raw_path = ref_raw.name

        ref_path = ref_raw_path + "_processed.wav"
        wav_parts = []

        try:
            # Step 1: Preprocess reference audio (noise reduction + normalization)
            print(f"[XTTS] Preprocessing reference audio...")
            self._preprocess_reference(ref_raw_path, ref_path)

            # Step 2: Extract voice conditioning ONCE — reuse for ALL lines
            print(f"[XTTS] Extracting voice conditioning (gpt_cond_len=30, max_ref=60s)...")
            gpt_cond_latent, speaker_embedding = self._extract_conditioning(ref_path)
            print(f"[XTTS] Voice conditioning extracted. Synthesizing {len(lines)} lines...")

            # Step 3: Synthesize each line with consistent voice
            for i, line in enumerate(lines):
                out_path = f"/tmp/line_{run_id}_{i}.wav"
                wav = self._synthesize_single(line, gpt_cond_latent, speaker_embedding)
                self._save_wav(wav, out_path)
                wav_parts.append(out_path)

            # Step 4: Concatenate all parts with 0.8s silence between lines
            # Silence at 24000 Hz to match XTTS v2 output sample rate
            silence_path = f"/tmp/silence_{run_id}.wav"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-f", "lavfi", "-i",
                    "anullsrc=r=24000:cl=mono", "-t", "0.8",
                    "-sample_fmt", "s16", silence_path,
                ],
                capture_output=True,
            )

            # Build ffmpeg concat list
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
            for p in [ref_raw_path, ref_path]:
                try:
                    os.remove(p)
                except OSError:
                    pass
            for part in wav_parts:
                try:
                    os.remove(part)
                except OSError:
                    pass
            for name in [f"silence_{run_id}.wav", f"concat_{run_id}.txt", f"output_{run_id}.wav"]:
                try:
                    os.remove(f"/tmp/{name}")
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
