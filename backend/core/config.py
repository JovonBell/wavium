"""
Application settings with environment variable validation.

Settings are loaded from environment variables and .env file.
Required variables fail fast at startup if missing.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """
    Application settings with validation.

    Required settings will raise an error if not set,
    providing fail-fast behavior at startup.
    """

    # Supabase configuration (required for JWT validation)
    supabase_url: str = Field(
        min_length=1,
        description="Supabase project URL (e.g., https://xxx.supabase.co)"
    )
    supabase_anon_key: str = Field(
        default="",
        description="Supabase anon/public key (optional, for server-side calls)"
    )

    # CORS configuration
    # Default includes Expo dev server; add production domains
    cors_origins: List[str] = Field(
        default=["http://localhost:8081", "http://localhost:19006"],
        description="Allowed CORS origins (no wildcards in production)"
    )

    # Existing settings from Phase 1
    groq_api_key: str = Field(
        min_length=1,
        description="Groq API key for LLM inference"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars
    )


# Singleton settings instance
settings = Settings()
