import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  Sparkles,
  CheckCircle2,
  Circle,
  Compass,
  Shield,
  Eye,
  Award,
  Sliders,
  HelpCircle,
  Zap,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { calculateNightHonorScore } from '../lib/scoreCalculator';

export interface QuestItem {
  id: string;
  title: string;
  jpTitle: string;
  description: string;
  xp: number;
  completed: boolean;
  targetSection: string;
}

interface SamuraiGamificationHubProps {
  xp: number;
  quests: QuestItem[];
  onCompleteQuest: (questId: string) => void;
  onJumpToSection: (sectionId: string) => void;
}

const RANKS = [
  { level: 1, title: 'Ronin of the Mist', jp: '霧の浪人', minXp: 0, maxXp: 200 },
  { level: 2, title: 'Gatekeeper of Sanmon', jp: '山門の番人', minXp: 200, maxXp: 450 },
  { level: 3, title: 'Lantern Watcher', jp: '灯籠の観測者', minXp: 450, maxXp: 700 },
  { level: 4, title: 'Astral Samurai', jp: '星海の侍', minXp: 700, maxXp: 950 },
  { level: 5, title: 'Shogun of Tsukuyomi', jp: '月読の将軍', minXp: 950, maxXp: 1200 },
];

const QUIZ_QUESTIONS = [
  {
    q: 'Why does the Full Moon turn vermilion-red during a total lunar eclipse ("Blood Moon")?',
    options: [
      'Rayleigh scattering filters blue light through Earth’s atmosphere, bending red wavelengths onto the Moon',
      'Solar flares reflect directly off lunar basalt seas',
      'Volcanic ash in the upper stratosphere tints the lunar surface',
    ],
    correct: 0,
    fact: 'Correct! Every sunrise and sunset on Earth projects into Earth’s umbral shadow onto the Moon.',
  },
  {
    q: 'In astrophotography ("Spirit Lens"), why do we use deterministic CLAHE instead of generative AI?',
    options: [
      'Generative AI uses too much battery in cold mountain temples',
      'CLAHE amplifies real recorded photon contrast locally without hallucinating fake stars or nebulae',
      'CLAHE automatically adds synthetic diffraction spikes to bright stars',
    ],
    correct: 1,
    fact: 'Spot on! Scientific integrity means never inventing photons that your sensor did not capture.',
  },
  {
    q: 'Which atmospheric condition carries the highest weight (45%) in the Night Honor Score?',
    options: [
      'Wind speed at ground level',
      'Cloud Clearness (100 - Cloud Cover %)',
      'Barometric pressure trend',
    ],
    correct: 1,
    fact: 'Masterful! Without clear skies, even a Bortle 1 sanctuary cannot reveal the cosmos.',
  },
];

