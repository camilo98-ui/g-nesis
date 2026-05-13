import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import PremiumSparkline from './PremiumSparkline';

function MetricCard({ label, value, subtext, icon: Icon, progress, sparkData, delay, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -1 }}
      className="relative rounded-2xl p-4 overflow-hidden cursor-default group"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Accent background subtle */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-5 transition-opacity duration-500"
        style={{ background: accent }}
      />

      {/* Top: icon + label */}
      <div className="flex items-start justify-between mb-3 relative z-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}0f` }}
        >
          <Icon style={{ color: accent, width: 15, height: 15 }} />
        </div>
        <span className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">
          {label}
        </span>
      </div>

      {/* Main value */}
      <p className="text-[28px] font-black text-slate-800 leading-none mb-2 tracking-tight">
        {value}
      </p>

      {/* Subtext */}
      {subtext && (
        <p className="text-[10.5px] text-slate-500 font-medium mb-3">{subtext}</p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full transition-all"
              style={{
                background: `linear-gradient(90deg, ${accent}80, ${accent})`,
                boxShadow: `0 0 8px ${accent}60`,
              }}
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 font-semibold">
            {progress.toFixed(0)}% del objetivo
          </p>
        </div>
      )}

      {/* Sparkline */}
      {sparkData && (
        <div className="mt-3 opacity-80">
          <PremiumSparkline data={sparkData} color={accent} width={100} height={24} />
        </div>
      )}

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}25, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function DailyMetricsPanel({ todaySales = [], budget = [] }) {
  // Calculate metrics
  const latest = useMemo(() => todaySales?.[0] || {}, [todaySales]);
  const activeBudget = useMemo(() => budget?.find(b => b.is_active) || budget?.[0] || {}, [budget]);

  // PPT del día (sales_budget is monthly, divide by ~22 business days)
  const dailyPPT = useMemo(() => {
    if (!activeBudget.sales_budget) return null;
    return Math.round(activeBudget.sales_budget / 22);
  }, [activeBudget]);

  // Current sales progress
  const salesHoy = latest?.total_sales || 0;
  const pptProgress = useMemo(() => {
    if (!dailyPPT || !salesHoy) return 0;
    return Math.min(100, (salesHoy / dailyPPT) * 100);
  }, [dailyPPT, salesHoy]);

  // Sales projection to close
  const hourNow = new Date().getHours();
  const hoursRemaining = useMemo(() => {
    // Assume store closes at 22:00 (10pm)
    const closeHour = 22;
    const remaining = Math.max(0, closeHour - hourNow);
    return remaining;
  }, [hourNow]);

  const avgHourlyRate = useMemo(() => {
    if (hourNow <= 8 || !salesHoy) return 0;
    const hoursWorked = hourNow - 8; // Assuming open at 8am
    return Math.round(salesHoy / hoursWorked);
  }, [hourNow, salesHoy]);

  const projectedClose = useMemo(() => {
    if (!avgHourlyRate || hourNow <= 8) return salesHoy;
    const hoursWorked = hourNow - 8;
    const totalHours = (22 - 8); // Full day is 14 hours
    return Math.round((hoursWorked + hoursRemaining) * avgHourlyRate);
  }, [avgHourlyRate, salesHoy, hoursRemaining, hourNow]);

  const projectionPercent = useMemo(() => {
    if (!dailyPPT || !projectedClose) return 0;
    return Math.min(100, (projectedClose / dailyPPT) * 100);
  }, [dailyPPT, projectedClose]);

  // Spark data from historical sales
  const sparkDaily = useMemo(() => {
    if (todaySales.length < 2) return [60, 75, 85, 70, 80, 90, 110, 120];
    return todaySales
      .slice(0, 8)
      .reverse()
      .map(d => (d.total_sales || 0) / 100000); // Normalize for display
  }, [todaySales]);

  // Format currency
  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <div className="mb-7">
      <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em] mb-4">
        Métricas del Día
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PPT del día */}
        <MetricCard
          delay={0}
          label="PPT Diario"
          value={fmt(dailyPPT)}
          subtext={`~${fmt(activeBudget.sales_budget)} al mes`}
          icon={Target}
          accent="#C21875"
          sparkData={sparkDaily}
        />

        {/* Venta actual */}
        <MetricCard
          delay={0.06}
          label="Venta Actual"
          value={fmt(salesHoy)}
          progress={pptProgress}
          subtext={pptProgress >= 100 ? '✓ PPT cumplido' : `${pptProgress.toFixed(0)}% cumplimiento`}
          icon={TrendingUp}
          accent="#d97706"
          sparkData={sparkDaily.map(d => (d * salesHoy) / 100)}
        />

        {/* Proyección de cierre */}
        <MetricCard
          delay={0.12}
          label="Proyección Cierre"
          value={fmt(projectedClose)}
          progress={projectionPercent}
          subtext={projectionPercent >= 100 ? '✓ Objetivo alcanzable' : `${projectionPercent.toFixed(0)}% estimado`}
          icon={Zap}
          accent="#06b6d4"
          sparkData={sparkDaily.map(d => (d * projectedClose) / 100)}
        />

        {/* Insight o estado */}
        <MetricCard
          delay={0.18}
          label="Estado Hoy"
          value={
            projectionPercent >= 100
              ? '✓ Verde'
              : projectionPercent >= 80
              ? '⚠ Amarillo'
              : '✗ Rojo'
          }
          subtext={
            projectionPercent >= 100
              ? 'En camino al éxito'
              : projectionPercent >= 80
              ? 'Presionar últimas horas'
              : 'Requiere esfuerzo extra'
          }
          icon={projectionPercent >= 100 ? CheckCircle : projectionPercent >= 80 ? Clock : AlertCircle}
          accent={
            projectionPercent >= 100
              ? '#10b981'
              : projectionPercent >= 80
              ? '#f59e0b'
              : '#ef4444'
          }
          sparkData={[20, 40, 60, 80, 100, 95, 90, 85]}
        />
      </div>

      {/* Additional info row */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.4 }}
        className="mt-3 flex flex-wrap gap-2 text-[10px]"
      >
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(194,24,117,0.05)', border: '1px solid rgba(194,24,117,0.1)' }}>
          <span className="text-slate-600 font-medium">
            Ritmo: {fmt(avgHourlyRate)}/hora · {hoursRemaining}h restantes
          </span>
        </div>
        {projectionPercent < 80 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <span className="text-red-600 font-medium">
              Necesitas {fmt(Math.max(0, dailyPPT - projectedClose))} más para cumplir
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}