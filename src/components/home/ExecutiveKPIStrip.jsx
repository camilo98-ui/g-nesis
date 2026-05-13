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
      {/* ── ROW 1: Hero card PPT + Gauge ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(194,24,117,0.1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(194,24,117,0.05)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.06) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-5 flex-wrap">
          {/* Gauge PPT día */}
          <div className="flex-shrink-0">
            <PPTRing
              pct={todayPPTPct}
              label="PPT Día"
              sublabel={dailyPPT ? `meta ${fmt(dailyPPT)}` : 'Sin presupuesto'}
            />
          </div>

          {/* Gauge PPT mes */}
          <div className="flex-shrink-0">
            <PPTRing
              pct={pptMensualpct}
              label="PPT Mes"
              sublabel={salesBudgetMonthly ? `${fmt(salesBudgetMonthly)} total` : '—'}
            />
          </div>

          <div className="h-14 w-px hidden sm:block flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.07)' }} />

          {/* Ventas hoy */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-1">Ventas hoy</p>
            <p className="text-[34px] font-black leading-none tracking-tight tabular-nums text-slate-800 mb-1.5">
              {salesVal}
            </p>
            <div className="flex items-center flex-wrap gap-3">
              {salesChange != null && (
                <div className="flex items-center gap-1">
                  <Delta val={salesChange} />
                  <span className="text-[10px] text-slate-400">vs ayer</span>
                </div>
              )}
              {diffVsLastMonth != null && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: diffVsLastMonth >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${diffVsLastMonth >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}` }}>
                  {diffVsLastMonth >= 0
                    ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
                  <span className={`text-[10px] font-bold ${diffVsLastMonth >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {diffVsLastMonth >= 0 ? '+' : ''}{diffVsLastMonth}% vs {new Date(now.getFullYear(), currentMonth === 1 ? 11 : currentMonth - 2, 1).toLocaleDateString('es', { month: 'short' })} mismo día
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mini stats derechos */}
          <div className="flex gap-4 flex-shrink-0">
            {[
              { l: 'Transacciones', v: txnVal, d: txnChange },
              { l: 'Ticket hoy', v: ticketVal, d: null },
              { l: 'Acumulado', v: fmt(acumMes), d: null },
            ].map(s => (
              <div key={s.l} className="text-center min-w-[52px]">
                <p className="text-[14px] font-black tabular-nums text-slate-700 leading-none">{s.v}</p>
                {s.d != null ? <Delta val={s.d} /> : <div className="h-[18px]" />}
                <p className="text-[8.5px] text-slate-300 font-semibold tracking-wide mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div className="hidden lg:block flex-shrink-0 opacity-50">
            <PremiumSparkline
              data={sparkSales.length ? sparkSales : [1, 2, 2, 3, 2, 3, 4]}
              color="#C21875" width={90} height={32}
            />
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
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.14em]">Ventas diarias del mes vs PPT</p>
              <p className="text-[10.5px] font-medium text-slate-500 mt-0.5">
                {new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                {acumMes > 0 && ` · Acumulado: ${fmt(acumMes)}`}
              </p>
            </div>
            {pptMensualpct != null && (
              <div className="text-right">
                <p className="text-[18px] font-black tabular-nums"
                  style={{ color: pptMensualpct >= 95 ? '#10b981' : pptMensualpct >= 75 ? '#f59e0b' : '#e11d48' }}>
                  {pptMensualpct}%
                </p>
                <p className="text-[8.5px] text-slate-300 font-medium">avance PPT</p>
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              {dailyPPT && (
                <ReferenceLine y={dailyPPT} stroke="#C21875" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: 'PPT', position: 'insideTopRight', fontSize: 8, fill: '#C21875' }} />
              )}
              <Bar dataKey="ventas" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={dailyPPT
                      ? entry.ventas >= dailyPPT
                        ? '#10b981'
                        : entry.ventas >= dailyPPT * 0.75
                        ? '#f59e0b'
                        : '#f43f5e'
                      : '#C21875'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-2">
            {[
              { color: '#10b981', label: '≥ PPT' },
              { color: '#f59e0b', label: '75–99%' },
              { color: '#f43f5e', label: '< 75%' },
              { color: '#C21875', label: 'Meta PPT', dash: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                {l.dash
                  ? <div className="w-4 h-px border-t border-dashed" style={{ borderColor: l.color }} />
                  : <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />}
                <span className="text-[8.5px] text-slate-300 font-medium">{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}