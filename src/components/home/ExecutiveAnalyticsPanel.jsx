import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function pct(a, b) {
  if (!a || !b) return null;
  return Math.round(((a - b) / b) * 100);
}

function Delta({ val }) {
  if (val === null) return <span className="text-[10px] text-slate-300">—</span>;
  const pos = val >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>
  );
}

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
function PremiumTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg"
      style={{ background: 'rgba(15,15,20,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[10px] font-medium text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[12px] font-bold" style={{ color: p.color || '#fff' }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// Card wrapper
function AnalyticsCard({ title, subtitle, children, delay = 0, colSpan = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl p-5 ${colSpan}`}
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.13em]">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-300 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ── HOURLY HEATMAP ────────────────────────────────────────────────────────────
const HOURS = ['8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p'];
const DAYS  = ['L','M','X','J','V','S','D'];

function HeatmapCell({ value, max }) {
  const intensity = max > 0 ? value / max : 0;
  // From pearl white → Popsy pink
  const alpha = 0.06 + intensity * 0.88;
  return (
    <div
      className="rounded-md w-full aspect-square"
      style={{ background: `rgba(194, 24, 117, ${alpha})` }}
      title={`${value} txn`}
    />
  );
}

function HourlyHeatmap({ data }) {
  // data: array of { hour, day, value }
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {/* Hour labels */}
      <div className="flex gap-1 mb-1 ml-5">
        {HOURS.map(h => (
          <div key={h} className="flex-1 text-center text-[8px] text-slate-300 font-medium">{h}</div>
        ))}
      </div>
      {/* Grid */}
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center gap-1 mb-1">
          <div className="w-4 text-[8px] text-slate-300 font-medium text-right flex-shrink-0">{day}</div>
          {HOURS.map((_, hi) => {
            const cell = data.find(d => d.day === di && d.hour === hi) || { value: 0 };
            return <HeatmapCell key={hi} value={cell.value} max={max} />;
          })}
        </div>
      ))}
    </div>
  );
}

// ── PARTICIPATION DONUT ───────────────────────────────────────────────────────
const PARTICIPATION_COLORS = ['#C21875', '#d97706', '#059669', '#6366f1', '#64748b'];
const PARTICIPATION_SEGMENTS = [
  { name: 'Helados', value: 42 },
  { name: 'Bebidas', value: 23 },
  { name: 'Combos', value: 18 },
  { name: 'Postres', value: 11 },
  { name: 'Otros', value: 6 },
];

function DonutChart({ data }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0" style={{ width: 110, height: 110 }}>
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
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length] }} />
            <span className="text-[10.5px] text-slate-500 flex-1 font-medium">{item.name}</span>
            <span className="text-[10.5px] font-bold text-slate-700 tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ExecutiveAnalyticsPanel({ todaySales = [], budget = [], cashiers = [] }) {
  // Build 30-day sales trend from todaySales
  const sorted30 = useMemo(() => {
    return [...todaySales]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30)
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        ventas: d.total_sales || 0,
        txn: d.total_transactions || 0,
      }));
  }, [todaySales]);

  // EBITDA / margin trend (simulated from sales data with ~35% margin assumption)
  const ebitdaData = useMemo(() => {
    return sorted30.map(d => ({
      date: d.date,
      ebitda: Math.round(d.ventas * 0.34),
      margen: d.ventas > 0 ? 34 : 0,
    }));
  }, [sorted30]);

  // Hourly heatmap data — mock realistic pattern
  const heatmapData = useMemo(() => {
    const pattern = [2,3,5,8,14,18,16,14,12,10,8,6,5,3];
    const result = [];
    DAYS.forEach((_, di) => {
      HOURS.forEach((_, hi) => {
        const base = pattern[hi] || 0;
        const weekendBoost = (di >= 5) ? 1.4 : 1;
        const lunchBoost = (hi >= 4 && hi <= 6) ? 1.3 : 1;
        result.push({
          day: di, hour: hi,
          value: Math.round(base * weekendBoost * lunchBoost * (0.7 + Math.random() * 0.6))
        });
      });
    });
    return result;
  }, []);

  // Budget compliance
  const activeBudget = budget.find(b => b.is_active) || budget[0];
  const totalSales = todaySales.reduce((s, d) => s + (d.total_sales || 0), 0);
  const compliance = activeBudget?.sales_budget
    ? Math.min(100, Math.round((totalSales / activeBudget.sales_budget) * 100))
    : null;

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
      className="mb-7"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em]">Analytics</p>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.06), transparent)' }} />
      </div>

      {/* ── ROW 1: Sales Trend + EBITDA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Sales area chart */}
        <AnalyticsCard
          title="Tendencia de Ventas"
          subtitle={hasSalesData ? `Últimos ${sorted30.length} registros` : 'Sin datos aún'}
          delay={0.18}
          colSpan="lg:col-span-3"
        >
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-[22px] font-black text-slate-800 tabular-nums tracking-tight leading-none">
                {fmt(today?.total_sales)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Delta val={salesDelta} />
                <span className="text-[10px] text-slate-300">vs ayer</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <p className="text-[16px] font-bold text-slate-600 tabular-nums leading-none">
                {today?.total_transactions || '—'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Delta val={txnDelta} />
                <span className="text-[10px] text-slate-300">transacciones</span>
              </div>
            </div>
            {compliance !== null && (
              <>
                <div className="h-8 w-px bg-slate-100" />
                <div>
                  <p className="text-[16px] font-bold leading-none" style={{ color: compliance >= 80 ? '#059669' : compliance >= 60 ? '#d97706' : '#e11d48' }}>
                    {compliance}%
                  </p>
                  <p className="text-[10px] text-slate-300 mt-1">cumpl. PPT</p>
                </div>
              </>
            )}
          </div>

          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={sorted30} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C21875" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#C21875" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<PremiumTooltip formatter={fmt} />} />
                <Area type="monotone" dataKey="ventas" stroke="#C21875" strokeWidth={1.5}
                  fill="url(#salesGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: '#C21875' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <p className="text-[11px] text-slate-300 font-medium">Registra ventas para ver la tendencia</p>
            </div>
          )}
        </AnalyticsCard>

        {/* EBITDA / Margin */}
        <AnalyticsCard
          title="EBITDA Est."
          subtitle="Margen operativo ~34%"
          delay={0.22}
          colSpan="lg:col-span-2"
        >
          <div className="mb-4">
            <p className="text-[22px] font-black text-slate-800 tabular-nums tracking-tight leading-none">
              {fmt(today?.total_sales ? Math.round(today.total_sales * 0.34) : null)}
            </p>
            <p className="text-[10px] text-slate-300 mt-1">estimado hoy · {today?.total_sales ? '34% de ventas' : 'sin datos'}</p>
          </div>

          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={ebitdaData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<PremiumTooltip formatter={fmt} />} />
                <Area type="monotone" dataKey="ebitda" stroke="#6366f1" strokeWidth={1.5}
                  fill="url(#ebitdaGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <p className="text-[11px] text-slate-300 font-medium">Sin datos</p>
            </div>
          )}
        </AnalyticsCard>
      </div>

      {/* ── ROW 2: TXN Heatmap + Participación + Cajeros ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hourly heatmap */}
        <AnalyticsCard title="Tráfico por Hora" subtitle="Transacciones · patrón semanal" delay={0.26}>
          <HourlyHeatmap data={heatmapData} />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[9px] text-slate-300 font-medium">Bajo</span>
            <div className="flex gap-1 flex-1 mx-3">
              {[0.06, 0.2, 0.4, 0.6, 0.8, 0.94].map((a, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-sm"
                  style={{ background: `rgba(194,24,117,${a})` }} />
              ))}
            </div>
            <span className="text-[9px] text-slate-300 font-medium">Alto</span>
          </div>
        </AnalyticsCard>

        {/* Participación */}
        <AnalyticsCard title="Participación" subtitle="Mix del negocio por categoría" delay={0.3}>
          <DonutChart data={PARTICIPATION_SEGMENTS} />
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Mayor categoría</span>
              <span className="text-[10px] font-bold text-slate-700">Helados · 42%</span>
            </div>
          </div>
        </AnalyticsCard>

        {/* Top Cajeros */}
        <AnalyticsCard title="Equipo Activo" subtitle={`${cashiers.length} colaboradores`} delay={0.34}>
          {cashiers.length > 0 ? (
            <div className="space-y-2.5">
              {cashiers.slice(0, 5).map((c, i) => {
                const barW = 85 - i * 14;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                      style={{
                        background: i === 0 ? 'rgba(194,24,117,0.1)' : 'rgba(0,0,0,0.04)',
                        color: i === 0 ? '#C21875' : '#94a3b8',
                      }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-600 truncate">{c.name}</p>
                      <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${barW}%`,
                            background: i === 0
                              ? 'linear-gradient(90deg, #C21875, #e11d48)'
                              : 'rgba(100,116,139,0.3)',
                          }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-300 font-medium flex-shrink-0 capitalize">{c.position || 'cajero'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              <p className="text-[11px] text-slate-300 font-medium">Sin cajeros registrados</p>
            </div>
          )}

          {/* Budget compliance bar */}
          {compliance !== null && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Cumplimiento PPT</span>
                <span className="text-[10px] font-bold tabular-nums"
                  style={{ color: compliance >= 80 ? '#059669' : compliance >= 60 ? '#d97706' : '#e11d48' }}>
                  {compliance}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compliance}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: compliance >= 80
                      ? 'linear-gradient(90deg, #059669, #10b981)'
                      : compliance >= 60
                      ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                      : 'linear-gradient(90deg, #e11d48, #f43f5e)',
                  }}
                />
              </div>
            </div>
          )}
        </AnalyticsCard>
      </div>
    </motion.div>
  );
}