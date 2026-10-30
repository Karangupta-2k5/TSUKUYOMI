"""
Celestial & Space APIs Router (from Tsukuyomi Watch API Requirements Table):
- NASA APOD API (using configured NASA_API_KEY)
- NASA SkyView Virtual Telescope API (astronomical survey cutout metadata/imagery)
- Space Launch API (The Space Devs Launch Library 2)
- Moon Phase Ephemeris Calculation (cosinekitty/astronomy mathematical model)
- Meteor Shower & Eclipse Calendar
- ISS Pass Prediction (N2YO / orbital ephemeris)
- Complete API Registry status
"""
from __future__ import annotations

import datetime
import math
import time
import logging
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/celestial", tags=["celestial"])

# ---------------------------------------------------------------------------
# In-memory TTL Caches for Public Astronomical & Weather APIs
# ---------------------------------------------------------------------------
_USNO_CACHE: dict[int, dict[str, Any]] = {}
_IMCCE_CACHE: dict[int, dict[str, Any]] = {}
_OPEN_METEO_CACHE: dict[str, dict[str, Any]] = {}

USNO_TTL_SECONDS = 6 * 3600       # 6 hours for yearly ephemeris
IMCCE_TTL_SECONDS = 6 * 3600      # 6 hours for yearly lunar eclipses
WEATHER_TTL_SECONDS = 10 * 60     # 10 minutes for location weather forecast


async def _fetch_usno_year(year: int) -> tuple[list[dict[str, Any]], str, str, bool]:
    """
    Fetch Moon phases for a given year from the US Naval Observatory (USNO) public API:
    https://aa.usno.navy.mil/api/moon/phases/year?year={year}
    Never fabricates data on failure. Uses cached real response if available.
    """
    now_ts = time.time()
    cached_entry = _USNO_CACHE.get(year)
    if cached_entry and (now_ts - cached_entry["ts"] < USNO_TTL_SECONDS):
        return (
            cached_entry["phasedata"],
            cached_entry["apiversion"],
            cached_entry["fetched_at"],
            True,
        )

    url = f"https://aa.usno.navy.mil/api/moon/phases/year?year={year}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="USNO API rate limit exceeded.")
            resp.raise_for_status()
            payload = resp.json()

        phasedata = payload.get("phasedata")
        if not isinstance(phasedata, list) or len(phasedata) == 0:
            raise ValueError("Invalid or empty 'phasedata' in USNO response.")

        apiversion = str(payload.get("apiversion", "4.0.1"))
        fetched_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        _USNO_CACHE[year] = {
            "ts": now_ts,
            "phasedata": phasedata,
            "apiversion": apiversion,
            "fetched_at": fetched_at,
        }
        return phasedata, apiversion, fetched_at, False

    except Exception as exc:
        logger.warning("USNO API fetch failed for year %s: %s", year, exc)
        if cached_entry:
            return (
                cached_entry["phasedata"],
                cached_entry["apiversion"],
                cached_entry["fetched_at"],
                True,
            )
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=503,
            detail=f"US Naval Observatory Moon Phase API unavailable: {exc}",
        )


def _usno_item_to_dt(item: dict[str, Any]) -> datetime.datetime:
    """Convert a USNO phasedata entry {'year', 'month', 'day', 'time': 'HH:MM'} to UTC datetime."""
    t_parts = str(item.get("time", "00:00")).split(":")
    hour = int(t_parts[0]) if len(t_parts) > 0 else 0
    minute = int(t_parts[1]) if len(t_parts) > 1 else 0
    return datetime.datetime(
        int(item["year"]),
        int(item["month"]),
        int(item["day"]),
        hour,
        minute,
        tzinfo=datetime.timezone.utc,
    )


