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
export default function ExecutiveAnalyticsPanel({ todaySales = [], budget = [], cashiers = [] }) {
  // Build 30-day sales trend from todaySales with projection
  const sorted30 = useMemo(() => {
    const daily = [...todaySales].
    sort((a, b) => new Date(a.date) - new Date(b.date)).
    slice(-30);

    const baseSales = daily.length > 0 ? daily[0].total_sales || 2000000 : 2000000;
    const growthRate = 0.015; // 1.5% daily growth

    return daily.map((d, i) => ({
      date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      ventas: d.total_sales || baseSales,
      proyeccion: Math.round(baseSales * Math.pow(1 + growthRate, i)),
      txn: d.total_transactions || 0
    }));
  }, [todaySales]);

  // EBITDA por mes (agrupado)
  const ebitdaData = useMemo(() => {
    const monthlyMap = {};
    todaySales.forEach((d) => {
      const date = new Date(d.date);
      const monthKey = date.toLocaleDateString('es', { month: 'short', year: '2-digit' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { sales: 0, count: 0 };
      }
      monthlyMap[monthKey].sales += d.total_sales || 0;
      monthlyMap[monthKey].count += 1;
    });

    return Object.entries(monthlyMap).map(([month, data]) => ({
      date: month,
      ebitda: Math.round(data.sales * 0.34),
      margen: 34
    }));
  }, [todaySales]);

  // Hourly heatmap data — mock realistic pattern
  const heatmapData = useMemo(() => {
    const pattern = [2, 3, 5, 8, 14, 18, 16, 14, 12, 10, 8, 6, 5, 3];
    const result = [];
    DAYS.forEach((_, di) => {
      HOURS.forEach((_, hi) => {
        const base = pattern[hi] || 0;
        const weekendBoost = di >= 5 ? 1.4 : 1;
        const lunchBoost = hi >= 4 && hi <= 6 ? 1.3 : 1;
        result.push({
          day: di, hour: hi,
          value: Math.round(base * weekendBoost * lunchBoost * (0.7 + Math.random() * 0.6))
        });
      });
    });
    return result;
  }, []);

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
  
  // Projection EOD today
  const todayEODProjection = today ? Math.round(today.total_sales * 1.15) : 0;
  const todayCompliancePercent = activeBudget?.sales_budget ? Math.round((today?.total_sales / activeBudget.sales_budget) * 100) : 0;
  const todayProjectedCompliancePercent = activeBudget?.sales_budget ? Math.round((todayEODProjection / activeBudget.sales_budget) * 100) : 0;
  
  // EBITDA with proper calculation
  const ebitdaDataEnhanced = useMemo(() => {
    const monthlyMap = {};
    todaySales.forEach((d) => {
      const date = new Date(d.date);
      const monthKey = date.toLocaleDateString('es', { month: 'short', year: '2-digit' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { sales: 0, count: 0, ebitda: 0 };
      }
      monthlyMap[monthKey].sales += d.total_sales || 0;
      monthlyMap[monthKey].count += 1;
    });

    const data = Object.entries(monthlyMap).map(([month, data]) => {
      const margenPercent = 34; // 34% EBITDA margin
      return {
        date: month,
        ebitda: Math.round(data.sales * (margenPercent / 100)),
        margen: margenPercent,
        sales: data.sales
      };
    });
    
    return data;
  }, [todaySales]);
  
  // Average margin line
  const avgMargin = ebitdaDataEnhanced.length > 0 
    ? Math.round(ebitdaDataEnhanced.reduce((sum, d) => sum + d.margen, 0) / ebitdaDataEnhanced.length)
    : 34;
  
  const ebitdaDataWithAvg = ebitdaDataEnhanced.map(d => ({
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

        {/* Tendencia de Ventas con Proyección y Cierre Mes */}
        <AnalyticsCard
          title="Tendencia & Proyección"
          subtitle="Últimos 30 días + proyección al cierre del mes"
          delay={0.18}
          colSpan="lg:col-span-3">
          
          {hasSalesData ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="p-3 rounded-xl group relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.08), rgba(255, 182, 201, 0.04))' }}>
                  
                  <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Proyección EOD</p>
                  <p className="text-[18px] font-black text-[#FF4D8D] mb-1" style={{ lineHeight: '1' }}>
                    {fmt(todayEODProjection)}
                  </p>
                  <p className="text-[9px] font-bold" style={{ color: todayProjectedCompliancePercent >= 80 ? '#10b981' : '#f59e0b' }}>
                    {todayProjectedCompliancePercent}% de PPT hoy
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-3 rounded-xl group relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(255, 127, 165, 0.08), rgba(255, 182, 201, 0.04))' }}>
                  
                  <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-1">Proyección Mes</p>
                  <p className="text-[18px] font-black text-[#FF7FA5] mb-1" style={{ lineHeight: '1' }}>
                    {fmt(todayEODProjection * 28)}
                  </p>
                  <p className="text-[9px] font-bold" style={{ color: Math.round((todayEODProjection * 28 / (activeBudget?.sales_budget || 1)) * 100) >= 100 ? '#10b981' : '#f59e0b' }}>
                    {Math.round((todayEODProjection * 28 / (activeBudget?.sales_budget || 1)) * 100)}% de PPT mes
                  </p>
                </motion.div>
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={sorted30} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<SalesTooltip />} />
                  <Area type="monotone" dataKey="ventas" stroke="#FF4D8D" strokeWidth={2.5} fill="url(#ventasGrad)" dot={false} />
                  <Line type="monotone" dataKey="proyeccion" stroke="#FFB4C9" strokeWidth={2.5} strokeDasharray="5,5" dot={false} name="Proyección" />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className="flex gap-6 mt-3 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF4D8D' }} />
                  <span className="text-[#8F96A3]">Ventas Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFB4C9' }} />
                  <span className="text-[#8F96A3]">Proyección Diaria</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[11px] text-[#8F96A3]">Sin datos disponibles</p>
            </div>
          )}
        </AnalyticsCard>

        {/* Desempeño de Tiendas - Gráfico Comparativo */}
        <AnalyticsCard
          title="Performance Stores"
          subtitle="Análisis comparativo en tiempo real"
          delay={0.22}
          colSpan="lg:col-span-2">
          
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={[
              { name: 'BTA 11', sales: 92, ticket: 88, avg: 90 },
              { name: 'BTA 08', sales: 85, ticket: 79, avg: 82 },
              { name: 'BTA 15', sales: 78, ticket: 74, avg: 76 }
            ]} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="storeGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#8F96A3' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={makePremiumTooltip((val) => `${val}%`)} />
              <Bar dataKey="sales" fill="#FF4D8D" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="avg" stroke="#FFB4C9" strokeWidth={2.5} dot={{ fill: '#FFB4C9', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { store: 'BTA 11', status: '✓ Líder', color: '#10b981' },
              { store: 'BTA 08', status: '⚡ Activo', color: '#f59e0b' },
              { store: 'BTA 15', status: '⚠ Alerta', color: '#ef4444' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[9px] font-semibold text-[#2A2A2A]">{s.store}</p>
                <p className="text-[8px] font-bold mt-1" style={{ color: s.color }}>{s.status}</p>
              </div>
            ))}
          </div>
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
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-2">Peak Hours</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                <p className="text-[8px] text-[#8F96A3] font-medium">Mañana</p>
                <p className="text-[10px] font-bold text-[#FF4D8D]">9am-11am</p>
              </div>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 77, 141, 0.05)' }}>
                <p className="text-[8px] text-[#8F96A3] font-medium">Tarde</p>
                <p className="text-[10px] font-bold text-[#FF4D8D]">1pm-3pm</p>
              </div>
            </div>
          </div>
        </AnalyticsCard>

        {/* Participación */}
        <AnalyticsCard title="Participación" subtitle="Mix del negocio por categoría" delay={0.3}>
          <DonutChart data={PARTICIPATION_SEGMENTS} />
          <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255, 77, 141, 0.1)' }}>
            <p className="text-[8px] text-[#8F96A3] font-semibold uppercase mb-2">Top 2 Categorías</p>
            <div className="space-y-1.5">
              {[
                { cat: 'Helados', pct: 42, growth: '+8%' },
                { cat: 'Bebidas', pct: 23, growth: '+2%' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 mr-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 0.35 + i * 0.1, duration: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: PARTICIPATION_COLORS[i] }} />
                  </div>
                  <span className="text-[8px] font-bold text-[#2A2A2A] w-12 text-right">{item.pct}%</span>
                  <span className="text-[8px] font-bold text-emerald-600 w-8 text-right">{item.growth}</span>
                </div>
              ))}
            </div>
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