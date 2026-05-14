import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Coffee, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const startVal = 0;
    start.current = null;

    const step = (timestamp) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return <>{display}</>;
}

// ── Mini Glow Sparkline SVG ───────────────────────────────────────────────────
function GlowSparkline({ data, color = '#be185d', width = 220, height = 56 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 6;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;

  // Projection dots (last 2 points repeated forward)
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const dx = last[0] - prev[0];
  const dy = last[1] - prev[1];
  const proj1 = [last[0] + dx * 0.8, last[1] + dy * 0.6];
  const proj2 = [last[0] + dx * 1.6, last[1] + dy * 1.1];
  const projPath = `M${last[0]},${last[1]} L${proj1[0]},${proj1[1]} L${proj2[0]},${proj2[1]}`;

  const gradId = `grad-${color.replace('#', '')}`;
  const glowId = `glow-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Main line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        filter={`url(#${glowId})`} />

      {/* Projection dashes */}
      <path d={projPath} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3"
        strokeOpacity="0.4" strokeLinecap="round" />

      {/* Last point dot */}
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="white" stroke={color} strokeWidth="2"
        filter={`url(#${glowId})`} />
    </svg>
  );
}

// ── Mini Bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, color = '#be185d', height = 40 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => {
        const pct = Math.max((v / max) * 100, 6);
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                height: `${pct}%`,
                background: isLast ? color : `${color}28`,
                borderRadius: '3px 3px 0 0',
                width: '100%',
                transformOrigin: 'bottom',
                boxShadow: isLast ? `0 0 8px ${color}55` : 'none'
              }}
            />
            <span style={{ fontSize: 8, color: isLast ? color : '#cbd5e1', fontWeight: isLast ? 700 : 500 }}>
              {DAYS[i % 7]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini Donut ────────────────────────────────────────────────────────────────
function MiniDonut({ pct = 0.72, color = '#be185d', size = 56 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * circ;
  const cx = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="donut-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
      <motion.circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        filter="url(#donut-glow)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
      />
    </svg>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', icon: Sun };
  if (h < 18) return { text: 'Buenas tardes', icon: Coffee };
  return { text: 'Buenas noches', icon: Moon };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PremiumDashboardHeader({
  selectedStore, onStoreChange,
  isGerente,
  salesVal, txnVal, ticketVal,
  salesChange,
  sparkSales, sparkTxn,
  budget, sorted,
  onShowBudgetImporter, onShowKpisUploader, onShowPYGUploader
}) {
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  // Projection percentage
  const totalSales = sorted.reduce((s, d) => s + (d.total_sales || 0), 0);
  const totalBudget = budget.reduce((s, b) => s + (b.sales_budget || 0), 0);
  const projPct = totalBudget > 0 ? Math.round((totalSales / totalBudget) * 100) : 0;
  const isAbove = projPct >= 100;
  const isNear = projPct >= 80 && projPct < 100;
  const accentColor = isAbove ? '#10b981' : isNear ? '#f59e0b' : '#be185d';
  const statusText = isAbove
    ? 'Si mantienes este ritmo cerrarías sobre meta.'
    : isNear
    ? 'Estás cerca de la meta. ¡Un empujón más!'
    : 'Necesitas acelerar el ritmo para alcanzar el presupuesto.';

  const insightText = salesChange > 0
    ? `Hoy vas +${salesChange}% sobre el promedio.`
    : salesChange < 0
    ? `Hoy vas ${salesChange}% bajo el promedio.`
    : 'Sin comparativa disponible aún.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="mb-8 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1a1035 50%, #0f1e2e 100%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.05) inset',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ position: 'absolute' }}>
        <div style={{
          position: 'absolute', top: -60, left: '30%',
          width: 320, height: 220,
          background: 'radial-gradient(ellipse, rgba(190,24,93,0.13) 0%, transparent 70%)',
          filter: 'blur(30px)'
        }} />
        <div style={{
          position: 'absolute', bottom: -40, right: '10%',
          width: 200, height: 160,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)',
          filter: 'blur(24px)'
        }} />
      </div>

      <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-6">

        {/* ── LEFT: Greeting + insight ── */}
        <div className="flex-shrink-0 lg:w-52">
          <div className="flex items-center gap-2 mb-1">
            <GreetIcon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em' }}>
              {greeting.text}
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Camilo
          </h2>
          {insightText !== 'Sin comparativa disponible aún.' && (
            <p style={{ fontSize: 11, color: accentColor, fontWeight: 600, marginTop: 6, opacity: 0.9 }}>
              {insightText}
            </p>
          )}
        </div>

        {/* ── CENTER: Hero KPI + sparkline + progress ── */}
        <div className="flex-1 flex flex-col items-center text-center">
          {/* KPI gigante */}
          <div className="mb-1">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Proyección de cierre
            </span>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <motion.span
              key={projPct}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{
                fontSize: 64,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'rgba(255,255,255,0.95)',
                fontVariantNumeric: 'tabular-nums'
              }}>
              {totalBudget > 0 ? <AnimatedNumber value={projPct} /> : '—'}
            </motion.span>
            {totalBudget > 0 && (
              <span style={{ fontSize: 28, fontWeight: 700, color: accentColor, marginBottom: 8 }}>%</span>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 14, fontWeight: 500 }}>
            {statusText}
          </p>

          {/* Glow sparkline */}
          <div className="mb-3">
            <GlowSparkline
              data={sparkSales.length > 1 ? sparkSales : [3, 4, 3.5, 5, 4.2, 5.8, 6]}
              color={accentColor}
              width={220}
              height={52}
            />
          </div>

          {/* Progress bar premium */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Cumplimiento
              </span>
              <span style={{ fontSize: 9, color: accentColor, fontWeight: 700 }}>
                {projPct}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(projPct, 100)}%` }}
                transition={{ duration: 1.3, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
                style={{
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
                  boxShadow: `0 0 8px ${accentColor}88`
                }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: 3 mini cards + store selector ── */}
        <div className="flex-shrink-0 flex flex-col gap-3 lg:w-64">

          {/* Store selector */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} dark />
          </div>

          {/* 3 mini stat cards */}
          <div className="grid grid-cols-3 gap-2">

            {/* Ventas — barras */}
            <div className="rounded-2xl p-2.5 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Ventas
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                {salesVal}
              </span>
              <MiniBarChart
                data={sparkSales.length > 0 ? sparkSales.slice(-7) : [3, 4, 4, 5, 4, 6, 5]}
                color="#be185d"
                height={32}
              />
            </div>

            {/* Transacciones — sparkline */}
            <div className="rounded-2xl p-2.5 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Txn
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {txnVal}
              </span>
              <GlowSparkline
                data={sparkTxn.length > 1 ? sparkTxn : [20, 28, 24, 32, 27, 35, 30]}
                color="#818cf8"
                width={72}
                height={32}
              />
            </div>

            {/* Ticket — donut */}
            <div className="rounded-2xl p-2.5 flex flex-col items-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, alignSelf: 'flex-start' }}>
                PPT
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 3, alignSelf: 'flex-start' }}>
                {ticketVal}
              </span>
              <MiniDonut
                pct={totalBudget > 0 ? Math.min(totalSales / totalBudget, 1) : 0.62}
                color="#10b981"
                size={42}
              />
            </div>
          </div>

          {/* Gerente quick pills */}
          {isGerente && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'PPT', onClick: onShowBudgetImporter },
                { label: 'KPIs', onClick: onShowKpisUploader },
                { label: 'P&G', onClick: onShowPYGUploader },
              ].map(({ label, onClick }) => (
                <button key={label} onClick={onClick}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}