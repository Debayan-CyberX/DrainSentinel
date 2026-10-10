import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.report import IncidentReportCreate, IncidentReportResponse, ReportStatus
from app.models.task import InspectionTaskResponse
from app.repositories.memory_store import store
from app.services.duplicate import check_for_duplicate, find_closest_drain
from app.services.risk_engine import calculate_risk
from app.services.notifications import notification_service

router = APIRouter(prefix="/reports", tags=["Incident Reports"])


@router.get("", response_model=List[IncidentReportResponse])
def list_reports(
    status: Optional[str] = Query(None, description="Filter by status ('unverified', 'reviewed', 'triaged', 'dismissed')"),
    drain_id: Optional[str] = Query(None, description="Filter by drain asset ID"),
    is_duplicate: Optional[bool] = Query(None, description="Filter by duplicate flag"),
) -> List[IncidentReportResponse]:
    """
    Retrieve incident blockage reports with optional filtering.
    """
    reports = store.list_reports(status=status, drain_id=drain_id)
    if is_duplicate is not None:
        reports = [r for r in reports if r.is_duplicate == is_duplicate]
    return reports


@router.post("", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: IncidentReportCreate) -> IncidentReportResponse:
    """
    Submit a citizen or field inspection blockage report.
    - Captures location, issue type, severity, description and optional photo.
    - Generates a unique report ID.
    - Labels citizen reports as 'unverified'.
    - Checks for potential duplicates against existing active reports.
    - Recalculates risk for the affected drain immediately.
    """
    existing_reports = store.list_reports()

    # If drain_id is not provided, attempt to auto-associate with closest drain within 350m
    associated_drain_id = report_in.drain_id
    all_drains = store.list_drains()
    if not associated_drain_id:
        closest = find_closest_drain(report_in.location.lat, report_in.location.lng, all_drains)
        if closest:
            associated_drain_id = closest.id

    # Check for potential duplicates
    is_dup, duplicate_of_id = check_for_duplicate(report_in, existing_reports)

    # Generate unique report ID
    random_suffix = uuid.uuid4().hex[:6].upper()
    report_id = f"REP-MUM-{random_suffix}"
    now_str = datetime.now(timezone.utc).isoformat()

    # Citizen reports start as 'unverified'
    initial_status: ReportStatus = "unverified" if report_in.is_citizen else "reviewed"

    linked_task_id = None

    # If critical / high severity and not a duplicate, generate an inspection task automatically
    if associated_drain_id and not is_dup and report_in.severity in ("critical", "high"):
        task_id = f"TSK-MUM-{uuid.uuid4().hex[:5].upper()}"
        drain = store.get_drain(associated_drain_id)
        current_score = drain.risk_assessment.total_score if (drain and drain.risk_assessment) else 75
        task = InspectionTaskResponse(
            id=task_id,
            drain_id=associated_drain_id,
            report_id=report_id,
            title=f"Incident Triage: {report_in.issue_type} at {report_in.location.address}",
            issue_description=report_in.description,
            risk_score=current_score,
            risk_category="Critical" if current_score >= 80 else "High",
            priority="P1 - Critical" if report_in.severity == "critical" else "P2 - High",
            status="Reported",
            assigned_crew="Unassigned",
            created_at=now_str,
            updated_at=now_str,
            due_date=now_str,
            notes="Auto-generated from high-severity blockage incident report.",
            verification_photo_url=report_in.photo_url,
        )
        store.create_task(task)
        linked_task_id = task_id

    report_record = IncidentReportResponse(
        id=report_id,
        drain_id=associated_drain_id,
        location=report_in.location,
        issue_type=report_in.issue_type,
        severity=report_in.severity,
        description=report_in.description,
        photo_url=report_in.photo_url,
        reporter_name=report_in.reporter_name or "Citizen Reporter",
        status=initial_status,
        is_citizen=report_in.is_citizen,
        is_duplicate=is_dup,
        duplicate_of=duplicate_of_id,
        created_at=now_str,
        linked_task_id=linked_task_id,
    )

    created_report = store.create_report(report_record)

    # Publish immediate notification for critical/high severity reports
    if created_report.severity in ("critical", "high"):
        notification_service.notify_critical_incident(
            report_id=created_report.id,
            drain_id=created_report.drain_id,
            issue_type=created_report.issue_type,
            address=created_report.location.address,
        )

    # Recalculate risk on the affected drain
    if associated_drain_id:
        target_drain = store.get_drain(associated_drain_id)
        if target_drain:
            target_drain.active_report_count += 1
            has_photo = bool(report_in.photo_url)
            new_assessment = calculate_risk(
                silt_level_percent=target_drain.telemetry.silt_level_percent,
                rainfall_rate_mm_h=0.0,
                elevation_meters=target_drain.elevation_meters,
                exposure_tier=target_drain.exposure_tier,
                active_reports_count=target_drain.active_report_count,
                has_verified_report=target_drain.has_verified_report,
                has_photo=has_photo,
            )
            target_drain.risk_assessment = new_assessment
            target_drain.status = "Reported"
            store.update_drain(target_drain)

    return created_report
