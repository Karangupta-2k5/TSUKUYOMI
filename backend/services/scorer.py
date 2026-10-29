"""
Night Honor Score engine for Tsukuyomi Watch.

Formula (documented):
  score = Σ (component.normalized × component.weight) × 100

Components
----------
1. Clear-sky    weight=0.45  source: cloud_cover (%)
   normalized   = (100 - cloud_cover) / 100
   0% cloud → 1.0, 100% cloud → 0.0

2. Visibility   weight=0.25  source: visibility (m)
   normalized   = clamp(visibility_m / 24_000, 0, 1)
   24 km+ → 1.0 (excellent optical clarity), 0 m → 0.0

3. Low-humidity weight=0.15  source: relative_humidity_2m (%)
   normalized   = clamp((100 - humidity) / 70, 0, 1)
   30% humidity → 1.0, 100% humidity → 0.0

4. Sky-darkness weight=0.15  source: estimated population proxy
   This is a HEURISTIC ESTIMATE, not a real light-pollution measurement.
   When population is unknown the component is marked unavailable and
   the remaining weights are renormalized.
   normalized   = clamp(1 - population / 2_000_000, 0, 1)

If a component is unavailable:
  - Its weight is removed from the denominator.
  - The score is renormalized over available components.
  - confidence = available_weight / total_weight.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from models import NightHonorScore, ScoreComponent


# ── Thresholds ──────────────────────────────────────────────────────────────

TOTAL_WEIGHT = 1.0  # sum of all defined weights

WEIGHTS = {
    "clear_sky":    0.45,
    "visibility":   0.25,
    "low_humidity": 0.15,
    "sky_darkness": 0.15,
}

VISIBILITY_MAX_M  = 24_000   # metres → 1.0
HUMIDITY_GOOD_PCT = 30       # humidity at or below this → 1.0
HUMIDITY_BAD_PCT  = 100      # humidity at or above this → 0.0
POPULATION_DARK   = 0        # population → darkness 1.0 (no people)
POPULATION_BRIGHT = 2_000_000  # population → darkness 0.0


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _score_label(score: float) -> str:
    if score >= 85:
        return "Legendary"
    if score >= 70:
        return "Excellent"
    if score >= 55:
        return "Good"
    if score >= 40:
        return "Fair"
    if score >= 20:
        return "Poor"
    return "Clouded Out"


def _recommendation(score: float, components: list[ScoreComponent]) -> str:
    cloud_comp = next((c for c in components if c.name == "Clear-Sky"), None)
    vis_comp   = next((c for c in components if c.name == "Visibility"), None)
    hum_comp   = next((c for c in components if c.name == "Low-Humidity"), None)
    dark_comp  = next((c for c in components if c.name == "Sky-Darkness"), None)

    reasons: list[str] = []

    if cloud_comp and cloud_comp.available and cloud_comp.raw_value is not None:
        cloud = cloud_comp.raw_value
        if cloud < 10:
            reasons.append("skies are nearly clear")
        elif cloud < 30:
            reasons.append("mostly clear skies with light cloud interference")
        elif cloud < 60:
            reasons.append("significant cloud cover will interrupt viewing")
        else:
            reasons.append("heavy cloud cover makes stargazing very difficult")

    if vis_comp and vis_comp.available and vis_comp.raw_value is not None:
        vis_km = vis_comp.raw_value / 1000
        if vis_km < 5:
            reasons.append(f"poor visibility ({vis_km:.1f} km) suggests haze or fog")
        elif vis_km < 15:
            reasons.append(f"moderate visibility ({vis_km:.1f} km)")

    if hum_comp and hum_comp.available and hum_comp.raw_value is not None:
        hum = hum_comp.raw_value
        if hum > 80:
            reasons.append(f"high humidity ({hum:.0f}%) may cause dew on optics")

    if dark_comp and dark_comp.available and dark_comp.raw_value is not None:
        if dark_comp.normalized is not None and dark_comp.normalized < 0.3:
            reasons.append("significant light pollution in this area will wash out fainter objects")

    if not reasons:
        if score >= 70:
            return "Conditions look favourable for stargazing tonight. Consider travelling further from city lights for the best experience."
        return "Conditions are marginal. Check again closer to your planned session."

    base = "Tonight " + "; ".join(reasons) + "."
    if score >= 70:
        base += " Overall conditions are good — enjoy your session!"
    elif score >= 40:
        base += " Brighter objects (Moon, planets, star clusters) may still be visible."
    else:
        base += " Deep-sky objects will be difficult to observe under these conditions."

    return base


@dataclass
class ScorerInput:
    cloud_cover: Optional[float] = None      # 0–100 %
    visibility_m: Optional[float] = None     # metres
    humidity: Optional[float] = None         # 0–100 %
    population: Optional[int] = None         # proxy for light pollution


def calculate_score(inp: ScorerInput) -> NightHonorScore:
    """Compute the Night Honor Score from available inputs."""

    components: list[ScoreComponent] = []
    available_weight = 0.0
    missing: list[str] = []

    # ── 1. Clear-Sky ──────────────────────────────────────────────────────────
    if inp.cloud_cover is not None:
        norm = _clamp((100.0 - inp.cloud_cover) / 100.0)
        contrib = norm * WEIGHTS["clear_sky"] * 100
        components.append(ScoreComponent(
            name="Clear-Sky",
            weight=WEIGHTS["clear_sky"],
            raw_value=inp.cloud_cover,
            normalized=norm,
            contribution=contrib,
            available=True,
            note=f"{inp.cloud_cover:.0f}% cloud cover → normalized {norm:.2f}",
        ))
        available_weight += WEIGHTS["clear_sky"]
    else:
        components.append(ScoreComponent(
            name="Clear-Sky", weight=WEIGHTS["clear_sky"],
            raw_value=None, normalized=None, contribution=None,
            available=False, note="Cloud cover data unavailable",
        ))
        missing.append("clear_sky")

    # ── 2. Visibility ────────────────────────────────────────────────────────
    if inp.visibility_m is not None:
        norm = _clamp(inp.visibility_m / VISIBILITY_MAX_M)
        contrib = norm * WEIGHTS["visibility"] * 100
        components.append(ScoreComponent(
            name="Visibility",
            weight=WEIGHTS["visibility"],
            raw_value=inp.visibility_m,
            normalized=norm,
            contribution=contrib,
            available=True,
            note=f"{inp.visibility_m/1000:.1f} km visibility → normalized {norm:.2f} (max={VISIBILITY_MAX_M/1000:.0f} km)",
        ))
        available_weight += WEIGHTS["visibility"]
    else:
        components.append(ScoreComponent(
            name="Visibility", weight=WEIGHTS["visibility"],
            raw_value=None, normalized=None, contribution=None,
            available=False, note="Visibility data unavailable",
        ))
        missing.append("visibility")

    # ── 3. Low-Humidity ──────────────────────────────────────────────────────
    if inp.humidity is not None:
        span = float(HUMIDITY_BAD_PCT - HUMIDITY_GOOD_PCT)
        norm = _clamp((HUMIDITY_BAD_PCT - inp.humidity) / span)
        contrib = norm * WEIGHTS["low_humidity"] * 100
        components.append(ScoreComponent(
            name="Low-Humidity",
            weight=WEIGHTS["low_humidity"],
            raw_value=inp.humidity,
            normalized=norm,
            contribution=contrib,
            available=True,
            note=(
                f"{inp.humidity:.0f}% humidity → normalized {norm:.2f} "
                f"(≤{HUMIDITY_GOOD_PCT}% → 1.0, ≥{HUMIDITY_BAD_PCT}% → 0.0)"
            ),
        ))
        available_weight += WEIGHTS["low_humidity"]
    else:
        components.append(ScoreComponent(
            name="Low-Humidity", weight=WEIGHTS["low_humidity"],
            raw_value=None, normalized=None, contribution=None,
            available=False, note="Humidity data unavailable",
        ))
        missing.append("low_humidity")

    # ── 4. Sky-Darkness (heuristic population proxy) ─────────────────────────
    if inp.population is not None:
        norm = _clamp(1.0 - inp.population / POPULATION_BRIGHT)
        contrib = norm * WEIGHTS["sky_darkness"] * 100
        components.append(ScoreComponent(
            name="Sky-Darkness",
            weight=WEIGHTS["sky_darkness"],
            raw_value=float(inp.population),
            normalized=norm,
            contribution=contrib,
            available=True,
            note=(
                f"Population proxy {inp.population:,} → normalized {norm:.2f}. "
                "⚠ ESTIMATED – not a real light-pollution measurement."
            ),
        ))
        available_weight += WEIGHTS["sky_darkness"]
    else:
        components.append(ScoreComponent(
            name="Sky-Darkness", weight=WEIGHTS["sky_darkness"],
            raw_value=None, normalized=None, contribution=None,
            available=False,
            note="No light-pollution data available; component excluded from score.",
        ))
        missing.append("sky_darkness")

    # ── Compute renormalized score ────────────────────────────────────────────
    # Each component's contribution = normalized (0–1) × weight (fraction) × 100
    # So the sum of all contributions when all perfect = sum(weights) × 100 = 100
    # When components are missing, we renormalize: divide by available_weight instead of 1.0
    # so the score still spans 0–100 for the available metrics.
    if available_weight == 0.0:
        raw_score = 0.0
        confidence = 0.0
    else:
        weighted_normalized_sum = sum(
            (c.normalized or 0.0) * c.weight
            for c in components
            if c.available and c.normalized is not None
        )
        # Renormalize by available weight so score is 0–100 regardless of missing components
        raw_score = (weighted_normalized_sum / available_weight) * 100
        # Recompute contributions proportionally (for display)
        for c in components:
            if c.available and c.normalized is not None:
                c.contribution = round(c.normalized * c.weight * 100, 2)
        confidence = available_weight / TOTAL_WEIGHT

    score = round(_clamp(raw_score, 0.0, 100.0), 1)
    label = _score_label(score)
    recommendation = _recommendation(score, components)

    return NightHonorScore(
        score=score,
        label=label,
        components=components,
        confidence=round(confidence, 3),
        missing_components=missing,
        recommendation=recommendation,
    )
