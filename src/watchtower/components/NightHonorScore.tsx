import { useEffect, useRef } from 'react';
import type { NightHonorScore as Score } from '../types';
import { Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  score: Score;
}

const LABEL_COLORS: Record<string, string> = {
  Legendary:     'text-emerald-400',
  Excellent:     'text-green-400',
  Good:          'text-lime-400',
  Fair:          'text-amber-400',
  Poor:          'text-orange-400',
  'Clouded Out': 'text-red-400',
};

const STROKE_COLORS: Record<string, string> = {
  Legendary:     '#34d399',
  Excellent:     '#4ade80',
  Good:          '#a3e635',
  Fair:          '#fbbf24',
  Poor:          '#fb923c',
  'Clouded Out': '#f87171',
};

const COMPONENT_COLORS: Record<string, string> = {
  'Clear-Sky':    '#74b9ff',
  'Visibility':   '#a29bfe',
  'Low-Humidity': '#55efc4',
  'Sky-Darkness': '#fd79a8',
};

function RadialGauge({ score, label }: { score: number; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const R = 70;
  const cx = 90, cy = 90;
  const circumference = 2 * Math.PI * R;
  const strokeColor = STROKE_COLORS[label] || '#d4af37';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr; canvas.height = 180 * dpr;
    canvas.style.width = '180px'; canvas.style.height = '180px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 180, 180);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI * 1.5);
    ctx.strokeStyle = 'rgba(212,175,55,0.1)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill arc — animate
    let progress = 0;
    const target = score / 100;
    const animate = () => {
      progress = Math.min(progress + 0.025, target);
      ctx.clearRect(0, 0, 180, 180);

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(212,175,55,0.1)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow
      ctx.shadowBlur = 16;
      ctx.shadowColor = strokeColor;

      // Fill
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (progress < target) requestAnimationFrame(animate);
    };
    animate();
  }, [score, label, strokeColor]);

  return (
    <div className="relative" style={{ width: 180, height: 180 }}>
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx('text-4xl font-wt-title font-bold leading-none', LABEL_COLORS[label] || 'text-wt-gold')}>
          {Math.round(score)}
        </span>
        <span className="text-wt-parchment/40 text-xs font-wt-title mt-0.5">/ 100</span>
        <span className={clsx('text-sm font-wt-title mt-1', LABEL_COLORS[label] || 'text-wt-gold')}>{label}</span>
      </div>
    </div>
  );
}

function ComponentBar({ comp }: { comp: Score['components'][0] }) {
  const color = COMPONENT_COLORS[comp.name] || '#d4af37';
  const fillPct = comp.available && comp.normalized != null ? comp.normalized * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="font-wt-title text-wt-parchment/70">{comp.name}</span>
          <span className="text-wt-parchment/30">({(comp.weight * 100).toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!comp.available && (
            <span className="text-amber-400/60 text-[10px] font-wt-title uppercase tracking-wider">N/A</span>
          )}
          {comp.contribution != null && (
            <span className="text-wt-parchment/50">{comp.contribution.toFixed(1)} pts</span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-wt-ink rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${fillPct}%`, background: color }}
        />
      </div>
      {comp.note && (
        <p className="text-wt-parchment/25 text-[10px] font-wt-serif italic">{comp.note}</p>
      )}
    </div>
  );
}

export default function NightHonorScorePanel({ score }: Props) {
  return (
    <div className="space-y-5 animate-wt-fadeIn">
      {/* Gauge + summary */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <RadialGauge score={score.score} label={score.label} />

        <div className="flex-1 space-y-3">
          {/* Confidence */}
          {score.confidence < 1 && (
            <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-lg p-3 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-400/80 font-wt-serif">
                Score confidence: {(score.confidence * 100).toFixed(0)}% —
                missing: {score.missing_components.join(', ')}. Score renormalized over available metrics.
              </span>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-wt-ink border border-wt-gold/10 rounded-xl p-4">
            <p className="text-xs font-wt-title uppercase tracking-widest text-wt-gold/50 mb-1.5">Recommendation</p>
            <p className="text-wt-parchment/80 font-wt-serif text-sm leading-relaxed">{score.recommendation}</p>
          </div>

          {/* Component bars */}
          <div className="bg-wt-ink border border-wt-gold/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-wt-title uppercase tracking-widest text-wt-gold/50">Score Breakdown</p>
            {score.components.map(c => (
              <ComponentBar key={c.name} comp={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-wt-parchment/25 font-wt-serif italic border-t border-wt-gold/10 pt-3">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-wt-gold/20" />
        <span>{score.disclaimer}</span>
      </div>
    </div>
  );
}
