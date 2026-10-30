import {
  LocationCoordinates,
  WeatherScoreResponse,
  CelestialEvent,
  MoonPhaseData,
  UsnoPhaseMilestone,
  AppMode,
} from '../types';
import { CANDIDATE_LOCATIONS } from '../data/mockData';
import { calculateNightHonorScore } from './scoreCalculator';

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');

/**
 * Format any UTC ISO timestamp into the user's local timezone alongside UTC.
 */
export function formatUtcToLocal(
  utcIso?: string,
  options?: { includeDate?: boolean; includeSeconds?: boolean }
): string {
  if (!utcIso) return 'Unavailable';
  try {
    const normalized = utcIso.endsWith('Z') || utcIso.includes('+') ? utcIso : `${utcIso}Z`;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return utcIso;

    const includeDate = options?.includeDate ?? true;
    const fmt = new Intl.DateTimeFormat(undefined, {
      ...(includeDate ? { year: 'numeric', month: 'short', day: 'numeric' } : {}),
      hour: '2-digit',
      minute: '2-digit',
      ...(options?.includeSeconds ? { second: '2-digit' } : {}),
      hour12: true,
      timeZoneName: 'short',
    });
    return fmt.format(d);
  } catch {
    return utcIso;
  }
}

function readLocalCache<T>(key: string, maxAgeMs: number): { data: T; expired: boolean } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (!parsed || typeof parsed.ts !== 'number') return null;
    return {
      data: parsed.data,
      expired: Date.now() - parsed.ts > maxAgeMs,
    };
  } catch {
    return null;
  }
}

function writeLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetch Weather & Night Honor Score from Open-Meteo for the selected observing location:
 * https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=cloud_cover,relative_humidity_2m,visibility&forecast_days=1
 * Never silently displays fabricated sample data on failure.
 */
