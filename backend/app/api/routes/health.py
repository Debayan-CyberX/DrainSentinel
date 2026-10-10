from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: str
    cloud_readiness: str


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return health status of the DrainSentinel API."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        cloud_readiness="AWS Serverless Ready (Lambda/DynamoDB/S3/SNS)",
    )
