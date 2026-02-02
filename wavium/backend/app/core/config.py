"""
WAVIUM Backend Configuration
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Environment
    ENVIRONMENT: str = "development"

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Groq (LLM) - Required, app fails at startup if missing
    GROQ_API_KEY: str = Field(min_length=1, description="Groq API key for LLM")

    # Optional for Phase 1 - Required in Phase 2
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Cloudflare R2 (S3-compatible)
    R2_ENDPOINT: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET: str = "wavium-audio"
    R2_PUBLIC_URL: str = ""

    # Audio settings
    AUDIO_TEMP_DIR: str = "/tmp/wavium"
    MAX_DURATION_MINUTES: int = 60
    DEFAULT_SAMPLE_RATE: int = 44100

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW: int = 60  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
