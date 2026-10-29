"""
Configuration & API Registry for Tsukuyomi Watch Backend.
Loads environment variables from .env (with safe defaults matching the API Requirements Table).
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ or repository root
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env")


class Settings:
    # 1. Weather Forecast API (Open-Meteo)
    OPEN_METEO_WEATHER_URL: str = os.getenv(
        "OPEN_METEO_WEATHER_URL",
        "https://api.open-meteo.com/v1/forecast",
    )

    # 2. Geocoding API (Open-Meteo Geocoding)
    OPEN_METEO_GEOCODE_URL: str = os.getenv(
        "OPEN_METEO_GEOCODE_URL",
        "https://geocoding-api.open-meteo.com/v1/search",
    )

    # 3. Maps / Map Tiles API (CARTO Dark Matter / Basemaps)
    CARTO_BASEMAP_URL: str = os.getenv(
        "CARTO_BASEMAP_URL",
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    )

    # 4. Space Launch API (The Space Devs - Launch Library 2)
    SPACE_LAUNCH_API_URL: str = os.getenv(
        "SPACE_LAUNCH_API_URL",
        "https://ll.thespacedevs.com/2.2.0/launch/upcoming/",
    )

    # 5. NASA API / APOD (Key loaded from environment; DEMO_KEY fallback if unset)
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "DEMO_KEY")
    NASA_APOD_URL: str = os.getenv(
        "NASA_APOD_URL",
        "https://api.nasa.gov/planetary/apod",
    )

    # 6. NASA SkyView API (bonus)
    NASA_SKYVIEW_URL: str = os.getenv(
        "NASA_SKYVIEW_URL",
        "https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl",
    )

    # 7. Moon Phase Calculation Library / Reference
    MOON_PHASE_PROVIDER: str = os.getenv(
        "MOON_PHASE_PROVIDER",
        "cosinekitty/astronomy (ephemeris calculation)",
    )

    # 8. Meteor Shower & Eclipse Data Source
    METEOR_SHOWER_API_URL: str = os.getenv(
        "METEOR_SHOWER_API_URL",
        "https://meteorshowercal.com/api",
    )

    # 9. ISS Pass Prediction API (N2YO / Open-Notify)
    N2YO_API_KEY: str = os.getenv("N2YO_API_KEY", "")
    N2YO_BASE_URL: str = os.getenv(
        "N2YO_BASE_URL",
        "https://api.n2yo.com/rest/v1/satellite",
    )

    # 10. AI Image Restoration API (Real-ESRGAN + OpenCV CLAHE)
    IMAGE_RESTORATION_ENGINE: str = os.getenv(
        "IMAGE_RESTORATION_ENGINE",
        "Real-ESRGAN + OpenCV CLAHE",
    )

    # 11. Star & Galaxy Detection Tool / API (Astropy / Photometric Centroid Detector)
    STAR_DETECTION_ENGINE: str = os.getenv(
        "STAR_DETECTION_ENGINE",
        "Astropy / OpenCV Photometric Peak & Blob Detection",
    )


settings = Settings()
