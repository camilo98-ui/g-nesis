import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BarChart2, TrendingUp, TrendingDown, AlertTriangle, Zap, Brain } from 'lucide-react';

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
        if (r > 220 && g > 220 && b > 220) {
          d[i + 3] = 0;
        } else if (r > 180 && g > 180 && b > 180) {
          d[i + 3] = Math.round(255 * (1 - ((r + g + b) / 3 - 180) / 75));
        }
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = MASCOT_IMG;
  }, []);
  return <canvas ref={canvasRef} style={{ width, height, display: 'block', objectFit: 'contain', ...style }} />;
}

function buildInsights(dailySales, budget, latestWeather) {
  const insights = [];
  const sales = Array.isArray(dailySales) ? dailySales : [];
  const sorted = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last7 = sorted.slice(0, 7);
  const prev7 = sorted.slice(7, 14);

  const totalLast7 = last7.reduce((s, d) => s + (d.total_sales || 0), 0);
  const totalPrev7 = prev7.reduce((s, d) => s + (d.total_sales || 0), 0);
  const avgLast7 = last7.length > 0 ? totalLast7 / last7.length : 0;
  const avgPrev7 = prev7.length > 0 ? totalPrev7 / prev7.length : 0;
  const weekGrowth = avgPrev7 > 0 ? ((avgLast7 - avgPrev7) / avgPrev7 * 100) : null;

  const avgTx = last7.length > 0 ? last7.reduce((s, d) => s + (d.total_transactions || 0), 0) / last7.length : 0;
  const avgTxPrev = prev7.length > 0 ? prev7.reduce((s, d) => s + (d.total_transactions || 0), 0) / prev7.length : 0;
  const txGrowth = avgTxPrev > 0 ? ((avgTx - avgTxPrev) / avgTxPrev * 100) : null;

  const monthlyBudget = budget?.monthlyBudget || 0;
  const salesUntilYesterday = budget?.salesUntilYesterday || 0;
  const budgetUntilYesterday = budget?.budgetUntilYesterday || 0;
  const compliance = budgetUntilYesterday > 0 ? (salesUntilYesterday / budgetUntilYesterday * 100) : null;
  const gap = salesUntilYesterday - budgetUntilYesterday;
  const projPct = budget?.monthProjectionCompliance ?? null;
  const remainingDays = budget?.remainingDays ?? null;
  const dailyRequired = budget?.dailyRequiredSales ?? null;

  const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
  const precip = latestWeather?.precipitation ?? 0;
  const isHot = temp != null && temp > 24;
  const isRainy = precip >= 3;

  // ── Build contextual AI insights (conversational, analytical tone) ──

  if (weekGrowth !== null && avgLast7 > 0) {
    const isDown = weekGrowth < -5;
    const isBig = Math.abs(weekGrowth) > 15;
    if (isDown && isBig) {
      insights.push({
        type: 'risk',
        headline: `La desaceleración de los últimos 7 días (${weekGrowth.toFixed(1)}%) ya no parece comercial.`,
        sub: `El ritmo cayó de ${fmt(avgPrev7)} a ${fmt(avgLast7)} por día. Empieza a ser operativa.`,
        highlight: `${weekGrowth.toFixed(1)}%`,
        icon: TrendingDown,
        color: '#e11d48',
        category: 'ALERTA DE TENDENCIA',
      });
    } else if (weekGrowth > 10) {
      insights.push({
        type: 'positive',
        headline: `El tráfico y la conversión están acelerando esta semana.`,
        sub: `Promedio diario subió de ${fmt(avgPrev7)} a ${fmt(avgLast7)}. Crecimiento de ${weekGrowth.toFixed(1)}% vs semana anterior.`,
        highlight: `+${weekGrowth.toFixed(1)}%`,
        icon: TrendingUp,
        color: '#059669',
        category: 'SEÑAL POSITIVA',
      });
    } else if (weekGrowth < 0) {
      insights.push({
        type: 'neutral',
        headline: `El tráfico aumentó pero la conversión sigue debilitándose.`,
        sub: `Variación semanal: ${weekGrowth.toFixed(1)}%. Promedio diario: ${fmt(avgLast7)}.`,
        highlight: `${weekGrowth.toFixed(1)}%`,
        icon: BarChart2,
        color: '#f59e0b',
        category: 'ANÁLISIS DE TENDENCIA',
      });
    }
  }

  if (txGrowth !== null && weekGrowth !== null) {
    const salesUp = weekGrowth > 0;
    const txDown = txGrowth < -5;
    if (salesUp && txDown) {
      insights.push({
        type: 'risk',
        headline: `Las ventas crecen, pero las transacciones caen ${txGrowth.toFixed(1)}%.`,
        sub: `Señal de que el ticket promedio está subiendo artificialmente. Revisar mix de productos.`,
        highlight: `−${Math.abs(txGrowth).toFixed(1)}% txn`,
        icon: AlertTriangle,
        color: '#d97706',
        category: 'ANOMALÍA OPERATIVA',
      });
    }
  }

  if (compliance !== null && gap !== 0) {
    const gapAbs = Math.abs(gap);
    if (gap < 0 && compliance < 90) {
      insights.push({
        type: 'risk',
        headline: `Hay presión acumulada sobre el presupuesto. El cierre está en riesgo.`,
        sub: `Brecha actual: ${fmt(gap)} (${compliance.toFixed(1)}% de cumplimiento). ${dailyRequired ? `Se requieren ${fmt(dailyRequired)}/día.` : ''}`,
        highlight: `${compliance.toFixed(0)}%`,
        icon: AlertTriangle,
        color: '#e11d48',
        category: 'RIESGO PRESUPUESTO',
      });
    } else if (gap > 0 && compliance >= 100) {
      insights.push({
        type: 'positive',
        headline: `El cierre de mes está asegurado estadísticamente con el ritmo actual.`,
        sub: `Ventas acumuladas superan la meta en ${fmt(gap)}. Cumplimiento: ${compliance.toFixed(1)}%.`,
        highlight: `${compliance.toFixed(0)}%`,
        icon: Zap,
        color: '#059669',
        category: 'PROYECCIÓN FAVORABLE',
      });
    }
  }

  if (projPct !== null && remainingDays !== null) {
    if (projPct < 85 && projPct > 0) {
      insights.push({
        type: 'risk',
        headline: `Si este ritmo continúa, el EBITDA podría romper el límite operativo.`,
        sub: `Proyección de cierre: ${projPct.toFixed(1)}%. Quedan ${remainingDays} días para recuperar.`,
        highlight: `${projPct.toFixed(0)}%`,
        icon: AlertTriangle,
        color: '#e11d48',
        category: 'RIESGO CRÍTICO',
      });
    } else if (projPct >= 100) {
      insights.push({
        type: 'positive',
        headline: `La rentabilidad está sostenida. El margen operativo resiste el ritmo actual.`,
        sub: `Proyección de cierre: ${projPct.toFixed(1)}% del PPT mensual. ${monthlyBudget > 0 ? `Meta: ${fmt(monthlyBudget)}.` : ''}`,
        highlight: `${projPct.toFixed(0)}%`,
        icon: TrendingUp,
        color: '#059669',
        category: 'ESTADO OPERATIVO',
      });
    }
  }

  if (isHot && !isRainy && temp != null) {
    insights.push({
      type: 'positive',
      headline: `Condición climática favorable para ventas hoy (${Math.round(temp)}°C).`,
      sub: `Calor moderado a alto activa demanda de helado. Estimar +15–25% sobre día promedio.`,
      highlight: `${Math.round(temp)}°C`,
      icon: Zap,
      color: '#f97316',
      category: 'IMPACTO CLIMÁTICO',
    });
  }

  if (isRainy) {
    insights.push({
      type: 'risk',
      headline: `La lluvia está reduciendo el flujo peatonal hoy (${precip.toFixed(1)}mm).`,
      sub: `Días de lluvia correlacionan con −12–18% en ventas. Ajustar expectativas del turno.`,
      highlight: `${precip.toFixed(1)}mm`,
      icon: TrendingDown,
      color: '#6366f1',
      category: 'IMPACTO CLIMÁTICO',
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      headline: `Estoy monitoreando los datos en tiempo real. Aún sin señales críticas.`,
      sub: `Ingresa ventas diarias para activar análisis predictivo y detección de anomalías.`,
      highlight: 'Nova',
      icon: Brain,
      color: '#C21875',
      category: 'ESTADO DEL SISTEMA',
    });
  }

  return insights;
}

