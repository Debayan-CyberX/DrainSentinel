import math
from typing import Optional
from app.models.risk import FactorBreakdown, RiskFactors, RiskAssessment, RiskCategory

# Deterministic prototype weights
WEIGHT_BLOCKAGE = 0.30
WEIGHT_RAINFALL = 0.25
WEIGHT_EXPOSURE = 0.20
WEIGHT_CONFIDENCE = 0.15
WEIGHT_FRESHNESS = 0.10


def calculate_risk(
    silt_level_percent: float,
    rainfall_rate_mm_h: float = 0.0,
    elevation_meters: float = 12.0,
    exposure_tier: str = "Standard",
    active_reports_count: int = 0,
    has_verified_report: bool = False,
    hours_since_update: float = 1.0,
    has_photo: bool = False,
    is_tidal_locked: bool = False,
) -> RiskAssessment:
    """
    Deterministic, explainable 5-factor risk score engine for DrainSentinel.

    Scoring formula:
        Total Score = round(
            0.30 * S_blockage +
            0.25 * S_rainfall +
            0.20 * S_exposure +
            0.15 * S_confidence +
            0.10 * S_freshness
        )

    Risk Categories:
        - Critical: 80–100
        - High: 60–79
        - Medium: 35–59
        - Low: 0–34

    NOTE: The weights and normalization tables represent prototype assumptions
    calibrated for municipal triage prioritization, not a certified hydrodynamic
    flood-prediction model.
    """

    # 1. Blockage Severity (30%)
    raw_blockage = max(0.0, min(100.0, float(silt_level_percent)))
    norm_blockage = raw_blockage

    # 2. Rainfall & Waterlogging Risk (25%)
    # Mumbai drains are designed for ~25-50mm/h. Above 50mm/h causes severe waterlogging at low-lying sags.
    raw_rainfall = max(0.0, float(rainfall_rate_mm_h))
    rain_component = min(100.0, (raw_rainfall / 50.0) * 80.0)
    
    # Elevation vulnerability (subways & coastal sags under 8m AMSL face reverse tidal pressure)
    if elevation_meters <= 5.0:
        elev_component = 95.0
    elif elevation_meters <= 8.0:
        elev_component = 80.0
    elif elevation_meters <= 15.0:
        elev_component = 50.0
    else:
        elev_component = 20.0

    if is_tidal_locked:
        elev_component = min(100.0, elev_component + 15.0)

    norm_rainfall = min(100.0, (rain_component * 0.65) + (elev_component * 0.35))

    # 3. Exposure (20%)
    exposure_map = {
        "Critical Transit": 95.0,     # Railway subways (Milan, Andheri), Western Express Highway
        "Hospital Arterial": 90.0,    # KEM, Sion, Cooper hospital corridors
        "High Density Commercial": 75.0, # Dadar TT, BKC, Lower Parel financial district
        "Dense Residential": 55.0,    # Kurla, Chembur, Dharavi lanes
        "Standard": 40.0,
    }
    norm_exposure = exposure_map.get(exposure_tier, 40.0)

    # 4. Report Confidence (15%)
    if has_verified_report:
        norm_confidence = 95.0
    elif active_reports_count >= 2:
        norm_confidence = 85.0
    elif active_reports_count == 1:
        norm_confidence = 65.0
        if has_photo:
            norm_confidence += 10.0
    else:
        norm_confidence = 40.0  # Baseline sensor only

    norm_confidence = min(100.0, norm_confidence)

    # 5. Data Freshness (10%)
    if hours_since_update <= 1.0:
        norm_freshness = 100.0
    elif hours_since_update <= 6.0:
        norm_freshness = 85.0
    elif hours_since_update <= 24.0:
        norm_freshness = 70.0
    elif hours_since_update <= 72.0:
        norm_freshness = 50.0
    else:
        norm_freshness = 25.0

    # Weighted calculation
    weighted_blockage = norm_blockage * WEIGHT_BLOCKAGE
    weighted_rainfall = norm_rainfall * WEIGHT_RAINFALL
    weighted_exposure = norm_exposure * WEIGHT_EXPOSURE
    weighted_confidence = norm_confidence * WEIGHT_CONFIDENCE
    weighted_freshness = norm_freshness * WEIGHT_FRESHNESS

    total = weighted_blockage + weighted_rainfall + weighted_exposure + weighted_confidence + weighted_freshness
    total_score = int(round(max(0.0, min(100.0, total))))

    # Risk Category mapping (calibrated with municipal SWD triage protocol)
    if total_score >= 80 or norm_blockage >= 85.0:
        category: RiskCategory = "Critical"
    elif total_score >= 60 or norm_blockage >= 70.0:
        category = "High"
    elif total_score >= 35 or norm_blockage >= 40.0:
        category = "Medium"
    else:
        category = "Low"

    # Explainability text
    drivers = []
    if norm_blockage >= 70:
        drivers.append(f"severe silt obstruction ({norm_blockage:.0f}%)")
    if norm_rainfall >= 60:
        drivers.append(f"high runoff risk at low elevation ({elevation_meters:.1f}m AMSL)")
    if norm_exposure >= 80:
        drivers.append(f"critical public infrastructure exposure ({exposure_tier})")
    if norm_confidence >= 80:
        drivers.append(f"corroborated field report activity")

    driver_str = "; ".join(drivers) if drivers else "nominal drainage flow margins"
    explanation = (
        f"{category} priority ({total_score}/100). Primary risk drivers: {driver_str}."
    )

    factors = RiskFactors(
        blockage_severity=FactorBreakdown(
            raw_value=raw_blockage,
            normalized_score=round(norm_blockage, 1),
            weight=WEIGHT_BLOCKAGE,
            weighted_score=round(weighted_blockage, 2),
        ),
        rainfall_risk=FactorBreakdown(
            raw_value=raw_rainfall,
            normalized_score=round(norm_rainfall, 1),
            weight=WEIGHT_RAINFALL,
            weighted_score=round(weighted_rainfall, 2),
        ),
        exposure=FactorBreakdown(
            raw_value=norm_exposure,
            normalized_score=round(norm_exposure, 1),
            weight=WEIGHT_EXPOSURE,
            weighted_score=round(weighted_exposure, 2),
        ),
        report_confidence=FactorBreakdown(
            raw_value=float(active_reports_count),
            normalized_score=round(norm_confidence, 1),
            weight=WEIGHT_CONFIDENCE,
            weighted_score=round(weighted_confidence, 2),
        ),
        data_freshness=FactorBreakdown(
            raw_value=hours_since_update,
            normalized_score=round(norm_freshness, 1),
            weight=WEIGHT_FRESHNESS,
            weighted_score=round(weighted_freshness, 2),
        ),
    )

    return RiskAssessment(
        total_score=total_score,
        category=category,
        factors=factors,
        explanation=explanation,
    )
