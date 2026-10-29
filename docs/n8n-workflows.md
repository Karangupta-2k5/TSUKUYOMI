# Tsukuyomi Watch — n8n Orchestration Specifications

This document defines the complete orchestration workflow suite for **Tsukuyomi Watch: The Samurai's Celestial Guide**.

---

## Architecture Overview
The frontend communicates exclusively with n8n Webhook endpoints. Upstream third-party APIs (Open-Meteo, The Space Devs Launch Library 2) and server secrets are completely isolated server-side.

---

## Workflow A: Weather & Night Honor Score
* **Webhook Trigger:** `POST /webhook/tsukuyomi/weather-score`
* **Input Schema:**
  ```json
  {
    "latitude": 35.3606,
    "longitude": 138.7274
  }
  ```
* **Nodes:**
  1. **Webhook Node:** Accepts POST request.
  2. **IF Node (Coordinate Validation):** Validates `-90 <= lat <= 90` and `-180 <= lon <= 180`.
  3. **HTTP Request Node (Open-Meteo):**
     * URL: `https://api.open-meteo.com/v1/forecast`
     * Parameters: `hourly=cloud_cover,relative_humidity_2m,visibility,precipitation_probability&timezone=auto`
  4. **Code Node (Score Heuristic):**
     * ClearSky = `100 - cloud_cover`
     * VisibilityScore = `min(100, (visibilityMeters / 24000) * 100)`
     * HumidityScore = `100 - humidity`
     * Score Formula: `(0.53 * ClearSky) + (0.29 * VisibilityScore) + (0.18 * HumidityScore)`
  5. **Respond to Webhook:** Returns 200 with calculated Night Honor Score.

---

## Workflow B: Place Search / Geocoding
* **Webhook Trigger:** `GET /webhook/tsukuyomi/geocode?q=...`
* **Nodes:**
  1. **Webhook Node:** Captures query `q`.
  2. **HTTP Request Node:** Queries `https://geocoding-api.open-meteo.com/v1/search?name={q}&count=6`.
  3. **Code Node:** Normalizes results to `{ id, name, admin1, country, displayName, latitude, longitude, elevation }`.
  4. **Respond to Webhook:** Returns 200 JSON.

---

## Workflow C: Celestial Events Feed & Launches
* **Trigger 1 (Scheduled Refresh):** Runs every 6 hours to fetch upcoming orbital launches from Launch Library 2 (`https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10`).
* **Trigger 2 (Frontend Endpoint):** `GET /webhook/tsukuyomi/events` returns combined launches and curated astronomical events (meteor showers, solar eclipses).

---

## Workflow E: Sanitized Error Trigger
* **Error Trigger:** Intercepts any node failure.
* **Security Guardrail:** Strips headers, auth tokens, client IP, and raw coordinates; emits sanitized timestamp, workflow name, and user-facing error message.
