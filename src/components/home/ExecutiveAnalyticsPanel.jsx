import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, LineChart, Line, BarChart, Bar
} from
'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

// ── ANIMATED COUNTER ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, format = (v) => v, delay = 0, duration = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = value / (duration * 60);
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, 16);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay, duration]);
  
  return format(displayValue);
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function pct(a, b) {
  if (!a || !b) return null;
  return Math.round((a - b) / b * 100);
}

function Delta({ val }) {
  if (val === null) return <span className="text-[10px] text-slate-300">—</span>;
  const pos = val >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>);

}

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
function makePremiumTooltip(formatter) {
  return function PremiumTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-3 py-2 shadow-lg"
      style={{ background: 'rgba(15,15,20,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
        <p className="text-[10px] font-medium text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) =>
        <p key={i} className="text-[12px] font-bold" style={{ color: p.color || '#fff' }}>
            {formatter ? formatter(p.value) : p.value}
          </p>
        )}
      </div>);

  };
}

const SalesTooltip = makePremiumTooltip(fmt);
const EbitdaTooltip = makePremiumTooltip((val) => `${val}%`);

// ── PREMIUM ANALYTICS CARD ────────────────────────────────────────────────────
function AnalyticsCard({ title, subtitle, children, delay = 0, colSpan = '' }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.4 } }}
      className={`rounded-3xl p-6 ${colSpan} group relative overflow-hidden`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,248,250,0.98) 0%, rgba(255,255,255,0.93) 100%)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 77, 141, 0.15)',
      }}>
      
      {/* Animated glow effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={isHovered ? { opacity: 0.03 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 77, 141, 0.1), transparent 80%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none"
        animate={isHovered ? { opacity: 0.5 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.2), rgba(255, 182, 201, 0.1))',
          boxShadow: '0 0 20px rgba(255, 77, 141, 0.2), inset 0 0 20px rgba(255, 77, 141, 0.08)',
          filter: 'blur(1px)'
        }}
      />
      
      {/* Dynamic shadow */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 pointer-events-none"
        animate={isHovered ? { opacity: 1 } : { opacity: 0.5 }}
        transition={{ duration: 0.4 }}
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px rgba(255, 77, 141, 0.12), 0 8px 16px rgba(0,0,0,0.06)'
            : '0 2px 8px rgba(255, 77, 141, 0.08), 0 16px 48px rgba(0,0,0,0.04)'
        }}
      />
      
      <div className="relative z-10 flex items-start justify-between mb-5">
        <div>
          <motion.p 
            className="text-[9px] font-semibold text-[#8F96A3] uppercase tracking-[0.15em]"
            animate={isHovered ? { letterSpacing: '0.2em' } : { letterSpacing: '0.15em' }}
            transition={{ duration: 0.3 }}>
            {title}
          </motion.p>
          {subtitle && (
            <motion.p 
              className="text-[12px] text-[#8F96A3] mt-1.5 font-medium"
              animate={isHovered ? { color: '#FF4D8D' } : { color: '#8F96A3' }}
              transition={{ duration: 0.3 }}>
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>);

}

