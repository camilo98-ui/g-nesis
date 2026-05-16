import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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
  PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend, LabelList } from
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

export default function ProductTicketAnalysis({ storeId, budget = [] }) {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 hidden">
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
      {/* Pastel pink palette */}
      {(() => {
        const PASTEL = ['#f9a8d4', '#fbcfe8', '#fda4af', '#fecdd3', '#f0abfc', '#e9d5ff', '#fbb6ce', '#fcd5ce'];
        const PASTEL_DARK = ['#db2777', '#be185d', '#e11d48', '#c026d3', '#7c3aed', '#d946ef', '#f43f5e', '#ec4899'];

        // ─── Luxury Pink AI SaaS — token palette ───
        const P = {
          primary: '#FF4D8D',
          soft: '#FF8FB8',
          glass: '#FCE7F3',
          magenta: '#D81B60',
          lila: '#E9D5FF',
          bg: '#FFF7FA',
          text: '#3A2E39',
          textSub: '#8F7A86',
          border: 'rgba(255,77,141,0.12)',
          borderSoft: 'rgba(255,143,184,0.18)',
          glow: 'rgba(255,77,141,0.18)',
          glowSoft: 'rgba(255,77,141,0.08)'
        };

        return <>
      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Top 10 Productos — Luxury Pink AI SaaS ── */}
        <div style={{
              background: `linear-gradient(160deg, rgba(255,247,250,0.97) 0%, rgba(252,231,243,0.6) 100%)`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 22,
              border: `1px solid ${P.borderSoft}`,
              boxShadow: `0 2px 8px ${P.glowSoft}, 0 16px 48px rgba(255,77,141,0.07), inset 0 1px 0 rgba(255,255,255,0.9)`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
          {/* Header */}
          <div style={{
                padding: '18px 20px 13px',
                borderBottom: `1px solid ${P.borderSoft}`,
                background: 'linear-gradient(90deg, rgba(255,77,141,0.04) 0%, rgba(233,213,255,0.08) 100%)'
              }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                      width: 30, height: 30, borderRadius: 9,
                      background: `linear-gradient(135deg, ${P.primary} 0%, ${P.soft} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 3px 12px ${P.glow}`
                    }} className="hidden">
                  <BarChart3 style={{ width: 14, height: 14, color: '#fff' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Top 10 Productos</p>
                  <p style={{ fontSize: 10, color: P.textSub, margin: 0, marginTop: 2 }}>Por participación en ventas</p>
                </div>
              </div>
              <span style={{
                    fontSize: 10, fontWeight: 600, color: P.magenta,
                    background: 'rgba(216,27,96,0.08)', padding: '3px 9px',
                    borderRadius: 20, border: `1px solid rgba(216,27,96,0.15)`
                  }}>{products.length} productos</span>
            </div>
          </div>

          {/* List */}
          <div style={{ padding: '12px 16px 16px' }}>
            {(() => {
                  const top10 = [...products].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);
                  const maxSales = top10[0]?.totalSales || 1;
                  // Rank color ramp — all rosé/pink/magenta
                  const getRankStyle = (i) => {
                    if (i === 0) return { bar: `linear-gradient(90deg, ${P.primary}, ${P.soft})`, num: P.primary, hoverBg: 'rgba(255,77,141,0.08)', badge: P.primary };
                    if (i === 1) return { bar: `linear-gradient(90deg, ${P.soft}, #ffcce0)`, num: P.soft, hoverBg: 'rgba(255,143,184,0.07)', badge: P.soft };
                    if (i === 2) return { bar: `linear-gradient(90deg, #E9D5FF, #d8b4fe)`, num: '#c084fc', hoverBg: 'rgba(233,213,255,0.12)', badge: '#c084fc' };
                    return { bar: `rgba(255,143,184,${0.55 - i * 0.04})`, num: P.textSub, hoverBg: `rgba(255,77,141,0.04)`, badge: P.textSub };
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {top10.map((p, i) => {
                        const pct = p.totalSales / maxSales * 100;
                        const rs = getRankStyle(i);
                        return (
                          <div key={p.product}
                          style={{ padding: '7px 10px', borderRadius: 11, background: 'transparent', transition: 'background 0.2s, box-shadow 0.2s', cursor: 'default' }}
                          onMouseEnter={(e) => {e.currentTarget.style.background = rs.hoverBg;e.currentTarget.style.boxShadow = `0 2px 12px rgba(255,77,141,0.08)`;}}
                          onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';e.currentTarget.style.boxShadow = 'none';}}>
                            
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: rs.num, minWidth: 16, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                            <span style={{ fontSize: 11, color: P.text, fontWeight: i < 3 ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: P.textSub, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.totalSales)}</span>
                            <span style={{
                                  fontSize: 10, fontWeight: 700, color: i < 2 ? P.magenta : P.textSub,
                                  background: i < 2 ? 'rgba(216,27,96,0.08)' : 'rgba(143,122,134,0.07)',
                                  padding: '1px 7px', borderRadius: 7, fontVariantNumeric: 'tabular-nums',
                                  border: `1px solid ${i < 2 ? 'rgba(216,27,96,0.14)' : 'rgba(143,122,134,0.1)'}`
                                }}>{p.participation.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,143,184,0.15)', overflow: 'hidden' }}>
                          <div style={{
                                height: '100%', borderRadius: 9999, width: `${pct}%`,
                                background: rs.bar,
                                boxShadow: i < 3 ? `0 0 10px rgba(255,77,141,0.25)` : 'none',
                                transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)'
                              }} />
                        </div>
                      </div>);

                      })}
                </div>);

                })()}
          </div>
        </div>







































        {/* Chart 2: Ventas por mes — desde Enero */}
        {(() => {
              // Agrupar dailySales por mes
              const monthMap = {};
              const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              dailySales.forEach((d) => {
                if (!d.date) return;
                try {
                  const dt = parseISO(d.date);
                  const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                  const monthIdx = dt.getMonth();
                  if (!monthMap[key]) monthMap[key] = { key, label: MONTH_NAMES[monthIdx], month: monthIdx + 1, year: dt.getFullYear(), totalSales: 0, totalTickets: 0 };
                  monthMap[key].totalSales += d.total_sales || 0;
                  monthMap[key].totalTickets += d.total_tickets || 0;
                } catch (e) {}
              });
              // Solo meses del año actual, desde enero
              const currentYear = new Date().getFullYear();
              const monthData = Object.values(monthMap).
              filter((m) => m.year === currentYear).
              sort((a, b) => a.month - b.month);
              const totalYearSales = monthData.reduce((s, m) => s + m.totalSales, 0);
              const maxMonthSales = Math.max(...monthData.map((m) => m.totalSales), 1);
              const monthsWithPart = monthData.map((m) => {
                // Buscar presupuesto de ese mes
                const budgetEntry = budget.find((b) => Number(b.month) === m.month && Number(b.year) === m.year);
                const pptMes = budgetEntry?.sales_budget || 0;
                const compliance = pptMes > 0 ? Math.round(m.totalSales / pptMes * 100) : null;
                return {
                  ...m,
                  participation: totalYearSales > 0 ? m.totalSales / totalYearSales * 100 : 0,
                  pptMes,
                  compliance
                };
              });

              // ─── Luxury Pink palette (scoped) ───
              const LCS = {
                excellent: { // >=100% — magenta premium
                  grad: 'url(#lpGradMagenta)',
                  barLine: `linear-gradient(90deg, #D81B60, #FF4D8D)`,
                  badge: { bg: 'rgba(216,27,96,0.09)', color: '#D81B60', border: 'rgba(216,27,96,0.22)' },
                  dot: '#D81B60'
                },
                good: { // 90–99% — rosa principal
                  grad: 'url(#lpGradPrimary)',
                  barLine: `linear-gradient(90deg, #FF4D8D, #FF8FB8)`,
                  badge: { bg: 'rgba(255,77,141,0.09)', color: '#FF4D8D', border: 'rgba(255,77,141,0.22)' },
                  dot: '#FF4D8D'
                },
                mid: { // 80–89% — rosa suave + lila
                  grad: 'url(#lpGradSoft)',
                  barLine: `linear-gradient(90deg, #FF8FB8, #E9D5FF)`,
                  badge: { bg: 'rgba(255,143,184,0.10)', color: '#c0587a', border: 'rgba(255,143,184,0.25)' },
                  dot: '#FF8FB8'
                },
                low: { // <80% — lila tenue
                  grad: 'url(#lpGradLila)',
                  barLine: `linear-gradient(90deg, #E9D5FF, #d8b4fe)`,
                  badge: { bg: 'rgba(233,213,255,0.18)', color: '#9333ea', border: 'rgba(233,213,255,0.4)' },
                  dot: '#c084fc'
                },
                neutral: {
                  grad: 'url(#lpGradSoft)',
                  barLine: `linear-gradient(90deg, #FF8FB8, #fce7f3)`,
                  badge: { bg: 'rgba(255,143,184,0.08)', color: P.textSub, border: 'rgba(255,143,184,0.18)' },
                  dot: '#FF8FB8'
                }
              };
              const getLCS = (c) => {
                if (c == null) return LCS.neutral;
                if (c >= 100) return LCS.excellent;
                if (c >= 90) return LCS.good;
                if (c >= 80) return LCS.mid;
                return LCS.low;
              };

              return (
                <div style={{
                  background: `linear-gradient(160deg, rgba(255,247,250,0.97) 0%, rgba(252,231,243,0.6) 100%)`,
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderRadius: 22,
                  border: `1px solid ${P.borderSoft}`,
                  boxShadow: `0 2px 8px ${P.glowSoft}, 0 16px 48px rgba(255,77,141,0.07), inset 0 1px 0 rgba(255,255,255,0.9)`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
              {/* Header */}
              <div style={{
                    padding: '18px 20px 13px',
                    borderBottom: `1px solid ${P.borderSoft}`,
                    background: 'linear-gradient(90deg, rgba(255,77,141,0.04) 0%, rgba(233,213,255,0.06) 100%)'
                  }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: `linear-gradient(135deg, ${P.magenta} 0%, ${P.primary} 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 3px 12px rgba(216,27,96,0.3)`
                        }} className="hidden">
                      <Target style={{ width: 14, height: 14, color: '#fff' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Venta por Mes</p>
                      <p style={{ fontSize: 10, color: P.textSub, margin: 0, marginTop: 2 }}>Ene – {MONTH_NAMES[new Date().getMonth()]} {currentYear}</p>
                    </div>
                  </div>
                  {totalYearSales > 0 &&
                      <div style={{ textAlign: 'right' }}>
                      <p style={{
                          fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.03em',
                          fontVariantNumeric: 'tabular-nums',
                          background: `linear-gradient(135deg, ${P.magenta}, ${P.primary})`,
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>{fmt(totalYearSales)}</p>
                      <p style={{ fontSize: 9, color: P.textSub, margin: 0, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total acumulado</p>
                    </div>
                      }
                </div>
              </div>

              <div style={{ padding: '8px 4px 0' }}>
                {monthsWithPart.length === 0 ?
                    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 11, color: P.textSub }}>Sin datos de ventas mensuales</div> :

                    <>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={monthsWithPart} margin={{ top: 26, right: 12, left: 8, bottom: 4 }} barCategoryGap="16%">
                        <defs>
                          <linearGradient id="lpGradMagenta" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D81B60" stopOpacity={1} />
                            <stop offset="100%" stopColor="#FF4D8D" stopOpacity={0.5} />
                          </linearGradient>
                          <linearGradient id="lpGradPrimary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF4D8D" stopOpacity={1} />
                            <stop offset="100%" stopColor="#FF8FB8" stopOpacity={0.5} />
                          </linearGradient>
                          <linearGradient id="lpGradSoft" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF8FB8" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#fce7f3" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="lpGradLila" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E9D5FF" stopOpacity={1} />
                            <stop offset="100%" stopColor="#d8b4fe" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,143,184,0.12)" strokeDasharray="4 4" />
                        <XAxis
                            dataKey="label"
                            tick={({ x, y, payload }) =>
                            <text x={x} y={y + 10} textAnchor="middle" fontSize={9.5} fill={P.textSub} fontFamily="Inter, -apple-system, sans-serif" fontWeight={500}>
                              {payload.value}
                            </text>
                            }
                            axisLine={false} tickLine={false} />
                          
                        <YAxis hide />
                        <RechartsTooltip
                            cursor={{ fill: 'rgba(255,77,141,0.04)', radius: 6 }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const cs = getLCS(d.compliance);
                              return (
                                <div style={{
                                  background: 'rgba(255,247,250,0.97)',
                                  backdropFilter: 'blur(16px)',
                                  border: `1px solid ${P.borderSoft}`,
                                  borderRadius: 14,
                                  padding: '11px 15px',
                                  boxShadow: `0 8px 32px rgba(255,77,141,0.12), 0 2px 8px rgba(0,0,0,0.05)`,
                                  minWidth: 148
                                }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: P.text, margin: '0 0 5px', letterSpacing: '-0.01em' }}>{d.label} {d.year}</p>
                                <p style={{
                                    fontSize: 16, fontWeight: 800, margin: '0 0 5px',
                                    letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                                    background: `linear-gradient(135deg, ${P.magenta}, ${P.primary})`,
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                  }}>{fmt(d.totalSales)}</p>
                                {d.pptMes > 0 && <p style={{ fontSize: 10, color: P.textSub, margin: '0 0 5px', fontVariantNumeric: 'tabular-nums' }}>PPT: {fmt(d.pptMes)}</p>}
                                {d.compliance != null &&
                                  <span style={{
                                    display: 'inline-block', fontSize: 11, fontWeight: 700,
                                    color: cs.badge.color, background: cs.badge.bg,
                                    border: `1px solid ${cs.badge.border}`,
                                    padding: '2px 9px', borderRadius: 20, marginTop: 2
                                  }}>{d.compliance}%</span>
                                  }
                              </div>);

                            }} />
                          
                        <Bar dataKey="totalSales" radius={[7, 7, 0, 0]} maxBarSize={34}>
                          {monthsWithPart.map((m, i) => <Cell key={i} fill={getLCS(m.compliance).grad} />)}
                          <LabelList
                              dataKey="compliance"
                              position="top"
                              formatter={(v) => v != null ? `${v}%` : ''}
                              style={{ fontSize: 9, fontWeight: 700, fill: P.magenta, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }} />
                            
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Leyenda pink */}
                    <div style={{ display: 'flex', gap: 14, padding: '0 16px 10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[
                        { dot: '#D81B60', label: '≥100%' },
                        { dot: '#FF4D8D', label: '90–99%' },
                        { dot: '#FF8FB8', label: '80–89%' },
                        { dot: '#E9D5FF', label: '<80%' }].
                        map(({ dot, label }) =>
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}66` }} />
                          <span style={{ fontSize: 9.5, color: P.textSub, fontWeight: 500 }}>{label}</span>
                        </div>
                        )}
                    </div>

                    {/* Tabla mensual — Luxury Pink */}
                    <div style={{ margin: '0 12px 14px', borderRadius: 14, overflow: 'hidden', border: `1px solid ${P.borderSoft}` }}>
                      <div style={{
                          display: 'grid', gridTemplateColumns: '24px 1fr auto 52px',
                          gap: '0 8px', padding: '7px 12px',
                          background: 'linear-gradient(90deg, rgba(255,77,141,0.05), rgba(233,213,255,0.06))',
                          borderBottom: `1px solid ${P.borderSoft}`
                        }}>
                        {['#', 'Mes', 'Venta', 'Cumpl.'].map((h, hi) =>
                          <span key={h} style={{
                            fontSize: 9, fontWeight: 700, color: P.textSub,
                            textTransform: 'uppercase', letterSpacing: '0.09em',
                            textAlign: hi >= 2 ? 'right' : 'left'
                          }}>{h}</span>
                          )}
                      </div>
                      {[...monthsWithPart].sort((a, b) => a.month - b.month).map((m, i) => {
                          const cs = getLCS(m.compliance);
                          const barPct = Math.min(100, m.compliance != null ? Math.min(m.compliance, 100) : m.totalSales / maxMonthSales * 100);
                          return (
                            <div
                              key={m.key}
                              style={{
                                display: 'grid', gridTemplateColumns: '24px 1fr auto 52px',
                                gap: '0 8px', padding: '6px 12px', alignItems: 'center',
                                background: i % 2 === 0 ? 'rgba(255,247,250,0.7)' : 'rgba(255,255,255,0.5)',
                                transition: 'background 0.18s',
                                cursor: 'default'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,77,141,0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,247,250,0.7)' : 'rgba(255,255,255,0.5)'}>
                              
                            <span style={{ fontSize: 10, fontWeight: 600, color: P.textSub, fontVariantNumeric: 'tabular-nums' }}>{m.month}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 10.5, fontWeight: 600, color: P.text, margin: '0 0 3px', letterSpacing: '-0.005em' }}>{m.label}</p>
                              <div style={{ height: 3, borderRadius: 9999, background: 'rgba(255,143,184,0.15)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 9999,
                                    width: `${barPct}%`,
                                    background: cs.barLine,
                                    boxShadow: `0 0 8px ${cs.dot}55`,
                                    transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)'
                                  }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: P.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(m.totalSales)}
                            </span>
                            {m.compliance != null ?
                              <span style={{
                                fontSize: 10, fontWeight: 800,
                                color: cs.badge.color, background: cs.badge.bg,
                                border: `1px solid ${cs.badge.border}`,
                                padding: '2px 5px', borderRadius: 8,
                                textAlign: 'center', display: 'block',
                                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em'
                              }}>{m.compliance}%</span> :

                              <span style={{ fontSize: 10, color: P.textSub, textAlign: 'right', display: 'block' }}>—</span>
                              }
                          </div>);

                        })}
                    </div>
                  </>
                    }
              </div>
            </div>);

            })()}
      </div>
      </>;
      })()}

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