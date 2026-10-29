/**
 * Tsukuyomi Watch: The Samurai’s Celestial Guide
 * Fallback Transient Events and Spectral/Time-Domain Data
 */

import { TransientEvent, LightCurvePoint, SpectralPoint, SpectralLine, TransientDetailResponse } from '../types/transient';

export const FALLBACK_TRANSIENT_EVENTS: TransientEvent[] = [
  {
    id: 'sn1054-crab',
    name: 'SN 1054 (Crab Nebula Guest Star)',
    japaneseName: '客星・天関星 (明月記の記録)',
    designation: 'SN 1054 / M1 Progenitor',
    type: 'Type II-P Supernova (Core Collapse)',
    category: 'Supernova',
    alertLevel: 'CRITICAL',
    constellation: 'Taurus (金牛宮)',
    coordinates: { ra: '05h 34m 31.97s', dec: "+22° 00′ 52.1″" },
    distance: '6,500 light-years (2.0 kpc)',
    discoveryDate: '1054-07-04 (Heian Era, Tengi 2)',
    historicalObserver: 'Fujiwara no Teika (Meigetsuki) & Yang Wei-te',
    peakMagnitude: -6.0,
    currentMagnitude: 8.4,
    hostGalaxy: 'Milky Way (Intragalactic)',
    redshift: 0.0001,
    expansionVelocityKmS: 1500.0,
    declineRateDm15: 0.42,
    description:
      'Historic supernova that created the Crab Nebula and Crab Pulsar. Recorded in Japanese court chronicles as shining bright as Venus, visible in broad daylight for 23 days.',
    samuraiLore:
      'In Tengi 2 (1054 AD), poet and court noble Fujiwara no Teika recorded in the Meigetsuki that a mysterious Guest Star (客星) arose east of Tianguan. Court Onmyōji divined it as an auspicious harbinger of celestial power, now known to be humanity\'s benchmark core-collapse supernova.',
    keyFeatures: [
      'Prominent broad Hα (6563 Å) & Hβ (4861 Å) emission lines',
      'Extended plateau phase lasting ~80 days sustained by hydrogen recombination',
      'Left behind a rapidly spinning 33ms neutron star (Crab Pulsar)',
      'Expanding pulsar wind nebula at ~1,500 km/s',
    ],
  },
  {
    id: 'sn2023ixf',
    name: 'SN 2023ixf (Pinwheel Galaxy Supernova)',
    japaneseName: '風車銀河の大超新星',
    designation: 'SN 2023ixf / ZTF23aabclxh',
    type: 'Type II Supernova (Core Collapse)',
    category: 'Supernova',
    alertLevel: 'HIGH',
    constellation: 'Ursa Major (北斗七星)',
    coordinates: { ra: '14h 03m 38.58s', dec: "+54° 18′ 42.1″" },
    distance: '20.9 Million light-years (6.4 Mpc)',
    discoveryDate: '2023-05-19',
    historicalObserver: 'Koichi Itagaki (Yamagata, Japan)',
    peakMagnitude: 10.8,
    currentMagnitude: 15.6,
    hostGalaxy: 'Messier 101 (Pinwheel Galaxy)',
    redshift: 0.0008,
    expansionVelocityKmS: 9800.0,
    declineRateDm15: 0.85,
    description:
      'The closest and brightest core-collapse supernova in a decade, discovered by legendary Japanese amateur astronomer Koichi Itagaki. Prompt flash spectroscopy revealed massive circumstellar material interaction.',
    samuraiLore:
      'Discovered by Japanese astronomer Koichi Itagaki in Yamagata prefecture. In feudal star lore, the Pinwheel in the Great Bear was viewed as the spinning sun-wheel of warrior general Hachiman, heralding transformative stellar rebirth.',
    keyFeatures: [
      'Early flash-ionization emission of N III, C III, and He II',
      'Dense circumstellar shell ejected by red supergiant progenitor months before collapse',
      'P-Cygni profiles with maximum ejecta velocity approaching 10,000 km/s',
      'Strong Balmer emission series throughout decline',
    ],
  },
  {
    id: 'sn2011fe',
    name: 'SN 2011fe (Standard Candle Benchmark)',
    japaneseName: '宇宙の標準光源 (1a型超新星)',
    designation: 'SN 2011fe / PTF11kly',
    type: 'Type Ia Supernova (Thermonuclear)',
    category: 'Supernova',
    alertLevel: 'HIGH',
    constellation: 'Ursa Major (北斗七星)',
    coordinates: { ra: '14h 03m 05.81s', dec: "+54° 16′ 25.2″" },
    distance: '21.0 Million light-years (6.4 Mpc)',
    discoveryDate: '2011-08-24',
    historicalObserver: 'Palomar Transient Factory (PTF)',
    peakMagnitude: 9.9,
    currentMagnitude: 18.2,
    hostGalaxy: 'Messier 101 (Pinwheel Galaxy)',
    redshift: 0.0008,
    expansionVelocityKmS: 11500.0,
    declineRateDm15: 1.10,
    description:
      'The golden standard of Type Ia thermonuclear supernovae. Caused by the complete carbon-oxygen detonation of an accreting white dwarf surpassing the Chandrasekhar mass limit (~1.44 M☉).',
    samuraiLore:
      'Just as a samurai\'s katana is measured with absolute precision, Type Ia supernovae possess standard absolute luminosities, acting as celestial tape-measures that revealed the accelerating expansion of our universe.',
    keyFeatures: [
      'Complete absence of Hydrogen (H) and Helium (He) lines',
      'Deep, prominent Si II (6355 Å) absorption trough blueshifted to ~6150 Å (v ≈ 11,500 km/s)',
      'Strong S II "W-feature" at 5400-5600 Å',
      'Classical Phillips relation light curve with Δm15 = 1.10 mag',
    ],
  },
  {
    id: 'at2017gfo',
    name: 'AT2017gfo (GW170817 Neutron Star Kilonova)',
    japaneseName: '重力波中性子星合体 (キロノバ)',
    designation: 'AT2017gfo / SSS17a',
    type: 'Kilonova (BNS Merger r-Process)',
    category: 'Kilonova',
    alertLevel: 'CRITICAL',
    constellation: 'Hydra (海蛇座)',
    coordinates: { ra: '13h 09m 48.08s', dec: "-23° 22′ 53.3″" },
    distance: '130 Million light-years (40 Mpc)',
    discoveryDate: '2017-08-17',
    historicalObserver: 'LIGO/Virgo & Swope Telescope',
    peakMagnitude: 17.2,
    currentMagnitude: 23.5,
    hostGalaxy: 'NGC 4993',
    redshift: 0.0097,
    expansionVelocityKmS: 60000.0,
    declineRateDm15: 3.80,
    description:
      'First ever multi-messenger astronomical event combining gravitational waves (GW170817) and electromagnetic radiation. Forged dozens of Earth masses in gold, platinum, and heavy lanthanides via the rapid neutron-capture process (r-process).',
    samuraiLore:
      'Feudal metallurgists believed true gold was forged in celestial fires. Modern astrophysics confirmed this: the golden hilt ornaments (menuki) of samurai katanas were physically birthed in violent kilonova mergers like AT2017gfo.',
    keyFeatures: [
      'Ultra-rapid blue optical decline over 48 hours transitioning to infrared glow',
      'High opacity from synthesized lanthanide and actinide elements',
      'Relativistic ejecta velocity of ~0.2c (60,000 km/s)',
      'Multi-messenger coincident detection with gravitational ripple',
    ],
  },
  {
    id: 'grb221009a',
    name: 'GRB 221009A (The BOAT - Brightest of All Time)',
    japaneseName: '宇宙史上最強の爆発 (BOAT)',
    designation: 'GRB 221009A / Swift J1913.1+1946',
    type: 'Long Gamma-Ray Burst (Collapsar)',
    category: 'Gamma-Ray Burst',
    alertLevel: 'CRITICAL',
    constellation: 'Sagitta (矢座)',
    coordinates: { ra: '19h 13m 27.9s', dec: "+19° 46′ 27″" },
    distance: '2.4 Billion light-years (z = 0.151)',
    discoveryDate: '2022-10-09',
    historicalObserver: 'Fermi LAT, Swift, LHAASO',
    peakMagnitude: 14.1,
    currentMagnitude: 22.0,
    hostGalaxy: 'Moderate star-forming host at z = 0.151',
    redshift: 0.151,
    expansionVelocityKmS: 298000.0,
    declineRateDm15: 2.65,
    description:
      'Once-in-10,000-years cosmic event that blinded space gamma-ray detectors and perturbed Earth\'s upper ionosphere. The birth of a stellar-mass black hole with an ultra-relativistic jet pointing straight toward Earth.',
    samuraiLore:
      'Known as the Heavenly Arrow of Amaterasu piercing across two billion light-years. The sudden burst disturbed earthly radio signals much like ancient thunder spirits in Japanese mythology.',
    keyFeatures: [
      'Synchrotron power-law continuum spectrum across optical and infrared',
      'Relativistic Lorentz factor Γ > 400',
      'Prompt emission detected up to unprecedented 18 TeV energies by LHAASO',
      'Underlying supernova component (SN 2022xiw) emerged ~2 weeks later',
    ],
  },
  {
    id: 'asassn-14li',
    name: 'ASASSN-14li (Tidal Disruption Event)',
    japaneseName: '超大質量ブラックホール潮汐破壊',
    designation: 'ASASSN-14li / PGC 043234',
    type: 'Tidal Disruption Event (TDE)',
    category: 'Tidal Disruption',
    alertLevel: 'MONITORING',
    constellation: 'Coma Berenices (髪座)',
    coordinates: { ra: '12h 48m 15.23s', dec: "+17° 46′ 26.4″" },
    distance: '290 Million light-years (90 Mpc)',
    discoveryDate: '2014-11-22',
    historicalObserver: 'All-Sky Automated Survey for Supernovae (ASAS-SN)',
    peakMagnitude: 15.8,
    currentMagnitude: 19.5,
    hostGalaxy: 'PGC 043234',
    redshift: 0.0206,
    expansionVelocityKmS: 14200.0,
    declineRateDm15: 0.35,
    description:
      'A 3-million solar mass supermassive black hole shredding and swallowing a passing star. Produces luminous accretion radiation decaying gracefully with the classical t^(-5/3) mass fallback rate.',
    samuraiLore:
      'Feudal masters spoke of the "Void Maw" (虚無の口), where matter is drawn into eternal silence. TDEs exhibit the raw tidal forces of black holes rending stars into ribbons of blazing plasma.',
    keyFeatures: [
      'Constant thermal UV/optical blackbody temperature (~35,000 K) over months',
      'Characteristic t^(-5/3) photometric flux decay power law',
      'Broad He II (4686 Å) and Hα emission lines with velocities > 10,000 km/s',
      'Soft thermal X-ray emission from newly formed inner accretion disk',
    ],
  },
];

