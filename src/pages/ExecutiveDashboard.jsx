import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import WeekFilter from '@/components/dashboard/WeekFilter';
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Receipt, Zap, Target, Filter, Brain, Sparkles, BarChart3, X,
  Store, Activity, Clock, Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import KPIsDetailView from '../components/executive/KPIsDetailView';
import ChartsDetailView from '../components/executive/ChartsDetailView';
import StoresDetailView from '../components/executive/StoresDetailView';
import ComparableView from '../components/executive/ComparableView';
import SalesForecastPanel from '../components/predictions/SalesForecastPanel';
import StoreDetailModal from '../components/executive/StoreDetailModal';
import PriorityActionsPanel from '../components/executive/PriorityActionsPanel';
import StoreStatusCards from '../components/executive/StoreStatusCards';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#1d4ed8', '#2563eb', '#1e40af'];

// Skeleton Loader
const KPISkeleton = () => (
  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-24"></div>
      <div className="h-10 bg-slate-200 rounded w-32"></div>
      <div className="h-3 bg-slate-200 rounded w-20"></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <Card className="border-slate-100 shadow-sm">
    <CardHeader>
      <div className="h-5 bg-slate-200 rounded w-40 animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
    </CardContent>
  </Card>
);

const ExecutiveKPI = ({ title, value, subtitle, icon: Icon, badge, badgeColor = 'blue' }) => {
  const badgeColors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 rounded-lg bg-blue-50">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        {badge && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{title}</p>
      <p className="text-lg font-black text-gray-900 mb-1 leading-none">{value}</p>
      <p className="text-[9px] text-gray-400 leading-tight">{subtitle}</p>
    </motion.div>
  );
};

export default function ExecutiveDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlView = urlParams.get('view');
  const urlComparison = urlParams.get('comparison');
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [weekFilter, setWeekFilter] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState(urlView || 'general');
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [chartView, setChartView] = useState('ventas');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [comparisonRange, setComparisonRange] = useState(null);
  const [showComparison, setShowComparison] = useState(urlComparison === 'true');
  
  useEffect(() => {
    if (urlView) {
      setActiveView(urlView);
    }
    if (urlComparison === 'true') {
      setShowComparison(true);
      // Establecer periodo de comparación por defecto (mes anterior)
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setComparisonRange({ from: lastMonthStart, to: lastMonthEnd });
    }
  }, [urlView, urlComparison]);

  const activeRange = weekFilter || dateRange;
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

  const { data: allCashiers = [], isLoading: loadingCashiers } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.list()
  });

  const { data: allShifts = [] } = useQuery({
    queryKey: ['allShifts'],
    queryFn: () => base44.entities.Shift.list()
  });

  const isLoading = loadingSales || loadingBudgets || loadingCashiers;

  // Store Analysis
  const storesAnalysis = useMemo(() => {
    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= activeRange.from && d <= activeRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTickets = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0));
      const totalTransactions = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));
      const avgTicket = totalTransactions > 0 && !isNaN(totalSales) ? totalSales / totalTransactions : 0;

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = Math.max(0, budget?.sales_budget || 0);
      const ticketsBudget = Math.max(0, budget?.tickets_budget || 0);
      const transactionsBudget = Math.max(0, budget?.transactions_budget || 0);

      const salesCompliance = salesBudget > 0 && !isNaN(totalSales) ? (totalSales / salesBudget) * 100 : 0;
      const ticketsCompliance = ticketsBudget > 0 && !isNaN(totalTickets) ? (totalTickets / ticketsBudget) * 100 : 0;
      const transactionsCompliance = transactionsBudget > 0 && !isNaN(totalTransactions) ? (totalTransactions / transactionsBudget) * 100 : 0;

      // Proyección sobre días del período
      const daysElapsed = Math.max(1, storeSales.length);
      const daysInPeriod = Math.max(1, Math.ceil((activeRange.to - activeRange.from) / (1000 * 60 * 60 * 24)));
      const dailyAvg = daysElapsed > 0 && !isNaN(totalSales) ? totalSales / daysElapsed : 0;
      const projection = !isNaN(dailyAvg) && !isNaN(daysInPeriod) ? dailyAvg * daysInPeriod : 0;
      const projectionCompliance = salesBudget > 0 && !isNaN(projection) ? (projection / salesBudget) * 100 : 0;

      let status = 'positive';
      if (salesCompliance < 70 || projectionCompliance < 85) status = 'critical';
      else if (salesCompliance < 90 || projectionCompliance < 95) status = 'negative';

      const totalZoneBudget = allBudgets
        .filter(b => b.month === currentMonth && b.year === currentYear)
        .reduce((sum, b) => sum + (b.sales_budget || 0), 0);
      const weight = totalZoneBudget > 0 && salesBudget >= 0 ? (salesBudget / totalZoneBudget) * 100 : 0;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales, totalTickets, totalTransactions, avgTicket,
        salesBudget, ticketsBudget, transactionsBudget,
        salesCompliance, ticketsCompliance, transactionsCompliance,
        projection, projectionCompliance, status, weight,
        daysElapsed, dailyAvg, daysInPeriod
      };
    });
  }, [allDailySales, allBudgets, activeRange, currentMonth, currentYear]);

  const filteredStores = useMemo(() => {
    if (filterStatus === 'all') return storesAnalysis;
    return storesAnalysis.filter(s => s.status === filterStatus);
  }, [storesAnalysis, filterStatus]);

  const zoneTotals = useMemo(() => {
    const totalSales = filteredStores.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = filteredStores.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = filteredStores.reduce((sum, s) => sum + s.projection, 0);
    return { totalSales, totalBudget, totalProjection };
  }, [filteredStores]);

  const comparisonData = useMemo(() => {
    return filteredStores.map(s => ({
      name: s.name, ventas: s.totalSales, presupuesto: s.salesBudget,
      cumplimiento: s.salesCompliance, proyeccion: s.projection,
      ticket: s.avgTicket, transacciones: s.totalTransactions
    }));
  }, [filteredStores]);

  // Análisis del período de comparación
  const comparisonAnalysis = useMemo(() => {
    if (!comparisonRange) return null;

    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= comparisonRange.from && d <= comparisonRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTickets = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0));
      const totalTransactions = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales,
        totalTickets,
        totalTransactions,
        avgTicket
      };
    });
  }, [allDailySales, comparisonRange]);

  // Datos comparativos para gráficas
  const comparisonChartData = useMemo(() => {
    if (!comparisonAnalysis) return comparisonData;

    return storesAnalysis.map(current => {
      const comparison = comparisonAnalysis.find(c => c.code === current.code);
      return {
        name: current.name,
        ventas_actual: current.totalSales,
        ventas_comparacion: comparison?.totalSales || 0,
        ticket_actual: current.avgTicket,
        ticket_comparacion: comparison?.avgTicket || 0,
        transacciones_actual: current.totalTransactions,
        transacciones_comparacion: comparison?.totalTransactions || 0,
        cumplimiento: current.salesCompliance,
        proyeccion: current.projection,
        presupuesto: current.salesBudget,
        ventas: current.totalSales,
        ticket: current.avgTicket,
        transacciones: current.totalTransactions,
        growth: comparison?.totalSales > 0 ? ((current.totalSales - comparison.totalSales) / comparison.totalSales) * 100 : 0
      };
    });
  }, [storesAnalysis, comparisonAnalysis, comparisonData]);

  const dataToDisplay = showComparison && comparisonRange ? comparisonChartData : comparisonData;

  // Totales comparativos
  const comparisonTotals = useMemo(() => {
    if (!comparisonAnalysis) return null;

    const currentTotal = zoneTotals.totalSales;
    const comparisonTotal = comparisonAnalysis.reduce((sum, s) => sum + s.totalSales, 0);
    const currentTransactions = filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0);
    const comparisonTransactions = comparisonAnalysis.reduce((sum, s) => sum + s.totalTransactions, 0);

    return {
      salesGrowth: comparisonTotal > 0 ? ((currentTotal - comparisonTotal) / comparisonTotal) * 100 : 0,
      salesDiff: currentTotal - comparisonTotal,
      transactionsGrowth: comparisonTransactions > 0 ? ((currentTransactions - comparisonTransactions) / comparisonTransactions) * 100 : 0,
      transactionsDiff: currentTransactions - comparisonTransactions,
      avgTicketCurrent: currentTransactions > 0 ? currentTotal / currentTransactions : 0,
      avgTicketComparison: comparisonTransactions > 0 ? comparisonTotal / comparisonTransactions : 0,
      currentTotal,
      comparisonTotal
    };
  }, [zoneTotals, comparisonAnalysis, filteredStores]);

  // Predictive Analytics
  const salesForecast = useMemo(() => {
    return storesAnalysis.map(store => {
      const historicalSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime());
        } catch {
          return false;
        }
      }).slice(-90);

      if (historicalSales.length < 7) return { ...store, forecast30: 0, forecast60: 0, willMissTarget: false, growthRate: 0 };

      const totalSales = Math.max(0, historicalSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const dailyAvg = historicalSales.length > 0 && !isNaN(totalSales) ? totalSales / historicalSales.length : 0;

      const midPoint = Math.floor(historicalSales.length / 2);
      const firstHalfSum = midPoint > 0 ? historicalSales.slice(0, midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) : 0;
      const firstHalfAvg = midPoint > 0 && !isNaN(firstHalfSum) ? firstHalfSum / midPoint : 0;
      const secondHalfSum = (historicalSales.length - midPoint) > 0 ? historicalSales.slice(midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) : 0;
      const secondHalfAvg = (historicalSales.length - midPoint) > 0 && !isNaN(secondHalfSum) ? secondHalfSum / (historicalSales.length - midPoint) : 0;
      const growthRate = firstHalfAvg > 0 && !isNaN(secondHalfAvg) && !isNaN(firstHalfAvg) ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;

      const trendAdjustedDaily = !isNaN(dailyAvg) && !isNaN(growthRate) ? dailyAvg * (1 + growthRate * 0.5) : dailyAvg || 0;
      const forecast30 = !isNaN(trendAdjustedDaily) ? trendAdjustedDaily * 30 : 0;
      const forecast60 = !isNaN(trendAdjustedDaily) ? trendAdjustedDaily * 60 : 0;

      const nextMonthBudget = allBudgets.find(b => 
        b.store_id === store.code && 
        b.month === (currentMonth % 12) + 1 && 
        b.year === currentYear
      );
      const willMissTarget = nextMonthBudget ? forecast30 < nextMonthBudget.sales_budget * 0.85 : false;

      return { ...store, forecast30, forecast60, growthRate: growthRate * 100, willMissTarget, nextMonthBudget: nextMonthBudget?.sales_budget || 0 };
    });
  }, [storesAnalysis, allDailySales, allBudgets, currentMonth, currentYear]);

  const weightData = useMemo(() => {
    return filteredStores.slice().sort((a, b) => b.weight - a.weight).map(s => ({
      name: s.name, peso: s.weight, presupuesto: s.salesBudget
    }));
  }, [filteredStores]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const statusCounts = useMemo(() => ({
    positive: storesAnalysis.filter(s => s.status === 'positive').length,
    negative: storesAnalysis.filter(s => s.status === 'negative').length,
    critical: storesAnalysis.filter(s => s.status === 'critical').length
  }), [storesAnalysis]);

  // Generate AI Insights
  const generateAIInsights = async () => {
    if (loadingInsights) return;
    setLoadingInsights(true);

    try {
      const storesAtRisk = salesForecast.filter(s => s.willMissTarget).slice(0, 5);
      const topStores = storesAnalysis.sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 3);
      const bottomStores = storesAnalysis.sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 3);

      const prompt = `Analiza esta situación de la zona de Popsy y genera insights accionables:

TIENDAS EN RIESGO:
${storesAtRisk.map(s => `- ${s.name}: Proyección $${(s.forecast30/1000000).toFixed(1)}M vs Meta $${(s.nextMonthBudget/1000000).toFixed(1)}M (Crecimiento: ${s.growthRate.toFixed(1)}%)`).join('\n')}

TOP 3 TIENDAS:
${topStores.map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% cumplimiento`).join('\n')}

