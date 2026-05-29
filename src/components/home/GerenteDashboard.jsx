import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, TrendingUp, DollarSign, Sparkles, ShoppingBag, CreditCard, Activity } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtPct = (n) => (n == null || isNaN(n) ? '—' : `${n.toFixed(0)}%`);

const STORE_COLORS = ['#C21875', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#e11d48', '#8b5cf6', '#06b6d4'];

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-medium shadow-xl"
      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(194,24,117,0.15)', backdropFilter: 'blur(20px)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || '#C21875' }}>
          {valueFormatter ? valueFormatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, color, children }) {
  const c = color || '#C21875';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
      }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${c}14`, border: `1px solid ${c}20` }}>
          <Icon style={{ color: c, width: 13, height: 13 }} />
        </div>
        <div>
          <p className="text-[13px] font-black text-slate-700" style={{ letterSpacing: '-0.02em' }}>{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all"
      style={{
        background: active ? 'rgba(194,24,117,0.10)' : 'transparent',
        color: active ? '#C21875' : '#94a3b8',
        border: active ? '1px solid rgba(194,24,117,0.2)' : '1px solid transparent',
      }}>
      {label}
    </button>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="flex items-center justify-center py-10 text-[11px] text-slate-400">
      {msg || 'Sin datos para el período'}
    </div>
  );
}

export default function GerenteDashboard() {
  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(now);
  const [calOpen, setCalOpen] = useState(false);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [ventasTab, setVentasTab] = useState('ventas');

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerente-daily-sales'],
    queryFn: () => base44.entities.DailySales.list('-date', 1000),
    staleTime: 5 * 60 * 1000,
  });
  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerente-budgets', now.getMonth(), now.getFullYear()],
    queryFn: () => base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }),
    staleTime: 10 * 60 * 1000,
  });
  const { data: allPYG = [] } = useQuery({
    queryKey: ['gerente-pyg'],
    queryFn: () => base44.entities.PYGReport.list('-created_date', 200),
    staleTime: 10 * 60 * 1000,
  });
  const { data: allSalesReports = [] } = useQuery({
    queryKey: ['gerente-sales-reports'],
    queryFn: () => base44.entities.SalesReport.list('-created_date', 1000),
    staleTime: 10 * 60 * 1000,
  });
  const { data: storeEntities = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list(),
    staleTime: 60 * 60 * 1000,
  });

  const storeData = useMemo(() => {
    const activeStores = storeEntities.filter((s) => s.is_active !== false);
    if (!activeStores.length) return [];
    const interval = { start: startDate, end: endDate };
    const salesByStore = {};
    allDailySales.forEach((d) => {
      try { if (!isWithinInterval(parseISO(d.date), interval)) return; } catch { return; }
      if (!salesByStore[d.store_id]) salesByStore[d.store_id] = [];
      salesByStore[d.store_id].push(d);
    });
    const budgetByStore = {};
    allBudgets.forEach((b) => { budgetByStore[b.store_id] = b; });
    const pygByStore = {};
    allPYG.forEach((p) => {
      const key = p.store_code;
      if (!pygByStore[key] || new Date(p.created_date) > new Date(pygByStore[key].created_date)) pygByStore[key] = p;
    });
    const productsByStore = {};
    allSalesReports.forEach((r) => {
      if (!r.store_code || !r.product_name) return;
      if (!productsByStore[r.store_code]) productsByStore[r.store_code] = {};
      productsByStore[r.store_code][r.product_name] = (productsByStore[r.store_code][r.product_name] || 0) + (r.sales_amount || 0);
    });
    const dayOfMonth = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    return activeStores.map((store, i) => {
      const storeSales = salesByStore[store.id] || [];
      const totalSales = storeSales.reduce((s, d) => s + (d.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((s, d) => s + (d.total_tickets || 0), 0);
      const totalTx = storeSales.reduce((s, d) => s + (d.total_transactions || 0), 0);
      const budget = budgetByStore[store.id];
      const monthlyBudget = budget?.sales_budget || 0;
      const budgetUntilToday = monthlyBudget > 0 ? (monthlyBudget / daysInMonth) * dayOfMonth : 0;
      const gap = budgetUntilToday > 0 ? totalSales - budgetUntilToday : null;
      const projPct = budgetUntilToday > 0 ? (totalSales / budgetUntilToday) * 100 : null;
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
      const prods = productsByStore[store.code] || {};
      const top3 = Object.entries(prods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => ({ name, amount }));
      const pyg = pygByStore[store.code] || null;
      const color = STORE_COLORS[i % STORE_COLORS.length];
      const shortName = store.code || store.name?.slice(0, 8) || `T${i + 1}`;
      return { store, totalSales, totalTickets, totalTx, monthlyBudget, budgetUntilToday, gap, projPct, avgTicket, top3, pyg, color, shortName };
    });
  }, [storeEntities, allDailySales, allBudgets, allPYG, allSalesReports, startDate, endDate]);

  const ventasChartData = useMemo(() => storeData.map((d) => ({
    name: d.shortName,
    value: ventasTab === 'ventas' ? d.totalSales : ventasTab === 'proyeccion' ? (d.projPct ?? 0) : (d.gap ?? 0),
    color: ventasTab === 'brecha' ? (d.gap >= 0 ? '#10b981' : '#e11d48')
      : ventasTab === 'proyeccion' ? ((d.projPct ?? 0) >= 100 ? '#10b981' : (d.projPct ?? 0) >= 80 ? '#f59e0b' : '#e11d48')
      : d.color,
  })), [storeData, ventasTab]);

  const pygChartData = useMemo(() =>
    storeData.filter((d) => d.pyg?.margen_ebitda != null).map((d) => ({
      name: d.shortName,
      value: parseFloat((d.pyg.margen_ebitda * 100).toFixed(1)),
      color: d.pyg.margen_ebitda > 0.15 ? '#10b981' : d.pyg.margen_ebitda > 0.05 ? '#f59e0b' : '#e11d48',
    })), [storeData]);

  const ticketChartData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: Math.round(d.avgTicket), color: d.color })), [storeData]);
  const txChartData = useMemo(() => storeData.map((d) => ({ name: d.shortName, value: d.totalTx, color: d.color })), [storeData]);

  const topProductsData = useMemo(() => {
    const agg = {};
    allSalesReports.forEach((r) => { if (!r.product_name) return; agg[r.product_name] = (agg[r.product_name] || 0) + (r.sales_amount || 0); });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({
      name: name.length > 24 ? name.slice(0, 24) + '…' : name,
      value,
      color: STORE_COLORS[i % STORE_COLORS.length],
    }));
  }, [allSalesReports]);

  const ventasFormatter = ventasTab === 'proyeccion' ? fmtPct : fmtM;
  const noPYGMsg = 'Sin reportes PYG cargados';

  return (
    <div className="space-y-5">

      {/* HEADER + CALENDAR */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
        }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(194,24,117,0.10)', border: '1px solid rgba(194,24,117,0.15)' }}>
            <Activity style={{ color: '#C21875', width: 15, height: 15 }} />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-slate-700" style={{ letterSpacing: '-0.03em' }}>Rendimiento de Tiendas</h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {storeData.length} tiendas &middot; {format(startDate, 'dd MMM', { locale: es })} – {format(endDate, 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-[11px] font-semibold border-rose-200 hover:border-rose-400 rounded-xl">
              <Calendar style={{ width: 13, height: 13, color: '#C21875' }} />
              {format(startDate, 'dd MMM', { locale: es })} {'->'} {format(endDate, 'dd MMM', { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <p className="text-[11px] font-bold text-slate-500 mb-2">{pickingEnd ? 'Fecha fin' : 'Fecha inicio'}</p>
            <CalendarComponent
              mode="single"
              selected={pickingEnd ? endDate : startDate}
              onSelect={(d) => {
                if (!d) return;
                if (!pickingEnd) { setStartDate(d); setPickingEnd(true); }
                else { setEndDate(d); setPickingEnd(false); setCalOpen(false); }
              }}
              locale={es}
              className="rounded-md border"
            />
            <div className="flex gap-2 mt-3">
              {[
                { label: 'Hoy', fn: () => { setStartDate(now); setEndDate(now); } },
                { label: 'Este mes', fn: () => { setStartDate(startOfMonth(now)); setEndDate(now); } },
                { label: 'Mes ant.', fn: () => { const p = subMonths(now, 1); setStartDate(startOfMonth(p)); setEndDate(endOfMonth(p)); } },
              ].map(({ label, fn }) => (
                <Button key={label} size="sm" variant="outline" className="flex-1 text-[10px]"
                  onClick={() => { fn(); setCalOpen(false); setPickingEnd(false); }}>
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(194,24,117,0.06)', border: '1px solid rgba(194,24,117,0.12)' }}>
          <Sparkles style={{ color: '#C21875', width: 11, height: 11 }} />
          <span className="text-[10px] font-semibold" style={{ color: '#C21875' }}>Nova activo</span>
        </div>
      </motion.div>

      {/* VENTAS / PROYECCION / BRECHA */}
      <Section icon={TrendingUp} title="Ventas por Tienda" subtitle="Comparativa entre tiendas" color="#C21875">
        <div className="flex items-center gap-1.5 mb-4">
          <Tab label="Ventas" active={ventasTab === 'ventas'} onClick={() => setVentasTab('ventas')} />
          <Tab label="Proyeccion %" active={ventasTab === 'proyeccion'} onClick={() => setVentasTab('proyeccion')} />
          <Tab label="Brecha" active={ventasTab === 'brecha'} onClick={() => setVentasTab('brecha')} />
        </div>
        {ventasChartData.length === 0
          ? <EmptyState />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasChartData} margin={{ top: 14, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={ventasTab === 'proyeccion' ? (v) => `${v}%` : fmtM} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip valueFormatter={ventasFormatter} />} cursor={{ fill: 'rgba(194,24,117,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {ventasChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="top" formatter={ventasFormatter} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </Section>

      {/* PYG + TICKET */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={DollarSign} title="P&amp;G · EBITDA por tienda" subtitle="Ultimo reporte cargado" color="#10b981">
          {pygChartData.length === 0
            ? <EmptyState msg={noPYGMsg} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={pygChartData} margin={{ top: 14, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} cursor={{ fill: 'rgba(16,185,129,0.04)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {pygChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Section>

        <Section icon={CreditCard} title="Ticket Promedio" subtitle="Por tienda en el periodo" color="#6366f1">
          {ticketChartData.every((d) => d.value === 0)
            ? <EmptyState />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ticketChartData} margin={{ top: 14, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtM} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip content={<ChartTooltip valueFormatter={fmtM} />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {ticketChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="top" formatter={fmtM} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Section>
      </div>

      {/* TRANSACCIONES + PARTICIPACION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={Activity} title="Transacciones" subtitle="Total por tienda en el periodo" color="#0ea5e9">
          {txChartData.every((d) => d.value === 0)
            ? <EmptyState />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={txChartData} margin={{ top: 14, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => v.toLocaleString('es-CO')} />} cursor={{ fill: 'rgba(14,165,233,0.04)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {txChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="top" style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Section>

        <Section icon={ShoppingBag} title="Participacion de Productos" subtitle="Top 8 por ventas totales" color="#f59e0b">
          {topProductsData.length === 0
            ? <EmptyState msg="Sin datos de productos" />
            : (
              <div className="space-y-2.5">
                {topProductsData.map((p, i) => {
                  const maxVal = topProductsData[0].value || 1;
                  const pct = (p.value / maxVal) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-semibold text-slate-600 truncate flex-1 pr-2">
                          <span className="text-[9px] text-slate-300 mr-1">{i + 1}.</span>
                          {p.name}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color: p.color }}>{fmtM(p.value)}</span>
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