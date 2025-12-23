import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { 
  ArrowLeft, TrendingUp, AlertTriangle, CheckCircle,
  DollarSign, Target, Brain, Sparkles, Store, Menu, Search, Zap, ChevronDown, Eye
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
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

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
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= dateRange.from && d <= dateRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTickets = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0));
      const totalTransactions = Math.max(0, storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = Math.max(0, budget?.sales_budget || 0);

      const salesCompliance = salesBudget > 0 && totalSales > 0 ? (totalSales / salesBudget) * 100 : 0;
      const hasData = storeSales.length > 0 && totalSales > 0;

      const daysElapsed = Math.max(1, storeSales.length);
      const daysInPeriod = Math.max(1, Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)));
      const dailyAvg = daysElapsed > 0 && totalSales > 0 ? totalSales / daysElapsed : 0;
      const projection = dailyAvg > 0 ? dailyAvg * daysInPeriod : 0;

      let status = 'positive';
      if (!hasData) status = 'no_data';
      else if (salesCompliance < 70) status = 'critical';
      else if (salesCompliance < 90) status = 'negative';

      const gap = salesBudget - totalSales;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales, totalTickets, totalTransactions, avgTicket,
        salesBudget, salesCompliance, projection, status, gap,
        hasData, daysElapsed, dailyAvg
      };
    });
  }, [allDailySales, allBudgets, dateRange, currentMonth, currentYear]);

  const zoneTotals = useMemo(() => {
    const storesWithData = storesAnalysis.filter(s => s.hasData);
    const totalSales = storesWithData.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesWithData.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesWithData.reduce((sum, s) => sum + s.projection, 0);
    return { totalSales, totalBudget, totalProjection };
  }, [storesAnalysis]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

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

  // Motor de acción sugerida inteligente
  const getSmartAction = (store) => {
    if (!store.hasData) return 'Registrar ventas';
    
    const zoneAvgTicket = zoneTotals.totalSales / storesAnalysis.filter(s => s.hasData).reduce((sum, s) => sum + s.totalTransactions, 0);
    const topStore = storesAnalysis.filter(s => s.hasData).sort((a, b) => b.salesCompliance - a.salesCompliance)[0];
    
    // Críticas
    if (store.salesCompliance < 70) {
      if (store.gap > 5000000) return 'Visita inmediata + revisión dotación';
      if (store.avgTicket < zoneAvgTicket * 0.85) return 'Foco urgente en ticket promedio';
      return 'Intervención operativa hoy';
    }
    
    // En alerta
    if (store.salesCompliance < 90) {
      if (store.avgTicket < zoneAvgTicket) return 'Aumentar ticket promedio';
      if (store.projection >= store.salesBudget * 0.95) return 'Acelerar ritmo esta semana';
      return 'Ajustar horarios pico';
    }
    
    // En meta
    if (store.salesCompliance >= 110 && topStore?.code === store.code) {
      return 'Compartir mejores prácticas';
    }
    
    return 'Mantener desempeño';
  };

  // Generar AI Insights
  const generateAIInsights = async () => {
    if (loadingInsights || aiInsights) return;
    setLoadingInsights(true);

    try {
      const storesWithData = storesAnalysis.filter(s => s.hasData);
      const topStores = storesWithData.sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 2);
      const bottomStores = storesWithData.sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 2);

      const prompt = `Eres un consultor estratégico de retail. Analiza estos datos de Popsy y genera UN ÚNICO insight accionable de máximo 35 palabras:

TOP 2: ${topStores.map(s => `${s.name} ${s.salesCompliance.toFixed(0)}%`).join(', ')}
BOTTOM 2: ${bottomStores.map(s => `${s.name} ${s.salesCompliance.toFixed(0)}%`).join(', ')}
ZONA: ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}% cumplimiento

Dame 1 acción específica para HOY que mejore el resultado de la zona. Sé directo.`;

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

  // Resumen contextual
  const tableContextSummary = useMemo(() => {
    const criticalStores = filteredStores.filter(s => s.status === 'critical');
    const totalGap = criticalStores.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
    
    if (criticalStores.length === 0) {
      const alertStores = filteredStores.filter(s => s.status === 'negative');
      return `Mostrando ${filteredStores.length} tiendas · ${alertStores.length} en alerta`;
    }
    
    return `Mostrando ${criticalStores.length} tiendas críticas · Brecha total: ${formatCurrency(totalGap)}`;
  }, [filteredStores, formatCurrency]);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Sidebar */}
      <aside className="fixed left-0 top-0 h-full bg-slate-900 z-40 shadow-xl" style={{ width: '72px' }}>
        <div className="p-4 flex flex-col items-center h-full">
          <Link to={createPageUrl('Home')}>
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6 cursor-pointer shadow-lg"
            >
              <Store className="w-7 h-7 text-white" />
            </motion.div>
          </Link>

          <div className="flex-1" />

          <Link to={createPageUrl('Home')}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-xl hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[72px]">
        <div className="max-w-[1800px] mx-auto">
          {/* 1️⃣ CONTEXTO SUPERIOR */}
          <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
            <div className="px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Bogotá Noroccidente</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar tienda..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[280px] h-10 text-sm border-slate-200 focus:border-pink-500"
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

          <div className="px-8 py-8">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-6 mb-12">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-slate-50 rounded-xl h-36 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* 2️⃣ RESUMEN EJECUTIVO - 4 KPIs */}
                <div className="grid grid-cols-4 gap-6 mb-10">
                  {/* Venta Total */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border border-slate-200"
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">💰 Venta Total</p>
                    <p className="text-4xl font-black text-slate-900 mb-2">
                      {formatCurrency(zoneTotals.totalSales)}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">Meta: {formatCurrency(zoneTotals.totalBudget)}</p>
                    <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((zoneTotals.totalSales/zoneTotals.totalBudget)*100, 100)}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full ${
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
                    className="bg-white rounded-xl p-6 border border-slate-200"
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">📊 % Cumplimiento</p>
                    <p className={`text-6xl font-black mb-2 ${
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-600' :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-500">de la zona</p>
                  </motion.div>

                  {/* Críticas - KPI PROTAGONISTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-xl p-6 border-2 ${
                      statusCounts.critical > 0 
                        ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">🔴 Críticas</p>
                    <div className="flex items-center gap-3">
                      <p className={`text-7xl font-black ${statusCounts.critical > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                        {statusCounts.critical}
                      </p>
                      {statusCounts.critical > 0 && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-8 h-8 text-red-500" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {statusCounts.critical > 0 
                        ? `${Math.round((statusCounts.critical/STORES.length)*100)}% del total` 
                        : 'Sin tiendas críticas'
                      }
                    </p>
                  </motion.div>

                  {/* En Meta */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl p-6 border border-slate-200"
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">🟢 En Meta</p>
                    <p className="text-6xl font-black text-emerald-600 mb-2">
                      {statusCounts.positive}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                    </p>
                  </motion.div>
                </div>

                {/* 3️⃣ ALERTA GERENCIAL ÚNICA */}
                {statusCounts.critical > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                  >
                    <div className={`rounded-xl p-8 ${
                      statusCounts.critical >= STORES.length * 0.7 
                        ? 'bg-gradient-to-r from-red-600 to-rose-700' 
                        : 'bg-gradient-to-r from-amber-600 to-orange-700'
                    } text-white shadow-2xl`}>
                      <div className="flex items-start gap-6">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-6xl"
                        >
                          {statusCounts.critical >= STORES.length * 0.7 ? '🚨' : '⚠️'}
                        </motion.div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-black mb-3">
                            {statusCounts.critical} de {STORES.length} tiendas están en estado crítico ({'<'}70%)
                          </h2>
                          <p className="text-white/95 text-lg mb-6 font-semibold leading-relaxed">
                            {statusCounts.critical >= STORES.length * 0.7 
                              ? 'Acción inmediata requerida. La zona está por debajo del objetivo.'
                              : 'Requiere atención urgente para alcanzar meta mensual.'
                            }
                          </p>
                          <Button 
                            onClick={() => {
                              const el = document.getElementById('stores-table');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-white text-red-700 hover:bg-red-50 font-bold text-base px-8 py-3 h-auto shadow-xl"
                          >
                            Ver tiendas críticas
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Resumen contextual SOBRE la tabla */}
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-600">{tableContextSummary}</p>
                </div>

                {/* 4️⃣ LISTA MAESTRA DE TIENDAS */}
                <div id="stores-table" className="mb-10">
                  <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b-2 border-slate-200">
                          <th className="text-left py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">Tienda</th>
                          <th className="text-right py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">% Cumplimiento</th>
                          <th className="text-right py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">Venta vs Meta</th>
                          <th className="text-right py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">Brecha $</th>
                          <th className="text-center py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">Estado</th>
                          <th className="text-left py-5 px-6 text-xs font-black text-slate-700 uppercase tracking-wider">Acción Sugerida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStores
                          .sort((a, b) => {
                            // Ordenamiento: Críticas primero, luego alertas, luego en meta
                            const statusOrder = { critical: 0, negative: 1, positive: 2, no_data: 3 };
                            if (statusOrder[a.status] !== statusOrder[b.status]) {
                              return statusOrder[a.status] - statusOrder[b.status];
                            }
                            // Dentro de cada grupo: por brecha (mayor brecha primero)
                            return b.gap - a.gap;
                          })
                          .map((store, idx) => {
                            const action = getSmartAction(store);

                            return (
                              <motion.tr
                                key={store.code}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.015 }}
                                onClick={() => store.hasData && setSelectedStoreDetail(store)}
                                className={`border-b border-slate-100 group transition-colors ${
                                  store.hasData ? 'cursor-pointer hover:bg-slate-50' : ''
                                }`}
                              >
                                {/* Tienda */}
                                <td className="py-5 px-6">
                                  <p className={`font-bold text-base ${
                                    !store.hasData ? 'text-slate-400' : 'text-slate-900 group-hover:text-pink-600 transition-colors'
                                  }`}>
                                    {store.name}
                                  </p>
                                  <p className="text-xs text-slate-400">{store.code}</p>
                                </td>

                                {/* % Cumplimiento con Barra */}
                                <td className="py-5 px-6">
                                  {!store.hasData ? (
                                    <span className="text-sm text-slate-400 italic block text-right">Sin datos</span>
                                  ) : (
                                    <div className="flex items-center justify-end gap-4">
                                      <div className="w-28 bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                          transition={{ duration: 0.8, delay: idx * 0.02 }}
                                          className={`h-full ${
                                            store.salesCompliance >= 90 ? 'bg-emerald-500' :
                                            store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                          }`}
                                        />
                                      </div>
                                      <span className={`font-black text-2xl ${
                                        store.salesCompliance >= 90 ? 'text-emerald-600' :
                                        store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                                      }`}>
                                        {store.salesCompliance.toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Venta vs Meta */}
                                <td className="py-5 px-6 text-right">
                                  {!store.hasData ? (
                                    <span className="text-sm text-slate-400">—</span>
                                  ) : (
                                    <>
                                      <p className="font-bold text-slate-900 text-base">{formatCurrency(store.totalSales)}</p>
                                      <p className="text-xs text-slate-500">de {formatCurrency(store.salesBudget)}</p>
                                    </>
                                  )}
                                </td>

                                {/* Brecha */}
                                <td className="py-5 px-6 text-right">
                                  {!store.hasData ? (
                                    <span className="text-sm text-slate-400">—</span>
                                  ) : (
                                    <p className={`font-black text-lg ${
                                      store.gap > 0 ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                      {store.gap > 0 ? '-' : '+'}{formatCurrency(Math.abs(store.gap))}
                                    </p>
                                  )}
                                </td>

                                {/* Estado */}
                                <td className="py-5 px-6 text-center">
                                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-2xl ${
                                    store.status === 'no_data' ? 'bg-slate-100' :
                                    store.status === 'positive' ? 'bg-emerald-100' : 
                                    store.status === 'negative' ? 'bg-amber-100' : 'bg-red-100'
                                  }`}>
                                    {store.status === 'no_data' ? '⚪' :
                                     store.status === 'positive' ? '🟢' : 
                                     store.status === 'negative' ? '🟡' : '🔴'}
                                  </span>
                                </td>

                                {/* Acción Sugerida */}
                                <td className="py-5 px-6">
                                  <p className={`text-sm font-semibold ${
                                    !store.hasData ? 'text-slate-400 italic' :
                                    store.salesCompliance < 70 ? 'text-red-700' :
                                    store.salesCompliance < 90 ? 'text-amber-700' : 'text-emerald-700'
                                  }`}>
                                    {action}
                                  </p>
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5️⃣ ACCIONES PRIORITARIAS */}
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-slate-900 mb-5">¿Qué hacer hoy?</h2>
                  <div className="grid grid-cols-3 gap-6">
                    {/* 🔴 Intervenir Hoy */}
                    {storesAnalysis
                      .filter(s => s.status === 'critical')
                      .sort((a, b) => b.gap - a.gap)
                      .slice(0, 1)
                      .map(store => (
                        <motion.div
                          key={store.code}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-red-600 uppercase">Intervenir Hoy</p>
                              <p className="font-black text-slate-900 text-lg">{store.name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 mb-1 font-semibold">
                            {store.salesCompliance.toFixed(0)}% cumplimiento
                          </p>
                          <p className="text-sm text-red-700 mb-5 font-bold">
                            Brecha: {formatCurrency(store.gap)}
                          </p>
                          <Button 
                            onClick={() => setSelectedStoreDetail(store)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                          >
                            <Eye className="w-4 h-4 mr-2" /> Ver detalle
                          </Button>
                        </motion.div>
                      ))}

                    {/* ⚡ Acelerar Ritmo */}
                    {storesAnalysis
                      .filter(s => s.status === 'negative' && s.salesCompliance >= 80)
                      .sort((a, b) => b.salesCompliance - a.salesCompliance)
                      .slice(0, 1)
                      .map(store => (
                        <motion.div
                          key={store.code}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-600 uppercase">Acelerar Ritmo</p>
                              <p className="font-black text-slate-900 text-lg">{store.name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 mb-1 font-semibold">
                            {store.salesCompliance.toFixed(0)}% cumplimiento
                          </p>
                          <p className="text-sm text-amber-700 mb-5 font-bold">
                            A {(90 - store.salesCompliance).toFixed(0)}% de meta
                          </p>
                          <Button 
                            onClick={() => setSelectedStoreDetail(store)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          >
                            <Eye className="w-4 h-4 mr-2" /> Ver detalle
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
                          transition={{ delay: 0.1 }}
                          className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-emerald-600 uppercase">Reconocer</p>
                              <p className="font-black text-slate-900 text-lg">{store.name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 mb-1 font-semibold">
                            {store.salesCompliance.toFixed(0)}% cumplimiento
                          </p>
                          <p className="text-sm text-emerald-700 mb-5 font-bold">
                            +{(store.salesCompliance - 100).toFixed(0)}% sobre meta
                          </p>
                          <Button 
                            onClick={() => setSelectedStoreDetail(store)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            <Eye className="w-4 h-4 mr-2" /> Ver detalle
                          </Button>
                        </motion.div>
                      ))}
                  </div>
                </div>

                {/* 6️⃣ INSIGHTS Y PROYECCIÓN (Colapsable) */}
                {aiInsights?.accion_hoy && (
                  <details className="group" open={showInsights}>
                    <summary 
                      className="cursor-pointer list-none" 
                      onClick={(e) => {e.preventDefault(); setShowInsights(!showInsights);}}
                    >
                      <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200 hover:border-purple-300 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Brain className="w-6 h-6 text-purple-600" />
                            <div>
                              <p className="font-black text-slate-900 text-base">Insights & Proyección</p>
                              <p className="text-xs text-slate-600">Análisis predictivo del cierre</p>
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 bg-white rounded-xl p-6 border-2 border-slate-200"
                      >
                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200">
                          <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Acción Recomendada Hoy</p>
                            <p className="text-base text-slate-800 font-semibold leading-relaxed">{aiInsights.accion_hoy}</p>
                          </div>
                        </div>

                        {/* Mini KPIs Proyección */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-slate-500 mb-1">Proyección Cierre</p>
                            <p className="text-xl font-black text-slate-900">{formatCurrency(zoneTotals.totalProjection)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-slate-500 mb-1">% Proyectado</p>
                            <p className={`text-xl font-black ${
                              ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-600' :
                              ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-slate-500 mb-1">Gap a Cerrar</p>
                            <p className={`text-xl font-black ${
                              (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-slate-500 mb-1">Tiendas en Riesgo</p>
                            <p className="text-xl font-black text-slate-900">
                              {storesAnalysis.filter(s => s.hasData && (s.projection / s.salesBudget) < 0.85).length}
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