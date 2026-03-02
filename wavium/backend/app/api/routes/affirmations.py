"""
WAVIUM API - Affirmations Route
Generate personalized affirmations from user intentions via Groq LLM
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

from groq import Groq
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert at creating powerful, personalized subliminal affirmations for wellness and personal growth.
Your affirmations should be:
- Written in first person ("I am", "I have", "I attract")
- Positive and present tense (as if already achieved)
- Specific to the user's intention
- Emotionally resonant and believable
- Between 5-12 words each
- If the user's name is provided, weave it naturally into some (not all) affirmations
- SAFETY: Only generate positive, life-affirming content. Never generate content related to harming oneself or others, violence, hatred, illegal activities, or any inappropriate themes. If the intention seems harmful, redirect toward positive self-improvement instead.

Generate 12 unique affirmations based on the user's intention.
Return ONLY the affirmations, one per line, no numbering or extra text."""

# Fallback affirmations if API fails
DEFAULT_AFFIRMATIONS = [
    "I am becoming exactly who I want to be.",
    "Every day, I move closer to my goals.",
    "I am worthy of success and happiness.",
    "My potential is unlimited.",
    "I radiate confidence and inner peace.",
    "I attract positive opportunities into my life.",
    "I believe in myself completely.",
]


class AffirmationsRequest(BaseModel):
    intention: str = Field(min_length=3, max_length=500)
    user_name: Optional[str] = Field(default=None, max_length=100)


class AffirmationsResponse(BaseModel):
    affirmations: List[str]
    error: Optional[str] = None


@router.post("/", response_model=AffirmationsResponse)
async def generate_affirmations(request: AffirmationsRequest):
    """Generate personalized affirmations from a user intention"""
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        user_message = (
            f"Create powerful affirmations for {request.user_name}, who wants to: {request.intention}"
            if request.user_name
            else f"Create powerful affirmations for someone who wants to: {request.intention}"
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=800,
        )

        content = response.choices[0].message.content or ""

        affirmations = [
            line.lstrip("-*").strip()
            for line in content.strip().split("\n")
            if line.strip() and not line.strip()[0].isdigit() and len(line.strip()) > 5
        ]

        if not affirmations:
            return AffirmationsResponse(affirmations=DEFAULT_AFFIRMATIONS)

        return AffirmationsResponse(affirmations=affirmations)

    except Exception as e:
        logger.error(f"Affirmation generation error: {e}")
        return AffirmationsResponse(
            affirmations=DEFAULT_AFFIRMATIONS,
            error="Failed to generate custom affirmations, using defaults",
        )
