import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

// ── GLASSMORPHISM TOOLTIP ─────────────────────────────────────────────────────
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ticket = payload.find(p => p.dataKey === 'ticket');
  const meta = payload.find(p => p.dataKey === 'ticketPPT');

  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.165, 0.84, 0.44, 1] }}
      style={{
        background: 'rgba(12, 10, 18, 0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 77, 141, 0.18)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,77,141,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
        minWidth: 130,
        pointerEvents: 'none',
      }}>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </p>
      {ticket && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D8D', boxShadow: '0 0 6px #FF4D8D' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Ticket real</span>
          <span style={{ fontSize: 13, color: '#FF4D8D', fontWeight: 800, marginLeft: 'auto', letterSpacing: '-0.01em' }}>
            {fmt(ticket.value)}
          </span>
        </div>
      )}
      {meta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Meta PPT</span>
          <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 800, marginLeft: 'auto', letterSpacing: '-0.01em' }}>
            {fmt(meta.value)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── ANIMATED ENERGY DOT (AI pulse moving along line) ─────────────────────────
function EnergyDot({ data }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 8000; // ms for full traversal

  useEffect(() => {
    const loop = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) % DURATION;
      setProgress(elapsed / DURATION);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!data || data.length < 2) return null;

  // Interpolate position along data
  const n = data.length;
  const idx = progress * (n - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, n - 1);
  const t = idx - i0;

  const v0 = data[i0]?.ticket || 0;
  const v1 = data[i1]?.ticket || 0;
  const interpVal = v0 + (v1 - v0) * t;

  const allVals = data.map(d => d.ticket || 0).filter(v => v > 0);
  if (allVals.length < 2) return null;
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  // These will be positioned via recharts coordinate system hack using SVG overlay
  const xPct = (idx / (n - 1)) * 100;
  const yPct = 100 - ((interpVal - minV) / range) * 80 - 10; // rough mapping with padding

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: 'translate(-50%, -50%)',
      }}>
      {/* Outer halo */}
      <motion.div
        style={{
          width: 20, height: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,77,141,0.15) 0%, transparent 70%)',
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Core dot */}
      <motion.div
        style={{
          width: 5, height: 5,
          borderRadius: '50%',
          background: '#FF4D8D',
          boxShadow: '0 0 8px 2px rgba(255,77,141,0.7), 0 0 16px 4px rgba(255,77,141,0.25)',
          position: 'relative', zIndex: 2,
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

// ── SHIMMER OVERLAY ───────────────────────────────────────────────────────────
function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
      style={{ zIndex: 1 }}>
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.025) 50%, transparent 65%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      />
    </motion.div>
  );
}

// ── MICRO FLOAT WRAPPER ───────────────────────────────────────────────────────
function FloatWrapper({ children }) {
  return (
    <motion.div
      animate={{ y: [0, -1.5, 0, 1, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  );
}

// ── MAIN PREMIUM CHART ────────────────────────────────────────────────────────
export default function PremiumTicketChart({ data }) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Transition key: changes when data changes for smooth morph
  const dataKey = useMemo(() => data.map(d => d.ticket).join(','), [data]);

  return (
    <div className="relative" ref={containerRef}>
      <FloatWrapper>
        <div className="relative rounded-xl overflow-hidden" style={{ height: 140 }}>
          <ShimmerOverlay />

          {/* Draw-in animation wrapper */}
          <motion.div
            key={dataKey}
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ height: '100%', position: 'relative' }}>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  {/* Neon glow filter for the main line */}
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur1" />
                    <feGaussianBlur stdDeviation="1.5" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur1" />
                      <feMergeNode in="blur2" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Softer glow for area depth */}
                  <filter id="areaGlow" x="-5%" y="-5%" width="110%" height="120%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Multi-stop gradient for area fill */}
                  <linearGradient id="ticketAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.28" />
                    <stop offset="40%" stopColor="#FF4D8D" stopOpacity="0.12" />
                    <stop offset="75%" stopColor="#FF7FA5" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                  </linearGradient>

                  {/* Shimmer gradient for area */}
                  <linearGradient id="ticketShimmer" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0" />
                    <stop offset="50%" stopColor="#FFB4C9" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                  </linearGradient>

                  {/* Line gradient — color from hot pink to soft rose */}
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF2D78" />
                    <stop offset="50%" stopColor="#FF4D8D" />
                    <stop offset="100%" stopColor="#FF7FA5" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="0"
                  stroke="rgba(255,77,141,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 7, fill: '#9CA3AF', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />

                <Tooltip
                  content={<GlassTooltip />}
                  cursor={{
                    stroke: 'rgba(255,77,141,0.15)',
                    strokeWidth: 1,
                    strokeDasharray: '4 3',
                  }}
                />

                {/* Area fill — translucent depth layer */}
                <Area
                  type="monotoneCubicBezier"
                  dataKey="ticket"
                  stroke="none"
                  fill="url(#ticketAreaGrad)"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={false}
                />

                {/* Meta line — indigo dashed */}
                <Line
                  type="monotone"
                  dataKey="ticketPPT"
                  stroke="rgba(99,102,241,0.5)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  name="Meta PPT"
                />

                {/* MAIN LINE — glow + gradient stroke */}
                <Line
                  type="monotoneCubicBezier"
                  dataKey="ticket"
                  stroke="url(#lineGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  filter="url(#neonGlow)"
                  name="Ticket Real"
                  activeDot={{
                    r: 5,
                    fill: '#FF4D8D',
                    stroke: 'rgba(255,77,141,0.3)',
                    strokeWidth: 6,
                    filter: 'url(#neonGlow)',
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Energy AI dot overlay */}
          {mounted && (
            <div className="absolute inset-0 pointer-events-none" style={{ padding: '12px 16px 0 0' }}>
              <EnergyDot data={data} />
            </div>
          )}
        </div>
      </FloatWrapper>
    </div>
  );
}