from pydantic import BaseModel, Field
from typing import Optional, List, Literal

TaskStatus = Literal[
    "Reported",
    "Risk Assessed",
    "Assigned",
    "Inspected",
    "Repair in Progress",
    "Resolved",
    "Verified",
]

PriorityLevel = Literal["P1 - Critical", "P2 - High", "P3 - Standard", "P4 - Routine"]

VALID_TRANSITIONS: dict[TaskStatus, list[TaskStatus]] = {
    "Reported": ["Risk Assessed", "Assigned"],
    "Risk Assessed": ["Assigned"],
    "Assigned": ["Inspected"],
    "Inspected": ["Repair in Progress", "Resolved"],
    "Repair in Progress": ["Resolved"],
    "Resolved": ["Verified", "Repair in Progress"],
    "Verified": ["Reported"],  # Can re-open if subsequent silt surge observed
}


class InspectionTaskCreate(BaseModel):
    drain_id: str
    report_id: Optional[str] = None
    title: str
    issue_description: str
    priority: Optional[PriorityLevel] = None
    assigned_crew: Optional[str] = None
    notes: Optional[str] = None


class InspectionTaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    assigned_crew: Optional[str] = None
    priority: Optional[PriorityLevel] = None
    notes: Optional[str] = None
    verification_photo_url: Optional[str] = None


class InspectionTaskResponse(BaseModel):
    id: str
    drain_id: str
    report_id: Optional[str] = None
    title: str
    issue_description: str
    risk_score: int
    risk_category: str
    priority: PriorityLevel
    status: TaskStatus
    assigned_crew: Optional[str] = None
    created_at: str
    updated_at: str
    due_date: str
    notes: Optional[str] = None
    verification_photo_url: Optional[str] = None
