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

## 📷 Spirit Lens: The Astrophotographer's Vow
Generative neural models can hallucinate stars and deep-sky nebulae. Spirit Lens guarantees **authentic photometric signal processing**:
- Deterministic local contrast stretching (CLAHE)
- Wavelet noise suppression
- Photometric star centroids tagged strictly as approximations

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
