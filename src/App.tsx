import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, SectionId } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import WatchtowerModule from './watchtower/WatchtowerModule';
import { CelestialScrollPage } from './pages/CelestialScrollPage';
import { SpiritLensPage } from './pages/SpiritLensPage';
import { Scene } from './components/Scene';
import { SamuraiGamificationHub, QuestItem } from './components/SamuraiGamificationHub';
import { CelestialGamePage } from './pages/CelestialGamePage';
import { SignupModal, StargazerUser } from './components/SignupModal';
import { SkyLanternSideDrawer } from './components/SkyLanternLens';
import { TransientSideDrawer } from './components/TransientAnalysis';
import { AppMode, LocationCoordinates, WeatherScoreResponse, CelestialEvent, MoonPhaseData } from './types';
import { CANDIDATE_LOCATIONS, MOCK_WEATHER_SCORE } from './data/mockData';
import { fetchWeatherScore, fetchCelestialEvents, fetchMoonPhaseData } from './lib/api';
import { Moon, Shield, ChevronDown, Trophy, Sparkles, ArrowUp, ArrowLeft, UserCheck, LogOut } from 'lucide-react';

const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'quest-sanctuary',
    title: 'Reconnoiter a Dark-Sky Sanctuary',
    jpTitle: '聖地探索',
    description: 'Select a dark-sky sanctuary or search any city on the Watchtower interactive map.',
    xp: 150,
    completed: false,
    targetSection: 'watchtower',
  },
  {
    id: 'quest-formula',
    title: 'Master the Atmospheric Heuristic',
    jpTitle: '天象解析',
    description: 'Adjust the atmospheric sliders in the Live Heuristic Sandbox to test the Night Honor Score.',
    xp: 100,
    completed: false,
    targetSection: 'gamification',
  },
  {
    id: 'quest-scroll',
    title: 'Pledge Watch on a Cosmic Event',
    jpTitle: '星見の誓い',
    description: 'Lock onto an upcoming rocket launch or meteor shower in the Celestial Scroll.',
    xp: 150,
    completed: false,
    targetSection: 'scroll',
  },
  {
    id: 'quest-lens',
    title: 'Purify a Deep-Sky Exposure',
    jpTitle: '霊鏡浄化',
    description: 'Inspect or log an astrophotography frame using deterministic CLAHE in Spirit Lens.',
    xp: 200,
    completed: false,
    targetSection: 'lens',
  },
  {
    id: 'quest-quiz',
    title: 'Pass the Trial of the Blood Moon',
    jpTitle: '朱月の試練',
    description: 'Complete the 3-question Samurai Lore Trial to earn the Seal of the Vermilion Moon.',
    xp: 250,
    completed: false,
    targetSection: 'gamification',
  },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SectionId>('sanctuary');
  const [appMode, setAppMode] = useState<AppMode>('live');
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates>(CANDIDATE_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WeatherScoreResponse>(MOCK_WEATHER_SCORE);
  const [moonData, setMoonData] = useState<MoonPhaseData | null>(null);
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [, setIsLoadingWeather] = useState<boolean>(false);
  const [isLoadingMoon, setIsLoadingMoon] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moonError, setMoonError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Gamification & Samurai Honours Stargazer Auth State
  const [quests, setQuests] = useState<QuestItem[]>(INITIAL_QUESTS);
  const [xp, setXp] = useState<number>(120); // Starting base XP
  const [xpToast, setXpToast] = useState<{ title: string; xp: number } | null>(null);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const [isSamuraiHonoursPage, setIsSamuraiHonoursPage] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<StargazerUser | null>(() => {
    try {
      const saved = localStorage.getItem('tsukuyomi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Side Drawer States for NASA SkyView & Transient Analysis Lab
  const [isSkyLanternOpen, setIsSkyLanternOpen] = useState<boolean>(false);
  const [isTransientOpen, setIsTransientOpen] = useState<boolean>(false);

  const completeQuest = useCallback((questId: string) => {
    setQuests((prev) => {
      const target = prev.find((q) => q.id === questId);
      if (!target || target.completed) return prev;
      setXp((curr) => curr + target.xp);
      setXpToast({ title: target.title, xp: target.xp });
      setTimeout(() => setXpToast(null), 4000);
      return prev.map((q) => (q.id === questId ? { ...q, completed: true } : q));
    });
  }, []);

  // Triggered when the user clicks "Samurai Honours" in the Navbar
  const handleSamuraiHonoursClick = useCallback(() => {
    if (!currentUser) {
      // Authenticate first before entering the Chapter V Samurai Honours page
      setIsSignupOpen(true);
    } else {
      // Already authenticated -> open the dedicated Chapter V Samurai Honours page
      setIsSamuraiHonoursPage(true);
      setActiveTab('gamification');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentUser]);

  const scrollToSection = useCallback((sectionId: SectionId | string) => {
    if (sectionId === 'gamification') {
      handleSamuraiHonoursClick();
      return;
    }

    const doScroll = () => {
      setActiveTab(sectionId as SectionId);
      if (sectionId === 'sanctuary') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(`section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (isSamuraiHonoursPage) {
      setIsSamuraiHonoursPage(false);
      setTimeout(doScroll, 60);
    } else {
      doScroll();
    }
  }, [handleSamuraiHonoursClick, isSamuraiHonoursPage]);

  // Track scroll position to highlight active nav link on the main page
  useEffect(() => {
    if (isSamuraiHonoursPage) return;
    const sections: SectionId[] = ['sanctuary', 'watchtower', 'scroll', 'lens', 'dashboard'];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight * 0.6) {
        setActiveTab('sanctuary');
        return;
      }
      for (let i = sections.length - 1; i >= 1; i--) {
        const id = sections[i];
        const el = document.getElementById(`section-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 240) {
            setActiveTab(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSamuraiHonoursPage]);

  const loadWeather = useCallback(() => {
    setIsLoadingWeather(true);
    setErrorMessage(null);
    fetchWeatherScore(selectedLocation, appMode)
      .then((data) => {
        setWeatherData(data);
        setIsLoadingWeather(false);
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Unable to update Open-Meteo weather forecast');
        setIsLoadingWeather(false);
      });
  }, [selectedLocation, appMode]);

  const loadMoonPhase = useCallback(() => {
    setIsLoadingMoon(true);
    setMoonError(null);
    fetchMoonPhaseData()
      .then((data) => {
        setMoonData(data);
        setIsLoadingMoon(false);
      })
      .catch((err) => {
        setMoonError(err.message || 'Unable to fetch US Naval Observatory Moon phase data');
        setIsLoadingMoon(false);
      });
  }, []);

  const loadCelestialEvents = useCallback(() => {
    setIsLoadingEvents(true);
    setEventsError(null);
    fetchCelestialEvents(appMode)
      .then((data) => {
        setEvents(data);
        setIsLoadingEvents(false);
      })
      .catch((err) => {
        setEventsError(err.message || 'Unable to fetch IMCCE lunar eclipse ephemeris');
        setIsLoadingEvents(false);
      });
  }, [appMode]);

  // Load weather when location or mode changes
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Load USNO Moon phases & IMCCE Lunar Eclipses on mount
  useEffect(() => {
    loadMoonPhase();
  }, [loadMoonPhase]);

  useEffect(() => {
    loadCelestialEvents();
  }, [loadCelestialEvents]);

  // Location chosen inside the Watchtower module -> sync Dojo + award quest XP
  const handleSelectLocation = useCallback((loc: LocationCoordinates) => {
    setSelectedLocation(loc);
    completeQuest('quest-sanctuary');
  }, [completeQuest]);

  return (
    <>
      {/* ── Atmosphere layers ── */}
      <div className="vignette-overlay" aria-hidden />
      <div className="grain-overlay" aria-hidden />

      {/* ── Gamified Quest Completion Toast ── */}
      {xpToast && (
        <div className="fixed bottom-6 right-6 z-[90] celestial-card border border-[#c9a24a] rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-[#c9a24a]/20 border border-[#c9a24a] flex items-center justify-center text-[#fce38a]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a24a] block">
              Mission Accomplished • +{xpToast.xp} Honor XP
            </span>
            <p className="font-celestial text-sm font-bold text-white">{xpToast.title}</p>
          </div>
        </div>
      )}

      {/* ── Sticky Navigation Bar ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={scrollToSection}
        appMode={appMode}
        setAppMode={setAppMode}
        xp={xp}
        isSamuraiHonoursPage={isSamuraiHonoursPage}
        currentUser={currentUser}
        onSamuraiHonoursClick={handleSamuraiHonoursClick}
      />

      {/* ── Samurai Stargazer Sign Up & Profile Modal ── */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setXp((curr) => Math.max(curr, user.honor));
          setIsSignupOpen(false);
          setIsSamuraiHonoursPage(true);
          setActiveTab('gamification');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSignOut={() => {
          localStorage.removeItem('tsukuyomi_user');
          setCurrentUser(null);
          setIsSamuraiHonoursPage(false);
          setActiveTab('sanctuary');
        }}
      />

      {/* ── NASA SkyView Virtual Observatory (Sky Lantern Lens) Sidecar Console ── */}
      <SkyLanternSideDrawer
        isOpen={isSkyLanternOpen}
        onOpenChange={setIsSkyLanternOpen}
        onAwardXp={(pts, title) => {
          setXp((curr) => curr + pts);
          setXpToast({ title, xp: pts });
          setTimeout(() => setXpToast(null), 4000);
        }}
      />

      {/* ── Transient Spectral & Time-Domain Divination Lab Sidecar Console ── */}
      <TransientSideDrawer
        isOpen={isTransientOpen}
        onOpenChange={setIsTransientOpen}
        onAwardXp={(pts, title) => {
          setXp((curr) => curr + pts);
          setXpToast({ title, xp: pts });
          setTimeout(() => setXpToast(null), 4000);
        }}
      />

      {/* ── Page Shell ── */}
      <div className="min-h-screen flex flex-col bg-[#05070a] bg-starfield text-[#dfe7e0] selection:bg-[#e0231c]/40 relative z-10">

        {isSamuraiHonoursPage && currentUser ? (
          /* ============================================================
              DEDICATED WEB PAGE: CHAPTER V — SAMURAI HONOURS (AUTH-GATED)
              ============================================================ */
          <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-10">
            {/* Authenticated Stargazer Control Bar */}
            <div className="celestial-card rounded-2xl p-4 sm:p-5 border border-[rgba(201,162,74,0.35)] bg-[#090d14]/90 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[rgba(201,162,74,0.15)] border border-[rgba(201,162,74,0.45)] flex items-center justify-center text-2xl shadow-inner">
                  {currentUser.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <UserCheck className="w-3 h-3" />
                      Authenticated Stargazer
                    </span>
                    <span className="text-[11px] font-mono text-[#c9a24a] font-bold">
                      {xp} Honor XP
                    </span>
                  </div>
                  <h2 className="font-celestial text-lg font-bold text-white mt-0.5">
                    {currentUser.name}{' '}
                    <span className="text-xs font-normal text-[#78837c]">
                      • {currentUser.location}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('watchtower')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[rgba(223,231,224,0.14)] text-xs font-medium text-[#dfe7e0] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#c9a24a]" />
                  <span>Return to Main Sanctuary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignupOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[rgba(201,162,74,0.14)] hover:bg-[rgba(201,162,74,0.24)] border border-[rgba(201,162,74,0.4)] text-xs font-semibold text-[#fce38a] transition-colors cursor-pointer"
                >
                  <span>Profile / Switch Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('tsukuyomi_user');
                    setCurrentUser(null);
                    setIsSamuraiHonoursPage(false);
                    setActiveTab('sanctuary');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e0231c]/15 hover:bg-[#e0231c]/30 border border-[#e0231c]/40 text-xs font-semibold text-[#ff7b72] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Chapter V Section Header */}
            <section id="section-gamification" className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                  CHAPTER V • 侍の誉れ
                </span>
                <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
                <span className="font-japanese text-xs text-[#c9a24a]">
                  Samurai Honours • Celestial Game &amp; Stargazer Registry
                </span>
              </div>

              <CelestialGamePage
                currentUser={currentUser}
                onOpenSignup={() => setIsSignupOpen(true)}
                onAddHonorXp={(pts) => {
                  setXp((curr) => curr + pts);
                  setXpToast({ title: 'Celestial Observation Verified', xp: pts });
                  setTimeout(() => setXpToast(null), 4000);
                }}
              />

              <SamuraiGamificationHub
                xp={xp}
                quests={quests}
                onCompleteQuest={completeQuest}
                onJumpToSection={scrollToSection}
              />
            </section>
          </main>
        ) : (
          <>
            {/* ============================================================
                SECTION 0: COMPLETE 3D KAGE TEMPLE LANDING PAGE EXPERIENCE
                ============================================================ */}
            <section id="section-sanctuary" className="relative w-full h-screen overflow-hidden border-b border-[rgba(201,162,74,0.25)]">
              <Scene onReachEnd={() => scrollToSection('watchtower')} />

              {/* Floating Bottom Scroll Bridge CTA */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
                <button
                  onClick={() => scrollToSection('watchtower')}
                  className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#05070a]/85 hover:bg-[#e0231c] text-[#dfe7e0] hover:text-white border border-[rgba(201,162,74,0.45)] hover:border-[#e0231c] backdrop-blur-md shadow-2xl transition-all duration-300 text-xs font-semibold tracking-wider uppercase cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a24a] group-hover:text-white" />
                  <span>Enter Watchtower &amp; Celestial Sanctuary</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </button>
              </div>
            </section>

            {/* ============================================================
                MAIN SCROLLABLE INTERACTIVE & GAMIFIED FUNCTIONALITIES
                ============================================================ */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-24">

              {/* ── SECTION 1: WATCHTOWER INTERACTIVE DARK-SKY MAP ── */}
              <section id="section-watchtower" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                    CHAPTER I • 望楼観測
                  </span>
                  <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
                  <span className="font-japanese text-xs text-[#c9a24a]">Watchtower Dark-Sky Sanctuary Map</span>
                </div>

                <WatchtowerModule
                  onLocationChosen={(loc) =>
                    handleSelectLocation({
                      name: loc.name,
                      country: loc.country,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      displayName: loc.displayName,
                    })
                  }
                />
              </section>

              {/* ── SECTION 2: CELESTIAL SCROLL (LAUNCHES & COSMIC EVENTS) ── */}
              <section id="section-scroll" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                    CHAPTER II • 星々の記録
                  </span>
                  <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
                  <span className="font-japanese text-xs text-[#c9a24a]">The Celestial Scroll</span>
                </div>

                <CelestialScrollPage
                  events={events}
                  onTrackEvent={() => completeQuest('quest-scroll')}
                />
              </section>

              {/* ── SECTION 3: SPIRIT LENS ASTROPHOTOGRAPHY ENHANCER ── */}
              <section id="section-lens" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                    CHAPTER III • 鏡花水月
                  </span>
                  <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
                  <span className="font-japanese text-xs text-[#c9a24a]">Spirit Lens Optical Enhancement</span>
                </div>

                <SpiritLensPage onEnhanceComplete={() => completeQuest('quest-lens')} />
              </section>

              {/* ── SECTION 4: DOJO COMMAND & NIGHT HONOR SCORE ── */}
              <section id="section-dashboard" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                    CHAPTER IV • 夜の誉れ
                  </span>
                  <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
                  <span className="font-japanese text-xs text-[#c9a24a]">Dojo Telemetry &amp; Night Honor Score</span>
                </div>

                <DashboardPage
                  weatherData={weatherData}
                  moonData={moonData}
                  events={events}
                  selectedLocation={selectedLocation}
                  onNavigate={scrollToSection}
                  appMode={appMode}
                  weatherError={errorMessage}
                  moonError={moonError}
                  eventsError={eventsError}
                  isLoadingMoon={isLoadingMoon}
                  isLoadingEvents={isLoadingEvents}
                  onRetryWeather={loadWeather}
                  onRetryMoon={loadMoonPhase}
                  onRetryEvents={loadCelestialEvents}
                />
              </section>
            </main>
          </>
        )}

        {/* ── Footer ── */}
        <footer className="mt-auto border-t border-[rgba(223,231,224,0.08)] bg-[#05070a]/95 py-10 text-xs text-[#78837c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/tsukuyomi-logo.jpg"
                alt="Tsukuyomi Watch badge"
                className="w-8 h-8 rounded-full object-cover border border-[rgba(201,162,74,0.4)] opacity-85"
              />
              <span className="font-japanese text-sm text-[#c9a24a]">月読命</span>
              <span className="font-celestial font-bold text-[#dfe7e0]">Tsukuyomi Watch</span>
              <span className="text-[#78837c]">|</span>
              <span>The Samurai's Celestial Companion</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px]">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#e0231c]" />
                Data integrity: Open-Meteo &amp; Launch Library 2
              </span>
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-[#c9a24a]" />
                OpenStreetMap Attribution
              </span>
              <button
                onClick={() => scrollToSection('sanctuary')}
                className="flex items-center gap-1 text-[#c9a24a] hover:underline cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Return to 3D Temple</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
