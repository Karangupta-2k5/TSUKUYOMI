"""FastAPI routers – weather, geocode, nearby, score."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from services.open_meteo import get_weather, search_locations
from models import WeatherResponse, GeoSearchResponse

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("", response_model=WeatherResponse)
async def weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    timezone: str = Query("auto"),
):
    try:
        return await get_weather(lat, lon, timezone)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {exc}")
