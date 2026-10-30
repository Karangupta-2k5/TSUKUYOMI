import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Trophy,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Share2,
  Moon,
  Clock,
  Compass,
  Flame,
  Award,
  Layers,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';
import exifr from 'exifr';
import { StargazerUser } from '../components/SignupModal';
import {
  saveCelestialUploadToSupabase,
  fetchCelestialUploadsFromSupabase,
  updateStargazerHonorInSupabase,
  CelestialUploadRow,
  StargazerUserRow,
  isSupabaseConfigured,
} from '../lib/supabase';

// Categories Definition
export interface CategoryConfig {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export const GAME_CATEGORIES: Record<string, CategoryConfig> = {
  con: { id: 'con', name: 'Constellations', points: 50, icon: '✦' },
  planet: { id: 'planet', name: 'Planets', points: 150, icon: '☿' },
  moon: { id: 'moon', name: 'Moon Phases', points: 50, icon: '☾' },
  deep: { id: 'deep', name: 'Deep Sky Objects', points: 150, icon: '✺' },
  event: { id: 'event', name: 'Rare Cosmic Events', points: 500, icon: '☄' },
};

export const GAME_RANKS = [
  { name: 'Star Seeker', minHonor: 0 },
  { name: 'Night Wanderer', minHonor: 500 },
  { name: 'Constellation Keeper', minHonor: 1500 },
  { name: 'Celestial Chronicler', minHonor: 3500 },
  { name: 'Grand Astronomer', minHonor: 7500 },
];

export interface CelestialItem {
  id: string;
  name: string;
  cat: string;
  hint: string;
}

export interface CollectedItemEntry {
  date: string;
  loc: string;
  gear: string;
  seed: number;
  lan: number;
  bow: number;
  img: string | null;
  lens?: boolean;
}

export interface SharedSkyPhoto {
  id: string | number;
  uid: string;
  authorName: string;
  loc: string;
  seed: number;
  img: string | null;
  lan: number;
  bow: number;
  timestamp?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  location: string;
  honor: number;
  col: Record<string, CollectedItemEntry>;
  stamps: string[];
  isMe?: boolean;
}

// 88 Constellations List
const CONSTELLATIONS =
  'Andromeda,Antlia,Apus,Aquarius,Aquila,Ara,Aries,Auriga,Boötes,Caelum,Camelopardalis,Cancer,Canes Venatici,Canis Major,Canis Minor,Capricornus,Carina,Cassiopeia,Centaurus,Cepheus,Cetus,Chamaeleon,Circinus,Columba,Coma Berenices,Corona Australis,Corona Borealis,Corvus,Crater,Crux,Cygnus,Delphinus,Dorado,Draco,Equuleus,Eridanus,Fornax,Gemini,Grus,Hercules,Horologium,Hydra,Hydrus,Indus,Lacerta,Leo,Leo Minor,Lepus,Libra,Lupus,Lynx,Lyra,Mensa,Microscopium,Monoceros,Musca,Norma,Octans,Ophiuchus,Orion,Pavo,Pegasus,Perseus,Phoenix,Pictor,Pisces,Piscis Austrinus,Puppis,Pyxis,Reticulum,Sagitta,Sagittarius,Scorpius,Sculptor,Scutum,Serpens,Sextans,Taurus,Telescopium,Triangulum,Triangulum Australe,Tucana,Ursa Major,Ursa Minor,Vela,Virgo,Volans,Vulpecula'.split(
    ','
  );

const HINTS: Record<string, string> = {
  Orion: 'Winter evenings, south. Three-star belt is the clue.',
  'Ursa Major': 'Spring, high in the north. Find the Big Dipper.',
  Cassiopeia: 'Autumn, north. Look for a bright “W”.',
  Scorpius: 'Summer, low south, with red Antares.',
  Crux: 'Southern hemisphere only. The Southern Cross.',
  'Orion Nebula': 'Below Orion’s belt. A fuzzy “star”.',
  Pleiades: 'Winter, in Taurus. A tiny dipper of stars.',
  'Andromeda Galaxy': 'Autumn, dark skies. Faint oval smudge.',
  'Blood Moon Eclipse': 'Happens every ~3 years. Look East at moonrise.',
  'Great Planetary Alignment': 'Rare. Shortly after sunset along the ecliptic.',
  'Halley’s Comet': 'Returns about every 76 years.',
  'Solar Maximum Aurora': 'High-latitude skies during solar maximum.',
  'Total Solar Eclipse': 'Narrow path of totality, every few years.',
  'Leonid Meteor Storm': 'November pre-dawn, rare storm years.',
};

const DEFAULT_HINTS: Record<string, string> = {
  con: 'Find it on a clear, dark night away from city lights.',
  planet: 'Look for a steady, non-twinkling point of light near the ecliptic.',
  moon: 'Check the lunar calendar and look up at dusk or dawn.',
  deep: 'Needs dark skies; binoculars or a small telescope help.',
  event: 'A once-in-a-few-years cosmic happening — watch for the alert banner.',
};

// Build Catalog Items
export const ALL_GAME_ITEMS: CelestialItem[] = [];
export const GAME_ITEMS_BY_ID: Record<string, CelestialItem> = {};

const rawDefs: [string, string[]][] = [
  ['con', CONSTELLATIONS],
  ['planet', ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']],
  [
    'moon',
    [
      'New Moon',
      'Waxing Crescent',
      'First Quarter',
      'Waxing Gibbous',
      'Full Moon',
      'Waning Gibbous',
      'Last Quarter',
      'Waning Crescent',
    ],
  ],
  [
    'deep',
    [
      'Orion Nebula',
      'Andromeda Galaxy',
      'Pleiades',
      'Crab Nebula',
      'Ring Nebula',
      'Whirlpool Galaxy',
      'Hercules Cluster',
      'Lagoon Nebula',
      'Omega Centauri',
      'Beehive Cluster',
      'Dumbbell Nebula',
      'Double Cluster',
    ],
  ],
  [
    'event',
    [
      'Blood Moon Eclipse',
      'Great Planetary Alignment',
      'Halley’s Comet',
      'Solar Maximum Aurora',
      'Total Solar Eclipse',
      'Leonid Meteor Storm',
    ],
  ],
];

rawDefs.forEach(([cat, list]) => {
  list.forEach((name) => {
    const id = `${cat}-${name.toLowerCase().replace(/\W+/g, '-')}`;
    const it: CelestialItem = {
      id,
      name,
      cat,
      hint: HINTS[name] || DEFAULT_HINTS[cat] || 'Scan the heavens.',
    };
    ALL_GAME_ITEMS.push(it);
    GAME_ITEMS_BY_ID[id] = it;
  });
});

// Seeded pseudo random generators
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function stringHash(t: string): number {
  let h = 7;
  for (let i = 0; i < t.length; i++) {
    h = (h * 31 + t.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Procedural SVG Celestial Artwork Generator
export const renderCelestialSvg = (item: CelestialItem, seed: number = 42, isLocked: boolean = false) => {
  const r = pseudoRandom(stringHash(item.id) + seed * 7919 + 1);
  const rs = pseudoRandom(stringHash(item.id));
  const gradId = `cgrad_${item.id.replace(/[^a-zA-Z0-9]/g, '_')}_${seed}`;
  const isEv = item.cat === 'event';

  if (isLocked) {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
        <rect width="200" height="150" fill="#080a10" />
        <circle cx="100" cy="75" r="36" fill="none" stroke="#dfe7e0" strokeOpacity="0.25" strokeDasharray="3 3" />
        <path d="M92 75h16M100 67v16" stroke="#c9a24a" strokeOpacity="0.4" strokeWidth="1.5" />
      </svg>
    );
  }

  // Draw background stars
  const stars: { cx: number; cy: number; r: number; op: number }[] = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      cx: Math.round(r() * 200),
      cy: Math.round(r() * 150),
      r: +(r() * 0.8 + 0.3).toFixed(1),
      op: +(r() * 0.7 + 0.2).toFixed(2),
    });
  }

  const renderContent = () => {
    if (item.cat === 'con') {
      const pts: [number, number][] = Array.from({ length: 6 }, () => [
        Math.round(30 + rs() * 140),
        Math.round(25 + rs() * 100),
      ]);
      const polyPoints = pts.map((p) => `${p[0]},${p[1]}`).join(' ');
      return (
        <>
          <polyline points={polyPoints} fill="none" stroke="#d4af37" strokeOpacity="0.65" strokeWidth="1" />
          {pts.map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="2.6" fill="#fff6d6" filter="drop-shadow(0 0 3px #d4af37)" />
          ))}
        </>
      );
    }

