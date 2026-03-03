"""
WAVIUM API - Library Route
User's subliminal library management
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.api.auth import get_authenticated_user

router = APIRouter()


class Subliminal(BaseModel):
    id: str
    title: str
    category: str
    audio_url: str
    duration_seconds: int
    affirmations: List[str]
    voice: str
    background: str
    play_count: int
    is_favorite: bool
    created_at: datetime
    last_played_at: Optional[datetime]


class LibraryResponse(BaseModel):
    subliminals: List[Subliminal]
    total_count: int


@router.get("/", response_model=LibraryResponse)
async def get_library(
    user_id: str = Depends(get_authenticated_user),
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's subliminal library
    TODO: Implement Supabase query
    """
    return LibraryResponse(
        subliminals=[],
        total_count=0
    )


@router.get("/{subliminal_id}")
async def get_subliminal(
    subliminal_id: str,
    user_id: str = Depends(get_authenticated_user)
):
    """Get a specific subliminal by ID"""
    raise HTTPException(status_code=404, detail="Subliminal not found")


@router.delete("/{subliminal_id}")
async def delete_subliminal(
    subliminal_id: str,
    user_id: str = Depends(get_authenticated_user)
):
    """Delete a subliminal"""
    return {"deleted": True}


@router.patch("/{subliminal_id}/favorite")
async def toggle_favorite(
    subliminal_id: str,
    user_id: str = Depends(get_authenticated_user)
):
    """Toggle favorite status"""
    return {"is_favorite": True}
