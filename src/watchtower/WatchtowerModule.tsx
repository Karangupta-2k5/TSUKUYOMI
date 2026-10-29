import { useState, useCallback, useRef } from 'react';
import './watchtower.css';
import LocationSearch from './components/LocationSearch';
import WeatherDashboard from './components/WeatherDashboard';
import NightHonorScorePanel from './components/NightHonorScore';
import BestTimePanel from './components/BestTimePanel';
import NearbyLocations from './components/NearbyLocations';
import StargazingMap from './components/StargazingMap';
import Watchtower3DModel from './components/Watchtower3DModel';
import { fetchWeather, fetchScore, fetchBestTime, fetchNearby, reverseGeocode, fetchCurrentLocation } from './api/client';
import type {
  SelectedLocation, WeatherResponse, NightHonorScore,
  BestTimeResponse, NearbyResponse, NearbyLocation
} from './types';
import { Loader2, Moon, Star, Map, Clock, Search, MapPin, Compass } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'weather' | 'score' | 'best-time' | 'nearby';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'weather',   label: 'Conditions',    icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'score',     label: 'Honor Score',   icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'best-time', label: 'Best Time',     icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'nearby',    label: 'Nearby Sites',  icon: <Map className="w-3.5 h-3.5" /> },
];

function Loader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-wt-gold/20 border-t-wt-gold animate-spin" />
        <Moon className="w-5 h-5 text-wt-gold/60 absolute inset-0 m-auto" />
      </div>
      <p className="text-wt-parchment/40 font-wt-serif text-sm italic">{label}</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-wt-torii/5 border border-wt-torii/20 rounded-xl p-4 text-sm">
      <p className="text-wt-torii font-wt-title">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-xs text-wt-gold/60 hover:text-wt-gold underline font-wt-serif">
          Try again
        </button>
      )}
    </div>
  );
}

