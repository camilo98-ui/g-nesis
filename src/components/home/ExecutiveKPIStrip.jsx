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
// Paleta pastel Popsy
const PASTEL = {
  pink:   { bg: '#FFF0F6', border: '#F9C8DE', text: '#C21875', ring: '#E8779A' },
  lavender: { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED', ring: '#A78BFA' },
  peach:  { bg: '#FFF7ED', border: '#FDDCB5', text: '#C2601B', ring: '#FDBA74' },
  mint:   { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', ring: '#6EE7B7' },
  sky:    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', ring: '#7DD3FC' },
  neutral:{ bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', ring: '#CBD5E1' },
};

function PPTRing({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct ?? 0));
  const palette = clamped >= 90 ? PASTEL.mint : clamped >= 70 ? PASTEL.peach : PASTEL.pink;
  const r = 26, cx = 32, cy = 32;
  const circ = 2 * Math.PI * r;
  const dash = (clamped / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64">
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="5" stroke={palette.border} />
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="5"
          stroke={palette.ring}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.23,1,0.32,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-black tabular-nums leading-none" style={{ color: palette.text }}>
          {pct != null ? clamped : '—'}
        </span>
        <span className="text-[7px] font-bold" style={{ color: palette.ring }}>%</span>
      </div>
    </div>
  );
}

// ── Stat card compacta ────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, delta, color, icon: Icon, children, delay = 0, pastel }) {
  const bg = pastel?.bg ?? '#FFFFFF';
  const border = pastel?.border ?? '#E2E8F0';
  const textColor = pastel?.text ?? '#64748B';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className="w-5 h-5 rounded-lg flex items-center justify-center"
              style={{ background: `${color}22` }}>
              <Icon style={{ width: 10, height: 10, color }} />
            </div>
          )}
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: textColor }}>{label}</p>
        </div>
        {delta != null && <Delta val={delta} />}
      </div>
      <p className="text-[22px] font-black tabular-nums leading-none text-slate-800 mb-0.5">{value}</p>
      {sublabel && <p className="text-[10px] font-medium mb-2" style={{ color: textColor }}>{sublabel}</p>}
      {children}
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

  // PPT mensual base del excel
  const salesBudgetMonthly = activeBudget?.sales_budget ?? null;

  // Meta diaria REAL: PPT mensual ÷ días del mes
  // Si el budget tiene sales_gap (diferencial vs PPT del excel), lo incluimos
  const salesGap = activeBudget?.sales_gap ?? 0;
  const adjustedMonthlyBudget = salesBudgetMonthly
    ? salesBudgetMonthly + (salesGap || 0)
    : null;
  const dailyPPT = adjustedMonthlyBudget ? Math.round(adjustedMonthlyBudget / daysInMonth) : null;

  const todaySalesRaw = latest?.total_sales ?? null;

  // PPT del día: ventas hoy vs meta diaria real
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
  // Avance vs presupuesto ajustado (con gap del excel)
  const pptMensualpct = adjustedMonthlyBudget
    ? Math.round((acumMes / adjustedMonthlyBudget) * 100) : null;

  // ── Proyección fin de mes ──
  // Promedio basado solo en días CON datos reales (días transcurridos con registro)
  const daysWithData = thisMonthRecords.filter(d => (d.total_sales || 0) > 0).length;
  const avgDailyThisMonth = daysWithData > 0 ? acumMes / daysWithData : null;
  const remainingDays = daysInMonth - currentDay;
  // Proyección = acumulado + (promedio * días restantes)
  const projection = avgDailyThisMonth != null
    ? Math.round(acumMes + avgDailyThisMonth * remainingDays) : null;
  // Proyección vs presupuesto ajustado (con gap)
  const projectionPct = adjustedMonthlyBudget && projection
    ? Math.round((projection / adjustedMonthlyBudget) * 100) : null;

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
        style={{ background: '#FFFFFF', border: '1px solid #F3E8EF', boxShadow: '0 2px 16px rgba(194,24,117,0.06)' }}
      >
        {/* Accent strip */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg,#E8779A,#C4A3D4,#93C5FD)' }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#E8779A', boxShadow: '0 0 6px #E8779A88' }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: '#9B7B8E' }}>
                {now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {acumMes > 0 && (
              <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: PASTEL.lavender.bg, color: PASTEL.lavender.text, border: `1px solid ${PASTEL.lavender.border}` }}>
                Acumulado: {fmt(acumMes)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* ── BLOQUE 1: Ventas hoy vs PPT ── */}
            <div className="rounded-xl p-4" style={{ background: PASTEL.pink.bg, border: `1px solid ${PASTEL.pink.border}` }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.13em] mb-3" style={{ color: PASTEL.pink.text }}>
                Meta del día
              </p>
              <div className="flex items-center gap-3 mb-3">
                <PPTRing pct={todayPPTPct} />
                <div>
                  <p className="text-[24px] font-black tabular-nums leading-none" style={{ color: '#1e293b' }}>
                    {salesVal}
                  </p>
                  {dailyPPT && (
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#9B7B8E' }}>
                      meta <span className="font-black" style={{ color: PASTEL.pink.text }}>{fmt(dailyPPT)}</span>
                    </p>
                  )}
                </div>
              </div>
              {/* Barra */}
              {todayPPTPct != null && (
                <>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: PASTEL.pink.border }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(todayPPTPct, 100)}%` }}
                      transition={{ delay: 0.3, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full rounded-full"
                      style={{ background: PASTEL.pink.ring }}
                    />
                  </div>
                  <p className="text-[8.5px] font-medium" style={{ color: '#B8829E' }}>
                    {todayPPTPct >= 100
                      ? `✓ Superaste en ${fmt(todaySalesRaw - dailyPPT)}`
                      : `Faltan ${fmt(dailyPPT - todaySalesRaw)}`}
                  </p>
                </>
              )}
            </div>

            {/* ── BLOQUE 2: Proyección cierre ── */}
            <div className="rounded-xl p-4" style={{ background: PASTEL.lavender.bg, border: `1px solid ${PASTEL.lavender.border}` }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.13em] mb-3" style={{ color: PASTEL.lavender.text }}>
                Proyección cierre mes
              </p>
              <p className="text-[24px] font-black tabular-nums leading-none mb-1" style={{ color: '#1e293b' }}>
                {fmt(projection)}
              </p>
              {adjustedMonthlyBudget && (
                <p className="text-[10px] font-semibold mb-3" style={{ color: '#9B8EC4' }}>
                  meta <span className="font-black" style={{ color: PASTEL.lavender.text }}>{fmt(adjustedMonthlyBudget)}</span>
                </p>
              )}
              {projectionPct != null && (
                <>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: PASTEL.lavender.border }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(projectionPct, 100)}%` }}
                      transition={{ delay: 0.45, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full rounded-full"
                      style={{ background: PASTEL.lavender.ring }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[8.5px] font-medium" style={{ color: '#9B8EC4' }}>
                      {remainingDays} días · prom {fmt(avgDailyThisMonth)}/día
                    </p>
                    <span className="text-[11px] font-black" style={{ color: PASTEL.lavender.text }}>
                      {projectionPct}%
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ── BLOQUE 3: Stats 2×2 ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Transacciones */}
              <div className="rounded-xl p-3" style={{ background: PASTEL.sky.bg, border: `1px solid ${PASTEL.sky.border}` }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: PASTEL.sky.text }}>Transacc.</p>
                <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: '#1e293b' }}>{txnVal}</p>
                {txnChange != null && <Delta val={txnChange} />}
              </div>
              {/* Ticket hoy */}
              <div className="rounded-xl p-3" style={{ background: PASTEL.peach.bg, border: `1px solid ${PASTEL.peach.border}` }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: PASTEL.peach.text }}>Ticket hoy</p>
                <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: '#1e293b' }}>{ticketVal}</p>
              </div>
              {/* Avance PPT mes */}
              <div className="rounded-xl p-3" style={{ background: pptMensualpct != null && pptMensualpct >= 90 ? PASTEL.mint.bg : PASTEL.pink.bg, border: `1px solid ${pptMensualpct != null && pptMensualpct >= 90 ? PASTEL.mint.border : PASTEL.pink.border}` }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: pptMensualpct != null && pptMensualpct >= 90 ? PASTEL.mint.text : PASTEL.pink.text }}>Avance mes</p>
                <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: '#1e293b' }}>
                  {pptMensualpct != null ? `${pptMensualpct}%` : '—'}
                </p>
              </div>
              {/* vs mismo día mes pasado */}
              <div className="rounded-xl p-3" style={{ background: diffVsLastMonth != null && diffVsLastMonth >= 0 ? PASTEL.mint.bg : PASTEL.neutral.bg, border: `1px solid ${diffVsLastMonth != null && diffVsLastMonth >= 0 ? PASTEL.mint.border : PASTEL.neutral.border}` }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: '#9B7B8E' }}>vs mes ant.</p>
                <p className="text-[16px] font-black tabular-nums leading-none"
                  style={{ color: diffVsLastMonth == null ? '#94a3b8' : diffVsLastMonth >= 0 ? PASTEL.mint.text : '#e11d48' }}>
                  {diffVsLastMonth != null ? `${diffVsLastMonth >= 0 ? '+' : ''}${diffVsLastMonth}%` : '—'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ── ROW 2: 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Proyección fin de mes */}
        {/* Proyección Mes */}
        <StatCard label="Proyección Mes" value={fmt(projection)}
          sublabel={projectionPct != null ? `${projectionPct}% del PPT` : '—'}
          color={PASTEL.lavender.ring} icon={TrendingUp} delay={0.08}
          pastel={PASTEL.lavender}>
          {projection != null && adjustedMonthlyBudget != null && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: PASTEL.lavender.border }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(projectionPct, 100)}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full" style={{ background: PASTEL.lavender.ring }} />
              </div>
              <p className="text-[8px] mt-1 font-medium" style={{ color: PASTEL.lavender.text }}>
                {remainingDays} días · {fmt(avgDailyThisMonth)}/día
              </p>
            </div>
          )}
        </StatCard>

        {/* Mejor día */}
        <StatCard label="Mejor Día Histórico" value={fmt(bestDay?.total_sales)}
          sublabel={bestDayFmt ?? '—'} color={PASTEL.peach.ring} icon={Trophy} delay={0.12}
          pastel={PASTEL.peach}>
          {bestDay && todaySalesRaw != null && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: PASTEL.peach.border }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, Math.round((todaySalesRaw / bestDay.total_sales) * 100))}%`,
                    background: PASTEL.peach.ring,
                  }} />
                </div>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: PASTEL.peach.text }}>
                  {Math.round((todaySalesRaw / bestDay.total_sales) * 100)}%
                </span>
              </div>
              <p className="text-[8px] mt-0.5 font-medium" style={{ color: PASTEL.peach.text }}>del récord</p>
            </div>
          )}
        </StatCard>

        {/* Ticket promedio del mes */}
        <StatCard label="Ticket Prom. Mes" value={fmt(avgTicketMes)}
          sublabel={`${totalTxnMes} txn este mes`} color={PASTEL.sky.ring} icon={BarChart2} delay={0.16}
          pastel={PASTEL.sky}>
          <div className="mt-2">
            <PremiumSparkline
              data={thisMonthRecords.slice(-8).map(d =>
                d.total_transactions > 0 ? Math.round(d.total_sales / d.total_transactions) : 0
              )}
              color={PASTEL.sky.ring} width={90} height={22}
            />
          </div>
        </StatCard>

        {/* Diferencial vs mes pasado */}
        <StatCard label="vs Mes Pasado (hoy)"
          value={diffVsLastMonthAbs != null ? fmt(Math.abs(diffVsLastMonthAbs)) : '—'}
          sublabel={sameDayLastMonth ? `Ant: ${fmt(sameDayLastMonth.total_sales)}` : 'Sin dato'}
          delta={diffVsLastMonth}
          color={diffVsLastMonth == null ? PASTEL.neutral.ring : diffVsLastMonth >= 0 ? PASTEL.mint.ring : '#F9A8C2'}
          icon={diffVsLastMonth == null || diffVsLastMonth >= 0 ? TrendingUp : TrendingDown}
          delay={0.2}
          pastel={diffVsLastMonth == null ? PASTEL.neutral : diffVsLastMonth >= 0 ? PASTEL.mint : PASTEL.pink}>
          {diffVsLastMonth != null && (
            <p className="text-[9px] font-medium mt-2"
              style={{ color: diffVsLastMonth >= 0 ? PASTEL.mint.text : PASTEL.pink.text }}>
              {diffVsLastMonth >= 0 ? '▲ Por encima' : '▼ Por debajo'} del mes anterior
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
                  <stop offset="0%" stopColor="#E8779A" stopOpacity="1" />
                  <stop offset="100%" stopColor="#F9C8DE" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="barGradFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
              {dailyPPT && (
                <ReferenceLine
                  y={dailyPPT}
                  stroke="#E8779A"
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

          {/* Leyenda */}
          <div className="flex items-center gap-5 mt-3 pt-3" style={{ borderTop: `1px solid ${PASTEL.pink.border}` }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#E8779A' }} />
              <span className="text-[9px] font-semibold" style={{ color: '#9B7B8E' }}>Cumplió meta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#CBD5E1' }} />
              <span className="text-[9px] font-semibold" style={{ color: '#9B7B8E' }}>Bajo meta</span>
            </div>
            {dailyPPT && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 border-t-2 border-dashed" style={{ borderColor: '#E8779A' }} />
                <span className="text-[9px] font-semibold" style={{ color: '#9B7B8E' }}>Meta {fmt(dailyPPT)}/día</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}