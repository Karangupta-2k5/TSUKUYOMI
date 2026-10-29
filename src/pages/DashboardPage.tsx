import React from 'react';
import { LocationCoordinates, MoonPhaseData, WeatherScoreResponse, CelestialEvent, AppMode } from '../types';
import { HonorScoreGauge } from '../components/HonorScoreGauge';
import { MoonPhaseCard } from '../components/MoonPhaseCard';
import { EventCard } from '../components/EventCard';
import { Shield, Sparkles, Eye, ArrowRight, MapPin, Compass, Thermometer, Wind, Droplets } from 'lucide-react';

interface DashboardPageProps {
  weatherData: WeatherScoreResponse;
  moonData: MoonPhaseData;
  events: CelestialEvent[];
  selectedLocation: LocationCoordinates;
  onNavigate: (tab: 'dashboard' | 'watchtower' | 'scroll' | 'lens') => void;
  appMode: AppMode;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  weatherData,
  moonData,
  events,
  selectedLocation,
  onNavigate,
  appMode
}) => {
  const nextEvent = events[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden celestial-card p-6 sm:p-10 border border-[#e6c35c]/25">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#c93b2b]/15 via-[#e6c35c]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-japanese text-xs px-2 py-0.5 rounded border border-[#c93b2b]/40 bg-[#c93b2b]/10 text-[#ff8b7b]">
              夜の誉れ • THE CELESTIAL VOW
            </span>
            {appMode === 'demo' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Verified Fallback Mode Active
              </span>
            )}
          </div>

          <h1 className="font-celestial text-3xl sm:text-5xl font-black text-white tracking-wide">
            Guardians of the Night Sky
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome, stargazer. Tsukuyomi Watch harmonizes real-time atmospheric clarity, transparent celestial heuristics, and curated orbital chronologies into one unified dashboard.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="bg-[#07090e]/70 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Sanctum</span>
              <div className="flex items-center space-x-1 text-xs font-semibold text-white truncate">
                <MapPin className="w-3.5 h-3.5 text-[#c93b2b] shrink-0" />
                <span className="truncate">{selectedLocation.name}</span>
              </div>
            </div>

            <div className="bg-[#07090e]/70 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Temperature</span>
              <div className="flex items-center space-x-1 text-xs font-semibold text-white">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>{weatherData.conditions.temperatureC ?? 4}°C</span>
              </div>
            </div>

            <div className="bg-[#07090e]/70 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Atmospheric Dew</span>
              <div className="flex items-center space-x-1 text-xs font-semibold text-white">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>{weatherData.conditions.humidityPct}% RH</span>
              </div>
            </div>

            <div className="bg-[#07090e]/70 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Night Wind</span>
              <div className="flex items-center space-x-1 text-xs font-semibold text-white">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>{weatherData.conditions.windSpeedKmh ?? 12} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Modules: Score Gauge & Moon Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <HonorScoreGauge
            components={weatherData.components}
            scoreOverride={weatherData.score}
            scoreLabel={weatherData.scoreLabel}
            source={weatherData.source}
            limitations={weatherData.limitations}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <MoonPhaseCard data={moonData} />

          {/* Quick Action Sanctum Card */}
          <div className="celestial-card rounded-2xl p-5 border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Active Sanctuary</span>
              <h4 className="font-celestial text-sm font-bold text-white">{selectedLocation.displayName || selectedLocation.name}</h4>
              <p className="text-xs text-slate-400">Elevation: {selectedLocation.elevation ?? 2300}m</p>
            </div>
            <button
              onClick={() => onNavigate('watchtower')}
              className="flex items-center space-x-1 text-xs font-semibold bg-[#c93b2b] hover:bg-[#e84534] text-white px-4 py-2.5 rounded-xl shadow-lg shadow-[#c93b2b]/30 transition-all shrink-0"
            >
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights & Upcoming Events Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#e6c35c]" />
            <h2 className="font-celestial text-xl font-bold text-white">Next Celestial Horizon</h2>
          </div>
          <button
            onClick={() => onNavigate('scroll')}
            className="text-xs text-[#e6c35c] hover:underline flex items-center space-x-1"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {nextEvent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EventCard event={nextEvent} />
            {events[1] && <EventCard event={events[1]} />}
          </div>
        )}
      </div>

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => onNavigate('watchtower')}
          className="celestial-card p-5 rounded-2xl cursor-pointer hover:border-[#c93b2b]/60 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#c93b2b]/20 border border-[#c93b2b]/40 flex items-center justify-center text-[#ff8b7b] mb-3 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-celestial text-base font-bold text-white group-hover:text-[#e6c35c] transition-colors mb-1">
            Watchtower Observation
          </h3>
          <p className="text-xs text-slate-400">
            Pinpoint dark sky sanctuaries, query live Open-Meteo forecasts, and inspect transparent Night Honor ratings.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('scroll')}
          className="celestial-card p-5 rounded-2xl cursor-pointer hover:border-[#e6c35c]/60 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#e6c35c]/20 border border-[#e6c35c]/40 flex items-center justify-center text-[#e6c35c] mb-3 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-celestial text-base font-bold text-white group-hover:text-[#e6c35c] transition-colors mb-1">
            Celestial Scroll
          </h3>
          <p className="text-xs text-slate-400">
            Follow rocket launches alongside annual meteor shower peaks and solar eclipses with distinct categorization.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('lens')}
          className="celestial-card p-5 rounded-2xl cursor-pointer hover:border-[#e6c35c]/60 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-105 transition-transform">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-celestial text-base font-bold text-white group-hover:text-[#e6c35c] transition-colors mb-1">
            Spirit Lens
          </h3>
          <p className="text-xs text-slate-400">
            Enhance deep-sky photos using verifiable contrast algorithms without synthetic AI star hallucination.
          </p>
        </div>
      </div>
    </div>
  );
};
