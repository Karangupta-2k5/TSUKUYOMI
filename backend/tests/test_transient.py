"""Unit and integration tests for transient event detection and spectroscopy."""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app


@pytest.mark.asyncio
async def test_transient_events_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/transient/events")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["total"] >= 6
        assert any(e["id"] == "sn1054-crab" for e in data["events"])


@pytest.mark.asyncio
async def test_transient_detail_crab():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/transient/events/sn1054-crab")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["event"]["name"] == "SN 1054 (Crab Nebula Guest Star)"
        assert len(data["timeDomain"]["lightCurve"]) > 10
        assert len(data["spectroscopy"]["spectral_points"]) > 50
        assert len(data["spectroscopy"]["identified_lines"]) > 0


@pytest.mark.asyncio
async def test_transient_detector_rule():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/transient/detect",
            params={
                "peak_mag": -6.0,
                "rise_time_days": 12.0,
                "has_hydrogen": True,
                "expansion_velocity": 9800.0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "classified"
        assert "Type II" in data["predictedClass"]
        assert data["confidence"] > 90

