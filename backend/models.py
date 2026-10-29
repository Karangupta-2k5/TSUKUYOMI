"""Pydantic models / schemas for Tsukuyomi Watch – Watchtower module."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ─── Geocoding ───────────────────────────────────────────────────────────────

class GeoResult(BaseModel):
    id: int
    name: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    admin1: Optional[str] = None
    timezone: Optional[str] = None
    population: Optional[int] = None
    elevation: Optional[float] = None


class GeoSearchResponse(BaseModel):
    results: list[GeoResult]


# ─── Weather ─────────────────────────────────────────────────────────────────

class CurrentConditions(BaseModel):
    time: str
    temperature_2m: float
    apparent_temperature: Optional[float] = None
    relative_humidity_2m: int
    cloud_cover: int                  # %
    visibility: float                 # metres
    wind_speed_10m: float             # km/h
    wind_direction_10m: Optional[int] = None
    precipitation: Optional[float] = None
    precipitation_probability: Optional[int] = None
    weather_code: int
    weather_description: str
    is_day: Optional[int] = None


class HourlyForecast(BaseModel):
    time: list[str]
    temperature_2m: list[float]
    relative_humidity_2m: list[int]
    cloud_cover: list[int]
    visibility: list[float]
    precipitation_probability: list[Optional[int]]
    precipitation: list[Optional[float]]
    wind_speed_10m: list[float]
    weather_code: list[int]


class SunriseSunset(BaseModel):
    sunrise: str
    sunset: str


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    timezone_abbreviation: str
    elevation: float
    current: CurrentConditions
    hourly: HourlyForecast
    daily: Optional[SunriseSunset] = None
    fetched_at: str


# ─── Night Honor Score ────────────────────────────────────────────────────────

class ScoreComponent(BaseModel):
    name: str
    weight: float                    # 0–1
    raw_value: Optional[float]       # original measurement
    normalized: Optional[float]      # 0–1 after normalization
    contribution: Optional[float]    # points contributed (0–100 scale)
    available: bool
    note: str = ""


class NightHonorScore(BaseModel):
    score: float                     # 0–100
    label: str                       # Legendary / Excellent / Good / Fair / Poor / Clouded Out
    components: list[ScoreComponent]
    confidence: float                # 0–1 (1 = all components available)
    missing_components: list[str]
    recommendation: str
    disclaimer: str = (
        "This is a heuristic estimate, not a scientifically validated probability. "
        "Moon phase, atmospheric seeing, local obstructions, and personal equipment "
        "also affect the quality of an observation session."
    )


class HourlyScore(BaseModel):
    time: str
    score: float
    label: str
    cloud_cover: int
    visibility: float
    humidity: int


class BestTimeResponse(BaseModel):
    location_name: str
    date: str
    night_hours: list[HourlyScore]
    best_window_start: Optional[str]
    best_window_end: Optional[str]
    best_score: Optional[float]
    reasoning: str
    data_available: bool


# ─── Nearby Locations ─────────────────────────────────────────────────────────

class NearbyLocation(BaseModel):
    osm_id: Optional[int] = None
    name: str
    category: str
    subcategory: Optional[str] = None
    latitude: float
    longitude: float
    distance_km: float
    tags: dict = Field(default_factory=dict)
    is_observatory: bool = False
    directions_url: str
    suitability_note: str


class NearbyResponse(BaseModel):
    locations: list[NearbyLocation]
    radius_km: float
    center_lat: float
    center_lon: float
    source: str = "OpenStreetMap via Overpass API"
    disclaimer: str = (
        "OpenStreetMap data does not confirm that a location is dark, safe, accessible "
        "at night, or legally suitable for stargazing. Verify access, opening hours, "
        "local regulations, and safety before visiting."
    )
    cached: bool = False
    error: Optional[str] = None
