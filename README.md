# 🌙 TSUKUYOMI WATCH (月読命)
### *The Samurai's Celestial Guide*

> Built for AI vibe coding in **Google Antigravity** with **n8n orchestration**.

Tsukuyomi Watch is a responsive astronomy companion with Japanese samurai / dark-sky identity that unifies:
1. **The Watchtower:** Real-time atmospheric clarity, transparent Night Honor Score, and interactive Leaflet dark-sky map cartography.
2. **The Celestial Scroll:** Authoritative chronicle distinguishing rocket launches (Launch Library 2) from natural cosmic events (meteor showers, solar eclipses).
3. **The Spirit Lens:** Scientific astrophotography contrast enhancer with before/after comparison slider and anti-hallucination guarantee.
4. **The Lunar Chronometer:** Algorithmic moon phase calculations, illumination percentage, and deep-sky observing advice.

---

## ⛩️ Product Architecture

```
[ Frontend: React + Vite + TypeScript + Tailwind CSS ]
                         │
                         ▼ (Public Webhooks Only)
[ Orchestration: n8n Cloud Webhook Engine ]
     ├── Open-Meteo Forecast & Geocoding APIs (No auth keys needed)
     ├── The Space Devs Launch Library 2 (Rate limit caching: 15 req/hr)
     └── Curated Versioned Astronomical Dataset (IMO & NASA)
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js (v18+ or v22+)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd tsukuyomi-watch

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run local development server
npm run dev
```

### 3. Environment Variables
Edit `.env`:
```env
VITE_N8N_WEATHER_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/tsukuyomi/weather-score
VITE_N8N_GEOCODE_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/tsukuyomi/geocode
VITE_N8N_EVENTS_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/tsukuyomi/events
VITE_APP_MODE=live
```
*(If no n8n webhook is supplied, the frontend automatically activates client resilience and displays verified astronomical fallbacks).*

---

## ⚖️ Transparent Night Honor Score

Tsukuyomi Watch explicitly discloses its mathematical model:
$$Score = (0.53 \times ClearSky) + (0.29 \times VisibilityScore) + (0.18 \times HumidityScore)$$
- **ClearSky:** `100 - CloudCover%`
- **VisibilityScore:** Scaled from standard optical transparency range ($24\text{km}$ max pristine)
- **HumidityScore:** `100 - RelativeHumidity%`
- **Darkness:** If calibrated light pollution data is unavailable, weights are rebalanced proportionally rather than fabricating darkness values. Result is labeled **"weather-only estimate"**.

---

## 📷 Spirit Lens: Real-ESRGAN Restoration & Astronomical Object Candidate Detection System
Generative neural models can hallucinate stars and deep-sky nebulae. Spirit Lens guarantees **authentic photometric signal processing** paired with a scientific **Astronomical Object Candidate Detection System** powered by **Photutils**, **Astropy**, **OpenCV**, **NumPy**, and **SciPy**:

### 1. Preprocessing & 2D Background Modeling
- **Format & Channel Safety:** Decodes `JPEG`, `PNG`, `WebP`, `TIFF`, and astronomical **`FITS`** frames (`astropy.io.fits`). Preserves raw floating-point intensity (`ADU`) for photometry while keeping display stretches (`linear`, `percentile`, `log`, `asinh`) strictly for visualization. Alpha transparency channels (`RGBA`) are masked out rather than treated as signal.
- **Spatially Varying Sky Background:** Uses `photutils.background.Background2D` with `MedianBackground` and Astropy `SigmaClip(sigma=3.0)` on an adaptive mesh grid to estimate local sky background level and RMS noise across gradients or vignetting.

### 2. Point-Source (Star) & Extended-Source (Galaxy) Detection
- **Segmentation & Deblending:** Convolves background-subtracted intensity with a matched 2D Gaussian PSF kernel (`Gaussian2DKernel`) and runs `photutils.segmentation.detect_sources` + `deblend_sources` + `SourceCatalog`.
- **Unresolved Stellar Peak Pass:** Supplements segmentation with `photutils.detection.DAOStarFinder` and circular aperture photometry (`CircularAperture`, `aperture_photometry`).
- **Measured Properties per Candidate:** Zero-based pixel centroid `(x_centroid, y_centroid)`, bounding box, peak intensity, background-subtracted segment flux, circular aperture flux, radial FWHM (`px`), area (`px²`), semi-major/semi-minor axes (`a`, `b`), ellipticity (`1 - b/a`), orientation (`deg`), local background & RMS, SNR, and edge/saturation/blending flags.

### 3. Transparent Candidate Classification & Original vs. Restored Cross-Matching
- Classifies sources into **`Star-Like Point Candidate`**, **`Extended-Source Candidate`**, **`Possible Galaxy / Extended Candidate`**, or **`Uncertain / Possible Artifact`** with qualitative confidence (`High`, `Medium`, `Low`) and human-readable explanations.
- **Original vs. AI-Restored Verification:** Cross-matches detections between the original upload and the Real-ESRGAN restored image (`both`, `original_only`, `restored_only`), warning users when a candidate appears only in the AI-enhanced frame.
- **Scientific Limitations Disclosed:** Uncalibrated consumer images report relative pixel flux (`ADU`) rather than calibrated apparent magnitudes (`mag`), and morphological classification without spectroscopy or WCS plate-solving is explicitly presented as candidate-level.

### 4. Detection API Endpoints (`backend/routers/detections.py`)
- `POST /api/images/detect-objects` — Analyze uploaded original (and optional restored) astronomical image
- `GET /api/images/{image_id}/detections` — Retrieve full detection catalog and background summary
- `GET /api/images/{image_id}/detections/{candidate_id}` — Inspect a single candidate with zoomed base64 cutout preview
- `GET /api/images/{image_id}/detection-overlay` — Render annotated PNG overlay
- `GET /api/images/{image_id}/detections/export?format=csv|json` — Export structured candidate catalog

### 5. Running the Backend & Test Suite
```bash
cd backend
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Run the 35-test automated suite (including Photutils/Astropy detection tests)
.\.venv\Scripts\python -m pytest tests/ -v
```

---

## 📋 3-Minute Hackathon Demo Script
1. **Dojo Dashboard (30s):** Highlight samurai moon aesthetic, current observing conditions at Mount Fuji, and active lunar phase.
2. **Watchtower & Night Honor Score (60s):** Click candidate sanctums (Teide, Mauna Kea) or search coordinates. Open the formula dialog to prove scientific transparency.
3. **Celestial Scroll (45s):** Switch between rocket launches and cosmic events. Point out UTC timezone, vehicle names, and verification links.
4. **Spirit Lens (45s):** Drag the before/after slider across Milky Way core capture, toggle candidate star overlays, and emphasize anti-hallucination ethics.

---

## 📜 Documentation Links
- [n8n Workflow Specifications](./docs/n8n-workflows.md)
- [Frontend API Contracts](./docs/api-contracts.md)
- [Open-Meteo Documentation](https://open-meteo.com/en/docs)
- [The Space Devs LL2](https://ll.thespacedevs.com/docs)
- [OpenStreetMap Attribution](https://www.openstreetmap.org/copyright)
