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
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#8b5cf6', '#a78bfa', '#c4b5fd', '#fbbf24'];

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

const ExecutiveKPI = ({ title, value, subtitle, icon: Icon, trend, status = 'neutral', onClick }) => {
  const statusColors = {
    success: 'from-emerald-500/10 to-green-500/5 border-emerald-200/50 text-emerald-700',
    warning: 'from-amber-500/10 to-yellow-500/5 border-amber-200/50 text-amber-700',
    danger: 'from-rose-500/10 to-red-500/5 border-rose-200/50 text-rose-700',
    neutral: 'from-slate-500/10 to-gray-500/5 border-slate-200/50 text-slate-700'
  };

  const statusIconColors = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    neutral: 'text-slate-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`cursor-pointer bg-gradient-to-br ${statusColors[status]} rounded-3xl p-8 border backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-2xl bg-white/80 ${statusIconColors[status]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
              trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </motion.div>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-2">{title}</p>
      <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
      <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
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

      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = budget?.sales_budget || 0;
      const ticketsBudget = budget?.tickets_budget || 0;
      const transactionsBudget = budget?.transactions_budget || 0;

      const salesCompliance = salesBudget > 0 ? (totalSales / salesBudget) * 100 : 0;
      const ticketsCompliance = ticketsBudget > 0 ? (totalTickets / ticketsBudget) * 100 : 0;
      const transactionsCompliance = transactionsBudget > 0 ? (totalTransactions / transactionsBudget) * 100 : 0;

      // Proyección sobre días del período
      const daysElapsed = Math.max(1, storeSales.length);
      const daysInPeriod = Math.max(1, Math.ceil((activeRange.to - activeRange.from) / (1000 * 60 * 60 * 24)));
      const dailyAvg = totalSales / daysElapsed;
      const projection = dailyAvg * daysInPeriod;
      const projectionCompliance = salesBudget > 0 ? (projection / salesBudget) * 100 : 0;

      let status = 'positive';
      if (salesCompliance < 70 || projectionCompliance < 85) status = 'critical';
      else if (salesCompliance < 90 || projectionCompliance < 95) status = 'negative';

      const totalZoneBudget = allBudgets
        .filter(b => b.month === currentMonth && b.year === currentYear)
        .reduce((sum, b) => sum + (b.sales_budget || 0), 0);
      const weight = totalZoneBudget > 0 ? (salesBudget / totalZoneBudget) * 100 : 0;

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

      const totalSales = historicalSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const dailyAvg = totalSales / historicalSales.length;
      
      const midPoint = Math.floor(historicalSales.length / 2);
      const firstHalfAvg = historicalSales.slice(0, midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) / midPoint;
      const secondHalfAvg = historicalSales.slice(midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) / (historicalSales.length - midPoint);
      const growthRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;

      const trendAdjustedDaily = dailyAvg * (1 + growthRate * 0.5);
      const forecast30 = trendAdjustedDaily * 30;
      const forecast60 = trendAdjustedDaily * 60;

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
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(v);

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
  const autoInsight = useMemo(() => {
    if (storesAnalysis.length === 0) return null;
    
    const critical = storesAnalysis.filter(s => s.status === 'critical');
    const positive = storesAnalysis.filter(s => s.status === 'positive' && s.salesCompliance >= 110);
    const atRisk = salesForecast.filter(s => s.willMissTarget);
    
    const totalCompliance = (zoneTotals.totalSales / zoneTotals.totalBudget) * 100;
    const projectionCompliance = (zoneTotals.totalProjection / zoneTotals.totalBudget) * 100;
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/30 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        className="fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-lg z-40"
        style={{ width: '280px' }}
      >
        <div className="p-6">
          <Link to={createPageUrl('Home')}>
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 mb-8 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Popsy</p>
                <p className="text-xs text-slate-500">Panel Ejecutivo</p>
              </div>
            </motion.div>
          </Link>

          <nav className="space-y-2">
            <motion.div
              whileHover={{ x: 4 }}
              className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-bold text-slate-900">Resumen General</span>
              </div>
            </motion.div>
            <Link to={createPageUrl('Home')}>
              <motion.div
                whileHover={{ x: 4 }}
                className="px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Volver a Tiendas</span>
                </div>
              </motion.div>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <Clock className="w-3 h-3" />
              <span>Última actualización</span>
            </div>
            <p className="text-xs font-bold text-slate-900">{format(new Date(), 'HH:mm - dd MMM yyyy', { locale: es })}</p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-[30px]'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
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
                <h1 className="text-3xl font-black text-slate-900">
                  Dashboard Ejecutivo
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Vista consolidada · {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
                {!isLoading && autoInsight && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                      autoInsight.type === 'danger' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      autoInsight.type === 'warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      autoInsight.type === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="text-lg">{autoInsight.icon}</span>
                    <div>
                      <span className="font-black">{autoInsight.title}:</span> {autoInsight.message}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <WeekFilter onWeekChange={setWeekFilter} />
              <DateFilter dateRange={dateRange} onDateChange={(range) => { setDateRange(range); setWeekFilter(null); }} />
            </div>
          </div>

          {/* KPIs Ejecutivos */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => <KPISkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <ExecutiveKPI
                title="Venta Total"
                value={`$${(zoneTotals.totalSales/1000000).toFixed(1)}M`}
                subtitle={`Meta: $${(zoneTotals.totalBudget/1000000).toFixed(1)}M · ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%`}
                icon={DollarSign}
                status={zoneTotals.totalSales >= zoneTotals.totalBudget ? 'success' : zoneTotals.totalSales >= zoneTotals.totalBudget * 0.85 ? 'warning' : 'danger'}
                onClick={() => setSelectedCard('sales')}
              />
              <ExecutiveKPI
                title="Proyección al Cierre"
                value={`$${(zoneTotals.totalProjection/1000000).toFixed(1)}M`}
                subtitle={`${((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}% de la meta`}
                icon={Target}
                status={zoneTotals.totalProjection >= zoneTotals.totalBudget ? 'success' : zoneTotals.totalProjection >= zoneTotals.totalBudget * 0.9 ? 'warning' : 'danger'}
                onClick={() => setSelectedCard('projection')}
              />
              <ExecutiveKPI
                title="Tiendas en Meta"
                value={statusCounts.positive}
                subtitle={`${((statusCounts.positive/STORES.length)*100).toFixed(0)}% del total (${STORES.length})`}
                icon={CheckCircle}
                status={statusCounts.positive >= STORES.length * 0.7 ? 'success' : statusCounts.positive >= STORES.length * 0.5 ? 'warning' : 'danger'}
                onClick={() => setFilterStatus('positive')}
              />
              <motion.div
                animate={statusCounts.critical > 0 ? { 
                  scale: [1, 1.02, 1],
                  boxShadow: ['0 1px 3px rgba(0,0,0,0.1)', '0 4px 12px rgba(244,63,94,0.3)', '0 1px 3px rgba(0,0,0,0.1)']
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ExecutiveKPI
                  title="Tiendas en Riesgo"
                  value={statusCounts.critical + statusCounts.negative}
                  subtitle={`${statusCounts.critical} críticas · ${statusCounts.negative} en alerta`}
                  icon={AlertTriangle}
                  status={statusCounts.critical === 0 ? 'success' : statusCounts.critical <= 2 ? 'warning' : 'danger'}
                  onClick={() => setFilterStatus('critical')}
                />
              </motion.div>
            </div>
          )}

          {/* AI Insights */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card className="border-slate-100 shadow-sm mb-8 bg-gradient-to-br from-purple-50/50 to-blue-50/30">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Análisis Inteligente
                  {loadingInsights && <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {aiInsights ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-purple-600 mb-3 flex items-center gap-1">
                        🎯 Patrón Crítico
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{aiInsights.patron_critico}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1">
                        ⚡ Acciones Prioritarias
                      </p>
                      <ul className="space-y-2">
                        {aiInsights.acciones_prioritarias?.map((accion, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">{i + 1}</span>
                            <span className="flex-1">{accion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1">
                        💡 Oportunidades
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{aiInsights.oportunidades}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 animate-pulse text-purple-400" />
                    <p className="text-sm text-slate-400 font-medium">Analizando datos...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <p className="text-sm font-semibold text-slate-600 mr-2">Filtrar:</p>
            {['all', 'positive', 'negative', 'critical'].map(status => {
              const configs = {
                all: { label: 'Todas las tiendas', color: 'slate' },
                positive: { label: 'En Meta', color: 'emerald' },
                negative: { label: 'En Alerta', color: 'amber' },
                critical: { label: 'Críticas', color: 'rose' }
              };
              const config = configs[status];
              return (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 
                    `bg-${config.color}-600 hover:bg-${config.color}-700 text-white border-0 shadow-sm` :
                    `border-slate-200 hover:bg-slate-50 text-slate-700`
                  }
                >
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Charts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => <ChartSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    Comparativa: Ventas vs Presupuesto
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={90} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="ventas" fill="#ec4899" name="Ventas Reales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="presupuesto" fill="#d1d5db" name="Presupuesto" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-600" />
                    Cumplimiento por Tienda
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 150]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="cumplimiento" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cumplimiento >= 90 ? '#10b981' : entry.cumplimiento >= 70 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                    Proyecciones vs Meta
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={90} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="proyeccion" fill="#8b5cf6" name="Proyección" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="presupuesto" stroke="#ec4899" strokeWidth={3} name="Meta" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-600" />
                    Importancia de cada Punto
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={weightData}
                    dataKey="peso"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name}: ${entry.peso.toFixed(1)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {weightData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </div>
          )}

          {/* Stores at Risk - Prioridad Visual */}
          {!isLoading && salesForecast.filter(s => s.willMissTarget).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="border-2 border-rose-300 shadow-xl mb-8 bg-gradient-to-br from-rose-50 to-red-50">
                <CardHeader className="border-b-2 border-rose-200 bg-rose-100/50">
                  <CardTitle className="text-lg font-black text-rose-800 flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </motion.div>
                    🚨 Tiendas en Riesgo de Incumplimiento - Acción Requerida
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesForecast.filter(s => s.willMissTarget).map((store, idx) => (
                  <motion.div
                    key={store.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl p-4 border-2 border-rose-200 shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-gray-800">{store.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-rose-200 text-rose-700 rounded-full font-bold">
                        {store.growthRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proyección 30d:</span>
                        <span className="font-bold text-rose-600">{formatCurrency(store.forecast30)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meta próx. mes:</span>
                        <span className="font-bold text-gray-700">{formatCurrency(store.nextMonthBudget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gap:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(store.nextMonthBudget - store.forecast30)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-rose-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-red-500"
                        style={{ width: `${Math.min(100, (store.forecast30 / store.nextMonthBudget) * 100)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            </Card>
          )}

          {/* Detail Table */}
          {!isLoading && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-600" />
                  Detalle Completo por Tienda
                </CardTitle>
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-3 font-bold text-gray-700">Tienda</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">Ventas</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">Meta</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">% Cumpl.</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">Ticket</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">Trans.</th>
                    <th className="text-right py-3 px-3 font-bold text-gray-700">Proyección</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store, idx) => (
                    <motion.tr
                      key={store.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-gray-100 hover:bg-pink-50/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-gray-800">{store.name}</td>
                      <td className="py-3 px-3 text-right font-medium">{formatCurrency(store.totalSales)}</td>
                      <td className="py-3 px-3 text-right text-gray-500">{formatCurrency(store.salesBudget)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-black ${
                          store.salesCompliance >= 90 ? 'text-emerald-600' : 
                          store.salesCompliance >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {store.salesCompliance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">{formatCurrency(store.avgTicket)}</td>
                      <td className="py-3 px-3 text-right">{store.totalTransactions.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-violet-600 font-bold">
                        {formatCurrency(store.projection)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {store.status === 'positive' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" /> Meta
                          </span>
                        )}
                        {store.status === 'negative' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> Riesgo
                          </span>
                        )}
                        {store.status === 'critical' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                            <TrendingDown className="w-3 h-3" /> Crítico
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
        </div>
      </div>
    </div>
  );
}