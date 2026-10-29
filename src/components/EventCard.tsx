import React, { useState } from 'react';
import { CelestialEvent } from '../types';
import { Rocket, Sparkles, ExternalLink, Calendar, MapPin, Clock, Bell, Check } from 'lucide-react';

interface EventCardProps {
  event: CelestialEvent;
  onTrackEvent?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onTrackEvent }) => {
  const isLaunch = event.eventType === 'spaceflight';
  const [tracked, setTracked] = useState(false);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC`;
    } catch {
      return '';
    }
  };

  const handleToggleTrack = () => {
    setTracked((prev) => !prev);
    if (!tracked && onTrackEvent) {
      onTrackEvent(event.id);
    }
  };

  return (
    <div className="celestial-card rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Top Header Tag */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isLaunch
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-[#e6c35c]/10 text-[#fce38a] border-[#e6c35c]/30'
            }`}
          >
            {isLaunch ? <Rocket className="w-3 h-3 text-rose-400" /> : <Sparkles className="w-3 h-3 text-[#e6c35c]" />}
            {isLaunch ? 'Spaceflight Launch' : 'Astronomical Event'}
          </span>

          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            {event.category.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-celestial text-base font-bold text-white group-hover:text-[#e6c35c] transition-colors mb-2">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Metadata Details */}
        <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-[#e6c35c]" />
            <span>{formatDate(event.startTime)}</span>
            <span className="text-slate-500">•</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{formatTime(event.startTime)}</span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-[#c93b2b]" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.rocketName && (
            <div className="text-[11px] text-rose-300 font-mono bg-rose-950/20 px-2 py-0.5 rounded w-fit border border-rose-900/30">
              Vehicle: {event.rocketName}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Source Link & Gamified Pledge Watch */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
        <button
          onClick={handleToggleTrack}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
            tracked
              ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
              : 'bg-white/5 border-white/10 text-slate-300 hover:border-[#e0231c]/50 hover:text-white'
          }`}
        >
          {tracked ? <Check className="w-3 h-3 text-[#c9a24a]" /> : <Bell className="w-3 h-3 text-[#e0231c]" />}
          <span>{tracked ? 'Watch Pledged (+XP)' : 'Pledge Watch'}</span>
        </button>

        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-[#e6c35c] hover:text-[#ffd700] hover:underline"
        >
          <span>{event.sourceName}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
