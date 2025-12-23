import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Eye, Zap, Award, Brain, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { format, startOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreDetailModal from '../components/executive/StoreDetailModal';
import KPIDetailModal from '../components/executive/KPIDetailModal';
import ExecutiveComparable from '../components/executive/ExecutiveComparable';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

export default function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [hoveredKPI, setHoveredKPI] = useState(null);
  const [selectedKPIDetail, setSelectedKPIDetail] = useState(null);
  const [showComparable, setShowComparable] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

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
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

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

      // Calcular cumplimiento del mes anterior
      const prevMonthSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
        } catch {
          return false;
        }
      });
      const prevTotalSales = prevMonthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const prevBudget = allBudgets.find(b => b.store_id === store.code && b.month === prevMonth && b.year === prevYear);
      const prevSalesBudget = prevBudget?.sales_budget || 0;
      const prevCompliance = prevSalesBudget > 0 && prevTotalSales > 0 ? (prevTotalSales / prevSalesBudget) * 100 : 0;
      const complianceTrend = prevCompliance > 0 ? salesCompliance - prevCompliance : 0;

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
        hasData, dailyAvg, complianceTrend, prevCompliance
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

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedStores = useMemo(() => {
    const sorted = [...filteredStores];
    
    if (sortConfig.key === 'status') {
      const statusOrder = { critical: 0, negative: 1, positive: 2, no_data: 3 };
      sorted.sort((a, b) => {
        const order = sortConfig.direction === 'asc' 
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
        return order !== 0 ? order : b.gap - a.gap;
      });
    } else if (sortConfig.key === 'name') {
      sorted.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'compliance') {
      sorted.sort((a, b) => {
        const comparison = a.salesCompliance - b.salesCompliance;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'sales') {
      sorted.sort((a, b) => {
        const comparison = a.totalSales - b.totalSales;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'gap') {
      sorted.sort((a, b) => {
        const comparison = a.gap - b.gap;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return sorted;
  }, [filteredStores, sortConfig]);

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
      const criticalStores = storesAnalysis.filter(s => s.status === 'critical');
      const topStore = storesWithData.sort((a, b) => b.salesCompliance - a.salesCompliance)[0];
      const worstStore = storesWithData.sort((a, b) => a.salesCompliance - b.salesCompliance)[0];
      
      const totalGap = criticalStores.reduce((sum, s) => sum + Math.max(0, s.gap), 0);
      const avgTicketZone = zoneTotals.totalSales / zoneTotals.totalTransactions;
      const daysLeft = Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) - new Date()) / (1000 * 60 * 60 * 24));

      const prompt = `Eres un analista ejecutivo de retail. Analiza esta zona y genera un reporte estructurado:

DATOS DE LA ZONA:
- Cumplimiento: ${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(1)}%
- Venta actual: $${(zoneTotals.totalSales/1000000).toFixed(1)}M de $${(zoneTotals.totalBudget/1000000).toFixed(1)}M
- Brecha total: $${(totalGap/1000000).toFixed(1)}M
- Tiendas críticas: ${criticalStores.length} de ${storesAnalysis.length}
- Ticket promedio zona: $${avgTicketZone.toFixed(0)}
- Días restantes del mes: ${daysLeft}

TOP PERFORMER: ${topStore.name} (${topStore.salesCompliance.toFixed(0)}%, Ticket: $${topStore.avgTicket.toFixed(0)})
PEOR PERFORMER: ${worstStore.name} (${worstStore.salesCompliance.toFixed(0)}%, Brecha: $${(worstStore.gap/1000000).toFixed(1)}M)

TIENDAS CRÍTICAS DETALLE:
${criticalStores.slice(0, 3).map(s => `- ${s.name}: ${s.salesCompliance.toFixed(0)}% (Brecha: $${(s.gap/1000000).toFixed(1)}M, Ticket: $${s.avgTicket.toFixed(0)})`).join('\n')}

Genera:
1. Estado numérico conciso (máx 30 palabras)
2. Acción inmediata específica con números
3. Pronóstico: Si se ejecuta, cuánto cerraría la brecha en %`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            estado_numerico: { type: "string" },
            accion_inmediata: { type: "string" },
            pronostico_impacto: { type: "string" }
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

  // Datos para gráficas de KPIs
  const dailySalesData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const daySales = allDailySales
        .filter(s => {
          try {
            const d = new Date(s.date);
            return d.toDateString() === day.toDateString();
          } catch {
            return false;
          }
        })
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);
      
      return {
        date: format(day, 'dd/MM'),
        sales: daySales / 1000000
      };
    });
  }, [allDailySales, dateRange]);

  const statusDistributionData = useMemo(() => [
    { name: 'En Meta', value: statusCounts.positive, color: '#10b981' },
    { name: 'Alerta', value: statusCounts.negative, color: '#f59e0b' },
    { name: 'Críticas', value: statusCounts.critical, color: '#ef4444' }
  ], [statusCounts]);

  const criticalStoresData = useMemo(() => {
    return storesAnalysis
      .filter(s => s.status === 'critical')
      .sort((a, b) => a.salesCompliance - b.salesCompliance)
      .slice(0, 5)
      .map(s => ({
        name: s.name.substring(0, 8),
        value: s.salesCompliance
      }));
  }, [storesAnalysis]);

  const topStoresTrend = useMemo(() => {
    return storesAnalysis
      .filter(s => s.status === 'positive')
      .sort((a, b) => b.salesCompliance - a.salesCompliance)
      .slice(0, 5)
      .map(s => ({
        name: s.name.substring(0, 8),
        value: s.salesCompliance
      }));
  }, [storesAnalysis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 -right-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-blue-500/15 via-cyan-500/15 to-emerald-500/15 rounded-full blur-3xl"
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Back Button */}
      <Link to={createPageUrl('Home')}>
        <motion.div
          whileHover={{ scale: 1.05, x: -3 }}
          className="fixed left-8 top-8 w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer z-50"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.div>
      </Link>

      <div className="max-w-[1600px] mx-auto px-12 py-16 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-start justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-black text-white mb-4 tracking-tight"
              >
                Bogotá Noroccidente
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-400 font-normal"
              >
                {format(new Date(), 'EEEE dd \'de\' MMMM', { locale: es })}
              </motion.p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar tienda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-[320px] h-12 text-sm bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 focus:border-white/30"
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
          <div className="grid grid-cols-4 gap-8 mb-20">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Botón Modo Comparable Destacado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowComparable(true)}
                className="w-full relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-xl border-2 border-purple-500/40 hover:border-purple-400/60 transition-all group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/30 to-purple-500/0"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50"
                    >
                      <TrendingUp className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black text-white mb-1">Análisis Comparable</h3>
                      <p className="text-slate-300 text-sm">Compara periodos, identifica tendencias y proyecta resultados</p>
                    </div>
                  </div>
                  
                  <motion.div
                    className="flex items-center gap-3"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="text-right mr-4">
                      <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Análisis Avanzado</p>
                      <p className="text-sm text-white font-bold">Ventas • Transacciones • Ticket</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.button>
            </motion.div>

            {/* KPIs Interactivos Futuristas */}
            <div className="grid grid-cols-4 gap-8 mb-20">
              {/* Venta Total */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onHoverStart={() => setHoveredKPI('sales')}
                onHoverEnd={() => setHoveredKPI(null)}
                onClick={() => setSelectedKPIDetail('sales')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 cursor-pointer overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500"
                />
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">💰 Venta Total</p>
                  <motion.p 
                    className="text-5xl font-black text-white mb-3 tracking-tight tabular-nums"
                    animate={hoveredKPI === 'sales' ? { scale: 1.05 } : { scale: 1 }}
                  >
                    {formatShort(zoneTotals.totalSales)}
                  </motion.p>
                  
                  <AnimatePresence mode="wait">
                    {hoveredKPI === 'sales' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <p className="text-sm text-blue-300 font-semibold">Meta: {formatShort(zoneTotals.totalBudget)}</p>
                        <p className="text-xs text-slate-400">
                          Promedio/tienda: {formatCurrency(zoneTotals.totalSales / storesAnalysis.filter(s => s.hasData).length)}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <ResponsiveContainer width="100%" height={60}>
                          <AreaChart data={dailySalesData}>
                            <defs>
                              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="sales" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              fill="url(#salesGradient)" 
                              animationDuration={800}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-[10px] text-slate-500 text-center mt-1">Tendencia diaria (M)</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* % Cumplimiento */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onHoverStart={() => setHoveredKPI('compliance')}
                onHoverEnd={() => setHoveredKPI(null)}
                onClick={() => setSelectedKPIDetail('compliance')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 cursor-pointer overflow-hidden group"
              >
                <motion.div
                  className={`absolute inset-0 ${
                    ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 
                      ? 'bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/20 group-hover:to-green-500/20'
                      : ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70
                      ? 'bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/20 group-hover:to-orange-500/20'
                      : 'bg-gradient-to-br from-red-500/0 to-rose-500/0 group-hover:from-red-500/20 group-hover:to-rose-500/20'
                  } transition-all duration-500`}
                />
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">📊 Cumplimiento</p>
                  <motion.p 
                    className={`text-7xl font-black mb-3 tracking-tight tabular-nums ${
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 90 ? 'text-emerald-400' :
                      ((zoneTotals.totalSales/zoneTotals.totalBudget)*100) >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}
                    animate={hoveredKPI === 'compliance' ? { scale: 1.05 } : { scale: 1 }}
                  >
                    {((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(0)}%
                  </motion.p>
                  
                  <AnimatePresence mode="wait">
                    {hoveredKPI === 'compliance' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">En meta</span>
                          <span className="text-emerald-400 font-bold">{statusCounts.positive}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">En alerta</span>
                          <span className="text-amber-400 font-bold">{statusCounts.negative}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Críticas</span>
                          <span className="text-red-400 font-bold">{statusCounts.critical}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center"
                      >
                        <ResponsiveContainer width="100%" height={80}>
                          <PieChart>
                            <Pie
                              data={statusDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={35}
                              dataKey="value"
                              animationDuration={800}
                            >
                              {statusDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <p className="text-[10px] text-slate-500 text-center mt-1">Distribución</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Críticas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onHoverStart={() => setHoveredKPI('critical')}
                onHoverEnd={() => setHoveredKPI(null)}
                onClick={() => setSelectedKPIDetail('critical')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 cursor-pointer overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-rose-500/0 group-hover:from-red-500/20 group-hover:to-rose-500/20 transition-all duration-500"
                />
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">🔴 Críticas</p>
                  <motion.p 
                    className={`text-7xl font-black mb-3 tracking-tight tabular-nums ${
                      statusCounts.critical > 0 ? 'text-red-400' : 'text-slate-600'
                    }`}
                    animate={hoveredKPI === 'critical' ? { scale: 1.05 } : { scale: 1 }}
                  >
                    {statusCounts.critical}
                  </motion.p>
                  
                  <AnimatePresence mode="wait">
                    {hoveredKPI === 'critical' && statusCounts.critical > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <p className="text-sm text-red-300 font-semibold">
                          {Math.round((statusCounts.critical/STORES.length)*100)}% del total
                        </p>
                        <p className="text-xs text-slate-400">
                          Brecha: {formatCurrency(storesAnalysis.filter(s => s.status === 'critical').reduce((sum, s) => sum + s.gap, 0))}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {statusCounts.critical > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={60}>
                              <BarChart data={criticalStoresData}>
                                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={800} />
                              </BarChart>
                            </ResponsiveContainer>
                            <p className="text-[10px] text-slate-500 text-center mt-1">Top 5 más críticas</p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-400 text-center">Ninguna crítica</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* En Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onHoverStart={() => setHoveredKPI('meta')}
                onHoverEnd={() => setHoveredKPI(null)}
                onClick={() => setSelectedKPIDetail('meta')}
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 cursor-pointer overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/20 group-hover:to-green-500/20 transition-all duration-500"
                />
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">🟢 En Meta</p>
                  <motion.p 
                    className="text-7xl font-black text-emerald-400 mb-3 tracking-tight tabular-nums"
                    animate={hoveredKPI === 'meta' ? { scale: 1.05 } : { scale: 1 }}
                  >
                    {statusCounts.positive}
                  </motion.p>
                  
                  <AnimatePresence mode="wait">
                    {hoveredKPI === 'meta' && statusCounts.positive > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <p className="text-sm text-emerald-300 font-semibold">
                          {Math.round((statusCounts.positive/STORES.length)*100)}% del total
                        </p>
                        <p className="text-xs text-slate-400">
                          Superávit: {formatCurrency(storesAnalysis.filter(s => s.status === 'positive').reduce((sum, s) => sum - s.gap, 0))}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {statusCounts.positive > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={60}>
                              <LineChart data={topStoresTrend}>
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  dot={{ fill: '#10b981', r: 3 }}
                                  animationDuration={800}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                            <p className="text-[10px] text-slate-500 text-center mt-1">Top 5 mejores</p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-400 text-center">Ninguna en meta</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Alerta Crítica */}
            {statusCounts.critical > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16"
              >
                <div className={`relative rounded-xl p-10 overflow-hidden ${
                  statusCounts.critical >= STORES.length * 0.7 
                    ? 'bg-gradient-to-r from-red-500/90 to-rose-600/90' 
                    : 'bg-gradient-to-r from-amber-500/90 to-orange-600/90'
                } backdrop-blur-xl border border-white/20`}>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10">
                    <p className="text-3xl font-black text-white mb-4 leading-tight">
                      {statusCounts.critical} de {STORES.length} tiendas están en estado crítico ({'<'}70%)
                    </p>
                    <p className="text-lg text-white/90 mb-6 font-medium">
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
                      className="text-sm font-bold text-white underline hover:no-underline transition-all"
                    >
                      Ver tiendas críticas →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contexto */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-400">{tableContextSummary}</p>
            </div>

            {/* Tabla Futurista */}
            <div id="stores-table" className="mb-20">
              <div className="bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th 
                        onClick={() => handleSort('name')}
                        className="text-left py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          Tienda
                          {sortConfig.key === 'name' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('compliance')}
                        className="text-right py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
                      >
                        <div className="flex items-center justify-end gap-2">
                          % Cumplimiento
                          {sortConfig.key === 'compliance' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('sales')}
                        className="text-right py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Venta vs Meta
                          {sortConfig.key === 'sales' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('gap')}
                        className="text-right py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Brecha $
                          {sortConfig.key === 'gap' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="text-center py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Estado
                          {sortConfig.key === 'status' ? (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="w-3 h-3" /> : 
                              <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Acción Sugerida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStores
                      .map((store, idx) => {
                        const action = getExecutiveAction(store);

                        return (
                          <motion.tr
                            key={store.code}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.01 }}
                            onClick={() => store.hasData && setSelectedStoreDetail(store)}
                            className={`border-b border-white/5 group ${
                              store.hasData ? 'cursor-pointer hover:bg-white/5' : ''
                            }`}
                          >
                            <td className="py-7 px-6">
                              <p className={`font-bold text-lg ${
                                !store.hasData ? 'text-slate-600' : 'text-white'
                              }`}>
                                {store.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">{store.code}</p>
                            </td>

                            <td className="py-7 px-6">
                              {!store.hasData ? (
                                <span className="text-sm text-slate-500 italic block text-right">Sin ventas registradas</span>
                              ) : (
                                <div className="flex items-center justify-end gap-6">
                                  <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(store.salesCompliance, 100)}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.01 }}
                                      className={`h-full ${
                                        store.salesCompliance >= 90 ? 'bg-emerald-500' :
                                        store.salesCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`font-black text-3xl tabular-nums ${
                                      store.salesCompliance >= 90 ? 'text-emerald-400' :
                                      store.salesCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                      {store.salesCompliance.toFixed(0)}%
                                    </span>
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ 
                                        scale: 1, 
                                        rotate: 0,
                                        y: store.complianceTrend >= 0 ? [0, -3, 0] : [0, 3, 0]
                                      }}
                                      transition={{ 
                                        scale: { duration: 0.4, delay: idx * 0.01 },
                                        y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                                      }}
                                      className={`${
                                        store.complianceTrend >= 0 ? 'text-emerald-400' : 'text-red-400'
                                      }`}
                                    >
                                      {store.complianceTrend >= 0 ? (
                                        <TrendingUp className="w-6 h-6" />
                                      ) : (
                                        <TrendingDown className="w-6 h-6" />
                                      )}
                                    </motion.div>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="py-7 px-6 text-right">
                              {!store.hasData ? (
                                <span className="text-sm text-slate-500">—</span>
                              ) : (
                                <div>
                                  <p className="font-bold text-white text-base tabular-nums">{formatCurrency(store.totalSales)}</p>
                                  <p className="text-xs text-slate-500 mt-1">de {formatCurrency(store.salesBudget)}</p>
                                </div>
                              )}
                            </td>

                            <td className="py-7 px-6 text-right">
                              {!store.hasData ? (
                                <span className="text-sm text-slate-500">—</span>
                              ) : (
                                <p className={`font-black text-xl tabular-nums ${
                                  store.gap > 0 ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                  {store.gap > 0 ? '-' : '+'}{formatCurrency(Math.abs(store.gap))}
                                </p>
                              )}
                            </td>

                            <td className="py-7 px-6 text-center">
                              <motion.span 
                                whileHover={{ scale: 1.3 }}
                                className={`inline-block w-3 h-3 rounded-full ${
                                  store.status === 'no_data' ? 'bg-slate-600' :
                                  store.status === 'positive' ? 'bg-emerald-500' : 
                                  store.status === 'negative' ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                              />
                            </td>

                            <td className="py-7 px-6">
                              <p className={`text-sm font-normal ${
                                !store.hasData ? 'text-slate-500 italic' : 'text-slate-300'
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

            {/* Prioridades Dinámicas */}
            <div className="mb-20">
              <h2 className="text-3xl font-black text-white mb-10 tracking-tight">Prioridades de hoy</h2>
              <div className="grid grid-cols-3 gap-6">
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
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="relative bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-xl rounded-xl p-8 border border-red-500/30 cursor-pointer overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-rose-600/0 group-hover:from-red-500/30 group-hover:to-rose-600/30 transition-all duration-500"
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-300 uppercase tracking-wide">Intervenir Hoy</p>
                            <p className="font-black text-white text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-xl font-black text-red-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Brecha</span>
                            <span className="text-lg font-bold text-white tabular-nums">{formatCurrency(store.gap)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Venta diaria req.</span>
                            <span className="text-sm font-semibold text-red-200 tabular-nums">{formatCurrency(store.gap / 7)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white group-hover:text-red-200 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-semibold">Ver detalle</span>
                        </div>
                      </div>
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-xl p-8 border border-amber-500/30 cursor-pointer overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-600/0 group-hover:from-amber-500/30 group-hover:to-orange-600/30 transition-all duration-500"
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Acelerar Ritmo</p>
                            <p className="font-black text-white text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-xl font-black text-amber-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Falta para 90%</span>
                            <span className="text-lg font-bold text-white tabular-nums">{(90 - store.salesCompliance).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Proyección</span>
                            <span className="text-sm font-semibold text-amber-200 tabular-nums">{formatCurrency(store.projection)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white group-hover:text-amber-200 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-semibold">Ver detalle</span>
                        </div>
                      </div>
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
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => setSelectedStoreDetail(store)}
                      className="relative bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-xl rounded-xl p-8 border border-emerald-500/30 cursor-pointer overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-green-600/0 group-hover:from-emerald-500/30 group-hover:to-green-600/30 transition-all duration-500"
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Reconocer</p>
                            <p className="font-black text-white text-xl">{store.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Cumplimiento</span>
                            <span className="text-xl font-black text-emerald-300 tabular-nums">{store.salesCompliance.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Sobre meta</span>
                            <span className="text-lg font-bold text-white tabular-nums">+{(store.salesCompliance - 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Venta</span>
                            <span className="text-sm font-semibold text-emerald-200 tabular-nums">{formatCurrency(store.totalSales)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-white group-hover:text-emerald-200 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-semibold">Ver detalle</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Análisis Inteligente */}
            {aiInsights && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden">
                <div className="p-8 border-b border-purple-500/20">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center"
                    >
                      <Brain className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <div>
                      <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">Análisis Predictivo IA</p>
                      <p className="text-sm text-slate-400">Diagnóstico + Acción + Pronóstico</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Estado Numérico */}
                    <div className="bg-white/5 rounded-xl p-6 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">📊 Diagnóstico de Zona</p>
                      </div>
                      <p className="text-lg text-white leading-relaxed">
                        {aiInsights.estado_numerico}
                      </p>
                    </div>

                    {/* Acción Inmediata */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">🎯 Acción Inmediata Recomendada</p>
                      </div>
                      <p className="text-lg text-white leading-relaxed font-medium">
                        {aiInsights.accion_inmediata}
                      </p>
                    </div>

                    {/* Pronóstico */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-6 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">📈 Pronóstico de Impacto</p>
                      </div>
                      <p className="text-lg text-white leading-relaxed">
                        {aiInsights.pronostico_impacto}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPIs de Proyección */}
                <div className="p-8">
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Proyección Mes</p>
                      <p className="text-3xl font-black text-white tabular-nums mb-1">{formatShort(zoneTotals.totalProjection)}</p>
                      <p className="text-xs text-purple-300">vs {formatShort(zoneTotals.totalBudget)} meta</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">% Proyectado</p>
                      <p className={`text-3xl font-black tabular-nums ${
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 100 ? 'text-emerald-400' :
                        ((zoneTotals.totalProjection/zoneTotals.totalBudget)*100) >= 90 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {((zoneTotals.totalProjection/zoneTotals.totalBudget)*100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Gap a Cerrar</p>
                      <p className={`text-3xl font-black tabular-nums ${
                        (zoneTotals.totalBudget - zoneTotals.totalProjection) <= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatShort(Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection))}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {((Math.abs(zoneTotals.totalBudget - zoneTotals.totalProjection)/zoneTotals.totalBudget)*100).toFixed(0)}% del total
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Tiendas en Riesgo</p>
                      <p className="text-3xl font-black text-white tabular-nums mb-1">
                        {storesAnalysis.filter(s => s.hasData && (s.projection / s.salesBudget) < 0.85).length}
                      </p>
                      <p className="text-xs text-red-400">
                        {((storesAnalysis.filter(s => s.hasData && (s.projection / s.salesBudget) < 0.85).length / storesAnalysis.filter(s => s.hasData).length) * 100).toFixed(0)}% del total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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

      {/* Modal Detalle KPI */}
      <AnimatePresence>
        {selectedKPIDetail && (
          <KPIDetailModal
            kpiType={selectedKPIDetail}
            onClose={() => setSelectedKPIDetail(null)}
            data={{ allDailySales, allBudgets }}
            dateRange={dateRange}
            storesAnalysis={storesAnalysis}
            zoneTotals={zoneTotals}
          />
        )}
      </AnimatePresence>

      {/* Modal Comparable */}
      <AnimatePresence>
        {showComparable && (
          <ExecutiveComparable
            onClose={() => setShowComparable(false)}
            allDailySales={allDailySales}
          />
        )}
      </AnimatePresence>
    </div>
  );
}