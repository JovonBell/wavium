"""
WAVIUM - Supabase Storage + Postgres Service
Handles voice clone audio storage (Supabase Storage) and metadata (Postgres).
All functions are async using httpx.AsyncClient.
"""

import os
import httpx
import logging

_logger = logging.getLogger("wavium.supabase_storage")

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


async def upload_voice_sample(user_id: str, voice_id: str, audio_bytes: bytes) -> str:
    """Upload a user's voice reference audio to Supabase Storage."""
    path = f"{user_id}/{voice_id}.wav"
    url = f"{_supabase_url()}/storage/v1/object/{BUCKET}/{path}"
    headers = {**_headers(), "Content-Type": "audio/wav"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Upsert: try to update first, create if not exists
        resp = await client.put(url, content=audio_bytes, headers=headers)
        if resp.status_code == 404:
            resp = await client.post(url, content=audio_bytes, headers=headers)
        resp.raise_for_status()
    return path


async def download_voice_sample(user_id: str, voice_id: str) -> bytes:
    """Download a user's voice reference audio from Supabase Storage."""
    path = f"{user_id}/{voice_id}.wav"
    url = f"{_supabase_url()}/storage/v1/object/{BUCKET}/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=_headers())
        resp.raise_for_status()
    return resp.content


async def save_voice_metadata(user_id: str, voice_id: str, name: str = "My Voice") -> None:
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
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()


async def get_voice_metadata(user_id: str) -> str | None:
    """Get the current voice clone ID for a user from Postgres."""
    url = f"{_supabase_url()}/rest/v1/voice_profiles"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "voice_id",
        "order": "created_at.desc",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params, headers=_headers())
        resp.raise_for_status()
    rows = resp.json()
    if rows:
        return rows[0]["voice_id"]
    return None


async def delete_voice_data(user_id: str) -> bool:
    """Delete all voice clone data for a user (storage files + DB rows)."""
    base = _supabase_url()
    headers = _headers()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. List files in storage under user_id/ prefix
        list_url = f"{base}/storage/v1/object/list/{BUCKET}"
        list_resp = await client.post(
            list_url,
            json={"prefix": f"{user_id}/"},
            headers={**headers, "Content-Type": "application/json"},
        )
        files_deleted = False
        if list_resp.status_code == 200:
            files = list_resp.json()
            if files:
                paths = [f"{user_id}/{f['name']}" for f in files]
                del_url = f"{base}/storage/v1/object/{BUCKET}"
                del_resp = await client.request(
                    "DELETE",
                    del_url,
                    json={"prefixes": paths},
                    headers={**headers, "Content-Type": "application/json"},
                )
                files_deleted = del_resp.status_code in (200, 204)

        # 2. Delete DB rows
        db_url = f"{base}/rest/v1/voice_profiles"
        db_resp = await client.delete(
            db_url,
            params={"user_id": f"eq.{user_id}"},
            headers=headers,
        )
        rows_deleted = db_resp.status_code in (200, 204)

    return files_deleted or rows_deleted


async def delete_specific_voice_file(user_id: str, voice_id: str) -> bool:
    """Delete a specific voice file from storage (for targeted rollback)."""
    base = _supabase_url()
    headers = _headers()
    path = f"{user_id}/{voice_id}.wav"
    url = f"{base}/storage/v1/object/{BUCKET}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.request(
            "DELETE",
            url,
            json={"prefixes": [path]},
            headers={**headers, "Content-Type": "application/json"},
        )
    return resp.status_code in (200, 204)
