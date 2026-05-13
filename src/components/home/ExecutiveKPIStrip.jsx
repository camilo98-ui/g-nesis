import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Receipt,
  Target, Trophy, Calendar, BarChart2, TrendingDown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell
} from 'recharts';
import PremiumSparkline from './PremiumSparkline';

// ── utils ─────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function pctColor(v) {
  if (v == null) return '#94a3b8';
  return v >= 0 ? '#10b981' : '#f43f5e';
}

function Delta({ val, showSign = true }) {
  if (val == null || isNaN(val)) return <span className="text-[10px] text-slate-300">—</span>;
  const pos = val >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {showSign && (pos ? '+' : '')}{val}%
    </span>
  );
}

// ── Tooltip personalizado para el chart ──────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl text-[10px]"
      style={{ background: 'rgba(15,15,25,0.92)', border: '1px solid rgba(194,24,117,0.2)', backdropFilter: 'blur(12px)' }}>
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Gauge de PPT ─────────────────────────────────────────────────────────────
function PPTRing({ pct, label, sublabel }) {
  const clamped = Math.min(100, Math.max(0, pct ?? 0));
  const color = clamped >= 95 ? '#10b981' : clamped >= 75 ? '#f59e0b' : clamped >= 50 ? '#f97316' : '#e11d48';
  const r = 28, cx = 34, cy = 34;
  const circ = 2 * Math.PI * r;
  const dash = (clamped / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 68, height: 68 }}>
        <svg width="68" height="68">
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="5"
            stroke="rgba(0,0,0,0.07)" />
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="5"
            stroke={color}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-black tabular-nums leading-none" style={{ color }}>
            {pct != null ? `${clamped}` : '—'}
          </span>
          <span className="text-[7px] font-semibold text-slate-300">%</span>
        </div>
      </div>
      <p className="text-[9.5px] font-bold text-slate-600 text-center leading-tight">{label}</p>
      {sublabel && <p className="text-[8.5px] text-slate-300 font-medium text-center">{sublabel}</p>}
    </div>
  );
}

