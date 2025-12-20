import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Receipt, Zap, Target, Users, Clock, Calendar, Filter,
  Brain, Activity, Sparkles, UserCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#8b5cf6', '#a78bfa'];

export default function ExecutiveDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('all'); // all, negative, critical, positive
  const [forecastDays, setForecastDays] = useState(30);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const currentMonth = selectedMonth.getMonth() + 1;
  const currentYear = selectedMonth.getFullYear();

  // Fetch data
  const { data: allDailySales = [] } = useQuery({
    queryKey: ['allDailySales'],
    queryFn: () => base44.entities.DailySales.list()
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['allBudgets'],
    queryFn: () => base44.entities.Budget.list()
  });

  const { data: allShifts = [] } = useQuery({
    queryKey: ['allShifts'],
    queryFn: () => base44.entities.Shift.list()
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
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= monthStart && d <= monthEnd;
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

      // Proyección
      const daysElapsed = Math.max(1, Math.floor((new Date() - monthStart) / (1000 * 60 * 60 * 24)));
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const dailyAvg = totalSales / daysElapsed;
      const projection = dailyAvg * daysInMonth;
      const projectionCompliance = salesBudget > 0 ? (projection / salesBudget) * 100 : 0;

      // Status
      let status = 'positive';
      if (salesCompliance < 70 || projectionCompliance < 85) status = 'critical';
      else if (salesCompliance < 90 || projectionCompliance < 95) status = 'negative';

      // Peso (% del presupuesto total de la zona)
      const totalZoneBudget = allBudgets
        .filter(b => b.month === currentMonth && b.year === currentYear)
        .reduce((sum, b) => sum + (b.sales_budget || 0), 0);
      const weight = totalZoneBudget > 0 ? (salesBudget / totalZoneBudget) * 100 : 0;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales,
        totalTickets,
        totalTransactions,
        avgTicket,
        salesBudget,
        ticketsBudget,
        transactionsBudget,
        salesCompliance,
        ticketsCompliance,
        transactionsCompliance,
        projection,
        projectionCompliance,
        status,
        weight,
        daysElapsed,
        dailyAvg
      };
    });
  }, [allDailySales, allBudgets, monthStart, monthEnd, currentMonth, currentYear]);

  // Filtrar tiendas según status
  const filteredStores = useMemo(() => {
    if (filterStatus === 'all') return storesAnalysis;
    return storesAnalysis.filter(s => s.status === filterStatus);
  }, [storesAnalysis, filterStatus]);

  // Leaders Schedule
  const leadersSchedule = useMemo(() => {
    const leaders = allCashiers.filter(c => c.position === 'lider' && c.is_active !== false);
    
    return leaders.map(leader => {
      const leaderShifts = allShifts.filter(s => {
        try {
          const d = new Date(s.date);
          return s.cashier_id === leader.id && !isNaN(d.getTime()) && d >= monthStart && d <= new Date();
        } catch {
          return false;
        }
      });

      // Contar turnos por día de la semana
      const weekdayCount = [0, 0, 0, 0, 0, 0, 0];
      leaderShifts.forEach(shift => {
        try {
          const day = new Date(shift.date).getDay();
          weekdayCount[day]++;
        } catch {}
      });

      return {
        name: leader.name,
        store: getDisplayName(leader.store_id),
        storeId: leader.store_id,
        totalShifts: leaderShifts.length,
        weekdayCount,
        avgHoursPerWeek: leaderShifts.length > 0 ? (leaderShifts.length * 8) / 4 : 0 // Estimado
      };
    });
  }, [allCashiers, allShifts, monthStart]);

  // Comparación de tiendas
  const comparisonData = useMemo(() => {
    return storesAnalysis.map(s => ({
      name: s.name,
      ventas: s.totalSales,
      presupuesto: s.salesBudget,
      cumplimiento: s.salesCompliance,
      proyeccion: s.projection
    }));
  }, [storesAnalysis]);

  // Peso de cada tienda
  const weightData = useMemo(() => {
    return storesAnalysis
      .sort((a, b) => b.weight - a.weight)
      .map(s => ({
        name: s.name,
        peso: s.weight,
        presupuesto: s.salesBudget
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

  // Predictive Analytics - Sales Forecast
  const salesForecast = useMemo(() => {
    return storesAnalysis.map(store => {
      // Simple linear regression for forecast
      const historicalSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime());
        } catch {
          return false;
        }
      }).slice(-90); // Last 90 days

      if (historicalSales.length < 7) return { ...store, forecast30: 0, forecast60: 0, willMissTarget: false };

      // Calculate daily average and trend
      const totalSales = historicalSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const dailyAvg = totalSales / historicalSales.length;
      
      // Calculate trend (compare first half vs second half)
      const midPoint = Math.floor(historicalSales.length / 2);
      const firstHalfAvg = historicalSales.slice(0, midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) / midPoint;
      const secondHalfAvg = historicalSales.slice(midPoint).reduce((sum, s) => sum + (s.total_sales || 0), 0) / (historicalSales.length - midPoint);
      const growthRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;

      // Forecast with trend adjustment
      const trendAdjustedDaily = dailyAvg * (1 + growthRate * 0.5);
      const forecast30 = trendAdjustedDaily * 30;
      const forecast60 = trendAdjustedDaily * 60;

      // Predict if will miss target (using next month's budget)
      const nextMonthBudget = allBudgets.find(b => 
        b.store_id === store.code && 
        b.month === (currentMonth % 12) + 1 && 
        b.year === currentYear
      );
      const willMissTarget = nextMonthBudget ? forecast30 < nextMonthBudget.sales_budget * 0.85 : false;

      return { 
        ...store, 
        forecast30, 
        forecast60, 
        growthRate: growthRate * 100,
        willMissTarget,
        nextMonthBudget: nextMonthBudget?.sales_budget || 0
      };
    });
  }, [storesAnalysis, allDailySales, allBudgets, currentMonth, currentYear]);

  // Staffing Predictions
  const staffingPredictions = useMemo(() => {
    return STORES.map(store => {
      const storeShifts = allShifts.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= subMonths(new Date(), 2);
        } catch {
          return false;
        }
      });

      const storeCashiers = allCashiers.filter(c => c.store_id === store.code && c.is_active !== false);
      const leaders = storeCashiers.filter(c => c.position === 'lider');
      
      // Calculate average shifts per week
      const weeksOfData = 8;
      const avgShiftsPerWeek = storeShifts.length / weeksOfData;
      const avgCashiersNeeded = Math.ceil(avgShiftsPerWeek / 5); // Assuming 5 shifts per cashier per week

      // Predict if understaffed
      const isUnderstaffed = storeCashiers.length < avgCashiersNeeded;
      const needsMoreStaff = isUnderstaffed ? avgCashiersNeeded - storeCashiers.length : 0;

      // Leader coverage
      const leaderShifts = storeShifts.filter(s => {
        const cashier = allCashiers.find(c => c.id === s.cashier_id);
        return cashier?.position === 'lider';
      });
      const leaderCoveragePercent = storeShifts.length > 0 ? (leaderShifts.length / storeShifts.length) * 100 : 0;

      return {
        storeCode: store.code,
        storeName: getDisplayName(store.code),
        currentStaff: storeCashiers.length,
        leaders: leaders.length,
        avgShiftsPerWeek,
        recommendedStaff: avgCashiersNeeded,
        needsMoreStaff,
        isUnderstaffed,
        leaderCoveragePercent
      };
    });
  }, [allShifts, allCashiers]);

  // Generate AI Insights
  const generateAIInsights = async () => {
    if (loadingInsights) return;
    setLoadingInsights(true);

    try {
      const storesAtRisk = salesForecast.filter(s => s.willMissTarget).slice(0, 5);
      const understaffedStores = staffingPredictions.filter(s => s.isUnderstaffed).slice(0, 5);

      const prompt = `Analiza esta situación de la zona de Popsy y genera insights accionables:

TIENDAS EN RIESGO DE NO CUMPLIR META:
${storesAtRisk.map(s => `- ${s.name}: Proyección $${(s.forecast30/1000000).toFixed(1)}M vs Meta $${(s.nextMonthBudget/1000000).toFixed(1)}M (Crecimiento: ${s.growthRate.toFixed(1)}%)`).join('\n')}

TIENDAS CON DÉFICIT DE PERSONAL:
${understaffedStores.map(s => `- ${s.storeName}: ${s.currentStaff} actuales vs ${s.recommendedStaff} recomendados (${s.leaders} líderes)`).join('\n')}

INSTRUCCIONES:
1. Identifica patrones críticos
2. Sugiere 3 acciones prioritarias específicas
3. Identifica oportunidades de mejora
4. Sé directo y accionable (máximo 120 palabras)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            patron_critico: { type: "string", description: "Patrón crítico identificado" },
            acciones_prioritarias: { type: "array", items: { type: "string" }, description: "3 acciones específicas" },
            oportunidades: { type: "string", description: "Oportunidades de mejora" }
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
                Dashboard Ejecutivo
              </h1>
              <p className="text-sm text-gray-500">Análisis comparativo y proyecciones</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={format(selectedMonth, 'yyyy-MM')} onValueChange={(v) => setSelectedMonth(new Date(v))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map(i => {
                  const month = subMonths(new Date(), i);
                  return (
                    <SelectItem key={i} value={format(month, 'yyyy-MM')}>
                      {format(month, 'MMMM yyyy', { locale: es })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={forecastDays.toString()} onValueChange={(v) => setForecastDays(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer"
            onClick={() => setFilterStatus('positive')}
          >
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="text-3xl font-black">{statusCounts.positive}</p>
            <p className="text-sm opacity-90">Tiendas en meta</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer"
            onClick={() => setFilterStatus('negative')}
          >
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-3xl font-black">{statusCounts.negative}</p>
            <p className="text-sm opacity-90">Tiendas en riesgo</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer"
            onClick={() => setFilterStatus('critical')}
          >
            <TrendingDown className="w-8 h-8 mb-2" />
            <p className="text-3xl font-black">{statusCounts.critical}</p>
            <p className="text-sm opacity-90">Tiendas críticas</p>
          </motion.div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-pink-500 text-white' : ''}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('critical')}
            className={filterStatus === 'critical' ? 'bg-rose-500 text-white' : ''}
          >
            Críticas
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'negative' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('negative')}
            className={filterStatus === 'negative' ? 'bg-amber-500 text-white' : ''}
          >
            En Riesgo
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'positive' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('positive')}
            className={filterStatus === 'positive' ? 'bg-emerald-500 text-white' : ''}
          >
            En Meta
          </Button>
        </div>

        {/* AI Insights */}
        <Card className="border-0 shadow-xl mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-purple-600 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Análisis Predictivo con IA
              {loadingInsights && <Sparkles className="w-4 h-4 animate-pulse" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiInsights ? (
              <div className="space-y-4">
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-purple-600 mb-2">🎯 Patrón Crítico Detectado</p>
                  <p className="text-sm text-gray-700">{aiInsights.patron_critico}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-pink-600 mb-2">⚡ Acciones Prioritarias</p>
                  <ul className="space-y-1">
                    {aiInsights.acciones_prioritarias?.map((accion, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-pink-500 font-bold">{i + 1}.</span>
                        {accion}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-600 mb-2">💡 Oportunidades</p>
                  <p className="text-sm text-gray-700">{aiInsights.oportunidades}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Generando insights...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Predictive Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Sales Forecast */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Pronóstico de Ventas ({forecastDays} días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={salesForecast.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey={forecastDays === 30 ? 'forecast30' : 'forecast60'} fill="#8b5cf6" name="Proyección" />
                  <Line type="monotone" dataKey="nextMonthBudget" stroke="#ec4899" strokeWidth={2} name="Meta Próx. Mes" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stores at Risk */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Tiendas en Riesgo de Incumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {salesForecast.filter(s => s.willMissTarget).slice(0, 8).map((store, idx) => (
                  <motion.div
                    key={store.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-r from-rose-50 to-red-50 rounded-lg p-3 border border-rose-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-gray-800">{store.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-rose-200 text-rose-700 rounded-full font-bold">
                        {store.growthRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Proyección:</span>
                      <span className="font-bold text-rose-600">{formatCurrency(store.forecast30)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Meta próx. mes:</span>
                      <span className="font-bold text-gray-700">{formatCurrency(store.nextMonthBudget)}</span>
                    </div>
                    <div className="mt-2 h-1 bg-rose-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500"
                        style={{ width: `${Math.min(100, (store.forecast30 / store.nextMonthBudget) * 100)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
                {salesForecast.filter(s => s.willMissTarget).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-sm">Todas las tiendas en buen camino</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staffing Predictions */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-violet-600 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Predicción de Necesidades de Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffingPredictions.filter(s => s.isUnderstaffed || s.leaderCoveragePercent < 30).map((store, idx) => (
                <motion.div
                  key={store.storeCode}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl p-4 border ${
                    store.isUnderstaffed 
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' 
                      : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm text-gray-800">{store.storeName}</p>
                    {store.isUnderstaffed && (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Personal actual:</span>
                      <span className="font-bold text-gray-800">{store.currentStaff}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Recomendado:</span>
                      <span className="font-bold text-violet-600">{store.recommendedStaff}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Líderes:</span>
                      <span className="font-bold text-purple-600">{store.leaders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cobertura líder:</span>
                      <span className={`font-bold ${store.leaderCoveragePercent >= 30 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {store.leaderCoveragePercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {store.isUnderstaffed && (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <p className="text-xs text-amber-700 font-medium">
                        💡 Contratar {store.needsMoreStaff} persona{store.needsMoreStaff > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Comparación Ventas vs Presupuesto */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ventas vs Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="ventas" fill="#ec4899" name="Ventas" />
                  <Bar dataKey="presupuesto" fill="#d1d5db" name="Presupuesto" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cumplimiento por tienda */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Cumplimiento (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 150]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
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

          {/* Proyecciones */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Proyecciones vs Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="proyeccion" fill="#8b5cf6" name="Proyección" />
                  <Line type="monotone" dataKey="presupuesto" stroke="#ec4899" strokeWidth={2} name="Meta" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peso de cada tienda */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Peso de cada punto (% Presupuesto Zona)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={weightData}
                    dataKey="peso"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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

        {/* Horarios de Líderes */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Horarios de Líderes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadersSchedule.map((leader, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {leader.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{leader.name}</p>
                      <p className="text-xs text-gray-500">{leader.store}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Total turnos:</span>
                      <span className="font-bold text-violet-600">{leader.totalShifts}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Horas/sem aprox:</span>
                      <span className="font-bold text-violet-600">{Math.round(leader.avgHoursPerWeek)}h</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-violet-200">
                    <p className="text-[10px] text-gray-500 mb-1">Turnos por día:</p>
                    <div className="flex gap-1">
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                        <div 
                          key={i} 
                          className={`w-6 h-6 rounded text-[9px] flex items-center justify-center font-bold ${
                            leader.weekdayCount[i] > 0 ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {leadersSchedule.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay líderes registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Store Details Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-pink-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Detalle por Tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-bold text-gray-700">Tienda</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">Ventas</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">Presupuesto</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">%</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">Ticket</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">Trans.</th>
                    <th className="text-right py-3 px-2 font-bold text-gray-700">Proyección</th>
                    <th className="text-center py-3 px-2 font-bold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store, idx) => (
                    <motion.tr
                      key={store.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-gray-100 hover:bg-pink-50/50"
                    >
                      <td className="py-2 px-2 font-medium text-gray-800">{store.name}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(store.totalSales)}</td>
                      <td className="py-2 px-2 text-right text-gray-500">{formatCurrency(store.salesBudget)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-bold ${
                          store.salesCompliance >= 90 ? 'text-emerald-600' : 
                          store.salesCompliance >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {store.salesCompliance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">{formatCurrency(store.avgTicket)}</td>
                      <td className="py-2 px-2 text-right">{store.totalTransactions.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-violet-600 font-medium">
                        {formatCurrency(store.projection)}
                      </td>
                      <td className="py-2 px-2 text-center">
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
      </div>
    </div>
  );
}