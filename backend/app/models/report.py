from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

ReportSeverity = Literal["low", "medium", "high", "critical"]
ReportStatus = Literal["unverified", "reviewed", "triaged", "dismissed"]
IssueType = Literal[
    "Silt Accumulation",
    "Plastic & Trash Choke",
    "Broken / Missing Grate",
    "Water Stagnation / Sag",
    "Construction Debris Inflow",
    "Tree Root / Vegetative Obstruction",
    "Structural Wall Collapse",
]


class ReportLocation(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    address: str
    ward: Optional[str] = None


class IncidentReportCreate(BaseModel):
    drain_id: Optional[str] = Field(default=None, description="Optional Drain ID if identified on map")
    location: ReportLocation
    issue_type: IssueType
    severity: ReportSeverity
    description: str = Field(..., min_length=5, max_length=1000)
    photo_url: Optional[str] = None
    reporter_name: Optional[str] = Field(default="Citizen Reporter")
    reporter_contact: Optional[str] = None
    is_citizen: bool = Field(default=True, description="True for citizen 311 reports, False for official inspectors")


class IncidentReportResponse(BaseModel):
    id: str
    drain_id: Optional[str]
    location: ReportLocation
    issue_type: IssueType
    severity: ReportSeverity
    description: str
    photo_url: Optional[str]
    reporter_name: str
    status: ReportStatus = "unverified"
    is_citizen: bool = True
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None
    created_at: str
    reviewed_at: Optional[str] = None
    linked_task_id: Optional[str] = None
