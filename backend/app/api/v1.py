from fastapi import APIRouter
from app.api.routes.drains import router as drains_router
from app.api.routes.reports import router as reports_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.health import router as health_router

v1_router = APIRouter()

v1_router.include_router(health_router)
v1_router.include_router(drains_router)
v1_router.include_router(reports_router)
v1_router.include_router(tasks_router)
