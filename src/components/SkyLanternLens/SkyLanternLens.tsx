import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  Compass,
  Sliders,
  Database,
  Layers,
  RotateCcw,
  Eye,
  Flame,
  Zap,
  Radio,
  Bookmark,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { WavelengthShifter } from './WavelengthShifter';
import { CelestialMirrorDisplay } from './CelestialMirrorDisplay';
import { TelemetryLoreBox } from './TelemetryLoreBox';
import { GamificationCatalogHook } from './GamificationCatalogHook';
import {
  SkyViewQueryParams,
  SkyViewQueryResponse,
  CelestialTargetPreset,
  CatalogObservation,
} from '../../types/skyview';
import {
  fetchSkyViewData,
  getSavedCatalog,
} from '../../lib/skyviewApi';
import {
  PRESET_CELESTIAL_TARGETS,
  SKYVIEW_SURVEYS,
} from '../../data/skyviewData';

interface SkyLanternLensProps {
  onAwardXp?: (amount: number, reason: string) => void;
  onTrackTarget?: (targetName: string) => void;
}

export const SkyLanternLens: React.FC<SkyLanternLensProps> = ({
  onAwardXp,
  onTrackTarget,
}) => {
  // Query state
  const [positionInput, setPositionInput] = useState<string>('M31');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('DSS');
  const [fovSize, setFovSize] = useState<number>(0.5);
  const [pixelResolution, setPixelResolution] = useState<number>(500);
  const [scaling, setScaling] = useState<'Log' | 'Linear' | 'HistEq'>('Log');
  const [activePresetId, setActivePresetId] = useState<string>('m31');

  // Async query response state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [queryData, setQueryData] = useState<SkyViewQueryResponse | null>(null);
  const [userPhotoOverride, setUserPhotoOverride] = useState<string | null>(null);

  // Catalog Drawer state
  const [showCatalogDrawer, setShowCatalogDrawer] = useState<boolean>(false);
  const [catalogList, setCatalogList] = useState<CatalogObservation[]>([]);

  // Execute query to NASA SkyView (or fallback)
  const executeQuery = useCallback(
    async (
      pos: string,
      surveyKey: string,
      size: number,
      pixels: number,
      scale: 'Log' | 'Linear' | 'HistEq'
    ) => {
      setIsLoading(true);
      const params: SkyViewQueryParams = {
        position: pos,
        survey: surveyKey,
        size: size,
        pixels: pixels,
        scaling: scale,
        returnFormat: 'JPG',
      };

      try {
        const response = await fetchSkyViewData(params);
        setQueryData(response);
      } catch (err) {
        console.error('Error querying NASA SkyView:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load on mount
  useEffect(() => {
    executeQuery('M31', 'DSS', 0.5, 500, 'Log');
    setCatalogList(getSavedCatalog());
  }, [executeQuery]);

  // Handle preset selection
  const handleSelectPreset = (preset: CelestialTargetPreset) => {
    setActivePresetId(preset.id);
    setPositionInput(preset.key);
    setUserPhotoOverride(null);
    if (onTrackTarget) onTrackTarget(preset.name);
    executeQuery(preset.key, selectedSurvey, fovSize, pixelResolution, scaling);
  };

  // Handle survey wavelength change
  const handleSelectSurvey = (surveyKey: string) => {
    setSelectedSurvey(surveyKey);
    executeQuery(positionInput, surveyKey, fovSize, pixelResolution, scaling);
  };

  // Form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionInput.trim()) return;
    executeQuery(positionInput, selectedSurvey, fovSize, pixelResolution, scaling);
  };

  // Active survey metadata
  const currentSurveyConfig =
    SKYVIEW_SURVEYS.find((s) => s.key === selectedSurvey) || SKYVIEW_SURVEYS[0];

  return (
    <div className="space-y-8">
      {/* ── Section Title Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border border-[rgba(201,162,74,0.3)] bg-gradient-to-r from-[#0a0e12]/95 via-[#121722]/90 to-[#0a0e12]/95 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e0231c] px-2 py-0.5 rounded border border-[#e0231c]/30 bg-[#e0231c]/10">
                BONUS CHALLENGE • 公式課題
              </span>
              <span className="text-[11px] font-mono text-[#c9a24a]">
                NASA GSFC Virtual Observatory
              </span>
            </div>

            <h2 className="font-celestial text-2xl sm:text-3xl font-bold text-white tracking-wider flex items-center gap-3">
              <span>The Sky Lantern Lens</span>
              <span className="font-japanese text-xl sm:text-2xl text-[#fce38a]">
                天灯の鏡
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-[#aab4ad] leading-relaxed">
              Peer through the virtual observatory mirrors of NASA Goddard Space Flight Center.
              Survey celestial deep-space coordinates across Optical, Infrared, X-Ray, and Radio
              spectrums to examine stellar cradles revered by samurai astronomers.
            </p>
          </div>

          {/* Quick Actions: Catalog Drawer Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCatalogList(getSavedCatalog());
                setShowCatalogDrawer(!showCatalogDrawer);
              }}
              className="px-4 py-2.5 rounded-xl border border-[rgba(201,162,74,0.4)] bg-[#05070a]/80 hover:bg-[#c9a24a]/20 text-[#fce38a] transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Bookmark className="w-4 h-4 text-[#c9a24a]" />
              <span>Stamped Catalog ({catalogList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1-CLICK PRESET TARGET SELECTION RIBBON ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#78837c] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c9a24a]" />
            <span>Instant Presets (6 聖星の標的):</span>
          </span>
          <span className="text-[11px] text-[#78837c]">
            Click any target for 0ms telemetry load
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PRESET_CELESTIAL_TARGETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-[#c9a24a] bg-[#c9a24a]/15 shadow-lg shadow-[rgba(201,162,74,0.15)] ring-1 ring-[#c9a24a]/50'
                    : 'border-[rgba(223,231,224,0.08)] bg-[#0a0e12]/80 hover:border-[#c9a24a]/40 hover:bg-[#05070a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-celestial text-xs font-bold text-white group-hover:text-[#fce38a]">
                      {preset.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e0231c]" />
                  </div>
                  <p className="font-japanese text-[10px] text-[#c9a24a] truncate">
                    {preset.kanji.split(' ')[0]}
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-[#78837c] truncate">
                  {preset.alias}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH & FILTER CONSOLE ── */}
      <div className="celestial-card rounded-2xl p-5 sm:p-6 border border-[rgba(201,162,74,0.3)] space-y-6">
        {/* Search Input Bar + Controls Row */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78837c]" />
              <input
                type="text"
                value={positionInput}
                onChange={(e) => setPositionInput(e.target.value)}
                placeholder="Target Name (e.g. M31, Orion, Sirius) or RA/Dec (10.68, 41.26)"
                className="w-full bg-[#05070a] border border-[rgba(223,231,224,0.15)] focus:border-[#c9a24a] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#78837c] focus:outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-[#e0231c] hover:bg-[#ff3830] text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[rgba(224,35,28,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Compass className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Void...' : 'Initiate Scan'}</span>
            </button>
          </div>

          {/* Quick Fine-Tuning Controls: FOV, Resolution, Scaling */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[rgba(223,231,224,0.06)] text-xs text-[#aab4ad]">
            {/* Field of View (FOV) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#78837c] uppercase">Field of View (FOV):</span>
                <span className="text-[#c9a24a] font-bold">{fovSize}°</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={fovSize}
                onChange={(e) => setFovSize(Number(e.target.value))}
                className="w-full accent-[#c9a24a] cursor-pointer h-1.5 bg-[#05070a] rounded-lg"
              />
            </div>

            {/* Pixel Grid Resolution */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#78837c] uppercase">Pixel Matrix:</span>
                <span className="text-white font-bold">{pixelResolution}px</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[300, 400, 500, 600, 800].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setPixelResolution(res)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                      pixelResolution === res
                        ? 'bg-[#c9a24a]/20 border-[#c9a24a] text-[#fce38a] font-bold'
                        : 'border-[rgba(223,231,224,0.08)] bg-[#05070a] text-[#78837c] hover:text-white'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Scaling */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#78837c] uppercase">Intensity Scaling:</span>
                <span className="text-[#fce38a] font-bold">{scaling}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['Log', 'Linear', 'HistEq'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScaling(sc)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                      scaling === sc
                        ? 'bg-[#e0231c]/20 border-[#e0231c] text-[#ff766b] font-bold'
                        : 'border-[rgba(223,231,224,0.08)] bg-[#05070a] text-[#78837c] hover:text-white'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* ── Wavelength Shifter Tab Selector ── */}
        <WavelengthShifter
          activeSurvey={selectedSurvey}
          onSelectSurvey={handleSelectSurvey}
          disabled={isLoading}
        />
      </div>

      {/* ── THE CELESTIAL MIRROR DISPLAY (RETICLE + COMPARISON + VIEWER) ── */}
      {queryData && (
        <CelestialMirrorDisplay
          imageUrl={queryData.media.image_url}
          userPhotoUrl={userPhotoOverride || queryData.media.user_photo}
          targetName={queryData.target.name}
          targetKanji={queryData.target.kanji}
          wavelength={queryData.survey.wavelength}
          surveyKey={queryData.survey.key}
          ra={queryData.target.ra}
          dec={queryData.target.dec}
          fov={queryData.telemetry.fov_degrees}
          isLoading={isLoading}
        />
      )}

      {/* ── TELEMETRY & OBSERVATION LORE BOX ── */}
      {queryData && <TelemetryLoreBox data={queryData} />}

      {/* ── GAMIFICATION & CATALOG STAMPING HOOK ── */}
      {queryData && (
        <GamificationCatalogHook
          data={queryData}
          onAwardXp={onAwardXp}
          onUserPhotoUpload={(photoUrl) => setUserPhotoOverride(photoUrl)}
        />
      )}

      {/* ── STAMPED OBSERVATION CATALOG DRAWER / MODAL ── */}
      {showCatalogDrawer && (
        <div className="celestial-card rounded-2xl p-6 border border-[rgba(201,162,74,0.4)] bg-[#0a0e12]/95 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(223,231,224,0.08)] pb-3">
            <div className="flex items-center space-x-2.5">
              <Bookmark className="w-5 h-5 text-[#c9a24a]" />
              <h3 className="font-celestial text-base font-bold text-white tracking-wider">
                My Stamped Celestial Catalog (個人観測目録)
              </h3>
            </div>
            <button
              onClick={() => setShowCatalogDrawer(false)}
              className="text-xs text-[#78837c] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          {catalogList.length === 0 ? (
            <p className="text-xs text-[#78837c] italic py-4 text-center">
              No telescope observations recorded yet. Click "Log Telemetry to Catalog" above to stamp
              verified NASA tiles!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogList.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-[#05070a] border border-[rgba(201,162,74,0.25)] rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-celestial text-sm font-bold text-white">{obs.targetName}</h4>
                      <p className="font-japanese text-[11px] text-[#c9a24a]">{obs.kanji}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                      NASA Verified
                    </span>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-[rgba(223,231,224,0.1)] h-28">
                    <img
                      src={obs.imageUrl}
                      alt={obs.targetName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-[10px] font-mono text-[#78837c] space-y-0.5">
                    <div>Survey: {obs.surveyKey} • Band: {obs.wavelength}</div>
                    <div>Coords: {obs.ra} / {obs.dec}</div>
                    <div className="text-[#aab4ad]">{obs.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

