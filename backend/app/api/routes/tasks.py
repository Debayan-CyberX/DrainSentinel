import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.task import (
    InspectionTaskCreate,
    InspectionTaskUpdate,
    InspectionTaskResponse,
    VALID_TRANSITIONS,
    TaskStatus,
)
from app.repositories.memory_store import store
from app.services.notifications import notification_service

router = APIRouter(prefix="/tasks", tags=["Inspection Tasks"])


@router.get("", response_model=List[InspectionTaskResponse])
def list_tasks(
    status: Optional[str] = Query(None, description="Filter by task status"),
    drain_id: Optional[str] = Query(None, description="Filter by drain asset ID"),
) -> List[InspectionTaskResponse]:
    """
    List prioritised inspection tasks and work orders.
    Ordered by risk score descending (highest priority first).
    """
    return store.list_tasks(status=status, drain_id=drain_id)


@router.post("", response_model=InspectionTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: InspectionTaskCreate) -> InspectionTaskResponse:
    """
    Create a new inspection task / work order for a drain asset.
    Initial state: 'Reported'.
    """
    drain = store.get_drain(task_in.drain_id)
    if not drain:
        raise HTTPException(
            status_code=404,
            detail=f"Drain asset with ID '{task_in.drain_id}' does not exist.",
        )

    task_id = f"TSK-MUM-{uuid.uuid4().hex[:5].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    risk_score = drain.risk_assessment.total_score if drain.risk_assessment else 50
    risk_category = drain.risk_assessment.category if drain.risk_assessment else "Medium"

    priority = task_in.priority
    if not priority:
        if risk_score >= 80:
            priority = "P1 - Critical"
        elif risk_score >= 60:
            priority = "P2 - High"
        elif risk_score >= 35:
            priority = "P3 - Standard"
        else:
            priority = "P4 - Routine"

    new_task = InspectionTaskResponse(
        id=task_id,
        drain_id=task_in.drain_id,
        report_id=task_in.report_id,
        title=task_in.title,
        issue_description=task_in.issue_description,
        risk_score=risk_score,
        risk_category=risk_category,
        priority=priority,
        status="Reported",
        assigned_crew=task_in.assigned_crew or "Unassigned",
        created_at=now_str,
        updated_at=now_str,
        due_date=now_str,
        notes=task_in.notes,
        verification_photo_url=None,
    )

    created = store.create_task(new_task)
    drain.status = "Reported"
    store.update_drain(drain)
    return created


@router.patch("/{task_id}", response_model=InspectionTaskResponse)
def update_task_status(task_id: str, update_in: InspectionTaskUpdate) -> InspectionTaskResponse:
    """
    Update inspection task details and transition status along the municipal workflow:
    Reported -> Risk Assessed -> Assigned -> Inspected -> Repair in Progress -> Resolved -> Verified.

    Validates that state transitions follow allowed progression.
    """
    existing_task = store.get_task(task_id)
    if not existing_task:
        raise HTTPException(
            status_code=404,
            detail=f"Inspection task '{task_id}' not found.",
        )

    # Validate state transition if status update is requested
    if update_in.status and update_in.status != existing_task.status:
        current_status = existing_task.status
        target_status = update_in.status
        allowed_next = VALID_TRANSITIONS.get(current_status, [])

        if target_status not in allowed_next:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid state transition from '{current_status}' to '{target_status}'. "
                    f"Allowed next states from '{current_status}': {allowed_next}"
                ),
            )

    updated_task = store.update_task(task_id, update_in)
    if not updated_task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' could not be updated.")

    if update_in.status == "Assigned" or (update_in.assigned_crew and existing_task.status == "Assigned"):
        notification_service.notify_emergency_task(
            task_id=updated_task.id,
            drain_id=updated_task.drain_id,
            title=updated_task.title,
            crew=updated_task.assigned_crew,
        )

    return updated_task
