/**
 * NovaInsightStrip
 * ────────────────────────────────────────────────────────────────────────────
 * Ultra-premium executive AI copilot interface.
 * Nova is a living strategic intelligence — not a dashboard widget.
 * She interprets behavior, not metrics.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Minus } from 'lucide-react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtCOP = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP',
  minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(Math.round(v || 0));

const fmtCompact = (v) => {
  if (!v) return '—';
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
};

// ─── Nova Avatar — renders mascot image removing white background ─────────────
function NovaAvatar({ size = 44 }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (r > 220 && g > 220 && b > 220) { px[i + 3] = 0; }
        else if (r > 180 && g > 180 && b > 180) {
          px[i + 3] = Math.round(255 * (1 - ((r + g + b) / 3 - 180) / 75));
        }
      }
      ctx.putImageData(d, 0, 0);
      setLoaded(true);
    };
    img.src = MASCOT_IMG;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size, height: size,
        display: 'block', objectFit: 'contain',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    />
  );
}

// ─── Typing cursor effect ─────────────────────────────────────────────────────
function TypewriterText({ text, speed = 24, delay = 0, onDone }) {
  const [chars, setChars] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setChars('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const start = setTimeout(() => {
      timerRef.current = setInterval(() => {
        i++;
        setChars(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timerRef.current);
          setDone(true);
          onDone?.();
        }
      }, speed);
    }, delay);
    return () => { clearTimeout(start); clearInterval(timerRef.current); };
  }, [text, speed, delay]);

  return (
    <span>
      {chars}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            display: 'inline-block', width: 1.5, height: '0.85em',
            background: 'currentColor', verticalAlign: 'middle',
            marginLeft: 1.5, borderRadius: 1,
          }}
        />
      )}
    </span>
  );
}

// ─── Insight generation — data-driven executive intelligence ─────────────────
function buildInsights(dailySales = [], budget = null, weather = null) {
  const insights = [];
  const sales = [...dailySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last7 = sales.slice(0, 7);
  const prev7 = sales.slice(7, 14);

  const avg7 = last7.length ? last7.reduce((s, d) => s + (d.total_sales || 0), 0) / last7.length : 0;
  const avgPrev7 = prev7.length ? prev7.reduce((s, d) => s + (d.total_sales || 0), 0) / prev7.length : 0;
  const salesDelta = avgPrev7 > 0 ? ((avg7 - avgPrev7) / avgPrev7 * 100) : null;

  const avgTx7 = last7.length ? last7.reduce((s, d) => s + (d.total_transactions || 0), 0) / last7.length : 0;
  const avgTxPrev7 = prev7.length ? prev7.reduce((s, d) => s + (d.total_transactions || 0), 0) / prev7.length : 0;
  const txDelta = avgTxPrev7 > 0 ? ((avgTx7 - avgTxPrev7) / avgTxPrev7 * 100) : null;

  const avgTicket7 = last7.length ? last7.reduce((s, d) => s + ((d.total_sales || 0) / Math.max(d.total_transactions || 1, 1)), 0) / last7.length : 0;
  const avgTicketPrev7 = prev7.length ? prev7.reduce((s, d) => s + ((d.total_sales || 0) / Math.max(d.total_transactions || 1, 1)), 0) / prev7.length : 0;
  const ticketDelta = avgTicketPrev7 > 0 ? ((avgTicket7 - avgTicketPrev7) / avgTicketPrev7 * 100) : null;

  const salesYday = budget?.salesUntilYesterday || 0;
  const budgetYday = budget?.budgetUntilYesterday || 0;
  const compliance = budgetYday > 0 ? (salesYday / budgetYday * 100) : null;
  const gap = salesYday - budgetYday;
  const projPct = budget?.monthProjectionCompliance ?? null;
  const remainDays = budget?.remainingDays ?? null;

  const temp = weather?.temperature_mean ?? weather?.temperature_max;
  const precip = weather?.precipitation ?? 0;

  // ── Construct a rich, varied pool of insights based on real data ──────────

  // Weekly trend group — multiple variants so Nova never repeats
  if (salesDelta !== null && txDelta !== null) {
    const salesUp = salesDelta > 3;
    const salesDown = salesDelta < -4;
    const txDown = txDelta < -4;
    const txUp = txDelta > 4;

    if (salesUp && txDown && ticketDelta !== null && ticketDelta > 5) {
      insights.push({ line1: `La venta creció ${salesDelta.toFixed(1)}% esta semana,`, line2: `pero las transacciones cayeron ${Math.abs(txDelta).toFixed(1)}pp. El ticket promedio sube — el volumen no.`, mood: 'observing' });
      insights.push({ line1: `Hay más valor por operación, pero menos operaciones.`, line2: `El crecimiento real requiere que ambas variables avancen juntas.`, mood: 'observing' });
      insights.push({ line1: `El ticket promedio sube. El flujo de clientes no.`, line2: `La dinámica está cambiando — la base de volumen se está comprimiendo.`, mood: 'observing' });
    } else if (salesDown && txDown) {
      insights.push({ line1: `La desaceleración ya no parece comercial.`, line2: `Ventas y transacciones retroceden simultáneamente. Empieza a sentirse operativa.`, mood: 'tension' });
      insights.push({ line1: `Detecto contracción en ambas dimensiones esta semana.`, line2: `Cuando venta y volumen caen juntos, la recuperación no es automática.`, mood: 'tension' });
      insights.push({ line1: `La operación está perdiendo ritmo en dos frentes.`, line2: `Todavía es manejable — pero la ventana para actuar se cierra.`, mood: 'tension' });
    } else if (salesDown && Math.abs(salesDelta) > 10) {
      insights.push({ line1: `Detecto una contracción del ${Math.abs(salesDelta).toFixed(1)}% frente a la semana previa.`, line2: `El patrón no se recupera por sí solo.`, mood: 'tension' });
      insights.push({ line1: `La venta retrocedió ${Math.abs(salesDelta).toFixed(1)}% esta semana.`, line2: `No es ruido — es una señal que requiere interpretación.`, mood: 'tension' });
    } else if (salesDown) {
      insights.push({ line1: `El ritmo comercial cedió ${Math.abs(salesDelta).toFixed(1)}% esta semana.`, line2: `La tendencia necesita corrección antes de que se consolide.`, mood: 'tension' });
      insights.push({ line1: `La venta está debajo del promedio reciente.`, line2: `Todavía dentro de rango controlable — pero la inercia importa.`, mood: 'observing' });
    } else if (salesUp && txUp) {
      insights.push({ line1: `El crecimiento es estructural esta semana.`, line2: `Volumen y conversión avanzan al mismo ritmo — señal de ejecución real.`, mood: 'stable' });
      insights.push({ line1: `La operación está funcionando bien en todas sus dimensiones.`, line2: `Venta, transacciones y ticket promedio se mueven en la dirección correcta.`, mood: 'stable' });
      insights.push({ line1: `Esta semana el equipo está ejecutando de forma integral.`, line2: `El crecimiento tiene base sólida — no depende de un solo factor.`, mood: 'stable' });
    } else if (salesUp) {
      insights.push({ line1: `La venta mantiene trayectoria ascendente.`, line2: `La eficiencia operativa todavía no la acompaña al mismo ritmo.`, mood: 'observing' });
      insights.push({ line1: `Las ventas mejoraron ${salesDelta.toFixed(1)}% esta semana.`, line2: `El volumen crece — la productividad por transacción todavía no responde igual.`, mood: 'observing' });
    }
  }

  // Budget & projection group
  if (compliance !== null) {
    if (compliance < 85 && remainDays !== null && remainDays < 12) {
      insights.push({ line1: `Proyección actual: ${projPct?.toFixed(0) ?? '—'}% del objetivo mensual.`, line2: `Quedan ${remainDays} días. El margen de maniobra se está cerrando.`, mood: 'tension' });
      insights.push({ line1: `La brecha acumulada pesa sobre el cierre del mes.`, line2: `Con ${remainDays} días restantes, el ritmo diario requerido escala significativamente.`, mood: 'tension' });
    } else if (compliance < 90) {
      insights.push({ line1: `La operación parece estable superficialmente.`, line2: `El acumulado está ${Math.abs(100 - compliance).toFixed(0)}pp por debajo del presupuesto esperado.`, mood: 'observing' });
      insights.push({ line1: `Hay una brecha silenciosa en el acumulado del mes.`, line2: `No es crítica todavía — pero ignoring it tiene costo compuesto.`, mood: 'observing' });
      insights.push({ line1: `El presupuesto mensual tiene una brecha de ${Math.abs(100 - compliance).toFixed(0)}pp.`, line2: `La recuperación existe pero requiere ritmo sostenido, no picos aislados.`, mood: 'observing' });
    } else if (compliance >= 103 && projPct !== null && projPct >= 103) {
      insights.push({ line1: `El cierre del mes tiene base sólida.`, line2: `La proyección apunta a ${projPct.toFixed(0)}% del objetivo — la presión ahora está en el margen.`, mood: 'stable' });
      insights.push({ line1: `La operación está sobre el presupuesto.`, line2: `El reto ahora no es el volumen — es proteger la eficiencia mientras crece.`, mood: 'stable' });
    } else if (compliance >= 98) {
      insights.push({ line1: `La recuperación existe.`, line2: `La rentabilidad todavía no la acompaña con la misma consistencia.`, mood: 'observing' });
      insights.push({ line1: `El acumulado está dentro de rango.`, line2: `Estoy observando si el ritmo es sostenible o depende de factores puntuales.`, mood: 'observing' });
    }
  }

  // Ticket & productivity insights
  if (ticketDelta !== null && Math.abs(ticketDelta) > 4) {
    if (ticketDelta > 4) {
      insights.push({ line1: `El ticket promedio mejoró ${ticketDelta.toFixed(1)}% frente a la semana anterior.`, line2: `Cada transacción genera más valor. Eso no siempre se sostiene solo.`, mood: 'stable' });
      insights.push({ line1: `La eficiencia por transacción está subiendo.`, line2: `El reto es replicarlo con consistencia — no depender de días atípicos.`, mood: 'observing' });
    } else {
      insights.push({ line1: `El ticket promedio retrocedió ${Math.abs(ticketDelta).toFixed(1)}% esta semana.`, line2: `Cada operación genera menos valor. La venta crece en volumen, no en profundidad.`, mood: 'observing' });
      insights.push({ line1: `La productividad por transacción está bajo presión.`, line2: `Es un indicador adelantado — suele aparecer antes que la venta total lo refleje.`, mood: 'observing' });
    }
  }

  // Weather context
  if (precip >= 5) {
    insights.push({ line1: `Las condiciones climáticas están comprimiendo el tráfico externo hoy.`, line2: `La conversión interior y el cierre activo determinan el resultado del día.`, mood: 'observing' });
    insights.push({ line1: `Lluvia significativa detectada.`, line2: `Los días de bajo tráfico revelan la verdadera capacidad de conversión del equipo.`, mood: 'observing' });
  } else if (temp != null && temp > 27) {
    insights.push({ line1: `Las condiciones climáticas favorecen la demanda hoy.`, line2: `La ejecución interna decide cuánto de esa demanda se captura efectivamente.`, mood: 'stable' });
    insights.push({ line1: `Día de alta temperatura — contexto favorable para la operación.`, line2: `Los días buenos muestran el techo real de la tienda. Vale la pena observarlo.`, mood: 'stable' });
  }

  // Projection stability
  if (projPct !== null && projPct >= 100 && compliance !== null && compliance >= 100) {
    insights.push({ line1: `El cierre del mes está dentro de control.`, line2: `La estructura resiste el ritmo actual de demanda — por ahora.`, mood: 'stable' });
    insights.push({ line1: `La operación está en zona positiva.`, line2: `Todavía estoy monitoreando la calidad del crecimiento, no solo el volumen.`, mood: 'stable' });
    insights.push({ line1: `Todo indica un cierre sobre objetivo.`, line2: `La consistencia diaria es lo que convierte una semana buena en un mes sólido.`, mood: 'stable' });
  }

  // Fallback pool — rich enough to rotate even with no data
  const fallbacks = [
    { line1: `Estoy observando la operación en tiempo real.`, line2: `Sin señales de tensión visible en este momento.`, mood: 'stable' },
    { line1: `El comportamiento operativo parece estable.`, line2: `Continúo analizando para detectar señales tempranas antes de que se consoliden.`, mood: 'stable' },
    { line1: `No detecto anomalías en el patrón actual.`, line2: `La ausencia de señales también es información.`, mood: 'stable' },
    { line1: `La operación funciona dentro de parámetros normales.`, line2: `Estoy procesando los datos de los últimos días para identificar tendencias latentes.`, mood: 'observing' },
    { line1: `Estoy calibrando el análisis con los datos más recientes.`, line2: `En pocos momentos tendré una lectura más precisa del comportamiento actual.`, mood: 'observing' },
  ];

  if (insights.length === 0) return fallbacks;

  return insights;
}

// Fisher-Yates shuffle with a numeric seed
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Mood configuration — muted, executive palette ───────────────────────────
const MOOD = {
  tension: {
    dot: 'rgba(239,68,68,0.75)',
    ring: 'rgba(239,68,68,0.15)',
    glow: 'rgba(239,68,68,0.06)',
    label: 'detectando tensión',
    labelColor: 'rgba(220,38,38,0.55)',
    accent: 'rgba(239,68,68,0.12)',
  },
  observing: {
    dot: '#C21875',
    ring: 'rgba(194,24,117,0.15)',
    glow: 'rgba(194,24,117,0.07)',
    label: 'analizando',
    labelColor: 'rgba(194,24,117,0.6)',
    accent: 'rgba(194,24,117,0.08)',
  },
  stable: {
    dot: 'rgba(139,92,246,0.8)',
    ring: 'rgba(139,92,246,0.15)',
    glow: 'rgba(139,92,246,0.06)',
    label: 'estable',
    labelColor: 'rgba(124,58,237,0.5)',
    accent: 'rgba(139,92,246,0.08)',
  },
};

// ─── Minimal sparkline bars ───────────────────────────────────────────────────
function TrendBars({ data = [], color = '#C21875', budget = 0 }) {
  if (data.length < 3) return null;
  const max = Math.max(...data.map(d => d.total_sales || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {data.slice(-12).map((d, i, arr) => {
        const val = d.total_sales || 0;
        const pct = Math.max((val / max) * 100, 5);
        const isLast = i === arr.length - 1;
        const aboveBudget = budget > 0 && val >= budget;
        const bg = isLast ? color : aboveBudget ? `${color}55` : 'rgba(203,213,225,0.5)';
        return (
          <div key={i} style={{
            flex: 1, height: `${pct}%`,
            borderRadius: '2px 2px 1px 1px',
            background: bg, transition: 'height 0.4s ease',
          }} />
        );
      })}
    </div>
  );
}

// ─── Full executive analysis panel ───────────────────────────────────────────
function NovaAnalyticsPanel({ onClose, insights, dailySales, budget }) {
  const sorted = useMemo(() =>
    [...(dailySales || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14),
    [dailySales]
  );

  const projPct = budget?.monthProjectionCompliance ?? 0;
  const gap = (budget?.salesUntilYesterday || 0) - (budget?.budgetUntilYesterday || 0);
  const compliance = budget?.budgetUntilYesterday > 0
    ? ((budget?.salesUntilYesterday || 0) / budget.budgetUntilYesterday * 100)
    : null;
  const dailyBudget = budget?.monthlyBudget ? budget.monthlyBudget / 30 : 0;
  const maxSales = Math.max(...sorted.map(d => d.total_sales || 0), 1);

  // Momentum score (0-100)
  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);
  const avg7 = last7.length ? last7.reduce((s, d) => s + (d.total_sales || 0), 0) / last7.length : 0;
  const avgP7 = prev7.length ? prev7.reduce((s, d) => s + (d.total_sales || 0), 0) / prev7.length : 0;
  const momentum = avgP7 > 0 ? Math.min(Math.max(((avg7 / avgP7) * 50), 0), 100) : 50;

  const kpiCards = [
    {
      label: 'Proyección de cierre',
      value: `${projPct?.toFixed(0) ?? '—'}%`,
      sub: projPct >= 100 ? 'Por encima del objetivo' : 'Por debajo del objetivo',
      color: projPct >= 100 ? '#059669' : '#e11d48',
    },
    {
      label: 'Brecha acumulada',
      value: gap >= 0 ? `+${fmtCompact(gap)}` : fmtCompact(gap),
      sub: gap >= 0 ? 'Sobre el presupuesto' : 'Bajo el presupuesto',
      color: gap >= 0 ? '#059669' : '#e11d48',
    },
    {
      label: 'Objetivo mensual',
      value: fmtCompact(budget?.monthlyBudget || 0),
      sub: `${budget?.remainingDays ?? '—'} días para el cierre`,
      color: '#64748b',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        background: 'rgba(8,8,18,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 700,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: 36,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(80px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 60px 140px rgba(0,0,0,0.18), 0 16px 48px rgba(194,24,117,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Ambient top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 160,
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(251,207,232,0.28) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '26px 30px 22px',
          borderBottom: '1px solid rgba(0,0,0,0.045)',
        }}>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 50, height: 50, borderRadius: 18,
              background: 'linear-gradient(145deg, #fff0f8, #fce7f3)',
              border: '1px solid rgba(244,114,182,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(194,24,117,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <NovaAvatar size={40} />
          </motion.div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <p style={{ fontSize: 18, fontWeight: 780, color: '#0f172a', letterSpacing: '-0.03em' }}>
                Análisis ejecutivo
              </p>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#C21875', flexShrink: 0,
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              Nova · inteligencia operativa en tiempo real
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 12,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: 'rgba(0,0,0,0.048)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.048)'}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="#64748b" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '26px 30px 30px',
          scrollbarWidth: 'none',
        }}>

          {/* KPI strip */}
          {budget?.monthlyBudget > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
              {kpiCards.map(({ label, value, sub, color }) => (
                <div key={label} style={{
                  padding: '14px 16px', borderRadius: 18,
                  background: 'rgba(248,250,252,0.9)',
                  border: '1px solid rgba(0,0,0,0.045)',
                }}>
                  <p style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#b0bec5', marginBottom: 7,
                  }}>{label}</p>
                  <p style={{
                    fontSize: 21, fontWeight: 820, letterSpacing: '-0.035em',
                    color, lineHeight: 1, marginBottom: 5,
                  }}>{value}</p>
                  <p style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 400 }}>{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Momentum bar */}
          {avg7 > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#cbd5e1' }}>
                  Momentum comercial
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: momentum > 55 ? '#059669' : momentum > 45 ? '#C21875' : '#e11d48' }}>
                  {momentum > 55 ? 'Positivo' : momentum > 45 ? 'Neutro' : 'Negativo'}
                </p>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${momentum}%` }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                  style={{
                    height: '100%', borderRadius: 99,
                    background: momentum > 55
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : momentum > 45
                        ? 'linear-gradient(90deg, #C21875, #ec4899)'
                        : 'linear-gradient(90deg, #e11d48, #f87171)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.045)' }} />
            <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d1d5db' }}>
              Lo que Nova está viendo
            </p>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.045)' }} />
          </div>

          {/* Insights — editorial cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {insights.map((ins, i) => {
              const m = MOOD[ins.mood] || MOOD.observing;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    padding: '15px 18px',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.045)',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}
                >
                  <div style={{ paddingTop: 5, flexShrink: 0 }}>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.4 }}
                      style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: m.dot,
                        boxShadow: `0 0 8px ${m.dot}`,
                      }}
                    />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 13, fontWeight: 570, color: '#1e293b',
                      lineHeight: 1.55, marginBottom: 3, letterSpacing: '-0.012em',
                    }}>{ins.line1}</p>
                    <p style={{
                      fontSize: 12, fontWeight: 400, color: '#64748b',
                      lineHeight: 1.55, letterSpacing: '-0.005em',
                    }}>{ins.line2}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Trend chart */}
          {sorted.length >= 4 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.045)' }} />
                <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d1d5db' }}>
                  Tendencia · {sorted.length} días
                </p>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.045)' }} />
              </div>

              {/* Premium bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64, paddingBottom: 0 }}>
                {sorted.map((d, i) => {
                  const val = d.total_sales || 0;
                  const pct = Math.max((val / maxSales) * 100, 3);
                  const isLast = i === sorted.length - 1;
                  const isAbove = dailyBudget > 0 && val >= dailyBudget;
                  const bg = isLast
                    ? '#C21875'
                    : isAbove
                      ? 'rgba(167,139,250,0.5)'
                      : 'rgba(203,213,225,0.55)';
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                      style={{
                        flex: 1,
                        borderRadius: '3px 3px 2px 2px',
                        background: bg, alignSelf: 'flex-end',
                      }}
                    />
                  );
                })}
              </div>

              {/* Budget reference line */}
              {dailyBudget > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                }}>
                  <div style={{ width: 16, height: 1.5, background: 'rgba(167,139,250,0.6)', borderRadius: 1 }} />
                  <p style={{ fontSize: 9, color: '#c4b5fd', fontWeight: 500 }}>Meta diaria promedio</p>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C21875' }} />
                  <p style={{ fontSize: 9, color: '#C21875', fontWeight: 500 }}>Hoy</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 30px 20px',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 9.5, color: '#d1d5db', fontWeight: 450 }}>
            Nova · análisis generado con datos reales de la operación
          </p>
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C21875' }} />
            <p style={{ fontSize: 9, color: '#C21875', fontWeight: 600, letterSpacing: '0.05em' }}>
              EN VIVO
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function NovaInsightStrip({ dailySales = [], budget = null, latestWeather = null }) {
  // Session seed — random on every page load/mount, stable for the session
  const [sessionSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));

  const insights = useMemo(() => {
    const raw = buildInsights(dailySales, budget, latestWeather);
    // Shuffle order with session seed so every refresh shows a different sequence
    return seededShuffle(raw, sessionSeed);
  }, [dailySales, budget, latestWeather, sessionSeed]);

  const [idx, setIdx] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [line1Done, setLine1Done] = useState(false);
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);

  // Start at index 0 (shuffle already randomized the order)
  useEffect(() => {
    setIdx(0);
    setLine1Done(false);
  }, [insights]);

  // Auto-rotate insights every 8s
  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => {
      setIdx(prev => (prev + 1) % insights.length);
      setLine1Done(false);
    }, 8500);
    return () => clearInterval(t);
  }, [insights.length]);

  // Reset typing on insight change
  useEffect(() => { setLine1Done(false); }, [idx]);

  const current = insights[idx] ?? insights[0];
  if (!current) return null;

  const mood = MOOD[current.mood] ?? MOOD.observing;
  const dotCount = Math.min(insights.length, 5);
  const sortedSales = [...dailySales].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dailyBudgetVal = budget?.monthlyBudget ? budget.monthlyBudget / 30 : 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%', minWidth: 0 }}>

        {/* ── AVATAR ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Outer ambient ring */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.85, 1.2, 0.85] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              background: `radial-gradient(circle, ${mood.ring} 0%, transparent 72%)`,
              filter: 'blur(12px)', pointerEvents: 'none',
            }}
          />
          {/* Pulse ring */}
          <motion.div
            animate={{ opacity: [0, 0.5, 0], scale: [0.75, 1.4, 0.75] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
            style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `1.5px solid ${mood.dot}`,
              pointerEvents: 'none',
            }}
          />
          {/* Avatar shell */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(145deg, #fff6fb, #fce7f3)',
              border: '1.5px solid rgba(244,114,182,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px rgba(194,24,117,0.12), 0 0 0 3px ${mood.ring}, inset 0 1px 0 rgba(255,255,255,0.95)`,
            }}
          >
            <NovaAvatar size={38} />
          </motion.div>
        </div>

        {/* ── TEXT ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Status micro-label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: mood.dot, flexShrink: 0,
                  boxShadow: `0 0 6px ${mood.dot}80`,
                }}
              />
              <span style={{
                fontSize: 9, fontWeight: 650,
                letterSpacing: '0.11em', textTransform: 'uppercase',
                color: mood.labelColor,
              }}>
                Nova · {mood.label}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Main insight text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <p style={{
                fontSize: 13, fontWeight: 570,
                color: '#1a1a2e', lineHeight: 1.42,
                letterSpacing: '-0.014em', marginBottom: 2,
                whiteSpace: 'pre-wrap',
              }}>
                <TypewriterText
                  text={current.line1}
                  speed={21}
                  onDone={() => setLine1Done(true)}
                />
              </p>
              <AnimatePresence>
                {line1Done && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.08 }}
                    style={{
                      fontSize: 11.5, fontWeight: 400,
                      color: '#94a3b8', lineHeight: 1.45,
                      letterSpacing: '-0.008em',
                    }}
                  >
                    {current.line2}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── TREND MINI CHART (desktop) ── */}
        {sortedSales.length >= 4 && (
          <div style={{ width: 80, flexShrink: 0, display: 'none', '@media (min-width: 640px)': { display: 'block' } }}
            className="hidden sm:block">
            <TrendBars data={sortedSales} color={mood.dot} budget={dailyBudgetVal} />
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Dot navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3.5 }}
            className="hidden sm:flex">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setLine1Done(false); }}
                style={{
                  height: 4, borderRadius: 99, border: 'none',
                  cursor: 'pointer', padding: 0,
                  width: i === idx % dotCount ? 18 : 4,
                  background: i === idx % dotCount ? mood.dot : 'rgba(0,0,0,0.09)',
                  transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={() => setShowPanel(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setIsHoveringCTA(true)}
            onMouseLeave={() => setIsHoveringCTA(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10.5, fontWeight: 640,
              padding: '7px 13px', borderRadius: 12,
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.008em',
              color: isHoveringCTA ? '#C21875' : '#64748b',
              background: isHoveringCTA ? 'rgba(194,24,117,0.07)' : 'rgba(0,0,0,0.045)',
              outline: isHoveringCTA ? '1px solid rgba(194,24,117,0.2)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Ver análisis
            <ArrowRight style={{ width: 9.5, height: 9.5 }} />
          </motion.button>
        </div>
      </div>

      {/* ── ANALYSIS PANEL — rendered via portal above all layout ── */}
      {showPanel && createPortal(
        <AnimatePresence>
          <NovaAnalyticsPanel
            key="nova-panel"
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