BOTTOM 3 TIENDAS:
${bottomStores.map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% cumplimiento`).join('\n')}

INSTRUCCIONES:
1. Identifica el patrón crítico más importante
2. Sugiere 3 acciones prioritarias específicas y accionables
3. Identifica oportunidades de mejora
4. Sé directo y motivador (máximo 150 palabras)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            patron_critico: { type: "string" },
            acciones_prioritarias: { type: "array", items: { type: "string" } },
            oportunidades: { type: "string" }
          }
        }
      });

      setAiInsights(result);
    } catch (e) {
      console.error(e);
    }
    setLoadingInsights(false);
  };

  React.useEffect(() => {
    if (salesForecast.length > 0 && !aiInsights) {
      generateAIInsights();
    }
  }, [salesForecast.length]);

  // Auto Insight - Principal riesgo u oportunidad
  // Estado Maestro de la Zona
  const zoneStatus = useMemo(() => {
    if (storesAnalysis.length === 0 || !zoneTotals) return null;

    const daysInPeriod = Math.max(1, Math.ceil((activeRange.to - activeRange.from) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(1, storesAnalysis.reduce((sum, s) => Math.max(sum, s.daysElapsed || 0), 1));
    const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);

    const currentSales = zoneTotals.totalSales || 0;
    const totalBudget = zoneTotals.totalBudget || 0;
    const projection = zoneTotals.totalProjection || 0;
    const projectionCompliance = totalBudget > 0 && !isNaN(projection) ? (projection / totalBudget) * 100 : 0;
    const gap = totalBudget - projection;
    const dailyRequired = daysRemaining > 0 && totalBudget >= currentSales ? (totalBudget - currentSales) / daysRemaining : 0;
    const currentDailyAvg = daysElapsed > 0 && currentSales >= 0 ? currentSales / daysElapsed : 0;

    const storesOnTrack = storesAnalysis.filter(s => s.projectionCompliance >= 95).length;
    const storesAlert = storesAnalysis.filter(s => s.projectionCompliance >= 85 && s.projectionCompliance < 95).length;
    const storesCritical = storesAnalysis.filter(s => s.projectionCompliance < 85).length;

    let verdict = 'success';
    let verdictLabel = 'EN META';
    let verdictIcon = '✓';
    if (projectionCompliance < 85) {
      verdict = 'danger';
      verdictLabel = 'RIESGO CRÍTICO';
      verdictIcon = '!';
    } else if (projectionCompliance < 95) {
      verdict = 'warning';
      verdictLabel = 'EN ALERTA';
      verdictIcon = '⚠';
    }

    return {
      verdict,
      verdictLabel,
      verdictIcon,
      projectionCompliance,
      projection,
      totalBudget,
      gap,
      dailyRequired,
      currentDailyAvg,
      daysElapsed,
      daysRemaining,
      storesOnTrack,
      storesAlert,
      storesCritical,
      alertActive: projectionCompliance < 95
    };
  }, [storesAnalysis, zoneTotals, activeRange]);

  // Detectar tiendas con y sin planner de la semana
  const plannerStatus = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Domingo
    
    const storeShiftsMap = new Map();
    
    allShifts.forEach(shift => {
      try {
        const shiftDate = new Date(shift.date);
        if (shiftDate >= weekStart && shiftDate <= weekEnd) {
          if (!storeShiftsMap.has(shift.store_id)) {
            storeShiftsMap.set(shift.store_id, []);
          }
          storeShiftsMap.get(shift.store_id).push(shift);
        }
      } catch {}
    });
    
    const withPlanner = STORES.filter(store => storeShiftsMap.has(store.code))
      .map(store => ({
        ...store,
        shiftsCount: storeShiftsMap.get(store.code).length,
        lastUpdated: Math.max(...storeShiftsMap.get(store.code).map(s => new Date(s.updated_date || s.created_date).getTime()))
      }));
    
    const withoutPlanner = STORES.filter(store => !storeShiftsMap.has(store.code));
    
    return { withPlanner, withoutPlanner };
  }, [allShifts]);

  const autoInsight = useMemo(() => {
    if (storesAnalysis.length === 0) return null;
    
    const critical = storesAnalysis.filter(s => s.status === 'critical');
    const positive = storesAnalysis.filter(s => s.status === 'positive' && s.salesCompliance >= 110);
    const atRisk = salesForecast.filter(s => s.willMissTarget);
    
    const totalCompliance = zoneTotals.totalBudget > 0 ? (zoneTotals.totalSales / zoneTotals.totalBudget) * 100 : 0;
    const projectionCompliance = zoneTotals.totalBudget > 0 ? (zoneTotals.totalProjection / zoneTotals.totalBudget) * 100 : 0;
    
    // Priorizar riesgos
    if (critical.length >= STORES.length * 0.3) {
      return {
        type: 'danger',
        icon: '🚨',
        title: 'Alerta Crítica',
        message: `${critical.length} tiendas en estado crítico (${((critical.length/STORES.length)*100).toFixed(0)}%). Requieren intervención inmediata.`
      };
    }
    
    if (atRisk.length > 0 && projectionCompliance < 90) {
      return {
        type: 'warning',
        icon: '⚠️',
        title: 'Riesgo de Incumplimiento',
        message: `Proyección al ${projectionCompliance.toFixed(0)}% de meta. ${atRisk.length} tiendas en riesgo de no alcanzar objetivos.`
      };
    }
    
    if (totalCompliance < 85) {
      const gap = zoneTotals.totalBudget - zoneTotals.totalSales;
      return {
        type: 'warning',
        icon: '📉',
        title: 'Por Debajo de Expectativas',
        message: `Cumplimiento actual: ${totalCompliance.toFixed(0)}%. Falta ${formatCurrency(gap)} para alcanzar la meta.`
      };
    }
    
    // Oportunidades
    if (positive.length >= 5) {
      return {
        type: 'success',
        icon: '🎯',
        title: 'Desempeño Destacado',
        message: `${positive.length} tiendas superando metas en más del 10%. Momentum positivo en la zona.`
      };
    }
    
    if (totalCompliance >= 95 && projectionCompliance >= 100) {
      return {
        type: 'success',
        icon: '✨',
        title: 'En Cumplimiento',
        message: `Zona al ${totalCompliance.toFixed(0)}% de meta. Proyección: ${projectionCompliance.toFixed(0)}%. Camino sólido hacia objetivos.`
      };
    }
    
    return {
      type: 'neutral',
      icon: '📊',
      title: 'En Seguimiento',
      message: `Cumplimiento: ${totalCompliance.toFixed(0)}%. Monitoreo continuo de ${statusCounts.negative + statusCounts.critical} puntos en alerta.`
    };
  }, [storesAnalysis, salesForecast, zoneTotals, statusCounts, formatCurrency]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-pink-100/30 via-purple-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-blue-100/30 via-violet-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-40 shadow-2xl"
        style={{ width: '280px' }}
      >
        <div className="p-6">
          <Link to={createPageUrl('Home')}>
            <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-3 mb-10 cursor-pointer">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
              >
                <Store className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className="text-base font-black text-white">Popsy</p>
                <p className="text-xs text-slate-400">Analytics</p>
              </div>
            </motion.div>
          </Link>

          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mb-3">Dashboard</p>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('general')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'general' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-semibold">Analytics</span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mt-6 mb-3">Reports</p>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('kpis')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'kpis' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5" />
                <span className="text-sm font-semibold">KPIs</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('charts')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'charts' 
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-semibold">Charts</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('stores')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'stores' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5" />
                <span className="text-sm font-semibold">Stores</span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mt-6 mb-3">AI Insights</p>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('forecast')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'forecast' 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-semibold">Forecast</span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mt-6 mb-3">Operations</p>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('planner')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'planner' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-semibold">Schedule</span>
                </div>
                {plannerStatus.withoutPlanner.length > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {plannerStatus.withoutPlanner.length}
                  </span>
                )}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('critical')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'critical' 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Critical</span>
                </div>
                {statusCounts.critical > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {statusCounts.critical}
                  </span>
                )}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('alert')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all mx-2 ${
                activeView === 'alert' 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30' 
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-semibold">Alerts</span>
                </div>
                {statusCounts.negative > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {statusCounts.negative}
                  </span>
                )}
              </div>
            </motion.div>

            <div className="absolute bottom-6 left-6 right-6">
              <Link to={createPageUrl('Home')}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all text-slate-400 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-semibold">Back</span>
                  </div>
                </motion.div>
              </Link>
            </div>
            </nav>
            </div>
            </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 relative ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-xl hover:bg-white/80 backdrop-blur-sm"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DateFilter 
                dateRange={dateRange} 
                onDateChange={(range) => { setDateRange(range); setWeekFilter(null); }} 
              />
            </div>
            </div>

            {/* Conditional View Rendering */}
            {activeView === 'comparable' && !isLoading && (
            <ComparableView 
              storesAnalysis={storesAnalysis}
              allDailySales={allDailySales}
              activeRange={activeRange}
              formatCurrency={formatCurrency}
            />
            )}

            {activeView === 'kpis' && !isLoading && (
            <KPIsDetailView 
              storesAnalysis={storesAnalysis}
              formatCurrency={formatCurrency}
              zoneTotals={zoneTotals}
            />
            )}

            {activeView === 'charts' && !isLoading && (
            <ChartsDetailView
              storesAnalysis={storesAnalysis}
              formatCurrency={formatCurrency}
              comparisonData={comparisonData}
            />
            )}

            {activeView === 'stores' && !isLoading && (
            <StoresDetailView
              storesAnalysis={storesAnalysis}
              formatCurrency={formatCurrency}
              allDailySales={allDailySales}
              dateRange={activeRange}
            />
            )}

            {activeView === 'critical' && !isLoading && (
            <StoresDetailView
              storesAnalysis={storesAnalysis.filter(s => s.status === 'critical')}
              formatCurrency={formatCurrency}
              allDailySales={allDailySales}
              dateRange={activeRange}
            />
            )}

            {activeView === 'alert' && !isLoading && (
            <StoresDetailView
              storesAnalysis={storesAnalysis.filter(s => s.status === 'negative')}
              formatCurrency={formatCurrency}
              allDailySales={allDailySales}
              dateRange={activeRange}
            />
            )}

            {activeView === 'planner' && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Planner Semanal</h1>
                <p className="text-sm text-gray-500">
                  Estado de planificación de horarios para la semana actual (Lunes - Domingo)
                </p>
              </motion.div>

              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-emerald-100 bg-emerald-50/50">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold mb-1">Planners Completos</p>
                        <p className="text-3xl font-black text-emerald-700">{plannerStatus.withPlanner.length}</p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100 bg-orange-50/50">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-orange-600 font-semibold mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-orange-700">{plannerStatus.withoutPlanner.length}</p>
                      </div>
                      <Clock className="w-10 h-10 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 bg-blue-50/50">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold mb-1">Cobertura</p>
                        <p className="text-3xl font-black text-blue-700">
                          {Math.round((plannerStatus.withPlanner.length / STORES.length) * 100)}%
                        </p>
                      </div>
                      <Target className="w-10 h-10 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tiendas CON planner */}
              {plannerStatus.withPlanner.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Planners Completados ({plannerStatus.withPlanner.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plannerStatus.withPlanner.map((store) => (
                      <Link 
                        key={store.code}
                        to={`${createPageUrl('PopsyPlanner')}?store=${store.code}&returnView=planner`}
                        onClick={() => localStorage.setItem('selectedStore', store.code)}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className="border-emerald-200 bg-emerald-50/30 hover:shadow-lg transition-all cursor-pointer">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100">
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 mb-1">{getDisplayName(store.code)}</p>
                                  <p className="text-xs text-gray-600 mb-2">{store.code}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-600 font-semibold">
                                      {store.shiftsCount} turnos programados
                                    </span>
                                    <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                      Ver →
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tiendas SIN planner */}
              {plannerStatus.withoutPlanner.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Planners Pendientes ({plannerStatus.withoutPlanner.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plannerStatus.withoutPlanner.map((store) => (
                      <Link 
                        key={store.code}
                        to={`${createPageUrl('PopsyPlanner')}?store=${store.code}&returnView=planner`}
                        onClick={() => localStorage.setItem('selectedStore', store.code)}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-all cursor-pointer">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-100">
                                  <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 mb-1">{getDisplayName(store.code)}</p>
                                  <p className="text-xs text-gray-600 mb-2">{store.code}</p>
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-xs font-semibold">Crear planner →</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">📋 Recordatorio Semanal</p>
                      <p className="text-sm text-gray-600">
                        Todos los líderes deben registrar los horarios de su equipo cada lunes al inicio de la semana.
                        Esto permite una mejor planificación y gestión del personal.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            {activeView === 'forecast' && !isLoading && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Pronósticos de Ventas</h1>
                <p className="text-sm text-gray-500">Predicciones inteligentes basadas en IA para los próximos 7 días</p>
              </motion.div>

              <div className="space-y-6">
                {/* Pronóstico de Zona */}
                <SalesForecastPanel 
                  storeId={null}
                  storeName="Zona Bogotá Noroccidente"
                  allStores={true}
                />

                {/* Pronósticos por Tienda Top 3 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pronósticos por Tienda</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {storesAnalysis
                      .sort((a, b) => b.totalSales - a.totalSales)
                      .slice(0, 4)
                      .map(store => (
                        <SalesForecastPanel 
                          key={store.code}
                          storeId={store.code}
                          storeName={store.name}
                          allStores={false}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* General View */}
            {activeView === 'general' && (
            <>
            {/* Alerta Crítica Principal - Solo cuando >70% críticas */}
            {!isLoading && statusCounts.critical >= STORES.length * 0.7 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-2xl border-2 border-red-400"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl"
                  >
                    🚨
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-2">ALERTA CRÍTICA - ACCIÓN INMEDIATA REQUERIDA</h3>
                    <p className="text-red-100 text-sm font-medium mb-3">
                      {statusCounts.critical} de {STORES.length} tiendas ({Math.round((statusCounts.critical/STORES.length)*100)}%) en estado crítico con cumplimiento inferior al 70%.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button 
                        onClick={() => setActiveView('critical')}
                        className="bg-white text-red-600 hover:bg-red-50 font-bold shadow-lg"
                      >
                        Ver Tiendas Críticas
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* KPIs Principales - Estilo moderno */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => <KPISkeleton key={i} />)}
            </div>
          ) : zoneStatus && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Total Sales Card - Grande estilo imagen */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 p-6 shadow-2xl shadow-pink-500/30"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-pink-100 uppercase tracking-wide">Total Sales</p>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <DollarSign className="w-6 h-6 text-white/80" />
                      </motion.div>
                    </div>
                    <p className="text-4xl font-black text-white mb-4">
                      {(zoneTotals.totalSales / 1000000).toFixed(1)}M
                    </p>
                    
                    {/* Mini sparkline */}
                    <div className="flex items-end gap-1 h-12 mb-3">
                      {storesAnalysis.slice(0, 12).map((s, i) => {
                        const maxSales = Math.max(...storesAnalysis.map(st => st.totalSales));
                        const height = (s.totalSales / maxSales) * 100;
                        return (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05 }}
                            className="flex-1 bg-white/40 rounded-t-sm min-h-[4px]"
                          />
                        );
                      })}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[10px] text-pink-100 font-semibold">Target</p>
                        <p className="text-sm font-black text-white">${(zoneTotals.totalBudget / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-pink-100 font-semibold">Users</p>
                        <p className="text-sm font-black text-white">{allCashiers.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-pink-100 font-semibold">Stores</p>
                        <p className="text-sm font-black text-white">{STORES.length}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Cumplimiento Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Performance</p>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-gray-900 mb-1">
                    {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Budget completion</p>
                  
                  {/* Progress bar */}
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((zoneTotals.totalSales/zoneTotals.totalBudget)*100), 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 rounded-lg py-2">
                      <p className="text-emerald-700 font-black">{statusCounts.positive}</p>
                      <p className="text-[9px] text-gray-500">On track</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-2">
                      <p className="text-amber-700 font-black">{statusCounts.negative}</p>
                      <p className="text-[9px] text-gray-500">Warning</p>
                    </div>
                    <div className="bg-red-50 rounded-lg py-2">
                      <p className="text-red-700 font-black">{statusCounts.critical}</p>
                      <p className="text-[9px] text-gray-500">Critical</p>
                    </div>
                  </div>
                </motion.div>

                {/* Comments/Insights Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="bg-gradient-to-br from-pink-100/60 to-rose-100/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-pink-200/50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-white/60">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-pink-700 uppercase mb-1">AI Insights</p>
                      <p className="text-2xl font-black text-pink-900">{storesAnalysis.filter(s => s.salesCompliance >= 100).length}</p>
                    </div>
                  </div>
                  <div className="h-12 flex items-end gap-1">
                    {storesAnalysis.slice(0, 15).map((_, i) => (
                      <div key={i} className="flex-1 bg-pink-400/40 rounded-t-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Projection Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Projection</p>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-gray-900 mb-1">
                    {(zoneStatus.projection / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500 mb-3">Month-end forecast</p>
                  <div className="text-xs bg-violet-50 text-violet-700 font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {zoneStatus.projectionCompliance.toFixed(0)}% goal achievement
                  </div>
              </div>
            </>
          )}

          {/* Acciones Prioritarias Hoy */}
          {!isLoading && (
            <PriorityActionsPanel 
              storesAnalysis={storesAnalysis}
              formatCurrency={formatCurrency}
              zoneTotals={zoneTotals}
            />
          )}

          {/* Pregunta Clave: ¿A Dónde Vamos? */}
          {!isLoading && (
            <div className="mb-3 mt-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">🎯 ¿A Dónde Vamos?</p>
            </div>
          )}

          {/* Clasificación Visual de Tiendas */}
          {!isLoading && (
            <StoreStatusCards 
              storesAnalysis={storesAnalysis}
              formatCurrency={formatCurrency}
              zoneTotals={zoneTotals}
            />
          )}

          {/* Panel de Comparación */}
          {!isLoading && showComparison && comparisonRange && comparisonTotals && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <Card className={`border-2 ${comparisonTotals.salesGrowth >= 0 ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50' : 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50'}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase">Crecimiento Ventas</p>
                    {comparisonTotals.salesGrowth >= 0 ? 
                      <TrendingUp className="w-5 h-5 text-emerald-600" /> : 
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <p className={`text-3xl font-black mb-1 ${comparisonTotals.salesGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {comparisonTotals.salesGrowth >= 0 ? '+' : ''}{comparisonTotals.salesGrowth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {comparisonTotals.salesDiff >= 0 ? '+' : ''}{formatCurrency(comparisonTotals.salesDiff)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase">Actual vs Anterior</p>
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xl font-black text-blue-700 mb-1">
                    {formatCurrency(comparisonTotals.currentTotal)}
                  </p>
                  <p className="text-xs text-gray-600">
                    vs {formatCurrency(comparisonTotals.comparisonTotal)}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-2 ${comparisonTotals.transactionsGrowth >= 0 ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50'}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase">Δ Transacciones</p>
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className={`text-3xl font-black mb-1 ${comparisonTotals.transactionsGrowth >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
                    {comparisonTotals.transactionsGrowth >= 0 ? '+' : ''}{comparisonTotals.transactionsGrowth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {comparisonTotals.transactionsDiff >= 0 ? '+' : ''}{comparisonTotals.transactionsDiff.toLocaleString()} trans
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase">Ticket Promedio</p>
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xl font-black text-amber-700 mb-1">
                    {formatCurrency(comparisonTotals.avgTicketCurrent)}
                  </p>
                  <p className="text-xs text-gray-600">
                    vs {formatCurrency(comparisonTotals.avgTicketComparison)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Botones de Vista Dinámica Mejorados */}
          {!isLoading && (
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartView('ventas')}
                className={`relative px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 whitespace-nowrap shadow-lg ${
                  chartView === 'ventas'
                    ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-blue-500/50 ring-4 ring-blue-200'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-xl'
                }`}
              >
                {chartView === 'ventas' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  chartView === 'ventas' ? 'bg-white/20' : 'bg-blue-100'
                }`}>
                  <DollarSign className={`w-5 h-5 ${chartView === 'ventas' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div className="text-left">
                  <p className={chartView === 'ventas' ? 'text-white' : 'text-gray-900'}>Ventas</p>
                  <p className={`text-xs ${chartView === 'ventas' ? 'text-blue-100' : 'text-gray-500'}`}>vs Meta</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartView('cumplimiento')}
                className={`relative px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 whitespace-nowrap shadow-lg ${
                  chartView === 'cumplimiento'
                    ? 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white shadow-emerald-500/50 ring-4 ring-emerald-200'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-400 hover:shadow-xl'
                }`}
              >
                {chartView === 'cumplimiento' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  chartView === 'cumplimiento' ? 'bg-white/20' : 'bg-emerald-100'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${chartView === 'cumplimiento' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <div className="text-left">
                  <p className={chartView === 'cumplimiento' ? 'text-white' : 'text-gray-900'}>Cumplimiento</p>
                  <p className={`text-xs ${chartView === 'cumplimiento' ? 'text-emerald-100' : 'text-gray-500'}`}>% por Tienda</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartView('proyeccion')}
                className={`relative px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 whitespace-nowrap shadow-lg ${
                  chartView === 'proyeccion'
                    ? 'bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 text-white shadow-purple-500/50 ring-4 ring-purple-200'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400 hover:shadow-xl'
                }`}
              >
                {chartView === 'proyeccion' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  chartView === 'proyeccion' ? 'bg-white/20' : 'bg-purple-100'
                }`}>
                  <Target className={`w-5 h-5 ${chartView === 'proyeccion' ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <div className="text-left">
                  <p className={chartView === 'proyeccion' ? 'text-white' : 'text-gray-900'}>Proyección</p>
                  <p className={`text-xs ${chartView === 'proyeccion' ? 'text-purple-100' : 'text-gray-500'}`}>Estimación</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartView('eficiencia')}
                className={`relative px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 whitespace-nowrap shadow-lg ${
                  chartView === 'eficiencia'
                    ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-amber-500/50 ring-4 ring-amber-200'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-400 hover:shadow-xl'
                }`}
              >
                {chartView === 'eficiencia' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  chartView === 'eficiencia' ? 'bg-white/20' : 'bg-amber-100'
                }`}>
                  <Zap className={`w-5 h-5 ${chartView === 'eficiencia' ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <div className="text-left">
                  <p className={chartView === 'eficiencia' ? 'text-white' : 'text-gray-900'}>Eficiencia</p>
                  <p className={`text-xs ${chartView === 'eficiencia' ? 'text-amber-100' : 'text-gray-500'}`}>Ticket & Trans</p>
                </div>
              </motion.button>
            </div>
          )}

          {/* Panel Dinámico Expandido */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={chartView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* KPIs Mini del Panel Activo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {chartView === 'ventas' && (
                    <>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-blue-100 font-semibold mb-1">💰 Venta Total Zona</p>
                            <p className="text-xl font-black">{formatCurrency(zoneTotals.totalSales)}</p>
                            <p className="text-[10px] text-blue-100 mt-1">de {formatCurrency(zoneTotals.totalBudget)}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Card className={`border-2 ${zoneTotals.totalSales >= zoneTotals.totalBudget ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300' : 'bg-gradient-to-br from-rose-500 to-red-600 border-red-300'} text-white shadow-lg`}>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs font-semibold mb-1 opacity-90">
                              {zoneTotals.totalSales >= zoneTotals.totalBudget ? '✓ Superávit' : '⚠ Brecha'}
                            </p>
                            <p className="text-xl font-black">{formatCurrency(Math.abs(zoneTotals.totalBudget - zoneTotals.totalSales))}</p>
                            <p className="text-[10px] opacity-90 mt-1">{zoneTotals.totalSales >= zoneTotals.totalBudget ? 'Por encima' : 'Por recuperar'}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white shadow-md">
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-cyan-600 font-semibold mb-1">📊 Prom/Tienda</p>
                            <p className="text-xl font-black text-cyan-900">{formatCurrency(zoneTotals.totalSales / filteredStores.length)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{filteredStores.length} tiendas</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-amber-200 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs font-semibold mb-1 opacity-90">⭐ Mejor Tienda</p>
                            <p className="text-xl font-black">{formatCurrency(Math.max(...filteredStores.map(s => s.totalSales)))}</p>
                            <p className="text-[10px] opacity-90 mt-1 truncate">{filteredStores.sort((a,b) => b.totalSales - a.totalSales)[0]?.name}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </>
                  )}
                  {chartView === 'cumplimiento' && (
                    <>
                      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-emerald-600 font-semibold mb-1">En Meta (≥90%)</p>
                          <p className="text-xl font-black text-emerald-900">{statusCounts.positive}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{((statusCounts.positive/STORES.length)*100).toFixed(0)}% del total</p>
                        </CardContent>
                      </Card>
                      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-amber-600 font-semibold mb-1">En Alerta (70-90%)</p>
                          <p className="text-xl font-black text-amber-900">{statusCounts.negative}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{((statusCounts.negative/STORES.length)*100).toFixed(0)}% del total</p>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-red-600 font-semibold mb-1">Críticas {'<'}70%)</p>
                          <p className="text-xl font-black text-red-900">{statusCounts.critical}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{((statusCounts.critical/STORES.length)*100).toFixed(0)}% del total</p>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Cumplimiento Zona</p>
                          <p className="text-xl font-black text-blue-900">{((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%</p>
                          <p className="text-[10px] text-gray-500 mt-1">Promedio general</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  {chartView === 'proyeccion' && (
                    <>
                      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-purple-600 font-semibold mb-1">Proyección Total</p>
                          <p className="text-xl font-black text-purple-900">{formatCurrency(zoneTotals.totalProjection)}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Estimado al cierre</p>
                        </CardContent>
                      </Card>
                      <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-pink-600 font-semibold mb-1">% Proyección</p>
                          <p className="text-xl font-black text-pink-900">{((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%</p>
                          <p className="text-[10px] text-gray-500 mt-1">vs meta mensual</p>
                        </CardContent>
                      </Card>
                      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-indigo-600 font-semibold mb-1">Tiendas en Riesgo</p>
                          <p className="text-xl font-black text-indigo-900">{storesAnalysis.filter(s => s.projectionCompliance < 85).length}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Proyección {'<'}85%</p>
                        </CardContent>
                      </Card>
                      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-violet-600 font-semibold mb-1">Gap a Cerrar</p>
                          <p className="text-xl font-black text-violet-900">{formatCurrency(Math.max(0, zoneTotals.totalBudget - zoneTotals.totalProjection))}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Faltante estimado</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  {chartView === 'eficiencia' && (
                    <>
                      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-amber-600 font-semibold mb-1">Ticket Zona</p>
                          <p className="text-xl font-black text-amber-900">{formatCurrency(zoneTotals.totalSales / filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0))}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Promedio general</p>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-orange-600 font-semibold mb-1">Transacciones</p>
                          <p className="text-xl font-black text-orange-900">{filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Total zona</p>
                        </CardContent>
                      </Card>
                      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-yellow-600 font-semibold mb-1">Mejor Ticket</p>
                          <p className="text-xl font-black text-yellow-900">{formatCurrency(Math.max(...filteredStores.map(s => s.avgTicket)))}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{filteredStores.sort((a,b) => b.avgTicket - a.avgTicket)[0]?.name}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-lime-200 bg-gradient-to-br from-lime-50 to-white">
                        <CardContent className="pt-4 pb-3">
                          <p className="text-xs text-lime-600 font-semibold mb-1">Promedio Trans/Tienda</p>
                          <p className="text-xl font-black text-lime-900">{Math.round(filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0) / filteredStores.length).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Por punto de venta</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Gráficas Dinámicas Mejoradas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfica Principal Grande */}
                  <Card className="lg:col-span-2 border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />
                    <CardHeader className="relative z-10 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {chartView === 'ventas' && <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"><DollarSign className="w-6 h-6 text-white" /></div>}
                          {chartView === 'cumplimiento' && <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"><CheckCircle className="w-6 h-6 text-white" /></div>}
                          {chartView === 'proyeccion' && <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30"><Target className="w-6 h-6 text-white" /></div>}
                          {chartView === 'eficiencia' && <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"><Zap className="w-6 h-6 text-white" /></div>}
                          <div>
                            <CardTitle className="text-lg font-black text-white">
                              {chartView === 'ventas' && 'Análisis de Ventas'}
                              {chartView === 'cumplimiento' && 'Cumplimiento de Metas'}
                              {chartView === 'proyeccion' && 'Proyección de Cierre'}
                              {chartView === 'eficiencia' && 'Eficiencia Operativa'}
                            </CardTitle>
                            <p className="text-xs text-slate-400 mt-1">
                              {chartView === 'ventas' && 'Performance de ventas vs presupuesto asignado'}
                              {chartView === 'cumplimiento' && 'Porcentaje de avance sobre objetivos'}
                              {chartView === 'proyeccion' && 'Estimación de cierre basada en tendencia'}
                              {chartView === 'eficiencia' && 'Productividad: ticket promedio por transacción'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-8 pb-6">
                      <ResponsiveContainer width="100%" height={400}>
                        {chartView === 'ventas' && (
                          <ComposedChart data={dataToDisplay}>
                            <defs>
                              <linearGradient id="vibrantSalesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6}/>
                              </linearGradient>
                              <linearGradient id="targetGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ef4444"/>
                                <stop offset="50%" stopColor="#f97316"/>
                                <stop offset="100%" stopColor="#ef4444"/>
                              </linearGradient>
                              <filter id="neonGlow">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#475569" strokeOpacity={0.2} vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }} 
                              angle={-35} 
                              textAnchor="end" 
                              height={100}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <YAxis 
                              tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                const gap = data.presupuesto - data.ventas;
                                const pct = (data.ventas / data.presupuesto) * 100;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-blue-400 shadow-2xl shadow-blue-500/50">
                                    <p className="font-black text-white text-sm mb-3">{data.name}</p>
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">💰 Ventas:</span>
                                        <span className="font-bold text-blue-300">{formatCurrency(data.ventas)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">🎯 Meta:</span>
                                        <span className="font-bold text-red-300">{formatCurrency(data.presupuesto)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6 pt-2 border-t border-slate-700">
                                        <span className="text-slate-300">📊 Cumplimiento:</span>
                                        <span className={`font-black text-sm ${pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                          {pct.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">📉 Brecha:</span>
                                        <span className={`font-bold ${gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                          {formatCurrency(Math.abs(gap))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            {showComparison && comparisonRange ? (
                              <>
                                <Bar 
                                  dataKey="ventas_comparacion" 
                                  fill="rgba(148, 163, 184, 0.6)" 
                                  radius={[12, 12, 0, 0]}
                                  animationDuration={1500}
                                  name="Período Anterior"
                                />
                                <Bar 
                                  dataKey="ventas_actual" 
                                  fill="url(#vibrantSalesGradient)" 
                                  radius={[12, 12, 0, 0]}
                                  animationDuration={1500}
                                  animationBegin={200}
                                  name="Período Actual"
                                  label={{
                                    position: 'top',
                                    fill: '#e2e8f0',
                                    fontWeight: 900,
                                    fontSize: 10,
                                    formatter: (v) => `$${(v/1000000).toFixed(1)}M`
                                  }}
                                />
                              </>
                            ) : (
                              <Bar 
                                dataKey="ventas" 
                                fill="url(#vibrantSalesGradient)" 
                                radius={[12, 12, 0, 0]}
                                animationDuration={1500}
                                animationBegin={100}
                                label={{
                                  position: 'top',
                                  fill: '#e2e8f0',
                                  fontWeight: 900,
                                  fontSize: 10,
                                  formatter: (v) => `$${(v/1000000).toFixed(1)}M`
                                }}
                              />
                            )}
                            <Line 
                              type="monotone" 
                              dataKey="presupuesto" 
                              stroke="url(#targetGradient)" 
                              strokeWidth={5} 
                              strokeDasharray="10 6" 
                              dot={{ fill: '#ef4444', r: 8, strokeWidth: 4, stroke: '#1e293b' }}
                              activeDot={{ r: 12, strokeWidth: 4, fill: '#f97316', filter: 'url(#neonGlow)' }}
                              animationDuration={1800}
                              name="Meta Presupuesto"
                            />
                          </ComposedChart>
                        )}
                        {chartView === 'cumplimiento' && (
                          <BarChart data={dataToDisplay.sort((a, b) => b.cumplimiento - a.cumplimiento)}>
                            <defs>
                              <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981"/>
                                <stop offset="100%" stopColor="#047857"/>
                              </linearGradient>
                              <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b"/>
                                <stop offset="100%" stopColor="#d97706"/>
                              </linearGradient>
                              <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444"/>
                                <stop offset="100%" stopColor="#dc2626"/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#475569" strokeOpacity={0.2} vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }} 
                              angle={-35} 
                              textAnchor="end" 
                              height={100}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <YAxis 
                              tickFormatter={(v) => `${v}%`} 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }}
                              stroke="#64748b"
                              strokeWidth={2}
                              domain={[0, 130]}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-emerald-400 shadow-2xl shadow-emerald-500/50">
                                    <p className="font-black text-white text-sm mb-3">{data.name}</p>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl ${
                                        data.cumplimiento >= 90 ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' :
                                        data.cumplimiento >= 70 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' :
                                        'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                                      }`}>
                                        {data.cumplimiento.toFixed(0)}%
                                      </div>
                                      <div>
                                        <p className={`text-xs font-bold ${
                                          data.cumplimiento >= 90 ? 'text-emerald-400' :
                                          data.cumplimiento >= 70 ? 'text-amber-400' :
                                          'text-red-400'
                                        }`}>
                                          {data.cumplimiento >= 90 ? '✓ SUPERANDO META' : data.cumplimiento >= 70 ? '⚠ EN ALERTA' : '✗ CRÍTICO'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          {data.cumplimiento >= 100 ? `+${(data.cumplimiento - 100).toFixed(0)}% sobre objetivo` : `Falta ${(100 - data.cumplimiento).toFixed(0)}% para meta`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs pt-3 border-t border-slate-700">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Ventas:</span>
                                        <span className="font-bold text-blue-300">{formatCurrency(data.ventas)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Meta:</span>
                                        <span className="font-bold text-slate-200">{formatCurrency(data.presupuesto)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar 
                              dataKey="cumplimiento" 
                              radius={[12, 12, 0, 0]} 
                              animationDuration={1600}
                              animationBegin={100}
                              label={{
                                position: 'top',
                                fill: '#f1f5f9',
                                fontWeight: 900,
                                fontSize: 11,
                                formatter: (v) => `${v.toFixed(0)}%`
                              }}
                            >
                              {comparisonData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.cumplimiento >= 90 ? 'url(#successGrad)' : 
                                    entry.cumplimiento >= 70 ? 'url(#warningGrad)' : 'url(#dangerGrad)'
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                        {chartView === 'proyeccion' && (
                          <AreaChart data={dataToDisplay}>
                            <defs>
                              <linearGradient id="projGrad1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#475569" strokeOpacity={0.2} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }} 
                              angle={-35} 
                              textAnchor="end" 
                              height={100}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <YAxis 
                              tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                const gap = data.presupuesto - data.proyeccion;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-purple-400 shadow-2xl shadow-purple-500/50">
                                    <p className="font-black text-white text-sm mb-3">{data.name}</p>
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">🔮 Proyección:</span>
                                        <span className="font-bold text-purple-300">{formatCurrency(data.proyeccion)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">🎯 Meta:</span>
                                        <span className="font-bold text-cyan-300">{formatCurrency(data.presupuesto)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6 pt-2 border-t border-slate-700">
                                        <span className="text-slate-300">{gap > 0 ? '📉 Faltante:' : '🎉 Excedente:'}</span>
                                        <span className={`font-black ${gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                          {formatCurrency(Math.abs(gap))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="proyeccion" 
                              stroke="#a855f7" 
                              strokeWidth={5} 
                              fill="url(#projGrad1)" 
                              animationDuration={1600}
                              dot={{ fill: '#a855f7', r: 8, strokeWidth: 4, stroke: '#1e293b' }}
                              activeDot={{ r: 12, strokeWidth: 4, fill: '#c084fc' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="presupuesto" 
                              stroke="#06b6d4" 
                              strokeWidth={4} 
                              strokeDasharray="10 6"
                              fill="url(#budgetGrad)" 
                              animationDuration={1800}
                              dot={{ fill: '#06b6d4', r: 7, strokeWidth: 3, stroke: '#1e293b' }}
                            />
                          </AreaChart>
                        )}
                        {chartView === 'eficiencia' && (
                          <ComposedChart data={dataToDisplay.sort((a, b) => (b.ticket_actual || b.ticket) - (a.ticket_actual || a.ticket))}>
                            <defs>
                              <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95}/>
                                <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7}/>
                              </linearGradient>
                              <linearGradient id="ticketLine" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6"/>
                                <stop offset="50%" stopColor="#a855f7"/>
                                <stop offset="100%" stopColor="#8b5cf6"/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#475569" strokeOpacity={0.2} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }} 
                              angle={-35} 
                              textAnchor="end" 
                              height={100}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <YAxis 
                              yAxisId="left" 
                              tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <YAxis 
                              yAxisId="right" 
                              orientation="right" 
                              tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 700 }}
                              stroke="#64748b"
                              strokeWidth={2}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0].payload;
                                const efficiency = (data.ticket / 1000) * data.transacciones;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-amber-400 shadow-2xl shadow-amber-500/50">
                                    <p className="font-black text-white text-sm mb-3">{data.name}</p>
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">🎫 Ticket:</span>
                                        <span className="font-bold text-purple-300">{formatCurrency(data.ticket)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6">
                                        <span className="text-slate-300">⚡ Trans:</span>
                                        <span className="font-bold text-amber-300">{data.transacciones.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between gap-6 pt-2 border-t border-slate-700">
                                        <span className="text-slate-300">💰 Total:</span>
                                        <span className="font-black text-emerald-400">{formatCurrency(data.ventas)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            {showComparison && comparisonRange ? (
                              <>
                                <Bar 
                                  yAxisId="right" 
                                  dataKey="transacciones_comparacion" 
                                  fill="rgba(148, 163, 184, 0.5)" 
                                  radius={[12, 12, 0, 0]}
                                  animationDuration={1400}
                                  name="Trans. Anterior"
                                />
                                <Bar 
                                  yAxisId="right" 
                                  dataKey="transacciones_actual" 
                                  fill="url(#transGrad)" 
                                  radius={[12, 12, 0, 0]}
                                  animationDuration={1400}
                                  animationBegin={200}
                                  name="Trans. Actual"
                                  label={{
                                    position: 'top',
                                    fill: '#fde68a',
                                    fontWeight: 900,
                                    fontSize: 10,
                                    formatter: (v) => v.toLocaleString()
                                  }}
                                />
                                <Line 
                                  yAxisId="left" 
                                  type="monotone" 
                                  dataKey="ticket_comparacion" 
                                  stroke="#94a3b8" 
                                  strokeWidth={4} 
                                  strokeDasharray="5 5"
                                  dot={{ fill: '#94a3b8', r: 6 }} 
                                  name="Ticket Anterior"
                                  animationDuration={1700}
                                />
                                <Line 
                                  yAxisId="left" 
                                  type="monotone" 
                                  dataKey="ticket_actual" 
                                  stroke="url(#ticketLine)" 
                                  strokeWidth={6} 
                                  dot={{ fill: '#8b5cf6', r: 9, strokeWidth: 4, stroke: '#1e293b' }} 
                                  activeDot={{ r: 13, strokeWidth: 4, fill: '#a855f7' }}
                                  name="Ticket Actual"
                                  animationDuration={1700}
                                />
                              </>
                            ) : (
                              <>
                                <Bar 
                                  yAxisId="right" 
                                  dataKey="transacciones" 
                                  fill="url(#transGrad)" 
                                  radius={[12, 12, 0, 0]}
                                  animationDuration={1400}
                                  name="Transacciones"
                                  label={{
                                    position: 'top',
                                    fill: '#fde68a',
                                    fontWeight: 900,
                                    fontSize: 10,
                                    formatter: (v) => v.toLocaleString()
                                  }}
                                />
                                <Line 
                                  yAxisId="left" 
                                  type="monotone" 
                                  dataKey="ticket" 
                                  stroke="url(#ticketLine)" 
                                  strokeWidth={6} 
                                  dot={{ fill: '#8b5cf6', r: 9, strokeWidth: 4, stroke: '#1e293b' }} 
                                  activeDot={{ r: 13, strokeWidth: 4, fill: '#a855f7' }}
                                  name="Ticket Promedio"
                                  animationDuration={1700}
                                />
                              </>
                            )}
                          </ComposedChart>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Tarjetas Interactivas de Métricas */}
                  {['ticket_zona', 'transacciones_zona', 'mejor_tienda', 'top_ticket'].map((metric, idx) => {
                    const metricData = {
                      ticket_zona: {
                        icon: Receipt,
                        title: 'Ticket Promedio Zona',
                        value: formatCurrency(zoneTotals.totalSales / filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0)),
                        subtitle: `${filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0).toLocaleString()} transacciones`,
                        gradient: 'from-cyan-500 to-blue-600',
                        shadow: 'shadow-cyan-500/30',
                        ring: 'ring-cyan-300'
                      },
                      transacciones_zona: {
                        icon: Zap,
                        title: 'Total Transacciones',
                        value: filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0).toLocaleString(),
                        subtitle: `${Math.round(filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0) / filteredStores.length).toLocaleString()} promedio/tienda`,
                        gradient: 'from-violet-500 to-purple-600',
                        shadow: 'shadow-violet-500/30',
                        ring: 'ring-violet-300'
                      },
                      mejor_tienda: {
                        icon: TrendingUp,
                        title: 'Mejor Tienda del Período',
                        value: filteredStores.sort((a,b) => b.totalSales - a.totalSales)[0]?.name || '-',
                        subtitle: formatCurrency(Math.max(...filteredStores.map(s => s.totalSales))),
                        gradient: 'from-emerald-500 to-green-600',
                        shadow: 'shadow-emerald-500/30',
                        ring: 'ring-emerald-300'
                      },
                      top_ticket: {
                        icon: Target,
                        title: 'Mayor Ticket Promedio',
                        value: filteredStores.sort((a,b) => b.avgTicket - a.avgTicket)[0]?.name || '-',
                        subtitle: formatCurrency(Math.max(...filteredStores.map(s => s.avgTicket))),
                        gradient: 'from-pink-500 to-rose-600',
                        shadow: 'shadow-pink-500/30',
                        ring: 'ring-pink-300'
                      }
                    }[metric];

                    const Icon = metricData.icon;

                    return (
                      <motion.div
                        key={metric}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        onClick={() => setSelectedMetric(selectedMetric === metric ? null : metric)}
                        className={`relative cursor-pointer group`}
                      >
                        <Card className={`border-none shadow-xl bg-gradient-to-br ${metricData.gradient} overflow-hidden ${
                          selectedMetric === metric ? `ring-4 ${metricData.ring}` : ''
                        }`}>
                          {selectedMetric === metric && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                          <CardContent className="pt-6 pb-6 relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                              <motion.div
                                animate={selectedMetric === metric ? { rotate: 360 } : {}}
                                transition={{ duration: 0.5 }}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                              >
                                <Sparkles className="w-4 h-4 text-white" />
                              </motion.div>
                            </div>
                            <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wide">{metricData.title}</p>
                            <p className="text-2xl font-black text-white mb-2 truncate">{metricData.value}</p>
                            <p className="text-xs text-white/70 font-medium">{metricData.subtitle}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Resumen Ejecutivo Diario */}
                <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-md">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <Sparkles className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 mb-2">
                          {chartView === 'ventas' && '💰 Resumen de Ventas'}
                          {chartView === 'cumplimiento' && '✓ Estado de Cumplimiento'}
                          {chartView === 'proyeccion' && '🎯 Proyección de Cierre'}
                          {chartView === 'eficiencia' && '⚡ Eficiencia Operativa'}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">
                          {chartView === 'ventas' && `Acumulado: ${formatCurrency(zoneTotals.totalSales)} (${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%). ${filteredStores.filter(s => s.totalSales >= s.salesBudget).length}/${filteredStores.length} tiendas superaron meta.`}
                          {chartView === 'cumplimiento' && `${statusCounts.positive} en meta ✓ | ${statusCounts.negative} en alerta ⚠ | ${statusCounts.critical} críticas ✗. ${zoneTotals.totalSales >= zoneTotals.totalBudget * 0.9 ? 'Zona en buen rumbo.' : 'Requiere impulso inmediato.'}`}
                          {chartView === 'proyeccion' && `Cierre estimado: ${formatCurrency(zoneTotals.totalProjection)} (${((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%). ${storesAnalysis.filter(s => s.projectionCompliance >= 100).length} tiendas alcanzarán meta, ${storesAnalysis.filter(s => s.projectionCompliance < 85).length} en riesgo.`}
                          {chartView === 'eficiencia' && `Ticket zona: ${formatCurrency(zoneTotals.totalSales / filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0))}. ${filteredStores.filter(s => s.avgTicket > zoneTotals.totalSales / filteredStores.reduce((sum, s) => sum + s.totalTransactions, 0)).length}/${filteredStores.length} sobre promedio.`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}



          {/* Insight IA Ejecutivo - Simplificado */}
          {!isLoading && aiInsights && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 mb-6 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Insight IA: Análisis Ejecutivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Patrón Identificado */}
                  <div className="bg-white/60 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                      <span>🎯</span> Situación Actual
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{aiInsights.patron_critico}</p>
                  </div>

                  {/* Acciones Top 3 */}
                  <div className="bg-white/60 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1">
                      <span>⚡</span> Top 3 Acciones Inmediatas
                    </p>
                    <div className="space-y-2">
                      {aiInsights.acciones_prioritarias?.slice(0, 3).map((accion, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-black flex items-center justify-center text-[10px]">{i + 1}</span>
                          <span className="text-xs text-gray-800 font-medium leading-relaxed">{accion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Oportunidades */}
                  <div className="bg-white/60 rounded-xl p-4 border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                      <span>💡</span> Oportunidad de Mejora
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{aiInsights.oportunidades}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla Compacta */}
          {!isLoading && (
            <Card id="stores-table" className="border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-sm font-semibold text-gray-900">Detalle por Tienda</CardTitle>
              </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tienda</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Ventas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Meta</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">% Cumpl.</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Proyección</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {storesAnalysis.map((store, idx) => (
                    <motion.tr
                      key={store.code}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="border-b border-gray-100 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">{store.name}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(store.totalSales)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(store.salesBudget)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${
                          store.salesCompliance >= 90 ? 'text-emerald-600' : 
                          store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {store.salesCompliance.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">
                        {formatCurrency(store.projection)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {store.status === 'positive' && (
                          <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                            En Meta
                          </span>
                        )}
                        {store.status === 'negative' && (
                          <span className="inline-flex px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-semibold">
                            Alerta
                          </span>
                        )}
                        {store.status === 'critical' && (
                          <span className="inline-flex px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-semibold">
                            Crítica
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                </table>
              </div>
            </CardContent>
            </Card>
          )}

          {/* Modal de Detalle de Tienda */}
          <AnimatePresence>
            {selectedStoreDetail && (
              <StoreDetailModal
                store={selectedStoreDetail}
                onClose={() => setSelectedStoreDetail(null)}
                allDailySales={allDailySales}
                dateRange={activeRange}
              />
            )}
          </AnimatePresence>

            {/* Chart Modal */}
          <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedCard(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    {selectedCard === 'sales' ? '💰 Análisis de Ventas' : '🎯 Análisis de Proyección'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    {selectedCard === 'sales' ? (
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={90} />
                        <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="ventas" fill="#ec4899" name="Ventas" />
                        <Bar dataKey="ticket" fill="#8b5cf6" name="Ticket Promedio" />
                      </BarChart>
                    ) : (
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={90} />
                        <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="proyeccion" stroke="#8b5cf6" strokeWidth={3} name="Proyección" />
                        <Line type="monotone" dataKey="presupuesto" stroke="#ec4899" strokeWidth={3} strokeDasharray="5 5" name="Meta" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
          </>
          )}
        </div>
      </div>
    </div>
  );
}