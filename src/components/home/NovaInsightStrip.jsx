import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Activity, BarChart2, Minus } from 'lucide-react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

const fmt = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
}).format(Math.round(v || 0));

function MascotCanvas({ width = 40, height = 40, style = {} }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 220 && g > 220 && b > 220) { d[i + 3] = 0; }
        else if (r > 180 && g > 180 && b > 180) {
          d[i + 3] = Math.round(255 * (1 - ((r + g + b) / 3 - 180) / 75));
        }
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = MASCOT_IMG;
  }, []);
  return <canvas ref={canvasRef} style={{ width, height, display: 'block', objectFit: 'contain', ...style }} />;
}

// ── Insight generation: pure executive language, no KPI noise ─────────────────
function buildInsights(dailySales, budget, latestWeather) {
  const insights = [];
  const sales = Array.isArray(dailySales) ? dailySales : [];
  const sorted = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last7 = sorted.slice(0, 7);
  const prev7 = sorted.slice(7, 14);

  const avgLast7 = last7.length > 0 ? last7.reduce((s, d) => s + (d.total_sales || 0), 0) / last7.length : 0;
  const avgPrev7 = prev7.length > 0 ? prev7.reduce((s, d) => s + (d.total_sales || 0), 0) / prev7.length : 0;
  const weekGrowth = avgPrev7 > 0 ? ((avgLast7 - avgPrev7) / avgPrev7 * 100) : null;

  const avgTx = last7.length > 0 ? last7.reduce((s, d) => s + (d.total_transactions || 0), 0) / last7.length : 0;
  const avgTxPrev = prev7.length > 0 ? prev7.reduce((s, d) => s + (d.total_transactions || 0), 0) / prev7.length : 0;
  const txGrowth = avgTxPrev > 0 ? ((avgTx - avgTxPrev) / avgTxPrev * 100) : null;

  const monthlyBudget = budget?.monthlyBudget || 0;
  const salesUntil = budget?.salesUntilYesterday || 0;
  const budgetUntil = budget?.budgetUntilYesterday || 0;
  const compliance = budgetUntil > 0 ? (salesUntil / budgetUntil * 100) : null;
  const gap = salesUntil - budgetUntil;
  const projPct = budget?.monthProjectionCompliance ?? null;
  const remainingDays = budget?.remainingDays ?? null;

  const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
  const precip = latestWeather?.precipitation ?? 0;

  // ── Craft sophisticated, interpretive insights ──

  if (weekGrowth !== null && txGrowth !== null) {
    const salesUp = weekGrowth > 3;
    const salesDown = weekGrowth < -5;
    const txDown = txGrowth < -5;
    const txUp = txGrowth > 3;

    if (salesUp && txDown) {
      insights.push({
        line1: "La venta crece, pero las transacciones retroceden.",
        line2: "La productividad por operación sube — no el volumen.",
        mood: 'observe',
      });
    } else if (salesDown && weekGrowth < -15) {
      insights.push({
        line1: "La desaceleración ya no parece comercial.",
        line2: "Empieza a sentirse operativa.",
        mood: 'tension',
      });
    } else if (salesDown) {
      insights.push({
        line1: "El ritmo comercial está cediendo esta semana.",
        line2: "La tendencia no se recupera sola.",
        mood: 'tension',
      });
    } else if (salesUp && txUp) {
      insights.push({
        line1: "El crecimiento es real — volumen y conversión avanzan juntos.",
        line2: "La operación responde al ritmo del mercado.",
        mood: 'stable',
      });
    } else if (salesUp) {
      insights.push({
        line1: "La venta mantiene su trayectoria ascendente.",
        line2: "La eficiencia operativa todavía no la acompaña al mismo ritmo.",
        mood: 'observe',
      });
    }
  }

  if (compliance !== null && gap !== 0) {
    if (gap < 0 && compliance < 88) {
      insights.push({
        line1: "La operación parece estable superficialmente.",
        line2: "El deterioro empieza a aparecer debajo.",
        mood: 'tension',
      });
    } else if (gap < 0 && compliance < 95) {
      insights.push({
        line1: "La recuperación existe.",
        line2: "La rentabilidad todavía no la acompaña.",
        mood: 'observe',
      });
    } else if (compliance >= 100 && projPct !== null && projPct >= 100) {
      insights.push({
        line1: "El cierre del mes tiene base sólida.",
        line2: "La estructura resiste el ritmo actual.",
        mood: 'stable',
      });
    }
  }

  if (projPct !== null && remainingDays !== null) {
    if (projPct < 82) {
      insights.push({
        line1: "El margen operativo empieza a sentir la presión acumulada.",
        line2: "Queda tiempo — pero el margen de maniobra se estrecha.",
        mood: 'tension',
      });
    } else if (projPct >= 105) {
      insights.push({
        line1: "El ritmo comercial está sólido y con proyección favorable.",
        line2: "La presión empieza a trasladarse al margen, no a la venta.",
        mood: 'observe',
      });
    }
  }

  if (weekGrowth !== null && compliance !== null) {
    const divergence = weekGrowth > 8 && compliance < 90;
    if (divergence) {
      insights.push({
        line1: "Las ventas aceleran, pero el acumulado no refleja la mejora.",
        line2: "Puede ser un rebote puntual. Es pronto para confirmarlo.",
        mood: 'observe',
      });
    }
  }

  if (precip >= 4) {
    insights.push({
      line1: "El clima está comprimiendo el tráfico externo hoy.",
      line2: "La conversión interior determina el cierre del día.",
      mood: 'observe',
    });
  } else if (temp != null && temp > 26) {
    insights.push({
      line1: "Las condiciones externas favorecen la demanda hoy.",
      line2: "La ejecución interna decide cuánto se captura.",
      mood: 'stable',
    });
  }

  // Fallback — always elegant, never generic
  if (insights.length === 0) {
    insights.push({
      line1: "Estoy observando la operación en tiempo real.",
      line2: "Sin señales críticas visibles en este momento.",
      mood: 'stable',
    });
  }

  return insights;
}

