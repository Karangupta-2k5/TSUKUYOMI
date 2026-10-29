import { useState } from 'react';
import type { NearbyResponse, NearbyLocation } from '../types';
import {
  Telescope, MapPin, Navigation, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Info
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  data: NearbyResponse;
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  onRefresh: () => void;
  loading: boolean;
  onLocationHover: (loc: NearbyLocation | null) => void;
  onLocationSelect: (loc: NearbyLocation) => void;
  selectedId: number | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  Observatory:      '🔭',
  Viewpoint:        '⛰',
  'Nature Reserve': '🌿',
  Park:             '🏞',
  'Natural Feature':'🗻',
  'Heath / Moorland':'🌾',
  Meadow:           '🌱',
  'Open Area':      '◌',
};

function LocationCard({
  loc, selected, onHover, onClick
}: { loc: NearbyLocation; selected: boolean; onHover: (l: NearbyLocation | null) => void; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[loc.category] || '📍';

  return (
    <div
      className={clsx(
        'border rounded-xl transition-all duration-200 cursor-pointer',
        selected
          ? 'border-wt-gold/50 bg-wt-gold/5'
          : 'border-wt-gold/10 bg-wt-ink hover:border-wt-gold/25 hover:bg-wt-ink-soft'
      )}
      onMouseEnter={() => onHover(loc)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 p-3.5">
        <span className="text-xl mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-wt-title text-wt-parchment text-sm leading-tight">{loc.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-wt-parchment/40 font-wt-serif">{loc.category}</span>
                {loc.subcategory && (
                  <span className="text-xs text-wt-parchment/30 font-wt-serif">· {loc.subcategory}</span>
                )}
                {loc.is_observatory && (
                  <span className="text-[10px] bg-wt-gold/10 border border-wt-gold/25 text-wt-gold px-1.5 py-0.5 rounded-full font-wt-title uppercase tracking-wider">
                    Observatory
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-wt-title text-wt-gold/70">{loc.distance_km.toFixed(1)} km</p>
              <p className="text-[10px] text-wt-parchment/30 font-wt-serif">
                {loc.latitude.toFixed(3)}°, {loc.longitude.toFixed(3)}°
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <a
              href={loc.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-wt-gold/60 hover:text-wt-gold transition-colors"
            >
              <Navigation className="w-3 h-3" />
              Directions
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1 text-xs text-wt-parchment/30 hover:text-wt-parchment/60 transition-colors ml-auto"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Details
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-wt-gold/10 px-3.5 pb-3.5 pt-2.5 space-y-1.5">
          <p className="text-xs text-wt-parchment/50 font-wt-serif leading-relaxed">{loc.suitability_note}</p>
          {Object.entries(loc.tags).slice(0,6).map(([k, v]) => (
            <div key={k} className="flex gap-1.5 text-[10px] text-wt-parchment/30 font-wt-serif">
              <span className="text-wt-parchment/20">{k}:</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NearbyLocations({
  data, radiusKm, onRadiusChange, onRefresh, loading, onLocationHover, onLocationSelect, selectedId
}: Props) {
  return (
    <div className="space-y-4 animate-wt-fadeIn">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-wt-title text-wt-parchment/50 uppercase tracking-widest">
            Search Radius
          </label>
          <select
            value={radiusKm}
            onChange={e => onRadiusChange(Number(e.target.value))}
            className="bg-wt-ink border border-wt-gold/20 rounded-lg px-2 py-1.5 text-xs text-wt-parchment font-wt-title focus:outline-none focus:border-wt-gold/50"
          >
            {[5, 10, 25, 50, 100].map(r => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-wt-gold/60 hover:text-wt-gold transition-colors font-wt-title disabled:opacity-40"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {data.error && (
        <div className="flex items-start gap-2 bg-wt-torii/5 border border-wt-torii/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-wt-torii shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-wt-title text-wt-torii">Overpass API Unavailable</p>
            <p className="text-xs text-wt-parchment/50 font-wt-serif mt-1">{data.error}</p>
            <p className="text-xs text-wt-parchment/40 font-wt-serif mt-0.5">
              Weather and scoring features remain available. Nearby results will load when the API recovers.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data.error && data.locations.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Telescope className="w-8 h-8 text-wt-gold/20" />
          <p className="text-wt-parchment/40 font-wt-serif text-sm">
            No candidate locations found within {radiusKm} km. Try increasing the search radius.
          </p>
        </div>
      )}

      {/* Location list */}
      {data.locations.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 text-xs text-wt-parchment/30 font-wt-serif">
            <MapPin className="w-3 h-3" />
            {data.locations.length} candidate{data.locations.length !== 1 ? 's' : ''} within {radiusKm} km
            {data.cached && <span className="text-wt-gold/30 ml-1">(cached)</span>}
            <span className="ml-auto text-wt-parchment/20">{data.source}</span>
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {data.locations.map(loc => (
              <LocationCard
                key={`${loc.osm_id}-${loc.latitude}-${loc.longitude}`}
                loc={loc}
                selected={selectedId === loc.osm_id}
                onHover={onLocationHover}
                onClick={() => onLocationSelect(loc)}
              />
            ))}
          </div>
        </>
      )}

      {/* OSM disclaimer */}
      <div className="flex items-start gap-2 text-xs text-wt-parchment/25 font-wt-serif italic border-t border-wt-gold/10 pt-3">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-wt-gold/20" />
        <span>{data.disclaimer}</span>
      </div>
    </div>
  );
}
