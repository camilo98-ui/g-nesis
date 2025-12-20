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
  DollarSign, Receipt, Zap, Target, Filter, Brain, Sparkles, BarChart3, X
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

const SummaryCard = ({ title, value, subtitle, icon: Icon, color, onClick, trend }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`cursor-pointer bg-gradient-to-br ${color} rounded-2xl p-6 shadow-xl relative overflow-hidden`}
  >
    <motion.div
      className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8 text-white/90" />
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-sm font-bold ${trend >= 0 ? 'text-white/80' : 'text-white/70'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-white/70 text-xs font-medium mb-1">{title}</p>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-white/60 text-xs">{subtitle}</p>
    </div>
  </motion.div>
);

export default function ExecutiveDashboard() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [weekFilter, setWeekFilter] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const activeRange = weekFilter || dateRange;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['allDailySales'],
    queryFn: () => base44.entities.DailySales.list()
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['allBudgets'],
    queryFn: () => base44.entities.Budget.list()
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.list()
  });

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
    return storesAnalysis.map(s => ({
      name: s.name, ventas: s.totalSales, presupuesto: s.salesBudget,
      cumplimiento: s.salesCompliance, proyeccion: s.projection,
      ticket: s.avgTicket, transacciones: s.totalTransactions
    }));
  }, [storesAnalysis]);

  const weightData = useMemo(() => {
    return storesAnalysis.sort((a, b) => b.weight - a.weight).map(s => ({
      name: s.name, peso: s.weight, presupuesto: s.salesBudget
    }));
  }, [storesAnalysis]);

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
    const totalSales = storesAnalysis.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesAnalysis.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesAnalysis.reduce((sum, s) => sum + s.projection, 0);
    return { totalSales, totalBudget, totalProjection };
  }, [storesAnalysis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                Panel Ejecutivo
              </h1>
              <p className="text-sm text-gray-500">Análisis y proyecciones</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <WeekFilter onWeekChange={setWeekFilter} />
            <DateFilter onDateChange={(range) => { setDateRange(range); setWeekFilter(null); }} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Venta Total"
            value={`$${(zoneTotals.totalSales/1000000).toFixed(1)}M`}
            subtitle={`Meta: $${(zoneTotals.totalBudget/1000000).toFixed(1)}M`}
            icon={DollarSign}
            color="from-pink-500 to-rose-600"
            onClick={() => setSelectedCard('sales')}
          />
          <SummaryCard
            title="Proyección"
            value={`$${(zoneTotals.totalProjection/1000000).toFixed(1)}M`}
            subtitle="Final del período"
            icon={Target}
            color="from-violet-500 to-purple-600"
            onClick={() => setSelectedCard('projection')}
          />
          <SummaryCard
            title="En Meta"
            value={statusCounts.positive}
            subtitle={`${STORES.length} tiendas totales`}
            icon={CheckCircle}
            color="from-emerald-500 to-green-600"
            onClick={() => setFilterStatus('positive')}
          />
          <SummaryCard
            title="En Riesgo"
            value={statusCounts.critical + statusCounts.negative}
            subtitle="Requieren atención"
            icon={AlertTriangle}
            color="from-amber-500 to-orange-600"
            onClick={() => setFilterStatus('critical')}
          />
        </div>

        {/* AI Insights */}
        <Card className="border-0 shadow-xl mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-purple-600 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Análisis Inteligente
              {loadingInsights && <Sparkles className="w-4 h-4 animate-pulse" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1">
                    🎯 Patrón Crítico
                  </p>
                  <p className="text-sm text-gray-700">{aiInsights.patron_critico}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-pink-600 mb-2 flex items-center gap-1">
                    ⚡ Acciones Prioritarias
                  </p>
                  <ul className="space-y-1">
                    {aiInsights.acciones_prioritarias?.map((accion, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="text-pink-500 font-bold">{i + 1}.</span>
                        <span>{accion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                    💡 Oportunidades
                  </p>
                  <p className="text-sm text-gray-700">{aiInsights.oportunidades}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse text-purple-400" />
                <p className="text-sm text-gray-400">Analizando datos...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {['all', 'critical', 'negative', 'positive'].map(status => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? 
                status === 'all' ? 'bg-pink-500 text-white' :
                status === 'critical' ? 'bg-rose-500 text-white' :
                status === 'negative' ? 'bg-amber-500 text-white' :
                'bg-emerald-500 text-white' : ''
              }
            >
              {status === 'all' ? 'Todas' : status === 'critical' ? 'Críticas' : status === 'negative' ? 'En Riesgo' : 'En Meta'}
            </Button>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
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

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
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

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
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

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
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

        {/* Stores at Risk */}
        {salesForecast.filter(s => s.willMissTarget).length > 0 && (
          <Card className="border-0 shadow-xl mb-6 bg-gradient-to-br from-rose-50 to-red-50">
            <CardHeader>
              <CardTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ⚠️ Tiendas en Riesgo de Incumplimiento
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
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Detalle Completo
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
  );
}