export function generateClientLightCurve(event: TransientEvent): LightCurvePoint[] {
  const peak = event.peakMagnitude;
  const dm15 = event.declineRateDm15;
  const days = [-15, -12, -10, -8, -6, -4, -2, -1, 0, 1, 2, 4, 7, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 110];

  return days.map((d) => {
    let magOffset = 0;
    if (d < 0) {
      const frac = (15 + d) / 15.0;
      magOffset = (1.0 - Math.pow(frac, 1.8)) * 4.5;
    } else if (d === 0) {
      magOffset = 0;
    } else {
      if (event.category === 'Supernova' && event.type.includes('II-P')) {
        magOffset = d <= 60 ? 0.2 + (d / 60) * 0.4 : 0.6 + ((d - 60) / 20) * 2.2;
      } else if (event.category === 'Kilonova') {
        magOffset = Math.log10(1 + d * 0.8) * 3.8;
      } else if (event.category === 'Gamma-Ray Burst') {
        magOffset = Math.log10(1 + d * 1.5) * 3.2;
      } else if (event.category === 'Tidal Disruption') {
        magOffset = Math.log10(1 + d / 20) * 1.8;
      } else {
        magOffset = d <= 15 ? (d / 15) * dm15 : dm15 + ((d - 15) / 50) * 1.5;
      }
    }

    const r_val = Number((peak + magOffset).toFixed(2));
    const g_val = Number((r_val + (-0.15 + (d + 15) * 0.008)).toFixed(2));
    const i_val = Number((r_val - (-0.10 + (d + 15) * 0.005)).toFixed(2));

    return {
      day: d,
      mjd: Number((59000.0 + d).toFixed(1)),
      g_mag: g_val,
      r_mag: r_val,
      i_mag: i_val,
      flux_normalized: Number(Math.exp(-magOffset / 1.086).toFixed(4)),
      phase:
        d < 0
          ? 'Pre-maximum Rise'
          : d === 0
          ? 'Peak Maximum'
          : d <= 60 && event.type.includes('II-P')
          ? 'Plateau'
          : 'Decay',
    };
  });
}

