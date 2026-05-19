import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, ChevronUp, Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

const PINK = '#C21875';
const PINK_SOFT = 'rgba(194,24,117,0.08)';
const PINK_MID = 'rgba(194,24,117,0.18)';
const PINK_LIGHT = '#fce7f3';

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

export default function TakeawayCard({ dailySales = [], budget = 0, storeBudget = 0, onBudgetChange }) {
  const [expanded, setExpanded] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const allMonthSales = dailySales
      .filter((d) => d.date >= monthStart && d.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthData = allMonthSales.filter((d) => (d.total_takeaway || 0) > 0);
    const totalSold = monthData.reduce((s, d) => s + (d.total_takeaway || 0), 0);
    const daysWithData = monthData.length;

    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const dailyAvg = dayOfMonth > 0 ? totalSold / dayOfMonth : 0;
    const projection = totalSold + dailyAvg * daysRemaining;

    const compliance = budget > 0 ? totalSold / budget * 100 : null;
    const projCompliance = budget > 0 ? projection / budget * 100 : null;
    const storeContribution = storeBudget > 0 ? totalSold / storeBudget * 100 : null;
    const storeContribProjected = storeBudget > 0 ? projection / storeBudget * 100 : null;

    // Trend vs projection
    const trendVsProj = budget > 0 && projCompliance != null ? projCompliance - 100 : null;

    const chartData = allMonthSales.map((d) => ({
      date: d.date,
      value: d.total_takeaway || 0,
      day: parseInt(d.date.split('-')[2])
    }));

    const bestDay = monthData.reduce((best, d) =>
      (d.total_takeaway || 0) > (best?.total_takeaway || 0) ? d : best, null);

    const dailyNeeded = budget > 0 && daysRemaining > 0 ?
      Math.max((budget - totalSold) / daysRemaining, 0) : null;

    const isOnTrack = compliance != null ?
      compliance >= dayOfMonth / daysInMonth * 100 - 5 : null;

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, trendVsProj, chartData,
      bestDay, dailyNeeded, daysRemaining, daysInMonth, dayOfMonth,
      storeContribution, storeContribProjected, isOnTrack
    };
  }, [dailySales, budget, storeBudget]);

  const { compliance, projCompliance, isOnTrack } = analysis;

  // ── RICH BAR CHART with curve overlay ──
  const RichBarChart = () => {
    const pts = analysis.chartData;
    if (!pts || pts.length === 0) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#d1d5db', fontSize: 11 }}>
        Sin datos este mes
      </div>
    );

    const W = 560, H = 160;
    const PAD_L = 44, PAD_R = 36, PAD_T = 20, PAD_B = 24;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const max = Math.max(...pts.map(p => p.value), 1);
    const avg = analysis.dailyAvg;
    const meta = budget > 0 ? budget / analysis.daysInMonth : null;

    const barW = Math.max(2, chartW / pts.length - 2);

    const xOf = (i) => PAD_L + (i + 0.5) / pts.length * chartW;
    const yOf = (v) => PAD_T + chartH - (v / max) * chartH;

    // smooth curve path
    const curvePts = pts.map((p, i) => [xOf(i), yOf(p.value)]);
    const smoothPath = curvePts.length > 1 ? curvePts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
      const prev = arr[i - 1];
      const cpx = (prev[0] + pt[0]) / 2;
      return acc + ` C${cpx.toFixed(1)},${prev[1].toFixed(1)} ${cpx.toFixed(1)},${pt[1].toFixed(1)} ${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
    }, '') : '';

    const areaPath = smoothPath
      ? `${smoothPath} L${curvePts[curvePts.length - 1][0]},${PAD_T + chartH} L${curvePts[0][0]},${PAD_T + chartH} Z`
      : '';

    const maxIdx = pts.findIndex(p => p.value === max);

    // Y axis labels
    const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: max * f, y: yOf(max * f) }));

    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="taBG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="taBarTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.85" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="taBarNorm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.35" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.12" />
          </linearGradient>
          <filter id="taGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y grid lines */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={l.y} x2={W - PAD_R} y2={l.y}
              stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray={i === 0 ? 'none' : '3 3'} />
            <text x={PAD_L - 4} y={l.y + 3} textAnchor="end"
              style={{ fontSize: 7.5, fill: '#94a3b8', fontFamily: 'Inter Tight, sans-serif' }}>
              {fmt(l.v)}
            </text>
          </g>
        ))}

        {/* Meta line */}
        {meta != null && meta > 0 && (
          <>
            <line x1={PAD_L} y1={yOf(meta)} x2={W - PAD_R} y2={yOf(meta)}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.6" />
            <text x={W - PAD_R + 3} y={yOf(meta) + 3}
              style={{ fontSize: 7, fill: '#94a3b8', fontWeight: 700, fontFamily: 'Inter Tight, sans-serif' }}>META</text>
          </>
        )}

        {/* Avg line */}
        {avg > 0 && (
          <>
            <line x1={PAD_L} y1={yOf(avg)} x2={W - PAD_R} y2={yOf(avg)}
              stroke={PINK} strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.45" />
            <text x={W - PAD_R + 3} y={yOf(avg) + 3}
              style={{ fontSize: 7, fill: PINK, fontWeight: 700, fontFamily: 'Inter Tight, sans-serif', opacity: 0.7 }}>AVG</text>
          </>
        )}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#taBG)" />}

        {/* Bars */}
        {pts.map((p, i) => {
          if (p.value === 0) return null;
          const bh = Math.max((p.value / max) * chartH, 3);
          const bx = PAD_L + i / pts.length * chartW + 1;
          const by = PAD_T + chartH - bh;
          const isTop = i === maxIdx;
          return (
            <rect key={i} x={bx} y={by} width={barW} height={bh} rx="2"
              fill={isTop ? 'url(#taBarTop)' : 'url(#taBarNorm)'}
              filter={isTop ? 'url(#taGlow)' : undefined}
            />
          );
        })}

        {/* Curve line */}
        {smoothPath && (
          <path d={smoothPath} stroke={PINK} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" fill="none" />
        )}

        {/* Best day tooltip */}
        {maxIdx >= 0 && pts[maxIdx]?.value > 0 && (() => {
          const tx = xOf(maxIdx);
          const ty = yOf(pts[maxIdx].value);
          const label = fmt(pts[maxIdx].value);
          const bw = label.length * 5.5 + 10;
          return (
            <g>
              <line x1={tx} y1={ty} x2={tx} y2={PAD_T + chartH} stroke={PINK} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 2" />
              <rect x={tx - bw / 2} y={ty - 18} width={bw} height={15} rx="4" fill={PINK} />
              <text x={tx} y={ty - 7} textAnchor="middle"
                style={{ fontSize: 8, fill: 'white', fontWeight: 700, fontFamily: 'Inter Tight, sans-serif' }}>
                {label}
              </text>
            </g>
          );
        })()}

        {/* X axis labels */}
        {pts.map((p, i) => {
          if (i % 3 !== 0 && i !== pts.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle"
              style={{ fontSize: 7.5, fill: '#94a3b8', fontFamily: 'Inter Tight, sans-serif' }}>
              {p.day}
            </text>
          );
        })}
      </svg>
    );
  };

  // Arc progress ring
  const ArcRing = ({ pct, size = 52 }) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(pct || 0, 100) / 100 * circ;
    const color = (pct || 0) >= 100 ? '#10b981' : (pct || 0) >= 60 ? PINK : '#f59e0b';
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}20`} strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          style={{ fontSize: 9, fontWeight: 800, fill: color, fontFamily: 'Inter Tight, sans-serif' }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </text>
      </svg>
    );
  };

  const trendVsProj = analysis.trendVsProj;
  const trendUp = trendVsProj != null && trendVsProj >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#ffffff',
        border: `1px solid ${PINK_MID}`,
        boxShadow: `0 2px 20px rgba(194,24,117,0.07), 0 1px 4px rgba(0,0,0,0.04)`
      }}
    >
      {/* Top pink accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${PINK}, rgba(194,24,117,0.3), transparent)` }} />

      {/* ── HERO HEADER ── */}
      <div className="flex items-start gap-4 px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${PINK_SOFT}` }}>

        {/* Icon */}
        <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ width: 48, height: 48, background: PINK_LIGHT, border: `1.5px solid ${PINK_MID}` }}>
          <ShoppingBag style={{ width: 22, height: 22, color: PINK }} />
        </div>

        {/* Main value */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 1 }}>
            Producto para Llevar
          </p>
          <p style={{ fontSize: 34, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
            {fmt(analysis.totalSold)}
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 2 }}>
            Real Acumulado
          </p>
          <p style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 500, marginTop: 3 }}>
            {analysis.daysWithData} días con datos · avg {fmt(analysis.dailyAvg)}/día
          </p>
        </div>

        {/* Projection block */}
        <div style={{ textAlign: 'left', minWidth: 100 }}>
          <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 3 }}>
            Proyección de Cierre
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: PINK, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
            {fmt(analysis.projection)}
          </p>
          <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500, marginTop: 3 }}>al cierre del mes</p>
        </div>

        {/* Trend badge */}
        {trendVsProj != null && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 80
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '4px 10px', borderRadius: 20,
              background: trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${trendUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
              marginBottom: 4
            }}>
              {trendUp
                ? <TrendingUp style={{ width: 11, height: 11, color: '#10b981' }} />
                : <TrendingDown style={{ width: 11, height: 11, color: '#ef4444' }} />
              }
              <span style={{ fontSize: 11, fontWeight: 800, color: trendUp ? '#10b981' : '#ef4444' }}>
                {trendVsProj > 0 ? '+' : ''}{trendVsProj.toFixed(0)}%
              </span>
            </div>
            <p style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>vs proyección</p>
          </div>
        )}

        {/* Budget edit + chevron */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} style={{ color: '#cbd5e1', cursor: 'pointer' }}>
            {expanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
          </button>
          {/* budget inline edit */}
          {editingBudget ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input autoFocus type="number" value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                placeholder="PPT..."
                style={{ width: 80, fontSize: 10, border: `1px solid ${PINK_MID}`, borderRadius: 6, padding: '2px 5px', outline: 'none' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }
                  if (e.key === 'Escape') setEditingBudget(false);
                }}
              />
              <button onClick={() => { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }} style={{ color: '#10b981' }}>
                <Check style={{ width: 11, height: 11 }} />
              </button>
              <button onClick={() => setEditingBudget(false)} style={{ color: '#94a3b8' }}>
                <X style={{ width: 11, height: 11 }} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setBudgetInput(budget > 0 ? String(budget) : ''); setEditingBudget(true); }}
              className="flex items-center gap-1"
              style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em' }}>
              {budget > 0 ? `PPT ${fmt(budget)}` : 'Agregar PPT'}
              <Pencil style={{ width: 7, height: 7 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── EXPANDED ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="exp"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {/* ── 4 KPI STAT ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', borderBottom: `1px solid ${PINK_SOFT}` }}>
              {/* Vendido */}
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${PINK_SOFT}` }}>
                <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Vendido Acumulado</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>{fmt(analysis.totalSold)}</p>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{analysis.daysWithData} días</p>
              </div>
              {/* Proyección */}
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${PINK_SOFT}` }}>
                <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Proyección de Cierre</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: PINK, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>{fmt(analysis.projection)}</p>
                <p style={{ fontSize: 9, color: PINK, marginTop: 4, fontWeight: 600, opacity: 0.7 }}>al cierre del mes</p>
              </div>
              {/* Promedio/día */}
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${PINK_SOFT}` }}>
                <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Promedio por Día</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>{fmt(analysis.dailyAvg)}</p>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{analysis.daysRemaining} días restantes</p>
              </div>
              {/* Aporte tienda con ring */}
              <div style={{ padding: '12px 16px 12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {(compliance != null || analysis.storeContribution != null) && (
                  <ArcRing pct={compliance ?? (analysis.storeContribution != null ? Math.min(analysis.storeContribution * 10, 100) : null)} />
                )}
                <div>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Aporte Tienda</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {analysis.storeContribution != null ? `${analysis.storeContribution.toFixed(1)}%` : '—'}
                  </p>
                  <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>al PPT total</p>
                  {analysis.storeContribProjected != null && (
                    <p style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>Prom. tiendas: {analysis.storeContribProjected.toFixed(1)}%</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CHART SECTION ── */}
            <div style={{ padding: '16px 16px 8px', background: 'linear-gradient(180deg, #fff8fb 0%, #ffffff 100%)' }}>
              {/* Chart header */}
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
                  Venta Diaria — {format(new Date(), 'MMM yyyy', { locale: es }).toUpperCase()}
                </p>
                {analysis.bestDay && (
                  <p style={{ fontSize: 9, fontWeight: 700, color: PINK }}>
                    🏆 Mejor día: {fmt(analysis.bestDay.total_takeaway)} · {parseInt(analysis.bestDay.date.split('-')[2])} {format(new Date(analysis.bestDay.date), 'MMM', { locale: es })}
                  </p>
                )}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: `${PINK}60` }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Venta diaria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 14, height: 1.5, background: PINK, opacity: 0.5, borderRadius: 2 }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Promedio actual ({fmt(analysis.dailyAvg)})</span>
                </div>
                {budget > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 14, height: 1.5, background: '#94a3b8', borderRadius: 2 }} />
                    <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Meta mensual ({fmt(budget)})</span>
                  </div>
                )}
              </div>
              <RichBarChart />
            </div>

            {/* ── INSIGHT FOOTER ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              borderTop: `1px solid ${PINK_SOFT}`,
              background: isOnTrack === false ? 'rgba(245,158,11,0.04)' : isOnTrack === true ? 'rgba(16,185,129,0.04)' : PINK_SOFT,
            }}>
              <p style={{ fontSize: 9.5, fontWeight: 600, color: '#374151' }}>
                🧁 {fmt(analysis.totalSold)} vendido · proy. {fmt(analysis.projection)}{analysis.storeContribution != null ? ` · aporta ${analysis.storeContribution.toFixed(1)}% al PPT tienda` : ''}
              </p>
              <p style={{ fontSize: 9, fontWeight: 600, color: isOnTrack ? '#10b981' : isOnTrack === false ? '#f59e0b' : PINK, flexShrink: 0, marginLeft: 12 }}>
                {budget === 0
                  ? 'Agrega tu PPT para ver análisis completo 📊'
                  : compliance != null && compliance >= 100
                    ? '¡PPT superado! 🚀'
                    : isOnTrack
                      ? 'Producto para llevar proyecta cierre sobre meta 📈'
                      : `Necesitas ${fmt(analysis.dailyNeeded ?? 0)}/día para alcanzar el PPT`
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}