import React, { useState } from 'react';
import {
  Trophy,
  BookmarkPlus,
  Download,
  Scroll,
  CheckCircle2,
  Sparkles,
  Camera,
  Share2,
  X,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { SkyViewQueryResponse, CatalogObservation } from '../../types/skyview';
import { saveCatalogObservation } from '../../lib/skyviewApi';

interface GamificationCatalogHookProps {
  data: SkyViewQueryResponse;
  onAwardXp?: (amount: number, reason: string) => void;
  onToggleCompare?: () => void;
  onUserPhotoUpload?: (url: string) => void;
}

export const GamificationCatalogHook: React.FC<GamificationCatalogHookProps> = ({
  data,
  onAwardXp,
  onToggleCompare,
  onUserPhotoUpload,
}) => {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [showScrollModal, setShowScrollModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { target, survey, telemetry, japanese_lore, media } = data;

  const handleLogToCatalog = () => {
    const obs: CatalogObservation = {
      id: `obs-${Date.now()}`,
      targetName: target.name,
      targetAlias: target.alias,
      kanji: target.kanji,
      surveyKey: survey.key,
      wavelength: survey.wavelength,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      ra: target.ra,
      dec: target.dec,
      resolution: telemetry.resolution_arcsec_pixel,
      fov: telemetry.fov_degrees,
      scaling: telemetry.scaling,
      verifiedNasa: true,
      honorEarned: 30,
      imageUrl: media.image_url,
      fitsUrl: media.fits_url,
      userPhotoUrl: media.user_photo,
      notes: `Verified via NASA SkyView observatory in ${survey.category} spectrum.`,
    };

    saveCatalogObservation(obs);
    setIsLogged(true);

    if (onAwardXp) {
      onAwardXp(30, `NASA Observation Logged: ${target.name} (${survey.key})`);
    }

    setToastMessage(`Stamped into Celestial Catalog! +30 Honor Points awarded.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onUserPhotoUpload) {
        onUserPhotoUpload(result);
        if (onToggleCompare) onToggleCompare();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="celestial-card rounded-2xl p-6 border border-[rgba(201,162,74,0.35)] bg-gradient-to-r from-[#0a0e12]/95 via-[#0f1420]/90 to-[#0a0e12]/95 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Callout / Reward Status */}
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a24a]/30 to-[#e0231c]/20 border border-[#c9a24a]/50 flex items-center justify-center text-[#fce38a] shadow-lg shadow-[rgba(201,162,74,0.2)]">
            <Trophy className="w-6 h-6 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e0231c] flex items-center justify-center text-[9px] font-bold text-white">
              ★
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-celestial text-sm font-bold text-white tracking-wider">
                Celestial Catalog Stamping
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#c9a24a]/20 border border-[#c9a24a]/40 text-[#fce38a]">
                +30 Honor Points
              </span>
            </div>
            <p className="text-xs text-[#aab4ad] mt-0.5">
              Verify this deep-space telescope tile to record authentic NASA scientific telemetry to your
              Samurai scroll.
            </p>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Compare with My Photo / Upload */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(223,231,224,0.15)] bg-[#05070a]/80 text-[#dfe7e0] hover:border-[#c9a24a] hover:text-white transition-all cursor-pointer text-xs font-semibold shadow-md">
            <Camera className="w-4 h-4 text-[#c9a24a]" />
            <span>Compare with My Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Log NASA Telemetry to Catalog */}
          <button
            onClick={handleLogToCatalog}
            disabled={isLogged}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
              isLogged
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : 'bg-gradient-to-r from-[#e0231c] to-[#c9a24a] hover:from-[#ff3830] hover:to-[#ffd700] text-white border border-[#c9a24a]/60 shadow-[rgba(224,35,28,0.3)] hover:scale-102'
            }`}
          >
            {isLogged ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Surveyed via NASA Observatory</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>Log Telemetry to Catalog (+30 XP)</span>
              </>
            )}
          </button>

          {/* Export Celestial Scroll */}
          <button
            onClick={() => setShowScrollModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(201,162,74,0.4)] bg-[#05070a]/90 text-[#fce38a] hover:bg-[#c9a24a]/20 transition-all cursor-pointer text-xs font-semibold shadow-md"
            title="Generate Japanese Observation Certificate"
          >
            <Scroll className="w-4 h-4" />
            <span className="hidden sm:inline">Export Scroll</span>
          </button>

          {/* Download Raw FITS */}
          {media.fits_url && (
            <a
              href={media.fits_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[rgba(223,231,224,0.1)] bg-[#05070a]/60 text-[#aab4ad] hover:text-white hover:border-[#c9a24a] transition-all text-xs font-mono"
              title="Download Raw FITS Data Tile from NASA"
            >
              <Download className="w-3.5 h-3.5" />
              <span>FITS</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#05070a]/95 border border-[#c9a24a] rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-[#c9a24a]" />
          <span className="font-celestial text-sm font-bold text-white">{toastMessage}</span>
        </div>
      )}

      {/* ── Celestial Scroll Export Certificate Modal ── */}
      {showScrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-xl w-full bg-[#0d1117] border-2 border-[#c9a24a] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-[#dfe7e0]">
            {/* Close Button */}
            <button
              onClick={() => setShowScrollModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#78837c] hover:text-white bg-[#05070a]/60 border border-[rgba(223,231,224,0.1)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Header with Japanese Title */}
            <div className="text-center space-y-2 border-b border-[rgba(201,162,74,0.3)] pb-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="font-japanese text-xs text-[#e0231c] tracking-[0.3em] uppercase font-bold">
                  月読命 • 天灯の鏡 観測録
                </span>
              </div>
              <h2 className="font-celestial text-2xl font-bold text-white tracking-wider">
                Celestial Observation Scroll
              </h2>
              <p className="text-xs text-[#aab4ad] font-mono">
                Official NASA SkyView Virtual Observatory Certificate
              </p>
            </div>

            {/* Observation Details & Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="rounded-xl overflow-hidden border border-[#c9a24a]/30 shadow-lg max-h-48">
                <img
                  src={media.image_url}
                  alt={target.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#78837c] uppercase font-mono text-[10px] block">
                    Target Name:
                  </span>
                  <p className="font-celestial text-base font-bold text-white">{target.name}</p>
                  <p className="font-japanese text-xs text-[#c9a24a]">{target.kanji}</p>
                </div>

                <div>
                  <span className="text-[#78837c] uppercase font-mono text-[10px] block">
                    Coordinates (J2000):
                  </span>
                  <p className="font-mono text-xs text-white">
                    {target.ra} / {target.dec}
                  </p>
                </div>

                <div>
                  <span className="text-[#78837c] uppercase font-mono text-[10px] block">
                    NASA Survey Instrument:
                  </span>
                  <p className="text-xs text-[#dfe7e0] font-medium">{survey.name}</p>
                  <p className="text-[11px] text-[#c9a24a]">{survey.category}</p>
                </div>
              </div>
            </div>

            {/* Feudal Lore Quote */}
            <div className="p-3.5 bg-[#05070a]/70 rounded-xl border border-[rgba(223,231,224,0.08)] italic text-xs text-[#aab4ad] border-l-2 border-[#e0231c]">
              "{japanese_lore.lore}"
            </div>

            {/* Hanko Vermilion Stamp Seal */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(201,162,74,0.2)]">
              <div className="text-[11px] font-mono text-[#78837c]">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span className="block text-[10px] text-[#c9a24a]">
                  VERIFIED ASTRONOMICAL INTEGRITY
                </span>
              </div>

              {/* Japanese Red Vermilion Hanko Seal */}
              <div className="w-16 h-16 rounded-xl border-2 border-[#e0231c] bg-[#e0231c]/10 flex flex-col items-center justify-center text-[#ff3830] font-japanese font-bold shadow-lg shadow-[rgba(224,35,28,0.2)] select-none">
                <span className="text-[10px] leading-tight">月読</span>
                <span className="text-sm leading-tight">神鏡</span>
                <span className="text-[9px] leading-tight">之印</span>
              </div>
            </div>

            {/* Print / Download Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#c9a24a]/20 border border-[#c9a24a] text-[#fce38a] hover:bg-[#c9a24a]/30 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Scroll</span>
              </button>
              <button
                onClick={() => setShowScrollModal(false)}
                className="px-5 py-2 rounded-xl bg-[#e0231c] hover:bg-[#ff3830] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

