"""
Scientific Astronomical Star & Extended-Source / Galaxy Candidate Detection Service.
Implements real computer vision and astronomical photometry pipelines using:
  - Astropy (FITS I/O, WCS inspection, SigmaClip, Gaussian2DKernel)
  - Photutils (Background2D, MedianBackground, DAOStarFinder, detect_sources, SourceCatalog, CircularAperture)
  - SciPy / OpenCV / NumPy (connected-component fallback, radial profile & morphology analysis, thumbnail crops)

All measurements are reported honestly in image-dependent pixel/ADU units unless calibrated FITS metadata is present.
"""
from __future__ import annotations

import base64
import csv
import hashlib
import io
import json
import logging
import math
import time
from typing import Any, Literal, Optional

import numpy as np
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ─── Safety & Resource Limits ────────────────────────────────────────────────
MAX_FILE_BYTES = 25 * 1024 * 1024  # 25 MB upload limit
MAX_IMAGE_DIMENSION = 4096         # Max width/height before analysis downsampling
ANALYSIS_MAX_DIM = 1600            # Max internal analysis side for fast laptop response

# ─── Pydantic Models ─────────────────────────────────────────────────────────


class BoundingBox(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int


class CandidateSource(BaseModel):
    id: str
    candidate_type: Literal["star_like", "extended_source", "possible_galaxy", "artifact_or_uncertain"]
    classification_label: str
    classification_explanation: str
    quality: Literal["High", "Medium", "Low"]
    x_centroid: float = Field(..., description="Zero-based X pixel coordinate in original image space")
    y_centroid: float = Field(..., description="Zero-based Y pixel coordinate in original image space")
    peak_intensity: float
    background_level: float
    background_rms: float
    flux_estimate: float = Field(..., description="Background-subtracted integrated pixel flux (uncalibrated ADU)")
    aperture_flux: Optional[float] = None
    area_px: float
    fwhm_px: Optional[float] = None
    semi_major_px: Optional[float] = None
    semi_minor_px: Optional[float] = None
    ellipticity: Optional[float] = None
    orientation_deg: Optional[float] = None
    snr: float
    saturated: bool = False
    near_edge: bool = False
    blended: bool = False
    source_origin: Literal["original_only", "restored_only", "both"] = "original_only"
    restoration_artifact_warning: Optional[str] = None
    warnings: list[str] = Field(default_factory=list)
    bbox: BoundingBox
    ra_deg: Optional[float] = None
    dec_deg: Optional[float] = None


class BackgroundSummary(BaseModel):
    global_median: float
    global_rms: float
    background_min: float
    background_max: float
    mesh_size_used: tuple[int, int]
    method: str


class DetectionSettingsUsed(BaseModel):
    threshold_sigma: float = 4.0
    min_separation_px: float = 5.0
    fwhm_estimate_px: float = 3.5
    min_extended_area_px: int = 28
    max_candidates: int = 150
    display_stretch: Literal["linear", "percentile", "log", "asinh"] = "asinh"
    analyze_restored: bool = False


class DetectionSummaryCounts(BaseModel):
    total_candidates: int
    star_like_count: int
    extended_source_count: int
    possible_galaxy_count: int
    uncertain_or_flagged_count: int
    both_images_count: int = 0
    restored_only_count: int = 0
    original_only_count: int = 0


class DetectionAnalysisResponse(BaseModel):
    image_id: str
    width: int
    height: int
    channels: str
    bit_depth: int
    is_fits: bool = False
    has_wcs_calibration: bool = False
    has_photometric_calibration: bool = False
    coordinate_convention: str = (
        "Zero-based pixel coordinates (x in [0, width-1] left-to-right, y in [0, height-1] top-to-bottom)"
    )
    flux_unit_note: str = (
        "Uncalibrated digital pixel intensity units (ADU). Not apparent magnitude or physical flux."
    )
    background: BackgroundSummary
    settings_used: DetectionSettingsUsed
    summary: DetectionSummaryCounts
    candidates: list[CandidateSource]
    quality_notes: list[str]
    scientific_limitations: list[str]
    display_image_data_url: str
    restored_display_data_url: Optional[str] = None
    analysis_duration_ms: float


# ─── In-Memory Result Cache (keyed by image_id) ─────────────────────────────
_DETECTION_CACHE: dict[str, dict[str, Any]] = {}
_MAX_CACHE_ITEMS = 24


def _store_in_cache(image_id: str, entry: dict[str, Any]) -> None:
    if len(_DETECTION_CACHE) >= _MAX_CACHE_ITEMS and image_id not in _DETECTION_CACHE:
        oldest_key = next(iter(_DETECTION_CACHE))
        _DETECTION_CACHE.pop(oldest_key, None)
    _DETECTION_CACHE[image_id] = entry


def get_cached_entry(image_id: str) -> Optional[dict[str, Any]]:
    return _DETECTION_CACHE.get(image_id)


# ─── 1. Image Loading & Validation (JPEG/PNG/WebP/TIFF + FITS) ───────────────


def load_and_validate_image(
    raw_bytes: bytes,
    filename: str = "upload.png",
) -> dict[str, Any]:
    """
    Validate and decode an uploaded astronomical image (standard raster or FITS).
    Preserves original pixel array without destructive contrast stretching.
    """
    if not raw_bytes:
        raise ValueError("Uploaded image file is empty.")
    if len(raw_bytes) > MAX_FILE_BYTES:
        raise ValueError(f"File exceeds {MAX_FILE_BYTES // (1024 * 1024)} MB maximum size.")

    lower_name = (filename or "").lower()
    is_fits = lower_name.endswith((".fits", ".fit", ".fts")) or raw_bytes[:6] == b"SIMPLE"

    if is_fits:
        return _load_fits_bytes(raw_bytes)

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes))
        pil_img.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError("Invalid or corrupt image file. Supported formats: JPEG, PNG, WebP, TIFF, FITS.") from exc

    width, height = pil_img.size
    if width < 8 or height < 8:
        raise ValueError(f"Image dimensions ({width}x{height}) are too small for astronomical analysis (minimum 8x8).")
    if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
        raise ValueError(
            f"Image dimensions ({width}x{height}) exceed safe limit ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})."
        )

    mode = pil_img.mode
    raw_arr = np.asarray(pil_img)
    if raw_arr.size == 0 or not np.isfinite(raw_arr).any():
        raise ValueError("Image contains no valid finite pixel values.")

    bit_depth = 16 if raw_arr.dtype in (np.uint16, np.int16, np.int32, np.float32, np.float64) else 8
    max_val = float(65535.0 if raw_arr.dtype == np.uint16 else 255.0)

    # Extract scientific luminance in [0, 255] float scale while ignoring alpha channel as signal
    if raw_arr.ndim == 2:
        channels = "Grayscale"
        lum = raw_arr.astype(np.float64) * (255.0 / max_val)
        alpha_mask = np.ones((height, width), dtype=bool)
        rgb_vis = np.stack([ np.clip(lum, 0, 255).astype(np.uint8) ] * 3, axis=-1)
    elif raw_arr.ndim == 3 and raw_arr.shape[2] == 4:
        channels = "RGBA"
        rgb = raw_arr[:, :, :3].astype(np.float64) * (255.0 / max_val)
        alpha = raw_arr[:, :, 3].astype(np.float64) / max_val
        alpha_mask = alpha > 0.05
        # ITU-R BT.601 luminance weighted by alpha mask so transparent pixels are zeroed, not bright
        lum = (0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]) * alpha_mask
        rgb_vis = np.clip(rgb, 0, 255).astype(np.uint8)
    elif raw_arr.ndim == 3 and raw_arr.shape[2] >= 3:
        channels = "RGB"
        rgb = raw_arr[:, :, :3].astype(np.float64) * (255.0 / max_val)
        alpha_mask = np.ones((height, width), dtype=bool)
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        rgb_vis = np.clip(rgb, 0, 255).astype(np.uint8)
    else:
        pil_rgb = pil_img.convert("RGB")
        channels = "RGB"
        rgb = np.asarray(pil_rgb, dtype=np.float64)
        alpha_mask = np.ones((height, width), dtype=bool)
        lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        rgb_vis = np.clip(rgb, 0, 255).astype(np.uint8)

    lum = np.nan_to_num(lum, nan=0.0, posinf=255.0, neginf=0.0)

    return {
        "width": width,
        "height": height,
        "channels": channels,
        "bit_depth": bit_depth,
        "is_fits": False,
        "has_wcs": False,
        "wcs_obj": None,
        "has_phot_cal": False,
        "luminance": lum,
        "alpha_mask": alpha_mask,
        "rgb_vis": rgb_vis,
    }