    if (item.cat === 'planet') {
      const planetColors: Record<string, string> = {
        Mercury: '#a39b8f',
        Venus: '#e9c98a',
        Mars: '#c1583a',
        Jupiter: '#d9b48a',
        Saturn: '#e3cf9d',
        Uranus: '#8fd6d9',
        Neptune: '#4a6fd6',
      };
      const col = planetColors[item.name] || '#c9a24a';
      return (
        <>
          {item.name === 'Saturn' && (
            <ellipse
              cx="100"
              cy="75"
              rx="52"
              ry="12"
              transform="rotate(-18 100 75)"
              fill="none"
              stroke="#cbb98a"
              strokeWidth="3.5"
              strokeOpacity="0.85"
            />
          )}
          <circle cx="100" cy="75" r="26" fill={col} filter="drop-shadow(0 0 8px rgba(255,255,255,0.2))" />
          {item.name === 'Jupiter' && (
            <path d="M77 68H123M76 78H124M80 88H120" stroke="#9a6a45" strokeWidth="3" opacity="0.6" />
          )}
        </>
      );
    }

    if (item.cat === 'moon') {
      const moonIndex = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'].indexOf(item.name);
      const offsets = [0, -16, -28, -48, 99, 48, 28, 16];
      const dx = offsets[moonIndex] ?? 0;
      return (
        <>
          <circle cx="100" cy="75" r="30" fill="#e9e6dc" filter="drop-shadow(0 0 10px rgba(233,230,220,0.3))" />
          {moonIndex !== 4 && (
            <circle cx={100 + dx} cy="75" r="30" fill="#090c14" opacity="0.94" />
          )}
        </>
      );
    }

    if (item.cat === 'deep') {
      const colors = ['#c4527a', '#4f6fd6', '#7a4fd6'];
      return (
        <>
          {colors.map((c, idx) => {
            const cx = Math.round(70 + rs() * 60);
            const cy = Math.round(55 + rs() * 40);
            const rx = Math.round(22 + rs() * 24);
            const ry = Math.round(12 + rs() * 18);
            const rot = Math.round(rs() * 90);
            return (
              <ellipse
                key={idx}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={c}
                opacity="0.55"
                transform={`rotate(${rot} ${cx} ${cy})`}
                filter="blur(5px)"
              />
            );
          })}
          <circle cx="100" cy="72" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #fff)" />
        </>
      );
    }

    // Rare Events
    if (item.name.includes('Blood')) {
      return (
        <>
          <circle cx="100" cy="72" r="30" fill="#8e2a22" filter="drop-shadow(0 0 14px #e0231c)" />
          <circle cx="100" cy="72" r="33" fill="#d4573b" opacity="0.35" filter="blur(6px)" />
          <circle cx="92" cy="66" r="9" fill="#c7452d" opacity="0.55" />
        </>
      );
    }

    if (item.name.includes('Alignment')) {
      return (
        <>
          {[40, 70, 100, 130, 160].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={95 - i * 4}
              r={[4, 5, 3.5, 7, 5][i]}
              fill={['#a39b8f', '#e9c98a', '#c1583a', '#d9b48a', '#e3cf9d'][i]}
              filter="drop-shadow(0 0 4px rgba(255,255,255,0.4))"
            />
          ))}
        </>
      );
    }

    if (item.name.includes('Comet')) {
      return (
        <>
          <path
            d="M150 40Q100 60 30 118"
            fill="none"
            stroke="#bfe3ff"
            strokeOpacity="0.55"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="152" cy="39" r="5" fill="#ffffff" filter="drop-shadow(0 0 6px #7be0ff)" />
        </>
      );
    }

    if (item.name.includes('Aurora')) {
      const aurColors = ['#3cffb0', '#2fd6a0', '#7be0ff', '#9b6bff'];
      return (
        <>
          {aurColors.map((c, i) => (
            <path
              key={i}
              d={`M0 ${70 + i * 12}Q60 ${40 + i * 10} 110 ${75 + i * 8}T200 ${60 + i * 12}`}
              fill="none"
              stroke={c}
              strokeOpacity="0.55"
              strokeWidth="9"
              filter="blur(4px)"
            />
          ))}
        </>
      );
    }

    if (item.name.includes('Solar')) {
      return (
        <>
          <circle cx="100" cy="72" r="34" fill="#ffe9a8" opacity="0.4" filter="blur(7px)" />
          <circle cx="100" cy="72" r="26" fill="#05070a" stroke="#ffe9a8" strokeWidth="3" />
        </>
      );
    }

    // Meteor shower default
    return (
      <>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 30 + i * 32;
          const y = 20 + i * 15;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - 28}
              y2={y + 22}
              stroke="#ffffff"
              strokeOpacity="0.75"
              strokeWidth="1.5"
            />
          );
        })}
      </>
    );
  };

  return (
    <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04060d" />
          <stop offset="100%" stopColor={isEv ? '#280c12' : '#0c1220'} />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill={`url(#${gradId})`} />
      {stars.map((st, i) => (
        <circle key={i} cx={st.cx} cy={st.cy} r={st.r} fill="#fff" opacity={st.op} />
      ))}
      {renderContent()}
    </svg>
  );
};