// ── Mood config: subtle, non-aggressive palette ───────────────────────────────
const MOOD = {
  tension: {
    glow: 'rgba(248,113,113,0.12)',
    dot: '#f87171',
    label: 'observando tensión',
    labelColor: 'rgba(248,113,113,0.7)',
  },
  observe: {
    glow: 'rgba(194,24,117,0.10)',
    dot: '#C21875',
    label: 'analizando',
    labelColor: 'rgba(194,24,117,0.6)',
  },
  stable: {
    glow: 'rgba(167,139,250,0.10)',
    dot: '#a78bfa',
    label: 'estable',
    labelColor: 'rgba(167,139,250,0.7)',
  },
};

// ── Typing text effect ────────────────────────────────────────────────────────
function TypedText({ text, speed = 28, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{ display: 'inline-block', width: 1.5, height: '0.9em', background: 'currentColor', marginLeft: 1, verticalAlign: 'middle', borderRadius: 1 }}
        />
      )}
    </span>
  );
}

// ── Full-screen analytics panel ───────────────────────────────────────────────
function AnalyticsPanel({ onClose, insights, dailySales, budget }) {
  const sorted = [...(dailySales || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
  const projPct = budget?.monthProjectionCompliance ?? 0;
  const gap = (budget?.salesUntilYesterday || 0) - (budget?.budgetUntilYesterday || 0);
  const dailyBudget = budget?.monthlyBudget ? budget.monthlyBudget / 30 : 0;
  const maxSales = Math.max(...sorted.map(d => d.total_sales || 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(10,10,20,0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 680,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(80px)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 48px 120px rgba(0,0,0,0.16), 0 12px 40px rgba(194,24,117,0.08)',
        }}
      >
        {/* Ambient gradient top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(251,207,232,0.32) 0%, transparent 70%)',
          borderRadius: '32px 32px 0 0', pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 44, height: 44, borderRadius: 16,
              background: 'linear-gradient(145deg, #fff0f8, #fce7f3)',
              border: '1px solid rgba(244,114,182,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(194,24,117,0.10)',
            }}>
            <MascotCanvas width={34} height={34} />
          </motion.div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 750, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Análisis ejecutivo
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
              Nova · inteligencia operativa en tiempo real
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '24px 28px 28px' }}>

          {/* KPI row — muted, minimal */}
          {budget?.monthlyBudget > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
              {[
                {
                  label: 'Proyección de cierre',
                  value: `${projPct.toFixed(0)}%`,
                  sub: projPct >= 100 ? 'Por encima del objetivo' : 'Por debajo del objetivo',
                  positive: projPct >= 100,
                },
                {
                  label: 'Brecha acumulada',
                  value: gap >= 0 ? `+${fmt(gap)}` : fmt(gap),
                  sub: gap >= 0 ? 'Sobre el presupuesto' : 'Bajo el presupuesto',
                  positive: gap >= 0,
                },
                {
                  label: 'Objetivo mensual',
                  value: fmt(budget.monthlyBudget),
                  sub: `${budget.remainingDays ?? '—'} días restantes`,
                  positive: null,
                },
              ].map(({ label, value, sub, positive }) => (
                <div key={label} style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: 'rgba(248,250,252,0.8)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>{label}</p>
                  <p style={{
                    fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
                    color: positive === null ? '#1e293b' : positive ? '#059669' : '#e11d48',
                  }}>{value}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 5, fontWeight: 400 }}>{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Separator with label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.05)' }} />
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#cbd5e1' }}>
              Lo que Nova está viendo
            </p>
            <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.05)' }} />
          </div>

          {/* Insights — editorial style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {insights.map((ins, i) => {
              const m = MOOD[ins.mood] || MOOD.observe;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}
                >
                  {/* Mood indicator */}
                  <div style={{ paddingTop: 4, flexShrink: 0 }}>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
                      style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: m.dot,
                        boxShadow: `0 0 8px ${m.dot}60`,
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 580, color: '#1e293b', lineHeight: 1.5, marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {ins.line1}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 400, color: '#64748b', lineHeight: 1.5, letterSpacing: '-0.005em' }}>
                      {ins.line2}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Trend chart — minimal bars */}
          {sorted.length >= 4 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.05)' }} />
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#cbd5e1' }}>
                  Tendencia · {sorted.length} días
                </p>
                <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.05)' }} />
              </div>

              <div style={{ padding: '16px 0', display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
                {sorted.map((d, i) => {
                  const pct = Math.max(((d.total_sales || 0) / maxSales) * 100, 3);
                  const isLast = i === sorted.length - 1;
                  const aboveBudget = dailyBudget > 0 && (d.total_sales || 0) >= dailyBudget;
                  const bg = isLast ? '#C21875' : aboveBudget ? 'rgba(167,139,250,0.45)' : 'rgba(203,213,225,0.6)';
                  return (
                    <div key={i} style={{
                      flex: 1, height: `${pct}%`,
                      borderRadius: '4px 4px 2px 2px',
                      background: bg,
                      transition: 'height 0.5s ease',
                    }} />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px 20px',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 450 }}>
            Nova · análisis generado con datos reales de la operación
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function NovaInsightStrip({ dailySales, budget, latestWeather }) {
  const insights = useMemo(() => buildInsights(dailySales, budget, latestWeather), [dailySales, budget, latestWeather]);
  const [idx, setIdx] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [line1Done, setLine1Done] = useState(false);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * insights.length));
  }, [insights.length]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => {
      setIdx(prev => (prev + 1) % insights.length);
      setLine1Done(false);
    }, 7000);
    return () => clearInterval(t);
  }, [insights.length]);

  // reset typing on idx change
  useEffect(() => { setLine1Done(false); }, [idx]);

  const current = insights[idx] || insights[0];
  if (!current) return null;

  const mood = MOOD[current.mood] || MOOD.observe;
  const dotCount = Math.min(insights.length, 5);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%' }}>

        {/* ── LEFT: Avatar ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Soft ambient glow */}
          <motion.div
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.88, 1.12, 0.88] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              background: `radial-gradient(circle, ${mood.glow} 0%, transparent 70%)`,
              filter: 'blur(10px)',
              pointerEvents: 'none',
            }}
          />
          {/* Pulse ring */}
          <motion.div
            animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.35, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -3, borderRadius: '50%',
              border: `1.5px solid ${mood.dot}`,
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />
          {/* Avatar container */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(145deg, #fff8fc, #fce7f3)',
              border: '1.5px solid rgba(244,114,182,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(194,24,117,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <MascotCanvas width={38} height={38} />
          </motion.div>
        </div>

        {/* ── CENTER: Text ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Mood micro-label */}
          <motion.div
            key={`label-${idx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
            }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: mood.dot, flexShrink: 0,
              }}
            />
            <span style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: mood.labelColor,
            }}>
              Nova · {mood.label}
            </span>
          </motion.div>

          {/* Insight lines */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <p style={{
                fontSize: 13.5, fontWeight: 580, color: '#1e293b',
                lineHeight: 1.4, letterSpacing: '-0.015em',
                marginBottom: 3,
              }}>
                <TypedText text={current.line1} speed={22} onDone={() => setLine1Done(true)} />
              </p>
              <AnimatePresence>
                {line1Done && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                      fontSize: 11.5, fontWeight: 400, color: '#94a3b8',
                      lineHeight: 1.45, letterSpacing: '-0.01em',
                    }}
                  >
                    {current.line2}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Dot navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setLine1Done(false); }}
                style={{
                  height: 4, borderRadius: 99, border: 'none', cursor: 'pointer',
                  width: i === idx % dotCount ? 16 : 4,
                  background: i === idx % dotCount ? mood.dot : 'rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={() => setShowPanel(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, color: '#64748b',
              padding: '7px 13px', borderRadius: 12,
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.07)',
              letterSpacing: '-0.01em', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#C21875';
              e.currentTarget.style.background = 'rgba(194,24,117,0.06)';
              e.currentTarget.style.borderColor = 'rgba(194,24,117,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)';
            }}
          >
            Ver análisis
            <ArrowRight style={{ width: 10, height: 10 }} />
          </motion.button>
        </div>
      </div>

      {/* ── Panel — rendered via portal over everything ── */}
      {showPanel && createPortal(
        <AnimatePresence>
          <AnalyticsPanel
            key="analytics"
            onClose={() => setShowPanel(false)}
            insights={insights}
            dailySales={dailySales}
            budget={budget}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}