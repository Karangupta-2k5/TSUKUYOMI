import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { NearbyLocation, SelectedLocation } from '../types';

interface Props {
  center: SelectedLocation;
  nearby: NearbyLocation[];
  hoveredLocation: NearbyLocation | null;
  selectedLocation: NearbyLocation | null;
  onMapClick: (lat: number, lon: number) => void;
}

export default function StargazingMap({ center, nearby, hoveredLocation, selectedLocation, onMapClick }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const centerMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    const map = L.map(containerRef.current, {
      center: [center.latitude, center.longitude],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (centerMarkerRef.current) centerMarkerRef.current.remove();

    const svgIcon = `
      <div style="position:relative;width:32px;height:38px;display:flex;align-items:center;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 28 36">
          <circle cx="14" cy="14" r="12" fill="#c0392b" stroke="#f0e6c8" stroke-width="1.5"/>
          <circle cx="14" cy="14" r="5" fill="#f0e6c8"/>
          <line x1="14" y1="26" x2="14" y2="35" stroke="#c0392b" stroke-width="2.5"/>
        </svg>
      </div>`;

    const icon = L.divIcon({
      html: svgIcon,
      iconSize: [32, 38],
      iconAnchor: [16, 38],
      className: '',
    });

    const marker = L.marker([center.latitude, center.longitude], { icon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Georgia, serif;padding:4px;">
          <b style="color:#d4af37;font-family:'Cinzel',serif;font-size:14px;">${center.displayName}</b><br/>
          <span style="font-size:11px;color:#c8b89a;">${center.latitude.toFixed(4)}°N, ${center.longitude.toFixed(4)}°E</span>
        </div>
      `);

    centerMarkerRef.current = marker;
    map.setView([center.latitude, center.longitude], map.getZoom());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  // Update nearby markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    nearby.forEach(loc => {
      const key = `${loc.osm_id}-${loc.latitude}-${loc.longitude}`;
      const color = loc.is_observatory ? '#d4af37' : '#9b59b6';
      const iconText = loc.is_observatory ? '🔭' : (loc.category === 'Viewpoint' ? '⛰' : '⛩');

      const icon = L.divIcon({
        html: `<div style="
          width:26px;height:26px;border-radius:50%;
          background:#12121f;border:2px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:13px;box-shadow:0 0 10px ${color}88;
          cursor:pointer;
        ">${iconText}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        className: '',
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Georgia, serif;min-width:180px;padding:4px;">
            <b style="color:#f0e6c8;font-family:'Cinzel',serif;font-size:13px;">${loc.name}</b><br/>
            <span style="font-size:11px;color:#d4af37;text-transform:uppercase;letter-spacing:0.05em;">${loc.category}${loc.subcategory ? ' · ' + loc.subcategory : ''}</span><br/>
            <span style="font-size:11px;color:#c8b89a;">${loc.distance_km.toFixed(1)} km away</span><br/>
            <div style="margin-top:6px;">
              <a href="${loc.directions_url}" target="_blank" rel="noopener noreferrer" style="color:#d4af37;text-decoration:underline;font-size:11px;font-weight:bold;">
                Get Directions ↗
              </a>
            </div>
          </div>
        `);

      markersRef.current.set(key, marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby]);

  // Highlight hovered / selected
  useEffect(() => {
    if (!hoveredLocation && !selectedLocation) return;
    const map = mapRef.current;
    if (!map) return;
    const target = selectedLocation || hoveredLocation;
    if (!target) return;
    const key = `${target.osm_id}-${target.latitude}-${target.longitude}`;
    const marker = markersRef.current.get(key);
    if (marker) {
      marker.openPopup();
      map.panTo([target.latitude, target.longitude]);
    }
  }, [hoveredLocation, selectedLocation]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-wt-gold/15" style={{ height: 420 }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 z-[1000] bg-wt-ink/90 border border-wt-gold/25 rounded-lg px-2.5 py-1 text-[11px] text-wt-parchment/60 font-wt-serif shadow-md">
        Click map anywhere to set location · Drag to explore
      </div>
    </div>
  );
}
