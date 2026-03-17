import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BASE_STORES } from '@/components/StoreManager';
import {
  format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval,
  isWithinInterval, subMonths, addMonths, isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Zap, Activity, RefreshCw, ChevronLeft, ChevronRight, X, Calendar,
  GitCompare, Users, BarChart2
} from 'lucide-react';
import {
  ComposedChart, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

// ── helpers ──────────────────────────────────────────────
const fmt = (v) => {
  if (!v || isNaN(v)) return '$0';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('es-CO')}`;
};
const pct = (v) => `${isNaN(v) ? 0 : Math.round(v)}%`;
const statusColor = (v) => v >= 95 ? '#22c55e' : v >= 80 ? '#facc15' : v > 0 ? '#ef4444' : '#475569';
const statusLabel = (v) => v >= 95 ? 'En Meta' : v >= 80 ? 'En Riesgo' : v > 0 ? 'Crítico' : 'Sin Datos';

// ── Animated glow bar ─────────────────────────────────────
function GlowBar({ value, color, height = 'h-1.5' }) {
  return (
    <div className={`w-full ${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full relative overflow-hidden"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        {/* shimmer */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', backgroundSize: '200% 100%' }}
          animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}

function StatusPill({ value }) {
  const color = statusColor(value);
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: color + '25', color }}>
      {statusLabel(value)}
    </span>
  );
}

// ── KPI Card clickable ────────────────────────────────────
function KPICard({ label, value, sub, trend, color = '#22c55e', icon: Icon, detail, onClick }) {
  const isPos = !trend || trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${color}30` }}
      onClick={onClick}
      className={`rounded-2xl p-4 border border-white/10 flex flex-col gap-1 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: 'rgba(30,41,59,0.85)' }}
    >
      {/* glow bg */}
      <div className="absolute inset-0 opacity-5 rounded-2xl" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="flex items-center justify-between relative">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-black text-white tabular-nums relative">{value}</p>
      {sub && <p className="text-xs text-slate-400 relative">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold relative ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPos ? '+' : ''}{Number(trend).toFixed(1)}%
        </div>
      )}
      {onClick && <p className="text-[9px] text-slate-600 mt-1 relative">Toca para ver detalle →</p>}
    </motion.div>
  );
}

