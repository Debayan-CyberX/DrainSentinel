from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.drain import Drain, DrainFilterParams
from app.models.risk import RiskCategory
from app.repositories.memory_store import store
from app.services.risk_engine import calculate_risk

router = APIRouter(prefix="/drains", tags=["Drains"])


@router.get("", response_model=List[Drain])
def list_drains(
    ward: Optional[str] = Query(None, description="Filter by BMC Ward e.g. 'F-North', 'K-East'"),
    risk_category: Optional[RiskCategory] = Query(None, description="Filter by risk category"),
    status: Optional[str] = Query(None, description="Filter by lifecycle status"),
    search: Optional[str] = Query(None, description="Search term for ID, address, or landmark"),
    rainfall_rate_mm_h: Optional[float] = Query(0.0, description="Simulated rainfall intensity to apply to risk scores"),
) -> List[Drain]:
    """
    List Mumbai storm-drain assets with optional filtering and live rainfall stress recalculation.
    """
    params = DrainFilterParams(
        ward=ward,
        risk_category=risk_category,
        status=status,
        search=search,
    )
    drains = store.list_drains(params)

    # If non-zero rainfall rate supplied, calculate updated stress score dynamically
    if rainfall_rate_mm_h and rainfall_rate_mm_h > 0.0:
        updated_drains = []
        for d in drains:
            simulated_risk = calculate_risk(
                silt_level_percent=d.telemetry.silt_level_percent,
                rainfall_rate_mm_h=rainfall_rate_mm_h,
                elevation_meters=d.elevation_meters,
                exposure_tier=d.exposure_tier,
                active_reports_count=d.active_report_count,
                has_verified_report=d.has_verified_report,
            )
            d_copy = d.model_copy(update={"risk_assessment": simulated_risk})
            updated_drains.append(d_copy)
        return updated_drains

    return drains


@router.get("/{drain_id}", response_model=Drain)
def get_drain(drain_id: str) -> Drain:
    """
    Retrieve full details and deterministic risk breakdown for a specific Mumbai drain.
    """
    drain = store.get_drain(drain_id)
    if not drain:
        raise HTTPException(
            status_code=404,
            detail=f"Drain with ID '{drain_id}' not found in Mumbai drainage registry.",
        )
    return drain
