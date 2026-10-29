import React, { useEffect, useRef, useState } from 'react';
import { CelestialEvent } from '../types';
import { Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface CelestialScrollPageProps {
  events?: CelestialEvent[];
  onTrackEvent?: (id: string) => void;
}

export const CelestialScrollPage: React.FC<CelestialScrollPageProps> = ({ onTrackEvent }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(960);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeTimer: ReturnType<typeof setInterval>;

    const syncHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body) return;
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 860);
        if (Math.abs(h - iframeHeight) > 24) {
          setIframeHeight(Math.min(h + 32, 2400));
        }
      } catch {
        // Ignore cross-origin or transient mount timing
      }
    };

    const handleLoad = () => {
      syncHeight();
      resizeTimer = setInterval(syncHeight, 900);

      // Hook clicks inside the Celestial Scroll module to award Samurai Quest XP
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.addEventListener('click', (e) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.closest('button') || target.closest('.row') || target.closest('.slot'))) {
              onTrackEvent?.('celestial-scroll-interaction');
            }
            setTimeout(syncHeight, 150);
          });
        }
      } catch {
        // Ignore
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearInterval(resizeTimer);
    };
  }, [iframeHeight, onTrackEvent]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/25 bg-[#0B0C10] shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#12141c] border-b border-[#2b2e3a] text-xs">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Sparkles className="w-4 h-4" />
          <span className="font-celestial font-bold tracking-wider uppercase">
            The Celestial Scroll &amp; Star Collector
          </span>
          <span className="text-slate-400 hidden sm:inline">
            • 88 Constellations · EXIF Photo Verification · Shared Sky · Leaderboard
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all cursor-pointer"
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{expanded ? 'Standard View' : 'Expand Scroll'}</span>
        </button>
      </div>

      {/* Embedded Partner Celestial Scroll & Star Collector Application */}
      <iframe
        ref={iframeRef}
        src="/celestial-scroll/index.html"
        title="The Celestial Scroll & Star Collector — Tsukuyomi Watch"
        className="w-full block border-0 bg-[#0B0C10]"
        style={{
          height: expanded ? '1450px' : `${iframeHeight}px`,
          minHeight: '860px',
          transition: 'height 0.25s ease',
        }}
      />
    </div>
  );
};
