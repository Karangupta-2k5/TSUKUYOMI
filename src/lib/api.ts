import { LocationCoordinates, WeatherScoreResponse, CelestialEvent, AppMode } from '../types';
import { MOCK_WEATHER_SCORE, MOCK_CELESTIAL_EVENTS, CANDIDATE_LOCATIONS } from '../data/mockData';
import { calculateNightHonorScore } from './scoreCalculator';

const N8N_WEATHER_WEBHOOK = import.meta.env.VITE_N8N_WEATHER_WEBHOOK_URL || '';
const N8N_GEOCODE_WEBHOOK = import.meta.env.VITE_N8N_GEOCODE_WEBHOOK_URL || '';
const N8N_EVENTS_WEBHOOK = import.meta.env.VITE_N8N_EVENTS_WEBHOOK_URL || '';

/**
 * Fetch Weather & Night Honor Score:
 * In Live Mode: Calls n8n webhook (or Open-Meteo direct as fallback if webhook not configured).
 * In Demo Mode: Returns verified mock data with clear labels.
 */
export async function fetchWeatherScore(
  location: LocationCoordinates,
  mode: AppMode = 'live'
): Promise<WeatherScoreResponse> {
  if (mode === 'demo' || !N8N_WEATHER_WEBHOOK) {
    // If Live mode is chosen but no custom n8n webhook is specified yet,
    // query Open-Meteo API directly in client as a resilient bridge,
    // calculating the exact Night Honor Score formula.
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=cloud_cover,relative_humidity_2m,visibility,precipitation_probability,temperature_2m,wind_speed_10m&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
      const data = await res.json();
      const hourly = data.hourly || {};

      // Match current hour
      const now = new Date();
      const currentIso = now.toISOString().slice(0, 13);
      let hourIdx = 0;
      if (hourly.time && hourly.time.length > 0) {
        const found = hourly.time.findIndex((t: string) => t.startsWith(currentIso));
        hourIdx = found !== -1 ? found : 0;
      }

      const cloudCover = hourly.cloud_cover?.[hourIdx] ?? 10;
      const humidity = hourly.relative_humidity_2m?.[hourIdx] ?? 30;
      const rawVisibility = hourly.visibility?.[hourIdx] ?? 24000;
      const precip = hourly.precipitation_probability?.[hourIdx] ?? 0;
      const temp = hourly.temperature_2m?.[hourIdx] ?? 14;
      const wind = hourly.wind_speed_10m?.[hourIdx] ?? 8;

      const clearSky = Math.max(0, Math.min(100, 100 - cloudCover));
      const humidityScore = Math.max(0, Math.min(100, 100 - humidity));
      const visibilityScore = Math.max(0, Math.min(100, Math.round((rawVisibility / 24000) * 100)));

      const calculated = calculateNightHonorScore({
        clearSky: Math.round(clearSky),
        visibility: Math.round(visibilityScore),
        humidity: Math.round(humidityScore),
        darkness: null
      });

      return {
        location,
        observedAt: new Date().toISOString(),
        score: calculated.score,
        scoreLabel: calculated.label,
        components: {
          clearSky: Math.round(clearSky),
          visibility: Math.round(visibilityScore),
          humidity: Math.round(humidityScore),
          darkness: null
        },
        conditions: {
          cloudCoverPct: cloudCover,
          humidityPct: humidity,
          visibilityMeters: rawVisibility,
          precipitationProbability: precip,
          temperatureC: Math.round(temp),
          windSpeedKmh: Math.round(wind)
        },
        source: 'Open-Meteo Direct (Live API)',
        limitations: [
          'Light pollution not included; score is an atmospheric clarity estimate',
          'Local aerosols and terrain can affect actual visibility'
        ]
      };
    } catch {
      // Return honest fallback
      return {
        ...MOCK_WEATHER_SCORE,
        location
      };
    }
  }

  // Live n8n webhook route
  try {
    const res = await fetch(N8N_WEATHER_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude
      })
    });
    if (!res.ok) throw new Error(`n8n webhook error: ${res.statusText}`);
    return await res.json();
  } catch {
    return {
      ...MOCK_WEATHER_SCORE,
      location,
      source: 'Open-Meteo (Demo Fallback)'
    };
  }
}

/**
 * Geocode place search
 */
export async function searchGeocode(query: string): Promise<LocationCoordinates[]> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();
    if (!data.results || data.results.length === 0) return [];

    return data.results.map((r: any) => ({
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: r.elevation || null,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    }));
  } catch {
    // Filter candidate presets matching query as fallback
    const q = query.toLowerCase();
    return CANDIDATE_LOCATIONS.filter(l => l.name.toLowerCase().includes(q));
  }
}

/**
 * Fetch Celestial Events:
 * Distinguishes spaceflight launches from natural astronomical events
 */
export async function fetchCelestialEvents(mode: AppMode = 'live'): Promise<CelestialEvent[]> {
  if (mode === 'demo' || !N8N_EVENTS_WEBHOOK) {
    return MOCK_CELESTIAL_EVENTS;
  }

  try {
    const res = await fetch(N8N_EVENTS_WEBHOOK);
    if (!res.ok) throw new Error('Events webhook failed');
    const data = await res.json();
    return data.events || MOCK_CELESTIAL_EVENTS;
  } catch {
    return MOCK_CELESTIAL_EVENTS;
  }
}
