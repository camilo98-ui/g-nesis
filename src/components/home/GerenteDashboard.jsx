import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, ReferenceLine, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  format, parseISO, isWithinInterval, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, subWeeks, subMonths, differenceInCalendarDays, eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar, Globe, Store as StoreIcon, TrendingUp, Target,
  CreditCard, Activity, DollarSign, Trophy, ArrowUpRight, ArrowDownRight,
  Crown, Receipt, Percent, Zap
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

/* ── formatters ── */
const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtPct = (n) => (n == null || isNaN(n) ? '—' : `${n.toFixed(1)}%`);
const fmtInt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('es-CO'));
const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(n || 0));

const PALETTE = ['#C21875', '#e91e8c', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'];

const PYG_FILTERS = [
  { key: 'margen_ebitda', label: 'EBITDA', color: '#10b981' },
  { key: 'costo_personal', label: 'Costo Personal', color: '#6366f1' },
  { key: 'teorico_vs_real', label: 'Teórico vs Real', color: '#C21875' },
  { key: 'gastos_pct_venta', label: 'Gastos Operativos', color: '#f59e0b' },
];

function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-medium shadow-xl"
      style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.18)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || p.color || '#C21875' }}>
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ═══ KPI Hero Card — ultra compact ═══ */
function KPICard({ label, value, sub, color, icon: Icon, delay, trend }) {
  const c = color || '#C21875';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${c}0a 0%, rgba(255,255,255,0.96) 55%)`,
        border: `1px solid ${c}1a`,
        boxShadow: `0 2px 14px ${c}08, inset 0 1px 0 rgba(255,255,255,1)`,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle, ${c}10 0%, transparent 70%)`, pointerEvents: 'none',
      }} />
      <div className="flex items-center justify-between mb-2 relative">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${c}14`, border: `1px solid ${c}22` }}>
          <Icon style={{ color: c, width: 13, height: 13 }} />
        </div>
        {trend != null && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
            style={{ background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }}>
            {trend >= 0
              ? <ArrowUpRight style={{ width: 10, height: 10, color: '#10b981' }} />
              : <ArrowDownRight style={{ width: 10, height: 10, color: '#f43f5e' }} />}
            <span style={{ fontSize: 9, fontWeight: 800, color: trend >= 0 ? '#10b981' : '#f43f5e' }}>
              {Math.abs(trend).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">{label}</p>
      <p className="text-[20px] font-black tabular-nums leading-none" style={{ letterSpacing: '-0.03em', color: c }}>{value}</p>
      {sub && <p className="text-[9px] text-slate-400 mt-1 font-medium">{sub}</p>}
    </motion.div>
  );
}

/* ═══ Section Card ═══ */
function SectionCard({ icon: Icon, title, subtitle, color, right, children, delay }) {
  const c = color || '#C21875';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0.1, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${c}14`, border: `1px solid ${c}22` }}>
          <Icon style={{ color: c, width: 13, height: 13 }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-slate-700" style={{ letterSpacing: '-0.02em' }}>{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.07)' }}>
        <Activity style={{ color: '#C21875', width: 14, height: 14 }} />
      </div>
      <p className="text-[11px] text-slate-400">{msg || 'Sin datos para el período'}</p>
    </div>
  );
}

