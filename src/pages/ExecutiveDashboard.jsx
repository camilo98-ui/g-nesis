import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { 
  ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Target, 
  Store, Menu, Search, Brain, Sparkles, ChevronDown, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreDetailModal from '../components/executive/StoreDetailModal';

export default function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Data fetching
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
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= dateRange.from && d <= dateRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTickets = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0));
      const totalTransactions = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = Math.max(0, budget?.sales_budget || 0);

      const salesCompliance = salesBudget > 0 ? (totalSales / salesBudget) * 100 : 0;

      let status = 'positive';
      if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      const gap = salesBudget - totalSales;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales,
        totalTickets,
        totalTransactions,
        salesBudget,
        salesCompliance,
        status,
        gap
      };
    });
  }, [allDailySales, allBudgets, dateRange, currentMonth, currentYear]);

  // Totales
  const zoneTotals = useMemo(() => {
    const totalSales = storesAnalysis.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesAnalysis.reduce((sum, s) => sum + s.salesBudget, 0);
    return { totalSales, totalBudget };
  }, [storesAnalysis]);

  const statusCounts = useMemo(() => ({
    positive: storesAnalysis.filter(s => s.status === 'positive').length,
    negative: storesAnalysis.filter(s => s.status === 'negative').length,
    critical: storesAnalysis.filter(s => s.status === 'critical').length
  }), [storesAnalysis]);

  // Filtrar por búsqueda
  const filteredStores = useMemo(() => {
    if (!searchQuery) return storesAnalysis;
    return storesAnalysis.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [storesAnalysis, searchQuery]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  // AI Insights
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const generateAIInsights = async () => {
    if (loadingInsights || aiInsights) return;
    setLoadingInsights(true);

    try {
      const topStores = storesAnalysis.sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 3);
      const bottomStores = storesAnalysis.sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 3);

      const prompt = `Eres un consultor estratégico de retail. Analiza estos datos de Popsy:

TOP 3 TIENDAS:
${topStores.map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% cumplimiento`).join('\n')}

