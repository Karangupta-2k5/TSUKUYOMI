import axios from 'axios';
import type {
  GeoSearchResponse,
  GeoResult,
  WeatherResponse,
  CurrentConditions,
  HourlyForecast,
  SunriseSunset,
  NightHonorScore,
  ScoreComponent,
  BestTimeResponse,
  HourlyScore,
  NearbyResponse,
  NearbyLocation,
  SelectedLocation,
} from '../types';

// ─── Open-Meteo & Geocoding Endpoints ────────────────────────────────────────

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function wmoLabel(code: number): string {
  return WMO_CODES[code] ?? `Code ${code}`;
}

export async function searchLocations(q: string, count = 10): Promise<GeoSearchResponse> {
  const { data } = await axios.get(GEO_BASE, {
    params: {
      name: q.trim(),
      count,
      language: 'en',
      format: 'json',
    },
    timeout: 10000,
  });

  const rawResults: Record<string, any>[] = data?.results || [];
  const results: GeoResult[] = rawResults.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country || '',
    country_code: r.country_code || '',
    latitude: r.latitude,
    longitude: r.longitude,
    admin1: r.admin1,
    timezone: r.timezone,
    population: r.population,
    elevation: r.elevation,
  }));

  return { results };
}

export async function fetchCurrentLocation(): Promise<SelectedLocation> {
  const endpoints = [
    'https://ipwho.is/',
    'https://freeipapi.com/api/json',
  ];

  for (const ep of endpoints) {
    try {
      const { data, status } = await axios.get(ep, { timeout: 6000 });
      if (status === 200 && data) {
        if ('latitude' in data && 'longitude' in data && data.success !== false) {
          const city = data.city || data.cityName || 'Local Area';
          const country = data.country || data.countryName || '';
          const region = data.region || data.regionName || '';
          const disp = [city, region, country].filter(Boolean).join(', ');
          return {
            name: city,
            country,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            timezone: data.timezone?.id || data.timeZone,
            displayName: disp || `${Number(data.latitude).toFixed(4)}°N, ${Number(data.longitude).toFixed(4)}°E`,
          };
        }
      }
    } catch {
      // try next fallback
    }
  }

  return {
    name: 'Kyoto',
    country: 'Japan',
    latitude: 35.0116,
    longitude: 135.7681,
    timezone: 'Asia/Tokyo',
    displayName: 'Kyoto, Japan (Default)',
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<SelectedLocation> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  try {
    const { data, status } = await axios.get(url, { timeout: 8000 });
    if (status === 200 && data) {
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.suburb ||
        'Local Sky';
      const country = addr.country || '';
      const state = addr.state || addr.province || '';
      const dispParts = [city, state, country].filter(Boolean);
      const displayName =
        dispParts.length > 0
          ? dispParts.join(', ')
          : data.display_name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

      return {
        name: city,
        country,
        latitude: lat,
        longitude: lon,
        displayName,
      };
    }
  } catch {
    // fallback below
  }

  return {
    name: 'Current Location',
    country: '',
    latitude: lat,
    longitude: lon,
    displayName: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
  };
}

// ─── Weather (Open-Meteo Direct) ─────────────────────────────────────────────

// Short 60s weather cache so fetchWeather, fetchScore, and fetchBestTime share 1 HTTP request
const weatherCache = new Map<string, { ts: number; promise: Promise<WeatherResponse> }>();

export async function fetchWeather(
  lat: number,
  lon: number,
  timezone = 'auto',
  forecastDays = 2,
): Promise<WeatherResponse> {
  const key = `${lat.toFixed(3)}_${lon.toFixed(3)}_${forecastDays}`;
  const now = Date.now();
  const cached = weatherCache.get(key);
  if (cached && now - cached.ts < 60000) {
    return cached.promise;
  }

  const promise = (async () => {
    const params = {
      latitude: lat,
      longitude: lon,
      timezone,
      forecast_days: forecastDays,
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'cloud_cover',
        'visibility',
        'wind_speed_10m',
        'wind_direction_10m',
        'precipitation',
        'precipitation_probability',
        'weather_code',
        'is_day',
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'cloud_cover',
        'visibility',
        'precipitation_probability',
        'precipitation',
        'wind_speed_10m',
        'weather_code',
      ].join(','),
      daily: 'sunrise,sunset',
    };

    const { data } = await axios.get(WEATHER_BASE, { params, timeout: 15000 });
    const curRaw = data.current;
    const hrly = data.hourly;
    const daily = data.daily;

    const current: CurrentConditions = {
      time: curRaw.time,
      temperature_2m: curRaw.temperature_2m,
      apparent_temperature: curRaw.apparent_temperature,
      relative_humidity_2m: curRaw.relative_humidity_2m,
      cloud_cover: curRaw.cloud_cover,
      visibility: curRaw.visibility ?? 0.0,
      wind_speed_10m: curRaw.wind_speed_10m ?? 0.0,
      wind_direction_10m: curRaw.wind_direction_10m,
      precipitation: curRaw.precipitation,
      precipitation_probability: curRaw.precipitation_probability,
      weather_code: curRaw.weather_code,
      weather_description: wmoLabel(curRaw.weather_code),
      is_day: curRaw.is_day,
    };

    const hourly: HourlyForecast = {
      time: hrly.time,
      temperature_2m: hrly.temperature_2m,
      relative_humidity_2m: hrly.relative_humidity_2m,
      cloud_cover: hrly.cloud_cover,
      visibility: hrly.visibility,
      precipitation_probability:
        hrly.precipitation_probability ?? new Array(hrly.time.length).fill(null),
      precipitation: hrly.precipitation ?? new Array(hrly.time.length).fill(null),
      wind_speed_10m: hrly.wind_speed_10m,
      weather_code: hrly.weather_code,
    };

    let dailyObj: SunriseSunset | undefined;
    if (daily && daily.sunrise?.length && daily.sunset?.length) {
      dailyObj = {
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0],
      };
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      timezone_abbreviation: data.timezone_abbreviation,
      elevation: data.elevation,
      current,
      hourly,
      daily: dailyObj,
      fetched_at: new Date().toISOString(),
    };
  })();

  weatherCache.set(key, { ts: now, promise });
  return promise;
}

