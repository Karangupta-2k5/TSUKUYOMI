import React, { useState } from 'react';
import { CelestialEvent, EventCategory } from '../types';
import { EventCard } from '../components/EventCard';
import { Sparkles, Rocket, Filter, Search, ShieldAlert, Globe } from 'lucide-react';

interface CelestialScrollPageProps {
  events: CelestialEvent[];
}

export const CelestialScrollPage: React.FC<CelestialScrollPageProps> = ({ events }) => {
  const [filterType, setFilterType] = useState<'all' | 'astronomical' | 'spaceflight' | 'meteor_shower' | 'eclipse'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredEvents = events.filter((e) => {
    // Type filter
    if (filterType === 'astronomical' && e.eventType !== 'astronomical') return false;
    if (filterType === 'spaceflight' && e.eventType !== 'spaceflight') return false;
    if (filterType === 'meteor_shower' && e.category !== 'meteor_shower') return false;
    if (filterType === 'eclipse' && e.category !== 'eclipse') return false;

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Scroll Header */}
      <div className="celestial-card p-6 sm:p-8 rounded-2xl border border-[#e6c35c]/25 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-japanese text-xs px-2 py-0.5 rounded border border-[#e6c35c]/40 bg-[#e6c35c]/10 text-[#fce38a]">
                星々の記録 • THE ORBITAL CHRONICLE
              </span>
            </div>
            <h1 className="font-celestial text-2xl sm:text-4xl font-bold text-white mt-2">
              The Celestial Scroll
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              A dual chronicle distinguishing genuine natural cosmic events (meteor showers, lunar eclipses, planetary alignments) from human spaceflight missions and rocket launches.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-[#07090e]/80 border border-white/10 px-3.5 py-2 rounded-xl text-slate-400">
            <Globe className="w-4 h-4 text-[#e6c35c]" />
            <span>Coordinated Universal Time (UTC) Standard</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                filterType === 'all'
                  ? 'bg-[#c93b2b]/20 text-[#fce38a] border-[#e6c35c]/50 font-semibold'
                  : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setFilterType('astronomical')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                filterType === 'astronomical'
                  ? 'bg-[#e6c35c]/20 text-[#fce38a] border-[#e6c35c]/50 font-semibold'
                  : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e6c35c]" />
              <span>Cosmic Only</span>
            </button>
            <button
              onClick={() => setFilterType('spaceflight')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                filterType === 'spaceflight'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-semibold'
                  : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-rose-400" />
              <span>Rocket Launches</span>
            </button>
            <button
              onClick={() => setFilterType('meteor_shower')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                filterType === 'meteor_shower'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                  : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Meteor Showers
            </button>
            <button
              onClick={() => setFilterType('eclipse')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                filterType === 'eclipse'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-semibold'
                  : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Eclipses
            </button>
          </div>

          {/* Search in Events */}
          <div className="relative sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by keyword..."
              className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6c35c]/50"
            />
          </div>
        </div>
      </div>

      {/* Distinction & Provenance Guarantee Banner */}
      <div className="bg-[#0b1019] border border-white/5 p-4 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#e6c35c] shrink-0" />
          <span>
            <strong>Astronomical Rigor:</strong> Natural celestial orbits are sourced from International Meteor Organization & NASA; spaceflight orbits are polled from Launch Library 2.
          </span>
        </span>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      ) : (
        <div className="celestial-card p-12 text-center rounded-2xl border border-white/10 space-y-3">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="font-celestial text-lg text-slate-300">No Events Match Your Query</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search criteria or reset filters to display all celestial happenings.
          </p>
          <button
            onClick={() => {
              setFilterType('all');
              setSearchFilter('');
            }}
            className="text-xs text-[#e6c35c] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
