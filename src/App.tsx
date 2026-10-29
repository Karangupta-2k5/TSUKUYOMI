import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, SectionId } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import WatchtowerModule from './watchtower/WatchtowerModule';
import { CelestialScrollPage } from './pages/CelestialScrollPage';
import { SpiritLensPage } from './pages/SpiritLensPage';
import { Scene } from './components/Scene';
import { SamuraiGamificationHub, QuestItem } from './components/SamuraiGamificationHub';
import { AppMode, LocationCoordinates, WeatherScoreResponse, CelestialEvent } from './types';
import { CANDIDATE_LOCATIONS, MOCK_WEATHER_SCORE, MOCK_MOON_PHASE, MOCK_CELESTIAL_EVENTS } from './data/mockData';
import { fetchWeatherScore, fetchCelestialEvents } from './lib/api';
import { Moon, Shield, ChevronDown, Trophy, Sparkles, ArrowUp } from 'lucide-react';

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
  const [events, setEvents] = useState<CelestialEvent[]>(MOCK_CELESTIAL_EVENTS);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gamification State
  const [quests, setQuests] = useState<QuestItem[]>(INITIAL_QUESTS);
  const [xp, setXp] = useState<number>(120); // Starting base XP
  const [xpToast, setXpToast] = useState<{ title: string; xp: number } | null>(null);

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

  const scrollToSection = useCallback((sectionId: SectionId | string) => {
    setActiveTab(sectionId as SectionId);
    if (sectionId === 'sanctuary') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Track scroll position to highlight active nav link
  useEffect(() => {
    const sections: SectionId[] = ['sanctuary', 'gamification', 'dashboard', 'watchtower', 'scroll', 'lens'];
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
  }, []);

  // Load weather when location or mode changes
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingWeather(true);
    setErrorMessage(null);

    fetchWeatherScore(selectedLocation, appMode)
      .then((data) => {
        if (isSubscribed) {
          setWeatherData(data);
          setIsLoadingWeather(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setErrorMessage(err.message || 'Unable to update weather observations');
          setIsLoadingWeather(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedLocation, appMode]);

  // Load events
  useEffect(() => {
    fetchCelestialEvents(appMode).then(setEvents);
  }, [appMode]);

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
      />

      {/* ── Page Shell ── */}
      <div className="min-h-screen flex flex-col bg-[#05070a] bg-starfield text-[#dfe7e0] selection:bg-[#e0231c]/40 relative z-10">

        {/* ============================================================
            SECTION 0: COMPLETE 3D KAGE TEMPLE LANDING PAGE EXPERIENCE
            ============================================================ */}
        <section id="section-sanctuary" className="relative w-full h-screen overflow-hidden border-b border-[rgba(201,162,74,0.25)]">
          <Scene onReachEnd={() => scrollToSection('gamification')} />

          {/* Floating Bottom Scroll Bridge CTA */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            <button
              onClick={() => scrollToSection('gamification')}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#05070a]/85 hover:bg-[#e0231c] text-[#dfe7e0] hover:text-white border border-[rgba(201,162,74,0.45)] hover:border-[#e0231c] backdrop-blur-md shadow-2xl transition-all duration-300 text-xs font-semibold tracking-wider uppercase cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c9a24a] group-hover:text-white" />
              <span>Enter Interactive Dojo &amp; Samurai Missions</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </section>

        {/* ============================================================
            MAIN SCROLLABLE INTERACTIVE & GAMIFIED FUNCTIONALITIES
            ============================================================ */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-24">

          {/* ── SECTION 1: SAMURAI GAMIFICATION HUB, QUESTS, SIMULATOR & QUIZ ── */}
          <section id="section-gamification" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                CHAPTER I • 侍の試練
              </span>
              <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
              <span className="font-japanese text-xs text-[#c9a24a]">Samurai Stargazer Command</span>
            </div>

            <SamuraiGamificationHub
              xp={xp}
              quests={quests}
              onCompleteQuest={completeQuest}
              onJumpToSection={scrollToSection}
            />
          </section>

          {/* ── SECTION 2: DOJO COMMAND & NIGHT HONOR SCORE ── */}
          <section id="section-dashboard" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                CHAPTER II • 夜の誉れ
              </span>
              <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
              <span className="font-japanese text-xs text-[#c9a24a]">Dojo Telemetry &amp; Night Honor Score</span>
            </div>

            <DashboardPage
              weatherData={weatherData}
              moonData={MOCK_MOON_PHASE}
              events={events}
              selectedLocation={selectedLocation}
              onNavigate={scrollToSection}
              appMode={appMode}
            />
          </section>

          {/* ── SECTION 3: WATCHTOWER INTERACTIVE DARK-SKY MAP ── */}
          <section id="section-watchtower" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                CHAPTER III • 望楼観測
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

          {/* ── SECTION 4: CELESTIAL SCROLL (LAUNCHES & COSMIC EVENTS) ── */}
          <section id="section-scroll" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                CHAPTER IV • 星々の記録
              </span>
              <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
              <span className="font-japanese text-xs text-[#c9a24a]">The Celestial Scroll</span>
            </div>

            <CelestialScrollPage
              events={events}
              onTrackEvent={() => completeQuest('quest-scroll')}
            />
          </section>

          {/* ── SECTION 5: SPIRIT LENS ASTROPHOTOGRAPHY ENHANCER ── */}
          <section id="section-lens" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#e0231c]">
                CHAPTER V • 鏡花水月
              </span>
              <div className="flex-1 h-px bg-[rgba(223,231,224,0.1)]" />
              <span className="font-japanese text-xs text-[#c9a24a]">Spirit Lens Optical Enhancement</span>
            </div>

            <SpiritLensPage onEnhanceComplete={() => completeQuest('quest-lens')} />
          </section>
        </main>

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
