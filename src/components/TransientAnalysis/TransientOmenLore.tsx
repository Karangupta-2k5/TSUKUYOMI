import React from 'react';
import { TransientEvent } from '../../types/transient';
import { BookOpen, Scroll, Sparkles, Compass } from 'lucide-react';

interface TransientOmenLoreProps {
  event: TransientEvent;
}

export const TransientOmenLore: React.FC<TransientOmenLoreProps> = ({ event }) => {
  return (
    <div className="space-y-4">
      {/* ── Heian Era Chronicle Box ── */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#121824] via-[#0d121c] to-[#121824] border border-[rgba(201,162,74,0.35)] shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
          <Scroll className="w-32 h-32 text-[#c9a24a]" />
        </div>

        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c9a24a]" />
            <span className="font-celestial text-sm font-bold text-white tracking-wider">
              Feudal Celestial Divination • 明月記と客星
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#c9a24a]">Record: Heian Astronomy</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-japanese text-sm text-[#fce38a] font-bold">
              {event.japaneseName}
            </span>
            <span className="text-[11px] text-[#78837c] font-mono">
              Observed by: {event.historicalObserver}
            </span>
          </div>

          <p className="text-xs text-[#dfe7e0] leading-relaxed italic border-l-2 border-[#c9a24a] pl-3 py-0.5 bg-black/20 rounded-r-lg">
            "{event.samuraiLore}"
          </p>
        </div>
      </div>

      {/* ── Astrophysical Physics Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-celestial">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Target Astrometry</span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono text-[#aab4ad]">
            <div className="flex justify-between">
              <span>Right Ascension (RA):</span>
              <span className="text-white font-bold">{event.coordinates.ra}</span>
            </div>
            <div className="flex justify-between">
              <span>Declination (Dec):</span>
              <span className="text-white font-bold">{event.coordinates.dec}</span>
            </div>
            <div className="flex justify-between">
              <span>Host Galaxy:</span>
              <span className="text-amber-300 font-bold">{event.hostGalaxy}</span>
            </div>
            <div className="flex justify-between">
              <span>Luminosity Distance:</span>
              <span className="text-cyan-300 font-bold">{event.distance}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-celestial">
            <Sparkles className="w-4 h-4 text-[#e0231c]" />
            <span>Diagnostic Signatures</span>
          </div>
          <ul className="space-y-1 text-[11px] text-[#aab4ad]">
            {event.keyFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#c9a24a] font-bold">›</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

