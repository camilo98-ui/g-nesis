import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap, Activity, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, AreaChart, Area
} from 'recharts';

const fmt = (v) => {
  if (!v || isNaN(v)) return '$0';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('es-CO')}`;
};

const pct = (v) => `${isNaN(v) ? 0 : Math.round(v)}%`;

function StatusDot({ value }) {
  const color = value >= 95 ? '#22c55e' : value >= 80 ? '#facc15' : '#ef4444';
  return <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
}

function KPICard({ label, value, sub, trend, color = '#22c55e', icon: Icon }) {
  const isPos = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 border border-white/10 flex flex-col gap-1"
      style={{ background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub !== undefined && (
        <p className="text-xs text-slate-400">{sub}</p>
      )}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPos ? '+' : ''}{trend.toFixed(1)}% vs ayer
        </div>
      )}
    </motion.div>
  );
}

function ProjectionBlock({ current, meta, gap, compliance }) {
  const color = compliance >= 95 ? '#22c55e' : compliance >= 80 ? '#facc15' : '#ef4444';
  const label = compliance >= 95 ? 'En meta' : compliance >= 80 ? 'En riesgo' : 'Crítico';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-5 border col-span-2 lg:col-span-1"
      style={{ background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(12px)', borderColor: color + '40' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Proyección de Cierre</p>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '25', color }}>
          {label}
        </span>
      </div>
      <p className="text-4xl font-black text-white mb-1 tabular-nums">{fmt(current)}</p>
      <p className="text-xs text-slate-400 mb-3">Meta del día: {fmt(meta)}</p>
      <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(compliance, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color }} className="font-black">{pct(compliance)} cumplimiento</span>
        <span className={`font-bold ${gap <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Gap: {gap <= 0 ? '+' : '-'}{fmt(Math.abs(gap))}
        </span>
      </div>
    </motion.div>
  );
}

