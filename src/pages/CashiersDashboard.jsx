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
import GlobalPointsRanking from '@/components/gamification/GlobalPointsRanking';
import CashierVisualProfile from '@/components/cashier/CashierVisualProfile';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import CashierAnalysis from '@/components/cashier/CashierAnalysis';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import CashierRanking from '@/components/gamification/CashierRanking';
import CashierGoalsManager from '@/components/gamification/CashierGoalsManager';
import { ViewProfileButton } from '@/components/cashier/CashierFullProfile';
import CashierAssignmentSuggestion from '@/components/ai/CashierAssignmentSuggestion';
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
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
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
        avgTicket: totalTickets > 0 ? totalSales / totalTickets : 0,
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

  // Totales del equipo
  const teamTotals = useMemo(() => {
    const values = Object.values(cashierStats);
    const totalSales = values.reduce((sum, c) => sum + c.totalSales, 0);
    const totalSuggested = values.reduce((sum, c) => sum + c.totalSuggested, 0);
    return {
      totalSales,
      totalTickets: values.reduce((sum, c) => sum + c.totalTickets, 0),
      avgTicket: values.length > 0 ? values.reduce((sum, c) => sum + c.avgTicket, 0) / values.length : 0,
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
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

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
                <p className="text-xs text-gray-500">cajeros</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-pink-600">Ventas Equipo</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700">${(teamTotals.totalSales/1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500">este período</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-pink-600">Tickets Totales</span>
                </div>
                <p className="text-3xl font-semibold text-gray-700">{teamTotals.totalTickets.toLocaleString()}</p>
                <p className="text-xs text-gray-500">facturados</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-pink-600">Ticket Prom.</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700">${Math.round(teamTotals.avgTicket/1000)}K</p>
                <p className="text-xs text-gray-500">promedio equipo</p>
              </motion.div>
            </div>

            {/* Ranking y Lista de Cajeros */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking visual con barras */}
              <div className="lg:col-span-1 space-y-4">
                <CashierRanking storeId={selectedStore} onSelectCashier={setSelectedCashier} />
                {/* Ranking Global de Puntos */}
                <GlobalPointsRanking storeId={selectedStore} cashiers={activeCashiers} limit={5} />
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

                      {/* Stats adicionales */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Ventas Totales</p>
                          <p className="text-lg font-black text-emerald-600">
                            ${((selectedCashier.totalSales || 0)/1000000).toFixed(2)}M
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Tickets</p>
                          <p className="text-lg font-black text-blue-600">
                            {(selectedCashier.totalTickets || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Ticket Prom.</p>
                          <p className="text-lg font-black text-purple-600">
                            ${((selectedCashier.avgTicket || 0)/1000).toFixed(0)}K
                          </p>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">Sugeridos</p>
                          <p className="text-lg font-black text-pink-600">
                            {selectedCashier.totalSuggested || 0}
                          </p>
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
                        <p className="text-lg font-bold">${(cashier.totalSales/1000000).toFixed(1)}M</p>
                        <p className="text-xs text-white/70">Ventas</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-lg font-bold">${(cashier.avgTicket/1000).toFixed(0)}K</p>
                        <p className="text-xs text-white/70">Ticket</p>
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
    </div>
  );
}