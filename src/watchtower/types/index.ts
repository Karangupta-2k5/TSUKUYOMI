// Shared TypeScript types for Tsukuyomi Watch

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  timezone?: string;
  population?: number;
  elevation?: number;
}

export interface GeoSearchResponse {
  results: GeoResult[];
}

export interface CurrentConditions {
  time: string;
  temperature_2m: number;
  apparent_temperature?: number;
  relative_humidity_2m: number;
  cloud_cover: number;
  visibility: number;
  wind_speed_10m: number;
  wind_direction_10m?: number;
  precipitation?: number;
  precipitation_probability?: number;
  weather_code: number;
  weather_description: string;
  is_day?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  cloud_cover: number[];
  visibility: number[];
  precipitation_probability: (number | null)[];
  precipitation: (number | null)[];
  wind_speed_10m: number[];
  weather_code: number[];
}

export interface SunriseSunset {
  sunrise: string;
  sunset: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: CurrentConditions;
  hourly: HourlyForecast;
  daily?: SunriseSunset;
  fetched_at: string;
}

export interface ScoreComponent {
  name: string;
  weight: number;
  raw_value: number | null;
  normalized: number | null;
  contribution: number | null;
  available: boolean;
  note: string;
}

export interface NightHonorScore {
  score: number;
  label: string;
  components: ScoreComponent[];
  confidence: number;
  missing_components: string[];
  recommendation: string;
  disclaimer: string;
}

export interface HourlyScore {
  time: string;
  score: number;
  label: string;
  cloud_cover: number;
  visibility: number;
  humidity: number;
}

export interface BestTimeResponse {
  location_name: string;
  date: string;
  night_hours: HourlyScore[];
  best_window_start: string | null;
  best_window_end: string | null;
  best_score: number | null;
  reasoning: string;
  data_available: boolean;
}

export interface NearbyLocation {
  osm_id?: number;
  name: string;
  category: string;
  subcategory?: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  tags: Record<string, string>;
  is_observatory: boolean;
  directions_url: string;
  suitability_note: string;
}

export interface NearbyResponse {
  locations: NearbyLocation[];
  radius_km: number;
  center_lat: number;
  center_lon: number;
  source: string;
  disclaimer: string;
  cached: boolean;
  error?: string;
}

export interface SelectedLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
  displayName: string;
}
