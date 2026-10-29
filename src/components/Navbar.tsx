import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, Moon, Shield, Eye, Flame } from 'lucide-react';
import { AppMode } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'watchtower' | 'scroll' | 'lens';
  setActiveTab: (tab: 'dashboard' | 'watchtower' | 'scroll' | 'lens') => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

const NAV_LINKS = [
  { id: 'dashboard',  label: 'Dojo Dashboard', icon: Compass },
  { id: 'watchtower', label: 'Watchtower',      icon: Shield   },
  { id: 'scroll',     label: 'Celestial Scroll', icon: Sparkles },
  { id: 'lens',       label: 'Spirit Lens',     icon: Eye      },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, appMode, setAppMode }) => {
  const [stuck, setStuck]   = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 12);
      setHidden(y > lastY.current && y > 80);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navCls = [
    'sticky top-0 z-50 transition-transform duration-500',
    stuck  ? 'nav-backdrop border-b border-[rgba(223,231,224,0.07)]' : 'bg-transparent',
    hidden ? '-translate-y-full' : 'translate-y-0',
  ].join(' ');

  return (
    <header className={navCls}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* ── Brand ── */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[rgba(201,162,74,0.45)] shadow-lg shadow-[rgba(224,35,28,0.2)] group-hover:border-[rgba(201,162,74,0.8)] transition-colors duration-300">
              <img
                src="/tsukuyomi-logo.jpg"
                alt="Tsukuyomi Watch"
                className="w-full h-full object-cover"
              />
              {/* subtle verm overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(224,35,28,0.15)] to-transparent" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-celestial text-lg sm:text-xl font-bold tracking-wider text-[#dfe7e0] group-hover:text-[#c9a24a] transition-colors duration-300">
                  TSUKUYOMI
                </span>
                <span className="text-[10px] tracking-widest uppercase font-japanese text-[#e0231c] px-1.5 py-0.5 rounded border border-[rgba(224,35,28,0.4)] bg-[rgba(224,35,28,0.1)]">
                  月読命
                </span>
              </div>
              <p className="text-[11px] text-[#78837c] tracking-wider">The Samurai's Celestial Guide</p>
            </div>
          </div>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {NAV_LINKS.map(({ id, label, icon: Icon }) => {
              const isOn = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={[
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200',
                    isOn
                      ? 'bg-[rgba(224,35,28,0.18)] text-[#c9a24a] border border-[rgba(224,35,28,0.45)] shadow-sm shadow-[rgba(224,35,28,0.25)]'
                      : 'text-[#aab4ad] hover:text-[#dfe7e0] hover:bg-[rgba(223,231,224,0.05)]',
                  ].join(' ')}
                >
                  <Icon className={`w-4 h-4 ${isOn ? 'text-[#c9a24a]' : 'text-[#78837c]'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Mode Switcher ── */}
          <div className="flex items-center">
            <div className="flex items-center bg-[#0a0e12] border border-[rgba(223,231,224,0.1)] rounded-full p-1 text-xs">
              <button
                onClick={() => setAppMode('live')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-200 ${
                  appMode === 'live'
                    ? 'bg-[#e0231c] text-white font-semibold shadow-md shadow-[rgba(224,35,28,0.4)]'
                    : 'text-[#aab4ad] hover:text-[#dfe7e0]'
                }`}
                title="Fetches live data through n8n orchestration webhooks"
              >
                <Flame className="w-3 h-3 text-amber-200 animate-pulse" />
                <span>Live</span>
              </button>
              <button
                onClick={() => setAppMode('demo')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-200 ${
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
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-[rgba(223,231,224,0.05)] text-xs">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center space-y-1 transition-colors duration-150 ${
                activeTab === id ? 'text-[#c9a24a]' : 'text-[#78837c]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
