"""
WAVIUM Backend API
FastAPI application for AI-powered subliminal audio generation
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import intentions, generation, library, sessions, evolution
from app.core.config import settings

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# Include routers
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
