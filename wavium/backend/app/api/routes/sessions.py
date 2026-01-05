"""
WAVIUM API - Sessions Route
Track listening sessions and progress
"""

from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class SessionCreate(BaseModel):
    subliminal_id: str
    duration_seconds: int
    completed: bool


class SessionResponse(BaseModel):
    id: str
    xp_earned: int
    new_glow_level: int
    streak_updated: bool
    new_streak: int


@router.post("/", response_model=SessionResponse)
async def create_session(
    session: SessionCreate,
    user_id: str = Header(..., alias="X-User-ID")
):
    """
    Record a listening session
    Returns XP earned and updated stats
    """
    # TODO: Implement with Supabase

    # Calculate XP (placeholder logic)
    base_xp = session.duration_seconds // 60
    completion_bonus = 10 if session.completed else 0
    xp_earned = base_xp + completion_bonus

    return SessionResponse(
        id="placeholder",
        xp_earned=xp_earned,
        new_glow_level=50,  # Placeholder
        streak_updated=True,
        new_streak=1
    )


class SessionStats(BaseModel):
    total_sessions: int
    total_listening_minutes: int
    current_streak: int
    longest_streak: int
    sessions_today: int
    favorite_category: Optional[str]


@router.get("/stats", response_model=SessionStats)
async def get_session_stats(
    user_id: str = Header(..., alias="X-User-ID")
):
    """Get user's session statistics"""
    # TODO: Implement with Supabase
    return SessionStats(
        total_sessions=0,
        total_listening_minutes=0,
        current_streak=0,
        longest_streak=0,
        sessions_today=0,
        favorite_category=None
    )
