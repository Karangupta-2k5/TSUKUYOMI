import type { BestTimeResponse } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Clock, Star, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  data: BestTimeResponse;
}

const LABEL_COLORS: Record<string, string> = {
  Legendary: '#34d399', Excellent: '#4ade80', Good: '#a3e635',
  Fair: '#fbbf24', Poor: '#fb923c', 'Clouded Out': '#f87171',
};

function scoreColor(score: number): string {
  if (score >= 85) return '#34d399';
  if (score >= 70) return '#4ade80';
  if (score >= 55) return '#a3e635';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#fb923c';
  return '#f87171';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-wt-ink-soft border border-wt-gold/20 rounded-lg p-3 text-xs shadow-2xl">
      <p className="font-wt-title text-wt-gold mb-1">{label}</p>
      <p className="text-wt-parchment/70">Score: <span className="font-bold" style={{ color: scoreColor(d.score) }}>{d.score}</span></p>
      <p className="text-wt-parchment/50">Cloud: {d.cloud_cover}% · Vis: {(d.visibility/1000).toFixed(1)} km · Hum: {d.humidity}%</p>
    </div>
  );
}

export default function BestTimePanel({ data }: Props) {
  if (!data.data_available || data.night_hours.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-wt-ink border border-wt-gold/10 rounded-xl text-sm text-wt-parchment/40 font-wt-serif italic">
        <AlertCircle className="w-4 h-4 text-wt-gold/30 shrink-0" />
        No night-hour forecast data is available for tonight at this location.
        Forecast data may not extend to the selected date.
      </div>
    );
  }

  const chartData = data.night_hours.map(h => ({
    time: h.time.split('T')[1]?.slice(0,5) || h.time,
    score: h.score,
    cloud_cover: h.cloud_cover,
    visibility: h.visibility,
    humidity: h.humidity,
    label: h.label,
  }));

  return (
    <div className="space-y-4 animate-wt-fadeIn">
      {/* Best window banner */}
      {data.best_score != null && (
        <div className="bg-wt-ink border border-wt-gold/20 rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <Star className="w-5 h-5 text-wt-gold shrink-0" />
          <div className="flex-1">
            <p className="font-wt-title text-wt-gold text-sm">Best Viewing Window</p>
            <p className="text-wt-parchment/60 text-sm font-wt-serif mt-0.5">{data.reasoning}</p>
          </div>
          <div className="text-right shrink-0">
            {data.best_window_start && (
              <div className="flex items-center gap-1 text-wt-parchment/50 text-xs">
                <Clock className="w-3 h-3" />
                {data.best_window_start.split('T')[1]?.slice(0,5)} – {data.best_window_end?.split('T')[1]?.slice(0,5)}
              </div>
            )}
            <div
              className="text-2xl font-wt-title font-bold"
              style={{ color: scoreColor(data.best_score) }}
            >
              {Math.round(data.best_score)}/100
            </div>
          </div>
        </div>
      )}

      {/* Timeline chart */}
      <div className="bg-wt-ink border border-wt-gold/10 rounded-xl p-4">
        <p className="text-xs font-wt-title uppercase tracking-widest text-wt-gold/50 mb-3">
          Hourly Night Honor Score — Tonight
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(212,175,55,0.07)" />
            <XAxis dataKey="time" tick={{ fill: 'rgba(232,220,200,0.35)', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(232,220,200,0.35)', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#d4af37"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={payload.time}
                    cx={cx} cy={cy} r={3}
                    fill={scoreColor(payload.score)}
                    stroke="none"
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chartData.map((h) => (
          <div
            key={h.time}
            className="shrink-0 flex flex-col items-center gap-1.5 bg-wt-ink border border-wt-gold/10 rounded-lg p-2.5 min-w-[60px]"
          >
            <span className="text-xs text-wt-parchment/40 font-wt-title">{h.time}</span>
            <span className="text-lg">{h.cloud_cover < 20 ? '✦' : h.cloud_cover < 50 ? '⛅' : '☁'}</span>
            <span
              className="text-sm font-wt-title font-bold"
              style={{ color: scoreColor(h.score) }}
            >
              {Math.round(h.score)}
            </span>
            <span
              className={clsx('text-[9px] font-wt-title uppercase tracking-wider',
                LABEL_COLORS[h.label] ? '' : 'text-wt-parchment/30'
              )}
              style={{ color: LABEL_COLORS[h.label] }}
            >
              {h.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-wt-parchment/25 font-wt-serif italic border-t border-wt-gold/10 pt-3">
        Night hours are determined by local sunset time. Forecasts beyond 7 days ahead are unavailable.
        Weather forecasts are estimates — conditions may change.
      </p>
    </div>
  );
}
