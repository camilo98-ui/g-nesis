import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v || 0));

function buildInsights(dailySales, budget, latestWeather) {
  const insights = [];
  const sales = Array.isArray(dailySales) ? dailySales : [];

  // Ventas últimos 7 días
  const sorted = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last7 = sorted.slice(0, 7);
  const last14 = sorted.slice(0, 14);

  const totalLast7 = last7.reduce((s, d) => s + (d.total_sales || 0), 0);
  const totalPrev7 = sorted.slice(7, 14).reduce((s, d) => s + (d.total_sales || 0), 0);
  const avgLast7 = last7.length > 0 ? totalLast7 / last7.length : 0;
  const avgPrev7 = sorted.slice(7, 14).length > 0 ? totalPrev7 / sorted.slice(7, 14).length : 0;
  const weekGrowth = avgPrev7 > 0 ? ((avgLast7 - avgPrev7) / avgPrev7 * 100) : null;

  // Mejor día
  const bestDay = [...sales].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))[0];

  // Transacciones
  const avgTx = last7.length > 0 ? last7.reduce((s, d) => s + (d.total_transactions || 0), 0) / last7.length : 0;
  const avgTxPrev = sorted.slice(7, 14).length > 0 ? sorted.slice(7, 14).reduce((s, d) => s + (d.total_transactions || 0), 0) / sorted.slice(7, 14).length : 0;
  const txGrowth = avgTxPrev > 0 ? ((avgTx - avgTxPrev) / avgTxPrev * 100) : null;

  // Ticket promedio
  const avgTicket = last7.length > 0
    ? last7.filter(d => (d.total_transactions || 0) > 0).reduce((s, d) => s + (d.total_sales / d.total_transactions), 0) /
      Math.max(last7.filter(d => (d.total_transactions || 0) > 0).length, 1)
    : 0;

  // Sugeridos
  const totalSuggested = last7.reduce((s, d) => s + (d.total_suggested || 0), 0);
  const avgSuggested = last7.length > 0 ? totalSuggested / last7.length : 0;

  // Takeaway
  const totalTakeaway = last7.reduce((s, d) => s + (d.total_takeaway || 0), 0);
  const avgTakeaway = last7.length > 0 ? totalTakeaway / last7.length : 0;
  const takeawayPrev = sorted.slice(7, 14).reduce((s, d) => s + (d.total_takeaway || 0), 0);
  const takeawayGrowth = takeawayPrev > 0 ? ((totalTakeaway - takeawayPrev) / takeawayPrev * 100) : null;

  // Budget compliance
  const monthlyBudget = budget?.monthlyBudget || 0;
  const salesUntilYesterday = budget?.salesUntilYesterday || 0;
  const budgetUntilYesterday = budget?.budgetUntilYesterday || 0;
  const compliance = budgetUntilYesterday > 0 ? (salesUntilYesterday / budgetUntilYesterday * 100) : null;
  const gap = salesUntilYesterday - budgetUntilYesterday;
  const projPct = budget?.monthProjectionCompliance ?? null;
  const remainingDays = budget?.remainingDays ?? null;
  const dailyRequired = budget?.dailyRequiredSales ?? null;

  // Clima
  const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
  const precip = latestWeather?.precipitation ?? 0;
  const isHot = temp != null && temp > 24;
  const isRainy = precip >= 3;

  // ── Build insight list ──

  if (weekGrowth !== null && avgLast7 > 0) {
    const up = weekGrowth >= 0;
    insights.push({
      emoji: up ? '📈' : '📉',
      label: `Ventas semana vs anterior`,
      value: `${up ? '+' : ''}${weekGrowth.toFixed(1)}%`,
      sub: `Prom. ${fmt(avgLast7)}/día`,
      color: up ? '#10b981' : '#ef4444'
    });
  }

  if (totalLast7 > 0) {
    insights.push({
      emoji: '💰',
      label: '7 días · ventas totales',
      value: fmt(totalLast7),
      sub: `${last7.length} días registrados`,
      color: '#C21875'
    });
  }

  if (avgTicket > 0) {
    insights.push({
      emoji: '🧾',
      label: 'Ticket promedio · 7 días',
      value: fmt(avgTicket),
      sub: avgTx > 0 ? `${Math.round(avgTx)} transacc./día` : 'últimos 7 días',
      color: '#7c3aed'
    });
  }

  if (txGrowth !== null && avgTx > 0) {
    const up = txGrowth >= 0;
    insights.push({
      emoji: up ? '⚡' : '🔻',
      label: 'Transacciones vs semana ant.',
      value: `${up ? '+' : ''}${txGrowth.toFixed(1)}%`,
      sub: `${Math.round(avgTx)} tx/día promedio`,
      color: up ? '#0ea5e9' : '#f59e0b'
    });
  }

  if (avgSuggested > 0) {
    insights.push({
      emoji: '✨',
      label: 'Sugeridos diario · 7 días',
      value: `${avgSuggested.toFixed(1)} und`,
      sub: `Total: ${totalSuggested} sugeridos`,
      color: '#f59e0b'
    });
  }

  if (totalTakeaway > 0 && takeawayGrowth !== null) {
    const up = takeawayGrowth >= 0;
    insights.push({
      emoji: '🛍️',
      label: 'Llevar · cambio semanal',
      value: `${up ? '+' : ''}${takeawayGrowth.toFixed(1)}%`,
      sub: fmt(totalTakeaway) + ' esta semana',
      color: up ? '#10b981' : '#ef4444'
    });
  }

  if (compliance !== null) {
    const up = compliance >= 100;
    insights.push({
      emoji: up ? '🎯' : '⚠️',
      label: 'Cumplimiento presupuesto',
      value: `${compliance.toFixed(1)}%`,
      sub: `${up ? 'Sobre' : 'Bajo'} meta acumulada`,
      color: compliance >= 100 ? '#10b981' : compliance >= 80 ? '#f59e0b' : '#ef4444'
    });
  }

  if (gap !== 0 && monthlyBudget > 0) {
    const up = gap >= 0;
    insights.push({
      emoji: up ? '🚀' : '📊',
      label: 'Brecha vs presupuesto',
      value: `${up ? '+' : ''}${fmt(gap)}`,
      sub: `${Math.abs(gap / monthlyBudget * 100).toFixed(1)}% del PPT mensual`,
      color: up ? '#059669' : '#e11d48'
    });
  }

  if (projPct !== null) {
    insights.push({
      emoji: projPct >= 100 ? '✅' : projPct >= 80 ? '📊' : '🔴',
      label: 'Proyección cierre mes',
      value: `${projPct.toFixed(1)}%`,
      sub: monthlyBudget > 0 ? `PPT: ${fmt(monthlyBudget)}` : 'del presupuesto mensual',
      color: projPct >= 100 ? '#10b981' : projPct >= 80 ? '#f59e0b' : '#ef4444'
    });
  }

  if (dailyRequired !== null && remainingDays !== null && remainingDays > 0) {
    insights.push({
      emoji: '🏁',
      label: `Meta diaria · ${remainingDays}d restantes`,
      value: fmt(dailyRequired),
      sub: 'necesarios para cerrar PPT',
      color: '#C21875'
    });
  }

  if (bestDay?.total_sales > 0) {
    insights.push({
      emoji: '🏆',
      label: 'Mejor día registrado',
      value: fmt(bestDay.total_sales),
      sub: bestDay.date ? new Date(bestDay.date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '',
      color: '#7c3aed'
    });
  }

  if (isHot && !isRainy && temp != null) {
    insights.push({
      emoji: '☀️',
      label: `Clima ${Math.round(temp)}°C · impacto ventas`,
      value: '+15–25%',
      sub: 'Calor = más ventas de helado',
      color: '#f97316'
    });
  }

  if (isRainy) {
    insights.push({
      emoji: '🌧',
      label: `Lluvia ${precip.toFixed(1)}mm · impacto ventas`,
      value: '−12–18%',
      sub: 'Lluvia reduce tráfico peatonal',
      color: '#6366f1'
    });
  }

  // Siempre hay al menos un insight genérico
  if (insights.length === 0) {
    insights.push({
      emoji: '🤖',
      label: 'Nova está analizando tu tienda',
      value: '—',
      sub: 'Ingresa ventas para ver insights',
      color: '#C21875'
    });
  }

  return insights;
}

