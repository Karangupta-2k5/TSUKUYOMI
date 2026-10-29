import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Crosshair,
  Grid,
  Compass,
  Sliders,
  Sparkles,
  Layers,
  ArrowLeftRight,
  Eye,
  Camera,
  Info,
} from 'lucide-react';
import { TelescopeReticle } from './TelescopeReticle';
import { WavelengthBand } from '../../types/skyview';

interface CelestialMirrorDisplayProps {
  imageUrl: string;
  userPhotoUrl?: string;
  targetName: string;
  targetKanji: string;
  wavelength: WavelengthBand;
  surveyKey: string;
  ra: string;
  dec: string;
  fov: string;
  isLoading: boolean;
  loadingMessage?: string;
}

export const CelestialMirrorDisplay: React.FC<CelestialMirrorDisplayProps> = ({
  imageUrl,
  userPhotoUrl,
  targetName,
  targetKanji,
  wavelength,
  surveyKey,
  ra,
  dec,
  fov,
  isLoading,
  loadingMessage = 'Aligning celestial mirrors to NASA deep-space telemetry...',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reticle & HUD state
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [reticleRotation, setReticleRotation] = useState<number>(0);

  // Comparison state (Amateur photo vs Official NASA survey)
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isSliderDragging = useRef<boolean>(false);

  // Reset zoom & pan on target/survey change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setReticleRotation(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (compareMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSliderDragging.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(5, Math.min(pos, 95)));
      return;
    }
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isSliderDragging.current = false;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[rgba(201,162,74,0.35)] bg-[#05070a] shadow-2xl flex flex-col group select-none">
      {/* ── Top Header Bar / Lens Telemetry Status ── */}
      <div className="relative z-30 px-4 py-3 bg-[#0a0e12]/95 border-b border-[rgba(223,231,224,0.08)] backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#c9a24a]/20 border border-[#c9a24a]/40 text-[#fce38a]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-celestial text-sm font-bold text-white tracking-wider">
                {targetName}
              </span>
              <span className="font-japanese text-xs text-[#c9a24a] px-1.5 py-0.2 rounded border border-[#c9a24a]/30 bg-[#c9a24a]/10">
                {targetKanji}
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#78837c]">
              SURVEY: <span className="text-[#dfe7e0] font-semibold">{surveyKey}</span> • BAND:{' '}
              <span className="text-[#c9a24a] font-semibold">{wavelength}</span> • FOV: {fov}
            </p>
          </div>
        </div>

        {/* Action Controls & Overlays */}
        <div className="flex items-center space-x-1.5">
          {/* Comparison Mode Toggle */}
          {userPhotoUrl && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                compareMode
                  ? 'bg-[#e0231c] text-white border-[#e0231c] shadow-lg shadow-[rgba(224,35,28,0.35)]'
                  : 'bg-[#05070a]/80 text-[#dfe7e0] border-[rgba(223,231,224,0.15)] hover:border-[#c9a24a]'
              }`}
              title="Toggle Side-by-Side Comparison with your Astrophoto"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{compareMode ? 'Dual Mirror ON' : 'Compare vs My Photo'}</span>
            </button>
          )}

          {/* Reticle Toggle */}
          <button
            onClick={() => setShowReticle(!showReticle)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showReticle
                ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
                : 'bg-[#05070a]/60 border-[rgba(223,231,224,0.1)] text-[#78837c] hover:text-white'
            }`}
            title="Toggle Samurai Cardinal Reticle"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showGrid
                ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
                : 'bg-[#05070a]/60 border-[rgba(223,231,224,0.1)] text-[#78837c] hover:text-white'
            }`}
            title="Toggle Coordinate Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Coordinates HUD Toggle */}
          <button
            onClick={() => setShowCoordinates(!showCoordinates)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showCoordinates
                ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
                : 'bg-[#05070a]/60 border-[rgba(223,231,224,0.1)] text-[#78837c] hover:text-white'
            }`}
            title="Toggle Telemetry HUD"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 pl-2 border-l border-[rgba(223,231,224,0.1)]">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-[#05070a]/60 border border-[rgba(223,231,224,0.1)] text-[#dfe7e0] hover:text-white hover:border-[#c9a24a] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-[#c9a24a] px-1 font-bold min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-[#05070a]/60 border border-[rgba(223,231,224,0.1)] text-[#dfe7e0] hover:text-white hover:border-[#c9a24a] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-[#05070a]/60 border border-[rgba(223,231,224,0.1)] text-[#78837c] hover:text-white hover:border-[#c9a24a] cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Viewport Area ── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[460px] sm:h-[540px] bg-black overflow-hidden flex items-center justify-center ${
          compareMode ? 'cursor-ew-resize' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Mystic Star-Gate / Torii Loading Animation */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-[#05070a]/92 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer Pulsing Star-Gate Ring */}
              <div className="absolute inset-0 rounded-full border border-[rgba(201,162,74,0.3)] animate-ping opacity-30" />
              {/* Counter-rotating celestial dial */}
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#c9a24a]/50 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-5 rounded-full border border-[#e0231c]/60 animate-[spin_6s_linear_infinite_reverse]" />

              {/* Japanese Torii / Celestial Mon Centerpiece */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-[#05070a] border border-[#c9a24a] flex items-center justify-center shadow-lg shadow-[rgba(201,162,74,0.4)]">
                <span className="font-japanese text-xl text-[#fce38a] font-bold">鏡</span>
              </div>
            </div>

            <div className="text-center space-y-1.5 px-4 max-w-sm">
              <span className="text-[10px] font-bold font-japanese uppercase tracking-[0.25em] text-[#e0231c] block">
                天灯の鏡 • 深宇宙通信
              </span>
              <p className="font-celestial text-sm font-semibold text-white">
                Querying NASA GSFC SkyView Archive
              </p>
              <p className="text-xs text-[#aab4ad]">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* ── Visual Comparison Mode (Amateur Photo vs NASA Survey Tile) ── */}
        {compareMode && userPhotoUrl ? (
          <div className="relative w-full h-full">
            {/* Background Image: NASA Deep-Space Survey */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img
                src={imageUrl}
                alt={`NASA Survey ${targetName}`}
                className="w-full h-full object-contain filter contrast-110"
              />
              <div className="absolute top-4 right-4 bg-[#05070a]/85 border border-[#c9a24a]/40 px-3 py-1.5 rounded-lg text-right z-10">
                <span className="text-[9px] font-mono text-[#c9a24a] block uppercase font-bold">
                  OFFICIAL NASA OBSERVATION
                </span>
                <span className="text-xs text-white font-mono font-semibold">{surveyKey} Survey</span>
              </div>
            </div>

            {/* Foreground Image: User's Amateur Astrophotograph with Clip-Path Slider */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={userPhotoUrl}
                alt={`Amateur astrophoto ${targetName}`}
                className="w-full h-full object-contain filter contrast-105"
              />
              <div className="absolute top-4 left-4 bg-[#05070a]/85 border border-[#e0231c]/50 px-3 py-1.5 rounded-lg z-10">
                <span className="text-[9px] font-mono text-[#ff766b] block uppercase font-bold">
                  PERSONAL SAMURAI EXPOSURE
                </span>
                <span className="text-xs text-white font-mono font-semibold">Amateur Ground Scope</span>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#c9a24a] z-30 flex items-center justify-center cursor-ew-resize drop-shadow-[0_0_8px_rgba(201,162,74,0.8)]"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={() => (isSliderDragging.current = true)}
            >
              <div className="w-8 h-8 rounded-full bg-[#05070a] border-2 border-[#c9a24a] flex items-center justify-center text-[#fce38a] shadow-xl">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          /* ── Standard Telescope Observation Viewport ── */
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <img
              src={imageUrl}
              alt={`NASA SkyView observation of ${targetName}`}
              className="max-w-full max-h-full object-contain filter contrast-110 drop-shadow-2xl"
              draggable={false}
            />
          </div>
        )}

        {/* ── Reticle & Crosshair Compass Overlay ── */}
        {!compareMode && (
          <TelescopeReticle
            wavelength={wavelength}
            showReticle={showReticle}
            showGrid={showGrid}
            showCoordinates={showCoordinates}
            ra={ra}
            dec={dec}
            fov={fov}
            rotation={reticleRotation}
          />
        )}
      </div>

      {/* ── Bottom Dial Bar / Reticle Controls ── */}
      <div className="px-4 py-2 bg-[#0a0e12]/95 border-t border-[rgba(223,231,224,0.08)] flex flex-wrap items-center justify-between text-xs text-[#78837c]">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[11px] text-[#c9a24a]">
            {compareMode ? 'Dual Mirror Mode' : 'Single Telemetry Lens'}
          </span>
          <span className="hidden sm:inline text-[#78837c]">|</span>
          <span className="hidden sm:inline text-[11px]">
            Drag to pan image • Use zoom buttons to inspect stellar cores
          </span>
        </div>

        {/* Reticle Angle Rotation Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase text-[#aab4ad]">Reticle Angle:</span>
          <input
            type="range"
            min="0"
            max="360"
            value={reticleRotation}
            onChange={(e) => setReticleRotation(Number(e.target.value))}
            className="w-24 accent-[#c9a24a] cursor-pointer h-1 bg-[rgba(223,231,224,0.1)] rounded-lg"
            title="Rotate samurai reticle dial"
          />
          <span className="font-mono text-[10px] text-white min-w-[28px]">{reticleRotation}°</span>
        </div>
      </div>
    </div>
  );
};

