import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Star,
  ChevronDown, ChevronRight, BarChart3, Target, Zap, Info } from
'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Label } from
'recharts';
import { STORES } from '@/components/StoreSelector';

const fmt = (v) => '$' + Math.round(v || 0).toLocaleString('es-CO');
const fmtPct = (v) => (v || 0).toFixed(2) + '%';

function extractStoreCode(sid) {
  if (!sid) return null;
  const m = sid.toUpperCase().match(/(BTA\s*\d+|TUNJA\s*\d+)/);
  return m ? m[1].replace(/\s+/, ' ') : null;
}

// Classify product impact on ticket
function classifyImpact(participation, venta, avgTicketRatio) {
  if (participation > 10 && avgTicketRatio > 1.1) return { label: 'Motor', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: '🚀' };
  if (participation > 5 && avgTicketRatio > 1.0) return { label: 'Impulsor', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '⬆️' };
  if (participation > 10 && avgTicketRatio < 0.9) return { label: 'Volumen Bajo Valor', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: '⚠️' };
  if (participation < 2 && avgTicketRatio > 1.2) return { label: 'Premium Dormido', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: '💎' };
  if (participation < 1) return { label: 'Sin Tracción', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: '📉' };
  return { label: 'Estable', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: '➡️' };
}

export default function ProductTicketAnalysis({ storeId }) {
  const [selectedDept, setSelectedDept] = useState('all');
  const [sortBy, setSortBy] = useState('participation');
  const [expandedRow, setExpandedRow] = useState(null);

  const storeCode = useMemo(() => extractStoreCode(storeId), [storeId]);

  // Sales reports (participation data)
  const { data: salesReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['salesReport', storeCode],
    queryFn: async () => {
      if (!storeCode) return [];
      const all = await base44.entities.SalesReport.filter({ store_code: storeCode });
      if (!all.length) return [];
      const latestUploadedAt = all.reduce((max, r) => r.uploaded_at > max ? r.uploaded_at : max, '');
      const latestReportId = all.find((r) => r.uploaded_at === latestUploadedAt)?.report_id;
      return latestReportId ? all.filter((r) => r.report_id === latestReportId) : all;
    },
    enabled: !!storeCode
  });

  // Daily sales for ticket avg
  const { data: dailySales = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['dailySalesForStore', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Shift records for per-cashier ticket data
  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecordsForStore', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const isLoading = loadingReports || loadingDaily;

  // Compute global ticket average from shifts
  const globalTicketAvg = useMemo(() => {
    const totalSales = shiftRecords.reduce((s, r) => s + (r.sales || 0), 0);
    const totalTickets = shiftRecords.reduce((s, r) => s + (r.tickets || 0), 0);
    return totalTickets > 0 ? totalSales / totalTickets : 0;
  }, [shiftRecords]);

  // Compute monthly avg ticket from daily sales
  const dailyTicketAvg = useMemo(() => {
    const totalSales = dailySales.reduce((s, r) => s + (r.total_sales || 0), 0);
    const totalTickets = dailySales.reduce((s, r) => s + (r.total_tickets || 0), 0);
    return totalTickets > 0 ? totalSales / totalTickets : 0;
  }, [dailySales]);

  const effectiveTicketAvg = globalTicketAvg || dailyTicketAvg;

  // Build product analytics
  const { products, departments, totals } = useMemo(() => {
    if (!salesReports.length) return { products: [], departments: [], totals: {} };

    const totalStoreVenta = salesReports.reduce((s, r) => s + (r.total_sales || 0), 0);

    const productMap = {};
    salesReports.forEach((r) => {
      const key = r.product || r.section || '';
      if (!key) return;
      if (!productMap[key]) {
        productMap[key] = {
          product: key,
          department: r.department || 'Sin Departamento',
          section: r.section || '',
          totalSales: 0,
          participation: 0,
          rawParticipation: r.participation || 0
        };
      }
      productMap[key].totalSales += r.total_sales || 0;
    });

    const productsArr = Object.values(productMap).map((p) => {
      const participation = totalStoreVenta > 0 ? p.totalSales / totalStoreVenta * 100 : p.rawParticipation * 100;
      // Estimate ticket impact: products with higher sales per record vs avg
      const estimatedTicketRatio = effectiveTicketAvg > 0 ?
      p.totalSales / Math.max(1, participation) / (effectiveTicketAvg / 10) :
      1;
      const impact = classifyImpact(participation, p.totalSales, Math.min(2, estimatedTicketRatio));
      return {
        ...p,
        participation,
        ticketRatio: estimatedTicketRatio,
        impact
      };
    }).filter((p) => p.participation > 0);

    const depts = [...new Set(productsArr.map((p) => p.department))];
    const topSales = productsArr.reduce((max, p) => Math.max(max, p.totalSales), 0);

    return {
      products: productsArr,
      departments: depts,
      totals: { totalStoreVenta, topSales }
    };
  }, [salesReports, effectiveTicketAvg]);

  // Filter + sort
  const filtered = useMemo(() => {
    let arr = selectedDept === 'all' ? products : products.filter((p) => p.department === selectedDept);
    return [...arr].sort((a, b) => {
      if (sortBy === 'participation') return b.participation - a.participation;
      if (sortBy === 'sales') return b.totalSales - a.totalSales;
      if (sortBy === 'impact') return b.ticketRatio - a.ticketRatio;
      return 0;
    });
  }, [products, selectedDept, sortBy]);

  // Chart data: scatter participation vs ticket impact
  const scatterData = useMemo(() => filtered.slice(0, 30).map((p) => ({
    x: parseFloat(p.participation.toFixed(2)),
    y: parseFloat(Math.min(2, p.ticketRatio).toFixed(2)),
    name: p.product,
    sales: p.totalSales,
    label: p.impact.label,
    fill: p.impact.label === 'Motor' ? '#10b981' :
    p.impact.label === 'Impulsor' ? '#3b82f6' :
    p.impact.label === 'Premium Dormido' ? '#8b5cf6' :
    p.impact.label === 'Volumen Bajo Valor' ? '#f59e0b' :
    p.impact.label === 'Sin Tracción' ? '#ef4444' : '#94a3b8'
  })), [filtered]);

  // Top 8 products by sales for chart
  const topProducts = useMemo(() =>
  [...products].sort((a, b) => b.totalSales - a.totalSales).slice(0, 8),
  [products]
  );

  // Department aggregation
  const deptData = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const d = p.department || 'Sin Dpto';
      if (!map[d]) map[d] = { dept: d, totalSales: 0, participation: 0, units: 0 };
      map[d].totalSales += p.totalSales;
      map[d].units += salesReports.filter((r) => r.department === d).reduce((s, r) => s + (r.quantity || r.units || 0), 0);
    });
    const total = Object.values(map).reduce((s, d) => s + d.totalSales, 0);
    return Object.values(map).map((d) => ({
      ...d,
      participation: total > 0 ? d.totalSales / total * 100 : 0
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [products, salesReports]);

  // Summary counts
  const impactSummary = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.impact.label] = (counts[p.impact.label] || 0) + 1;
    });
    return counts;
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>);

  }

  if (!salesReports.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No hay reporte de participación cargado</p>
        <p className="text-sm mt-1">Sube el reporte desde la sección de Reportes</p>
      </div>);

  }

  return (
    <div className="space-y-5">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Productos Analizados</p>
          <p className="text-2xl font-bold text-slate-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Ticket Promedio Tienda</p>
          <p className="text-2xl font-bold text-slate-800">{fmt(effectiveTicketAvg)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 shadow-sm">
          <p className="text-xs text-emerald-600 mb-1">Motores de Ticket</p>
          <p className="text-2xl font-bold text-emerald-700">{(impactSummary['Motor'] || 0) + (impactSummary['Impulsor'] || 0)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 shadow-sm">
          <p className="text-xs text-amber-600 mb-1">Requieren Atención</p>
          <p className="text-2xl font-bold text-amber-700">{(impactSummary['Sin Tracción'] || 0) + (impactSummary['Volumen Bajo Valor'] || 0)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Chart 1: Participación y Venta Bruta por Departamento */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              Participación por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 9 }} />
                <YAxis dataKey="dept" type="category" width={90} tick={{ fontSize: 9 }} />
                <RechartsTooltip
                  formatter={(v, name) => name === 'participation' ? [`${v.toFixed(2)}%`, 'Participación'] : [fmt(v), 'Venta Bruta']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                
                <Bar dataKey="participation" name="participation" radius={[0, 4, 4, 0]} fill="#C21875">
                  {deptData.map((d, i) =>
                  <Cell key={i} fill={i === 0 ? '#C21875' : i === 1 ? '#e11d48' : i === 2 ? '#f43f5e' : `rgba(194,24,117,${0.6 - i * 0.08})`} />
                  )}
                  
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Dept summary rows */}
            <div className="mt-2 space-y-1 px-2">
              {deptData.slice(0, 5).map((d, i) =>
              <div key={d.dept} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? '#C21875' : i === 1 ? '#e11d48' : i === 2 ? '#f43f5e' : `rgba(194,24,117,${0.6 - i * 0.08})` }} />
                  <span className="truncate text-slate-600 flex-1">{d.dept}</span>
                  <span className="font-semibold text-rose-500">{d.participation.toFixed(1)}%</span>
                  <span className="text-slate-400">{fmt(d.totalSales)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Top productos por venta bruta */}
        















































        {/* Chart 2: Top productos por venta bruta */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top Productos · Venta Bruta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`} tick={{ fontSize: 9 }} />
                <YAxis dataKey="product" type="category" width={90} tick={{ fontSize: 9 }} />
                <RechartsTooltip
                  formatter={(v) => [fmt(v), 'Venta Bruta']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                
                <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                  {topProducts.map((p, i) =>
                  <Cell key={i} fill={
                  p.impact.label === 'Motor' ? '#10b981' :
                  p.impact.label === 'Impulsor' ? '#3b82f6' :
                  p.impact.label === 'Volumen Bajo Valor' ? '#f59e0b' :
                  p.impact.label === 'Sin Tracción' ? '#ef4444' : '#94a3b8'
                  } />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1 px-2">
              {topProducts.slice(0, 5).map((p, i) =>
              <div key={p.product} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-300 tabular-nums w-4">{i + 1}</span>
                  <span className="truncate text-slate-600 flex-1">{p.product}</span>
                  <span className={`font-semibold ${p.impact.color}`}>{p.impact.icon}</span>
                  <span className="font-medium text-slate-700">{fmt(p.totalSales)}</span>
                  <span className="text-slate-400">{p.participation.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden hidden">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Análisis Cruzado: Producto × Ticket Promedio
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="participation">Por Participación</SelectItem>
                <SelectItem value="sales">Por Ventas</SelectItem>
                <SelectItem value="impact">Por Impacto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white text-xs">
                  <th className="py-2.5 px-3 text-left font-medium w-6">#</th>
                  <th className="py-2.5 px-3 text-left font-medium min-w-[180px]">Producto</th>
                  <th className="py-2.5 px-3 text-left font-medium">Departamento</th>
                  <th className="py-2.5 px-3 text-right font-medium">% Participación</th>
                  <th className="py-2.5 px-3 text-right font-medium">Venta Bruta</th>
                  <th className="py-2.5 px-3 text-right font-medium">Barra Part.</th>
                  <th className="py-2.5 px-3 text-center font-medium">Impacto Ticket</th>
                  <th className="py-2.5 px-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const barWidth = totals.topSales > 0 ? p.totalSales / totals.topSales * 100 : 0;
                  const isTop10 = idx < 10;
                  return (
                    <React.Fragment key={p.product}>
                      <tr
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === p.product ? 'bg-indigo-50/40' : ''}`}
                        onClick={() => setExpandedRow(expandedRow === p.product ? null : p.product)}>
                        
                        <td className="py-2 px-3 text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {expandedRow === p.product ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                            <span className="font-medium text-slate-800 text-xs truncate max-w-[160px]">{p.product}</span>
                            {isTop10 && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-xs text-slate-500 truncate max-w-[120px]">{p.department}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-xs font-bold text-rose-500">{fmtPct(p.participation)}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-xs text-slate-700 font-medium">{fmt(p.totalSales)}</td>
                        <td className="py-2 px-3 w-32">
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
                              style={{ width: `${Math.min(100, barWidth)}%` }} />
                            
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${p.impact.bg} ${p.impact.color}`}>
                            {p.impact.icon} {p.impact.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <ActionRecommendation impact={p.impact.label} />
                        </td>
                      </tr>
                      {expandedRow === p.product &&
                      <tr className="bg-indigo-50/30 border-b border-indigo-100">
                          <td colSpan={8} className="px-10 py-3">
                            <ProductInsight product={p} ticketAvg={effectiveTicketAvg} />
                          </td>
                        </tr>
                      }
                    </React.Fragment>);

                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>);

}

function ActionRecommendation({ impact }) {
  const actions = {
    'Motor': { label: 'Potenciar', color: 'bg-emerald-100 text-emerald-700' },
    'Impulsor': { label: 'Escalar', color: 'bg-blue-100 text-blue-700' },
    'Volumen Bajo Valor': { label: 'Revisar Precio', color: 'bg-amber-100 text-amber-700' },
    'Premium Dormido': { label: 'Visibilizar', color: 'bg-purple-100 text-purple-700' },
    'Sin Tracción': { label: 'Evaluar', color: 'bg-red-100 text-red-700' },
    'Estable': { label: 'Mantener', color: 'bg-slate-100 text-slate-600' }
  };
  const a = actions[impact] || actions['Estable'];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.color}`}>{a.label}</span>);

}

