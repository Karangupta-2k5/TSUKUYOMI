"""Integration tests for Tsukuyomi Watchtower API and frontend endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "tsukuyomi-watchtower"


@pytest.mark.asyncio
async def test_geocode_search():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/geocode", params={"q": "Kyoto", "count": 3})
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert len(data["results"]) > 0
        first = data["results"][0]
        assert "latitude" in first
        assert "longitude" in first
        assert "Kyoto" in first["name"]


@pytest.mark.asyncio
async def test_live_weather():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/weather", params={"lat": 35.0116, "lon": 135.7681})
        assert resp.status_code == 200
        data = resp.json()
        assert "current" in data
        assert "hourly" in data
        assert "cloud_cover" in data["current"]
        assert "visibility" in data["current"]
        assert "relative_humidity_2m" in data["current"]


@pytest.mark.asyncio
async def test_night_honor_score_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/score", params={"lat": 35.0116, "lon": 135.7681})
        assert resp.status_code == 200
        data = resp.json()
        assert 0.0 <= data["score"] <= 100.0
        assert data["label"] in ["Legendary", "Excellent", "Good", "Fair", "Poor", "Clouded Out"]
        assert len(data["components"]) == 4


@pytest.mark.asyncio
async def test_best_time_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/score/best-time", params={"lat": 35.0116, "lon": 135.7681, "location_name": "Kyoto"})
        assert resp.status_code == 200
        data = resp.json()
        assert "night_hours" in data
        assert "reasoning" in data


@pytest.mark.asyncio
async def test_frontend_serving():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "Tsukuyomi Watch" in resp.text