// ── Stat card compacta ────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, delta, color, icon: Icon, children, delay = 0, fullWidth = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl p-4 overflow-hidden ${fullWidth ? 'col-span-2' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.03)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)' }} />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className="w-5 h-5 rounded-lg flex items-center justify-center"
              style={{ background: `${color}12` }}>
              <Icon style={{ width: 10, height: 10, color }} />
            </div>
          )}
          <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{label}</p>
        </div>
        {delta != null && <Delta val={delta} />}
      </div>

      <p className="text-[22px] font-black tabular-nums leading-none text-slate-800 mb-0.5">{value}</p>
      {sublabel && <p className="text-[10px] text-slate-400 font-medium mb-2">{sublabel}</p>}
      {children}

      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}25, transparent)` }} />
    </motion.div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ExecutiveKPIStrip({
  latest, prev, salesVal, txnVal, ticketVal, salesChange,
  cashiers = [], budget = [], sparkSales = [], sparkTxn = [],
  todaySales = []
}) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // ── Presupuesto activo del excel ──
  const activeBudget = useMemo(
    () => budget.find(b => b.month === currentMonth && b.year === currentYear)
       || budget.find(b => b.is_active)
       || budget[0],
    [budget, currentMonth, currentYear]
  );

  const salesBudgetMonthly = activeBudget?.sales_budget ?? null;
  const dailyPPT = salesBudgetMonthly ? salesBudgetMonthly / daysInMonth : null;
  const todaySalesRaw = latest?.total_sales ?? null;

  // PPT del día: ventas hoy vs meta diaria
  const todayPPTPct = dailyPPT && todaySalesRaw != null
    ? Math.round((todaySalesRaw / dailyPPT) * 100) : null;

  // ── Acumulado del mes actual ──
  const sortedByDate = useMemo(
    () => [...todaySales].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [todaySales]
  );

  const thisMonthRecords = useMemo(
    () => sortedByDate.filter(d => {
      const dd = new Date(d.date);
      return dd.getMonth() + 1 === currentMonth && dd.getFullYear() === currentYear;
    }),
    [sortedByDate, currentMonth, currentYear]
  );

  const lastMonthRecords = useMemo(
    () => sortedByDate.filter(d => {
      const dd = new Date(d.date);
      const lm = currentMonth === 1 ? 12 : currentMonth - 1;
      const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
      return dd.getMonth() + 1 === lm && dd.getFullYear() === ly;
    }),
    [sortedByDate, currentMonth, currentYear]
  );

  const acumMes = thisMonthRecords.reduce((s, d) => s + (d.total_sales || 0), 0);
  const pptMensualpct = salesBudgetMonthly
    ? Math.round((acumMes / salesBudgetMonthly) * 100) : null;

  // ── Proyección fin de mes ──
  const avgDailyThisMonth = thisMonthRecords.length > 0
    ? acumMes / thisMonthRecords.length : null;
  const remainingDays = daysInMonth - currentDay;
  const projection = avgDailyThisMonth != null
    ? Math.round(acumMes + avgDailyThisMonth * remainingDays) : null;
  const projectionPct = salesBudgetMonthly && projection
    ? Math.round((projection / salesBudgetMonthly) * 100) : null;

  // ── Mejor día histórico ──
  const bestDay = useMemo(() => {
    if (!todaySales.length) return null;
    return [...todaySales].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))[0];
  }, [todaySales]);

  // ── Ticket promedio del mes ──
  const totalSalesMes = thisMonthRecords.reduce((s, d) => s + (d.total_sales || 0), 0);
  const totalTxnMes   = thisMonthRecords.reduce((s, d) => s + (d.total_transactions || 0), 0);
  const avgTicketMes  = totalTxnMes > 0 ? Math.round(totalSalesMes / totalTxnMes) : null;

  // ── Diferencial hoy vs mismo día mes pasado ──
  const sameDayLastMonth = useMemo(() => {
    return lastMonthRecords.find(d => new Date(d.date).getDate() === currentDay);
  }, [lastMonthRecords, currentDay]);

  const diffVsLastMonth = todaySalesRaw != null && sameDayLastMonth?.total_sales
    ? Math.round(((todaySalesRaw - sameDayLastMonth.total_sales) / sameDayLastMonth.total_sales) * 100)
    : null;
  const diffVsLastMonthAbs = todaySalesRaw != null && sameDayLastMonth?.total_sales
    ? todaySalesRaw - sameDayLastMonth.total_sales : null;

  // ── Chart data: últimos 20 días del mes con PPT diario ──
  const chartData = useMemo(() => {
    return thisMonthRecords.slice(-20).map(d => ({
      day: new Date(d.date).getDate(),
      ventas: d.total_sales || 0,
      ppt: dailyPPT ? Math.round(dailyPPT) : null,
    }));
  }, [thisMonthRecords, dailyPPT]);

  const txnChange = latest && prev
    ? Math.round(((latest.total_transactions - prev.total_transactions) / (prev.total_transactions || 1)) * 100)
    : null;

  const bestDayFmt = bestDay
    ? new Date(bestDay.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-7 space-y-3"
    >
      {/* ── ROW 1: Hero card PPT HOY ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.93)',
          border: '1px solid rgba(194,24,117,0.1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(194,24,117,0.05)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C21875, #9333ea, #6366f1)' }} />

        <div className="p-5">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.05) 0%, transparent 70%)' }} />

          {/* ── Header label ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C21875' }} />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                Panel del día · {now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {acumMes > 0 && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}>
                Acumulado mes: {fmt(acumMes)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">

            {/* ── BLOQUE 1: PPT del día HOY ── */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <PPTRing pct={todayPPTPct} label="" sublabel="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-0.5">
                  Presupuesto HOY
                </p>
                <p className="text-[26px] font-black tabular-nums leading-none tracking-tight mb-1"
                  style={{ color: todayPPTPct == null ? '#1e293b' : todayPPTPct >= 95 ? '#059669' : todayPPTPct >= 75 ? '#d97706' : '#dc2626' }}>
                  {salesVal}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  {dailyPPT && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      meta <span className="font-black text-slate-700">{fmt(dailyPPT)}</span>
                    </span>
                  )}
                  {todayPPTPct != null && (
                    <span className="text-[11px] font-black px-1.5 py-0.5 rounded-lg"
                      style={{
                        background: todayPPTPct >= 95 ? 'rgba(5,150,105,0.1)' : todayPPTPct >= 75 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                        color: todayPPTPct >= 95 ? '#059669' : todayPPTPct >= 75 ? '#d97706' : '#dc2626',
                      }}>
                      {todayPPTPct}% del PPT
                    </span>
                  )}
                </div>
                {/* Barra PPT día */}
                {todayPPTPct != null && (
                  <div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(todayPPTPct, 100)}%` }}
                        transition={{ delay: 0.3, duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: todayPPTPct >= 95
                            ? 'linear-gradient(90deg,#059669,#10b981)'
                            : todayPPTPct >= 75
                            ? 'linear-gradient(90deg,#d97706,#f59e0b)'
                            : 'linear-gradient(90deg,#dc2626,#f43f5e)',
                        }}
                      />
                    </div>
                    {dailyPPT && todaySalesRaw != null && (
                      <p className="text-[8px] text-slate-300 font-medium mt-0.5">
                        {todayPPTPct >= 100
                          ? `✓ Superaste la meta en ${fmt(todaySalesRaw - dailyPPT)}`
                          : `Faltan ${fmt(dailyPPT - todaySalesRaw)} para cumplir`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── BLOQUE 2: Proyección cierre de mes ── */}
            <div className="sm:border-l sm:pl-5" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-1">
                Proyección cierre mes
              </p>
              <p className="text-[26px] font-black tabular-nums leading-none tracking-tight text-slate-800 mb-1">
                {fmt(projection)}
              </p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {projectionPct != null && (
                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: projectionPct >= 100 ? 'rgba(5,150,105,0.1)' : projectionPct >= 85 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                      color: projectionPct >= 100 ? '#059669' : projectionPct >= 85 ? '#d97706' : '#dc2626',
                    }}>
                    {projectionPct}% del PPT
                  </span>
                )}
                {salesBudgetMonthly && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    vs {fmt(salesBudgetMonthly)} meta
                  </span>
                )}
              </div>
              {projectionPct != null && (
                <div>
                  <div className="h-2 rounded-full overflow-hidden mb-0.5" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(projectionPct, 100)}%` }}
                      transition={{ delay: 0.45, duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: projectionPct >= 100
                          ? 'linear-gradient(90deg,#059669,#10b981)'
                          : projectionPct >= 85
                          ? 'linear-gradient(90deg,#d97706,#f59e0b)'
                          : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                      }}
                    />
                  </div>
                  <p className="text-[8px] text-slate-300 font-medium">
                    Prom. {fmt(avgDailyThisMonth)}/día · {remainingDays} días restantes
                  </p>
                </div>
              )}
            </div>

            {/* ── BLOQUE 3: Stats adicionales ── */}
            <div className="sm:border-l sm:pl-5 grid grid-cols-2 gap-x-4 gap-y-3" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              {[
                { l: 'Transacciones hoy', v: txnVal, d: txnChange },
                { l: 'Ticket prom. hoy', v: ticketVal, d: null },
                { l: 'PPT mes', v: pptMensualpct != null ? `${pptMensualpct}%` : '—', sub: fmt(salesBudgetMonthly) },
                {
                  l: `vs ${new Date(now.getFullYear(), currentMonth === 1 ? 11 : currentMonth - 2, 1).toLocaleDateString('es', { month: 'short' })} mismo día`,
                  v: diffVsLastMonth != null ? `${diffVsLastMonth >= 0 ? '+' : ''}${diffVsLastMonth}%` : '—',
                  color: diffVsLastMonth == null ? '#94a3b8' : diffVsLastMonth >= 0 ? '#10b981' : '#f43f5e',
                },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-[0.1em] leading-tight mb-0.5">{s.l}</p>
                  <p className="text-[14px] font-black tabular-nums leading-none"
                    style={{ color: s.color || '#1e293b' }}>
                    {s.v}
                  </p>
                  {s.d != null && <Delta val={s.d} />}
                  {s.sub && <p className="text-[8px] text-slate-300 font-medium">{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── ROW 2: 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Proyección fin de mes */}
        <StatCard
          label="Proyección Mes"
          value={fmt(projection)}
          sublabel={projectionPct != null ? `${projectionPct}% del PPT` : 'Basado en promedio diario'}
          color="#6366f1"
          icon={TrendingUp}
          delay={0.08}
        >
          {projection != null && salesBudgetMonthly != null && (
            <div className="mt-2">
              <div className="flex justify-between text-[8.5px] text-slate-300 font-medium mb-1">
                <span>Proyección vs PPT</span>
                <span style={{ color: projectionPct >= 100 ? '#10b981' : '#f59e0b' }}>
                  {projectionPct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(projectionPct, 100)}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: projectionPct >= 100
                      ? 'linear-gradient(90deg,#059669,#10b981)'
                      : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  }}
                />
              </div>
              <p className="text-[8px] text-slate-300 mt-1">
                Quedan {remainingDays} días · prom {fmt(avgDailyThisMonth)}/día
              </p>
            </div>
          )}
        </StatCard>

        {/* Mejor día */}
        <StatCard
          label="Mejor Día Histórico"
          value={fmt(bestDay?.total_sales)}
          sublabel={bestDayFmt ?? '—'}
          color="#f59e0b"
          icon={Trophy}
          delay={0.12}
        >
          {bestDay && todaySalesRaw != null && (
            <div className="mt-2">
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((todaySalesRaw / bestDay.total_sales) * 100))}%`,
                      background: 'linear-gradient(90deg,#d97706,#f59e0b)',
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-amber-500 tabular-nums">
                  {Math.round((todaySalesRaw / bestDay.total_sales) * 100)}%
                </span>
              </div>
              <p className="text-[8px] text-slate-300 mt-0.5">de tu récord</p>
            </div>
          )}
        </StatCard>

        {/* Ticket promedio del mes */}
        <StatCard
          label="Ticket Prom. del Mes"
          value={fmt(avgTicketMes)}
          sublabel={`${totalTxnMes} transacciones este mes`}
          color="#0ea5e9"
          icon={BarChart2}
          delay={0.16}
        >
          <div className="mt-2">
            <PremiumSparkline
              data={thisMonthRecords.slice(-8).map(d =>
                d.total_transactions > 0 ? Math.round(d.total_sales / d.total_transactions) : 0
              )}
              color="#0ea5e9" width={90} height={22}
            />
          </div>
        </StatCard>

        {/* Diferencial vs mes pasado mismo día */}
        <StatCard
          label="vs Mes Pasado (hoy)"
          value={diffVsLastMonthAbs != null ? fmt(Math.abs(diffVsLastMonthAbs)) : '—'}
          sublabel={sameDayLastMonth ? `Mes pasado: ${fmt(sameDayLastMonth.total_sales)}` : 'Sin dato del mes pasado'}
          delta={diffVsLastMonth}
          color={diffVsLastMonth == null ? '#94a3b8' : diffVsLastMonth >= 0 ? '#10b981' : '#f43f5e'}
          icon={diffVsLastMonth == null || diffVsLastMonth >= 0 ? TrendingUp : TrendingDown}
          delay={0.2}
        >
          {diffVsLastMonth != null && (
            <p className="text-[9px] font-medium mt-2"
              style={{ color: diffVsLastMonth >= 0 ? '#059669' : '#dc2626' }}>
              {diffVsLastMonth >= 0 ? '▲ Por encima' : '▼ Por debajo'} del mismo día del mes anterior
            </p>
          )}
        </StatCard>
      </div>

      {/* ── ROW 3: Gráfica mensual con PPT ── */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.93)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.16em] mb-0.5">
                Ventas diarias del mes
              </p>
              <p className="text-[13px] font-bold text-slate-700">
                {new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {acumMes > 0 && (
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-700 tabular-nums">{fmt(acumMes)}</p>
                  <p className="text-[8px] text-slate-400 font-medium">acumulado</p>
                </div>
              )}
              {pptMensualpct != null && (
                <div className="text-right pl-4" style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
                  <p className="text-[20px] font-black tabular-nums leading-none text-slate-800">
                    {pptMensualpct}<span className="text-[12px] text-slate-400 font-semibold">%</span>
                  </p>
                  <p className="text-[8px] text-slate-400 font-medium">avance PPT</p>
                </div>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barSize={16}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C21875" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#C21875" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="barGradFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
              {dailyPPT && (
                <ReferenceLine
                  y={dailyPPT}
                  stroke="rgba(194,24,117,0.35)"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: `PPT ${fmt(dailyPPT)}`, position: 'insideTopRight', fontSize: 7.5, fill: '#C21875', fontWeight: 700 }}
                />
              )}
              <Bar dataKey="ventas" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={dailyPPT && entry.ventas >= dailyPPT ? 'url(#barGrad)' : 'url(#barGradFail)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda limpia */}
          <div className="flex items-center gap-5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C21875', opacity: 0.75 }} />
              <span className="text-[9px] text-slate-400 font-medium">Cumplió PPT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#94a3b8', opacity: 0.4 }} />
              <span className="text-[9px] text-slate-400 font-medium">Bajo PPT</span>
            </div>
            {dailyPPT && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 border-t border-dashed" style={{ borderColor: 'rgba(194,24,117,0.4)' }} />
                <span className="text-[9px] text-slate-400 font-medium">Línea PPT {fmt(dailyPPT)}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}