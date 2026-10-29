from __future__ import annotations

import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from services.scorer import ScorerInput, calculate_score
from services.open_meteo import get_weather
from models import NightHonorScore, HourlyScore, BestTimeResponse

router = APIRouter(prefix="/score", tags=["score"])


@router.get("", response_model=NightHonorScore)
async def score(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    population: Optional[int] = Query(None, ge=0),
    cloud_cover: Optional[float] = Query(None, ge=0, le=100),
    visibility_m: Optional[float] = Query(None, ge=0),
    humidity: Optional[float] = Query(None, ge=0, le=100),
):
    """
    Calculate Night Honor Score. If weather params are not provided,
    they are fetched live from Open-Meteo.
    """
    if cloud_cover is None or visibility_m is None or humidity is None:
        try:
            weather = await get_weather(lat, lon)
            cloud_cover = weather.current.cloud_cover
            visibility_m = weather.current.visibility
            humidity = float(weather.current.relative_humidity_2m)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Weather fetch failed: {exc}")

    inp = ScorerInput(
        cloud_cover=cloud_cover,
        visibility_m=visibility_m,
        humidity=humidity,
        population=population,
    )
    return calculate_score(inp)


@router.get("/best-time", response_model=BestTimeResponse)
async def best_time(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: str = Query("Selected Location"),
    population: Optional[int] = Query(None, ge=0),
):
    """Return hourly Night Honor Scores for tonight's night hours."""
    try:
        weather = await get_weather(lat, lon, forecast_days=2)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {exc}")

    hourly = weather.hourly
    sunset_h = 18  # default fallback hour for local sunset
    if weather.daily and weather.daily.sunset:
        try:
            sunset_h = int(weather.daily.sunset.split("T")[1][:2])
        except Exception:
            pass

    night_scores: list[HourlyScore] = []
    today = datetime.date.today().isoformat()

    for i, t in enumerate(hourly.time):
        # Only include hours today from sunset onwards + hours before 06:00 tomorrow
        hour = int(t.split("T")[1][:2])
        date_part = t.split("T")[0]
        is_tonight = (date_part == today and hour >= sunset_h) or (
            date_part > today and hour <= 6
        )
        if not is_tonight:
            continue

        cloud = hourly.cloud_cover[i]
        vis   = hourly.visibility[i]
        hum   = hourly.relative_humidity_2m[i]

        sc = calculate_score(ScorerInput(
            cloud_cover=float(cloud),
            visibility_m=float(vis),
            humidity=float(hum),
            population=population,
        ))
        night_scores.append(HourlyScore(
            time=t,
            score=sc.score,
            label=sc.label,
            cloud_cover=cloud,
            visibility=vis,
            humidity=hum,
        ))

    best_score: Optional[float] = None
    best_start: Optional[str] = None
    best_end: Optional[str] = None
    reasoning = "No night-hour forecast data available for the selected location."
    data_avail = len(night_scores) > 0

    if night_scores:
        best = max(night_scores, key=lambda h: h.score)
        best_score = best.score
        best_start = best.time
        # Find contiguous window around best
        best_idx = night_scores.index(best)
        start_idx = best_idx
        end_idx = best_idx
        for j in range(best_idx - 1, -1, -1):
            if night_scores[j].score >= best.score - 10:
                start_idx = j
            else:
                break
        for j in range(best_idx + 1, len(night_scores)):
            if night_scores[j].score >= best.score - 10:
                end_idx = j
            else:
                break
        best_start = night_scores[start_idx].time
        best_end   = night_scores[end_idx].time
        reasoning = (
            f"Best predicted window is {best_start[11:16]}–{best_end[11:16]} local time "
            f"with a peak honor score of {best_score:.0f}/100 ({best.label}). "
            f"Cloud cover at peak: {best.cloud_cover}%, visibility: {best.visibility/1000:.1f} km, "
            f"humidity: {best.humidity}%."
        )

    return BestTimeResponse(
        location_name=location_name,
        date=today,
        night_hours=night_scores,
        best_window_start=best_start,
        best_window_end=best_end,
        best_score=best_score,
        reasoning=reasoning,
        data_available=data_avail,
    )