export async function fetchWeatherScore(
  location: LocationCoordinates,
  _mode: AppMode = 'live'
): Promise<WeatherScoreResponse> {
  const lat = Number(location.latitude.toFixed(4));
  const lon = Number(location.longitude.toFixed(4));
  const cacheKey = `tw_real_weather_${lat}_${lon}`;
  const cached = readLocalCache<WeatherScoreResponse>(cacheKey, 10 * 60 * 1000);

  if (cached && !cached.expired) {
    return { ...cached.data, location, cached: true };
  }

  // 1. Try backend proxy endpoint (/api/celestial/weather-forecast) or direct Open-Meteo API
  let cloudCover = 0;
  let humidity = 50;
  let rawVisibility = 24000;
  let precip = 0;
  let temp = 12;
  let wind = 8;
  let forecastHourUtc = new Date().toISOString();
  let lastUpdated = new Date().toISOString();
  let isFromCache = false;
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,relative_humidity_2m,visibility,precipitation_probability,temperature_2m,wind_speed_10m&forecast_days=1`;

  try {
    let loadedViaBackend = false;
    try {
      const backendRes = await fetch(
        `${API_BASE}/api/celestial/weather-forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
      );
      if (backendRes.ok) {
        const bData = await backendRes.json();
        if (bData && bData.conditions) {
          cloudCover = bData.conditions.cloudCoverPct;
          humidity = bData.conditions.humidityPct;
          rawVisibility = bData.conditions.visibilityMeters;
          precip = bData.conditions.precipitationProbability ?? 0;
          temp = bData.conditions.temperatureC ?? 12;
          wind = bData.conditions.windSpeedKmh ?? 8;
          forecastHourUtc = bData.forecast_hour_utc || new Date().toISOString();
          lastUpdated = bData.last_updated || new Date().toISOString();
          isFromCache = Boolean(bData.cached);
          loadedViaBackend = true;
        }
      }
    } catch {
      // Fallback to direct public Open-Meteo endpoint below
    }

    if (!loadedViaBackend) {
      const res = await fetch(openMeteoUrl);
      if (res.status === 429) {
        throw new Error('Open-Meteo API rate limit reached (HTTP 429).');
      }
      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const hourly = data?.hourly;
      if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
        throw new Error('Invalid Open-Meteo response: missing hourly time array.');
      }

      const nowUtcPrefix = new Date().toISOString().slice(0, 13);
      const foundIdx = hourly.time.findIndex((t: string) => String(t).startsWith(nowUtcPrefix));
      const hourIdx = foundIdx !== -1 ? foundIdx : 0;

      cloudCover = Number(hourly.cloud_cover?.[hourIdx] ?? 0);
      humidity = Number(hourly.relative_humidity_2m?.[hourIdx] ?? 50);
      rawVisibility = Number(hourly.visibility?.[hourIdx] ?? 24000);
      precip = Number(hourly.precipitation_probability?.[hourIdx] ?? 0);
      temp = Number(hourly.temperature_2m?.[hourIdx] ?? 12);
      wind = Number(hourly.wind_speed_10m?.[hourIdx] ?? 8);

      const rawTime = String(hourly.time[hourIdx]);
      forecastHourUtc = rawTime.endsWith('Z') ? rawTime : `${rawTime}:00Z`;
      lastUpdated = new Date().toISOString();
    }

    const clearSky = Math.max(0, Math.min(100, 100 - cloudCover));
    const humidityScore = Math.max(0, Math.min(100, 100 - humidity));
    const visibilityScore = Math.max(0, Math.min(100, Math.round((rawVisibility / 24000) * 100)));

    const calculated = calculateNightHonorScore({
      clearSky: Math.round(clearSky),
      visibility: Math.round(visibilityScore),
      humidity: Math.round(humidityScore),
      darkness: null,
    });

    const responseObj: WeatherScoreResponse = {
      location,
      observedAt: lastUpdated,
      forecastHourUtc,
      score: calculated.score,
      scoreLabel: calculated.label,
      components: {
        clearSky: Math.round(clearSky),
        visibility: Math.round(visibilityScore),
        humidity: Math.round(humidityScore),
        darkness: null,
      },
      conditions: {
        cloudCoverPct: Math.round(cloudCover),
        humidityPct: Math.round(humidity),
        visibilityMeters: Math.round(rawVisibility),
        precipitationProbability: Math.round(precip),
        temperatureC: Math.round(temp * 10) / 10,
        windSpeedKmh: Math.round(wind * 10) / 10,
      },
      source: 'Open-Meteo Weather Forecast API (NWP Model)',
      sourceUrl: openMeteoUrl,
      dataClassification: 'Numerical Weather Forecast (Not Live Telescope Data)',
      lastUpdated,
      cached: isFromCache,
      limitations: [
        'Atmospheric forecast derived from numerical weather prediction (NWP) models — NOT live optical telescope telemetry.',
        'Light pollution index is excluded; weights are rebalanced across cloud cover, visibility, and humidity.',
      ],
    };

    writeLocalCache(cacheKey, responseObj);
    return responseObj;
  } catch (err: any) {
    if (cached) {
      return {
        ...cached.data,
        location,
        cached: true,
        error: `Live Open-Meteo request failed (${err?.message || 'network error'}). Showing cached forecast from ${formatUtcToLocal(cached.data.lastUpdated)}.`,
      };
    }
    throw new Error(
      `Open-Meteo Weather Forecast API unavailable for (${lat}, ${lon}): ${err?.message || 'Network error'}`
    );
  }
}

/**
 * Fetch real US Naval Observatory (USNO) Moon Phase ephemeris data:
 * https://aa.usno.navy.mil/api/moon/phases/year?year={year}
 * Never fabricates or substitutes fake Moon phase dates.
 */