export default function WatchtowerModule({ onLocationChosen }: { onLocationChosen?: (loc: SelectedLocation) => void } = {}) {
  const [selectedLoc, setSelectedLoc] = useState<SelectedLocation | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('weather');
  const [radiusKm, setRadiusKm] = useState(25);

  // Data states
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [score, setScore] = useState<NightHonorScore | null>(null);
  const [bestTime, setBestTime] = useState<BestTimeResponse | null>(null);
  const [nearby, setNearby] = useState<NearbyResponse | null>(null);

  // Loading states
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingBestTime, setLoadingBestTime] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Error states
  const [errorWeather, setErrorWeather] = useState<string | null>(null);
  const [errorScore, setErrorScore] = useState<string | null>(null);
  const [errorBestTime, setErrorBestTime] = useState<string | null>(null);
  const [errorNearby, setErrorNearby] = useState<string | null>(null);

  // Map interaction
  const [hoveredNearby, setHoveredNearby] = useState<NearbyLocation | null>(null);
  const [selectedNearby, setSelectedNearby] = useState<NearbyLocation | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadWeather = useCallback(async (loc: SelectedLocation) => {
    setLoadingWeather(true); setErrorWeather(null);
    try {
      const data = await fetchWeather(loc.latitude, loc.longitude);
      setWeather(data);
    } catch (e) {
      setErrorWeather(`Weather data unavailable: ${(e as Error).message}`);
    } finally { setLoadingWeather(false); }
  }, []);

  const loadScore = useCallback(async (loc: SelectedLocation) => {
    setLoadingScore(true); setErrorScore(null);
    try {
      const data = await fetchScore(loc.latitude, loc.longitude, loc.population);
      setScore(data);
    } catch (e) {
      setErrorScore(`Score unavailable: ${(e as Error).message}`);
    } finally { setLoadingScore(false); }
  }, []);

  const loadBestTime = useCallback(async (loc: SelectedLocation) => {
    setLoadingBestTime(true); setErrorBestTime(null);
    try {
      const data = await fetchBestTime(loc.latitude, loc.longitude, loc.displayName, loc.population);
      setBestTime(data);
    } catch (e) {
      setErrorBestTime(`Best-time data unavailable: ${(e as Error).message}`);
    } finally { setLoadingBestTime(false); }
  }, []);

  const loadNearby = useCallback(async (loc: SelectedLocation, r: number) => {
    setLoadingNearby(true); setErrorNearby(null);
    try {
      const data = await fetchNearby(loc.latitude, loc.longitude, r);
      setNearby(data);
    } catch (e) {
      setErrorNearby(`Nearby search failed: ${(e as Error).message}`);
    } finally { setLoadingNearby(false); }
  }, []);

  const handleLocationSelect = useCallback((loc: SelectedLocation) => {
    setSelectedLoc(loc);
    onLocationChosen?.(loc);
    setWeather(null); setScore(null); setBestTime(null); setNearby(null);
    setHoveredNearby(null); setSelectedNearby(null);
    loadWeather(loc);
    loadScore(loc);
    loadBestTime(loc);
    loadNearby(loc, radiusKm);
  }, [loadWeather, loadScore, loadBestTime, loadNearby, radiusKm, onLocationChosen]);

  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    const provisionalLoc: SelectedLocation = {
      name: 'Selected Pin',
      country: '',
      latitude: lat,
      longitude: lon,
      displayName: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
    };
    handleLocationSelect(provisionalLoc);

    try {
      const rev = await reverseGeocode(lat, lon);
      setSelectedLoc(prev => {
        if (prev && Math.abs(prev.latitude - lat) < 0.0001 && Math.abs(prev.longitude - lon) < 0.0001) {
          return rev;
        }
        return prev;
      });
    } catch {
      // Keep provisional coordinates
    }
  }, [handleLocationSelect]);

  const handleRadiusChange = (r: number) => {
    setRadiusKm(r);
    if (selectedLoc) loadNearby(selectedLoc, r);
  };

  // Reload nearby
  const handleNearbyRefresh = () => {
    if (selectedLoc) loadNearby(selectedLoc, radiusKm);
  };

  // Memoized tab loading check
  const isAnyLoading = loadingWeather || loadingScore || loadingBestTime || loadingNearby;

  return (
    <div className="wt-root relative overflow-hidden rounded-3xl border border-wt-gold/15 bg-wt-ink text-wt-parchment font-wt-serif">
      {/* Starfield bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(192,57,43,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.04) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-16">
        {/* ── Header ── */}
        <header className="text-center pt-10 pb-8">
          <p className="text-xs font-wt-title uppercase tracking-[0.4em] text-wt-gold/50 mb-2">望遠塔 · Stargazing Location Finder</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-wt-gold/30" />
            <h1 className="font-wt-display text-3xl md:text-4xl font-bold text-wt-parchment" style={{
              textShadow: '0 0 40px rgba(212,175,55,0.3), 0 0 80px rgba(192,57,43,0.15)'
            }}>
              Tsukuyomi Watch
            </h1>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-wt-gold/30" />
          </div>
          <p className="text-wt-parchment/35 text-sm font-wt-serif italic">
            The Watchtower · Samurai's Celestial Guide
          </p>
        </header>

        {/* ── Interactive 3D Voxel Watchtower Showcase ── */}
        <Watchtower3DModel />

        {/* ── Search Panel ── */}
        <div className="bg-wt-ink-soft border border-wt-gold/15 rounded-2xl p-5 mb-5 relative overflow-hidden">
          {/* Torii decoration */}
          <div className="absolute right-4 top-4 opacity-5 pointer-events-none select-none">
            <svg width="80" height="60" viewBox="0 0 80 60" fill="#c0392b">
              <rect x="2" y="12" width="76" height="6" rx="2"/>
              <rect x="8" y="18" width="64" height="4" rx="1"/>
              <rect x="12" y="22" width="8" height="36" rx="2"/>
              <rect x="60" y="22" width="8" height="36" rx="2"/>
            </svg>
          </div>
          <p className="text-xs font-wt-title uppercase tracking-widest text-wt-gold/50 mb-3 flex items-center gap-1.5">
            <Search className="w-3 h-3" /> Seek the Sacred Skies
          </p>
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLoc}
          />
          {isAnyLoading && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-wt-gold/40 font-wt-serif italic">
              <Loader2 className="w-3 h-3 animate-spin" />
              Consulting celestial data…
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        {!selectedLoc ? (
          /* Welcome state */
          <div className="border border-wt-gold/10 rounded-2xl p-8 sm:p-10 text-center bg-wt-ink-soft">
            <div className="text-5xl mb-3">🌙</div>
            <h2 className="font-wt-title text-xl text-wt-parchment/80 mb-2">Seek the Clear Heavens</h2>
            <p className="text-wt-parchment/50 font-wt-serif text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Find the finest stargazing spots worldwide with real-time celestial weather,
              Night Honor Scoring, and sacred observing locations.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                onClick={async () => {
                  try {
                    const loc = await fetchCurrentLocation();
                    handleLocationSelect(loc);
                  } catch {
                    handleLocationSelect({
                      name: 'Kyoto',
                      country: 'Japan',
                      latitude: 35.0116,
                      longitude: 135.7681,
                      displayName: 'Kyoto, Japan (Imperial Capital)',
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-wt-gold/40 bg-wt-gold/10 hover:bg-wt-gold/20 text-wt-gold text-sm font-wt-title transition-all duration-200 shadow-md active:scale-95"
              >
                <MapPin className="w-4 h-4 text-wt-gold" />
                Detect My Location
              </button>

              <button
                onClick={() => {
                  handleLocationSelect({
                    name: 'Kyoto',
                    country: 'Japan',
                    latitude: 35.0116,
                    longitude: 135.7681,
                    displayName: 'Kyoto, Japan (Imperial Capital)',
                    population: 1475000,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-wt-gold/20 bg-wt-ink hover:border-wt-gold/40 text-wt-parchment/70 text-sm font-wt-title transition-all duration-200 active:scale-95"
              >
                <Compass className="w-4 h-4 text-wt-gold/60" />
                Explore Kyoto (Sample)
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto text-xs text-wt-parchment/30 font-wt-serif">
              {[
                ['☁', 'Live Weather', 'Open-Meteo API'],
                ['⭐', 'Night Honor Score', 'Heuristic 0–100'],
                ['⛩', 'Sacred Sites', 'Real OSM data'],
                ['🗺', 'Interactive Map', 'OpenStreetMap'],
              ].map(([icon, label, sub]) => (
                <div key={label} className="border border-wt-gold/8 rounded-xl p-3 bg-wt-ink">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-wt-parchment/50 font-wt-title text-xs">{label}</p>
                  <p className="text-wt-parchment/20 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Location header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="font-wt-title text-lg text-wt-parchment">{selectedLoc.displayName}</h2>
                <p className="text-wt-parchment/40 text-xs font-wt-serif">
                  {selectedLoc.latitude.toFixed(4)}°N · {selectedLoc.longitude.toFixed(4)}°E
                  {selectedLoc.population ? ` · Pop. ${selectedLoc.population.toLocaleString()}` : ''}
                </p>
              </div>
              {score && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-wt-parchment/30 font-wt-serif">Honor Score</span>
                  <span className="font-wt-title text-2xl font-bold"
                    style={{ color: score.score >= 70 ? '#4ade80' : score.score >= 40 ? '#fbbf24' : '#f87171' }}>
                    {Math.round(score.score)}
                  </span>
                  <span className="text-wt-parchment/30 text-sm">/100</span>
                </div>
              )}
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 bg-wt-ink border border-wt-gold/10 rounded-xl p-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-wt-title uppercase tracking-wider transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-wt-gold/10 text-wt-gold border border-wt-gold/25'
                      : 'text-wt-parchment/40 hover:text-wt-parchment/70 hover:bg-white/5'
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-wt-ink-soft border border-wt-gold/10 rounded-2xl p-5">
              {/* WEATHER TAB */}
              {activeTab === 'weather' && (
                loadingWeather ? <Loader label="Fetching celestial conditions…" />
                : errorWeather ? <ErrorBanner message={errorWeather} onRetry={() => loadWeather(selectedLoc)} />
                : weather ? <WeatherDashboard weather={weather} />
                : null
              )}

              {/* SCORE TAB */}
              {activeTab === 'score' && (
                loadingScore ? <Loader label="Computing Night Honor Score…" />
                : errorScore ? <ErrorBanner message={errorScore} onRetry={() => loadScore(selectedLoc)} />
                : score ? <NightHonorScorePanel score={score} />
                : null
              )}

              {/* BEST TIME TAB */}
              {activeTab === 'best-time' && (
                loadingBestTime ? <Loader label="Divining the optimal hour…" />
                : errorBestTime ? <ErrorBanner message={errorBestTime} onRetry={() => loadBestTime(selectedLoc)} />
                : bestTime ? <BestTimePanel data={bestTime} />
                : null
              )}

              {/* NEARBY TAB */}
              {activeTab === 'nearby' && (
                loadingNearby ? <Loader label="Consulting the sacred scrolls of OpenStreetMap…" />
                : errorNearby ? <ErrorBanner message={errorNearby} onRetry={handleNearbyRefresh} />
                : nearby ? (
                  <NearbyLocations
                    data={nearby}
                    radiusKm={radiusKm}
                    onRadiusChange={handleRadiusChange}
                    onRefresh={handleNearbyRefresh}
                    loading={loadingNearby}
                    onLocationHover={setHoveredNearby}
                    onLocationSelect={setSelectedNearby}
                    selectedId={selectedNearby?.osm_id ?? null}
                  />
                ) : null
              )}
            </div>

            {/* Interactive Map — always visible when location selected */}
            <div className="bg-wt-ink-soft border border-wt-gold/10 rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-wt-gold/50" />
                <p className="text-xs font-wt-title uppercase tracking-widest text-wt-gold/50">Interactive Map</p>
                <span className="text-wt-parchment/20 text-xs font-wt-serif ml-auto">
                  Click map to update location
                </span>
              </div>
              <StargazingMap
                center={selectedLoc}
                nearby={nearby?.locations ?? []}
                hoveredLocation={hoveredNearby}
                selectedLocation={selectedNearby}
                onMapClick={handleMapClick}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center text-wt-parchment/20 text-xs font-wt-serif space-y-1">
          <p>Tsukuyomi Watch — The Watchtower · Hackathon Build</p>
          <p>
            Weather:{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-wt-gold/30 hover:text-wt-gold/50">
              Open-Meteo
            </a>{' '}
            · Map:{' '}
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-wt-gold/30 hover:text-wt-gold/50">
              OpenStreetMap
            </a>{' '}
            · POI:{' '}
            <a href="https://overpass-api.de" target="_blank" rel="noopener noreferrer" className="text-wt-gold/30 hover:text-wt-gold/50">
              Overpass API
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
