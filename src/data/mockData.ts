import { CelestialEvent, LocationCoordinates, MoonPhaseData, WeatherScoreResponse } from '../types';

export const CANDIDATE_LOCATIONS: LocationCoordinates[] = [
  {
    name: 'Mount Fuji 5th Station',
    admin1: 'Yamanashi',
    country: 'Japan',
    latitude: 35.3606,
    longitude: 138.7274,
    elevation: 2305,
    displayName: 'Mount Fuji 5th Station, Yamanashi, Japan'
  },
  {
    name: 'Teide Observatory',
    admin1: 'Canary Islands',
    country: 'Spain',
    latitude: 28.3004,
    longitude: -16.5101,
    elevation: 2390,
    displayName: 'Teide Observatory, Canary Islands, Spain'
  },
  {
    name: 'Mauna Kea',
    admin1: 'Hawaii',
    country: 'United States',
    latitude: 19.8206,
    longitude: -155.4681,
    elevation: 4205,
    displayName: 'Mauna Kea Summit, Hawaii, USA'
  },
  {
    name: 'Cherry Springs State Park',
    admin1: 'Pennsylvania',
    country: 'United States',
    latitude: 41.6629,
    longitude: -77.8228,
    elevation: 700,
    displayName: 'Cherry Springs Dark Sky Park, PA, USA'
  },
  {
    name: 'Kodaikanal Solar Observatory',
    admin1: 'Tamil Nadu',
    country: 'India',
    latitude: 10.2317,
    longitude: 77.4653,
    elevation: 2343,
    displayName: 'Kodaikanal Observatory, Tamil Nadu, India'
  }
];

export const MOCK_WEATHER_SCORE: WeatherScoreResponse = {
  location: CANDIDATE_LOCATIONS[0],
  observedAt: new Date().toISOString(),
  score: 86,
  scoreLabel: 'weather-only estimate',
  components: {
    clearSky: 92,
    visibility: 85,
    humidity: 78,
    darkness: null
  },
  conditions: {
    cloudCoverPct: 8,
    humidityPct: 22,
    visibilityMeters: 22000,
    precipitationProbability: 0,
    temperatureC: 4,
    windSpeedKmh: 12
  },
  source: 'Open-Meteo Forecast API (Demo Fallback)',
  limitations: [
    'Light pollution data not included; score is based strictly on atmospheric clarity',
    'Local mountain fog and high-altitude winds can fluctuate rapidly'
  ]
};

export const MOCK_MOON_PHASE: MoonPhaseData = {
  phaseName: 'Waxing Crescent',
  illuminationPct: 18,
  ageDays: 3.8,
  stage: 'Waxing Crescent',
  stargazingImpact: 'Ideal (Dark Skies)',
  source: 'Astronomy Engine (Algorithmically calculated)'
};

export const MOCK_CELESTIAL_EVENTS: CelestialEvent[] = [
  {
    id: 'astro-perseids-2026',
    title: 'Perseid Meteor Shower Peak',
    category: 'meteor_shower',
    eventType: 'astronomical',
    startTime: '2026-08-12T20:00:00Z',
    endTime: '2026-08-13T04:30:00Z',
    timezone: 'UTC',
    location: 'Global (Northern Hemisphere optimal)',
    description: 'Swift and bright meteors from Comet Swift-Tuttle, producing 60-100 meteors/hr under pristine skies.',
    sourceName: 'International Meteor Organization',
    sourceUrl: 'https://www.imo.net'
  },
  {
    id: 'space-artemis-2',
    title: 'Artemis II — Crewed Lunar Flyby',
    category: 'spaceflight',
    eventType: 'spaceflight',
    startTime: '2026-09-15T14:30:00Z',
    timezone: 'UTC',
    location: 'LC-39B, Kennedy Space Center, FL',
    description: 'First crewed mission of the Orion spacecraft propelled by NASA SLS Block 1 to circle the Moon.',
    sourceName: 'The Space Devs (Launch Library 2)',
    sourceUrl: 'https://ll.thespacedevs.com',
    rocketName: 'SLS Block 1'
  },
  {
    id: 'astro-eclipse-total-2026',
    title: 'Total Solar Eclipse (Path of Totality)',
    category: 'eclipse',
    eventType: 'astronomical',
    startTime: '2026-08-12T17:47:00Z',
    endTime: '2026-08-12T18:30:00Z',
    timezone: 'UTC',
    location: 'Arctic, Greenland, Iceland, Northern Spain',
    description: 'Spectacular total eclipse spanning 2 minutes 18 seconds of maximum totality across northern Europe.',
    sourceName: 'NASA Eclipse Web Portal',
    sourceUrl: 'https://eclipse.gsfc.nasa.gov'
  },
  {
    id: 'astro-geminids-2026',
    title: 'Geminid Meteor Shower Maximum',
    category: 'meteor_shower',
    eventType: 'astronomical',
    startTime: '2026-12-14T02:00:00Z',
    endTime: '2026-12-14T11:00:00Z',
    timezone: 'UTC',
    location: 'Global (Both Hemispheres)',
    description: 'Known for high rates and multi-colored slow meteors originating from asteroid 3200 Phaethon.',
    sourceName: 'American Meteor Society',
    sourceUrl: 'https://www.amsmeteors.org'
  },
  {
    id: 'space-starship-ift',
    title: 'Starship Orbital Demonstration Flight',
    category: 'spaceflight',
    eventType: 'spaceflight',
    startTime: '2026-06-20T12:00:00Z',
    timezone: 'UTC',
    location: 'Starbase, Boca Chica, Texas',
    description: 'Integrated flight test evaluating thermal tile reentry performance and stage catch sequence.',
    sourceName: 'The Space Devs (Launch Library 2)',
    sourceUrl: 'https://ll.thespacedevs.com',
    rocketName: 'Starship / Super Heavy'
  },
  {
    id: 'astro-saturn-opposition',
    title: 'Saturn at Opposition',
    category: 'planetary',
    eventType: 'astronomical',
    startTime: '2026-10-04T19:00:00Z',
    timezone: 'UTC',
    location: 'Visible throughout the night sky',
    description: 'Saturn closest to Earth and fully illuminated by the Sun with edge-on ring perspective.',
    sourceName: 'In-The-Sky.org Astronomy Calendar',
    sourceUrl: 'https://in-the-sky.org'
  }
];