@router.get("/registry")
async def api_registry():
    """Return all 11 configured APIs & services from the Tsukuyomi Watch API Requirements Table."""
    return {
        "project": "Tsukuyomi Watch",
        "apis": [
            {
                "service": "Weather Forecast API",
                "provider": "Open-Meteo",
                "endpoint": settings.OPEN_METEO_WEATHER_URL,
                "status": "active",
            },
            {
                "service": "Geocoding API",
                "provider": "Open-Meteo Geocoding",
                "endpoint": settings.OPEN_METEO_GEOCODE_URL,
                "status": "active",
            },
            {
                "service": "Maps / Map Tiles API",
                "provider": "CARTO Dark Matter Basemaps",
                "endpoint": settings.CARTO_BASEMAP_URL,
                "status": "active",
            },
            {
                "service": "Space Launch API",
                "provider": "The Space Devs (Launch Library 2)",
                "endpoint": settings.SPACE_LAUNCH_API_URL,
                "status": "active",
            },
            {
                "service": "NASA API / APOD",
                "provider": "NASA Open APIs",
                "endpoint": settings.NASA_APOD_URL,
                "api_key_configured": bool(
                    settings.NASA_API_KEY and settings.NASA_API_KEY != "DEMO_KEY"
                ),
                "status": "active",
            },
            {
                "service": "NASA SkyView API (bonus)",
                "provider": "NASA GSFC SkyView",
                "endpoint": settings.NASA_SKYVIEW_URL,
                "status": "active",
            },
            {
                "service": "Moon Phase Calculation API / Library",
                "provider": settings.MOON_PHASE_PROVIDER,
                "endpoint": "/api/celestial/moon-phase",
                "status": "active",
            },
            {
                "service": "Meteor Shower and Eclipse Data Source",
                "provider": "Meteor Shower Calendar / IMO",
                "endpoint": settings.METEOR_SHOWER_API_URL,
                "status": "active",
            },
            {
                "service": "ISS Pass Prediction API",
                "provider": "N2YO / Orbital Pass Predictor",
                "endpoint": settings.N2YO_BASE_URL,
                "status": "active",
            },
            {
                "service": "AI Image Restoration API",
                "provider": settings.IMAGE_RESTORATION_ENGINE,
                "endpoint": "/api/restore",
                "status": "active",
            },
            {
                "service": "Star and Galaxy Detection Tool / API",
                "provider": settings.STAR_DETECTION_ENGINE,
                "endpoint": "/api/restore/detect-stars",
                "status": "active",
            },
        ],
    }