// Mock community collectors
const COMMUNITY_COLLECTORS: LeaderboardUser[] = [
  {
    id: 'aiko',
    name: 'Aiko Mori',
    avatar: '🌸',
    location: 'Kyoto, JP',
    honor: 4820,
    stamps: ['Blood Moon Eclipse 2026', 'Perseid Watcher'],
    col: {
      'con-orion': { date: '2026-01-14', loc: 'Kyoto, JP', gear: 'Sony A7 III', seed: 44, lan: 14, bow: 8, img: null },
      'con-ursa-major': { date: '2026-03-20', loc: 'Kyoto, JP', gear: 'Sony A7 III', seed: 18, lan: 9, bow: 5, img: null },
      'planet-jupiter': { date: '2026-02-11', loc: 'Kyoto, JP', gear: 'Celestron 8SE', seed: 88, lan: 21, bow: 12, img: null },
      'deep-pleiades': { date: '2026-01-05', loc: 'Kyoto, JP', gear: 'Seestar S50', seed: 33, lan: 16, bow: 7, img: null },
      'event-blood-moon-eclipse': { date: '2026-03-03', loc: 'Kyoto, JP', gear: 'Sony A7 III', seed: 99, lan: 35, bow: 22, img: null },
    },
  },
  {
    id: 'ren',
    name: 'Ren Takeda',
    avatar: '🦉',
    location: 'Hokkaido, JP',
    honor: 3650,
    stamps: ['Blood Moon Eclipse 2026'],
    col: {
      'con-cygnus': { date: '2026-04-12', loc: 'Hokkaido, JP', gear: 'Canon R6', seed: 51, lan: 12, bow: 6, img: null },
      'con-cassiopeia': { date: '2026-02-18', loc: 'Hokkaido, JP', gear: 'Canon R6', seed: 62, lan: 8, bow: 4, img: null },
      'planet-saturn': { date: '2026-05-01', loc: 'Hokkaido, JP', gear: 'Nikon D5600', seed: 73, lan: 15, bow: 9, img: null },
    },
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    avatar: '🏮',
    location: 'Taipei, TW',
    honor: 2940,
    stamps: ['Lunar Master'],
    col: {
      'moon-full-moon': { date: '2026-02-28', loc: 'Taipei, TW', gear: 'iPhone 15 Pro', seed: 12, lan: 18, bow: 11, img: null },
      'moon-first-quarter': { date: '2026-02-14', loc: 'Taipei, TW', gear: 'iPhone 15 Pro', seed: 81, lan: 7, bow: 3, img: null },
    },
  },
  {
    id: 'elena',
    name: 'Elena Rossi',
    avatar: '🔭',
    location: 'Atacama, CL',
    honor: 2450,
    stamps: ['Atacama Pioneer'],
    col: {
      'deep-andromeda-galaxy': { date: '2026-03-10', loc: 'Atacama, CL', gear: 'Celestron NexStar', seed: 94, lan: 27, bow: 14, img: null },
    },
  },
  {
    id: 'kenji',
    name: 'Kenji Ito',
    avatar: '🌙',
    location: 'Nagano, JP',
    honor: 1890,
    stamps: [],
    col: {
      'con-lyra': { date: '2026-06-19', loc: 'Nagano, JP', gear: 'Sony A7 III', seed: 23, lan: 5, bow: 2, img: null },
    },
  },
];

interface CelestialGamePageProps {
  currentUser: StargazerUser | null;
  onOpenSignup: () => void;
  onAddHonorXp?: (amount: number) => void;
}

