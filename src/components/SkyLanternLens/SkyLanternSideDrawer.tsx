import React, { useState, useEffect } from 'react';
import { Telescope, X, Sparkles, ChevronRight, Layers, Compass } from 'lucide-react';
import { SkyLanternLens } from './SkyLanternLens';

interface SkyLanternSideDrawerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAwardXp?: (amount: number, reason: string) => void;
  onTrackTarget?: (targetName: string) => void;
}

export const SkyLanternSideDrawer: React.FC<SkyLanternSideDrawerProps> = ({
  isOpen: controlledIsOpen,
  onOpenChange,
  onAwardXp,
  onTrackTarget,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);

  const isDrawerOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setDrawerOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // Keyboard escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* ── FLOATING SIDE TAB / PILL TRIGGER (RIGHT EDGE) ── */}
      {!isDrawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 group cursor-pointer"
          title="Open NASA SkyView Virtual Observatory Side Panel"
          aria-label="Open NASA SkyView Observatory"
        >
          <div className="flex items-center bg-[#070a0f]/95 hover:bg-[#0c121c] border-y border-l border-[#c9a24a]/60 hover:border-[#c9a24a] rounded-l-2xl py-3.5 pl-3.5 pr-2.5 shadow-2xl shadow-[rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 group-hover:-translate-x-1">
            {/* Glowing Icon & Pulse */}
            <div className="relative mr-2 flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e0231c]/30 to-[#c9a24a]/30 border border-[#c9a24a]/60 flex items-center justify-center text-[#fce38a] shadow-md group-hover:scale-105 transition-transform">
                <Telescope className="w-4 h-4 text-[#fce38a]" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#e0231c] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#e0231c]" />
            </div>

            {/* Vertical/Horizontal Callout Text */}
            <div className="text-left flex flex-col justify-center select-none">
              <div className="flex items-center gap-1.5">
                <span className="font-celestial text-[11px] font-bold text-white tracking-wider group-hover:text-[#fce38a] transition-colors">
                  NASA Lens
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#e0231c]/25 text-[#ff766b] font-bold border border-[#e0231c]/40">
                  LIVE
                </span>
              </div>
              <span className="font-japanese text-[10px] text-[#c9a24a] tracking-wider">
                天灯の鏡
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-[#78837c] group-hover:text-[#fce38a] ml-1 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      )}

      {/* ── BACKDROP BLUR OVERLAY ── */}
      {isDrawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* ── SLIDE-OUT SIDE DRAWER PANEL ── */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-5xl bg-[#070a0f] border-l-2 border-[#c9a24a]/50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Sticky Top Header */}
        <div className="sticky top-0 z-30 px-6 py-4 bg-[#0a0e14]/98 border-b border-[rgba(201,162,74,0.3)] backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9a24a]/20 border border-[#c9a24a]/50 flex items-center justify-center text-[#fce38a] shadow-md">
              <Telescope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-celestial text-base font-bold text-white tracking-wider">
                  The Sky Lantern Lens
                </h3>
                <span className="font-japanese text-xs text-[#c9a24a] px-1.5 py-0.5 rounded bg-[#c9a24a]/10 border border-[#c9a24a]/30">
                  天灯の鏡
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#78837c]">
                NASA SkyView Virtual Observatory Sidecar Console
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NASA GSFC Connected
            </span>

            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-xl bg-[#05070a] border border-[rgba(223,231,224,0.15)] text-[#aab4ad] hover:text-white hover:border-[#e0231c] transition-all cursor-pointer"
              title="Close Sidecar Panel (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6">
          <SkyLanternLens
            onAwardXp={onAwardXp}
            onTrackTarget={onTrackTarget}
          />
        </div>
      </aside>
    </>
  );
};

