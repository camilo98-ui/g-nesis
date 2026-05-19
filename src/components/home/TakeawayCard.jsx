import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, ChevronUp, Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

const PINK = '#C21875';
const PINK_SOFT = 'rgba(194,24,117,0.07)';
const PINK_MID = 'rgba(194,24,117,0.16)';
const PINK_LIGHT = '#fce7f3';

function fmt(val) {
  if (val == null || isNaN(val)) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

// ── Arc Progress Ring ──
function ArcRing({ pct, size = 58 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const safe = Math.min(Math.max(pct || 0, 0), 100);
  const filled = safe / 100 * circ;
  const color = safe >= 100 ? '#10b981' : safe >= 60 ? PINK : '#f59e0b';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}22`} strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
      strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
      transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
      style={{ fontSize: 10, fontWeight: 900, fill: color, fontFamily: 'Inter Tight, sans-serif' }}>
        {pct != null ? `${Math.round(pct)}%` : '—'}
      </text>
    </svg>);

}

// ── KPI Stat Card ──
function StatCard({ label, value, sub, subColor, highlight, last }) {
  return (
    <div style={{
      flex: 1,
      padding: '14px 18px',
      borderRight: last ? 'none' : `1px solid ${PINK_MID}`,
      background: highlight ? 'rgba(194,24,117,0.04)' : '#ffffff',
      position: 'relative'
    }}>
      {highlight &&
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${PINK}, rgba(194,24,117,0.3))`,
        borderRadius: '0 0 2px 2px'
      }} />
      }
      <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>{label}</p>
      <p style={{
        fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
        fontFamily: 'Inter Tight, sans-serif',
        color: highlight ? PINK : '#1e293b'
      }}>{value}</p>
      {sub && <p style={{ fontSize: 9.5, marginTop: 5, fontWeight: 600, color: subColor || '#94a3b8' }}>{sub}</p>}
    </div>);

}

