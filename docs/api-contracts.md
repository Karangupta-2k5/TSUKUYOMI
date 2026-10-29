# Tsukuyomi Watch — Frontend API Contracts

All interfaces are strictly typed in `src/types/index.ts`.

---

## 1. Weather & Night Honor Score (`POST /webhook/tsukuyomi/weather-score`)

### Request
```json
{
  "latitude": 35.3606,
  "longitude": 138.7274
}
```

### Response (200 OK)
```json
{
  "location": {
    "name": "Mount Fuji 5th Station",
    "latitude": 35.3606,
    "longitude": 138.7274,
    "elevation": 2305
  },
  "observedAt": "2026-10-29T21:00:00Z",
  "score": 86,
  "scoreLabel": "weather-only estimate",
  "components": {
    "clearSky": 92,
    "visibility": 85,
    "humidity": 78,
    "darkness": null
  },
  "conditions": {
    "cloudCoverPct": 8,
    "humidityPct": 22,
    "visibilityMeters": 22000,
    "precipitationProbability": 0,
    "temperatureC": 4,
    "windSpeedKmh": 12
  },
  "source": "Open-Meteo Forecast API",
  "limitations": [
    "Light pollution data not included; score is strictly atmospheric clarity",
    "Local mountain fog and high-altitude winds can fluctuate rapidly"
  ]
}
```

---

## 2. Geocoding Search (`GET /webhook/tsukuyomi/geocode?q=...`)

### Response (200 OK)
```json
{
  "results": [
    {
      "id": "1850144",
      "name": "Tokyo",
      "admin1": "Tokyo",
      "country": "Japan",
      "displayName": "Tokyo, Japan",
      "latitude": 35.6895,
      "longitude": 139.6917,
      "elevation": 40
    }
  ]
}
```

---

## 3. Celestial Events Feed (`GET /webhook/tsukuyomi/events`)

### Response (200 OK)
```json
{
  "events": [
    {
      "id": "astro-perseids-2026",
      "title": "Perseid Meteor Shower Peak",
      "category": "meteor_shower",
      "eventType": "astronomical",
      "startTime": "2026-08-12T20:00:00Z",
      "timezone": "UTC",
      "location": "Global (Northern Hemisphere optimal)",
      "description": "Comet Swift-Tuttle debris with 60-100 meteors/hr.",
      "sourceName": "International Meteor Organization",
      "sourceUrl": "https://www.imo.net"
    },
    {
      "id": "space-artemis-2",
      "title": "Artemis II — Crewed Lunar Flyby",
      "category": "spaceflight",
      "eventType": "spaceflight",
      "startTime": "2026-09-15T14:30:00Z",
      "timezone": "UTC",
      "location": "LC-39B, Kennedy Space Center, FL",
      "rocketName": "SLS Block 1",
      "sourceName": "The Space Devs (Launch Library 2)",
      "sourceUrl": "https://ll.thespacedevs.com"
    }
  ],
  "lastUpdated": "2026-10-29T21:00:00Z"
}
```