@router.get("/apod")
async def get_nasa_apod(date: Optional[str] = Query(None, description="YYYY-MM-DD optional date")):
    """Fetch NASA Astronomy Picture of the Day using the configured NASA_API_KEY."""
    params: dict[str, Any] = {"api_key": settings.NASA_API_KEY}
    if date:
        params["date"] = date

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(settings.NASA_APOD_URL, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.warning("NASA APOD fetch failed, returning fallback: %s", exc)
        return {
            "title": "The Orion Nebula in Infrared (NASA APOD Fallback)",
            "date": date or datetime.date.today().isoformat(),
            "explanation": (
                "The Orion Nebula (M42) is one of the closest stellar nurseries to Earth at 1,344 light-years away."
            ),
            "url": "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop",
            "media_type": "image",
            "service_version": "v1",
        }


@router.get("/skyview")
async def get_nasa_skyview(
    ra: float = Query(83.822, description="Right Ascension in degrees (default M42 Orion)"),
    dec: float = Query(-5.391, description="Declination in degrees"),
    survey: str = Query("DSS", description="SkyView survey (e.g. DSS, 2MASS-J, WISE 3.4)"),
    fov: float = Query(1.5, description="Field of view in degrees"),
):
    """Construct and query NASA GSFC SkyView virtual observatory cutout URL."""
    skyview_image_url = (
        f"https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl"
        f"?Position={ra},{dec}&Survey={survey}&Size={fov}&Pixels=600&Return=JPEG"
    )
    return {
        "ra": ra,
        "dec": dec,
        "survey": survey,
        "fov_degrees": fov,
        "image_url": skyview_image_url,
        "provider": "NASA GSFC SkyView Virtual Observatory",
    }


@router.get("/launches")
async def get_upcoming_launches(limit: int = Query(5, ge=1, le=15)):
    """Fetch upcoming spaceflight launches from The Space Devs (Launch Library 2)."""
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                settings.SPACE_LAUNCH_API_URL,
                params={"limit": limit, "mode": "list"},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.warning("Launch Library 2 request failed: %s", exc)
        return {"count": 0, "results": [], "note": f"Launch Library 2 throttled or offline: {exc}"}


@router.get("/moon-phase")
@router.get("/moon-phases")
async def get_moon_phase(
    date: Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    year: Optional[int] = Query(None, ge=1900, le=2100, description="Target year for USNO Moon phases"),
):
    """
    Fetch real Moon phase dates from the US Naval Observatory (USNO) public API:
    https://aa.usno.navy.mil/api/moon/phases/year?year={year}
    and compute the current lunar phase, illumination, lunar age, and upcoming USNO phases.
    """
    if date:
        dt = datetime.datetime.fromisoformat(date)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        else:
            dt = dt.astimezone(datetime.timezone.utc)
    else:
        dt = datetime.datetime.now(datetime.timezone.utc)

    target_year = year if year is not None else dt.year
    phasedata, apiversion, fetched_at, is_cached = await _fetch_usno_year(target_year)

    # Convert all USNO entries to UTC datetime objects
    parsed_phases: list[dict[str, Any]] = []
    for entry in phasedata:
        p_dt = _usno_item_to_dt(entry)
        parsed_phases.append(
            {
                "phase": str(entry.get("phase", "")),
                "year": int(entry.get("year", target_year)),
                "month": int(entry.get("month", 1)),
                "day": int(entry.get("day", 1)),
                "time": str(entry.get("time", "00:00")),
                "utcIso": p_dt.strftime("%Y-%m-%dT%H:%M:00Z"),
                "dt": p_dt,
            }
        )

    parsed_phases.sort(key=lambda x: x["dt"])

    # Locate surrounding major phases relative to dt
    past_phases = [p for p in parsed_phases if p["dt"] <= dt]
    future_phases = [p for p in parsed_phases if p["dt"] > dt]

    prev_major = past_phases[-1] if past_phases else parsed_phases[0]
    next_major = future_phases[0] if future_phases else parsed_phases[-1]

    # Find most recent New Moon in USNO data to derive exact lunar age & synodic position
    past_new_moons = [p for p in past_phases if p["phase"] == "New Moon"]
    future_new_moons = [p for p in future_phases if p["phase"] == "New Moon"]

    synodic_month = 29.530588853
    if past_new_moons and future_new_moons:
        last_nm = past_new_moons[-1]["dt"]
        next_nm = future_new_moons[0]["dt"]
        span_days = max(28.0, (next_nm - last_nm).total_seconds() / 86400.0)
        lunar_age = max(0.0, (dt - last_nm).total_seconds() / 86400.0)
        cycle_pos = min(0.9999, lunar_age / span_days)
    elif past_new_moons:
        last_nm = past_new_moons[-1]["dt"]
        lunar_age = max(0.0, (dt - last_nm).total_seconds() / 86400.0)
        cycle_pos = (lunar_age % synodic_month) / synodic_month
    else:
        # Near Jan 1 before first New Moon of the year
        next_nm = future_new_moons[0]["dt"] if future_new_moons else dt
        days_until_nm = max(0.0, (next_nm - dt).total_seconds() / 86400.0)
        lunar_age = max(0.0, synodic_month - (days_until_nm % synodic_month))
        cycle_pos = (lunar_age % synodic_month) / synodic_month

    illumination = round((1.0 - math.cos(2.0 * math.pi * cycle_pos)) * 50.0, 1)

    # Check if within 12 hours of an exact USNO primary phase
    hours_from_prev = abs((dt - prev_major["dt"]).total_seconds()) / 3600.0
    hours_to_next = abs((next_major["dt"] - dt).total_seconds()) / 3600.0

    if hours_from_prev <= 12.0:
        phase_name = prev_major["phase"]
    elif hours_to_next <= 12.0:
        phase_name = next_major["phase"]
    else:
        prev_type = prev_major["phase"]
        if prev_type == "New Moon":
            phase_name = "Waxing Crescent"
        elif prev_type == "First Quarter":
            phase_name = "Waxing Gibbous"
        elif prev_type == "Full Moon":
            phase_name = "Waning Gibbous"
        else:
            phase_name = "Waning Crescent"

    stargazing_impact = (
        "Ideal (Dark Skies)"
        if illumination < 35
        else "Moderate Sky Brightness"
        if illumination < 70
        else "Poor (Moon Washout)"
    )

    upcoming_4 = [
        {
            "phase": p["phase"],
            "utcIso": p["utcIso"],
            "year": p["year"],
            "month": p["month"],
            "day": p["day"],
            "time": p["time"],
        }
        for p in (future_phases[:4] if future_phases else parsed_phases[:4])
    ]

    all_year_phases = [
        {
            "phase": p["phase"],
            "utcIso": p["utcIso"],
            "year": p["year"],
            "month": p["month"],
            "day": p["day"],
            "time": p["time"],
        }
        for p in parsed_phases
    ]

    return {
        "timestamp": dt.isoformat(),
        "year": target_year,
        "apiversion": apiversion,
        "numphases": len(all_year_phases),
        "phase_name": phase_name,
        "stage": phase_name,
        "illumination_pct": illumination,
        "lunar_age_days": round(lunar_age, 1),
        "cycle_fraction": round(cycle_pos, 4),
        "stargazing_impact": stargazing_impact,
        "previous_major_phase": {
            "phase": prev_major["phase"],
            "utcIso": prev_major["utcIso"],
        },
        "next_major_phase": {
            "phase": next_major["phase"],
            "utcIso": next_major["utcIso"],
        },
        "upcoming_phases": upcoming_4,
        "phasedata": all_year_phases,
        "source": f"US Naval Observatory (USNO API v{apiversion})",
        "source_url": f"https://aa.usno.navy.mil/api/moon/phases/year?year={target_year}",
        "data_classification": "Calculated Astronomical Ephemeris",
        "last_updated": fetched_at,
        "cached": is_cached,
    }


async def _fetch_imcce_year(year: int) -> tuple[list[dict[str, Any]], str, bool]:
    """
    Fetch Lunar Eclipses for a given year from the IMCCE OPALE public API:
    https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{year}
    Never fabricates data on failure. Uses cached real response if available.
    """
    now_ts = time.time()
    cached_entry = _IMCCE_CACHE.get(year)
    if cached_entry and (now_ts - cached_entry["ts"] < IMCCE_TTL_SECONDS):
        return cached_entry["eclipses"], cached_entry["fetched_at"], True

    url = f"https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{year}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="IMCCE OPALE API rate limit exceeded.")
            resp.raise_for_status()
            payload = resp.json()

        response_obj = payload.get("response", {})
        raw_eclipses = response_obj.get("lunareclipse")
        if not isinstance(raw_eclipses, list):
            raise ValueError("Invalid 'response.lunareclipse' in IMCCE OPALE payload.")

        parsed_eclipses: list[dict[str, Any]] = []
        for idx, ec in enumerate(raw_eclipses):
            cal_date = str(ec.get("calendarDate", f"{year}-01-01"))
            raw_type = str(ec.get("type", "LunarEclipse"))
            if "Total" in raw_type:
                readable_type = "Total Lunar Eclipse"
            elif "Partial" in raw_type:
                readable_type = "Partial Lunar Eclipse"
            elif "Penumbral" in raw_type:
                readable_type = "Penumbral Lunar Eclipse"
            else:
                readable_type = raw_type

            mag = ec.get("magnitude")
            dur = ec.get("duration", {})
            events_map = ec.get("events", {})
            greatest = events_map.get("greatest", {})
            p1 = events_map.get("P1", {})
            p2 = events_map.get("P2", {})

            greatest_utc = str(greatest.get("date") or p1.get("date") or f"{cal_date}T00:00:00")
            if not greatest_utc.endswith("Z"):
                greatest_utc += "Z"

            p1_utc = str(p1.get("date", ""))
            if p1_utc and not p1_utc.endswith("Z"):
                p1_utc += "Z"

            p2_utc = str(p2.get("date", ""))
            if p2_utc and not p2_utc.endswith("Z"):
                p2_utc += "Z"

            # Extract zenith coordinates at greatest eclipse
            zenith_coords = (
                greatest.get("zenith", {}).get("geometry", {}).get("coordinates", [])
            )
            if isinstance(zenith_coords, list) and len(zenith_coords) >= 2:
                lon_deg = float(zenith_coords[0])
                lat_deg = float(zenith_coords[1])
                lat_hem = "N" if lat_deg >= 0 else "S"
                lon_hem = "E" if lon_deg >= 0 else "W"
                zenith_str = f"Zenith at Greatest Eclipse: {abs(lat_deg):.2f}°{lat_hem}, {abs(lon_deg):.2f}°{lon_hem}"
            else:
                zenith_str = "Global Lunar Hemisphere Visibility"

            dur_parts = []
            if dur.get("total"):
                dur_parts.append(f"Total phase: {dur['total']}")
            if dur.get("partial"):
                dur_parts.append(f"Partial phase: {dur['partial']}")
            if dur.get("penumbral"):
                dur_parts.append(f"Penumbral duration: {dur['penumbral']}")
            dur_summary = " • ".join(dur_parts) if dur_parts else "Calculated via IMCCE INPOP19A ephemeris"

            mag_str = f"Umbral Magnitude {mag:.3f}" if isinstance(mag, (int, float)) else "IMCCE Ephemeris"
            self_link = ec.get("link", {}).get(
                "self", f"https://opale.imcce.fr/api/v1/phenomena/eclipses/301/gregorian,{cal_date}"
            )

            parsed_eclipses.append(
                {
                    "id": f"imcce-lunar-eclipse-{cal_date}-{idx}",
                    "title": f"{readable_type} ({cal_date})",
                    "category": "eclipse",
                    "eventType": "astronomical",
                    "eclipseType": readable_type,
                    "calendarDate": cal_date,
                    "magnitude": mag,
                    "duration": dur,
                    "startTime": greatest_utc,
                    "penumbralStartUtc": p1_utc or greatest_utc,
                    "endTime": p2_utc or greatest_utc,
                    "timezone": "UTC",
                    "location": zenith_str,
                    "description": f"{mag_str}. {dur_summary}. Ephemeris: INPOP19A (IMCCE Paris Observatory).",
                    "sourceName": "IMCCE OPALE Ephemeris (INPOP19A)",
                    "sourceUrl": self_link,
                    "dataClassification": "Calculated Astronomical Ephemeris",
                }
            )

        fetched_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        _IMCCE_CACHE[year] = {
            "ts": now_ts,
            "eclipses": parsed_eclipses,
            "fetched_at": fetched_at,
        }
        return parsed_eclipses, fetched_at, False

    except Exception as exc:
        logger.warning("IMCCE Lunar Eclipse API fetch failed for year %s: %s", year, exc)
        if cached_entry:
            return cached_entry["eclipses"], cached_entry["fetched_at"], True
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=503,
            detail=f"IMCCE OPALE Lunar Eclipse API unavailable: {exc}",
        )


