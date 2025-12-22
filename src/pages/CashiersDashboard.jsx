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
import ScoreBreakdown from '@/components/ranking/ScoreBreakdown';
import LevelBadge from '@/components/ranking/LevelBadge';
import TrafficLight from '@/components/ranking/TrafficLight';
import CashierInsight from '@/components/ranking/CashierInsight';
import { 
  ArrowLeft, Users, Search, TrendingUp, TrendingDown, 
  Award, Target, BarChart3, User, ChevronRight, Star,
  Flame, Crown, Medal, Eye, Hash, Settings, Trophy, Zap, DollarSign, Receipt, Gift
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Ranking NUEVO: Score Único (Ventas 50%, Ticket 30%, Sugeridos 20%)
  const rankedCashiers = useMemo(() => {
    const values = Object.values(cashierStats);
    
    const maxSales = Math.max(...values.map(x => x.totalSales), 1);
    const maxTicket = Math.max(...values.map(x => x.avgTicket), 1);
    const maxSuggested = Math.max(...values.map(x => x.totalSuggested), 1);
    
    return values
      .map(c => {
        // Score Único: Ventas 50%, Ticket 30%, Sugeridos 20%
        const salesScore = (c.totalSales / maxSales) * 50;
        const ticketScore = (c.avgTicket / maxTicket) * 30;
        const suggestedScore = (c.totalSuggested / maxSuggested) * 20;
        const overallScore = salesScore + ticketScore + suggestedScore;
        
        // Niveles de Progresión
        let level = 'Rookie';
        let levelColor = 'gray';
        if (overallScore >= 80) { level = 'Elite'; levelColor = 'purple'; }
        else if (overallScore >= 65) { level = 'Master'; levelColor = 'blue'; }
        else if (overallScore >= 45) { level = 'Pro'; levelColor = 'green'; }
        
        return { ...c, overallScore, salesScore, ticketScore, suggestedScore, level, levelColor };
      })
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashierStats]);

  // Filtrar por búsqueda
  const filteredCashiers = rankedCashiers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totales del equipo
  const teamTotals = useMemo(() => {
    const values = Object.values(cashierStats);
    const totalSales = values.reduce((sum, c) => sum + c.totalSales, 0);
    const totalTransactions = values.reduce((sum, c) => sum + c.totalTransactions, 0);
    const totalSuggested = values.reduce((sum, c) => sum + c.totalSuggested, 0);
    return {
      totalSales,
      totalTickets: totalTransactions,
      avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      avgSales: values.length > 0 ? totalSales / values.length : 0,
      avgSuggested: values.length > 0 ? totalSuggested / values.length : 0,
      totalCashiers: values.length
    };
  }, [cashierStats]);

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
            {/* Explicación del Score - TRANSPARENCIA TOTAL */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-5 border-2 border-purple-200 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <Trophy className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-base font-black text-gray-800 mb-3">🎯 Cómo funciona el Ranking de Popsy</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-blue-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-2">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-black text-blue-700 text-2xl">50%</p>
                      <p className="text-xs text-gray-700 font-semibold">Ventas Totales</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-purple-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center mx-auto mb-2">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-black text-purple-700 text-2xl">30%</p>
                      <p className="text-xs text-gray-700 font-semibold">Ticket Promedio</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-2">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-black text-emerald-700 text-2xl">20%</p>
                      <p className="text-xs text-gray-700 font-semibold">Sugeridos</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center bg-white/60 rounded-lg py-2 px-3 italic">
                    💡 El ranking premia el <strong>balance</strong>: no solo vendes mucho, también vendes bien y generas valor.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Team Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  <span className="text-sm text-pink-600">Equipo Activo</span>
                </div>
                <p className="text-3xl font-semibold text-gray-700">{teamTotals.totalCashiers}</p>
                <p className="text-xs text-gray-500">cajeros trabajando</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-emerald-600">Prom. por Cajero</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700">
                  {formatCurrency(teamTotals.avgSales)}
                </p>
                <p className="text-xs text-gray-500">venta promedio</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-blue-600">Ticket Promedio</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700">
                  {formatCurrency(teamTotals.avgTicket)}
                </p>
                <p className="text-xs text-gray-500">del equipo</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-amber-600">Top Performer</span>
                </div>
                <p className="text-lg font-semibold text-gray-700 truncate">
                  {rankedCashiers[0]?.name?.split(' ')[0] || '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {rankedCashiers[0] ? formatCurrency(rankedCashiers[0].totalSales) : 'Sin datos'}
                </p>
              </motion.div>
            </div>

            {/* Podio Top 3 - VISUAL GAMING */}
            {rankedCashiers.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-orange-600/20"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center"
                    >
                      <Trophy className="w-5 h-5 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-black text-white">Podio del Período</h3>
                  </div>

                  <div className="flex items-end justify-center gap-4 mb-6">
                    {/* 2do Lugar */}
                    {rankedCashiers[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="flex-1 max-w-[140px]"
                      >
                        <div className="bg-gradient-to-br from-slate-300 to-gray-400 rounded-t-2xl p-4 text-center relative">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-4xl mb-2"
                          >
                            🥈
                          </motion.div>
                          <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-4 border-white/60">
                            {rankedCashiers[1].photo_url ? (
                              <img src={rankedCashiers[1].photo_url} alt={rankedCashiers[1].name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/40 flex items-center justify-center text-2xl font-black text-white">
                                {rankedCashiers[1].name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="font-black text-white text-sm truncate mb-1">{rankedCashiers[1].name?.split(' ')[0]}</p>
                          <LevelBadge level={rankedCashiers[1].level} score={rankedCashiers[1].overallScore} compact />
                          <p className="text-2xl font-black text-white mt-2">{rankedCashiers[1].overallScore.toFixed(0)}</p>
                          <p className="text-xs text-white/80">puntos</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-400 to-gray-500 h-24 rounded-b-xl flex items-center justify-center text-white font-bold">
                          #2
                        </div>
                      </motion.div>
                    )}

                    {/* 1er Lugar */}
                    {rankedCashiers[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="flex-1 max-w-[160px]"
                      >
                        <div className="bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-t-2xl p-5 text-center relative shadow-2xl shadow-amber-400/50">
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-5xl mb-2"
                          >
                            👑
                          </motion.div>
                          <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-white shadow-xl">
                            {rankedCashiers[0].photo_url ? (
                              <img src={rankedCashiers[0].photo_url} alt={rankedCashiers[0].name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/40 flex items-center justify-center text-3xl font-black text-amber-700">
                                {rankedCashiers[0].name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="font-black text-gray-900 text-base truncate mb-2">{rankedCashiers[0].name?.split(' ')[0]}</p>
                          <LevelBadge level={rankedCashiers[0].level} score={rankedCashiers[0].overallScore} compact />
                          <p className="text-3xl font-black text-gray-900 mt-3">{rankedCashiers[0].overallScore.toFixed(0)}</p>
                          <p className="text-xs text-gray-700 font-semibold">puntos</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-yellow-600 h-32 rounded-b-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                          #1
                        </div>
                      </motion.div>
                    )}

                    {/* 3er Lugar */}
                    {rankedCashiers[2] && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="flex-1 max-w-[140px]"
                      >
                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-t-2xl p-4 text-center relative">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="text-4xl mb-2"
                          >
                            🥉
                          </motion.div>
                          <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-4 border-white/60">
                            {rankedCashiers[2].photo_url ? (
                              <img src={rankedCashiers[2].photo_url} alt={rankedCashiers[2].name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/40 flex items-center justify-center text-2xl font-black text-white">
                                {rankedCashiers[2].name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="font-black text-white text-sm truncate mb-1">{rankedCashiers[2].name?.split(' ')[0]}</p>
                          <LevelBadge level={rankedCashiers[2].level} score={rankedCashiers[2].overallScore} compact />
                          <p className="text-2xl font-black text-white mt-2">{rankedCashiers[2].overallScore.toFixed(0)}</p>
                          <p className="text-xs text-white/80">puntos</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 h-20 rounded-b-xl flex items-center justify-center text-white font-bold">
                          #3
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Team Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* RESUMEN EJECUTIVO DE EQUIPO */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Resumen del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Nivel Promedio</p>
                    <p className="text-2xl font-black text-blue-700">
                      {(() => {
                        const levels = { Elite: 4, Master: 3, Pro: 2, Rookie: 1 };
                        const avg = rankedCashiers.reduce((sum, c) => sum + (levels[c.level] || 1), 0) / rankedCashiers.length;
                        return avg >= 3.5 ? 'Elite' : avg >= 2.5 ? 'Master' : avg >= 1.5 ? 'Pro' : 'Rookie';
                      })()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Score Promedio</p>
                    <p className="text-2xl font-black text-purple-700">
                      {(rankedCashiers.reduce((sum, c) => sum + c.overallScore, 0) / rankedCashiers.length).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">En Meta 🟢</p>
                    <p className="text-2xl font-black text-emerald-700">
                      {rankedCashiers.filter(c => c.totalSales >= teamTotals.avgSales && c.avgTicket >= teamTotals.avgTicket).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Críticos 🔴</p>
                    <p className="text-2xl font-black text-red-700">
                      {rankedCashiers.filter(c => c.totalSales < teamTotals.avgSales * 0.7).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sugerencia IA de Asignación */}
            <CashierAssignmentSuggestion 
              storeId={selectedStore}
              cashiers={activeCashiers}
              shiftRecords={shiftRecords}
            />
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