import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Target, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

const PINK = '#db2777';
const SLATE = '#94a3b8';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

function fmtCompact(val) {
  if (val == null || isNaN(val)) return '$0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
}

function fmtFull(val) {
  if (val == null || isNaN(val)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}

function CurveTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const items = [
    { key: 'real', label: 'Venta real acumulada', color: PINK, value: row.real },
    { key: 'budget', label: 'Presupuesto acumulado', color: SLATE, value: row.budget },
    { key: 'proj', label: 'Proyección', color: '#7c3aed', value: row.proj }
  ].filter((i) => i.value != null);

  return (
    <div className="rounded-xl border border-border bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Día {row.day}
      </p>
      {items.map((i) => (
        <p key={i.key} className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums" style={{ color: '#374151' }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />
          <span className="text-[10px] font-medium text-muted-foreground">{i.label}</span>
          <span className="ml-auto" style={{ color: i.color }}>{fmtCompact(i.value)}</span>
        </p>
      ))}
      {row.real != null && row.budget != null && (
        <p className="mt-1 border-t border-border pt-1 text-[10px] font-bold tabular-nums"
          style={{ color: row.real >= row.budget ? GREEN : AMBER }}>
          {row.real >= row.budget ? '+' : ''}{fmtCompact(row.real - row.budget)} vs presupuesto
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, hint, color, icon: Icon, tone }) {
  return (
    <div className="rounded-xl border px-3 py-2.5"
      style={{ borderColor: `${color}33`, background: `${color}08` }}>
      <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-2.5 w-2.5" style={{ color }} />
        {label}
      </p>
      <p className="mt-1 text-xl font-black leading-none tabular-nums" style={{ color, letterSpacing: '-0.03em' }}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[9px] font-semibold" style={{ color: tone || '#94a3b8' }}>{hint}</p>}
    </div>
  );
}

export default function SalesVsBudgetCurve({ dailySales = [], dailyBudgets = [], budget = 0 }) {
  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const daysInMonth = endOfMonth(now).getDate();
    const dayOfMonth = Math.min(now.getDate(), daysInMonth);

    const salesByDay = {};
    (dailySales || []).forEach((d) => {
      const dayStr = (d.date || '').split('T')[0];
      if (!dayStr || dayStr < monthStart || dayStr > monthEnd) return;
      const day = parseInt(dayStr.split('-')[2], 10);
      salesByDay[day] = (salesByDay[day] || 0) + (d.total_sales || 0);
    });

    const budgetByDay = {};
    (dailyBudgets || []).forEach((b) => {
      const dayStr = (b.date || '').split('T')[0];
      if (!dayStr || dayStr < monthStart || dayStr > monthEnd) return;
      if (!(b.budget_amount > 0)) return;
      const day = parseInt(dayStr.split('-')[2], 10);
      budgetByDay[day] = (budgetByDay[day] || 0) + b.budget_amount;
    });

    const monthlyBudget = budget > 0 ? budget : 0;
    const hasDailyBudget = Object.keys(budgetByDay).length > 0;
    const fallbackDaily = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;

    const realCum = [];
    const budgetCum = [];
    let r = 0;
    let b = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      b += budgetByDay[day] > 0 ? budgetByDay[day] : fallbackDaily;
      if (day <= dayOfMonth) r += salesByDay[day] || 0;
      realCum.push(r);
      budgetCum.push(b);
    }

    const realToday = realCum[dayOfMonth - 1] || 0;
    const budgetToday = budgetCum[dayOfMonth - 1] || 0;
    const budgetMonthTotal = budgetCum[daysInMonth - 1] || 0;
    const dailyAvg = dayOfMonth > 0 ? realToday / dayOfMonth : 0;
    const daysRemaining = daysInMonth - dayOfMonth;
    const projection = realToday + dailyAvg * daysRemaining;
    const projCompliance = monthlyBudget > 0 ? (projection / monthlyBudget) * 100 : null;
    const gapToday = realToday - budgetToday;
    const gapAtClose = budgetMonthTotal > 0 ? projection - budgetMonthTotal : null;

    const rows = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const isPast = day <= dayOfMonth;
      return {
        day,
        real: isPast ? Math.round(realCum[i]) : null,
        budget: Math.round(budgetCum[i]),
        proj: day === dayOfMonth
          ? Math.round(realToday)
          : day > dayOfMonth
            ? Math.round(realToday + dailyAvg * (day - dayOfMonth))
            : null
      };
    });

    return {
      rows, daysInMonth, dayOfMonth, daysRemaining,
      realToday, budgetToday, budgetMonthTotal, monthlyBudget,
      projection, projCompliance, gapToday, gapAtClose,
      dailyAvg, hasBudget: monthlyBudget > 0 || hasDailyBudget
    };
  }, [dailySales, dailyBudgets, budget]);

  const { rows, dayOfMonth, realToday, budgetToday, projection, projCompliance, gapToday, gapAtClose, hasBudget, monthlyBudget } = analysis;

  const maxY = Math.max(
    ...rows.map((row) => Math.max(row.budget || 0, row.real || 0, row.proj || 0)),
    1
  ) * 1.06;

  const xLabel = format(new Date(), 'MMMM yyyy', { locale: es });
  const onTrack = projCompliance != null ? projCompliance >= 100 : null;

  if (!hasBudget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="mb-4 rounded-2xl border border-border bg-card px-5 py-8 text-center">
        <Target className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Aún no hay presupuesto para comparar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Carga el PPT del mes o el presupuesto diario para ver la curva real contra el acumulado.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative mb-4 overflow-hidden rounded-2xl"
      style={{
        background: '#ffffff',
        border: `1px solid ${PINK}33`,
        boxShadow: '0 4px 24px rgba(219,39,119,0.08), 0 1px 4px rgba(0,0,0,0.04)'
      }}>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${PINK} 0%, rgba(194,24,117,0.3) 60%, transparent 100%)`,
        borderRadius: '12px 12px 0 0'
      }} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 pb-3 pt-4"
        style={{ borderColor: `${PINK}14` }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: '#fdf2f8', border: `1.5px solid ${PINK}33` }}>
            <TrendingUp className="h-[18px] w-[18px]" style={{ color: PINK }} />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Venta real vs presupuesto acumulado
            </p>
            <p className="mt-0.5 text-[10px] font-medium capitalize text-muted-foreground">
              {xLabel} · día {dayOfMonth} de {analysis.daysInMonth}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg px-2.5 py-1 text-[9px] font-semibold tabular-nums"
            style={{ border: `1px solid ${PINK}33`, background: '#fdf2f8', color: PINK }}>
            PPT {fmtCompact(monthlyBudget)}
          </span>
          {projCompliance != null && (
            <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold tabular-nums"
              style={{
                border: `1px solid ${onTrack ? GREEN : AMBER}40`,
                background: `${onTrack ? GREEN : AMBER}10`,
                color: onTrack ? GREEN : AMBER
              }}>
              {onTrack ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              Cierre proyectado {Math.round(projCompliance)}% PPT
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pb-1 pt-3.5 lg:grid-cols-4">
        <Metric label="Real acumulado" value={fmtCompact(realToday)}
          hint={`${fmtCompact(analysis.dailyAvg)} promedio/día`} color={PINK} icon={TrendingUp} />
        <Metric label="Presupuesto acumulado" value={fmtCompact(budgetToday)}
          hint={`a hoy, día ${dayOfMonth}`} color="#64748b" icon={Target} />
        <Metric label={gapToday >= 0 ? 'Por encima' : 'Brecha a hoy'} value={fmtCompact(gapToday)}
          hint={`${Math.abs(budgetToday > 0 ? Math.round((gapToday / budgetToday) * 100) : 0)}% vs presupuesto`}
          color={gapToday >= 0 ? GREEN : AMBER} icon={gapToday >= 0 ? ArrowUpRight : ArrowDownRight} />
        <Metric label="Proyección de cierre" value={fmtCompact(projection)}
          hint={gapAtClose != null
            ? `${gapAtClose >= 0 ? '+' : ''}${fmtCompact(gapAtClose)} vs PPT`
            : 'sin PPT definido'}
          color="#7c3aed" icon={Sparkles}
          tone={gapAtClose != null ? (gapAtClose >= 0 ? GREEN : AMBER) : undefined} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3.5 px-5 pt-2.5">
        <span className="flex items-center gap-1.5 text-[8.5px] font-medium text-muted-foreground">
          <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: PINK }} /> Venta real acumulada
        </span>
        <span className="flex items-center gap-1.5 text-[8.5px] font-medium text-muted-foreground">
          <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: SLATE }} /> Presupuesto acumulado
        </span>
        <span className="flex items-center gap-1.5 text-[8.5px] font-medium text-muted-foreground">
          <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 3" /></svg>
          Proyección de cierre
        </span>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={rows} margin={{ top: 16, right: 18, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="svbcReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PINK} stopOpacity={0.22} />
                <stop offset="100%" stopColor={PINK} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              interval={4}
              tick={{ fontSize: 9, fill: '#b0bec5', fontFamily: 'Inter Tight, sans-serif' }}
              tickFormatter={(v) => `${v}`} />

            <YAxis
              domain={[0, maxY]}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 9, fill: '#b0bec5', fontFamily: 'Inter Tight, sans-serif' }}
              tickFormatter={fmtCompact} />

            <Tooltip content={<CurveTooltip />} cursor={{ stroke: PINK, strokeOpacity: 0.2 }} />

            <ReferenceLine
              x={dayOfMonth}
              stroke={PINK}
              strokeOpacity={0.35}
              strokeDasharray="2 3"
              label={{ value: 'HOY', position: 'top', fill: PINK, fontSize: 8, fontWeight: 800 }} />

            <Area
              type="monotone"
              dataKey="real"
              stroke={PINK}
              strokeWidth={2.6}
              fill="url(#svbcReal)"
              dot={false}
              activeDot={{ r: 4, fill: PINK, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false} />

            <Line
              type="monotone"
              dataKey="budget"
              stroke={SLATE}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false} />

            <Line
              type="monotone"
              dataKey="proj"
              stroke="#7c3aed"
              strokeWidth={2.4}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insight footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-2.5"
        style={{
          borderColor: `${PINK}14`,
          background: onTrack === true ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.05)'
        }}>
        <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>
          <Sparkles className="mr-1 inline h-3 w-3" style={{ color: PINK }} />
          {gapToday >= 0
            ? `Vas ${fmtFull(gapToday)} por encima del presupuesto acumulado al día ${dayOfMonth}.`
            : `Vas ${fmtFull(Math.abs(gapToday))} por debajo del presupuesto acumulado al día ${dayOfMonth}.`}
        </p>
        <p className="text-[9.5px] font-bold" style={{ color: onTrack === true ? GREEN : AMBER }}>
          {onTrack === true
            ? `Al ritmo actual cerrarías con ${fmtCompact(projection)} (${Math.round(projCompliance)}% del PPT)`
            : `Al ritmo actual cerrarías con ${fmtCompact(projection)} — faltarían ${fmtCompact(monthlyBudget - projection)} para el PPT`}
        </p>
      </div>
    </motion.div>
  );
}