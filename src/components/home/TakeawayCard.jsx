import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, ChevronUp, Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const PINK = '#C21875';
const PINK_SOFT = 'rgba(194,24,117,0.08)';
const PINK_MID = 'rgba(194,24,117,0.18)';
const PINK_GLOW = 'rgba(194,24,117,0.12)';

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

export default function TakeawayCard({ dailySales = [], budget = 0, storeBudget = 0, onBudgetChange }) {
  const [expanded, setExpanded] = useState(false);
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

    const dailyAvg = dayOfMonth > 0 ? totalSold / dayOfMonth : 0;
    const projection = totalSold + dailyAvg * daysRemaining;

    const compliance = budget > 0 ? totalSold / budget * 100 : null;
    const projCompliance = budget > 0 ? projection / budget * 100 : null;

    // Contribution to store budget
    const storeContribution = storeBudget > 0 ? totalSold / storeBudget * 100 : null;
    const storeContribProjected = storeBudget > 0 ? projection / storeBudget * 100 : null;

    // Trend
    const last6 = [...dailySales].
    filter((d) => d.total_takeaway > 0).
    sort((a, b) => b.date.localeCompare(a.date)).
    slice(0, 6);
    const recent3 = last6.slice(0, 3).reduce((s, d) => s + (d.total_takeaway || 0), 0) / 3;
    const prev3 = last6.slice(3, 6).reduce((s, d) => s + (d.total_takeaway || 0), 0) / 3;
    const trendPct = last6.length >= 4 && prev3 > 0 ? (recent3 - prev3) / prev3 * 100 : null;

    // Daily series for chart (all month days)
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
    compliance >= dayOfMonth / daysInMonth * 100 - 5 :
    null;

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, trendPct, chartData,
      bestDay, dailyNeeded, daysRemaining, daysInMonth, dayOfMonth,
      storeContribution, storeContribProjected, isOnTrack
    };
  }, [dailySales, budget, storeBudget]);

  const { compliance, projCompliance, trendPct, isOnTrack } = analysis;
  const trendUp = trendPct == null ? null : trendPct >= 0;

  // Full-width bar chart SVG
  const BarChart = () => {
    const pts = analysis.chartData;
    if (!pts || pts.length === 0) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#d1d5db', fontSize: 11 }}>
        Sin datos este mes
      </div>);

    const W = 480,H = 90,barW = Math.max(2, W / pts.length - 3);
    const max = Math.max(...pts.map((p) => p.value), 1);
    const avg = analysis.dailyAvg;

    return (
      <svg viewBox={`0 0 ${W} ${H + 24}`} fill="none" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="barGradDim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.25" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.08" />
          </linearGradient>
          <filter id="barGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Avg line */}
        {avg > 0 && (() => {
          const avgY = H - avg / max * (H - 8) - 4;
          return (
            <>
              <line x1="0" y1={avgY} x2={W} y2={avgY}
              stroke={PINK} strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity="0.35" />
              <text x={W - 2} y={avgY - 3} textAnchor="end"
              style={{ fontSize: 7, fill: PINK, opacity: 0.5, fontWeight: 600, fontFamily: 'Inter Tight, sans-serif' }}>
                avg
              </text>
            </>);

        })()}

        {/* Bars */}
        {pts.map((p, i) => {
          const barH = Math.max(p.value / max * (H - 8), p.value > 0 ? 4 : 0);
          const x = i / pts.length * W + 1;
          const y = H - barH;
          const isLast = i === pts.length - 1;
          const isTop = p.value === max && max > 0;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH}
              rx="2" ry="2"
              fill={p.value > 0 ? isTop ? 'url(#barGrad)' : 'url(#barGradDim)' : 'transparent'} />
              
              {isTop &&
              <rect x={x} y={y} width={barW} height={barH}
              rx="2" ry="2" fill="none"
              stroke={PINK} strokeWidth="0.6" strokeOpacity="0.4" />
              }
              {/* Day label */}
              {(i % 3 === 0 || isLast) &&
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
              style={{ fontSize: 7, fill: '#94a3b8', fontFamily: 'Inter Tight, sans-serif', fontWeight: 500 }}>
                  {p.day}
                </text>
              }
            </g>);

        })}

        {/* X-axis line */}
        <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      </svg>);

  };

  // Compact sparkline for collapsed header
  const SparkLine = () => {
    const pts = analysis.chartData.map((d) => d.value);
    if (!pts || pts.length < 2) return null;
    const W = 80,H = 28;
    const max = Math.max(...pts, 1);
    const coords = pts.map((v, i) => [
    i / (pts.length - 1) * W,
    H - v / max * (H - 6) - 3]
    );
    const d = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const areaD = `${d} L${W},${H} L0,${H} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" style={{ width: 56, height: 20, flexShrink: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkFill)" />
        <path d={d} stroke={PINK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {coords[coords.length - 1] &&
        <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2" fill={PINK} />
        }
      </svg>);

  };

  // Arc progress ring
  const ArcRing = ({ pct, size = 46 }) => {
    const r = (size - 7) / 2;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(pct || 0, 100) / 100 * circ;
    const color = (pct || 0) >= 100 ? '#10b981' : (pct || 0) >= 60 ? PINK : '#f59e0b';
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}18`} strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        
        <text x={size / 2} y={size / 2 + 3.5} textAnchor="middle"
        style={{ fontSize: 8.5, fontWeight: 800, fill: color, fontFamily: 'Inter Tight, sans-serif' }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </text>
      </svg>);

  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#ffffff',
        border: `1px solid ${PINK_MID}`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.05), 0 1px 4px ${PINK_GLOW}`
      }}>
      
      {/* Top gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${PINK}, rgba(194,24,117,0.4), transparent)`
      }} />

      {/* ── HEADER ROW ── */}
      




















































      

      {/* ── BUDGET BAR ── */}
      

















































      

      {/* ── EXPANDED SECTION ── */}
      <AnimatePresence>
        {expanded &&
        <motion.div
          key="expanded"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          style={{ borderTop: `1px solid ${PINK_SOFT}`, overflow: 'hidden' }}>
          
            <div className="px-4 pt-4 pb-5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── KPI CARDS ── */}
              <div className="grid grid-cols-3 gap-2">
                {/* Real */}
                <div style={{ borderRadius: 14, padding: '10px 12px', background: PINK_SOFT, border: `1px solid ${PINK_MID}` }}>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                    Venta Real
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
                    {fmt(analysis.totalSold)}
                  </p>
                  {compliance != null &&
                <p style={{ fontSize: 8, color: PINK, marginTop: 3, fontWeight: 600 }}>
                      {compliance.toFixed(1)}% del PPT
                    </p>
                }
                </div>

                {/* Proyección */}
                <div style={{ borderRadius: 14, padding: '10px 12px', background: '#fafafa', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                    Proy. Cierre
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: PINK, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
                    {fmt(analysis.projection)}
                  </p>
                  {projCompliance != null &&
                <p style={{ fontSize: 8, color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                      {projCompliance.toFixed(1)}% del PPT
                    </p>
                }
                </div>

                {/* Aporte al PPT tienda */}
                <div style={{ borderRadius: 14, padding: '10px 12px', background: '#fafafa', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                    Aporte PPT Tienda
                  </p>
                  {analysis.storeContribution != null ?
                <>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
                        {analysis.storeContribution.toFixed(1)}%
                      </p>
                      {analysis.storeContribProjected != null &&
                  <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 3, fontWeight: 600 }}>
                          proy. {analysis.storeContribProjected.toFixed(1)}%
                        </p>
                  }
                    </> :

                <p style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 500, marginTop: 4 }}>Sin PPT tienda</p>
                }
                </div>
              </div>

              {/* ── CHART ── */}
              <div style={{
              borderRadius: 16, padding: '14px 14px 8px',
              background: 'linear-gradient(145deg, #fff5f9 0%, #fdf2f8 100%)',
              border: `1px solid ${PINK_MID}`
            }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>
                      Comportamiento diario
                    </p>
                    <p style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 500, marginTop: 1 }}>
                      Venta de producto para llevar — {format(new Date(), 'MMMM yyyy')}
                    </p>
                  </div>
                  {analysis.bestDay &&
                <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mejor día</p>
                      <p style={{ fontSize: 9, fontWeight: 700, color: PINK }}>
                        {fmt(analysis.bestDay.total_takeaway)} · {parseInt(analysis.bestDay.date.split('-')[2])}
                      </p>
                    </div>
                }
                </div>
                <BarChart />
              </div>

              {/* ── INSIGHT ── */}
              <div style={{
              borderRadius: 12, padding: '9px 12px',
              background: isOnTrack === false ?
              'rgba(245,158,11,0.05)' :
              isOnTrack === true ?
              'rgba(16,185,129,0.05)' :
              PINK_SOFT,
              border: `1px solid ${isOnTrack === false ? 'rgba(245,158,11,0.14)' : isOnTrack === true ? 'rgba(16,185,129,0.14)' : PINK_MID}`
            }}>
                <p style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.55, color: '#374151' }}>
                  {budget === 0 ?
                `📦 Llevas ${fmt(analysis.totalSold)} real. Proyección al cierre: ${fmt(analysis.projection)}.${analysis.storeContribution != null ? ` Aportas el ${analysis.storeContribution.toFixed(1)}% del PPT de la tienda.` : ''}` :
                compliance == null ?
                '📦 Registra ventas de llevar para ver el análisis.' :
                compliance >= 100 ?
                `🚀 ¡Ya superaste el PPT! (${compliance.toFixed(0)}%). Proyección cierre: ${fmt(analysis.projection)} (${projCompliance?.toFixed(0)}%).` :
                isOnTrack ?
                `✅ Vas bien. ${compliance.toFixed(0)}% real, proyección ${projCompliance?.toFixed(0)}% del PPT. Meta diaria: ${fmt(analysis.dailyNeeded ?? 0)}/día.` :
                `⚠️ Ritmo bajo. Necesitas ${fmt(analysis.dailyNeeded ?? 0)}/día. Proyección: ${projCompliance?.toFixed(0)}% del PPT.`
                }
                </p>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

}