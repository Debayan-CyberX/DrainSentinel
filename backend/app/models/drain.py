from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.risk import RiskAssessment, RiskCategory

DrainStatus = str  # 'operational', 'pending_inspection', 'assigned', 'in_progress', 'awaiting_verification', 'resolved'


class DrainLocation(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    address: str
    landmark: str
    ward: str = Field(..., description="BMC Administrative Ward e.g. 'F-North', 'K-East', 'L'")


class DrainTelemetry(BaseModel):
    silt_level_percent: float = Field(..., ge=0.0, le=100.0)
    water_level_cm: float = Field(..., ge=0.0)
    flow_velocity_mps: float = Field(..., ge=0.0)
    sensor_health: str = Field(default="online")
    last_updated: str


class Drain(BaseModel):
    id: str = Field(..., description="Unique Drain ID e.g. 'DS-MUM-101'")
    name: str
    location: DrainLocation
    catchment_zone: str
    drain_type: str = Field(..., description="e.g. 'Box Culvert', 'Curb Inlet', 'Drop Grate', 'Tidal Outfall'")
    pipe_diameter_mm: int
    elevation_meters: float
    exposure_tier: str = Field(default="Standard", description="'Critical Transit', 'Hospital Arterial', 'Commercial', 'Residential'")
    telemetry: DrainTelemetry
    status: str = Field(default="operational")
    active_report_count: int = Field(default=0)
    has_verified_report: bool = Field(default=False)
    risk_assessment: Optional[RiskAssessment] = None
    assigned_crew: Optional[str] = None


class DrainFilterParams(BaseModel):
    ward: Optional[str] = None
    risk_category: Optional[RiskCategory] = None
    status: Optional[str] = None
    search: Optional[str] = None
