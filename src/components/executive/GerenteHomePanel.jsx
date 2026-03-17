import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import { BASE_STORES } from '@/components/StoreManager';
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, ArrowRight, Target, BarChart3,
  Zap, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Clock, Activity, Store, Flame, Star
} from 'lucide-react';
import {
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';

const fmt = (v) => {
  if (!v || isNaN(v)) return '$0';
  if (v >= 1000000000) return `$${(v / 1000000000).toFixed(2)}B`;
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('es-CO')}`;
};

const pct = (v) => `${Math.round(v)}%`;

// Colores de estado
const STATUS = {
  excellent: { label: 'Excelente', color: '#10b981', bg: 'bg-emerald-500', light: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '🟢' },
  ok:        { label: 'En Meta',   color: '#3b82f6', bg: 'bg-blue-500',   light: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: '🔵' },
  warning:   { label: 'En Riesgo', color: '#f59e0b', bg: 'bg-amber-500',  light: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  dot: '🟡' },
  critical:  { label: 'Crítico',   color: '#ef4444', bg: 'bg-red-500',    light: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-400',    dot: '🔴' },
  nodata:    { label: 'Sin Datos', color: '#64748b', bg: 'bg-slate-500',  light: 'bg-slate-500/15',  border: 'border-slate-500/20',  text: 'text-slate-500',  dot: '⚫' },
};

function getStatus(compliance, hasData) {
  if (!hasData) return 'nodata';
  if (compliance >= 105) return 'excellent';
  if (compliance >= 90) return 'ok';
  if (compliance >= 70) return 'warning';
  return 'critical';
}

// Barra de progreso animada
function ProgressBar({ value, max, color, height = 'h-1.5' }) {
  const p = max > 0 ? Math.min((value / max) * 100, 120) : 0;
  return (
    <div className={`w-full ${height} bg-white/8 rounded-full overflow-hidden`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(p, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// Tarjeta de tienda individual
function StoreCard({ store, rank, onClick }) {
  const [hovered, setHovered] = useState(false);
  const s = STATUS[store.status];
  const isGood = store.status === 'excellent' || store.status === 'ok';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border ${s.border} ${s.light} p-3 transition-all duration-200 ${hovered ? 'scale-[1.02] shadow-lg' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white truncate leading-tight">{store.name}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{store.code}</p>
        </div>
        <div className={`flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black ${s.light} ${s.text} border ${s.border}`}>
          {store.hasData ? pct(store.compliance) : '—'}
        </div>
      </div>

      {/* Barra */}
      <ProgressBar value={store.totalSales} max={store.salesBudget} color={s.color} height="h-1" />

      {/* Métricas */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="text-[10px] font-bold text-white tabular-nums">{fmt(store.totalSales)}</p>
          <p className="text-[8px] text-slate-500">de {fmt(store.salesBudget)}</p>
        </div>
        <div className="text-right">
          <p className={`text-[9px] font-bold tabular-nums ${store.projCompliance >= 100 ? 'text-emerald-400' : store.projCompliance >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
            Proy: {pct(store.projCompliance)}
          </p>
          <p className="text-[8px] text-slate-500">{s.label}</p>
        </div>
      </div>

      {/* Indicador top performer */}
      {store.status === 'excellent' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <Star className="w-2.5 h-2.5 text-yellow-900 fill-yellow-900" />
        </div>
      )}
    </motion.div>
  );
}

