import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, TrendingDown, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

export default function TakeawayCard({ dailySales = [], budget = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const monthData = dailySales
      .filter(d => d.date >= monthStart && d.date <= monthEnd && (d.total_takeaway || 0) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalSold = monthData.reduce((s, d) => s + (d.total_takeaway || 0), 0);
    const daysWithData = monthData.length;

    // Days elapsed in month
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Daily average based on days with data
    const dailyAvg = daysWithData > 0 ? totalSold / daysWithData : 0;

    // Projection: sold + (avg * remaining days)
    const projection = totalSold + (dailyAvg * daysRemaining);

    // Compliance %
    const compliance = budget > 0 ? (totalSold / budget) * 100 : null;
    const projCompliance = budget > 0 ? (projection / budget) * 100 : null;

    // Trend: last 3 days vs previous 3 days
    const last6 = [...dailySales]
      .filter(d => d.total_takeaway > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
    const recent3 = last6.slice(0, 3).reduce((s, d) => s + (d.total_takeaway || 0), 0) / 3;
    const prev3 = last6.slice(3, 6).reduce((s, d) => s + (d.total_takeaway || 0), 0) / 3;
    const trendPct = prev3 > 0 ? ((recent3 - prev3) / prev3) * 100 : null;

    // Last 7 days sparkline
    const spark = [...dailySales]
      .filter(d => d.date >= monthStart)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map(d => d.total_takeaway || 0);

    // Best day
    const bestDay = monthData.reduce((best, d) =>
      (d.total_takeaway || 0) > (best?.total_takeaway || 0) ? d : best, null);

    // Needed daily to hit budget
    const dailyNeeded = budget > 0 && daysRemaining > 0
      ? (budget - totalSold) / daysRemaining : null;

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, trendPct, spark,
      bestDay, dailyNeeded, daysRemaining, daysInMonth, dayOfMonth
    };
  }, [dailySales, budget]);

  const { compliance, projCompliance, trendPct } = analysis;
  const isOnTrack = compliance != null ? compliance >= (analysis.dayOfMonth / analysis.daysInMonth * 100 - 5) : null;
  const accentColor = isOnTrack === null ? '#8b5cf6' : isOnTrack ? '#10b981' : '#ef4444';
  const trendUp = trendPct == null ? null : trendPct >= 0;

  // Sparkline SVG
  const SparkLine = () => {
    const pts = analysis.spark;
    if (!pts || pts.length < 2) return null;
    const W = 120, H = 32;
    const max = Math.max(...pts, 1);
    const coords = pts.map((v, i) => [
      (i / (pts.length - 1)) * W,
      H - (v / max) * (H - 4) - 2
    ]);
    const d = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const areaD = `${d} L${W},${H} L0,${H} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" style={{ width: 80, height: 22, flexShrink: 0 }}>
        <defs>
          <linearGradient id="tkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#tkGrad)" />
        <path d={d} stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {coords[coords.length - 1] && (
          <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.5" fill={accentColor} />
        )}
      </svg>
    );
  };

  // Circular progress
  const CircleProgress = ({ pct, size = 44 }) => {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(pct || 0, 100) / 100 * circ;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${accentColor}18`} strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={accentColor} strokeWidth="4"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x={size/2} y={size/2 + 3} textAnchor="middle"
          style={{ fontSize: 8, fontWeight: 800, fill: accentColor, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </text>
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer mb-4"
      style={{
        background: hovered ? `linear-gradient(145deg, #faf5ff 0%, #f3e8ff 100%)` : '#ffffff',
        border: `1px solid ${hovered ? `${accentColor}25` : `${accentColor}12`}`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.09), 0 2px 8px ${accentColor}14`
          : `0 2px 16px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)`,
        transition: 'all 0.3s ease',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40, transparent)`,
        borderRadius: '9999px 9999px 0 0'
      }} />

      {/* MAIN ROW */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}>
          <ShoppingBag style={{ width: 16, height: 16, color: accentColor }} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>
            Producto para Llevar
          </p>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.03em', fontFamily: 'Inter Tight, Inter, sans-serif', lineHeight: 1 }}>
              {fmt(analysis.totalSold)}
            </span>
            {trendPct != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 9.5, fontWeight: 800, color: trendUp ? '#10b981' : '#ef4444' }}>
                {trendUp ? <TrendingUp style={{ width: 9, height: 9 }} /> : <TrendingDown style={{ width: 9, height: 9 }} />}
                {Math.abs(trendPct).toFixed(1)}%
              </span>
            )}
          </div>
          <p style={{ fontSize: 8, color: '#cbd5e1', fontWeight: 500, marginTop: 1 }}>
            {analysis.daysWithData}d con datos · avg {fmt(analysis.dailyAvg)}/día
          </p>
        </div>

        {/* Sparkline */}
        <SparkLine />

        {/* Circle compliance */}
        <CircleProgress pct={compliance} />

        {/* Expand toggle */}
        <div style={{ color: '#cbd5e1', flexShrink: 0 }}>
          {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
        </div>
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div className="px-4 pb-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>
              PPT MES {fmt(budget)}
            </span>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: accentColor }}>
              {compliance != null ? `${compliance.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, background: `${accentColor}14`, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(compliance || 0, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
            />
          </div>
        </div>
      )}

      {/* EXPANDED ANALYSIS */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28 }}
          style={{ borderTop: `1px solid ${accentColor}10`, padding: '12px 16px 14px' }}
        >
          <div className="grid grid-cols-2 gap-2">
            {/* Proyección */}
            <div style={{
              borderRadius: 12, padding: '10px 12px',
              background: `${accentColor}07`, border: `1px solid ${accentColor}14`
            }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap style={{ width: 9, height: 9, color: accentColor }} />
                <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>Proyección cierre</p>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: accentColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {fmt(analysis.projection)}
              </p>
              {projCompliance != null && (
                <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                  {projCompliance.toFixed(1)}% del PPT
                </p>
              )}
            </div>

            {/* Meta diaria necesaria */}
            <div style={{
              borderRadius: 12, padding: '10px 12px',
              background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Target style={{ width: 9, height: 9, color: '#64748b' }} />
                <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  {budget > 0 ? 'Meta diaria req.' : 'Prom. diario'}
                </p>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {budget > 0 && analysis.dailyNeeded != null ? fmt(Math.max(analysis.dailyNeeded, 0)) : fmt(analysis.dailyAvg)}
              </p>
              <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                {analysis.daysRemaining} días restantes
              </p>
            </div>
          </div>

          {/* Insight text */}
          <div style={{
            marginTop: 8, borderRadius: 10, padding: '8px 11px',
            background: isOnTrack === false ? 'rgba(239,68,68,0.05)' : isOnTrack === true ? 'rgba(16,185,129,0.05)' : 'rgba(139,92,246,0.05)',
            border: `1px solid ${isOnTrack === false ? 'rgba(239,68,68,0.12)' : isOnTrack === true ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)'}`,
          }}>
            <p style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.5, color: '#374151' }}>
              {budget === 0
                ? `📦 Llevas ${fmt(analysis.totalSold)} en ${analysis.daysWithData} días. Promedio diario: ${fmt(analysis.dailyAvg)}. Proyección al cierre: ${fmt(analysis.projection)}.`
                : compliance == null
                  ? '📦 Registra ventas de llevar para ver el análisis.'
                  : compliance >= 100
                    ? `🚀 ¡Ya superaste el PPT del mes! (${compliance.toFixed(0)}%). Proyección: ${fmt(analysis.projection)}.`
                    : isOnTrack
                      ? `✅ Vas bien. ${compliance.toFixed(0)}% del PPT con ritmo de ${fmt(analysis.dailyAvg)}/día. Meta restante: ${fmt(analysis.dailyNeeded ?? 0)}/día.`
                      : `⚠️ Ritmo bajo. Necesitas ${fmt(analysis.dailyNeeded ?? 0)}/día para cerrar el mes. Proyección actual: ${projCompliance?.toFixed(0)}% del PPT.`
              }
            </p>
          </div>

          {analysis.bestDay && (
            <p style={{ fontSize: 8, color: '#94a3b8', marginTop: 6, fontWeight: 500, textAlign: 'right' }}>
              🏆 Mejor día: {analysis.bestDay.date} — {fmt(analysis.bestDay.total_takeaway)}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}