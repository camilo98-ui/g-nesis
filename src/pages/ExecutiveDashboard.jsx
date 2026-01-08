import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Eye, Zap, Award, Brain, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, Settings, X, Download, Filter, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO, eachWeekOfInterval, addDays, isSameDay, isWithinInterval, endOfMonth } from 'date-fns';
import ExecutiveStoreDetailModal from '../components/executive/ExecutiveStoreDetailModal';
import KPIDetailModal from '../components/executive/KPIDetailModal';
import ExecutiveComparable from '../components/executive/ExecutiveComparable';
import ZoneBudgetManager from '../components/executive/ZoneBudgetManager';
import ZoneChartsPanel from '../components/executive/ZoneChartsPanel';
import PlannerStatusPanel from '../components/executive/PlannerStatusPanel';
import StoreWeeklyChart from '../components/executive/StoreWeeklyChart';
import { useExecutiveTooltip } from '../components/executive/ExecutiveChartTooltip';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ComposedChart, Tooltip, Legend, ReferenceLine } from 'recharts';

export default function ExecutiveDashboard() {
  // Semana retail iniciando 29 de diciembre 2025
  const RETAIL_WEEK_START = new Date(2025, 11, 29); // 29 dic 2025
  
  const [dateRange, setDateRange] = useState({ 
    from: RETAIL_WEEK_START, 
    to: addDays(RETAIL_WEEK_START, 6) // Primera semana
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [hoveredKPI, setHoveredKPI] = useState(null);
  const [selectedKPIDetail, setSelectedKPIDetail] = useState(null);
  const [showComparable, setShowComparable] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showZoneCharts, setShowZoneCharts] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'compliance', direction: 'desc' });
  const [columnFilters, setColumnFilters] = useState({});
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    // Usar el rango de fechas seleccionado
    const currentWeekStart = dateRange.from;
    const currentWeekEnd = dateRange.to;
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    // Debug inicial
    console.log('🔍 INICIO ANÁLISIS:', {
      weekRange: `${format(currentWeekStart, 'yyyy-MM-dd')} a ${format(currentWeekEnd, 'yyyy-MM-dd')}`,
      totalSalesRecords: allDailySales.length,
      sampleDates: allDailySales.slice(0, 3).map(s => ({ store: s.store_id, date: s.date, sales: s.total_sales }))
    });

    return STORES.map(store => {
      // Filtrar ventas de esta tienda
      const storeSales = allDailySales.filter(s => s.store_id === store.code);

      // Analizar histórico de ventas por día de la semana
      const salesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
      const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];

      storeSales.forEach(s => {
        try {
          const saleDate = parseISO(s.date);
          const dayOfWeek = saleDate.getDay();
          if (s.total_sales && s.total_sales > 0) {
            salesByDayOfWeek[dayOfWeek] += s.total_sales;
            countByDayOfWeek[dayOfWeek]++;
          }
        } catch (error) {
          console.error('Error parsing date:', s.date, error);
        }
      });

      const avgByDayOfWeek = salesByDayOfWeek.map((sum, idx) => 
        countByDayOfWeek[idx] > 0 ? sum / countByDayOfWeek[idx] : 0
      );
      const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);

      // Presupuesto mensual
      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true);
      const budget = activeBudget || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = budget?.sales_budget || 0;

      const TARGET_PERCENTAGE = 1.15;
      const adjustedMonthlyBudget = salesBudget * TARGET_PERCENTAGE;
      const dailyBaseBudget = adjustedMonthlyBudget / daysInMonth;

      // Función para obtener presupuesto diario ajustado
      const getDailyBudget = (date) => {
        if (totalWeeklyAvg === 0) return dailyBaseBudget;
        const dayOfWeek = date.getDay();
        if (countByDayOfWeek[dayOfWeek] >= 3) {
          const totalHistoricalAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
          const monthlyHistoricalProjection = totalHistoricalAvg * (daysInMonth / 7);
          const scaleFactor = adjustedMonthlyBudget / monthlyHistoricalProjection;
          return avgByDayOfWeek[dayOfWeek] * scaleFactor;
        }
        return dailyBaseBudget;
      };

      // PPT del día de hoy
      const adjustedDailyBudget = getDailyBudget(now);

      // Presupuesto semanal - suma de presupuestos diarios de la semana que caen en el mes
      const daysInCurrentWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd })
        .filter(d => d >= monthStart && d <= monthEnd);
      // Meta semanal más agresiva: 120% del presupuesto base
      const WEEKLY_TARGET = 1.20;
      const weeklyBudget = daysInCurrentWeek.reduce((sum, day) => sum + getDailyBudget(day), 0) * WEEKLY_TARGET;

      // VENTAS DE LA SEMANA ACTUAL
      const weekSales = storeSales.filter(s => {
        try {
          const saleDate = parseISO(s.date);
          const isInRange = isWithinInterval(saleDate, { start: currentWeekStart, end: currentWeekEnd });
          
          // Debug temporal
          if (store.code === 'BTA 11' && isInRange) {
            console.log('✅ Venta encontrada en semana:', {
              store: store.code,
              date: s.date,
              sales: s.total_sales,
              weekStart: currentWeekStart.toISOString(),
              weekEnd: currentWeekEnd.toISOString()
            });
          }
          
          return isInRange;
        } catch (error) {
          console.error('Error parseando fecha:', s.date, error);
          return false;
        }
      });

      const weekTotalSales = weekSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const weekTotalTransactions = weekSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const weekAvgTicket = weekTotalTransactions > 0 ? weekTotalSales / weekTotalTransactions : 0;
      
      // Debug temporal para primera tienda
      if (store.code === 'BTA 11') {
        console.log('📊 Análisis BTA 11:', {
          weekSalesCount: weekSales.length,
          weekTotalSales,
          weekTotalTransactions,
          allSalesCount: storeSales.length,
          dateRange: `${currentWeekStart.toISOString().split('T')[0]} a ${currentWeekEnd.toISOString().split('T')[0]}`
        });
      }

      // VENTAS DEL MES
      const monthSales = storeSales.filter(s => {
        try {
          const saleDate = parseISO(s.date);
          return saleDate >= monthStart && saleDate <= now;
        } catch {
          return false;
        }
      });

      const monthTotalSales = monthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const monthTotalTransactions = monthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);

      // PROYECCIONES con histórico
      const daysPassedInWeek = eachDayOfInterval({ start: currentWeekStart, end: now }).filter(d => d <= now).length;
      const avgDailySalesWeek = daysPassedInWeek > 0 ? weekTotalSales / daysPassedInWeek : 0;
      const totalDaysInWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }).length;
      
      const historicalWeight = daysPassedInWeek <= 2 ? 0.8 : 0.4;
      const currentWeight = 1 - historicalWeight;
      const historicalDailyAvg = totalWeeklyAvg > 0 ? totalWeeklyAvg / 7 : avgDailySalesWeek;
      const blendedDailyAvg = (historicalDailyAvg * historicalWeight) + (avgDailySalesWeek * currentWeight);
      const weekProjection = blendedDailyAvg * totalDaysInWeek;

      const daysElapsed = now.getDate();
      const daysRemaining = daysInMonth - daysElapsed;
      const dailyAvgMonth = daysElapsed > 0 ? monthTotalSales / daysElapsed : 0;
      const monthProjection = monthTotalSales + (dailyAvgMonth * daysRemaining);

      // CUMPLIMIENTO
      const salesCompliance = salesBudget > 0 ? (monthTotalSales / salesBudget) * 100 : 0;
      const weekCompliance = weeklyBudget > 0 ? (weekTotalSales / weeklyBudget) * 100 : 0;
      const weekProjectionCompliance = weeklyBudget > 0 ? (weekProjection / weeklyBudget) * 100 : 0;
      const monthProjectionCompliance = salesBudget > 0 ? (monthProjection / salesBudget) * 100 : 0;
      const hasData = weekTotalSales > 0 || monthTotalSales > 0;

      let status = 'positive';
      if (!hasData) status = 'no_data';
      else if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      const gap = salesBudget - monthTotalSales;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        // PPT Diario
        dailyBudget: adjustedDailyBudget,
        getDailyBudget, // Exportar la función para uso externo
        // Semana
        weekTotalSales,
        weekTotalTransactions,
        weekAvgTicket,
        weekProjection,
        weeklyBudget,
        weekCompliance,
        weekProjectionCompliance,
        // Mes
        monthTotalSales,
        monthTotalTransactions,
        monthProjection,
        monthProjectionCompliance,
        // Presupuesto y cumplimiento
        salesBudget,
        salesCompliance,
        status,
        gap,
        hasData,
        // Promedios
        avgDailySales: dailyAvgMonth,
        avgDailyTransactions: daysElapsed > 0 ? monthTotalTransactions / daysElapsed : 0,
        // Legacy
        totalSales: monthTotalSales,
        totalTransactions: monthTotalTransactions,
        avgTicket: weekAvgTicket,
        projection: monthProjection,
        dailyAvg: dailyAvgMonth
      };
    });
  }, [allDailySales, allBudgets, currentMonth, currentYear, dateRange]);

  // Totales de la SEMANA seleccionada (para gráficas específicas)
  const zoneTotals = useMemo(() => {
    const storesWithData = storesAnalysis.filter(s => s.hasData);
    const totalSales = storesWithData.reduce((sum, s) => sum + s.weekTotalSales, 0);
    const totalBudget = storesWithData.reduce((sum, s) => sum + s.weeklyBudget, 0);
    const totalProjection = storesWithData.reduce((sum, s) => sum + s.weekProjection, 0);
    const totalTransactions = storesWithData.reduce((sum, s) => sum + s.weekTotalTransactions, 0);
    return { totalSales, totalBudget, totalProjection, totalTransactions };
  }, [storesAnalysis]);

  // Totales ACUMULADOS del mes (para botones del header)
  const monthlyTotals = useMemo(() => {
    const storesWithData = storesAnalysis.filter(s => s.hasData);
    const totalSales = storesWithData.reduce((sum, s) => sum + s.monthTotalSales, 0);
    const totalTransactions = storesWithData.reduce((sum, s) => sum + s.monthTotalTransactions, 0);
    const totalBudget = storesWithData.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesWithData.reduce((sum, s) => sum + s.monthProjection, 0);
    const totalWeekProjection = storesWithData.reduce((sum, s) => sum + s.weekProjection, 0);
    const totalWeekBudget = storesWithData.reduce((sum, s) => sum + s.weeklyBudget, 0);
    
    return { 
      totalSales, 
      totalTransactions, 
      totalBudget, 
      totalProjection,
      totalWeekProjection,
      totalWeekBudget,
      avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0
    };
  }, [storesAnalysis]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

  const exportToExcel = () => {
    const headers = ['Tienda', 'Código', 'PPT Día', 'PPT Semana', 'Venta Semana', '% Venta Sem', 'Proy Semana', '% Proy Sem', 'Proy Mes', '% Proy Mes', '% Cumplimiento Mes'];
    const rows = sortedStores.map(s => [
      s.name,
      s.code,
      s.dailyBudget.toFixed(0),
      s.weeklyBudget.toFixed(0),
      s.weekTotalSales.toFixed(0),
      s.weekCompliance.toFixed(1) + '%',
      s.weekProjection.toFixed(0),
      s.weekProjectionCompliance.toFixed(1) + '%',
      s.monthProjection.toFixed(0),
      s.monthProjectionCompliance.toFixed(1) + '%',
      s.salesCompliance.toFixed(1) + '%'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Ejecutivo_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const statusCounts = useMemo(() => ({
    positive: storesAnalysis.filter(s => s.status === 'positive').length,
    negative: storesAnalysis.filter(s => s.status === 'negative').length,
    critical: storesAnalysis.filter(s => s.status === 'critical').length,
    no_data: storesAnalysis.filter(s => s.status === 'no_data').length
  }), [storesAnalysis]);

  const filteredStores = useMemo(() => {
    let filtered = storesAnalysis;
    
    // Búsqueda
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtros por columna
    Object.keys(columnFilters).forEach(key => {
      const filterValue = columnFilters[key];
      if (!filterValue) return;

      if (key === 'dailyBudget') {
        const [min, max] = filterValue.split('-').map(v => parseFloat(v) * 1000000);
        filtered = filtered.filter(s => s.dailyBudget >= min && s.dailyBudget < max);
      } else if (key === 'weeklyBudget') {
        const [min, max] = filterValue.split('-').map(v => parseFloat(v) * 1000000);
        filtered = filtered.filter(s => s.weeklyBudget >= min && s.weeklyBudget < max);
      } else if (key === 'weekCompliance') {
        const [min, max] = filterValue.split('-').map(Number);
        filtered = filtered.filter(s => s.weekCompliance >= min && s.weekCompliance < max);
      } else if (key === 'salesCompliance') {
        const [min, max] = filterValue.split('-').map(Number);
        filtered = filtered.filter(s => s.salesCompliance >= min && s.salesCompliance < max);
      }
    });

    return filtered;
  }, [storesAnalysis, searchQuery, columnFilters]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
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
    } else if (sortConfig.key === 'dailyBudget') {
      sorted.sort((a, b) => {
        const comparison = a.dailyBudget - b.dailyBudget;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'weeklyBudget') {
      sorted.sort((a, b) => {
        const comparison = a.weeklyBudget - b.weeklyBudget;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'weekCompliance') {
      sorted.sort((a, b) => {
        const comparison = a.weekCompliance - b.weekCompliance;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'weekProjection') {
      sorted.sort((a, b) => {
        const comparison = a.weekProjection - b.weekProjection;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'monthProjection') {
      sorted.sort((a, b) => {
        const comparison = a.monthProjection - b.monthProjection;
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

  // Datos para gráficas con diferentes vistas (días, semanas, meses)
  const dailySalesData = useMemo(() => {
    if (viewMode === 'day') {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      return days.map(day => {
        const daySales = allDailySales
          .filter(s => {
            try {
              const saleDate = parseISO(s.date);
              return isSameDay(saleDate, day);
            } catch {
              return false;
            }
          })
          .reduce((sum, s) => sum + (s.total_sales || 0), 0);
        
        const dayBudget = storesAnalysis
          .filter(s => s.hasData && s.getDailyBudget)
          .reduce((sum, store) => {
            try {
              return sum + store.getDailyBudget(day);
            } catch {
              return sum;
            }
          }, 0);
        
        return {
          date: format(day, 'dd/MM'),
          fullDate: format(day, 'dd MMM'),
          sales: daySales / 1000000,
          budget: dayBudget / 1000000,
          compliance: dayBudget > 0 ? (daySales / dayBudget) * 100 : 0
        };
      });
    } else if (viewMode === 'week') {
      const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 0 });
      return weeks.map((weekStart, idx) => {
        const weekEnd = addDays(weekStart, 6);
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        
        const weekSales = weekDays.reduce((sum, day) => {
          const daySales = allDailySales
            .filter(s => {
              try {
                const saleDate = parseISO(s.date);
                return isSameDay(saleDate, day);
              } catch {
                return false;
              }
            })
            .reduce((daySum, s) => daySum + (s.total_sales || 0), 0);
          return sum + daySales;
        }, 0);
        
        const weekBudget = weekDays.reduce((sum, day) => {
          const dayBudget = storesAnalysis
            .filter(s => s.hasData && s.getDailyBudget)
            .reduce((daySum, store) => {
              try {
                return daySum + store.getDailyBudget(day);
              } catch {
                return daySum;
              }
            }, 0);
          return sum + dayBudget;
        }, 0);
        
        return {
          date: `S${idx + 1}`,
          fullDate: `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM')}`,
          sales: weekSales / 1000000,
          budget: weekBudget / 1000000,
          compliance: weekBudget > 0 ? (weekSales / weekBudget) * 100 : 0
        };
      });
    } else {
      // Por mes
      const monthStart = startOfMonth(dateRange.from);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      const monthSales = monthDays.reduce((sum, day) => {
        const daySales = allDailySales
          .filter(s => {
            try {
              const saleDate = parseISO(s.date);
              return isSameDay(saleDate, day);
            } catch {
              return false;
            }
          })
          .reduce((daySum, s) => daySum + (s.total_sales || 0), 0);
        return sum + daySales;
      }, 0);
      
      const monthBudget = storesAnalysis
        .filter(s => s.hasData)
        .reduce((sum, store) => sum + (store.salesBudget || 0), 0);
      
      return [{
        date: format(monthStart, 'MMM yyyy'),
        fullDate: format(monthStart, 'MMMM yyyy'),
        sales: monthSales / 1000000,
        budget: monthBudget / 1000000,
        compliance: monthBudget > 0 ? (monthSales / monthBudget) * 100 : 0
      }];
    }
  }, [allDailySales, dateRange, storesAnalysis, viewMode]);

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

  // Preparar datos para tooltips
  const zoneDataForTooltips = useMemo(() => ({
    zoneSales: zoneTotals.totalSales,
    zoneBudget: zoneTotals.totalBudget,
    zoneCompliance: (zoneTotals.totalSales / zoneTotals.totalBudget) * 100,
    storesAnalysis: storesAnalysis
  }), [zoneTotals, storesAnalysis]);

  const salesVsBudgetTooltip = useExecutiveTooltip('sales_vs_budget', zoneDataForTooltips);
  const topPerformersTooltip = useExecutiveTooltip('top_performers', {
    ...zoneDataForTooltips,
    topStoresCount: topStoresTrend.length,
    avgCompliance: topStoresTrend.length > 0 
      ? topStoresTrend.reduce((sum, s) => sum + s.value, 0) / topStoresTrend.length 
      : 0
  });

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

      <div className="max-w-[1920px] mx-auto px-4 py-6 relative z-10">
        {/* Header Compacto con Filtro de Semanas */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {ZONE_NAME}
              </h1>
              <p className="text-sm text-slate-400">
                Semana {Math.ceil((dateRange.from - RETAIL_WEEK_START) / (7 * 24 * 60 * 60 * 1000)) + 1} · {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM yyyy')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Calendario de Fechas */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 hover:text-white gap-2"
                  >
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">
                      {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/20" align="end">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Seleccionar Rango</p>
                      <button 
                        onClick={() => {
                          setDateRange({ from: RETAIL_WEEK_START, to: addDays(RETAIL_WEEK_START, 6) });
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Reiniciar
                      </button>
                    </div>
                    
                    {/* Accesos rápidos de semanas */}
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Semanas Retail</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 8 }, (_, i) => {
                          const weekStart = addDays(RETAIL_WEEK_START, i * 7);
                          const weekEnd = addDays(weekStart, 6);
                          const isSelected = format(dateRange.from, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd');
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setDateRange({ from: weekStart, to: weekEnd });
                                setCalendarOpen(false);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                              }`}
                            >
                              S{i + 1} ({format(weekStart, 'dd/MM')})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-slate-400 font-medium mb-2">Rango Personalizado</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1">Desde</p>
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                            className="rounded-md border border-white/10 bg-slate-800"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1">Hasta</p>
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                            className="rounded-md border border-white/10 bg-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setCalendarOpen(false)}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      Aplicar Filtro
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={exportToExcel}
                className="h-9 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-2 text-white text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => setShowBudgetManager(true)}
                className="h-9 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 flex items-center gap-2 text-white text-sm font-medium transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Nueva Sección: Métricas Consolidadas - ACUMULADO DEL MES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Transacciones + Ticket Promedio del Mes ACUMULADO */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedKPIDetail('transactions')}
                className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-lg p-4 border border-blue-500/20 cursor-pointer transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
                <p className="text-xs text-blue-300 mb-3 font-bold">Tráfico Acumulado (Mes)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Transacciones</p>
                    <p className="text-2xl font-black text-white">{monthlyTotals.totalTransactions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Ticket Promedio</p>
                    <p className="text-2xl font-black text-white">
                      {formatCurrency(monthlyTotals.avgTicket)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Venta Promedio + Acumulado del Mes */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedKPIDetail('avgSales')}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-lg p-4 border border-amber-500/20 cursor-pointer transition-all hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/20">
                <p className="text-xs text-amber-300 mb-3 font-bold">Ventas Acumuladas (Mes)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total Acumulado</p>
                    <p className="text-2xl font-black text-white">{formatShort(monthlyTotals.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Promedio/Tienda</p>
                    <p className="text-2xl font-black text-white">
                      {formatShort(monthlyTotals.totalSales / STORES.length)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Proyección Mensual + Semanal Actual con % */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedKPIDetail('projection')}
                className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl rounded-lg p-4 border border-emerald-500/20 cursor-pointer transition-all hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20">
                <p className="text-xs text-emerald-300 mb-3 font-bold">Proyecciones</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Proy. Mes</p>
                    <p className="text-xl font-black text-white mb-0.5">{formatShort(monthlyTotals.totalProjection)}</p>
                    <p className={`text-xs font-bold ${
                      ((monthlyTotals.totalProjection/monthlyTotals.totalBudget)*100) >= 100 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {((monthlyTotals.totalProjection/monthlyTotals.totalBudget)*100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Proy. Sem Actual</p>
                    <p className="text-xl font-black text-white mb-0.5">
                      {formatShort(monthlyTotals.totalWeekProjection)}
                    </p>
                    <p className={`text-xs font-bold ${
                      ((monthlyTotals.totalWeekProjection / monthlyTotals.totalWeekBudget)*100) >= 100 
                        ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {((monthlyTotals.totalWeekProjection / monthlyTotals.totalWeekBudget)*100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Grid Principal Estilo Power BI */}
            <div className="grid grid-cols-12 gap-4 mb-6">
              {/* Columna Izquierda - KPIs */}
              <div className="col-span-12 lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedKPIDetail('sales')}
                  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-lg p-4 border border-blue-500/20 cursor-pointer transition-all hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20">
                  <p className="text-xs text-blue-300 mb-1">Venta Total</p>
                  <p className="text-3xl font-black text-white tabular-nums">{formatShort(zoneTotals.totalSales)}</p>
                  <ResponsiveContainer width="100%" height={30}>
                    <AreaChart data={dailySalesData.slice(-7)}>
                      <defs>
                        <linearGradient id="miniArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}>
                            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.8}>
                            <animate attributeName="offset" values="0.5;1.5;0.5" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}>
                            <animate attributeName="offset" values="1;2;1" dur="3s" repeatCount="indefinite" />
                          </stop>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="url(#shimmer)" 
                        strokeWidth={2.5} 
                        fill="url(#miniArea)"
                        isAnimationActive={true}
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                    </ResponsiveContainer>
                    </motion.div>

                    <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedKPIDetail('compliance')}
                    className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl rounded-lg p-4 border border-emerald-500/20 cursor-pointer transition-all hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20">
                  <p className="text-xs text-emerald-300 mb-1">Cumplimiento</p>
                  <motion.p 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={`text-4xl font-black tabular-nums ${
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-400' : 
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 85 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                    {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                  </motion.p>
                  <div className="mt-2 bg-slate-800/50 rounded-full h-2 overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((zoneTotals.totalSales/zoneTotals.totalBudget)*100), 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full relative ${
                        ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 100 ? 'bg-emerald-500' : 
                        ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 85 ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                  </motion.div>
                </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedKPIDetail('weeklyStatus')}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-lg p-4 border border-white/10 cursor-pointer transition-all hover:border-white/20 hover:shadow-lg hover:shadow-white/10">
                  <p className="text-xs text-slate-400 mb-2">Estado Semanal</p>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <motion.p 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, type: "spring", delay: 0.1 }}
                        className="text-2xl font-black text-emerald-400 tabular-nums">
                        {storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 90).length}
                      </motion.p>
                      <p className="text-[10px] text-emerald-300">En Meta</p>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
                        className="text-2xl font-black text-red-400 tabular-nums">
                        {storesAnalysis.filter(s => s.hasData && s.weekCompliance < 70).length}
                      </motion.p>
                      <p className="text-[10px] text-red-300">Críticas</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <motion.div 
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                      className="bg-emerald-500/20 rounded py-1 text-center relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="text-xs font-bold text-emerald-400 relative z-10">
                        {storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 90).length}
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      className="bg-amber-500/20 rounded py-1 text-center relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                      />
                      <p className="text-xs font-bold text-amber-400 relative z-10">
                        {storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 70 && s.weekCompliance < 90).length}
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      className="bg-red-500/20 rounded py-1 text-center relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
                      />
                      <p className="text-xs font-bold text-red-400 relative z-10">
                        {storesAnalysis.filter(s => s.hasData && s.weekCompliance < 70).length}
                      </p>
                    </motion.div>
                    </div>
                    </motion.div>
                    </div>

                    {/* Columna Centro - Gráfica Grande */}
              <div className="col-span-12 lg:col-span-6">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-lg p-5 border border-white/10 h-full shadow-xl">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-white mb-1">Ventas vs Presupuesto</h3>
                        <p className="text-xs text-slate-400">
                          Venta: {formatCurrency(dailySalesData.reduce((sum, d) => sum + (d.sales * 1000000), 0))} · 
                          Meta: {formatCurrency(dailySalesData.reduce((sum, d) => sum + (d.budget * 1000000), 0))}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowZoneCharts(true)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all"
                      >
                        Análisis Completo →
                      </button>
                    </div>
                    
                    {/* Filtro de Vista */}
                    <div className="flex items-center gap-2">
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-all"
                      >
                        <option value="day">Por Días</option>
                        <option value="week">Por Semanas</option>
                        <option value="month">Por Meses</option>
                      </select>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={dailySalesData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="lineShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}>
                            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="50%" stopColor="#818cf8" stopOpacity={1}>
                            <animate attributeName="offset" values="0.5;1.5;0.5" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4}>
                            <animate attributeName="offset" values="1;2;1" dur="3s" repeatCount="indefinite" />
                          </stop>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        angle={viewMode === 'day' && dailySalesData.length > 7 ? -20 : 0}
                        textAnchor={viewMode === 'day' && dailySalesData.length > 7 ? 'end' : 'middle'}
                        height={viewMode === 'day' && dailySalesData.length > 7 ? 50 : 30}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        tickFormatter={(value) => `$${value.toFixed(1)}M`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [
                          formatCurrency(value * 1000000), 
                          name === 'sales' ? '💰 Venta' : '🎯 Meta'
                        ]}
                        labelFormatter={(label) => {
                          const item = dailySalesData.find(d => d.date === label);
                          return item?.fullDate || label;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '16px' }}
                        content={() => (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '14px', height: '14px', background: 'linear-gradient(to bottom, #10b981, #059669)', borderRadius: '3px' }}></div>
                              <span style={{ color: '#10b981' }}>💰 Venta</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '14px', height: '14px', background: 'linear-gradient(to bottom, #6366f1, #4f46e5)', borderRadius: '3px', opacity: 0.6 }}></div>
                              <span style={{ color: '#6366f1' }}>🎯 Meta</span>
                            </div>
                          </div>
                        )}
                      />
                      <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                      <Bar 
                        dataKey="sales" 
                        fill="url(#salesGradient)" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={viewMode === 'month' ? 80 : viewMode === 'week' ? 50 : 40}
                        name="Venta"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="budget" 
                        stroke="url(#lineShimmer)" 
                        strokeWidth={3} 
                        dot={(props) => {
                          const { cx, cy } = props;
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={15} fill="#818cf8" opacity={0.1}>
                                <animate attributeName="r" values="15;22;15" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.1;0.35;0.1" dur="2s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={cx} cy={cy} r={10} fill="#a5b4fc" opacity={0.3}>
                                <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={cx} cy={cy} r={6} fill="none" stroke="#c7d2fe" strokeWidth={2} opacity={0.5}>
                                <animate attributeName="r" values="6;9;6" dur="1.2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.2s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={cx} cy={cy} r={5} fill="#6366f1" stroke="#e0e7ff" strokeWidth={2}>
                                <animate attributeName="r" values="5;6.5;5" dur="1s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={cx} cy={cy} r={2.5} fill="#e0e7ff">
                                <animate attributeName="opacity" values="0.8;1;0.8" dur="0.8s" repeatCount="indefinite" />
                              </circle>
                            </g>
                          );
                        }}
                        name="Meta"
                        strokeDasharray="5 5"
                        isAnimationActive={true}
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  {/* Mini gráfica de proyección semanal */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400">📅 Proyección Presupuesto Semanal</h4>
                      <span className="text-[9px] text-slate-500">Tendencia del mes</span>
                    </div>
                    <ResponsiveContainer width="100%" height={85}>
                      <ComposedChart 
                        data={(() => {
                          const now = new Date();
                          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                          const daysLeft = Math.ceil((monthEnd - now) / (1000 * 60 * 60 * 24));
                          const weeksLeft = Math.ceil(daysLeft / 7);
                          const weeklyAvg = zoneTotals.totalBudget / 4;

                          return Array.from({ length: Math.min(weeksLeft + 1, 5) }, (_, i) => ({
                            name: `S${i + 1}`,
                            presupuesto: weeklyAvg / 1000000,
                            tendencia: (weeklyAvg / 1000000) * (1 + (i * 0.05)),
                            actual: i === 0 ? zoneTotals.totalSales / 1000000 : null
                          }));
                        })()}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="budgetBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4}/>
                          </linearGradient>
                          <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 9, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide domain={[0, 'dataMax + 10']} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            fontSize: '10px',
                            color: '#fff',
                            padding: '6px 10px'
                          }}
                          formatter={(value, name) => [
                            `$${value?.toFixed(1)}M`, 
                            name === 'presupuesto' ? 'Presupuesto' : name === 'tendencia' ? 'Tendencia' : 'Actual'
                          ]}
                        />
                        <Bar 
                          dataKey="presupuesto" 
                          fill="url(#budgetBarGrad)" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={30}
                          animationDuration={800}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="tendencia" 
                          stroke="url(#trendLineGrad)"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 2 }}
                          animationDuration={1200}
                          animationEasing="ease-in-out"
                        />
                        {zoneTotals.totalSales > 0 && (
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            animationDuration={800}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <span className="text-[9px] text-indigo-400">■ Presupuesto</span>
                      <span className="text-[9px] text-cyan-400">━ Tendencia</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha - Mix de Gráficas */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Tiendas vs Presupuesto Semanal - Componente Mejorado */}
                <StoreWeeklyChart
                  storesAnalysis={storesAnalysis}
                  allDailySales={allDailySales}
                  dateRange={dateRange}
                  formatCurrency={formatCurrency}
                  formatShort={formatShort}
                />

                {/* Top Performers - Nueva Gráfica */}
                {topStoresTrend.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 backdrop-blur-xl rounded-lg p-5 border border-emerald-500/20 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-black text-white">Top 5 Líderes</h3>
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">≥90%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topStoresTrend} layout="vertical">
                        <defs>
                          <linearGradient id="greenBarGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}>
                              <animate attributeName="stopOpacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="50%" stopColor="#34d399" stopOpacity={1}>
                              <animate attributeName="offset" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#059669" stopOpacity={1}>
                              <animate attributeName="stopOpacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
                            </stop>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} horizontal={false} />
                        <XAxis 
                          type="number" 
                          domain={[90, 130]} 
                          stroke="#9ca3af" 
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={10} 
                          width={70}
                          tickLine={false}
                        />
                        <Tooltip {...topPerformersTooltip} />
                        <Bar dataKey="value" fill="url(#greenBarGradient)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 pt-3 border-t border-emerald-500/20">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-300">Promedio Top:</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {(topStoresTrend.reduce((sum, s) => sum + s.value, 0) / topStoresTrend.length).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



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
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th 
                        onClick={() => handleSort('name')}
                        className="sticky left-0 bg-slate-950/80 backdrop-blur-xl z-10 text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer border-r border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          Tienda
                          {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('dailyBudget')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-orange-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          PPT Hoy
                          {sortConfig.key === 'dailyBudget' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('weeklyBudget')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-cyan-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          PPT Sem
                          {sortConfig.key === 'weeklyBudget' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('weekCompliance')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Venta Sem
                          {sortConfig.key === 'weekCompliance' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('weekProjection')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-pink-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Proy Sem
                          {sortConfig.key === 'weekProjection' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('monthProjection')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Proy Mes
                          {sortConfig.key === 'monthProjection' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('compliance')}
                        className="text-right py-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center justify-end gap-2">
                          % Mes
                          {sortConfig.key === 'compliance' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
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
                        <td className="sticky left-0 bg-slate-950/90 backdrop-blur-xl z-10 py-3 px-3 border-r border-white/10">
                          <p className={`font-bold text-xs ${!store.hasData ? 'text-slate-600' : 'text-white'}`}>
                            {store.name}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{store.code}</p>
                        </td>

                        {/* PPT Hoy */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <p className="font-bold text-orange-400 text-sm tabular-nums">{formatShort(store.dailyBudget)}</p>
                          )}
                        </td>

                        {/* PPT Semana */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <p className="font-bold text-cyan-400 text-sm tabular-nums">{formatShort(store.weeklyBudget)}</p>
                          )}
                        </td>

                        {/* Venta Semana */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div>
                              <p className={`text-lg font-black mb-0.5 tabular-nums ${
                                store.weekCompliance >= 100 ? 'text-emerald-400' :
                                store.weekCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {store.weekCompliance.toFixed(0)}%
                              </p>
                              <p className="text-[10px] text-purple-400 font-semibold tabular-nums">{formatShort(store.weekTotalSales)}</p>
                            </div>
                          )}
                        </td>

                        {/* Proyección Semana */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div>
                              <p className={`text-lg font-black mb-0.5 tabular-nums ${
                                store.weekProjectionCompliance >= 100 ? 'text-emerald-400' :
                                store.weekProjectionCompliance >= 85 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {store.weekProjectionCompliance.toFixed(0)}%
                              </p>
                              <p className="text-[10px] text-pink-400 font-semibold tabular-nums">{formatShort(store.weekProjection)}</p>
                            </div>
                          )}
                        </td>

                        {/* Proyección Mes */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div>
                              <p className={`text-lg font-black mb-0.5 tabular-nums ${
                                store.monthProjectionCompliance >= 100 ? 'text-emerald-400' :
                                store.monthProjectionCompliance >= 85 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {store.monthProjectionCompliance.toFixed(0)}%
                              </p>
                              <p className="text-[10px] text-emerald-400 font-semibold tabular-nums">{formatShort(store.monthProjection)}</p>
                            </div>
                          )}
                        </td>

                        {/* % Cumplimiento Mes */}
                        <td className="py-3 px-2 text-right">
                          {!store.hasData ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className={`font-black text-2xl tabular-nums ${
                                store.salesCompliance >= 90 ? 'text-emerald-400' :
                                store.salesCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {store.salesCompliance.toFixed(0)}%
                              </span>
                              <p className="text-[10px] text-slate-400 tabular-nums">{formatShort(store.monthTotalSales)}</p>
                            </div>
                          )}
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
          <ExecutiveStoreDetailModal
            store={selectedStoreDetail}
            onClose={() => setSelectedStoreDetail(null)}
            allDailySales={allDailySales}
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