import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

MUMBAI_LATITUDE = 19.0760
MUMBAI_LONGITUDE = 72.8777
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class HourlyForecastPoint(BaseModel):
    time: str = Field(..., description="Forecast hour ISO timestamp")
    precipitation_mm: float = Field(..., description="Predicted precipitation in mm/h")
    rain_probability_pct: Optional[int] = Field(default=None)


class WeatherForecastResponse(BaseModel):
    location_name: str = "Mumbai Metropolitan Region (BMC Catchments)"
    latitude: float = MUMBAI_LATITUDE
    longitude: float = MUMBAI_LONGITUDE
    current_rain_mm_h: float
    current_temp_c: float
    weather_code: int
    weather_condition: str
    is_live_feed: bool
    fetched_at: str
    hourly_forecast: List[HourlyForecastPoint]
    max_forecast_rain_mm_h: float
    peak_forecast_time: Optional[str] = None


# In-memory cache for live weather (5 min TTL)
_cached_weather: Optional[WeatherForecastResponse] = None
_cache_timestamp: Optional[float] = None
CACHE_TTL_SECONDS = 300.0


def _wmo_code_to_condition(code: int) -> str:
    """Map WMO weather code to clear human-readable weather condition."""
    if code == 0:
        return "Clear Sky"
    elif code in (1, 2, 3):
        return "Partly Cloudy"
    elif code in (45, 48):
        return "Foggy / Mist"
    elif code in (51, 53, 55):
        return "Light Monsoon Drizzle"
    elif code in (61, 63):
        return "Moderate Monsoon Rain"
    elif code in (65,):
        return "Heavy Monsoon Downpour"
    elif code in (80, 81, 82):
        return "Violent Monsoon Rain Showers"
    elif code in (95, 96, 99):
        return "Severe Thunderstorm / Cloudburst"
    return "Overcast Monsoon"


def _generate_fallback_weather() -> WeatherForecastResponse:
    """Deterministic fallback weather in case Open-Meteo is unreachable."""
    now = datetime.now(timezone.utc)
    now_str = now.isoformat()
    hourly: List[HourlyForecastPoint] = []
    # Generate 6 hours of typical Mumbai monsoon drizzle baseline
    for i in range(6):
        future_hour = now.replace(minute=0, second=0).isoformat()
        hourly.append(
            HourlyForecastPoint(
                time=f"+{i+1}h",
                precipitation_mm=round(0.5 + (0.3 * (i % 3)), 1),
            )
        )

    return WeatherForecastResponse(
        current_rain_mm_h=0.5,
        current_temp_c=31.5,
        weather_code=51,
        weather_condition="Monsoon Coastal Atmosphere (Offline Model)",
        is_live_feed=False,
        fetched_at=now_str,
        hourly_forecast=hourly,
        max_forecast_rain_mm_h=1.1,
        peak_forecast_time="+2h",
    )


def fetch_live_mumbai_weather(force_refresh: bool = False) -> WeatherForecastResponse:
    """
    Fetch live Mumbai weather and hourly forecast from Open-Meteo.
    Zero-config, no API key required, with 5-minute memory caching.
    """
    global _cached_weather, _cache_timestamp
    import time

    now_ts = time.time()
    if not force_refresh and _cached_weather and _cache_timestamp and (now_ts - _cache_timestamp < CACHE_TTL_SECONDS):
        return _cached_weather

    try:
        params = {
            "latitude": MUMBAI_LATITUDE,
            "longitude": MUMBAI_LONGITUDE,
            "current": "precipitation,rain,weather_code,temperature_2m",
            "hourly": "precipitation",
            "forecast_days": 1,
            "timezone": "Asia/Kolkata",
        }
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(OPEN_METEO_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current_data = data.get("current", {})
                hourly_data = data.get("hourly", {})

                current_rain = float(current_data.get("precipitation") or current_data.get("rain") or 0.0)
                current_temp = float(current_data.get("temperature_2m") or 32.0)
                weather_code = int(current_data.get("weather_code") or 0)
                condition = _wmo_code_to_condition(weather_code)

                # Parse next 8 hours forecast
                times = hourly_data.get("time", [])
                precips = hourly_data.get("precipitation", [])
                hourly_points: List[HourlyForecastPoint] = []
                max_rain = current_rain
                peak_time = None

                # Find index closest to current hour
                curr_hour_str = current_data.get("time", "")[:13]
                start_idx = 0
                for idx, t in enumerate(times):
                    if t.startswith(curr_hour_str):
                        start_idx = idx
                        break

                for i in range(start_idx, min(start_idx + 8, len(times))):
                    t = times[i]
                    p = float(precips[i] if i < len(precips) else 0.0)
                    hourly_points.append(
                        HourlyForecastPoint(
                            time=t[-5:],  # HH:MM
                            precipitation_mm=p,
                        )
                    )
                    if p > max_rain:
                        max_rain = p
                        peak_time = t[-5:]

                forecast_obj = WeatherForecastResponse(
                    current_rain_mm_h=round(current_rain, 2),
                    current_temp_c=round(current_temp, 1),
                    weather_code=weather_code,
                    weather_condition=condition,
                    is_live_feed=True,
                    fetched_at=datetime.now(timezone.utc).isoformat(),
                    hourly_forecast=hourly_points,
                    max_forecast_rain_mm_h=round(max_rain, 2),
                    peak_forecast_time=peak_time or "Now",
                )

                _cached_weather = forecast_obj
                _cache_timestamp = now_ts
                return forecast_obj
            else:
                logger.warning("Open-Meteo returned status %d. Using fallback.", resp.status_code)
    except Exception as exc:
        logger.warning("Failed to fetch live weather from Open-Meteo (%s). Using fallback.", exc)

    return _cached_weather or _generate_fallback_weather()
