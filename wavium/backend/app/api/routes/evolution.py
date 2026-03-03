"""
WAVIUM API - Mindi Evolution Route
Track Mindi's growth and transformation
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

from app.api.auth import get_authenticated_user

router = APIRouter()


class MindiState(BaseModel):
    glow_level: int  # 1-100
    evolution_stage: int  # 1-5
    evolution_path: Optional[str]  # 'confidence', 'wealth', etc.
    total_xp: int
    current_streak: int
    longest_streak: int
    total_listening_minutes: int
    category_minutes: Dict[str, int]
    last_session_at: Optional[datetime]


@router.get("/state", response_model=MindiState)
async def get_mindi_state(
    user_id: str = Depends(get_authenticated_user)
):
    """Get current Mindi state"""
    # TODO: Implement with Supabase
    return MindiState(
        glow_level=1,
        evolution_stage=1,
        evolution_path=None,
        total_xp=0,
        current_streak=0,
        longest_streak=0,
        total_listening_minutes=0,
        category_minutes={},
        last_session_at=None
    )


class EvolutionEvent(BaseModel):
    event_type: str  # 'level_up', 'stage_evolution', 'path_chosen'
    old_value: str
    new_value: str
    occurred_at: datetime


@router.get("/history")
async def get_evolution_history(
    user_id: str = Depends(get_authenticated_user),
    limit: int = 10
):
    """Get Mindi's evolution history"""
    # TODO: Implement with Supabase
    return {"events": []}


# Stage names for reference
EVOLUTION_STAGES = {
    1: "Seed",
    2: "Sprout",
    3: "Bloom",
    4: "Radiant",
    5: "Transcendent"
}

# Path names for reference
EVOLUTION_PATHS = {
    "confidence": "Warrior Mindi",
    "wealth": "Abundance Mindi",
    "love": "Heart Mindi",
    "focus": "Zen Mindi",
    "sleep": "Dream Mindi",
    "health": "Vitality Mindi",
    "creativity": "Muse Mindi",
    "spirituality": "Cosmic Mindi",
    "career": "Achiever Mindi",
    "social": "Connector Mindi"
}


@router.get("/paths")
async def get_evolution_paths():
    """Get all possible evolution paths"""
    return {
        "stages": EVOLUTION_STAGES,
        "paths": EVOLUTION_PATHS
    }
