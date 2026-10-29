import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { WatchtowerPage } from './pages/WatchtowerPage';
import { CelestialScrollPage } from './pages/CelestialScrollPage';
import { SpiritLensPage } from './pages/SpiritLensPage';
import { AppMode, LocationCoordinates, WeatherScoreResponse, CelestialEvent } from './types';
import { CANDIDATE_LOCATIONS, MOCK_WEATHER_SCORE, MOCK_MOON_PHASE, MOCK_CELESTIAL_EVENTS } from './data/mockData';
import { fetchWeatherScore, searchGeocode, fetchCelestialEvents } from './lib/api';
import { Moon, Shield } from 'lucide-react';

/* ─── Preloader ──────────────────────────────────────────────── */
const Preloader: React.FC<{ done: boolean }> = ({ done }) => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const steps = [15, 38, 62, 81, 95, 100];
    let i = 0;
    const t = setInterval(() => {
      if (i < steps.length) { setPct(steps[i]); i++; }
      else clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`pre-loader${done ? ' done' : ''}`}>
      <div className="pre-inner">
        {/* Blood-moon / crescent SVG badge */}
        <div className="pre-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="23" stroke="rgba(201,162,74,0.35)" strokeWidth="1"/>
            <circle cx="24" cy="26" r="14" fill="#e0231c" opacity=".9"/>
            <circle cx="30" cy="20" r="10" fill="#05070a"/>
            {/* torii crossbar hint */}
            <rect x="8" y="13" width="32" height="2.4" rx="1.2" fill="rgba(223,231,224,0.7)"/>
            <rect x="13" y="18" width="22" height="1.6" rx="0.8" fill="rgba(223,231,224,0.5)"/>
          </svg>
        </div>

        <p className="pre-label font-celestial">月読命 • Tsukuyomi Watch</p>

        <div className="pre-bar">
          <i style={{ right: `${100 - pct}%` }} />
        </div>
        <div className="pre-meta">
          <span>Aligning celestial data</span>
          <b>{pct}%</b>
        </div>
      </div>
    </div>
  );
};

/* ─── App ────────────────────────────────────────────────────── */
export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchtower' | 'scroll' | 'lens'>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('live');
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates>(CANDIDATE_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WeatherScoreResponse>(MOCK_WEATHER_SCORE);
  const [events, setEvents] = useState<CelestialEvent[]>(MOCK_CELESTIAL_EVENTS);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preloaderDone, setPreloaderDone] = useState(false);

  // Dismiss preloader after 1.4 s
  useEffect(() => {
    const t = setTimeout(() => setPreloaderDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Load weather when location or mode changes
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingWeather(true);
    setErrorMessage(null);

    fetchWeatherScore(selectedLocation, appMode)
      .then((data) => { if (isSubscribed) { setWeatherData(data); setIsLoadingWeather(false); } })
      .catch((err) => { if (isSubscribed) { setErrorMessage(err.message || 'Unable to update weather observations'); setIsLoadingWeather(false); } });

    return () => { isSubscribed = false; };
  }, [selectedLocation, appMode]);

  // Load events
  useEffect(() => {
    fetchCelestialEvents(appMode).then(setEvents);
  }, [appMode]);

  const handleSelectLocation = (loc: LocationCoordinates) => setSelectedLocation(loc);

  const handleSearchLocation = async (query: string) => {
    try {
      setIsLoadingWeather(true);
      const results = await searchGeocode(query);
      if (results.length > 0) {
        setSelectedLocation(results[0]);
      } else {
        alert(`No location found for "${query}". Try another landmark.`);
      }
    } catch (err: any) {
      alert(`Geocoding error: ${err.message}`);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  return (
    <>
      {/* ── Atmosphere layers (fixed, z > content) ── */}
      <div className="vignette-overlay" aria-hidden />
      <div className="grain-overlay"   aria-hidden />

      {/* ── Preloader ── */}
      <Preloader done={preloaderDone} />

      {/* ── Page shell ── */}
      <div className="min-h-screen flex flex-col bg-[#05070a] bg-starfield text-[#dfe7e0] selection:bg-[#e0231c]/40 relative z-10">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          appMode={appMode}
          setAppMode={setAppMode}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {activeTab === 'dashboard' && (
            <DashboardPage
              weatherData={weatherData}
              moonData={MOCK_MOON_PHASE}
              events={events}
              selectedLocation={selectedLocation}
              onNavigate={setActiveTab}
              appMode={appMode}
            />
          )}

          {activeTab === 'watchtower' && (
            <WatchtowerPage
              currentLocation={selectedLocation}
              weatherData={weatherData}
              onSelectLocation={handleSelectLocation}
              onSearchLocation={handleSearchLocation}
              isLoading={isLoadingWeather}
              appMode={appMode}
              errorMessage={errorMessage}
            />
          )}

          {activeTab === 'scroll' && (
            <CelestialScrollPage events={events} />
          )}

          {activeTab === 'lens' && (
            <SpiritLensPage />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[rgba(223,231,224,0.08)] bg-[#05070a]/95 py-8 text-xs text-[#78837c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/tsukuyomi-logo.jpg"
                alt="Tsukuyomi Watch badge"
                className="w-7 h-7 rounded-full object-cover border border-[rgba(201,162,74,0.4)] opacity-80"
              />
              <span className="font-japanese text-sm text-[#c9a24a]">月読命</span>
              <span className="font-celestial font-bold text-[#dfe7e0]">Tsukuyomi Watch</span>
              <span className="text-[#78837c]">|</span>
              <span>The Samurai's Celestial Companion</span>
            </div>

            <div className="flex items-center space-x-6 text-[11px]">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#e0231c]" />
                Data integrity: Open-Meteo &amp; Launch Library 2
              </span>
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-[#c9a24a]" />
                OpenStreetMap Attribution
              </span>
            </div>

            <div className="text-[11px] text-[#78837c]">
              Built with AI vibe coding in Google Antigravity
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
