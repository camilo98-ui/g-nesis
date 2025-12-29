import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Eye, Zap, Award, Brain, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { format, startOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreDetailModal from '../components/executive/StoreDetailModal';
import KPIDetailModal from '../components/executive/KPIDetailModal';
import ExecutiveComparable from '../components/executive/ExecutiveComparable';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

export default function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [hoveredKPI, setHoveredKPI] = useState(null);
  const [selectedKPIDetail, setSelectedKPIDetail] = useState(null);
  const [showComparable, setShowComparable] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: allDailySales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['allDailySales'],
    queryFn: () => base44.entities.DailySales.list()
  });

  const { data: allBudgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['allBudgets'],
    queryFn: () => base44.entities.Budget.list()
  });

  const isLoading = loadingSales || loadingBudgets;

  const storesAnalysis = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= dateRange.from && d <= dateRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTransactions = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = Math.max(0, budget?.sales_budget || 0);

      const salesCompliance = salesBudget > 0 && totalSales > 0 ? (totalSales / salesBudget) * 100 : 0;
      const hasData = storeSales.length > 0 && totalSales > 0;

      // Calcular cumplimiento del mes anterior
      const prevMonthSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
        } catch {
          return false;
        }
      });
      const prevTotalSales = prevMonthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const prevBudget = allBudgets.find(b => b.store_id === store.code && b.month === prevMonth && b.year === prevYear);
      const prevSalesBudget = prevBudget?.sales_budget || 0;
      const prevCompliance = prevSalesBudget > 0 && prevTotalSales > 0 ? (prevTotalSales / prevSalesBudget) * 100 : 0;
      const complianceTrend = prevCompliance > 0 ? salesCompliance - prevCompliance : 0;

      const daysElapsed = Math.max(1, storeSales.length);
      const daysInPeriod = Math.max(1, Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)));
      const dailyAvg = daysElapsed > 0 && totalSales > 0 ? totalSales / daysElapsed : 0;
      const projection = dailyAvg > 0 ? dailyAvg * daysInPeriod : 0;
      const avgDailyTransactions = daysElapsed > 0 && totalTransactions > 0 ? totalTransactions / daysElapsed : 0;

      let status = 'positive';
      if (!hasData) status = 'no_data';
      else if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      const gap = salesBudget - totalSales;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales, totalTransactions, avgTicket,
        salesBudget, salesCompliance, projection, status, gap,
        hasData, dailyAvg, avgDailyTransactions, complianceTrend, prevCompliance
      };
    });
  }, [allDailySales, allBudgets, dateRange, currentMonth, currentYear]);

  const zoneTotals = useMemo(() => {
    const storesWithData = storesAnalysis.filter(s => s.hasData);
    const totalSales = storesWithData.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesWithData.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesWithData.reduce((sum, s) => sum + s.projection, 0);
    const totalTransactions = storesWithData.reduce((sum, s) => sum + s.totalTransactions, 0);
    return { totalSales, totalBudget, totalProjection, totalTransactions };
  }, [storesAnalysis]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

  const statusCounts = useMemo(() => ({
    positive: storesAnalysis.filter(s => s.status === 'positive').length,
    negative: storesAnalysis.filter(s => s.status === 'negative').length,
    critical: storesAnalysis.filter(s => s.status === 'critical').length,
    no_data: storesAnalysis.filter(s => s.status === 'no_data').length
  }), [storesAnalysis]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return storesAnalysis;
    return storesAnalysis.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [storesAnalysis, searchQuery]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedStores = useMemo(() => {
    const sorted = [...filteredStores];
    
    if (sortConfig.key === 'status') {
      const statusOrder = { critical: 0, negative: 1, positive: 2, no_data: 3 };
      sorted.sort((a, b) => {
        const order = sortConfig.direction === 'asc' 
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
        return order !== 0 ? order : b.gap - a.gap;
      });
    } else if (sortConfig.key === 'name') {
      sorted.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'compliance') {
      sorted.sort((a, b) => {
        const comparison = a.salesCompliance - b.salesCompliance;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'sales') {
      sorted.sort((a, b) => {
        const comparison = a.totalSales - b.totalSales;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'gap') {
      sorted.sort((a, b) => {
        const comparison = a.gap - b.gap;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return sorted;
  }, [filteredStores, sortConfig]);

  const getExecutiveAction = (store) => {
    if (!store.hasData) return 'Activar registro de ventas';
    
    const zoneAvgTicket = zoneTotals.totalSales / zoneTotals.totalTransactions;
    const topStore = storesAnalysis.filter(s => s.hasData).sort((a, b) => b.salesCompliance - a.salesCompliance)[0];
    
    if (store.salesCompliance < 70) {
      if (store.gap > 5000000) return 'Visita ejecutiva + ajuste de dotación';
      if (store.avgTicket < zoneAvgTicket * 0.85) return 'Optimizar mix y ticket';
      if (store.totalTransactions < 100) return 'Revisión estratégica de horarios';
      return 'Intervención operativa inmediata';
    }
    
    if (store.salesCompliance < 90) {
      if (store.avgTicket < zoneAvgTicket) return 'Impulsar ticket promedio';
      if (store.projection >= store.salesBudget * 0.95) return 'Acelerar cierre semanal';
      return 'Reforzar ejecución diaria';
    }
    
    if (store.salesCompliance >= 110 && topStore?.code === store.code) {
      return 'Escalar mejores prácticas';
    }
    
    return 'Sostener desempeño';
  };

  const generateAIInsights = async () => {
    if (loadingInsights || aiInsights) return;
    setLoadingInsights(true);

    try {
      const storesWithData = storesAnalysis.filter(s => s.hasData);
      const criticalStores = storesAnalysis.filter(s => s.status === 'critical');
      const topStore = storesWithData.sort((a, b) => b.salesCompliance - a.salesCompliance)[0];
      const worstStore = storesWithData.sort((a, b) => a.salesCompliance - b.salesCompliance)[0];
      
      const totalGap = criticalStores.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
      const avgTicketZone = zoneTotals.totalSales / zoneTotals.totalTransactions;
      const daysLeft = Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) - new Date()) / (1000 * 60 * 60 * 24));

      const prompt = `Eres un analista ejecutivo de retail. Analiza esta zona y genera un reporte estructurado:

DATOS DE LA ZONA:
- Cumplimiento: ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(1)}%
- Venta actual: $${(zoneTotals.totalSales/1000000).toFixed(1)}M de $${(zoneTotals.totalBudget/1000000).toFixed(1)}M
- Brecha total: $${(totalGap/1000000).toFixed(1)}M
- Tiendas críticas: ${criticalStores.length} de ${storesAnalysis.length}
- Ticket promedio zona: $${avgTicketZone.toFixed(0)}
- Días restantes del mes: ${daysLeft}

TOP PERFORMER: ${topStore.name} (${topStore.salesCompliance.toFixed(0)}%, Ticket: $${topStore.avgTicket.toFixed(0)})
PEOR PERFORMER: ${worstStore.name} (${worstStore.salesCompliance.toFixed(0)}%, Brecha: $${(worstStore.gap/1000000).toFixed(1)}M)

TIENDAS CRÍTICAS DETALLE:
${criticalStores.slice(0, 3).map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% (Brecha: $${(s.gap/1000000).toFixed(1)}M, Ticket: $${s.avgTicket.toFixed(0)})`).join('\n')}

Genera:
1. Estado numérico conciso (máx 30 palabras)
2. Acción inmediata específica con números
3. Pronóstico: Si se ejecuta, cuánto cerraría la brecha en %`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            estado_numerico: { type: "string" },
            accion_inmediata: { type: "string" },
            pronostico_impacto: { type: "string" }
          }
        }
      });

      setAiInsights(result);
    } catch (e) {
      console.error(e);
    }
    setLoadingInsights(false);
  };

  useEffect(() => {
    if (storesAnalysis.length > 0 && !isLoading) {
      generateAIInsights();
    }
  }, [storesAnalysis.length, isLoading]);

  const tableContextSummary = useMemo(() => {
    const criticalStores = filteredStores.filter(s => s.status === 'critical');
    const totalGap = criticalStores.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
    
    if (criticalStores.length === 0) {
      const alertStores = filteredStores.filter(s => s.status === 'negative');
      if (alertStores.length === 0) {
        return `${filteredStores.filter(s => s.hasData).length} tiendas operando correctamente`;
      }
      return `${alertStores.length} tiendas requieren impulso`;
    }
    
    return `${criticalStores.length} tiendas críticas · Brecha total ${formatCurrency(totalGap)}`;
  }, [filteredStores]);

  // Datos para gráficas de KPIs
  const dailySalesData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const daySales = allDailySales
        .filter(s => {
          try {
            const d = new Date(s.date);
            return d.toDateString() === day.toDateString();
          } catch {
            return false;
          }
        })
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);
      
      return {
        date: format(day, 'dd/MM'),
        sales: daySales / 1000000
      };
    });
  }, [allDailySales, dateRange]);

  const statusDistributionData = useMemo(() => [
    { name: 'En Meta', value: statusCounts.positive, color: '#10b981' },
    { name: 'Alerta', value: statusCounts.negative, color: '#f59e0b' },
    { name: 'Críticas', value: statusCounts.critical, color: '#ef4444' }
  ], [statusCounts]);

  const criticalStoresData = useMemo(() => {
    return storesAnalysis
      .filter(s => s.status === 'critical')
      .sort((a, b) => a.salesCompliance - b.salesCompliance)
      .slice(0, 5)
      .map(s => ({
        name: s.name.substring(0, 8),
        value: s.salesCompliance
      }));
  }, [storesAnalysis]);

  const topStoresTrend = useMemo(() => {
    return storesAnalysis
      .filter(s => s.status === 'positive')
      .sort((a, b) => b.salesCompliance - a.salesCompliance)
      .slice(0, 5)
      .map(s => ({
        name: s.name.substring(0, 8),
        value: s.salesCompliance
      }));
  }, [storesAnalysis]);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Back Button */}
      <Link to={createPageUrl('Home')}>
        <div className="fixed left-3 sm:left-6 top-4 sm:top-8 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md flex items-center justify-center transition-all cursor-pointer z-50">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </div>
      </Link>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12 relative z-10">
        {/* Header - Responsive */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 tracking-tight">
                Bogotá Noroccidente
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-normal">
                {format(new Date(), 'EEEE dd \'de\' MMMM', { locale: es })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar tienda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <DateFilter 
                dateRange={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-lg h-32 sm:h-40 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : (
          <>
            {/* Botón Modo Comparable - Responsive */}
            <div className="mb-6 sm:mb-8">
              <button
                onClick={() => setShowComparable(true)}
                className="w-full rounded-lg p-4 sm:p-5 bg-white border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-teal-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5">Análisis Comparable</h3>
                      <p className="text-gray-500 text-xs hidden sm:block">Compara periodos e identifica tendencias</p>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* KPIs - Grid Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Venta Total */}
              <div
                onClick={() => setSelectedKPIDetail('sales')}
                className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all"
              >
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Venta Total</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 tabular-nums">
                  {formatShort(zoneTotals.totalSales)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">Meta: {formatShort(zoneTotals.totalBudget)}</p>
              </div>

              {/* % Cumplimiento */}
              <div
                onClick={() => setSelectedKPIDetail('compliance')}
                className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all"
              >
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Cumplimiento</p>
                <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 tabular-nums ${
                  ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-teal-600' :
                  ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                </p>
                <div className="flex gap-3 text-[10px] sm:text-xs">
                  <span className="text-gray-500">En Meta: <span className="font-semibold text-teal-600">{statusCounts.positive}</span></span>
                  <span className="text-gray-500">Críticas: <span className="font-semibold text-red-600">{statusCounts.critical}</span></span>
                </div>
              </div>

              {/* Críticas */}
              <div
                onClick={() => setSelectedKPIDetail('critical')}
                className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-red-400 cursor-pointer transition-all"
              >
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Tiendas Críticas</p>
                <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 tabular-nums ${
                  statusCounts.critical > 0 ? 'text-red-600' : 'text-gray-300'
                }`}>
                  {statusCounts.critical}
                </p>
                {statusCounts.critical > 0 && (
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                  </p>
                )}
              </div>

              {/* En Meta */}
              <div
                onClick={() => setSelectedKPIDetail('meta')}
                className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all"
              >
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">En Meta</p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-teal-600 mb-1 sm:mb-2 tabular-nums">
                  {statusCounts.positive}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                </p>
              </div>
            </div>

            {/* Alerta Crítica */}
            {statusCounts.critical > 0 && (
              <div className="mb-6 sm:mb-8">
                <div className={`rounded-lg p-4 sm:p-5 border-l-4 ${
                  statusCounts.critical >= STORES.length * 0.7 
                    ? 'bg-red-50 border-red-600' 
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <p className="text-sm sm:text-base font-bold mb-1 ${
                    statusCounts.critical >= STORES.length * 0.7 ? 'text-red-900' : 'text-amber-900'
                  }">
                    {statusCounts.critical} de {STORES.length} tiendas críticas ({'<'}70%)
                  </p>
                  <p className="text-xs sm:text-sm mb-2 ${
                    statusCounts.critical >= STORES.length * 0.7 ? 'text-red-700' : 'text-amber-700'
                  }">
                    {statusCounts.critical >= STORES.length * 0.7 
                      ? 'Acción inmediata requerida'
                      : 'Requiere atención urgente'
                    }
                  </p>
                  <button
                    onClick={() => {
                      const el = document.getElementById('stores-table');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-xs font-semibold underline ${
                      statusCounts.critical >= STORES.length * 0.7 ? 'text-red-900' : 'text-amber-900'
                    }`}
                  >
                    Ver tiendas →
                  </button>
                </div>
              </div>
            )}

            {/* Contexto */}
            <div className="mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{tableContextSummary}</p>
            </div>

            {/* Tabla - Responsive con scroll horizontal en móvil */}
            <div id="stores-table" className="mb-8 sm:mb-12">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th 
                        onClick={() => handleSort('name')}
                        className="text-left py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          Tienda
                          {sortConfig.key === 'name' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('compliance')}
                        className="text-right py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          % Cumplimiento
                          {sortConfig.key === 'compliance' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('sales')}
                        className="text-right py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Venta vs Meta
                          {sortConfig.key === 'sales' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('gap')}
                        className="text-right py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Brecha $
                          {sortConfig.key === 'gap' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th className="text-right py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Venta/Día
                      </th>
                      <th className="text-right py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Trans/Día
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="text-center py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Estado
                          {sortConfig.key === 'status' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-3 sm:py-3 sm:px-4 lg:py-4 lg:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStores
                      .map((store, idx) => {
                        const action = getExecutiveAction(store);

                        return (
                          <tr
                            key={store.code}
                            onClick={() => store.hasData && setSelectedStoreDetail(store)}
                            className={`border-b border-gray-100 ${
                              store.hasData ? 'cursor-pointer hover:bg-gray-50' : ''
                            }`}
                          >
                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5">
                              <p className={`font-semibold text-sm sm:text-base ${
                                !store.hasData ? 'text-gray-400' : 'text-gray-900'
                              }`}>
                                {store.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{store.code}</p>
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5">
                              {!store.hasData ? (
                                <span className="text-xs sm:text-sm text-gray-400 italic block text-right">Sin datos</span>
                              ) : (
                                <div className="flex items-center justify-end gap-2 sm:gap-3">
                                  <div className="w-16 sm:w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      style={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                      className={`h-full ${
                                        store.salesCompliance >= 90 ? 'bg-teal-500' :
                                        store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                  <span className={`font-bold text-base sm:text-xl lg:text-2xl tabular-nums ${
                                    store.salesCompliance >= 90 ? 'text-teal-600' :
                                    store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {store.salesCompliance.toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 text-right hidden sm:table-cell">
                              {!store.hasData ? (
                                <span className="text-xs sm:text-sm text-gray-400">—</span>
                              ) : (
                                <div>
                                  <p className="font-semibold text-gray-900 text-xs sm:text-sm tabular-nums">{formatShort(store.totalSales)}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">de {formatShort(store.salesBudget)}</p>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 text-right hidden lg:table-cell">
                              {!store.hasData ? (
                                <span className="text-sm text-gray-400">—</span>
                              ) : (
                                <p className={`font-bold text-sm lg:text-base tabular-nums ${
                                  store.gap > 0 ? 'text-red-600' : 'text-teal-600'
                                }`}>
                                  {formatShort(Math.abs(store.gap))}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 text-right hidden lg:table-cell">
                              {!store.hasData ? (
                                <span className="text-sm text-gray-400">—</span>
                              ) : (
                                <p className="font-semibold text-gray-900 text-sm tabular-nums">{formatShort(store.dailyAvg)}</p>
                              )}
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 text-right hidden lg:table-cell">
                              {!store.hasData ? (
                                <span className="text-sm text-gray-400">—</span>
                              ) : (
                                <p className="font-semibold text-gray-900 text-sm tabular-nums">{store.avgDailyTransactions.toFixed(0)}</p>
                              )}
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 text-center">
                              <span className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                                store.status === 'no_data' ? 'bg-gray-300' :
                                store.status === 'positive' ? 'bg-teal-500' : 
                                store.status === 'negative' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                            </td>

                            <td className="py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-5 hidden xl:table-cell">
                              <p className={`text-xs sm:text-sm ${
                                !store.hasData ? 'text-gray-400 italic' : 'text-gray-600'
                              }`}>
                                {action}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prioridades Dinámicas */}
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-5 tracking-tight">Prioridades de hoy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Intervenir */}
                {storesAnalysis
                  .filter(s => s.status === 'critical')
                  .sort((a, b) => b.gap - a.gap)
                  .slice(0, 1)
                  .map(store => (
                    <div
                      key={store.code}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="bg-white rounded-lg p-4 sm:p-5 border-l-4 border-red-600 hover:shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase tracking-wide">Intervenir Hoy</p>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{store.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Cumplimiento</span>
                          <span className="text-base sm:text-lg font-bold text-red-600 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Brecha</span>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 tabular-nums">{formatShort(store.gap)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-teal-600 text-xs sm:text-sm font-medium">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Ver detalle</span>
                      </div>
                    </div>
                  ))}

                {/* Acelerar */}
                {storesAnalysis
                  .filter(s => s.status === 'negative' && s.salesCompliance >= 80)
                  .sort((a, b) => b.salesCompliance - a.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <div
                      key={store.code}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="bg-white rounded-lg p-4 sm:p-5 border-l-4 border-amber-500 hover:shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wide">Acelerar</p>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{store.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Cumplimiento</span>
                          <span className="text-base sm:text-lg font-bold text-amber-600 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Falta 90%</span>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 tabular-nums">{(90 - store.salesCompliance).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-teal-600 text-xs sm:text-sm font-medium">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Ver detalle</span>
                      </div>
                    </div>
                  ))}

                {/* Reconocer */}
                {storesAnalysis
                  .filter(s => s.status === 'positive' && s.salesCompliance >= 110)
                  .sort((a, b) => b.salesCompliance - a.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <div
                      key={store.code}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="bg-white rounded-lg p-4 sm:p-5 border-l-4 border-teal-500 hover:shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold text-teal-600 uppercase tracking-wide">Reconocer</p>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{store.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Cumplimiento</span>
                          <span className="text-base sm:text-lg font-bold text-teal-600 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Sobre meta</span>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 tabular-nums">+{(store.salesCompliance - 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-teal-600 text-xs sm:text-sm font-medium">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Ver detalle</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Análisis Inteligente - Oculto en móvil, visible en desktop */}
            {aiInsights && (
              <div className="hidden lg:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 lg:p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Análisis IA</p>
                      <p className="text-xs text-gray-500">Diagnóstico + Acción</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Estado Numérico */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Diagnóstico</p>
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {aiInsights.estado_numerico}
                      </p>
                    </div>

                    {/* Acción Inmediata */}
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Acción</p>
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed font-medium">
                        {aiInsights.accion_inmediata}
                      </p>
                    </div>

                    {/* Pronóstico */}
                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">Pronóstico</p>
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {aiInsights.pronostico_impacto}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPIs de Proyección */}
                <div className="p-5 lg:p-6 bg-gray-50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Proyección Mes</p>
                      <p className="text-xl font-bold text-gray-900 tabular-nums">{formatShort(zoneTotals.totalProjection)}</p>
                      <p className="text-xs text-gray-500">vs {formatShort(zoneTotals.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">% Proyectado</p>
                      <p className={`text-xl font-bold tabular-nums ${
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-teal-600' :
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Gap a Cerrar</p>
                      <p className={`text-xl font-bold tabular-nums ${
                        (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-teal-600' : 'text-red-600'
                      }`}>
                        {formatShort(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">En Riesgo</p>
                      <p className="text-xl font-bold text-gray-900 tabular-nums">
                        {storesAnalysis.filter(s => s.hasData && (s.projection / s.salesBudget) < 0.85).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalle Tienda */}
      <AnimatePresence>
        {selectedStoreDetail && (
          <StoreDetailModal
            store={selectedStoreDetail}
            onClose={() => setSelectedStoreDetail(null)}
            allDailySales={allDailySales}
            dateRange={dateRange}
          />
        )}
      </AnimatePresence>

      {/* Modal Detalle KPI */}
      <AnimatePresence>
        {selectedKPIDetail && (
          <KPIDetailModal
            kpiType={selectedKPIDetail}
            onClose={() => setSelectedKPIDetail(null)}
            data={{ allDailySales, allBudgets }}
            dateRange={dateRange}
            storesAnalysis={storesAnalysis}
            zoneTotals={zoneTotals}
          />
        )}
      </AnimatePresence>

      {/* Modal Comparable */}
      <AnimatePresence>
        {showComparable && (
          <ExecutiveComparable
            onClose={() => setShowComparable(false)}
            allDailySales={allDailySales}
          />
        )}
      </AnimatePresence>
    </div>
  );
}