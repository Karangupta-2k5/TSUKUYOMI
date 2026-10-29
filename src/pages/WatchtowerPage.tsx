import React, { useState } from 'react';
import { LocationCoordinates, WeatherScoreResponse, AppMode } from '../types';
import { WatchtowerMap } from '../components/WatchtowerMap';
import { HonorScoreGauge } from '../components/HonorScoreGauge';
import { CANDIDATE_LOCATIONS } from '../data/mockData';
import { Search, MapPin, Locate, CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertCircle } from 'lucide-react';

interface WatchtowerPageProps {
  currentLocation: LocationCoordinates;
  weatherData: WeatherScoreResponse;
  onSelectLocation: (loc: LocationCoordinates) => void;
  onSearchLocation: (query: string) => Promise<void>;
  isLoading: boolean;
  appMode: AppMode;
  errorMessage?: string | null;
}

export const WatchtowerPage: React.FC<WatchtowerPageProps> = ({
  currentLocation,
  weatherData,
  onSelectLocation,
  onSearchLocation,
  isLoading,
  appMode,
  errorMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      onSearchLocation(searchQuery);
    }
  };

  const handleBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        onSelectLocation({
          name: 'My Device Coordinates',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          displayName: `Observer Spot (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`
        });
      },
      (err) => {
        setIsGeolocating(false);
        alert(`Location acquisition failed: ${err.message}`);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Search Bar */}
      <div className="celestial-card p-6 rounded-2xl border border-[#e6c35c]/25 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] tracking-widest font-semibold uppercase text-[#e6c35c] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c93b2b]" />
              SANCTUM RADAR
            </span>
            <h1 className="font-celestial text-2xl sm:text-3xl font-bold text-white">
              The Watchtower Observatory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an international dark sky sanctuary or search any coordinates across the globe.
            </p>
          </div>

          {/* Search Controls */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, mountain, summit..."
                className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6c35c]/60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || searchQuery.trim().length < 2}
              className="bg-[#c93b2b] hover:bg-[#e84534] disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-[#c93b2b]/30 transition-all shrink-0"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleBrowserGeolocation}
              disabled={isGeolocating}
              className="bg-[#0d121d] hover:bg-white/10 text-[#e6c35c] border border-[#e6c35c]/30 p-2 rounded-xl text-xs font-semibold transition-all shrink-0"
              title="Use current GPS location"
            >
              <Locate className={`w-4 h-4 ${isGeolocating ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* Quick Candidate Preset Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Candidate Sanctums:</span>
          {CANDIDATE_LOCATIONS.map((loc) => {
            const isSelected = loc.name === currentLocation.name;
            return (
              <button
                key={loc.name}
                onClick={() => onSelectLocation(loc)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#c93b2b]/20 text-[#fce38a] border-[#e6c35c]/60 font-semibold shadow-sm'
                    : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state if any */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl flex items-center space-x-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errorMessage} (Displaying verified fallback cache).</span>
        </div>
      )}

      {/* Score Gauge & Weather Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Night Honor Score Gauge */}
        <div className="lg:col-span-7 space-y-6">
          <HonorScoreGauge
            components={weatherData.components}
            scoreOverride={weatherData.score}
            scoreLabel={weatherData.scoreLabel}
            source={weatherData.source}
            limitations={weatherData.limitations}
          />

          {/* Meteorological Conditions Panel */}
          <div className="celestial-card p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-celestial text-base font-bold text-slate-200">
                Atmospheric Observations at {currentLocation.name}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Observed: {new Date(weatherData.observedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#07090e]/80 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Temperature</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {weatherData.conditions.temperatureC ?? 4}°C
                </div>
              </div>

              <div className="bg-[#07090e]/80 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Humidity</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {weatherData.conditions.humidityPct}%
                </div>
              </div>

              <div className="bg-[#07090e]/80 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wind Velocity</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {weatherData.conditions.windSpeedKmh ?? 12} km/h
                </div>
              </div>

              <div className="bg-[#07090e]/80 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rain Chance</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {weatherData.conditions.precipitationProbability ?? 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-5 h-full">
          <WatchtowerMap
            currentLocation={currentLocation}
            onSelectLocation={onSelectLocation}
            candidateLocations={CANDIDATE_LOCATIONS}
          />
        </div>
      </div>
    </div>
  );
};
