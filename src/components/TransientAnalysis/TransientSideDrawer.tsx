import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Radio,
  Flame,
  Activity,
  LineChart,
  BookOpen,
  Award,
  CheckCircle2,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  TransientEvent,
  TransientDetailResponse,
  TransientVerificationRecord,
} from '../../types/transient';
import {
  fetchTransientEvents,
  fetchTransientDetail,
  saveVerificationRecord,
  getSavedVerifications,
} from '../../lib/transientApi';
import { TimeDomainChart } from './TimeDomainChart';
import { SpectralAnalysisChart } from './SpectralAnalysisChart';
import { TransientEventFeed } from './TransientEventFeed';
import { TransientOmenLore } from './TransientOmenLore';

interface TransientSideDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAwardXp?: (points: number, reason: string) => void;
  onTrackTarget?: () => void;
}

type TabType = 'timedomain' | 'spectroscopy' | 'feed' | 'lore';

export const TransientSideDrawer: React.FC<TransientSideDrawerProps> = ({
  isOpen,
  onOpenChange,
  onAwardXp,
  onTrackTarget,
}) => {
  const [events, setEvents] = useState<TransientEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('sn1054-crab');
  const [detail, setDetail] = useState<TransientDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('timedomain');

  // Verification state
  const [verifiedList, setVerifiedList] = useState<string[]>([]);
  const [justVerified, setJustVerified] = useState<boolean>(false);

  // Load events list on mount
  useEffect(() => {
    fetchTransientEvents().then((evs) => {
      setEvents(evs);
    });
    const saved = getSavedVerifications();
    setVerifiedList(saved.map((s) => s.eventId));
  }, []);

  // Load selected event details
  const loadDetail = useCallback(async (eventId: string) => {
    setLoading(true);
    try {
      const data = await fetchTransientDetail(eventId);
      setDetail(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDetail(selectedEventId);
  }, [selectedEventId, loadDetail]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    if (activeTab === 'feed') {
      setActiveTab('timedomain');
    }
  };

  const handleVerifyEvent = () => {
    if (!detail) return;
    const isAlreadyVerified = verifiedList.includes(detail.event.id);
    if (isAlreadyVerified) return;

    const record: TransientVerificationRecord = {
      eventId: detail.event.id,
      eventName: detail.event.name,
      verifiedAt: new Date().toISOString(),
      dopplerVelocity: detail.event.expansionVelocityKmS,
      userNotes: 'Verified kinematic light curve and spectral line transitions.',
      honorPointsAwarded: 40,
    };

    saveVerificationRecord(record);
    setVerifiedList((prev) => [...prev, detail.event.id]);
    setJustVerified(true);
    setTimeout(() => setJustVerified(false), 3500);

    if (onAwardXp) {
      onAwardXp(40, `Transient Verified: ${detail.event.name} (客星認定)`);
    }
    if (onTrackTarget) {
      onTrackTarget();
    }
  };

  const isCurrentVerified = detail ? verifiedList.includes(detail.event.id) : false;

  return (
    <>
      {/* ── FLOATING TRIGGER TAB ON LEFT SCREEN EDGE ── */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => onOpenChange(true)}
          className="group relative flex items-center gap-2.5 px-3 py-3 rounded-r-2xl bg-[#0b0e14]/95 border-y border-r border-[#e0231c]/60 shadow-[0_0_25px_rgba(224,35,28,0.25)] hover:border-[#fce38a] hover:bg-[#121824] transition-all cursor-pointer backdrop-blur-md"
          title="Open Spectral & Time-Domain Transient Detector"
          aria-label="Open Transient Detector"
        >
          {/* Animated Pulsar Flare Indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e0231c] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e0231c]" />
          </span>

          <div className="flex flex-col items-start leading-none pr-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fce38a] flex items-center gap-1 font-mono">
              <Zap className="w-2.5 h-2.5 text-[#e0231c]" />
              客星検知
            </span>
            <span className="text-[11px] font-celestial font-bold text-white tracking-wider mt-0.5 group-hover:text-[#fce38a] transition-colors">
              Transient Lab
            </span>
          </div>
        </button>
      </div>

      {/* ── BACKDROP OVERLAY ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity animate-fadeIn"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* ── SLIDE-OUT POPUP DRAWER (LEFT SIDE) ── */}
      <div
        className={`fixed inset-y-0 left-0 w-full sm:w-[94vw] md:w-[86vw] lg:w-[74vw] max-w-5xl bg-[#080b10] border-r border-[rgba(201,162,74,0.3)] shadow-[10px_0_40px_rgba(0,0,0,0.85)] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Drawer Header ── */}
        <div className="p-4 sm:p-5 border-b border-[rgba(201,162,74,0.2)] bg-[#0d121c]/95 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e0231c]/30 to-[#c9a24a]/20 border border-[#c9a24a]/60 flex items-center justify-center text-[#fce38a] shadow-[0_0_15px_rgba(201,162,74,0.2)]">
              <Activity className="w-5 h-5 text-[#fce38a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#e0231c]/20 text-[#ff4b45] border border-[#e0231c]/40 font-bold">
                  TIME-DOMAIN &amp; SPECTRAL ANALYSIS
                </span>
                <span className="text-[10px] font-mono text-[#c9a24a]">ZTF / Palomar / GCN</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-celestial text-white tracking-wider flex items-center gap-2 mt-0.5">
                <span>The Guest Star Divination Sphere</span>
                <span className="font-japanese text-sm text-[#fce38a]">客星・天変観測儀</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Transient Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Subheader Target Summary & Tab Navigation ── */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#090d14] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {detail && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Target: {detail.event.name}
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                z = {detail.event.redshift}
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                v_exp: {detail.event.expansionVelocityKmS.toLocaleString()} km/s
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('timedomain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timedomain'
                  ? 'bg-[#c9a24a] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Light Curve (Time-Domain)</span>
            </button>

            <button
              onClick={() => setActiveTab('spectroscopy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'spectroscopy'
                  ? 'bg-[#c9a24a] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Spectroscopy &amp; Kinematics</span>
            </button>

            <button
              onClick={() => setActiveTab('lore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lore'
                  ? 'bg-[#c9a24a] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Meigetsuki Lore</span>
            </button>

            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-[#c9a24a] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Alert Candidates ({events.length})</span>
            </button>
          </div>
        </div>

        {/* ── Main Drawer Content Area ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#c9a24a] border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xs text-[#c9a24a] animate-pulse">
                Querying multi-epoch transient photometry and spectroscopic fluxes...
              </p>
            </div>
          ) : detail ? (
            <>
              {activeTab === 'timedomain' && (
                <TimeDomainChart timeDomain={detail.timeDomain} eventName={detail.event.name} />
              )}

              {activeTab === 'spectroscopy' && (
                <SpectralAnalysisChart
                  spectroscopy={detail.spectroscopy}
                  eventName={detail.event.name}
                />
              )}

              {activeTab === 'lore' && <TransientOmenLore event={detail.event} />}

              {activeTab === 'feed' && (
                <TransientEventFeed
                  events={events}
                  selectedEventId={selectedEventId}
                  onSelectEvent={handleSelectEvent}
                />
              )}
            </>
          ) : null}
        </div>

        {/* ── Drawer Footer with Gamification Stamp ── */}
        {detail && (
          <div className="p-4 sm:p-5 border-t border-[rgba(201,162,74,0.2)] bg-[#0d121c]/95 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
                <span className="text-gray-400 block text-[9px] uppercase">Classification</span>
                <span className="text-[#fce38a] font-bold">
                  {detail.classification.primaryClass}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
                <span className="text-gray-400 block text-[9px] uppercase">Confidence</span>
                <span className="text-emerald-400 font-bold">
                  {detail.classification.confidenceScore}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleVerifyEvent}
                disabled={isCurrentVerified}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  isCurrentVerified
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/50 cursor-default'
                    : 'bg-gradient-to-r from-[#e0231c] to-[#c9a24a] hover:from-[#ff3830] hover:to-[#ffd700] text-white shadow-[0_0_15px_rgba(224,35,28,0.3)] hover:scale-102'
                }`}
              >
                {isCurrentVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>VERIFIED GUEST STAR (客星認定済)</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>STAMP TRANSIENT VERIFICATION (+40 HONOR XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

