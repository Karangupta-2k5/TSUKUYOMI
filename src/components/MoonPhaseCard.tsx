import React from 'react';
import { MoonPhaseData } from '../types';
import { formatUtcToLocal } from '../lib/api';
import { Moon, Sparkles, Compass, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface MoonPhaseCardProps {
  data: MoonPhaseData | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({
  data,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const getImpactBadge = (impact: MoonPhaseData['stargazingImpact']) => {
    if (impact.includes('Ideal')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    }
    if (impact.includes('Moderate')) {
      return 'bg-[#e6c35c]/15 text-[#fce38a] border-[#e6c35c]/40';
    }
    return 'bg-[#c93b2b]/15 text-[#ff8b7b] border-[#c93b2b]/40';
  };

  if (error && !data) {
    return (
      <div className="celestial-card rounded-2xl p-6 border border-red-500/40 bg-red-950/15 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-widest font-semibold uppercase text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            USNO EPHEMERIS UNAVAILABLE
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-xs text-red-200 hover:bg-red-500/30 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
        <h3 className="text-lg font-bold font-celestial text-white">Moon Phase Data Unavailable</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
        <p className="text-[11px] text-slate-400 italic">
          Scientific integrity policy: Fake or hardcoded lunar dates are never substituted when the US Naval Observatory API is unreachable.
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="celestial-card rounded-2xl p-6 space-y-3 animate-pulse">
        <span className="text-[10px] tracking-widest font-semibold uppercase text-[#e6c35c] flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-[#e6c35c]" />
          QUERYING US NAVAL OBSERVATORY API...
        </span>
        <div className="h-24 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="celestial-card rounded-2xl p-6 relative overflow-hidden space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] tracking-widest font-semibold uppercase text-[#e6c35c] flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-[#e6c35c]" />
              LUNAR CHRONOMETER • USNO EPHEMERIS
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {data.dataClassification || 'Calculated Astronomical Ephemeris'}
            </span>
          </div>
          <h3 className="text-xl font-bold font-celestial text-slate-100 mt-0.5">
            Tsukuyomi&apos;s Countenance
          </h3>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getImpactBadge(
            data.stargazingImpact
          )}`}
        >
          {data.stargazingImpact}
        </span>
      </div>

      <div className="flex items-center space-x-5">
        {/* Stylized Moon Graphic */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-[#e6c35c]/40 flex items-center justify-center shadow-xl shadow-[#e6c35c]/10">
          <div
            className="absolute inset-0 rounded-full bg-[#f6df95] opacity-90 transition-all duration-700"
            style={{
              clipPath: `inset(0 ${100 - data.illuminationPct}% 0 0)`,
            }}
          />
          <div className="absolute inset-0 rounded-full opacity-30 mix-blend-multiply bg-[radial-gradient(#1a202c_20%,transparent_20%)] bg-[size:8px_8px]" />
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </div>

        {/* Phase Details */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-white">{data.phaseName}</span>
            <span className="text-2xl font-bold font-celestial text-[#e6c35c]">
              {data.illuminationPct}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Lunar Age: <strong className="text-slate-200">{data.ageDays} days</strong> since last USNO New Moon.
          </p>
          {data.nextMajorPhase && (
            <p className="text-[11px] text-slate-300 bg-[#07090e]/70 px-2.5 py-1.5 rounded-lg border border-white/5">
              Next USNO Phase: <strong className="text-[#fce38a]">{data.nextMajorPhase.phase}</strong> on{' '}
              <span className="text-white font-mono">
                {formatUtcToLocal(data.nextMajorPhase.utcIso)}
              </span>
            </p>
          )}
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

      {/* Upcoming USNO Primary Moon Phases (Local Timezone) */}
      {data.upcomingPhases && data.upcomingPhases.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
            Upcoming USNO Primary Phases (Local Time)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {data.upcomingPhases.slice(0, 4).map((p) => (
              <div
                key={p.utcIso}
                className="bg-[#07090e]/75 border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px]"
              >
                <span className="font-semibold text-[#fce38a] block">{p.phase}</span>
                <span className="text-[10px] text-slate-300 font-mono block truncate">
                  {formatUtcToLocal(p.utcIso)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source & Last Updated Footer */}
      <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span>Source:</span>
          {data.sourceUrl ? (
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e6c35c] hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              <span>{data.source}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            <span className="text-slate-300">{data.source}</span>
          )}
          {data.cached && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px]">
              Cached
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-[#c93b2b]" />
          <span>Updated: {formatUtcToLocal(data.lastUpdated, { includeDate: false, includeSeconds: true })}</span>
        </span>
      </div>
    </div>
  );
};
