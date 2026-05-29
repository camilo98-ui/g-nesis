import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, LineChart, Line, ReferenceLine
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar, TrendingUp, DollarSign, Sparkles, ShoppingBag,
  CreditCard, Activity, Target, Package, ChevronDown
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

/* ── formatters ── */
const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtPct = (n) => (n == null || isNaN(n) ? '—' : `${n.toFixed(1)}%`);

/* prettier palette — pink-first gradient */
const PALETTE = ['#C21875', '#e91e8c', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const PYG_METRICS = [
  { key: 'margen_ebitda', label: 'EBITDA', color: '#10b981' },
  { key: 'cost_real', label: 'Costo Real', color: '#C21875' },
  { key: 'cost_teorico', label: 'Costo Teórico', color: '#e91e8c' },
  { key: 'costo_personal', label: 'Personal', color: '#6366f1' },
  { key: 'arriendos', label: 'Arriendos', color: '#f59e0b' },
  { key: 'administracion', label: 'Administración', color: '#0ea5e9' },
  { key: 'servicios_publicos', label: 'Servicios', color: '#8b5cf6' },
  { key: 'impuestos', label: 'Impuestos', color: '#f97316' },
  { key: 'gastos_pct_venta', label: 'Gastos % Venta', color: '#06b6d4' },
];

/* ── sub-components ── */
function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-medium shadow-xl"
      style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.18)', backdropFilter: 'blur(20px)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill || p.stroke || '#C21875' }}>
          {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, color, right, children }) {
  const c = color || '#C21875';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
      }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${c}14`, border: `1px solid ${c}22` }}>
          <Icon style={{ color: c, width: 13, height: 13 }} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-black text-slate-700" style={{ letterSpacing: '-0.02em' }}>{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

function Tab({ label, active, onClick, color }) {
  const c = color || '#C21875';
  return (
    <button onClick={onClick} className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
      style={{
        background: active ? `${c}14` : 'transparent',
        color: active ? c : '#94a3b8',
        border: active ? `1px solid ${c}28` : '1px solid transparent',
      }}>
      {label}
    </button>
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

function MiniBarChart({ data, height, fmt, accentColor }) {
  if (!data?.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={height || 180}>
      <BarChart data={data} margin={{ top: 14, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt || fmtM} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
        <Tooltip content={<ChartTooltip fmt={fmt || fmtM} />} cursor={{ fill: 'rgba(194,24,117,0.04)' }} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={52}>
          {data.map((e, i) => <Cell key={i} fill={e.color || PALETTE[i % PALETTE.length]} />)}
          <LabelList dataKey="value" position="top" formatter={fmt || fmtM} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export default function GerenteDashboard() {
  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(now);
  const [calOpen, setCalOpen] = useState(false);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [ventasTab, setVentasTab] = useState('ventas');
  const [pygMetric, setPygMetric] = useState('margen_ebitda');
  const [pygOpen, setPygOpen] = useState(false);

  /* ── queries ── */
  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerente-daily-sales'],
    queryFn: () => base44.entities.DailySales.list('-date', 2000),
    staleTime: 3 * 60 * 1000,
  });
  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerente-budgets', now.getMonth(), now.getFullYear()],
    queryFn: () => base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }),
    staleTime: 10 * 60 * 1000,
  });
  const { data: allPYG = [] } = useQuery({
    queryKey: ['gerente-pyg'],
    queryFn: () => base44.entities.PYGReport.list('-created_date', 500),
    staleTime: 10 * 60 * 1000,
  });
  const { data: allSalesReports = [] } = useQuery({
    queryKey: ['gerente-sales-reports'],
    queryFn: () => base44.entities.SalesReport.list('-created_date', 2000),
    staleTime: 10 * 60 * 1000,
  });
  const { data: storeEntities = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list(),
    staleTime: 60 * 60 * 1000,
  });

  /* ── per-store computed data ── */
  const storeData = useMemo(() => {
    const activeStores = storeEntities.filter((s) => s.is_active !== false);
    if (!activeStores.length) return [];

    const interval = { start: startDate, end: endDate };

    // DailySales.store_id stores the store CODE string (e.g. "BTA 56"), not UUID
    const salesByCode = {};
    allDailySales.forEach((d) => {
      try { if (!isWithinInterval(parseISO(d.date), interval)) return; } catch { return; }
      const k = (d.store_id || '').trim();
      if (!salesByCode[k]) salesByCode[k] = [];
      salesByCode[k].push(d);
    });

    // budget — may use UUID or code; build lookup for both
    const budgetByStoreId = {};
    const budgetByCode = {};
    allBudgets.forEach((b) => {
      budgetByStoreId[b.store_id] = b;
      budgetByCode[(b.store_id || '').trim()] = b;
    });

    // PYG by store_code (latest per store)
    const pygByCode = {};
    allPYG.forEach((p) => {
      const k = (p.store_code || '').trim();
      if (!pygByCode[k] || new Date(p.created_date) > new Date(pygByCode[k].created_date)) pygByCode[k] = p;
    });

    // products by store_code — use `product` field, level=product, total_sales field
    const productsByCode = {};
    allSalesReports.forEach((r) => {
      if (!r.store_code || r.level !== 'product' || !r.product) return;
      const k = r.store_code.trim();
      if (!productsByCode[k]) productsByCode[k] = {};
      productsByCode[k][r.product] = (productsByCode[k][r.product] || 0) + (r.total_sales || 0);
    });

    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();

    return activeStores.map((store, i) => {
      const storeSales = salesByCode[(store.code || '').trim()] || salesByCode[store.id] || [];
      const totalSales = storeSales.reduce((s, d) => s + (d.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((s, d) => s + (d.total_tickets || 0), 0);
      const totalTx = storeSales.reduce((s, d) => s + (d.total_transactions || 0), 0);
      const totalSuggested = storeSales.reduce((s, d) => s + (d.total_suggested || 0), 0);
      const totalTakeaway = storeSales.reduce((s, d) => s + (d.total_takeaway || 0), 0);

      const budget = budgetByStoreId[store.id] || budgetByCode[(store.code || '').trim()];
      const monthlyBudget = budget?.sales_budget || 0;
      const budgetUntilToday = monthlyBudget > 0 ? (monthlyBudget / daysInMonth) * dayOfMonth : 0;
      const gap = budgetUntilToday > 0 ? totalSales - budgetUntilToday : null;
      const projPct = budgetUntilToday > 0 ? (totalSales / budgetUntilToday) * 100 : null;
      const pptCompliancePct = monthlyBudget > 0 ? (totalSales / monthlyBudget) * 100 : null;
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;

      const prods = productsByCode[(store.code || '').trim()] || {};
      const top3 = Object.entries(prods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => ({ name, amount }));

      const pyg = pygByCode[(store.code || '').trim()] || null;
      const color = PALETTE[i % PALETTE.length];
      const shortName = store.code || `T${i + 1}`;

      return {
        store, totalSales, totalTickets, totalTx, totalSuggested, totalTakeaway,
        monthlyBudget, budgetUntilToday, gap, projPct, pptCompliancePct,
        avgTicket, top3, pyg, color, shortName,
      };
    });
  }, [storeEntities, allDailySales, allBudgets, allPYG, allSalesReports, startDate, endDate]);

  /* ── chart datasets ── */
  const ventasChartData = useMemo(() => storeData.map((d) => {
    let value, color;
    if (ventasTab === 'ventas') { value = d.totalSales; color = d.color; }
    else if (ventasTab === 'proyeccion') { value = d.projPct ?? 0; color = (d.projPct ?? 0) >= 100 ? '#10b981' : (d.projPct ?? 0) >= 80 ? '#f59e0b' : '#e11d48'; }
    else if (ventasTab === 'brecha') { value = d.gap ?? 0; color = (d.gap ?? 0) >= 0 ? '#10b981' : '#e11d48'; }
    else { value = d.pptCompliancePct ?? 0; color = (d.pptCompliancePct ?? 0) >= 100 ? '#10b981' : '#C21875'; }
    return { name: d.shortName, value, color };
  }), [storeData, ventasTab]);

  const pygMeta = PYG_METRICS.find((m) => m.key === pygMetric) || PYG_METRICS[0];
  const pygChartData = useMemo(() =>
    storeData.filter((d) => d.pyg?.[pygMetric] != null).map((d) => ({
      name: d.shortName,
      value: parseFloat(((d.pyg[pygMetric] || 0) * 100).toFixed(1)),
      color: pygMeta.color,
    })), [storeData, pygMetric]);

  const ticketData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: Math.round(d.avgTicket), color: d.color })), [storeData]);
  const txData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: d.totalTx, color: d.color })), [storeData]);
  const sugData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: d.totalSuggested, color: d.color })), [storeData]);
  const takeawayData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: d.totalTakeaway, color: d.color })), [storeData]);

  // Products: use `product` and `total_sales` — aggregate across ALL sales reports in period
  const topProductsData = useMemo(() => {
    const agg = {};
    allSalesReports.forEach((r) => {
      if (r.level !== 'product' || !r.product) return;
      agg[r.product] = (agg[r.product] || 0) + (r.total_sales || 0);
    });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({
      name: name.length > 26 ? name.slice(0, 26) + '…' : name,
      value,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [allSalesReports]);

  // KPI summary row
  const totalVentas = storeData.reduce((s, d) => s + d.totalSales, 0);
  const totalTx = storeData.reduce((s, d) => s + d.totalTx, 0);
  const avgTicketGlobal = storeData.filter((d) => d.totalTickets > 0).reduce((s, d) => s + d.avgTicket, 0) / Math.max(storeData.filter((d) => d.totalTickets > 0).length, 1);
  const storesOnTarget = storeData.filter((d) => (d.projPct ?? 0) >= 100).length;

  const ventasFormatter = ventasTab === 'proyeccion' || ventasTab === 'cumplimiento' ? fmtPct : fmtM;

  return (
    <div className="space-y-5">

      {/* ═══ HEADER BAR ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(194,24,117,0.07) 0%, rgba(255,255,255,0.94) 60%)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(194,24,117,0.12)',
          boxShadow: '0 2px 20px rgba(194,24,117,0.07), inset 0 1px 0 rgba(255,255,255,1)',
        }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(194,24,117,0.12)', border: '1px solid rgba(194,24,117,0.18)' }}>
            <Activity style={{ color: '#C21875', width: 16, height: 16 }} />
          </div>
          <div>
            <h2 className="text-[16px] font-black text-slate-700" style={{ letterSpacing: '-0.03em' }}>Radar de Tiendas</h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {storeData.length} tiendas activas &middot; {format(startDate, 'dd MMM', { locale: es })} – {format(endDate, 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date picker */}
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
              <CalendarComponent mode="single"
                selected={pickingEnd ? endDate : startDate}
                onSelect={(d) => {
                  if (!d) return;
                  if (!pickingEnd) { setStartDate(d); setPickingEnd(true); }
                  else { setEndDate(d); setPickingEnd(false); setCalOpen(false); }
                }}
                locale={es} className="rounded-md border" />
              <div className="flex gap-2 mt-3">
                {[
                  { label: 'Hoy', fn: () => { setStartDate(now); setEndDate(now); } },
                  { label: 'Este mes', fn: () => { setStartDate(startOfMonth(now)); setEndDate(now); } },
                  { label: 'Mes ant.', fn: () => { const p = subMonths(now, 1); setStartDate(startOfMonth(p)); setEndDate(endOfMonth(p)); } },
                ].map(({ label, fn }) => (
                  <Button key={label} size="sm" variant="outline" className="flex-1 text-[10px]"
                    onClick={() => { fn(); setCalOpen(false); setPickingEnd(false); }}>{label}</Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.14)' }}>
            <Sparkles style={{ color: '#C21875', width: 11, height: 11 }} />
            <span className="text-[10px] font-semibold" style={{ color: '#C21875' }}>Nova activo</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ventas Totales', value: fmtM(totalVentas), icon: DollarSign, color: '#C21875', sub: 'Todas las tiendas' },
          { label: 'Transacciones', value: totalTx.toLocaleString('es-CO'), icon: Activity, color: '#6366f1', sub: 'En el período' },
          { label: 'Ticket Promedio', value: fmtM(avgTicketGlobal), icon: CreditCard, color: '#0ea5e9', sub: 'Promedio de tiendas' },
          { label: 'Tiendas en meta', value: `${storesOnTarget}/${storeData.length}`, icon: Target, color: storesOnTarget === storeData.length ? '#10b981' : '#f59e0b', sub: 'vs PPT proyectado' },
        ].map(({ label, value, icon: Icon, color, sub }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${color}0a 0%, rgba(255,255,255,0.95) 60%)`,
              border: `1px solid ${color}18`,
              boxShadow: `0 2px 16px ${color}08`,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
                <Icon style={{ color, width: 11, height: 11 }} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em]">{label}</p>
            </div>
            <p className="text-[20px] font-black text-slate-700 tabular-nums leading-none" style={{ letterSpacing: '-0.03em', color }}>{value}</p>
            <p className="text-[9px] text-slate-400 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ VENTAS / PROYECCION / BRECHA / CUMPLIMIENTO ═══ */}
      <Section icon={TrendingUp} title="Ventas por Tienda" subtitle="Comparativa — selecciona métrica" color="#C21875">
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <Tab label="Ventas" active={ventasTab === 'ventas'} onClick={() => setVentasTab('ventas')} />
          <Tab label="Proyección %" active={ventasTab === 'proyeccion'} onClick={() => setVentasTab('proyeccion')} />
          <Tab label="Brecha $" active={ventasTab === 'brecha'} onClick={() => setVentasTab('brecha')} />
          <Tab label="% PPT" active={ventasTab === 'cumplimiento'} onClick={() => setVentasTab('cumplimiento')} />
        </div>
        {ventasChartData.every((d) => d.value === 0)
          ? <EmptyState msg="Sin ventas registradas en el período — verifica que las tiendas tengan ventas diarias cargadas" />
          : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ventasChartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.07)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={ventasTab === 'proyeccion' || ventasTab === 'cumplimiento' ? (v) => `${v}%` : fmtM}
                  tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                {(ventasTab === 'proyeccion' || ventasTab === 'cumplimiento') &&
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />}
                <Tooltip content={<ChartTooltip fmt={ventasFormatter} />} cursor={{ fill: 'rgba(194,24,117,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {ventasChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="top" formatter={ventasFormatter} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </Section>

      {/* ═══ PYG + TICKET ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* P&G with metric selector */}
        <Section icon={DollarSign} title="P&amp;G por Tienda" subtitle="Selecciona la métrica" color="#10b981"
          right={
            <Popover open={pygOpen} onOpenChange={setPygOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: `${pygMeta.color}12`, color: pygMeta.color, border: `1px solid ${pygMeta.color}20` }}>
                  {pygMeta.label} <ChevronDown style={{ width: 10, height: 10 }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <div className="space-y-0.5">
                  {PYG_METRICS.map((m) => (
                    <button key={m.key} onClick={() => { setPygMetric(m.key); setPygOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: pygMetric === m.key ? `${m.color}12` : 'transparent',
                        color: pygMetric === m.key ? m.color : '#64748b',
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          }>
          {pygChartData.length === 0
            ? <EmptyState msg="Sin reportes PYG cargados" />
            : <MiniBarChart data={pygChartData} fmt={(v) => `${v}%`} />
          }
        </Section>

        <Section icon={CreditCard} title="Ticket Promedio" subtitle="Por tienda en el período" color="#6366f1">
          <MiniBarChart data={ticketData} fmt={fmtM} />
        </Section>
      </div>

      {/* ═══ TRANSACCIONES + SUGERIDOS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={Activity} title="Transacciones" subtitle="Total por tienda en el período" color="#0ea5e9">
          <MiniBarChart data={txData} fmt={(v) => v.toLocaleString('es-CO')} />
        </Section>
        <Section icon={Target} title="Sugeridos Vendidos" subtitle="Producto para llevar — por tienda" color="#C21875">
          <MiniBarChart data={sugData} fmt={(v) => v.toLocaleString('es-CO')} />
        </Section>
      </div>

      {/* ═══ TAKEAWAY + PARTICIPACION ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={ShoppingBag} title="Takeaway / Para llevar" subtitle="Venta de producto para llevar por tienda" color="#f59e0b">
          <MiniBarChart data={takeawayData} fmt={fmtM} />
        </Section>

        <Section icon={Package} title="Top Productos — Participación" subtitle="Top 8 por ventas totales del período" color="#8b5cf6">
          {topProductsData.length === 0
            ? <EmptyState msg="Sin datos de SalesReport con level=product" />
            : (
              <div className="space-y-2">
                {topProductsData.map((p, i) => {
                  const maxVal = topProductsData[0].value || 1;
                  const pct = (p.value / maxVal) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-semibold text-slate-600 truncate flex-1 pr-2">
                          <span className="text-[8px] text-slate-300 mr-1 font-bold">{i + 1}.</span>
                          {p.name}
                        </span>
                        <span className="text-[9.5px] font-bold tabular-nums flex-shrink-0" style={{ color: p.color }}>{fmtM(p.value)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: `${p.color}18` }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </Section>
      </div>

    </div>
  );
}