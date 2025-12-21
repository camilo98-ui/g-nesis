import React, { useState, useMemo } from 'react';
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
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import KPIsDetailView from '../components/executive/KPIsDetailView';
import ChartsDetailView from '../components/executive/ChartsDetailView';
import StoresDetailView from '../components/executive/StoresDetailView';
import ComparableView from '../components/executive/ComparableView';
import SalesForecastPanel from '../components/predictions/SalesForecastPanel';

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [weekFilter, setWeekFilter] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('general');

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

  const comparisonData = useMemo(() => {
    return filteredStores.map(s => ({
      name: s.name, ventas: s.totalSales, presupuesto: s.salesBudget,
      cumplimiento: s.salesCompliance, proyeccion: s.projection,
      ticket: s.avgTicket, transacciones: s.totalTransactions
    }));
  }, [filteredStores]);

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

  const zoneTotals = useMemo(() => {
    const totalSales = filteredStores.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = filteredStores.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = filteredStores.reduce((sum, s) => sum + s.projection, 0);
    return { totalSales, totalBudget, totalProjection };
  }, [filteredStores]);

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

  // Detectar tiendas sin planner de la semana
  const storesWithoutPlanner = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Domingo
    
    const storesWithShifts = new Set(
      allShifts
        .filter(shift => {
          try {
            const shiftDate = new Date(shift.date);
            return shiftDate >= weekStart && shiftDate <= weekEnd;
          } catch {
            return false;
          }
        })
        .map(shift => shift.store_id)
    );
    
    return STORES.filter(store => !storesWithShifts.has(store.code));
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40"
        style={{ width: '280px' }}
      >
        <div className="p-6">
          <Link to={createPageUrl('Home')}>
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 mb-8 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Popsy</p>
                <p className="text-xs text-gray-500">Panel Ejecutivo</p>
              </div>
            </motion.div>
          </Link>

          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-2">Vistas</p>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('general')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'general' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'general' ? 'font-semibold' : 'font-medium'}`}>
                  Resumen General
                </span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Análisis</p>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('comparable')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'comparable' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'comparable' ? 'font-semibold' : 'font-medium'}`}>
                  Análisis Comparable
                </span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('kpis')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'kpis' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'kpis' ? 'font-semibold' : 'font-medium'}`}>
                  KPIs Ejecutivos
                </span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('charts')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'charts' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'charts' ? 'font-semibold' : 'font-medium'}`}>
                  Análisis Visual
                </span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('stores')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'stores' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'stores' ? 'font-semibold' : 'font-medium'}`}>
                  Detalle por Tienda
                </span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Predictivo</p>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('forecast')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'forecast' ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4" />
                <span className={`text-sm ${activeView === 'forecast' ? 'font-semibold' : 'font-medium'}`}>
                  Pronóstico IA
                </span>
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Alertas</p>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('planner')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'planner' ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  <span className={`text-sm ${activeView === 'planner' ? 'font-semibold' : 'font-medium'}`}>
                    Planner Pendiente
                  </span>
                </div>
                {storesWithoutPlanner.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {storesWithoutPlanner.length}
                  </span>
                )}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('critical')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'critical' ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span className={`text-sm ${activeView === 'critical' ? 'font-semibold' : 'font-medium'}`}>
                    Tiendas Críticas
                  </span>
                </div>
                {statusCounts.critical > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {statusCounts.critical}
                  </span>
                )}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              onClick={() => setActiveView('alert')}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeView === 'alert' ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-4 h-4" />
                  <span className={`text-sm ${activeView === 'alert' ? 'font-semibold' : 'font-medium'}`}>
                    En Alerta
                  </span>
                </div>
                {statusCounts.negative > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {statusCounts.negative}
                  </span>
                )}
              </div>
            </motion.div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Acciones</p>
            <Link to={createPageUrl('Home')}>
              <motion.div
                whileHover={{ x: 3 }}
                className="px-4 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-gray-700"
              >
                <div className="flex items-center gap-3">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Volver a Tiendas</span>
                </div>
              </motion.div>
            </Link>
            </nav>
            </div>
            </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {activeView !== 'general' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('general')}
                className="absolute top-8 left-[320px] text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Resumen
              </Button>
            )}

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-xl hover:bg-slate-100"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Ejecutivo
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <WeekFilter onWeekChange={setWeekFilter} />
              <DateFilter dateRange={dateRange} onDateChange={(range) => { setDateRange(range); setWeekFilter(null); }} />
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
            />
            )}

            {activeView === 'critical' && !isLoading && (
            <StoresDetailView
              storesAnalysis={storesAnalysis.filter(s => s.status === 'critical')}
              formatCurrency={formatCurrency}
            />
            )}

            {activeView === 'alert' && !isLoading && (
            <StoresDetailView
              storesAnalysis={storesAnalysis.filter(s => s.status === 'negative')}
              formatCurrency={formatCurrency}
            />
            )}

            {activeView === 'planner' && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Tiendas sin Planner Semanal</h1>
                <p className="text-sm text-gray-500">
                  Tiendas que aún no han registrado horarios para la semana actual (Lunes - Domingo)
                </p>
              </motion.div>

              {storesWithoutPlanner.length === 0 ? (
                <Card className="border-emerald-100 bg-emerald-50/50">
                  <CardContent className="pt-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-900">¡Excelente!</p>
                        <p className="text-sm text-emerald-700">Todas las tiendas tienen su planner completo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storesWithoutPlanner.map((store) => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-all">
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
                                <span className="text-xs font-semibold">Planner pendiente</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              <Card className="mt-6 border-blue-100 bg-blue-50/50">
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
            {/* Estado General Badge */}
            {!isLoading && autoInsight && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
                  autoInsight.type === 'danger' ? 'bg-red-50 text-red-700 border-red-200' :
                  autoInsight.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  autoInsight.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  <span className="text-base">{autoInsight.icon}</span>
                  <span>{autoInsight.title}:</span>
                  <span className="font-normal">{autoInsight.message}</span>
                </div>
              </motion.div>
            )}

            {/* KPIs Principales */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => <KPISkeleton key={i} />)}
            </div>
          ) : zoneStatus && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <ExecutiveKPI
                title="Ventas Acumuladas"
                value={formatCurrency(zoneTotals.totalSales)}
                subtitle={`Meta: ${formatCurrency(zoneTotals.totalBudget)}`}
                icon={DollarSign}
                badge={`${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%`}
                badgeColor={zoneTotals.totalSales >= zoneTotals.totalBudget * 0.9 ? 'green' : zoneTotals.totalSales >= zoneTotals.totalBudget * 0.7 ? 'amber' : 'red'}
              />
              <ExecutiveKPI
                title="Proyección Mensual"
                value={formatCurrency(zoneStatus.projection)}
                subtitle={`Meta: ${formatCurrency(zoneStatus.totalBudget)}`}
                icon={Target}
                badge={`${zoneStatus.projectionCompliance.toFixed(0)}%`}
                badgeColor={zoneStatus.projectionCompliance >= 95 ? 'green' : zoneStatus.projectionCompliance >= 85 ? 'amber' : 'red'}
              />
              <ExecutiveKPI
                title="Brecha vs Meta"
                value={formatCurrency(Math.abs(zoneStatus.gap))}
                subtitle={zoneStatus.gap > 0 ? 'Por recuperar' : 'Excedente'}
                icon={TrendingUp}
                badge={zoneStatus.gap > 0 ? 'Déficit' : 'Superávit'}
                badgeColor={zoneStatus.gap > 0 ? 'red' : 'green'}
              />
              <ExecutiveKPI
                title="Ritmo Diario"
                value={formatCurrency(zoneStatus.currentDailyAvg)}
                subtitle={`Requerido: ${formatCurrency(zoneStatus.dailyRequired)}`}
                icon={Zap}
                badge={`${zoneStatus.daysElapsed}/${zoneStatus.daysElapsed + zoneStatus.daysRemaining} días`}
                badgeColor="blue"
              />
              <ExecutiveKPI
                title="Tiendas Críticas"
                value={statusCounts.critical}
                subtitle={`${((statusCounts.critical/STORES.length)*100).toFixed(0)}% del total`}
                icon={AlertTriangle}
                badge={statusCounts.critical === 0 ? 'Sin riesgo' : 'Requiere acción'}
                badgeColor={statusCounts.critical === 0 ? 'green' : 'red'}
              />
            </div>
          )}

          {/* Gráfica Principal */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card className="border-gray-100 shadow-sm mb-6">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Ventas Diarias vs Meta Mensual
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={comparisonData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-45} textAnchor="end" height={90} />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip 
                      formatter={(v) => formatCurrency(v)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="ventas" fill="url(#salesGradient)" name="Ventas Reales" radius={[6, 6, 0, 0]} />
                    <Line type="monotone" dataKey="presupuesto" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Indicadores Secundarios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Donut de Cumplimiento */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Distribución de Cumplimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'En Meta', value: statusCounts.positive, fill: '#10b981' },
                        { name: 'Alerta', value: statusCounts.negative, fill: '#f59e0b' },
                        { name: 'Críticas', value: statusCounts.critical, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.value}`}
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Barras de Estado */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Tiendas por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">En Meta</span>
                      <span className="font-semibold text-emerald-600">{statusCounts.positive}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(statusCounts.positive/STORES.length)*100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">En Alerta</span>
                      <span className="font-semibold text-amber-600">{statusCounts.negative}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(statusCounts.negative/STORES.length)*100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Críticas</span>
                      <span className="font-semibold text-red-600">{statusCounts.critical}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(statusCounts.critical/STORES.length)*100}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla Top 5 Críticas */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Top 5 Tiendas Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {storesAnalysis
                    .filter(s => s.status === 'critical' || s.status === 'negative')
                    .sort((a, b) => a.salesCompliance - b.salesCompliance)
                    .slice(0, 5)
                    .map((store, idx) => (
                      <div key={store.code} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{store.name}</span>
                        </div>
                        <span className={`font-semibold ${
                          store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {store.salesCompliance.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {!isLoading && aiInsights && (
            <Card className="border-gray-100 shadow-sm mb-6">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  Análisis Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-2">🎯 Patrón Crítico</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{aiInsights.patron_critico}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 mb-2">⚡ Acciones Prioritarias</p>
                    <ul className="space-y-1.5">
                      {aiInsights.acciones_prioritarias?.map((accion, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-semibold flex items-center justify-center text-[10px]">{i + 1}</span>
                          <span className="flex-1">{accion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-2">💡 Oportunidades</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{aiInsights.oportunidades}</p>
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
                    <tr
                      key={store.code}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
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
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </CardContent>
            </Card>
          )}

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