export default function NovaInsightStrip({ dailySales, budget, latestWeather }) {
  const insights = useMemo(() => buildInsights(dailySales, budget, latestWeather), [dailySales, budget, latestWeather]);
  const [idx, setIdx] = useState(0);

  // Arrancar en índice aleatorio
  useEffect(() => {
    setIdx(Math.floor(Math.random() * insights.length));
  }, [insights.length]);

  // Rotar cada 4 segundos
  useEffect(() => {
    if (insights.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const current = insights[idx] || insights[0];
  if (!current) return null;

  return (
    <div className="flex-1 min-w-0 flex items-center justify-between gap-3 overflow-hidden">
      {/* Insight animado */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2.5"
          >
            {/* Emoji */}
            <span className="text-[16px] flex-shrink-0 leading-none">{current.emoji}</span>

            {/* Label */}
            <span className="text-[11px] font-semibold text-slate-500 flex-shrink-0 hidden sm:block truncate max-w-[140px]">
              {current.label}
            </span>

            {/* Separador */}
            <div className="w-px h-4 bg-slate-200 flex-shrink-0 hidden sm:block" />

            {/* Value */}
            <span className="text-[14px] font-black leading-none tabular-nums flex-shrink-0" style={{ color: current.color, letterSpacing: '-0.02em' }}>
              {current.value}
            </span>

            {/* Sub */}
            <span className="text-[10px] text-slate-400 font-medium truncate hidden md:block">{current.sub}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + Nova badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dot indicators */}
        <div className="flex items-center gap-1 hidden sm:flex">
          {insights.slice(0, Math.min(insights.length, 8)).map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === idx % Math.min(insights.length, 8) ? 12 : 4,
                height: 4,
                background: i === idx % Math.min(insights.length, 8)
                  ? current.color
                  : 'rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>

        {/* Nova badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(194,24,117,0.10), rgba(168,85,247,0.07))',
            border: '1px solid rgba(194,24,117,0.14)'
          }}>
          <Sparkles className="w-3 h-3" style={{ color: '#C21875' }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#C21875' }}>Nova</span>
        </div>
      </div>
    </div>
  );
}