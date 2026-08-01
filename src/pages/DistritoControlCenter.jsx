import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BASE_STORES } from '@/components/StoreManager';
import {
  format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfWeek,
  endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subDays, eachDayOfInterval, isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Calendar, ChevronDown, RefreshCw, Store as StoreIcon,
  Activity, AlertTriangle
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalComp } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import DistritoKPIs from '@/components/distrito/DistritoKPIs';
import DistritoMasterTable from '@/components/distrito/DistritoMasterTable';
import StoreMapGrid from '@/components/distrito/StoreMapGrid';
import { DistritoAlerts, NovaSummary } from '@/components/distrito/DistritoAlerts';

const fmt = (v) => {
  if (v == null || isNaN(v)) return '—';
  const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
};

const PRESETS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'año', label: 'Año' },
  { id: 'custom', label: 'Personalizado' },
];

function getRange(preset, custom) {
  const now = new Date();
  if (preset === 'hoy') return { start: startOfDay(now), end: endOfDay(now) };
  if (preset === 'ayer') return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
  if (preset === 'semana') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (preset === 'mes') return { start: startOfMonth(now), end: endOfMonth(now) };
  if (preset === 'año') return { start: startOfYear(now), end: endOfYear(now) };
  if (preset === 'custom' && custom?.from && custom?.to) return { start: startOfDay(custom.from), end: endOfDay(custom.to) };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DistritoControlCenter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [preset, setPreset] = useState('mes');
  const [custom, setCustom] = useState({ from: null, to: null });
  const [storeFilter, setStoreFilter] = useState('all');
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const range = useMemo(() => getRange(preset, custom), [preset, custom]);
  const now = new Date();
  const isCurrentMonth = preset === 'mes' && format(range.start, 'yyyy-MM') === format(now, 'yyyy-MM');
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).length;
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemaining = daysInMonth - daysElapsed;
  const currentMonthNum = range.start.getMonth() + 1;
  const currentYear = range.start.getFullYear();

  const { data: allDailySales = [], refetch } = useQuery({
    queryKey: ['distrito_sales'], queryFn: () => base44.entities.DailySales.list(), staleTime: 2 * 60 * 1000
  });
  const { data: allBudgets = [] } = useQuery({
    queryKey: ['distrito_budgets'], queryFn: () => base44.entities.Budget.list(), staleTime: 10 * 60 * 1000
  });

  const activeStores = storeFilter === 'all' ? BASE_STORES : BASE_STORES.filter(s => s.code === storeFilter);

  // Per-store metrics
  const storeMetrics = useMemo(() => {
    return activeStores.map(store => {
      const storeSales = allDailySales.filter(s => {
        if (s.store_id !== store.code) return false;
        try {
          const d = parseISO(s.date);
          return isWithinInterval(d, { start: range.start, end: range.end });
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
      const gap = totalSales - monthlyBudget;
      const hasData = totalSales > 0;

      return {
        code: store.code, name: store.displayName || store.name,
        totalSales, totalTransactions, avgTicket, monthlyBudget, compliance, projection, gap, hasData,
        avgDaily, salesDays: storeSales.length,
      };
    });
  }, [allDailySales, allBudgets, range, activeStores, daysElapsed, daysRemaining, isCurrentMonth, currentMonthNum, currentYear]);

  // District totals (consolidated, NOT averaged)
  const districtTotals = useMemo(() => {
    const totalSales = storeMetrics.reduce((s, x) => s + x.totalSales, 0);
    const totalBudget = storeMetrics.reduce((s, x) => s + x.monthlyBudget, 0);
    const totalTransactions = storeMetrics.reduce((s, x) => s + x.totalTransactions, 0);
    const totalProjection = storeMetrics.reduce((s, x) => s + x.projection, 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const projCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : 0;
    const gap = totalSales - totalBudget;
    const withData = storeMetrics.filter(s => s.hasData);
    const overBudget = withData.filter(s => s.compliance >= 100).length;
    const underBudget = withData.filter(s => s.compliance < 100).length;
    const avgPerStore = withData.length > 0 ? totalSales / withData.length : 0;

    // Comparatives
    const yesterday = subDays(now, 1);
    const yesterdaySales = allDailySales.filter(s => {
      try { return isSameDay(parseISO(s.date), yesterday) && activeStores.some(st => st.code === s.store_id); }
      catch { return false; }
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const lastWeekEnd = subDays(range.start, 1);
    const lastWeekStart = subDays(lastWeekEnd, Math.max(eachDayOfInterval({ start: range.start, end: range.end }).length - 1, 0));
    const lastWeekSales = allDailySales.filter(s => {
      try {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start: lastWeekStart, end: lastWeekEnd }) && activeStores.some(st => st.code === s.store_id);
      } catch { return false; }
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const vsYesterday = yesterdaySales > 0 ? ((totalSales - yesterdaySales) / yesterdaySales) * 100 : 0;
    const vsLastWeek = lastWeekSales > 0 ? ((totalSales - lastWeekSales) / lastWeekSales) * 100 : 0;

    return {
      totalSales, totalBudget, totalTransactions, totalProjection, avgTicket, compliance, projCompliance, gap,
      withDataCount: withData.length, overBudget, underBudget, avgPerStore, totalStores: activeStores.length,
      vsYesterday, vsLastWeek,
    };
  }, [storeMetrics, allDailySales, range, activeStores, now]);

  // Participation per store
  const storesWithParticipation = useMemo(() => {
    return storeMetrics.map(s => ({
      ...s,
      participation: districtTotals.totalSales > 0 ? (s.totalSales / districtTotals.totalSales) * 100 : 0,
    }));
  }, [storeMetrics, districtTotals.totalSales]);

  // Daily chart data
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: range.start, end: range.end }).filter(d => d <= now || preset !== 'hoy');
    const dailyBudget = districtTotals.totalBudget / Math.max(eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).length, 1);
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = allDailySales.filter(s => s.date === dayStr && activeStores.some(st => st.code === s.store_id))
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);
      return {
        dia: format(day, 'd'),
        label: format(day, 'dd MMM', { locale: es }),
        ventas: Math.round(daySales / 1e6 * 10) / 10,
        meta: Math.round(dailyBudget / 1e6 * 10) / 10,
      };
    });
  }, [allDailySales, range, activeStores, districtTotals.totalBudget, preset, now]);

  // Alerts
  const alerts = useMemo(() => {
    const list = [];
    const noData = storeMetrics.filter(s => !s.hasData);
    const critical = storeMetrics.filter(s => s.hasData && s.compliance < 95);
    const lowTicket = storeMetrics.filter(s => s.hasData && s.avgTicket > 0 && s.avgTicket < 25000);
    if (noData.length > 0) list.push({ type: 'warning', msg: `${noData.length} tiendas sin ventas registradas: ${noData.slice(0, 3).map(s => s.code).join(', ')}${noData.length > 3 ? '…' : ''}` });
    if (critical.length > 0) list.push({ type: 'danger', msg: `${critical.length} tiendas bajo presupuesto (<95%): ${critical.sort((a, b) => a.compliance - b.compliance).slice(0, 3).map(s => `${s.code} (${s.compliance.toFixed(0)}%)`).join(', ')}` });
    if (lowTicket.length > 0) list.push({ type: 'warning', msg: `${lowTicket.length} tiendas con ticket promedio bajo (<$25K): ${lowTicket.slice(0, 3).map(s => s.code).join(', ')}` });
    if (districtTotals.compliance < 95 && districtTotals.compliance > 0) list.push({ type: 'danger', msg: `Distrito al ${districtTotals.compliance.toFixed(1)}% del presupuesto global` });
    if (districtTotals.overBudget > 0) list.push({ type: 'success', msg: `${districtTotals.overBudget} tiendas cumplen o superan la meta` });
    return list;
  }, [storeMetrics, districtTotals]);

  // Nova AI summary (rule-based, real data)
  const novaSummary = useMemo(() => {
    const lines = [];
    const sorted = [...storesWithParticipation].sort((a, b) => b.compliance - a.compliance);
    const best = sorted[0]; const worst = sorted.filter(s => s.hasData).pop();
    lines.push(`El distrito cumple al ${districtTotals.compliance.toFixed(1)}% del presupuesto consolidado.`);
    lines.push(`${districtTotals.overBudget} de ${districtTotals.totalStores} tiendas cumplen o superan la meta.`);
    if (best?.hasData) lines.push(`La mejor tienda es ${best.code} con ${best.compliance.toFixed(0)}% de cumplimiento y ${fmt(best.totalSales)} en ventas.`);
    if (worst && worst.hasData && worst.code !== best?.code) lines.push(`La mayor oportunidad está en ${worst.code} al ${worst.compliance.toFixed(0)}% — gap de ${fmt(Math.abs(worst.gap))}.`);
    if (isCurrentMonth && districtTotals.projCompliance > 0) lines.push(`Proyección de cierre: ${fmt(districtTotals.totalProjection)} (${districtTotals.projCompliance.toFixed(1)}% del presupuesto).`);
    if (districtTotals.avgTicket > 0) lines.push(`Ticket promedio del distrito: ${fmt(districtTotals.avgTicket)} sobre ${districtTotals.totalTransactions.toLocaleString('es-CO')} transacciones.`);
    if (districtTotals.vsYesterday !== 0) lines.push(`Vs ayer: ${districtTotals.vsYesterday >= 0 ? '+' : ''}${districtTotals.vsYesterday.toFixed(1)}% en ventas.`);
    const visit = storesWithParticipation.filter(s => s.hasData && s.compliance < 95).sort((a, b) => a.compliance - b.compliance)[0];
    if (visit) lines.push(`Recomiendo visitar primero ${visit.code} para acelerar el cierre del mes.`);
    return lines;
  }, [districtTotals, storesWithParticipation, isCurrentMonth]);

  // Store click → open store dashboard
  const handleStoreClick = (store) => {
    try {
      const session = JSON.parse(localStorage.getItem('popsySession') || '{}');
      localStorage.setItem('popsySession', JSON.stringify({ ...session, store: store.code }));
    } catch { /* ignore */ }
    navigate(createPageUrl('Dashboard'));
  };

  // Excel export
  const exportExcel = () => {
    const headers = ['Tienda', 'Codigo', 'Ventas', 'Presupuesto', 'Cumplimiento %', 'Gap', 'Ticket', 'Transacciones', 'Participacion %', 'Estado'];
    const rows = storesWithParticipation.map(s => [
      s.name, s.code, Math.round(s.totalSales), Math.round(s.monthlyBudget),
      s.compliance.toFixed(1), Math.round(s.gap), Math.round(s.avgTicket),
      s.totalTransactions, s.participation.toFixed(1),
      s.compliance >= 100 ? 'Cumple' : s.compliance >= 95 ? 'En riesgo' : 'Crítico'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Distrito_${format(range.start, 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Role gate
  if (user && user.role && user.role !== 'gerente' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.08)' }}>
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-700 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-slate-400 mb-6">El Centro de Control del Distrito está disponible exclusivamente para Gerentes de Distrito.</p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-rose-500 hover:bg-rose-600">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-card border-b border-slate-100 rounded-none">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <button className="w-8 h-8 rounded-lg bg-white/60 hover:bg-rose-50 flex items-center justify-center transition-colors border border-slate-200">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-700 tracking-tight">CENTRO DE CONTROL DEL DISTRITO</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(194,24,117,0.1)', color: '#C21875', border: '1px solid rgba(194,24,117,0.2)' }}>
                  GERENTE DE DISTRITO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{format(now, "EEEE d 'de' MMMM · HH:mm", { locale: es })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date presets */}
            <div className="flex items-center gap-1 bg-white/60 border border-slate-200 rounded-xl p-0.5">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => { setPreset(p.id); if (p.id !== 'custom') setDatePickerOpen(false); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    preset === p.id ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-rose-50'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date picker */}
            {preset === 'custom' && (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button className="h-8 px-3 rounded-xl bg-white/60 border border-slate-200 flex items-center gap-1.5 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    {custom.from && custom.to
                      ? `${format(custom.from, 'dd MMM', { locale: es })} - ${format(custom.to, 'dd MMM', { locale: es })}`
                      : 'Seleccionar'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">Desde</p>
                      <CalComp mode="single" selected={custom.from} onSelect={d => setCustom(p => ({ ...p, from: d }))} locale={es} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">Hasta</p>
                      <CalComp mode="single" selected={custom.to} onSelect={d => setCustom(p => ({ ...p, to: d }))} locale={es} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Store filter */}
            <Popover open={storeMenuOpen} onOpenChange={setStoreMenuOpen}>
              <PopoverTrigger asChild>
                <button className="h-8 px-3 rounded-xl bg-white/60 border border-slate-200 flex items-center gap-1.5 text-xs text-slate-600">
                  <StoreIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span className="max-w-24 truncate">{storeFilter === 'all' ? 'Todas' : storeFilter}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 max-h-72 overflow-y-auto" align="end">
                <button onClick={() => { setStoreFilter('all'); setStoreMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${storeFilter === 'all' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Todas las tiendas ({BASE_STORES.length})
                </button>
                {BASE_STORES.map(s => (
                  <button key={s.code} onClick={() => { setStoreFilter(s.code); setStoreMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${storeFilter === s.code ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {s.code} · {s.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <button onClick={() => { refetch(); setLastRefresh(new Date()); }}
              className="h-8 w-8 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Greeting + District info */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.08) 0%, transparent 70%)' }} />
          <div className="flex items-center justify-between gap-4 flex-wrap relative">
            <div>
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-1">DISTRITO BOGOTÁ</p>
              <h1 className="text-2xl font-black text-slate-700 tracking-tight">
                {greeting()}, {user?.full_name?.split(' ')[0] || 'Gerente'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><StoreIcon className="w-3 h-3 text-rose-400" /> {districtTotals.totalStores} tiendas activas</span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-rose-400" />
                  {format(range.start, 'dd MMM', { locale: es })} - {format(range.end, 'dd MMM yyyy', { locale: es })}
                </span>
                <span className="text-slate-300">·</span>
                <span>Actualizado: {format(lastRefresh, 'HH:mm', { locale: es })}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-1">CUMPLIMIENTO GLOBAL</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: districtTotals.compliance >= 95 ? '#10b981' : districtTotals.compliance >= 80 ? '#f59e0b' : '#e11d48' }}>
                {districtTotals.compliance.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400">{fmt(districtTotals.totalSales)} / {fmt(districtTotals.totalBudget)}</p>
            </div>
          </div>
        </motion.div>

        {/* KPIs */}
        <DistritoKPIs totals={districtTotals} />

        {/* Sales chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.12)' }}>
                <Activity className="w-4 h-4" style={{ color: '#C21875' }} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700">Ventas vs Presupuesto</p>
                <p className="text-[10px] text-slate-400">Distrito consolidado · {format(range.start, 'dd MMM', { locale: es })} - {format(range.end, 'dd MMM', { locale: es })}</p>
              </div>
            </div>
            <span className="text-[9px] text-slate-400">Barras = venta diaria · Línea = meta</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 12))} />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} width={32} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.18)' }}>
                      <p className="font-bold text-slate-600 mb-1">{d?.label}</p>
                      <p className="text-emerald-600">Venta: <b>${d?.ventas}M</b></p>
                      <p className="text-indigo-500">Meta: <b>${d?.meta}M</b></p>
                    </div>
                  );
                }} />
                <Bar dataKey="ventas" name="Ventas" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.ventas >= entry.meta && entry.meta > 0 ? '#10b981' : entry.ventas > 0 ? '#f59e0b' : '#e2e8f0'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="meta" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Meta" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos en el período</p></div>
          )}
        </motion.div>

        {/* Store map */}
        <StoreMapGrid stores={storesWithParticipation} onStoreClick={handleStoreClick} />

        {/* Master table */}
        <DistritoMasterTable stores={storesWithParticipation} onStoreClick={handleStoreClick} onExport={exportExcel} />

        {/* Alerts + Nova */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistritoAlerts alerts={alerts} />
          <NovaSummary summary={novaSummary} />
        </div>
      </div>
    </div>
  );
}