import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  ArrowLeft, FileText, Download, FileSpreadsheet, Calendar,
  TrendingUp, Users, Store, Target, BarChart3, Filter,
  ChevronDown, CheckCircle, AlertCircle, Printer, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const PASTEL_COLORS = ['#FFB5C5', '#B5D8FF', '#C5FFB5', '#FFE4B5', '#E0B5FF', '#B5FFE4', '#FFB5E0', '#B5C5FF'];

export default function Reports() {
  const [selectedStore, setSelectedStore] = useState('all');
  const [period, setPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('store');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all data
  const { data: allDailySales = [] } = useQuery({
    queryKey: ['allDailySalesReports'],
    queryFn: () => base44.entities.DailySales.list()
  });

  const { data: allShiftRecords = [] } = useQuery({
    queryKey: ['allShiftRecordsReports'],
    queryFn: () => base44.entities.ShiftRecord.list()
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiersReports'],
    queryFn: () => base44.entities.Cashier.list()
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['allBudgetsReports'],
    queryFn: () => base44.entities.Budget.list()
  });

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date(selectedYear, selectedMonth, 1);
    if (period === 'month') {
      return { from: startOfMonth(now), to: endOfMonth(now) };
    } else if (period === 'quarter') {
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    } else {
      return { from: new Date(selectedYear, 0, 1), to: new Date(selectedYear, 11, 31) };
    }
  }, [period, selectedMonth, selectedYear]);

  // Filter data by date range and store
  const filteredSales = useMemo(() => {
    return allDailySales.filter(s => {
      const date = new Date(s.date);
      const inRange = date >= dateRange.from && date <= dateRange.to;
      const matchStore = selectedStore === 'all' || s.store_id === selectedStore;
      return inRange && matchStore;
    });
  }, [allDailySales, dateRange, selectedStore]);

  const filteredShiftRecords = useMemo(() => {
    return allShiftRecords.filter(r => {
      const date = new Date(r.date);
      const inRange = date >= dateRange.from && date <= dateRange.to;
      const matchStore = selectedStore === 'all' || r.store_id === selectedStore;
      return inRange && matchStore;
    });
  }, [allShiftRecords, dateRange, selectedStore]);

  // Store performance data
  const storePerformance = useMemo(() => {
    return STORES.map(store => {
      const storeSales = filteredSales.filter(s => s.store_id === store.code);
      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      
      const budget = allBudgets.find(b => 
        b.store_id === store.code && 
        b.month === selectedMonth + 1 && 
        b.year === selectedYear
      );
      const budgetAmount = budget?.sales_budget || 0;
      const compliance = budgetAmount > 0 ? (totalSales / budgetAmount) * 100 : 0;

      return {
        ...store,
        totalSales,
        totalTickets,
        totalTransactions,
        avgTicket: totalTickets > 0 ? totalSales / totalTickets : 0,
        budget: budgetAmount,
        compliance,
        daysWithData: storeSales.length
      };
    }).filter(s => s.daysWithData > 0).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredSales, allBudgets, selectedMonth, selectedYear]);

  // Zone totals
  const zoneTotals = useMemo(() => {
    const totalSales = storePerformance.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storePerformance.reduce((sum, s) => sum + s.budget, 0);
    const totalTickets = storePerformance.reduce((sum, s) => sum + s.totalTickets, 0);
    const totalTransactions = storePerformance.reduce((sum, s) => sum + s.totalTransactions, 0);
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;

    return { totalSales, totalBudget, totalTickets, totalTransactions, compliance, avgTicket };
  }, [storePerformance]);

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    const stats = {};
    filteredShiftRecords.forEach(record => {
      if (!stats[record.cashier_id]) {
        stats[record.cashier_id] = {
          cashier_id: record.cashier_id,
          store_id: record.store_id,
          totalSales: 0,
          totalTickets: 0,
          totalTransactions: 0,
          totalSuggested: 0,
          shifts: 0
        };
      }
      stats[record.cashier_id].totalSales += record.sales || 0;
      stats[record.cashier_id].totalTickets += record.tickets || 0;
      stats[record.cashier_id].totalTransactions += record.transactions || 0;
      stats[record.cashier_id].totalSuggested += record.suggested_sales || 0;
      stats[record.cashier_id].shifts += 1;
    });

    return Object.values(stats)
      .map(s => ({
        ...s,
        avgTicket: s.totalTickets > 0 ? s.totalSales / s.totalTickets : 0,
        avgSalesPerShift: s.shifts > 0 ? s.totalSales / s.shifts : 0,
        cashier: allCashiers.find(c => c.id === s.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(st => st.code === s.store_id)?.name || s.store_id
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredShiftRecords, allCashiers]);

  // Budget history
  const budgetHistory = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(selectedYear, selectedMonth, 1), i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const monthBudgets = allBudgets.filter(b => b.month === month && b.year === year);
      const monthSales = allDailySales.filter(s => {
        const sDate = new Date(s.date);
        return sDate.getMonth() + 1 === month && sDate.getFullYear() === year;
      });

      const totalBudget = monthBudgets.reduce((sum, b) => sum + (b.sales_budget || 0), 0);
      const totalSales = monthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;

      months.push({
        month: format(date, 'MMM yy', { locale: es }),
        fullMonth: format(date, 'MMMM yyyy', { locale: es }),
        budget: totalBudget,
        sales: totalSales,
        compliance
      });
    }
    return months;
  }, [allBudgets, allDailySales, selectedMonth, selectedYear]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(v);

  // Export to CSV
  const exportToCSV = (type) => {
    setIsExporting(true);
    let csvContent = '';
    let filename = '';

    if (type === 'stores') {
      csvContent = 'Tienda,Nombre,Ventas,Tickets,Transacciones,Ticket Promedio,Presupuesto,Cumplimiento %\n';
      storePerformance.forEach(s => {
        csvContent += `${s.code},"${s.name}",${s.totalSales},${s.totalTickets},${s.totalTransactions},${s.avgTicket.toFixed(0)},${s.budget},${s.compliance.toFixed(1)}\n`;
      });
      filename = `reporte_tiendas_${format(dateRange.from, 'yyyy-MM')}.csv`;
    } else if (type === 'cashiers') {
      csvContent = 'Cajero,Tienda,Ventas,Tickets,Transacciones,Sugeridos,Ticket Promedio,Turnos,Venta/Turno\n';
      cashierPerformance.forEach(c => {
        csvContent += `"${c.cashier?.name}","${c.storeName}",${c.totalSales},${c.totalTickets},${c.totalTransactions},${c.totalSuggested},${c.avgTicket.toFixed(0)},${c.shifts},${c.avgSalesPerShift.toFixed(0)}\n`;
      });
      filename = `reporte_cajeros_${format(dateRange.from, 'yyyy-MM')}.csv`;
    } else if (type === 'budget') {
      csvContent = 'Mes,Presupuesto,Ventas,Cumplimiento %\n';
      budgetHistory.forEach(b => {
        csvContent += `"${b.fullMonth}",${b.budget},${b.sales},${b.compliance.toFixed(1)}\n`;
      });
      filename = `historial_presupuesto_${selectedYear}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  // Export to PDF (print)
  const exportToPDF = () => {
    const printContent = document.getElementById('report-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Popsy - ${format(dateRange.from, 'MMMM yyyy', { locale: es })}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ec4899; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .summary-card { padding: 15px; background: #f9f9f9; border-radius: 8px; flex: 1; }
          </style>
        </head>
        <body>
          <h1>🍦 Reporte Popsy</h1>
          <p>Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}</p>
          <p>Zona: Bogotá Noroccidente</p>
          
          <div class="summary">
            <div class="summary-card">
              <strong>Ventas Totales</strong><br/>
              ${formatCurrency(zoneTotals.totalSales)}
            </div>
            <div class="summary-card">
              <strong>Cumplimiento</strong><br/>
              ${zoneTotals.compliance.toFixed(1)}%
            </div>
            <div class="summary-card">
              <strong>Ticket Promedio</strong><br/>
              ${formatCurrency(zoneTotals.avgTicket)}
            </div>
          </div>

          <h2>Rendimiento por Tienda</h2>
          <table>
            <tr><th>Tienda</th><th>Ventas</th><th>Tickets</th><th>Cumplimiento</th></tr>
            ${storePerformance.slice(0, 10).map(s => `
              <tr>
                <td>${s.code} - ${s.name}</td>
                <td>${formatCurrency(s.totalSales)}</td>
                <td>${s.totalTickets}</td>
                <td>${s.compliance.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </table>

          <h2>Top 10 Cajeros</h2>
          <table>
            <tr><th>Cajero</th><th>Tienda</th><th>Ventas</th><th>Ticket Prom.</th></tr>
            ${cashierPerformance.slice(0, 10).map(c => `
              <tr>
                <td>${c.cashier?.name}</td>
                <td>${c.storeName}</td>
                <td>${formatCurrency(c.totalSales)}</td>
                <td>${formatCurrency(c.avgTicket)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const periodLabel = period === 'month' ? format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy', { locale: es }) :
                      period === 'quarter' ? `Q${Math.floor(selectedMonth / 3) + 1} ${selectedYear}` :
                      `Año ${selectedYear}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-7 h-7 text-slate-600" />
                Centro de Reportes
              </h1>
              <p className="text-sm text-gray-500">Genera y exporta reportes detallados</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Link to="/ProductTicketAnalysis">
              <Button variant="outline" size="sm" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Sparkles className="w-4 h-4" />
                Análisis IA
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(activeTab === 'store' ? 'stores' : activeTab === 'cashier' ? 'cashiers' : 'budget')}
              disabled={isExporting}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Filtros:</span>
              </div>
              
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensual</SelectItem>
                  <SelectItem value="quarter">Trimestral</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las tiendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tiendas</SelectItem>
                  {STORES.map(store => (
                    <SelectItem key={store.code} value={store.code}>{store.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge className="bg-slate-100 text-slate-700 ml-auto">
                <Calendar className="w-3 h-3 mr-1" />
                {periodLabel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-pink-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              <span className="text-xs text-gray-500">Ventas Totales</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(zoneTotals.totalSales)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-500">Cumplimiento</span>
            </div>
            <p className={`text-xl font-bold ${zoneTotals.compliance >= 90 ? 'text-green-600' : zoneTotals.compliance >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {zoneTotals.compliance.toFixed(1)}%
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">Ticket Promedio</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(zoneTotals.avgTicket)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-500">Tiendas Activas</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{storePerformance.length}</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div id="report-content">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 p-1 rounded-xl grid grid-cols-4 w-full max-w-2xl mx-auto">
              <TabsTrigger value="store" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Tiendas</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Comparativa</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Presupuesto</span>
              </TabsTrigger>
              <TabsTrigger value="cashier" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Cajeros</span>
              </TabsTrigger>
            </TabsList>

            {/* Store Performance Tab */}
            <TabsContent value="store" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-pink-500" />
                    Rendimiento por Tienda - {periodLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={storePerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, name) => name === 'compliance' ? `${v.toFixed(1)}%` : formatCurrency(v)} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalSales" name="Ventas" fill="#FFB5C5" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="compliance" name="Cumplimiento" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Store Table */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Tienda</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Ventas</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Tickets</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Ticket Prom.</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Presupuesto</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Cumplimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storePerformance.map((store, idx) => (
                          <tr key={store.code} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-3 text-sm font-medium text-gray-600">{idx + 1}</td>
                            <td className="p-3">
                              <p className="text-sm font-medium text-gray-800">{store.code}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{store.name}</p>
                            </td>
                            <td className="p-3 text-sm text-right font-medium text-gray-800">{formatCurrency(store.totalSales)}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{store.totalTickets.toLocaleString()}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(store.avgTicket)}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(store.budget)}</td>
                            <td className="p-3 text-right">
                              <Badge className={`${
                                store.compliance >= 90 ? 'bg-green-100 text-green-700' :
                                store.compliance >= 70 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {store.compliance.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="compare" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Ventas por Tienda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={storePerformance.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="code" type="category" width={60} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                          {storePerformance.slice(0, 8).map((entry, index) => (
                            <Cell key={index} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Ticket Promedio Comparativo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={storePerformance.slice(0, 8).sort((a, b) => b.avgTicket - a.avgTicket)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="avgTicket" fill="#B5D8FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top vs Bottom */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Top 5 vs Bottom 5</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Mejores
                      </h4>
                      <div className="space-y-2">
                        {storePerformance.slice(0, 5).map((store, idx) => (
                          <div key={store.code} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                              <span className="text-sm font-medium">{store.code}</span>
                            </div>
                            <span className="text-sm font-bold text-green-700">{formatCurrency(store.totalSales)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Necesitan Mejora
                      </h4>
                      <div className="space-y-2">
                        {storePerformance.slice(-5).reverse().map((store, idx) => (
                          <div key={store.code} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">{storePerformance.length - 4 + idx}</span>
                              <span className="text-sm font-medium">{store.code}</span>
                            </div>
                            <span className="text-sm font-bold text-red-700">{formatCurrency(store.totalSales)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget History Tab */}
            <TabsContent value="budget" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Historial de Cumplimiento (Últimos 6 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={budgetHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, name) => name === 'compliance' ? `${v.toFixed(1)}%` : formatCurrency(v)} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="budget" name="Presupuesto" fill="#E0B5FF" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="sales" name="Ventas" fill="#C5FFB5" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="compliance" name="Cumplimiento" stroke="#f472b6" strokeWidth={3} dot={{ r: 5, fill: '#f472b6' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Budget Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {budgetHistory.map((month, idx) => (
                  <motion.div
                    key={month.month}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      month.compliance >= 90 ? 'bg-green-50 border-green-200' :
                      month.compliance >= 70 ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{month.fullMonth}</p>
                    <p className={`text-xl font-bold ${
                      month.compliance >= 90 ? 'text-green-600' :
                      month.compliance >= 70 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>{month.compliance.toFixed(0)}%</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(month.sales)}</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Cashier Performance Tab */}
            <TabsContent value="cashier" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Desempeño de Cajeros - {periodLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashierPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="cashier.name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="totalSales" fill="#E0B5FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cashier Table */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Cajero</th>
                          <th className="text-left p-3 text-xs font-medium text-gray-500">Tienda</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Ventas</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Tickets</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Transacc.</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Sugeridos</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Ticket Prom.</th>
                          <th className="text-right p-3 text-xs font-medium text-gray-500">Turnos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashierPerformance.slice(0, 20).map((cashier, idx) => (
                          <tr key={cashier.cashier_id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-3 text-sm font-medium text-gray-600">{idx + 1}</td>
                            <td className="p-3 text-sm font-medium text-gray-800">{cashier.cashier?.name}</td>
                            <td className="p-3 text-xs text-gray-500">{cashier.storeName}</td>
                            <td className="p-3 text-sm text-right font-medium text-gray-800">{formatCurrency(cashier.totalSales)}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{cashier.totalTickets.toLocaleString()}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{cashier.totalTransactions.toLocaleString()}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{cashier.totalSuggested}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(cashier.avgTicket)}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{cashier.shifts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}