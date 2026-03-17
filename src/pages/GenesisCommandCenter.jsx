import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BASE_STORES } from '@/components/StoreManager';
import { getDisplayName } from '@/components/StoreSelector';
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Zap, Activity, RefreshCw, ChevronLeft, ChevronRight, X, Calendar
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell
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

// ── mini componentes ──────────────────────────────────────
function StatusPill({ value }) {
  const color = statusColor(value);
  const label = statusLabel(value);
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: color + '25', color }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color, height = 'h-1.5' }) {
  return (
    <div className={`w-full ${height} bg-white/8 rounded-full overflow-hidden`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function KPICard({ label, value, sub, trend, color = '#22c55e', icon: Icon }) {
  const isPos = !trend || trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 border border-white/10 flex flex-col gap-1"
      style={{ background: 'rgba(30,41,59,0.8)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPos ? '+' : ''}{Number(trend).toFixed(1)}% vs mes ant.
        </div>
      )}
    </motion.div>
  );
}

// ── Modal detalle tienda ──────────────────────────────────
function StoreDetailModal({ store, allDailySales, allBudgets, selectedMonth, onClose }) {
  if (!store) return null;

  const daysInMonth = eachDayOfInterval({ start: selectedMonth.start, end: selectedMonth.end });
  const currentMonth = selectedMonth.start.getMonth() + 1;
  const currentYear = selectedMonth.start.getFullYear();

  const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true)
    || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
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
  const color = statusColor(compliance);

  // Gráfica diaria
  const chartData = daysInMonth.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const sale = storeSales.find(s => s.date === dayStr);
    const dailyBudget = monthlyBudget / daysInMonth.length;
    return {
      dia: format(day, 'd'),
      ventas: Math.round((sale?.total_sales || 0) / 1000),
      meta: Math.round(dailyBudget / 1000),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/12 overflow-hidden"
        style={{ background: '#0f172a' }}
      >
        {/* Header modal */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between" style={{ background: color + '15', borderBottomColor: color + '30' }}>
          <div>
            <p className="text-base font-black text-white">{store.name}</p>
            <p className="text-[10px] text-slate-400">{store.code} · {format(selectedMonth.start, "MMMM yyyy", { locale: es })}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill value={compliance} />
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* KPIs del modal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ventas Mes', value: fmt(totalSales) },
              { label: 'Presupuesto', value: fmt(monthlyBudget) },
              { label: 'Cumplimiento', value: pct(compliance) },
              { label: 'Ticket Prom.', value: fmt(avgTicket) },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3 border border-white/8" style={{ background: 'rgba(30,41,59,0.8)' }}>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-sm font-black text-white tabular-nums">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Barra cumplimiento */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Avance del mes</span>
              <span style={{ color }} className="font-bold">{pct(compliance)}</span>
            </div>
            <ProgressBar value={compliance} color={color} height="h-2" />
          </div>

          {/* Gráfica diaria */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Ventas diarias (miles $)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="text-slate-400 mb-1">Día {label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.fill || p.stroke }} className="font-bold">{p.name}: ${p.value}k</p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="ventas" name="Ventas" radius={[3, 3, 0, 0]} maxBarSize={18}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.ventas >= entry.meta ? '#22c55e' : entry.ventas > 0 ? '#ef4444' : '#1e293b'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="meta" stroke="#818cf8" strokeWidth={1.5} dot={false} name="Meta" strokeDasharray="4 2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Días sin datos */}
          {storeSales.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-2">Sin registros de ventas en este período</p>
          )}
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

  const selectedMonth = useMemo(() => ({
    start: startOfMonth(selectedMonthDate),
    end: endOfMonth(selectedMonthDate),
  }), [selectedMonthDate]);

  const isCurrentMonth = format(selectedMonthDate, 'yyyy-MM') === format(now, 'yyyy-MM');
  const currentHour = now.getHours();
  const totalHours = 14;
  const openHour = 9;
  const hoursElapsed = Math.max(1, currentHour - openHour);
  const daysInMonth = eachDayOfInterval({ start: selectedMonth.start, end: selectedMonth.end });
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth.length;
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

  // Calcular datos por tienda para el mes seleccionado
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
      const dailyBudget = monthlyBudget / daysInMonth.length;

      const totalSales = storeSales.reduce((s, x) => s + (x.total_sales || 0), 0);
      const totalTransactions = storeSales.reduce((s, x) => s + (x.total_transactions || 0), 0);
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const compliance = monthlyBudget > 0 ? (totalSales / monthlyBudget) * 100 : 0;

      // Proyección: solo en mes actual
      const avgDaily = daysElapsed > 0 ? totalSales / daysElapsed : 0;
      const projection = isCurrentMonth ? totalSales + avgDaily * (daysInMonth.length - daysElapsed) : totalSales;
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
  }, [allDailySales, allBudgets, selectedMonth, daysElapsed, isCurrentMonth]);

  // Totales globales
  const globalTotals = useMemo(() => {
    const all = storesData;
    const withData = all.filter(s => s.hasData);
    const totalSales = all.reduce((s, x) => s + x.totalSales, 0);
    const totalBudget = all.reduce((s, x) => s + x.monthlyBudget, 0);
    const totalTransactions = all.reduce((s, x) => s + x.totalTransactions, 0);
    const totalProjection = all.reduce((s, x) => s + x.projection, 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const projCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : 0;
    const gap = totalProjection - totalBudget;
    return { totalSales, totalBudget, totalTransactions, totalProjection, avgTicket, compliance, projCompliance, gap, withDataCount: withData.length };
  }, [storesData]);

  // Gráfica mensual (ventas por día acumuladas)
  const chartData = useMemo(() => {
    const today = isCurrentMonth ? now : selectedMonth.end;
    return daysInMonth
      .filter(d => d <= today)
      .map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySales = allDailySales
          .filter(s => s.date === dayStr)
          .reduce((sum, s) => sum + (s.total_sales || 0), 0);
        const dailyBudget = globalTotals.totalBudget / daysInMonth.length;
        return {
          dia: format(day, 'd'),
          ventas: Math.round(daySales / 1_000_000),
          meta: Math.round(dailyBudget / 1_000_000),
        };
      });
  }, [allDailySales, daysInMonth, globalTotals.totalBudget, isCurrentMonth]);

  // Alertas
  const alerts = useMemo(() => {
    const list = [];
    const critical = storesData.filter(s => s.hasData && s.compliance < 80);
    const overMeta = storesData.filter(s => s.hasData && s.compliance >= 100);
    const noData = storesData.filter(s => !s.hasData);
    if (critical.length > 0) list.push({ type: 'danger', msg: `🔴 ${critical.length} tiendas con cumplimiento < 80%: ${critical.slice(0, 3).map(s => s.name).join(', ')}` });
    if (overMeta.length > 0) list.push({ type: 'success', msg: `🟢 ${overMeta.length} tiendas superando la meta del mes` });
    if (noData.length > 0) list.push({ type: 'warning', msg: `⚫ ${noData.length} tiendas sin datos registrados: ${noData.slice(0, 3).map(s => s.name).join(', ')}` });
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 25000) list.push({ type: 'warning', msg: `⚠️ Ticket promedio bajo: ${fmt(globalTotals.avgTicket)}` });
    if (globalTotals.compliance < 95 && globalTotals.compliance > 0) list.push({ type: 'danger', msg: `📉 Zona al ${pct(globalTotals.compliance)} del presupuesto mensual` });
    return list;
  }, [storesData, globalTotals]);

  const insights = useMemo(() => {
    const msgs = [];
    const critical = storesData.filter(s => s.hasData && s.compliance < 80);
    if (globalTotals.compliance < 95 && globalTotals.compliance > 0) msgs.push(`La zona está al ${pct(globalTotals.compliance)} del presupuesto para este período`);
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 28000) msgs.push(`Ticket promedio (${fmt(globalTotals.avgTicket)}) por debajo del objetivo de $28.000`);
    if (critical.length > 0) msgs.push(`${critical.length} tienda${critical.length > 1 ? 's' : ''} en estado crítico requieren atención inmediata`);
    if (globalTotals.withDataCount < BASE_STORES.length) msgs.push(`${BASE_STORES.length - globalTotals.withDataCount} tiendas sin ventas registradas en el período`);
    if (msgs.length === 0) msgs.push('El negocio opera dentro de los parámetros esperados para el período');
    return msgs;
  }, [storesData, globalTotals]);

  // Todas las tiendas ordenadas: con datos primero (peor a mejor), luego sin datos
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

  const selectedStoreData = selectedStore ? storesData.find(s => s.code === selectedStore.code) : null;

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#f1f5f9' }}>

      {/* ── HEADER ─────────────────────────────── */}
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

          {/* Selector de mes */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <button onClick={prevMonth} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <p className="text-xs font-black text-white w-28 text-center capitalize">
              {format(selectedMonthDate, "MMMM yyyy", { locale: es })}
            </p>
            <button onClick={nextMonth} disabled={!canGoNext} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            {!isCurrentMonth && (
              <button onClick={() => setSelectedMonthDate(startOfMonth(now))} className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1">HOY</button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 hidden sm:block">{format(lastRefresh, 'HH:mm:ss')}</span>
            <button onClick={handleRefresh} className="h-8 px-3 rounded-lg bg-white/8 hover:bg-white/15 flex items-center gap-1.5 text-slate-300 text-xs transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── KPIs GLOBALES ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Ventas del Período" value={fmt(globalTotals.totalSales)} sub={`Meta: ${fmt(globalTotals.totalBudget)}`} icon={TrendingUp} color="#22c55e" />
          <KPICard label="Cumplimiento" value={pct(globalTotals.compliance)} sub="vs presupuesto" icon={Activity} color={statusColor(globalTotals.compliance)} />
          <KPICard label="Ticket Promedio" value={fmt(globalTotals.avgTicket)} sub="por transacción" icon={Zap} color="#a78bfa" />
          <KPICard label="Transacciones" value={globalTotals.totalTransactions.toLocaleString('es-CO')} sub={`${globalTotals.withDataCount} tiendas activas`} icon={CheckCircle2} color="#38bdf8" />
          <KPICard
            label={isCurrentMonth ? "Proyección Cierre" : "Total Facturado"}
            value={fmt(globalTotals.totalProjection)}
            sub={isCurrentMonth ? `${pct(globalTotals.projCompliance)} proyectado` : 'período cerrado'}
            icon={TrendingUp}
            color={statusColor(globalTotals.projCompliance)}
          />
        </div>

        {/* ── PROYECCIÓN + GRÁFICA ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bloque proyección */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-5 border"
            style={{ background: 'rgba(30,41,59,0.8)', borderColor: statusColor(globalTotals.projCompliance) + '40' }}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{isCurrentMonth ? 'Proyección Cierre' : 'Resumen del Mes'}</p>
              <StatusPill value={globalTotals.compliance} />
            </div>
            <p className="text-3xl font-black text-white tabular-nums mb-1">{fmt(globalTotals.totalProjection)}</p>
            <p className="text-xs text-slate-400 mb-3">Presupuesto: {fmt(globalTotals.totalBudget)}</p>
            <ProgressBar value={globalTotals.projCompliance} color={statusColor(globalTotals.projCompliance)} height="h-2" />
            <div className="flex justify-between text-xs mt-2">
              <span style={{ color: statusColor(globalTotals.projCompliance) }} className="font-black">{pct(globalTotals.projCompliance)}</span>
              <span className={`font-bold ${globalTotals.gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Gap: {globalTotals.gap >= 0 ? '+' : ''}{fmt(globalTotals.gap)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Verde', count: storesData.filter(s => s.hasData && s.compliance >= 95).length, color: '#22c55e' },
                { label: 'Amarillo', count: storesData.filter(s => s.hasData && s.compliance >= 80 && s.compliance < 95).length, color: '#facc15' },
                { label: 'Rojo', count: storesData.filter(s => s.hasData && s.compliance < 80).length, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} className="text-center rounded-xl p-2 border border-white/8" style={{ background: s.color + '12' }}>
                  <p className="text-lg font-black" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[9px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gráfica diaria */}
          <div className="lg:col-span-2 rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
              Ventas diarias — {format(selectedMonthDate, "MMMM yyyy", { locale: es })} (M$)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dia" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="text-slate-400 mb-1">Día {label}</p>
                        {payload.map((p, i) => p.value > 0 && (
                          <p key={i} style={{ color: p.fill || p.stroke || '#fff' }} className="font-bold">{p.name}: ${p.value}M</p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                <Bar dataKey="ventas" name="Ventas" radius={[3, 3, 0, 0]} maxBarSize={20}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.ventas >= entry.meta ? '#22c55e' : entry.ventas > 0 ? '#f59e0b' : '#1e293b'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="meta" stroke="#818cf8" strokeWidth={2} dot={false} name="Meta diaria" strokeDasharray="5 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── TODAS LAS TIENDAS ─── */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Todas las Tiendas</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {storesData.filter(s => s.hasData).length} con datos · {BASE_STORES.length - storesData.filter(s => s.hasData).length} sin datos · Click para ver detalle
              </p>
            </div>
            <div className="flex gap-2 text-[9px]">
              <span className="px-2 py-0.5 rounded-full" style={{ background: '#22c55e25', color: '#22c55e' }}>≥95%</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: '#facc1525', color: '#facc15' }}>80-95%</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: '#ef444425', color: '#ef4444' }}>&lt;80%</span>
            </div>
          </div>

          {/* Grid de todas las tiendas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-y divide-white/5 sm:divide-y-0">
            {sortedStores.map((store, i) => {
              const color = store.hasData ? statusColor(store.compliance) : '#475569';
              const isCritical = store.hasData && store.compliance < 80;
              return (
                <motion.button
                  key={store.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setSelectedStore(store)}
                  className="flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                  style={{ background: isCritical ? 'rgba(239,68,68,0.04)' : 'transparent' }}
                >
                  {/* Semáforo */}
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: store.hasData ? `0 0 6px ${color}80` : 'none' }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{store.name}</p>
                    <p className="text-[9px] text-slate-500">{store.code}</p>
                  </div>

                  {/* Métricas */}
                  {store.hasData ? (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black tabular-nums" style={{ color }}>{pct(store.compliance)}</p>
                      <p className="text-[9px] text-slate-500">{fmt(store.totalSales)}</p>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-600 flex-shrink-0">Sin datos</span>
                  )}

                  {/* Mini barra */}
                  {store.hasData && (
                    <div className="w-10 flex-shrink-0 hidden sm:block">
                      <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(store.compliance, 100)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
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

      {/* ── MODAL DETALLE TIENDA ─── */}
      <AnimatePresence>
        {selectedStore && (
          <StoreDetailModal
            store={selectedStore}
            allDailySales={allDailySales}
            allBudgets={allBudgets}
            selectedMonth={selectedMonth}
            onClose={() => setSelectedStore(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}