"""
FastAPI Router for Astronomical Star & Extended-Source / Galaxy Candidate Detection (Spirit Lens).
Endpoints:
  - POST /api/images/detect-objects
  - GET  /api/images/{image_id}/detections
  - GET  /api/images/{image_id}/detections/{candidate_id}
  - GET  /api/images/{image_id}/detection-overlay
  - GET  /api/images/{image_id}/detections/export?format=csv|json
"""
from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import PlainTextResponse, Response

from services.astro_detector import (
    CandidateSource,
    DetectionAnalysisResponse,
    DetectionSettingsUsed,
    analyze_astronomical_image,
    crop_candidate_preview,
    export_detections_csv,
    export_detections_json,
    get_cached_entry,
    render_annotated_overlay_png,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["astronomical-detection"])


@router.post("/detect-objects", response_model=DetectionAnalysisResponse)
async def detect_objects(
    file: Optional[UploadFile] = File(None, description="Original astronomical image (JPEG, PNG, WebP, TIFF, FITS)"),
    restored_file: Optional[UploadFile] = File(None, description="Optional AI-restored image for cross-matching"),
    image_id: Optional[str] = Form(None, description="Cached image_id when re-running with updated settings"),
    threshold_sigma: float = Form(4.0, ge=1.2, le=25.0),
    min_separation_px: float = Form(5.0, ge=1.5, le=100.0),
    fwhm_estimate_px: float = Form(3.5, ge=1.0, le=25.0),
    min_extended_area_px: int = Form(28, ge=8, le=5000),
    max_candidates: int = Form(150, ge=5, le=500),
    display_stretch: Literal["linear", "percentile", "log", "asinh"] = Form("asinh"),
    analyze_restored: bool = Form(False),
):
    """
    Validate and analyze an astronomical image for candidate stars, extended sources, and possible galaxies.
    Accepts either a new image upload or an existing cached `image_id` to re-run with updated settings.
    """
    orig_bytes: Optional[bytes] = None
    rest_bytes: Optional[bytes] = None
    filename = "upload.png"

    if file is not None:
        orig_bytes = await file.read()
        filename = file.filename or "upload.png"
        if restored_file is not None:
            rest_bytes = await restored_file.read()
    elif image_id:
        cached = get_cached_entry(image_id)
        if not cached:
            raise HTTPException(status_code=404, detail=f"Image ID '{image_id}' not found in session cache.")
        orig_bytes = cached["original_bytes"]
        rest_bytes = cached.get("restored_bytes")
        filename = cached.get("filename", "upload.png")
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either an uploaded 'file' or a valid cached 'image_id'.",
        )

    settings = DetectionSettingsUsed(
        threshold_sigma=threshold_sigma,
        min_separation_px=min_separation_px,
        fwhm_estimate_px=fwhm_estimate_px,
        min_extended_area_px=min_extended_area_px,
        max_candidates=max_candidates,
        display_stretch=display_stretch,
        analyze_restored=analyze_restored,
    )

    try:
        return analyze_astronomical_image(
            original_bytes=orig_bytes,
            filename=filename,
            settings=settings,
            restored_bytes=rest_bytes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Detection analysis error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to process astronomical image. Verify file integrity and dimensions.",
        ) from exc


@router.get("/{image_id}/detections", response_model=DetectionAnalysisResponse)
async def get_detections(image_id: str):
    """Retrieve the cached detection analysis for a previously processed image."""
    cached = get_cached_entry(image_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No detection results found for image_id '{image_id}'.")
    return cached["response"]


@router.get("/{image_id}/detections/export")
async def export_detections(
    image_id: str,
    format: Literal["csv", "json"] = Query("csv", description="Export format: 'csv' or 'json'"),
):
    """Export candidate detections in CSV or JSON format."""
    cached = get_cached_entry(image_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No detection results found for image_id '{image_id}'.")
    resp: DetectionAnalysisResponse = cached["response"]

    if format == "csv":
        csv_text = export_detections_csv(resp)
        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{image_id}_detections.csv"'},
        )

    json_text = export_detections_json(resp)
    return Response(
        content=json_text,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{image_id}_detections.json"'},
    )


@router.get("/{image_id}/detections/{candidate_id}")
async def get_candidate_detail(image_id: str, candidate_id: str):
    """Retrieve detailed measurements and a zoomed cutout preview for a single candidate."""
    cached = get_cached_entry(image_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No detection results found for image_id '{image_id}'.")

    resp: DetectionAnalysisResponse = cached["response"]
    cand: Optional[CandidateSource] = next((c for c in resp.candidates if c.id == candidate_id), None)
    if cand is None:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found in '{image_id}'.")

    crop_url = crop_candidate_preview(cached["rgb_vis"], cand)
    return {
        "image_id": image_id,
        "candidate": cand,
        "cutout_preview_data_url": crop_url,
        "coordinate_convention": resp.coordinate_convention,
        "flux_unit_note": resp.flux_unit_note,
        "has_wcs_calibration": resp.has_wcs_calibration,
    }


@router.get("/{image_id}/detection-overlay")
async def get_detection_overlay(image_id: str):
    """Return a rendered PNG image with candidate markers and bounding regions drawn."""
    cached = get_cached_entry(image_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No detection results found for image_id '{image_id}'.")

    resp: DetectionAnalysisResponse = cached["response"]
    png_bytes = render_annotated_overlay_png(cached["rgb_vis"], resp.candidates)
    return Response(content=png_bytes, media_type="image/png")