// ── Main Chart ──
function RichBarChart({ pts, dailyAvg, budget, daysInMonth, projection }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const W = 580,H = 200;
  const PAD_L = 48,PAD_R = 46,PAD_T = 20,PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || !pts || pts.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * W;
    const relX = svgX - PAD_L;
    const idx = Math.round(relX / chartW * pts.length - 0.5);
    if (idx >= 0 && idx < pts.length) setHovered(idx);else
    setHovered(null);
  }, [pts]);

  if (!pts || pts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 170, color: '#e2e8f0', fontSize: 11 }}>
        Sin datos este mes
      </div>);

  }

  const metaDaily = budget > 0 ? budget / daysInMonth : null;
  // When no budget, show projection-per-day as reference line (green)
  const projDaily = (!budget || budget === 0) && projection > 0 ? projection / daysInMonth : null;
  // Use only actual bar values for scale (not projection), so bars fill the chart well
  const barMax = Math.max(...pts.map((p) => p.value).filter((v) => v > 0), 1);
  const lineMax = Math.max(metaDaily || 0, projDaily || 0, dailyAvg || 0, 0);
  // Give 20% headroom above the tallest bar; lines can go slightly above if needed
  const topVal = Math.max(barMax * 1.2, lineMax * 1.05);
  const maxVal = topVal;

  const xOf = (i) => PAD_L + (i + 0.5) / pts.length * chartW;
  const yOf = (v) => PAD_T + chartH - Math.max(0, Math.min(v / maxVal, 1)) * chartH;

  const barW = Math.max(4, chartW / pts.length - 2);
  const maxIdx = pts.reduce((mi, p, i, a) => p.value > a[mi].value ? i : mi, 0);

  const curvePts = pts.map((p, i) => [xOf(i), yOf(p.value)]);
  const smoothPath = curvePts.length > 1 ?
  curvePts.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
    const prev = arr[i - 1];
    const cpx = (prev[0] + pt[0]) / 2;
    return acc + ` C${cpx.toFixed(1)},${prev[1].toFixed(1)} ${cpx.toFixed(1)},${pt[1].toFixed(1)} ${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
  }, '') :
  '';

  const areaPath = smoothPath ?
  `${smoothPath} L${curvePts[curvePts.length - 1][0]},${PAD_T + chartH} L${curvePts[0][0]},${PAD_T + chartH} Z` :
  '';

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: maxVal * f, y: yOf(maxVal * f) }));

  const tooltip = hovered != null && pts[hovered] ? pts[hovered] : null;

  return (
    <div style={{ position: 'relative' }}
    onMouseLeave={() => setHovered(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} fill="none"
      style={{ width: '100%', height: 'auto', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}>
        <defs>
          <linearGradient id="taBG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.13" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="taBarHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.95" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="taBarHov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.65" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="taBarNorm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.32" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.1" />
          </linearGradient>
          <filter id="taGlow2" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y grid */}
        {yLabels.map((l, i) =>
        <g key={i}>
            <line x1={PAD_L} y1={l.y} x2={W - PAD_R} y2={l.y}
          stroke="rgba(0,0,0,0.05)" strokeWidth="1"
          strokeDasharray={i === 0 ? undefined : '3 3'} />
            <text x={PAD_L - 5} y={l.y + 3} textAnchor="end"
          style={{ fontSize: 7.5, fill: '#b0bec5', fontFamily: 'Inter Tight, sans-serif' }}>
              {fmt(l.v)}
            </text>
          </g>
        )}

        {/* META line — green dashed */}
        {metaDaily != null && metaDaily > 0 && (() => {
          const my = yOf(metaDaily);
          return (
            <>
              <line x1={PAD_L} y1={my} x2={W - PAD_R} y2={my}
              stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.7" />
              <rect x={W - PAD_R + 2} y={my - 7} width={30} height={12} rx="3" fill="rgba(16,185,129,0.12)" />
              <text x={W - PAD_R + 17} y={my + 3.5} textAnchor="middle"
              style={{ fontSize: 7.5, fill: '#10b981', fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
                META
              </text>
            </>);

        })()}

        {/* PROJ line — green dashed (when no budget) */}
        {projDaily != null && projDaily > 0 && (() => {
          const py = yOf(projDaily);
          return (
            <>
              <line x1={PAD_L} y1={py} x2={W - PAD_R} y2={py}
              stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.75" />
              <rect x={W - PAD_R + 2} y={py - 7} width={34} height={12} rx="3" fill="rgba(16,185,129,0.12)" />
              <text x={W - PAD_R + 19} y={py + 3.5} textAnchor="middle"
              style={{ fontSize: 7.5, fill: '#10b981', fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
                PROY
              </text>
            </>);

        })()}

        {/* AVG line — pink dashed */}
        {dailyAvg > 0 && (() => {
          const ay = yOf(dailyAvg);
          return (
            <>
              <line x1={PAD_L} y1={ay} x2={W - PAD_R} y2={ay}
              stroke={PINK} strokeWidth="1.2" strokeDasharray="6 4" strokeOpacity="0.5" />
              <rect x={W - PAD_R + 2} y={ay - 7} width={24} height={12} rx="3" fill={`${PINK}15`} />
              <text x={W - PAD_R + 14} y={ay + 3.5} textAnchor="middle"
              style={{ fontSize: 7.5, fill: PINK, fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
                AVG
              </text>
            </>);

        })()}

        {/* Hover column highlight */}
        {hovered != null &&
        <rect
          x={PAD_L + hovered / pts.length * chartW}
          y={PAD_T}
          width={chartW / pts.length}
          height={chartH}
          fill="rgba(194,24,117,0.04)"
          rx="2" />

        }

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#taBG2)" />}

        {/* Bars */}
        {pts.map((p, i) => {
          if (p.value === 0) return null;
          const bh = Math.max(p.value / maxVal * chartH, 5);
          const bx = PAD_L + i / pts.length * chartW + (chartW / pts.length - barW) / 2;
          const by = PAD_T + chartH - bh;
          const isTop = i === maxIdx;
          const isHov = i === hovered;
          return (
            <rect key={i} x={bx} y={by} width={barW} height={bh} rx="3"
            fill={isTop ? 'url(#taBarHigh)' : isHov ? 'url(#taBarHov)' : 'url(#taBarNorm)'}
            filter={isTop ? 'url(#taGlow2)' : undefined} />);


        })}

        {/* Curve line */}
        {smoothPath &&
        <path d={smoothPath} stroke={PINK} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        strokeOpacity="0.45" fill="none" />
        }

        {/* Permanent best-day label */}
        {maxIdx >= 0 && pts[maxIdx]?.value > 0 && hovered !== maxIdx && (() => {
          const tx = xOf(maxIdx);
          const ty = yOf(pts[maxIdx].value);
          const label = fmt(pts[maxIdx].value);
          const bw = label.length * 5.8 + 14;
          return (
            <g>
              <line x1={tx} y1={ty} x2={tx} y2={PAD_T + chartH}
              stroke={PINK} strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 2" />
              <rect x={tx - bw / 2} y={ty - 20} width={bw} height={16} rx="5" fill={PINK} />
              <text x={tx} y={ty - 8} textAnchor="middle"
              style={{ fontSize: 8.5, fill: 'white', fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
                {label}
              </text>
            </g>);

        })()}

        {/* Hover tooltip in SVG */}
        {tooltip && (() => {
          const tx = xOf(hovered);
          const ty = yOf(tooltip.value);
          const label = fmt(tooltip.value);
          const bw = label.length * 6 + 16;
          const bh2 = 16;
          const clampedX = Math.min(Math.max(tx, PAD_L + bw / 2 + 4), W - PAD_R - bw / 2 - 4);
          return (
            <g>
              <line x1={tx} y1={PAD_T} x2={tx} y2={PAD_T + chartH}
              stroke={PINK} strokeWidth="1" strokeOpacity="0.2" />
              <circle cx={tx} cy={ty} r="4" fill={PINK} fillOpacity="0.9" />
              <rect x={clampedX - bw / 2} y={ty - bh2 - 6} width={bw} height={bh2} rx="5"
              fill="#1e293b" fillOpacity="0.92" />
              <text x={clampedX} y={ty - bh2 - 6 + bh2 / 2 + 3.5} textAnchor="middle"
              style={{ fontSize: 9, fill: 'white', fontWeight: 700, fontFamily: 'Inter Tight, sans-serif' }}>
                {label}
              </text>
            </g>);

        })()}

        {/* X axis labels */}
        {pts.map((p, i) => {
          if (i % 3 !== 0 && i !== pts.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={H - 7} textAnchor="middle"
            style={{ fontSize: 8, fill: hovered === i ? PINK : '#b0bec5', fontWeight: hovered === i ? 700 : 400, fontFamily: 'Inter Tight, sans-serif' }}>
              {p.day}
            </text>);

        })}
      </svg>
    </div>);

}

// ══════════════════════════════════════════
export default function TakeawayCard({ dailySales = [], budget = 0, storeBudget = 0, onBudgetChange }) {
  const [expanded, setExpanded] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const allMonthSales = dailySales.
    filter((d) => d.date >= monthStart && d.date <= monthEnd).
    sort((a, b) => a.date.localeCompare(b.date));

    const monthData = allMonthSales.filter((d) => (d.total_takeaway || 0) > 0);
    const totalSold = monthData.reduce((s, d) => s + (d.total_takeaway || 0), 0);
    const daysWithData = monthData.length;

    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const dailyAvg = daysWithData > 0 ? totalSold / daysWithData : 0;
    const projection = totalSold + dailyAvg * daysRemaining;

    const compliance = budget > 0 ? totalSold / budget * 100 : null;
    const projCompliance = budget > 0 ? projection / budget * 100 : null;
    const trendVsProj = projCompliance != null ? projCompliance - 100 : null;

    // Progress through month (how much of month has elapsed)
    const monthProgress = dayOfMonth / daysInMonth * 100;
    // Expected sold by now if on track to meet projection
    const expectedByNow = projection * (dayOfMonth / daysInMonth);
    const paceVsProjection = totalSold > 0 ? totalSold / expectedByNow * 100 : null;

    const storeContribution = storeBudget > 0 ? totalSold / storeBudget * 100 : null;
    const storeContribProjected = storeBudget > 0 ? projection / storeBudget * 100 : null;

    const chartData = allMonthSales.map((d) => ({
      date: d.date,
      value: d.total_takeaway || 0,
      day: parseInt(d.date.split('-')[2])
    }));

    const bestDay = monthData.reduce(
      (best, d) => (d.total_takeaway || 0) > (best?.total_takeaway || 0) ? d : best, null
    );

    const dailyNeeded = budget > 0 && daysRemaining > 0 ?
    Math.max((budget - totalSold) / daysRemaining, 0) : null;

    const isOnTrack = compliance != null ?
    compliance >= dayOfMonth / daysInMonth * 100 - 5 : null;

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, trendVsProj,
      chartData, bestDay, dailyNeeded,
      daysRemaining, daysInMonth, dayOfMonth,
      storeContribution, storeContribProjected, isOnTrack,
      paceVsProjection, monthProgress
    };
  }, [dailySales, budget, storeBudget]);

  const { compliance, isOnTrack, trendVsProj } = analysis;
  const trendUp = trendVsProj != null && trendVsProj >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#ffffff',
        border: `1px solid ${PINK_MID}`,
        boxShadow: `0 4px 24px rgba(194,24,117,0.08), 0 1px 4px rgba(0,0,0,0.04)`
      }}>
      
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${PINK} 0%, rgba(194,24,117,0.3) 60%, transparent 100%)`,
        borderRadius: '12px 12px 0 0' }} />

      {/* ── HERO HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '22px 20px 18px',
        borderBottom: `1px solid ${PINK_SOFT}` }}>

        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: PINK_LIGHT, border: `1.5px solid ${PINK_MID}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShoppingBag style={{ width: 24, height: 24, color: PINK }} />
        </div>

        {/* Big number block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>
            Producto para Llevar
          </p>
          <p style={{ fontSize: 38, fontWeight: 900, color: PINK, letterSpacing: '-0.045em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
            {fmt(analysis.totalSold)}
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 3 }}>
            Real Acumulado
          </p>
          <p style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 500, marginTop: 4 }}>
            {analysis.daysWithData} días con datos · avg {fmt(analysis.dailyAvg)}/día
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 64, background: PINK_SOFT, flexShrink: 0, alignSelf: 'center' }} />

        {/* Projection block — right next to big number */}
        <div style={{ minWidth: 130 }}>
          <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
            Proyección de Cierre
          </p>
          <p style={{ fontSize: 26, fontWeight: 900, color: PINK, letterSpacing: '-0.035em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
            {fmt(analysis.projection)}
          </p>
          {analysis.projCompliance != null &&
            <p style={{ fontSize: 13, fontWeight: 900, color: analysis.projCompliance >= 100 ? '#10b981' : PINK, fontFamily: 'Inter Tight, sans-serif', marginTop: 4 }}>
              {analysis.projCompliance.toFixed(0)}% PPT
            </p>
          }
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setExpanded((e) => !e)} style={{ color: '#cbd5e1', cursor: 'pointer', padding: 2 }}>
            {expanded ?
            <ChevronUp style={{ width: 16, height: 16 }} /> :
            <ChevronDown style={{ width: 16, height: 16 }} />}
          </button>
          {editingBudget ?
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <input autoFocus type="number" value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="PPT..."
            style={{ width: 82, fontSize: 10, border: `1px solid ${PINK_MID}`, borderRadius: 6, padding: '3px 6px', outline: 'none', color: '#374151' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {onBudgetChange?.(Number(budgetInput));setEditingBudget(false);}
              if (e.key === 'Escape') setEditingBudget(false);
            }} />
            
              <button onClick={() => {onBudgetChange?.(Number(budgetInput));setEditingBudget(false);}} style={{ color: '#10b981' }}>
                <Check style={{ width: 12, height: 12 }} />
              </button>
              <button onClick={() => setEditingBudget(false)} style={{ color: '#94a3b8' }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div> :

          <button
            onClick={() => {setBudgetInput(budget > 0 ? String(budget) : '');setEditingBudget(true);}}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer' }}>
              {budget > 0 ? `PPT ${fmt(budget)}` : 'Agregar PPT'}
              <Pencil style={{ width: 8, height: 8 }} />
            </button>
          }
        </div>
      </div>

      {/* ── EXPANDED SECTION ── */}
      <AnimatePresence>
        {expanded &&
        <motion.div
          key="exp"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          style={{ overflow: 'hidden' }}>
          
            {/* ── 4 KPI ROW ── */}
            <div style={{
            display: 'flex',
            borderBottom: `1px solid ${PINK_MID}`,
            borderTop: `1px solid ${PINK_SOFT}`,
            background: 'linear-gradient(180deg, #fdfcff 0%, #ffffff 100%)',
            boxShadow: `inset 0 -1px 0 ${PINK_SOFT}`
          }}>
              <StatCard
              label="Vendido Acumulado"
              value={fmt(analysis.totalSold)}
              sub={`${analysis.daysWithData} días`} />
            
              <StatCard
              label="Proyección de Cierre"
              value={fmt(analysis.projection)}
              sub="al cierre del mes"
              subColor={PINK}
              highlight />
            
              <StatCard
              label="Promedio por Día"
              value={fmt(analysis.dailyAvg)}
              sub={`${analysis.daysRemaining} días restantes`} />
            
              {/* Aporte tienda */}
              <div style={{
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              minWidth: 180,
              borderLeft: `1px solid ${PINK_MID}`,
              background: '#ffffff'
            }}>
                {analysis.storeContribution != null &&
              <ArcRing pct={Math.min(analysis.storeContribution * 13, 100)} />
              }
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 5 }}>
                    Aporte Tienda
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.025em', color: '#7c3aed', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
                    {analysis.storeContribution != null ? `${analysis.storeContribution.toFixed(1)}%` : '—'}
                  </p>
                  <p style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>al PPT total</p>
                  {analysis.storeContribProjected != null &&
                <p style={{ fontSize: 8.5, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>
                      Prom. tiendas: {analysis.storeContribProjected.toFixed(1)}%
                    </p>
                }
                </div>
              </div>
            </div>

            {/* ── CHART ── */}
            <div style={{ padding: '16px 16px 10px', background: 'linear-gradient(180deg, #fff9fb 0%, #ffffff 100%)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
                  Venta Diaria — {format(new Date(), 'MMM yyyy', { locale: es }).toUpperCase()}
                </p>
                {analysis.bestDay &&
              <p style={{ fontSize: 9, fontWeight: 700, color: PINK }}>
                    🏆 Mejor día: {fmt(analysis.bestDay.total_takeaway)} · {parseInt(analysis.bestDay.date.split('-')[2])} {format(new Date(analysis.bestDay.date + 'T12:00:00'), 'MMM', { locale: es })}
                  </p>
              }
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `${PINK}55` }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Venta diaria</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={PINK} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.55" /></svg>
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Promedio actual ({fmt(analysis.dailyAvg)})</span>
                </div>
                {budget > 0 ?
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.75" /></svg>
                    <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Meta mensual ({fmt(budget)})</span>
                  </div> :

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.75" /></svg>
                    <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Proyección/día ({fmt(analysis.projection / analysis.daysInMonth)})</span>
                  </div>
              }
              </div>

              <RichBarChart
              pts={analysis.chartData}
              dailyAvg={analysis.dailyAvg}
              budget={budget}
              daysInMonth={analysis.daysInMonth}
              projection={analysis.projection} />
            
            </div>

            {/* ── FOOTER INSIGHT ── */}
            <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px',
            borderTop: `1px solid ${PINK_SOFT}`,
            background: isOnTrack === false ? 'rgba(245,158,11,0.04)' : isOnTrack === true ? 'rgba(16,185,129,0.04)' : 'rgba(194,24,117,0.04)'
          }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>
                🧁 {fmt(analysis.totalSold)} vendido · proy. {fmt(analysis.projection)}
                {analysis.storeContribution != null ? ` · aporta ${analysis.storeContribution.toFixed(1)}% al PPT tienda` : ''}
              </p>
              <p style={{
              fontSize: 9.5, fontWeight: 700, flexShrink: 0, marginLeft: 16,
              color: isOnTrack === true ? '#10b981' : isOnTrack === false ? '#f59e0b' : PINK
            }}>
                {budget === 0 ?
              'Agrega tu PPT para análisis completo 📊' :
              compliance != null && compliance >= 100 ?
              '¡PPT superado! 🚀' :
              isOnTrack ?
              'Producto para llevar proyecta cierre sobre meta 📈' :
              `Necesitas ${fmt(analysis.dailyNeeded ?? 0)}/día para alcanzar el PPT`}
              </p>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

}