// ── HOURLY HEATMAP ────────────────────────────────────────────────────────────
const HOURS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'];
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function HeatmapCell({ value, max }) {
  const intensity = max > 0 ? value / max : 0;
  const alpha = 0.06 + intensity * 0.85;
  
  return (
    <motion.div
      whileHover={{ scale: 1.15, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.95 }}
      className="rounded-lg w-full aspect-square cursor-pointer"
      animate={{
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      style={{
        background: `rgba(255, 77, 141, ${alpha})`,
        boxShadow: intensity > 0.6 
          ? `0 0 12px rgba(255, 77, 141, ${intensity * 0.4})` 
          : `0 0 4px rgba(255, 77, 141, ${intensity * 0.15})`
      }}
      title={`${value} txn`} />);

}

function HourlyHeatmap({ data }) {
  // data: array of { hour, day, value }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {/* Hour labels */}
      <div className="flex gap-1 mb-1 ml-5">
        {HOURS.map((h) =>
        <div key={h} className="flex-1 text-center text-[8px] text-slate-300 font-medium">{h}</div>
        )}
      </div>
      {/* Grid */}
      {DAYS.map((day, di) =>
      <div key={day} className="flex items-center gap-1 mb-1">
          <div className="w-4 text-[8px] text-slate-300 font-medium text-right flex-shrink-0">{day}</div>
          {HOURS.map((_, hi) => {
          const cell = data.find((d) => d.day === di && d.hour === hi) || { value: 0 };
          return <HeatmapCell key={hi} value={cell.value} max={max} />;
        })}
        </div>
      )}
    </div>);

}

// ── PARTICIPATION DONUT ───────────────────────────────────────────────────────
const PARTICIPATION_COLORS = ['#C21875', '#d97706', '#059669', '#6366f1', '#64748b'];
const PARTICIPATION_SEGMENTS = [
{ name: 'Helados', value: 42 },
{ name: 'Bebidas', value: 23 },
{ name: 'Combos', value: 18 },
{ name: 'Postres', value: 11 },
{ name: 'Otros', value: 6 }];


function DonutChart({ data }) {
  const [isHovered, setIsHovered] = useState(null);
  
  return (
    <div className="flex items-center gap-5">
      <motion.div 
        className="flex-shrink-0 relative"
        initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
        style={{ width: 110, height: 110 }}>
        {/* Pulsing halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(255, 77, 141, 0)',
              '0 0 30px rgba(255, 77, 141, 0.15)',
              '0 0 20px rgba(255, 77, 141, 0)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              animationDuration={1000}
              animationEasing="ease-out">
              
              {data.map((_, i) =>
              <Cell key={i} fill={PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]} />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
      <div className="flex-1 space-y-2">
        {data.map((item, i) =>
        <motion.div
          key={item.name}
          className="flex items-center gap-2.5 group cursor-pointer"
          onHoverStart={() => setIsHovered(i)}
          onHoverEnd={() => setIsHovered(null)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.08, ease: [0.165, 0.84, 0.44, 1] }}
          whileHover={{ x: 4 }}>
          
            <motion.div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
              animate={{
                scale: isHovered === i ? 1.4 : 1,
                boxShadow: isHovered === i 
                  ? `0 0 16px ${PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]}80`
                  : `0 0 8px ${PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]}40`
              }}
              transition={{ duration: 0.3 }}
              style={{ background: PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length] }} />
            <span className="text-[10px] text-[#8F96A3] flex-1 font-medium group-hover:text-[#FF4D8D] transition-colors duration-300">{item.name}</span>
            <motion.span 
              className="text-[10px] font-bold text-[#2A2A2A] tabular-nums"
              animate={{ scale: isHovered === i ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}>
              {item.value}%
            </motion.span>
          </motion.div>
        )}
      </div>
    </div>);

}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ExecutiveAnalyticsPanel({ todaySales = [], budget = [], cashiers = [], pygReports = [], shiftRecords = [] }) {

  // Build 30-day trend from todaySales
  const sorted30 = useMemo(() => {
    const daily = [...todaySales]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    return daily.map((d) => {
      const ventas = d.total_sales || 0;
      const txn = d.total_transactions || 0;
      const ticket = txn > 0 ? Math.round(ventas / txn) : 0;

      const saleDate = new Date(d.date);
      const salesMonth = saleDate.getMonth() + 1;
      const salesYear = saleDate.getFullYear();
      const matchBudget = budget.find(b => Number(b.month) === salesMonth && Number(b.year) === salesYear) || budget[0];
      const daysInSaleMonth = new Date(salesYear, salesMonth, 0).getDate();
      const dailyPPT = matchBudget?.sales_budget ? matchBudget.sales_budget / daysInSaleMonth : 0;
      const ticketPPT = 25000; // Meta fija de ticket promedio

      return {
        date: saleDate.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        ventas,
        presupuesto: dailyPPT,
        ticket,
        ticketPPT,
        txn
      };
    });
  }, [todaySales, budget]);

  // EBITDA real desde PYGReports — ordenado por año/mes
  const ebitdaDataEnhancedFromPYG = useMemo(() => {
    if (!pygReports.length) return [];
    const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return [...pygReports]
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(r => ({
        date: `${monthNames[r.month]} ${String(r.year).slice(2)}`,
        margen: r.margen_ebitda != null ? Math.round(r.margen_ebitda * 100) : null,
        sales: r.total_sales || 0
      }))
      .filter(d => d.margen !== null);
  }, [pygReports]);

  // Hourly heatmap data — desde todaySales agrupado por día de semana
  // Distribuye las transacciones del día usando un patrón horario típico de heladería
  const heatmapData = useMemo(() => {
    // Patrón horario normalizado (14 horas: 8a-9p), picos a mediodía y tarde
    const hourWeights = [0.03, 0.04, 0.06, 0.08, 0.10, 0.12, 0.11, 0.10, 0.09, 0.09, 0.08, 0.06, 0.03, 0.01];

    // Acumular transacciones reales por día de semana desde todaySales
    const dayTxnMap = {}; // { dayOfWeek: total_transactions }
    const dayCountMap = {}; // { dayOfWeek: count } para promediar
    todaySales.forEach(d => {
      const date = new Date(d.date);
      const dow = (date.getDay() + 6) % 7; // 0=Lun...6=Dom
      if (!dayTxnMap[dow]) { dayTxnMap[dow] = 0; dayCountMap[dow] = 0; }
      dayTxnMap[dow] += d.total_transactions || 0;
      dayCountMap[dow]++;
    });

    // Construir heatmap distribuyendo el promedio diario por franja horaria
    return DAYS.flatMap((_, di) =>
      HOURS.map((_, hi) => {
        const avgTxn = dayCountMap[di] > 0 ? dayTxnMap[di] / dayCountMap[di] : 0;
        return { day: di, hour: hi, value: Math.round(avgTxn * hourWeights[hi]) };
      })
    );
  }, [todaySales]);

  // Budget compliance
  const activeBudget = budget.find((b) => b.is_active) || budget[0];
  const totalSales = todaySales.reduce((s, d) => s + (d.total_sales || 0), 0);
  const compliance = activeBudget?.sales_budget ?
  Math.min(100, Math.round(totalSales / activeBudget.sales_budget * 100)) :
  null;

  // Latest day metrics
  const sortedDesc = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = sortedDesc[0];
  const yesterday = sortedDesc[1];
  const salesDelta = pct(today?.total_sales, yesterday?.total_sales);
  const txnDelta = pct(today?.total_transactions, yesterday?.total_transactions);

  const hasSalesData = sorted30.length > 0;
  
  // ── PROYECCIÓN: solo mes actual ──────────────────────────────────────────────
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth = currentDate.getDate(); // días transcurridos (incluye hoy)

  // Ventas solo del mes actual
  const currentMonthSales = todaySales.filter(d => {
    const dd = new Date(d.date);
    return dd.getMonth() === currentMonth && dd.getFullYear() === currentYear;
  });
  const currentMonthTotal = currentMonthSales.reduce((s, d) => s + (d.total_sales || 0), 0);
  const daysWithData = currentMonthSales.length || 1;
  const avgDailySales = Math.round(currentMonthTotal / daysWithData);

  // Proyección: lo ya acumulado + promedio diario × días restantes
  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0);
  const monthSalesProjection = currentMonthTotal + (avgDailySales * daysRemaining);
  const monthProjectionPercent = activeBudget?.sales_budget
    ? Math.round((monthSalesProjection / activeBudget.sales_budget) * 100)
    : 0;
  
  // Average margin from real PYG data
  const avgMargin = ebitdaDataEnhancedFromPYG.length > 0
    ? Math.round(ebitdaDataEnhancedFromPYG.reduce((sum, d) => sum + d.margen, 0) / ebitdaDataEnhancedFromPYG.length)
    : 0;

  const ebitdaDataWithAvg = ebitdaDataEnhancedFromPYG.map(d => ({
    ...d,
    promedio: avgMargin
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mb-7">
      
      {/* Section header */}
      


      

      {/* ── ROW 1: Tendencia de Ventas + Matriz de Desempeño ── */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, staggerChildren: 0.1 }}>

        {/* Tendencia Ticket Promedio */}
        <AnalyticsCard
          title="Ticket Promedio"
          subtitle="Tendencia diaria · últimos 30 días"
          delay={0.18}
          colSpan="lg:col-span-3">
          
          {hasSalesData ? (
            <>
              {/* KPI summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(() => {
                  const withTicket = sorted30.filter(d => d.ticket > 0);
                  const avgTicket = withTicket.length > 0 ? Math.round(withTicket.reduce((s, d) => s + d.ticket, 0) / withTicket.length) : 0;
                  const latestTicket = withTicket[withTicket.length - 1]?.ticket || 0;
                  const ticketPPT = 25000;
                  const pctVsPPT = Math.round((latestTicket / ticketPPT) * 100);
                  return (
                    <>
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                        className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,77,141,0.08), rgba(255,182,201,0.04))' }}>
                        <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Último día</p>
                        <p className="text-[16px] font-black text-[#FF4D8D] mb-0.5" style={{ lineHeight: '1' }}>{fmt(latestTicket)}</p>
                        {pctVsPPT !== null && <p className="text-[9px] font-bold" style={{ color: pctVsPPT >= 100 ? '#10b981' : '#f59e0b' }}>{pctVsPPT}% del PPT</p>}
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,127,165,0.08), rgba(255,182,201,0.04))' }}>
                        <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Promedio 30d</p>
                        <p className="text-[16px] font-black text-[#FF7FA5] mb-0.5" style={{ lineHeight: '1' }}>{fmt(avgTicket)}</p>
                        <p className="text-[9px] font-bold text-[#8F96A3]">período actual</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(165,180,252,0.04))' }}>
                        <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Meta Ticket</p>
                        <p className="text-[16px] font-black text-indigo-400 mb-0.5" style={{ lineHeight: '1' }}>$25K</p>
                        <p className="text-[9px] font-bold text-[#8F96A3]">presupuesto</p>
                      </motion.div>
                    </>
                  );
                })()}
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={sorted30} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,77,141,0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid rgba(255,77,141,0.2)', borderRadius: 12, fontSize: 11 }}
                    formatter={(v, name) => [fmt(v), name]} />
                  <Area type="monotone" dataKey="ticket" stroke="#FF4D8D" strokeWidth={2.5} fill="url(#ticketGrad)" dot={false} name="Ticket Real" />
                  <Line type="monotone" dataKey="ticketPPT" stroke="#6366f1" strokeWidth={2} strokeDasharray="5,5" dot={false} name="Meta Ticket $25K" />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="flex gap-6 mt-3 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF4D8D' }} />
                  <span className="text-[#8F96A3]">Ticket Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
                  <span className="text-[#8F96A3]">Meta Ticket (PPT)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[11px] text-[#8F96A3]">Sin datos disponibles</p>
            </div>
          )}
        </AnalyticsCard>

        {/* EBITDA % Mensual */}
        <AnalyticsCard
          title="EBITDA Mensual"
          subtitle="Tendencia % de margen bruto por mes"
          delay={0.22}
          colSpan="lg:col-span-2">
          
          {ebitdaDataWithAvg && ebitdaDataWithAvg.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={ebitdaDataWithAvg} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 50]} />
                  <Tooltip content={<EbitdaTooltip />} />
                  <Line type="monotone" dataKey="margen" stroke="#FF4D8D" strokeWidth={2.5} dot={{ fill: '#FF4D8D', r: 4 }} name="EBITDA %" />
                  <Line type="linear" dataKey="promedio" stroke="#FFB4C9" strokeWidth={2} strokeDasharray="4,4" dot={false} name="Promedio" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                    <p className="text-[#8F96A3] font-medium mb-1">Actual</p>
                    <p className="text-[14px] font-black text-[#FF4D8D]">{ebitdaDataWithAvg[ebitdaDataWithAvg.length - 1]?.margen || 0}%</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                    <p className="text-[#8F96A3] font-medium mb-1">Promedio</p>
                    <p className="text-[14px] font-black text-[#FFB4C9]">{avgMargin}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-[11px] text-[#8F96A3]">Sin datos de EBITDA</p>
            </div>
          )}
        </AnalyticsCard>
      </motion.div>

      {/* ── ROW 2: TXN Heatmap + Participación + Cajeros ── */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, staggerChildren: 0.1, delayChildren: 0.2 }}>

        {/* Hourly heatmap */}
         <AnalyticsCard title="Tráfico por Hora" subtitle="Transacciones · patrón semanal" delay={0.26}>
          <HourlyHeatmap data={heatmapData} />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[8px] text-[#8F96A3] font-semibold uppercase">Bajo</span>
            <div className="flex gap-1.5 flex-1 mx-3">
              {[0.08, 0.22, 0.38, 0.54, 0.70, 0.86].map((a, i) =>
              <div key={i} className="flex-1 h-2 rounded-lg transition-all"
              style={{ background: `rgba(255, 77, 141, ${a})`, boxShadow: a > 0.6 ? `0 0 6px rgba(255, 77, 141, ${a * 0.4})` : 'none' }} />
              )}
            </div>
            <span className="text-[8px] text-[#8F96A3] font-semibold uppercase">Alto</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-2">KPI Adicionales</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                <p className="text-[8px] text-[#8F96A3] font-medium">Promedio Txn</p>
                <p className="text-[10px] font-bold text-[#FF4D8D]">{Math.round(sorted30.reduce((s, d) => s + (d.txn || 0), 0) / (sorted30.length || 1))}</p>
              </div>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                <p className="text-[8px] text-[#8F96A3] font-medium">Peak Hours</p>
                <p className="text-[10px] font-bold text-[#FF4D8D]">1pm-3pm</p>
              </div>
            </div>
            {/* Mini sparkline de txn por día */}
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Txn últimos 14 días</p>
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sorted30.slice(-14)} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="txnMiniGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="txn" stroke="#FF4D8D" strokeWidth={1.5} fill="url(#txnMiniGrad)" dot={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,15,20,0.9)', border: 'none', borderRadius: 8, fontSize: 10, padding: '4px 8px' }}
                  formatter={(v) => [v, 'Txn']}
                  labelFormatter={(l) => l}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* Participación */}
         <AnalyticsCard title="Participación" subtitle="Mix del negocio por categoría" delay={0.3}>
          <DonutChart data={PARTICIPATION_SEGMENTS} />
          <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255, 77, 141, 0.1)' }}>
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-2">Ticket Promedio</p>
            <div className="p-2 rounded-lg mb-3" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
              <p className="text-[9px] text-[#8F96A3] font-medium">Período Actual</p>
              <p className="text-[13px] font-black text-[#FF4D8D] mt-1">
                {fmt((todaySales.reduce((s, d) => s + (d.total_sales || 0), 0) / Math.max(todaySales.reduce((s, d) => s + (d.total_tickets || 1), 0), 1)))}
              </p>
            </div>
            {/* Mini sparkline de ticket promedio diario */}
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Ticket últimos 14 días</p>
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sorted30.slice(-14)} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="ticketMiniGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ticket" stroke="#6366f1" strokeWidth={1.5} fill="url(#ticketMiniGrad)" dot={false} />
                {/* Línea de meta $25K */}
                <Line type="monotone" dataKey="ticketPPT" stroke="#FFB4C9" strokeWidth={1} strokeDasharray="3,3" dot={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,15,20,0.9)', border: 'none', borderRadius: 8, fontSize: 10, padding: '4px 8px' }}
                  formatter={(v) => [fmt(v), 'Ticket']}
                  labelFormatter={(l) => l}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* Mejores Días de Venta */}
        <AnalyticsCard title="Mejores Días" subtitle="Top días de venta del mes actual" delay={0.34}>
          {todaySales && todaySales.length > 0 ? (() => {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const thisMonthSales = todaySales.filter(d => {
              const date = new Date(d.date);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 5);
            
            const maxSales = Math.max(...thisMonthSales.map(d => d.total_sales || 0), 1);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            return thisMonthSales.length > 0 ? (
              <div className="space-y-3">
                {thisMonthSales.map((d, i) => {
                  const salesPercent = (d.total_sales / maxSales) * 100;
                  const dateObj = new Date(d.date);
                  const dateStr = dateObj.toLocaleDateString('es', { day: '2-digit', month: 'short' });
                  const dayName = dayNames[dateObj.getDay()];
                  const pptCompliance = activeBudget?.sales_budget ? Math.round((d.total_sales / activeBudget.sales_budget) * 100) : null;
                  
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                          style={{
                            background: i === 0 ? 'linear-gradient(135deg, #FF4D8D, #FF7FA5)' : `rgba(255, 77, 141, ${0.08 + i * 0.02})`,
                            color: i === 0 ? '#fff' : '#FF4D8D',
                            boxShadow: i === 0 ? '0 0 12px rgba(255, 77, 141, 0.4)' : 'none'
                          }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-[#2A2A2A]">{dateStr} · <span className="text-[#8F96A3] font-medium">{dayName}</span></p>
                          <p className="text-[9px] text-[#8F96A3] font-medium">{(d.total_transactions || 0).toLocaleString('es-CO')} txn</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] font-black tabular-nums" style={{ color: '#FF4D8D' }}>
                            {fmt(d.total_sales)}
                          </p>
                          {pptCompliance !== null && (
                            <p className={`text-[9px] font-bold tabular-nums mt-1 ${pptCompliance >= 80 ? 'text-emerald-600' : pptCompliance >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>
                              {pptCompliance}% PPT
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${salesPercent}%` }}
                          transition={{ delay: 0.55 + i * 0.08, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full rounded-full transition-all"
                          style={{
                            background: i === 0 
                              ? 'linear-gradient(90deg, #FF4D8D, #FF7FA5)' 
                              : `linear-gradient(90deg, rgba(255, 77, 141, ${0.4 - i * 0.08}), rgba(255, 182, 201, ${0.3 - i * 0.06}))`,
                            boxShadow: i === 0 ? '0 0 12px rgba(255, 77, 141, 0.4)' : 'none'
                          }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-20 gap-2">
                <p className="text-[11px] text-[#8F96A3] font-medium">Sin registros en el mes actual</p>
              </div>
            );
          })() : (
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              <p className="text-[11px] text-[#8F96A3] font-medium">Sin datos de ventas</p>
            </div>
          )}
        </AnalyticsCard>
      </motion.div>
    </motion.div>);

}