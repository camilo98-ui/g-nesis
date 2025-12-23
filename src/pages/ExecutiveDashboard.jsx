import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Target, Brain, Sparkles, BarChart3, X,
  Store, Activity, Clock, Menu, Zap, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ExecutiveDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const activeRange = dateRange;
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

      const salesCompliance = salesBudget > 0 && !isNaN(totalSales) ? (totalSales / salesBudget) * 100 : 0;

      const daysElapsed = Math.max(1, storeSales.length);
      const daysInPeriod = Math.max(1, Math.ceil((activeRange.to - activeRange.from) / (1000 * 60 * 60 * 24)));
      const dailyAvg = daysElapsed > 0 && !isNaN(totalSales) ? totalSales / daysElapsed : 0;
      const projection = !isNaN(dailyAvg) && !isNaN(daysInPeriod) ? dailyAvg * daysInPeriod : 0;

      let status = 'positive';
      if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales, totalTickets, totalTransactions, avgTicket,
        salesBudget, salesCompliance, projection, status, daysElapsed, dailyAvg, daysInPeriod
      };
    });
  }, [allDailySales, allBudgets, activeRange, currentMonth, currentYear]);

  const zoneTotals = useMemo(() => {
    const totalSales = storesAnalysis.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesAnalysis.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesAnalysis.reduce((sum, s) => sum + s.projection, 0);
    return { totalSales, totalBudget, totalProjection };
  }, [storesAnalysis]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const statusCounts = useMemo(() => ({
    positive: storesAnalysis.filter(s => s.status === 'positive').length,
    negative: storesAnalysis.filter(s => s.status === 'negative').length,
    critical: storesAnalysis.filter(s => s.status === 'critical').length
  }), [storesAnalysis]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return storesAnalysis;
    return storesAnalysis.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [storesAnalysis, searchQuery]);

  // Generate AI Insights
  const generateAIInsights = async () => {
    if (loadingInsights || aiInsights) return;
    setLoadingInsights(true);

    try {
      const topStores = storesAnalysis.sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 3);
      const bottomStores = storesAnalysis.sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 3);

      const prompt = `Analiza esta situación de la zona de Popsy y genera UN ÚNICO insight accionable de máximo 40 palabras:

TOP 3: ${topStores.map(s => `${s.name} ${s.salesCompliance.toFixed(0)}%`).join(', ')}
BOTTOM 3: ${bottomStores.map(s => `${s.name} ${s.salesCompliance.toFixed(0)}%`).join(', ')}
ZONA: ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}% cumplimiento

Dame 1 frase sobre qué hacer HOY para mejorar el resultado de la zona.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            accion_hoy: { type: "string" }
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

  return (
    <div className="min-h-screen bg-white flex">
      {/* Minimal Sidebar */}
      <motion.aside
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full bg-slate-900 z-40 shadow-2xl"
        style={{ width: '80px' }}
      >
        <div className="p-4 flex flex-col items-center h-full">
          <Link to={createPageUrl('Home')}>
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-8 cursor-pointer shadow-lg"
            >
              <Store className="w-6 h-6 text-white" />
            </motion.div>
          </Link>

          <div className="flex-1 flex flex-col gap-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center cursor-pointer"
            >
              <Activity className="w-6 h-6 text-pink-400" />
            </motion.div>
          </div>

          <Link to={createPageUrl('Home')}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-xl hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </motion.div>
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 ml-[80px]">
        <div className="max-w-[1600px] mx-auto p-8">
          {/* 1️⃣ BARRA SUPERIOR */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">Panel Ejecutivo</h1>
              <p className="text-sm text-slate-500">
                Zona Bogotá Noroccidente • {format(new Date(), 'EEEE, dd MMMM', { locale: es })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar tienda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm w-64"
                />
              </div>
              <DateFilter 
                dateRange={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-4 gap-4 mb-12">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-slate-100 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* 2️⃣ BLOQUE: RESUMEN EJECUTIVO (4 KPIs) */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Venta Total */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-pink-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">💰 Venta Total</p>
                      <p className="text-4xl font-black text-slate-900 mb-1">
                        {formatCurrency(zoneTotals.totalSales)}
                      </p>
                      <p className="text-xs text-slate-500">Meta: {formatCurrency(zoneTotals.totalBudget)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((zoneTotals.totalSales/zoneTotals.totalBudget)*100, 100)}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.9 ? 'bg-emerald-500' :
                        (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.7 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </motion.div>

                {/* % Cumplimiento */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white rounded-2xl p-6 border-2 border-slate-200"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">📊 % Cumplimiento</p>
                  <p className={`text-6xl font-black mb-1 ${
                    ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-600' :
                    ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500">de la zona</p>
                </motion.div>

                {/* Críticas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 border-2 border-slate-200"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">🔴 Críticas</p>
                  <p className="text-6xl font-black text-red-600 mb-1">
                    {statusCounts.critical}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                  </p>
                </motion.div>

                {/* En Meta */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl p-6 border-2 border-slate-200"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">🟢 En Meta</p>
                  <p className="text-6xl font-black text-emerald-600 mb-1">
                    {statusCounts.positive}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                  </p>
                </motion.div>
              </div>

              {/* 3️⃣ BLOQUE: ALERTA GERENCIAL */}
              {statusCounts.critical > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className={`rounded-2xl p-8 ${
                    statusCounts.critical >= STORES.length * 0.7 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-600'
                  } text-white shadow-xl`}>
                    <div className="flex items-start gap-6">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-5xl"
                      >
                        {statusCounts.critical >= STORES.length * 0.7 ? '🚨' : '⚠️'}
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-black mb-3">
                          {statusCounts.critical} de {STORES.length} tiendas en estado crítico
                        </h2>
                        <p className="text-white/90 text-lg mb-5 font-medium">
                          {statusCounts.critical >= STORES.length * 0.7 
                            ? 'Acción inmediata requerida. La mayoría de la zona requiere intervención.'
                            : 'Requiere atención urgente para alcanzar meta mensual.'
                          }
                        </p>
                        <p className="text-white/80 text-sm">
                          Cumplimiento inferior al 70%. Scroll abajo para ver qué tiendas actuar primero.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4️⃣ BLOQUE: TABLA MAESTRA DE TIENDAS */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-slate-900">Tiendas de la Zona</h2>
                  <p className="text-sm text-slate-500">{filteredStores.length} puntos</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <th className="text-left py-5 px-6 text-sm font-black text-slate-700 uppercase">Tienda</th>
                        <th className="text-right py-5 px-6 text-sm font-black text-slate-700 uppercase">% Cumplimiento</th>
                        <th className="text-right py-5 px-6 text-sm font-black text-slate-700 uppercase hidden md:table-cell">Venta</th>
                        <th className="text-right py-5 px-6 text-sm font-black text-slate-700 uppercase hidden lg:table-cell">Meta</th>
                        <th className="text-right py-5 px-6 text-sm font-black text-slate-700 uppercase hidden xl:table-cell">Brecha $</th>
                        <th className="text-center py-5 px-6 text-sm font-black text-slate-700 uppercase">Estado</th>
                        <th className="text-left py-5 px-6 text-sm font-black text-slate-700 uppercase hidden 2xl:table-cell">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores
                        .sort((a, b) => {
                          const statusOrder = { critical: 0, negative: 1, positive: 2 };
                          return statusOrder[a.status] - statusOrder[b.status];
                        })
                        .map((store, idx) => {
                          const gap = store.salesBudget - store.totalSales;
                          const action = 
                            store.salesCompliance < 70 ? 'Intervenir hoy' 
                            : store.salesCompliance < 90 ? 'Acelerar ritmo' 
                            : 'Mantener';

                          return (
                            <motion.tr
                              key={store.code}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.02 }}
                              whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                              className="border-b border-slate-100 cursor-pointer group"
                            >
                              <td className="py-5 px-6">
                                <p className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">{store.name}</p>
                                <p className="text-xs text-slate-400">{store.code}</p>
                              </td>
                              <td className="py-5 px-6">
                                <div className="flex items-center justify-end gap-4">
                                  <div className="w-24 bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.03 }}
                                      className={`h-full ${
                                        store.salesCompliance >= 90 ? 'bg-emerald-500' :
                                        store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                  <span className={`font-black text-xl ${
                                    store.salesCompliance >= 90 ? 'text-emerald-600' :
                                    store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {store.salesCompliance.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 px-6 text-right font-bold text-slate-900 hidden md:table-cell">
                                {formatCurrency(store.totalSales)}
                              </td>
                              <td className="py-5 px-6 text-right text-slate-500 hidden lg:table-cell">
                                {formatCurrency(store.salesBudget)}
                              </td>
                              <td className={`py-5 px-6 text-right font-bold hidden xl:table-cell ${
                                gap > 0 ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {gap > 0 ? '-' : '+'}{formatCurrency(Math.abs(gap))}
                              </td>
                              <td className="py-5 px-6 text-center">
                                <span className={`inline-flex px-4 py-2 rounded-full text-xs font-black ${
                                  store.status === 'positive' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : store.status === 'negative'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {store.status === 'positive' ? '🟢' : store.status === 'negative' ? '🟡' : '🔴'}
                                </span>
                              </td>
                              <td className="py-5 px-6 font-semibold text-slate-700 hidden 2xl:table-cell">
                                {action}
                              </td>
                            </motion.tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5️⃣ BLOQUE: ACCIONES PRIORITARIAS */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 mb-5">¿Qué hacer hoy?</h2>
                <div className="grid grid-cols-3 gap-6">
                  {/* Intervenir */}
                  {storesAnalysis.filter(s => s.status === 'critical').slice(0, 1).map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-red-600 uppercase">🔴 Intervenir</p>
                          <p className="font-black text-slate-900 text-lg">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-4 font-medium">
                        {store.salesCompliance.toFixed(0)}% cumplimiento
                      </p>
                      <p className="text-xs text-slate-600">
                        Requiere atención inmediata
                      </p>
                    </motion.div>
                  ))}

                  {/* Acelerar */}
                  {storesAnalysis.filter(s => s.status === 'negative' && s.salesCompliance >= 80).slice(0, 1).map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
                          <Zap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-600 uppercase">⚡ Acelerar</p>
                          <p className="font-black text-slate-900 text-lg">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-4 font-medium">
                        {store.salesCompliance.toFixed(0)}% cumplimiento
                      </p>
                      <p className="text-xs text-slate-600">
                        Oportunidad de cierre rápido
                      </p>
                    </motion.div>
                  ))}

                  {/* Reconocer */}
                  {storesAnalysis.filter(s => s.status === 'positive' && s.salesCompliance >= 110).slice(0, 1).map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-600 uppercase">🏆 Reconocer</p>
                          <p className="font-black text-slate-900 text-lg">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-4 font-medium">
                        {store.salesCompliance.toFixed(0)}% cumplimiento
                      </p>
                      <p className="text-xs text-slate-600">
                        +{(store.salesCompliance - 100).toFixed(0)}% sobre meta
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 6️⃣ BLOQUE: INSIGHTS (Colapsable) */}
              {aiInsights?.accion_hoy && (
                <details className="group mb-8" open={showInsights}>
                  <summary className="cursor-pointer list-none" onClick={(e) => {e.preventDefault(); setShowInsights(!showInsights);}}>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200 hover:border-purple-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="font-black text-slate-900">Insight IA</p>
                            <p className="text-xs text-slate-600">Análisis predictivo</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: showInsights ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        </motion.div>
                      </div>
                    </div>
                  </summary>

                  {showInsights && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 bg-white rounded-2xl p-6 border-2 border-slate-200"
                    >
                      <div className="flex items-start gap-4">
                        <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-purple-900 mb-2">Acción Recomendada Hoy</p>
                          <p className="text-base text-slate-700 leading-relaxed">{aiInsights.accion_hoy}</p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Proyección</p>
                          <p className="text-xl font-black text-slate-900">{formatCurrency(zoneTotals.totalProjection)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">% Proyectado</p>
                          <p className={`text-xl font-black ${
                            ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-600' :
                            ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Gap</p>
                          <p className={`text-xl font-black ${
                            (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}