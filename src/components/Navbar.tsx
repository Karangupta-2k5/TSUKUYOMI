import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, Moon, Shield, Eye, Flame, Landmark, Trophy } from 'lucide-react';
import { AppMode } from '../types';

export type SectionId = 'sanctuary' | 'gamification' | 'dashboard' | 'watchtower' | 'scroll' | 'lens';

interface NavbarProps {
  activeTab: SectionId;
  setActiveTab: (tab: SectionId) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  xp?: number;
}

const NAV_LINKS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sanctuary',    label: '3D Temple',        icon: Landmark },
  { id: 'gamification', label: 'Samurai Trials',   icon: Trophy   },
  { id: 'dashboard',    label: 'Dojo Score',       icon: Compass  },
  { id: 'watchtower',   label: 'Watchtower Map',   icon: Shield   },
  { id: 'scroll',       label: 'Celestial Scroll', icon: Sparkles },
  { id: 'lens',         label: 'Spirit Lens',      icon: Eye      },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, appMode, setAppMode, xp = 120 }) => {
  const [stuck, setStuck] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 12);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navCls = [
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    stuck ? 'nav-backdrop border-b border-[rgba(223,231,224,0.09)]' : 'bg-gradient-to-b from-[#05070a]/90 to-transparent',
  ].join(' ');

  return (
    <header className={navCls}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* ── Brand ── */}
          <div
            onClick={() => setActiveTab('sanctuary')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[rgba(201,162,74,0.45)] shadow-lg shadow-[rgba(224,35,28,0.2)] group-hover:border-[rgba(201,162,74,0.8)] transition-colors duration-300">
              <img
                src="/tsukuyomi-logo.jpg"
                alt="Tsukuyomi Watch"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(224,35,28,0.15)] to-transparent" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-celestial text-base sm:text-lg font-bold tracking-wider text-[#dfe7e0] group-hover:text-[#c9a24a] transition-colors duration-300">
                  TSUKUYOMI
                </span>
                <span className="text-[10px] tracking-widest uppercase font-japanese text-[#e0231c] px-1.5 py-0.5 rounded border border-[rgba(224,35,28,0.4)] bg-[rgba(224,35,28,0.1)]">
                  月読命
                </span>
              </div>
              <p className="text-[10px] text-[#78837c] tracking-wider hidden sm:block">The Samurai's Celestial Guide</p>
            </div>
          </div>

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.map(({ id, label, icon: Icon }) => {
              const isOn = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={[
                    'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
                    isOn
                      ? 'bg-[rgba(224,35,28,0.2)] text-[#c9a24a] border border-[rgba(224,35,28,0.45)] shadow-sm shadow-[rgba(224,35,28,0.25)]'
                      : 'text-[#aab4ad] hover:text-[#dfe7e0] hover:bg-[rgba(223,231,224,0.05)]',
                  ].join(' ')}
                >
                  <Icon className={`w-3.5 h-3.5 ${isOn ? 'text-[#c9a24a]' : 'text-[#78837c]'}`} />
                  <span>{label}</span>
                  {id === 'sanctuary' && (
                    <span className="text-[9px] uppercase px-1 rounded bg-[#e0231c]/25 text-[#ff5a3c] border border-[#e0231c]/40">3D</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── XP Badge + Mode Switcher ── */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab('gamification')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[rgba(201,162,74,0.12)] border border-[rgba(201,162,74,0.35)] text-xs font-bold text-[#fce38a] hover:bg-[rgba(201,162,74,0.22)] transition-all cursor-pointer"
              title="Your Samurai Stargazer Honor XP"
            >
              <Trophy className="w-3.5 h-3.5 text-[#c9a24a]" />
              <span>{xp} XP</span>
            </button>

            <div className="flex items-center bg-[#0a0e12] border border-[rgba(223,231,224,0.1)] rounded-full p-1 text-xs">
              <button
                onClick={() => setAppMode('live')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  appMode === 'live'
                    ? 'bg-[#e0231c] text-white font-semibold shadow-md shadow-[rgba(224,35,28,0.4)]'
                    : 'text-[#aab4ad] hover:text-[#dfe7e0]'
                }`}
                title="Fetches live data through n8n orchestration webhooks or Open-Meteo"
              >
                <Flame className="w-3 h-3 text-amber-200 animate-pulse" />
                <span>Live</span>
              </button>
              <button
                onClick={() => setAppMode('demo')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  appMode === 'demo'
                    ? 'bg-[rgba(201,162,74,0.2)] text-[#fce38a] border border-[rgba(201,162,74,0.4)] font-semibold'
                    : 'text-[#aab4ad] hover:text-[#dfe7e0]'
                }`}
                title="Uses verified offline fallback datasets for testing"
              >
                <Moon className="w-3 h-3" />
                <span>Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile bottom bar ── */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-[rgba(223,231,224,0.06)] text-[11px] overflow-x-auto">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                activeTab === id ? 'text-[#c9a24a] bg-white/5 font-semibold' : 'text-[#78837c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
