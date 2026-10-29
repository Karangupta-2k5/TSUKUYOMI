import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationCoordinates } from '../types';
import { CANDIDATE_LOCATIONS } from '../data/mockData';
import { MapPin, Navigation } from 'lucide-react';

interface WatchtowerMapProps {
  currentLocation: LocationCoordinates;
  onSelectLocation: (loc: LocationCoordinates) => void;
  candidateLocations?: LocationCoordinates[];
}

export const WatchtowerMap: React.FC<WatchtowerMapProps> = ({
  currentLocation,
  onSelectLocation,
  candidateLocations = CANDIDATE_LOCATIONS
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 4,
        zoomControl: true,
        attributionControl: true
      });

      // Dark style OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Custom Icon for Selected Location
    const activeIcon = L.divIcon({
      className: 'custom-active-pin',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(201, 59, 43, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #c93b2b; border: 2px solid #e6c35c; box-shadow: 0 0 10px #c93b2b;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Custom Icon for Candidate Locations
    const candidateIcon = L.divIcon({
      className: 'custom-candidate-pin',
      html: `
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #e6c35c; border: 2px solid #07090e; box-shadow: 0 0 6px #e6c35c;"></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    // Add candidate locations
    candidateLocations.forEach(loc => {
      const isSelected = 
        Math.abs(loc.latitude - currentLocation.latitude) < 0.001 &&
        Math.abs(loc.longitude - currentLocation.longitude) < 0.001;

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: isSelected ? activeIcon : candidateIcon
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; color: #07090e; min-width: 160px; padding: 4px;">
          <strong style="font-size: 13px; color: #0d121d;">${loc.name}</strong><br/>
          <span style="font-size: 11px; color: #555;">${loc.country || ''} • Elev: ${loc.elevation ? loc.elevation + 'm' : 'Sea level'}</span><br/>
          <button id="pin-btn-${loc.latitude.toFixed(2)}" style="margin-top: 6px; width: 100%; background: #c93b2b; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            Select Watchtower
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`pin-btn-${loc.latitude.toFixed(2)}`);
        if (btn) {
          btn.onclick = () => {
            onSelectLocation(loc);
            map.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      markersRef.current.push(marker);
    });

    // Fly to current location
    map.flyTo([currentLocation.latitude, currentLocation.longitude], 6, {
      duration: 1.2
    });

    return () => {
      // Cleanup on unmount handled on component destroy
    };
  }, [currentLocation, candidateLocations, onSelectLocation]);

  return (
    <div className="celestial-card rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#c93b2b]" />
          <h3 className="font-celestial text-sm font-bold text-slate-200">
            Celestial Cartography
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#c93b2b]" /> Active Point
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#e6c35c]" /> Candidate Sanctum
          </span>
        </div>
      </div>

      {/* Map Element */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-white/10 z-0 relative"
      />

      {/* Footer Details */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1">
          <Navigation className="w-3.5 h-3.5 text-[#e6c35c]" />
          <span>Coordinates: {currentLocation.latitude.toFixed(4)}°N, {currentLocation.longitude.toFixed(4)}°E</span>
        </div>
        <span className="text-[10px] text-slate-500">Map data © OpenStreetMap contributors</span>
      </div>
    </div>
  );
};
