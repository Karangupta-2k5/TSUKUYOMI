import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { WatchtowerPage } from './pages/WatchtowerPage';
import { CelestialScrollPage } from './pages/CelestialScrollPage';
import { SpiritLensPage } from './pages/SpiritLensPage';
import { AppMode, LocationCoordinates, WeatherScoreResponse, CelestialEvent } from './types';
import { CANDIDATE_LOCATIONS, MOCK_WEATHER_SCORE, MOCK_MOON_PHASE, MOCK_CELESTIAL_EVENTS } from './data/mockData';
import { fetchWeatherScore, searchGeocode, fetchCelestialEvents } from './lib/api';
import { Moon, Shield, ExternalLink, Sparkles, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchtower' | 'scroll' | 'lens'>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('live');
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates>(CANDIDATE_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WeatherScoreResponse>(MOCK_WEATHER_SCORE);
  const [events, setEvents] = useState<CelestialEvent[]>(MOCK_CELESTIAL_EVENTS);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load weather when location or mode changes
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingWeather(true);
    setErrorMessage(null);

    fetchWeatherScore(selectedLocation, appMode)
      .then((data) => {
        if (isSubscribed) {
          setWeatherData(data);
          setIsLoadingWeather(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setErrorMessage(err.message || 'Unable to update weather observations');
          setIsLoadingWeather(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedLocation, appMode]);

  // Load events
  useEffect(() => {
    fetchCelestialEvents(appMode).then(setEvents);
  }, [appMode]);

  const handleSelectLocation = (loc: LocationCoordinates) => {
    setSelectedLocation(loc);
  };

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
    <div className="min-h-screen flex flex-col bg-[#07090e] bg-starfield text-slate-100 selection:bg-[#c93b2b]/40">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appMode={appMode}
        setAppMode={setAppMode}
      />

      {/* Main Content Area */}
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
      <footer className="mt-auto border-t border-[#e6c35c]/10 bg-[#07090e]/95 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-japanese text-sm text-[#e6c35c]">月読命</span>
            <span className="font-celestial font-bold text-slate-200">Tsukuyomi Watch</span>
            <span className="text-slate-600">|</span>
            <span>The Samurai's Celestial Companion</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#c93b2b]" />
              Data integrity: Open-Meteo & Launch Library 2
            </span>
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-[#e6c35c]" />
              OpenStreetMap Attribution
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Built with AI vibe coding in Google Antigravity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
