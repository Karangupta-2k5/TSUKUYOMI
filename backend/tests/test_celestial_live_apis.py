"""
Automated integration tests for the 3 live public astronomical & weather APIs:
1. US Naval Observatory Moon Phases: https://aa.usno.navy.mil/api/moon/phases/year
2. IMCCE OPALE Lunar Eclipses: https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{year}
3. Open-Meteo Weather Forecast: https://api.open-meteo.com/v1/forecast
"""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from main import app


@pytest.mark.asyncio
async def test_usno_moon_phases_endpoint_live():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/celestial/moon-phases", params={"year": 2026})
        assert resp.status_code == 200
        data = resp.json()

        assert data["year"] == 2026
        assert data["numphases"] >= 48
        assert isinstance(data["phasedata"], list)
        assert len(data["upcoming_phases"]) == 4
        assert "US Naval Observatory" in data["source"]
        assert data["data_classification"] == "Calculated Astronomical Ephemeris"
        assert "last_updated" in data

        # Verify first 2026 USNO Moon phase matches official USNO response (2026-01-03 10:03 UTC Full Moon)
        first_phase = data["phasedata"][0]
        assert first_phase["phase"] == "Full Moon"
        assert first_phase["utcIso"] == "2026-01-03T10:03:00Z"


@pytest.mark.asyncio
async def test_imcce_lunar_eclipses_endpoint_live():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/celestial/lunar-eclipses", params={"year": 2026})
        assert resp.status_code == 200
        data = resp.json()

        assert data["year"] == 2026
        assert data["count"] == 2
        assert "IMCCE" in data["source"]
        assert data["data_classification"] == "Calculated Astronomical Ephemeris"

        eclipses = data["eclipses"]
        assert eclipses[0]["calendarDate"] == "2026-03-03"
        assert eclipses[0]["eclipseType"] == "Total Lunar Eclipse"
        assert eclipses[0]["magnitude"] == pytest.approx(1.151, rel=1e-2)
        assert eclipses[0]["startTime"].startswith("2026-03-03T11:33:")

        assert eclipses[1]["calendarDate"] == "2026-08-28"
        assert eclipses[1]["eclipseType"] == "Partial Lunar Eclipse"
        assert eclipses[1]["startTime"].startswith("2026-08-28T04:12:")


@pytest.mark.asyncio
async def test_open_meteo_weather_forecast_endpoint_live():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/celestial/weather-forecast",
            params={"latitude": 30.90, "longitude": 75.85},
        )
        assert resp.status_code == 200
        data = resp.json()

        assert "conditions" in data
        cond = data["conditions"]
        assert 0 <= cond["cloudCoverPct"] <= 100
        assert 0 <= cond["humidityPct"] <= 100
        assert cond["visibilityMeters"] >= 0
        assert "Open-Meteo" in data["source"]
        assert "Not Live Telescope" in data["data_classification"]
        assert "last_updated" in data