// ── Modal KPI detail ──────────────────────────────────────
function KPIDetailModal({ title, data, onClose, color = '#22c55e' }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border overflow-hidden"
        style={{ background: '#0f172a', borderColor: color + '40' }}
      >
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between" style={{ background: color + '12' }}>
          <p className="text-sm font-black text-white">{title}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {data.map((row, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-xs font-bold text-white">{row.name}</p>
                {row.sub && <p className="text-[10px] text-slate-500">{row.sub}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black tabular-nums" style={{ color: row.color || color }}>{row.value}</p>
                {row.extra && <p className="text-[10px] text-slate-500">{row.extra}</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Modal detalle tienda ──────────────────────────────────
function StoreDetailModal({ store, allDailySales, allBudgets, selectedMonth, onClose }) {
  if (!store) return null;
  const now = new Date();
  const daysInMonth = eachDayOfInterval({ start: selectedMonth.start, end: selectedMonth.end });
  const isCurrentMonth = format(selectedMonth.start, 'yyyy-MM') === format(now, 'yyyy-MM');
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth.length;
  const daysRemaining = daysInMonth.length - daysElapsed;
  const currentMonthNum = selectedMonth.start.getMonth() + 1;
  const currentYear = selectedMonth.start.getFullYear();

  const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true)
    || allBudgets.find(b => b.store_id === store.code && b.month === currentMonthNum && b.year === currentYear);
  const monthlyBudget = activeBudget?.sales_budget || 0;

  const storeSales = allDailySales.filter(s => {
    if (s.store_id !== store.code) return false;
    try {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: selectedMonth.start, end: selectedMonth.end });
    } catch { return false; }
  });

  const totalSales = storeSales.reduce((s, x) => s + (x.total_sales || 0), 0);
  const totalTransactions = storeSales.reduce((s, x) => s + (x.total_transactions || 0), 0);
  const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const compliance = monthlyBudget > 0 ? (totalSales / monthlyBudget) * 100 : 0;
  const avgDaily = daysElapsed > 0 ? totalSales / daysElapsed : 0;
  const projection = isCurrentMonth ? totalSales + avgDaily * daysRemaining : totalSales;
  const projCompliance = monthlyBudget > 0 ? (projection / monthlyBudget) * 100 : 0;
  const color = statusColor(compliance);

  const chartData = daysInMonth.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const sale = storeSales.find(s => s.date === dayStr);
    const dailyBudget = monthlyBudget / daysInMonth.length;
    const v = Math.round((sale?.total_sales || 0) / 1000);
    const m = Math.round(dailyBudget / 1000);
    return { dia: format(day, 'd'), ventas: v, meta: m };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/12 overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: '#0f172a' }}
      >
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between sticky top-0 z-10" style={{ background: color + '18', borderBottomColor: color + '30' }}>
          <div>
            <p className="text-base font-black text-white">{store.name}</p>
            <p className="text-[10px] text-slate-400">{store.code} · {format(selectedMonth.start, "MMMM yyyy", { locale: es })}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill value={compliance} />
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Ventas Mes', value: fmt(totalSales), color: '#22c55e' },
              { label: 'Presupuesto', value: fmt(monthlyBudget), color: '#818cf8' },
              { label: 'Cumplimiento', value: pct(compliance), color },
              { label: 'Ticket Prom.', value: fmt(avgTicket), color: '#a78bfa' },
              { label: 'Proyección Cierre', value: fmt(projection), color: statusColor(projCompliance) },
              { label: '% Proy. Cierre', value: pct(projCompliance), color: statusColor(projCompliance) },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3 border border-white/8 relative overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${k.color}, transparent)` }} />
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 relative">{k.label}</p>
                <p className="text-sm font-black tabular-nums relative" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Info proyección */}
          {isCurrentMonth && (
            <div className="rounded-xl p-3 border text-xs" style={{ background: statusColor(projCompliance) + '10', borderColor: statusColor(projCompliance) + '30' }}>
              <p className="text-slate-300">
                A este ritmo ({fmt(avgDaily)}/día), la tienda proyecta cerrar el mes en{' '}
                <span className="font-black" style={{ color: statusColor(projCompliance) }}>{fmt(projection)}</span>
                {' '}({pct(projCompliance)} del presupuesto).
                {daysRemaining > 0 && ` Quedan ${daysRemaining} días.`}
              </p>
            </div>
          )}

          {/* Barra */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Avance acumulado</span>
              <span style={{ color }} className="font-bold">{pct(compliance)}</span>
            </div>
            <GlowBar value={compliance} color={color} height="h-2" />
          </div>

          {/* Gráfica diaria */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Ventas diarias vs meta (miles $)</p>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}k`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl">
                      <p className="text-slate-400 mb-1">Día {label}</p>
                      {payload.map((p, i) => p.value > 0 && (
                        <p key={i} style={{ color: p.stroke || p.fill || '#fff' }} className="font-bold">{p.name}: ${p.value}k</p>
                      ))}
                    </div>
                  );
                }} />
                <Bar dataKey="ventas" name="Ventas" radius={[3, 3, 0, 0]} maxBarSize={20} fill="url(#barGradStore)">
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.ventas >= entry.meta ? '#22c55e' : entry.ventas > 0 ? '#f59e0b' : '#1e293b'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="meta" stroke="#818cf8" strokeWidth={2} dot={false} name="Meta" strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Modal comparativo de días ─────────────────────────────
function ComparableModal({ allDailySales, onClose }) {
  const [dayA, setDayA] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayB, setDayB] = useState(format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'));

  const getSalesForDay = (dateStr) => {
    const sales = allDailySales.filter(s => s.date === dateStr);
    return {
      total: sales.reduce((s, x) => s + (x.total_sales || 0), 0),
      transactions: sales.reduce((s, x) => s + (x.total_transactions || 0), 0),
      byStore: BASE_STORES.map(store => {
        const s = sales.find(x => x.store_id === store.code);
        return { name: store.displayName || store.name, code: store.code, sales: s?.total_sales || 0, txn: s?.total_transactions || 0 };
      }).filter(s => s.sales > 0)
    };
  };

  const dataA = useMemo(() => getSalesForDay(dayA), [dayA, allDailySales]);
  const dataB = useMemo(() => getSalesForDay(dayB), [dayB, allDailySales]);

  const chartData = useMemo(() => {
    const allCodes = new Set([...dataA.byStore.map(s => s.code), ...dataB.byStore.map(s => s.code)]);
    return Array.from(allCodes).map(code => {
      const a = dataA.byStore.find(s => s.code === code);
      const b = dataB.byStore.find(s => s.code === code);
      const name = a?.name || b?.name || code;
      return { name: name.substring(0, 10), diaA: Math.round((a?.sales || 0) / 1000), diaB: Math.round((b?.sales || 0) / 1000) };
    }).filter(d => d.diaA > 0 || d.diaB > 0);
  }, [dataA, dataB]);

  const diff = dataA.total - dataB.total;
  const diffPct = dataB.total > 0 ? (diff / dataB.total) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-white/12 overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: '#0f172a' }}
      >
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between sticky top-0 z-10" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-black text-white">Comparativo de Días</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Selectores */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Día A', value: dayA, onChange: setDayA, color: '#22c55e' },
              { label: 'Día B', value: dayB, onChange: setDayB, color: '#f59e0b' },
            ].map((d, i) => (
              <div key={i}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: d.color }}>{d.label}</p>
                <input type="date" value={d.value} onChange={e => d.onChange(e.target.value)}
                  className="w-full h-9 rounded-xl px-3 text-sm text-white border border-white/12 outline-none focus:border-white/30"
                  style={{ background: 'rgba(30,41,59,0.9)' }}
                />
              </div>
            ))}
          </div>

          {/* Totales comparativos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 border border-emerald-500/20 text-center" style={{ background: 'rgba(34,197,94,0.07)' }}>
              <p className="text-[9px] text-slate-500 mb-1">Día A</p>
              <p className="text-base font-black text-emerald-400 tabular-nums">{fmt(dataA.total)}</p>
              <p className="text-[9px] text-slate-500">{dataA.transactions} txn</p>
            </div>
            <div className="rounded-xl p-3 border border-white/10 text-center" style={{ background: diff >= 0 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)' }}>
              <p className="text-[9px] text-slate-500 mb-1">Diferencia</p>
              <p className={`text-base font-black tabular-nums ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{diff >= 0 ? '+' : ''}{fmt(diff)}</p>
              <p className={`text-[9px] font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl p-3 border border-amber-500/20 text-center" style={{ background: 'rgba(245,158,11,0.07)' }}>
              <p className="text-[9px] text-slate-500 mb-1">Día B</p>
              <p className="text-base font-black text-amber-400 tabular-nums">{fmt(dataB.total)}</p>
              <p className="text-[9px] text-slate-500">{dataB.transactions} txn</p>
            </div>
          </div>

          {/* Gráfica comparativa */}
          {chartData.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Por tienda (miles $)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                  <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}k`} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="text-slate-300 font-bold mb-1">{label}</p>
                        {payload.map((p, i) => <p key={i} style={{ color: p.fill }} className="font-bold">{p.name}: ${p.value}k</p>)}
                      </div>
                    );
                  }} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                  <Bar dataKey="diaA" name="Día A" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={18} opacity={0.85} />
                  <Bar dataKey="diaB" name="Día B" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {chartData.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Sin datos para los días seleccionados</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────
export default function GenesisCommandCenter() {
  const now = new Date();
  const [selectedMonthDate, setSelectedMonthDate] = useState(startOfMonth(now));
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // modo día específico
  const [showComparable, setShowComparable] = useState(false);
  const [kpiModal, setKpiModal] = useState(null);

  const selectedMonth = useMemo(() => ({
    start: startOfMonth(selectedMonthDate),
    end: endOfMonth(selectedMonthDate),
  }), [selectedMonthDate]);

  const isCurrentMonth = format(selectedMonthDate, 'yyyy-MM') === format(now, 'yyyy-MM');
  const daysInMonth = eachDayOfInterval({ start: selectedMonth.start, end: selectedMonth.end });
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth.length;
  const daysRemaining = daysInMonth.length - daysElapsed;
  const currentMonthNum = selectedMonthDate.getMonth() + 1;
  const currentYear = selectedMonthDate.getFullYear();

  const { data: allDailySales = [], refetch } = useQuery({
    queryKey: ['genesis_sales'],
    queryFn: () => base44.entities.DailySales.list(),
    staleTime: 2 * 60 * 1000
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['genesis_budgets'],
    queryFn: () => base44.entities.Budget.list(),
    staleTime: 10 * 60 * 1000
  });

  const { data: allShiftRecords = [] } = useQuery({
    queryKey: ['genesis_shifts'],
    queryFn: () => base44.entities.ShiftRecord.list(),
    staleTime: 5 * 60 * 1000
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['genesis_cashiers'],
    queryFn: () => base44.entities.Cashier.list(),
    staleTime: 10 * 60 * 1000
  });

  // Datos por tienda
  const storesData = useMemo(() => {
    return BASE_STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        if (s.store_id !== store.code) return false;
        try {
          const d = parseISO(s.date);
          return isWithinInterval(d, { start: selectedMonth.start, end: selectedMonth.end });
        } catch { return false; }
      });

      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true)
        || allBudgets.find(b => b.store_id === store.code && b.month === currentMonthNum && b.year === currentYear);
      const monthlyBudget = activeBudget?.sales_budget || 0;

      const totalSales = storeSales.reduce((s, x) => s + (x.total_sales || 0), 0);
      const totalTransactions = storeSales.reduce((s, x) => s + (x.total_transactions || 0), 0);
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const compliance = monthlyBudget > 0 ? (totalSales / monthlyBudget) * 100 : 0;

      const avgDaily = daysElapsed > 0 ? totalSales / daysElapsed : 0;
      const projection = isCurrentMonth ? totalSales + avgDaily * daysRemaining : totalSales;
      const projCompliance = monthlyBudget > 0 ? (projection / monthlyBudget) * 100 : 0;
      const gap = projection - monthlyBudget;
      const hasData = totalSales > 0;

      return {
        code: store.code,
        name: store.displayName || store.name,
        totalSales, totalTransactions, avgTicket, projection,
        monthlyBudget, compliance, projCompliance, gap, hasData,
        salesDays: storeSales.length
      };
    });
  }, [allDailySales, allBudgets, selectedMonth, daysElapsed, daysRemaining, isCurrentMonth]);

  // Totales globales — suma de todas las tiendas
  const globalTotals = useMemo(() => {
    const withData = storesData.filter(s => s.hasData);
    const totalSales = storesData.reduce((s, x) => s + x.totalSales, 0);
    const totalBudget = storesData.reduce((s, x) => s + x.monthlyBudget, 0);
    const totalTransactions = storesData.reduce((s, x) => s + x.totalTransactions, 0);
    // Proyección = suma de proyecciones individuales
    const totalProjection = storesData.reduce((s, x) => s + x.projection, 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const projCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : 0;
    const gap = totalProjection - totalBudget;
    return { totalSales, totalBudget, totalTransactions, totalProjection, avgTicket, compliance, projCompliance, gap, withDataCount: withData.length };
  }, [storesData]);

  // Gráfica mensual
  const chartData = useMemo(() => {
    const today = isCurrentMonth ? now : selectedMonth.end;
    const days = daysInMonth.filter(d => d <= today);
    const dailyBudget = globalTotals.totalBudget / daysInMonth.length;

    // Acumulado para línea
    let cumSales = 0;
    let cumMeta = 0;
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = allDailySales.filter(s => s.date === dayStr).reduce((sum, s) => sum + (s.total_sales || 0), 0);
      cumSales += daySales;
      cumMeta += dailyBudget;
      return {
        dia: format(day, 'd'),
        fullDate: format(day, 'dd MMM', { locale: es }),
        ventas: Math.round(daySales / 1_000_000),
        meta: Math.round(dailyBudget / 1_000_000),
        cumVentas: Math.round(cumSales / 1_000_000),
        cumMeta: Math.round(cumMeta / 1_000_000),
      };
    });
  }, [allDailySales, daysInMonth, globalTotals.totalBudget, isCurrentMonth]);

  // Top cajeros del período
  const topCashiers = useMemo(() => {
    const shiftsInRange = allShiftRecords.filter(s => {
      try {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start: selectedMonth.start, end: selectedMonth.end });
      } catch { return false; }
    });

    const byId = {};
    shiftsInRange.forEach(s => {
      if (!byId[s.cashier_id]) {
        const cashier = allCashiers.find(c => c.id === s.cashier_id);
        byId[s.cashier_id] = { name: cashier?.name || s.cashier_id, sales: 0, transactions: 0, shifts: 0 };
      }
      byId[s.cashier_id].sales += s.sales || 0;
      byId[s.cashier_id].transactions += s.transactions || 0;
      byId[s.cashier_id].shifts += 1;
    });

    return Object.values(byId)
      .filter(c => c.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map(c => ({ ...c, avgTicket: c.transactions > 0 ? c.sales / c.transactions : 0 }));
  }, [allShiftRecords, allCashiers, selectedMonth]);

  // Alertas
  const alerts = useMemo(() => {
    const list = [];
    const critical = storesData.filter(s => s.hasData && s.compliance < 80);
    const overMeta = storesData.filter(s => s.hasData && s.compliance >= 100);
    const noData = storesData.filter(s => !s.hasData);
    if (critical.length > 0) list.push({ type: 'danger', msg: `🔴 ${critical.length} tiendas < 80%: ${critical.slice(0, 3).map(s => s.name).join(', ')}` });
    if (overMeta.length > 0) list.push({ type: 'success', msg: `🟢 ${overMeta.length} tiendas superando la meta del mes` });
    if (noData.length > 0) list.push({ type: 'warning', msg: `⚫ ${noData.length} tiendas sin datos: ${noData.slice(0, 3).map(s => s.name).join(', ')}` });
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 25000) list.push({ type: 'warning', msg: `⚠️ Ticket promedio bajo: ${fmt(globalTotals.avgTicket)}` });
    if (globalTotals.compliance < 95 && globalTotals.compliance > 0) list.push({ type: 'danger', msg: `📉 Zona al ${pct(globalTotals.compliance)} del presupuesto` });
    return list;
  }, [storesData, globalTotals]);

  const insights = useMemo(() => {
    const msgs = [];
    const critical = storesData.filter(s => s.hasData && s.compliance < 80);
    if (globalTotals.compliance < 95 && globalTotals.compliance > 0) msgs.push(`Zona al ${pct(globalTotals.compliance)} del presupuesto`);
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 28000) msgs.push(`Ticket promedio ${fmt(globalTotals.avgTicket)} por debajo del objetivo ($28.000)`);
    if (critical.length > 0) msgs.push(`${critical.length} tienda${critical.length > 1 ? 's' : ''} en estado crítico`);
    if (isCurrentMonth && globalTotals.projCompliance > 0) msgs.push(`Proyección de cierre: ${pct(globalTotals.projCompliance)} — ${fmt(globalTotals.totalProjection)}`);
    if (msgs.length === 0) msgs.push('El negocio opera dentro de los parámetros esperados');
    return msgs;
  }, [storesData, globalTotals, isCurrentMonth]);

  const sortedStores = useMemo(() => {
    const withData = storesData.filter(s => s.hasData).sort((a, b) => a.compliance - b.compliance);
    const noData = storesData.filter(s => !s.hasData).sort((a, b) => a.name.localeCompare(b.name));
    return [...withData, ...noData];
  }, [storesData]);

  const handleRefresh = () => { refetch(); setLastRefresh(new Date()); };
  const prevMonth = () => setSelectedMonthDate(subMonths(selectedMonthDate, 1));
  const nextMonth = () => {
    const next = addMonths(selectedMonthDate, 1);
    if (next <= startOfMonth(now)) setSelectedMonthDate(next);
  };
  const canGoNext = addMonths(selectedMonthDate, 1) <= startOfMonth(now);

  // KPI modal data builders
  const openKpiModal = (type) => {
    if (type === 'ventas') {
      setKpiModal({
        title: 'Ventas por Tienda — ' + format(selectedMonthDate, 'MMMM yyyy', { locale: es }),
        color: '#22c55e',
        data: storesData.filter(s => s.hasData).sort((a, b) => b.totalSales - a.totalSales).map((s, i) => ({
          name: `${i + 1}. ${s.name}`, value: fmt(s.totalSales),
          extra: `${pct(s.compliance)} del presupuesto`, color: statusColor(s.compliance)
        }))
      });
    } else if (type === 'compliance') {
      setKpiModal({
        title: 'Cumplimiento por Tienda',
        color: statusColor(globalTotals.compliance),
        data: storesData.filter(s => s.hasData).sort((a, b) => b.compliance - a.compliance).map(s => ({
          name: s.name, value: pct(s.compliance), sub: fmt(s.totalSales), color: statusColor(s.compliance)
        }))
      });
    } else if (type === 'ticket') {
      setKpiModal({
        title: 'Ticket Promedio por Tienda',
        color: '#a78bfa',
        data: storesData.filter(s => s.hasData).sort((a, b) => b.avgTicket - a.avgTicket).map(s => ({
          name: s.name, value: fmt(s.avgTicket), sub: `${s.totalTransactions} transacciones`, color: '#a78bfa'
        }))
      });
    } else if (type === 'txn') {
      setKpiModal({
        title: 'Transacciones por Tienda',
        color: '#38bdf8',
        data: storesData.filter(s => s.hasData).sort((a, b) => b.totalTransactions - a.totalTransactions).map(s => ({
          name: s.name, value: s.totalTransactions.toLocaleString('es-CO'), sub: fmt(s.avgTicket) + ' ticket prom.', color: '#38bdf8'
        }))
      });
    } else if (type === 'proyeccion') {
      setKpiModal({
        title: 'Proyección de Cierre por Tienda',
        color: statusColor(globalTotals.projCompliance),
        data: storesData.filter(s => s.hasData).sort((a, b) => b.projCompliance - a.projCompliance).map(s => ({
          name: s.name, value: pct(s.projCompliance), sub: fmt(s.projection), color: statusColor(s.projCompliance)
        }))
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#f1f5f9' }}>

      {/* ── HEADER ─── */}
      <div className="sticky top-0 z-30 border-b border-white/8" style={{ background: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <button className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white tracking-tight">GENESIS</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hidden sm:inline">GLOBAL COMMAND CENTER</span>
              </div>
              <p className="text-[10px] text-slate-500">{format(now, "EEEE d 'de' MMMM · HH:mm", { locale: es })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector día específico */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <input type="date" value={selectedDay || ''} onChange={e => setSelectedDay(e.target.value || null)}
                className="bg-transparent text-xs text-white outline-none w-28"
                max={format(now, 'yyyy-MM-dd')}
              />
              {selectedDay && <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>}
            </div>

            {/* Selector mes */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
              <button onClick={prevMonth} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <p className="text-xs font-black text-white w-24 text-center capitalize">
                {format(selectedMonthDate, "MMM yyyy", { locale: es })}
              </p>
              <button onClick={nextMonth} disabled={!canGoNext} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
              {!isCurrentMonth && <button onClick={() => setSelectedMonthDate(startOfMonth(now))} className="text-[9px] font-bold text-cyan-400 ml-1">HOY</button>}
            </div>

            {/* Comparable */}
            <button onClick={() => setShowComparable(true)}
              className="h-8 px-3 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 flex items-center gap-1.5 text-indigo-300 text-xs transition-colors">
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comparar</span>
            </button>

            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <button onClick={handleRefresh} className="h-8 px-3 rounded-lg bg-white/8 hover:bg-white/15 flex items-center gap-1.5 text-slate-300 text-xs transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Banner día específico */}
        {selectedDay && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-4 py-3 border border-purple-500/30 flex items-center justify-between"
            style={{ background: 'rgba(99,102,241,0.1)' }}
          >
            <div>
              <p className="text-xs font-black text-purple-300">📅 Día seleccionado: {format(parseISO(selectedDay), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Zona: {fmt(allDailySales.filter(s => s.date === selectedDay).reduce((sum, s) => sum + (s.total_sales || 0), 0))} ·{' '}
                {allDailySales.filter(s => s.date === selectedDay).length} tiendas con datos
              </p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-white text-xs">Quitar filtro ×</button>
          </motion.div>
        )}

        {/* ── KPIs GLOBALES ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Ventas del Período" value={fmt(globalTotals.totalSales)} sub={`Meta: ${fmt(globalTotals.totalBudget)}`} icon={TrendingUp} color="#22c55e" onClick={() => openKpiModal('ventas')} />
          <KPICard label="Cumplimiento" value={pct(globalTotals.compliance)} sub="vs presupuesto" icon={Activity} color={statusColor(globalTotals.compliance)} onClick={() => openKpiModal('compliance')} />
          <KPICard label="Ticket Promedio" value={fmt(globalTotals.avgTicket)} sub="zona" icon={Zap} color="#a78bfa" onClick={() => openKpiModal('ticket')} />
          <KPICard label="Transacciones" value={globalTotals.totalTransactions.toLocaleString('es-CO')} sub={`${globalTotals.withDataCount} tiendas activas`} icon={CheckCircle2} color="#38bdf8" onClick={() => openKpiModal('txn')} />
          <KPICard
            label={isCurrentMonth ? "Proyección Cierre" : "Total Facturado"}
            value={fmt(globalTotals.totalProjection)}
            sub={isCurrentMonth ? `${pct(globalTotals.projCompliance)} proyectado` : 'período cerrado'}
            icon={TrendingUp}
            color={statusColor(globalTotals.projCompliance)}
            onClick={() => openKpiModal('proyeccion')}
          />
        </div>

        {/* ── PROYECCIÓN + GRÁFICA ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bloque proyección zona */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-5 border relative overflow-hidden"
            style={{ background: 'rgba(30,41,59,0.85)', borderColor: statusColor(globalTotals.projCompliance) + '40' }}
          >
            <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${statusColor(globalTotals.projCompliance)}, transparent 60%)` }} />
            <div className="flex justify-between items-start mb-2 relative">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isCurrentMonth ? 'Proyección Cierre Zona' : 'Resumen del Mes'}</p>
              <StatusPill value={globalTotals.compliance} />
            </div>
            <p className="text-3xl font-black text-white tabular-nums mb-1 relative">{fmt(globalTotals.totalProjection)}</p>
            <p className="text-xs text-slate-400 mb-1 relative">Presupuesto zona: {fmt(globalTotals.totalBudget)}</p>
            {isCurrentMonth && (
              <p className="text-[10px] text-slate-500 mb-3 relative">Quedan {daysRemaining} días · ritmo {fmt(globalTotals.totalSales / Math.max(daysElapsed, 1))}/día</p>
            )}
            <GlowBar value={globalTotals.projCompliance} color={statusColor(globalTotals.projCompliance)} height="h-2" />
            <div className="flex justify-between text-xs mt-2 mb-4 relative">
              <span style={{ color: statusColor(globalTotals.projCompliance) }} className="font-black">{pct(globalTotals.projCompliance)}</span>
              <span className={`font-bold ${globalTotals.gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Gap: {globalTotals.gap >= 0 ? '+' : ''}{fmt(globalTotals.gap)}
              </span>
            </div>
            {/* Semáforos */}
            <div className="grid grid-cols-3 gap-2 relative">
              {[
                { label: '≥95%', count: storesData.filter(s => s.hasData && s.compliance >= 95).length, color: '#22c55e' },
                { label: '80-95%', count: storesData.filter(s => s.hasData && s.compliance >= 80 && s.compliance < 95).length, color: '#facc15' },
                { label: '<80%', count: storesData.filter(s => s.hasData && s.compliance < 80).length, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} className="text-center rounded-xl p-2 border border-white/8" style={{ background: s.color + '12' }}>
                  <p className="text-lg font-black" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[9px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gráfica principal con barras + líneas acumuladas */}
          <div className="lg:col-span-2 rounded-2xl p-4 border border-white/8 relative overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
            {/* fondo glow sutil */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(34,197,94,0.06) 0%, transparent 60%)' }} />
            <div className="flex items-center justify-between mb-3 relative">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Ventas diarias — {format(selectedMonthDate, "MMMM yyyy", { locale: es })}
              </p>
              <span className="text-[9px] text-slate-600">Barras=día · Líneas=acumulado</span>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval={1} />
                <YAxis yAxisId="bar" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                <YAxis yAxisId="line" orientation="right" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl min-w-[160px]">
                      <p className="text-slate-400 mb-2 font-bold">Día {label}</p>
                      {payload.map((p, i) => p.value > 0 && (
                        <div key={i} className="flex justify-between gap-4">
                          <span style={{ color: p.stroke || p.fill || '#fff' }}>{p.name}</span>
                          <span className="font-black text-white">${p.value}M</span>
                        </div>
                      ))}
                    </div>
                  );
                }} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                {/* Barras diarias */}
                <Bar yAxisId="bar" dataKey="ventas" name="Venta día" radius={[4, 4, 0, 0]} maxBarSize={22}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.ventas >= entry.meta ? 'url(#barGradGreen)' : entry.ventas > 0 ? 'url(#barGradAmber)' : '#1e293b'} />
                  ))}
                </Bar>
                {/* Línea meta diaria */}
                <Line yAxisId="bar" type="monotone" dataKey="meta" stroke="#818cf8" strokeWidth={1.5} dot={false} name="Meta día" strokeDasharray="5 3" />
                {/* Línea acumulada real */}
                <Line yAxisId="line" type="monotone" dataKey="cumVentas" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Acumulado real" />
                {/* Línea acumulada meta */}
                <Line yAxisId="line" type="monotone" dataKey="cumMeta" stroke="#6366f1" strokeWidth={2} dot={false} name="Acumulado meta" strokeDasharray="6 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── TOP CAJEROS + TIENDAS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top cajeros */}
          <div className="rounded-2xl border border-white/8 overflow-hidden relative" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(251,191,36,0.06), transparent 60%)' }} />
            <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 relative">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Top Cajeros</p>
                <p className="text-[10px] text-slate-500">{format(selectedMonthDate, "MMMM yyyy", { locale: es })}</p>
              </div>
            </div>
            <div className="p-3 space-y-2 relative">
              {topCashiers.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Sin datos de cajeros en el período</p>
              )}
              {topCashiers.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-white/6"
                  style={{ background: i === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)' }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-400 text-slate-900' : 'bg-amber-700 text-amber-100'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[9px] text-slate-500">{c.shifts} turnos · ticket {fmt(c.avgTicket)}</p>
                  </div>
                  <p className="text-xs font-black text-amber-300 tabular-nums">{fmt(c.sales)}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Todas las tiendas */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Todas las Tiendas</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{storesData.filter(s => s.hasData).length} con datos · Click para ver detalle</p>
              </div>
              <div className="flex gap-1.5 text-[9px]">
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e25', color: '#22c55e' }}>≥95%</span>
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: '#facc1525', color: '#facc15' }}>80-95%</span>
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: '#ef444425', color: '#ef4444' }}>&lt;80%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {sortedStores.map((store, i) => {
                const color = store.hasData ? statusColor(store.compliance) : '#475569';
                const isCritical = store.hasData && store.compliance < 80;
                return (
                  <motion.button key={store.code}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedStore(store)}
                    className="flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                    style={{ background: isCritical ? 'rgba(239,68,68,0.04)' : 'transparent' }}
                  >
                    {/* Semáforo animado */}
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                      animate={store.hasData && isCritical ? { boxShadow: [`0 0 4px ${color}60`, `0 0 10px ${color}`, `0 0 4px ${color}60`] } : { boxShadow: `0 0 6px ${color}50` }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{store.name}</p>
                      <p className="text-[9px] text-slate-600">{store.code}</p>
                    </div>
                    {store.hasData ? (
                      <>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black tabular-nums" style={{ color }}>{pct(store.compliance)}</p>
                          <p className="text-[9px] text-slate-500">{fmt(store.totalSales)}</p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-[9px] text-slate-400 tabular-nums">{fmt(store.avgTicket)}</p>
                          <p className="text-[9px] text-slate-600">ticket</p>
                        </div>
                        <div className="w-8 flex-shrink-0 hidden sm:block">
                          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                              initial={{ width: 0 }} animate={{ width: `${Math.min(store.compliance, 100)}%` }}
                              transition={{ duration: 0.8 }} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-[9px] text-slate-600">Sin datos</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── INSIGHTS + ALERTAS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-xs font-black text-white uppercase tracking-wider">Insights Automáticos</p>
            </div>
            <div className="space-y-2">
              {insights.map((msg, i) => (
                <div key={i} className="text-xs text-slate-300 leading-relaxed p-2.5 rounded-xl border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-black text-white uppercase tracking-wider">Alertas del Período</p>
            </div>
            <div className="space-y-2">
              {alerts.length === 0 && <p className="text-xs text-slate-500">Sin alertas activas</p>}
              {alerts.map((a, i) => {
                const borderColor = a.type === 'danger' ? '#ef444440' : a.type === 'warning' ? '#facc1540' : '#22c55e40';
                const bg = a.type === 'danger' ? 'rgba(239,68,68,0.07)' : a.type === 'warning' ? 'rgba(250,204,21,0.07)' : 'rgba(34,197,94,0.07)';
                return (
                  <div key={i} className="text-xs leading-snug p-2.5 rounded-xl border" style={{ background: bg, borderColor, color: '#e2e8f0' }}>
                    {a.msg}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALES ─── */}
      <AnimatePresence>
        {selectedStore && (
          <StoreDetailModal store={selectedStore} allDailySales={allDailySales} allBudgets={allBudgets}
            selectedMonth={selectedMonth} onClose={() => setSelectedStore(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showComparable && <ComparableModal allDailySales={allDailySales} onClose={() => setShowComparable(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {kpiModal && (
          <KPIDetailModal title={kpiModal.title} data={kpiModal.data} color={kpiModal.color} onClose={() => setKpiModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}