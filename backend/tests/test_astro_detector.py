"""
Comprehensive Unit & API Integration Tests for the Astronomical Star and
Extended-Source / Galaxy Candidate Detection System (Spirit Lens).
Tests synthetic sky frames with known injected Gaussian stars, elliptical galaxies,
saturated stars, edge objects, transparent PNGs, FITS files, original vs restored matching,
and CSV/JSON exports.
"""
from __future__ import annotations

import io
import json
import numpy as np
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from main import app
from services.astro_detector import (
    DetectionSettingsUsed,
    analyze_astronomical_image,
    export_detections_csv,
    export_detections_json,
    load_and_validate_image,
)

client = TestClient(app)


# ─── Synthetic Astronomical Frame Generators ─────────────────────────────────


def _make_synthetic_sky(
    width: int = 256,
    height: int = 256,
    bkg_level: float = 18.0,
    noise_sigma: float = 1.8,
    stars: list[tuple[float, float, float, float]] | None = None,
    galaxies: list[tuple[float, float, float, float, float, float]] | None = None,
    seed: int = 42,
) -> np.ndarray:
    """
    Create a synthetic 2D sky array with background gradient, Gaussian noise,
    injected 2D Gaussian point sources (x, y, peak, sigma), and rotated elliptical
    extended sources (x, y, peak, sigma_major, sigma_minor, angle_rad).
    """
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:height, 0:width]
    # Gentle sky background gradient
    gradient = bkg_level + 3.0 * (yy / float(height)) + 2.0 * (xx / float(width))
    img = gradient + rng.normal(0.0, noise_sigma, size=(height, width))

    if stars:
        for sx, sy, peak, sigma in stars:
            r2 = (xx - sx) ** 2 + (yy - sy) ** 2
            img += peak * np.exp(-r2 / (2.0 * sigma**2))

    if galaxies:
        for gx, gy, peak, sig_a, sig_b, theta in galaxies:
            dx = xx - gx
            dy = yy - gy
            x_rot = dx * np.cos(theta) + dy * np.sin(theta)
            y_rot = -dx * np.sin(theta) + dy * np.cos(theta)
            ell_r2 = (x_rot / sig_a) ** 2 + (y_rot / sig_b) ** 2
            img += peak * np.exp(-0.5 * ell_r2)

    return np.clip(img, 0, 255).astype(np.uint8)


def _arr_to_png_bytes(arr: np.ndarray, mode: str = "L") -> bytes:
    pil = Image.fromarray(arr, mode=mode)
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    return buf.getvalue()


# ─── 1. Image Input & Validation Tests ───────────────────────────────────────


def test_grayscale_and_rgb_loading():
    sky_gray = _make_synthetic_sky(128, 96, stars=[(64, 48, 180, 2.0)])
    gray_bytes = _arr_to_png_bytes(sky_gray, mode="L")
    info_g = load_and_validate_image(gray_bytes, "gray.png")
    assert info_g["width"] == 128
    assert info_g["height"] == 96
    assert info_g["channels"] == "Grayscale"

    rgb_arr = np.stack([sky_gray, sky_gray, sky_gray], axis=-1)
    rgb_bytes = _arr_to_png_bytes(rgb_arr, mode="RGB")
    info_rgb = load_and_validate_image(rgb_bytes, "rgb.png")
    assert info_rgb["channels"] == "RGB"
    assert np.allclose(info_g["luminance"], info_rgb["luminance"], atol=1.0)


def test_transparent_rgba_ignores_alpha_channel():
    """Verify transparent pixels (alpha=0) with bright RGB values are NOT treated as stars."""
    rgba = np.zeros((128, 128, 4), dtype=np.uint8)
    rgba[:, :, :3] = 20
    rgba[:, :, 3] = 255  # Opaque background
    # Inject a bright RGB spot in a completely transparent region (alpha = 0)
    rgba[30:40, 30:40, :3] = 255
    rgba[30:40, 30:40, 3] = 0
    # Inject a real opaque star at (90, 90)
    yy, xx = np.mgrid[0:128, 0:128]
    star_patch = (200 * np.exp(-((xx - 90) ** 2 + (yy - 90) ** 2) / (2 * 2.0**2))).astype(np.uint8)
    for c in range(3):
        rgba[:, :, c] = np.clip(rgba[:, :, c].astype(int) + star_patch, 0, 255).astype(np.uint8)

    png_bytes = _arr_to_png_bytes(rgba, mode="RGBA")
    res = analyze_astronomical_image(png_bytes, "rgba_test.png")
    assert res.channels == "RGBA"
    # None of the detected candidates should be near the transparent (35, 35) region
    for c in res.candidates:
        assert not (25 <= c.x_centroid <= 45 and 25 <= c.y_centroid <= 45)
    # The real star at (90, 90) must be detected
    assert any(abs(c.x_centroid - 90) < 3.0 and abs(c.y_centroid - 90) < 3.0 for c in res.candidates)