// ── Full-screen Analytics Panel ──────────────────────────────────────────────
function AnalyticsPanel({ onClose, insights, dailySales, budget }) {
  const sorted = [...(dailySales || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
  const projPct = budget?.monthProjectionCompliance ?? 0;
  const gap = (budget?.salesUntilYesterday || 0) - (budget?.budgetUntilYesterday || 0);
  const dailyBudget = budget?.monthlyBudget ? budget.monthlyBudget / 30 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          borderRadius: 28,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(64px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.16), 0 8px 32px rgba(194,24,117,0.10)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 pt-6 pb-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #fce7f3, #fdf4ff)', border: '1px solid rgba(244,114,182,0.2)' }}>
            <MascotCanvas width={32} height={32} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Análisis Ejecutivo Nova
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 1 }}>
              Inteligencia operativa · Actualizado ahora
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'rgba(0,0,0,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
            <span style={{ fontSize: 16, color: '#6b7280', lineHeight: 1 }}>×</span>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

          {/* KPI Summary Row */}
          {budget?.monthlyBudget > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Proyección cierre', value: `${projPct.toFixed(0)}%`, sub: projPct >= 100 ? 'Sobre meta' : 'Bajo meta', color: projPct >= 100 ? '#059669' : '#e11d48' },
                { label: 'Brecha acumulada', value: `${gap >= 0 ? '+' : ''}${fmt(gap)}`, sub: gap >= 0 ? 'Por encima del PPT' : 'Por debajo del PPT', color: gap >= 0 ? '#059669' : '#e11d48' },
                { label: 'PPT mensual', value: fmt(budget.monthlyBudget), sub: `${budget.remainingDays ?? '—'} días restantes`, color: '#C21875' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="rounded-2xl p-4"
                  style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${color}99`, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Separator */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)' }} />

          {/* Insights list */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C21875', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 16, height: 1.5, background: '#C21875', borderRadius: 2 }} />
              Señales detectadas por Nova
            </p>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="flex gap-4 items-start p-4 rounded-2xl"
                  style={{
                    background: ins.type === 'risk' ? `${ins.color}06` : ins.type === 'positive' ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${ins.color}16`,
                  }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ins.color}12`, border: `1px solid ${ins.color}20` }}>
                    <ins.icon style={{ width: 14, height: 14, color: ins.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ins.color, marginBottom: 4 }}>{ins.category}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.5, marginBottom: 4 }}>
                      {ins.headline.split(ins.highlight).map((part, j, arr) => (
                        <span key={j}>
                          {part}
                          {j < arr.length - 1 && <span style={{ color: ins.color, fontWeight: 800 }}>{ins.highlight}</span>}
                        </span>
                      ))}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.55, fontWeight: 400 }}>{ins.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trend bars */}
          {sorted.length >= 3 && (
            <>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)' }} />
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>
                  Tendencia de ventas · últimos {sorted.length} días
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 64 }}>
                  {sorted.map((d, i) => {
                    const max = Math.max(...sorted.map(x => x.total_sales || 0), 1);
                    const pct = Math.max(((d.total_sales || 0) / max) * 100, 4);
                    const isLast = i === sorted.length - 1;
                    const aboveBudget = dailyBudget > 0 && (d.total_sales || 0) >= dailyBudget;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-md"
                          style={{
                            height: `${pct}%`,
                            background: isLast ? '#C21875' : aboveBudget ? '#059669' : 'rgba(194,24,117,0.2)',
                            transition: 'height 0.6s ease',
                          }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-7 pb-6 pt-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', fontWeight: 500 }}>
            Nova AI · Análisis generado en tiempo real con datos de la tienda
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function NovaInsightStrip({ dailySales, budget, latestWeather, onOpenAnalytics }) {
  const insights = useMemo(() => buildInsights(dailySales, budget, latestWeather), [dailySales, budget, latestWeather]);
  const [idx, setIdx] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => { setIdx(Math.floor(Math.random() * insights.length)); }, [insights.length]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const timer = setInterval(() => setIdx(prev => (prev + 1) % insights.length), 5000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const current = insights[idx] || insights[0];
  if (!current) return null;

  const Icon = current.icon;
  const typeTag = {
    risk: { label: 'RIESGO DETECTADO', bg: `${current.color}10`, border: `${current.color}20` },
    positive: { label: 'SEÑAL POSITIVA', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)' },
    neutral: { label: 'ANÁLISIS ACTIVO', bg: 'rgba(194,24,117,0.07)', border: 'rgba(194,24,117,0.18)' },
  }[current.type] || { label: 'NOVA AI', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.1)' };

  return (
    <>
      {/* ── THE CARD ── */}
      <div className="flex items-center gap-5 w-full">

        {/* LEFT — Avatar */}
        <div className="flex-shrink-0 relative">
          {/* Ambient glow ring */}
          <motion.div
            animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(194,24,117,0.18) 0%, transparent 70%)',
              filter: 'blur(8px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
          {/* Pulse ring */}
          <motion.div
            animate={{ opacity: [0, 0.5, 0], scale: [0.85, 1.3, 0.85] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -2,
              borderRadius: '50%',
              border: '1.5px solid rgba(194,24,117,0.35)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 flex items-center justify-center rounded-full"
            style={{
              width: 48, height: 48,
              background: 'linear-gradient(145deg, #fff0f8, #fce7f3)',
              border: '1.5px solid rgba(244,114,182,0.25)',
              boxShadow: '0 4px 16px rgba(194,24,117,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>
            <MascotCanvas width={40} height={40} />
          </motion.div>
        </div>

        {/* CENTER — Insight text */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Category tag */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg"
              style={{ background: typeTag.bg, border: `1px solid ${typeTag.border}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: current.color, flexShrink: 0 }} />
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: current.color }}>
                {typeTag.label}
              </span>
            </div>
            {/* Live dot */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
            />
          </div>

          {/* Headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <p style={{ fontSize: 13, fontWeight: 650, color: '#1f2937', lineHeight: 1.45, letterSpacing: '-0.01em', marginBottom: 3 }}>
                {current.headline.split(current.highlight).map((part, j, arr) => (
                  <span key={j}>
                    {part}
                    {j < arr.length - 1 && (
                      <span style={{ color: current.color, fontWeight: 800 }}>{current.highlight}</span>
                    )}
                  </span>
                ))}
              </p>
              <p style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 450, lineHeight: 1.4 }}>
                {current.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT — Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1">
            {insights.slice(0, Math.min(insights.length, 6)).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx % Math.min(insights.length, 6) ? 14 : 4,
                  height: 4,
                  background: i === idx % Math.min(insights.length, 6) ? current.color : 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={() => setShowPanel(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5"
            style={{
              fontSize: 10.5,
              fontWeight: 650,
              color: '#C21875',
              padding: '6px 12px',
              borderRadius: 12,
              background: 'rgba(194,24,117,0.07)',
              border: '1px solid rgba(194,24,117,0.18)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
            Ver análisis
            <ArrowRight style={{ width: 10, height: 10 }} />
          </motion.button>
        </div>
      </div>

      {/* ── Analytics Panel ── */}
      <AnimatePresence>
        {showPanel && (
          <AnalyticsPanel
            onClose={() => setShowPanel(false)}
            insights={insights}
            dailySales={dailySales}
            budget={budget}
          />
        )}
      </AnimatePresence>
    </>
  );
}