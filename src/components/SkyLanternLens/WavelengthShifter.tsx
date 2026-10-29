import React from 'react';
import { Eye, Flame, Zap, Radio as RadioIcon, Sparkles } from 'lucide-react';
import { WavelengthBand, WavelengthCategory, SurveyConfig } from '../../types/skyview';
import { SKYVIEW_SURVEYS } from '../../data/skyviewData';

interface WavelengthShifterProps {
  activeSurvey: string;
  onSelectSurvey: (surveyKey: string) => void;
  disabled?: boolean;
}

const WAVELENGTH_TABS: {
  id: WavelengthBand;
  label: string;
  jpLabel: string;
  category: WavelengthCategory;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderActive: string;
  bgActive: string;
  glow: string;
}[] = [
  {
    id: 'Optical',
    label: 'Optical Spectrum',
    jpLabel: '侍の眼 • 可視光',
    category: 'Optical (Samurai Eyes)',
    icon: Eye,
    color: '#c9a24a',
    borderActive: 'border-[#c9a24a]',
    bgActive: 'bg-[#c9a24a]/20 text-[#fce38a]',
    glow: 'rgba(201,162,74,0.3)',
  },
  {
    id: 'Infrared',
    label: 'Thermal Veils',
    jpLabel: '熱の帷 • 赤外線',
    category: 'Infrared (Thermal Veils)',
    icon: Flame,
    color: '#f97316',
    borderActive: 'border-[#f97316]',
    bgActive: 'bg-[#f97316]/20 text-[#fed7aa]',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    id: 'X-Ray',
    label: 'Cosmic Fury',
    jpLabel: '宇宙の怒り • X線',
    category: 'X-Ray (Cosmic Fury)',
    icon: Zap,
    color: '#06b6d4',
    borderActive: 'border-[#06b6d4]',
    bgActive: 'bg-[#06b6d4]/20 text-[#a5f3fc]',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    id: 'Radio',
    label: 'Whispers of Void',
    jpLabel: '虚空の囁き • 電波',
    category: 'Radio (Whispers of the Void)',
    icon: RadioIcon,
    color: '#a855f7',
    borderActive: 'border-[#a855f7]',
    bgActive: 'bg-[#a855f7]/20 text-[#e9d5ff]',
    glow: 'rgba(168,85,247,0.3)',
  },
];

export const WavelengthShifter: React.FC<WavelengthShifterProps> = ({
  activeSurvey,
  onSelectSurvey,
  disabled = false,
}) => {
  // Find currently active survey config
  const currentSurveyConfig =
    SKYVIEW_SURVEYS.find((s) => s.key === activeSurvey) || SKYVIEW_SURVEYS[0];

  const activeBand = currentSurveyConfig.wavelength;

  // Group surveys by wavelength band
  const bandSurveys = SKYVIEW_SURVEYS.filter((s) => s.wavelength === activeBand);

  const handleBandClick = (band: WavelengthBand) => {
    const firstInBand = SKYVIEW_SURVEYS.find((s) => s.wavelength === band);
    if (firstInBand) {
      onSelectSurvey(firstInBand.key);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Main Wavelength Band Selector Tabs ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c9a24a]" />
          <span className="font-celestial text-xs font-bold tracking-widest uppercase text-[#dfe7e0]">
            Wavelength Shifter (波長変調器)
          </span>
        </div>
        <span className="text-[11px] font-japanese text-[#78837c]">
          Multi-Spectral NASA Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {WAVELENGTH_TABS.map((tab) => {
          const isSelected = activeBand === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleBandClick(tab.id)}
              disabled={disabled}
              className={`relative px-3.5 py-3 rounded-xl border text-left transition-all duration-300 cursor-pointer overflow-hidden group ${
                isSelected
                  ? `${tab.borderActive} ${tab.bgActive} shadow-lg shadow-[${tab.glow}]`
                  : 'border-[rgba(223,231,224,0.1)] bg-[#05070a]/60 text-[#aab4ad] hover:border-[rgba(201,162,74,0.4)] hover:text-white'
              }`}
            >
              {/* Active Indicator Top Line */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: tab.color }}
                />
              )}

              <div className="flex items-center justify-between mb-1.5">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isSelected ? 'text-white' : 'text-[#78837c]'
                  }`}
                />
                <span className="text-[9px] font-mono tracking-wider uppercase opacity-75">
                  {tab.id}
                </span>
              </div>

              <div className="font-celestial text-xs font-semibold leading-tight block truncate text-white">
                {tab.label}
              </div>
              <div className="font-japanese text-[10px] text-[#c9a24a] truncate mt-0.5 opacity-90">
                {tab.jpLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Sub-Survey Archive Toggle Pills within Active Band ── */}
      <div className="pt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#78837c] mr-1">
          Archive Filter:
        </span>
        {bandSurveys.map((survey: SurveyConfig) => {
          const isCurrent = survey.key === activeSurvey;
          return (
            <button
              key={survey.key}
              onClick={() => onSelectSurvey(survey.key)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border cursor-pointer flex items-center gap-1.5 ${
                isCurrent
                  ? `${survey.colorScheme.badge} ${survey.colorScheme.border} font-bold shadow-md`
                  : 'bg-[#0a0e12]/80 border-[rgba(223,231,224,0.08)] text-[#aab4ad] hover:border-[rgba(201,162,74,0.3)] hover:text-white'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: isCurrent ? survey.colorScheme.accent : '#78837c',
                }}
              />
              <span>{survey.key}</span>
              <span className="text-[9px] opacity-60">({survey.spectralBand.split(' ')[0]})</span>
            </button>
          );
        })}
      </div>

      {/* Active Survey Sensor Brief */}
      <div className="text-[11px] text-[#aab4ad] bg-[#0a0e12]/80 border border-[rgba(223,231,224,0.06)] rounded-lg px-3.5 py-2 flex items-start gap-2.5">
        <span className="text-[#c9a24a] font-bold font-mono">SENSOR:</span>
        <span className="text-white font-medium">{currentSurveyConfig.instrument}</span>
        <span className="text-[#78837c]">—</span>
        <span className="text-[#dfe7e0] flex-1">{currentSurveyConfig.description}</span>
      </div>
    </div>
  );
};

