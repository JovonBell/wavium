"""
WAVIUM - Modal Serverless XTTS v2 Voice Synthesis
Runs on a T4 GPU serverless — only pay for compute seconds (~$0.003/call).

Deploy: modal deploy backend/modal_tts/app.py
Test:   modal serve backend/modal_tts/app.py  (local dev server)

After deployment, set MODAL_ENDPOINT_URL on Railway to the web endpoint URL.
"""

import modal
import io
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
)
@modal.concurrent(max_inputs=4)  # Handle up to 4 concurrent requests per container
class VoiceSynthesizer:
    """XTTS v2 voice synthesizer running on T4 GPU."""

    @modal.enter()
    def load_model(self):
        """Load model once when container starts — cached across requests."""
        from TTS.api import TTS
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

    @modal.method()
    def synthesize(self, text: str, reference_audio: bytes) -> bytes:
        """
        Synthesize text in a cloned voice.

        Args:
            text: The text to speak
            reference_audio: WAV bytes of the user's voice sample

        Returns:
            WAV bytes of the synthesized speech
        """
        # Write reference audio to temp file (XTTS needs a file path)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_file:
            ref_file.write(reference_audio)
            ref_path = ref_file.name

        # Write output to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_file:
            out_path = out_file.name

        self.tts.tts_to_file(
            text=text,
            speaker_wav=ref_path,
            language="en",
            file_path=out_path,
        )

        with open(out_path, "rb") as f:
            return f.read()

    @modal.method()
    def synthesize_lines(self, lines: list[str], reference_audio: bytes) -> bytes:
        """
        Synthesize multiple lines individually then concatenate.
        Much faster than one giant text block — each line is ~1-2 sec GPU.

        Args:
            lines: List of affirmation lines
            reference_audio: WAV bytes of the user's voice sample

        Returns:
            WAV bytes of all lines concatenated with natural pauses
        """
        # Write reference audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_file:
            ref_file.write(reference_audio)
            ref_path = ref_file.name

        wav_parts = []
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
        # Generate a short silence file
        silence_path = "/tmp/silence.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "lavfi", "-i",
                "anullsrc=r=22050:cl=mono", "-t", "0.8",
                "-sample_fmt", "s16", silence_path,
            ],
            capture_output=True,
        )

        # Build ffmpeg concat list
        concat_list = "/tmp/concat_list.txt"
        with open(concat_list, "w") as f:
            for j, part in enumerate(wav_parts):
                f.write(f"file '{part}'\n")
                if j < len(wav_parts) - 1:
                    f.write(f"file '{silence_path}'\n")

        final_path = "/tmp/final_output.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list, "-c", "copy", final_path,
            ],
            capture_output=True,
        )

        with open(final_path, "rb") as f:
            return f.read()


# Web endpoint for Railway backend to call via HTTP
@app.function(
    gpu="T4",
    timeout=300,
    scaledown_window=60,
    image=image,
)
@modal.concurrent(max_inputs=4)
@modal.fastapi_endpoint(method="POST")
def synthesize_endpoint(request: dict):
    """
    HTTP endpoint for voice synthesis.

    POST body:
    {
        "text": "I am confident and strong.",       // single text block
        "lines": ["I am confident.", "I am strong."], // OR list of lines
        "reference_audio_b64": "<base64 WAV bytes>"
    }

    Returns: {"audio_b64": "<base64 WAV bytes>"}
    """
    import base64

    ref_audio = base64.b64decode(request["reference_audio_b64"])

    # Instantiate the synthesizer class
    synth = VoiceSynthesizer()

    if "lines" in request and request["lines"]:
        audio_bytes = synth.synthesize_lines.remote(request["lines"], ref_audio)
    else:
        audio_bytes = synth.synthesize.remote(request["text"], ref_audio)

    return {"audio_b64": base64.b64encode(audio_bytes).decode()}
