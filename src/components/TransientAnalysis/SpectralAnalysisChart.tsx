import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SpectroscopyData, SpectralLine, SpectralPoint } from '../../types/transient';
import { calculateDopplerVelocity } from '../../lib/transientApi';
import { transientSonifier } from '../../lib/transientSonifier';
import { Activity, Gauge, Music, Info, Zap } from 'lucide-react';

interface SpectralAnalysisChartProps {
  spectroscopy: SpectroscopyData;
  eventName: string;
}

export const SpectralAnalysisChart: React.FC<SpectralAnalysisChartProps> = ({
  spectroscopy,
  eventName,
}) => {
  const [selectedLine, setSelectedLine] = useState<SpectralLine | null>(
    spectroscopy.identified_lines[0] || null
  );
  const [showAllLines, setShowAllLines] = useState<boolean>(true);

  // Doppler Calculator State
  const defaultLine = spectroscopy.identified_lines[0];
  const [calcRestWl, setCalcRestWl] = useState<number>(defaultLine ? defaultLine.restWavelength : 6563);
  const [calcObsWl, setCalcObsWl] = useState<number>(defaultLine ? defaultLine.observedWavelength : 6563);

  const dopplerResult = calculateDopplerVelocity(calcRestWl, calcObsWl);

  const handleLineSelect = (line: SpectralLine) => {
    setSelectedLine(line);
    setCalcRestWl(line.restWavelength);
    setCalcObsWl(line.observedWavelength);
    transientSonifier.playSpectralTone(line.observedWavelength);
  };

  return (
    <div className="space-y-4">
      {/* ── Spectral Lines Selector Bar ── */}
      <div className="p-3.5 rounded-xl bg-[#0e131d]/90 border border-[rgba(201,162,74,0.2)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#c9a24a]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-celestial">
              Identified Spectroscopic Transitions
            </span>
          </div>
          <button
            onClick={() => setShowAllLines(!showAllLines)}
            className="text-[11px] text-[#c9a24a] hover:underline cursor-pointer"
          >
            {showAllLines ? 'Hide Line Reticles' : 'Show All Line Reticles'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {spectroscopy.identified_lines.map((line) => {
            const isSelected = selectedLine?.name === line.name;
            return (
              <button
                key={line.name}
                onClick={() => handleLineSelect(line)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#c9a24a] text-black font-bold border-[#c9a24a] shadow-[0_0_12px_rgba(201,162,74,0.4)]'
                    : 'bg-black/40 text-[#dfe7e0] border-white/10 hover:border-[#c9a24a]/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    line.lineType === 'emission' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span>{line.name}</span>
                <span className="text-[10px] opacity-75">
                  ({line.lineType === 'emission' ? 'Em' : 'Abs'})
                </span>
                <Music className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Line Inspection Card ── */}
      {selectedLine && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#0a0d14] via-[#121824] to-[#0a0d14] border border-[#c9a24a]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono">{selectedLine.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                  selectedLine.lineType === 'emission'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {selectedLine.lineType} Profile
              </span>
            </div>
            <p className="text-[11px] text-[#aab4ad]">{selectedLine.description}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
            <div>
              <span className="text-gray-400 block text-[9px] uppercase">Rest λ</span>
              <span className="text-white font-bold">{selectedLine.restWavelength} Å</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase">Observed λ</span>
              <span className="text-cyan-300 font-bold">{selectedLine.observedWavelength} Å</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase">Kinematic Velocity</span>
              <span className="text-[#fce38a] font-bold">
                {selectedLine.velocityKmS !== 0
                  ? `${selectedLine.velocityKmS.toLocaleString()} km/s`
                  : 'Rest Frame (z=0)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Spectroscopy Recharts Plot ── */}
      <div className="relative h-72 w-full rounded-2xl bg-[#070a0f] p-3 border border-[rgba(201,162,74,0.15)] shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={spectroscopy.spectral_points}
            margin={{ top: 15, right: 25, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="fluxGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c9a24a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#c9a24a" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="wavelength"
              stroke="#78837c"
              fontSize={11}
              domain={[3600, 8600]}
              tickLine={{ stroke: '#78837c' }}
              label={{
                value: 'Rest/Observed Wavelength (Ångströms - Å)',
                position: 'insideBottom',
                offset: -12,
                fill: '#aab4ad',
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="#78837c"
              fontSize={11}
              label={{
                value: 'Relative Flux F_λ',
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
                const point = payload[0].payload as SpectralPoint;
                return (
                  <div className="rounded-xl bg-[#0b0e14]/95 border border-[#c9a24a] p-2.5 text-xs shadow-2xl space-y-1 font-mono backdrop-blur-md">
                    <span className="text-white font-bold block">λ = {point.wavelength} Å</span>
                    <span className="text-amber-300 block">Flux: {point.flux}</span>
                    <span className="text-gray-400 block text-[10px]">Continuum: {point.continuum}</span>
                  </div>
                );
              }}
            />

            {/* Line markers */}
            {showAllLines &&
              spectroscopy.identified_lines.map((l) => (
                <ReferenceLine
                  key={l.name}
                  x={l.observedWavelength}
                  stroke={l.lineType === 'emission' ? '#10b981' : '#f43f5e'}
                  strokeDasharray="3 3"
                  label={{
                    value: l.name.split(' ')[0],
                    fill: l.lineType === 'emission' ? '#34d399' : '#fb7185',
                    fontSize: 9,
                    position: 'top',
                  }}
                />
              ))}

            <Area
              type="monotone"
              dataKey="flux"
              stroke="#e0231c"
              strokeWidth={2.2}
              fill="url(#fluxGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Optical Spectrum Ribbon (Visual Wavelength Gradient) ── */}
      <div className="space-y-1">
        <div
          className="h-3.5 w-full rounded-md shadow-md border border-white/10"
          style={{
            background:
              'linear-gradient(to right, #4c1d95 0%, #2563eb 20%, #059669 40%, #eab308 60%, #ea580c 80%, #991b1b 100%)',
          }}
        />
        <div className="flex justify-between text-[10px] font-mono text-[#78837c] px-1">
          <span>3800 Å (Near UV / Violet)</span>
          <span>5000 Å (Green)</span>
          <span>6500 Å (Hα Red)</span>
          <span>8600 Å (Near IR)</span>
        </div>
      </div>

      {/* ── Interactive Doppler Velocity Calculator ── */}
      <div className="p-4 rounded-xl bg-[#0c1018] border border-[rgba(201,162,74,0.3)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#e0231c]" />
            <span className="font-celestial text-sm font-bold text-white tracking-wider">
              Doppler Kinematics &amp; Ejecta Velocity Calculator
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#c9a24a]">v = c · (Δλ / λ₀)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] text-[#aab4ad] block font-mono">
              Rest Wavelength (λ₀ in Å):
            </label>
            <input
              type="number"
              value={calcRestWl}
              onChange={(e) => setCalcRestWl(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-[#c9a24a] outline-none"
            />

            <label className="text-[11px] text-[#aab4ad] block font-mono">
              Observed Wavelength (λ_obs in Å):
            </label>
            <input
              type="number"
              value={calcObsWl}
              onChange={(e) => setCalcObsWl(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-[#c9a24a] outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-[#78837c] uppercase tracking-wider block font-mono">
                Computed Kinematic Ejecta Velocity
              </span>
              <span className="text-xl font-bold font-mono text-[#fce38a]">
                {dopplerResult.velocityKmS.toLocaleString()} km/s
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono border-t border-white/10 pt-2">
              <span className="text-[#aab4ad]">Fraction of c:</span>
              <span className="text-cyan-300 font-bold">{dopplerResult.fractionSpeedOfLight}% c</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#aab4ad]">Shift Direction:</span>
              <span className="text-emerald-400 capitalize">{dopplerResult.direction}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

