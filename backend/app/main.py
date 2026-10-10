import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum

from app.core.config import settings
from app.core.logging import logger
from app.api.routes.health import router as health_router
from app.api.v1 import v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DrainSentinel: AI-Assisted Storm-Drain Intelligence Platform API (Mumbai Catchments)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.ENVIRONMENT == "development" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    """Logs structured JSON metrics for incoming HTTP requests across Lambda and local environments."""
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(
            f"Unhandled exception during {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
            extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
            },
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error occurred. Transaction logged."},
        )


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

STATIC_DIR = Path(__file__).parent / "static"
if (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
if (STATIC_DIR / "landing-pages").exists():
    app.mount("/landing-pages", StaticFiles(directory=str(STATIC_DIR / "landing-pages")), name="landing-pages")
if (STATIC_DIR / "images").exists():
    app.mount("/images", StaticFiles(directory=str(STATIC_DIR / "images")), name="images")


# Include API v1 routes
app.include_router(v1_router, prefix="/api/v1")

# Include health on /api/health for backward compatibility
app.include_router(health_router, prefix="/api")


@app.get("/")
def read_root(request: Request):
    """Serves Web UI for browser and mobile clients, and JSON API index for pure API clients."""
    accept = request.headers.get("accept", "")
    index_file = STATIC_DIR / "index.html"
    if "text/html" in accept and index_file.exists():
        return FileResponse(str(index_file))
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
            "photos": "/api/v1/photos",
        },
    }


@app.exception_handler(404)
async def spa_fallback_404(request: Request, exc):
    """Fallback handler to support SPA client-side routing on mobile devices."""
    if (
        request.url.path.startswith("/api")
        or request.url.path.startswith("/docs")
        or request.url.path.startswith("/openapi")
    ):
        return JSONResponse(status_code=404, content={"detail": f"Not Found: {request.url.path}"})
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return JSONResponse(status_code=404, content={"detail": "Not Found"})


# AWS Lambda entrypoint handler for API Gateway HTTP API
handler = Mangum(app, lifespan="off")

