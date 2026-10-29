import { ScoreComponents } from '../types';

export interface CalculatedScore {
  score: number;
  label: string;
  weightsUsed: {
    clearSky: number;
    visibility: number;
    humidity: number;
    darkness: number;
  };
  summary: string;
  verdict: 'Legendary' | 'Honorable' | 'Contested' | 'Obscured';
}

/**
 * Calculates Night Honor Score strictly following the blueprint heuristic:
 * Score = 0.45*ClearSky + 0.25*Visibility + 0.15*Humidity + 0.15*Darkness
 * If Darkness is unavailable, the available weights (0.45, 0.25, 0.15 => sum 0.85)
 * are reweighted proportionally to sum to 1.0.
 */
export function calculateNightHonorScore(components: ScoreComponents): CalculatedScore {
  const { clearSky, visibility, humidity, darkness } = components;

  let score: number;
  let label: string;
  let weightsUsed: { clearSky: number; visibility: number; humidity: number; darkness: number };

  if (darkness !== null && darkness !== undefined) {
    weightsUsed = { clearSky: 0.45, visibility: 0.25, humidity: 0.15, darkness: 0.15 };
    score = Math.round(
      0.45 * clearSky +
      0.25 * visibility +
      0.15 * humidity +
      0.15 * darkness
    );
    label = 'comprehensive astronomical estimate';
  } else {
    // Reweight: base sum = 0.45 + 0.25 + 0.15 = 0.85
    const wClear = 0.45 / 0.85; // ~0.529
    const wVis = 0.25 / 0.85;   // ~0.294
    const wHum = 0.15 / 0.85;   // ~0.176
    weightsUsed = {
      clearSky: parseFloat(wClear.toFixed(3)),
      visibility: parseFloat(wVis.toFixed(3)),
      humidity: parseFloat(wHum.toFixed(3)),
      darkness: 0
    };
    score = Math.round(wClear * clearSky + wVis * visibility + wHum * humidity);
    label = 'weather-only estimate';
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  let verdict: CalculatedScore['verdict'];
  let summary: string;

  if (score >= 85) {
    verdict = 'Legendary';
    summary = 'Pristine celestial visibility. The heavens welcome deep-sky observation and astrophotography.';
  } else if (score >= 70) {
    verdict = 'Honorable';
    summary = 'Favorable atmospheric conditions with minimal clouds and high transparency.';
  } else if (score >= 50) {
    verdict = 'Contested';
    summary = 'Moderate haze or broken cloud decks may periodically obstruct observation.';
  } else {
    verdict = 'Obscured';
    summary = 'Dense cloud cover, elevated moisture, or poor atmospheric transparency present.';
  }

  return {
    score,
    label,
    weightsUsed,
    summary,
    verdict
  };
}