// ─── Night Honor Score Engine (Exact Teammate Scorer Port) ───────────────────

const TOTAL_WEIGHT = 1.0;
const WEIGHTS = {
  clear_sky: 0.45,
  visibility: 0.25,
  low_humidity: 0.15,
  sky_darkness: 0.15,
};
const VISIBILITY_MAX_M = 24000;
const HUMIDITY_GOOD_PCT = 30;
const HUMIDITY_BAD_PCT = 100;
const POPULATION_BRIGHT = 2000000;

function clamp(value: number, lo = 0.0, hi = 1.0): number {
  return Math.max(lo, Math.min(hi, value));
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Legendary';
  if (score >= 70) return 'Excellent';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Clouded Out';
}

function buildRecommendation(score: number, components: ScoreComponent[]): string {
  const cloudComp = components.find((c) => c.name === 'Clear-Sky');
  const visComp = components.find((c) => c.name === 'Visibility');
  const humComp = components.find((c) => c.name === 'Low-Humidity');
  const darkComp = components.find((c) => c.name === 'Sky-Darkness');

  const reasons: string[] = [];

  if (cloudComp && cloudComp.available && cloudComp.raw_value !== null) {
    const cloud = cloudComp.raw_value;
    if (cloud < 10) reasons.push('skies are nearly clear');
    else if (cloud < 30) reasons.push('mostly clear skies with light cloud interference');
    else if (cloud < 60) reasons.push('significant cloud cover will interrupt viewing');
    else reasons.push('heavy cloud cover makes stargazing very difficult');
  }

  if (visComp && visComp.available && visComp.raw_value !== null) {
    const visKm = visComp.raw_value / 1000;
    if (visKm < 5) reasons.push(`poor visibility (${visKm.toFixed(1)} km) suggests haze or fog`);
    else if (visKm < 15) reasons.push(`moderate visibility (${visKm.toFixed(1)} km)`);
  }

  if (humComp && humComp.available && humComp.raw_value !== null) {
    const hum = humComp.raw_value;
    if (hum > 80) reasons.push(`high humidity (${hum.toFixed(0)}%) may cause dew on optics`);
  }

  if (darkComp && darkComp.available && darkComp.raw_value !== null) {
    if (darkComp.normalized !== null && darkComp.normalized < 0.3) {
      reasons.push('significant light pollution in this area will wash out fainter objects');
    }
  }

  if (reasons.length === 0) {
    if (score >= 70) {
      return 'Conditions look favourable for stargazing tonight. Consider travelling further from city lights for the best experience.';
    }
    return 'Conditions are marginal. Check again closer to your planned session.';
  }

  let base = 'Tonight ' + reasons.join('; ') + '.';
  if (score >= 70) {
    base += ' Overall conditions are good — enjoy your session!';
  } else if (score >= 40) {
    base += ' Brighter objects (Moon, planets, star clusters) may still be visible.';
  } else {
    base += ' Deep-sky objects will be difficult to observe under these conditions.';
  }
  return base;
}

