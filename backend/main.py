"""
Tsukuyomi Watch – Watchtower Module
FastAPI application entry point.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import weather as weather_router
from routers import geocode as geocode_router
from routers import nearby as nearby_router
from routers import score as score_router
from routers import celestial as celestial_router
from routers import restoration as restoration_router
from routers import detections as detections_router
from routers import skyview as skyview_router
from routers import transient as transient_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tsukuyomi Watch – Watchtower API",
    description=(
        "Backend for The Watchtower stargazing location finder. "
        "Provides weather data, Night Honor Score, nearby location discovery, "
        "and best-time recommendations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS – allow the Vite dev server and any same-origin production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.include_router(weather_router.router, prefix="/api")
app.include_router(geocode_router.router, prefix="/api")
app.include_router(nearby_router.router, prefix="/api")
app.include_router(score_router.router, prefix="/api")
app.include_router(celestial_router.router, prefix="/api")
app.include_router(restoration_router.router, prefix="/api")
app.include_router(detections_router.router, prefix="/api")
app.include_router(skyview_router.router, prefix="/api")
app.include_router(transient_router.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tsukuyomi-watchtower"}

# Mount built frontend if available
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")

