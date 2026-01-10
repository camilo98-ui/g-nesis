import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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

const DailySalesForm = lazy(() => import('@/components/forms/DailySalesForm'));
const ShiftRecordForm = lazy(() => import('@/components/forms/ShiftRecordForm'));

import {
  ArrowLeft, Users, Search, TrendingUp, TrendingDown,
  Award, Target, BarChart3, User, ChevronRight, Star,
  Flame, Crown, Medal, Eye, Hash, Settings, Receipt } from
'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startOfMonth, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CashiersDashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
      to: now
    };
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [showBadgeConfig, setShowBadgeConfig] = useState(false);
  const [showCashierSales, setShowCashierSales] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesTab, setSalesTab] = useState('tienda');

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
    enabled: !!selectedStore && !!dateRange
  });

  // Calcular metas proporcionales al período seleccionado
  const storeMeta = useMemo(() => {
    const budget = budgets[0];
    if (!budget) {
      return {
        salesGoal: 15000000,
        ticketGoal: 35000
      };
    }

    // Días del período seleccionado
    const daysInPeriod = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1;
    const daysInMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 0).getDate();
    const proportion = daysInPeriod / daysInMonth;

    return {
      salesGoal: (budget.sales_budget || 15000000) * proportion,
      ticketGoal: budget.tickets_budget || 35000
    };
  }, [budgets, dateRange]);

  const activeCashiers = cashiers.filter((c) => c.is_active !== false);

  // Calcular estadísticas de cada cajero
  const cashierStats = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) return {};
    const stats = {};
    const filteredRecords = shiftRecords.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    activeCashiers.forEach((cashier) => {
      const records = filteredRecords.filter((r) => r.cashier_id === cashier.id);
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
    return Object.values(cashierStats).
    map((c) => {
      // Calcular score compuesto: ventas (50%), ticket promedio (30%), días trabajados (20%)
      const maxSales = Math.max(...Object.values(cashierStats).map((x) => x.totalSales), 1);
      const maxTicket = Math.max(...Object.values(cashierStats).map((x) => x.avgTicket), 1);
      const maxDays = Math.max(...Object.values(cashierStats).map((x) => x.daysWorked), 1);

      const salesScore = c.totalSales / maxSales * 50;
      const ticketScore = c.avgTicket / maxTicket * 30;
      const daysScore = c.daysWorked / maxDays * 20;

      return { ...c, compositeScore: salesScore + ticketScore + daysScore };
    }).
    sort((a, b) => b.compositeScore - a.compositeScore).
    map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashierStats]);

  // Filtrar por búsqueda
  const filteredCashiers = rankedCashiers.filter((c) =>
  c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totales del equipo - calculados directamente desde shiftRecords de la tienda
  const teamTotals = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
        return {
            totalSales: 0, totalTickets: 0, avgTicket: 0, avgSales: 0,
            avgSuggested: 0, totalCashiers: activeCashiers.length
        };
    }
    const filteredRecords = shiftRecords.filter((r) => {
      if (!r.date) return false;
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

  // Indicadores accionables y mejores cajeros por categoría
  const actionableMetrics = useMemo(() => {
    const salesCompliance = storeMeta.salesGoal > 0 ? teamTotals.totalSales / storeMeta.salesGoal * 100 : 0;

    // Ticket promedio REAL de la tienda (ventas totales / transacciones totales)
    const storeAvgTicket = teamTotals.totalTickets > 0 ? teamTotals.totalSales / teamTotals.totalTickets : 0;
    const ticketCompliance = storeMeta.ticketGoal > 0 ? storeAvgTicket / storeMeta.ticketGoal * 100 : 0;

    // Cuántos cajeros están sobre meta (simplificado: consideramos sobre meta si supera promedio del equipo)
    const avgTeamSales = teamTotals.avgSales;
    const cashiersOverGoal = rankedCashiers.filter((c) => c.totalSales > avgTeamSales).length;

    // Mejores cajeros por categoría
    const bestInSales = rankedCashiers.reduce((best, c) => !best || c.totalSales > best.totalSales ? c : best, null);
    const bestInTicket = rankedCashiers.reduce((best, c) => !best || c.avgTicket > best.avgTicket ? c : best, null);
    const bestInTransactions = rankedCashiers.reduce((best, c) => !best || c.totalTransactions > best.totalTransactions ? c : best, null);

    return {
      salesCompliance,
      salesStatus: salesCompliance >= 100 ? 'success' : salesCompliance >= 85 ? 'warning' : 'critical',
      ticketCompliance,
      ticketStatus: ticketCompliance >= 100 ? 'success' : ticketCompliance >= 90 ? 'warning' : 'critical',
      cashiersOverGoal,
      topPerformer: rankedCashiers[0],
      storeAvgTicket,
      bestInSales,
      bestInTicket,
      bestInTransactions
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

  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-white">
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
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }} className="bg-clip-text text-pink-700 text-2xl font-bold md:text-3xl from-pink-500 via-rose-500 to-pink-500 flex items-center gap-2">Cajeros




              </motion.h1>
              {selectedStore &&
              <p className="text-pink-700 text-sm font-medium">{getDisplayName(selectedStore)}</p>
              }
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSalesModal(true)}
              className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Receipt className="w-5 h-5 text-white" />
            </motion.button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBadgeConfig(true)} className="bg-background text-pink-700 px-3 text-xs font-medium rounded-md inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-8 gap-2 border-violet-200 hover:bg-violet-50">


              <Settings className="w-4 h-4" />
              Config Insignias
            </Button>
            <PerformanceAnalyzer storeId={selectedStore} storeName={getDisplayName(selectedStore)} dateRange={dateRange} />
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {selectedStore ?
        <div className="space-y-6">
            {/* Header Gamificado - Hall of Fame */}
            <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-pink-50 via-rose-100 to-pink-100 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 mb-6">

              {/* Efecto de brillo animado */}
              <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />

              
              {/* Estrellas flotantes */}
              <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute top-4 right-4 text-4xl opacity-30">

                ✨
              </motion.div>
              <motion.div
              animate={{ rotate: -360, scale: [1, 1.3, 1] }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute bottom-4 left-4 text-4xl opacity-20">

                🌟
              </motion.div>

              <div className="relative z-10">
                <div className="mb-6">
                  <motion.h2
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl md:text-4xl font-black text-pink-800 drop-shadow-sm flex items-center gap-3">

                    <span className="text-5xl">🏆</span>
                    Hall of Fame
                  </motion.h2>
                  <p className="text-pink-700 text-sm mt-1 font-medium">
                    {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>

                {/* Mejores por categoría */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mejor en Ventas */}
                  {actionableMetrics.bestInSales &&
                <motion.div
                  whileHover={{ y: -5, scale: 1.03 }}
                  onClick={() => setSelectedCashier(actionableMetrics.bestInSales)}
                  className="cursor-pointer bg-white/20 backdrop-blur-md rounded-2xl p-5 border-2 border-pink-200/40 shadow-lg hover:border-pink-200/60 transition-all">

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl">💰</span>
                        <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">Mejor en Ventas</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 shadow-lg overflow-hidden border-3 border-white/60">
                            {actionableMetrics.bestInSales.photo_url ?
                        <img src={actionableMetrics.bestInSales.photo_url} alt="" className="w-full h-full object-cover" /> :

                        <div className="w-full h-full flex items-center justify-center text-xl">💎</div>
                        }
                          </div>
                          <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 text-xl">

                            🥇
                          </motion.div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-pink-900 truncate">
                            {actionableMetrics.bestInSales.name?.split(' ').slice(0, 2).join(' ')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-2xl font-black text-pink-900 tracking-tight">
                          {formatCurrency(actionableMetrics.bestInSales.totalSales)}
                        </p>
                        <p className="text-xs text-pink-700 font-medium mt-1">
                          {actionableMetrics.bestInSales.daysWorked} turnos trabajados
                        </p>
                      </div>
                    </motion.div>
                }

                  {/* Mejor en Ticket */}
                  {actionableMetrics.bestInTicket &&
                <motion.div
                  whileHover={{ y: -5, scale: 1.03 }}
                  onClick={() => setSelectedCashier(actionableMetrics.bestInTicket)}
                  className="cursor-pointer bg-white/20 backdrop-blur-md rounded-2xl p-5 border-2 border-rose-200/40 shadow-lg hover:border-rose-200/60 transition-all">

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl">🎫</span>
                        <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">Mejor en Ticket</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 shadow-lg overflow-hidden border-3 border-white/60">
                            {actionableMetrics.bestInTicket.photo_url ?
                        <img src={actionableMetrics.bestInTicket.photo_url} alt="" className="w-full h-full object-cover" /> :

                        <div className="w-full h-full flex items-center justify-center text-xl">⭐</div>
                        }
                          </div>
                          <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        className="absolute -bottom-1 -right-1 text-xl">

                            🥈
                          </motion.div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-pink-900 truncate">
                            {actionableMetrics.bestInTicket.name?.split(' ').slice(0, 2).join(' ')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-2xl font-black text-pink-900 tracking-tight">
                          {formatCurrency(actionableMetrics.bestInTicket.avgTicket)}
                        </p>
                        <p className="text-xs text-pink-700 font-medium mt-1">
                          promedio por transacción
                        </p>
                      </div>
                    </motion.div>
                }

                  {/* Mejor en Transacciones */}
                  {actionableMetrics.bestInTransactions &&
                <motion.div
                  whileHover={{ y: -5, scale: 1.03 }}
                  onClick={() => setSelectedCashier(actionableMetrics.bestInTransactions)}
                  className="cursor-pointer bg-white/20 backdrop-blur-md rounded-2xl p-5 border-2 border-fuchsia-200/40 shadow-lg hover:border-fuchsia-200/60 transition-all">

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl">⚡</span>
                        <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">Más Transacciones</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-300 to-pink-400 shadow-lg overflow-hidden border-3 border-white/60">
                            {actionableMetrics.bestInTransactions.photo_url ?
                        <img src={actionableMetrics.bestInTransactions.photo_url} alt="" className="w-full h-full object-cover" /> :

                        <div className="w-full h-full flex items-center justify-center text-xl">🚀</div>
                        }
                          </div>
                          <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        className="absolute -bottom-1 -right-1 text-xl">

                            🥉
                          </motion.div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-pink-900 truncate">
                            {actionableMetrics.bestInTransactions.name?.split(' ').slice(0, 2).join(' ')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-2xl font-black text-pink-900 tracking-tight">
                          {actionableMetrics.bestInTransactions.totalTransactions.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-pink-700 font-medium mt-1">
                          transacciones totales
                        </p>
                      </div>
                    </motion.div>
                }
                </div>
              </div>
            </motion.div>

            {/* Ranking y Lista de Cajeros */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking visual con barras */}
              <div className="lg:col-span-1">
                <CashierRanking storeId={selectedStore} onSelectCashier={setSelectedCashier} dateRange={dateRange} />
              </div>

              {/* Detalle del Cajero */}
              <div className="lg:col-span-2" ref={analysisRef}>
                <AnimatePresence mode="wait">
                  {selectedCashier ?
                <motion.div
                  key={selectedCashier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4">

                      {/* Perfil Visual estilo Facebook */}
                      <CashierVisualProfile
                    cashier={selectedCashier}
                    storeCode={selectedStore}
                    shiftRecords={shiftRecords}
                    dateRange={dateRange}
                    teamAvg={{
                      avgSales: teamTotals.avgSales,
                      avgTicket: teamTotals.avgTicket
                    }} />


                      {/* Análisis detallado */}
                      <CashierAnalysis
                    cashierId={selectedCashier.id}
                    cashierName={selectedCashier.name}
                    storeId={selectedStore}
                    dateRange={dateRange} />


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
                           ${Math.round((cashierStats[selectedCashier.id]?.avgTicket || 0) / 1000)}K
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
                      storeId={selectedStore} />

                      </div>

                      {/* Metas personalizadas */}
                      <div className="mt-4">
                        <CashierGoalsManager
                      cashierId={selectedCashier.id}
                      cashierName={selectedCashier.name}
                      storeId={selectedStore}
                      shiftRecords={shiftRecords}
                      dateRange={dateRange} />

                      </div>

                      {/* Los logros y comparación ya están en el perfil visual */}
                    </motion.div> :

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-12 text-center">

                      <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl mb-4">

                        👤
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">Selecciona un cajero</h3>
                      <p className="text-gray-500 text-sm">Haz clic en un cajero de la lista para ver su análisis detallado</p>
                    </motion.div>
                }
                </AnimatePresence>
              </div>
            </div>

            {/* Sugerencia IA de Asignación */}
            <CashierAssignmentSuggestion
            storeId={selectedStore}
            cashiers={activeCashiers}
            shiftRecords={shiftRecords}
            dateRange={dateRange} />


            {/* Top 3 Highlight */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Top 3 del Período
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rankedCashiers.slice(0, 3).map((cashier, idx) =>
              <motion.div
                key={cashier.id}
                whileHover={{ scale: 1.03, y: -3 }}
                className="bg-white/15 backdrop-blur-sm rounded-xl p-4">

                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                          {cashier.photo_url ?
                      <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" /> :

                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      }
                        </div>
                        {cashier.photo_url &&
                    <div className="absolute -bottom-1 -right-1 text-sm">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </div>
                    }
                      </div>
                      <div>
                        <p className="font-bold">{cashier.name}</p>
                        <p className="text-xs text-white/70">{cashier.daysWorked} turnos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-lg font-bold">${Math.round(cashier.totalSales / 1000000)}M</p>
                        <p className="text-xs text-white/70">Ventas</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-lg font-bold">${Math.round(cashier.avgTicket / 1000)}K</p>
                        <p className="text-xs text-white/70">Ticket Prom</p>
                      </div>
                    </div>
                  </motion.div>
              )}
              </div>
            </motion.div>
          </div> :

        <div className="text-center py-20">
            <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-7xl mb-4">

              👥
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver el dashboard de cajeros</p>
          </div>
        }
      </div>

      {/* Modal de Configuración de Insignias */}
      <BadgeConfigManager
        storeId={selectedStore}
        isOpen={showBadgeConfig}
        onClose={() => setShowBadgeConfig(false)} />


      {/* Cashier Sales Modal */}
      <AnimatePresence>
        {showCashierSales &&
        <CashierSalesModal
          isOpen={showCashierSales}
          onClose={() => setShowCashierSales(false)}
          storeId={selectedStore} />

        }
      </AnimatePresence>

      {/* Modal Registrar Ventas */}
      <Suspense fallback={null}>
        {showSalesModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSalesModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-white/60"
            >
              <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 p-5 text-white text-center relative">
                <button onClick={() => setShowSalesModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                </motion.div>
                <h2 className="text-xl font-black">Registrar Ventas</h2>
              </div>

              <div className="flex border-b-2 border-pink-200/50 bg-gradient-to-r from-pink-50/50 to-violet-50/50 backdrop-blur-sm">
                <button
                  onClick={() => setSalesTab('tienda')}
                  className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                    salesTab === 'tienda' ? 'text-pink-600' : 'text-gray-500'
                  }`}
                >
                  🏪 Venta de Tienda
                  {salesTab === 'tienda' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-t-full" 
                    />
                  )}
                </button>
                <button
                  onClick={() => setSalesTab('cajero')}
                  className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                    salesTab === 'cajero' ? 'text-violet-600' : 'text-gray-500'
                  }`}
                >
                  👤 Venta de Cajero
                  {salesTab === 'cajero' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-full" 
                    />
                  )}
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {salesTab === 'tienda' ? (
                  <DailySalesForm storeId={selectedStore} onSuccess={() => setShowSalesModal(false)} />
                ) : (
                  <ShiftRecordForm storeId={selectedStore} onSuccess={() => setShowSalesModal(false)} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </Suspense>
    </div>);

}