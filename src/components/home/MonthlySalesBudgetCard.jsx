import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, ChevronUp, Check, X, Pencil, CalendarDays, TrendingUp, Trophy, Zap } from 'lucide-react';
import { startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const PINK = '#db2777';
const PINK_SOFT = 'rgba(219,39,119,0.08)';
const PINK_MID = 'rgba(219,39,119,0.18)';
const PINK_LIGHT = '#fdf2f8';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

function fmt(val) {
  if (val == null || isNaN(val)) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

// ── Cumplimiento diario bars (cada día vs su meta diaria) ──
function DailyComplianceChart({ dailyData, dailyMeta, daysInMonth, today }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const W = 580, H = 150;
  const PAD_L = 42, PAD_R = 18, PAD_T = 16, PAD_B = 26;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * W;
    const relX = svgX - PAD_L;
    const idx = Math.round(relX / chartW * daysInMonth - 0.5);
    if (idx >= 0 && idx < daysInMonth) setHovered(idx);
    else setHovered(null);
  }, [daysInMonth]);

  if (!dailyMeta || dailyMeta <= 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#cbd5e1', fontSize: 11 }}>
        Define el PPT del mes para ver cumplimiento diario
      </div>
    );
  }

  const maxVal = Math.max(dailyMeta * 1.4, ...dailyData.map(d => d.value), 1);

  const xOf = (i) => PAD_L + (i + 0.5) / daysInMonth * chartW;
  const yOf = (v) => PAD_T + chartH - Math.max(0, Math.min(v / maxVal, 1)) * chartH;
  const barW = Math.max(3, chartW / daysInMonth - 1.5);

  const metaY = yOf(dailyMeta);
  const todayIdx = today.getDate() - 1;

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setHovered(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ width: '100%', height: 'auto', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}>
        <defs>
          <linearGradient id="msbBarOk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.9" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="msbBarMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AMBER} stopOpacity="0.85" />
            <stop offset="100%" stopColor={AMBER} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="msbBarLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.7" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="msbBarFuture" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {[0, 0.5, 1].map((f, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={yOf(maxVal * f)} x2={W - PAD_R} y2={yOf(maxVal * f)}
              stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray={i === 0 ? undefined : '3 3'} />
            <text x={PAD_L - 4} y={yOf(maxVal * f) + 3} textAnchor="end"
              style={{ fontSize: 7.5, fill: '#b0bec5', fontFamily: 'Inter Tight, sans-serif' }}>
              {fmt(maxVal * f)}
            </text>
          </g>
        ))}

        {/* Meta diaria line */}
        <line x1={PAD_L} y1={metaY} x2={W - PAD_R} y2={metaY}
          stroke={GREEN} strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.7" />
        <text x={W - PAD_R - 2} y={metaY - 4} textAnchor="end"
          style={{ fontSize: 7.5, fill: GREEN, fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
          META/DÍA {fmt(dailyMeta)}
        </text>

        {/* Bars */}
        {dailyData.map((d, i) => {
          if (d.value === 0 && i > todayIdx) return null;
          const isFuture = i > todayIdx;
          const bh = isFuture ? 0 : Math.max(d.value / maxVal * chartH, 2);
          const bx = PAD_L + i / daysInMonth * chartW + (chartW / daysInMonth - barW) / 2;
          const by = PAD_T + chartH - bh;
          const compliancePct = d.value / dailyMeta * 100;
          let fill = 'url(#msbBarFuture)';
          if (!isFuture) {
            if (compliancePct >= 100) fill = 'url(#msbBarOk)';
            else if (compliancePct >= 70) fill = 'url(#msbBarMid)';
            else fill = 'url(#msbBarLow)';
          }
          const isHov = i === hovered;
          return (
            <rect key={i} x={bx} y={by} width={barW} height={bh} rx="2.5"
              fill={fill} opacity={isHov ? 1 : 0.92} />
          );
        })}

        {/* Today marker */}
        <line x1={xOf(todayIdx)} y1={PAD_T} x2={xOf(todayIdx)} y2={PAD_T + chartH}
          stroke={PINK} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="2 3" />
        <text x={xOf(todayIdx)} y={PAD_T - 4} textAnchor="middle"
          style={{ fontSize: 7.5, fill: PINK, fontWeight: 800, fontFamily: 'Inter Tight, sans-serif' }}>
          HOY
        </text>

        {/* Hover tooltip */}
        {hovered != null && dailyData[hovered] && (() => {
          const d = dailyData[hovered];
          const tx = xOf(hovered);
          const pct = dailyMeta > 0 ? (d.value / dailyMeta * 100) : 0;
          const label = `D${hovered + 1} · ${fmt(d.value)} · ${Math.round(pct)}%`;
          const w = label.length * 4.2 + 12;
          const cx = Math.min(Math.max(tx, PAD_L + w / 2 + 2), W - PAD_R - w / 2 - 2);
          const ty = Math.max(yOf(d.value) - 14, PAD_T + 8);
          return (
            <g>
              <rect x={cx - w / 2} y={ty - 10} width={w} height={14} rx="4" fill="rgba(30,41,59,0.92)" />
              <text x={cx} y={ty} textAnchor="middle"
                style={{ fontSize: 8, fill: 'white', fontWeight: 700, fontFamily: 'Inter Tight, sans-serif' }}>
                {label}
              </text>
            </g>
          );
        })()}

        {/* X axis labels */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          if ((i + 1) % 5 !== 0 && i !== todayIdx && i !== 0) return null;
          return (
            <text key={i} x={xOf(i)} y={H - 7} textAnchor="middle"
              style={{ fontSize: 7.5, fill: hovered === i ? PINK : i === todayIdx ? PINK : '#b0bec5',
                fontWeight: hovered === i || i === todayIdx ? 800 : 400, fontFamily: 'Inter Tight, sans-serif' }}>
              {i + 1}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════
export default function MonthlySalesBudgetCard({ dailySales = [], budget = 0, onBudgetChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const daysInMonth = endOfMonth(now).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const monthData = (dailySales || [])
      .filter((d) => d.date >= monthStart && d.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalSold = monthData.reduce((s, d) => s + (d.total_sales || 0), 0);
    const daysWithData = monthData.length;

    // Build full daily array (1..daysInMonth)
    const salesByDay = {};
    monthData.forEach((d) => {
      const day = parseInt(d.date.split('-')[2]);
      salesByDay[day] = (salesByDay[day] || 0) + (d.total_sales || 0);
    });

    const dailyData = Array.from({ length: daysInMonth }).map((_, i) => ({
      day: i + 1,
      value: salesByDay[i + 1] || 0
    }));

    const dailyMeta = budget > 0 ? budget / daysInMonth : 0;
    const dailyAvg = daysWithData > 0 ? totalSold / daysWithData : 0;
    const projection = totalSold + dailyAvg * daysRemaining;

    const compliance = budget > 0 ? (totalSold / budget) * 100 : null;
    const projCompliance = budget > 0 ? (projection / budget) * 100 : null;

    // Cumplimiento diario: cuántos días alcanzaron o superaron la meta diaria
    const daysOnTarget = dailyData
      .filter((d) => d.day <= dayOfMonth && d.value > 0 && d.value >= dailyMeta).length;
    const daysBelowTarget = dailyData
      .filter((d) => d.day <= dayOfMonth && d.value > 0 && d.value < dailyMeta).length;
    const activeDays = dailyData.filter((d) => d.day <= dayOfMonth && d.value > 0).length;
    const hitRate = activeDays > 0 ? (daysOnTarget / activeDays) * 100 : null;

    // Avance esperado del mes
    const monthProgress = (dayOfMonth / daysInMonth) * 100;
    const expectedByNow = budget > 0 ? budget * (dayOfMonth / daysInMonth) : 0;
    const paceVsBudget = budget > 0 && expectedByNow > 0 ? (totalSold / expectedByNow) * 100 : null;

    const gap = budget > 0 ? budget - totalSold : 0;
    const dailyNeeded = budget > 0 && daysRemaining > 0 ? Math.max(gap / daysRemaining, 0) : null;

    const isOnTrack = projCompliance != null ? projCompliance >= 100 : null;

    // Mejor día
    const bestDay = monthData.reduce(
      (best, d) => (d.total_sales || 0) > (best?.total_sales || 0) ? d : best, null
    );

    return {
      totalSold, daysWithData, dailyAvg, projection,
      compliance, projCompliance,
      dailyData, dailyMeta, daysInMonth, dayOfMonth, daysRemaining,
      daysOnTarget, daysBelowTarget, hitRate, activeDays,
      monthProgress, paceVsBudget, gap, dailyNeeded,
      isOnTrack, bestDay
    };
  }, [dailySales, budget]);

  const { compliance, projCompliance, isOnTrack, paceVsBudget } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#ffffff',
        border: `1px solid ${PINK_MID}`,
        boxShadow: `0 4px 24px rgba(219,39,119,0.08), 0 1px 4px rgba(0,0,0,0.04)`
      }}>

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${PINK} 0%, rgba(194,24,117,0.3) 60%, transparent 100%)`,
        borderRadius: '12px 12px 0 0' }} />

      {/* ── HERO HEADER ── */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${PINK_SOFT}`, cursor: 'pointer', userSelect: 'none' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: PINK_LIGHT, border: `1.5px solid ${PINK_MID}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target style={{ width: 18, height: 18, color: PINK }} />
            </div>
            <div>
              <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ca3af', lineHeight: 1 }}>
                Cumplimiento PPT Venta del Mes
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                {analysis.daysOnTarget} días ✓ · {analysis.daysBelowTarget} días ✗ · {format(new Date(), 'MMM yyyy', { locale: es })}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {editingBudget ?
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <input autoFocus type="number" value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="PPT..."
                  style={{ width: 82, fontSize: 10, border: `1px solid ${PINK_MID}`, borderRadius: 6, padding: '3px 6px', outline: 'none', color: '#374151' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }
                    if (e.key === 'Escape') setEditingBudget(false);
                  }} />
                <button onClick={() => { onBudgetChange?.(Number(budgetInput)); setEditingBudget(false); }} style={{ color: GREEN }}>
                  <Check style={{ width: 12, height: 12 }} />
                </button>
                <button onClick={() => setEditingBudget(false)} style={{ color: '#94a3b8' }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div> :
              <button
                onClick={() => { setBudgetInput(budget > 0 ? String(budget) : ''); setEditingBudget(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${PINK_MID}`, background: PINK_LIGHT }}>
                {budget > 0 ? `PPT ${fmt(budget)}` : 'Agregar PPT'}
                <Pencil style={{ width: 9, height: 9 }} />
              </button>
            }
            <button onClick={(e) => { e.stopPropagation(); setExpanded((e) => !e); }} style={{ color: '#cbd5e1', cursor: 'pointer', padding: 2 }}>
              {expanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* Bottom row: Real + Progress + Proyección */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px', gap: 0, alignItems: 'center' }}>
          {/* Real acumulado */}
          <div>
            <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
              Real Acumulado
            </p>
            <p style={{ fontSize: 34, fontWeight: 900, color: PINK, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>
              {fmt(analysis.totalSold)}
            </p>
            {paceVsBudget != null &&
              <p style={{ fontSize: 9.5, marginTop: 4, fontWeight: 600, color: paceVsBudget >= 100 ? GREEN : AMBER }}>
                Ritmo {Math.round(paceVsBudget)}% vs ideal
              </p>
            }
          </div>

          {/* Progress Bar Central */}
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#64748b' }}>
                {budget > 0 ? `${Math.round((analysis.totalSold / budget) * 100)}%` : '—'}
              </span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 4 }}>del PPT del mes</span>
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(219,39,119,0.12)', position: 'relative', overflow: 'visible' }}>
              {budget > 0 && (() => {
                const pct = Math.min((analysis.totalSold / budget) * 100, 100);
                const monthPct = Math.min(analysis.monthProgress, 100);
                return (
                  <>
                    {/* Mes transcurrido (fondo claro) */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${monthPct}%`, borderRadius: 99,
                      background: 'rgba(219,39,119,0.18)'
                    }} />
                    {/* Avance real */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${pct}%`, borderRadius: 99,
                      background: `linear-gradient(90deg, ${PINK} 0%, rgba(194,24,117,0.7) 100%)`,
                      transition: 'width 0.6s cubic-bezier(0.23,1,0.32,1)'
                    }} />
                    {/* Marcador "hoy" del mes */}
                    <div style={{
                      position: 'absolute', top: '-3px', left: `${monthPct}%`,
                      transform: 'translateX(-50%)',
                      width: 2, height: 14, borderRadius: 2,
                      background: '#64748b', opacity: 0.5
                    }} />
                    {/* Dot al final del progreso real */}
                    <div style={{
                      position: 'absolute', top: '50%', left: `${pct}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 14, height: 14, borderRadius: '50%',
                      background: PINK, border: '2.5px solid white',
                      boxShadow: `0 0 6px ${PINK}66`
                    }} />
                  </>
                );
              })()}
            </div>
            <p style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>
              {budget > 0
                ? analysis.totalSold >= budget
                  ? '¡PPT superado! 🎉'
                  : `Faltan ${fmt(budget - analysis.totalSold)} para la meta`
                : 'Agrega PPT para ver progreso'}
            </p>
          </div>

          {/* Proyección */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
              Proyección de Cierre
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'flex-end' }}>
              <p style={{ fontSize: 34, fontWeight: 900, color: '#64748b', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif' }}>
                {fmt(analysis.projection)}
              </p>
              {projCompliance != null &&
                <span style={{ fontSize: 13, fontWeight: 800, color: projCompliance >= 100 ? GREEN : PINK, fontFamily: 'Inter Tight, sans-serif' }}>
                  {projCompliance.toFixed(0)}% PPT
                </span>
              }
            </div>
          </div>
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

            {/* ── DAILY COMPLIANCE CHART ── */}
            <div style={{ padding: '12px 16px 10px', background: 'linear-gradient(180deg, #fdfcff 0%, #ffffff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
                  Cumplimiento Diario — {format(new Date(), 'MMM yyyy', { locale: es }).toUpperCase()}
                </p>
                {analysis.bestDay &&
                  <p style={{ fontSize: 9, fontWeight: 700, color: PINK }}>
                    <Trophy style={{ width: 10, height: 10, display: 'inline', marginRight: 3 }} />
                    Mejor día: {fmt(analysis.bestDay.total_sales)} · día {parseInt(analysis.bestDay.date.split('-')[2])}
                  </p>
                }
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `${GREEN}88` }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>≥100% meta</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `${AMBER}88` }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>70-99% meta</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `${PINK}66` }} />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>&lt;70% meta</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.7" /></svg>
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 500 }}>Meta diaria ({fmt(analysis.dailyMeta)})</span>
                </div>
              </div>

              <DailyComplianceChart
                dailyData={analysis.dailyData}
                dailyMeta={analysis.dailyMeta}
                daysInMonth={analysis.daysInMonth}
                today={new Date()} />
            </div>

            {/* ── KPI ROW ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', padding: '0 4px', background: 'linear-gradient(180deg, #fdfcff 0%, #ffffff 100%)' }}>

              {/* Hit rate */}
              <div style={{ flex: 1, padding: '10px 14px', margin: '8px 6px', borderRadius: 12,
                border: `1.5px solid ${GREEN}40`, background: `${GREEN}06`,
                boxShadow: `0 2px 10px ${GREEN}15`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Días en Meta</p>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif', color: GREEN }}>
                    {analysis.hitRate != null ? `${Math.round(analysis.hitRate)}%` : '—'}
                  </p>
                  <p style={{ fontSize: 9.5, marginTop: 5, fontWeight: 600, color: '#94a3b8' }}>
                    {analysis.daysOnTarget} de {analysis.activeDays} días activos
                  </p>
                </div>
              </div>

              {/* Daily needed */}
              {analysis.dailyNeeded != null &&
                <div style={{ flex: 1, padding: '10px 14px', margin: '8px 6px', borderRadius: 12,
                  border: `1.5px solid ${AMBER}40`, background: `${AMBER}06`,
                  boxShadow: `0 2px 10px ${AMBER}15`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div>
                    <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Necesario/Día</p>
                    <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif', color: AMBER }}>
                      {fmt(Math.round(analysis.dailyNeeded))}
                    </p>
                    <p style={{ fontSize: 9.5, marginTop: 5, fontWeight: 600, color: '#94a3b8' }}>para cerrar al 100%</p>
                  </div>
                </div>
              }

              {/* Promedio/día */}
              <div style={{ flex: 1, padding: '10px 14px', margin: '8px 6px', borderRadius: 12,
                border: `1.5px solid ${PINK_MID}`, background: '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Promedio/Día</p>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif', color: '#64748b' }}>{fmt(analysis.dailyAvg)}</p>
                  <p style={{ fontSize: 9.5, marginTop: 5, fontWeight: 600, color: '#94a3b8' }}>{analysis.daysRemaining} días restantes</p>
                </div>
              </div>

              {/* Proyección */}
              <div style={{ flex: 1, padding: '10px 14px', margin: '8px 6px', borderRadius: 12,
                border: `1.5px solid rgba(219,39,119,0.25)`, background: 'rgba(219,39,119,0.04)',
                boxShadow: '0 2px 12px rgba(219,39,119,0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Proyección Cierre</p>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter Tight, sans-serif', color: PINK }}>{fmt(analysis.projection)}</p>
                  <p style={{ fontSize: 9.5, marginTop: 5, fontWeight: 600, color: PINK }}>al cierre del mes</p>
                </div>
              </div>
            </div>

            {/* ── FOOTER INSIGHT ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px',
              borderTop: `1px solid ${PINK_SOFT}`,
              background: isOnTrack === false ? 'rgba(245,158,11,0.04)' : isOnTrack === true ? 'rgba(16,185,129,0.04)' : 'rgba(219,39,119,0.04)'
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>
                <Zap style={{ width: 11, height: 11, display: 'inline', marginRight: 4, color: PINK }} />
                {fmt(analysis.totalSold)} vendido · proy. {fmt(analysis.projection)} · {analysis.daysOnTarget}/{analysis.activeDays} días en meta
              </p>
              <p style={{
                fontSize: 9.5, fontWeight: 700, flexShrink: 0, marginLeft: 16,
                color: isOnTrack === true ? GREEN : isOnTrack === false ? AMBER : PINK
              }}>
                {budget === 0 ?
                  'Agrega tu PPT para análisis completo 📊' :
                  compliance != null && compliance >= 100 ?
                    '¡PPT superado! 🚀' :
                    isOnTrack ?
                      'Proyecta cierre sobre meta 📈' :
                      `Necesitas ${fmt(analysis.dailyNeeded ?? 0)}/día para alcanzar el PPT`}
              </p>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>
  );
}