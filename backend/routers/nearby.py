from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from services.overpass import get_nearby_locations
from models import NearbyResponse

router = APIRouter(prefix="/nearby", tags=["nearby"])

@router.get("", response_model=NearbyResponse)
async def nearby(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25.0, ge=1.0, le=100.0),
):
    try:
        return await get_nearby_locations(lat, lon, radius_km)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Nearby search failed: {exc}")
