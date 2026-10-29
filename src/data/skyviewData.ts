import { SurveyConfig, CelestialTargetPreset, SkyViewQueryResponse, CatalogObservation } from '../types/skyview';

export const SKYVIEW_SURVEYS: SurveyConfig[] = [
  // ── Optical (Samurai Eyes) ──
  {
    key: 'DSS',
    name: 'DSS (Digitized Sky Survey)',
    wavelength: 'Optical',
    category: 'Optical (Samurai Eyes)',
    instrument: 'Palomar 48-inch Schmidt & UK Schmidt Telescopes',
    spectralBand: 'Visible Optical (400-700 nm)',
    description: 'Digitized photographic emulsion plates covering the celestial sphere in visible light.',
    colorScheme: {
      accent: '#c9a24a',
      border: 'rgba(201,162,74,0.4)',
      badge: 'bg-[#c9a24a]/15 text-[#fce38a] border-[#c9a24a]/30',
      glow: 'rgba(201,162,74,0.25)',
    },
  },
  {
    key: 'DSS2 Red',
    name: 'DSS2 Red (Second Generation Red)',
    wavelength: 'Optical',
    category: 'Optical (Samurai Eyes)',
    instrument: 'Palomar & UK Schmidt Telescopes (Red Emulsion)',
    spectralBand: 'Red Optical (600-750 nm)',
    description: 'High-contrast red plate emulsion highlighting ionized hydrogen nebulae and stellar halos.',
    colorScheme: {
      accent: '#e0231c',
      border: 'rgba(224,35,28,0.4)',
      badge: 'bg-[#e0231c]/15 text-[#ff766b] border-[#e0231c]/30',
      glow: 'rgba(224,35,28,0.25)',
    },
  },
  {
    key: 'SDSSg',
    name: 'SDSSg (Sloan Digital Sky Survey Green)',
    wavelength: 'Optical',
    category: 'Optical (Samurai Eyes)',
    instrument: 'Sloan Foundation 2.5m Optical Telescope (Apache Point)',
    spectralBand: 'Green Band (400-550 nm)',
    description: 'Precision CCD photometric survey capturing fine stellar structures and spiral galaxy arms.',
    colorScheme: {
      accent: '#34d399',
      border: 'rgba(52,211,153,0.4)',
      badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
      glow: 'rgba(52,211,153,0.25)',
    },
  },

  // ── Infrared (Thermal Veils) ──
  {
    key: '2MASS-K',
    name: '2MASS-K (Two Micron All-Sky Survey)',
    wavelength: 'Infrared',
    category: 'Infrared (Thermal Veils)',
    instrument: '2MASS Twin 1.3m Automated Telescopes (Mt. Hopkins & CTIO)',
    spectralBand: 'Near-Infrared K-band (2.17 µm)',
    description: 'Pierces through impenetrable cosmic dust clouds to expose deep hidden galactic cores.',
    colorScheme: {
      accent: '#f97316',
      border: 'rgba(249,115,22,0.4)',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
      glow: 'rgba(249,115,22,0.25)',
    },
  },
  {
    key: 'WISE 3.4',
    name: 'WISE 3.4 (Wide-field Infrared Survey Explorer)',
    wavelength: 'Infrared',
    category: 'Infrared (Thermal Veils)',
    instrument: 'NASA WISE Spacecraft Cryogenic 40cm Telescope',
    spectralBand: 'Mid-Infrared W1 (3.4 µm)',
    description: 'Orbital mid-infrared survey mapping circumstellar debris disks, brown dwarfs, and warm dust.',
    colorScheme: {
      accent: '#fb923c',
      border: 'rgba(251,146,60,0.4)',
      badge: 'bg-orange-950/40 text-orange-300 border-orange-500/30',
      glow: 'rgba(251,146,60,0.25)',
    },
  },
  {
    key: 'IRAS 100 micron',
    name: 'IRAS 100 micron (Infrared Astronomical Satellite)',
    wavelength: 'Infrared',
    category: 'Infrared (Thermal Veils)',
    instrument: 'IRAS Spacecraft 57cm Cryogenic Telescope',
    spectralBand: 'Far-Infrared (100 µm)',
    description: 'Traces coldest interstellar cirrus dust and large-scale star-forming molecular clouds.',
    colorScheme: {
      accent: '#ea580c',
      border: 'rgba(234,88,12,0.4)',
      badge: 'bg-orange-950/40 text-orange-200 border-orange-600/30',
      glow: 'rgba(234,88,12,0.25)',
    },
  },

  // ── X-Ray (Cosmic Fury) ──
  {
    key: 'RASS 3',
    name: 'RASS 3 (ROSAT All-Sky Survey Broadband)',
    wavelength: 'X-Ray',
    category: 'X-Ray (Cosmic Fury)',
    instrument: 'ROSAT X-Ray Telescope (PSPC Detector)',
    spectralBand: 'Soft X-Ray (0.1 - 2.4 keV)',
    description: 'High-energy spatial map of supernova blast waves, active galactic nuclei, and neutron star pulsars.',
    colorScheme: {
      accent: '#06b6d4',
      border: 'rgba(6,182,212,0.4)',
      badge: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30',
      glow: 'rgba(6,182,212,0.25)',
    },
  },
  {
    key: 'HEAO 1 A-2',
    name: 'HEAO 1 A-2 (High Energy Astronomy Observatory)',
    wavelength: 'X-Ray',
    category: 'X-Ray (Cosmic Fury)',
    instrument: 'NASA HEAO-1 Cosmic X-Ray Experiment',
    spectralBand: 'Hard X-Ray (2 - 60 keV)',
    description: 'NASA orbital observatory mapping the most violent relativistic shock fronts in the cosmos.',
    colorScheme: {
      accent: '#38bdf8',
      border: 'rgba(56,189,248,0.4)',
      badge: 'bg-sky-950/40 text-sky-300 border-sky-500/30',
      glow: 'rgba(56,189,248,0.25)',
    },
  },

  // ── Radio (Whispers of the Void) ──
  {
    key: '0408MHz',
    name: 'Haslam 408 MHz All-Sky Radio Survey',
    wavelength: 'Radio',
    category: 'Radio (Whispers of the Void)',
    instrument: 'Jodrell Bank MkIA, Effelsberg 100m, Parkes 64m Telescopes',
    spectralBand: 'Radio Continuum (408 MHz / 73.5 cm)',
    description: 'All-sky radio continuum tracing non-thermal synchrotron radiation from cosmic rays spiraling in magnetic fields.',
    colorScheme: {
      accent: '#a855f7',
      border: 'rgba(168,85,247,0.4)',
      badge: 'bg-purple-950/40 text-purple-300 border-purple-500/30',
      glow: 'rgba(168,85,247,0.25)',
    },
  },
];

