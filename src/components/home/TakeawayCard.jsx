import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, TrendingDown, Target, Zap, Pencil, Check, X } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const PINK = '#C21875';

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

export default function TakeawayCard({ dailySales = [], budget = 0, onBudgetChange }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const monthData = dailySales
      .filter(d => d.date >= monthStart && d.date <= monthEnd && (d.total_takeaway || 0) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalSold = monthData.reduce((s, d) => s + (d.total_takeaway || 0), 0);
    const daysWithData = monthData.length;

    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const dailyAvg = daysWithData > 0 ? totalSold / daysWithData : 0;
    const projection = totalSold + (dailyAvg * daysRemaining);
    const compliance = budget > 0 ? (totalSold / budget) * 100 : null;
    const projCompliance = budget > 0 ? (projection / budget) * 100 : null;
    const expectedCompliance = (dayOfMonth / daysInMonth) * 100;
    const isOnTrack = compliance != null ? compliance >= (expectedCompliance - 5) : null;

    // Trend last 3 vs prev 3
    const last6 = [...dailySales]
      .filter(d => (d.total_takeaway || 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
    const recent3avg = last6.slice(0, 3).reduce((s, d) => s + (d.total_takeaway || 0), 0) / Math.max(last6.slice(0, 3).length, 1);
    const prev3avg = last6.slice(3, 6).reduce((s, d) => s + (d.total_takeaway || 0), 0) / Math.max(last6.slice(3, 6).length, 1);
    const trendPct = prev3avg > 0 ? ((recent3avg - prev3avg) / prev3avg) * 100 : null;

    // Sparkline: last 14 days of month
    const spark = [...dailySales]
      .filter(d => d.date >= monthStart)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map(d => d.total_takeaway || 0);

    const dailyNeeded = budget > 0 && daysRemaining > 0
      ? Math.max((budget - totalSold) / daysRemaining, 0) : null;

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, trendPct, spark,
      dailyNeeded, daysRemaining, daysInMonth, dayOfMonth,
      isOnTrack, expectedCompliance
    };
  }, [dailySales, budget]);

  const { compliance, projCompliance, trendPct, isOnTrack } = analysis;
  const trendUp = trendPct == null ? null : trendPct >= 0;

  // Status color: use pink palette always, adjust shade based on track
  const statusColor = isOnTrack === false ? '#e11d48' : isOnTrack === true ? '#10b981' : PINK;

  // Sparkline SVG — premium curved line
  const SparkLine = () => {
    const pts = analysis.spark;
    if (!pts || pts.length < 2) return null;
    const W = 220, H = 48;
    const padX = 4, padY = 6;
    const max = Math.max(...pts, 1);
    const min = Math.min(...pts.filter(v => v > 0), 0);
    const range = max - min || 1;
    const toX = (i) => padX + (i / (pts.length - 1)) * (W - padX * 2);
    const toY = (v) => H - padY - ((v - min) / range) * (H - padY * 2);
    const coords = pts.map((v, i) => [toX(i), toY(v)]);

    // Smooth bezier
    let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(i - 1, 0)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(i + 2, coords.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }

    const [lx, ly] = coords[coords.length - 1];
    const areaD = `${d} L${lx.toFixed(1)},${H} L${coords[0][0].toFixed(1)},${H} Z`;

    // Budget reference line
    const budgetY = budget > 0 ? toY(budget / analysis.daysInMonth) : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="twGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Budget daily target line */}
        {budgetY != null && (
          <line x1={padX} y1={budgetY} x2={W - padX} y2={budgetY}
            stroke={`${PINK}40`} strokeWidth="1" strokeDasharray="4 3" />
        )}
        <path d={areaD} fill="url(#twGrad)" />
        <path d={d} stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lx} cy={ly} r="3" fill={PINK} />
        <circle cx={lx} cy={ly} r="6" fill={PINK} opacity="0.15" />
      </svg>
    );
  };

  // Circular donut progress
  const DonutProgress = ({ pct, size = 52 }) => {
    const r = (size - 7) / 2;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(pct || 0, 100) / 100 * circ;
    const projFilled = Math.min(analysis.projCompliance || 0, 100) / 100 * circ;
    const color = isOnTrack === false ? '#e11d48' : isOnTrack === true ? '#10b981' : PINK;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${PINK}12`} strokeWidth="5.5" />
        {/* Projection (faint) */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`${color}25`} strokeWidth="5.5"
          strokeDasharray={`${projFilled} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        {/* Actual */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="5.5"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2 + 1} textAnchor="middle"
          style={{ fontSize: 9, fontWeight: 900, fill: color, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </text>
        <text x={size/2} y={size/2 + 10} textAnchor="middle"
          style={{ fontSize: 5.5, fontWeight: 600, fill: '#94a3b8', fontFamily: 'Inter Tight, Inter, sans-serif' }}>
          MES
        </text>
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl overflow-hidden mb-3"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px)',
        border: `1px solid ${PINK}18`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04), 0 0 0 0.5px ${PINK}10, inset 0 1px 0 rgba(255,255,255,1)`,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${PINK}, ${PINK}60, transparent)`,
        borderRadius: '9999px 9999px 0 0'
      }} />

      <div className="px-4 pt-4 pb-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${PINK}12`, border: `1px solid ${PINK}20` }}>
              <ShoppingBag style={{ width: 14, height: 14, color: PINK }} />
            </div>
            <div>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: `${PINK}80`, marginBottom: 2 }}>
                Producto para Llevar
              </p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
                  {fmt(analysis.totalSold)}
                </span>
                {trendPct != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 800, color: trendUp ? '#10b981' : '#e11d48' }}>
                    {trendUp ? <TrendingUp style={{ width: 10, height: 10 }} /> : <TrendingDown style={{ width: 10, height: 10 }} />}
                    {Math.abs(trendPct).toFixed(1)}%
                  </span>
                )}
              </div>
              <p style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500, marginTop: 1 }}>
                {analysis.daysWithData}d registrados · prom {fmt(analysis.dailyAvg)}/día
              </p>
            </div>
          </div>
          <DonutProgress pct={compliance} />
        </div>

        {/* KPI chips row */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* Proyección */}
          <div className="rounded-xl px-2.5 py-2 flex flex-col gap-0.5"
            style={{ background: `${PINK}08`, border: `1px solid ${PINK}14` }}>
            <div className="flex items-center gap-1">
              <Zap style={{ width: 8, height: 8, color: PINK }} />
              <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${PINK}70` }}>Proyección</p>
            </div>
            <p style={{ fontSize: 13, fontWeight: 900, color: PINK, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
              {fmt(analysis.projection)}
            </p>
            {projCompliance != null && (
              <p style={{ fontSize: 7, color: projCompliance >= 100 ? '#10b981' : projCompliance >= 80 ? '#f59e0b' : '#e11d48', fontWeight: 700 }}>
                {projCompliance.toFixed(0)}% del PPT
              </p>
            )}
          </div>

          {/* Meta diaria necesaria */}
          <div className="rounded-xl px-2.5 py-2 flex flex-col gap-0.5"
            style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-1">
              <Target style={{ width: 8, height: 8, color: '#64748b' }} />
              <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Meta/día req.</p>
            </div>
            <p style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
              {budget > 0 && analysis.dailyNeeded != null ? fmt(analysis.dailyNeeded) : fmt(analysis.dailyAvg)}
            </p>
            <p style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600 }}>
              {analysis.daysRemaining}d restantes
            </p>
          </div>

          {/* Status */}
          <div className="rounded-xl px-2.5 py-2 flex flex-col gap-0.5"
            style={{
              background: isOnTrack === false ? 'rgba(225,29,72,0.06)' : isOnTrack === true ? 'rgba(16,185,129,0.06)' : `${PINK}08`,
              border: `1px solid ${isOnTrack === false ? 'rgba(225,29,72,0.14)' : isOnTrack === true ? 'rgba(16,185,129,0.14)' : `${PINK}14`}`
            }}>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Estado</p>
            <p style={{ fontSize: 11, fontWeight: 900, color: statusColor, lineHeight: 1.2, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
              {isOnTrack === null ? '—' : isOnTrack ? '✅ Al ritmo' : '⚠️ Rezagado'}
            </p>
            {compliance != null && (
              <p style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600 }}>
                esp. {analysis.expectedCompliance.toFixed(0)}%
              </p>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div style={{ height: 48, marginBottom: 8 }}>
          <SparkLine />
        </div>

        {/* Budget progress bar + edit */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            {editingBudget ? (
              <div className="flex items-center gap-1.5 flex-1 mr-2" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  type="number"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  placeholder="PPT del mes..."
                  style={{
                    flex: 1, fontSize: 10, fontWeight: 600, color: '#374151',
                    border: `1px solid ${PINK}40`, borderRadius: 6, padding: '2px 6px',
                    outline: 'none', background: 'white', height: 22,
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }
                    if (e.key === 'Escape') setEditingBudget(false);
                  }}
                />
                <button onClick={() => { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }}
                  style={{ color: '#10b981', cursor: 'pointer', display: 'flex', padding: 2 }}>
                  <Check style={{ width: 12, height: 12 }} />
                </button>
                <button onClick={() => setEditingBudget(false)}
                  style={{ color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 2 }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5"
                onClick={e => { e.stopPropagation(); setBudgetInput(budget > 0 ? String(budget) : ''); setEditingBudget(true); }}
              >
                <span style={{ fontSize: 7.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>
                  {budget > 0 ? `PPT MES ${fmt(budget)}` : '+ Agregar PPT del mes'}
                </span>
                <Pencil style={{ width: 8, height: 8, color: '#cbd5e1' }} />
              </button>
            )}
            {!editingBudget && compliance != null && (
              <span style={{ fontSize: 8, fontWeight: 800, color: statusColor }}>
                {compliance.toFixed(1)}% acumulado
              </span>
            )}
          </div>
          {budget > 0 && (
            <div style={{ height: 5, borderRadius: 9999, background: `${PINK}12`, overflow: 'hidden', position: 'relative' }}>
              {/* Projection bar (faint) */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${Math.min(analysis.projCompliance || 0, 100)}%`,
                background: `${PINK}25`, borderRadius: 9999
              }} />
              {/* Actual bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(compliance || 0, 100)}%` }}
                transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  background: `linear-gradient(90deg, ${PINK}, ${PINK}80)`,
                  borderRadius: 9999
                }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}