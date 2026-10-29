"""
Open-Meteo API client (weather + geocoding).
Docs: https://open-meteo.com/en/docs
      https://open-meteo.com/en/docs/geocoding-api
"""
from __future__ import annotations

import datetime
from typing import Any, Optional

import httpx

from models import (
    CurrentConditions,
    GeoResult,
    GeoSearchResponse,
    HourlyForecast,
    SunriseSunset,
    WeatherResponse,
)

WEATHER_BASE  = "https://api.open-meteo.com/v1/forecast"
GEO_BASE      = "https://geocoding-api.open-meteo.com/v1/search"

# WMO weather interpretation codes → human description
WMO_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _wmo_label(code: int) -> str:
    return WMO_CODES.get(code, f"Code {code}")


async def search_locations(query: str, count: int = 10) -> GeoSearchResponse:
    """Search for locations by name using Open-Meteo Geocoding API."""
    params = {
        "name": query,
        "count": count,
        "language": "en",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GEO_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    raw_results: list[dict[str, Any]] = data.get("results") or []
    results = [
        GeoResult(
            id=r["id"],
            name=r["name"],
            country=r.get("country", ""),
            country_code=r.get("country_code", ""),
            latitude=r["latitude"],
            longitude=r["longitude"],
            admin1=r.get("admin1"),
            timezone=r.get("timezone"),
            population=r.get("population"),
            elevation=r.get("elevation"),
        )
        for r in raw_results
    ]
    return GeoSearchResponse(results=results)


async def get_weather(
    lat: float,
    lon: float,
    timezone: str = "auto",
    forecast_days: int = 2,
) -> WeatherResponse:
    """Fetch current conditions + hourly forecast from Open-Meteo."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": timezone,
        "forecast_days": forecast_days,
        # Current
        "current": ",".join([
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "cloud_cover",
            "visibility",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation",
            "precipitation_probability",
            "weather_code",
            "is_day",
        ]),
        # Hourly
        "hourly": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "cloud_cover",
            "visibility",
            "precipitation_probability",
            "precipitation",
            "wind_speed_10m",
            "weather_code",
        ]),
        # Daily (sunrise/sunset)
        "daily": "sunrise,sunset",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(WEATHER_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    cur_raw = data["current"]
    hrly    = data["hourly"]
    daily   = data.get("daily")

    current = CurrentConditions(
        time=cur_raw["time"],
        temperature_2m=cur_raw["temperature_2m"],
        apparent_temperature=cur_raw.get("apparent_temperature"),
        relative_humidity_2m=cur_raw["relative_humidity_2m"],
        cloud_cover=cur_raw["cloud_cover"],
        visibility=cur_raw.get("visibility", 0.0),
        wind_speed_10m=cur_raw.get("wind_speed_10m", 0.0),
        wind_direction_10m=cur_raw.get("wind_direction_10m"),
        precipitation=cur_raw.get("precipitation"),
        precipitation_probability=cur_raw.get("precipitation_probability"),
        weather_code=cur_raw["weather_code"],
        weather_description=_wmo_label(cur_raw["weather_code"]),
        is_day=cur_raw.get("is_day"),
    )

    hourly = HourlyForecast(
        time=hrly["time"],
        temperature_2m=hrly["temperature_2m"],
        relative_humidity_2m=hrly["relative_humidity_2m"],
        cloud_cover=hrly["cloud_cover"],
        visibility=hrly["visibility"],
        precipitation_probability=hrly.get("precipitation_probability", [None] * len(hrly["time"])),
        precipitation=hrly.get("precipitation", [None] * len(hrly["time"])),
        wind_speed_10m=hrly["wind_speed_10m"],
        weather_code=hrly["weather_code"],
    )

    daily_obj: Optional[SunriseSunset] = None
    if daily and daily.get("sunrise") and daily.get("sunset"):
        try:
            daily_obj = SunriseSunset(
                sunrise=daily["sunrise"][0],
                sunset=daily["sunset"][0],
            )
        except (IndexError, KeyError):
            pass

    return WeatherResponse(
        latitude=data["latitude"],
        longitude=data["longitude"],
        timezone=data["timezone"],
        timezone_abbreviation=data["timezone_abbreviation"],
        elevation=data["elevation"],
        current=current,
        hourly=hourly,
        daily=daily_obj,
        fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )
