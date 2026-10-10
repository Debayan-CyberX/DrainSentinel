import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_live_weather_endpoint():
    """Verify live weather endpoint returns valid Mumbai meteorological readings."""
    resp = client.get("/api/v1/weather/live")
    assert resp.status_code == 200
    data = resp.json()

    assert "Mumbai" in data["location_name"]
    assert 18.5 <= data["latitude"] <= 19.5
    assert 72.5 <= data["longitude"] <= 73.5
    assert "current_rain_mm_h" in data
    assert "current_temp_c" in data
    assert "hourly_forecast" in data
    assert len(data["hourly_forecast"]) >= 6
    assert "weather_condition" in data


def test_predictive_summary_endpoint():
    """Verify predictive summary synthesizes live weather with drainage history."""
    resp = client.get("/api/v1/weather/predictive-summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_assets"] >= 25
    assert data["chronic_flood_hotspot_count"] >= 5
    assert 0.0 <= data["average_hydraulic_headroom_percent"] <= 100.0
    assert len(data["predictions"]) >= 25

    # Predictions must contain both hydraulic headroom and historical flood events
    first_pred = data["predictions"][0]
    assert "hydraulic_headroom_percent" in first_pred
    assert "historical_flood_events" in first_pred
    assert "critical_threshold_mm_h" in first_pred
    assert "predicted_waterlogging_stage" in first_pred


def test_single_drain_prediction():
    """Verify prediction for Milan Subway sag (DS-MUM-102)."""
    resp = client.get("/api/v1/weather/drains/DS-MUM-102/prediction")
    assert resp.status_code == 200
    data = resp.json()

    assert data["drain_id"] == "DS-MUM-102"
    assert "Milan Subway" in data["drain_name"]
    assert data["elevation_meters"] == 4.8
    assert data["historical_flood_events"] >= 10
    assert data["chronic_vulnerability_index"] >= 0.90
    # Headroom = 100 - 91% = ~9%
    assert data["hydraulic_headroom_percent"] <= 15.0


def test_simulated_cloudburst_escalates_tto():
    """Test that a simulated cloudburst (80 mm/h) pushes choked sags into Imminent Danger."""
    resp = client.get("/api/v1/weather/predictive-summary?simulated_rain_override=80.0")
    assert resp.status_code == 200
    data = resp.json()

    assert data["imminent_overflow_count"] >= 1
    # First drain should be in Imminent Danger with a TTO < 2.0 hours
    first = data["predictions"][0]
    assert first["predicted_waterlogging_stage"] == "Imminent Danger (< 2 hrs)"
    assert first["time_to_overflow_hours"] is not None
    assert first["time_to_overflow_hours"] <= 2.0
