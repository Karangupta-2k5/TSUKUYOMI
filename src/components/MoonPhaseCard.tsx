import React from 'react';
import { MoonPhaseData } from '../types';
import { Moon, Sparkles, Compass } from 'lucide-react';

interface MoonPhaseCardProps {
  data: MoonPhaseData;
}

export const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ data }) => {
  const getImpactBadge = (impact: MoonPhaseData['stargazingImpact']) => {
    if (impact.includes('Ideal')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    }
    if (impact.includes('Moderate')) {
      return 'bg-[#e6c35c]/15 text-[#fce38a] border-[#e6c35c]/40';
    }
    return 'bg-[#c93b2b]/15 text-[#ff8b7b] border-[#c93b2b]/40';
  };

  return (
    <div className="celestial-card rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] tracking-widest font-semibold uppercase text-[#e6c35c] flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-[#e6c35c]" />
            LUNAR CHRONOMETER
          </span>
          <h3 className="text-xl font-bold font-celestial text-slate-100">Tsukuyomi's Countenance</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getImpactBadge(data.stargazingImpact)}`}>
          {data.stargazingImpact}
        </span>
      </div>

      <div className="flex items-center space-x-6 my-4">
        {/* Stylized Moon Graphic */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-[#e6c35c]/40 flex items-center justify-center shadow-xl shadow-[#e6c35c]/10">
          <div 
            className="absolute inset-0 rounded-full bg-[#f6df95] opacity-90 transition-all duration-700"
            style={{
              clipPath: `inset(0 ${100 - data.illuminationPct}% 0 0)`
            }}
          />
          {/* Subtle Crater pattern overlay */}
          <div className="absolute inset-0 rounded-full opacity-30 mix-blend-multiply bg-[radial-gradient(#1a202c_20%,transparent_20%)] bg-[size:8px_8px]" />
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </div>

        {/* Phase Details */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-white">{data.phaseName}</span>
            <span className="text-2xl font-bold font-celestial text-[#e6c35c]">
              {data.illuminationPct}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Lunar Age: <strong className="text-slate-200">{data.ageDays} days</strong> into the 29.5-day synodic cycle.
          </p>
          <div className="text-[11px] text-slate-400 bg-[#07090e]/60 p-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-300 mb-0.5">
              <Sparkles className="w-3 h-3 text-[#e6c35c]" />
              <span>Observing Tip:</span>
            </div>
            {data.illuminationPct < 25 ? (
              <span>Faint nebulae, galaxies, and meteor trails are prominently visible tonight.</span>
            ) : data.illuminationPct < 65 ? (
              <span>Target planetary conjunctions and bright double stars early before moon zenith.</span>
            ) : (
              <span>Deep-sky contrast is washed out by moonlight; ideal time for high-magnification lunar crater inspection.</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5 flex items-center justify-between">
        <span>Calculated via {data.source}</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Compass className="w-3 h-3 text-[#c93b2b]" />
          Zenith Coordinate Tracking
        </span>
      </div>
    </div>
  );
};