export async function fetchMoonPhaseData(targetDate: Date = new Date()): Promise<MoonPhaseData> {
  const year = targetDate.getUTCFullYear();
  const cacheKey = `tw_real_usno_moon_${year}`;
  const cached = readLocalCache<{ phasedata: any[]; apiversion: string; lastUpdated: string }>(
    cacheKey,
    6 * 3600 * 1000
  );

  let phasedata: any[] | null = null;
  let apiversion = '4.0.1';
  let lastUpdated = new Date().toISOString();
  let isCached = false;

  try {
    // 1. Try backend /api/celestial/moon-phases first
    try {
      const bRes = await fetch(`${API_BASE}/api/celestial/moon-phases?year=${year}`);
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson && Array.isArray(bJson.phasedata) && bJson.phasedata.length > 0) {
          return {
            phaseName: bJson.phase_name,
            illuminationPct: bJson.illumination_pct,
            ageDays: bJson.lunar_age_days,
            stage: bJson.stage,
            stargazingImpact: bJson.stargazing_impact,
            source: bJson.source,
            sourceUrl: bJson.source_url,
            dataClassification: bJson.data_classification || 'Calculated Astronomical Ephemeris',
            lastUpdated: bJson.last_updated,
            cached: Boolean(bJson.cached),
            previousMajorPhase: bJson.previous_major_phase,
            nextMajorPhase: bJson.next_major_phase,
            upcomingPhases: bJson.upcoming_phases,
          };
        }
      }
    } catch {
      // Fallback to direct USNO public API call below
    }

    if (cached && !cached.expired) {
      phasedata = cached.data.phasedata;
      apiversion = cached.data.apiversion;
      lastUpdated = cached.data.lastUpdated;
      isCached = true;
    } else {
      const usnoUrl = `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`;
      const res = await fetch(usnoUrl);
      if (res.status === 429) {
        throw new Error('USNO API rate limit exceeded (HTTP 429).');
      }
      if (!res.ok) {
        throw new Error(`USNO HTTP ${res.status}: ${res.statusText}`);
      }
      const payload = await res.json();
      if (!payload || !Array.isArray(payload.phasedata) || payload.phasedata.length === 0) {
        throw new Error('Invalid USNO response format: missing phasedata array.');
      }
      phasedata = payload.phasedata;
      apiversion = String(payload.apiversion || '4.0.1');
      lastUpdated = new Date().toISOString();
      writeLocalCache(cacheKey, { phasedata, apiversion, lastUpdated });
    }
  } catch (err: any) {
    if (cached) {
      phasedata = cached.data.phasedata;
      apiversion = cached.data.apiversion;
      lastUpdated = cached.data.lastUpdated;
      isCached = true;
    } else {
      throw new Error(
        `US Naval Observatory (USNO) Moon Phase API unavailable: ${err?.message || 'Network error'}`
      );
    }
  }

  const milestones: (UsnoPhaseMilestone & { dtMs: number })[] = (phasedata || []).map((p: any) => {
    const y = Number(p.year);
    const m = String(p.month).padStart(2, '0');
    const d = String(p.day).padStart(2, '0');
    const t = String(p.time || '00:00');
    const utcIso = `${y}-${m}-${d}T${t}:00Z`;
    return {
      phase: String(p.phase),
      year: y,
      month: Number(p.month),
      day: Number(p.day),
      time: t,
      utcIso,
      dtMs: new Date(utcIso).getTime(),
    };
  });

  milestones.sort((a, b) => a.dtMs - b.dtMs);
  const nowMs = targetDate.getTime();
  const past = milestones.filter((m) => m.dtMs <= nowMs);
  const future = milestones.filter((m) => m.dtMs > nowMs);

  const prevMajor = past.length > 0 ? past[past.length - 1] : milestones[0];
  const nextMajor = future.length > 0 ? future[0] : milestones[milestones.length - 1];

  const pastNewMoons = past.filter((m) => m.phase === 'New Moon');
  const futureNewMoons = future.filter((m) => m.phase === 'New Moon');
  const synodicDays = 29.530588853;

  let ageDays = 0;
  let cyclePos = 0;
  if (pastNewMoons.length > 0 && futureNewMoons.length > 0) {
    const lastNm = pastNewMoons[pastNewMoons.length - 1].dtMs;
    const nextNm = futureNewMoons[0].dtMs;
    const spanDays = Math.max(28, (nextNm - lastNm) / 86400000);
    ageDays = Math.max(0, (nowMs - lastNm) / 86400000);
    cyclePos = Math.min(0.9999, ageDays / spanDays);
  } else if (pastNewMoons.length > 0) {
    const lastNm = pastNewMoons[pastNewMoons.length - 1].dtMs;
    ageDays = Math.max(0, (nowMs - lastNm) / 86400000);
    cyclePos = (ageDays % synodicDays) / synodicDays;
  } else if (futureNewMoons.length > 0) {
    const daysUntilNm = Math.max(0, (futureNewMoons[0].dtMs - nowMs) / 86400000);
    ageDays = Math.max(0, synodicDays - (daysUntilNm % synodicDays));
    cyclePos = (ageDays % synodicDays) / synodicDays;
  }

  const illuminationPct = Math.round((1 - Math.cos(2 * Math.PI * cyclePos)) * 50 * 10) / 10;
  const hoursFromPrev = Math.abs(nowMs - prevMajor.dtMs) / 3600000;
  const hoursToNext = Math.abs(nextMajor.dtMs - nowMs) / 3600000;

  let stage: MoonPhaseData['stage'];
  if (hoursFromPrev <= 12) {
    stage = prevMajor.phase as MoonPhaseData['stage'];
  } else if (hoursToNext <= 12) {
    stage = nextMajor.phase as MoonPhaseData['stage'];
  } else if (prevMajor.phase === 'New Moon') {
    stage = 'Waxing Crescent';
  } else if (prevMajor.phase === 'First Quarter') {
    stage = 'Waxing Gibbous';
  } else if (prevMajor.phase === 'Full Moon') {
    stage = 'Waning Gibbous';
  } else {
    stage = 'Waning Crescent';
  }

  const stargazingImpact: MoonPhaseData['stargazingImpact'] =
    illuminationPct < 35
      ? 'Ideal (Dark Skies)'
      : illuminationPct < 70
      ? 'Moderate Sky Brightness'
      : 'Poor (Moon Washout)';

  return {
    phaseName: stage,
    illuminationPct,
    ageDays: Math.round(ageDays * 10) / 10,
    stage,
    stargazingImpact,
    source: `US Naval Observatory (USNO API v${apiversion})`,
    sourceUrl: `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`,
    dataClassification: 'Calculated Astronomical Ephemeris',
    lastUpdated,
    cached: isCached,
    previousMajorPhase: { phase: prevMajor.phase, utcIso: prevMajor.utcIso },
    nextMajorPhase: { phase: nextMajor.phase, utcIso: nextMajor.utcIso },
    upcomingPhases: (future.length > 0 ? future.slice(0, 4) : milestones.slice(0, 4)).map(
      ({ dtMs: _dtMs, ...rest }) => rest
    ),
  };
}

