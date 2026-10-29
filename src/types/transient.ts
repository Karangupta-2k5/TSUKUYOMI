/**
 * Tsukuyomi Watch: The Samurai’s Celestial Guide
 * Spectral & Time-Domain Transient Event Detection Types
 * "The Guest Star Divination Sphere (客星・天変観測儀)"
 */

export type TransientCategory =
  | 'Supernova'
  | 'Kilonova'
  | 'Gamma-Ray Burst'
  | 'Tidal Disruption'
  | 'Variable Star';

export type AlertLevel = 'CRITICAL' | 'HIGH' | 'MONITORING';

export interface TransientCoordinates {
  ra: string;
  dec: string;
}

export interface TransientEvent {
  id: string;
  name: string;
  japaneseName: string;
  designation: string;
  type: string;
  category: TransientCategory;
  alertLevel: AlertLevel;
  constellation: string;
  coordinates: TransientCoordinates;
  distance: string;
  discoveryDate: string;
  historicalObserver: string;
  peakMagnitude: number;
  currentMagnitude: number;
  hostGalaxy: string;
  redshift: number;
  expansionVelocityKmS: number;
  declineRateDm15: number;
  description: string;
  samuraiLore: string;
  keyFeatures: string[];
}

export interface LightCurvePoint {
  day: number;
  mjd: number;
  g_mag: number;
  r_mag: number;
  i_mag: number;
  flux_normalized: number;
  phase: string;
}

export interface TimeDomainData {
  lightCurve: LightCurvePoint[];
  peakMagnitude: number;
  declineRateDm15: number;
  riseDays: number;
  bands: string[];
}

export interface SpectralPoint {
  wavelength: number;
  flux: number;
  continuum: number;
}

export interface SpectralLine {
  name: string;
  element: string;
  restWavelength: number;
  observedWavelength: number;
  lineType: 'emission' | 'absorption';
  velocityKmS: number;
  description: string;
}

export interface SpectroscopyData {
  event_id: string;
  spectral_points: SpectralPoint[];
  identified_lines: SpectralLine[];
  redshift: number;
  expansion_velocity_km_s: number;
}

export interface ClassificationData {
  primaryClass: string;
  confidenceScore: number;
  hostRedshift: number;
  expansionVelocity: string;
  anomalyScore: number;
  samuraiVerdict: string;
}

export interface TransientDetailResponse {
  status: string;
  event: TransientEvent;
  timeDomain: TimeDomainData;
  spectroscopy: SpectroscopyData;
  classification: ClassificationData;
}

export interface TransientVerificationRecord {
  eventId: string;
  eventName: string;
  verifiedAt: string;
  dopplerVelocity: number;
  userNotes: string;
  honorPointsAwarded: number;
}

