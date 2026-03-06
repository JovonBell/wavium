"""
WAVIUM Backend API
FastAPI server for AI affirmation generation and subliminal audio mixing
"""

import os
import shutil
import tempfile
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import httpx

from services.groq_service import generate_affirmations
from services.tts_service import generate_audio, generate_subliminal, get_available_voices, generate_voice_preview
from services.voice_clone_service import clone_voice, get_user_voice_id, delete_user_voice

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Patch httpx to accept deprecated `proxies` kwarg (groq SDK compat)
import httpx as _httpx
_orig_client_init = _httpx.Client.__init__
_orig_async_init = _httpx.AsyncClient.__init__
def _patched_init(self, *args, **kwargs):
    kwargs.pop('proxies', None)
    _orig_client_init(self, *args, **kwargs)
def _patched_async_init(self, *args, **kwargs):
    kwargs.pop('proxies', None)
    _orig_async_init(self, *args, **kwargs)
_httpx.Client.__init__ = _patched_init
_httpx.AsyncClient.__init__ = _patched_async_init

app = FastAPI(
    title="Wavium API",
    description="AI-powered subliminal audio generation",
    version="1.0.0"
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict in production, permissive in development
if ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://wavium-production.up.railway.app"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-User-ID"],
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
    clone_voice_id: str | None = None  # User's cloned voice ID
    user_id: str | None = None         # Required when using clone_voice_id


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
    clone_voice_id: str | None = None  # User's cloned voice ID (from /api/voice/clone)
    user_id: str | None = None         # Required when using clone_voice_id


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


# Privacy policy (served as static HTML)
@app.get("/privacy")
async def privacy_policy():
    """Serve privacy policy page"""
    policy_path = Path(__file__).parent / "static" / "privacy-policy.html"
    return FileResponse(policy_path, media_type="text/html")


# Terms of service (served as static HTML)
@app.get("/terms")
async def terms_of_service():
    """Serve terms of service page"""
    terms_path = Path(__file__).parent / "static" / "terms-of-service.html"
    return FileResponse(terms_path, media_type="text/html")


@app.post("/api/generate-affirmations", response_model=GenerateAffirmationsResponse)
@limiter.limit("10/minute")
async def api_generate_affirmations(request: Request, body: GenerateAffirmationsRequest):
    """Generate personalized affirmations based on user's intention"""
    if not body.intention.strip():
        raise HTTPException(status_code=400, detail="Intention cannot be empty")

    try:
        affirmations = await generate_affirmations(body.intention, user_name=body.user_name)
        return GenerateAffirmationsResponse(
            affirmations=affirmations,
            intention=body.intention
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate affirmations: {str(e)}")


@app.post("/api/generate-audio", response_model=GenerateAudioResponse)
async def api_generate_audio(request: GenerateAudioRequest):
    """Generate basic TTS audio from affirmations (edge-tts or cloned voice)"""
    if not request.affirmations:
        raise HTTPException(status_code=400, detail="Affirmations list cannot be empty")

    try:
        if request.clone_voice_id and request.user_id:
            # Use cloned voice via Modal serverless GPU (XTTS v2)
            from services.voice_clone_service import synthesize_cloned_voice_lines
            audio_path = await synthesize_cloned_voice_lines(
                lines=request.affirmations,
                voice_id=request.clone_voice_id,
                user_id=request.user_id,
            )
        else:
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
            clone_voice_id=request.clone_voice_id,
            user_id=request.user_id,
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


class DeleteAccountRequest(BaseModel):
    user_id: str


@app.delete("/api/account/")
async def api_delete_account(request: Request, body: DeleteAccountRequest):
    """
    Delete the authenticated user's account via Supabase Admin API.
    Requires a valid Supabase access token in the Authorization header.
    """
    # Extract bearer token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    access_token = auth_header[len("Bearer "):]

    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise HTTPException(status_code=500, detail="Server configuration error: Supabase credentials not set")

    try:
        # Verify the access token by fetching the user from Supabase
        async with httpx.AsyncClient(timeout=10.0) as client:
            verify_resp = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "apikey": service_role_key,
                },
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to verify token with Supabase: {str(e)}")

    if verify_resp.status_code != 200:
        raise HTTPException(status_code=401, detail=f"Invalid or expired access token (Supabase returned {verify_resp.status_code})")

    verified_user = verify_resp.json()
    if verified_user.get("id") != body.user_id:
        raise HTTPException(status_code=403, detail="Forbidden: user_id does not match authenticated user")

    try:
        # Delete the user via Supabase Admin API
        async with httpx.AsyncClient(timeout=10.0) as client:
            delete_resp = await client.delete(
                f"{supabase_url}/auth/v1/admin/users/{body.user_id}",
                headers={
                    "Authorization": f"Bearer {service_role_key}",
                    "apikey": service_role_key,
                },
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to delete user via Supabase: {str(e)}")

    if delete_resp.status_code not in (200, 204):
        detail = "Failed to delete account"
        try:
            error_body = delete_resp.json()
            detail = error_body.get("msg") or error_body.get("message") or detail
        except Exception:
            pass
        raise HTTPException(status_code=delete_resp.status_code, detail=detail)

    # Clean up voice clone data (storage files + DB rows)
    try:
        await delete_user_voice(body.user_id)
    except Exception:
        pass  # Non-critical — user account already deleted

    return {"detail": "Account deleted successfully"}


@app.post("/api/voice/clone")
@limiter.limit("5/hour")
async def api_clone_voice(
    request: Request,
    audio: UploadFile = File(...),
    name: str = Form("My Voice"),
    user_id: str = Form(...),
):
    """
    Clone a user's voice from an audio recording.
    Saves the reference audio locally and returns a voice ID for future TTS.
    Uses self-hosted XTTS v2 — no external API costs.
    """
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    # Save uploaded file temporarily
    suffix = ".m4a" if "m4a" in (audio.content_type or "") else ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(audio.file, tmp)
        tmp.close()

        voice_id = await clone_voice(
            user_id=user_id,
            name=name,
            audio_path=tmp.name,
        )
        return {"voice_id": voice_id, "name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {str(e)}")
    finally:
        os.unlink(tmp.name)


@app.get("/api/voice/status/{user_id}")
async def api_voice_status(user_id: str):
    """Check if a user has a cloned voice available."""
    voice_id = get_user_voice_id(user_id)
    return {"has_voice": voice_id is not None, "voice_id": voice_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
