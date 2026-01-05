"""
WAVIUM API - Intentions Route
Process user intentions into affirmations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import logging

from app.services.audio_pipeline import AudioPipeline

router = APIRouter()
logger = logging.getLogger(__name__)


class IntentionRequest(BaseModel):
    intention: str


class IntentionResponse(BaseModel):
    affirmations: List[str]
    title: str
    category: str


@router.post("/", response_model=IntentionResponse)
async def process_intention(request: IntentionRequest):
    """
    Process a user's intention and generate affirmations
    This is a preview - actual audio generation happens via WebSocket
    """
    if not request.intention or len(request.intention) < 3:
        raise HTTPException(
            status_code=400,
            detail="Intention must be at least 3 characters"
        )

    try:
        pipeline = AudioPipeline()
        affirmations, title, category = await pipeline._generate_affirmations(
            request.intention
        )

        return IntentionResponse(
            affirmations=affirmations,
            title=title,
            category=category
        )

    except Exception as e:
        logger.error(f"Error processing intention: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process intention. Please try again."
        )