def test_invalid_and_corrupt_images_rejected():
    with pytest.raises(ValueError, match="empty"):
        load_and_validate_image(b"", "empty.png")

    with pytest.raises(ValueError, match="Invalid or corrupt"):
        load_and_validate_image(b"not_an_image_payload_12345", "corrupt.jpg")

    tiny = _arr_to_png_bytes(np.zeros((4, 4), dtype=np.uint8), mode="L")
    with pytest.raises(ValueError, match="too small"):
        load_and_validate_image(tiny, "tiny.png")


def test_fits_image_support_with_astropy():
    from astropy.io import fits

    sky = _make_synthetic_sky(128, 128, stars=[(60.0, 70.0, 190.0, 2.1)]).astype(np.float32)
    hdu = fits.PrimaryHDU(data=sky)
    buf = io.BytesIO()
    hdu.writeto(buf)
    fits_bytes = buf.getvalue()

    res = analyze_astronomical_image(fits_bytes, "observation.fits")
    assert res.is_fits is True
    assert res.width == 128 and res.height == 128
    assert any(abs(c.x_centroid - 60.0) < 2.5 and abs(c.y_centroid - 70.0) < 2.5 for c in res.candidates)


# ─── 2. Point-Source, Extended-Source, Galaxy & Edge/Saturation Tests ────────


def test_empty_sky_has_zero_candidates():
    rng = np.random.default_rng(99)
    flat = rng.normal(20.0, 1.2, size=(128, 128)).clip(0, 255).astype(np.uint8)
    res = analyze_astronomical_image(
        _arr_to_png_bytes(flat),
        "blank.png",
        DetectionSettingsUsed(threshold_sigma=6.0),
    )
    assert res.summary.total_candidates == 0
    assert any("No sources exceeded" in n for n in res.quality_notes)


def test_point_stars_vs_extended_galaxy_classification():
    injected_stars = [
        (45.0, 50.0, 175.0, 1.7),
        (190.0, 60.0, 165.0, 1.8),
        (70.0, 195.0, 155.0, 1.6),
    ]
    # Inject a large elongated galaxy-like source at (135, 130) with semi-major 9.5 px, semi-minor 4.2 px
    injected_galaxies = [
        (135.0, 130.0, 145.0, 9.5, 4.2, 0.55),
    ]
    sky = _make_synthetic_sky(256, 256, stars=injected_stars, galaxies=injected_galaxies)
    res = analyze_astronomical_image(
        _arr_to_png_bytes(sky),
        "field.png",
        DetectionSettingsUsed(threshold_sigma=4.0, min_extended_area_px=28),
    )

    assert res.summary.star_like_count >= 3
    assert (res.summary.possible_galaxy_count + res.summary.extended_source_count) >= 1

    # Verify galaxy candidate near (135, 130)
    gal = next(
        (c for c in res.candidates if abs(c.x_centroid - 135) < 4 and abs(c.y_centroid - 130) < 4),
        None,
    )
    assert gal is not None
    assert gal.candidate_type in ("possible_galaxy", "extended_source")
    assert gal.ellipticity is not None and gal.ellipticity > 0.2
    assert gal.area_px >= 28


def test_saturated_and_edge_flags():
    # Saturated star at center (peak clipped at 255) + edge star at (3, 64)
    sky = _make_synthetic_sky(
        160,
        160,
        stars=[
            (80.0, 80.0, 320.0, 2.5),  # Saturates to 255
            (3.0, 64.0, 180.0, 2.0),   # Right on left boundary
        ],
    )
    res = analyze_astronomical_image(_arr_to_png_bytes(sky), "flags.png")
    sat_cand = next((c for c in res.candidates if abs(c.x_centroid - 80) < 3), None)
    edge_cand = next((c for c in res.candidates if c.x_centroid < 8), None)

    assert sat_cand is not None and sat_cand.saturated is True
    assert edge_cand is not None and edge_cand.near_edge is True


def test_threshold_sigma_controls_candidate_count():
    stars = [
        (40.0, 40.0, 190.0, 1.8),
        (110.0, 40.0, 90.0, 1.8),
        (40.0, 110.0, 35.0, 1.8),
        (110.0, 110.0, 16.0, 1.8),
    ]
    sky = _make_synthetic_sky(160, 160, noise_sigma=2.2, stars=stars)
    png = _arr_to_png_bytes(sky)

    res_low = analyze_astronomical_image(png, "s.png", DetectionSettingsUsed(threshold_sigma=2.5))
    res_high = analyze_astronomical_image(png, "s.png", DetectionSettingsUsed(threshold_sigma=12.0))
    assert res_low.summary.total_candidates > res_high.summary.total_candidates


