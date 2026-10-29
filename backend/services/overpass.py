"""
Overpass API client for discovering nearby stargazing-candidate locations.

Queries OpenStreetMap data for parks, viewpoints, observatories, etc.
Results are cached in memory (TTL = 30 minutes) to avoid repeated requests.

Overpass endpoint: https://overpass-api.de/api/interpreter
Fallback mirror  : https://overpass.kumi.systems/api/interpreter

Usage policy: https://wiki.openstreetmap.org/wiki/Overpass_API#Limitations
"""
from __future__ import annotations

import asyncio
import logging
import math
import time
from typing import Any, Optional

import httpx
from cachetools import TTLCache

from models import NearbyLocation, NearbyResponse

logger = logging.getLogger(__name__)

# In-memory cache: key=(lat_round, lon_round, radius_km) → NearbyResponse
_cache: TTLCache = TTLCache(maxsize=256, ttl=1800)  # 30 min TTL

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# OSM tags considered relevant for stargazing candidate search
OVERPASS_QUERY_TEMPLATE = """
[out:json][timeout:25];
(
  node["leisure"="nature_reserve"](around:{radius_m},{lat},{lon});
  way["leisure"="nature_reserve"](around:{radius_m},{lat},{lon});
  node["leisure"="park"](around:{radius_m},{lat},{lon});
  way["leisure"="park"](around:{radius_m},{lat},{lon});
  node["tourism"="viewpoint"](around:{radius_m},{lat},{lon});
  node["man_made"="observatory"](around:{radius_m},{lat},{lon});
  way["man_made"="observatory"](around:{radius_m},{lat},{lon});
  node["amenity"="observatory"](around:{radius_m},{lat},{lon});
  node["landuse"="meadow"](around:{radius_m},{lat},{lon});
  way["landuse"="meadow"](around:{radius_m},{lat},{lon});
  node["natural"="peak"](around:{radius_m},{lat},{lon});
  node["natural"="saddle"](around:{radius_m},{lat},{lon});
  node["natural"="plateau"](around:{radius_m},{lat},{lon});
  way["natural"="heath"](around:{radius_m},{lat},{lon});
);
out center tags 40;
"""


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _directions_url(lat: float, lon: float) -> str:
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}"


def _categorize(tags: dict[str, Any]) -> tuple[str, str, bool]:
    """Return (category, subcategory, is_observatory)."""
    leisure    = tags.get("leisure", "")
    tourism    = tags.get("tourism", "")
    man_made   = tags.get("man_made", "")
    amenity    = tags.get("amenity", "")
    natural    = tags.get("natural", "")
    landuse    = tags.get("landuse", "")

    if man_made == "observatory" or amenity == "observatory":
        return "Observatory", "Astronomical Observatory", True
    if tourism == "viewpoint":
        return "Viewpoint", tags.get("viewpoint", "scenic"), False
    if natural in ("peak", "saddle", "plateau"):
        return "Natural Feature", natural.title(), False
    if leisure == "nature_reserve":
        return "Nature Reserve", "", False
    if leisure == "park":
        return "Park", "", False
    if natural == "heath":
        return "Heath / Moorland", "", False
    if landuse == "meadow":
        return "Meadow", "", False
    return "Open Area", "", False


def _suitability_note(category: str, is_observatory: bool) -> str:
    base = (
        "Potential stargazing candidate from OSM. "
        "Verify accessibility, opening hours, local regulations, and safety before visiting. "
    )
    if is_observatory:
        return "Verified astronomical observatory. Check public access and visiting hours on their official website. " + base
    if category == "Viewpoint":
        return "Elevated viewpoint — may offer good horizon clearance. " + base
    if "Nature Reserve" in category:
        return "Nature reserve — usually darker than urban areas. Check night access rules. " + base
    if "Natural Feature" in category:
        return "Natural summit or plateau — potentially excellent dark-sky access. Check trail safety. " + base
    return base


def _parse_element(el: dict[str, Any], center_lat: float, center_lon: float) -> Optional[NearbyLocation]:
    tags = el.get("tags") or {}
    name = tags.get("name") or tags.get("name:en") or ""
    if not name:
        name = tags.get("leisure") or tags.get("tourism") or tags.get("natural") or tags.get("man_made") or "Unnamed location"
        name = name.replace("_", " ").title()

    # Coordinates: nodes have lat/lon directly; ways have center
    if el.get("type") == "node":
        lat = el.get("lat")
        lon = el.get("lon")
    else:
        center = el.get("center") or {}
        lat = center.get("lat")
        lon = center.get("lon")

    if lat is None or lon is None:
        return None

    dist = _haversine_km(center_lat, center_lon, lat, lon)
    category, subcategory, is_obs = _categorize(tags)

    return NearbyLocation(
        osm_id=el.get("id"),
        name=name,
        category=category,
        subcategory=subcategory or None,
        latitude=lat,
        longitude=lon,
        distance_km=round(dist, 2),
        tags={k: v for k, v in tags.items() if k not in ("name",)},
        is_observatory=is_obs,
        directions_url=_directions_url(lat, lon),
        suitability_note=_suitability_note(category, is_obs),
    )


async def _query_overpass(query: str) -> list[dict[str, Any]]:
    """Try each Overpass endpoint in order, return elements list."""
    last_exc: Exception = RuntimeError("No Overpass endpoint responded")
    for url in OVERPASS_ENDPOINTS:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, data={"data": query})
                resp.raise_for_status()
                data = resp.json()
                return data.get("elements", [])
        except Exception as exc:
            logger.warning("Overpass endpoint %s failed: %s", url, exc)
            last_exc = exc
            await asyncio.sleep(1)
    raise last_exc


async def get_nearby_locations(
    lat: float,
    lon: float,
    radius_km: float = 25.0,
) -> NearbyResponse:
    """Return nearby stargazing-candidate locations from OSM via Overpass."""
    radius_km = max(1.0, min(radius_km, 100.0))
    cache_key = (round(lat, 2), round(lon, 2), radius_km)

    if cache_key in _cache:
        logger.info("Returning cached Overpass result for %s", cache_key)
        cached: NearbyResponse = _cache[cache_key]
        return cached.model_copy(update={"cached": True})

    query = OVERPASS_QUERY_TEMPLATE.format(
        radius_m=int(radius_km * 1000),
        lat=lat,
        lon=lon,
    )

    try:
        elements = await _query_overpass(query)
    except Exception as exc:
        return NearbyResponse(
            locations=[],
            radius_km=radius_km,
            center_lat=lat,
            center_lon=lon,
            cached=False,
            error=f"Overpass API unavailable: {exc}. Try again in a moment.",
        )

    locations: list[NearbyLocation] = []
    seen_names: set[str] = set()
    for el in elements:
        loc = _parse_element(el, lat, lon)
        if loc is None:
            continue
        dedup_key = f"{loc.name}_{round(loc.latitude,3)}_{round(loc.longitude,3)}"
        if dedup_key in seen_names:
            continue
        seen_names.add(dedup_key)
        locations.append(loc)

    # Sort: observatories first, then by distance
    locations.sort(key=lambda l: (not l.is_observatory, l.distance_km))
    locations = locations[:30]  # cap at 30

    result = NearbyResponse(
        locations=locations,
        radius_km=radius_km,
        center_lat=lat,
        center_lon=lon,
        cached=False,
    )
    _cache[cache_key] = result
    return result
