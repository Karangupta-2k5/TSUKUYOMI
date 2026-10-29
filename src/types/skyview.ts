/**
 * Tsukuyomi Watch: NASA SkyView Virtual Observatory Types
 * "The Sky Lantern Lens (天灯の鏡)"
 */

export type WavelengthCategory =
  | 'Optical (Samurai Eyes)'
  | 'Infrared (Thermal Veils)'
  | 'X-Ray (Cosmic Fury)'
  | 'Radio (Whispers of the Void)';

export type WavelengthBand = 'Optical' | 'Infrared' | 'X-Ray' | 'Radio';

export interface SurveyConfig {
  key: string;
  name: string;
  wavelength: WavelengthBand;
  category: WavelengthCategory;
  instrument: string;
  spectralBand: string;
  description: string;
  colorScheme: {
    accent: string;
    border: string;
    badge: string;
    glow: string;
  };
}

export interface CelestialTargetPreset {
  id: string;
  key: string;
  name: string;
  alias: string;
  kanji: string;
  ra: string;
  dec: string;
  ra_deg: number;
  dec_deg: number;
  distance: string;
  constellation: string;
  lore: string;
  user_photo: string;
  surveys: Record<string, { image: string; fits: string }>;
}

export interface SkyViewQueryParams {
  position: string;
  survey: string;
  pixels: number;
  size: number;
  scaling: 'Log' | 'Linear' | 'HistEq';
  returnFormat: 'JPG' | 'PNG';
}

export interface SkyViewQueryResponse {
  status: 'live' | 'fallback_overload' | 'fallback_timeout' | 'fallback_curated';
  status_note: string;
  nasa_session_token?: string | null;
  target: {
    name: string;
    alias: string;
    kanji: string;
    query_position: string;
    ra: string;
    dec: string;
    ra_deg: number;
    dec_deg: number;
    epoch: string;
  };
  survey: {
    key: string;
    name: string;
    wavelength: WavelengthBand;
    category: WavelengthCategory;
    instrument: string;
    spectralBand: string;
    description: string;
  };
  telemetry: {
    resolution_arcsec_pixel: string;
    fov_degrees: string;
    pixels: string;
    scaling: string;
    exposure_band: string;
    telescope_sensor: string;
    archive_provider: string;
    query_url: string;
  };
  japanese_lore: {
    lore: string;
    kanji: string;
    period: string;
  };
  media: {
    image_url: string;
    fits_url: string | null;
    user_photo?: string;
  };
}

export interface CatalogObservation {
  id: string;
  targetName: string;
  targetAlias: string;
  kanji: string;
  surveyKey: string;
  wavelength: WavelengthBand;
  timestamp: string;
  ra: string;
  dec: string;
  resolution: string;
  fov: string;
  scaling: string;
  verifiedNasa: boolean;
  honorEarned: number;
  imageUrl: string;
  fitsUrl?: string | null;
  userPhotoUrl?: string;
  notes?: string;
}