def _load_fits_bytes(raw_bytes: bytes) -> dict[str, Any]:
    """Load astronomical FITS image array and optional WCS metadata via Astropy."""
    try:
        from astropy.io import fits
        from astropy.wcs import WCS
    except ImportError as exc:
        raise ValueError("Astropy is required to read FITS files.") from exc

    try:
        with fits.open(io.BytesIO(raw_bytes)) as hdul:
            img_hdu = None
            for hdu in hdul:
                if hdu.data is not None and isinstance(hdu.data, np.ndarray) and hdu.data.ndim >= 2:
                    img_hdu = hdu
                    break
            if img_hdu is None:
                raise ValueError("FITS file contains no 2D image extension.")

            data = np.asarray(img_hdu.data, dtype=np.float64)
            while data.ndim > 2:
                data = data[0]

            header = img_hdu.header
            has_wcs = False
            wcs_obj = None
            try:
                w = WCS(header)
                if w.has_celestial:
                    has_wcs = True
                    wcs_obj = w
            except Exception:
                has_wcs = False

            has_phot_cal = any(k in header for k in ("MAGZERO", "PHOTFLAM", "PHOTZPT", "BUNIT"))
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Corrupt or unreadable FITS file: {exc}") from exc

    height, width = data.shape
    if width < 8 or height < 8:
        raise ValueError(f"FITS dimensions ({width}x{height}) are too small.")
    if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
        raise ValueError(f"FITS dimensions ({width}x{height}) exceed limit ({MAX_IMAGE_DIMENSION}).")

    finite_mask = np.isfinite(data)
    if not finite_mask.any():
        raise ValueError("FITS array contains only NaN/Inf values.")

    clean = np.where(finite_mask, data, np.nanmedian(data[finite_mask]))
    lo, hi = np.percentile(clean, [0.5, 99.9])
    span = max(1e-6, hi - lo)
    lum = np.clip((clean - lo) / span * 255.0, 0.0, 255.0)
    gray_u8 = lum.astype(np.uint8)
    rgb_vis = np.stack([gray_u8] * 3, axis=-1)

    return {
        "width": width,
        "height": height,
        "channels": "FITS-2D",
        "bit_depth": 32,
        "is_fits": True,
        "has_wcs": has_wcs,
        "wcs_obj": wcs_obj,
        "has_phot_cal": has_phot_cal,
        "luminance": lum,
        "alpha_mask": finite_mask,
        "rgb_vis": rgb_vis,
    }


# ─── 2. Display Stretch (Visualization Only — Never Mutates Science Array) ──