export default function GerenteHomePanel() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = now.getDate();
  const monthProgress = (daysElapsed / daysInMonth) * 100;

  const [activeStoreCodes, setActiveStoreCodes] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'chart' | 'rank'

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.store_config?.activeStoreCodes) {
        setActiveStoreCodes(user.store_config.activeStoreCodes);
      } else {
        setActiveStoreCodes(null);
      }
    }).catch(() => setActiveStoreCodes(null));
  }, []);

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerenteHomeSales'],
    queryFn: () => base44.entities.DailySales.list(),
    staleTime: 5 * 60 * 1000
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerenteHomeBudgets'],
    queryFn: () => base44.entities.Budget.list(),
    staleTime: 10 * 60 * 1000
  });

  const { data: zoneBudgets = [] } = useQuery({
    queryKey: ['gerenteZoneBudgets'],
    queryFn: () => base44.entities.ZoneBudget.filter({ zone_name: 'Bogotá Noroccidente' }),
    staleTime: 10 * 60 * 1000
  });

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Tiendas activas
  const visibleStores = useMemo(() => {
    if (!activeStoreCodes) return STORES;
    return STORES.filter(s => {
      if (activeStoreCodes.includes(s.code)) return true;
      const allKnownCodes = new Set([...activeStoreCodes]);
      return !allKnownCodes.has(s.code);
    });
  }, [activeStoreCodes]);

  // Calcular métricas por tienda
  const storesData = useMemo(() => {
    return visibleStores.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = parseISO(s.date);
          return s.store_id === store.code && d >= monthStart && d <= now;
        } catch { return false; }
      });

      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);

      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true);
      const budget = activeBudget || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = budget?.sales_budget || 0;

      const avgDaily = daysElapsed > 0 ? totalSales / daysElapsed : 0;
      const projection = totalSales + avgDaily * (daysInMonth - daysElapsed);
      const compliance = salesBudget > 0 ? (totalSales / salesBudget) * 100 : 0;
      const projCompliance = salesBudget > 0 ? (projection / salesBudget) * 100 : 0;
      const hasData = totalSales > 0;
      const status = getStatus(compliance, hasData);
      const gap = Math.max(0, salesBudget - totalSales);
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Tendencia últimos 7 días
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = format(d, 'yyyy-MM-dd');
        const daySale = allDailySales.find(s => s.store_id === store.code && s.date === dayStr);
        last7.push({ day: format(d, 'dd'), sales: daySale?.total_sales || 0 });
      }

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales, salesBudget, projection,
        compliance, projCompliance,
        gap, hasData, status, avgTicket, totalTransactions,
        avgDaily, last7
      };
    });
  }, [allDailySales, allBudgets, visibleStores, daysElapsed, daysInMonth]);

  // Totales zona
  const zoneTotals = useMemo(() => {
    const stores = storesData.filter(s => s.hasData);
    const totalSales = stores.reduce((s, x) => s + x.totalSales, 0);
    const totalBudget = stores.reduce((s, x) => s + x.salesBudget, 0);
    const totalProjection = stores.reduce((s, x) => s + x.projection, 0);
    const activeZoneBudget = zoneBudgets.find(b => b.is_active) || zoneBudgets.find(b => b.month === currentMonth && b.year === currentYear);
    const zoneBudgetVal = activeZoneBudget?.sales_budget || totalBudget;
    const compliance = zoneBudgetVal > 0 ? (totalSales / zoneBudgetVal) * 100 : 0;
    const projCompliance = zoneBudgetVal > 0 ? (totalProjection / zoneBudgetVal) * 100 : 0;
    const totalGap = Math.max(0, zoneBudgetVal - totalSales);
    return { totalSales, totalBudget: zoneBudgetVal, totalProjection, compliance, projCompliance, storesCount: stores.length, totalGap };
  }, [storesData, zoneBudgets]);

  const statusCounts = useMemo(() => ({
    excellent: storesData.filter(s => s.status === 'excellent').length,
    ok:        storesData.filter(s => s.status === 'ok').length,
    warning:   storesData.filter(s => s.status === 'warning').length,
    critical:  storesData.filter(s => s.status === 'critical').length,
    nodata:    storesData.filter(s => s.status === 'nodata').length,
  }), [storesData]);

  // Para la gráfica de barras — top tiendas con data
  const chartData = useMemo(() =>
    storesData
      .filter(s => s.hasData)
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 10)
      .map(s => ({
        name: s.name.length > 8 ? s.name.slice(0, 8) : s.name,
        real: Math.round(s.compliance),
        proy: Math.round(s.projCompliance),
        color: STATUS[s.status].color
      }))
  , [storesData]);

  // Datos distribucion de compliance para mini pie
  const distData = [
    { name: 'Excelente', value: statusCounts.excellent, fill: '#10b981' },
    { name: 'En Meta',   value: statusCounts.ok,        fill: '#3b82f6' },
    { name: 'En Riesgo', value: statusCounts.warning,   fill: '#f59e0b' },
    { name: 'Crítico',   value: statusCounts.critical,  fill: '#ef4444' },
  ].filter(d => d.value > 0);

  const zoneStatus = zoneTotals.compliance >= 105 ? 'excellent' : zoneTotals.compliance >= 90 ? 'ok' : zoneTotals.compliance >= 70 ? 'warning' : 'critical';
  const zs = STATUS[zoneStatus];

  // Tiendas ordenadas para ranking
  const ranked = useMemo(() =>
    [...storesData]
      .filter(s => s.hasData)
      .sort((a, b) => b.compliance - a.compliance)
  , [storesData]);

  const criticalStores = storesData.filter(s => s.status === 'critical');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto space-y-3"
    >
      {/* ══ HERO ZONA ══════════════════════════════════════════════ */}
      <div className={`relative overflow-hidden rounded-2xl border ${zs.border} bg-gradient-to-br from-slate-900 to-slate-800`}>
        {/* Fondo glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: zs.color }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ backgroundColor: zs.color }} />
        </div>

        <div className="relative p-4">
          {/* Título + Badge */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Bogotá Noroccidente</p>
              <p className="text-[10px] text-slate-400">{format(now, "MMMM yyyy", { locale: es })}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${zs.light} ${zs.text} ${zs.border}`}>
              {zs.label}
            </div>
          </div>

          {/* Ventas gran número */}
          <div className="flex items-end gap-3 mb-3">
            <div>
              <p className="text-3xl font-black text-white tabular-nums">{fmt(zoneTotals.totalSales)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">vendido · PPT {fmt(zoneTotals.totalBudget)}</p>
            </div>
            <div className="mb-1">
              <div className={`flex items-center gap-1 text-sm font-black ${zs.text}`}>
                {zoneTotals.compliance >= 100 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {pct(zoneTotals.compliance)}
              </div>
            </div>
          </div>

          {/* Barras dobles */}
          <div className="space-y-1.5 mb-3">
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-slate-400">Avance real del mes</span>
                <span className={`font-black ${zs.text}`}>{pct(zoneTotals.compliance)}</span>
              </div>
              <ProgressBar value={zoneTotals.totalSales} max={zoneTotals.totalBudget} color={zs.color} height="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-slate-400">Proyección cierre mes</span>
                <span className={`font-bold ${zoneTotals.projCompliance >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {fmt(zoneTotals.totalProjection)} · {pct(zoneTotals.projCompliance)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${zoneTotals.projCompliance >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ opacity: 0.6, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 6px)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(zoneTotals.projCompliance, 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Progreso del mes */}
          <div className="mb-3">
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-slate-500">Día {daysElapsed} de {daysInMonth}</span>
              <span className="text-slate-500">{pct(monthProgress)} del mes transcurrido</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/20 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${monthProgress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* KPIs strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Con data', value: `${zoneTotals.storesCount}/${visibleStores.length}`, sub: 'tiendas', color: 'text-slate-300' },
              { label: '⭐ Sobre meta', value: statusCounts.excellent + statusCounts.ok, sub: 'tiendas', color: 'text-emerald-400' },
              { label: '⚠️ En riesgo', value: statusCounts.warning, sub: 'tiendas', color: 'text-amber-400' },
              { label: '🔴 Críticas', value: statusCounts.critical, sub: 'tiendas', color: statusCounts.critical > 0 ? 'text-red-400' : 'text-slate-500' },
            ].map((m, i) => (
              <div key={i} className="bg-white/4 rounded-xl p-2 text-center border border-white/6">
                <p className="text-[8px] text-slate-500 mb-0.5">{m.label}</p>
                <p className={`text-base font-black tabular-nums ${m.color}`}>{m.value}</p>
                <p className="text-[8px] text-slate-600">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ALERTA TIENDAS CRÍTICAS ════════════════════════════════ */}
      {criticalStores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/25 rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <p className="text-xs font-black text-red-300">{criticalStores.length} tienda{criticalStores.length > 1 ? 's' : ''} en estado crítico</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {criticalStores.map(s => (
              <div key={s.code} className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-red-200">{s.name}</span>
                <span className="text-[9px] text-red-400 font-black">{pct(s.compliance)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══ SELECTOR DE VISTA ══════════════════════════════════════ */}
      <div className="flex gap-1.5 bg-slate-900/60 rounded-xl p-1 border border-white/8">
        {[
          { id: 'grid', label: '⊞ Tarjetas', icon: null },
          { id: 'chart', label: '📊 Gráfica', icon: null },
          { id: 'rank', label: '🏆 Ranking', icon: null },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setViewMode(v.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              viewMode === v.id
                ? 'bg-white/15 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ══ VISTA TARJETAS ═════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-2"
          >
            {storesData
              .filter(s => s.hasData)
              .sort((a, b) => a.compliance - b.compliance)
              .map((store, i) => (
                <StoreCard
                  key={store.code}
                  store={store}
                  rank={i}
                  onClick={() => setSelectedStore(selectedStore?.code === store.code ? null : store)}
                />
              ))}
          </motion.div>
        )}

        {/* ══ VISTA GRÁFICA ═══════════════════════════════════════ */}
        {viewMode === 'chart' && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Barra cumplimiento */}
            <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">% Cumplimiento Real vs Proyección</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 30, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 130]} stroke="#475569" fontSize={9} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} width={55} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs shadow-xl">
                          <p className="text-slate-300 font-bold mb-1">{payload[0]?.payload?.name}</p>
                          <p className="text-blue-300">Real: <span className="font-black text-white">{payload[0]?.value}%</span></p>
                          <p className="text-amber-300">Proy: <span className="font-black text-white">{payload[1]?.value}%</span></p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={100} stroke="#ffffff30" strokeDasharray="4 2" />
                  <Bar dataKey="real" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={14} name="Real">
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="proy" fill="#f59e0b" radius={[0, 3, 3, 0]} maxBarSize={6} opacity={0.5} name="Proyección" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mini donut distribución */}
            <div className="bg-slate-900/60 border border-white/8 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Distribución de Estado</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <RadialBarChart innerRadius={25} outerRadius={45} data={distData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={3} />
                    <Tooltip content={() => null} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {Object.entries(STATUS).filter(([k]) => k !== 'nodata').map(([key, s]) => {
                    const count = statusCounts[key] || 0;
                    if (!count) return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-slate-300 flex-1">{s.label}</span>
                        <span className="text-[10px] font-black text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ VISTA RANKING ═══════════════════════════════════════ */}
        {viewMode === 'rank' && (
          <motion.div
            key="rank"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-slate-900/60 border border-white/8 rounded-xl overflow-hidden"
          >
            {ranked.map((store, i) => {
              const s = STATUS[store.status];
              return (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 px-3 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/4 transition-colors`}
                >
                  {/* Posición */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-slate-400 text-slate-900' :
                    i === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-white truncate">{store.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`text-xs font-black tabular-nums ${s.text}`}>{pct(store.compliance)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={store.totalSales} max={store.salesBudget} color={s.color} height="h-1" />
                      </div>
                      <span className="text-[9px] text-slate-500 flex-shrink-0">{fmt(store.totalSales)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DETALLE TIENDA SELECCIONADA ════════════════════════════ */}
      <AnimatePresence>
        {selectedStore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`bg-slate-900/80 border ${STATUS[selectedStore.status].border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-white">{selectedStore.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedStore.code}</p>
                </div>
                <button onClick={() => setSelectedStore(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Venta Real', value: fmt(selectedStore.totalSales), color: 'text-white' },
                  { label: 'PPT Mes', value: fmt(selectedStore.salesBudget), color: 'text-slate-300' },
                  { label: 'Proyección', value: fmt(selectedStore.projection), color: selectedStore.projCompliance >= 100 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Cumplimiento', value: pct(selectedStore.compliance), color: STATUS[selectedStore.status].text },
                  { label: 'Proy. Cierre', value: pct(selectedStore.projCompliance), color: selectedStore.projCompliance >= 100 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Brecha', value: fmt(selectedStore.gap), color: selectedStore.gap > 0 ? 'text-red-400' : 'text-emerald-400' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/6">
                    <p className="text-[8px] text-slate-500 mb-0.5">{m.label}</p>
                    <p className={`text-xs font-black tabular-nums ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Minitrend 7 días */}
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Últimos 7 días</p>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={selectedStore.last7} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <Line
                    type="monotone" dataKey="sales"
                    stroke={STATUS[selectedStore.status].color}
                    strokeWidth={2} dot={{ r: 2, fill: STATUS[selectedStore.status].color }}
                    isAnimationActive
                  />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.length
                      ? <div className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white">{fmt(payload[0].value)}</div>
                      : null
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CTA PANEL EJECUTIVO ═══════════════════════════════════ */}
      <Link to={createPageUrl('ExecutiveDashboard')}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-xl border border-blue-500/20 p-3 flex items-center justify-between cursor-pointer hover:border-blue-400/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/25 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Panel Ejecutivo Completo</p>
              <p className="text-[9px] text-slate-400">Análisis detallado · Gráficas · Comparables</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </motion.div>
      </Link>
    </motion.div>
  );
}