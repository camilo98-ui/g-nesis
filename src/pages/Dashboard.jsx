import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import WeekFilter from '@/components/dashboard/WeekFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import ComparableChartsGrid from '@/components/executive/ComparableChartsGrid';

import DailyGoalsCard from '@/components/gamification/DailyGoalsCard';
import RetailWeekBudgetCard from '@/components/budget/RetailWeekBudgetCard';
import ProjectionDetailModal from '@/components/dashboard/ProjectionDetailModal';
import ZonePerformanceComparison from '@/components/sales/ZonePerformanceComparison';
import WeatherSalesImpactChart from '@/components/weather/WeatherSalesImpactChart';

import GrowthVelocityChart from '@/components/management/GrowthVelocityChart';
import StoreReportGenerator from '@/components/reports/StoreReportGenerator';
import PresentationGenerator from '@/components/reports/PresentationGenerator';
import CompraValeModal from '@/components/dashboard/CompraValeModal';
import StoreSalesModal from '@/components/forms/StoreSalesModal';
import MonthlyBudgetManager from '@/components/budget/MonthlyBudgetManager';
import ChartInsight from '@/components/dashboard/ChartInsight';
import DetailPanel from '@/components/dashboard/DetailPanel';

import { useNova } from '@/components/NovaContext';
import {
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, AlertTriangle, CheckCircle2, X, Target, Sparkles,
  ClipboardCheck, Snowflake, Package, Calendar, Activity, CalendarDays } from
'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line } from
'recharts';

