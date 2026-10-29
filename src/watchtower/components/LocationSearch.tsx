import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Globe } from 'lucide-react';
import { searchLocations, fetchCurrentLocation, reverseGeocode } from '../api/client';
import type { GeoResult, SelectedLocation } from '../types';
import clsx from 'clsx';

interface Props {
  onLocationSelect: (loc: SelectedLocation) => void;
  selectedLocation: SelectedLocation | null;
}

export default function LocationSearch({ onLocationSelect, selectedLocation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setError(null);
    try {
      const resp = await searchLocations(q, 8);
      setResults(resp.results);
      setOpen(resp.results.length > 0);
    } catch {
      setError('Search unavailable. Check your connection.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const select = (r: GeoResult) => {
    const loc: SelectedLocation = {
      name: r.name,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
      population: r.population,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    };
    onLocationSelect(loc);
    setQuery('');
    setOpen(false);
    setResults([]);
  };

  const useMyLocation = async () => {
    setGeoLoading(true);
    setError(null);

    const fallbackToNetwork = async () => {
      try {
        const loc = await fetchCurrentLocation();
        onLocationSelect(loc);
      } catch {
        setError('Unable to detect location. Please type your city in the search bar above.');
      } finally {
        setGeoLoading(false);
      }
    };

    if (!navigator.geolocation) {
      await fallbackToNetwork();
      return;
    }

    let resolved = false;
    // 4.5 second timeout before trying network IP fallback
    const timeoutTimer = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        await fallbackToNetwork();
      }
    }, 4500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutTimer);
        const { latitude, longitude } = pos.coords;
        try {
          const rev = await reverseGeocode(latitude, longitude);
          onLocationSelect(rev);
        } catch {
          onLocationSelect({
            name: 'Your Location',
            country: '',
            latitude,
            longitude,
            displayName: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
          });
        } finally {
          setGeoLoading(false);
        }
      },
      async () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutTimer);
        // Seamless fallback to network IP location
        await fallbackToNetwork();
      },
      { timeout: 4000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  return (
    <div className="relative w-full">
      {/* Search input row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wt-gold/50 w-4 h-4" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Search any city, region or place worldwide…"
            className={clsx(
              'w-full bg-wt-ink border border-wt-gold/20 rounded-lg pl-9 pr-9 py-2.5',
              'text-wt-parchment font-wt-serif text-sm placeholder-wt-parchment/30',
              'focus:outline-none focus:border-wt-gold/60 focus:ring-1 focus:ring-wt-gold/20',
              'transition-all duration-200'
            )}
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wt-gold/50 animate-spin" />}
          {!loading && query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-wt-parchment/30 hover:text-wt-parchment/60">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Geolocation button */}
        <button
          onClick={useMyLocation}
          disabled={geoLoading}
          type="button"
          title="Detect and use my current location"
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-wt-title',
            'border-wt-gold/30 text-wt-gold bg-wt-gold/5 hover:bg-wt-gold/15 hover:border-wt-gold/60',
            'transition-all duration-200 whitespace-nowrap active:scale-95 shadow-sm',
            geoLoading && 'opacity-70 cursor-not-allowed'
          )}
        >
          {geoLoading
            ? <Loader2 className="w-4 h-4 animate-spin text-wt-gold" />
            : <MapPin className="w-4 h-4 text-wt-gold" />}
          <span className="hidden sm:inline">Use My Location</span>
        </button>
      </div>

      {/* Error notice */}
      {error && (
        <p className="mt-1.5 text-xs text-wt-torii font-wt-serif italic">{error}</p>
      )}

      {/* Selected location chip */}
      {selectedLocation && !open && (
        <div className="flex items-center gap-2 mt-2 text-sm text-wt-parchment/70 font-wt-serif">
          <Globe className="w-3.5 h-3.5 text-wt-gold/60 shrink-0" />
          <span className="truncate font-wt-title font-medium">{selectedLocation.displayName}</span>
          <span className="text-wt-parchment/40 text-xs shrink-0">
            ({selectedLocation.latitude.toFixed(3)}°, {selectedLocation.longitude.toFixed(3)}°)
          </span>
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-12 mt-1 z-50 bg-wt-ink-soft border border-wt-gold/20 rounded-lg shadow-2xl overflow-hidden animate-wt-fadeIn">
          {results.map((r, i) => (
            <button
              key={r.id}
              onMouseDown={() => select(r)}
              className={clsx(
                'w-full text-left px-4 py-2.5 flex items-start gap-3',
                'hover:bg-wt-gold/10 transition-colors duration-150',
                i > 0 && 'border-t border-wt-gold/10'
              )}
            >
              <MapPin className="w-3.5 h-3.5 text-wt-gold/40 mt-0.5 shrink-0" />
              <div>
                <span className="text-wt-parchment text-sm font-wt-title">{r.name}</span>
                {r.admin1 && <span className="text-wt-parchment/50 text-xs ml-1">{r.admin1}</span>}
                <div className="text-wt-parchment/40 text-xs mt-0.5">
                  {r.country} · {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
                  {r.population ? ` · pop. ${r.population.toLocaleString()}` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
