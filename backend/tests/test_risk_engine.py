import pytest
from app.services.risk_engine import (
    calculate_risk,
    WEIGHT_BLOCKAGE,
    WEIGHT_RAINFALL,
    WEIGHT_EXPOSURE,
    WEIGHT_CONFIDENCE,
    WEIGHT_FRESHNESS,
)


def test_weights_sum_to_one():
    total_weights = (
        WEIGHT_BLOCKAGE
        + WEIGHT_RAINFALL
        + WEIGHT_EXPOSURE
        + WEIGHT_CONFIDENCE
        + WEIGHT_FRESHNESS
    )
    assert abs(total_weights - 1.0) < 1e-6
    assert WEIGHT_BLOCKAGE == 0.30
    assert WEIGHT_RAINFALL == 0.25
    assert WEIGHT_EXPOSURE == 0.20
    assert WEIGHT_CONFIDENCE == 0.15
    assert WEIGHT_FRESHNESS == 0.10


def test_critical_risk_category():
    # Severe silt (92%) at low elevation sag under heavy rainfall with critical transit exposure
    assessment = calculate_risk(
        silt_level_percent=92.0,
        rainfall_rate_mm_h=45.0,
        elevation_meters=4.8,
        exposure_tier="Critical Transit",
        active_reports_count=2,
        has_verified_report=True,
        hours_since_update=0.5,
    )
    assert assessment.total_score >= 80
    assert assessment.category == "Critical"
    assert "Critical priority" in assessment.explanation
    assert assessment.factors.blockage_severity.raw_value == 92.0
    assert assessment.factors.blockage_severity.weight == 0.30


def test_high_risk_category():
    assessment = calculate_risk(
        silt_level_percent=70.0,
        rainfall_rate_mm_h=15.0,
        elevation_meters=10.0,
        exposure_tier="High Density Commercial",
        active_reports_count=1,
        has_verified_report=False,
        hours_since_update=2.0,
    )
    assert 60 <= assessment.total_score <= 79
    assert assessment.category == "High"


def test_medium_risk_category():
    assessment = calculate_risk(
        silt_level_percent=45.0,
        rainfall_rate_mm_h=5.0,
        elevation_meters=12.0,
        exposure_tier="Standard",
        active_reports_count=0,
        has_verified_report=False,
        hours_since_update=5.0,
    )
    assert 35 <= assessment.total_score <= 59
    assert assessment.category == "Medium"


def test_low_risk_category():
    assessment = calculate_risk(
        silt_level_percent=15.0,
        rainfall_rate_mm_h=0.0,
        elevation_meters=18.0,
        exposure_tier="Standard",
        active_reports_count=0,
        has_verified_report=False,
        hours_since_update=1.0,
    )
    assert assessment.total_score < 35
    assert assessment.category == "Low"


def test_score_boundaries():
    # Min score boundary
    min_assessment = calculate_risk(
        silt_level_percent=0.0,
        rainfall_rate_mm_h=0.0,
        elevation_meters=50.0,
        exposure_tier="Standard",
        active_reports_count=0,
        has_verified_report=False,
        hours_since_update=120.0,
    )
    assert 0 <= min_assessment.total_score <= 100

    # Max score boundary
    max_assessment = calculate_risk(
        silt_level_percent=100.0,
        rainfall_rate_mm_h=100.0,
        elevation_meters=2.0,
        exposure_tier="Critical Transit",
        active_reports_count=5,
        has_verified_report=True,
        hours_since_update=0.1,
    )
    assert 0 <= max_assessment.total_score <= 100
    assert max_assessment.total_score >= 80


def test_explainability_and_disclaimer():
    assessment = calculate_risk(
        silt_level_percent=85.0,
        rainfall_rate_mm_h=30.0,
        elevation_meters=5.0,
        exposure_tier="Critical Transit",
    )
    assert len(assessment.explanation) > 10
    assert "Prototype heuristic risk assessment" in assessment.prototype_disclaimer
