import axios from 'axios';
import type {
  GeoSearchResponse,
  WeatherResponse,
  NightHonorScore,
  BestTimeResponse,
  NearbyResponse,
  SelectedLocation,
} from '../types';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

export async function searchLocations(q: string, count = 10): Promise<GeoSearchResponse> {
  const { data } = await api.get<GeoSearchResponse>('/geocode', { params: { q, count } });
  return data;
}

export async function fetchCurrentLocation(): Promise<SelectedLocation> {
  const { data } = await api.get<SelectedLocation>('/geocode/current-location');
  return data;
}

export async function reverseGeocode(lat: number, lon: number): Promise<SelectedLocation> {
  const { data } = await api.get<SelectedLocation>('/geocode/reverse', { params: { lat, lon } });
  return data;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const { data } = await api.get<WeatherResponse>('/weather', { params: { lat, lon } });
  return data;
}

export async function fetchScore(
  lat: number,
  lon: number,
  population?: number,
): Promise<NightHonorScore> {
  const params: Record<string, unknown> = { lat, lon };
  if (population != null) params.population = population;
  const { data } = await api.get<NightHonorScore>('/score', { params });
  return data;
}

export async function fetchBestTime(
  lat: number,
  lon: number,
  locationName: string,
  population?: number,
): Promise<BestTimeResponse> {
  const params: Record<string, unknown> = { lat, lon, location_name: locationName };
  if (population != null) params.population = population;
  const { data } = await api.get<BestTimeResponse>('/score/best-time', { params });
  return data;
}

export async function fetchNearby(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<NearbyResponse> {
  const { data } = await api.get<NearbyResponse>('/nearby', {
    params: { lat, lon, radius_km: radiusKm },
  });
  return data;
}
