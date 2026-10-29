import React, { useState } from 'react';
import { TransientEvent, TransientCategory } from '../../types/transient';
import { Search, Flame, Zap, Radio, Sparkles, AlertTriangle } from 'lucide-react';

interface TransientEventFeedProps {
  events: TransientEvent[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}

export const TransientEventFeed: React.FC<TransientEventFeedProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: string[] = ['ALL', 'Supernova', 'Kilonova', 'Gamma-Ray Burst', 'Tidal Disruption'];

  const filteredEvents = events.filter((e) => {
    const matchesCat =
      filterCategory === 'ALL' || e.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.japaneseName.includes(searchQuery) ||
      e.constellation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-3">
      {/* ── Search & Category Filter ── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transient alert by name, Japanese record, or constellation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-[#c9a24a] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all border cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#c9a24a] text-black font-bold border-[#c9a24a]'
                  : 'bg-black/30 text-gray-400 border-white/5 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Events List ── */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredEvents.map((e) => {
          const isSelected = e.id === selectedEventId;
          return (
            <div
              key={e.id}
              onClick={() => onSelectEvent(e.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-r from-[#171f2e] to-[#0c1017] border-[#c9a24a] shadow-[0_0_15px_rgba(201,162,74,0.2)]'
                  : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
              }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c9a24a]" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-celestial text-xs font-bold text-white tracking-wide">
                      {e.name}
                    </span>
                    <span className="font-japanese text-[11px] text-[#c9a24a]">
                      {e.japaneseName}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#78837c] font-mono">
                    {e.designation} • {e.constellation}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                      e.alertLevel === 'CRITICAL'
                        ? 'bg-[#e0231c]/20 text-[#ff4b45] border border-[#e0231c]/40'
                        : e.alertLevel === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {e.alertLevel}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#fce38a]">
                    m_peak: {e.peakMagnitude > 0 ? `+${e.peakMagnitude}` : e.peakMagnitude}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

