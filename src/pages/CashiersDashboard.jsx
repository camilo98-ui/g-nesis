import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import StoreSelector, { STORES, getDisplayName } from '@/components/StoreSelector';
import GamificationCoach from '@/components/ai/GamificationCoach';
import PerformanceAnalyzer from '@/components/ai/PerformanceAnalyzer';
import DateFilter from '@/components/DateFilter';
import BadgeConfigManager from '@/components/gamification/BadgeConfigManager';
import CashierVisualProfile from '@/components/cashier/CashierVisualProfile';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import CashierAnalysis from '@/components/cashier/CashierAnalysis';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import CashierRanking from '@/components/gamification/CashierRanking';
import CashierGoalsManager from '@/components/gamification/CashierGoalsManager';
import { ViewProfileButton } from '@/components/cashier/CashierFullProfile';
import CashierAssignmentSuggestion from '@/components/ai/CashierAssignmentSuggestion';
import CashierSalesModal from '@/components/forms/CashierSalesModal';
import { 
  ArrowLeft, Users, Search, TrendingUp, TrendingDown, 
  Award, Target, BarChart3, User, ChevronRight, Star,
  Flame, Crown, Medal, Eye, Hash, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CashiersDashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [showBadgeConfig, setShowBadgeConfig] = useState(false);
  const [showCashierSales, setShowCashierSales] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    setSelectedCashier(null);
  };

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: async () => {
      const records = await base44.entities.ShiftRecord.filter({ store_id: selectedStore });
      console.log('📊 ShiftRecords cargados en Dashboard:', records.length, 'para store:', selectedStore);
      return records;
    },
    enabled: !!selectedStore,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Cargar metas reales de la tienda
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore, dateRange],
    queryFn: async () => {
      const month = dateRange.from.getMonth() + 1;
      const year = dateRange.from.getFullYear();
      return await base44.entities.Budget.filter({ 
        store_id: selectedStore,
        month,
        year
      });
    },
    enabled: !!selectedStore && !!dateRange,
  });

  // Calcular metas proporcionales al período seleccionado
  const storeMeta = useMemo(() => {
    const budget = budgets[0];
    if (!budget) {
      return {
        salesGoal: 15000000,
        ticketGoal: 35000,
      };
    }

    // Días del período seleccionado
    const daysInPeriod = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1;
    const daysInMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 0).getDate();
    const proportion = daysInPeriod / daysInMonth;

    return {
      salesGoal: (budget.sales_budget || 15000000) * proportion,
      ticketGoal: budget.tickets_budget || 35000,
    };
  }, [budgets, dateRange]);

  const activeCashiers = cashiers.filter(c => c.is_active !== false);

  // Calcular estadísticas de cada cajero
  const cashierStats = useMemo(() => {
    const stats = {};
    const filteredRecords = shiftRecords.filter(r => {
      const d = new Date(r.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    activeCashiers.forEach(cashier => {
      const records = filteredRecords.filter(r => r.cashier_id === cashier.id);
      const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
      const totalTickets = records.reduce((sum, r) => sum + (r.tickets || 0), 0);
      const totalTransactions = records.reduce((sum, r) => sum + (r.transactions || 0), 0);
      const totalSuggested = records.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
      const daysWorked = records.length;

      stats[cashier.id] = {
        ...cashier,
        totalSales,
        totalTickets,
        totalTransactions,
        totalSuggested,
        daysWorked,
        avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        avgSalesPerDay: daysWorked > 0 ? totalSales / daysWorked : 0
      };
    });

    return stats;
  }, [activeCashiers, shiftRecords, dateRange]);

  // Ranking por ventas - orden dinámico basado en múltiples factores
  const rankedCashiers = useMemo(() => {
    return Object.values(cashierStats)
      .map(c => {
        // Calcular score compuesto: ventas (50%), ticket promedio (30%), días trabajados (20%)
        const maxSales = Math.max(...Object.values(cashierStats).map(x => x.totalSales), 1);
        const maxTicket = Math.max(...Object.values(cashierStats).map(x => x.avgTicket), 1);
        const maxDays = Math.max(...Object.values(cashierStats).map(x => x.daysWorked), 1);
        
        const salesScore = (c.totalSales / maxSales) * 50;
        const ticketScore = (c.avgTicket / maxTicket) * 30;
        const daysScore = (c.daysWorked / maxDays) * 20;
        
        return { ...c, compositeScore: salesScore + ticketScore + daysScore };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashierStats]);

  // Filtrar por búsqueda
  const filteredCashiers = rankedCashiers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totales del equipo - calculados directamente desde shiftRecords de la tienda
  const teamTotals = useMemo(() => {
    const filteredRecords = shiftRecords.filter(r => {
      const d = new Date(r.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    const totalSales = filteredRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTransactions = filteredRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const totalSuggested = filteredRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    
    const activeCashiersCount = activeCashiers.length;
    
    return {
      totalSales,
      totalTickets: totalTransactions,
      avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      avgSales: activeCashiersCount > 0 ? totalSales / activeCashiersCount : 0,
      avgSuggested: activeCashiersCount > 0 ? totalSuggested / activeCashiersCount : 0,
      totalCashiers: activeCashiersCount
    };
  }, [shiftRecords, dateRange, activeCashiers]);

  // Indicadores accionables
  const actionableMetrics = useMemo(() => {
    const salesCompliance = storeMeta.salesGoal > 0 ? (teamTotals.totalSales / storeMeta.salesGoal) * 100 : 0;
    
    // Ticket promedio REAL de la tienda (ventas totales / transacciones totales)
    const storeAvgTicket = teamTotals.totalTickets > 0 ? teamTotals.totalSales / teamTotals.totalTickets : 0;
    const ticketCompliance = storeMeta.ticketGoal > 0 ? (storeAvgTicket / storeMeta.ticketGoal) * 100 : 0;
    
    // Cuántos cajeros están sobre meta (simplificado: consideramos sobre meta si supera promedio del equipo)
    const avgTeamSales = teamTotals.avgSales;
    const cashiersOverGoal = rankedCashiers.filter(c => c.totalSales > avgTeamSales).length;

    return {
      salesCompliance,
      salesStatus: salesCompliance >= 100 ? 'success' : salesCompliance >= 85 ? 'warning' : 'critical',
      ticketCompliance,
      ticketStatus: ticketCompliance >= 100 ? 'success' : ticketCompliance >= 90 ? 'warning' : 'critical',
      cashiersOverGoal,
      topPerformer: rankedCashiers[0],
      storeAvgTicket // Exportar para mostrarlo en la card
    };
  }, [teamTotals, storeMeta, rankedCashiers]);

  // Auto scroll to analysis when cashier is selected
  const analysisRef = React.useRef(null);
  useEffect(() => {
    if (selectedCashier && analysisRef.current) {
      setTimeout(() => {
        analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [selectedCashier]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(val));

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <motion.h1 
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-[length:200%_100%] bg-clip-text text-transparent flex items-center gap-2"
              >
                <Users className="w-6 h-6 text-pink-500" />
                Cajeros
              </motion.h1>
              {selectedStore && (
                <p className="text-sm text-pink-500 font-medium">{getDisplayName(selectedStore)}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBadgeConfig(true)}
              className="gap-2 border-violet-200 text-violet-600 hover:bg-violet-50"
            >
              <Settings className="w-4 h-4" />
              Config Insignias
            </Button>
            <PerformanceAnalyzer storeId={selectedStore} storeName={getDisplayName(selectedStore)} />
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {/* Indicadores Accionables */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 1. Ventas vs Meta */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-2xl p-5 shadow-lg border-2 relative overflow-hidden ${
                  actionableMetrics.salesStatus === 'success' 
                    ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300' 
                    : actionableMetrics.salesStatus === 'warning'
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300'
                      : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                }`}
              >
                {/* Semáforo */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    actionableMetrics.salesStatus === 'success' ? 'bg-emerald-500' :
                    actionableMetrics.salesStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  } shadow-lg`}
                />
                
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-5 h-5 ${
                    actionableMetrics.salesStatus === 'success' ? 'text-emerald-600' :
                    actionableMetrics.salesStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                  }`} />
                  <span className={`text-xs font-bold uppercase ${
                    actionableMetrics.salesStatus === 'success' ? 'text-emerald-700' :
                    actionableMetrics.salesStatus === 'warning' ? 'text-amber-700' : 'text-red-700'
                  }`}>Ventas vs Meta</span>
                </div>
                
                <p className={`text-4xl font-black mb-1 ${
                  actionableMetrics.salesStatus === 'success' ? 'text-emerald-700' :
                  actionableMetrics.salesStatus === 'warning' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {Math.round(actionableMetrics.salesCompliance)}%
                </p>
                <p className="text-xs text-gray-600 font-medium mb-2">
                  {formatCurrency(teamTotals.totalSales)} / {formatCurrency(storeMeta.salesGoal)}
                </p>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(actionableMetrics.salesCompliance, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`h-full ${
                      actionableMetrics.salesStatus === 'success' ? 'bg-emerald-500' :
                      actionableMetrics.salesStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className={`text-[10px] font-black mt-2 uppercase tracking-wide ${
                  actionableMetrics.salesStatus === 'success' ? 'text-emerald-600' :
                  actionableMetrics.salesStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {actionableMetrics.salesStatus === 'success' ? '✓ SOBRE META' :
                   actionableMetrics.salesStatus === 'warning' ? '⚠ CERCA DE META' : '✕ BAJO META'}
                </p>
              </motion.div>

              {/* 2. Ticket Promedio vs Meta */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-2xl p-5 shadow-lg border-2 relative overflow-hidden ${
                  actionableMetrics.ticketStatus === 'success' 
                    ? 'bg-gradient-to-br from-blue-50 to-sky-100 border-blue-300' 
                    : actionableMetrics.ticketStatus === 'warning'
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300'
                      : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300'
                }`}
              >
                {/* Semáforo */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    actionableMetrics.ticketStatus === 'success' ? 'bg-blue-500' :
                    actionableMetrics.ticketStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  } shadow-lg`}
                />
                
                <div className="flex items-center gap-2 mb-3">
                  <Target className={`w-5 h-5 ${
                    actionableMetrics.ticketStatus === 'success' ? 'text-blue-600' :
                    actionableMetrics.ticketStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                  }`} />
                  <span className={`text-xs font-bold uppercase ${
                    actionableMetrics.ticketStatus === 'success' ? 'text-blue-700' :
                    actionableMetrics.ticketStatus === 'warning' ? 'text-amber-700' : 'text-red-700'
                  }`}>Ticket vs Meta</span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <p className={`text-4xl font-black ${
                    actionableMetrics.ticketStatus === 'success' ? 'text-blue-700' :
                    actionableMetrics.ticketStatus === 'warning' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {Math.round(actionableMetrics.ticketCompliance)}%
                  </p>
                  <span className={`text-sm font-bold ${
                    actionableMetrics.ticketCompliance >= 100 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {actionableMetrics.ticketCompliance >= 100 ? '↑' : '↓'}
                    {Math.abs(100 - Math.round(actionableMetrics.ticketCompliance))}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium mb-2">
                  {formatCurrency(teamTotals.avgTicket)} / {formatCurrency(storeMeta.ticketGoal)}
                </p>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(actionableMetrics.ticketCompliance, 100)}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className={`h-full ${
                      actionableMetrics.ticketStatus === 'success' ? 'bg-blue-500' :
                      actionableMetrics.ticketStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className={`text-[10px] font-black mt-2 uppercase tracking-wide ${
                  actionableMetrics.ticketStatus === 'success' ? 'text-blue-600' :
                  actionableMetrics.ticketStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {actionableMetrics.ticketStatus === 'success' ? '✓ SOBRE META' :
                   actionableMetrics.ticketStatus === 'warning' ? '⚠ CERCA DE META' : '✕ BAJO META'}
                </p>
              </motion.div>

              {/* 3. Productividad del Equipo */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl p-5 shadow-lg border-2 border-violet-300 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-violet-600" />
                  <span className="text-xs font-bold uppercase text-violet-700">Productividad</span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-5xl font-black text-violet-700">{actionableMetrics.cashiersOverGoal}</p>
                  <div className="text-left">
                    <p className="text-xl font-bold text-violet-600">de {teamTotals.totalCashiers}</p>
                    <p className="text-[10px] text-gray-600 font-medium uppercase">sobre meta</p>
                  </div>
                </div>
                
                <Progress 
                  value={(actionableMetrics.cashiersOverGoal / teamTotals.totalCashiers) * 100} 
                  className="h-2 mb-2 bg-white/50"
                />
                
                <p className={`text-xs font-black uppercase tracking-wide ${
                  actionableMetrics.cashiersOverGoal >= teamTotals.totalCashiers * 0.7 ? 'text-violet-700' :
                  actionableMetrics.cashiersOverGoal >= teamTotals.totalCashiers * 0.5 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {actionableMetrics.cashiersOverGoal >= teamTotals.totalCashiers * 0.7 ? '✓ EQUIPO FUERTE' :
                   actionableMetrics.cashiersOverGoal >= teamTotals.totalCashiers * 0.5 ? '⚠ MEJORABLE' : '✕ NECESITA APOYO'}
                </p>
              </motion.div>

              {/* 4. Top Performer */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => actionableMetrics.topPerformer && setSelectedCashier(actionableMetrics.topPerformer)}
                className="bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-200 rounded-2xl p-5 shadow-lg border-2 border-amber-400 relative overflow-hidden cursor-pointer"
              >
                {/* Corona animada */}
                <motion.div
                  animate={{ rotate: [-5, 5, -5], y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-2 right-2 text-2xl"
                >
                  👑
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold uppercase text-amber-700">Top Performer</span>
                </div>

                {actionableMetrics.topPerformer ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md overflow-hidden">
                        {actionableMetrics.topPerformer.photo_url ? (
                          <img src={actionableMetrics.topPerformer.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-black text-amber-900 truncate leading-tight">
                          {actionableMetrics.topPerformer.name?.split(' ').slice(0, 2).join(' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-2 mb-1">
                      <p className="text-xs text-gray-600 font-medium">Ventas Totales</p>
                      <p className="text-2xl font-black text-amber-700">
                        {formatCurrency(actionableMetrics.topPerformer.totalSales)}
                      </p>
                    </div>

                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide text-center">
                      🏆 MEJOR DEL PERÍODO
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Sin datos</p>
                )}
              </motion.div>
            </div>

            {/* Ranking y Lista de Cajeros */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking visual con barras */}
              <div className="lg:col-span-1">
                <CashierRanking storeId={selectedStore} onSelectCashier={setSelectedCashier} />
              </div>

              {/* Detalle del Cajero */}
              <div className="lg:col-span-2" ref={analysisRef}>
                <AnimatePresence mode="wait">
                  {selectedCashier ? (
                    <motion.div
                      key={selectedCashier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Perfil Visual estilo Facebook */}
                      <CashierVisualProfile 
                        cashier={selectedCashier}
                        storeCode={selectedStore}
                        shiftRecords={shiftRecords}
                        teamAvg={{
                          avgSales: teamTotals.avgSales,
                          avgTicket: teamTotals.avgTicket
                        }}
                      />

                      {/* Análisis detallado */}
                      <CashierAnalysis 
                        cashierId={selectedCashier.id}
                        cashierName={selectedCashier.name}
                        storeId={selectedStore}
                      />

                      {/* Stats adicionales - PROMEDIOS */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                         <p className="text-xs text-gray-500 mb-1">💰 Venta Prom/Día</p>
                         <p className="text-lg font-black text-emerald-600">
                           {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(cashierStats[selectedCashier.id]?.avgSalesPerDay || 0))}
                         </p>
                         <p className="text-[9px] text-gray-400">{cashierStats[selectedCashier.id]?.daysWorked || 0} turnos</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                         <p className="text-xs text-gray-500 mb-1">🎫 Ticket Promedio</p>
                         <p className="text-lg font-black text-blue-600">
                           ${Math.round((cashierStats[selectedCashier.id]?.avgTicket || 0)/1000)}K
                         </p>
                         <p className="text-[9px] text-gray-400">ventas/transacciones</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">⚡ Transacciones</p>
                          <p className="text-lg font-black text-purple-600">
                            {cashierStats[selectedCashier.id]?.totalTransactions || 0}
                          </p>
                          <p className="text-[9px] text-gray-400">totales</p>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">🎁 Sugeridos Totales</p>
                          <p className="text-lg font-black text-pink-600">
                            {cashierStats[selectedCashier.id]?.totalSuggested || 0}
                          </p>
                          <p className="text-[9px] text-gray-400">en el período</p>
                        </div>
                      </div>

                      {/* Coach IA y Metas */}
                      <div className="mt-4 flex gap-2 justify-end">
                        <GamificationCoach 
                          cashierId={selectedCashier.id}
                          cashierName={selectedCashier.name}
                          storeId={selectedStore}
                        />
                      </div>

                      {/* Metas personalizadas */}
                      <div className="mt-4">
                        <CashierGoalsManager 
                          cashierId={selectedCashier.id}
                          cashierName={selectedCashier.name}
                          storeId={selectedStore}
                          shiftRecords={shiftRecords}
                        />
                      </div>

                      {/* Los logros y comparación ya están en el perfil visual */}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-12 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-6xl mb-4"
                      >
                        👤
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">Selecciona un cajero</h3>
                      <p className="text-gray-500 text-sm">Haz clic en un cajero de la lista para ver su análisis detallado</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sugerencia IA de Asignación */}
            <CashierAssignmentSuggestion 
              storeId={selectedStore}
              cashiers={activeCashiers}
              shiftRecords={shiftRecords}
            />

            {/* Top 3 Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Top 3 del Período
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rankedCashiers.slice(0, 3).map((cashier, idx) => (
                  <motion.div
                    key={cashier.id}
                    whileHover={{ scale: 1.03, y: -3 }}
                    className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                          {cashier.photo_url ? (
                            <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                          )}
                        </div>
                        {cashier.photo_url && (
                          <div className="absolute -bottom-1 -right-1 text-sm">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{cashier.name}</p>
                        <p className="text-xs text-white/70">{cashier.daysWorked} turnos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-lg font-bold">${Math.round(cashier.totalSales/1000000)}M</p>
                        <p className="text-xs text-white/70">Ventas</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-lg font-bold">${Math.round(cashier.avgTicket/1000)}K</p>
                        <p className="text-xs text-white/70">Ticket Prom</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              👥
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver el dashboard de cajeros</p>
          </div>
        )}
      </div>

      {/* Modal de Configuración de Insignias */}
      <BadgeConfigManager 
        storeId={selectedStore} 
        isOpen={showBadgeConfig} 
        onClose={() => setShowBadgeConfig(false)} 
      />

      {/* Cashier Sales Modal */}
      <AnimatePresence>
        {showCashierSales && (
          <CashierSalesModal
            isOpen={showCashierSales}
            onClose={() => setShowCashierSales(false)}
            storeId={selectedStore}
          />
        )}
      </AnimatePresence>
    </div>
  );
}