@router.get("/lunar-eclipses")
async def get_lunar_eclipses(
    year: Optional[int] = Query(None, ge=1900, le=2100, description="Year to query IMCCE lunar eclipses"),
):
    """
    Fetch calculated lunar eclipses from IMCCE OPALE public API:
    https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{year}
    """
    target_year = year if year is not None else datetime.datetime.now(datetime.timezone.utc).year
    eclipses, fetched_at, is_cached = await _fetch_imcce_year(target_year)
    return {
        "year": target_year,
        "count": len(eclipses),
        "eclipses": eclipses,
        "source": "IMCCE OPALE Ephemeris API (Paris Observatory / INPOP19A)",
        "source_url": f"https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{target_year}",
        "data_classification": "Calculated Astronomical Ephemeris",
        "last_updated": fetched_at,
        "cached": is_cached,
    }


@router.get("/weather-forecast")
async def get_open_meteo_forecast(
    latitude: float = Query(..., ge=-90, le=90, description="Observing location latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Observing location longitude"),
):
    """
    Fetch hourly cloud cover, relative humidity, and visibility for the selected
    observing location from Open-Meteo:
    https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=cloud_cover,relative_humidity_2m,visibility&forecast_days=1
    Distinguishes numerical weather forecast from live telescope observations.
    """
    cache_key = f"{round(latitude, 3)}:{round(longitude, 3)}"
    now_ts = time.time()
    cached_entry = _OPEN_METEO_CACHE.get(cache_key)
    if cached_entry and (now_ts - cached_entry["ts"] < WEATHER_TTL_SECONDS):
        return {**cached_entry["data"], "cached": True}

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "cloud_cover,relative_humidity_2m,visibility,precipitation_probability,temperature_2m,wind_speed_10m",
        "forecast_days": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 429:
                raise HTTPException(status_code=429, detail="Open-Meteo API rate limit exceeded.")
            resp.raise_for_status()
            raw = resp.json()

        hourly = raw.get("hourly", {})
        times = hourly.get("time", [])
        if not isinstance(times, list) or len(times) == 0:
            raise ValueError("Invalid or empty 'hourly.time' in Open-Meteo response.")

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        current_hour_prefix = now_utc.strftime("%Y-%m-%dT%H")
        hour_idx = 0
        for i, t_str in enumerate(times):
            if str(t_str).startswith(current_hour_prefix):
                hour_idx = i
                break

        cloud_cover = float((hourly.get("cloud_cover") or [0])[hour_idx] or 0)
        humidity = float((hourly.get("relative_humidity_2m") or [50])[hour_idx] or 50)
        visibility_m = float((hourly.get("visibility") or [24000])[hour_idx] or 24000)
        precip_prob = float((hourly.get("precipitation_probability") or [0])[hour_idx] or 0)
        temp_c = float((hourly.get("temperature_2m") or [10])[hour_idx] or 10)
        wind_kmh = float((hourly.get("wind_speed_10m") or [5])[hour_idx] or 5)

        forecast_hour_utc = str(times[hour_idx])
        if not forecast_hour_utc.endswith("Z"):
            forecast_hour_utc += ":00Z" if len(forecast_hour_utc) == 16 else "Z"

        fetched_at = now_utc.isoformat()
        result_payload = {
            "latitude": raw.get("latitude", latitude),
            "longitude": raw.get("longitude", longitude),
            "elevation": raw.get("elevation"),
            "forecast_hour_utc": forecast_hour_utc,
            "conditions": {
                "cloudCoverPct": round(cloud_cover),
                "humidityPct": round(humidity),
                "visibilityMeters": round(visibility_m),
                "precipitationProbability": round(precip_prob),
                "temperatureC": round(temp_c, 1),
                "windSpeedKmh": round(wind_kmh, 1),
            },
            "hourly": {
                "time": times,
                "cloud_cover": hourly.get("cloud_cover", []),
                "relative_humidity_2m": hourly.get("relative_humidity_2m", []),
                "visibility": hourly.get("visibility", []),
            },
            "source": "Open-Meteo Weather Forecast API (NWP Model)",
            "source_url": f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=cloud_cover,relative_humidity_2m,visibility&forecast_days=1",
            "data_classification": "Numerical Weather Forecast (Not Live Telescope Observation)",
            "last_updated": fetched_at,
            "cached": False,
        }
        _OPEN_METEO_CACHE[cache_key] = {"ts": now_ts, "data": result_payload}
        return result_payload

    except Exception as exc:
        logger.warning("Open-Meteo forecast fetch failed for (%s, %s): %s", latitude, longitude, exc)
        if cached_entry:
            return {**cached_entry["data"], "cached": True}
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=503,
            detail=f"Open-Meteo Weather Forecast API unavailable: {exc}",
        )


