import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, Shield, Eye, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { AppMode } from '../types';
import { StargazerUser } from './SignupModal';

export type SectionId = 'sanctuary' | 'gamification' | 'dashboard' | 'watchtower' | 'scroll' | 'lens';

interface NavbarProps {
  activeTab: SectionId;
  setActiveTab: (tab: SectionId) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  xp?: number;
  isSamuraiHonoursPage?: boolean;
  currentUser?: StargazerUser | null;
  onSamuraiHonoursClick?: () => void;
}

const NAV_LINKS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'watchtower', label: 'Watchtower',       icon: Shield   },
  { id: 'scroll',     label: 'Celestial Scroll', icon: Sparkles },
  { id: 'lens',       label: 'Spirit Lens',      icon: Eye      },
  { id: 'dashboard',  label: 'Dojo Score',       icon: Compass  },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSamuraiHonoursPage = false,
  currentUser = null,
  onSamuraiHonoursClick,
}) => {
  const [, setStuck] = useState(false);
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
    'bg-[#05070a]/95 backdrop-blur-md border-b border-[rgba(223,231,224,0.08)] shadow-2xl shadow-[#05070a]',
  ].join(' ');

  const handleHonoursClick = () => {
    if (onSamuraiHonoursClick) {
      onSamuraiHonoursClick();
    } else {
      setActiveTab('gamification');
    }
  };

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
              const isOn = !isSamuraiHonoursPage && activeTab === id;
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

          {/* ── Samurai Honours Button (Auth-Gated Chapter V Page Trigger) ── */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleHonoursClick}
              className={[
                'flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer',
                isSamuraiHonoursPage
                  ? 'bg-[#e0231c] border-[#e0231c] text-white shadow-lg shadow-[#e0231c]/30'
                  : 'bg-[rgba(201,162,74,0.12)] border-[rgba(201,162,74,0.4)] text-[#fce38a] hover:bg-[rgba(201,162,74,0.22)]',
              ].join(' ')}
            >
              <Trophy className={`w-3.5 h-3.5 ${isSamuraiHonoursPage ? 'text-white' : 'text-[#c9a24a]'}`} />
              <span>Samurai Honours</span>
              {currentUser ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 border border-[rgba(201,162,74,0.35)] text-[10px] text-[#fce38a]">
                  <span>{currentUser.avatar}</span>
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                </span>
              ) : (
                <Lock className="w-3 h-3 text-[#c9a24a] opacity-80" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile bottom bar ── */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-[rgba(223,231,224,0.06)] text-[11px] overflow-x-auto gap-1">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const isOn = !isSamuraiHonoursPage && activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  isOn ? 'text-[#c9a24a] bg-white/5 font-semibold' : 'text-[#78837c]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleHonoursClick}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              isSamuraiHonoursPage ? 'text-white bg-[#e0231c]/80 font-semibold' : 'text-[#fce38a]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Samurai Honours</span>
          </button>
        </div>
      </div>
    </header>
  );
};