export const PRESET_CELESTIAL_TARGETS: CelestialTargetPreset[] = [
  {
    id: 'm31',
    key: 'M31',
    name: 'Messier 31',
    alias: 'Andromeda Galaxy',
    kanji: '仙女座銀河 (天光の銀雲)',
    ra: '00h 42m 44.3s',
    dec: '+41° 16′ 09″',
    ra_deg: 10.6847,
    dec_deg: 41.2687,
    distance: '2.537 Million Light Years',
    constellation: 'Andromeda',
    lore: 'Recorded in Edo astronomy scrolls as "Tenkū no Gin-un" (天空の銀雲, The Celestial Silver Cloud). Stargazing samurai atop mountain watchtowers revered its misty spiral as an auspicious sign of eternal harmony and unwavering martial vigilance.',
    user_photo: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_m31.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_m31.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_m31.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_m31.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_m31.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_m31.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_m31.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_m31.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_m31.fits',
      },
    },
  },
  {
    id: 'm42',
    key: 'M42',
    name: 'Messier 42',
    alias: 'Orion Nebula',
    kanji: 'オリオン大星雲 (鞘星の神火)',
    ra: '05h 35m 17.3s',
    dec: '-05° 23′ 28″',
    ra_deg: 83.822,
    dec_deg: -5.391,
    distance: '1,344 Light Years',
    constellation: 'Orion',
    lore: 'Nestled directly below "Mitsu-boshi" (三つ星, The Three Warrior Stars of Orion’s Belt), patron deities of bushido swordsmanship. Feudal swordsmiths celebrated this glowing stellar cradle as "Saya-boshi" (鞘星, The Celestial Scabbard Star) whose heavenly fire tempered legendary katana.',
    user_photo: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_m42.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_m42.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_m42.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_m42.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_m42.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_m42.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_m42.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_m42.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_m42.fits',
      },
    },
  },
  {
    id: 'm1',
    key: 'M1',
    name: 'Crab Nebula',
    alias: 'M1 Supernova Remnant',
    kanji: 'かに星雲 (明月記の客星)',
    ra: '05h 34m 31.97s',
    dec: '+22° 00′ 52.1″',
    ra_deg: 83.6332,
    dec_deg: 22.0145,
    distance: '6,500 Light Years',
    constellation: 'Taurus',
    lore: 'Documented in Kyoto in 1054 AD by illustrious Heian court poet and astronomer Fujiwara no Teika in his diary "Meigetsuki" (明月記). Observed as a dazzling "Guest Star" (客星, Kyaku-sei) brighter than Jupiter that shone visibly in broad daylight for 23 days—one of history’s most precious astronomical records.',
    user_photo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_m1.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_m1.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_m1.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_m1.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_m1.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_m1.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_m1.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_m1.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_m1.fits',
      },
    },
  },
  {
    id: 'm45',
    key: 'M45',
    name: 'Pleiades (Subaru)',
    alias: 'Seven Sisters Cluster',
    kanji: '昴星団 (和の結び)',
    ra: '03h 47m 24.0s',
    dec: '+24° 07′ 00″',
    ra_deg: 56.75,
    dec_deg: 24.1167,
    distance: '444 Light Years',
    constellation: 'Taurus',
    lore: 'Celebrated in the Kojiki (712 AD) and Sei Shōnagon’s "Pillow Book" ("Among the stars, Subaru is supreme"). The word Subaru (統ばる) signifies "coming together in harmony and unity"—samurai warlords drew inspiration from its cluster of bright jewel-stars before battlefield alliances.',
    user_photo: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_m45.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_m45.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_m45.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_m45.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_m45.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_m45.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_m45.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_m45.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_m45.fits',
      },
    },
  },
  {
    id: 'sgra',
    key: 'SgrA',
    name: 'Sagittarius A*',
    alias: 'Milky Way Supermassive Black Hole',
    kanji: '銀河中心 (天の川の深淵)',
    ra: '17h 45m 40.04s',
    dec: '-29° 00′ 28.1″',
    ra_deg: 266.4168,
    dec_deg: -29.0078,
    distance: '26,670 Light Years',
    constellation: 'Sagittarius',
    lore: 'The mystical abyss anchoring "Ama-no-Gawa" (天の川, The Heavenly River of Silver). In ancient folklore, this is the profound galactic sanctuary where Tsukuyomi-no-Mikoto preserves cosmic equilibrium across eternity, invisible to the naked eye until modern radio and infrared telescopes.',
    user_photo: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_sgra.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_sgra.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_sgra.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_sgra.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_sgra.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_sgra.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_sgra.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_sgra.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_sgra.fits',
      },
    },
  },
  {
    id: 'casa',
    key: 'CasA',
    name: 'Cassiopeia A',
    alias: 'Supernova Remnant Cas A',
    kanji: 'カシオペヤ座A (天冠の烈火)',
    ra: '23h 23m 27.9s',
    dec: '+58° 48′ 42″',
    ra_deg: 350.8663,
    dec_deg: 58.8117,
    distance: '11,000 Light Years',
    constellation: 'Cassiopeia',
    lore: 'Part of "Kita-kanmuri" (The Northern Crown). In feudal samurai philosophy, its cataclysmic explosion epitomizes "Mujō" (無常, Impermanence)—reminding warriors that all celestial forms undergo cycles of dissolution and glorious rebirth.',
    user_photo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    surveys: {
      DSS: {
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_casa.fits',
      },
      'DSS2 Red': {
        image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss2r_casa.fits',
      },
      SDSSg: {
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_sdssg_casa.fits',
      },
      '2MASS-K': {
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_2massk_casa.fits',
      },
      'WISE 3.4': {
        image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_wise_casa.fits',
      },
      'IRAS 100 micron': {
        image: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_iras_casa.fits',
      },
      'RASS 3': {
        image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_rass_casa.fits',
      },
      'HEAO 1 A-2': {
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_heao_casa.fits',
      },
      '0408MHz': {
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        fits: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_408_casa.fits',
      },
    },
  },
];

export const INITIAL_USER_CATALOG: CatalogObservation[] = [
  {
    id: 'obs-001',
    targetName: 'Messier 42',
    targetAlias: 'Orion Nebula',
    kanji: 'オリオン大星雲 (鞘星の神火)',
    surveyKey: 'DSS',
    wavelength: 'Optical',
    timestamp: '2026-10-28 22:14 JST',
    ra: '05h 35m 17.3s',
    dec: '-05° 23′ 28″',
    resolution: '3.6″ / pixel',
    fov: '0.5°',
    scaling: 'Log',
    verifiedNasa: true,
    honorEarned: 30,
    imageUrl: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop',
    fitsUrl: 'https://skyview.gsfc.nasa.gov/tempspace/fits/skv_dss_m42.fits',
    userPhotoUrl: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200&auto=format&fit=crop',
    notes: 'Stellar emission front recorded during crisp mountain watch.',
  },
];