export default function GenesisCommandCenter() {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const monthStart = startOfMonth(now);
  const currentHour = now.getHours();
  const totalHours = 14; // horas de operación (9am - 11pm)
  const openHour = 9;
  const hoursElapsed = Math.max(1, currentHour - openHour);
  const [lastRefresh, setLastRefresh] = useState(new Date());

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

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Ventas de HOY por tienda
  const todayData = useMemo(() => {
    return STORES.map(store => {
      const todaySale = allDailySales.find(s => s.store_id === store.code && s.date === todayStr);
      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true)
        || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const daysInMonth = endOfMonth(now).getDate();
      const dailyMeta = activeBudget ? activeBudget.sales_budget / daysInMonth : 0;

      const sales = todaySale?.total_sales || 0;
      const transactions = todaySale?.total_transactions || 0;
      const avgTicket = transactions > 0 ? sales / transactions : 0;
      const projection = hoursElapsed > 0 ? (sales / hoursElapsed) * totalHours : 0;
      const compliance = dailyMeta > 0 ? (sales / dailyMeta) * 100 : 0;
      const projCompliance = dailyMeta > 0 ? (projection / dailyMeta) * 100 : 0;
      const gap = projection - dailyMeta;

      // Ventas de ayer para comparación
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      const yesterdaySale = allDailySales.find(s => s.store_id === store.code && s.date === yesterdayStr);
      const trend = yesterdaySale?.total_sales > 0 ? ((sales - yesterdaySale.total_sales) / yesterdaySale.total_sales) * 100 : 0;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        sales, transactions, avgTicket, projection,
        dailyMeta, compliance, projCompliance, gap, trend,
        hasData: sales > 0
      };
    });
  }, [allDailySales, allBudgets, todayStr, hoursElapsed]);

  // Totales globales del día
  const globalTotals = useMemo(() => {
    const withData = todayData.filter(s => s.hasData);
    const totalSales = withData.reduce((s, x) => s + x.sales, 0);
    const totalMeta = withData.reduce((s, x) => s + x.dailyMeta, 0);
    const totalTransactions = withData.reduce((s, x) => s + x.transactions, 0);
    const totalProjection = withData.reduce((s, x) => s + x.projection, 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const compliance = totalMeta > 0 ? (totalSales / totalMeta) * 100 : 0;
    const projCompliance = totalMeta > 0 ? (totalProjection / totalMeta) * 100 : 0;
    const gap = totalProjection - totalMeta;

    // Trend vs ayer global
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    const yesterdayTotal = allDailySales
      .filter(s => s.date === yesterdayStr)
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const trend = yesterdayTotal > 0 ? ((totalSales - yesterdayTotal) / yesterdayTotal) * 100 : 0;

    return { totalSales, totalMeta, totalTransactions, totalProjection, avgTicket, compliance, projCompliance, gap, trend };
  }, [todayData, allDailySales]);

  // Datos para la gráfica de líneas (ventas acumuladas del mes, simuladas por hora hoy)
  const chartData = useMemo(() => {
    const hours = [];
    for (let h = openHour; h <= openHour + totalHours; h++) {
      const elapsed = h - openHour;
      const realFraction = elapsed / totalHours;
      const metaFraction = elapsed / totalHours;
      const isElapsed = h <= currentHour;

      // Simula acumulado hasta esa hora según ritmo actual
      const realSales = isElapsed ? globalTotals.totalSales * (elapsed / hoursElapsed) : null;
      const metaSales = globalTotals.totalMeta * metaFraction;
      const proyFraction = elapsed / totalHours;
      const proyLine = h >= currentHour ? globalTotals.totalSales + (globalTotals.totalProjection - globalTotals.totalSales) * ((h - currentHour) / (openHour + totalHours - currentHour)) : null;

      hours.push({
        hora: `${h}:00`,
        real: realSales ? Math.round(realSales / 1_000_000) : null,
        meta: Math.round(metaSales / 1_000_000),
        proyeccion: h >= currentHour ? Math.round((proyLine || globalTotals.totalProjection * (elapsed / totalHours)) / 1_000_000) : null,
      });
    }
    return hours;
  }, [globalTotals, currentHour, hoursElapsed]);

  // Alertas automáticas
  const alerts = useMemo(() => {
    const list = [];
    const critical = todayData.filter(s => s.hasData && s.projCompliance < 80);
    const warning = todayData.filter(s => s.hasData && s.projCompliance >= 80 && s.projCompliance < 95);
    const overMeta = todayData.filter(s => s.hasData && s.projCompliance >= 105);

    if (critical.length > 0) list.push({ type: 'danger', msg: `🔴 ${critical.length} tienda${critical.length > 1 ? 's' : ''} con proyección crítica (<80%): ${critical.slice(0, 2).map(s => s.name).join(', ')}` });
    if (warning.length > 0) list.push({ type: 'warning', msg: `🟡 ${warning.length} tienda${warning.length > 1 ? 's' : ''} en riesgo (80–95%): ${warning.slice(0, 2).map(s => s.name).join(', ')}` });
    if (overMeta.length > 0) list.push({ type: 'success', msg: `🟢 ${overMeta.length} tienda${overMeta.length > 1 ? 's' : ''} superando la meta hoy` });
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 25000) list.push({ type: 'warning', msg: `⚠️ Ticket promedio bajo: ${fmt(globalTotals.avgTicket)} — Impulsar sugeridos` });
    if (globalTotals.projCompliance < 95) list.push({ type: 'danger', msg: `📉 El negocio cerrará al ${pct(globalTotals.projCompliance)} si se mantiene el ritmo actual` });
    if (globalTotals.trend < -10) list.push({ type: 'warning', msg: `↘️ Ventas ${Math.abs(globalTotals.trend).toFixed(0)}% por debajo del mismo período de ayer` });

    return list.slice(0, 6);
  }, [todayData, globalTotals]);

  // Insights
  const insights = useMemo(() => {
    const msgs = [];
    const critical = todayData.filter(s => s.hasData && s.projCompliance < 80);
    if (globalTotals.projCompliance < 95) msgs.push(`El negocio cerrará por debajo de la meta si se mantiene el ritmo actual (proyección: ${pct(globalTotals.projCompliance)})`);
    if (globalTotals.avgTicket > 0 && globalTotals.avgTicket < 28000) msgs.push(`El ticket promedio (${fmt(globalTotals.avgTicket)}) está afectando el cumplimiento — objetivo: $28.000`);
    if (critical.length > 0) msgs.push(`${critical.length} tienda${critical.length > 1 ? 's' : ''} están en riesgo de no cumplir la meta del día`);
    if (globalTotals.trend > 10) msgs.push(`Ritmo de ventas ${globalTotals.trend.toFixed(0)}% superior al mismo período de ayer — mantener ejecución`);
    if (globalTotals.totalTransactions > 0 && hoursElapsed > 0) msgs.push(`Promedio de ${Math.round(globalTotals.totalTransactions / hoursElapsed)} transacciones por hora en la zona`);
    if (msgs.length === 0) msgs.push('Sin alertas activas — el negocio opera dentro de los parámetros esperados');
    return msgs;
  }, [globalTotals, todayData, hoursElapsed]);

  // Tiendas ordenadas de peor a mejor proyección
  const sortedStores = useMemo(() =>
    [...todayData].filter(s => s.hasData).sort((a, b) => a.projCompliance - b.projCompliance)
  , [todayData]);

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/8" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <button className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white tracking-tight">GENESIS</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">GLOBAL COMMAND CENTER</span>
              </div>
              <p className="text-[10px] text-slate-500">{format(now, "EEEE d 'de' MMMM · HH:mm", { locale: es })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 hidden sm:block">Live · {format(lastRefresh, 'HH:mm:ss')}</span>
            </div>
            <button onClick={handleRefresh} className="h-8 px-3 rounded-lg bg-white/8 hover:bg-white/15 flex items-center gap-1.5 text-slate-300 text-xs transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── KPIs GLOBALES ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Ventas del Día" value={fmt(globalTotals.totalSales)} sub={`Meta: ${fmt(globalTotals.totalMeta)}`} trend={globalTotals.trend} icon={TrendingUp} color="#22c55e" />
          <KPICard label="Cumplimiento" value={pct(globalTotals.compliance)} sub="vs meta diaria" trend={globalTotals.compliance - 100} icon={Activity} color={globalTotals.compliance >= 95 ? '#22c55e' : globalTotals.compliance >= 80 ? '#facc15' : '#ef4444'} />
          <KPICard label="Ticket Promedio" value={fmt(globalTotals.avgTicket)} sub="por transacción" icon={Zap} color="#a78bfa" />
          <KPICard label="Transacciones" value={globalTotals.totalTransactions.toLocaleString('es-CO')} sub={`~${Math.round(globalTotals.totalTransactions / Math.max(todayData.filter(s => s.hasData).length, 1))} por tienda`} icon={CheckCircle2} color="#38bdf8" />
          <KPICard label="Proyección Cierre" value={fmt(globalTotals.totalProjection)} sub={`${pct(globalTotals.projCompliance)} proyectado`} trend={globalTotals.projCompliance - 100} icon={TrendingUp} color={globalTotals.projCompliance >= 95 ? '#22c55e' : '#facc15'} />
        </div>

        {/* ── BLOQUE PROYECCIÓN + GRÁFICA ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProjectionBlock
            current={globalTotals.totalProjection}
            meta={globalTotals.totalMeta}
            gap={globalTotals.gap}
            compliance={globalTotals.projCompliance}
          />

          {/* Gráfica de líneas */}
          <div className="lg:col-span-2 rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Ventas Acumuladas del Día (millones $)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hora" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="text-slate-400 mb-1 font-bold">{label}</p>
                        {payload.map((p, i) => p.value !== null && (
                          <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: ${p.value}M</p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="real" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Real" connectNulls={false} />
                <Line type="monotone" dataKey="meta" stroke="#818cf8" strokeWidth={2} dot={false} name="Meta" strokeDasharray="5 3" />
                <Line type="monotone" dataKey="proyeccion" stroke="#facc15" strokeWidth={2} dot={false} name="Proyección" strokeDasharray="8 4" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── LISTA TIENDAS + INSIGHTS + ALERTAS ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Listado tiendas */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-xs font-black text-white uppercase tracking-wider">Tiendas · Peor a Mejor Proyección</p>
              <span className="text-[10px] text-slate-500">{sortedStores.length} tiendas con datos</span>
            </div>
            <div className="overflow-y-auto max-h-[380px]">
              {sortedStores.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">Sin datos de ventas para hoy</div>
              )}
              {sortedStores.map((store, i) => {
                const color = store.projCompliance >= 95 ? '#22c55e' : store.projCompliance >= 80 ? '#facc15' : '#ef4444';
                const isCritical = store.projCompliance < 80;
                return (
                  <motion.div
                    key={store.code}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/4 transition-colors ${isCritical ? 'bg-red-500/5' : ''}`}
                  >
                    <StatusDot value={store.projCompliance} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{store.name}</p>
                      <p className="text-[9px] text-slate-500">{store.code}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-white tabular-nums">{fmt(store.sales)}</p>
                      <p className="text-[9px] text-slate-500">hoy</p>
                    </div>
                    <div className="text-right flex-shrink-0 w-14">
                      <p className="text-xs font-black tabular-nums" style={{ color }}>{pct(store.compliance)}</p>
                      <p className="text-[9px] text-slate-500">actual</p>
                    </div>
                    <div className="text-right flex-shrink-0 w-14">
                      <p className="text-xs font-black tabular-nums" style={{ color: store.projCompliance >= 95 ? '#22c55e' : store.projCompliance >= 80 ? '#facc15' : '#ef4444' }}>{pct(store.projCompliance)}</p>
                      <p className="text-[9px] text-slate-500">proyec.</p>
                    </div>
                    <div className="text-right flex-shrink-0 w-16 hidden sm:block">
                      <p className={`text-xs font-bold tabular-nums ${store.gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {store.gap >= 0 ? '+' : ''}{fmt(Math.abs(store.gap))}
                      </p>
                      <p className="text-[9px] text-slate-500">gap</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Panel derecho: Insights + Alertas */}
          <div className="flex flex-col gap-4">
            {/* Insights */}
            <div className="rounded-2xl border border-white/8 p-4 flex-1" style={{ background: 'rgba(30,41,59,0.7)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-xs font-black text-white uppercase tracking-wider">Insights Automáticos</p>
              </div>
              <div className="space-y-2.5">
                {insights.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="text-xs text-slate-300 leading-relaxed p-2.5 rounded-xl border border-white/6"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Feed Alertas */}
            <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(30,41,59,0.7)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs font-black text-white uppercase tracking-wider">Alertas en Tiempo Real</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length === 0 && (
                  <p className="text-xs text-slate-500">Sin alertas activas</p>
                )}
                {alerts.map((a, i) => {
                  const borderColor = a.type === 'danger' ? '#ef444440' : a.type === 'warning' ? '#facc1540' : '#22c55e40';
                  const bg = a.type === 'danger' ? 'rgba(239,68,68,0.07)' : a.type === 'warning' ? 'rgba(250,204,21,0.07)' : 'rgba(34,197,94,0.07)';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-xs leading-snug p-2.5 rounded-xl border"
                      style={{ background: bg, borderColor, color: '#e2e8f0' }}
                    >
                      {a.msg}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}