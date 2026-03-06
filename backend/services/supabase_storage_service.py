"""
WAVIUM - Supabase Storage + Postgres Service
Handles voice clone audio storage (Supabase Storage) and metadata (Postgres).
Replaces the previous R2/boto3 implementation.
"""

import os
import httpx


BUCKET = "voice-clones"


def _supabase_url() -> str:
    url = os.getenv("SUPABASE_URL", "")
    if not url:
        raise RuntimeError("SUPABASE_URL not set")
    return url.rstrip("/")


def _service_key() -> str:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY not set")
    return key


def _headers() -> dict:
    key = _service_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }


def upload_voice_sample(user_id: str, voice_id: str, audio_bytes: bytes) -> str:
    """Upload a user's voice reference audio to Supabase Storage."""
    path = f"{user_id}/{voice_id}.wav"
    url = f"{_supabase_url()}/storage/v1/object/{BUCKET}/{path}"
    headers = {**_headers(), "Content-Type": "audio/wav"}

    # Upsert: try to update first, create if not exists
    resp = httpx.put(url, content=audio_bytes, headers=headers, timeout=30.0)
    if resp.status_code == 404:
        resp = httpx.post(url, content=audio_bytes, headers=headers, timeout=30.0)
    resp.raise_for_status()
    return path


def download_voice_sample(user_id: str, voice_id: str) -> bytes:
    """Download a user's voice reference audio from Supabase Storage."""
    path = f"{user_id}/{voice_id}.wav"
    url = f"{_supabase_url()}/storage/v1/object/{BUCKET}/{path}"
    resp = httpx.get(url, headers=_headers(), timeout=30.0)
    resp.raise_for_status()
    return resp.content


def save_voice_metadata(user_id: str, voice_id: str, name: str = "My Voice") -> None:
    """Upsert the user's voice profile in Postgres."""
    url = f"{_supabase_url()}/rest/v1/voice_profiles"
    headers = {
        **_headers(),
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    payload = {
        "user_id": user_id,
        "voice_id": voice_id,
        "name": name,
    }
    resp = httpx.post(url, json=payload, headers=headers, timeout=10.0)
    resp.raise_for_status()


def get_voice_metadata(user_id: str) -> str | None:
    """Get the current voice clone ID for a user from Postgres."""
    url = f"{_supabase_url()}/rest/v1/voice_profiles"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "voice_id",
        "order": "created_at.desc",
        "limit": "1",
    }
    resp = httpx.get(url, params=params, headers=_headers(), timeout=10.0)
    resp.raise_for_status()
    rows = resp.json()
    if rows:
        return rows[0]["voice_id"]
    return None


def delete_voice_data(user_id: str) -> bool:
    """Delete all voice clone data for a user (storage files + DB rows)."""
    base = _supabase_url()
    headers = _headers()

    # 1. List files in storage under user_id/ prefix
    list_url = f"{base}/storage/v1/object/list/{BUCKET}"
    list_resp = httpx.post(
        list_url,
        json={"prefix": f"{user_id}/"},
        headers={**headers, "Content-Type": "application/json"},
        timeout=10.0,
    )
    files_deleted = False
    if list_resp.status_code == 200:
        files = list_resp.json()
        if files:
            paths = [f"{user_id}/{f['name']}" for f in files]
            del_url = f"{base}/storage/v1/object/{BUCKET}"
            del_resp = httpx.request(
                "DELETE",
                del_url,
                json={"prefixes": paths},
                headers={**headers, "Content-Type": "application/json"},
                timeout=10.0,
            )
            files_deleted = del_resp.status_code in (200, 204)

    # 2. Delete DB rows
    db_url = f"{base}/rest/v1/voice_profiles"
    db_resp = httpx.delete(
        db_url,
        params={"user_id": f"eq.{user_id}"},
        headers=headers,
        timeout=10.0,
    )
    rows_deleted = db_resp.status_code in (200, 204)

    return files_deleted or rows_deleted
