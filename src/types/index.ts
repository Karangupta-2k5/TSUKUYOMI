export type AppMode = 'live' | 'demo';

export interface LocationCoordinates {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  displayName?: string;
}

export interface ScoreComponents {
  clearSky: number; // 0-100
  visibility: number; // 0-100
  humidity: number; // 0-100
  darkness: number | null; // 0-100 or null if unavailable
}

export interface WeatherConditions {
  cloudCoverPct: number;
  humidityPct: number;
  visibilityMeters: number;
  precipitationProbability?: number;
  temperatureC?: number;
  windSpeedKmh?: number;
}

export interface WeatherScoreResponse {
  location: LocationCoordinates;
  observedAt: string;
  forecastHourUtc?: string;
  score: number; // 0-100
  scoreLabel: string; // e.g. "weather-only estimate" | "full astronomical index"
  components: ScoreComponents;
  conditions: WeatherConditions;
  source: string;
  sourceUrl?: string;
  dataClassification?: string;
  lastUpdated?: string;
  cached?: boolean;
  error?: string;
  limitations: string[];
}

export type EventCategory = 'meteor_shower' | 'eclipse' | 'planetary' | 'moon' | 'spaceflight';

export interface CelestialEvent {
  id: string;
  title: string;
  category: EventCategory;
  eventType: 'astronomical' | 'spaceflight';
  startTime: string; // ISO string (UTC)
  penumbralStartUtc?: string;
  endTime?: string;
  timezone: string;
  location?: string;
  description?: string;
  eclipseType?: string;
  magnitude?: number;
  duration?: {
    total?: string;
    partial?: string;
    penumbral?: string;
  };
  sourceName: string;
  sourceUrl: string;
  dataClassification?: string;
  lastUpdated?: string;
  cached?: boolean;
  missionPatchUrl?: string;
  rocketName?: string;
}

export interface UsnoPhaseMilestone {
  phase: string;
  utcIso: string;
  year: number;
  month: number;
  day: number;
  time: string;
}

export interface MoonPhaseData {
  phaseName: string;
  illuminationPct: number;
  ageDays: number;
  stage: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  stargazingImpact: 'Ideal (Dark Skies)' | 'Moderate Sky Brightness' | 'Poor (Moon Washout)';
  source: string;
  sourceUrl?: string;
  dataClassification?: string;
  lastUpdated?: string;
  cached?: boolean;
  error?: string;
  previousMajorPhase?: { phase: string; utcIso: string };
  nextMajorPhase?: { phase: string; utcIso: string };
  upcomingPhases?: UsnoPhaseMilestone[];
}

export interface ImageEnhancementResult {
  originalUrl: string;
  processedUrl: string;
  method: string; // e.g. "Conservative CLAHE + Wavelet Denoise (Deterministic)"
  warnings: string[];
  processingTimeMs: number;
  isGenerative: boolean;
  detectedStarsEstimate?: number;
}
