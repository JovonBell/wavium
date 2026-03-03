"""
WAVIUM - JWT Auth Dependency
Validates Supabase JWT and extracts user_id, replacing spoofable X-User-ID header
"""

from fastapi import Header, HTTPException, Depends
from supabase import create_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def get_authenticated_user(authorization: str = Header(...)) -> str:
    """
    Validate Supabase JWT from Authorization header and return user_id.
    Use this as a dependency instead of X-User-ID header.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=503, detail="Auth service not configured")

    try:
        token = authorization.replace("Bearer ", "")
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return user_response.user.id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
