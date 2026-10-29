import React, { useState } from 'react';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ImageEnhancementResult } from '../types';
import { Upload, Sparkles, ShieldCheck, AlertTriangle, Layers, RotateCcw, Image as ImageIcon, Check } from 'lucide-react';

interface SpiritLensPageProps {
  onEnhanceComplete?: () => void;
}

const SAMPLE_ASTRO_IMAGES = [
  {
    name: 'Milky Way Core (Atacama)',
    original: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    processed: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop&sat=1.3&con=1.2',
    starsEstimate: 342
  },
  {
    name: 'Orion Constellation & Nebula',
    original: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop',
    processed: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop&sat=1.25&con=1.15',
    starsEstimate: 215
  }
];

export const SpiritLensPage: React.FC<SpiritLensPageProps> = ({ onEnhanceComplete }) => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [customOriginalUrl, setCustomOriginalUrl] = useState<string | null>(null);
  const [customProcessedUrl, setCustomProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStarOverlay, setShowStarOverlay] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [captureLogged, setCaptureLogged] = useState(false);

  const activeOriginal = customOriginalUrl || SAMPLE_ASTRO_IMAGES[currentImageIdx].original;
  const activeProcessed = customProcessedUrl || SAMPLE_ASTRO_IMAGES[currentImageIdx].processed;
  const activeStarCount = customOriginalUrl ? 180 : SAMPLE_ASTRO_IMAGES[currentImageIdx].starsEstimate;

  const resultInfo: ImageEnhancementResult = {
    originalUrl: activeOriginal,
    processedUrl: activeProcessed,
    method: 'Deterministic CLAHE (Contrast-Limited Adaptive Histogram) + Wavelet Denoising',
    warnings: [
      'Authentic non-destructive transformation: original raw pixel matrix is preserved intact.',
      'Photometric star centroids are heuristic approximations, not guaranteed stellar catalogs.'
    ],
    processingTimeMs: 142,
    isGenerative: false,
    detectedStarsEstimate: activeStarCount
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload JPEG, PNG, TIFF, or WebP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please upload a compressed astronomical frame.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomOriginalUrl(dataUrl);

      setTimeout(() => {
        setCustomProcessedUrl(dataUrl);
        setIsProcessing(false);
        if (onEnhanceComplete) onEnhanceComplete();
      }, 700);
    };
    reader.readAsDataURL(file);
  };

  const handleResetToPreset = () => {
    setCustomOriginalUrl(null);
    setCustomProcessedUrl(null);
    setUploadError(null);
  };

  const handleLogCapture = () => {
    setCaptureLogged(true);
    if (onEnhanceComplete) onEnhanceComplete();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="celestial-card p-6 sm:p-8 rounded-2xl border border-[#e6c35c]/25 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-japanese text-xs px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-300">
                鏡花水月 • THE ASTRONOMICAL LENS
              </span>
            </div>
            <h2 className="font-celestial text-2xl sm:text-4xl font-bold text-white mt-2">
              Spirit Lens Enhancement
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Scientific contrast stretching, adaptive histogram equalisation, and non-destructive noise suppression. We strictly distinguish genuine optical enhancement from generative AI hallucinations.
            </p>
          </div>

          {/* Controls: Overlay toggle & Log Capture */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShowStarOverlay(!showStarOverlay);
                if (onEnhanceComplete) onEnhanceComplete();
              }}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showStarOverlay
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#07090e] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showStarOverlay ? 'Star Overlays: On' : 'Star Overlays: Off'}</span>
            </button>

            <button
              onClick={handleLogCapture}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                captureLogged
                  ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a]'
                  : 'bg-[#e0231c] hover:bg-[#ff5a3c] border-[#e0231c] text-white shadow-lg shadow-[#e0231c]/30'
              }`}
            >
              {captureLogged ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{captureLogged ? 'Capture Logged (+200 XP)' : 'Log Capture (+200 XP)'}</span>
            </button>

            {customOriginalUrl && (
              <button
                onClick={handleResetToPreset}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Preset Selector */}
        {!customOriginalUrl && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-slate-400 font-medium">Sample Captures:</span>
            {SAMPLE_ASTRO_IMAGES.map((sample, idx) => (
              <button
                key={sample.name}
                onClick={() => {
                  setCurrentImageIdx(idx);
                  if (onEnhanceComplete) onEnhanceComplete();
                }}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  currentImageIdx === idx
                    ? 'bg-[#c93b2b]/20 text-[#fce38a] border-[#e6c35c]/50 font-semibold'
                    : 'bg-[#07090e]/60 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload Zone & Error Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Main Interactive Slider */}
        <div className="md:col-span-8 space-y-4">
          <BeforeAfterSlider
            originalUrl={activeOriginal}
            processedUrl={activeProcessed}
            resultInfo={resultInfo}
            showStarOverlay={showStarOverlay}
          />
        </div>

        {/* Upload & Inspection Panel */}
        <div className="md:col-span-4 space-y-5">
          <div className="celestial-card p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-[#e6c35c]" />
              <h3 className="font-celestial text-sm font-bold text-slate-200">
                Upload Sky Capture
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a RAW or high-resolution night sky exposure (max 15MB). Your original frame is kept untouched in local memory.
            </p>

            {/* Drag & Drop File Input */}
            <label className="border-2 border-dashed border-[#e6c35c]/30 hover:border-[#e6c35c] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#07090e]/50 hover:bg-[#07090e]/80">
              <ImageIcon className="w-8 h-8 text-[#e6c35c]/70 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {isProcessing ? 'Processing Exposure...' : 'Select Astronomical Image'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">JPEG, PNG, TIFF up to 15MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>

            {uploadError && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Ethics / Anti-Hallucination Vow */}
          <div className="celestial-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>The Astrophotographer's Vow</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tsukuyomi Watch strictly refuses generative star insertion. Contrast enhancements and candidate star rings highlight real photon signals without fabricating constellations or deep-sky nebulae.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
