import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, TrendingDown, Pencil, Check, X } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const PINK = '#C21875';

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

// Tiny sparkline — purely SVG, no className on SVG element
function MiniSpark({ values = [], color = PINK, height = 22, width = 52 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values.filter(v => v > 0), 0);
  const range = max - min || 1;
  const py = 2, px = 2;
  const coords = values.map((v, i) => [
    px + (i / (values.length - 1)) * (width - px * 2),
    height - py - ((v - min) / range) * (height - py * 2)
  ]);
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
  const area = `${d} L${lx.toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;
  const gId = `sg_${color.replace('#', '')}_${width}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} fill="none" preserveAspectRatio="none"
      style={{ width, height, display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}

// Thin arc progress
function ArcPct({ pct = 0, size = 36, color = PINK }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 100) / 100 * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}15`} strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 3.5} textAnchor="middle"
        style={{ fontSize: 7.5, fontWeight: 900, fill: color, fontFamily: 'Inter Tight,Inter,sans-serif' }}>
        {`${Math.round(pct)}%`}
      </text>
    </svg>
  );
}

export default function TakeawayCard({ dailySales = [], budget = 0, onBudgetChange }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const A = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // All month records sorted
    const monthData = [...dailySales]
      .filter(d => d.date >= monthStart && d.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    const withData = monthData.filter(d => (d.total_takeaway || 0) > 0);
    const totalSold = withData.reduce((s, d) => s + (d.total_takeaway || 0), 0);
    const daysWithData = withData.length;

    // Real daily average only counting days WITH data
    const dailyAvg = daysWithData > 0 ? totalSold / daysWithData : 0;

    // Projection: totalSold + dailyAvg * remaining days
    // (conservative: only weekdays if you want, but simpler: all days)
    const projection = totalSold + dailyAvg * daysRemaining;

    // Budget compliance
    const compliance = budget > 0 ? Math.min((totalSold / budget) * 100, 999) : null;
    const projCompliance = budget > 0 ? Math.min((projection / budget) * 100, 999) : null;

    // Expected pace: how much % of budget should already be reached by today
    const expectedPacePct = (dayOfMonth / daysInMonth) * 100;
    const isOnTrack = compliance != null ? compliance >= (expectedPacePct - 6) : null;

    // Gap to close: how much per day needed to still hit budget
    const gapToClose = budget > 0 && daysRemaining > 0
      ? Math.max((budget - totalSold) / daysRemaining, 0) : null;

    // Trend: last 5 days avg vs prev 5 days avg
    const sorted = [...dailySales]
      .filter(d => (d.total_takeaway || 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    const r5 = sorted.slice(0, 5);
    const p5 = sorted.slice(5, 10);
    const r5avg = r5.length ? r5.reduce((s,d)=>s+(d.total_takeaway||0),0)/r5.length : 0;
    const p5avg = p5.length ? p5.reduce((s,d)=>s+(d.total_takeaway||0),0)/p5.length : 0;
    const trendPct = p5avg > 0 ? ((r5avg - p5avg) / p5avg) * 100 : null;

    // Sparklines
    // Main: last 14 days of month
    const mainSpark = withData.slice(-14).map(d => d.total_takeaway || 0);

    // For mini chips: last 7 data points each
    const last7 = [...withData].slice(-7).map(d => d.total_takeaway || 0);

    // Daily needed sparkline: simulate what we need each future day
    const neededSpark = gapToClose != null
      ? Array(Math.min(daysRemaining, 7)).fill(gapToClose)
      : null;

    // Projection spark: running total projected
    const projSpark = (() => {
      const pts = [];
      let acc = totalSold;
      for (let i = 0; i < Math.min(daysRemaining, 7); i++) {
        acc += dailyAvg;
        pts.push(acc);
      }
      return pts.length > 1 ? pts : null;
    })();

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance, expectedPacePct,
      isOnTrack, gapToClose, trendPct,
      mainSpark, last7, neededSpark, projSpark,
      daysRemaining, daysInMonth, dayOfMonth
    };
  }, [dailySales, budget]);

  const trendUp = A.trendPct == null ? null : A.trendPct >= 0;
  const statusColor = A.isOnTrack === false ? '#e11d48' : A.isOnTrack === true ? '#10b981' : PINK;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(40px)',
        border: `1px solid ${PINK}18`,
        borderRadius: 16,
        boxShadow: `0 2px 16px rgba(0,0,0,0.06), 0 0 0 0.5px ${PINK}10, inset 0 1px 0 rgba(255,255,255,1)`,
        overflow: 'hidden',
        marginBottom: 10,
        position: 'relative',
      }}
    >
      {/* Pink top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
        background: `linear-gradient(90deg, ${PINK}, ${PINK}50, transparent)`,
      }} />

      <div style={{ padding: '12px 14px 10px' }}>
        {/* ── ROW 1: title + total + trend + arc ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            background: `${PINK}10`, border: `1px solid ${PINK}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShoppingBag style={{ width: 13, height: 13, color: PINK }} />
          </div>

          {/* Label + value */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${PINK}80`, margin: 0, lineHeight: 1 }}>
              Producto para Llevar
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight,Inter,sans-serif' }}>
                {fmt(A.totalSold)}
              </span>
              {A.trendPct != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9.5, fontWeight: 800, color: trendUp ? '#10b981' : '#e11d48' }}>
                  {trendUp ? <TrendingUp style={{ width: 9, height: 9 }} /> : <TrendingDown style={{ width: 9, height: 9 }} />}
                  {Math.abs(A.trendPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 500, margin: '1px 0 0', lineHeight: 1 }}>
              {A.daysWithData}d · avg {fmt(A.dailyAvg)}/día
            </p>
          </div>

          {/* Main sparkline */}
          <div style={{ flexShrink: 0 }}>
            <MiniSpark values={A.mainSpark} color={PINK} width={60} height={26} />
          </div>

          {/* Arc */}
          {A.compliance != null && <ArcPct pct={A.compliance} color={statusColor} size={38} />}
        </div>

        {/* ── ROW 2: 3 KPI chips ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 9 }}>
          {/* Proyección */}
          <KpiChip
            label="Proyección"
            value={fmt(A.projection)}
            sub={A.projCompliance != null ? `${A.projCompliance.toFixed(0)}% PPT` : null}
            subColor={A.projCompliance == null ? '#94a3b8' : A.projCompliance >= 100 ? '#10b981' : A.projCompliance >= 80 ? '#f59e0b' : '#e11d48'}
            spark={A.projSpark}
            sparkColor="#6366f1"
          />
          {/* Meta/día necesaria */}
          <KpiChip
            label="Meta/día req."
            value={A.gapToClose != null ? fmt(A.gapToClose) : fmt(A.dailyAvg)}
            sub={`${A.daysRemaining}d restantes`}
            subColor="#94a3b8"
            spark={A.neededSpark ?? A.last7}
            sparkColor={A.isOnTrack === false ? '#e11d48' : PINK}
          />
          {/* Estado */}
          <KpiChip
            label="Ritmo"
            value={A.isOnTrack === null ? '—' : A.isOnTrack ? 'Al ritmo' : 'Rezagado'}
            sub={A.compliance != null ? `${A.compliance.toFixed(0)}% vs ${A.expectedPacePct.toFixed(0)}% esp.` : 'Sin PPT'}
            subColor={statusColor}
            spark={A.last7}
            sparkColor={statusColor}
          />
        </div>

        {/* ── ROW 3: budget bar + edit ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            {editingBudget ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}
                onClick={e => e.stopPropagation()}>
                <input
                  autoFocus type="number" value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  placeholder="PPT mensual..."
                  style={{
                    flex: 1, fontSize: 10, fontWeight: 600, color: '#374151',
                    border: `1px solid ${PINK}40`, borderRadius: 6, padding: '2px 6px',
                    outline: 'none', background: 'white', height: 20,
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }
                    if (e.key === 'Escape') setEditingBudget(false);
                  }}
                />
                <button onClick={() => { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }}
                  style={{ color: '#10b981', cursor: 'pointer', display: 'flex', padding: 2, background: 'none', border: 'none' }}>
                  <Check style={{ width: 11, height: 11 }} />
                </button>
                <button onClick={() => setEditingBudget(false)}
                  style={{ color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 2, background: 'none', border: 'none' }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setBudgetInput(budget > 0 ? String(budget) : ''); setEditingBudget(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ fontSize: 7.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>
                  {budget > 0 ? `PPT MES: ${fmt(budget)}` : '+ Agregar PPT del mes'}
                </span>
                <Pencil style={{ width: 7, height: 7, color: '#cbd5e1' }} />
              </button>
            )}
            {!editingBudget && A.compliance != null && (
              <span style={{ fontSize: 7.5, fontWeight: 800, color: statusColor }}>
                {A.compliance.toFixed(1)}%
              </span>
            )}
          </div>

          {budget > 0 && (
            <div style={{ height: 4, borderRadius: 9999, background: `${PINK}10`, overflow: 'hidden', position: 'relative' }}>
              {/* Projection ghost */}
              <div style={{
                position: 'absolute', inset: 0,
                width: `${Math.min(A.projCompliance || 0, 100)}%`,
                background: `${PINK}22`, borderRadius: 9999
              }} />
              {/* Actual */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(A.compliance || 0, 100)}%` }}
                transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, ${PINK}, ${PINK}70)`,
                  borderRadius: 9999
                }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// KPI chip con mini spark interno
function KpiChip({ label, value, sub, subColor = '#94a3b8', spark, sparkColor = PINK }) {
  return (
    <div style={{
      borderRadius: 10, padding: '7px 8px 6px',
      background: `${PINK}06`, border: `1px solid ${PINK}12`,
      display: 'flex', flexDirection: 'column', gap: 2,
      overflow: 'hidden', position: 'relative',
    }}>
      <p style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#94a3b8', margin: 0, lineHeight: 1 }}>
        {label}
      </p>
      <p style={{ fontSize: 12, fontWeight: 900, color: '#1e293b', margin: 0, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'Inter Tight,Inter,sans-serif' }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 7, fontWeight: 700, color: subColor, margin: 0, lineHeight: 1 }}>
          {sub}
        </p>
      )}
      {spark && spark.length >= 2 && (
        <div style={{ marginTop: 3, opacity: 0.85 }}>
          <MiniSpark values={spark} color={sparkColor} width={52} height={18} />
        </div>
      )}
    </div>
  );
}