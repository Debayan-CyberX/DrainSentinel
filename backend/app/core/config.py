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

    # Environment & Storage Backend
    ENVIRONMENT: str = "development"
    STORAGE_BACKEND: str = "memory"  # 'memory' for local dev/tests, 'dynamodb' for AWS

    # AWS Cloud Services Configuration
    AWS_REGION: str = "ap-south-1"
    DYNAMODB_TABLE_DRAINS: str = "DrainSentinel-Drains"
    DYNAMODB_TABLE_REPORTS: str = "DrainSentinel-Reports"
    DYNAMODB_TABLE_TASKS: str = "DrainSentinel-Tasks"
    DYNAMODB_TABLE_AUDIT: str = "DrainSentinel-Audit"
    DYNAMODB_ENDPOINT_URL: Optional[str] = None  # For LocalStack / DynamoDB Local
    S3_PHOTO_BUCKET: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None
    SNS_ALERT_TOPIC_ARN: Optional[str] = None

    # AI Intelligence Configuration (Optional Free Gemini API with deterministic fallback)
    GEMINI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )



settings = Settings()