interface ScorerInput {
  cloud_cover?: number | null;
  visibility_m?: number | null;
  humidity?: number | null;
  population?: number | null;
}

export function calculateScore(inp: ScorerInput): NightHonorScore {
  const components: ScoreComponent[] = [];
  let availableWeight = 0.0;
  const missing: string[] = [];

  // 1. Clear-Sky
  if (inp.cloud_cover != null) {
    const norm = clamp((100.0 - inp.cloud_cover) / 100.0);
    const contrib = norm * WEIGHTS.clear_sky * 100;
    components.push({
      name: 'Clear-Sky',
      weight: WEIGHTS.clear_sky,
      raw_value: inp.cloud_cover,
      normalized: norm,
      contribution: contrib,
      available: true,
      note: `${inp.cloud_cover.toFixed(0)}% cloud cover → normalized ${norm.toFixed(2)}`,
    });
    availableWeight += WEIGHTS.clear_sky;
  } else {
    components.push({
      name: 'Clear-Sky',
      weight: WEIGHTS.clear_sky,
      raw_value: null,
      normalized: null,
      contribution: null,
      available: false,
      note: 'Cloud cover data unavailable',
    });
    missing.push('clear_sky');
  }

  // 2. Visibility
  if (inp.visibility_m != null) {
    const norm = clamp(inp.visibility_m / VISIBILITY_MAX_M);
    const contrib = norm * WEIGHTS.visibility * 100;
    components.push({
      name: 'Visibility',
      weight: WEIGHTS.visibility,
      raw_value: inp.visibility_m,
      normalized: norm,
      contribution: contrib,
      available: true,
      note: `${(inp.visibility_m / 1000).toFixed(1)} km visibility → normalized ${norm.toFixed(2)} (max=${(VISIBILITY_MAX_M / 1000).toFixed(0)} km)`,
    });
    availableWeight += WEIGHTS.visibility;
  } else {
    components.push({
      name: 'Visibility',
      weight: WEIGHTS.visibility,
      raw_value: null,
      normalized: null,
      contribution: null,
      available: false,
      note: 'Visibility data unavailable',
    });
    missing.push('visibility');
  }

  // 3. Low-Humidity
  if (inp.humidity != null) {
    const span = HUMIDITY_BAD_PCT - HUMIDITY_GOOD_PCT;
    const norm = clamp((HUMIDITY_BAD_PCT - inp.humidity) / span);
    const contrib = norm * WEIGHTS.low_humidity * 100;
    components.push({
      name: 'Low-Humidity',
      weight: WEIGHTS.low_humidity,
      raw_value: inp.humidity,
      normalized: norm,
      contribution: contrib,
      available: true,
      note: `${inp.humidity.toFixed(0)}% humidity → normalized ${norm.toFixed(2)} (≤${HUMIDITY_GOOD_PCT}% → 1.0, ≥${HUMIDITY_BAD_PCT}% → 0.0)`,
    });
    availableWeight += WEIGHTS.low_humidity;
  } else {
    components.push({
      name: 'Low-Humidity',
      weight: WEIGHTS.low_humidity,
      raw_value: null,
      normalized: null,
      contribution: null,
      available: false,
      note: 'Humidity data unavailable',
    });
    missing.push('low_humidity');
  }

  // 4. Sky-Darkness
  if (inp.population != null) {
    const norm = clamp(1.0 - inp.population / POPULATION_BRIGHT);
    const contrib = norm * WEIGHTS.sky_darkness * 100;
    components.push({
      name: 'Sky-Darkness',
      weight: WEIGHTS.sky_darkness,
      raw_value: Number(inp.population),
      normalized: norm,
      contribution: contrib,
      available: true,
      note: `Population proxy ${inp.population.toLocaleString()} → normalized ${norm.toFixed(2)}. ⚠ ESTIMATED — not a real light-pollution measurement.`,
    });
    availableWeight += WEIGHTS.sky_darkness;
  } else {
    components.push({
      name: 'Sky-Darkness',
      weight: WEIGHTS.sky_darkness,
      raw_value: null,
      normalized: null,
      contribution: null,
      available: false,
      note: 'No light-pollution data available; component excluded from score.',
    });
    missing.push('sky_darkness');
  }

  let rawScore = 0.0;
  let confidence = 0.0;

  if (availableWeight > 0) {
    const weightedNormalizedSum = components.reduce((acc, c) => {
      if (c.available && c.normalized !== null) {
        return acc + c.normalized * c.weight;
      }
      return acc;
    }, 0);

    rawScore = (weightedNormalizedSum / availableWeight) * 100;
    for (const c of components) {
      if (c.available && c.normalized !== null) {
        c.contribution = Number((c.normalized * c.weight * 100).toFixed(2));
      }
    }
    confidence = availableWeight / TOTAL_WEIGHT;
  }

  const score = Number(clamp(rawScore, 0.0, 100.0).toFixed(1));
  const label = scoreLabel(score);
  const recommendation = buildRecommendation(score, components);

  return {
    score,
    label,
    components,
    confidence: Number(confidence.toFixed(3)),
    missing_components: missing,
    recommendation,
    disclaimer:
      'This is a heuristic estimate, not a scientifically validated probability. Moon phase, atmospheric seeing, local obstructions, and personal equipment also affect the quality of an observation session.',
  };
}

