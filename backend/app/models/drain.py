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


class DrainageHistory(BaseModel):
    flood_events_past_3yr: int = Field(default=2, description="Recorded street-level inundation events over last 3 monsoon seasons")
    chronic_vulnerability_index: float = Field(default=0.5, ge=0.0, le=1.0, description="Chronic waterlogging index (0.0 to 1.0)")
    last_desilted_date: str = Field(default="2026-05-15", description="Date of last municipal mechanical desilting")
    days_since_desilting: int = Field(default=148, description="Days elapsed since last major cleanout")
    historical_silt_accumulation_rate_cm_month: float = Field(default=4.5, description="Average sediment deposition rate per month")
    trend: str = Field(default="Stable", description="'Escalating Vulnerability', 'Stable', 'Improving'")
    notable_flooding_hotspot_reason: Optional[str] = Field(default=None, description="Historical engineering factor (e.g. 'Railway sag below high-tide level')")


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
    drainage_history: DrainageHistory = Field(default_factory=DrainageHistory)


class DrainFilterParams(BaseModel):
    ward: Optional[str] = None
    risk_category: Optional[RiskCategory] = None
    status: Optional[str] = None
    search: Optional[str] = None
