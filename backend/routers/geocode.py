from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
import httpx

from services.open_meteo import search_locations
from models import GeoSearchResponse, GeoResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.get("", response_model=GeoSearchResponse)
async def geocode(
    q: str = Query(..., min_length=1, max_length=200),
    count: int = Query(10, ge=1, le=20),
):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query must not be blank")
    try:
        return await search_locations(q.strip(), count)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Geocoding failed: {exc}")


@router.get("/current-location")
async def get_current_location(request: Request):
    """
    Detect user's current location via IP geolocation fallback.
    Used when browser GPS is denied, disabled at the OS level, or unavailable.
    """
    endpoints = [
        "http://ip-api.com/json/",
        "https://ipwho.is/",
        "https://freeipapi.com/api/json",
    ]
    async with httpx.AsyncClient(timeout=6.0) as client:
        for ep in endpoints:
            try:
                resp = await client.get(ep)
                if resp.status_code == 200:
                    data = resp.json()
                    # Handle ip-api.com
                    if "lat" in data and "lon" in data and data.get("status") != "fail":
                        city = data.get("city") or "Local Area"
                        country = data.get("country") or ""
                        region = data.get("regionName") or data.get("region") or ""
                        disp = ", ".join(p for p in [city, region, country] if p)
                        return {
                            "name": city,
                            "country": country,
                            "region": region,
                            "latitude": float(data["lat"]),
                            "longitude": float(data["lon"]),
                            "timezone": data.get("timezone"),
                            "display_name": disp,
                            "source": "ip_geolocation",
                        }
                    # Handle ipwho.is
                    if "latitude" in data and "longitude" in data and data.get("success") is not False:
                        city = data.get("city") or "Local Area"
                        country = data.get("country") or ""
                        region = data.get("region") or ""
                        disp = ", ".join(p for p in [city, region, country] if p)
                        return {
                            "name": city,
                            "country": country,
                            "region": region,
                            "latitude": float(data["latitude"]),
                            "longitude": float(data["longitude"]),
                            "timezone": (data.get("timezone") or {}).get("id"),
                            "display_name": disp,
                            "source": "ip_geolocation",
                        }
            except Exception as e:
                logger.warning("IP geolocation endpoint %s failed: %s", ep, e)

    # Fallback default location if network fails (Kyoto - Imperial capital)
    return {
        "name": "Kyoto",
        "country": "Japan",
        "region": "Kyoto Prefecture",
        "latitude": 35.0116,
        "longitude": 135.7681,
        "timezone": "Asia/Tokyo",
        "display_name": "Kyoto, Japan (Default)",
        "source": "default_fallback",
    }


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    """
    Reverse geocode latitude and longitude to a human-readable city/region name
    using OpenStreetMap Nominatim.
    """
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {"User-Agent": "TsukuyomiWatch-Watchtower/1.0 (celestial-guide)"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                addr = data.get("address", {})
                city = (
                    addr.get("city")
                    or addr.get("town")
                    or addr.get("village")
                    or addr.get("municipality")
                    or addr.get("county")
                    or addr.get("suburb")
                    or "Local Sky"
                )
                country = addr.get("country") or ""
                state = addr.get("state") or addr.get("province") or ""
                disp_parts = [p for p in [city, state, country] if p]
                display_name = ", ".join(disp_parts) if disp_parts else data.get("display_name", f"{lat:.2f}°, {lon:.2f}°")
                return {
                    "name": city,
                    "country": country,
                    "region": state,
                    "latitude": lat,
                    "longitude": lon,
                    "display_name": display_name,
                }
    except Exception as exc:
        logger.warning("Reverse geocoding failed: %s", exc)

    return {
        "name": "Current Location",
        "country": "",
        "region": "",
        "latitude": lat,
        "longitude": lon,
        "display_name": f"{lat:.4f}°N, {lon:.4f}°E",
    }
