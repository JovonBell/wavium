"""
WAVIUM Backend API
FastAPI server for AI affirmation generation and subliminal audio mixing
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from services.groq_service import generate_affirmations
from services.tts_service import generate_audio, generate_subliminal, get_available_voices, generate_voice_preview

load_dotenv()

app = FastAPI(
    title="Wavium API",
    description="AI-powered subliminal audio generation",
    version="1.0.0"
)

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve audio files
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audio_output")
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Serve ambient background tracks
AMBIENT_DIR = os.path.join(os.path.dirname(__file__), "ambient")
os.makedirs(AMBIENT_DIR, exist_ok=True)
app.mount("/ambient", StaticFiles(directory=AMBIENT_DIR), name="ambient")


# Request/Response Models
class GenerateAffirmationsRequest(BaseModel):
    intention: str
    user_name: str = ""


class GenerateAffirmationsResponse(BaseModel):
    affirmations: list[str]
    intention: str


class GenerateAudioRequest(BaseModel):
    affirmations: list[str]
    voice: str = "ava"


class GenerateAudioResponse(BaseModel):
    audio_url: str
    voice: str


class GenerateSubliminalRequest(BaseModel):
    affirmations: list[str]
    voice: str = "ava"
    track: str = "ocean-waves"
    voice_volume: float = 0.12
    bg_volume: float = 0.85
    duration_secs: int = 300


class GenerateSubliminalResponse(BaseModel):
    audio_url: str
    voice: str
    track: str
    duration_secs: int


class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str
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
    """Generate personalized affirmations based on user's intention"""
    if not request.intention.strip():
        raise HTTPException(status_code=400, detail="Intention cannot be empty")

    try:
        affirmations = await generate_affirmations(request.intention, user_name=request.user_name)
        return GenerateAffirmationsResponse(
            affirmations=affirmations,
            intention=request.intention
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate affirmations: {str(e)}")


@app.post("/api/generate-audio", response_model=GenerateAudioResponse)
async def api_generate_audio(request: GenerateAudioRequest):
    """Generate basic TTS audio from affirmations"""
    if not request.affirmations:
        raise HTTPException(status_code=400, detail="Affirmations list cannot be empty")

    try:
        audio_path = await generate_audio(request.affirmations, request.voice)
        filename = os.path.basename(audio_path)
        return GenerateAudioResponse(
            audio_url=f"/audio/{filename}",
            voice=request.voice
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")


@app.post("/api/generate-subliminal", response_model=GenerateSubliminalResponse)
async def api_generate_subliminal(request: GenerateSubliminalRequest):
    """
    Generate a complete subliminal audio file.
    Mixes whispered affirmations at low volume under ambient background audio.
    """
    if not request.affirmations:
        raise HTTPException(status_code=400, detail="Affirmations list cannot be empty")

    try:
        audio_path = await generate_subliminal(
            affirmations=request.affirmations,
            voice=request.voice,
            track=request.track,
            voice_volume=request.voice_volume,
            bg_volume=request.bg_volume,
            duration_secs=request.duration_secs,
        )
        filename = os.path.basename(audio_path)
        return GenerateSubliminalResponse(
            audio_url=f"/audio/{filename}",
            voice=request.voice,
            track=request.track,
            duration_secs=request.duration_secs,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate subliminal: {str(e)}")


@app.get("/api/ambient-tracks")
async def api_get_ambient_tracks():
    """Get URLs for ambient background tracks served from this backend"""
    tracks = {}
    for name in ["ocean-waves", "rainfall", "deep-focus", "cosmic-drift", "lofi-chill", "lofi-dream", "lofi-jazz", "zen-garden", "night-drive", "forest-dawn"]:
        path = os.path.join(AMBIENT_DIR, f"{name}.mp3")
        if os.path.exists(path):
            tracks[name] = f"/ambient/{name}.mp3"
    return tracks


@app.get("/api/voice-preview/{voice_id}")
async def api_voice_preview(voice_id: str):
    """Get a short preview clip of a voice. Cached after first generation."""
    try:
        audio_path = await generate_voice_preview(voice_id)
        filename = os.path.basename(audio_path)
        return {"audio_url": f"/audio/previews/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")


@app.get("/api/voices", response_model=list[VoiceInfo])
async def api_get_voices():
    """Get available TTS voices"""
    voices = await get_available_voices()
    return [VoiceInfo(id=v["id"], name=v["name"], gender=v["gender"], description=v["description"]) for v in voices]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
