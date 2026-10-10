from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.drain import Drain
from app.services.weather import WeatherForecastResponse


class DrainPrediction(BaseModel):
    drain_id: str
    drain_name: str
    ward: str
    elevation_meters: float
    current_silt_percent: float
    hydraulic_headroom_percent: float
    historical_flood_events: int
    chronic_vulnerability_index: float
    critical_threshold_mm_h: float
    forecast_rain_at_peak_mm_h: float
    time_to_overflow_hours: Optional[float] = Field(
        default=None,
        description="Predicted hours until street-level waterlogging if unaddressed"
    )
    predicted_waterlogging_stage: str = Field(
        default="Stable",
        description="'Imminent Danger (< 2 hrs)', 'High Risk (< 6 hrs)', 'Moderate Warning', 'Stable'"
    )
    preventive_recommendation: str
    projected_peak_risk_score: int


class CityWidePredictiveSummary(BaseModel):
    total_assets: int
    chronic_flood_hotspot_count: int
    imminent_overflow_count: int
    elevated_risk_count: int
    average_hydraulic_headroom_percent: float
    live_weather: WeatherForecastResponse
    predictions: List[DrainPrediction]


def calculate_drain_prediction(drain: Drain, weather: WeatherForecastResponse) -> DrainPrediction:
    """
    Predictive hydraulic calculation synthesizing real-time weather forecasts,
    current acoustic silt telemetry, and historical monsoon flooding records.
    """
    silt = drain.telemetry.silt_level_percent
    headroom = max(0.0, round(100.0 - silt, 1))
    elev = drain.elevation_meters
    hist = drain.drainage_history
    flood_events = hist.flood_events_past_3yr
    vulnerability = hist.chronic_vulnerability_index

    # Critical rain threshold: low sags choke with far less rain
    base_threshold = 45.0  # mm/h nominal capacity for Mumbai
    if elev <= 5.0:
        base_threshold = 20.0
    elif elev <= 7.0:
        base_threshold = 28.0
    elif elev <= 12.0:
        base_threshold = 38.0

    # Choked silt further lowers the effective threshold
    silt_penalty = (silt / 100.0) * 0.65
    critical_threshold = max(8.0, round(base_threshold * (1.0 - silt_penalty), 1))

    peak_rain = max(weather.current_rain_mm_h, weather.max_forecast_rain_mm_h)

    # Time to overflow calculation
    tto: Optional[float] = None
    if silt >= 80.0 and peak_rain >= 10.0:
        # Imminent overflow: conduit choked, runoff exceeds remaining 20% headroom
        tto = round(max(0.4, (headroom / max(1.0, peak_rain)) * 1.2), 1)
        stage = "Imminent Danger (< 2 hrs)"
        rec = f"Pre-storm emergency de-silting required immediately before peak rain ({peak_rain} mm/h)."
    elif silt >= 65.0 and peak_rain >= 5.0:
        tto = round(max(1.8, (headroom / max(1.0, peak_rain)) * 2.0), 1)
        stage = "High Risk (< 6 hrs)"
        rec = f"Schedule preventative jetting crew prior to forecasted {weather.peak_forecast_time} rain peak."
    elif peak_rain >= critical_threshold:
        tto = round(max(2.5, 4.0 - (vulnerability * 2.0)), 1)
        stage = "Moderate Warning"
        rec = "Monitor acoustic sensors closely; deploy standby suction truck if rainfall accelerates."
    else:
        stage = "Stable"
        rec = "Hydraulic headroom adequate for current meteorological forecast."

    # Projected peak risk score under forecast rain
    base_score = drain.risk_assessment.total_score if drain.risk_assessment else int(round(silt))
    rain_escalation = int(round((peak_rain / 50.0) * 20.0))
    hist_escalation = int(round(vulnerability * 12.0))
    projected_score = min(100, max(0, base_score + rain_escalation + (2 if flood_events >= 8 else 0)))

    return DrainPrediction(
        drain_id=drain.id,
        drain_name=drain.name,
        ward=drain.location.ward,
        elevation_meters=elev,
        current_silt_percent=silt,
        hydraulic_headroom_percent=headroom,
        historical_flood_events=flood_events,
        chronic_vulnerability_index=vulnerability,
        critical_threshold_mm_h=critical_threshold,
        forecast_rain_at_peak_mm_h=peak_rain,
        time_to_overflow_hours=tto,
        predicted_waterlogging_stage=stage,
        preventive_recommendation=rec,
        projected_peak_risk_score=projected_score,
    )


def generate_citywide_predictive_summary(
    drains: List[Drain], weather: WeatherForecastResponse
) -> CityWidePredictiveSummary:
    """
    Generate city-wide predictive ranking across all drainage assets.
    Orders assets by most urgent predicted time-to-overflow.
    """
    predictions = [calculate_drain_prediction(d, weather) for d in drains]

    # Sort: Imminent danger first, then ascending time-to-overflow, then highest projected score
    def sort_key(p: DrainPrediction):
        stage_priority = 0 if "Imminent" in p.predicted_waterlogging_stage else (
            1 if "High Risk" in p.predicted_waterlogging_stage else (
                2 if "Moderate" in p.predicted_waterlogging_stage else 3
            )
        )
        tto_val = p.time_to_overflow_hours if p.time_to_overflow_hours is not None else 999.0
        return (stage_priority, tto_val, -p.projected_peak_risk_score)

    sorted_predictions = sorted(predictions, key=sort_key)

    chronic_count = sum(1 for p in predictions if p.historical_flood_events >= 8 or p.chronic_vulnerability_index >= 0.75)
    imminent_count = sum(1 for p in predictions if "Imminent" in p.predicted_waterlogging_stage)
    elevated_count = sum(1 for p in predictions if "High Risk" in p.predicted_waterlogging_stage)
    avg_headroom = round(sum(p.hydraulic_headroom_percent for p in predictions) / max(1, len(predictions)), 1)

    return CityWidePredictiveSummary(
        total_assets=len(drains),
        chronic_flood_hotspot_count=chronic_count,
        imminent_overflow_count=imminent_count,
        elevated_risk_count=elevated_count,
        average_hydraulic_headroom_percent=avg_headroom,
        live_weather=weather,
        predictions=sorted_predictions,
    )
