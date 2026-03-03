"""
WAVIUM Backend API
FastAPI application for AI-powered subliminal audio generation
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.routes import account, affirmations, intentions, generation, library, sessions, evolution
from app.core.config import settings

# Patch httpx to accept deprecated `proxies` kwarg (groq SDK compat)
import httpx
_httpx_client_init = httpx.Client.__init__
def _patched_client_init(self, *args, **kwargs):
    kwargs.pop('proxies', None)
    return _httpx_client_init(self, *args, **kwargs)
httpx.Client.__init__ = _patched_client_init

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 WAVIUM Backend starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    yield

    # Shutdown
    logger.info("👋 WAVIUM Backend shutting down...")


# Create FastAPI app
app = FastAPI(
    title="WAVIUM API",
    description="AI-Powered Subliminal Audio Creator",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware — restrict in production, permissive in development
if settings.ENVIRONMENT == "development":
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
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-User-ID"],
    )


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "wavium-api",
        "version": "1.0.0"
    }


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


# Include routers
app.include_router(
    account.router,
    prefix="/api/account",
    tags=["Account"]
)

app.include_router(
    affirmations.router,
    prefix="/api/affirmations",
    tags=["Affirmations"]
)

app.include_router(
    intentions.router,
    prefix="/api/intention",
    tags=["Intentions"]
)

app.include_router(
    generation.router,
    prefix="/api/generate",
    tags=["Generation"]
)

app.include_router(
    library.router,
    prefix="/api/library",
    tags=["Library"]
)

app.include_router(
    sessions.router,
    prefix="/api/session",
    tags=["Sessions"]
)

app.include_router(
    evolution.router,
    prefix="/api/mindi",
    tags=["Mindi Evolution"]
)


# WebSocket endpoint for real-time generation progress
@app.websocket("/ws/generate")
async def websocket_generate(websocket: WebSocket):
    """WebSocket endpoint for subliminal generation with progress updates"""
    await websocket.accept()

    try:
        # Receive generation request
        data = await websocket.receive_json()

        # Import here to avoid circular imports
        from app.services.audio_pipeline import AudioPipeline

        pipeline = AudioPipeline()

        # Process and stream progress
        result = await pipeline.generate_subliminal(
            user_intention=data.get("intention", ""),
            voice=data.get("voice", "jenny"),
            background=data.get("background", "rain"),
            duration_minutes=data.get("duration", 30),
            technique=data.get("technique", "classic"),
            websocket=websocket,
        )

        # Send completion message
        await websocket.send_json({
            "type": "complete",
            "data": result
        })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