export async function fetchScore(
  lat: number,
  lon: number,
  population?: number,
): Promise<NightHonorScore> {
  const weather = await fetchWeather(lat, lon);
  return calculateScore({
    cloud_cover: weather.current.cloud_cover,
    visibility_m: weather.current.visibility,
    humidity: Number(weather.current.relative_humidity_2m),
    population,
  });
}

export async function fetchBestTime(
  lat: number,
  lon: number,
  locationName: string,
  population?: number,
): Promise<BestTimeResponse> {
  const weather = await fetchWeather(lat, lon, 'auto', 2);
  const hourly = weather.hourly;
  let sunsetH = 18;
  if (weather.daily?.sunset) {
    const parsed = parseInt(weather.daily.sunset.split('T')[1]?.slice(0, 2) || '18', 10);
    if (!Number.isNaN(parsed)) sunsetH = parsed;
  }

  const today = (weather.current.time || new Date().toISOString()).split('T')[0];
  const nightScores: HourlyScore[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    const [datePart, timePart] = t.split('T');
    const hour = parseInt(timePart?.slice(0, 2) || '0', 10);
    const isTonight = (datePart === today && hour >= sunsetH) || (datePart > today && hour <= 6);
    if (!isTonight) continue;

    const cloud = hourly.cloud_cover[i];
    const vis = hourly.visibility[i];
    const hum = hourly.relative_humidity_2m[i];

    const sc = calculateScore({
      cloud_cover: Number(cloud),
      visibility_m: Number(vis),
      humidity: Number(hum),
      population,
    });

    nightScores.push({
      time: t,
      score: sc.score,
      label: sc.label,
      cloud_cover: cloud,
      visibility: vis,
      humidity: hum,
    });
  }

  let bestScore: number | null = null;
  let bestStart: string | null = null;
  let bestEnd: string | null = null;
  let reasoning = 'No night-hour forecast data available for the selected location.';
  const dataAvail = nightScores.length > 0;

  if (nightScores.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < nightScores.length; i++) {
      if (nightScores[i].score > nightScores[bestIdx].score) {
        bestIdx = i;
      }
    }
    const best = nightScores[bestIdx];
    bestScore = best.score;

    let startIdx = bestIdx;
    let endIdx = bestIdx;
    for (let j = bestIdx - 1; j >= 0; j--) {
      if (nightScores[j].score >= best.score - 10) startIdx = j;
      else break;
    }
    for (let j = bestIdx + 1; j < nightScores.length; j++) {
      if (nightScores[j].score >= best.score - 10) endIdx = j;
      else break;
    }

    bestStart = nightScores[startIdx].time;
    bestEnd = nightScores[endIdx].time;
    reasoning =
      `Best predicted window is ${bestStart.slice(11, 16)}–${bestEnd.slice(11, 16)} local time ` +
      `with a peak honor score of ${bestScore.toFixed(0)}/100 (${best.label}). ` +
      `Cloud cover at peak: ${best.cloud_cover}%, visibility: ${(best.visibility / 1000).toFixed(1)} km, ` +
      `humidity: ${best.humidity}%.`;
  }

  return {
    location_name: locationName,
    date: today,
    night_hours: nightScores,
    best_window_start: bestStart,
    best_window_end: bestEnd,
    best_score: bestScore,
    reasoning,
    data_available: dataAvail,
  };
}

