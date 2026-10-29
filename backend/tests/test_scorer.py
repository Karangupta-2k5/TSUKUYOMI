"""Unit tests for the Night Honor Score engine."""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from services.scorer import ScorerInput, calculate_score, WEIGHTS


class TestClearSkyScore:
    def test_perfect_clear_sky(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        assert sc.score == 100.0

    def test_fully_cloudy(self):
        sc = calculate_score(ScorerInput(cloud_cover=100, visibility_m=24000, humidity=30, population=0))
        cloud_comp = next(c for c in sc.components if c.name == "Clear-Sky")
        assert cloud_comp.normalized == 0.0

    def test_half_cloud(self):
        sc = calculate_score(ScorerInput(cloud_cover=50, visibility_m=24000, humidity=30, population=0))
        cloud_comp = next(c for c in sc.components if c.name == "Clear-Sky")
        assert abs(cloud_comp.normalized - 0.5) < 1e-9


class TestVisibilityScore:
    def test_max_visibility(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        vis_comp = next(c for c in sc.components if c.name == "Visibility")
        assert vis_comp.normalized == 1.0

    def test_over_max_clipped(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=48000, humidity=30, population=0))
        vis_comp = next(c for c in sc.components if c.name == "Visibility")
        assert vis_comp.normalized == 1.0

    def test_zero_visibility(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=0, humidity=30, population=0))
        vis_comp = next(c for c in sc.components if c.name == "Visibility")
        assert vis_comp.normalized == 0.0


class TestHumidityScore:
    def test_ideal_humidity(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        hum_comp = next(c for c in sc.components if c.name == "Low-Humidity")
        assert hum_comp.normalized == 1.0

    def test_high_humidity(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=100, population=0))
        hum_comp = next(c for c in sc.components if c.name == "Low-Humidity")
        assert hum_comp.normalized == 0.0

    def test_below_good_clipped(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=10, population=0))
        hum_comp = next(c for c in sc.components if c.name == "Low-Humidity")
        assert hum_comp.normalized == 1.0


class TestDarknessScore:
    def test_zero_population_dark(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        dark_comp = next(c for c in sc.components if c.name == "Sky-Darkness")
        assert dark_comp.normalized == 1.0

    def test_high_population_bright(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=2_000_000))
        dark_comp = next(c for c in sc.components if c.name == "Sky-Darkness")
        assert dark_comp.normalized == 0.0


class TestMissingComponents:
    def test_missing_cloud_cover_reduces_confidence(self):
        sc = calculate_score(ScorerInput(cloud_cover=None, visibility_m=24000, humidity=30, population=0))
        assert sc.confidence < 1.0
        assert "clear_sky" in sc.missing_components

    def test_all_missing_score_zero(self):
        sc = calculate_score(ScorerInput())
        assert sc.score == 0.0
        assert sc.confidence == 0.0

    def test_partial_score_still_computed(self):
        # Only cloud cover available
        sc = calculate_score(ScorerInput(cloud_cover=0))
        assert sc.score > 0
        cloud_comp = next(c for c in sc.components if c.name == "Clear-Sky")
        assert cloud_comp.available is True

    def test_confidence_with_all_available(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        assert sc.confidence == pytest.approx(1.0)


class TestLabels:
    def test_legendary_label(self):
        sc = calculate_score(ScorerInput(cloud_cover=0, visibility_m=24000, humidity=30, population=0))
        assert sc.label == "Legendary"

    def test_poor_label(self):
        sc = calculate_score(ScorerInput(cloud_cover=95, visibility_m=1000, humidity=95, population=1_900_000))
        assert sc.label in ("Poor", "Clouded Out")

    def test_score_range(self):
        for cloud in range(0, 101, 10):
            sc = calculate_score(ScorerInput(cloud_cover=float(cloud), visibility_m=10000, humidity=50))
            assert 0.0 <= sc.score <= 100.0
