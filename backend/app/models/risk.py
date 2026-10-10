from pydantic import BaseModel, Field
from typing import Literal

RiskCategory = Literal["Low", "Medium", "High", "Critical"]


class FactorBreakdown(BaseModel):
    raw_value: float = Field(..., description="Raw metric value (e.g. silt percentage, rainfall rate)")
    normalized_score: float = Field(..., ge=0.0, le=100.0, description="Normalized score 0-100")
    weight: float = Field(..., ge=0.0, le=1.0, description="Weight proportion (0.0 to 1.0)")
    weighted_score: float = Field(..., description="Normalized score * weight")


class RiskFactors(BaseModel):
    blockage_severity: FactorBreakdown
    rainfall_risk: FactorBreakdown
    exposure: FactorBreakdown
    report_confidence: FactorBreakdown
    data_freshness: FactorBreakdown


class RiskAssessment(BaseModel):
    total_score: int = Field(..., ge=0, le=100, description="Deterministic risk score 0-100")
    category: RiskCategory
    factors: RiskFactors
    explanation: str
    prototype_disclaimer: str = (
        "Prototype heuristic risk assessment for municipal triage prioritization; "
        "not a validated hydrological flood-prediction model."
    )
