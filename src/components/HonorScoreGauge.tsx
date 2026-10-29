import React, { useState } from 'react';
import { ScoreComponents } from '../types';
import { calculateNightHonorScore } from '../lib/scoreCalculator';
import { Info, Cloud, Eye, Droplets, Moon, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HonorScoreGaugeProps {
  components: ScoreComponents;
  scoreOverride?: number;
  scoreLabel?: string;
  source?: string;
  limitations?: string[];
}

export const HonorScoreGauge: React.FC<HonorScoreGaugeProps> = ({
  components,
  scoreOverride,
  scoreLabel,
  source = 'Open-Meteo',
  limitations = []
}) => {
  const [showFormula, setShowFormula] = useState(false);
  const calculated = calculateNightHonorScore(components);
  const finalScore = scoreOverride !== undefined ? scoreOverride : calculated.score;
  const activeLabel = scoreLabel || calculated.label;

  // Determine color accents based on score
  const getVerdictStyle = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-500/10' };
    if (score >= 65) return { text: 'text-[#e6c35c]', border: 'border-[#e6c35c]/40', badge: 'bg-[#e6c35c]/10' };
    if (score >= 45) return { text: 'text-amber-500', border: 'border-amber-500/40', badge: 'bg-amber-500/10' };
    return { text: 'text-[#ff6b5b]', border: 'border-[#c93b2b]/40', badge: 'bg-[#c93b2b]/10' };
  };

  const style = getVerdictStyle(finalScore);

  return (
    <div className="celestial-card rounded-2xl p-6 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] tracking-widest font-semibold uppercase text-[#e6c35c] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c93b2b] animate-ping" />
            STARSIGHT HEURISTIC
          </span>
          <h2 className="text-xl font-bold font-celestial text-slate-100">Night Honor Score</h2>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-[#e6c35c] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-colors"
          title="Inspect transparent scoring heuristic formula"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Formula</span>
        </button>
      </div>

      {/* Main Radial / Score Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Score Ring */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Outer Decorative Rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#e6c35c]/30 animate-spin" style={{ animationDuration: '40s' }} />
            <div className="absolute inset-2 rounded-full border border-[#c93b2b]/20" />
            
            {/* Center Display */}
            <div className="flex flex-col items-center justify-center z-10 text-center">
              <span className="text-5xl font-black font-celestial text-white tracking-tighter">
                {finalScore}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                / 100 Honor
              </span>
              <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge} ${style.text} border ${style.border}`}>
                {calculated.verdict}
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400 italic">
            "{calculated.summary}"
          </p>
        </div>

        {/* 4 Core Components Breakdown */}
        <div className="md:col-span-7 space-y-3">
          {/* Clear Sky */}
          <div className="bg-[#07090e]/60 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Cloud className="w-3.5 h-3.5 text-[#e6c35c]" />
                Atmospheric Clarity (Clear Sky)
              </span>
              <span className="font-bold text-white">{components.clearSky}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-[#e6c35c] h-1.5 rounded-full" 
                style={{ width: `${components.clearSky}%` }} 
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-[#07090e]/60 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                Optical Transparency (Visibility)
              </span>
              <span className="font-bold text-white">{components.visibility}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-sky-500 h-1.5 rounded-full" 
                style={{ width: `${components.visibility}%` }} 
              />
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-[#07090e]/60 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Droplets className="w-3.5 h-3.5 text-indigo-400" />
                Dew & Moisture Suppression
              </span>
              <span className="font-bold text-white">{components.humidity}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-400 to-violet-500 h-1.5 rounded-full" 
                style={{ width: `${components.humidity}%` }} 
              />
            </div>
          </div>

          {/* Darkness / Light Pollution */}
          <div className="bg-[#07090e]/60 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                Bortle Darkness Index
              </span>
              {components.darkness !== null ? (
                <span className="font-bold text-white">{components.darkness}%</span>
              ) : (
                <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Reweighted (Weather Only)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {components.darkness !== null 
                ? 'Incorporates calibrated sky brightness layer.'
                : 'Scientific integrity: Light pollution excluded — weights redistributed proportionally to atmospheric clarity.'}
            </p>
          </div>
        </div>
      </div>

      {/* Formula & Transparency Modal / Accordion */}
      {showFormula && (
        <div className="mt-5 p-4 rounded-xl bg-[#0a0f18] border border-[#e6c35c]/30 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[#e6c35c] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Honest Mathematical Model:</span>
          </div>
          <p className="font-mono bg-black/40 p-2 rounded text-slate-200">
            Score = (0.53 × ClearSky) + (0.29 × VisibilityScore) + (0.18 × HumidityScore)
          </p>
          <p className="text-slate-400 text-[11px]">
            Weights are rebalanced automatically when Darkness data is unavailable to avoid fabricating light pollution indices. Source: {source}.
          </p>
        </div>
      )}

      {/* Limitations Footnote */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80" />
          Status: <strong className="text-slate-300 capitalize">{activeLabel}</strong>
        </span>
        <span className="italic">Local obstructions and low-altitude smoke may affect viewing.</span>
      </div>
    </div>
  );
};
