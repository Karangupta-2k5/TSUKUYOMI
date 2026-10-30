import React from 'react';
import { LocationCoordinates, MoonPhaseData, WeatherScoreResponse, CelestialEvent, AppMode } from '../types';
import { HonorScoreGauge } from '../components/HonorScoreGauge';
import { MoonPhaseCard } from '../components/MoonPhaseCard';
import { EventCard } from '../components/EventCard';
import { Shield, Sparkles, Eye, ArrowRight, MapPin, Compass, Thermometer, Wind, Droplets, Landmark, AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  weatherData: WeatherScoreResponse;
  moonData: MoonPhaseData | null;
  events: CelestialEvent[];
  selectedLocation: LocationCoordinates;
  onNavigate: (tab: 'dashboard' | 'watchtower' | 'scroll' | 'lens' | 'sanctuary') => void;
  appMode: AppMode;
  weatherError?: string | null;
  moonError?: string | null;
  eventsError?: string | null;
  isLoadingMoon?: boolean;
  isLoadingEvents?: boolean;
  onRetryWeather?: () => void;
  onRetryMoon?: () => void;
  onRetryEvents?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  weatherData,
  moonData,
  events,
  selectedLocation,
  onNavigate,
  appMode,
  weatherError,
  moonError,
  eventsError,
  isLoadingMoon,
  isLoadingEvents,
  onRetryWeather,
  onRetryMoon,
  onRetryEvents,
}) => {
  const nextEvent = events[0];

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Hero Banner (torii-hero.png as atmospheric bg) ── */}
      <div className="hero-banner celestial-card p-6 sm:p-10">
        {/* Parallax-style bg image layer */}
        <div className="hero-banner-bg" aria-hidden />
        {/* Overlay gradient */}
        <div className="hero-banner-gradient" aria-hidden />

        {/* Content */}
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-japanese text-xs px-2 py-0.5 rounded border border-[rgba(224,35,28,0.4)] bg-[rgba(224,35,28,0.1)] text-[#ff5a3c]">
              夜の誉れ • THE CELESTIAL VOW
            </span>
            {appMode === 'demo' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Verified Fallback Mode Active
              </span>
            )}
          </div>

          <h1 className="font-celestial text-3xl sm:text-5xl font-black text-[#dfe7e0] tracking-wide">
            Guardians of the Night Sky
          </h1>

          <p className="text-sm sm:text-base text-[#aab4ad] leading-relaxed">
            Welcome, stargazer. Tsukuyomi Watch harmonizes real-time atmospheric clarity,
            transparent celestial heuristics, and curated orbital chronologies into one unified dashboard.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('sanctuary')}
              className="flex items-center space-x-2 text-xs font-semibold bg-gradient-to-r from-[#e0231c] to-[#ff5a3c] hover:brightness-110 text-white px-5 py-3 rounded-xl shadow-lg shadow-[rgba(224,35,28,0.4)] transition-all cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-amber-200" />
              <span>Enter 3D Temple Sanctuary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('watchtower')}
              className="flex items-center space-x-2 text-xs font-semibold bg-[rgba(223,231,224,0.06)] hover:bg-[rgba(223,231,224,0.12)] text-[#dfe7e0] border border-[rgba(223,231,224,0.2)] px-4 py-3 rounded-xl transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#c9a24a]" />
              <span>Explore Map & Night Score</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            {[
              {
                label: 'Sanctum',
                icon: <MapPin className="w-3.5 h-3.5 text-[#e0231c] shrink-0" />,
                value: <span className="truncate">{selectedLocation.name}</span>,
              },
              {
                label: 'Temperature',
                icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />,
                value: `${weatherData.conditions.temperatureC ?? 4}°C`,
              },
              {
                label: 'Atmospheric Dew',
                icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
                value: `${weatherData.conditions.humidityPct}% RH`,
              },
              {
                label: 'Night Wind',
                icon: <Wind className="w-3.5 h-3.5 text-emerald-400" />,
                value: `${weatherData.conditions.windSpeedKmh ?? 12} km/h`,
              },
            ].map(({ label, icon, value }) => (
              <div key={label} className="bg-[rgba(5,7,10,0.72)] border border-[rgba(223,231,224,0.08)] rounded-xl p-3">
                <span className="text-[10px] uppercase tracking-wider text-[#78837c] block mb-1">{label}</span>
                <div className="flex items-center space-x-1 text-xs font-semibold text-[#dfe7e0] truncate">
                  {icon}
                  <span>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative corner logo stamp */}
        <div className="absolute bottom-6 right-6 z-10 hidden sm:block">
          <img
            src="/tsukuyomi-logo.jpg"
            alt=""
            className="w-20 h-20 rounded-full object-cover border border-[rgba(201,162,74,0.3)] opacity-30"
            aria-hidden
          />
        </div>
      </div>

      {/* ── Score Gauge + Moon Phase ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <HonorScoreGauge
            components={weatherData.components}
            scoreOverride={weatherData.score}
            scoreLabel={weatherData.scoreLabel}
            source={weatherData.source}
            dataClassification={weatherData.dataClassification}
            lastUpdated={weatherData.lastUpdated}
            forecastHourUtc={weatherData.forecastHourUtc}
            cached={weatherData.cached}
            error={weatherError || weatherData.error || null}
            onRetry={onRetryWeather}
            limitations={weatherData.limitations}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <MoonPhaseCard
            data={moonData}
            isLoading={isLoadingMoon}
            error={moonError}
            onRetry={onRetryMoon}
          />

          {/* Quick Action — Sanctuary Card */}
          <div className="celestial-card rounded-2xl p-5 border border-[rgba(223,231,224,0.1)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#78837c] font-semibold">Active Sanctuary</span>
              <h4 className="font-celestial text-sm font-bold text-[#dfe7e0]">{selectedLocation.displayName || selectedLocation.name}</h4>
              <p className="text-xs text-[#78837c]">
                Coordinates: {selectedLocation.latitude.toFixed(2)}°, {selectedLocation.longitude.toFixed(2)}° • Elevation: {selectedLocation.elevation ?? 2300}m
              </p>
            </div>
            <button
              onClick={() => onNavigate('watchtower')}
              className="flex items-center space-x-1 text-xs font-semibold bg-[#e0231c] hover:bg-[#ff5a3c] text-white px-4 py-2.5 rounded-xl shadow-lg shadow-[rgba(224,35,28,0.3)] transition-all shrink-0 cursor-pointer"
            >
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── IMCCE Lunar Eclipses & USNO Ephemeris Events ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#c9a24a]" />
            <h2 className="font-celestial text-xl font-bold text-[#dfe7e0]">
              IMCCE Lunar Eclipses &amp; USNO Ephemeris Horizon
            </h2>
          </div>
          <button
            onClick={() => onNavigate('scroll')}
            className="text-xs text-[#c9a24a] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Celestial Scroll</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {eventsError && events.length === 0 ? (
          <div className="celestial-card rounded-2xl p-5 border border-red-500/40 bg-red-950/15 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                IMCCE / USNO Ephemeris Unavailable
              </span>
              <p className="text-xs text-slate-300">{eventsError}</p>
              <p className="text-[11px] text-slate-400 italic">
                Hardcoded or fake lunar eclipse events are never displayed when the IMCCE OPALE API fails.
              </p>
            </div>
            {onRetryEvents && (
              <button
                onClick={onRetryEvents}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-xs text-red-200 hover:bg-red-500/30 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isLoadingEvents && events.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="celestial-card rounded-xl p-6 h-40 animate-pulse bg-white/5" />
            <div className="celestial-card rounded-xl p-6 h-40 animate-pulse bg-white/5" />
          </div>
        ) : (
          events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.slice(0, 4).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Module Navigation Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            id: 'watchtower' as const,
            icon: <Shield className="w-5 h-5" />,
            iconCls: 'bg-[rgba(224,35,28,0.18)] border-[rgba(224,35,28,0.4)] text-[#ff5a3c]',
            title: 'Watchtower Observation',
            desc: 'Pinpoint dark sky sanctuaries, query live Open-Meteo forecasts, and inspect transparent Night Honor ratings.',
          },
          {
            id: 'scroll' as const,
            icon: <Compass className="w-5 h-5" />,
            iconCls: 'bg-[rgba(201,162,74,0.18)] border-[rgba(201,162,74,0.4)] text-[#c9a24a]',
            title: 'Celestial Scroll',
            desc: 'Follow rocket launches alongside annual meteor shower peaks and solar eclipses with distinct categorization.',
          },
          {
            id: 'lens' as const,
            icon: <Eye className="w-5 h-5" />,
            iconCls: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
            title: 'Spirit Lens',
            desc: 'Enhance deep-sky photos using verifiable contrast algorithms without synthetic AI star hallucination.',
          },
          {
            id: 'sanctuary' as const,
            icon: <Landmark className="w-5 h-5" />,
            iconCls: 'bg-[rgba(224,35,28,0.25)] border-[rgba(224,35,28,0.5)] text-[#ff5a3c]',
            title: '3D Temple Sanctuary',
            desc: 'Step into the full Kyoto mountain temple with live Three.js shaders, blood moon, cloth physics and embers.',
          },
        ].map(({ id, icon, iconCls, title, desc }) => (
          <div
            key={id}
            onClick={() => onNavigate(id)}
            className="celestial-card p-5 rounded-2xl cursor-pointer hover:border-[rgba(201,162,74,0.4)] transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${iconCls}`}>
              {icon}
            </div>
            <h3 className="font-celestial text-base font-bold text-[#dfe7e0] group-hover:text-[#c9a24a] transition-colors mb-1">
              {title}
            </h3>
            <p className="text-xs text-[#78837c]">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