function ProductInsight({ product, ticketAvg }) {
  const insights = {
    'Motor': [
    `Este producto representa el ${product.participation.toFixed(2)}% de la venta total — es un ancla crítica del ticket promedio.`,
    `Priorizar disponibilidad, visibilidad en menú y capacitación activa al equipo para mantener su dominancia.`,
    `Evaluar bundle con productos complementarios para amplificar el valor del ticket aún más.`],

    'Impulsor': [
    `Sólida participación del ${product.participation.toFixed(2)}% con buen ratio de valor.`,
    `Oportunidad de llevarlo al siguiente nivel con sugeridos activos y posicionamiento estratégico en el menú.`,
    `Analizar qué cajeros lo venden más y replicar esas prácticas en todo el equipo.`],

    'Volumen Bajo Valor': [
    `Alta participación pero bajo impacto en ticket promedio — mueve volumen sin mover valor.`,
    `Investigar si el precio es competitivo o si se está vendiendo como "opción económica" por defecto.`,
    `Considerar rediseño de combos que incluyan este producto junto a opciones premium.`],

    'Premium Dormido': [
    `Producto de alto valor potencial pero baja visibilidad (${product.participation.toFixed(2)}% participación).`,
    `Cuando se vende, contribuye positivamente al ticket — el problema es la frecuencia de sugerencia.`,
    `Acción inmediata: incluir en guion de sugeridos y destacar en menú visual.`],

    'Sin Tracción': [
    `Participación menor al 1% — prácticamente invisible en la operación.`,
    `Evaluar si el producto justifica espacio en menú o si debe ser reemplazado.`,
    `Antes de eliminar, prueba de spotlight (destacarlo activamente por 2 semanas) para medir potencial real.`],

    'Estable': [
    `Participación consistente del ${product.participation.toFixed(2)}% — sin oscilaciones significativas.`,
    `No es motor de ticket pero tampoco riesgo. Foco en mantener calidad y consistencia.`]

  };

  const msgs = insights[product.impact.label] || insights['Estable'];
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-indigo-700 mb-2">Diagnóstico Estratégico — {product.product}</p>
      {msgs.map((m, i) =>
      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
          <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
          <span>{m}</span>
        </div>
      )}
    </div>);

}