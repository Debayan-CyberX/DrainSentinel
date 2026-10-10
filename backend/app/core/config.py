from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "DrainSentinel API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Environment
    ENVIRONMENT: str = "development"

    # AI Intelligence Configuration (Optional Free Gemini API with deterministic fallback)
    GEMINI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )



settings = Settings()
