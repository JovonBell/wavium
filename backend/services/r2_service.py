"""
WAVIUM - Cloudflare R2 Storage Service
Handles voice clone audio storage (reference samples + generated output).
Uses the same R2 bucket already configured for Wavium audio.
"""

import os
import boto3
from botocore.config import Config


def _get_r2_client():
    """Get boto3 S3 client configured for Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("R2_ENDPOINT"),
        aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def _get_bucket() -> str:
    return os.getenv("R2_BUCKET", "wavium-audio")


def _get_public_url() -> str:
    return os.getenv("R2_PUBLIC_URL", "")


def upload_voice_sample(user_id: str, voice_id: str, audio_bytes: bytes) -> str:
    """
    Upload a user's voice reference audio to R2.
    Returns the R2 key for later retrieval.
    """
    key = f"voice-clones/{user_id}/{voice_id}.wav"
    client = _get_r2_client()
    client.put_object(
        Bucket=_get_bucket(),
        Key=key,
        Body=audio_bytes,
        ContentType="audio/wav",
    )
    return key


def download_voice_sample(user_id: str, voice_id: str) -> bytes:
    """Download a user's voice reference audio from R2."""
    key = f"voice-clones/{user_id}/{voice_id}.wav"
    client = _get_r2_client()
    response = client.get_object(Bucket=_get_bucket(), Key=key)
    return response["Body"].read()


def upload_generated_audio(filename: str, audio_bytes: bytes) -> str:
    """
    Upload generated TTS audio to R2.
    Returns the public URL for the audio file.
    """
    key = f"generated/{filename}"
    client = _get_r2_client()
    client.put_object(
        Bucket=_get_bucket(),
        Key=key,
        Body=audio_bytes,
        ContentType="audio/wav",
    )
    public_url = _get_public_url()
    if public_url:
        return f"{public_url}/{key}"
    return key


def save_voice_metadata(user_id: str, voice_id: str) -> None:
    """Save a small metadata file tracking the user's current voice clone ID."""
    key = f"voice-clones/{user_id}/current_voice.txt"
    client = _get_r2_client()
    client.put_object(
        Bucket=_get_bucket(),
        Key=key,
        Body=voice_id.encode(),
        ContentType="text/plain",
    )


def get_voice_metadata(user_id: str) -> str | None:
    """Get the current voice clone ID for a user, or None."""
    key = f"voice-clones/{user_id}/current_voice.txt"
    client = _get_r2_client()
    try:
        response = client.get_object(Bucket=_get_bucket(), Key=key)
        return response["Body"].read().decode().strip()
    except client.exceptions.NoSuchKey:
        return None
    except Exception:
        return None


def delete_voice_data(user_id: str) -> bool:
    """Delete all voice clone data for a user from R2."""
    prefix = f"voice-clones/{user_id}/"
    client = _get_r2_client()
    try:
        response = client.list_objects_v2(Bucket=_get_bucket(), Prefix=prefix)
        objects = response.get("Contents", [])
        if not objects:
            return False
        client.delete_objects(
            Bucket=_get_bucket(),
            Delete={"Objects": [{"Key": obj["Key"]} for obj in objects]},
        )
        return True
    except Exception:
        return False
