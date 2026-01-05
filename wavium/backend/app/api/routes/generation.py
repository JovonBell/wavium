"""
WAVIUM API - Generation Route
Audio generation endpoints (non-WebSocket)
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/voices")
async def list_voices():
    """List available TTS voices"""
    return {
        "voices": [
            {"id": "jenny", "name": "Jenny", "description": "Warm, friendly female voice"},
            {"id": "guy", "name": "Guy", "description": "Calm, soothing male voice"},
            {"id": "aria", "name": "Aria", "description": "Soft, gentle female voice"},
            {"id": "davis", "name": "Davis", "description": "Deep, relaxing male voice"},
            {"id": "sara", "name": "Sara", "description": "Clear, confident female voice"},
            {"id": "tony", "name": "Tony", "description": "Warm, encouraging male voice"},
            {"id": "nancy", "name": "Nancy", "description": "Nurturing female voice"},
            {"id": "jason", "name": "Jason", "description": "Strong, supportive male voice"},
        ]
    }


@router.get("/backgrounds")
async def list_backgrounds():
    """List available background sounds"""
    return {
        "backgrounds": [
            {"id": "rain", "name": "Gentle Rain", "description": "Soft rainfall sounds"},
            {"id": "ocean", "name": "Ocean Waves", "description": "Calming ocean waves"},
            {"id": "forest", "name": "Forest", "description": "Peaceful forest ambience"},
            {"id": "whitenoise", "name": "White Noise", "description": "Pure white noise"},
            {"id": "binaural", "name": "Binaural 10Hz", "description": "Alpha wave binaural beats"},
            {"id": "silence", "name": "Pure Silence", "description": "No background audio"},
        ]
    }


@router.get("/techniques")
async def list_techniques():
    """List available subliminal techniques"""
    return {
        "techniques": [
            {
                "id": "classic",
                "name": "Classic Subliminal",
                "description": "Affirmations at low volume under background audio"
            },
            {
                "id": "speeded",
                "name": "Speeded Up",
                "description": "Affirmations sped up 1.5x for deeper processing"
            },
            {
                "id": "silent",
                "name": "Silent Subliminal",
                "description": "Ultrasonic frequencies (experimental)"
            },
        ]
    }
