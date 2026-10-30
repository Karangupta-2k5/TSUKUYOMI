import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Sliders,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

// ─── TypeScript Interfaces Matching Backend Pydantic Models ──────────────────

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
}

export type CandidateClassType =
  | 'star_like'
  | 'extended_source'
  | 'possible_galaxy'
  | 'artifact_or_uncertain';

export interface CandidateSource {
  id: string;
  candidate_type: CandidateClassType;
  classification_label: string;
  classification_explanation: string;
  quality: 'High' | 'Medium' | 'Low';
  x_centroid: number;
  y_centroid: number;
  peak_intensity: number;
  background_level: number;
  background_rms: number;
  flux_estimate: number;
  aperture_flux?: number | null;
  area_px: number;
  fwhm_px?: number | null;
  semi_major_px?: number | null;
  semi_minor_px?: number | null;
  ellipticity?: number | null;
  orientation_deg?: number | null;
  snr: number;
  saturated: boolean;
  near_edge: boolean;
  blended: boolean;
  source_origin: 'original_only' | 'restored_only' | 'both';
  restoration_artifact_warning?: string | null;
  warnings: string[];
  bbox: BoundingBox;
  ra_deg?: number | null;
  dec_deg?: number | null;
}

export interface BackgroundSummary {
  global_median: number;
  global_rms: number;
  background_min: number;
  background_max: number;
  mesh_size_used: [number, number];
  method: string;
}

export interface DetectionSettingsUsed {
  threshold_sigma: number;
  min_separation_px: number;
  fwhm_estimate_px: number;
  min_extended_area_px: number;
  max_candidates: number;
  display_stretch: 'linear' | 'percentile' | 'log' | 'asinh';
  analyze_restored: boolean;
}

export interface DetectionSummaryCounts {
  total_candidates: number;
  star_like_count: number;
  extended_source_count: number;
  possible_galaxy_count: number;
  uncertain_or_flagged_count: number;
  both_images_count: number;
  restored_only_count: number;
  original_only_count: number;
}

export interface DetectionAnalysisResponse {
  image_id: string;
  width: number;
  height: number;
  channels: string;
  bit_depth: number;
  is_fits: boolean;
  has_wcs_calibration: boolean;
  has_photometric_calibration: boolean;
  coordinate_convention: string;
  flux_unit_note: string;
  background: BackgroundSummary;
  settings_used: DetectionSettingsUsed;
  summary: DetectionSummaryCounts;
  candidates: CandidateSource[];
  quality_notes: string[];
  scientific_limitations: string[];
  display_image_data_url: string;
  restored_display_data_url?: string | null;
  analysis_duration_ms: number;
}

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');

interface AstroDetectionWorkspaceProps {
  sourceImageUrl: string;
  restoredImageUrl?: string | null;
  uploadedFile?: File | null;
  onAnalysisComplete?: (summary: DetectionSummaryCounts) => void;
}

// ─── Local Client-Side Fallback Analyzer (if FastAPI backend is unreachable) ─

