import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
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
  const [showPerspective, setShowPerspective] = useState(false);

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
        totalSales, totalTransactions, avgTicket,
        salesBudget, salesCompliance, projection, status, gap,
        hasData, dailyAvg
      };
    });
  }, [allDailySales, allBudgets, dateRange, currentMonth, currentYear]);

  const zoneTotals = useMemo(() => {
    const storesWithData = storesAnalysis.filter(s => s.hasData);
    const totalSales = storesWithData.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storesWithData.reduce((sum, s) => sum + s.salesBudget, 0);
    const totalProjection = storesWithData.reduce((sum, s) => sum + s.projection, 0);
    const totalTransactions = storesWithData.reduce((sum, s) => sum + s.totalTransactions, 0);
    return { totalSales, totalBudget, totalProjection, totalTransactions };
  }, [storesAnalysis]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

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
      const topStore = storesWithData.sort((a, b) => b.salesCompliance - a.salesCompliance)[0];
      const worstStore = storesWithData.sort((a, b) => a.salesCompliance - b.salesCompliance)[0];

      const prompt = `Analiza esta situación de zona retail y genera UN insight ejecutivo de máximo 25 palabras:

MEJOR: ${topStore.name} ${topStore.salesCompliance.toFixed(0)}%
PEOR: ${worstStore.name} ${worstStore.salesCompliance.toFixed(0)}%
ZONA: ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%

1 acción específica para HOY que mejore el resultado global.`;

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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Back Button - Floating */}
      <Link to={createPageUrl('Home')}>
        <motion.div
          whileHover={{ x: -2 }}
          className="fixed left-8 top-8 w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer z-50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </motion.div>
      </Link>

      <div className="max-w-[1400px] mx-auto px-16 py-16">
        {/* 1️⃣ HEADER EDITORIAL */}
        <div className="mb-20">
          <div className="flex items-start justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-black text-slate-900 mb-4 tracking-tight"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Bogotá Noroccidente
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-500 font-normal"
              >
                Estado operativo · {format(new Date(), 'EEEE dd \'de\' MMMM', { locale: es })}
              </motion.p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar tienda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-[320px] h-12 text-sm border-slate-200 focus:border-slate-400 rounded-lg bg-white shadow-sm"
                />
              </div>
              <DateFilter 
                dateRange={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-16 mb-24">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 animate-pulse">
                <div className="h-16 bg-slate-200 rounded mb-2 w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 2️⃣ KPIs COMO TITULARES EDITORIALES */}
            <div className="grid grid-cols-4 gap-16 mb-24">
              {/* Venta Total */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-6xl font-black text-slate-900 mb-3 tracking-tighter tabular-nums">
                  {formatShort(zoneTotals.totalSales)}
                </p>
                <p className="text-sm text-slate-500 font-normal">Venta total vs meta</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 h-px">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((zoneTotals.totalSales/zoneTotals.totalBudget)*100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-px ${
                        (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.9 ? 'bg-emerald-600' :
                        (zoneTotals.totalSales/zoneTotals.totalBudget) >= 0.7 ? 'bg-amber-600' : 'bg-red-600'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-normal tabular-nums">{formatShort(zoneTotals.totalBudget)}</span>
                </div>
              </motion.div>

              {/* % Cumplimiento */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <p className={`text-8xl font-black mb-3 tracking-tighter tabular-nums ${
                  ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-600' :
                  ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                </p>
                <p className="text-sm text-slate-500 font-normal">Cumplimiento zona</p>
              </motion.div>

              {/* Críticas */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p className={`text-8xl font-black mb-3 tracking-tighter tabular-nums ${
                  statusCounts.critical > 0 ? 'text-red-600' : 'text-slate-300'
                }`}>
                  {statusCounts.critical}
                </p>
                <p className="text-sm text-slate-500 font-normal">Tiendas críticas</p>
                {statusCounts.critical > 0 && (
                  <p className="text-xs text-slate-400 mt-2 font-normal">
                    {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                  </p>
                )}
              </motion.div>

              {/* En Meta */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-8xl font-black text-emerald-600 mb-3 tracking-tighter tabular-nums">
                  {statusCounts.positive}
                </p>
                <p className="text-sm text-slate-500 font-normal">En meta</p>
              </motion.div>
            </div>

            {/* 3️⃣ ALERTA EDITORIAL */}
            {statusCounts.critical > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-20"
              >
                <div className={`py-8 px-10 rounded ${
                  statusCounts.critical >= STORES.length * 0.7 ? 'bg-red-50' : 'bg-amber-50'
                } border-l-2 ${
                  statusCounts.critical >= STORES.length * 0.7 ? 'border-red-600' : 'border-amber-600'
                }`}>
                  <p className={`text-2xl font-bold mb-3 leading-tight ${
                    statusCounts.critical >= STORES.length * 0.7 ? 'text-red-900' : 'text-amber-900'
                  }`}>
                    {statusCounts.critical} de {STORES.length} tiendas están en estado crítico ({'<'}70%)
                  </p>
                  <p className={`text-base mb-5 font-normal ${
                    statusCounts.critical >= STORES.length * 0.7 ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {statusCounts.critical >= STORES.length * 0.7 
                      ? 'Se requiere acción inmediata para cumplir meta mensual.'
                      : 'Requiere atención urgente para alcanzar objetivo.'
                    }
                  </p>
                  <button
                    onClick={() => {
                      const el = document.getElementById('stores-table');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-sm font-semibold underline ${
                      statusCounts.critical >= STORES.length * 0.7 ? 'text-red-700' : 'text-amber-700'
                    } hover:opacity-70 transition-opacity`}
                  >
                    Ver tiendas críticas →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Contexto pre-tabla */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-500">{tableContextSummary}</p>
            </div>

            {/* 4️⃣ TABLA EDITORIAL - SALA DE GUERRA */}
            <div id="stores-table" className="mb-24">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">Tienda</th>
                    <th className="text-right pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">% Cumplimiento</th>
                    <th className="text-right pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">Venta vs Meta</th>
                    <th className="text-right pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">Brecha $</th>
                    <th className="text-center pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">Estado</th>
                    <th className="text-left pb-4 px-0 text-xs font-bold text-slate-600 uppercase tracking-wider">Acción Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores
                    .sort((a, b) => {
                      const statusOrder = { critical: 0, negative: 1, positive: 2, no_data: 3 };
                      if (statusOrder[a.status] !== statusOrder[b.status]) {
                        return statusOrder[a.status] - statusOrder[b.status];
                      }
                      return b.gap - a.gap;
                    })
                    .map((store, idx) => {
                      const action = getExecutiveAction(store);

                      return (
                        <motion.tr
                          key={store.code}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.01 }}
                          onClick={() => store.hasData && setSelectedStoreDetail(store)}
                          className={`border-b border-slate-100 group ${
                            store.hasData ? 'cursor-pointer hover:bg-slate-50' : ''
                          }`}
                        >
                          {/* Tienda */}
                          <td className="py-7 px-0">
                            <p className={`font-bold text-lg ${
                              !store.hasData ? 'text-slate-400' : 'text-slate-900'
                            }`}>
                              {store.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-normal">{store.code}</p>
                          </td>

                          {/* % Cumplimiento */}
                          <td className="py-7 px-0">
                            {!store.hasData ? (
                              <span className="text-sm text-slate-400 italic block text-right font-normal">Sin ventas registradas</span>
                            ) : (
                              <div className="flex items-center justify-end gap-6">
                                <div className="w-28 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.01 }}
                                    className={`h-full ${
                                      store.salesCompliance >= 90 ? 'bg-emerald-600' :
                                      store.salesCompliance >= 70 ? 'bg-amber-600' : 'bg-red-600'
                                    }`}
                                  />
                                </div>
                                <span className={`font-black text-3xl tabular-nums ${
                                  store.salesCompliance >= 90 ? 'text-emerald-600' :
                                  store.salesCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {store.salesCompliance.toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Venta vs Meta */}
                          <td className="py-7 px-0 text-right">
                            {!store.hasData ? (
                              <span className="text-sm text-slate-400">—</span>
                            ) : (
                              <div>
                                <p className="font-bold text-slate-900 text-base tabular-nums">{formatCurrency(store.totalSales)}</p>
                                <p className="text-xs text-slate-400 mt-1 font-normal">de {formatCurrency(store.salesBudget)}</p>
                              </div>
                            )}
                          </td>

                          {/* Brecha */}
                          <td className="py-7 px-0 text-right">
                            {!store.hasData ? (
                              <span className="text-sm text-slate-400">—</span>
                            ) : (
                              <p className={`font-black text-xl tabular-nums ${
                                store.gap > 0 ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {store.gap > 0 ? '-' : '+'}{formatCurrency(Math.abs(store.gap))}
                              </p>
                            )}
                          </td>

                          {/* Estado - Punto Minimal */}
                          <td className="py-7 px-0 text-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              store.status === 'no_data' ? 'bg-slate-300' :
                              store.status === 'positive' ? 'bg-emerald-600' : 
                              store.status === 'negative' ? 'bg-amber-600' : 'bg-red-600'
                            }`} />
                          </td>

                          {/* Acción Sugerida */}
                          <td className="py-7 px-0">
                            <p className={`text-sm font-normal ${
                              !store.hasData ? 'text-slate-400 italic' : 'text-slate-600'
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

            {/* División */}
            <div className="border-t border-slate-300 mb-16" />

            {/* 5️⃣ PRIORIDADES */}
            <div className="mb-20">
              <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Prioridades de hoy</h2>
              <div className="space-y-6">
                {/* Intervenir */}
                {storesAnalysis
                  .filter(s => s.status === 'critical')
                  .sort((a, b) => b.gap - a.gap)
                  .slice(0, 1)
                  .map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="flex items-center justify-between py-6 px-8 bg-white border-l-4 border-red-600 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Intervenir Hoy</p>
                        <p className="font-black text-slate-900 text-2xl mb-2">{store.name}</p>
                        <p className="text-sm text-slate-600 font-normal">
                          {store.salesCompliance.toFixed(0)}% cumplimiento · Brecha {formatCurrency(store.gap)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))}

                {/* Acelerar */}
                {storesAnalysis
                  .filter(s => s.status === 'negative' && s.salesCompliance >= 80)
                  .sort((a, b) => b.salesCompliance - a.salesCompliance)
                  .slice(0, 1)
                  .map(store => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="flex items-center justify-between py-6 px-8 bg-white border-l-4 border-amber-600 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Acelerar Ritmo</p>
                        <p className="font-black text-slate-900 text-2xl mb-2">{store.name}</p>
                        <p className="text-sm text-slate-600 font-normal">
                          {store.salesCompliance.toFixed(0)}% cumplimiento · A {(90 - store.salesCompliance).toFixed(0)}% de meta
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))}

                {/* Reconocer */}
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
                      onClick={() => setSelectedStoreDetail(store)}
                      className="flex items-center justify-between py-6 px-8 bg-white border-l-4 border-emerald-600 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">Reconocer</p>
                        <p className="font-black text-slate-900 text-2xl mb-2">{store.name}</p>
                        <p className="text-sm text-slate-600 font-normal">
                          {store.salesCompliance.toFixed(0)}% cumplimiento · +{(store.salesCompliance - 100).toFixed(0)}% sobre meta
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* 6️⃣ PERSPECTIVA */}
            {aiInsights?.insight && (
              <div className="border-t border-slate-300 pt-12">
                <button
                  onClick={() => setShowPerspective(!showPerspective)}
                  className="w-full flex items-center justify-between group mb-6"
                >
                  <p className="text-xl font-bold text-slate-900">Perspectiva</p>
                  <motion.div
                    animate={{ rotate: showPerspective ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showPerspective && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-8"
                    >
                      {/* Insight */}
                      <div className="bg-slate-50 rounded p-8">
                        <p className="text-lg text-slate-800 leading-relaxed font-normal">
                          {aiInsights.insight}
                        </p>
                      </div>

                      {/* Proyección */}
                      <div className="grid grid-cols-4 gap-10">
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Proyección Cierre</p>
                          <p className="text-3xl font-black text-slate-900 tabular-nums">{formatShort(zoneTotals.totalProjection)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">% Proyectado</p>
                          <p className={`text-3xl font-black tabular-nums ${
                            ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-600' :
                            ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Gap a Cerrar</p>
                          <p className={`text-3xl font-black tabular-nums ${
                            (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {formatShort(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Tiendas en Riesgo</p>
                          <p className="text-3xl font-black text-slate-900 tabular-nums">
                            {storesAnalysis.filter(s => s.hasData && (s.projection / s.salesBudget) < 0.85).length}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalle */}
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