// ─── Overpass API (Direct Browser Client + 30-min Memory Cache) ──────────────

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const nearbyCache = new Map<string, { ts: number; data: NearbyResponse }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function directionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function categorize(tags: Record<string, string>): [string, string, boolean] {
  const leisure = tags.leisure || '';
  const tourism = tags.tourism || '';
  const manMade = tags.man_made || '';
  const amenity = tags.amenity || '';
  const natural = tags.natural || '';
  const landuse = tags.landuse || '';

  if (manMade === 'observatory' || amenity === 'observatory') {
    return ['Observatory', 'Astronomical Observatory', true];
  }
  if (tourism === 'viewpoint') {
    return ['Viewpoint', tags.viewpoint || 'scenic', false];
  }
  if (['peak', 'saddle', 'plateau'].includes(natural)) {
    return ['Natural Feature', natural.charAt(0).toUpperCase() + natural.slice(1), false];
  }
  if (leisure === 'nature_reserve') return ['Nature Reserve', '', false];
  if (leisure === 'park') return ['Park', '', false];
  if (natural === 'heath') return ['Heath / Moorland', '', false];
  if (landuse === 'meadow') return ['Meadow', '', false];
  return ['Open Area', '', false];
}

function suitabilityNote(category: string, isObservatory: boolean): string {
  const base =
    'Potential stargazing candidate from OSM. Verify accessibility, opening hours, local regulations, and safety before visiting. ';
  if (isObservatory) {
    return (
      'Verified astronomical observatory. Check public access and visiting hours on their official website. ' +
      base
    );
  }
  if (category === 'Viewpoint') {
    return 'Elevated viewpoint — may offer good horizon clearance. ' + base;
  }
  if (category.includes('Nature Reserve')) {
    return 'Nature reserve — usually darker than urban areas. Check night access rules. ' + base;
  }
  if (category.includes('Natural Feature')) {
    return 'Natural summit or plateau — potentially excellent dark-sky access. Check trail safety. ' + base;
  }
  return base;
}

