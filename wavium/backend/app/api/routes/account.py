"""
WAVIUM API - Account Management
Account deletion endpoint (Apple App Store requirement)
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import logging

from supabase import create_client
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class DeleteAccountRequest(BaseModel):
    user_id: str


@router.delete("/")
async def delete_account(request: DeleteAccountRequest, authorization: str = Header(...)):
    """
    Delete a user account and all associated data.
    Requires the user's JWT in the Authorization header.
    """
    try:
        token = authorization.replace("Bearer ", "")

        # Use service role key to delete the user from Supabase Auth
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise HTTPException(
                status_code=503,
                detail="Account deletion service not configured",
            )

        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        # Verify the token belongs to the user requesting deletion
        user_response = supabase.auth.get_user(token)
        if not user_response or user_response.user.id != request.user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Delete user data from any custom tables first
        # (Add table-specific deletions here as the schema grows)

        # Delete the auth user (requires service_role key in SUPABASE_KEY)
        supabase.auth.admin.delete_user(request.user_id)

        logger.info(f"Account deleted: {request.user_id}")
        return {"status": "deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Account deletion error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete account. Please try again or contact support.",
        )