// Premium KPI Card - Estilo Enterprise
function PremiumMetricCard({ title, value, budget, icon: Icon, color, onClick, isActive, comparisonValue, showComparison }) {
  const percentage = budget ? (value / budget * 100).toFixed(1) : 0;
  const isPositive = value >= (comparisonValue || 0);

  const change = comparisonValue ? (value - comparisonValue) / comparisonValue * 100 : 0;
  const isChangePositive = change >= 0;

  const formatValue = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl p-4 cursor-pointer overflow-hidden transition-all ${isActive ? 'ring-2' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px)',
        border: `1px solid ${color}20`,
        boxShadow: isActive
          ? `0 8px 32px ${color}25, 0 0 0 2px ${color}40`
          : `0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)`,
        ringColor: color
      }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}40, transparent)` }} />

      {/* Icon + change */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12` }}>
          <Icon style={{ color, width: 15, height: 15 }} />
        </div>
        {budget > 0 && (
          <span className="text-[10px] font-bold tabular-nums"
            style={{ color: value >= budget ? '#10b981' : '#f59e0b' }}>
            {(value / budget * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-[22px] font-black leading-none tracking-tight mb-0.5 tabular-nums"
        style={{ color, letterSpacing: '-0.03em' }}>
        {title === 'Transacciones' || title === 'Sugeridos'
          ? value.toLocaleString('es-CO')
          : formatValue(value)}
      </p>
      <p className="text-[11px] font-medium text-slate-400 mb-2">{title}</p>

      {/* Budget bar */}
      {budget > 0 && (
        <div className="w-full h-1 rounded-full bg-slate-100">
          <div className="h-1 rounded-full transition-all"
            style={{
              width: `${Math.min(value / budget * 100, 100)}%`,
              background: value >= budget ? '#10b981' : color
            }} />
        </div>
      )}

      {/* Comparison */}
      {showComparison && comparisonValue != null && comparisonValue > 0 && (
        <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${isChangePositive ? 'text-emerald-500' : 'text-rose-400'}`}>
          {isChangePositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs anterior
        </div>
      )}
    </motion.div>
  );
























}

// DetailPanel is now in components/dashboard/DetailPanel

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { setPageData } = useNova() || {};

  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [projectionMetric, setProjectionMetric] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weekFilter, setWeekFilter] = useState(null);
  const [showCompraVale, setShowCompraVale] = useState(false);
  const [showStoreSales, setShowStoreSales] = useState(false);
  const [showMonthlyBudget, setShowMonthlyBudget] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRange, setComparisonRange] = useState(null);
  const [gregorianMode, setGregorianMode] = useState(true);

  // Fetch weather data - historical para análisis
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedStore) return;

      setLoadingWeather(true);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90); // 3 meses de datos históricos

      try {
        const response = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=4.6097&longitude=-74.0817&start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}&daily=weathercode,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&timezone=America%2FBogota`
        );
        const data = await response.json();
        setWeatherData({ history: data.daily });
      } catch (e) {
        console.error('Error fetching weather:', e);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [selectedStore]);

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
    queryFn: async () => {
      let allSales = await base44.entities.DailySales.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (allSales.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        allSales = await base44.entities.DailySales.filter({ store_id: oldCode });
      }
      // Deduplicar por fecha: conservar el registro más recientemente actualizado
      const byDate = {};
      for (const s of allSales) {
        const dateKey = s.date?.split('T')[0] || s.date;
        if (!byDate[dateKey] || new Date(s.updated_date) > new Date(byDate[dateKey].updated_date)) {
          byDate[dateKey] = s;
        }
      }
      return Object.values(byDate);
    },
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: async () => {
      let allBudgets = await base44.entities.Budget.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (allBudgets.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        allBudgets = await base44.entities.Budget.filter({ store_id: oldCode });
      }
      return allBudgets; // retornar todos, filtrar dinámicamente según dateRange
    },
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });
  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['dailyBudgets', selectedStore],
    queryFn: async () => {
      let results = await base44.entities.DailyBudget.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.DailyBudget.filter({ store_id: oldCode });
      }
      return results;
    },
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      let allRecords = await base44.entities.ShiftRecord.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (allRecords.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        allRecords = await base44.entities.ShiftRecord.filter({ store_id: oldCode });
      }
      return allRecords.filter((record) => {
        const recordDate = record.date?.split('T')[0] || record.date;
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
    },
    enabled: !!selectedStore,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 15 * 60 * 1000 // 15 minutes
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selectedStore],
    queryFn: () => base44.entities.CleaningChecklist.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });

  const { data: freezerSlots = [] } = useQuery({
    queryKey: ['freezerSlots', selectedStore],
    queryFn: () => base44.entities.FreezerSlot.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 15 * 60 * 1000
  });

  const { data: inventoryAlerts = [] } = useQuery({
    queryKey: ['inventoryAlerts', selectedStore],
    queryFn: () => base44.entities.InventoryAlert.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });



  const currentBudget = useMemo(() => {
    if (!budgets.length) return {};

    // Determinar qué mes/año mostrar según el filtro activo
    const activeDate = dateRange?.from || weekFilter?.from || new Date();
    const targetMonth = activeDate.getMonth() + 1;
    const targetYear = activeDate.getFullYear();

    // Buscar presupuesto del mes filtrado
    const filteredBudget = budgets.find((b) => Number(b.month) === targetMonth && Number(b.year) === targetYear);
    if (filteredBudget) return filteredBudget;

    // Fallback al mes actual si no hay presupuesto para el mes filtrado
    const now = new Date();
    return budgets.find((b) => Number(b.month) === now.getMonth() + 1 && Number(b.year) === now.getFullYear()) || {};
  }, [budgets, dateRange, weekFilter]);

  // Filtrar ventas según rango seleccionado (para gráficas)
  const filteredSales = useMemo(() => {
    if (!dailySales.length) return dailySales; // Mostrar todos si no hay filtro específico

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Calendario retail basado en semanas
    const retailCalendar = {
      0: { start: new Date(currentYear - 1, 11, 29), end: new Date(currentYear, 1, 1) },
      1: { start: new Date(currentYear, 1, 2), end: new Date(currentYear, 2, 1) },
      2: { start: new Date(currentYear, 2, 2), end: new Date(currentYear, 2, 29) },
      3: { start: new Date(currentYear, 2, 30), end: new Date(currentYear, 4, 3) },
      4: { start: new Date(currentYear, 4, 4), end: new Date(currentYear, 4, 31) },
      5: { start: new Date(currentYear, 5, 1), end: new Date(currentYear, 6, 5) },
      6: { start: new Date(currentYear, 6, 6), end: new Date(currentYear, 7, 2) },
      7: { start: new Date(currentYear, 7, 3), end: new Date(currentYear, 7, 30) },
      8: { start: new Date(currentYear, 7, 31), end: new Date(currentYear, 8, 27) },
      9: { start: new Date(currentYear, 8, 28), end: new Date(currentYear, 10, 1) },
      10: { start: new Date(currentYear, 10, 2), end: new Date(currentYear, 10, 29) },
      11: { start: new Date(currentYear, 10, 30), end: new Date(currentYear + 1, 0, 2) }
    };

    const retailMonthStart = retailCalendar[currentMonth].start;
    const gregorianStart = startOfMonth(now);

    // Determinar rango: si hay filtro usarlo, si no, mostrar mes actual
    let fromDate, toDate;

    if (weekFilter?.from && weekFilter?.to) {
      fromDate = weekFilter.from;
      toDate = weekFilter.to;
    } else if (dateRange?.from && dateRange?.to) {
      fromDate = dateRange.from;
      toDate = dateRange.to;
    } else {
      // Sin filtro: mostrar TODO el mes actual (no limitar a hoy)
      fromDate = gregorianStart;
      toDate = endOfMonth(now);
    }

    const fromStr = format(fromDate, 'yyyy-MM-dd');
    const toStr = format(toDate, 'yyyy-MM-dd');

    return dailySales.filter((s) => {
      const saleDateStr = s.date?.split('T')[0] || s.date;
      return saleDateStr >= fromStr && saleDateStr <= toStr;
    });
  }, [dailySales, dateRange, weekFilter, gregorianMode]);

  // Ventas del período de comparación
  const comparisonSales = useMemo(() => {
    if (!showComparison || !comparisonRange || !dailySales.length) return [];

    const fromStr = format(comparisonRange.from, 'yyyy-MM-dd');
    const toStr = format(comparisonRange.to, 'yyyy-MM-dd');

    return dailySales.filter((s) => {
      const saleDateStr = s.date?.split('T')[0] || s.date;
      return saleDateStr >= fromStr && saleDateStr <= toStr;
    });
  }, [dailySales, comparisonRange, showComparison]);

  // Totales del rango filtrado (para gráficas)
  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  // Totales del rango filtrado (para tarjetas - SOLO datos del rango seleccionado)
  const filteredTotals = useMemo(() => {
    const activeRange = weekFilter || dateRange;
    if (!activeRange?.from || !activeRange?.to) {
      return { sales: 0, tickets: 0, transactions: 0, suggested: 0 };
    }

    const fromStr = format(activeRange.from, 'yyyy-MM-dd');
    const toStr = format(activeRange.to, 'yyyy-MM-dd');

    const rangeSales = dailySales.filter((s) => {
      const saleDate = s.date?.split('T')[0] || s.date;
      return saleDate >= fromStr && saleDate <= toStr;
    });

    return rangeSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [dailySales, dateRange, weekFilter]);

  // Totales ACUMULADOS - Usa el filtro activo o el mes según modo
  const monthTotals = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Calendario retail basado en semanas
    const retailCalendar = {
      0: { start: new Date(currentYear - 1, 11, 29), end: new Date(currentYear, 1, 1) },
      1: { start: new Date(currentYear, 1, 2), end: new Date(currentYear, 2, 1) },
      2: { start: new Date(currentYear, 2, 2), end: new Date(currentYear, 2, 29) },
      3: { start: new Date(currentYear, 2, 30), end: new Date(currentYear, 4, 3) },
      4: { start: new Date(currentYear, 4, 4), end: new Date(currentYear, 4, 31) },
      5: { start: new Date(currentYear, 5, 1), end: new Date(currentYear, 6, 5) },
      6: { start: new Date(currentYear, 6, 6), end: new Date(currentYear, 7, 2) },
      7: { start: new Date(currentYear, 7, 3), end: new Date(currentYear, 7, 30) },
      8: { start: new Date(currentYear, 7, 31), end: new Date(currentYear, 8, 27) },
      9: { start: new Date(currentYear, 8, 28), end: new Date(currentYear, 10, 1) },
      10: { start: new Date(currentYear, 10, 2), end: new Date(currentYear, 10, 29) },
      11: { start: new Date(currentYear, 10, 30), end: new Date(currentYear + 1, 0, 2) }
    };

    const retailMonthStart = retailCalendar[currentMonth].start;
    const gregorianStart = startOfMonth(now);

    // Determinar rango: si hay filtro activo, usarlo; si no, según modo
    let fromDate, toDate;

    if (weekFilter?.from && weekFilter?.to) {
      fromDate = weekFilter.from;
      toDate = weekFilter.to;
    } else if (dateRange?.from && dateRange?.to) {
      fromDate = dateRange.from;
      toDate = dateRange.to;
    } else {
      // Sin filtro: según modo gregoriano o retail
      fromDate = gregorianMode ? gregorianStart : retailMonthStart;
      toDate = now;
    }

    const fromStr = format(fromDate, 'yyyy-MM-dd');
    const toStr = format(toDate, 'yyyy-MM-dd');

    const monthSales = dailySales.filter((s) => {
      const saleDate = s.date?.split('T')[0] || s.date;
      return saleDate >= fromStr && saleDate <= toStr;
    });

    return monthSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [dailySales, dateRange, weekFilter, gregorianMode]);

  // Totals del período de comparación
  const comparisonTotals = useMemo(() => {
    if (!showComparison || !comparisonSales.length) return null;
    return comparisonSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [comparisonSales, showComparison]);

  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Calendario retail basado en semanas
    const retailCalendar = {
      0: { start: new Date(currentYear - 1, 11, 29), end: new Date(currentYear, 1, 1) },
      1: { start: new Date(currentYear, 1, 2), end: new Date(currentYear, 2, 1) },
      2: { start: new Date(currentYear, 2, 2), end: new Date(currentYear, 2, 29) },
      3: { start: new Date(currentYear, 2, 30), end: new Date(currentYear, 4, 3) },
      4: { start: new Date(currentYear, 4, 4), end: new Date(currentYear, 4, 31) },
      5: { start: new Date(currentYear, 5, 1), end: new Date(currentYear, 6, 5) },
      6: { start: new Date(currentYear, 6, 6), end: new Date(currentYear, 7, 2) },
      7: { start: new Date(currentYear, 7, 3), end: new Date(currentYear, 7, 30) },
      8: { start: new Date(currentYear, 7, 31), end: new Date(currentYear, 8, 27) },
      9: { start: new Date(currentYear, 8, 28), end: new Date(currentYear, 10, 1) },
      10: { start: new Date(currentYear, 10, 2), end: new Date(currentYear, 10, 29) },
      11: { start: new Date(currentYear, 10, 30), end: new Date(currentYear + 1, 0, 2) }
    };

    const retailMonthStart = retailCalendar[currentMonth].start;
    const gregorianStart = startOfMonth(now);

    // Determinar rango a mostrar: según filtros o modo
    let startDate, endDate;

    if (weekFilter?.from && weekFilter?.to) {
      // Filtro de semana aplicado
      startDate = weekFilter.from;
      endDate = weekFilter.to;
    } else if (dateRange?.from && dateRange?.to) {
      // Filtro de fecha aplicado
      startDate = dateRange.from;
      endDate = dateRange.to;
    } else {
      // Sin filtro: según modo gregoriano o retail
      startDate = gregorianMode ? gregorianStart : retailMonthStart;
      endDate = now;
    }

    // Generar días del rango
    const currentDays = eachDayOfInterval({ start: startDate, end: endDate });
    const maxDays = currentDays.length;

    const dataWithSales = currentDays.map((day, idx) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find((s) => {
        const saleDate = s.date?.split('T')[0] || s.date;
        return saleDate === dayStr;
      }) || {};
      const transactions = dayData.total_transactions || 0;
      const sales = dayData.total_sales || 0;

      // Datos de comparación
      let compData = {};
      if (showComparison && comparisonRange) {
        const compDays = eachDayOfInterval({ start: comparisonRange.from, end: comparisonRange.to });
        // Mapear día relativo del período actual al día relativo del período de comparación
        const compDayIdx = Math.min(idx, compDays.length - 1);
        const compDay = compDays[compDayIdx];

        if (compDay) {
          const compDayStr = format(compDay, 'yyyy-MM-dd');
          const compDayData = dailySales.find((s) => {
            const saleDate = s.date?.split('T')[0] || s.date;
            return saleDate === compDayStr;
          }) || {};
          const compTrans = compDayData.total_transactions || 0;
          const compSales = compDayData.total_sales || 0;
          compData = {
            ventasComparacion: compSales,
            transactionsComparacion: compTrans,
            ticketComparacion: compTrans > 0 ? compSales / compTrans : 0,
            suggestedComparacion: compDayData.total_suggested || 0
          };
        }
      }

      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM yyyy', { locale: es }),
        dayName: format(day, 'EEEE', { locale: es }),
        ventas: sales,
        tickets: dayData.total_tickets || 0,
        ticketPromedio: transactions > 0 ? sales / transactions : 0,
        transactions: transactions,
        suggested: dayData.total_suggested || 0,
        index: idx,
        ...compData
      };
    });

    // Calcular proyección
    const validData = dataWithSales.filter((d) => d.ventas > 0);
    if (validData.length >= 2) {
      const n = validData.length;
      let sumX = 0,sumY = 0,sumXY = 0,sumX2 = 0;
      validData.forEach((d) => {
        sumX += d.index;
        sumY += d.ventas;
        sumXY += d.index * d.ventas;
        sumX2 += d.index * d.index;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return dataWithSales.map((d) => ({
        ...d,
        proyeccion: slope * d.index + intercept
      }));
    }

    return dataWithSales;
  }, [dateRange, dailySales, weekFilter, showComparison, comparisonRange, gregorianMode]);



  // Proyecciones - CÁLCULO ESTABLE basado en modo gregoriano o retail
  const projections = useMemo(() => {
    if (!currentBudget?.sales_budget) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Calendario retail basado en semanas
    const retailCalendar = {
      0: { start: new Date(currentYear - 1, 11, 29), end: new Date(currentYear, 1, 1) },
      1: { start: new Date(currentYear, 1, 2), end: new Date(currentYear, 2, 1) },
      2: { start: new Date(currentYear, 2, 2), end: new Date(currentYear, 2, 29) },
      3: { start: new Date(currentYear, 2, 30), end: new Date(currentYear, 4, 3) },
      4: { start: new Date(currentYear, 4, 4), end: new Date(currentYear, 4, 31) },
      5: { start: new Date(currentYear, 5, 1), end: new Date(currentYear, 6, 5) },
      6: { start: new Date(currentYear, 6, 6), end: new Date(currentYear, 7, 2) },
      7: { start: new Date(currentYear, 7, 3), end: new Date(currentYear, 7, 30) },
      8: { start: new Date(currentYear, 7, 31), end: new Date(currentYear, 8, 27) },
      9: { start: new Date(currentYear, 8, 28), end: new Date(currentYear, 10, 1) },
      10: { start: new Date(currentYear, 10, 2), end: new Date(currentYear, 10, 29) },
      11: { start: new Date(currentYear, 10, 30), end: new Date(currentYear + 1, 0, 2) }
    };

    // Determinar inicio/fin según modo
    const monthStart = gregorianMode ? startOfMonth(now) : retailCalendar[currentMonth].start;
    const monthEnd = gregorianMode ? endOfMonth(now) : retailCalendar[currentMonth].end;
    const totalDays = differenceInDays(monthEnd, monthStart) + 1;

    // Usar SOLO datos del período según modo
    const monthSales = dailySales.filter((s) => {
      const saleDate = s.date?.split('T')[0] || s.date;
      const saleDateObj = new Date(saleDate);
      return saleDateObj >= monthStart && saleDateObj <= now;
    });

    // Calcular ventas acumuladas del mes
    const monthTotals = monthSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      transactions: acc.transactions + (s.total_transactions || 0)
    }), { sales: 0, transactions: 0 });

    // Días transcurridos hasta HOY
    const daysElapsed = differenceInDays(now, monthStart) + 1;
    const daysRemaining = totalDays - daysElapsed;

    // Promedio diario REAL del mes
    const dailyAvgSales = daysElapsed > 0 ? monthTotals.sales / daysElapsed : 0;

    // Proyección = venta actual + (promedio diario × días restantes)
    const projectedSales = monthTotals.sales + dailyAvgSales * daysRemaining;

    // Brecha = lo que falta vender
    const salesGap = currentBudget.sales_budget - monthTotals.sales;

    // Venta diaria requerida para alcanzar meta
    const requiredDailySales = daysRemaining > 0 ? salesGap / daysRemaining : 0;

    const avgTicket = monthTotals.transactions > 0 ? monthTotals.sales / monthTotals.transactions : 0;
    const budgetTicket = currentBudget.tickets_budget || avgTicket;

    // Datos para gráfica de proyección
    const projectionData = [];
    let accumulated = 0;

    // Días reales con ventas
    for (let i = 1; i <= daysElapsed; i++) {
      const daySale = monthSales.find((s) => new Date(s.date).getDate() === i);
      accumulated += daySale?.total_sales || 0;
      projectionData.push({ day: `Día ${i}`, real: accumulated, proyectado: null });
    }

    // Proyección días restantes
    for (let i = 1; i <= daysRemaining; i++) {
      accumulated += dailyAvgSales;
      projectionData.push({ day: `Día ${daysElapsed + i}`, real: null, proyectado: accumulated });
    }

    return {
      projectedSales,
      salesGap,
      requiredDailySales,
      daysRemaining,
      daysElapsed,
      avgTicket,
      budgetTicket,
      salesOnTrack: projectedSales >= currentBudget.sales_budget * 0.95,
      ticketOnTrack: avgTicket >= budgetTicket * 0.95,
      projectionData,
      totals: monthTotals,
      budget: currentBudget.sales_budget,
      dailyAvgSales
    };
  }, [currentBudget, dailySales, gregorianMode]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));
  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

  const getInsight = (type, value, budget) => {
    const pct = budget ? value / budget * 100 : 0;
    if (type === 'sales') {
      if (pct >= 100) return "🎉 ¡Meta superada!";
      if (pct >= 80) return "👍 Cerca de la meta";
      return "📈 Impulsar ventas";
    }
    return null;
  };

  // Calcular ticket promedio para el rango filtrado (tarjetas y gráficas)
  const avgTicket = totals.transactions > 0 ? totals.sales / totals.transactions : 0;
  const filteredAvgTicket = filteredTotals.transactions > 0 ? filteredTotals.sales / filteredTotals.transactions : 0;

  // Calcular ticket promedio ACUMULADO del mes retail (para resumen al final)
  const monthAvgTicket = monthTotals.transactions > 0 ? monthTotals.sales / monthTotals.transactions : 0;

  const comparisonAvgTicket = comparisonTotals && comparisonTotals.transactions > 0 ?
  comparisonTotals.sales / comparisonTotals.transactions :
  0;

  // Totales para las tarjetas: si hay filtro activo, usar ese rango; si no, mes gregoriano actual
  const gregorianMonthTotals = useMemo(() => {
    const now = new Date();
    let fromStr, toStr;

    if (weekFilter?.from && weekFilter?.to) {
      fromStr = format(weekFilter.from, 'yyyy-MM-dd');
      toStr = format(weekFilter.to, 'yyyy-MM-dd');
    } else if (dateRange?.from && dateRange?.to) {
      fromStr = format(dateRange.from, 'yyyy-MM-dd');
      toStr = format(dateRange.to, 'yyyy-MM-dd');
    } else {
      fromStr = format(startOfMonth(now), 'yyyy-MM-dd');
      toStr = format(now, 'yyyy-MM-dd');
    }

    return dailySales.filter((s) => {
      const d = s.date?.split('T')[0] || s.date;
      return d >= fromStr && d <= toStr;
    }).reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [dailySales, dateRange, weekFilter]);

  // Publicar datos al contexto de Nova
  useEffect(() => {
    if (!setPageData || !selectedStore) return;
    const storeName = STORES.find((s) => s.code === selectedStore)?.name || selectedStore;
    const avgTkt = gregorianMonthTotals.transactions > 0 ?
    gregorianMonthTotals.sales / gregorianMonthTotals.transactions : 0;
    const compliance = currentBudget?.sales_budget ?
    (gregorianMonthTotals.sales / currentBudget.sales_budget * 100).toFixed(1) : null;
    const proj = projections;

    setPageData({
      page: 'Dashboard',
      store: storeName,
      storeCode: selectedStore,
      ventas_acumuladas: gregorianMonthTotals.sales,
      presupuesto_mes: currentBudget?.sales_budget || 0,
      cumplimiento_pct: compliance,
      ticket_promedio: avgTkt,
      ticket_meta: currentBudget?.tickets_budget || 0,
      transacciones: gregorianMonthTotals.transactions,
      transacciones_meta: currentBudget?.transactions_budget || 0,
      sugeridos: gregorianMonthTotals.suggested,
      sugeridos_meta: currentBudget?.suggested_budget || 0,
      proyeccion_cierre: proj?.projectedSales || 0,
      brecha: proj?.salesGap || 0,
      venta_diaria_requerida: proj?.requiredDailySales || 0,
      dias_restantes: proj?.daysRemaining || 0,
      promedio_diario: proj?.dailyAvgSales || 0,
      cajeros_activos: cashiers.filter((c) => c.is_active).length,
      total_cajeros: cashiers.length
    });
  }, [gregorianMonthTotals, currentBudget, projections, selectedStore, cashiers, setPageData]);

  // Métricas usando ACUMULADO DEL MES GREGORIANO (siempre muestran el total real del mes)
  const metrics = [
  {
    id: 'sales',
    title: 'Ventas Totales',
    value: gregorianMonthTotals.sales,
    comparisonValue: comparisonTotals?.sales,
    budget: currentBudget.sales_budget,
    icon: DollarSign,
    bgColor: 'bg-gradient-to-br from-emerald-100 to-green-100',
    iconBg: 'bg-emerald-200/70',
    iconColor: 'text-emerald-700',
    format: 'currency'
  },
  {
    id: 'tickets',
    title: 'Ticket Promedio',
    value: gregorianMonthTotals.transactions > 0 ? gregorianMonthTotals.sales / gregorianMonthTotals.transactions : 0,
    comparisonValue: comparisonAvgTicket,
    budget: currentBudget.tickets_budget,
    icon: Receipt,
    bgColor: 'bg-gradient-to-br from-sky-100 to-blue-100',
    iconBg: 'bg-sky-200/70',
    iconColor: 'text-sky-700',
    format: 'currency'
  },
  {
    id: 'transactions',
    title: 'Transacciones',
    value: gregorianMonthTotals.transactions,
    comparisonValue: comparisonTotals?.transactions,
    budget: currentBudget.transactions_budget,
    icon: Zap,
    bgColor: 'bg-gradient-to-br from-violet-100 to-purple-100',
    iconBg: 'bg-violet-200/70',
    iconColor: 'text-violet-700'
  },
  {
    id: 'suggested',
    title: 'Sugeridos',
    value: gregorianMonthTotals.suggested,
    comparisonValue: comparisonTotals?.suggested,
    budget: currentBudget.suggested_budget,
    icon: Gift,
    bgColor: 'bg-gradient-to-br from-pink-100 to-rose-100',
    iconBg: 'bg-pink-200/70',
    iconColor: 'text-pink-700'
  }];




  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-screen-2xl mx-auto px-2 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <motion.h1
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }} className="bg-clip-text text-pink-700 text-2xl font-bold md:text-3xl from-violet-600 via-pink-500 to-violet-600">Tienda



              </motion.h1>
              {selectedStore &&
              <p className="text-pink-700 text-sm font-medium">{getDisplayName(selectedStore)}</p>
              }
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            {!showComparison && <WeekFilter onWeekChange={(range) => {setWeekFilter(range);setDateRange(null);setGregorianMode(false);}} multiSelect={true} />}
            <DateFilter
              dateRange={showComparison ? weekFilter || dateRange || { from: startOfMonth(new Date()), to: new Date() } : dateRange}
              onDateChange={(range) => {
                if (showComparison) {
                  setDateRange(range);
                  setWeekFilter(null);
                } else {
                  setDateRange(range);
                  setWeekFilter(null);
                  setGregorianMode(false);
                }
              }}
              buttonText={showComparison ? "📅 Período Actual" : undefined}
              buttonClassName={showComparison ? "border-blue-300 hover:border-blue-500" : undefined} />


            {showComparison &&
            <DateFilter
              dateRange={comparisonRange || { from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) }}
              onDateChange={setComparisonRange}
              buttonClassName="border-pink-300 hover:border-pink-500"
              buttonText="📅 Comparar con" />
            }
          </div>
        </div>

        {selectedStore ?
        <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="flex justify-end gap-2 items-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowComparison(false);
                  setComparisonRange(null);
                }}
                className={`gap-1 transition-all ${!showComparison ? 'bg-pink-50 text-pink-600 border-pink-200' : 'border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600'}`}>

                  <Activity className="w-4 h-4" />
                  Actual
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!showComparison) {
                    setShowComparison(true);
                    if (!comparisonRange) {
                      const now = new Date();
                      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                      setComparisonRange({ from: lastMonthStart, to: lastMonthEnd });
                    }
                  }
                }}
                className={`gap-1 transition-all ${showComparison ? 'bg-pink-50 text-pink-600 border-pink-200' : 'border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600'}`}>

                  <BarChart3 className="w-4 h-4" />
                  Comparable
                </Button>
              </motion.div>

              </div>

            {/* Retail Week Budget - PRESUPUESTO DEL DÍA (LO MÁS IMPORTANTE) */}
            {!showComparison &&
          <RetailWeekBudgetCard
            dailySales={dailySales}
            activeBudget={currentBudget}
            dailyBudgets={dailyBudgets}
            storeId={selectedStore}
            formatCurrency={formatCurrency}
            currentDateRange={weekFilter || dateRange}
            gregorianMode={gregorianMode}
            onConfigureBudget={() => setShowMonthlyBudget(true)}
            onExpandChange={(expanded) => {
              if (expanded) {
                setTimeout(() => {
                  const section = document.getElementById('budget-expanded-content');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 400);
              }
            }} />

          }

            {/* Sustentación Ejecutiva - Modo Comparable */}
            {showComparison && comparisonTotals &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-700 rounded-xl shadow-sm mb-6 overflow-hidden p-4">

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-base">Análisis Comparativo de Desempeño</h4>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Conclusiones */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
...
                    </div>
                  </div>
              </motion.div>
          }

            {/* Panel de comparación COMPACTO */}
            {showComparison && comparisonTotals &&
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'sales_comp' ? null : 'sales_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'sales_comp' ? 'ring-2 ring-emerald-400' : ''} ${

              comparisonTotals.sales > 0 && (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ?
              'bg-gradient-to-r from-emerald-500 to-green-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Ventas</span>
                    </div>
                    {comparisonTotals.sales > 0 && (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.sales > 0 ? ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ? '+' : '') + ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {formatCurrency(comparisonTotals.sales).slice(0, -3)}</span>
                    <span>Act: {formatCurrency(totals.sales).slice(0, -3)}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'trans_comp' ? null : 'trans_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'trans_comp' ? 'ring-2 ring-purple-400' : ''} ${

              comparisonTotals.transactions > 0 && (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ?
              'bg-gradient-to-r from-purple-500 to-violet-500' :
              'bg-gradient-to-r from-orange-500 to-amber-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Tráfico</span>
                    </div>
                    {comparisonTotals.transactions > 0 && (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.transactions > 0 ? ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ? '+' : '') + ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {comparisonTotals.transactions.toLocaleString()}</span>
                    <span>Act: {totals.transactions.toLocaleString()}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'ticket_comp' ? null : 'ticket_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'ticket_comp' ? 'ring-2 ring-blue-400' : ''} ${

              avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
              'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-amber-500 to-orange-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Ticket</span>
                    </div>
                    {avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.transactions > 0 ?
                ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100 >= 0 ? '+' : '') +
                ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1) :
                0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {formatCurrency(comparisonTotals.transactions > 0 ? comparisonTotals.sales / comparisonTotals.transactions : 0).slice(0, -3)}</span>
                    <span>Act: {formatCurrency(avgTicket).slice(0, -3)}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'suggested_comp' ? null : 'suggested_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'suggested_comp' ? 'ring-2 ring-pink-400' : ''} ${

              comparisonTotals.suggested > 0 && (totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ?
              'bg-gradient-to-r from-pink-500 to-rose-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Sugeridos</span>
                    </div>
                    {comparisonTotals.suggested > 0 && (totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.suggested > 0 ? ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ? '+' : '') + ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {comparisonTotals.suggested.toLocaleString()}</span>
                    <span>Act: {totals.suggested.toLocaleString()}</span>
                  </div>
                </motion.button>
              </motion.div>
          }

            {/* Nova AI Strip */}
            



























          

            {/* Premium KPI Cards */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              
              <PremiumMetricCard
              title="Ventas Totales"
              value={gregorianMonthTotals.sales}
              budget={currentBudget.sales_budget}
              icon={DollarSign}
              color="#ef4444"
              comparisonValue={comparisonTotals?.sales}
              showComparison={showComparison}
              onClick={() => {
                const newMetric = activeMetric === 'sales' ? null : 'sales';
                setActiveMetric(newMetric);
              }}
              isActive={activeMetric === 'sales'} />
            
              
              <PremiumMetricCard
              title="Ticket Promedio"
              value={gregorianMonthTotals.transactions > 0 ? gregorianMonthTotals.sales / gregorianMonthTotals.transactions : 0}
              budget={currentBudget.tickets_budget}
              icon={Receipt}
              color="#3b82f6"
              comparisonValue={comparisonAvgTicket}
              showComparison={showComparison}
              onClick={() => {
                const newMetric = activeMetric === 'tickets' ? null : 'tickets';
                setActiveMetric(newMetric);
              }}
              isActive={activeMetric === 'tickets'} />
            
              
              <PremiumMetricCard
              title="Transacciones"
              value={gregorianMonthTotals.transactions}
              budget={currentBudget.transactions_budget}
              icon={Zap}
              color="#8b5cf6"
              comparisonValue={comparisonTotals?.transactions}
              showComparison={showComparison}
              onClick={() => {
                const newMetric = activeMetric === 'transactions' ? null : 'transactions';
                setActiveMetric(newMetric);
              }}
              isActive={activeMetric === 'transactions'} />
            
              
              <PremiumMetricCard
              title="Sugeridos"
              value={gregorianMonthTotals.suggested}
              budget={currentBudget.suggested_budget}
              icon={Gift}
              color="#f59e0b"
              comparisonValue={comparisonTotals?.suggested}
              showComparison={showComparison}
              onClick={() => {
                const newMetric = activeMetric === 'suggested' ? null : 'suggested';
                setActiveMetric(newMetric);
              }}
              isActive={activeMetric === 'suggested'} />
            
            </motion.div>

            {/* Detail Panel */}
            <AnimatePresence>
              {activeMetric && !activeMetric.includes('_comp') &&
            <div id="detail-panel">
                  <DetailPanel
                metric={activeMetric}
                data={totals}
                chartData={chartData.map((d) => ({
                  ...d,
                  avgTicket: d.tickets > 0 ? d.ventas / d.tickets : 0
                }))}
                onClose={() => setActiveMetric(null)}
                formatCurrency={formatCurrency}
                shiftData={shiftRecords}
                gregorianTotal={activeMetric === 'sales' ? gregorianMonthTotals.sales : undefined} />

                </div>
            }
              
              {/* Detail Panel Comparativo */}
              {activeMetric && activeMetric.includes('_comp') && showComparison && comparisonTotals &&
            <motion.div
              id="detail-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl p-6 border border-white/10">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {activeMetric === 'sales_comp' && '💰 Análisis Comparativo de Ventas'}
                      {activeMetric === 'trans_comp' && '⚡ Análisis Comparativo de Transacciones'}
                      {activeMetric === 'ticket_comp' && '🎫 Análisis Comparativo de Ticket'}
                      {activeMetric === 'suggested_comp' && '🎁 Análisis Comparativo de Sugeridos'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setActiveMetric(null)} className="text-white hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Gráfica comparativa detallada */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={chartData}>
                        <defs>
                          <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="previousGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} tickFormatter={(v) =>
                    activeMetric === 'sales_comp' || activeMetric === 'ticket_comp' ? `$${(v / 1000000).toFixed(1)}M` : v.toLocaleString()
                    } />
                        <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff' }}
                      formatter={(v, name) => [
                      activeMetric === 'sales_comp' || activeMetric === 'ticket_comp' ? formatCurrency(v) : v.toLocaleString(),
                      name]
                      } />

                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Area
                      type="monotone"
                      dataKey={
                      activeMetric === 'sales_comp' ? 'ventasComparacion' :
                      activeMetric === 'trans_comp' ? 'transactionsComparacion' :
                      activeMetric === 'ticket_comp' ? 'ticketComparacion' :
                      'suggestedComparacion'
                      }
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fill="url(#previousGrad)"
                      name="Período Anterior"
                      strokeDasharray="5 5" />

                        <Area
                      type="monotone"
                      dataKey={
                      activeMetric === 'sales_comp' ? 'ventas' :
                      activeMetric === 'trans_comp' ? 'transactions' :
                      activeMetric === 'ticket_comp' ? 'ticketPromedio' :
                      'suggested'
                      }
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#currentGrad)"
                      name="Período Actual" />

                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                   {/* Stats comparativos con insights ejecutivos */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
                      <p className="text-xs text-emerald-200 mb-1">Período Actual</p>
                      <p className="text-2xl font-black text-white">
                        {activeMetric === 'sales_comp' && formatCurrency(totals.sales)}
                        {activeMetric === 'trans_comp' && totals.transactions.toLocaleString()}
                        {activeMetric === 'ticket_comp' && formatCurrency(avgTicket)}
                        {activeMetric === 'suggested_comp' && totals.suggested.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-500/20 rounded-xl p-4 border border-slate-400/30">
                      <p className="text-xs text-slate-200 mb-1">Período Anterior</p>
                      <p className="text-2xl font-black text-white">
                        {activeMetric === 'sales_comp' && formatCurrency(comparisonTotals.sales)}
                        {activeMetric === 'trans_comp' && comparisonTotals.transactions.toLocaleString()}
                        {activeMetric === 'ticket_comp' && formatCurrency(comparisonTotals.transactions > 0 ? comparisonTotals.sales / comparisonTotals.transactions : 0)}
                        {activeMetric === 'suggested_comp' && comparisonTotals.suggested.toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-xl p-4 border ${
                activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                'bg-emerald-500/20 border-emerald-400/30' :
                'bg-red-500/20 border-red-400/30'}`
                }>
                      <p className={`text-xs mb-1 ${
                  activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                  activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                  activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                  activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                  'text-emerald-200' :
                  'text-red-200'}`
                  }>Variación</p>
                      <p className={`text-2xl font-black ${
                  activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                  activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                  activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                  activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                  'text-emerald-400' :
                  'text-red-400'}`
                  }>
                        {activeMetric === 'sales_comp' &&
                    (totals.sales > comparisonTotals.sales ? '+' : '') +
                    ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'trans_comp' &&
                    (totals.transactions > comparisonTotals.transactions ? '+' : '') +
                    ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'ticket_comp' &&
                    (avgTicket > comparisonTotals.sales / comparisonTotals.transactions ? '+' : '') +
                    ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'suggested_comp' &&
                    (totals.suggested > comparisonTotals.suggested ? '+' : '') +
                    ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1) + '%'
                    }
                      </p>
                    </div>
                  </div>

                  {/* Análisis Gerencial */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Conclusiones */}
                        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                          <h5 className="text-sm font-bold text-blue-200 mb-2 flex items-center gap-1">
                            <span>📊</span> Conclusiones
                          </h5>
                          <p className="text-xs text-blue-100 leading-relaxed">
                            {activeMetric === 'sales_comp' && (
                        totals.sales > comparisonTotals.sales ?
                        `La facturación creció ${((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1)}%, superando el período anterior por ${formatCurrency(totals.sales - comparisonTotals.sales)}. Este resultado demuestra que las estrategias comerciales actuales están funcionando y el equipo está ejecutando efectivamente.` :
                        `Las ventas cayeron ${Math.abs((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1)}%, representando ${formatCurrency(Math.abs(totals.sales - comparisonTotals.sales))} menos que el período anterior. Esta contracción impacta directamente los objetivos mensuales y señala problemas operativos o de mercado que deben resolverse urgentemente.`)
                        }
                            {activeMetric === 'trans_comp' && (
                        totals.transactions > comparisonTotals.transactions ?
                        `El tráfico aumentó ${((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1)}%, con ${Math.abs(totals.transactions - comparisonTotals.transactions)} clientes adicionales. Esto indica éxito en captación, pero debe verificarse si las ventas crecieron proporcionalmente para confirmar efectividad comercial.` :
                        `Perdimos ${Math.abs(totals.transactions - comparisonTotals.transactions)} clientes (${Math.abs((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1)}% menos tráfico). Esto es crítico porque reduce oportunidades de venta. Probablemente causado por factores externos, competencia o deterioro en servicio que aleja a los clientes.`)
                        }
                            {activeMetric === 'ticket_comp' && (
                        avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                        `El ticket promedio mejoró ${((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1)}% (${formatCurrency(avgTicket - comparisonTotals.sales / comparisonTotals.transactions)} más por cliente). Cada cliente está comprando más, lo que maximiza rentabilidad y evidencia mejor capacidad de venta consultiva del equipo.` :
                        `El ticket promedio bajó ${Math.abs((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1)}%. Los clientes compran menos por visita, afectando márgenes. Esto sugiere falta de venta sugerida, problemas en mix de productos o migración a opciones de menor valor.`)
                        }
                            {activeMetric === 'suggested_comp' && (
                        totals.suggested > comparisonTotals.suggested ?
                        `Los sugeridos crecieron ${((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1)}%, vendiendo ${Math.abs(totals.suggested - comparisonTotals.suggested)} unidades más. Esto impacta directamente la rentabilidad porque cada sugerido tiene mayor margen y demuestra habilidad comercial del equipo.` :
                        `Vendimos ${Math.abs(totals.suggested - comparisonTotals.suggested)} sugeridos menos (${Math.abs((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1)}% de caída). Esto representa pérdida directa de margen y señala que el equipo no está ejecutando técnicas de venta consultiva efectivamente.`)
                        }
                          </p>
                        </div>

                        {/* Plan de Acción */}
                        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                          <h5 className="text-sm font-bold text-emerald-200 mb-2 flex items-center gap-1">
                            <span>🎯</span> Plan de Acción
                          </h5>
                          <p className="text-xs text-emerald-100 leading-relaxed">
                            {activeMetric === 'sales_comp' && (
                        totals.sales > comparisonTotals.sales ?
                        `1) Documentar qué hizo diferente el equipo este período (horarios, productos, técnicas). 2) Replicar estas prácticas exitosas en otros puntos. 3) Establecer nueva meta 10-15% superior para mantener momentum. Resultado esperado: consolidar crecimiento y llevarlo a otros puntos de venta.` :
                        `PLAN URGENTE: 1) Reunión HOY con equipo para identificar problemas específicos. 2) Analizar competencia directa esta semana. 3) Lanzar promoción agresiva en 48hrs para reactivar. 4) Revisar experiencia de cliente completamente. Resultado esperado: detener caída en 7 días máximo.`)
                        }
                            {activeMetric === 'trans_comp' && (
                        totals.transactions > comparisonTotals.transactions ?
                        `1) Analizar si ventas crecieron al mismo ritmo que tráfico. 2) Si no, capacitar equipo en cierre de ventas esta semana. 3) Implementar seguimiento diario de conversión por vendedor. Resultado esperado: convertir el mayor tráfico en ventas proporcionalmente mayores.` :
                        `PRIORIDAD ALTA: 1) Identificar por qué perdimos clientes (auditoría de servicio en 24hrs). 2) Revisar presencia digital y competencia. 3) Activar campaña de reactivación inmediata. 4) Mejorar experiencia física del punto. Resultado esperado: recuperar al menos 50% del tráfico perdido en 14 días.`)
                        }
                            {activeMetric === 'ticket_comp' && (
                        avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                        `1) Identificar qué vendedores tienen mejor ticket y documentar su método. 2) Capacitar resto del equipo en estas técnicas. 3) Establecer metas individuales de ticket para todos. Resultado esperado: llevar a todos los vendedores al nivel del mejor performer.` :
                        `ACCIÓN INMEDIATA: 1) Entrenamiento intensivo en venta sugerida mañana. 2) Implementar script obligatorio de cierre. 3) Verificar disponibilidad de productos complementarios. 4) Supervisión diaria de ticket por vendedor. Resultado esperado: recuperar ticket promedio anterior en 10 días.`)
                        }
                            {activeMetric === 'suggested_comp' && (
                        totals.suggested > comparisonTotals.suggested ?
                        `1) Reconocer públicamente a vendedores con más sugeridos. 2) Crear competencia interna con premio semanal. 3) Mantener inventario óptimo de productos complementarios. Resultado esperado: mantener y superar nivel actual, estableciendo nuevo estándar.` :
                        `INTERVENCIÓN URGENTE: 1) Reforzar capacitación en venta consultiva esta semana. 2) Revisar inventario de productos complementarios. 3) Implementar script de sugerido obligatorio. 4) Seguimiento diario individual. Resultado esperado: duplicar sugeridos en 14 días.`)
                        }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            }
              </AnimatePresence>

              {/* Gráficas adicionales en modo comparable */}
              {showComparison && comparisonTotals && !activeMetric &&
          <ComparableChartsGrid
            chartData={chartData}
            totals={totals}
            comparisonTotals={comparisonTotals}
            formatCurrency={formatCurrency} />

          }

            {/* Overview Charts - Solo visible en modo ACTUAL */}
            {!activeMetric && !showComparison &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6">

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales Trend */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Ventas Diarias {showComparison && '- Comparativo'}
                        </CardTitle>
                      </div>
                      <ChartInsight
                    data={chartData}
                    metric="ventas"
                    formatCurrency={formatCurrency}
                    comparisonData={showComparison ? comparisonTotals : null} />
                  
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="comparisonGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          formatter={(v, name) => [formatCurrency(v), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <Area
                          type="monotone"
                          dataKey="ventasComparacion"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fill="url(#comparisonGrad)"
                          name="Período Anterior"
                          strokeDasharray="5 5" />

                        }
                            <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#salesGrad)" name={showComparison ? "Período Actual" : "Ventas"} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rendimiento vs Zona */}
                  <ZonePerformanceComparison storeId={selectedStore} formatCurrency={formatCurrency} currentDateRange={weekFilter || dateRange} gregorianMode={gregorianMode} />
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transacciones vs Venta */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        Transacciones vs Ventas {showComparison && '- Comparativo'}
                      </CardTitle>
                      <ChartInsight
                    data={chartData}
                    metric="transactions"
                    formatCurrency={(v) => v.toLocaleString()}
                    comparisonData={showComparison ? comparisonTotals : null} />
                  
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(v, name) => [name.includes('Ventas') ? formatCurrency(v) : v.toLocaleString(), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <>
                                <Bar yAxisId="left" dataKey="transactionsComparacion" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Trans. Anterior" />
                                <Line yAxisId="right" type="monotone" dataKey="ventasComparacion" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#94a3b8', r: 3 }} name="Ventas Anterior" />
                              </>
                        }
                            <Bar yAxisId="left" dataKey="transactions" fill="#a855f7" radius={[4, 4, 0, 0]} name={showComparison ? "Trans. Actual" : "Transacciones"} />
                            <Line yAxisId="right" type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} name={showComparison ? "Ventas Actual" : "Ventas"} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ticket Promedio */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        Ticket Promedio {showComparison && '- Comparativo'}
                      </CardTitle>
                      <ChartInsight
                    data={chartData}
                    metric="ticketPromedio"
                    formatCurrency={formatCurrency}
                    comparisonData={showComparison ? comparisonTotals : null} />
                  
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="ticketCompGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(v, name) => [formatCurrency(v), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <Area
                          type="monotone"
                          dataKey="ticketComparacion"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fill="url(#ticketCompGrad)"
                          name="Ticket Anterior"
                          strokeDasharray="5 5" />

                        }
                            <Area type="monotone" dataKey="ticketPromedio" stroke="#3b82f6" strokeWidth={2} fill="url(#ticketGrad)" name={showComparison ? "Ticket Actual" : "Ticket Promedio"} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Third Row - Velocidad de Crecimiento */}
                <GrowthVelocityChart
              dailyTrend={chartData.map((d) => ({ ...d, sales: d.ventas }))}
              budget={currentBudget?.sales_budget || 0}
              formatCurrency={formatCurrency} />

                {/* Weather Impact Analysis - NUEVO */}
                {weatherData && !loadingWeather &&
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              
                    <WeatherSalesImpactChart
                weatherData={weatherData}
                dailySales={dailySales}
                formatCurrency={formatCurrency} />
                  </motion.div>
            }

                {loadingWeather &&
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4">
                  
                        <Activity className="w-16 h-16 text-blue-500" />
                      </motion.div>
                      <p className="text-gray-600 font-medium">Cargando datos del clima...</p>
                      <p className="text-gray-400 text-sm mt-2">Analizando 90 días de historia meteorológica</p>
                    </CardContent>
                  </Card>
            }
                </motion.div>
          }





            {/* Monthly Budget Manager Modal */}
            <MonthlyBudgetManager
            storeId={selectedStore}
            isOpen={showMonthlyBudget}
            onClose={() => setShowMonthlyBudget(false)}
            onSuccess={() => {
              queryClient.invalidateQueries(['dailyBudgets']);
              queryClient.invalidateQueries(['budgets']);
            }} />




            {/* Compra Vale Modal */}
            <AnimatePresence>
              {showCompraVale &&
            <CompraValeModal
              isOpen={showCompraVale}
              onClose={() => setShowCompraVale(false)}
              storeId={selectedStore}
              currentSales={totals}
              dateRange={weekFilter || dateRange} />

            }
            </AnimatePresence>

            {/* Store Sales Modal */}
            <AnimatePresence>
              {showStoreSales &&
            <StoreSalesModal
              isOpen={showStoreSales}
              onClose={() => setShowStoreSales(false)}
              storeId={selectedStore} />

            }
            </AnimatePresence>

            {/* Projection Detail Modal */}
            <AnimatePresence>
              {projectionMetric && projections &&
            <ProjectionDetailModal
              isOpen={!!projectionMetric}
              onClose={() => setProjectionMetric(null)}
              metric={projectionMetric}
              data={projections}
              formatCurrency={formatCurrency} />

            }
            </AnimatePresence>

            {/* Resumen Ejecutivo */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 text-white">

              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <BarChart3 className="w-5 h-5" />
                </motion.div>
                Acumulado del Mes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Venta Total</p>
                  <p className="text-2xl font-semibold">{formatCurrency(monthTotals.sales)}</p>
                  <p className="text-xs text-white/50 mt-1">Desde semana 1</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Ticket Promedio</p>
                  <p className="text-2xl font-semibold">{formatCurrency(monthAvgTicket)}</p>
                  <p className="text-xs text-white/50 mt-1">Venta ÷ Transacciones</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Total Transacciones</p>
                  <p className="text-2xl font-semibold">{monthTotals.transactions.toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-1">Ventas realizadas</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Sugeridos Vendidos</p>
                  <p className="text-2xl font-semibold">{monthTotals.suggested.toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-1">{monthTotals.transactions > 0 ? (monthTotals.suggested / monthTotals.transactions * 100).toFixed(0) : 0}% de conversión</p>
                </motion.div>
              </div>
            </motion.div>
          </div> :

        <div className="text-center py-20">
            <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-7xl mb-4">

              📊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver el dashboard de estadísticas</p>
          </div>
        }
      </div>
    </div>);

}