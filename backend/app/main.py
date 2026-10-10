from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.v1 import v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DrainSentinel: AI-Assisted Storm-Drain Intelligence Platform API (Mumbai Catchments)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS middleware for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes (/api/v1/drains, /api/v1/reports, /api/v1/tasks)
app.include_router(v1_router, prefix="/api/v1")

# Also include health on /api/health for backward compatibility
app.include_router(health_router, prefix="/api")


@app.get("/")
def read_root():
    """Root endpoint welcoming API consumers and pointing to documentation."""
    return {
        "message": "Welcome to DrainSentinel API (Mumbai Storm-Drain Network)",
        "docs": "/docs",
        "health": "/api/health",
        "api_v1": "/api/v1",
        "endpoints": {
            "drains": "/api/v1/drains",
            "reports": "/api/v1/reports",
            "tasks": "/api/v1/tasks",
            "health": "/api/v1/health",
        },
    }