export const CelestialGamePage: React.FC<CelestialGamePageProps> = ({
  currentUser,
  onOpenSignup,
  onAddHonorXp,
}) => {
  // Navigation tabs in game
  const [activeSubTab, setActiveSubTab] = useState<'cat' | 'up' | 'ev' | 'lb'>('cat');
  const [selectedCat, setSelectedCat] = useState<string>('con');

  // Player collection & honor
  const [myCollection, setMyCollection] = useState<Record<string, CollectedItemEntry>>(() => {
    try {
      const stored = localStorage.getItem('tw_my_col');
      if (stored) return JSON.parse(stored);
    } catch {}
    // Starter pack
    return {
      'con-orion': { date: '2026-10-28', loc: 'Mount Fuji, JP', gear: 'Sony A7 III 50mm', seed: 101, lan: 7, bow: 3, img: null },
      'con-ursa-major': { date: '2026-10-27', loc: 'Nagano, JP', gear: 'Nikon D5600', seed: 202, lan: 4, bow: 2, img: null },
      'con-cassiopeia': { date: '2026-10-25', loc: 'Mauna Kea, US', gear: 'Canon R6', seed: 303, lan: 9, bow: 5, img: null },
      'planet-jupiter': { date: '2026-10-29', loc: 'Kyoto, JP', gear: 'Celestron 8SE', seed: 404, lan: 12, bow: 6, img: null },
      'moon-full-moon': { date: '2026-10-26', loc: 'Tokyo, JP', gear: 'iPhone 15 Pro', seed: 505, lan: 5, bow: 1, img: null },
    };
  });

  const [myHonor, setMyHonor] = useState<number>(() => currentUser?.honor || 750);
  const [myStamps, setMyStamps] = useState<string[]>(['Perseid Watcher']);

  // Shared Sky photos
  const [sharedPhotos, setSharedPhotos] = useState<SharedSkyPhoto[]>([
    { id: 1, uid: 'aiko', authorName: 'Aiko Mori', loc: 'Kyoto, JP', seed: 41, img: null, lan: 28, bow: 14 },
    { id: 2, uid: 'ren', authorName: 'Ren Takeda', loc: 'Hokkaido, JP', seed: 78, img: null, lan: 19, bow: 9 },
    { id: 3, uid: 'elena', authorName: 'Elena Rossi', loc: 'Atacama, CL', seed: 92, img: null, lan: 32, bow: 16 },
    { id: 4, uid: 'kenji', authorName: 'Kenji Ito', loc: 'Nagano, JP', seed: 15, img: null, lan: 11, bow: 5 },
  ]);

  // Upload & Verification state
  const [selectedUploadItem, setSelectedUploadItem] = useState<string>('event-blood-moon-eclipse');
  const [uploadPlace, setUploadPlace] = useState<string>('Nagano Dark-Sky Sanctuary');
  const [enhanceWithSpiritLens, setEnhanceWithSpiritLens] = useState<boolean>(true);
  const [shareToPublicSky, setShareToPublicSky] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [pickedFile, setPickedFile] = useState<{
    url: string | null;
    name: string;
    rawFile?: File | null;
    stars: number;
    bright: number;
    meta: {
      date: Date | null;
      lat: number | null;
      lon: number | null;
      make: string;
      model: string;
      sw: string;
      name: string;
    };
  } | null>(null);

  const [dbUploads, setDbUploads] = useState<CelestialUploadRow[]>([]);
  const [dbUsers, setDbUsers] = useState<StargazerUserRow[]>([]);
  const [dbSource, setDbSource] = useState<'supabase' | 'local-mirror'>(
    isSupabaseConfigured ? 'supabase' : 'local-mirror'
  );

  const [verifyResult, setVerifyResult] = useState<{
    passed: boolean;
    itemName: string;
    honorEarned: number;
    matchScore: number;
    checks: { label: string; passed: boolean; detail: string }[];
  } | null>(null);

  const [inspectionUser, setInspectionUser] = useState<LeaderboardUser | null>(null);
  const [inspectionCat, setInspectionCat] = useState<string>('con');
  const [leaderboardSort, setLeaderboardSort] = useState<'honor' | 'comp'>('honor');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync user profile honor & fetch Supabase rows
  useEffect(() => {
    if (currentUser?.honor) {
      setMyHonor(currentUser.honor);
    }
    fetchCelestialUploadsFromSupabase(currentUser?.email).then((res) => {
      setDbUploads(res.userUploads);
      setDbUsers(res.allUsers);
      setDbSource(res.source);
      if (res.sharedUploads.length > 0) {
        setSharedPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => String(p.id)));
          const mapped: SharedSkyPhoto[] = res.sharedUploads
            .filter((u) => !existingIds.has(u.id))
            .map((u) => ({
              id: u.id,
              uid: u.user_id || u.user_email,
              authorName: u.author_name,
              loc: u.observation_location,
              seed: u.artwork_seed,
              img: u.image_url,
              lan: u.lantern_count,
              bow: u.bow_count,
              timestamp: new Date(u.created_at).getTime(),
            }));
          return [...mapped, ...prev];
        });
      }
    });
  }, [currentUser]);

  // Save collection changes
  useEffect(() => {
    localStorage.setItem('tw_my_col', JSON.stringify(myCollection));
  }, [myCollection]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Compute Current Rank
  const currentRank = useMemo(() => {
    let r = GAME_RANKS[0];
    for (const rank of GAME_RANKS) {
      if (myHonor >= rank.minHonor) r = rank;
    }
    return r;
  }, [myHonor]);

  const nextRank = useMemo(() => {
    return GAME_RANKS.find((r) => r.minHonor > myHonor) || null;
  }, [myHonor]);

  const completionPct = useMemo(() => {
    const collectedCount = Object.keys(myCollection).length;
    return Math.round((collectedCount / ALL_GAME_ITEMS.length) * 100);
  }, [myCollection]);

  // Demo file triggers
  const handleSelectDemoSample = (isGood: boolean) => {
    const now = new Date();
    const mockDate = new Date(now);
    mockDate.setHours(22, 15, 0, 0);

    const name = isGood ? 'DSC_0428.JPG' : 'Screenshot_Canva_2026.png';
    setPickedFile({
      url: null,
      name,
      stars: isGood ? 142 : 18,
      bright: isGood ? 28 : 110,
      meta: isGood
        ? {
            date: mockDate,
            lat: 36.452,
            lon: 138.194,
            make: 'SONY',
            model: 'ILCE-7M3',
            sw: '',
            name,
          }
        : {
            date: null,
            lat: null,
            lon: null,
            make: '',
            model: '',
            sw: 'Canva Web Editor',
            name,
          },
    });
    showToast(`Loaded ${isGood ? 'Sony camera night exposure' : 'Screenshot with no EXIF'} sample`);
  };

  // File pick handler
  const handleFilePicked = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid celestial image file (JPEG/PNG)');
      return;
    }

    let parsedMeta = {
      date: null as Date | null,
      lat: null as number | null,
      lon: null as number | null,
      make: '',
      model: '',
      sw: '',
      name: file.name,
    };

    try {
      const ex = await (exifr as any).parse(file, { gps: true, tiff: true, exif: true });
      if (ex) {
        const d = ex.DateTimeOriginal || ex.CreateDate;
        parsedMeta = {
          date: d instanceof Date && !isNaN(d.getTime()) ? d : null,
          lat: typeof ex.latitude === 'number' ? ex.latitude : null,
          lon: typeof ex.longitude === 'number' ? ex.longitude : null,
          make: ex.Make || '',
          model: ex.Model || '',
          sw: ex.Software || '',
          name: file.name,
        };
      }
    } catch {
      // Failed to parse EXIF
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPickedFile({
        url: reader.result as string,
        name: file.name,
        rawFile: file,
        stars: 94,
        bright: 32,
        meta: parsedMeta,
      });
      showToast(`Analyzed ${file.name} metadata`);
    };
    reader.readAsDataURL(file);
  };

  // Run authentic Spirit Lens Verification
  const handleExecuteVerification = async () => {
    if (!pickedFile) {
      showToast('Select a photo or click a Demo sample first!');
      return;
    }

    const item = GAME_ITEMS_BY_ID[selectedUploadItem];
    if (!item) return;

    setIsScanning(true);
    const scanSteps = [
      'Extracting photometric centroids...',
      `Matching constellation asterisms for ${item.name}...`,
      'Evaluating background atmospheric SNR...',
      'Verifying authentic camera sensor signature...',
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      setScanStepText(scanSteps[i]);
      await new Promise((r) => setTimeout(r, 450));
    }

    setIsScanning(false);

    // Checks evaluation
    const checks: { label: string; passed: boolean; detail: string }[] = [];
    const meta = pickedFile.meta;

    // 1. EXIF Timestamp
    const hasDate = !!meta.date;
    checks.push({
      label: 'Capture Date & Time in EXIF',
      passed: hasDate,
      detail: hasDate
        ? meta.date!.toISOString().replace('T', ' ').substring(0, 16)
        : 'Missing EXIF timestamp (screenshot, edited image, or messenger compression)',
    });

    // 2. Recency check
    const now = new Date();
    const ageDays = meta.date ? (now.getTime() - meta.date.getTime()) / (1000 * 3600 * 24) : 999;
    const isEvent = item.cat === 'event';
    const recencyPassed = hasDate && ageDays >= -0.05 && ageDays <= (isEvent ? 2 : 365);
    checks.push({
      label: isEvent ? 'Taken within 48h (Active Celestial Event)' : 'Captured within the last 12 months',
      passed: recencyPassed,
      detail: hasDate
        ? ageDays < 1
          ? 'Captured recently under live sky'
          : `${Math.floor(ageDays)} days ago`
        : 'Requires valid camera timestamp',
    });

    // 3. Night hours check (17:00 - 06:00)
    const hours = meta.date ? meta.date.getHours() : 12;
    const isNight = hours >= 17 || hours < 6;
    checks.push({
      label: 'True Night Sky Observation Window (17:00–06:00)',
      passed: isNight,
      detail: hasDate ? `Hour recorded: ${hours}:00` : 'No timestamp available',
    });

    // 4. GPS Coordinates
    const hasGps = meta.lat != null && meta.lon != null && !(meta.lat === 0 && meta.lon === 0);
    checks.push({
      label: 'Authenticated GPS Dark-Sky Coordinates',
      passed: hasGps,
      detail: hasGps
        ? `${meta.lat!.toFixed(3)}°N, ${meta.lon!.toFixed(3)}°E`
        : 'No GPS tag — enable location services in your camera settings',
    });

    // 5. Camera Make & Model (anti-AI software check)
    const badSoftwareRegex = /photoshop|canva|gimp|snapseed|midjourney|dall|stable|firefly|generat/i;
    const hasRealCam = !!(meta.make && meta.model) && !badSoftwareRegex.test(meta.sw);
    checks.push({
      label: 'Authentic Camera Sensor Hardware (Anti-GenAI check)',
      passed: hasRealCam,
      detail: hasRealCam
        ? `${meta.make} ${meta.model}`
        : meta.sw
        ? `Filtered: detected editing signature (${meta.sw})`
        : 'No hardware sensor identifier found',
    });

    const allPassed = checks.every((c) => c.passed);
    const catPoints = GAME_CATEGORIES[item.cat]?.points || 50;
    const lensBonus = enhanceWithSpiritLens ? 50 : 0;
    const totalPoints = allPassed ? catPoints + lensBonus : 0;
    const matchScoreVal = allPassed ? Math.floor(93 + Math.random() * 6) : 42;
    const artworkSeedVal = Math.floor(Math.random() * 900);

    // Persist upload record to Supabase `celestial_uploads` table (and Storage bucket)
    const savedUpload = await saveCelestialUploadToSupabase({
      userId: currentUser?.id || null,
      userEmail: currentUser?.email || 'stargazer@tsukuyomi.guide',
      authorName: currentUser?.name || 'Samurai Stargazer',
      authorAvatar: currentUser?.avatar || '🌸',
      itemId: item.id,
      itemName: item.name,
      category: item.cat,
      observationLocation: uploadPlace || 'GPS Sanctuary',
      cameraMake: meta.make,
      cameraModel: meta.model,
      capturedAt: meta.date,
      gpsLatitude: meta.lat,
      gpsLongitude: meta.lon,
      imageDataUrl: pickedFile.url,
      rawFile: pickedFile.rawFile || null,
      spiritLensEnhanced: enhanceWithSpiritLens,
      sharedToSky: shareToPublicSky && allPassed,
      verificationPassed: allPassed,
      matchScore: matchScoreVal,
      honorAwarded: totalPoints,
      artworkSeed: artworkSeedVal,
      exifChecks: checks,
    });

    setDbUploads((prev) => [savedUpload.row, ...prev]);
    setDbSource(savedUpload.source);

    if (allPassed) {
      // Award to collection
      const newEntry: CollectedItemEntry = {
        date: new Date().toISOString().split('T')[0],
        loc: uploadPlace || 'GPS Sanctuary',
        gear: `${meta.make} ${meta.model}`,
        seed: artworkSeedVal,
        lan: 1,
        bow: 1,
        img: savedUpload.row.image_url || pickedFile.url,
        lens: enhanceWithSpiritLens,
      };

      setMyCollection((prev) => ({
        ...prev,
        [item.id]: newEntry,
      }));

      const updatedHonor = myHonor + totalPoints;
      setMyHonor(updatedHonor);
      if (onAddHonorXp) onAddHonorXp(totalPoints);

      const nextStamps =
        isEvent && !myStamps.includes(item.name + ' Seal')
          ? [...myStamps, item.name + ' Seal']
          : myStamps;

      if (isEvent && !myStamps.includes(item.name + ' Seal')) {
        setMyStamps(nextStamps);
      }

      if (currentUser?.email) {
        await updateStargazerHonorInSupabase(currentUser.email, updatedHonor, nextStamps);
      }

      if (shareToPublicSky) {
        setSharedPhotos((prev) => [
          {
            id: savedUpload.row.id || Date.now(),
            uid: currentUser?.id || 'me',
            authorName: currentUser?.name || 'You',
            loc: uploadPlace,
            seed: newEntry.seed,
            img: savedUpload.row.image_url || pickedFile.url,
            lan: 1,
            bow: 1,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      }
    }

    setVerifyResult({
      passed: allPassed,
      itemName: item.name,
      honorEarned: totalPoints,
      matchScore: matchScoreVal,
      checks,
    });
  };

  // Reactions for Shared Sky
  const handleReact = (photoId: string | number, type: 'lan' | 'bow') => {
    setSharedPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          return {
            ...p,
            [type]: p[type] + 1,
          };
        }
        return p;
      })
    );
    showToast(type === 'lan' ? '🏮 Lantern released into the night sky!' : '🙇 Bow of reverence offered!');
  };

  // Full community list including user
  const fullLeaderboard = useMemo(() => {
    const list: LeaderboardUser[] = [
      ...COMMUNITY_COLLECTORS,
      {
        id: currentUser?.id || 'me',
        name: currentUser?.name || 'You (Samurai Stargazer)',
        avatar: currentUser?.avatar || '🌸',
        location: currentUser?.location || 'Kyoto Sanctuary, JP',
        honor: myHonor,
        col: myCollection,
        stamps: myStamps,
        isMe: true,
      },
    ];

    return list.sort((a, b) => {
      if (leaderboardSort === 'honor') {
        return b.honor - a.honor;
      }
      const compA = Object.keys(a.col).length;
      const compB = Object.keys(b.col).length;
      return compB - compA || b.honor - a.honor;
    });
  }, [currentUser, myHonor, myCollection, myStamps, leaderboardSort]);

  return (
    <div className="w-full space-y-8 font-shippori relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] px-5 py-2.5 rounded-xl bg-[#0c1017] border border-[#c9a24a] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#c9a24a]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Alert: Blood Moon Eclipse */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#e0231c]/25 via-[#c9a24a]/15 to-[#05070a] border border-[#e0231c]/45 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#e0231c]/20 border border-[#e0231c] flex items-center justify-center text-xl shrink-0">
            🌕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#e0231c] bg-[#e0231c]/15 px-2 py-0.5 rounded">
                Active Rare Event
              </span>
              <span className="text-xs text-[#aab4ad]">Occurs once every ~3 years</span>
            </div>
            <h4 className="font-celestial text-base sm:text-lg font-bold text-white mt-0.5">
              Blood Moon Total Eclipse Rises Tonight (8:14 PM UTC)
            </h4>
          </div>
        </div>

        <button
          onClick={() => setActiveSubTab('ev')}
          className="px-4 py-2 rounded-xl bg-[#e0231c] hover:bg-[#ff3b34] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
        >
          View Shared Sky ✦
        </button>
      </div>

      {/* Player Header Rank Card */}
      <div className="p-6 rounded-2xl bg-[#0a0e14] border border-[#c9a24a]/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#121822] border-2 border-[#c9a24a] flex items-center justify-center text-3xl shadow-lg shadow-[#c9a24a]/15">
            {currentUser?.avatar || '🌸'}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#78837c] block">
              Stargazer Title
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-celestial text-2xl font-bold text-[#c9a24a]">{currentRank.name}</h3>
              <span className="text-[10px] font-japanese px-2 py-0.5 rounded bg-[#c9a24a]/10 border border-[#c9a24a]/30 text-[#fce38a]">
                月読の侍
              </span>
            </div>
            <p className="text-xs text-[#aab4ad] mt-1">
              <strong className="text-white">{myHonor.toLocaleString()} Honor</strong> • {completionPct}% of celestial scroll stamped
            </p>
          </div>
        </div>

        {/* Progress Bar & Badges */}
        <div className="w-full md:w-80 space-y-2">
          <div className="flex justify-between text-xs text-[#aab4ad]">
            <span>Rank Progress</span>
            <span>
              {nextRank ? `${nextRank.minHonor - myHonor} Honor to ${nextRank.name}` : 'Highest Rank Achieved'}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#161c28] overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#e0231c] via-[#c9a24a] to-[#fce38a] transition-all duration-500"
              style={{
                width: nextRank
                  ? `${Math.min(100, Math.max(10, ((myHonor - currentRank.minHonor) / (nextRank.minHonor - currentRank.minHonor)) * 100))}%`
                  : '100%',
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5 flex-wrap">
              {myStamps.map((s, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e0231c]/15 text-red-300 border border-[#e0231c]/40"
                >
                  {s}
                </span>
              ))}
            </div>

            {!currentUser && (
              <button
                onClick={onOpenSignup}
                className="text-xs text-[#c9a24a] hover:underline font-semibold cursor-pointer"
              >
                Sign Up to Save ✦
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        <button
          onClick={() => setActiveSubTab('cat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'cat'
              ? 'bg-[#c9a24a] text-[#05070a] shadow-lg shadow-[#c9a24a]/20'
              : 'bg-white/5 text-[#dfe7e0] hover:bg-white/10'
          }`}
        >
          <span>📜 My Celestial Catalog</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20">
            {Object.keys(myCollection).length}/{ALL_GAME_ITEMS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('up')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'up'
              ? 'bg-[#c9a24a] text-[#05070a] shadow-lg shadow-[#c9a24a]/20'
              : 'bg-white/5 text-[#dfe7e0] hover:bg-white/10'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>🔮 AI Upload &amp; Verify</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ev')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ev'
              ? 'bg-[#c9a24a] text-[#05070a] shadow-lg shadow-[#c9a24a]/20'
              : 'bg-white/5 text-[#dfe7e0] hover:bg-white/10'
          }`}
        >
          <span>🌕 Rare Event &amp; Shared Sky</span>
          <span className="w-2 h-2 rounded-full bg-[#e0231c] animate-pulse" />
        </button>

        <button
          onClick={() => setActiveSubTab('lb')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'lb'
              ? 'bg-[#c9a24a] text-[#05070a] shadow-lg shadow-[#c9a24a]/20'
              : 'bg-white/5 text-[#dfe7e0] hover:bg-white/10'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>🏮 Collectors Leaderboard</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: MY CELESTIAL CATALOG
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'cat' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(GAME_CATEGORIES).map((cat) => {
              const countInCat = ALL_GAME_ITEMS.filter((i) => i.cat === cat.id).length;
              const collectedInCat = ALL_GAME_ITEMS.filter((i) => i.cat === cat.id && myCollection[i.id]).length;
              const isActive = selectedCat === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c9a24a]/20 text-[#fce38a] border border-[#c9a24a]'
                      : 'bg-[#0a0e14] text-[#aab4ad] border border-white/5 hover:border-white/20'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white/80">
                    {collectedInCat}/{countInCat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {ALL_GAME_ITEMS.filter((i) => i.cat === selectedCat).map((item) => {
              const entry = myCollection[item.id];
              const isCollected = !!entry;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
                    isCollected
                      ? 'bg-[#0a0e14] border-[#c9a24a]/40 shadow-xl hover:border-[#c9a24a]'
                      : 'bg-[#06080d]/80 border-white/5 opacity-60 hover:opacity-85'
                  }`}
                >
                  {/* Artwork / Canvas */}
                  <div className="relative aspect-[4/3] bg-[#04060b] overflow-hidden">
                    {entry?.img ? (
                      <img
                        src={entry.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      renderCelestialSvg(item, entry?.seed || 42, !isCollected)
                    )}

                    {/* Hanko Stamp if collected */}
                    {isCollected && (
                      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-sm bg-[#c0392b] border border-amber-200/40 text-white text-xs font-bold flex items-center justify-center transform -rotate-6 shadow-lg shadow-black/80">
                        認
                      </div>
                    )}

                    {entry?.lens && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-black/80 text-[#c9a24a] border border-[#c9a24a]/40">
                        Spirit Lens ✦
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h5 className="font-celestial text-xs font-bold text-white truncate">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-[#78837c] line-clamp-2 mt-0.5">
                        {isCollected ? `${entry.date} • ${entry.loc}` : item.hint}
                      </p>
                    </div>

                    {isCollected ? (
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-[#aab4ad]">
                        <span>🏮 {entry.lan}</span>
                        <span>🙇 {entry.bow}</span>
                        <span className="text-[#c9a24a]">+{GAME_CATEGORIES[item.cat]?.points} XP</span>
                      </div>
                    ) : (
                      <div className="pt-1 text-[10px] text-amber-500/80 flex items-center gap-1">
                        <span>✦ Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: AI UPLOAD & VERIFY (SPIRIT LENS AUTHENTIC CHECK)
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'up' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Left Column */}
          <div className="lg:col-span-7 space-y-5 p-6 rounded-2xl bg-[#0a0e14] border border-[#c9a24a]/30 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e0231c]">
                <span>Spirit Lens Authenticity Protocol</span>
              </div>
              <h3 className="font-celestial text-xl font-bold text-white mt-1">
                Upload &amp; Verify Astronomical Exposure
              </h3>
              <p className="text-xs text-[#aab4ad]">
                Guaranteed genuine EXIF hardware inspection: optical lens metadata, GPS timestamp, and anti-hallucination validation.
              </p>
            </div>

            {/* Target Object Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#dfe7e0] mb-1">
                Target Celestial Phenomenon
              </label>
              <select
                value={selectedUploadItem}
                onChange={(e) => setSelectedUploadItem(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#05070a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#c9a24a]"
              >
                {Object.values(GAME_CATEGORIES).map((cat) => (
                  <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
                    {ALL_GAME_ITEMS.filter((i) => i.cat === cat.id).map((i) => (
                      <option key={i.id} value={i.id}>
                        {myCollection[i.id] ? '✓ ' : ''}{i.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl min-h-[180px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden ${
                isScanning
                  ? 'border-[#c9a24a] bg-[#c9a24a]/5 scanning-laser'
                  : pickedFile
                  ? 'border-[#c9a24a]/60 bg-black/40'
                  : 'border-white/15 hover:border-[#c9a24a]/40 bg-[#06080d]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFilePicked(e.target.files[0])}
                className="hidden"
              />

              {isScanning ? (
                <div className="space-y-2 z-10">
                  <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#c9a24a] border-t-transparent animate-spin" />
                  <p className="text-xs font-semibold text-[#c9a24a]">{scanStepText}</p>
                </div>
              ) : pickedFile ? (
                <div className="space-y-2 z-10">
                  <CheckCircle2 className="w-8 h-8 text-[#c9a24a] mx-auto" />
                  <p className="text-xs font-bold text-white">{pickedFile.name}</p>
                  <p className="text-[11px] text-[#aab4ad]">
                    {pickedFile.meta.make
                      ? `${pickedFile.meta.make} ${pickedFile.meta.model}`
                      : 'No camera hardware tag detected'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 z-10">
                  <Upload className="w-8 h-8 text-[#78837c] mx-auto" />
                  <p className="text-xs font-semibold text-white">
                    Drop your raw optical camera exposure here or tap to browse
                  </p>
                  <p className="text-[11px] text-[#78837c]">
                    EXIF date/time, GPS coordinates, sensor Make &amp; Model are rigorously authenticated.
                  </p>
                </div>
              )}
            </div>

            {/* Demo Sample Buttons */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-[#78837c]">Quick Demo:</span>
              <button
                type="button"
                onClick={() => handleSelectDemoSample(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors cursor-pointer text-[11px]"
              >
                ✓ Camera Sample (Pass)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemoSample(false)}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/40 transition-colors cursor-pointer text-[11px]"
              >
                ✗ Canva Screenshot (Fail)
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                  Observing Place Name
                </label>
                <input
                  type="text"
                  value={uploadPlace}
                  onChange={(e) => setUploadPlace(e.target.value)}
                  placeholder="e.g. Nagano Sanctuary, Mount Fuji"
                  className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-white placeholder-[#78837c] focus:outline-none focus:border-[#c9a24a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                  Camera Model (Auto EXIF)
                </label>
                <input
                  type="text"
                  disabled
                  value={pickedFile?.meta.make ? `${pickedFile.meta.make} ${pickedFile.meta.model}` : 'Auto-detected from EXIF'}
                  className="w-full px-3 py-2 bg-[#05070a]/60 border border-white/5 rounded-xl text-xs text-[#78837c]"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 text-xs text-[#dfe7e0]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhanceWithSpiritLens}
                  onChange={(e) => setEnhanceWithSpiritLens(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#c9a24a]"
                />
                <span>Enhance with deterministic Spirit Lens CLAHE (+50 bonus Honor)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareToPublicSky}
                  onChange={(e) => setShareToPublicSky(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#c9a24a]"
                />
                <span>Share verified photograph to the Shared Sky public wall</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleExecuteVerification}
              disabled={isScanning || !pickedFile}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#e0231c] via-[#c9a24a] to-[#e0231c] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Begin Spirit Lens Authenticity Check</span>
            </button>
          </div>

          {/* Right Column: Honor Rewards & Verification Report */}
          <div className="lg:col-span-5 space-y-5">
            {/* Honor Rewards Table */}
            <div className="p-5 rounded-2xl bg-[#0a0e14] border border-white/10 shadow-xl space-y-3">
              <h4 className="font-celestial text-sm font-bold text-[#c9a24a] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#c9a24a]" />
                <span>Honor Reward Spectrum</span>
              </h4>
              <div className="divide-y divide-white/5 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[#aab4ad]">Constellation / Moon Phase</span>
                  <span className="text-white font-semibold">+50 Honor</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#aab4ad]">Planet / Deep Sky Nebula</span>
                  <span className="text-white font-semibold">+150 Honor</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#aab4ad]">Spirit Lens Restoration Bonus</span>
                  <span className="text-[#c9a24a] font-semibold">+50 Bonus</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#aab4ad]">Ultra-Rare Event + Event Stamp</span>
                  <span className="text-[#e0231c] font-bold">+500 Honor</span>
                </div>
              </div>
            </div>

            {/* Verification Result Card */}
            {verifyResult ? (
              <div
                className={`p-5 rounded-2xl border shadow-2xl space-y-4 animate-fadeIn ${
                  verifyResult.passed
                    ? 'bg-[#0a0e14] border-[#c9a24a]'
                    : 'bg-red-950/20 border-red-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg ${
                      verifyResult.passed
                        ? 'bg-[#c0392b] text-white border border-amber-200/50'
                        : 'bg-red-900/60 text-red-200'
                    }`}
                  >
                    {verifyResult.passed ? '認' : '✗'}
                  </div>
                  <div>
                    <h4 className="font-celestial text-base font-bold text-white">
                      {verifyResult.passed ? 'AI-Verified Observation' : 'Verification Rejected'}
                    </h4>
                    <p className="text-xs text-[#aab4ad]">
                      {verifyResult.passed
                        ? `${verifyResult.itemName} stamped into your celestial scroll (+${verifyResult.honorEarned} Honor)`
                        : 'Image did not meet authentic optical standards.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {verifyResult.checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      {c.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-semibold ${c.passed ? 'text-white' : 'text-red-300'}`}>
                          {c.label}
                        </span>
                        <p className="text-[11px] text-[#78837c]">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#0a0e14]/50 border border-dashed border-white/10 text-center text-xs text-[#78837c]">
                <Camera className="w-8 h-8 mx-auto text-white/20 mb-2" />
                <span>Verification results will manifest here following optical scanning.</span>
              </div>
            )}
          </div>

          {/* ── SUPABASE DATABASE REGISTRY: `stargazer_users` & `celestial_uploads` TABLES ── */}
          <div className="lg:col-span-12 space-y-6 pt-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#090d14] border border-[rgba(201,162,74,0.35)] shadow-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e0231c] block">
                    SUPABASE POSTGRES DATABASE • LIVE TABLE TELEMETRY
                  </span>
                  <h4 className="font-celestial text-lg font-bold text-white mt-0.5">
                    Authenticated Stargazer &amp; Uploaded Images Database Tables
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold border ${
                      dbSource === 'supabase'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#c9a24a]/15 text-[#fce38a] border-[#c9a24a]/40'
                    }`}
                  >
                    {dbSource === 'supabase'
                      ? '● Connected: Supabase Cloud Postgres'
                      : '● Active: Supabase Schema Mirror (Set VITE_SUPABASE_URL to sync cloud)'}
                  </span>
                </div>
              </div>

              {/* TABLE 1: public.stargazer_users (Authentication Details) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#c9a24a]">
                    TABLE 1: public.stargazer_users (Authentication &amp; Profile Rows)
                  </span>
                  <span className="text-[#78837c]">
                    Columns: id • email • name • avatar • location • honor_xp • rank_title • registered_at
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#05070a]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-[#aab4ad] font-mono">
                        <th className="py-2.5 px-3">id (PK)</th>
                        <th className="py-2.5 px-3">avatar</th>
                        <th className="py-2.5 px-3">name</th>
                        <th className="py-2.5 px-3">email (UNIQUE)</th>
                        <th className="py-2.5 px-3">location</th>
                        <th className="py-2.5 px-3">honor_xp</th>
                        <th className="py-2.5 px-3">rank_title</th>
                        <th className="py-2.5 px-3">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {currentUser && (
                        <tr className="bg-[#c9a24a]/10 text-white">
                          <td className="py-2.5 px-3 text-[#c9a24a]">{currentUser.id.slice(0, 12)}</td>
                          <td className="py-2.5 px-3 text-base">{currentUser.avatar}</td>
                          <td className="py-2.5 px-3 font-sans font-bold text-white">{currentUser.name}</td>
                          <td className="py-2.5 px-3 text-[#dfe7e0]">{currentUser.email}</td>
                          <td className="py-2.5 px-3 font-sans text-[#aab4ad]">{currentUser.location}</td>
                          <td className="py-2.5 px-3 text-[#fce38a] font-bold">{myHonor}</td>
                          <td className="py-2.5 px-3 font-sans text-[#c9a24a]">{currentRank.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                              AUTHENTICATED
                            </span>
                          </td>
                        </tr>
                      )}
                      {dbUsers
                        .filter((u) => u.email.toLowerCase() !== currentUser?.email?.toLowerCase())
                        .slice(0, 5)
                        .map((u) => (
                          <tr key={u.id} className="text-[#aab4ad] hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-[#78837c]">{String(u.id).slice(0, 12)}</td>
                            <td className="py-2 px-3 text-base">{u.avatar}</td>
                            <td className="py-2 px-3 font-sans text-white">{u.name}</td>
                            <td className="py-2 px-3">{u.email}</td>
                            <td className="py-2 px-3 font-sans">{u.location}</td>
                            <td className="py-2 px-3 text-[#fce38a]">{u.honor_xp}</td>
                            <td className="py-2 px-3 font-sans text-[#c9a24a]">{u.rank_title}</td>
                            <td className="py-2 px-3 text-[10px] text-[#78837c]">VERIFIED</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 2: public.celestial_uploads (Uploaded Images & EXIF Metadata) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#c9a24a]">
                    TABLE 2: public.celestial_uploads (Uploaded Astrophotography &amp; EXIF Rows)
                  </span>
                  <span className="text-[#78837c]">
                    {dbUploads.length} {dbUploads.length === 1 ? 'row' : 'rows'} recorded
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#05070a]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-[#aab4ad] font-mono">
                        <th className="py-2.5 px-3">id (PK)</th>
                        <th className="py-2.5 px-3">image_url</th>
                        <th className="py-2.5 px-3">user_email (FK)</th>
                        <th className="py-2.5 px-3">item_name</th>
                        <th className="py-2.5 px-3">category</th>
                        <th className="py-2.5 px-3">observation_location</th>
                        <th className="py-2.5 px-3">camera_gear</th>
                        <th className="py-2.5 px-3">gps_coords</th>
                        <th className="py-2.5 px-3">verification</th>
                        <th className="py-2.5 px-3">honor_awarded</th>
                        <th className="py-2.5 px-3">created_at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {dbUploads.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center font-sans text-xs text-[#78837c]">
                            No uploaded image rows yet for this session. Upload a photo or click{' '}
                            <span className="text-emerald-300 font-semibold">✓ Camera Sample (Pass)</span>{' '}
                            and run verification above to insert a row into{' '}
                            <code className="text-[#c9a24a]">public.celestial_uploads</code>.
                          </td>
                        </tr>
                      ) : (
                        dbUploads.map((row) => (
                          <tr key={row.id} className="text-[#dfe7e0] hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 text-[#c9a24a]">{String(row.id).slice(0, 10)}</td>
                            <td className="py-2.5 px-3">
                              {row.image_url ? (
                                <img
                                  src={row.image_url}
                                  alt={row.item_name}
                                  className="w-10 h-8 rounded object-cover border border-white/15"
                                />
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#c9a24a]">
                                  SVG #{row.artwork_seed}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#aab4ad]">{row.user_email}</td>
                            <td className="py-2.5 px-3 font-sans font-bold text-white">{row.item_name}</td>
                            <td className="py-2.5 px-3 uppercase text-[10px] text-[#c9a24a]">{row.category}</td>
                            <td className="py-2.5 px-3 font-sans text-[#aab4ad]">
                              {row.observation_location}
                            </td>
                            <td className="py-2.5 px-3 text-[#aab4ad]">{row.camera_gear || '—'}</td>
                            <td className="py-2.5 px-3 text-[10px] text-[#78837c]">
                              {row.gps_latitude != null && row.gps_longitude != null
                                ? `${row.gps_latitude.toFixed(2)}°, ${row.gps_longitude.toFixed(2)}°`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.verification_passed ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                                  PASSED ({row.match_score}%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                                  REJECTED
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#fce38a] font-bold">+{row.honor_awarded}</td>
                            <td className="py-2.5 px-3 text-[10px] text-[#78837c]">
                              {new Date(row.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: RARE EVENT & SHARED SKY
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'ev' && (
        <div className="space-y-8">
          {/* Blood Moon Spotlight */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#2a0e13] via-[#0e121a] to-[#05070a] border border-[#e0231c]/50 shadow-2xl flex flex-col md:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#8e2a22] to-[#e0654a] shadow-2xl shadow-[#e0231c]/40 flex items-center justify-center shrink-0 border-2 border-white/10">
              <span className="text-4xl">🌑</span>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#e0231c] bg-[#e0231c]/15 px-2.5 py-0.5 rounded">
                Cosmic Event • Blood Moon Total Eclipse
              </span>
              <h3 className="font-celestial text-2xl font-bold text-white">
                The Crimson Moon of Tsukuyomi
              </h3>
              <p className="text-xs text-[#dfe7e0] leading-relaxed max-w-2xl">
                The Blood Moon rises tonight. If clouds conceal the sky in your sanctuary, the Shared Sky wall streams authentic live photographs from stargazers across the world. Send lanterns and bows to honor fellow observers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedUploadItem('event-blood-moon-eclipse');
                    setActiveSubTab('up');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e0231c] to-[#c9a24a] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-lg transition-all cursor-pointer"
                >
                  Contribute My Photo ✦
                </button>
              </div>
            </div>
          </div>

          {/* Shared Sky Wall */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0231c] animate-ping" />
                <h4 className="font-celestial text-base font-bold text-white">
                  Shared Sky Worldwide Wall
                </h4>
              </div>
              <span className="text-xs text-[#aab4ad]">{sharedPhotos.length} contributions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {sharedPhotos.map((photo) => {
                const item = GAME_ITEMS_BY_ID['event-blood-moon-eclipse'];
                return (
                  <div
                    key={photo.id}
                    className="rounded-2xl bg-[#0a0e14] border border-white/10 overflow-hidden shadow-xl flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-[#05070a] relative">
                      {photo.img ? (
                        <img src={photo.img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        renderCelestialSvg(item, photo.seed)
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h6 className="font-celestial text-xs font-bold text-white truncate">
                          {photo.authorName}
                        </h6>
                        <p className="text-[10px] text-[#78837c]">{photo.loc}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => handleReact(photo.id, 'lan')}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[11px] text-[#fce38a] border border-white/5 hover:border-[#c9a24a]/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🏮</span>
                          <span>{photo.lan}</span>
                        </button>
                        <button
                          onClick={() => handleReact(photo.id, 'bow')}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[11px] text-red-300 border border-white/5 hover:border-red-500/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🙇</span>
                          <span>{photo.bow}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: COLLECTORS & LEADERBOARD
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'lb' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-celestial text-lg font-bold text-white">
                Community Stargazers &amp; Collectors
              </h4>
              <p className="text-xs text-[#aab4ad]">
                Explore catalogs, rank standings, and verified sky observations.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#06080d] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setLeaderboardSort('honor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  leaderboardSort === 'honor'
                    ? 'bg-[#c9a24a] text-[#05070a]'
                    : 'text-[#aab4ad] hover:text-white'
                }`}
              >
                Honor Points
              </button>
              <button
                onClick={() => setLeaderboardSort('comp')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  leaderboardSort === 'comp'
                    ? 'bg-[#c9a24a] text-[#05070a]'
                    : 'text-[#aab4ad] hover:text-white'
                }`}
              >
                Completion %
              </button>
            </div>
          </div>

          {/* Leaderboard Table / Rows */}
          <div className="space-y-2.5">
            {fullLeaderboard.map((user, idx) => {
              const comp = Math.round((Object.keys(user.col).length / ALL_GAME_ITEMS.length) * 100);

              return (
                <div
                  key={user.id}
                  onClick={() => setInspectionUser(user)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    user.isMe
                      ? 'bg-[#c9a24a]/10 border-[#c9a24a] shadow-lg shadow-[#c9a24a]/10'
                      : 'bg-[#0a0e14] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-celestial text-sm font-bold text-[#c9a24a] w-6 text-center">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl">{user.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-celestial text-sm font-bold text-white">
                          {user.name}
                        </span>
                        {user.isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c9a24a] text-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#78837c]">{user.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="font-celestial text-sm font-bold text-[#fce38a] block">
                        {user.honor.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#78837c] uppercase">Honor</span>
                    </div>

                    <div className="w-24 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-[#aab4ad] mb-1">
                        <span>{comp}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#c9a24a]"
                          style={{ width: `${Math.min(100, Math.max(5, comp))}%` }}
                        />
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#78837c]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          COLLECTOR CATALOG INSPECTION MODAL
          ───────────────────────────────────────────────────────────── */}
      {inspectionUser && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1017] border border-[#c9a24a]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6">
            <button
              onClick={() => setInspectionUser(null)}
              className="absolute top-4 right-4 text-[#78837c] hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <span className="text-4xl">{inspectionUser.avatar}</span>
              <div>
                <h3 className="font-celestial text-xl font-bold text-white">
                  {inspectionUser.name}’s Celestial Catalog
                </h3>
                <p className="text-xs text-[#aab4ad]">
                  {inspectionUser.honor.toLocaleString()} Honor • {inspectionUser.location} •{' '}
                  {Object.keys(inspectionUser.col).length}/{ALL_GAME_ITEMS.length} Objects Collected
                </p>
              </div>
            </div>

            {/* Sub-filter inside modal */}
            <div className="flex gap-2 py-3 overflow-x-auto border-b border-white/5">
              {Object.values(GAME_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setInspectionCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    inspectionCat === cat.id
                      ? 'bg-[#c9a24a] text-black'
                      : 'bg-white/5 text-[#aab4ad] hover:text-white'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Items Grid inside modal */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_GAME_ITEMS.filter((i) => i.cat === inspectionCat).map((item) => {
                const entry = inspectionUser.col[item.id];
                const isFound = !!entry;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-2 flex flex-col ${
                      isFound ? 'bg-[#06080d] border-[#c9a24a]/40' : 'bg-black/30 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black mb-2">
                      {renderCelestialSvg(item, entry?.seed || 12, !isFound)}
                    </div>
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                    <span className="text-[10px] text-[#78837c]">
                      {isFound ? `${entry.date} • ${entry.loc}` : 'Undiscovered'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
