"""
WAVIUM Backend API
FastAPI server for AI affirmation generation and TTS
"""

import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from core.config import settings
from core.security import get_current_user, get_current_user_id
from services.groq_service import generate_affirmations
from services.tts_service import generate_audio, get_available_voices

app = FastAPI(
    title="Wavium API",
    description="AI-powered subliminal audio generation",
    version="1.0.0"
)

# CORS configuration
# Origins from settings - specific domains, not wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Serve audio files
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audio_output")
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


# Request/Response Models
class GenerateAffirmationsRequest(BaseModel):
    intention: str


class GenerateAffirmationsResponse(BaseModel):
    affirmations: list[str]
    intention: str


class GenerateAudioRequest(BaseModel):
    affirmations: list[str]
    voice: str = "jenny"


class GenerateAudioResponse(BaseModel):
    audio_url: str
    voice: str


class VoiceInfo(BaseModel):
    id: str
    name: str
    description: str


# Endpoints
@app.get("/")
async def root():
    return {"message": "Wavium API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/generate-affirmations", response_model=GenerateAffirmationsResponse)
async def api_generate_affirmations(request: GenerateAffirmationsRequest):
    """
    Generate personalized affirmations based on user's intention
    """
    if not request.intention.strip():
        raise HTTPException(status_code=400, detail="Intention cannot be empty")

    try:
        affirmations = await generate_affirmations(request.intention)
        return GenerateAffirmationsResponse(
            affirmations=affirmations,
            intention=request.intention
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate affirmations: {str(e)}")


@app.post("/api/generate-audio", response_model=GenerateAudioResponse)
async def api_generate_audio(request: GenerateAudioRequest):
    """
    Generate audio from affirmations using TTS
    """
    if not request.affirmations:
        raise HTTPException(status_code=400, detail="Affirmations list cannot be empty")

    try:
        audio_path = await generate_audio(request.affirmations, request.voice)

        # Return the URL path to the audio file
        filename = os.path.basename(audio_path)
        audio_url = f"/audio/{filename}"

        return GenerateAudioResponse(
            audio_url=audio_url,
            voice=request.voice
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")


@app.get("/api/voices", response_model=list[VoiceInfo])
async def api_get_voices():
    """
    Get available TTS voices
    """
    voices = await get_available_voices()
    return [VoiceInfo(id=v["id"], name=v["name"], description=v["description"]) for v in voices]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