function parseElement(
  el: Record<string, any>,
  centerLat: number,
  centerLon: number,
): NearbyLocation | null {
  const tags: Record<string, string> = el.tags || {};
  let name = tags.name || tags['name:en'] || '';
  if (!name) {
    const raw = tags.leisure || tags.tourism || tags.natural || tags.man_made || 'Unnamed location';
    name = raw
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  let lat: number | undefined;
  let lon: number | undefined;
  if (el.type === 'node') {
    lat = el.lat;
    lon = el.lon;
  } else if (el.center) {
    lat = el.center.lat;
    lon = el.center.lon;
  }
  if (lat === undefined || lon === undefined) return null;

  const dist = haversineKm(centerLat, centerLon, lat, lon);
  const [category, subcategory, isObs] = categorize(tags);

  const filteredTags: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) {
    if (k !== 'name') filteredTags[k] = String(v);
  }

  return {
    osm_id: el.id,
    name,
    category,
    subcategory: subcategory || undefined,
    latitude: lat,
    longitude: lon,
    distance_km: Number(dist.toFixed(2)),
    tags: filteredTags,
    is_observatory: isObs,
    directions_url: directionsUrl(lat, lon),
    suitability_note: suitabilityNote(category, isObs),
  };
}

export async function fetchNearby(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<NearbyResponse> {
  const clampedRadius = Math.max(1.0, Math.min(radiusKm, 100.0));
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${clampedRadius}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const radiusM = Math.round(clampedRadius * 1000);
  const query = `
[out:json][timeout:25];
(
  node["leisure"="nature_reserve"](around:${radiusM},${lat},${lon});
  way["leisure"="nature_reserve"](around:${radiusM},${lat},${lon});
  node["leisure"="park"](around:${radiusM},${lat},${lon});
  way["leisure"="park"](around:${radiusM},${lat},${lon});
  node["tourism"="viewpoint"](around:${radiusM},${lat},${lon});
  node["man_made"="observatory"](around:${radiusM},${lat},${lon});
  way["man_made"="observatory"](around:${radiusM},${lat},${lon});
  node["amenity"="observatory"](around:${radiusM},${lat},${lon});
  node["landuse"="meadow"](around:${radiusM},${lat},${lon});
  way["landuse"="meadow"](around:${radiusM},${lat},${lon});
  node["natural"="peak"](around:${radiusM},${lat},${lon});
  node["natural"="saddle"](around:${radiusM},${lat},${lon});
  node["natural"="plateau"](around:${radiusM},${lat},${lon});
  way["natural"="heath"](around:${radiusM},${lat},${lon});
);
out center tags 40;
`;

  let elements: Record<string, any>[] | null = null;
  let lastErr: unknown = null;

  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const body = new URLSearchParams({ data: query });
      const { data } = await axios.post(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 28000,
      });
      elements = data?.elements || [];
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  const disclaimer =
    'OpenStreetMap data does not confirm that a location is dark, safe, accessible at night, or legally suitable for stargazing. Verify access, opening hours, local regulations, and safety before visiting.';

  if (!elements) {
    return {
      locations: [],
      radius_km: clampedRadius,
      center_lat: lat,
      center_lon: lon,
      source: 'OpenStreetMap via Overpass API',
      disclaimer,
      cached: false,
      error: `Overpass API unavailable: ${(lastErr as Error)?.message || 'timeout'}. Try again in a moment.`,
    };
  }

  const locations: NearbyLocation[] = [];
  const seen = new Set<string>();
  for (const el of elements) {
    const loc = parseElement(el, lat, lon);
    if (!loc) continue;
    const dedup = `${loc.name}_${loc.latitude.toFixed(3)}_${loc.longitude.toFixed(3)}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    locations.push(loc);
  }

  locations.sort((a, b) => {
    if (a.is_observatory !== b.is_observatory) return a.is_observatory ? -1 : 1;
    return a.distance_km - b.distance_km;
  });

  const result: NearbyResponse = {
    locations: locations.slice(0, 30),
    radius_km: clampedRadius,
    center_lat: lat,
    center_lon: lon,
    source: 'OpenStreetMap via Overpass API',
    disclaimer,
    cached: false,
  };

  nearbyCache.set(cacheKey, { ts: Date.now(), data: result });
  return result;
}
