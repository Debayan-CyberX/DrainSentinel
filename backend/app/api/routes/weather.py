from fastapi import APIRouter, HTTPException, Query
from app.repositories.memory_store import store
from app.services.weather import (
    fetch_live_mumbai_weather,
    WeatherForecastResponse,
)
from app.services.prediction import (
    DrainPrediction,
    CityWidePredictiveSummary,
    calculate_drain_prediction,
    generate_citywide_predictive_summary,
)

router = APIRouter(prefix="/weather", tags=["Meteorology & Predictive Analytics"])


@router.get("/live", response_model=WeatherForecastResponse)
def get_live_weather(
    refresh: bool = Query(False, description="Bypass cache and force-fetch fresh Open-Meteo feed")
) -> WeatherForecastResponse:
    """
    Retrieve real-time meteorological observations and hourly precipitation forecast for Mumbai.
    """
    return fetch_live_mumbai_weather(force_refresh=refresh)


@router.get("/predictive-summary", response_model=CityWidePredictiveSummary)
def get_predictive_summary(
    simulated_rain_override: float = Query(
        None, description="Optional rain rate override in mm/h to test predictive scenarios"
    )
) -> CityWidePredictiveSummary:
    """
    Synthesize real-time weather forecasts with historical drainage vulnerability
    to calculate city-wide Time-to-Overflow (TTO) and identify imminent flood hotspots.
    """
    weather = fetch_live_mumbai_weather()
    if simulated_rain_override is not None and simulated_rain_override >= 0.0:
        weather = weather.model_copy(
            update={
                "current_rain_mm_h": simulated_rain_override,
                "max_forecast_rain_mm_h": max(weather.max_forecast_rain_mm_h, simulated_rain_override),
            }
        )

    drains = store.list_drains()
    return generate_citywide_predictive_summary(drains=drains, weather=weather)


@router.get("/drains/{drain_id}/prediction", response_model=DrainPrediction)
def get_drain_prediction(drain_id: str) -> DrainPrediction:
    """
    Retrieve predictive overflow analysis and time-to-waterlogging for a specific drain asset.
    """
    drain = store.get_drain(drain_id)
    if not drain:
        raise HTTPException(
            status_code=404,
            detail=f"Drain asset '{drain_id}' not found in drainage registry.",
        )
    weather = fetch_live_mumbai_weather()
    return calculate_drain_prediction(drain=drain, weather=weather)