export const SamuraiGamificationHub: React.FC<SamuraiGamificationHubProps> = ({
  xp,
  quests,
  onCompleteQuest,
  onJumpToSection,
}) => {
  // Simulator state
  const [simCloud, setSimCloud] = useState(12);
  const [simHumidity, setSimHumidity] = useState(38);
  const [simVisibility, setSimVisibility] = useState(24);
  const [simDarkness, setSimDarkness] = useState<number | null>(92);

  // Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentRank =
    [...RANKS].reverse().find((r) => xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find((r) => r.level === currentRank.level + 1);
  const progressPct = nextRank
    ? Math.min(
        100,
        Math.round(
          ((xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) *
            100
        )
      )
    : 100;

  const simResult = calculateNightHonorScore({
    clearSky: Math.max(0, 100 - simCloud),
    visibility: Math.round((simVisibility / 24) * 100),
    humidity: Math.max(0, 100 - simHumidity),
    darkness: simDarkness,
  });

  const handleSliderChange = (setter: (v: number) => void, val: number) => {
    setter(val);
    onCompleteQuest('quest-formula');
  };

  const handleSelectQuizOption = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const isRight = idx === QUIZ_QUESTIONS[quizStep].correct;
    if (isRight) {
      setQuizCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuiz = () => {
    if (quizStep + 1 < QUIZ_QUESTIONS.length) {
      setQuizStep((s) => s + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      onCompleteQuest('quest-quiz');
    }
  };

  const handleResetQuiz = () => {
    setQuizStep(0);
    setSelectedAnswer(null);
    setQuizCorrectCount(0);
    setQuizFinished(false);
  };

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="space-y-8">
      {/* ── Top Gamified Samurai Rank & XP Banner ── */}
      <div className="celestial-card rounded-3xl p-6 sm:p-8 border border-[rgba(201,162,74,0.35)] relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(224,35,28,0.18) 0%, rgba(201,162,74,0.08) 50%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Rank Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e0231c] to-[#7c1610] p-0.5 shadow-xl shadow-[rgba(224,35,28,0.3)] shrink-0">
              <div className="w-full h-full bg-[#05070a] rounded-[14px] flex flex-col items-center justify-center">
                <span className="font-japanese text-xs text-[#e0231c] leading-none">
                  階級
                </span>
                <span className="font-celestial text-xl font-black text-[#c9a24a]">
                  L{currentRank.level}
                </span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-vermilion text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Samurai Stargazer Progression
                </span>
                <span className="font-japanese text-xs text-[#c9a24a]">
                  {currentRank.jp}
                </span>
              </div>
              <h2 className="font-celestial text-2xl sm:text-3xl font-bold text-[#dfe7e0] mt-1">
                {currentRank.title}
              </h2>
              <p className="text-xs text-[#aab4ad] mt-0.5">
                Complete celestial missions below to ascend the ranks of Tsukuyomi Watch.
              </p>
            </div>
          </div>

          {/* Right: XP Progress Bar & Seal Count */}
          <div className="flex-1 max-w-md w-full bg-[#05070a]/80 border border-[rgba(223,231,224,0.1)] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#c9a24a]">
                <Flame className="w-4 h-4 text-[#e0231c] animate-pulse" />
                <span>{xp} Honor XP</span>
              </span>
              <span className="text-[#78837c]">
                {nextRank
                  ? `Next: ${nextRank.title} (${nextRank.minXp} XP)`
                  : 'MAX RANK ACHIEVED'}
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#0a0e12] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#e0231c] via-[#ff5a3c] to-[#c9a24a] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#aab4ad]">
              <span>
                Missions Completed: <b className="text-white">{completedCount}/{quests.length}</b>
              </span>
              <span className="flex items-center gap-1 text-[#c9a24a]">
                <Award className="w-3.5 h-3.5" />
                <span>{completedCount} Sacred Seals Earned</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-Column Gamified Command Grid: Quests + Simulator + Blood Moon Trial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Night Quests (5 cols) */}
        <div className="lg:col-span-5 celestial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#e0231c]">
                任務 • ACTIVE NIGHT QUESTS
              </span>
              <span className="text-xs font-semibold text-[#c9a24a]">
                +{quests.reduce((acc, q) => acc + q.xp, 0)} Total XP
              </span>
            </div>
            <h3 className="font-celestial text-lg font-bold text-[#dfe7e0]">
              The Five Trials of the Night Watch
            </h3>
          </div>

          <div className="space-y-2.5">
            {quests.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  onJumpToSection(q.targetSection);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                  q.completed
                    ? 'bg-[rgba(201,162,74,0.08)] border-[rgba(201,162,74,0.35)]'
                    : 'bg-[#05070a]/70 border-[rgba(223,231,224,0.08)] hover:border-[rgba(224,35,28,0.45)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {q.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#c9a24a] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#78837c] group-hover:text-[#e0231c] shrink-0 mt-0.5 transition-colors" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          q.completed
                            ? 'text-[#c9a24a] line-through'
                            : 'text-[#dfe7e0] group-hover:text-white'
                        }`}
                      >
                        {q.title}
                      </span>
                      <span className="font-japanese text-[10px] text-[#78837c]">
                        {q.jpTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78837c] mt-0.5">
                      {q.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      q.completed
                        ? 'bg-[#c9a24a]/20 text-[#fce38a]'
                        : 'bg-[#e0231c]/15 text-[#ff5a3c]'
                    }`}
                  >
                    +{q.xp} XP
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#78837c] group-hover:translate-x-0.5 transition-transform mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Interactive "What-If" Atmospheric Simulator (4 cols) */}
        <div className="lg:col-span-4 celestial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a24a] flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>LIVE HEURISTIC SANDBOX</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#aab4ad]">
                Interactive
              </span>
            </div>
            <h3 className="font-celestial text-lg font-bold text-[#dfe7e0] mt-1">
              Atmospheric Score Simulator
            </h3>
            <p className="text-xs text-[#78837c] mt-0.5">
              Drag the sliders to test how cloud cover, humidity, visibility, and darkness shift the Night Honor Score.
            </p>
          </div>

          {/* Simulated Score Readout */}
          <div className="bg-[#05070a]/90 border border-[rgba(223,231,224,0.1)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#78837c] block">
                Simulated Honor Score
              </span>
              <span className="font-celestial text-3xl font-black text-[#c9a24a]">
                {simResult.score}
                <small className="text-xs font-normal text-[#78837c]">/100</small>
              </span>
            </div>
            <div className="text-right">
              <span className="badge-gold text-[10px] font-semibold px-2.5 py-1 rounded-full inline-block">
                {simResult.verdict}
              </span>
              <span className="block text-[10px] text-[#78837c] mt-1">
                {simResult.label}
              </span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#aab4ad]">Cloud Cover (Weight 45%)</span>
                <b className="text-white">{simCloud}%</b>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={simCloud}
                onChange={(e) => handleSliderChange(setSimCloud, Number(e.target.value))}
                className="w-full accent-[#e0231c] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#aab4ad]">Relative Humidity (Weight 20%)</span>
                <b className="text-white">{simHumidity}%</b>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={simHumidity}
                onChange={(e) => handleSliderChange(setSimHumidity, Number(e.target.value))}
                className="w-full accent-[#c9a24a] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#aab4ad]">Visibility Range (Weight 20%)</span>
                <b className="text-white">{simVisibility} km</b>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={simVisibility}
                onChange={(e) => handleSliderChange(setSimVisibility, Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#aab4ad]">Sanctuary Darkness (Weight 15%)</span>
                <b className="text-white">{simDarkness ?? 85}/100</b>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={simDarkness ?? 85}
                onChange={(e) =>
                  handleSliderChange((v) => setSimDarkness(v), Number(e.target.value))
                }
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Trial of the Blood Moon Quiz (3 cols) */}
        <div className="lg:col-span-3 celestial-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5a3c] flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>SAMURAI LORE TRIAL</span>
              </span>
              <span className="text-[10px] text-[#c9a24a] font-bold">+250 XP</span>
            </div>
            <h3 className="font-celestial text-lg font-bold text-[#dfe7e0] mt-1">
              Trial of the Blood Moon
            </h3>
          </div>

          {!quizFinished ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#78837c]">
                  <span>Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span>Score: {quizCorrectCount}</span>
                </div>
                <p className="text-xs font-medium text-[#dfe7e0] leading-relaxed">
                  {QUIZ_QUESTIONS[quizStep].q}
                </p>
              </div>

              <div className="space-y-2">
                {QUIZ_QUESTIONS[quizStep].options.map((opt, idx) => {
                  const isChosen = selectedAnswer === idx;
                  const isCorrect = idx === QUIZ_QUESTIONS[quizStep].correct;
                  let btnCls =
                    'bg-[#05070a]/70 border-[rgba(223,231,224,0.1)] text-[#aab4ad] hover:border-[#c9a24a]/50 hover:text-white';
                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      btnCls =
                        'bg-emerald-950/60 border-emerald-500/60 text-emerald-200';
                    } else if (isChosen) {
                      btnCls = 'bg-red-950/60 border-red-500/60 text-red-200';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizOption(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border text-[11px] leading-snug transition-all cursor-pointer ${btnCls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-[#c9a24a] bg-[rgba(201,162,74,0.1)] border border-[rgba(201,162,74,0.25)] rounded-lg p-2">
                    {QUIZ_QUESTIONS[quizStep].fact}
                  </p>
                  <button
                    onClick={handleNextQuiz}
                    className="w-full py-2 rounded-xl bg-[#e0231c] hover:bg-[#ff5a3c] text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    {quizStep + 1 < QUIZ_QUESTIONS.length
                      ? 'Next Question →'
                      : 'Complete Trial & Claim +250 XP'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-4">
              <div className="w-14 h-14 rounded-full bg-[rgba(201,162,74,0.15)] border border-[#c9a24a] flex items-center justify-center text-[#c9a24a]">
                <Trophy className="w-7 h-7" />
              </div>
              <h4 className="font-celestial text-base font-bold text-white">
                Trial Completed! ({quizCorrectCount}/{QUIZ_QUESTIONS.length})
              </h4>
              <p className="text-xs text-[#aab4ad]">
                You have unlocked the <b className="text-[#c9a24a]">Seal of the Vermilion Moon</b> and earned +250 Honor XP.
              </p>
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 text-xs text-[#c9a24a] hover:underline pt-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Trial</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
