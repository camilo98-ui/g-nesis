import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
  PieChart, Pie, Cell } from
'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

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

// Card wrapper
function AnalyticsCard({ title, subtitle, children, delay = 0, colSpan = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2 }}
      className={`rounded-3xl p-6 ${colSpan} group`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,248,250,0.95) 0%, rgba(255,255,255,0.9) 100%)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 77, 141, 0.12)',
        boxShadow: '0 2px 8px rgba(255, 77, 141, 0.08), 0 16px 48px rgba(0,0,0,0.04)',
        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
      }}>
      
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[9px] font-semibold text-[#8F96A3] uppercase tracking-[0.15em] letter-spacing">{title}</p>
          {subtitle && <p className="text-[12px] text-[#8F96A3] mt-1.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {children}
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
      whileHover={{ scale: 1.05 }}
      className="rounded-lg w-full aspect-square cursor-pointer transition-all"
      style={{
        background: `rgba(255, 77, 141, ${alpha})`,
        boxShadow: intensity > 0.6 ? `0 0 8px rgba(255, 77, 141, ${intensity * 0.3})` : 'none'
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
  return (
    <div className="flex items-center gap-5">
      <motion.div
        className="flex-shrink-0"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ width: 110, height: 110 }}>
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
              strokeWidth={0}>
              
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
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}>
          
            <div className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length], boxShadow: `0 0 8px ${PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]}40` }} />
            <span className="text-[10px] text-[#8F96A3] flex-1 font-medium">{item.name}</span>
            <span className="text-[10px] font-bold text-[#2A2A2A] tabular-nums">{item.value}%</span>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mb-7">
      
      {/* Section header */}
      


      

      {/* ── ROW 1: Sales Trend + EBITDA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Sales vs Projection chart */}
        <AnalyticsCard
          title="Ventas vs Proyección"
          subtitle={hasSalesData ? `Últimos ${sorted30.length} registros` : 'Sin datos aún'}
          delay={0.18}
          colSpan="lg:col-span-3">
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.08) 0%, rgba(255, 182, 201, 0.06) 100%)',
                border: '1px solid rgba(255, 77, 141, 0.15)'
              }}>
              
              <p className="text-[9px] text-[#8F96A3] font-semibold mb-2 uppercase tracking-wide">Ventas hoy</p>
              <p className="text-[22px] font-black tabular-nums tracking-tight leading-none" style={{ color: '#FF4D8D' }}>
                {fmt(today?.total_sales)}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 127, 165, 0.06) 0%, rgba(255, 182, 201, 0.04) 100%)',
                border: '1px solid rgba(255, 182, 201, 0.2)'
              }}>
              
              <p className="text-[9px] text-[#8F96A3] font-semibold mb-2 uppercase tracking-wide">Proyección EOD</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#FF7FA5' }}>
                {fmt(Math.round(today?.total_sales * 1.05) || 0)}
              </p>
            </motion.div>
          </div>

          {hasSalesData ?
          <div className="relative">
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={sorted30} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF4D8D" />
                      <stop offset="100%" stopColor="#FF7FA5" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3', fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis hide />
                  <Tooltip content={<SalesTooltip />} />
                  <Area
                  type="natural"
                  dataKey="ventas"
                  stroke="url(#lineStroke)"
                  strokeWidth={3}
                  fill="url(#salesGrad)"
                  dot={false}
                  isAnimationActive={true}
                  filterId="glow" />
                
                </ComposedChart>
              </ResponsiveContainer>
            </div> :

          <div className="h-[120px] flex items-center justify-center">
              <p className="text-[11px] text-[#8F96A3] font-medium">Registra ventas para ver la tendencia</p>
            </div>
          }
        </AnalyticsCard>

        {/* EBITDA por Mes */}
        <AnalyticsCard
          title="EBITDA Por Mes"
          subtitle="Margen operativo"
          delay={0.22}
          colSpan="lg:col-span-2">
          
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-black tabular-nums tracking-tight leading-none" style={{ color: '#FF4D8D' }}>
                {ebitdaData[ebitdaData.length - 1]?.margen || 34}%
              </p>
              <p className="text-[10px] text-[#8F96A3] mt-2 font-medium">margen promedio</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255, 77, 141, 0.08)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#FF4D8D' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#FF4D8D' }}>+2.1%</span>
            </div>
          </div>

          {ebitdaData.length > 0 ?
          <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={ebitdaData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7FA5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FF7FA5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<EbitdaTooltip />} />
                <Area
                type="natural"
                dataKey="margen"
                stroke="#FF7FA5"
                strokeWidth={2.5}
                fill="url(#ebitdaGrad)"
                dot={false}
                isAnimationActive={true} />
              
              </AreaChart>
            </ResponsiveContainer> :

          <div className="h-[100px] flex items-center justify-center">
              <p className="text-[11px] text-[#8F96A3] font-medium">Sin datos</p>
            </div>
          }
        </AnalyticsCard>
      </div>

      {/* ── ROW 2: TXN Heatmap + Participación + Cajeros ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hourly heatmap */}
        <AnalyticsCard title="Tráfico por Hora" subtitle="Transacciones · patrón semanal" delay={0.26}>
          <HourlyHeatmap data={heatmapData} />
          <div className="flex items-center justify-between mt-4">
            <span className="text-[8px] text-[#8F96A3] font-semibold uppercase">Bajo</span>
            <div className="flex gap-1.5 flex-1 mx-3">
              {[0.08, 0.22, 0.38, 0.54, 0.70, 0.86].map((a, i) =>
              <div key={i} className="flex-1 h-2 rounded-lg transition-all"
              style={{ background: `rgba(255, 77, 141, ${a})`, boxShadow: a > 0.6 ? `0 0 6px rgba(255, 77, 141, ${a * 0.4})` : 'none' }} />
              )}
            </div>
            <span className="text-[8px] text-[#8F96A3] font-semibold uppercase">Alto</span>
          </div>
        </AnalyticsCard>

        {/* Participación */}
        <AnalyticsCard title="Participación" subtitle="Mix del negocio por categoría" delay={0.3}>
          <DonutChart data={PARTICIPATION_SEGMENTS} />
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255, 77, 141, 0.1)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8F96A3] font-semibold uppercase tracking-wide">Mayor categoría</span>
              <span className="text-[10px] font-black" style={{ color: '#FF4D8D' }}>Helados · 42%</span>
            </div>
          </div>
        </AnalyticsCard>

        {/* Top Cajeros */}
        <AnalyticsCard title="Equipo Activo" subtitle={`${cashiers.length} colaboradores`} delay={0.34}>
          {cashiers.length > 0 ?
          <div className="space-y-2.5">
              {cashiers.slice(0, 5).map((c, i) => {
              const barW = 85 - i * 14;
              return (
                <div key={c.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-all"
                  style={{
                    background: i === 0 ? 'linear-gradient(135deg, rgba(255, 77, 141, 0.15), rgba(255, 182, 201, 0.1))' : 'rgba(255, 182, 201, 0.08)',
                    color: i === 0 ? '#FF4D8D' : '#FFB6C9',
                    border: i === 0 ? '1px solid rgba(255, 77, 141, 0.2)' : '1px solid rgba(255, 182, 201, 0.1)'
                  }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#2A2A2A] truncate">{c.name}</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full transition-all"
                        style={{
                          background: i === 0 ?
                          'linear-gradient(90deg, #FF4D8D, #FF7FA5)' :
                          'linear-gradient(90deg, rgba(255, 77, 141, 0.3), rgba(255, 182, 201, 0.2))',
                          boxShadow: i === 0 ? '0 0 12px rgba(255, 77, 141, 0.4)' : 'none'
                        }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-[#FFB6C9] font-medium flex-shrink-0 capitalize">{c.position || 'cajero'}</span>
                  </div>);

            })}
            </div> :

          <div className="flex flex-col items-center justify-center h-20 gap-2">
              <p className="text-[11px] text-[#8F96A3] font-medium">Sin cajeros registrados</p>
            </div>
          }

          {/* Budget compliance bar */}
          {compliance !== null &&
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255, 77, 141, 0.1)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#8F96A3] font-semibold uppercase tracking-wide">Cumplimiento PPT</span>
                <span className="text-[11px] font-black tabular-nums"
              style={{ color: compliance >= 80 ? '#10B981' : compliance >= 60 ? '#F59E0B' : '#FF4D8D' }}>
                  {compliance}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${compliance}%` }}
                transition={{ delay: 0.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                className="h-full rounded-full"
                style={{
                  background: compliance >= 80 ?
                  'linear-gradient(90deg, #10B981, #34D399)' :
                  compliance >= 60 ?
                  'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                  'linear-gradient(90deg, #FF4D8D, #FF7FA5)',
                  boxShadow: `0 0 12px ${compliance >= 80 ? 'rgba(16, 185, 129, 0.4)' : compliance >= 60 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 77, 141, 0.4)'}`
                }} />
              
              </div>
            </div>
          }
        </AnalyticsCard>
      </div>
    </motion.div>);

}