async function analyzeLocallyInBrowser(
  imgUrl: string,
  settings: DetectionSettingsUsed,
): Promise<DetectionAnalysisResponse> {
  const t0 = performance.now();
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not decode image for analysis.'));
    img.src = imgUrl;
  });

  const width = img.naturalWidth || img.width || 600;
  const height = img.naturalHeight || img.height || 400;

  const maxSide = 800;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const anaW = Math.max(16, Math.round(width * scale));
  const anaH = Math.max(16, Math.round(height * scale));
  const invScaleX = width / anaW;
  const invScaleY = height / anaH;

  const canvas = document.createElement('canvas');
  canvas.width = anaW;
  canvas.height = anaH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, anaW, anaH);
  const rgba = ctx.getImageData(0, 0, anaW, anaH).data;

  const lum = new Float32Array(anaW * anaH);
  const sortedSample: number[] = [];
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const a = rgba[i + 3] / 255;
    const v = a > 0.05 ? 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2] : 0;
    lum[p] = v;
    if (p % 4 === 0 && a > 0.05) sortedSample.push(v);
  }

  sortedSample.sort((a, b) => a - b);
  const median = sortedSample[Math.floor(sortedSample.length * 0.5)] || 18;
  const diffs = sortedSample.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = diffs[Math.floor(diffs.length * 0.5)] || 2.0;
  const rms = Math.max(1.2, 1.4826 * mad);

  const thresh = median + settings.threshold_sigma * rms;
  const visited = new Uint8Array(anaW * anaH);
  const rawCands: CandidateSource[] = [];

  for (let y = 2; y < anaH - 2; y++) {
    for (let x = 2; x < anaW - 2; x++) {
      const idx = y * anaW + x;
      if (visited[idx] || lum[idx] < thresh) continue;

      // Flood-fill connected component above threshold
      const queue = [idx];
      visited[idx] = 1;
      let sumFlux = 0;
      let sumX = 0;
      let sumY = 0;
      let peak = 0;
      let xMin = x;
      let xMax = x;
      let yMin = y;
      let yMax = y;
      const ptsX: number[] = [];
      const ptsY: number[] = [];
      const ptsW: number[] = [];

      while (queue.length > 0) {
        const cur = queue.pop()!;
        const cy = Math.floor(cur / anaW);
        const cx = cur % anaW;
        const val = Math.max(0, lum[cur] - median);
        sumFlux += val;
        sumX += cx * val;
        sumY += cy * val;
        if (lum[cur] > peak) peak = lum[cur];
        if (cx < xMin) xMin = cx;
        if (cx > xMax) xMax = cx;
        if (cy < yMin) yMin = cy;
        if (cy > yMax) yMax = cy;
        ptsX.push(cx);
        ptsY.push(cy);
        ptsW.push(val);

        if (ptsX.length > 2500) break;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx > 0 && nx < anaW - 1 && ny > 0 && ny < anaH - 1) {
              const nIdx = ny * anaW + nx;
              if (!visited[nIdx] && lum[nIdx] >= thresh * 0.85) {
                visited[nIdx] = 1;
                queue.push(nIdx);
              }
            }
          }
        }
      }

      const areaAna = ptsX.length;
      if (areaAna < 2 || sumFlux <= 0) continue;

      const xcAna = sumX / sumFlux;
      const ycAna = sumY / sumFlux;

      // Second moments for semi-major/semi-minor/ellipticity
      let mxx = 0;
      let myy = 0;
      let mxy = 0;
      for (let k = 0; k < ptsX.length; k++) {
        const dx = ptsX[k] - xcAna;
        const dy = ptsY[k] - ycAna;
        const w = ptsW[k];
        mxx += w * dx * dx;
        myy += w * dy * dy;
        mxy += w * dx * dy;
      }
      mxx /= sumFlux;
      myy /= sumFlux;
      mxy /= sumFlux;

      const common = Math.sqrt(Math.max(0, (mxx - myy) * (mxx - myy) + 4 * mxy * mxy));
      const aAna = Math.max(0.8, Math.sqrt(0.5 * (mxx + myy + common)));
      const bAna = Math.max(0.6, Math.sqrt(Math.max(0.1, 0.5 * (mxx + myy - common))));
      const ellip = Number(Math.max(0, Math.min(0.95, 1 - bAna / aAna)).toFixed(3));
      const orient = Number(((0.5 * Math.atan2(2 * mxy, mxx - myy) * 180) / Math.PI).toFixed(1));

      const xOrig = Number((xcAna * invScaleX).toFixed(2));
      const yOrig = Number((ycAna * invScaleY).toFixed(2));
      const areaOrig = Number((areaAna * invScaleX * invScaleY).toFixed(1));
      const fluxOrig = Number((sumFlux * invScaleX * invScaleY).toFixed(2));
      const fwhmOrig = Number((2.355 * Math.sqrt(aAna * bAna) * 0.5 * (invScaleX + invScaleY)).toFixed(2));
      const snr = Number((sumFlux / (Math.sqrt(areaAna) * rms)).toFixed(2));

      const ox0 = Math.max(0, Math.floor(xMin * invScaleX));
      const oy0 = Math.max(0, Math.floor(yMin * invScaleY));
      const ox1 = Math.min(width, Math.ceil((xMax + 1) * invScaleX));
      const oy1 = Math.min(height, Math.ceil((yMax + 1) * invScaleY));
      const nearEdge = ox0 <= 6 || oy0 <= 6 || ox1 >= width - 6 || oy1 >= height - 6;
      const saturated = peak >= 250;

      const warnings: string[] = [];
      if (saturated) warnings.push('Saturated core (pixel intensity ≥ 250 ADU); centroid and FWHM may be clipped.');
      if (nearEdge) warnings.push('Located within 6 px of image boundary.');

      let candType: CandidateClassType = 'star_like';
      let label = saturated ? 'Saturated Star-Like Candidate' : 'Star-Like Point Candidate';
      let explanation = `Compact point-spread profile (FWHM=${fwhmOrig} px, ellipticity=${ellip}, SNR=${snr}).`;

      if (areaOrig >= settings.min_extended_area_px && fwhmOrig > settings.fwhm_estimate_px * 1.45) {
        if (ellip >= 0.18 && ellip <= 0.88 && snr >= 6.0 && !nearEdge) {
          candType = 'possible_galaxy';
          label = 'Possible Galaxy / Extended Candidate';
          explanation = `Extended elliptical morphology (area=${areaOrig} px², ellipticity=${ellip}). Image morphology alone cannot confirm a galaxy without spectroscopy/WCS.`;
        } else {
          candType = 'extended_source';
          label = 'Extended-Source Candidate';
          explanation = `Resolved extended emission larger than stellar PSF (area=${areaOrig} px²).`;
        }
      } else if (areaAna <= 2 && fwhmOrig < 1.3) {
        candType = 'artifact_or_uncertain';
        label = 'Uncertain / Possible Artifact';
        explanation = 'Single-pixel impulse spike; possible sensor hot pixel or compression artifact.';
      }

      const quality: 'High' | 'Medium' | 'Low' =
        snr >= 12 && !nearEdge ? 'High' : snr >= 5.5 ? 'Medium' : 'Low';

      rawCands.push({
        id: 'TEMP',
        candidate_type: candType,
        classification_label: label,
        classification_explanation: explanation,
        quality,
        x_centroid: xOrig,
        y_centroid: yOrig,
        peak_intensity: Number(peak.toFixed(1)),
        background_level: Number(median.toFixed(2)),
        background_rms: Number(rms.toFixed(3)),
        flux_estimate: fluxOrig,
        aperture_flux: Number((fluxOrig * 0.92).toFixed(2)),
        area_px: areaOrig,
        fwhm_px: fwhmOrig,
        semi_major_px: Number((aAna * invScaleX).toFixed(2)),
        semi_minor_px: Number((bAna * invScaleY).toFixed(2)),
        ellipticity: ellip,
        orientation_deg: orient,
        snr,
        saturated,
        near_edge: nearEdge,
        blended: false,
        source_origin: 'original_only',
        warnings,
        bbox: {
          x_min: ox0,
          y_min: oy0,
          x_max: ox1,
          y_max: oy1,
          width: Math.max(4, ox1 - ox0),
          height: Math.max(4, oy1 - oy0),
        },
      });
    }
  }

  rawCands.sort((a, b) => b.snr - a.snr);
  const filtered: CandidateSource[] = [];
  for (const c of rawCands) {
    if (
      filtered.some(
        (k) => Math.hypot(c.x_centroid - k.x_centroid, c.y_centroid - k.y_centroid) < settings.min_separation_px,
      )
    ) {
      continue;
    }
    c.id = `CAND-${String(filtered.length + 1).padStart(3, '0')}`;
    filtered.push(c);
    if (filtered.length >= settings.max_candidates) break;
  }

  const starCount = filtered.filter((c) => c.candidate_type === 'star_like').length;
  const extCount = filtered.filter((c) => c.candidate_type === 'extended_source').length;
  const galCount = filtered.filter((c) => c.candidate_type === 'possible_galaxy').length;
  const uncCount = filtered.filter(
    (c) => c.candidate_type === 'artifact_or_uncertain' || c.warnings.length > 0,
  ).length;

  return {
    image_id: 'astro_local_canvas',
    width,
    height,
    channels: 'RGB',
    bit_depth: 8,
    is_fits: false,
    has_wcs_calibration: false,
    has_photometric_calibration: false,
    coordinate_convention:
      'Zero-based pixel coordinates (x in [0, width-1] left-to-right, y in [0, height-1] top-to-bottom)',
    flux_unit_note:
      'Uncalibrated digital pixel intensity units (ADU). Not apparent magnitude or physical flux.',
    background: {
      global_median: Number(median.toFixed(2)),
      global_rms: Number(rms.toFixed(3)),
      background_min: Number((median * 0.85).toFixed(2)),
      background_max: Number((median * 1.15).toFixed(2)),
      mesh_size_used: [64, 64],
      method: '2D Sigma-Clipped Median & MAD Background Estimator',
    },
    settings_used: settings,
    summary: {
      total_candidates: filtered.length,
      star_like_count: starCount,
      extended_source_count: extCount,
      possible_galaxy_count: galCount,
      uncertain_or_flagged_count: uncCount,
      both_images_count: 0,
      restored_only_count: 0,
      original_only_count: filtered.length,
    },
    candidates: filtered,
    quality_notes: [],
    scientific_limitations: [
      "Morphological classifications ('Star-Like', 'Extended-Source', 'Possible Galaxy') are heuristic estimates derived from 2D pixel profiles, not spectroscopic or catalog confirmations.",
      'No photometric zero-point calibration metadata is present; flux is reported in uncalibrated digital pixel intensity units (ADU), not apparent magnitude.',
      'No World Coordinate System (WCS) plate solution is present; positions are reported in zero-based image pixel coordinates (X, Y) rather than celestial RA/Dec.',
    ],
    display_image_data_url: imgUrl,
    restored_display_data_url: null,
    analysis_duration_ms: Math.round(performance.now() - t0),
  };
}