/**
 * Fetch real Lunar Eclipses from IMCCE OPALE public API:
 * https://opale.imcce.fr/api/v1/phenomena/eclipses/301/{year}
 * combined with upcoming USNO primary Moon Phase events.
 * Never silently displays hardcoded or fake eclipse events.
 */
export async function fetchCelestialEvents(_mode: AppMode = 'live'): Promise<CelestialEvent[]> {
  const year = new Date().getUTCFullYear();
  const cacheKey = `tw_real_imcce_eclipses_${year}`;
  const cached = readLocalCache<{ events: CelestialEvent[]; lastUpdated: string }>(
    cacheKey,
    6 * 3600 * 1000
  );

  let eclipseEvents: CelestialEvent[] = [];

  try {
    // 1. Try backend /api/celestial/lunar-eclipses first
    let loadedFromBackend = false;
    try {
      const bRes = await fetch(`${API_BASE}/api/celestial/lunar-eclipses?year=${year}`);
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson && Array.isArray(bJson.eclipses)) {
          eclipseEvents = bJson.eclipses.map((ec: any) => ({
            ...ec,
            lastUpdated: bJson.last_updated,
            cached: Boolean(bJson.cached),
          }));
          loadedFromBackend = true;
        }
      }
    } catch {
      // Fallback to direct IMCCE OPALE API call below
    }

    if (!loadedFromBackend) {
      if (cached && !cached.expired) {
        eclipseEvents = cached.data.events.map((e) => ({ ...e, cached: true }));
      } else {
        const imcceUrl = `https://opale.imcce.fr/api/v1/phenomena/eclipses/301/${year}`;
        const res = await fetch(imcceUrl);
        if (res.status === 429) {
          throw new Error('IMCCE OPALE API rate limit exceeded (HTTP 429).');
        }
        if (!res.ok) {
          throw new Error(`IMCCE OPALE HTTP ${res.status}: ${res.statusText}`);
        }
        const payload = await res.json();
        const rawList = payload?.response?.lunareclipse;
        if (!Array.isArray(rawList)) {
          throw new Error('Invalid IMCCE OPALE response format: missing response.lunareclipse.');
        }

        const fetchedAt = new Date().toISOString();
        eclipseEvents = rawList.map((ec: any, idx: number) => {
          const calDate = String(ec.calendarDate || `${year}-01-01`);
          const rawType = String(ec.type || 'LunarEclipse');
          const readableType = rawType.includes('Total')
            ? 'Total Lunar Eclipse'
            : rawType.includes('Partial')
            ? 'Partial Lunar Eclipse'
            : rawType.includes('Penumbral')
            ? 'Penumbral Lunar Eclipse'
            : rawType;

          const mag = typeof ec.magnitude === 'number' ? ec.magnitude : undefined;
          const dur = ec.duration || {};
          const greatest = ec.events?.greatest || {};
          const p1 = ec.events?.P1 || {};
          const p2 = ec.events?.P2 || {};

          const rawStart = String(greatest.date || p1.date || `${calDate}T00:00:00`);
          const startTime = rawStart.endsWith('Z') ? rawStart : `${rawStart}Z`;
          const p1Utc = p1.date
            ? String(p1.date).endsWith('Z')
              ? String(p1.date)
              : `${p1.date}Z`
            : startTime;
          const endTime = p2.date
            ? String(p2.date).endsWith('Z')
              ? String(p2.date)
              : `${p2.date}Z`
            : startTime;

          const coords = greatest?.zenith?.geometry?.coordinates;
          let locationStr = 'Global Lunar Hemisphere Visibility';
          if (Array.isArray(coords) && coords.length >= 2) {
            const lon = Number(coords[0]);
            const lat = Number(coords[1]);
            locationStr = `Zenith at Greatest Eclipse: ${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
          }

          const durParts: string[] = [];
          if (dur.total) durParts.push(`Total: ${dur.total}`);
          if (dur.partial) durParts.push(`Partial: ${dur.partial}`);
          if (dur.penumbral) durParts.push(`Penumbral: ${dur.penumbral}`);

          return {
            id: `imcce-lunar-eclipse-${calDate}-${idx}`,
            title: `${readableType} (${calDate})`,
            category: 'eclipse',
            eventType: 'astronomical',
            eclipseType: readableType,
            magnitude: mag,
            duration: dur,
            startTime,
            penumbralStartUtc: p1Utc,
            endTime,
            timezone: 'UTC',
            location: locationStr,
            description: `${mag !== undefined ? `Umbral Magnitude ${mag.toFixed(3)}. ` : ''}${durParts.join(' • ')}. Calculated via IMCCE INPOP19A ephemeris.`,
            sourceName: 'IMCCE OPALE Ephemeris (INPOP19A)',
            sourceUrl:
              ec.link?.self ||
              `https://opale.imcce.fr/api/v1/phenomena/eclipses/301/gregorian,${calDate}`,
            dataClassification: 'Calculated Astronomical Ephemeris',
            lastUpdated: fetchedAt,
            cached: false,
          };
        });

        writeLocalCache(cacheKey, { events: eclipseEvents, lastUpdated: fetchedAt });
      }
    }
  } catch (err: any) {
    if (cached) {
      eclipseEvents = cached.data.events.map((e) => ({ ...e, cached: true }));
    } else {
      throw new Error(
        `IMCCE Lunar Eclipse API unavailable: ${err?.message || 'Network error'}`
      );
    }
  }

  // Also include upcoming real USNO primary Moon phases as calculated lunar milestones
  try {
    const moonData = await fetchMoonPhaseData();
    const moonEvents: CelestialEvent[] = (moonData.upcomingPhases || []).slice(0, 2).map((p, i) => ({
      id: `usno-moon-${p.utcIso}-${i}`,
      title: `USNO ${p.phase}`,
      category: 'moon',
      eventType: 'astronomical',
      startTime: p.utcIso,
      timezone: 'UTC',
      location: 'Geocentric Ephemeris (Global Visibility)',
      description: `Official US Naval Observatory calculated ${p.phase} milestone (${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')} ${p.time} UTC).`,
      sourceName: moonData.source,
      sourceUrl: moonData.sourceUrl || `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`,
      dataClassification: 'Calculated Astronomical Ephemeris',
      lastUpdated: moonData.lastUpdated,
      cached: moonData.cached,
    }));
    return [...eclipseEvents, ...moonEvents];
  } catch {
    return eclipseEvents;
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
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    }));
  } catch {
    const q = query.toLowerCase();
    return CANDIDATE_LOCATIONS.filter((l) => l.name.toLowerCase().includes(q));
  }
}
