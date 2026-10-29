import React from 'react';
import { Scroll, Compass, Shield, Database, Sparkles, BookOpen, Layers } from 'lucide-react';
import { SkyViewQueryResponse } from '../../types/skyview';

interface TelemetryLoreBoxProps {
  data: SkyViewQueryResponse;
}

export const TelemetryLoreBox: React.FC<TelemetryLoreBoxProps> = ({ data }) => {
  const { target, survey, telemetry, japanese_lore, status, status_note } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Left Column: Real NASA Survey Telemetry Dashboard (7 cols) ── */}
      <div className="lg:col-span-7 celestial-card rounded-2xl p-6 border border-[rgba(201,162,74,0.3)] space-y-5">
        <div className="flex items-center justify-between border-b border-[rgba(223,231,224,0.08)] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#c9a24a]/20 border border-[#c9a24a]/40 text-[#fce38a]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-celestial text-sm font-bold text-white tracking-wider">
                NASA Deep-Space Telemetry
              </h3>
              <p className="text-[10px] font-mono text-[#78837c] uppercase tracking-widest">
                Scientific Cutout Parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                status === 'live'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-amber-950/60 border-[#c9a24a]/50 text-[#fce38a]'
              }`}
            >
              {status === 'live'
                ? `● LIVE NASA GSFC FEED${data.nasa_session_token ? ` (${data.nasa_session_token})` : ''}`
                : '● Verified NASA Archive'}
            </span>
          </div>
        </div>

        {/* Telemetry Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Coordinates */}
          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">
              Right Ascension
            </span>
            <p className="font-mono text-xs font-bold text-[#dfe7e0] truncate">{target.ra}</p>
          </div>

          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">Declination</span>
            <p className="font-mono text-xs font-bold text-[#dfe7e0] truncate">{target.dec}</p>
          </div>

          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">Resolution</span>
            <p className="font-mono text-xs font-bold text-[#c9a24a]">
              {telemetry.resolution_arcsec_pixel}
            </p>
          </div>

          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">
              Angular Field
            </span>
            <p className="font-mono text-xs font-bold text-white">{telemetry.fov_degrees}</p>
          </div>

          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">
              Pixel Dimensions
            </span>
            <p className="font-mono text-xs font-bold text-white">{telemetry.pixels}</p>
          </div>

          <div className="bg-[#05070a]/70 rounded-xl p-3 border border-[rgba(223,231,224,0.06)] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#78837c] block">
              Intensity Scaling
            </span>
            <p className="font-mono text-xs font-bold text-[#fce38a]">{telemetry.scaling}</p>
          </div>
        </div>

        {/* Scientific Instrument & Spectral Band */}
        <div className="space-y-2 text-xs bg-[#05070a]/70 rounded-xl p-3.5 border border-[rgba(223,231,224,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[#78837c] font-mono text-[11px]">TELESCOPE &amp; SENSOR:</span>
            <span className="text-white font-medium">{telemetry.telescope_sensor}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#78837c] font-mono text-[11px]">SPECTRAL PASSBAND:</span>
            <span className="text-[#c9a24a] font-medium">{telemetry.exposure_band}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#78837c] font-mono text-[11px]">ARCHIVE REPOSITORY:</span>
            <span className="text-[#aab4ad]">{telemetry.archive_provider}</span>
          </div>
        </div>

        {/* Pitch Resiliency Note */}
        <div className="text-[11px] text-[#78837c] bg-[#05070a]/40 rounded-lg p-2.5 border border-[rgba(223,231,224,0.04)] flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-[#c9a24a] shrink-0 mt-0.5" />
          <span>{status_note}</span>
        </div>
      </div>

      {/* ── Right Column: Feudal Japanese Stargazer Lore (5 cols) ── */}
      <div className="lg:col-span-5 celestial-card rounded-2xl p-6 border border-[rgba(201,162,74,0.3)] space-y-4 relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute -bottom-8 -right-8 opacity-5 pointer-events-none select-none font-japanese text-9xl text-[#c9a24a]">
          月
        </div>

        <div className="flex items-center space-x-2.5 border-b border-[rgba(223,231,224,0.08)] pb-3.5">
          <div className="p-2 rounded-xl bg-[#e0231c]/20 border border-[#e0231c]/40 text-[#ff766b]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-celestial text-sm font-bold text-white tracking-wider">
              Feudal Celestial Lore
            </h3>
            <p className="text-[10px] font-japanese text-[#c9a24a]">星々の物語 • 和の天文学</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-japanese text-base font-bold text-[#fce38a]">
              {japanese_lore.kanji}
            </span>
            <span className="text-[10px] font-mono text-[#78837c] uppercase">
              {japanese_lore.period}
            </span>
          </div>

          <p className="text-xs text-[#dfe7e0] leading-relaxed italic border-l-2 border-[#e0231c] pl-3 py-1 bg-[rgba(224,35,28,0.04)] rounded-r-lg">
            "{japanese_lore.lore}"
          </p>

          <div className="pt-2 text-[11px] text-[#aab4ad] space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c9a24a]" />
              <span className="font-semibold text-white">Samurai Stargazing Principle:</span>
            </div>
            <p className="text-[#aab4ad] leading-normal pl-5">
              Feudal warriors mapped star configurations not only to forecast night patrol
              visibility, but as a meditation on impermanence (無常, Mujō) and celestial honor
              beneath Tsukuyomi’s moonlit sanctuary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

