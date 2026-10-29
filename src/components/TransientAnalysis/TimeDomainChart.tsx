import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { LightCurvePoint, TimeDomainData } from '../../types/transient';
import { Volume2, VolumeX, Eye, ArrowUpRight, Sparkles } from 'lucide-react';
import { transientSonifier } from '../../lib/transientSonifier';

interface TimeDomainChartProps {
  timeDomain: TimeDomainData;
  eventName: string;
}

export const TimeDomainChart: React.FC<TimeDomainChartProps> = ({ timeDomain, eventName }) => {
  const [showGBand, setShowGBand] = useState(true);
  const [showRBand, setShowRBand] = useState(true);
  const [showIBand, setShowIBand] = useState(true);
  const [viewMode, setViewMode] = useState<'magnitude' | 'flux'>('magnitude');
  const [isSonifying, setIsSonifying] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const data = timeDomain.lightCurve;

  const handleToggleSonification = () => {
    if (isSonifying) {
      transientSonifier.stop();
      setIsSonifying(false);
      setActiveStepIndex(null);
    } else {
      setIsSonifying(true);
      transientSonifier.sonifyLightCurve(
        data,
        (idx) => setActiveStepIndex(idx),
        () => {
          setIsSonifying(false);
          setActiveStepIndex(null);
        }
      );
    }
  };

  // Find min/max for magnitude domain calculation
  const allMags = data.flatMap((d) => [d.g_mag, d.r_mag, d.i_mag]);
  const minMag = Math.floor(Math.min(...allMags) - 0.5);
  const maxMag = Math.ceil(Math.max(...allMags) + 0.5);

  return (
    <div className="space-y-4">
      {/* ── Control Header & Telemetry Badges ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0e131d]/90 border border-[rgba(201,162,74,0.2)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[#c9a24a] uppercase tracking-wider font-bold">
            Photometric Bands:
          </span>
          <button
            onClick={() => setShowGBand(!showGBand)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              showGBand
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-black/30 text-gray-500 border-gray-800'
            }`}
          >
            ● g-band (477nm)
          </button>
          <button
            onClick={() => setShowRBand(!showRBand)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              showRBand
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-black/30 text-gray-500 border-gray-800'
            }`}
          >
            ● r-band (623nm)
          </button>
          <button
            onClick={() => setShowIBand(!showIBand)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              showIBand
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-black/30 text-gray-500 border-gray-800'
            }`}
          >
            ● i-band (762nm)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setViewMode('magnitude')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'magnitude'
                  ? 'bg-[#c9a24a] text-black font-bold'
                  : 'text-[#aab4ad] hover:text-white'
              }`}
            >
              Apparent Mag (Inverted)
            </button>
            <button
              onClick={() => setViewMode('flux')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'flux'
                  ? 'bg-[#c9a24a] text-black font-bold'
                  : 'text-[#aab4ad] hover:text-white'
              }`}
            >
              Normalized Flux
            </button>
          </div>

          {/* Audio Sonification Button */}
          <button
            onClick={handleToggleSonification}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isSonifying
                ? 'bg-[#e0231c] text-white border-[#e0231c] animate-pulse'
                : 'bg-[#c9a24a]/20 text-[#fce38a] border-[#c9a24a]/50 hover:bg-[#c9a24a]/30'
            }`}
          >
            {isSonifying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSonifying ? 'Halt Sonification' : 'Sonify Light Curve'}</span>
          </button>
        </div>
      </div>

      {/* ── Key Astronomical Indicators ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-[#78837c] uppercase tracking-wider block font-mono">
            Peak Apparent Mag (m_peak)
          </span>
          <span className="text-lg font-bold font-mono text-[#fce38a]">
            {timeDomain.peakMagnitude > 0 ? `+${timeDomain.peakMagnitude}` : timeDomain.peakMagnitude} mag
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-[#78837c] uppercase tracking-wider block font-mono">
            Decline Parameter (Δm₁₅)
          </span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {timeDomain.declineRateDm15} mag
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-[#78837c] uppercase tracking-wider block font-mono">
            Rise Time (t_rise)
          </span>
          <span className="text-lg font-bold font-mono text-amber-300">
            ~{timeDomain.riseDays} Days
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-[#78837c] uppercase tracking-wider block font-mono">
            Temporal Cadence
          </span>
          <span className="text-xs font-mono text-[#dfe7e0] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#c9a24a]" />
            Multi-Epoch ZTF/Palomar
          </span>
        </div>
      </div>

      {/* ── Recharts Chart Container ── */}
      <div className="relative h-80 w-full rounded-2xl bg-[#070a0f] p-3 border border-[rgba(201,162,74,0.15)] shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 25, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="day"
              stroke="#78837c"
              fontSize={11}
              tickLine={{ stroke: '#78837c' }}
              label={{
                value: 'Days Relative to Peak Maximum (t₀ = Day 0)',
                position: 'insideBottom',
                offset: -12,
                fill: '#aab4ad',
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="#78837c"
              fontSize={11}
              domain={viewMode === 'magnitude' ? [maxMag, minMag] : [0, 1.1]} // Invert domain for magnitude (lower is brighter)
              label={{
                value: viewMode === 'magnitude' ? 'Apparent Magnitude (Brighter ↑)' : 'Relative Normalized Flux',
                angle: -90,
                position: 'insideLeft',
                offset: 15,
                fill: '#aab4ad',
                fontSize: 11,
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as LightCurvePoint;
                return (
                  <div className="rounded-xl bg-[#0b0e14]/95 border border-[#c9a24a] p-3 text-xs shadow-2xl space-y-1.5 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                      <span className="font-bold text-white font-mono">
                        Day {point.day > 0 ? `+${point.day}` : point.day}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9a24a]/20 text-[#fce38a] font-mono">
                        {point.phase}
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {showGBand && (
                        <div className="flex justify-between text-cyan-300">
                          <span>g-band (477nm):</span>
                          <span className="font-bold">{point.g_mag} mag</span>
                        </div>
                      )}
                      {showRBand && (
                        <div className="flex justify-between text-amber-300">
                          <span>r-band (623nm):</span>
                          <span className="font-bold">{point.r_mag} mag</span>
                        </div>
                      )}
                      {showIBand && (
                        <div className="flex justify-between text-rose-300">
                          <span>i-band (762nm):</span>
                          <span className="font-bold">{point.i_mag} mag</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400 border-t border-white/5 pt-1">
                        <span>Norm Flux:</span>
                        <span>{point.flux_normalized}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Peak reference line */}
            <ReferenceLine x={0} stroke="#e0231c" strokeDasharray="4 4" label={{ value: 'Peak t₀', fill: '#e0231c', fontSize: 10, position: 'top' }} />

            {/* Step indicator during sonification */}
            {activeStepIndex !== null && data[activeStepIndex] && (
              <ReferenceLine x={data[activeStepIndex].day} stroke="#fce38a" strokeWidth={2} />
            )}

            {/* Render lines depending on viewMode */}
            {viewMode === 'magnitude' ? (
              <>
                {showGBand && (
                  <Line
                    type="monotone"
                    dataKey="g_mag"
                    name="g-band"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#06b6d4' }}
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff' }}
                  />
                )}
                {showRBand && (
                  <Line
                    type="monotone"
                    dataKey="r_mag"
                    name="r-band"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#f59e0b' }}
                    activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff' }}
                  />
                )}
                {showIBand && (
                  <Line
                    type="monotone"
                    dataKey="i_mag"
                    name="i-band"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#f43f5e' }}
                    activeDot={{ r: 6, fill: '#fb7185', stroke: '#fff' }}
                  />
                )}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="flux_normalized"
                name="Flux"
                stroke="#c9a24a"
                strokeWidth={3}
                dot={{ r: 3, fill: '#fce38a' }}
                activeDot={{ r: 7, fill: '#ffd700', stroke: '#fff' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-[#78837c] flex items-center justify-between px-1">
        <span>* Inverted astronomical scale: upper positions correspond to higher optical luminosity.</span>
        <span className="font-mono text-[#c9a24a]">Data: Photometric Alert Pipeline</span>
      </div>
    </div>
  );
};