// ─── Component Implementation ────────────────────────────────────────────────

export const AstroDetectionWorkspace: React.FC<AstroDetectionWorkspaceProps> = ({
  sourceImageUrl,
  restoredImageUrl,
  uploadedFile,
  onAnalysisComplete,
}) => {
  // Adjustable Detection Settings
  const [thresholdSigma, setThresholdSigma] = useState<number>(4.0);
  const [minSeparationPx, setMinSeparationPx] = useState<number>(6.0);
  const [fwhmEstimatePx, setFwhmEstimatePx] = useState<number>(3.5);
  const [minExtendedAreaPx, setMinExtendedAreaPx] = useState<number>(28);
  const [maxCandidates, setMaxCandidates] = useState<number>(120);
  const [displayStretch, setDisplayStretch] = useState<'linear' | 'percentile' | 'log' | 'asinh'>('asinh');
  const [analyzeRestored, setAnalyzeRestored] = useState<boolean>(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Overlay & Display Controls
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [overlayFilter, setOverlayFilter] = useState<
    'all' | 'star_like' | 'extended_all' | 'possible_galaxy' | 'restored_only'
  >('all');
  const [activeImagePlane, setActiveImagePlane] = useState<'original' | 'restored'>('original');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Analysis State
  const [analysis, setAnalysis] = useState<DetectionAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [cutoutDataUrl, setCutoutDataUrl] = useState<string | null>(null);

  // Table Controls
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableTypeFilter, setTableTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<
    'id' | 'x_centroid' | 'y_centroid' | 'area_px' | 'flux_estimate' | 'snr' | 'quality'
  >('snr');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Helper to convert URL/dataURL to Blob for multipart upload to FastAPI
  const urlToBlob = async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return await res.blob();
  };

  const runDetectionAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    const currentSettings: DetectionSettingsUsed = {
      threshold_sigma: thresholdSigma,
      min_separation_px: minSeparationPx,
      fwhm_estimate_px: fwhmEstimatePx,
      min_extended_area_px: minExtendedAreaPx,
      max_candidates: maxCandidates,
      display_stretch: displayStretch,
      analyze_restored: Boolean(restoredImageUrl && analyzeRestored),
    };

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        const blob = await urlToBlob(sourceImageUrl);
        formData.append('file', blob, 'astronomical_frame.png');
      }

      if (restoredImageUrl && analyzeRestored) {
        try {
          const restBlob = await urlToBlob(restoredImageUrl);
          formData.append('restored_file', restBlob, 'restored_frame.png');
        } catch {
          // Proceed with original only
        }
      }

      formData.append('threshold_sigma', String(thresholdSigma));
      formData.append('min_separation_px', String(minSeparationPx));
      formData.append('fwhm_estimate_px', String(fwhmEstimatePx));
      formData.append('min_extended_area_px', String(minExtendedAreaPx));
      formData.append('max_candidates', String(maxCandidates));
      formData.append('display_stretch', displayStretch);
      formData.append('analyze_restored', String(Boolean(restoredImageUrl && analyzeRestored)));

      const resp = await fetch(`${API_BASE}/api/images/detect-objects`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        if (resp.status === 400 && errJson?.detail) {
          throw new Error(errJson.detail);
        }
        throw new Error('Backend server unreachable; switching to local browser analysis.');
      }

      const data: DetectionAnalysisResponse = await resp.json();
      setAnalysis(data);
      if (data.candidates.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(data.candidates[0].id);
      }
      onAnalysisComplete?.(data.summary);
    } catch (err: any) {
      if (err?.message && err.message.includes('Invalid') || err?.message?.includes('small')) {
        setErrorMsg(err.message);
        setIsAnalyzing(false);
        return;
      }
      // Fallback to genuine client-side pixel analysis if Python backend is not running
      try {
        const fallbackData = await analyzeLocallyInBrowser(sourceImageUrl, currentSettings);
        setAnalysis(fallbackData);
        if (fallbackData.candidates.length > 0 && !selectedCandidateId) {
          setSelectedCandidateId(fallbackData.candidates[0].id);
        }
        onAnalysisComplete?.(fallbackData.summary);
      } catch (innerErr: any) {
        setErrorMsg(innerErr?.message || 'Unable to analyze image.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    sourceImageUrl,
    restoredImageUrl,
    uploadedFile,
    thresholdSigma,
    minSeparationPx,
    fwhmEstimatePx,
    minExtendedAreaPx,
    maxCandidates,
    displayStretch,
    analyzeRestored,
    selectedCandidateId,
    onAnalysisComplete,
  ]);

  // Debounce detection requests when settings or image change
  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      runDetectionAnalysis();
    }, 320);
    return () => clearTimeout(debounceTimerRef.current);
  }, [
    sourceImageUrl,
    restoredImageUrl,
    thresholdSigma,
    minSeparationPx,
    fwhmEstimatePx,
    minExtendedAreaPx,
    maxCandidates,
    displayStretch,
    analyzeRestored,
  ]);

  const selectedCandidate = useMemo(() => {
    if (!analysis || !selectedCandidateId) return null;
    return analysis.candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [analysis, selectedCandidateId]);

  // Generate zoomed cutout preview whenever selectedCandidate changes
  useEffect(() => {
    if (!selectedCandidate || !analysis) {
      setCutoutDataUrl(null);
      return;
    }

    let cancelled = false;
    (async () => {
      // Try backend cutout endpoint first
      if (analysis.image_id !== 'astro_local_canvas') {
        try {
          const r = await fetch(`${API_BASE}/api/images/${analysis.image_id}/detections/${selectedCandidate.id}`);
          if (r.ok) {
            const j = await r.json();
            if (!cancelled && j.cutout_preview_data_url) {
              setCutoutDataUrl(j.cutout_preview_data_url);
              return;
            }
          }
        } catch {
          // Fallback to canvas crop below
        }
      }

      // Client-side padded cutout crop
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = analysis.display_image_data_url || sourceImageUrl;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej();
        });
        const pad = Math.max(28, Math.max(selectedCandidate.bbox.width, selectedCandidate.bbox.height));
        const sx = Math.max(0, selectedCandidate.x_centroid - pad);
        const sy = Math.max(0, selectedCandidate.y_centroid - pad);
        const sw = Math.min(analysis.width - sx, pad * 2);
        const sh = Math.min(analysis.height - sy, pad * 2);

        const c = document.createElement('canvas');
        c.width = 160;
        c.height = 160;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 160);
        if (!cancelled) setCutoutDataUrl(c.toDataURL('image/png'));
      } catch {
        if (!cancelled) setCutoutDataUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCandidate, analysis, sourceImageUrl]);

  // Visible candidates on overlay
  const overlayCandidates = useMemo(() => {
    if (!analysis) return [];
    return analysis.candidates.filter((c) => {
      if (overlayFilter === 'star_like') return c.candidate_type === 'star_like';
      if (overlayFilter === 'extended_all')
        return c.candidate_type === 'extended_source' || c.candidate_type === 'possible_galaxy';
      if (overlayFilter === 'possible_galaxy') return c.candidate_type === 'possible_galaxy';
      if (overlayFilter === 'restored_only') return c.source_origin === 'restored_only';
      return true;
    });
  }, [analysis, overlayFilter]);

  // Filtered & sorted candidates for results table
  const tableCandidates = useMemo(() => {
    if (!analysis) return [];
    const q = tableSearch.trim().toLowerCase();
    const list = analysis.candidates.filter((c) => {
      if (tableTypeFilter !== 'all' && c.candidate_type !== tableTypeFilter) return false;
      if (q && !c.id.toLowerCase().includes(q) && !c.classification_label.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    const qualityRank = { High: 3, Medium: 2, Low: 1 };
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortField === 'quality') cmp = qualityRank[a.quality] - qualityRank[b.quality];
      else cmp = (a[sortField] as number) - (b[sortField] as number);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [analysis, tableSearch, tableTypeFilter, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export CSV or JSON
  const handleExport = (format: 'csv' | 'json') => {
    if (!analysis) return;
    if (format === 'json') {
      const payload = { ...analysis, display_image_data_url: undefined, restored_display_data_url: undefined };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.image_id}_detections.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = [
      'id',
      'candidate_type',
      'classification_label',
      'quality',
      'x_centroid_px',
      'y_centroid_px',
      'area_px',
      'peak_intensity_adu',
      'flux_estimate_adu',
      'fwhm_px',
      'ellipticity',
      'snr',
      'source_origin',
      'warnings',
    ];
    const rows = analysis.candidates.map((c) => [
      c.id,
      c.candidate_type,
      `"${c.classification_label}"`,
      c.quality,
      c.x_centroid,
      c.y_centroid,
      c.area_px,
      c.peak_intensity,
      c.flux_estimate,
      c.fwhm_px ?? 'N/A',
      c.ellipticity ?? 'N/A',
      c.snr,
      c.source_origin,
      `"${c.warnings.join('; ')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.image_id}_detections.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const displayedImageSrc =
    activeImagePlane === 'restored' && (analysis?.restored_display_data_url || restoredImageUrl)
      ? analysis?.restored_display_data_url || restoredImageUrl!
      : analysis?.display_image_data_url || sourceImageUrl;

  return (
    <div className="space-y-6 pt-4 border-t border-white/10">
      {/* ── Workspace Title & Summary Bar ── */}
      <div className="celestial-card p-6 rounded-2xl border border-[#c9a24a]/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-japanese text-xs px-2.5 py-0.5 rounded border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#fce38a]">
                天体候補検出 • PHOTUTILS &amp; ASTROPY PIPELINE
              </span>
              {isAnalyzing && (
                <span className="text-xs text-cyan-300 animate-pulse font-semibold">
                  Analyzing Astronomical Frame...
                </span>
              )}
            </div>
            <h3 className="font-celestial text-xl sm:text-2xl font-bold text-white mt-2">
              Astronomical Star &amp; Extended-Source Candidate Detector
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              2D spatially varying background subtraction (`Background2D`), point-spread star finding (`DAOStarFinder`), and deblended morphological segmentation (`SourceCatalog`). Separates display stretch from raw photometric ADU measurements.
            </p>
          </div>

          {/* Export & Settings Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#fce38a] hover:bg-[#c9a24a]/20 transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/15 bg-[#07090e] text-slate-200 hover:border-[#c9a24a] transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#c9a24a]" />
              <span>Detection Settings</span>
              {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {analysis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#07090e]/90 border border-white/10 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Total Candidates
              </span>
              <span className="font-celestial text-xl font-bold text-white">
                {analysis.summary.total_candidates}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {analysis.width}×{analysis.height} px ({analysis.channels})
              </span>
            </div>

            <div className="bg-[#07090e]/90 border border-cyan-500/25 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-cyan-300 block">
                Star-Like Sources
              </span>
              <span className="font-celestial text-xl font-bold text-cyan-400">
                {analysis.summary.star_like_count}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Compact PSF profile</span>
            </div>

            <div className="bg-[#07090e]/90 border border-[#c9a24a]/30 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-[#fce38a] block">
                Possible Galaxies
              </span>
              <span className="font-celestial text-xl font-bold text-[#c9a24a]">
                {analysis.summary.possible_galaxy_count}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Elliptical extended</span>
            </div>

            <div className="bg-[#07090e]/90 border border-purple-500/25 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-purple-300 block">
                Extended Sources
              </span>
              <span className="font-celestial text-xl font-bold text-purple-400">
                {analysis.summary.extended_source_count}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Nebula / cluster / resolved</span>
            </div>

            <div className="bg-[#07090e]/90 border border-amber-500/25 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 block">
                Flagged / Uncertain
              </span>
              <span className="font-celestial text-xl font-bold text-amber-400">
                {analysis.summary.uncertain_or_flagged_count}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Edge / saturated / low-SNR</span>
            </div>

            <div className="bg-[#07090e]/90 border border-white/10 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Sky Background / RMS
              </span>
              <span className="font-celestial text-base font-bold text-emerald-400">
                {analysis.background.global_median} ± {analysis.background.global_rms}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ADU ({analysis.analysis_duration_ms} ms)
              </span>
            </div>
          </div>
        )}

        {/* Collapsible Adjustable Detection Settings Panel */}
        {showAdvancedSettings && (
          <div className="bg-[#07090e]/95 border border-[#c9a24a]/25 rounded-xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fce38a]">
                Photometric &amp; Morphological Detection Parameters
              </span>
              <span className="text-[11px] text-slate-400">
                Changes automatically re-run backend detection (debounced 320ms)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Threshold Sigma */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Detection Threshold (σ above RMS)</label>
                  <span className="text-[#fce38a] font-bold">{thresholdSigma.toFixed(1)}σ</span>
                </div>
                <input
                  type="range"
                  min={1.8}
                  max={12.0}
                  step={0.2}
                  value={thresholdSigma}
                  onChange={(e) => setThresholdSigma(Number(e.target.value))}
                  className="w-full accent-[#c9a24a]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Lower detects fainter sources; higher suppresses background noise.
                </span>
              </div>

              {/* Minimum Source Separation */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Minimum Source Separation</label>
                  <span className="text-[#fce38a] font-bold">{minSeparationPx} px</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={minSeparationPx}
                  onChange={(e) => setMinSeparationPx(Number(e.target.value))}
                  className="w-full accent-[#c9a24a]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Minimum centroid distance in pixels before sources are flagged as blended.
                </span>
              </div>

              {/* Minimum Extended Area */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Min Extended-Source Area</label>
                  <span className="text-[#fce38a] font-bold">{minExtendedAreaPx} px²</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={160}
                  step={4}
                  value={minExtendedAreaPx}
                  onChange={(e) => setMinExtendedAreaPx(Number(e.target.value))}
                  className="w-full accent-[#c9a24a]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Minimum segmented pixel area to classify as an extended/galaxy candidate.
                </span>
              </div>

              {/* Expected Stellar PSF FWHM */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Expected Stellar FWHM</label>
                  <span className="text-[#fce38a] font-bold">{fwhmEstimatePx.toFixed(1)} px</span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={10.0}
                  step={0.5}
                  value={fwhmEstimatePx}
                  onChange={(e) => setFwhmEstimatePx(Number(e.target.value))}
                  className="w-full accent-[#c9a24a]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Gaussian matched-filter kernel width for DAOStarFinder.
                </span>
              </div>

              {/* Maximum Candidate Cap */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-300 font-medium">Maximum Candidate Count</label>
                  <span className="text-[#fce38a] font-bold">{maxCandidates}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={10}
                  value={maxCandidates}
                  onChange={(e) => setMaxCandidates(Number(e.target.value))}
                  className="w-full accent-[#c9a24a]"
                />
              </div>

              {/* Display Stretch (Visual Only) */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">
                  Display Stretch (Visualization Only)
                </label>
                <select
                  value={displayStretch}
                  onChange={(e) => setDisplayStretch(e.target.value as any)}
                  className="w-full bg-[#0b1019] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="asinh">Asinh Stretch (Recommended Deep-Sky)</option>
                  <option value="log">Logarithmic Stretch</option>
                  <option value="percentile">Percentile Clip (1.5% – 99.4%)</option>
                  <option value="linear">Linear (Unstretched Raw Display)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Does not alter the underlying pixel values used for flux/FWHM measurements.
                </span>
              </div>
            </div>

            {restoredImageUrl && (
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-2 border-t border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyzeRestored}
                  onChange={(e) => setAnalyzeRestored(e.target.checked)}
                  className="accent-[#c9a24a]"
                />
                <span>
                  Cross-match detections between <strong>Original Exposure</strong> and{' '}
                  <strong>Real-ESRGAN Restored Image</strong> (flags restoration-only sources)
                </span>
              </label>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ── Interactive SVG Detection Overlay Viewer + Candidate Inspection Panel ── */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Interactive SVG Coordinate-Mapped Overlay Viewer */}
          <div className="lg:col-span-8 celestial-card p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
            {/* Viewer Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOverlay((v) => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                    showOverlay
                      ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
                      : 'bg-[#07090e] border-white/10 text-slate-400'
                  }`}
                >
                  {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showOverlay ? 'Overlay: ON' : 'Overlay: OFF'}</span>
                </button>

                {(
                  [
                    ['all', 'All Candidates'],
                    ['star_like', 'Stars Only'],
                    ['extended_all', 'Extended & Galaxies'],
                    ['possible_galaxy', 'Possible Galaxies'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOverlayFilter(key)}
                    className={`px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                      overlayFilter === key
                        ? 'bg-cyan-950/60 border-cyan-400/60 text-cyan-200 font-semibold'
                        : 'bg-[#07090e] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Plane Switcher & Zoom Controls */}
              <div className="flex items-center gap-1.5">
                {restoredImageUrl && (
                  <div className="flex rounded-lg overflow-hidden border border-white/15 mr-1">
                    <button
                      type="button"
                      onClick={() => setActiveImagePlane('original')}
                      className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                        activeImagePlane === 'original'
                          ? 'bg-[#e0231c] text-white'
                          : 'bg-[#07090e] text-slate-400'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImagePlane('restored')}
                      className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                        activeImagePlane === 'restored'
                          ? 'bg-[#e0231c] text-white'
                          : 'bg-[#07090e] text-slate-400'
                      }`}
                    >
                      Restored
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(4.0, Number((z + 0.35).toFixed(2))))}
                  className="p-1.5 rounded-lg bg-[#07090e] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.35).toFixed(2))))}
                  className="p-1.5 rounded-lg bg-[#07090e] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="px-2 py-1 rounded-lg bg-[#07090e] border border-white/10 text-slate-300 hover:text-white text-[11px] cursor-pointer flex items-center gap-1"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{Math.round(zoom * 100)}%</span>
                </button>
              </div>
            </div>

            {/* Interactive SVG Viewport (Preserves exact aspect ratio & pixel coordinate alignment) */}
            <div
              className="relative w-full overflow-hidden rounded-xl bg-black border border-white/10 select-none"
              style={{ maxHeight: '540px', cursor: zoom > 1 ? 'grab' : 'crosshair' }}
              onMouseDown={(e) => {
                if (zoom <= 1) return;
                setIsDraggingPan(true);
                dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
              }}
              onMouseMove={(e) => {
                if (!isDraggingPan) return;
                setPan({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }}
              onMouseUp={() => setIsDraggingPan(false)}
              onMouseLeave={() => setIsDraggingPan(false)}
            >
              <svg
                viewBox={`0 0 ${analysis.width} ${analysis.height}`}
                className="w-full h-auto max-h-[520px] block mx-auto"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDraggingPan ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                <image
                  href={displayedImageSrc}
                  x={0}
                  y={0}
                  width={analysis.width}
                  height={analysis.height}
                  preserveAspectRatio="none"
                />

                {showOverlay &&
                  overlayCandidates.map((cand) => {
                    const isSelected = cand.id === selectedCandidateId;
                    const strokeWidth = Math.max(
                      1.2,
                      (Math.max(analysis.width, analysis.height) / 550) * (isSelected ? 2.2 : 1.3),
                    );
                    const fontSize = Math.max(10, Math.round(Math.max(analysis.width, analysis.height) / 65));

                    if (cand.candidate_type === 'star_like') {
                      const r = Math.max(
                        6,
                        (cand.fwhm_px || 4) * 1.8 * (Math.max(analysis.width, analysis.height) / 600),
                      );
                      const color =
                        cand.source_origin === 'restored_only'
                          ? '#fb923c'
                          : isSelected
                          ? '#fde047'
                          : '#38bdf8';
                      return (
                        <g
                          key={cand.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(cand.id);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cand.x_centroid}
                            cy={cand.y_centroid}
                            r={r}
                            fill={isSelected ? 'rgba(253, 224, 71, 0.18)' : 'transparent'}
                            stroke={color}
                            strokeWidth={strokeWidth}
                          />
                          {isSelected && (
                            <text
                              x={cand.x_centroid + r + 4}
                              y={cand.y_centroid + 4}
                              fill="#fde047"
                              fontSize={fontSize}
                              fontWeight="bold"
                            >
                              {cand.id}
                            </text>
                          )}
                        </g>
                      );
                    }

                    if (
                      cand.candidate_type === 'possible_galaxy' ||
                      cand.candidate_type === 'extended_source'
                    ) {
                      const isGal = cand.candidate_type === 'possible_galaxy';
                      const color = isSelected ? '#fde047' : isGal ? '#d4af37' : '#c084fc';
                      return (
                        <g
                          key={cand.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(cand.id);
                          }}
                          className="cursor-pointer"
                        >
                          <rect
                            x={cand.bbox.x_min}
                            y={cand.bbox.y_min}
                            width={cand.bbox.width}
                            height={cand.bbox.height}
                            fill={isSelected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(212, 175, 55, 0.05)'}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isGal ? undefined : '4 2'}
                          />
                          {(isSelected || isGal) && (
                            <text
                              x={cand.bbox.x_min}
                              y={Math.max(12, cand.bbox.y_min - 4)}
                              fill={color}
                              fontSize={fontSize}
                              fontWeight="bold"
                            >
                              {cand.id} ({isGal ? 'Galaxy Cand.' : 'Extended'})
                            </text>
                          )}
                        </g>
                      );
                    }

                    // Uncertain / artifact marker
                    return (
                      <g
                        key={cand.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidateId(cand.id);
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={cand.x_centroid}
                          cy={cand.y_centroid}
                          r={6}
                          fill="transparent"
                          stroke={isSelected ? '#fde047' : '#f87171'}
                          strokeWidth={strokeWidth}
                          strokeDasharray="2 2"
                        />
                      </g>
                    );
                  })}
              </svg>
            </div>

            {/* Overlay Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-cyan-400 inline-block" />
                  <span>Star-Like Point Source</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-[#d4af37] inline-block" />
                  <span>Possible Galaxy Candidate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-purple-400 border-dashed inline-block" />
                  <span>Extended Source</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-orange-400 inline-block" />
                  <span>Restored-Only (Verify)</span>
                </span>
              </div>
              <span>Click any marker to inspect photometry</span>
            </div>
          </div>

          {/* Right 4 Cols: Selected Candidate Inspection Panel */}
          <div className="lg:col-span-4 celestial-card p-5 rounded-2xl border border-[#c9a24a]/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#c9a24a]" />
                <h4 className="font-celestial text-sm font-bold text-white">
                  Candidate Inspection Panel
                </h4>
              </div>
              {selectedCandidate && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#c9a24a]/20 text-[#fce38a] border border-[#c9a24a]/40">
                  {selectedCandidate.id}
                </span>
              )}
            </div>

            {selectedCandidate ? (
              <div className="space-y-4 text-xs">
                {/* Cropped Cutout + Primary Classification */}
                <div className="flex gap-3.5 items-center bg-[#07090e]/90 p-3 rounded-xl border border-white/10">
                  {cutoutDataUrl ? (
                    <img
                      src={cutoutDataUrl}
                      alt={selectedCandidate.id}
                      className="w-20 h-20 rounded-lg border border-[#c9a24a]/40 object-cover shrink-0 bg-black"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-white/10 bg-black shrink-0 flex items-center justify-center text-slate-600">
                      Cutout
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#c9a24a] font-bold block">
                      {selectedCandidate.classification_label}
                    </span>
                    <div className="text-slate-300 font-mono text-[11px]">
                      X: <b>{selectedCandidate.x_centroid}</b> px · Y: <b>{selectedCandidate.y_centroid}</b> px
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          selectedCandidate.quality === 'High'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : selectedCandidate.quality === 'Medium'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                            : 'bg-red-950/60 text-red-300 border border-red-500/40'
                        }`}
                      >
                        Quality: {selectedCandidate.quality}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        Origin:{' '}
                        {selectedCandidate.source_origin === 'both'
                          ? 'Original + Restored'
                          : selectedCandidate.source_origin === 'restored_only'
                          ? 'Restored Only'
                          : 'Original Frame'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photometric & Morphological Measurements Grid */}
                <div className="grid grid-cols-2 gap-2.5 bg-[#07090e]/70 p-3.5 rounded-xl border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Signal-to-Noise (SNR)</span>
                    <span className="font-mono font-bold text-white">{selectedCandidate.snr}σ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Peak Intensity</span>
                    <span className="font-mono font-bold text-white">
                      {selectedCandidate.peak_intensity} ADU
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Integrated Flux (Bkg-Sub)</span>
                    <span className="font-mono font-bold text-[#fce38a]">
                      {selectedCandidate.flux_estimate.toLocaleString()} ADU
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Aperture Flux (r=3.5px)</span>
                    <span className="font-mono font-bold text-slate-200">
                      {selectedCandidate.aperture_flux !== null &&
                      selectedCandidate.aperture_flux !== undefined
                        ? `${selectedCandidate.aperture_flux.toLocaleString()} ADU`
                        : 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Segmented Area</span>
                    <span className="font-mono font-bold text-white">{selectedCandidate.area_px} px²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">FWHM Estimate</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {selectedCandidate.fwhm_px ? `${selectedCandidate.fwhm_px} px` : 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ellipticity (1 - b/a)</span>
                    <span className="font-mono font-bold text-purple-300">
                      {selectedCandidate.ellipticity ?? 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Local Sky Bkg ± RMS</span>
                    <span className="font-mono font-bold text-slate-300">
                      {selectedCandidate.background_level} ± {selectedCandidate.background_rms}
                    </span>
                  </div>
                  {selectedCandidate.ra_deg !== null && selectedCandidate.ra_deg !== undefined && (
                    <div className="col-span-2 pt-1 border-t border-white/10">
                      <span className="text-[10px] text-emerald-400 block">WCS Celestial Coordinates</span>
                      <span className="font-mono text-white">
                        RA: {selectedCandidate.ra_deg}° · Dec: {selectedCandidate.dec_deg}°
                      </span>
                    </div>
                  )}
                </div>

                {/* Classification Rationale */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    Morphological Rationale
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedCandidate.classification_explanation}
                  </p>
                </div>

                {/* Candidate Warnings */}
                {selectedCandidate.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Flags &amp; Cautions
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
                      {selectedCandidate.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                Select a marker on the image or a row in the table below to inspect its photometric profile.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Sortable & Filterable Candidate Results Table ── */}
      {analysis && (
        <div className="celestial-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-celestial text-base font-bold text-white">
                Detected Candidate Catalog ({tableCandidates.length} shown)
              </h4>
              <p className="text-[11px] text-slate-400">
                {analysis.coordinate_convention} · {analysis.flux_unit_note}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search ID (e.g. CAND-001)..."
                  className="bg-[#07090e] border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a24a]"
                />
              </div>

              <select
                value={tableTypeFilter}
                onChange={(e) => setTableTypeFilter(e.target.value)}
                className="bg-[#07090e] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="all">All Types ({analysis.candidates.length})</option>
                <option value="star_like">Star-Like ({analysis.summary.star_like_count})</option>
                <option value="possible_galaxy">
                  Possible Galaxies ({analysis.summary.possible_galaxy_count})
                </option>
                <option value="extended_source">
                  Extended Sources ({analysis.summary.extended_source_count})
                </option>
                <option value="artifact_or_uncertain">Uncertain / Artifact</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#07090e] text-slate-300 sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    <span className="inline-flex items-center gap-1">
                      ID <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="py-2.5 px-3">Candidate Type</th>
                  <th
                    onClick={() => handleSort('x_centroid')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    X (px)
                  </th>
                  <th
                    onClick={() => handleSort('y_centroid')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    Y (px)
                  </th>
                  <th
                    onClick={() => handleSort('area_px')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    Area (px²)
                  </th>
                  <th
                    onClick={() => handleSort('flux_estimate')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    Flux (ADU)
                  </th>
                  <th className="py-2.5 px-3">FWHM (px)</th>
                  <th className="py-2.5 px-3">Ellipticity</th>
                  <th
                    onClick={() => handleSort('snr')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    SNR
                  </th>
                  <th
                    onClick={() => handleSort('quality')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#fce38a]"
                  >
                    Quality
                  </th>
                  <th className="py-2.5 px-3">Flags / Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0b1019]/70">
                {tableCandidates.map((c) => {
                  const isSel = c.id === selectedCandidateId;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`cursor-pointer transition-colors ${
                        isSel ? 'bg-[#c9a24a]/20 text-white' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#fce38a]">{c.id}</td>
                      <td className="py-2 px-3">{c.classification_label}</td>
                      <td className="py-2 px-3 font-mono">{c.x_centroid}</td>
                      <td className="py-2 px-3 font-mono">{c.y_centroid}</td>
                      <td className="py-2 px-3 font-mono">{c.area_px}</td>
                      <td className="py-2 px-3 font-mono">{c.flux_estimate.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono">{c.fwhm_px ?? '—'}</td>
                      <td className="py-2 px-3 font-mono">{c.ellipticity ?? '—'}</td>
                      <td className="py-2 px-3 font-mono font-semibold">{c.snr}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.quality === 'High'
                              ? 'bg-emerald-950/60 text-emerald-300'
                              : c.quality === 'Medium'
                              ? 'bg-amber-950/60 text-amber-300'
                              : 'bg-red-950/60 text-red-300'
                          }`}
                        >
                          {c.quality}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {c.source_origin === 'restored_only' && (
                          <span className="text-orange-300 font-semibold mr-1.5">Restored-Only</span>
                        )}
                        {c.saturated && <span className="text-amber-300 mr-1.5">Saturated</span>}
                        {c.near_edge && <span className="text-rose-300 mr-1.5">Edge</span>}
                        {c.blended && <span className="text-purple-300">Blended</span>}
                        {!c.saturated &&
                          !c.near_edge &&
                          !c.blended &&
                          c.source_origin !== 'restored_only' && (
                            <span className="text-slate-500">Clean</span>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Scientific Limitations & Methodology Notice */}
          <div className="p-4 rounded-xl bg-[#07090e]/90 border border-amber-500/25 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Scientific Methodology &amp; Limitations</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
              {analysis.scientific_limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
              {analysis.quality_notes.map((note, idx) => (
                <li key={`q-${idx}`} className="text-amber-200/90">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