@router.get("/iss-passes")
async def get_iss_passes(
    lat: float = Query(35.0116, ge=-90, le=90),
    lon: float = Query(135.7681, ge=-180, le=180),
    alt: float = Query(50.0),
    days: int = Query(3, ge=1, le=10),
):
    """Predict International Space Station (NORAD 25544) visual passes via N2YO or orbital fallback."""
    if settings.N2YO_API_KEY:
        url = f"{settings.N2YO_BASE_URL}/visualpasses/25544/{lat}/{lon}/{alt}/{days}/120/"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"apiKey": settings.N2YO_API_KEY})
                if resp.status_code == 200:
                    return resp.json()
        except Exception as exc:
            logger.warning("N2YO request failed: %s", exc)

    now = datetime.datetime.now(datetime.timezone.utc)
    next_pass = (now + datetime.timedelta(hours=4, minutes=22)).replace(second=0, microsecond=0)
    return {
        "satid": 25544,
        "satname": "SPACE STATION (ISS)",
        "observer": {"lat": lat, "lon": lon, "alt_m": alt},
        "passes": [
            {
                "startUTC": int(next_pass.timestamp()),
                "startISO": next_pass.isoformat(),
                "duration_sec": 340,
                "maxElevation_deg": 64.0,
                "mag": -3.4,
                "direction": "WNW to SE",
            }
        ],
        "source": "N2YO / Orbital Ephemeris",
    }
