import React from 'react';
import { Compass, Sparkles, Moon, Shield, Eye, Flame } from 'lucide-react';
import { AppMode } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'watchtower' | 'scroll' | 'lens';
  setActiveTab: (tab: 'dashboard' | 'watchtower' | 'scroll' | 'lens') => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  appMode,
  setAppMode
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#07090e]/90 backdrop-blur-md border-b border-[#e6c35c]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-full border border-[#c93b2b]/60 bg-[#0d121d] flex items-center justify-center overflow-hidden shadow-lg shadow-[#c93b2b]/20 group-hover:border-[#e6c35c] transition-colors">
              <span className="font-japanese text-sm text-[#e6c35c]">月</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#c93b2b]/20 to-transparent"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-celestial text-lg sm:text-xl font-bold tracking-wider text-slate-100 group-hover:text-[#e6c35c] transition-colors">
                  TSUKUYOMI
                </span>
                <span className="text-[10px] tracking-widest uppercase font-japanese text-[#c93b2b] px-1.5 py-0.5 rounded border border-[#c93b2b]/40 bg-[#c93b2b]/10">
                  月読命
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wider">The Samurai's Celestial Guide</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#c93b2b]/20 text-[#e6c35c] border border-[#c93b2b]/50 shadow-sm shadow-[#c93b2b]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-[#e6c35c]" />
              <span>Dojo Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('watchtower')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                activeTab === 'watchtower'
                  ? 'bg-[#c93b2b]/20 text-[#e6c35c] border border-[#c93b2b]/50 shadow-sm shadow-[#c93b2b]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 text-[#c93b2b]" />
              <span>Watchtower</span>
            </button>

            <button
              onClick={() => setActiveTab('scroll')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                activeTab === 'scroll'
                  ? 'bg-[#c93b2b]/20 text-[#e6c35c] border border-[#c93b2b]/50 shadow-sm shadow-[#c93b2b]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#e6c35c]" />
              <span>Celestial Scroll</span>
            </button>

            <button
              onClick={() => setActiveTab('lens')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                activeTab === 'lens'
                  ? 'bg-[#c93b2b]/20 text-[#e6c35c] border border-[#c93b2b]/50 shadow-sm shadow-[#c93b2b]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4 text-[#ff8b7b]" />
              <span>Spirit Lens</span>
            </button>
          </nav>

          {/* Mode Switcher & Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-[#0d121d] border border-white/10 rounded-full p-1 text-xs">
              <button
                onClick={() => setAppMode('live')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all ${
                  appMode === 'live'
                    ? 'bg-[#c93b2b] text-white font-semibold shadow-md shadow-[#c93b2b]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fetches live data through n8n orchestration webhooks"
              >
                <Flame className="w-3 h-3 text-amber-200 animate-pulse" />
                <span>Live Mode</span>
              </button>
              <button
                onClick={() => setAppMode('demo')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all ${
                  appMode === 'demo'
                    ? 'bg-[#e6c35c]/20 text-[#fce38a] border border-[#e6c35c]/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Uses verified offline fallback datasets for testing"
              >
                <Moon className="w-3 h-3" />
                <span>Demo Fallback</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'dashboard' ? 'text-[#e6c35c]' : 'text-slate-400'}`}
          >
            <Compass className="w-4 h-4" />
            <span>Dojo</span>
          </button>
          <button
            onClick={() => setActiveTab('watchtower')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'watchtower' ? 'text-[#e6c35c]' : 'text-slate-400'}`}
          >
            <Shield className="w-4 h-4" />
            <span>Watchtower</span>
          </button>
          <button
            onClick={() => setActiveTab('scroll')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'scroll' ? 'text-[#e6c35c]' : 'text-slate-400'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Scroll</span>
          </button>
          <button
            onClick={() => setActiveTab('lens')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'lens' ? 'text-[#e6c35c]' : 'text-slate-400'}`}
          >
            <Eye className="w-4 h-4" />
            <span>Spirit Lens</span>
          </button>
        </div>
      </div>
    </header>
  );
};