# ─── 3. Original vs AI-Restored Cross-Matching & Coordinate Scaling ──────────


def test_original_vs_restored_cross_matching_and_upscale_mapping():
    orig_sky = _make_synthetic_sky(128, 128, stars=[(50.0, 60.0, 180.0, 1.9)])
    # Restored is 2x upscaled (256x256) and has an extra restoration-only spot at (90, 90) in orig coords -> (180, 180)
    rest_sky_small = _make_synthetic_sky(
        128,
        128,
        stars=[
            (50.0, 60.0, 195.0, 1.9),
            (92.0, 95.0, 140.0, 1.8),
        ],
    )
    rest_pil = Image.fromarray(rest_sky_small, mode="L").resize((256, 256), Image.Resampling.BICUBIC)
    buf = io.BytesIO()
    rest_pil.save(buf, format="PNG")

    res = analyze_astronomical_image(
        _arr_to_png_bytes(orig_sky),
        "orig.png",
        DetectionSettingsUsed(threshold_sigma=4.0, analyze_restored=True),
        restored_bytes=buf.getvalue(),
    )

    assert res.summary.both_images_count >= 1
    assert res.summary.restored_only_count >= 1
    rest_only = [c for c in res.candidates if c.source_origin == "restored_only"]
    assert len(rest_only) >= 1
    # Verify coordinate was mapped back from 256x256 to 128x128 original coordinate space (~92, 95)
    assert any(abs(c.x_centroid - 92) < 4.0 and abs(c.y_centroid - 95) < 4.0 for c in rest_only)
    assert rest_only[0].restoration_artifact_warning is not None


# ─── 4. FastAPI Endpoints & Export Tests ─────────────────────────────────────


def test_fastapi_detection_endpoints_and_exports():
    sky = _make_synthetic_sky(
        180,
        180,
        stars=[(50.0, 50.0, 185.0, 1.9), (130.0, 60.0, 160.0, 1.8)],
        galaxies=[(95.0, 125.0, 150.0, 8.0, 4.0, 0.3)],
    )
    png_bytes = _arr_to_png_bytes(sky)

    # 1. POST /api/images/detect-objects
    resp = client.post(
        "/api/images/detect-objects",
        files={"file": ("test_sky.png", png_bytes, "image/png")},
        data={
            "threshold_sigma": "4.0",
            "min_separation_px": "5.0",
            "min_extended_area_px": "24",
            "max_candidates": "100",
            "display_stretch": "asinh",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    image_id = data["image_id"]
    assert data["width"] == 180 and data["height"] == 180
    assert data["summary"]["total_candidates"] >= 3
    first_cand_id = data["candidates"][0]["id"]

    # 2. GET /api/images/{image_id}/detections
    r_get = client.get(f"/api/images/{image_id}/detections")
    assert r_get.status_code == 200
    assert r_get.json()["image_id"] == image_id

    # 3. GET /api/images/{image_id}/detections/{candidate_id}
    r_cand = client.get(f"/api/images/{image_id}/detections/{first_cand_id}")
    assert r_cand.status_code == 200
    cand_detail = r_cand.json()
    assert cand_detail["candidate"]["id"] == first_cand_id
    assert cand_detail["cutout_preview_data_url"].startswith("data:image/png;base64,")

    # 4. GET /api/images/{image_id}/detection-overlay
    r_ov = client.get(f"/api/images/{image_id}/detection-overlay")
    assert r_ov.status_code == 200
    assert r_ov.headers["content-type"] == "image/png"

    # 5. GET /api/images/{image_id}/detections/export?format=csv & format=json
    r_csv = client.get(f"/api/images/{image_id}/detections/export?format=csv")
    assert r_csv.status_code == 200
    assert "x_centroid_px" in r_csv.text and first_cand_id in r_csv.text

    r_json = client.get(f"/api/images/{image_id}/detections/export?format=json")
    assert r_json.status_code == 200
    parsed_json = json.loads(r_json.text)
    assert parsed_json["image_id"] == image_id


def test_invalid_api_requests_handled_cleanly():
    # Missing file and image_id
    r1 = client.post("/api/images/detect-objects", data={"threshold_sigma": "4.0"})
    assert r1.status_code == 400

    # Corrupt file upload
    r2 = client.post(
        "/api/images/detect-objects",
        files={"file": ("bad.jpg", b"corrupt_bytes", "image/jpeg")},
    )
    assert r2.status_code == 400

    # Non-existent image_id
    r3 = client.get("/api/images/astro_nonexistent/detections")
    assert r3.status_code == 404