BOTTOM 3 TIENDAS:
${bottomStores.map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% cumplimiento`).join('\n')}

Genera UN SOLO insight accionable tipo:
"Si Plaza Imperial aumenta ticket promedio 8%, la zona mejora +3% en cumplimiento."

Sé específico, usa nombres de tiendas reales, porcentajes claros. Máximo 40 palabras.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insight: { type: "string" }
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
    if (storesAnalysis.length > 0 && !aiInsights) {
      generateAIInsights();
    }
  }, [storesAnalysis.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 shadow-2xl lg:hidden"
            >
              <div className="p-6">
                <Link to={createPageUrl('Home')}>
                  <Button variant="outline" className="w-full mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto">
        {/* 1️⃣ BARRA SUPERIOR - CONTEXTO CLARO */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Zona/Región */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <Link to={createPageUrl('Home')} className="hidden lg:block">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl lg:text-2xl font-black text-slate-900">Bogotá Noroccidente</h1>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Right: Filtros */}
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar tienda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px] lg:w-[240px] h-9 text-sm"
                  />
                </div>
                <DateFilter 
                  dateRange={dateRange} 
                  onDateChange={setDateRange} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
          {/* 2️⃣ BLOQUE: RESUMEN EJECUTIVO - 4 KPIs */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                  <div className="h-10 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 💰 Venta Total vs Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Venta Total</p>
                    <p className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">
                      {formatCurrency(zoneTotals.totalSales)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Meta: {formatCurrency(zoneTotals.totalBudget)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 lg:w-10 lg:h-10 text-slate-300" />
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((zoneTotals.totalSales/zoneTotals.totalBudget)*100), 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.9 ? 'bg-emerald-500' :
                      (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.7 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </motion.div>

              {/* 📊 % Cumplimiento Zona */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">% Cumplimiento</p>
                    <p className={`text-4xl lg:text-5xl font-black ${
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-600' :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 lg:w-10 lg:h-10 text-slate-300" />
                </div>
              </motion.div>

              {/* 🔴 Tiendas Críticas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Críticas</p>
                    <p className="text-4xl lg:text-5xl font-black text-red-600">
                      {statusCounts.critical}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 lg:w-10 lg:h-10 text-red-500" />
                </div>
              </motion.div>

              {/* 🟢 Tiendas en Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">En Meta</p>
                    <p className="text-4xl lg:text-5xl font-black text-emerald-600">
                      {statusCounts.positive}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-500" />
                </div>
              </motion.div>
            </div>
          )}

          {/* 3️⃣ BLOQUE: ALERTA GERENCIAL ÚNICA */}
          {!isLoading && statusCounts.critical > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`rounded-2xl p-6 lg:p-8 shadow-xl ${
                statusCounts.critical >= STORES.length * 0.7 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-600'
              } text-white`}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl lg:text-6xl"
                  >
                    {statusCounts.critical >= STORES.length * 0.7 ? '🚨' : '⚠️'}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-black mb-3">
                      {statusCounts.critical} de {STORES.length} tiendas en estado crítico ({'<'}70%)
                    </h3>
                    <p className="text-white/90 text-base lg:text-lg mb-5 font-medium leading-relaxed">
                      {statusCounts.critical >= STORES.length * 0.7 
                        ? 'Acción inmediata requerida. La mayoría de la zona está por debajo del objetivo.'
                        : 'Requiere atención prioritaria para cumplir meta mensual.'
                      }
                    </p>
                    <Button 
                      onClick={() => {
                        const criticalStoresEl = document.getElementById('stores-table');
                        criticalStoresEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white text-red-700 hover:bg-red-50 font-bold shadow-lg text-base px-6 py-3"
                    >
                      Ver Tiendas Críticas
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4️⃣ BLOQUE: LISTA MAESTRA DE TIENDAS (EL CORAZÓN) */}
          <div id="stores-table">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900">Tiendas</h2>
              <p className="text-sm text-slate-500">{filteredStores.length} de {STORES.length} puntos</p>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="animate-pulse space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-16 bg-slate-100 rounded" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <th className="text-left py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide">
                          Tienda
                        </th>
                        <th className="text-right py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide">
                          % Cumplimiento
                        </th>
                        <th className="text-right py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide hidden md:table-cell">
                          Venta vs Meta
                        </th>
                        <th className="text-right py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide hidden lg:table-cell">
                          Brecha $
                        </th>
                        <th className="text-center py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="text-left py-4 px-4 lg:px-6 text-xs font-black text-slate-700 uppercase tracking-wide hidden xl:table-cell">
                          Acción Sugerida
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores
                        .sort((a, b) => {
                          const statusOrder = { critical: 0, negative: 1, positive: 2 };
                          if (statusOrder[a.status] !== statusOrder[b.status]) {
                            return statusOrder[a.status] - statusOrder[b.status];
                          }
                          return a.salesCompliance - b.salesCompliance;
                        })
                        .map((store, idx) => {
                          const action = 
                            store.salesCompliance < 70 
                              ? 'Intervenir hoy' 
                              : store.salesCompliance < 90 
                              ? 'Acelerar ritmo' 
                              : 'Mantener desempeño';

                          return (
                            <motion.tr
                              key={store.code}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.02 }}
                              onClick={() => setSelectedStoreDetail(store)}
                              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors"
                            >
                              {/* Tienda */}
                              <td className="py-4 px-4 lg:px-6">
                                <p className="font-bold text-slate-900 text-sm lg:text-base group-hover:text-pink-600 transition-colors">
                                  {store.name}
                                </p>
                                <p className="text-xs text-slate-500">{store.code}</p>
                              </td>

                              {/* % Cumplimiento con Barra */}
                              <td className="py-4 px-4 lg:px-6">
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`font-black text-xl lg:text-2xl ${
                                    store.salesCompliance >= 90 ? 'text-emerald-600' :
                                    store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {store.salesCompliance.toFixed(0)}%
                                  </span>
                                  <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.03 }}
                                      className={`h-full rounded-full ${
                                        store.salesCompliance >= 90 ? 'bg-emerald-500' :
                                        store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Venta vs Meta */}
                              <td className="py-4 px-4 lg:px-6 text-right hidden md:table-cell">
                                <p className="font-bold text-slate-900 text-sm lg:text-base">
                                  {formatCurrency(store.totalSales)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  de {formatCurrency(store.salesBudget)}
                                </p>
                              </td>

                              {/* Brecha */}
                              <td className="py-4 px-4 lg:px-6 text-right hidden lg:table-cell">
                                <p className={`font-black text-base lg:text-lg ${
                                  store.gap > 0 ? 'text-red-600' : 'text-emerald-600'
                                }`}>
                                  {store.gap > 0 ? '-' : '+'}{formatCurrency(Math.abs(store.gap))}
                                </p>
                              </td>

                              {/* Estado */}
                              <td className="py-4 px-4 lg:px-6 text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xl ${
                                  store.status === 'positive' ? 'bg-emerald-100' : 
                                  store.status === 'negative' ? 'bg-amber-100' : 'bg-red-100'
                                }`}>
                                  {store.status === 'positive' ? '🟢' : store.status === 'negative' ? '🟡' : '🔴'}
                                </span>
                              </td>

                              {/* Acción Sugerida */}
                              <td className="py-4 px-4 lg:px-6 text-sm font-semibold text-slate-700 hidden xl:table-cell">
                                {action}
                              </td>
                            </motion.tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 5️⃣ BLOQUE: ACCIONES PRIORITARIAS (MAX 3) */}
          {!isLoading && (
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-5">¿Qué hacer hoy?</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* 🔴 Intervenir Hoy - TOP 1 Crítica */}
                {storesAnalysis
                  .filter(s => s.status === 'critical')
                  .sort((a, b) => a.salesCompliance - b.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 lg:p-8 border-2 border-red-200 shadow-lg"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <AlertTriangle className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-red-600 uppercase tracking-wide mb-2">🔴 Intervenir Hoy</p>
                          <p className="font-black text-slate-900 text-lg lg:text-xl">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm lg:text-base text-slate-700 mb-6 leading-relaxed">
                        Solo {store.salesCompliance.toFixed(0)}% de cumplimiento. Requiere atención inmediata para recuperar meta.
                      </p>
                      <Button 
                        onClick={() => setSelectedStoreDetail(store)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
                      >
                        Ver Detalle →
                      </Button>
                    </motion.div>
                  ))}

                {/* ⚡ Acelerar Ritmo - Oportunidad rápida */}
                {storesAnalysis
                  .filter(s => s.status === 'negative' && s.salesCompliance >= 80)
                  .sort((a, b) => b.salesCompliance - a.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 lg:p-8 border-2 border-amber-200 shadow-lg"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-amber-600 uppercase tracking-wide mb-2">⚡ Acelerar Ritmo</p>
                          <p className="font-black text-slate-900 text-lg lg:text-xl">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm lg:text-base text-slate-700 mb-6 leading-relaxed">
                        Ya en {store.salesCompliance.toFixed(0)}%. Oportunidad de alcanzar meta con impulso adicional.
                      </p>
                      <Button 
                        onClick={() => setSelectedStoreDetail(store)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
                      >
                        Ver Detalle →
                      </Button>
                    </motion.div>
                  ))}

                {/* 🏆 Reconocer Excelencia */}
                {storesAnalysis
                  .filter(s => s.status === 'positive' && s.salesCompliance >= 110)
                  .sort((a, b) => b.salesCompliance - a.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 lg:p-8 border-2 border-emerald-200 shadow-lg"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-2">🏆 Reconocer</p>
                          <p className="font-black text-slate-900 text-lg lg:text-xl">{store.name}</p>
                        </div>
                      </div>
                      <p className="text-sm lg:text-base text-slate-700 mb-6 leading-relaxed">
                        Superando meta en {(store.salesCompliance - 100).toFixed(0)}%. Excelente desempeño del equipo.
                      </p>
                      <Button 
                        onClick={() => setSelectedStoreDetail(store)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
                      >
                        Ver Detalle →
                      </Button>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* 6️⃣ BLOQUE: INSIGHTS & PROYECCIÓN (COLAPSABLE) */}
          {!isLoading && aiInsights && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-black text-slate-900 text-base lg:text-lg">Insights & Proyección</p>
                        <p className="text-xs text-slate-500">Análisis predictivo del cierre</p>
                      </div>
                    </div>
                    <motion.div
                      className="text-slate-400 group-open:rotate-180 transition-transform"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </motion.div>
                  </div>
                </div>
              </summary>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 lg:p-8 border border-purple-200 shadow-md"
              >
                <div className="flex items-start gap-4 mb-6">
                  <Sparkles className="w-7 h-7 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-purple-900 text-base lg:text-lg mb-3 leading-relaxed">
                      {aiInsights.insight}
                    </p>
                    <p className="text-xs text-slate-500">Insight generado por IA basado en datos históricos</p>
                  </div>
                </div>
              </motion.div>
            </details>
          )}
        </div>
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
    </div>
  );
}