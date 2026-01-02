import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Eye, Zap, Award, Brain, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, Settings, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { format, startOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreDetailModal from '../components/executive/StoreDetailModal';
import KPIDetailModal from '../components/executive/KPIDetailModal';
import ExecutiveComparable from '../components/executive/ExecutiveComparable';
import ZoneBudgetManager from '../components/executive/ZoneBudgetManager';
import ZoneChartsPanel from '../components/executive/ZoneChartsPanel';
import PlannerStatusPanel from '../components/executive/PlannerStatusPanel';
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
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showZoneCharts, setShowZoneCharts] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

  const ZONE_NAME = 'Bogotá Noroccidente';

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

  const { data: zoneBudgets = [] } = useQuery({
    queryKey: ['zoneBudgets', ZONE_NAME],
    queryFn: () => base44.entities.ZoneBudget.filter({ zone_name: ZONE_NAME })
  });

  const currentZoneBudget = useMemo(() => {
    // Primero buscar el presupuesto activo
    const activeBudget = zoneBudgets.find(b => b.is_active === true);
    if (activeBudget) return activeBudget;
    
    // Si no hay activo, usar el del mes/año actual
    return zoneBudgets.find(b => b.month === currentMonth && b.year === currentYear);
  }, [zoneBudgets, currentMonth, currentYear]);

  const isLoading = loadingSales || loadingBudgets;

  const storesAnalysis = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    return STORES.map(store => {
      // VENTAS DE LA SEMANA ACTUAL (retail: lunes a domingo)
      const weekSales = allDailySales.filter(s => {
        if (s.store_id !== store.code) return false;
        try {
          const saleDate = parseISO(s.date);
          return saleDate >= currentWeekStart && saleDate <= currentWeekEnd;
        } catch {
          return false;
        }
      });

      const weekTotalSales = weekSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const weekTotalTransactions = weekSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const weekAvgTicket = weekTotalTransactions > 0 ? weekTotalSales / weekTotalTransactions : 0;

      // VENTAS DEL MES (para cumplimiento mensual)
      const monthSales = allDailySales.filter(s => {
        if (s.store_id !== store.code) return false;
        try {
          const saleDate = parseISO(s.date);
          return saleDate >= monthStart && saleDate <= now;
        } catch {
          return false;
        }
      });

      const monthTotalSales = monthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const monthTotalTransactions = monthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);

      // Presupuesto mensual
      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true);
      const budget = activeBudget || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = budget?.sales_budget || 0;

      // PROYECCIONES
      const daysElapsed = now.getDate();
      const daysRemaining = daysInMonth - daysElapsed;
      const dailyAvgMonth = daysElapsed > 0 ? monthTotalSales / daysElapsed : 0;
      const monthProjection = monthTotalSales + (dailyAvgMonth * daysRemaining);

      // Proyección de semana (días transcurridos vs días totales de la semana)
      const daysPassedInWeek = Math.max(1, weekSales.length);
      const avgDailySalesWeek = weekTotalSales / daysPassedInWeek;
      const weekProjection = avgDailySalesWeek * 7;

      // PROMEDIOS
      const avgDailySales = dailyAvgMonth;
      const avgDailyTransactions = daysElapsed > 0 ? monthTotalTransactions / daysElapsed : 0;

      // CUMPLIMIENTO
      const salesCompliance = salesBudget > 0 ? (monthTotalSales / salesBudget) * 100 : 0;
      const hasData = weekTotalSales > 0 || monthTotalSales > 0;

      let status = 'positive';
      if (!hasData) status = 'no_data';
      else if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      const gap = salesBudget - monthTotalSales;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        // Semana
        weekTotalSales,
        weekTotalTransactions,
        weekAvgTicket,
        weekProjection,
        // Mes
        monthTotalSales,
        monthTotalTransactions,
        monthProjection,
        // Presupuesto y cumplimiento
        salesBudget,
        salesCompliance,
        status,
        gap,
        hasData,
        // Promedios
        avgDailySales,
        avgDailyTransactions,
        // Legacy para compatibilidad
        totalSales: monthTotalSales,
        totalTransactions: monthTotalTransactions,
        avgTicket: weekAvgTicket,
        projection: monthProjection,
        dailyAvg: avgDailySales
      };
    });
  }, [allDailySales, allBudgets, currentMonth, currentYear]);

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
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = allDailySales
        .filter(s => {
          const saleDateStr = s.date?.split('T')[0] || s.date;
          return saleDateStr === dayStr;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Simplified Background - Static */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-pink-500/15 via-purple-500/15 to-blue-500/15 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Back Button */}
      <Link to={createPageUrl('Home')}>
        <div className="fixed left-3 sm:left-6 top-4 sm:top-8 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer z-50">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </Link>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-12 lg:py-16 relative z-10">
        {/* Header - Responsive */}
        <div className="mb-6 sm:mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                Bogotá Noroccidente
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-400 font-normal">
                {format(new Date(), 'EEEE dd \'de\' MMMM', { locale: es })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <DateFilter 
                dateRange={dateRange} 
                onDateChange={setDateRange} 
              />
              <button
                onClick={() => setShowBudgetManager(true)}
                className="h-10 px-4 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 flex items-center gap-2 text-white text-sm font-medium transition-all"
              >
                <Settings className="w-4 h-4" />
                Presupuesto
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl h-32 sm:h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Botones de Análisis */}
            <div className="mb-6 sm:mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowComparable(true)}
                className="w-full rounded-xl p-4 sm:p-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-purple-500/40 hover:border-purple-400/60 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-xl font-black text-white mb-0.5">Análisis Comparable</h3>
                      <p className="text-slate-300 text-xs hidden sm:block">Compara periodos y tendencias</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowZoneCharts(true)}
                className="w-full rounded-xl p-4 sm:p-6 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-blue-500/40 hover:border-blue-400/60 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-xl font-black text-white mb-0.5">Gráficas de Zona</h3>
                      <p className="text-slate-300 text-xs hidden sm:block">Análisis visual detallado</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* KPIs - Grid Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-20">
              {/* Venta Total */}
              <div
                onClick={() => setSelectedKPIDetail('sales')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 cursor-pointer"
              >
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-4">💰 Venta Total</p>
                  <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 tracking-tight tabular-nums">
                    {formatShort(zoneTotals.totalSales)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-300 font-semibold">Meta: {formatShort(zoneTotals.totalBudget)}</p>
                </div>
              </div>

              {/* % Cumplimiento */}
              <div
                onClick={() => setSelectedKPIDetail('compliance')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 cursor-pointer"
              >
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-4">
                    📊 Cumplimiento {currentZoneBudget ? 'vs Zona' : 'vs Tiendas'}
                  </p>
                  <p className={`text-3xl sm:text-5xl lg:text-7xl font-black mb-2 sm:mb-3 tracking-tight tabular-nums ${
                    currentZoneBudget ? 
                      ((zoneTotals.totalSales/currentZoneBudget.sales_budget)*100) >= 90 ? 'text-emerald-400' :
                      ((zoneTotals.totalSales/currentZoneBudget.sales_budget)*100) >= 70 ? 'text-amber-400' : 'text-red-400'
                    :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-400' :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {currentZoneBudget ? 
                      ((zoneTotals.totalSales/currentZoneBudget.sales_budget)*100).toFixed(0) :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)
                    }%
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] sm:text-xs">
                      <span className="text-slate-400">Meta</span>
                      <span className="text-emerald-400 font-bold">{statusCounts.positive}</span>
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs">
                      <span className="text-slate-400">Críticas</span>
                      <span className="text-red-400 font-bold">{statusCounts.critical}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Críticas */}
              <div
                onClick={() => setSelectedKPIDetail('critical')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 cursor-pointer"
              >
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-4">🔴 Críticas</p>
                  <p className={`text-3xl sm:text-5xl lg:text-7xl font-black mb-2 sm:mb-3 tracking-tight tabular-nums ${
                    statusCounts.critical > 0 ? 'text-red-400' : 'text-slate-600'
                  }`}>
                    {statusCounts.critical}
                  </p>
                  {statusCounts.critical > 0 && (
                    <p className="text-[10px] sm:text-xs text-red-300 font-semibold">
                      {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                    </p>
                  )}
                </div>
              </div>

              {/* En Meta */}
              <div
                onClick={() => setSelectedKPIDetail('meta')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 cursor-pointer"
              >
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-4">🟢 En Meta</p>
                  <p className="text-3xl sm:text-5xl lg:text-7xl font-black text-emerald-400 mb-2 sm:mb-3 tracking-tight tabular-nums">
                    {statusCounts.positive}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-300 font-semibold">
                    {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                  </p>
                </div>
              </div>
            </div>

            {/* Alerta Crítica */}
            {statusCounts.critical > 0 && (
              <div className="mb-6 sm:mb-10 lg:mb-16">
                <div className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-10 overflow-hidden ${
                  statusCounts.critical >= STORES.length * 0.7 
                    ? 'bg-gradient-to-r from-red-500/90 to-rose-600/90' 
                    : 'bg-gradient-to-r from-amber-500/90 to-orange-600/90'
                } backdrop-blur-xl border border-white/20`}>
                  <div className="relative z-10">
                    <p className="text-base sm:text-2xl lg:text-3xl font-black text-white mb-2 sm:mb-4 leading-tight">
                      {statusCounts.critical} de {STORES.length} tiendas críticas ({'<'}70%)
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-3 sm:mb-6 font-medium">
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
                      className="text-xs sm:text-sm font-bold text-white underline"
                    >
                      Ver tiendas →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel de Estado del Planner */}
            <div className="mb-8 sm:mb-12 lg:mb-20">
              <PlannerStatusPanel stores={STORES.map(s => ({ code: s.code, name: getDisplayName(s.code) }))} />
            </div>

            {/* Contexto */}
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-slate-400">{tableContextSummary}</p>
            </div>

            {/* Tabla - Responsive con scroll horizontal en móvil */}
            <div id="stores-table" className="mb-8 sm:mb-12 lg:mb-20">
              <div className="bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th 
                        onClick={() => handleSort('name')}
                        className="text-left py-3 px-3 sm:py-4 sm:px-4 lg:py-5 lg:px-6 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          Tienda
                          {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider">
                        Semana
                      </th>
                      <th className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Proy. Semana
                      </th>
                      <th className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Proy. Mes
                      </th>
                      <th 
                        onClick={() => handleSort('compliance')}
                        className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          % Mes
                          {sortConfig.key === 'compliance' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Venta/Día
                      </th>
                      <th className="text-right py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Trans/Día
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="text-center py-3 px-3 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Estado
                          {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStores.map((store) => (
                      <tr
                        key={store.code}
                        onClick={() => store.hasData && setSelectedStoreDetail(store)}
                        className={`border-b border-white/5 ${store.hasData ? 'cursor-pointer hover:bg-white/5' : ''}`}
                      >
                        {/* Tienda */}
                        <td className="py-3 px-3 sm:py-4 sm:px-4">
                          <p className={`font-bold text-sm ${!store.hasData ? 'text-slate-600' : 'text-white'}`}>
                            {store.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{store.code}</p>
                        </td>

                        {/* Semana Actual */}
                        <td className="py-3 px-3 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div>
                              <p className="font-black text-purple-400 text-sm tabular-nums">{formatShort(store.weekTotalSales)}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">{store.weekTotalTransactions.toLocaleString()} trans</p>
                              <p className="text-[9px] text-pink-400 mt-0.5">{formatCurrency(store.weekAvgTicket).slice(0, -3)}</p>
                            </div>
                          )}
                        </td>

                        {/* Proyección Semana */}
                        <td className="py-3 px-3 text-right hidden sm:table-cell">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <p className="font-bold text-cyan-400 text-sm tabular-nums">{formatShort(store.weekProjection)}</p>
                          )}
                        </td>

                        {/* Proyección Mes */}
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div>
                              <p className="font-bold text-emerald-400 text-sm tabular-nums">{formatShort(store.monthProjection)}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                {((store.monthProjection / store.salesBudget) * 100).toFixed(0)}% proyectado
                              </p>
                            </div>
                          )}
                        </td>

                        {/* % Cumplimiento Mes */}
                        <td className="py-3 px-3 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 sm:w-16 bg-white/10 rounded-full h-1 overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                  className={`h-full ${
                                    store.salesCompliance >= 90 ? 'bg-emerald-500' :
                                    store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                />
                              </div>
                              <span className={`font-black text-base sm:text-xl tabular-nums ${
                                store.salesCompliance >= 90 ? 'text-emerald-400' :
                                store.salesCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {store.salesCompliance.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Venta Promedio/Día */}
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <p className="font-bold text-white text-sm tabular-nums">{formatShort(store.avgDailySales)}</p>
                          )}
                        </td>

                        {/* Trans Promedio/Día */}
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <p className="font-bold text-cyan-400 text-sm tabular-nums">{store.avgDailyTransactions.toFixed(0)}</p>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                            store.status === 'no_data' ? 'bg-slate-600' :
                            store.status === 'positive' ? 'bg-emerald-500' : 
                            store.status === 'negative' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prioridades Dinámicas */}
            <div className="mb-8 sm:mb-12 lg:mb-20">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-4 sm:mb-6 lg:mb-10 tracking-tight">Prioridades de hoy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Intervenir */}
                {storesAnalysis
                  .filter(s => s.status === 'critical')
                  .sort((a, b) => b.gap - a.gap)
                  .slice(0, 1)
                  .map(store => (
                    <div
                      key={store.code}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="relative bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-xl rounded-xl p-4 sm:p-6 lg:p-8 border border-red-500/30 cursor-pointer"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-red-300 uppercase tracking-wide">Intervenir Hoy</p>
                            <p className="font-black text-white text-sm sm:text-base lg:text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-base sm:text-lg lg:text-xl font-black text-red-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Brecha</span>
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-white tabular-nums">{formatShort(store.gap)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-semibold">Ver detalle</span>
                        </div>
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
                      className="relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-xl p-4 sm:p-6 lg:p-8 border border-amber-500/30 cursor-pointer"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wide">Acelerar</p>
                            <p className="font-black text-white text-sm sm:text-base lg:text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-base sm:text-lg lg:text-xl font-black text-amber-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Falta 90%</span>
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-white tabular-nums">{(90 - store.salesCompliance).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-semibold">Ver detalle</span>
                        </div>
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
                      className="relative bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-xl rounded-xl p-4 sm:p-6 lg:p-8 border border-emerald-500/30 cursor-pointer"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wide">Reconocer</p>
                            <p className="font-black text-white text-sm sm:text-base lg:text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-slate-300">Sobre meta</span>
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-white tabular-nums">+{(store.salesCompliance - 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-semibold">Ver detalle</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Análisis Inteligente - Oculto en móvil, visible en desktop */}
            {aiInsights && (
              <div className="hidden lg:block bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-purple-500/20">
                  <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">Análisis IA</p>
                      <p className="text-xs lg:text-sm text-slate-400">Diagnóstico + Acción</p>
                    </div>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    {/* Estado Numérico */}
                    <div className="bg-white/5 rounded-xl p-4 lg:p-6 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-purple-400" />
                        <p className="text-[10px] lg:text-xs font-bold text-purple-300 uppercase tracking-wider">📊 Diagnóstico</p>
                      </div>
                      <p className="text-sm lg:text-lg text-white leading-relaxed">
                        {aiInsights.estado_numerico}
                      </p>
                    </div>

                    {/* Acción Inmediata */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 lg:p-6 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-amber-400" />
                        <p className="text-[10px] lg:text-xs font-bold text-amber-300 uppercase tracking-wider">🎯 Acción</p>
                      </div>
                      <p className="text-sm lg:text-lg text-white leading-relaxed font-medium">
                        {aiInsights.accion_inmediata}
                      </p>
                    </div>

                    {/* Pronóstico */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 lg:p-6 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-400" />
                        <p className="text-[10px] lg:text-xs font-bold text-emerald-300 uppercase tracking-wider">📈 Pronóstico</p>
                      </div>
                      <p className="text-sm lg:text-lg text-white leading-relaxed">
                        {aiInsights.pronostico_impacto}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPIs de Proyección - Oculto en móvil */}
                <div className="hidden lg:block p-6 lg:p-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Proyección Mes</p>
                      <p className="text-2xl lg:text-3xl font-black text-white tabular-nums mb-1">{formatShort(zoneTotals.totalProjection)}</p>
                      <p className="text-xs text-purple-300">vs {formatShort(zoneTotals.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">% Proyectado</p>
                      <p className={`text-2xl lg:text-3xl font-black tabular-nums ${
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-400' :
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Gap a Cerrar</p>
                      <p className={`text-2xl lg:text-3xl font-black tabular-nums ${
                        (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatShort(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">En Riesgo</p>
                      <p className="text-2xl lg:text-3xl font-black text-white tabular-nums mb-1">
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

      {/* Modal Budget Manager */}
      <AnimatePresence>
        {showBudgetManager && (
          <ZoneBudgetManager
            zoneName={ZONE_NAME}
            onClose={() => setShowBudgetManager(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal Zone Charts */}
      <AnimatePresence>
        {showZoneCharts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowZoneCharts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 max-w-7xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Análisis de Zona</h2>
                      <p className="text-sm text-slate-300">{ZONE_NAME}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowZoneCharts(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <ZoneChartsPanel
                  allDailySales={allDailySales}
                  storesAnalysis={storesAnalysis}
                  dateRange={dateRange}
                  zoneTotals={zoneTotals}
                  zoneBudget={currentZoneBudget}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}