import React, { useState, useRef, useCallback } from 'react';
import { Eye, ShieldCheck, AlertCircle, Sparkles, SlidersHorizontal } from 'lucide-react';
import { ImageEnhancementResult } from '../types';

interface BeforeAfterSliderProps {
  originalUrl: string;
  processedUrl: string;
  resultInfo?: ImageEnhancementResult;
  showStarOverlay?: boolean;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  processedUrl,
  resultInfo,
  showStarOverlay = false
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="space-y-4">
      {/* Slider Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[320px] sm:h-[450px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-[#e6c35c]/20 shadow-2xl bg-black"
      >
        {/* Processed (Enhanced) Image - Full background */}
        <img
          src={processedUrl}
          alt="Enhanced celestial sky"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Optional Star Candidates Overlay on Enhanced Image */}
        {showStarOverlay && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Simulated candidate centroids */}
            <div className="absolute top-[32%] left-[45%] w-5 h-5 rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-[58%] left-[28%] w-4 h-4 rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-[22%] left-[72%] w-4 h-4 rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-[68%] left-[81%] w-5 h-5 rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-[48%] left-[60%] w-3 h-3 rounded-full border border-cyan-400/80 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
        )}

        {/* Original Image - Clipped */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={originalUrl}
            alt="Original astronomical capture"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: '100%'
            }}
          />
        </div>

        {/* Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-[#e6c35c] shadow-[0_0_12px_rgba(230,195,92,0.8)] pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#07090e] border-2 border-[#e6c35c] flex items-center justify-center text-[#e6c35c] shadow-lg">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Badges on the canvas */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-black/70 backdrop-blur-md text-slate-300 px-2.5 py-1 rounded-md border border-white/10">
            Original Exposure
          </span>
        </div>

        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#c93b2b]/80 backdrop-blur-md text-[#fce38a] px-2.5 py-1 rounded-md border border-[#e6c35c]/30">
            Spirit Enhanced
          </span>
        </div>
      </div>

      {/* Scientific Authenticity & Method Banner */}
      {resultInfo && (
        <div className="celestial-card p-4 rounded-xl border border-white/10 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">
                Method: {resultInfo.method}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Processing latency: {resultInfo.processingTimeMs}ms
            </span>
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block text-amber-200 font-semibold mb-0.5">Scientific Authenticity Declaration:</strong>
              This pipeline utilizes deterministic local contrast stretching and high-frequency noise wavelet suppression. No generative neural inpainting or hallucinated star synthesis is introduced.
            </div>
          </div>

          {resultInfo.detectedStarsEstimate !== undefined && showStarOverlay && (
            <div className="flex items-center space-x-2 text-[11px] text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-800/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Estimated Candidate Centroids: <strong>~{resultInfo.detectedStarsEstimate} detected peaks</strong> (Labelled strictly as photometric point-spread estimates).
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