export function generateClientSpectroscopy(event: TransientEvent): {
  spectral_points: SpectralPoint[];
  identified_lines: SpectralLine[];
} {
  const vel = event.expansionVelocityKmS;
  const z = event.redshift;

  let lines: SpectralLine[] = [];

  if (event.type.includes('Ia')) {
    lines = [
      {
        name: 'Si II (6355 Å)',
        element: 'Silicon (Si II)',
        restWavelength: 6355.0,
        observedWavelength: Number((6355.0 * (1 + z) * (1 - vel / 300000.0)).toFixed(1)),
        lineType: 'absorption',
        velocityKmS: -vel,
        description: 'Hallmark absorption trough of Type Ia thermonuclear explosions (v ≈ 11,500 km/s).',
      },
      {
        name: 'S II "W-feature" (5468 Å)',
        element: 'Sulfur (S II)',
        restWavelength: 5468.0,
        observedWavelength: Number((5468.0 * (1 + z) * (1 - (vel * 0.85) / 300000.0)).toFixed(1)),
        lineType: 'absorption',
        velocityKmS: Math.round(-vel * 0.85),
        description: 'Characteristic double-notched feature from explosive carbon burning.',
      },
      {
        name: 'Fe II (5169 Å)',
        element: 'Iron/Cobalt',
        restWavelength: 5169.0,
        observedWavelength: Number((5169.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: 0,
        description: 'Radioactive nickel-to-iron nucleosynthesis ash.',
      },
    ];
  } else if (event.type.includes('II')) {
    lines = [
      {
        name: 'Hα (6563 Å) Balmer Line',
        element: 'Hydrogen (Hα)',
        restWavelength: 6563.0,
        observedWavelength: Number((6563.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: vel,
        description: 'Primary hydrogen emission from massive stellar envelope shock breakout.',
      },
      {
        name: 'Hβ (4861 Å) Balmer Line',
        element: 'Hydrogen (Hβ)',
        restWavelength: 4861.0,
        observedWavelength: Number((4861.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: vel,
        description: 'Secondary Balmer transition confirming thick hydrogen envelope.',
      },
      {
        name: '[O I] (6300 Å) Doublet',
        element: 'Oxygen ([O I])',
        restWavelength: 6300.0,
        observedWavelength: Number((6300.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: 0,
        description: 'Forbidden oxygen emission tracing core nucleosynthetic ash.',
      },
    ];
  } else if (event.category === 'Kilonova') {
    lines = [
      {
        name: 'Sr II (8200 Å absorption)',
        element: 'Strontium (Sr II)',
        restWavelength: 8200.0,
        observedWavelength: Number((8200.0 * (1 + z) * (1 - vel / 300000.0)).toFixed(1)),
        lineType: 'absorption',
        velocityKmS: -vel,
        description: 'Definitive signature of r-process rapid neutron capture nucleosynthesis.',
      },
    ];
  } else {
    lines = [
      {
        name: 'He II (4686 Å)',
        element: 'Helium II',
        restWavelength: 4686.0,
        observedWavelength: Number((4686.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: vel,
        description: 'Extreme UV photoionization from accretion disk outflow.',
      },
      {
        name: 'Hα (6563 Å)',
        element: 'Hydrogen',
        restWavelength: 6563.0,
        observedWavelength: Number((6563.0 * (1 + z)).toFixed(1)),
        lineType: 'emission',
        velocityKmS: vel,
        description: 'Broad photoionized outflow tracing shredded stellar debris.',
      },
    ];
  }

  const points: SpectralPoint[] = [];
  for (let w = 3600; w <= 8600; w += 40) {
    const temp = event.type.includes('II') ? 8500 : event.type.includes('Ia') ? 12000 : 6500;
    let base = (1e13 / Math.pow(w, 4)) * (1.0 / (Math.exp(14388.0 / (w * (temp / 1000.0))) - 0.99));
    base = Math.max(0.2, Math.min(1.8, base * 0.8));

    let flux = base;
    for (const l of lines) {
      const sigma = 45.0 + vel / 220.0;
      const diff = w - l.observedWavelength;
      const gauss = Math.exp(-0.5 * Math.pow(diff / sigma, 2));
      if (l.lineType === 'emission') {
        flux += gauss * 1.45;
      } else {
        flux -= gauss * 0.75;
      }
    }

    const noise = Math.sin(w * 0.08) * Math.cos(w * 0.03) * 0.04;
    points.push({
      wavelength: w,
      flux: Number(Math.max(0.08, flux + noise).toFixed(3)),
      continuum: Number(base.toFixed(3)),
    });
  }

  return { spectral_points: points, identified_lines: lines };
}

export function buildFallbackDetail(eventId: string): TransientDetailResponse {
  const event = FALLBACK_TRANSIENT_EVENTS.find((e) => e.id === eventId) || FALLBACK_TRANSIENT_EVENTS[0];
  const lightCurve = generateClientLightCurve(event);
  const { spectral_points, identified_lines } = generateClientSpectroscopy(event);

  return {
    status: 'success',
    event,
    timeDomain: {
      lightCurve,
      peakMagnitude: event.peakMagnitude,
      declineRateDm15: event.declineRateDm15,
      riseDays: 15,
      bands: ['g (477 nm)', 'r (623 nm)', 'i (762 nm)'],
    },
    spectroscopy: {
      event_id: event.id,
      spectral_points,
      identified_lines,
      redshift: event.redshift,
      expansion_velocity_km_s: event.expansionVelocityKmS,
    },
    classification: {
      primaryClass: event.type,
      confidenceScore: 98.4,
      hostRedshift: event.redshift,
      expansionVelocity: `${event.expansionVelocityKmS.toLocaleString()} km/s`,
      anomalyScore: event.alertLevel === 'CRITICAL' ? 0.94 : 0.78,
      samuraiVerdict: 'Verified Guest Star (客星認定) — Recorded into Tsukuyomi Chronicle',
    },
  };
}