def render_display_stretch(
    rgb_vis: np.ndarray,
    stretch: Literal["linear", "percentile", "log", "asinh"] = "asinh",
) -> str:
    """
    Generate a base64 PNG data URL with a non-destructive visualization stretch.
    Scientific detection always runs on the un-stretched luminance array.
    """
    arr = rgb_vis.astype(np.float64) / 255.0
    if stretch == "percentile":
        lo, hi = np.percentile(arr, [1.5, 99.4])
        arr = np.clip((arr - lo) / max(1e-5, hi - lo), 0.0, 1.0)
    elif stretch == "log":
        arr = np.log1p(arr * 15.0) / np.log1p(15.0)
    elif stretch == "asinh":
        beta = 4.5
        arr = np.arcsinh(arr * beta) / np.arcsinh(beta)
    # "linear" keeps arr as-is

    out_u8 = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
    pil_out = Image.fromarray(out_u8, mode="RGB")
    buf = io.BytesIO()
    pil_out.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


# ─── 3. 2D Spatially Varying Background Estimation ───────────────────────────


def estimate_2d_background(
    lum: np.ndarray,
    valid_mask: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, BackgroundSummary]:
    """
    Estimate spatially varying 2D sky background and RMS noise using Photutils Background2D
    with adaptive mesh sizing and fallback for small/low-contrast images.
    """
    h, w = lum.shape
    mesh_h = max(16, min(64, h // 6))
    mesh_w = max(16, min(64, w // 6))

    # Mask saturated (>252) and invalid (transparent) pixels during background estimation
    coverage_mask = (~valid_mask) | (lum >= 252.0)

    try:
        from astropy.stats import SigmaClip
        from photutils.background import Background2D, MedianBackground

        if h >= mesh_h * 2 and w >= mesh_w * 2:
            sigma_clip = SigmaClip(sigma=3.0, maxiters=5)
            bkg_estimator = MedianBackground()
            bkg = Background2D(
                lum,
                box_size=(mesh_h, mesh_w),
                filter_size=(3, 3),
                sigma_clip=sigma_clip,
                bkg_estimator=bkg_estimator,
                coverage_mask=coverage_mask if not coverage_mask.all() else None,
                exclude_percentile=50.0,
            )
            bkg_map = np.asarray(bkg.background, dtype=np.float64)
            rms_map = np.asarray(bkg.background_rms, dtype=np.float64)
            rms_floor = max(0.75, float(bkg.background_rms_median))
            rms_map = np.maximum(rms_map, rms_floor * 0.5)
            return (
                bkg_map,
                rms_map,
                BackgroundSummary(
                    global_median=round(float(bkg.background_median), 2),
                    global_rms=round(rms_floor, 3),
                    background_min=round(float(np.min(bkg_map)), 2),
                    background_max=round(float(np.max(bkg_map)), 2),
                    mesh_size_used=(mesh_w, mesh_h),
                    method="Photutils Background2D (MedianBackground + 3σ clipping)",
                ),
            )
    except Exception as exc:
        logger.debug("Photutils Background2D fallback triggered: %s", exc)

    # Resilient MAD sigma-clipped background fallback for very small images
    valid_vals = lum[valid_mask] if valid_mask.any() else lum.ravel()
    med = float(np.median(valid_vals))
    mad = float(np.median(np.abs(valid_vals - med)))
    rms = max(0.75, 1.4826 * mad)
    bkg_map = np.full_like(lum, med, dtype=np.float64)
    rms_map = np.full_like(lum, rms, dtype=np.float64)
    return (
        bkg_map,
        rms_map,
        BackgroundSummary(
            global_median=round(med, 2),
            global_rms=round(rms, 3),
            background_min=round(med, 2),
            background_max=round(med, 2),
            mesh_size_used=(w, h),
            method="Robust Median + MAD Noise Estimator (Small-Frame Fallback)",
        ),
    )


# ─── 4. Point-Source (Star) & Extended-Source (Galaxy/Nebula) Detection ─────


def _measure_radial_fwhm(sub_img: np.ndarray, peak_val: float) -> Optional[float]:
    """Estimate radial Full Width at Half Maximum (FWHM) in pixels from a local cutout."""
    if peak_val <= 0 or sub_img.size < 9:
        return None
    half_max = peak_val * 0.5
    above = np.count_nonzero(sub_img >= half_max)
    if above <= 0:
        return None
    # Equivalent circular diameter at half maximum: D = 2 * sqrt(Area / pi)
    fwhm = 2.0 * math.sqrt(above / math.pi)
    return round(float(max(1.0, min(fwhm, float(max(sub_img.shape))))), 2)


def _detect_single_image_sources(
    img_info: dict[str, Any],
    settings: DetectionSettingsUsed,
) -> tuple[list[CandidateSource], BackgroundSummary, list[str]]:
    """
    Run genuine Photutils segmentation + DAOStarFinder + morphology classification
    on an image's scientific luminance array.
    """
    orig_w, orig_h = img_info["width"], img_info["height"]
    full_lum = img_info["luminance"]
    full_alpha = img_info["alpha_mask"]

    # Downsample gracefully if image is larger than ANALYSIS_MAX_DIM while preserving exact scale factor
    max_side = max(orig_w, orig_h)
    if max_side > ANALYSIS_MAX_DIM:
        scale_down = ANALYSIS_MAX_DIM / float(max_side)
        ana_w = max(16, int(round(orig_w * scale_down)))
        ana_h = max(16, int(round(orig_h * scale_down)))
        pil_lum = Image.fromarray(full_lum.astype(np.float32), mode="F").resize(
            (ana_w, ana_h), Image.Resampling.BILINEAR
        )
        lum = np.asarray(pil_lum, dtype=np.float64)
        pil_alpha = Image.fromarray((full_alpha.astype(np.uint8) * 255), mode="L").resize(
            (ana_w, ana_h), Image.Resampling.NEAREST
        )
        alpha_mask = np.asarray(pil_alpha) > 127
        coord_scale_x = orig_w / float(ana_w)
        coord_scale_y = orig_h / float(ana_h)
    else:
        lum = full_lum
        alpha_mask = full_alpha
        ana_h, ana_w = lum.shape
        coord_scale_x = 1.0
        coord_scale_y = 1.0

    quality_notes: list[str] = []
    if orig_w < 64 or orig_h < 64:
        quality_notes.append("Low spatial resolution (<64 px): morphological classification has reduced certainty.")

    bkg_map, rms_map, bkg_summary = estimate_2d_background(lum, alpha_mask)
    if bkg_summary.global_rms > 18.0:
        quality_notes.append(
            f"Elevated background noise (RMS={bkg_summary.global_rms:.1f} ADU) detected; low-SNR candidates may include sensor noise."
        )

    sub = np.maximum(0.0, (lum - bkg_map) * alpha_mask)
    threshold_2d = settings.threshold_sigma * rms_map

    candidates: list[CandidateSource] = []

    # ── Stage A: Photutils Image Segmentation & SourceCatalog (Stars + Extended Objects) ──
    from astropy.convolution import Gaussian2DKernel, convolve
    from photutils.aperture import CircularAperture, aperture_photometry
    from photutils.detection import DAOStarFinder
    from photutils.segmentation import SourceCatalog, deblend_sources, detect_sources

    sigma_kern = max(1.0, settings.fwhm_estimate_px / 2.355)
    kernel = Gaussian2DKernel(x_stddev=sigma_kern, y_stddev=sigma_kern, x_size=5, y_size=5)
    kernel.normalize()
    convolved = convolve(sub, kernel, normalize_kernel=True)

    segm = detect_sources(convolved, threshold_2d, n_pixels=3)
    seg_candidates: list[dict[str, Any]] = []

    if segm is not None and getattr(segm, "n_labels", getattr(segm, "nlabels", 0)) > 0:
        # Deblend overlapping sources when feasible and not overly fragmented
        if getattr(segm, "n_labels", getattr(segm, "nlabels", 0)) <= 300:
            try:
                segm = deblend_sources(
                    convolved,
                    segm,
                    n_pixels=3,
                    n_levels=16,
                    contrast=0.005,
                )
            except Exception:
                pass

        cat = SourceCatalog(sub, segm, convolved_data=convolved)
        for prop in cat:
            raw_xc = getattr(prop, "x_centroid", None)
            if raw_xc is None:
                raw_xc = getattr(prop, "xcentroid")
            raw_yc = getattr(prop, "y_centroid", None)
            if raw_yc is None:
                raw_yc = getattr(prop, "ycentroid")
            xc = float(raw_xc)
            yc = float(raw_yc)
            if not (np.isfinite(xc) and np.isfinite(yc)):
                continue

            area_ana = float(prop.area.value if hasattr(prop.area, "value") else prop.area)
            flux_ana = float(prop.segment_flux)
            peak_ana = float(prop.max_value)
            if flux_ana <= 0 or peak_ana <= 0:
                continue

            # Local background & RMS at centroid
            iy = max(0, min(ana_h - 1, int(round(yc))))
            ix = max(0, min(ana_w - 1, int(round(xc))))
            loc_bkg = float(bkg_map[iy, ix])
            loc_rms = max(0.5, float(rms_map[iy, ix]))

            # Semi-major, semi-minor, ellipticity, orientation
            raw_a = getattr(prop, "semimajor_axis", None)
            if raw_a is None:
                raw_a = getattr(prop, "semimajor_sigma")
            raw_b = getattr(prop, "semiminor_axis", None)
            if raw_b is None:
                raw_b = getattr(prop, "semiminor_sigma")
            a_val = float(raw_a.value if hasattr(raw_a, "value") else raw_a)
            b_val = float(raw_b.value if hasattr(raw_b, "value") else raw_b)
            ellip = float(prop.ellipticity.value if hasattr(prop.ellipticity, "value") else prop.ellipticity)
            orient = float(prop.orientation.value if hasattr(prop.orientation, "value") else prop.orientation)

            if not np.isfinite(a_val) or a_val <= 0:
                a_val = math.sqrt(area_ana / math.pi) * 0.5
            if not np.isfinite(b_val) or b_val <= 0:
                b_val = a_val
            if not np.isfinite(ellip):
                ellip = max(0.0, min(1.0, 1.0 - (b_val / max(1e-4, a_val))))
            if not np.isfinite(orient):
                orient = 0.0

            # Bounding box in analysis frame
            bx0 = int(prop.bbox.ixmin)
            bx1 = int(prop.bbox.ixmax)
            by0 = int(prop.bbox.iymin)
            by1 = int(prop.bbox.iymax)
            cutout = sub[by0:by1, bx0:bx1]
            fwhm_ana = _measure_radial_fwhm(cutout, peak_ana)

            # Signal-to-noise ratio: integrated flux over sqrt(N_pix) * local_rms
            snr = flux_ana / (math.sqrt(max(1.0, area_ana)) * loc_rms)

            seg_candidates.append(
                {
                    "xc": xc,
                    "yc": yc,
                    "area_ana": area_ana,
                    "flux_ana": flux_ana,
                    "peak": peak_ana + loc_bkg,
                    "peak_sub": peak_ana,
                    "loc_bkg": loc_bkg,
                    "loc_rms": loc_rms,
                    "a": a_val,
                    "b": b_val,
                    "ellip": ellip,
                    "orient": orient,
                    "fwhm": fwhm_ana,
                    "snr": snr,
                    "bbox_ana": (bx0, by0, bx1, by1),
                }
            )

    # ── Stage B: DAOStarFinder Point-Spread Peak Pass (captures sharp unresolved stars) ──
    try:
        daofind = DAOStarFinder(
            fwhm=max(2.0, settings.fwhm_estimate_px),
            threshold=max(2.5, settings.threshold_sigma) * bkg_summary.global_rms,
            sharpness_range=(0.15, 1.4),
            roundness_range=(-1.2, 1.2),
        )
        dao_tbl = daofind(sub)
    except Exception:
        dao_tbl = None

    if dao_tbl is not None and len(dao_tbl) > 0:
        existing_xy = (
            np.array([[c["xc"], c["yc"]] for c in seg_candidates], dtype=np.float64)
            if seg_candidates
            else np.empty((0, 2), dtype=np.float64)
        )
        min_sep = max(2.5, settings.min_separation_px / max(1.0, coord_scale_x))

        for row in dao_tbl:
            xc = float(row["x_centroid"] if "x_centroid" in row.colnames else row["xcentroid"])
            yc = float(row["y_centroid"] if "y_centroid" in row.colnames else row["ycentroid"])
            if not (np.isfinite(xc) and np.isfinite(yc)):
                continue
            if existing_xy.shape[0] > 0:
                dists = np.hypot(existing_xy[:, 0] - xc, existing_xy[:, 1] - yc)
                if float(np.min(dists)) < min_sep:
                    continue

            iy = max(0, min(ana_h - 1, int(round(yc))))
            ix = max(0, min(ana_w - 1, int(round(xc))))
            if not alpha_mask[iy, ix]:
                continue

            loc_bkg = float(bkg_map[iy, ix])
            loc_rms = max(0.5, float(rms_map[iy, ix]))
            r_pad = 5
            y0, y1 = max(0, iy - r_pad), min(ana_h, iy + r_pad + 1)
            x0, x1 = max(0, ix - r_pad), min(ana_w, ix + r_pad + 1)
            patch = sub[y0:y1, x0:x1]
            peak_sub = float(np.max(patch)) if patch.size else float(row["peak"])
            flux_ana = float(np.sum(patch[patch > loc_rms]))
            area_ana = float(max(4, np.count_nonzero(patch > loc_rms * 1.5)))
            fwhm_ana = _measure_radial_fwhm(patch, peak_sub) or settings.fwhm_estimate_px
            snr = flux_ana / (math.sqrt(area_ana) * loc_rms)

            seg_candidates.append(
                {
                    "xc": xc,
                    "yc": yc,
                    "area_ana": area_ana,
                    "flux_ana": flux_ana,
                    "peak": peak_sub + loc_bkg,
                    "peak_sub": peak_sub,
                    "loc_bkg": loc_bkg,
                    "loc_rms": loc_rms,
                    "a": fwhm_ana / 2.355,
                    "b": fwhm_ana / 2.355,
                    "ellip": 0.08,
                    "orient": 0.0,
                    "fwhm": fwhm_ana,
                    "snr": snr,
                    "bbox_ana": (x0, y0, x1, y1),
                }
            )
            existing_xy = np.vstack([existing_xy, [xc, yc]])

    # ── Stage C: Enforce Minimum Separation & Sort by Signal-to-Noise ──
    seg_candidates.sort(key=lambda c: c["snr"], reverse=True)
    filtered: list[dict[str, Any]] = []
    min_sep_ana = max(2.0, settings.min_separation_px / max(1.0, coord_scale_x))

    for cand in seg_candidates:
        if any(math.hypot(cand["xc"] - k["xc"], cand["yc"] - k["yc"]) < min_sep_ana for k in filtered):
            cand["blended"] = True
            continue
        cand["blended"] = False
        filtered.append(cand)
        if len(filtered) >= settings.max_candidates:
            break

    # Check nearby neighbors for blending flag
    for i, c1 in enumerate(filtered):
        for j, c2 in enumerate(filtered):
            if i != j and math.hypot(c1["xc"] - c2["xc"], c1["yc"] - c2["yc"]) < min_sep_ana * 2.1:
                c1["blended"] = True
                break

    # Circular aperture photometry in analysis frame (r = 3.5 px)
    if filtered:
        positions = [(c["xc"], c["yc"]) for c in filtered]
        try:
            aps = CircularAperture(positions, r=3.5)
            phot_tbl = aperture_photometry(sub, aps)
            for idx, c in enumerate(filtered):
                ap_val = float(phot_tbl["aperture_sum"][idx])
                c["ap_flux"] = round(ap_val * coord_scale_x * coord_scale_y, 2) if np.isfinite(ap_val) else None
        except Exception:
            for c in filtered:
                c["ap_flux"] = None

    # Estimate typical stellar PSF FWHM from compact round candidates
    compact_fwhms = [
        c["fwhm"]
        for c in filtered
        if c["fwhm"] is not None and 4 <= c["area_ana"] <= max(24, settings.min_extended_area_px) and c["ellip"] < 0.35
    ]
    median_psf_fwhm = float(np.median(compact_fwhms)) if compact_fwhms else settings.fwhm_estimate_px

    # ── Stage D: Transparent Classification & Coordinate Scaling to Original Frame ──
    edge_margin = 6
    wcs_obj = img_info.get("wcs_obj")
    scale_area = coord_scale_x * coord_scale_y
    scale_len = 0.5 * (coord_scale_x + coord_scale_y)

    for idx, c in enumerate(filtered, start=1):
        x_orig = round(c["xc"] * coord_scale_x, 2)
        y_orig = round(c["yc"] * coord_scale_y, 2)
        area_orig = round(c["area_ana"] * scale_area, 1)
        flux_orig = round(c["flux_ana"] * scale_area, 2)
        fwhm_orig = round(c["fwhm"] * scale_len, 2) if c["fwhm"] is not None else None
        a_orig = round(c["a"] * scale_len, 2)
        b_orig = round(c["b"] * scale_len, 2)
        ellip = round(max(0.0, min(0.99, c["ellip"])), 3)
        orient = round(c["orient"], 1)
        snr = round(max(0.1, c["snr"]), 2)
        peak = round(min(255.0, c["peak"]), 2)

        bx0, by0, bx1, by1 = c["bbox_ana"]
        ox0 = max(0, int(math.floor(bx0 * coord_scale_x)))
        oy0 = max(0, int(math.floor(by0 * coord_scale_y)))
        ox1 = min(orig_w, int(math.ceil(bx1 * coord_scale_x)))
        oy1 = min(orig_h, int(math.ceil(by1 * coord_scale_y)))

        near_edge = (
            ox0 <= edge_margin
            or oy0 <= edge_margin
            or ox1 >= orig_w - edge_margin
            or oy1 >= orig_h - edge_margin
        )
        saturated = peak >= 250.0
        blended = bool(c.get("blended", False))

        warnings: list[str] = []
        if saturated:
            warnings.append("Saturated core (pixel intensity ≥ 250 ADU); centroid and FWHM may be clipped.")
        if near_edge:
            warnings.append("Located within 6 px of image boundary; flux and morphology are truncated.")
        if blended:
            warnings.append("Crowded/blended neighbor within 2× separation radius.")

        # Hot-pixel / cosmic-ray heuristic check: 1–2 px ultra-sharp spike
        is_hot_pixel = c["area_ana"] <= 2.5 and (fwhm_orig is not None and fwhm_orig < 1.35)
        if is_hot_pixel:
            warnings.append("Single/double-pixel impulse spike; possible hot pixel or compression artifact.")

        # Classification decision tree (transparent & non-overclaiming)
        min_ext_area = max(14, settings.min_extended_area_px)
        is_extended = (
            area_orig >= min_ext_area
            and (fwhm_orig is None or fwhm_orig > median_psf_fwhm * 1.45 or a_orig > median_psf_fwhm * 0.95)
        )

        if is_hot_pixel or snr < settings.threshold_sigma * 0.85:
            cand_type: Literal["star_like", "extended_source", "possible_galaxy", "artifact_or_uncertain"] = (
                "artifact_or_uncertain"
            )
            label = "Uncertain / Possible Artifact"
            explanation = (
                "Compact impulse or low-significance peak that does not match a smooth stellar point-spread profile."
            )
        elif is_extended:
            # Distinguish elongated/elliptical galaxy-like morphology from diffuse/irregular extended emission
            if 0.15 <= ellip <= 0.88 and area_orig >= min_ext_area * 1.2 and snr >= 6.0 and not near_edge:
                cand_type = "possible_galaxy"
                label = "Possible Galaxy / Extended Candidate"
                explanation = (
                    f"Extended morphology (area={area_orig:.0f} px², FWHM={fwhm_orig or 0:.1f} px > stellar PSF "
                    f"{median_psf_fwhm:.1f} px, ellipticity={ellip:.2f}). Image morphology alone cannot confirm a galaxy without spectroscopy/WCS."
                )
            else:
                cand_type = "extended_source"
                label = "Extended-Source Candidate"
                explanation = (
                    f"Resolved source larger than point-spread baseline (area={area_orig:.0f} px²). "
                    "May represent a nebula, resolved cluster, blended stars, or extended galaxy."
                )
        else:
            cand_type = "star_like"
            label = "Saturated Star-Like Candidate" if saturated else "Star-Like Point Candidate"
            explanation = (
                f"Compact point-like profile consistent with the image PSF (FWHM={fwhm_orig or median_psf_fwhm:.2f} px, "
                f"ellipticity={ellip:.2f}, SNR={snr:.1f})."
            )

        # Qualitative detection quality rating
        if snr >= 12.0 and not near_edge and not is_hot_pixel:
            quality: Literal["High", "Medium", "Low"] = "High"
        elif snr >= 5.5 and not is_hot_pixel:
            quality = "Medium"
        else:
            quality = "Low"

        ra_deg: Optional[float] = None
        dec_deg: Optional[float] = None
        if wcs_obj is not None:
            try:
                sky = wcs_obj.pixel_to_world(x_orig, y_orig)
                ra_deg = round(float(sky.ra.deg), 6)
                dec_deg = round(float(sky.dec.deg), 6)
            except Exception:
                pass

        candidates.append(
            CandidateSource(
                id=f"CAND-{idx:03d}",
                candidate_type=cand_type,
                classification_label=label,
                classification_explanation=explanation,
                quality=quality,
                x_centroid=x_orig,
                y_centroid=y_orig,
                peak_intensity=peak,
                background_level=round(c["loc_bkg"], 2),
                background_rms=round(c["loc_rms"], 3),
                flux_estimate=flux_orig,
                aperture_flux=c.get("ap_flux"),
                area_px=area_orig,
                fwhm_px=fwhm_orig,
                semi_major_px=a_orig,
                semi_minor_px=b_orig,
                ellipticity=ellip,
                orientation_deg=orient,
                snr=snr,
                saturated=saturated,
                near_edge=near_edge,
                blended=blended,
                source_origin="original_only",
                warnings=warnings,
                bbox=BoundingBox(
                    x_min=ox0,
                    y_min=oy0,
                    x_max=ox1,
                    y_max=oy1,
                    width=max(2, ox1 - ox0),
                    height=max(2, oy1 - oy0),
                ),
                ra_deg=ra_deg,
                dec_deg=dec_deg,
            )
        )

    return candidates, bkg_summary, quality_notes


# ─── 5. Original vs AI-Restored Cross-Matching Pipeline ─────────────────────


def analyze_astronomical_image(
    original_bytes: bytes,
    filename: str = "upload.png",
    settings: Optional[DetectionSettingsUsed] = None,
    restored_bytes: Optional[bytes] = None,
) -> DetectionAnalysisResponse:
    """
    Full scientific pipeline:
    1. Validate & decode original (and optional AI-restored) image.
    2. Run Photutils 2D background + star + extended-source detection on the original image.
    3. When restored image is provided and analyze_restored=True, detect on restored image,
       map coordinates back to original pixel space, cross-match within tolerance, and flag
       restoration-only sources honestly.
    4. Cache results for instant inspection, overlay rendering, and CSV/JSON export.
    """
    t0 = time.perf_counter()
    if settings is None:
        settings = DetectionSettingsUsed()

    orig_info = load_and_validate_image(original_bytes, filename)
    orig_w, orig_h = orig_info["width"], orig_info["height"]

    # Deterministic image_id based on original bytes
    img_hash = hashlib.sha256(original_bytes).hexdigest()[:14]
    image_id = f"astro_{img_hash}"

    orig_candidates, bkg_summary, quality_notes = _detect_single_image_sources(orig_info, settings)

    restored_display_url: Optional[str] = None
    both_count = 0
    restored_only_count = 0
    orig_only_count = len(orig_candidates)

    if restored_bytes and settings.analyze_restored:
        try:
            rest_info = load_and_validate_image(restored_bytes, "restored.png")
            restored_display_url = render_display_stretch(rest_info["rgb_vis"], settings.display_stretch)
            rest_cands, _, _ = _detect_single_image_sources(rest_info, settings)

            # Scale restored coordinates back into original image pixel space
            rx_scale = orig_w / float(rest_info["width"])
            ry_scale = orig_h / float(rest_info["height"])
            match_tol = max(4.5, settings.min_separation_px * 1.25)

            matched_rest_indices: set[int] = set()
            for oc in orig_candidates:
                best_j = None
                best_d = match_tol
                for j, rc in enumerate(rest_cands):
                    rx = rc.x_centroid * rx_scale
                    ry = rc.y_centroid * ry_scale
                    d = math.hypot(oc.x_centroid - rx, oc.y_centroid - ry)
                    if d <= best_d:
                        best_d = d
                        best_j = j
                if best_j is not None:
                    matched_rest_indices.add(best_j)
                    oc.source_origin = "both"
                    both_count += 1

            orig_only_count = len(orig_candidates) - both_count

            # Append candidates that appeared ONLY after AI restoration (with explicit scientific warning)
            next_idx = len(orig_candidates) + 1
            for j, rc in enumerate(rest_cands):
                if j in matched_rest_indices:
                    continue
                if len(orig_candidates) >= settings.max_candidates:
                    break
                rx = round(rc.x_centroid * rx_scale, 2)
                ry = round(rc.y_centroid * ry_scale, 2)
                bx0 = max(0, int(round(rc.bbox.x_min * rx_scale)))
                by0 = max(0, int(round(rc.bbox.y_min * ry_scale)))
                bx1 = min(orig_w, int(round(rc.bbox.x_max * rx_scale)))
                by1 = min(orig_h, int(round(rc.bbox.y_max * ry_scale)))

                warn_msg = (
                    "Detected only after AI restoration. May represent a faint real source, amplified sensor noise, "
                    "or a super-resolution sharpening artifact — verify against raw exposure."
                )
                rc_copy = rc.model_copy(
                    update={
                        "id": f"CAND-{next_idx:03d}",
                        "x_centroid": rx,
                        "y_centroid": ry,
                        "source_origin": "restored_only",
                        "restoration_artifact_warning": warn_msg,
                        "warnings": [*rc.warnings, warn_msg],
                        "bbox": BoundingBox(
                            x_min=bx0,
                            y_min=by0,
                            x_max=bx1,
                            y_max=by1,
                            width=max(2, bx1 - bx0),
                            height=max(2, by1 - by0),
                        ),
                    }
                )
                orig_candidates.append(rc_copy)
                restored_only_count += 1
                next_idx += 1

            quality_notes.append(
                "Some sources are visible only after enhancement. These may be real faint sources, noise, "
                "or restoration artifacts and require verification against the original data."
            )
        except Exception as exc:
            logger.warning("Restored image cross-analysis skipped: %s", exc)

    star_count = sum(1 for c in orig_candidates if c.candidate_type == "star_like")
    ext_count = sum(1 for c in orig_candidates if c.candidate_type == "extended_source")
    gal_count = sum(1 for c in orig_candidates if c.candidate_type == "possible_galaxy")
    unc_count = sum(
        1
        for c in orig_candidates
        if c.candidate_type == "artifact_or_uncertain" or len(c.warnings) > 0
    )

    if len(orig_candidates) == 0:
        quality_notes.append(
            "No sources exceeded the current noise threshold. Try lowering the sigma threshold if faint objects are expected."
        )

    limitations = [
        "Morphological classifications ('Star-Like', 'Extended-Source', 'Possible Galaxy') are heuristic estimates derived from 2D pixel profiles, not spectroscopic or catalog confirmations.",
    ]
    if not orig_info["has_phot_cal"]:
        limitations.append(
            "No photometric zero-point calibration metadata is present; flux is reported in uncalibrated digital pixel intensity units (ADU), not apparent magnitude."
        )
    if not orig_info["has_wcs"]:
        limitations.append(
            "No World Coordinate System (WCS) plate solution is present; positions are reported in zero-based image pixel coordinates (X, Y) rather than celestial RA/Dec."
        )

    display_url = render_display_stretch(orig_info["rgb_vis"], settings.display_stretch)
    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)

    response = DetectionAnalysisResponse(
        image_id=image_id,
        width=orig_w,
        height=orig_h,
        channels=orig_info["channels"],
        bit_depth=orig_info["bit_depth"],
        is_fits=orig_info["is_fits"],
        has_wcs_calibration=orig_info["has_wcs"],
        has_photometric_calibration=orig_info["has_phot_cal"],
        background=bkg_summary,
        settings_used=settings,
        summary=DetectionSummaryCounts(
            total_candidates=len(orig_candidates),
            star_like_count=star_count,
            extended_source_count=ext_count,
            possible_galaxy_count=gal_count,
            uncertain_or_flagged_count=unc_count,
            both_images_count=both_count,
            restored_only_count=restored_only_count,
            original_only_count=orig_only_count,
        ),
        candidates=orig_candidates,
        quality_notes=quality_notes,
        scientific_limitations=limitations,
        display_image_data_url=display_url,
        restored_display_data_url=restored_display_url,
        analysis_duration_ms=elapsed_ms,
    )

    _store_in_cache(
        image_id,
        {
            "response": response,
            "rgb_vis": orig_info["rgb_vis"],
            "original_bytes": original_bytes,
            "restored_bytes": restored_bytes,
            "filename": filename,
        },
    )
    return response


# ─── 6. Candidate Cutout Crop, Annotated Overlay PNG & CSV/JSON Exports ─────


def crop_candidate_preview(rgb_vis: np.ndarray, cand: CandidateSource, pad: int = 28) -> str:
    """Return a zoomed base64 PNG cutout centered on the candidate with padding."""
    h, w = rgb_vis.shape[:2]
    cx = int(round(cand.x_centroid))
    cy = int(round(cand.y_centroid))
    half = max(pad, int(max(cand.bbox.width, cand.bbox.height) * 0.85))
    x0 = max(0, cx - half)
    y0 = max(0, cy - half)
    x1 = min(w, cx + half)
    y1 = min(h, cy + half)
    sub = rgb_vis[y0:y1, x0:x1]
    if sub.size == 0:
        sub = rgb_vis
    pil_crop = Image.fromarray(sub, mode="RGB").resize((160, 160), Image.Resampling.NEAREST)
    buf = io.BytesIO()
    pil_crop.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def render_annotated_overlay_png(rgb_vis: np.ndarray, candidates: list[CandidateSource]) -> bytes:
    """Render a server-side annotated overlay PNG marking all detected candidates."""
    import cv2

    canvas = rgb_vis.copy()
    for c in candidates:
        cx = int(round(c.x_centroid))
        cy = int(round(c.y_centroid))
        if c.candidate_type == "star_like":
            r = max(5, int(round((c.fwhm_px or 4.0) * 1.6)))
            color = (56, 189, 248) if c.source_origin != "restored_only" else (251, 146, 60)
            cv2.circle(canvas, (cx, cy), r, color, 1, lineType=cv2.LINE_AA)
        elif c.candidate_type in ("possible_galaxy", "extended_source"):
            color = (212, 175, 55) if c.candidate_type == "possible_galaxy" else (168, 85, 247)
            cv2.rectangle(
                canvas,
                (c.bbox.x_min, c.bbox.y_min),
                (c.bbox.x_max, c.bbox.y_max),
                color,
                1,
                lineType=cv2.LINE_AA,
            )
        else:
            cv2.drawMarker(canvas, (cx, cy), (248, 113, 113), markerType=cv2.MARKER_TILTED_CROSS, markerSize=8)

    pil_img = Image.fromarray(canvas, mode="RGB")
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()


def export_detections_csv(resp: DetectionAnalysisResponse) -> str:
    """Serialize detection results to a scientific CSV table."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "candidate_type",
            "classification_label",
            "quality",
            "x_centroid_px",
            "y_centroid_px",
            "area_px",
            "peak_intensity_adu",
            "flux_estimate_adu",
            "aperture_flux_adu",
            "fwhm_px",
            "ellipticity",
            "orientation_deg",
            "snr",
            "background_level_adu",
            "background_rms_adu",
            "saturated",
            "near_edge",
            "blended",
            "source_origin",
            "ra_deg",
            "dec_deg",
            "warnings",
        ]
    )
    for c in resp.candidates:
        writer.writerow(
            [
                c.id,
                c.candidate_type,
                c.classification_label,
                c.quality,
                c.x_centroid,
                c.y_centroid,
                c.area_px,
                c.peak_intensity,
                c.flux_estimate,
                c.aperture_flux if c.aperture_flux is not None else "",
                c.fwhm_px if c.fwhm_px is not None else "",
                c.ellipticity if c.ellipticity is not None else "",
                c.orientation_deg if c.orientation_deg is not None else "",
                c.snr,
                c.background_level,
                c.background_rms,
                c.saturated,
                c.near_edge,
                c.blended,
                c.source_origin,
                c.ra_deg if c.ra_deg is not None else "",
                c.dec_deg if c.dec_deg is not None else "",
                "; ".join(c.warnings),
            ]
        )
    return buf.getvalue()


def export_detections_json(resp: DetectionAnalysisResponse) -> str:
    """Serialize full detection metadata and candidates to structured JSON."""
    payload = resp.model_dump(exclude={"display_image_data_url", "restored_display_data_url"})
    return json.dumps(payload, indent=2)
