import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.models.drain import Drain, DrainFilterParams
from app.models.risk import RiskCategory
from app.models.task import InspectionTaskResponse
from app.models.intelligence import DrainIntelligence, DraftRecommendation
from app.repositories.memory_store import store
from app.services.risk_engine import calculate_risk
from app.services.intelligence import generate_drain_intelligence

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


@router.get("/{drain_id}/intelligence", response_model=DrainIntelligence)
def get_drain_intelligence(
    drain_id: str,
    api_key: Optional[str] = Query(None, description="Optional override Gemini API key"),
) -> DrainIntelligence:
    """
    Generate AI-assisted incident intelligence for a specific storm drain.
    Synthesizes multiple incident reports, explains mathematical risk score drivers,
    identifies missing/conflicting data, and drafts an advisory inspection recommendation.
    Guaranteed deterministic fallback if external AI is unavailable.
    """
    drain = store.get_drain(drain_id)
    if not drain:
        raise HTTPException(
            status_code=404,
            detail=f"Drain asset '{drain_id}' not found in drainage registry.",
        )
    reports = store.list_reports(drain_id=drain_id)
    return generate_drain_intelligence(drain=drain, reports=reports, api_key=api_key)


@router.post(
    "/{drain_id}/intelligence/approve",
    response_model=InspectionTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def approve_intelligence_recommendation(
    drain_id: str,
    recommendation: DraftRecommendation,
) -> InspectionTaskResponse:
    """
    Human-in-the-loop operator approval action.
    Converts an AI-drafted inspection recommendation into an official municipal work order.
    Assigns the recommended crew and transitions drain status to 'Assigned'.
    """
    drain = store.get_drain(drain_id)
    if not drain:
        raise HTTPException(
            status_code=404,
            detail=f"Drain asset '{drain_id}' not found in drainage registry.",
        )

    task_id = f"TSK-MUM-{uuid.uuid4().hex[:5].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    risk_score = drain.risk_assessment.total_score if drain.risk_assessment else 75
    risk_category = drain.risk_assessment.category if drain.risk_assessment else "High"

    actions_summary = "; ".join(recommendation.recommended_actions[:2]) if recommendation.recommended_actions else "Inspect and clear obstruction."
    equipment_summary = ", ".join(recommendation.equipment_needed[:3]) if recommendation.equipment_needed else "Standard de-silting gear"

    reports = store.list_reports(drain_id=drain_id)
    latest_report_id = reports[0].id if reports else None

    new_task = InspectionTaskResponse(
        id=task_id,
        drain_id=drain.id,
        report_id=latest_report_id,
        title=f"AI-Approved Dispatch: {drain.name}",
        issue_description=f"Operator-approved dispatch ({recommendation.urgency}). Planned actions: {actions_summary}. Equipment: {equipment_summary}.",
        risk_score=risk_score,
        risk_category=risk_category,
        priority=recommendation.priority,
        status="Assigned",
        assigned_crew=recommendation.suggested_crew,
        created_at=now_str,
        updated_at=now_str,
        due_date=now_str,
        notes="Authorized by Municipal Operator from AI Incident Intelligence recommendation.",
        verification_photo_url=None,
    )

    created_task = store.create_task(new_task)
    drain.status = "Assigned"
    store.update_drain(drain)

    return created_task

