/**
 * Tsukuyomi Watch: The Samurai’s Celestial Guide
 * Transient Event Detection API Client & Kinematics Calculator
 */

import axios from 'axios';
import {
  TransientEvent,
  TransientDetailResponse,
  TransientVerificationRecord,
} from '../types/transient';
import { FALLBACK_TRANSIENT_EVENTS, buildFallbackDetail } from '../data/transientData';

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');
const BASE_URL = `${API_BASE}/api/transient`;
const STORAGE_KEY = 'tsukuyomi_transient_verifications';

export async function fetchTransientEvents(category?: string): Promise<TransientEvent[]> {
  try {
    const params = category ? { category } : {};
    const res = await axios.get(`${BASE_URL}/events`, { params, timeout: 2500 });
    if (res.data && res.data.events && res.data.events.length > 0) {
      return res.data.events;
    }
  } catch (err) {
    console.warn('[TransientAPI] Backend unavailable, using curated fallback catalog:', err);
  }

  if (category) {
    return FALLBACK_TRANSIENT_EVENTS.filter(
      (e) => e.category.toLowerCase() === category.toLowerCase()
    );
  }
  return FALLBACK_TRANSIENT_EVENTS;
}

export async function fetchTransientDetail(eventId: string): Promise<TransientDetailResponse> {
  try {
    const res = await axios.get(`${BASE_URL}/events/${eventId}`, { timeout: 2500 });
    if (res.data && res.data.event && res.data.timeDomain) {
      return res.data;
    }
  } catch (err) {
    console.warn(`[TransientAPI] Failed to fetch live detail for ${eventId}, generating client-side:`, err);
  }

  return buildFallbackDetail(eventId);
}

/**
 * Calculates relativistic Doppler velocity from observed vs rest wavelength.
 * v = c * ((obs/rest)^2 - 1) / ((obs/rest)^2 + 1)
 */
export function calculateDopplerVelocity(restWavelength: number, observedWavelength: number): {
  deltaLambda: number;
  velocityKmS: number;
  fractionSpeedOfLight: number;
  direction: 'blueshift (approaching/expanding)' | 'redshift (receding)';
} {
  const SPEED_OF_LIGHT = 299792.458; // km/s
  const delta = observedWavelength - restWavelength;
  const ratio = observedWavelength / restWavelength;
  const ratioSq = ratio * ratio;

  // Relativistic Doppler formula
  const beta = (ratioSq - 1) / (ratioSq + 1);
  const v = Math.abs(beta * SPEED_OF_LIGHT);

  return {
    deltaLambda: Number(delta.toFixed(2)),
    velocityKmS: Math.round(v),
    fractionSpeedOfLight: Number((Math.abs(beta) * 100).toFixed(2)),
    direction: delta < 0 ? 'blueshift (approaching/expanding)' : 'redshift (receding)',
  };
}

/**
 * Retrieves persisted transient verification records from localStorage
 */
export function getSavedVerifications(): TransientVerificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves a new verification stamp to localStorage
 */
export function saveVerificationRecord(record: TransientVerificationRecord): void {
  try {
    const current = getSavedVerifications();
    const filtered = current.filter((r) => r.eventId !== record.eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...filtered]));
  } catch (err) {
    console.error('Failed to save verification stamp:', err);
  }
}