/* ═══ Ranking Row ═══ */
function RankingRow({ rank, name, value, pct, color, isTop }) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-pink-50/50 transition-colors">
      <div className="flex items-center gap-2 w-8 flex-shrink-0">
        {isTop && rank === 1 ? (
          <Crown style={{ width: 14, height: 14, color: '#f59e0b' }} />
        ) : (
          <span className="text-[10px] font-black text-slate-300 tabular-nums">{rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-600 truncate">{name}</p>
        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct || 0, 100)}%`, background: color }} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[11px] font-black tabular-nums" style={{ color }}>{fmtM(value)}</p>
        <p className="text-[8px] font-bold text-slate-400">{(pct || 0).toFixed(0)}%</p>
      </div>
    </div>
  );
}

export default function GerenteDashboard() {
  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(now);
  const [calOpen, setCalOpen] = useState(false);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [globalView, setGlobalView] = useState(false);
  const [ventasTab, setVentasTab] = useState('ventas');
  const [pygFilter, setPygFilter] = useState('margen_ebitda');

  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('popsySession') || '{}'); } catch { return {}; }
  }, []);
  const district = session.district;

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerente-daily-sales'], queryFn: () => base44.entities.DailySales.list('-date', 5000), staleTime: 3 * 60 * 1000,
  });
  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerente-budgets', now.getMonth(), now.getFullYear()],
    queryFn: () => base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }), staleTime: 10 * 60 * 1000,
  });
  const { data: allPYG = [] } = useQuery({
    queryKey: ['gerente-pyg'], queryFn: () => base44.entities.PYGReport.list('-created_date', 500), staleTime: 10 * 60 * 1000,
  });
  const { data: storeEntities = [] } = useQuery({
    queryKey: ['all-stores'], queryFn: () => base44.entities.Store.list('-created_date', 1000), staleTime: 60 * 60 * 1000,
  });

  const stores = useMemo(() => {
    let s = storeEntities.filter(x => x.is_active !== false);
    if (district) s = s.filter(x => (x.district || '').toUpperCase() === district.toUpperCase());
    return s;
  }, [storeEntities, district]);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysElapsed = now.getDate();
  const daysInMonth = monthEnd.getDate();
  const daysInRange = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);

  const storeData = useMemo(() => {
    const rangeInterval = { start: startDate, end: endDate };
    const salesByCode = {};
    allDailySales.forEach(d => {
      try { if (!isWithinInterval(parseISO(d.date), rangeInterval)) return; } catch { return; }
      const k = (d.store_id || '').trim();
      (salesByCode[k] = salesByCode[k] || []).push(d);
    });
    const monthSalesByCode = {};
    allDailySales.forEach(d => {
      try { if (!isWithinInterval(parseISO(d.date), { start: monthStart, end: now })) return; } catch { return; }
      const k = (d.store_id || '').trim();
      (monthSalesByCode[k] = monthSalesByCode[k] || []).push(d);
    });
    const budgetByCode = {};
    allBudgets.forEach(b => { budgetByCode[(b.store_id || '').trim()] = b; });
    const pygByCode = {};
    allPYG.forEach(p => {
      const k = (p.store_code || '').trim();
      if (!pygByCode[k] || new Date(p.created_date) > new Date(pygByCode[k].created_date)) pygByCode[k] = p;
    });

    return stores.map((store, i) => {
      const code = (store.code || '').trim();
      const rangeArr = salesByCode[code] || [];
      const monthArr = monthSalesByCode[code] || [];
      const rangeSales = rangeArr.reduce((s, d) => s + (d.total_sales || 0), 0);
      const rangeTx = rangeArr.reduce((s, d) => s + (d.total_transactions || 0), 0);
      const monthSales = monthArr.reduce((s, d) => s + (d.total_sales || 0), 0);
      const monthlyBudget = budgetByCode[code]?.sales_budget || 0;
      const avgDailyMonth = daysElapsed > 0 ? monthSales / daysElapsed : 0;
      const projection = monthSales + avgDailyMonth * (daysInMonth - daysElapsed);
      const compliance = monthlyBudget > 0 ? (monthSales / monthlyBudget) * 100 : null;
      const projCompliance = monthlyBudget > 0 ? (projection / monthlyBudget) * 100 : null;
      const avgTicket = rangeTx > 0 ? rangeSales / rangeTx : 0;
      const pyg = pygByCode[code] || null;
      const color = PALETTE[i % PALETTE.length];
      const shortName = store.code || `T${i + 1}`;
      const name = store.name || shortName;
      return { code, name, shortName, rangeSales, rangeTx, monthSales, monthlyBudget, projection, compliance, projCompliance, avgTicket, pyg, color };
    });
  }, [stores, allDailySales, allBudgets, allPYG, startDate, endDate, daysElapsed, daysInMonth]);

  const districtTotals = useMemo(() => {
    const withData = storeData.filter(d => d.rangeSales > 0 || d.monthSales > 0);
    const totalRangeSales = storeData.reduce((s, d) => s + d.rangeSales, 0);
    const totalMonthSales = storeData.reduce((s, d) => s + d.monthSales, 0);
    const totalBudget = storeData.reduce((s, d) => s + d.monthlyBudget, 0);
    const totalProjection = storeData.reduce((s, d) => s + d.projection, 0);
    const totalRangeTx = storeData.reduce((s, d) => s + d.rangeTx, 0);
    const compliance = totalBudget > 0 ? (totalMonthSales / totalBudget) * 100 : null;
    const projCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : null;
    let ebitdaNum = 0, ebitdaDen = 0;
    storeData.forEach(d => { if (d.pyg?.margen_ebitda != null && d.monthSales > 0) { ebitdaNum += d.pyg.margen_ebitda * d.monthSales; ebitdaDen += d.monthSales; } });
    const ebitda = ebitdaDen > 0 ? (ebitdaNum / ebitdaDen) * 100 : null;
    const avgTicket = totalRangeTx > 0 ? totalRangeSales / totalRangeTx : 0;
    return { totalRangeSales, totalMonthSales, totalBudget, totalProjection, totalRangeTx, compliance, projCompliance, ebitda, avgTicket, storesCount: storeData.length, withDataCount: withData.length };
  }, [storeData]);

  /* ═══ Daily trend for district ═══ */
  const dailyTrend = useMemo(() => {
    const byDate = {};
    allDailySales.forEach(d => {
      try { if (!isWithinInterval(parseISO(d.date), { start: startDate, end: endDate })) return; } catch { return; }
      const code = (d.store_id || '').trim();
      if (district) {
        const store = stores.find(s => (s.code || '').trim() === code);
        if (!store) return;
      }
      const dt = d.date;
      if (!byDate[dt]) byDate[dt] = { date: dt, sales: 0, tx: 0 };
      byDate[dt].sales += d.total_sales || 0;
      byDate[dt].tx += d.total_transactions || 0;
    });
    return Object.values(byDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        ...d,
        label: format(parseISO(d.date), 'dd MMM', { locale: es }),
        avgTicket: d.tx > 0 ? d.sales / d.tx : 0,
      }));
  }, [allDailySales, startDate, endDate, district, stores]);

  /* ═══ Store ranking ═══ */
  const storeRanking = useMemo(() => {
    return [...storeData]
      .filter(d => d.monthSales > 0 || d.rangeSales > 0)
      .sort((a, b) => (b.projCompliance ?? 0) - (a.projCompliance ?? 0));
  }, [storeData]);

  const topStores = storeRanking.slice(0, 5);
  const bottomStores = storeRanking.slice(-3).reverse();

  const ventasChartData = useMemo(() => storeData.map(d => {
    let value, color;
    if (ventasTab === 'ventas') { value = d.rangeSales; color = d.color; }
    else if (ventasTab === 'proyeccion') { value = d.projCompliance ?? 0; color = (d.projCompliance ?? 0) >= 100 ? '#10b981' : (d.projCompliance ?? 0) >= 80 ? '#f59e0b' : '#e11d48'; }
    else { value = d.compliance ?? 0; color = (d.compliance ?? 0) >= 100 ? '#10b981' : (d.compliance ?? 0) >= 80 ? '#f59e0b' : '#e11d48'; }
    return { name: d.shortName, value, color };
  }), [storeData, ventasTab]);

  const ventasFmt = ventasTab === 'ventas' ? fmtM : fmtPct;

  const pygMeta = PYG_FILTERS.find(f => f.key === pygFilter) || PYG_FILTERS[0];
  const isGrouped = pygFilter === 'teorico_vs_real';
  const pygChartData = useMemo(() => storeData
    .filter(d => d.pyg && (d.pyg.margen_ebitda != null || d.pyg.cost_teorico != null || d.pyg.cost_real != null || d.pyg.costo_personal != null || d.pyg.gastos_pct_venta != null))
    .map(d => {
      const p = d.pyg || {};
      if (isGrouped) return { name: d.shortName, teorico: +((p.cost_teorico || 0) * 100).toFixed(1), real: +((p.cost_real || 0) * 100).toFixed(1) };
      return { name: d.shortName, value: +((p[pygFilter] || 0) * 100).toFixed(1), color: pygMeta.color };
    }), [storeData, pygFilter, isGrouped, pygMeta]);

  const txChartData = useMemo(() => storeData.map(d => ({
    name: d.shortName, value: Math.round(d.rangeTx / daysInRange), color: d.color,
  })), [storeData, daysInRange]);

  const presets = useMemo(() => [
    { label: 'Mes actual', start: startOfMonth(now), end: now },
    { label: 'Semana actual', start: startOfWeek(now, { weekStartsOn: 1 }), end: now },
    { label: 'Semana anterior', start: subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1), end: endOfWeek(subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1), { weekStartsOn: 1 }) },
    { label: 'Mes anterior', start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
  ], []); // eslint-disable-line

  const isPresetActive = (p) => format(startDate, 'ddMMyyyy') === format(p.start, 'ddMMyyyy') && format(endDate, 'ddMMyyyy') === format(p.end, 'ddMMyyyy');

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(194,24,117,0.07) 0%, rgba(255,255,255,0.94) 60%)',
          backdropFilter: 'blur(40px)', border: '1px solid rgba(194,24,117,0.12)',
          boxShadow: '0 2px 20px rgba(194,24,117,0.07), inset 0 1px 0 rgba(255,255,255,1)',
        }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(194,24,117,0.12)', border: '1px solid rgba(194,24,117,0.18)' }}>
            <Activity style={{ color: '#C21875', width: 16, height: 16 }} />
          </div>
          <div>
            <h2 className="text-[16px] font-black text-slate-700" style={{ letterSpacing: '-0.03em' }}>Distrito · {district || 'Todas'}</h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {storeData.length} tiendas · {format(startDate, 'dd MMM', { locale: es })} – {format(endDate, 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(194,24,117,0.12)' }}>
            {presets.map(p => (
              <button key={p.label} onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: isPresetActive(p) ? 'rgba(194,24,117,0.12)' : 'transparent', color: isPresetActive(p) ? '#C21875' : '#94a3b8' }}>
                {p.label}
              </button>
            ))}
          </div>

          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold rounded-xl h-8"
                style={{ borderColor: 'rgba(194,24,117,0.25)', color: '#C21875' }}>
                <Calendar style={{ width: 12, height: 12 }} />
                {format(startDate, 'dd MMM', { locale: es })} – {format(endDate, 'dd MMM', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <p className="text-[11px] font-bold text-slate-500 mb-2">{pickingEnd ? 'Fecha fin' : 'Fecha inicio'}</p>
              <CalendarComponent mode="single" selected={pickingEnd ? endDate : startDate}
                onSelect={(d) => { if (!d) return; if (!pickingEnd) { setStartDate(d); setPickingEnd(true); } else { setEndDate(d); setPickingEnd(false); setCalOpen(false); } }}
                locale={es} className="rounded-md border" />
            </PopoverContent>
          </Popover>

          <button onClick={() => setGlobalView(g => !g)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={globalView
              ? { background: 'linear-gradient(135deg,#C21875,#e91e8c)', color: '#fff', border: '1px solid rgba(194,24,117,0.3)', boxShadow: '0 4px 14px rgba(194,24,117,0.3)' }
              : { background: 'rgba(255,255,255,0.7)', color: '#C21875', border: '1px solid rgba(194,24,117,0.2)' }}>
            <Globe style={{ width: 13, height: 13 }} />
            {globalView ? 'Global' : 'Por tienda'}
          </button>
        </div>
      </motion.div>

      {/* ═══ KPI HERO ROW ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Ventas del Rango" value={fmtM(districtTotals.totalRangeSales)} sub={`Mes: ${fmtM(districtTotals.totalMonthSales)}`} color="#C21875" icon={DollarSign} delay={0.05} trend={districtTotals.compliance != null ? districtTotals.compliance - 100 : null} />
        <KPICard label="Proyección Cierre" value={fmtM(districtTotals.totalProjection)} sub={districtTotals.projCompliance != null ? `${districtTotals.projCompliance.toFixed(1)}% del PPT` : '—'} color="#10b981" icon={TrendingUp} delay={0.1} trend={districtTotals.projCompliance != null ? districtTotals.projCompliance - 100 : null} />
        <KPICard label="Cumplimiento" value={districtTotals.compliance != null ? `${districtTotals.compliance.toFixed(1)}%` : '—'} sub={`PPT: ${fmtM(districtTotals.totalBudget)}`} color="#0ea5e9" icon={Target} delay={0.15} />
        <KPICard label="EBITDA Distrito" value={districtTotals.ebitda != null ? `${districtTotals.ebitda.toFixed(1)}%` : '—'} sub="Promedio ponderado" color="#8b5cf6" icon={Zap} delay={0.2} />
        <KPICard label="Ticket Promedio" value={fmtM(districtTotals.avgTicket)} sub={`${fmtInt(districtTotals.totalRangeTx)} tx en rango`} color="#f59e0b" icon={Receipt} delay={0.25} />
      </div>

      {/* ═══ DAILY TREND CHART ═══ */}
      <SectionCard icon={TrendingUp} title="Tendencia Diaria del Distrito" subtitle={`Ventas y transacciones · ${dailyTrend.length} días`} color="#C21875" delay={0.15}>
        {dailyTrend.length < 2 ? (
          <EmptyState msg="Sin suficientes días con datos para mostrar tendencia" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C21875" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#C21875" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtM} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip fmt={fmtCOP} />} cursor={{ stroke: 'rgba(194,24,117,0.2)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="sales" name="Ventas" stroke="#C21875" strokeWidth={2.5} fill="url(#gradSales)"
                dot={{ r: 3, fill: '#C21875', stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* ═══ TWO-COLUMN: Sales chart + Ranking ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by store */}
        <div className="lg:col-span-2">
          <SectionCard icon={DollarSign} title="Ventas, Proyección y Cumplimiento" subtitle={globalView ? 'Total distrito' : 'Por tienda'} color="#C21875" delay={0.2}
            right={!globalView && (
              <div className="flex items-center gap-1.5">
                {[{ k: 'ventas', l: 'Ventas' }, { k: 'proyeccion', l: 'Proy.' }, { k: 'cumplimiento', l: 'Cumpl.' }].map(t => (
                  <button key={t.k} onClick={() => setVentasTab(t.k)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                    style={{
                      background: ventasTab === t.k ? 'rgba(194,24,117,0.12)' : 'transparent',
                      color: ventasTab === t.k ? '#C21875' : '#94a3b8',
                      border: ventasTab === t.k ? '1px solid rgba(194,24,117,0.2)' : '1px solid transparent',
                    }}>
                    {t.l}
                  </button>
                ))}
              </div>
            )}>
            {globalView ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(194,24,117,0.12)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Ventas (rango)</p>
                  <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#C21875', letterSpacing: '-0.03em' }}>{fmtM(districtTotals.totalRangeSales)}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Mes: {fmtM(districtTotals.totalMonthSales)}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Proyección mes</p>
                  <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#10b981', letterSpacing: '-0.03em' }}>{fmtM(districtTotals.totalProjection)}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{districtTotals.projCompliance != null ? `${districtTotals.projCompliance.toFixed(1)}% del PPT` : '—'}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(14,165,233,0.12)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Cumplimiento</p>
                  <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#0ea5e9', letterSpacing: '-0.03em' }}>{districtTotals.compliance != null ? `${districtTotals.compliance.toFixed(1)}%` : '—'}</p>
                  <p className="text-[9px] text-slate-400 mt-1">PPT {fmtM(districtTotals.totalBudget)}</p>
                </div>
              </div>
            ) : ventasChartData.every(d => d.value === 0) ? (
              <EmptyState msg="Sin ventas registradas en el período" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ventasChartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={ventasFmt} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                  {(ventasTab === 'proyeccion' || ventasTab === 'cumplimiento') && <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />}
                  <Tooltip content={<ChartTooltip fmt={ventasFmt} />} cursor={{ fill: 'rgba(194,24,117,0.04)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {ventasChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="top" formatter={ventasFmt} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        {/* Store Ranking */}
        <SectionCard icon={Trophy} title="Ranking de Tiendas" subtitle="Por proyección de cumplimiento" color="#f59e0b" delay={0.25}>
          {storeRanking.length === 0 ? (
            <EmptyState msg="Sin datos de tiendas" />
          ) : (
            <div className="space-y-0.5">
              {topStores.map((d, i) => (
                <RankingRow key={d.code} rank={i + 1} name={d.name} value={d.monthSales} pct={d.projCompliance ?? 0} color={d.color} isTop />
              ))}
              {bottomStores.length > 0 && topStores.length > 0 && (
                <div className="py-1.5 px-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-300">Necesitan atención</p>
                </div>
              )}
              {bottomStores.filter(b => !topStores.includes(b)).map((d, i) => (
                <RankingRow key={d.code} rank={storeRanking.indexOf(d) + 1} name={d.name} value={d.monthSales} pct={d.projCompliance ?? 0} color="#f43f5e" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══ TWO-COLUMN: EBITDA + Transactions ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* EBITDA & Costs */}
        <SectionCard icon={DollarSign} title="EBITDA & Costos" subtitle={globalView ? 'Distrito' : 'Por tienda'} color="#10b981" delay={0.3}
          right={
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {PYG_FILTERS.map(f => (
                <button key={f.key} onClick={() => setPygFilter(f.key)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                  style={{
                    background: pygFilter === f.key ? `${f.color}14` : 'transparent',
                    color: pygFilter === f.key ? f.color : '#94a3b8',
                    border: pygFilter === f.key ? `1px solid ${f.color}28` : '1px solid transparent',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          }>
          {globalView ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">EBITDA</p>
                <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#10b981', letterSpacing: '-0.03em' }}>{districtTotals.ebitda != null ? `${districtTotals.ebitda.toFixed(1)}%` : '—'}</p>
                <p className="text-[9px] text-slate-400 mt-1">Promedio ponderado</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Tiendas con P&G</p>
                <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#6366f1', letterSpacing: '-0.03em' }}>{storeData.filter(d => d.pyg).length}/{storeData.length}</p>
                <p className="text-[9px] text-slate-400 mt-1">Reportes cargados</p>
              </div>
              {(() => {
                const w = storeData.filter(d => d.pyg?.margen_ebitda != null).sort((a, b) => b.pyg.margen_ebitda - a.pyg.margen_ebitda);
                return (
                  <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Mejor EBITDA</p>
                    <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#f59e0b', letterSpacing: '-0.03em' }}>{w[0] ? `${(w[0].pyg.margen_ebitda * 100).toFixed(1)}%` : '—'}</p>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">{w[0] ? w[0].name : '—'}</p>
                  </div>
                );
              })()}
            </div>
          ) : pygChartData.length === 0 ? (
            <EmptyState msg="Sin reportes P&G cargados" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pygChartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<ChartTooltip fmt={(v) => `${v}%`} />} cursor={{ fill: 'rgba(16,185,129,0.04)' }} />
                {isGrouped ? (
                  <>
                    <Bar dataKey="teorico" fill="#C21875" radius={[5, 5, 0, 0]} maxBarSize={26} name="Teórico" />
                    <Bar dataKey="real" fill="#e91e8c" radius={[5, 5, 0, 0]} maxBarSize={26} name="Real" />
                  </>
                ) : (
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} name={pygMeta.label}>
                    {pygChartData.map((e, i) => <Cell key={i} fill={pygMeta.color} />)}
                    <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Transactions */}
        <SectionCard icon={CreditCard} title="Transacciones & Ticket Promedio" subtitle={globalView ? 'Total distrito / día' : 'Por tienda / día'} color="#0ea5e9" delay={0.35}>
          {globalView ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(14,165,233,0.12)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Transacciones (rango)</p>
                <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#0ea5e9', letterSpacing: '-0.03em' }}>{fmtInt(districtTotals.totalRangeTx)}</p>
                <p className="text-[9px] text-slate-400 mt-1">{daysInRange} días</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Promedio diario</p>
                <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#6366f1', letterSpacing: '-0.03em' }}>{fmtInt(districtTotals.totalRangeTx / daysInRange)}</p>
                <p className="text-[9px] text-slate-400 mt-1">Transacciones / día</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.95) 60%)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Tiendas con data</p>
                <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#10b981', letterSpacing: '-0.03em' }}>{districtTotals.withDataCount}/{districtTotals.storesCount}</p>
                <p className="text-[9px] text-slate-400 mt-1">Activas</p>
              </div>
            </div>
          ) : txChartData.every(d => d.value === 0) ? (
            <EmptyState msg="Sin transacciones registradas en el período" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={txChartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtInt} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<ChartTooltip fmt={fmtInt} />} cursor={{ fill: 'rgba(14,165,233,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} name="Tx / día">
                  {txChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="top" formatter={fmtInt} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </div>
  );
}