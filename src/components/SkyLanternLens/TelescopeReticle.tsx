import React from 'react';
import { WavelengthBand } from '../../types/skyview';

interface TelescopeReticleProps {
  wavelength: WavelengthBand;
  showReticle: boolean;
  showGrid: boolean;
  showCoordinates: boolean;
  ra: string;
  dec: string;
  fov: string;
  rotation?: number; // degrees
}

export const TelescopeReticle: React.FC<TelescopeReticleProps> = ({
  wavelength,
  showReticle,
  showGrid,
  showCoordinates,
  ra,
  dec,
  fov,
  rotation = 0,
}) => {
  if (!showReticle && !showGrid && !showCoordinates) return null;

  // Determine reticle tint based on wavelength spectrum
  const getThemeColor = () => {
    switch (wavelength) {
      case 'Optical':
        return {
          stroke: 'rgba(201, 162, 74, 0.75)',
          glow: 'rgba(201, 162, 74, 0.4)',
          text: '#fce38a',
          accent: '#e0231c',
        };
      case 'Infrared':
        return {
          stroke: 'rgba(249, 115, 22, 0.75)',
          glow: 'rgba(249, 115, 22, 0.4)',
          text: '#fed7aa',
          accent: '#ea580c',
        };
      case 'X-Ray':
        return {
          stroke: 'rgba(6, 182, 212, 0.85)',
          glow: 'rgba(6, 182, 212, 0.5)',
          text: '#a5f3fc',
          accent: '#0284c7',
        };
      case 'Radio':
        return {
          stroke: 'rgba(168, 85, 247, 0.85)',
          glow: 'rgba(168, 85, 247, 0.5)',
          text: '#e9d5ff',
          accent: '#c084fc',
        };
      default:
        return {
          stroke: 'rgba(201, 162, 74, 0.75)',
          glow: 'rgba(201, 162, 74, 0.4)',
          text: '#fce38a',
          accent: '#e0231c',
        };
    }
  };

  const theme = getThemeColor();

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* ── Optional J2000 Coordinate Grid Lines ── */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="celestial-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke={theme.stroke}
                strokeWidth="0.5"
                strokeDasharray="2,4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#celestial-grid)" />
        </svg>
      )}

      {/* ── Main Circular Reticle with Japanese Cardinal Points ── */}
      {showReticle && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-w-[580px] max-h-[580px] p-6 drop-shadow-[0_0_12px_var(--glow)]"
            style={{ ['--glow' as string]: theme.glow }}
          >
            {/* Outer Concentric Ring */}
            <circle
              cx="300"
              cy="300"
              r="270"
              fill="none"
              stroke={theme.stroke}
              strokeWidth="1.2"
              strokeDasharray="4,8"
            />

            {/* Inner Ring with Field of View boundary */}
            <circle
              cx="300"
              cy="300"
              r="190"
              fill="none"
              stroke={theme.stroke}
              strokeWidth="0.8"
            />

            {/* Target Acquisition Center Ring */}
            <circle
              cx="300"
              cy="300"
              r="70"
              fill="none"
              stroke={theme.stroke}
              strokeWidth="1.4"
            />
            <circle
              cx="300"
              cy="300"
              r="18"
              fill="none"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            <circle cx="300" cy="300" r="2.5" fill={theme.text} />

            {/* Crosshair Hairlines with Central Gap */}
            <line x1="300" y1="20" x2="300" y2="210" stroke={theme.stroke} strokeWidth="1" />
            <line x1="300" y1="390" x2="300" y2="580" stroke={theme.stroke} strokeWidth="1" />
            <line x1="20" y1="300" x2="210" y2="300" stroke={theme.stroke} strokeWidth="1" />
            <line x1="390" y1="300" x2="580" y2="300" stroke={theme.stroke} strokeWidth="1" />

            {/* Precision Sub-divisions & Dial Notches */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 300 300)`}>
                <line x1="300" y1="28" x2="300" y2="38" stroke={theme.stroke} strokeWidth="1.5" />
                <line x1="300" y1="184" x2="300" y2="190" stroke={theme.stroke} strokeWidth="1" />
              </g>
            ))}

            {/* Japanese Cardinal Direction Markers */}
            {/* North (北 - N) */}
            <g transform="translate(300, 48)">
              <rect x="-18" y="-14" width="36" height="20" rx="3" fill="#05070a" fillOpacity="0.85" stroke={theme.stroke} strokeWidth="0.8" />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text}
                fontSize="11"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                letterSpacing="1"
              >
                N • 北
              </text>
            </g>

            {/* South (南 - S) */}
            <g transform="translate(300, 552)">
              <rect x="-18" y="-12" width="36" height="20" rx="3" fill="#05070a" fillOpacity="0.85" stroke={theme.stroke} strokeWidth="0.8" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text}
                fontSize="11"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                letterSpacing="1"
              >
                S • 南
              </text>
            </g>

            {/* East (東 - E) */}
            <g transform="translate(552, 300)">
              <rect x="-18" y="-12" width="36" height="20" rx="3" fill="#05070a" fillOpacity="0.85" stroke={theme.stroke} strokeWidth="0.8" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text}
                fontSize="11"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                letterSpacing="1"
              >
                E • 東
              </text>
            </g>

            {/* West (西 - W) */}
            <g transform="translate(48, 300)">
              <rect x="-18" y="-12" width="36" height="20" rx="3" fill="#05070a" fillOpacity="0.85" stroke={theme.stroke} strokeWidth="0.8" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text}
                fontSize="11"
                fontFamily="Cinzel, serif"
                fontWeight="bold"
                letterSpacing="1"
              >
                W • 西
              </text>
            </g>

            {/* Corner Torii Arch Accents */}
            <path
              d="M 120 120 L 140 120 M 120 120 L 120 140"
              stroke={theme.accent}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 480 120 L 460 120 M 480 120 L 480 140"
              stroke={theme.accent}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 120 480 L 140 480 M 120 480 L 120 460"
              stroke={theme.accent}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 480 480 L 460 480 M 480 480 L 480 460"
              stroke={theme.accent}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* ── Top-Left & Bottom-Right Telemetry HUD Stamps ── */}
      {showCoordinates && (
        <>
          <div className="absolute top-4 left-4 bg-[#05070a]/80 backdrop-blur-md px-3 py-2 rounded-lg border border-[rgba(201,162,74,0.3)] shadow-lg space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e0231c] animate-ping" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#c9a24a]">
                NASA SKYVIEW HUD • J2000
              </span>
            </div>
            <div className="font-mono text-xs text-[#dfe7e0]">
              <span className="text-[#78837c] mr-1.5">RA:</span>
              <span className="font-semibold text-white">{ra}</span>
            </div>
            <div className="font-mono text-xs text-[#dfe7e0]">
              <span className="text-[#78837c] mr-1.5">DEC:</span>
              <span className="font-semibold text-white">{dec}</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-[#05070a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[rgba(201,162,74,0.3)] shadow-lg text-right">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#78837c] block">
              ANGULAR FIELD
            </span>
            <span className="font-mono text-xs font-bold text-[#fce38a]">FOV: {fov}</span>
          </div>
        </>
      )}
    </div>
  );
};

