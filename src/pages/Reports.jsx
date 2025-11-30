import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, FileText, Download, Loader2, TrendingUp, TrendingDown, Award, AlertTriangle, Target, Receipt } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, format, differenceInDays, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
  ComposedChart, Line
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

export default function Reports() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Datos para gráficas
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find(s => s.date === dayStr) || {};
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd MMM', { locale: es }),
        ventas: dayData.total_sales || 0,
        tickets: dayData.total_tickets || 0,
        sugeridos: dayData.total_suggested || 0,
        ticketPromedio: (dayData.total_transactions || 0) > 0 ? (dayData.total_sales || 0) / dayData.total_transactions : 0
      };
    }).filter(d => d.ventas > 0);
  }, [dailySales, dateRange]);

  const reportData = useMemo(() => {
    const filteredSales = dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const filteredRecords = shiftRecords.filter(r => {
      const date = new Date(r.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const totals = filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });

    const now = new Date();
    const currentBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};

    // Rankings
    const cashierStats = {};
    filteredRecords.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = { sales: 0, suggested: 0, tickets: 0, shifts: 0 };
      }
      cashierStats[record.cashier_id].sales += record.sales || 0;
      cashierStats[record.cashier_id].suggested += record.suggested_sales || 0;
      cashierStats[record.cashier_id].tickets += record.tickets || 0;
      cashierStats[record.cashier_id].shifts += 1;
    });

    const topSellers = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.sales - a.sales)
      .slice(0, 5)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }));

    const topSuggested = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.suggested - a.suggested)
      .slice(0, 5)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }));

    const daysElapsed = differenceInDays(new Date(), startOfMonth(new Date())) + 1;
    const totalDays = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;
    const dailyAvg = filteredSales.length > 0 ? totals.sales / filteredSales.length : 0;
    const projection = dailyAvg * totalDays;

    // Datos para pie chart de distribución por turno
    const shiftDistribution = { morning: 0, afternoon: 0, night: 0 };
    filteredRecords.forEach(r => {
      shiftDistribution[r.shift] = (shiftDistribution[r.shift] || 0) + (r.sales || 0);
    });
    const pieData = [
      { name: 'Mañana', value: shiftDistribution.morning, color: '#f59e0b' },
      { name: 'Tarde', value: shiftDistribution.afternoon, color: '#ec4899' },
      { name: 'Noche', value: shiftDistribution.night, color: '#6366f1' }
    ].filter(d => d.value > 0);

    return {
      totals,
      budget: currentBudget,
      topSellers,
      topSuggested,
      daysWorked: filteredSales.length,
      avgDaily: dailyAvg,
      avgTicket: totals.tickets > 0 ? totals.sales / totals.tickets : 0,
      compliance: currentBudget.sales_budget ? (totals.sales / currentBudget.sales_budget * 100) : 0,
      projection,
      daysElapsed,
      totalDays,
      pieData
    };
  }, [dailySales, shiftRecords, cashiers, budgets, dateRange]);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      const storeName = STORES.find(s => s.code === selectedStore)?.name || selectedStore;
      const compliance = reportData.compliance.toFixed(1);
      const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);
      
      // Generar análisis con LLM
      let analysis = null;
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Genera un análisis ejecutivo PROFESIONAL para un reporte gerencial de tienda Popsy:
          
          DATOS:
          - Tienda: ${selectedStore} - ${storeName}
          - Ventas: ${formatCurrency(reportData.totals.sales)}
          - Presupuesto: ${formatCurrency(reportData.budget.sales_budget)}
          - Cumplimiento: ${compliance}%
          - Proyección: ${formatCurrency(reportData.projection)}
          - Tickets: ${reportData.totals.tickets}
          - Ticket promedio: ${formatCurrency(reportData.avgTicket)}
          - Sugeridos: ${reportData.totals.suggested}
          - Top vendedor: ${reportData.topSellers[0]?.cashier?.name || 'N/A'}
          
          Incluye: resumen, puntos destacados, áreas mejora, plan acción, recomendaciones`,
          response_json_schema: {
            type: "object",
            properties: {
              resumen: { type: "string" },
              puntos_destacados: { type: "array", items: { type: "string" } },
              areas_mejora: { type: "array", items: { type: "string" } },
              plan_accion: { type: "array", items: { type: "string" } },
              recomendaciones: { type: "array", items: { type: "string" } }
            }
          }
        });
        analysis = result;
      } catch (e) {
        analysis = null;
      }
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Gerencial Popsy - ${selectedStore}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 15px; font-size: 12px; }
    .header { text-align: center; border-bottom: 3px solid #ec4899; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #ec4899; margin: 0; font-size: 24px; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 14px; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
    .metric-card { background: #fdf2f8; border-radius: 8px; padding: 12px; text-align: center; }
    .metric-value { font-size: 18px; font-weight: bold; color: #ec4899; }
    .metric-label { font-size: 10px; color: #666; }
    .ranking-item { display: flex; justify-content: space-between; padding: 6px 10px; background: #fdf2f8; margin: 4px 0; border-radius: 4px; }
    .analysis-box { background: #f8fafc; border-left: 3px solid #ec4899; padding: 10px; margin: 8px 0; border-radius: 0 6px 6px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #fce7f3; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 8px; border: 1px solid #fce7f3; text-align: left; }
    th { background: #fdf2f8; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍦 REPORTE GERENCIAL POPSY</h1>
    <p><strong>${selectedStore} - ${storeName}</strong></p>
    <p>Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')} | Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
  </div>

  <div class="section">
    <div class="section-title">📊 RESUMEN EJECUTIVO</div>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(reportData.totals.sales)}</div>
        <div class="metric-label">VENTAS TOTALES</div>
      </div>
      <div class="metric-card" style="background: ${parseFloat(compliance) >= 100 ? '#d1fae5' : parseFloat(compliance) >= 80 ? '#fef3c7' : '#fee2e2'}">
        <div class="metric-value" style="color: ${parseFloat(compliance) >= 100 ? '#059669' : parseFloat(compliance) >= 80 ? '#d97706' : '#dc2626'}">${compliance}%</div>
        <div class="metric-label">CUMPLIMIENTO</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(reportData.avgTicket)}</div>
        <div class="metric-label">TICKET PROMEDIO</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(reportData.projection)}</div>
        <div class="metric-label">PROYECCIÓN</div>
      </div>
    </div>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-value">${reportData.totals.tickets.toLocaleString()}</div>
        <div class="metric-label">TICKETS</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${reportData.totals.transactions.toLocaleString()}</div>
        <div class="metric-label">TRANSACCIONES</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${reportData.totals.suggested.toLocaleString()}</div>
        <div class="metric-label">SUGERIDOS</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${reportData.daysWorked}</div>
        <div class="metric-label">DÍAS TRABAJADOS</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏆 TOP VENDEDORES</div>
    ${reportData.topSellers.map((s, i) => `
      <div class="ranking-item">
        <span>${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} ${s.cashier?.name || 'N/A'}</span>
        <span><strong>${formatCurrency(s.sales)}</strong> (${s.shifts} turnos)</span>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">⭐ TOP SUGERIDOS</div>
    ${reportData.topSuggested.map((s, i) => `
      <div class="ranking-item">
        <span>${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} ${s.cashier?.name || 'N/A'}</span>
        <span><strong>${s.suggested}</strong> sugeridos</span>
      </div>
    `).join('')}
  </div>

  ${analysis ? `
  <div class="section" style="page-break-before: always;">
    <div class="section-title">📝 ANÁLISIS Y RECOMENDACIONES</div>
    <div class="analysis-box">
      <strong>Resumen:</strong><br>${analysis.resumen || ''}
    </div>
    ${(analysis.puntos_destacados || []).length > 0 ? `
    <div class="analysis-box" style="border-color: #10b981; background: #ecfdf5;">
      <strong style="color: #059669;">✨ Puntos Destacados:</strong>
      <ul>${(analysis.puntos_destacados || []).map(p => `<li>${p}</li>`).join('')}</ul>
    </div>` : ''}
    ${(analysis.areas_mejora || []).length > 0 ? `
    <div class="analysis-box" style="border-color: #f59e0b; background: #fef3c7;">
      <strong style="color: #d97706;">⚠️ Áreas de Mejora:</strong>
      <ul>${(analysis.areas_mejora || []).map(p => `<li>${p}</li>`).join('')}</ul>
    </div>` : ''}
    ${(analysis.plan_accion || []).length > 0 ? `
    <div class="analysis-box" style="border-color: #3b82f6; background: #eff6ff;">
      <strong style="color: #2563eb;">🎯 Plan de Acción:</strong>
      <ol>${(analysis.plan_accion || []).map(p => `<li>${p}</li>`).join('')}</ol>
    </div>` : ''}
    ${(analysis.recomendaciones || []).length > 0 ? `
    <div class="analysis-box" style="border-color: #a855f7; background: #faf5ff;">
      <strong style="color: #9333ea;">💡 Recomendaciones:</strong>
      <ul>${(analysis.recomendaciones || []).map(p => `<li>${p}</li>`).join('')}</ul>
    </div>` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>🍦 <strong>POPSY</strong> - Helado Gourmet | "Hacemos del mundo un lugar más dulce"</p>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
      }
      window.URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reportes Gerenciales</h1>
              {selectedStore && <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none">
                <CardContent className="pt-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
                  <p className="text-xs text-gray-500">Ventas</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(reportData.totals.sales)}</p>
                </CardContent>
              </Card>
              <Card className={`border-none ${reportData.compliance >= 100 ? 'bg-gradient-to-br from-green-50 to-green-100' : reportData.compliance >= 80 ? 'bg-gradient-to-br from-amber-50 to-amber-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
                <CardContent className="pt-4">
                  <Target className="w-5 h-5 text-amber-500 mb-1" />
                  <p className="text-xs text-gray-500">Cumplimiento</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.compliance.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
                <CardContent className="pt-4">
                  <Receipt className="w-5 h-5 text-blue-500 mb-1" />
                  <p className="text-xs text-gray-500">Ticket Prom.</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(reportData.avgTicket)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
                <CardContent className="pt-4">
                  <Award className="w-5 h-5 text-purple-500 mb-1" />
                  <p className="text-xs text-gray-500">Sugeridos</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.totals.suggested}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tendencia de Ventas */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">📈 Tendencia de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="salesGradRep" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Venta']} />
                        <Area type="monotone" dataKey="ventas" stroke="#ec4899" fill="url(#salesGradRep)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Promedio */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">💵 Ticket Promedio Diario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Ticket']} />
                        <Bar dataKey="ticketPromedio" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="ticketPromedio" stroke="#ec4899" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Distribución por turno */}
              {reportData.pieData.length > 0 && (
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">🕐 Ventas por Turno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={reportData.pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                            {reportData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Vendedores */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">🏆 Top Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.topSellers.slice(0, 4).map((s, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span>{['🥇', '🥈', '🥉', '4️⃣'][i]} {s.cashier?.name || 'N/A'}</span>
                        <span className="font-bold text-pink-600">${(s.sales/1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sugeridos */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">⭐ Top Sugeridos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.topSuggested.slice(0, 4).map(s => ({ name: s.cashier?.name?.split(' ')[0] || 'N/A', sugeridos: s.suggested }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="sugeridos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none shadow-xl cursor-pointer" onClick={!generating ? generatePDF : undefined}>
                <CardContent className="py-6 text-center">
                  <motion.div animate={{ rotate: generating ? 360 : 0 }} transition={{ duration: 1, repeat: generating ? Infinity : 0, ease: "linear" }} className="inline-block mb-3">
                    {generating ? <Loader2 className="w-10 h-10" /> : <FileText className="w-10 h-10" />}
                  </motion.div>
                  <h3 className="text-lg font-bold mb-1">{generating ? 'Generando...' : 'Generar Reporte PDF'}</h3>
                  <p className="text-white/80 text-sm mb-3">Incluye análisis IA, rankings y plan de acción</p>
                  {!generating && (
                    <Button size="sm" className="bg-white text-pink-600 hover:bg-white/90">
                      <Download className="w-4 h-4 mr-1" /> Descargar
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">📊</motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para generar reportes gerenciales</p>
          </div>
        )}
      </div>
    </div>
  );
}