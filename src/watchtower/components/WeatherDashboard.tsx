import type { WeatherResponse } from '../types';
import {
  Cloud, Droplets, Eye, Wind, Thermometer, Umbrella,
  Sunrise, Sunset, Clock, Info
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  weather: WeatherResponse;
}

function windDir(deg?: number): string {
  if (deg == null) return '';
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function cloudIcon(pct: number) {
  if (pct < 10) return '✦';
  if (pct < 30) return '⛅';
  if (pct < 70) return '🌥';
  return '☁';
}

function MetricCard({
  icon, label, value, unit, sub, accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-wt-ink border border-wt-gold/10 rounded-xl p-4 flex flex-col gap-1.5 hover:border-wt-gold/25 transition-colors">
      <div className="flex items-center gap-1.5 text-wt-parchment/40">
        {icon}
        <span className="text-xs font-wt-title uppercase tracking-widest">{label}</span>
      </div>
      <div className={clsx('text-2xl font-wt-title font-semibold leading-none', accent || 'text-wt-parchment')}>
        {value}
        {unit && <span className="text-sm font-normal text-wt-parchment/50 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-wt-parchment/40 font-wt-serif italic">{sub}</div>}
    </div>
  );
}

export default function WeatherDashboard({ weather }: Props) {
  const c = weather.current;
  const visKm = (c.visibility / 1000).toFixed(1);
  const updTime = new Date(weather.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const condTime = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4 animate-wt-fadeIn">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-wt-title text-wt-gold text-sm uppercase tracking-widest">Current Conditions</h3>
          <p className="text-wt-parchment/40 text-xs font-wt-serif italic mt-0.5">
            {c.weather_description} · Observation at {condTime} local
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-wt-parchment/30 text-xs">
          <Clock className="w-3 h-3" />
          Updated {updTime} UTC
        </div>
      </div>

      {/* Main condition + temp display */}
      <div className="bg-wt-ink-soft border border-wt-gold/10 rounded-xl p-5 flex items-center gap-5 flex-wrap">
        <div className="text-5xl">{cloudIcon(c.cloud_cover)}</div>
        <div className="flex-1">
          <div className="text-4xl font-wt-title text-wt-parchment font-semibold leading-none">
            {c.temperature_2m.toFixed(1)}<span className="text-2xl text-wt-parchment/50">°C</span>
          </div>
          {c.apparent_temperature != null && (
            <p className="text-wt-parchment/40 text-sm font-wt-serif mt-1">
              Feels like {c.apparent_temperature.toFixed(1)}°C
            </p>
          )}
          <p className="text-wt-parchment/70 font-wt-title text-sm mt-1">{c.weather_description}</p>
        </div>
        {weather.daily && (
          <div className="flex flex-col gap-1.5 text-sm text-wt-parchment/50 font-wt-serif">
            <div className="flex items-center gap-1.5">
              <Sunrise className="w-4 h-4 text-wt-gold/50" />
              {weather.daily.sunrise.split('T')[1]?.slice(0,5) || weather.daily.sunrise}
            </div>
            <div className="flex items-center gap-1.5">
              <Sunset className="w-4 h-4 text-wt-gold/50" />
              {weather.daily.sunset.split('T')[1]?.slice(0,5) || weather.daily.sunset}
            </div>
          </div>
        )}
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Cloud className="w-3.5 h-3.5" />}
          label="Cloud Cover"
          value={c.cloud_cover}
          unit="%"
          sub={c.cloud_cover < 20 ? 'Clear skies' : c.cloud_cover < 60 ? 'Partly cloudy' : 'Overcast'}
          accent={c.cloud_cover < 30 ? 'text-emerald-400' : c.cloud_cover < 70 ? 'text-amber-400' : 'text-red-400'}
        />
        <MetricCard
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Visibility"
          value={visKm}
          unit="km"
          sub={c.visibility >= 10000 ? 'Excellent' : c.visibility >= 5000 ? 'Good' : 'Limited'}
          accent={c.visibility >= 10000 ? 'text-violet-400' : c.visibility >= 5000 ? 'text-amber-400' : 'text-red-400'}
        />
        <MetricCard
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Humidity"
          value={c.relative_humidity_2m}
          unit="%"
          sub={c.relative_humidity_2m < 50 ? 'Low — dew unlikely' : c.relative_humidity_2m < 80 ? 'Moderate' : 'High — dew risk'}
          accent={c.relative_humidity_2m < 50 ? 'text-cyan-400' : c.relative_humidity_2m < 80 ? 'text-amber-400' : 'text-red-400'}
        />
        <MetricCard
          icon={<Wind className="w-3.5 h-3.5" />}
          label="Wind"
          value={c.wind_speed_10m.toFixed(1)}
          unit="km/h"
          sub={windDir(c.wind_direction_10m) ? `From ${windDir(c.wind_direction_10m)}` : undefined}
          accent="text-teal-400"
        />
        <MetricCard
          icon={<Thermometer className="w-3.5 h-3.5" />}
          label="Temperature"
          value={c.temperature_2m.toFixed(1)}
          unit="°C"
          sub={`Elevation ${weather.elevation.toFixed(0)} m`}
          accent="text-orange-400"
        />
        {c.precipitation_probability != null && (
          <MetricCard
            icon={<Umbrella className="w-3.5 h-3.5" />}
            label="Rain Chance"
            value={c.precipitation_probability}
            unit="%"
            sub={c.precipitation != null ? `${c.precipitation} mm precip.` : undefined}
            accent={c.precipitation_probability > 50 ? 'text-blue-400' : 'text-wt-parchment'}
          />
        )}
      </div>

      {/* Elevation + timezone info */}
      <div className="flex items-start gap-2 text-xs text-wt-parchment/30 font-wt-serif italic border-t border-wt-gold/10 pt-3">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-wt-gold/30" />
        <span>
          Meteorological visibility measures horizontal optical clarity and is not identical to astronomical seeing quality.
          Atmospheric turbulence, altitude, and local horizon obstructions additionally affect observation quality.
          Timezone: {weather.timezone} ({weather.timezone_abbreviation}).
        </span>
      </div>
    </div>
  );
}
