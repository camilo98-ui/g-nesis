import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import WeekFilter from '@/components/WeekFilter';
import CashierRankingCard from '@/components/ranking/CashierRankingCard';
import CashierRecommendation from '@/components/CashierRecommendation';
import TrendChart from '@/components/ranking/TrendChart';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, Award, Gift, Trophy, Star, Receipt, TrendingUp, Globe, X, Medal, Search, Crown, Sparkles, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { startOfMonth } from 'date-fns';

export default function Rankings() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState('sales');
  const [showGlobal, setShowGlobal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalStoreFilter, setGlobalStoreFilter] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
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

  // Datos globales - todos los cajeros y registros
  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.list(),
    enabled: showGlobal
  });

  const { data: allShiftRecords = [] } = useQuery({
    queryKey: ['allShiftRecords'],
    queryFn: () => base44.entities.ShiftRecord.list(),
    enabled: showGlobal
  });

  // Filter records by date range
  const filteredRecords = useMemo(() => {
    return shiftRecords.filter(r => {
      const date = new Date(r.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [shiftRecords, dateRange]);

  // Calculate rankings
  const rankings = useMemo(() => {
    const cashierStats = {};

    filteredRecords.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = {
          cashier_id: record.cashier_id,
          totalSales: 0,
          totalTickets: 0,
          totalTransactions: 0,
          totalSuggested: 0,
          shifts: 0
        };
      }
      cashierStats[record.cashier_id].totalSales += record.sales || 0;
      cashierStats[record.cashier_id].totalTickets += record.tickets || 0;
      cashierStats[record.cashier_id].totalTransactions += record.transactions || 0;
      cashierStats[record.cashier_id].totalSuggested += record.suggested_sales || 0;
      cashierStats[record.cashier_id].shifts += 1;
    });

    // Calculate average ticket
    Object.values(cashierStats).forEach(stats => {
      stats.avgTicket = stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0;
    });

    // Sort by sales
    const salesRanking = Object.values(cashierStats)
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: cashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' }
      }));

    // Sort by suggested
    const suggestedRanking = Object.values(cashierStats)
      .sort((a, b) => b.totalSuggested - a.totalSuggested)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: cashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' }
      }));

    // Sort by average ticket
    const ticketRanking = Object.values(cashierStats)
      .filter(s => s.totalTickets > 0)
      .sort((a, b) => b.avgTicket - a.avgTicket)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: cashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' }
      }));

    // Best cashier of the store
    const maxSales = Math.max(...Object.values(cashierStats).map(s => s.totalSales), 1);
    const maxTicket = Math.max(...Object.values(cashierStats).filter(s => s.totalTickets > 0).map(s => s.totalSales / s.totalTickets), 1);
    const maxSuggested = Math.max(...Object.values(cashierStats).map(s => s.totalSuggested), 1);

    const bestCashier = Object.values(cashierStats)
      .filter(s => s.totalTickets > 0)
      .map(stats => {
        const salesScore = (stats.totalSales / maxSales) * 33;
        const ticketScore = ((stats.totalSales / stats.totalTickets) / maxTicket) * 33;
        const suggestedScore = (stats.totalSuggested / maxSuggested) * 34;
        const overallScore = salesScore + ticketScore + suggestedScore;
        return { ...stats, overallScore, salesScore, ticketScore, suggestedScore };
      })
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: cashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' }
      }));

    return { salesRanking, suggestedRanking, ticketRanking, bestCashier };
  }, [filteredRecords, cashiers]);

  // Rankings globales
  const globalRankings = useMemo(() => {
    if (!showGlobal) return { salesRanking: [], ticketRanking: [], transactionsRanking: [] };
    
    const globalFiltered = allShiftRecords.filter(r => {
      const date = new Date(r.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const cashierStats = {};
    globalFiltered.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = {
          cashier_id: record.cashier_id,
          store_id: record.store_id,
          totalSales: 0,
          totalTickets: 0,
          totalTransactions: 0,
          totalSuggested: 0,
          shifts: 0
        };
      }
      cashierStats[record.cashier_id].totalSales += record.sales || 0;
      cashierStats[record.cashier_id].totalTickets += record.tickets || 0;
      cashierStats[record.cashier_id].totalTransactions += record.transactions || 0;
      cashierStats[record.cashier_id].totalSuggested += record.suggested_sales || 0;
      cashierStats[record.cashier_id].shifts += 1;
    });

    Object.values(cashierStats).forEach(stats => {
      stats.avgTicket = stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0;
    });

    const salesRanking = Object.values(cashierStats)
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id
      }));

    const ticketRanking = Object.values(cashierStats)
      .filter(s => s.totalTickets > 0)
      .sort((a, b) => b.avgTicket - a.avgTicket)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id
      }));

    const transactionsRanking = Object.values(cashierStats)
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id
      }));

    const suggestedRanking = Object.values(cashierStats)
      .sort((a, b) => b.totalSuggested - a.totalSuggested)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id
      }));

    // Best overall cashier - normalize and combine scores
    const maxSales = Math.max(...Object.values(cashierStats).map(s => s.totalSales), 1);
    const maxTransactions = Math.max(...Object.values(cashierStats).map(s => s.totalTransactions), 1);
    const maxTicket = Math.max(...Object.values(cashierStats).map(s => s.avgTicket), 1);
    const maxSuggested = Math.max(...Object.values(cashierStats).map(s => s.totalSuggested), 1);

    const bestOverallRanking = Object.values(cashierStats)
      .map(stats => {
        const salesScore = (stats.totalSales / maxSales) * 25;
        const transactionsScore = (stats.totalTransactions / maxTransactions) * 25;
        const ticketScore = (stats.avgTicket / maxTicket) * 25;
        const suggestedScore = (stats.totalSuggested / maxSuggested) * 25;
        const overallScore = salesScore + transactionsScore + ticketScore + suggestedScore;
        return { ...stats, overallScore, salesScore, transactionsScore, ticketScore, suggestedScore };
      })
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id
      }));

    return { salesRanking, ticketRanking, transactionsRanking, suggestedRanking, bestOverallRanking };
  }, [showGlobal, allShiftRecords, allCashiers, dateRange]);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  
  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(v);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-amber-50/40 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <motion.div whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100/80 bg-white/50 shadow-sm">
                  <ArrowLeft className="w-5 h-5 text-pink-600" />
                </Button>
              </motion.div>
            </Link>
            <div>
              <motion.h1 
                className="text-2xl md:text-3xl font-bold flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {'PopsyStars'.split('').map((letter, i) => (
                  <motion.span
                    key={i}
                    animate={{ 
                      y: [0, -6, 0],
                      rotate: [0, i % 2 === 0 ? 5 : -5, 0]
                    }}
                    transition={{ duration: 0.6, delay: i * 0.08, repeat: Infinity, repeatDelay: 3 }}
                    className={`${i >= 5 ? 'text-amber-500' : 'text-pink-500'} drop-shadow-sm`}
                    style={{ textShadow: '0 2px 4px rgba(236, 72, 153, 0.2)' }}
                  >
                    {letter}
                  </motion.span>
                ))}
                <motion.span
                  animate={{ 
                    rotate: [0, 20, -20, 10, -10, 0], 
                    scale: [1, 1.3, 1.1, 1.2, 1],
                    y: [0, -5, 0, -3, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  className="ml-2"
                >
                  ⭐
                </motion.span>
              </motion.h1>
              {selectedStore && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-pink-400 font-medium"
                >
                  {selectedStore} - {selectedStoreName}
                </motion.p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {/* Date Filter & Global Button */}
        {selectedStore && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowGlobal(true)}
                className="bg-gradient-to-r from-pink-200 to-rose-300 text-rose-700 hover:from-pink-300 hover:to-rose-400 shadow-lg shadow-pink-200/50 gap-2 border border-pink-100"
              >
                <Globe className="w-4 h-4" />
                Ranking Global
              </Button>
            </motion.div>
          </div>
        )}

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Best Cashier of Store */}
            {rankings.bestCashier?.[0] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-4 border border-amber-200"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg"
                  >
                    <Crown className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-xs text-amber-600 font-medium">⭐ Mejor Cajero de la Tienda</p>
                    <p className="text-xl font-bold text-gray-800">{rankings.bestCashier[0].cashier?.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Ventas: {rankings.bestCashier[0].salesScore?.toFixed(0)}pts</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ticket: {rankings.bestCashier[0].ticketScore?.toFixed(0)}pts</span>
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Sugeridos: {rankings.bestCashier[0].suggestedScore?.toFixed(0)}pts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{rankings.bestCashier[0].overallScore?.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">puntos totales</p>
                  </div>
                </div>
              </motion.div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-white border border-gray-100 p-1 rounded-xl mb-6 grid grid-cols-4 shadow-sm">
                <TabsTrigger 
                  value="best" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-lg"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Mejor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-400 data-[state=active]:text-white rounded-lg"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Ventas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ticket" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-400 data-[state=active]:to-blue-400 data-[state=active]:text-white rounded-lg"
                >
                  <Receipt className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Ticket</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="suggested" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-400 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg"
                >
                  <Star className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Sugeridos</span>
                </TabsTrigger>
              </TabsList>

              {/* Best Cashier Tab */}
              <TabsContent value="best" className="space-y-4">
                {rankings.bestCashier?.length > 0 ? (
                  rankings.bestCashier.map((item, index) => (
                    <motion.div
                      key={item.cashier_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        index === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' :
                        index <= 2 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' :
                        'bg-white border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index <= 2 ? <Crown className="w-5 h-5" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{item.cashier?.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Ventas: {item.salesScore?.toFixed(0)}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ticket: {item.ticketScore?.toFixed(0)}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sugeridos: {item.suggestedScore?.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-600">{item.overallScore?.toFixed(0)}</p>
                          <p className="text-xs text-gray-400">puntos</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No hay registros en el período seleccionado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                {/* Trend Chart */}
                <TrendChart 
                  shiftRecords={filteredRecords}
                  cashiers={cashiers}
                  dateRange={dateRange}
                  metricType="sales"
                />
                
                {rankings.salesRanking.length > 0 ? (
                  rankings.salesRanking.map((item, index) => (
                    <CashierRankingCard
                      key={item.cashier_id}
                      cashier={item.cashier}
                      rank={item.rank}
                      sales={item.totalSales}
                      tickets={item.totalTickets}
                      transactions={item.totalTransactions}
                      suggestedSales={item.totalSuggested}
                      rankType="sales"
                      delay={index * 0.05}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No hay registros en el período seleccionado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ticket" className="space-y-4">
                {/* Trend Chart */}
                <TrendChart 
                  shiftRecords={filteredRecords}
                  cashiers={cashiers}
                  dateRange={dateRange}
                  metricType="ticket"
                />
                
                {rankings.ticketRanking.length > 0 ? (
                  rankings.ticketRanking.map((item, index) => (
                    <CashierRankingCard
                      key={item.cashier_id}
                      cashier={item.cashier}
                      rank={item.rank}
                      sales={item.totalSales}
                      tickets={item.totalTickets}
                      transactions={item.totalTransactions}
                      suggestedSales={item.totalSuggested}
                      avgTicket={item.avgTicket}
                      rankType="ticket"
                      delay={index * 0.05}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No hay registros en el período seleccionado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggested" className="space-y-4">
                {/* Trend Chart for Transactions (as proxy for activity) */}
                <TrendChart 
                  shiftRecords={filteredRecords}
                  cashiers={cashiers}
                  dateRange={dateRange}
                  metricType="transactions"
                />
                
                {rankings.suggestedRanking.length > 0 ? (
                  rankings.suggestedRanking.map((item, index) => (
                    <CashierRankingCard
                      key={item.cashier_id}
                      cashier={item.cashier}
                      rank={item.rank}
                      sales={item.totalSales}
                      tickets={item.totalTickets}
                      transactions={item.totalTransactions}
                      suggestedSales={item.totalSuggested}
                      rankType="suggested"
                      delay={index * 0.05}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No hay registros en el período seleccionado</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Recommendations */}
            <CashierRecommendation 
              cashiers={cashiers} 
              shiftRecords={shiftRecords}
              selectedDate={new Date()}
            />
          </motion.div>
        ) : null}

        {/* Global Rankings Modal */}
        <AnimatePresence>
          {showGlobal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowGlobal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Globe className="w-8 h-8" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold">Ranking Global</h2>
                        <p className="text-white/80 text-sm">Todos los cajeros de todas las tiendas</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowGlobal(false)} className="text-white hover:bg-white/20 rounded-full">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-5 pt-4 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar cajero..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 focus:border-purple-400"
                    />
                  </div>
                  <select
                    value={globalStoreFilter}
                    onChange={(e) => setGlobalStoreFilter(e.target.value)}
                    className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Todas las tiendas</option>
                    {STORES.map(store => (
                      <option key={store.code} value={store.code}>{store.code} - {store.name}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                  <Tabs defaultValue="best" className="w-full">
                    <TabsList className="w-full grid grid-cols-5 mb-6 bg-gray-50 p-1 rounded-xl">
                      <TabsTrigger value="best" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-300 data-[state=active]:to-purple-400 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                        <Crown className="w-3 h-3" />
                        <span className="hidden sm:inline">Mejor</span>
                      </TabsTrigger>
                      <TabsTrigger value="sales" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300 data-[state=active]:to-teal-400 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                        <Trophy className="w-3 h-3" />
                        <span className="hidden sm:inline">Ventas</span>
                      </TabsTrigger>
                      <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-300 data-[state=active]:to-blue-400 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                        <Receipt className="w-3 h-3" />
                        <span className="hidden sm:inline">Trans.</span>
                      </TabsTrigger>
                      <TabsTrigger value="ticket" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-300 data-[state=active]:to-yellow-400 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        <span className="hidden sm:inline">Ticket</span>
                      </TabsTrigger>
                      <TabsTrigger value="suggested" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-300 data-[state=active]:to-rose-400 data-[state=active]:text-white rounded-lg gap-1 text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">Sugeridos</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Mejor Cajero Overall */}
                    <TabsContent value="best" className="space-y-3">
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 mb-4">
                        <p className="text-xs text-purple-700 text-center">
                          🏆 Ranking basado en promedio de: Ventas (25%) + Transacciones (25%) + Ticket Promedio (25%) + Sugeridos (25%)
                        </p>
                      </div>
                      {globalRankings.bestOverallRanking
                        ?.filter(item => (!globalSearch || item.cashier?.name?.toLowerCase().includes(globalSearch.toLowerCase())) && (!globalStoreFilter || item.store_id === globalStoreFilter))
                        .map((item, idx) => (
                        <motion.div
                          key={item.cashier_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            item.rank <= 3 
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
                              : 'bg-white border-gray-100'
                          }`}
                        >
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                              item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                              item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              item.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            #{item.rank}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.cashier?.name}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {item.storeName}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">V:{item.salesScore?.toFixed(0)}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">T:{item.transactionsScore?.toFixed(0)}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TK:{item.ticketScore?.toFixed(0)}</span>
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">S:{item.suggestedScore?.toFixed(0)}</span>
                            </div>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-purple-600">{item.overallScore?.toFixed(1)} pts</p>
                            <p className="text-xs text-gray-400">{item.shifts} turnos</p>
                          </div>
                          <Link to={createPageUrl(`CashierProfile?id=${item.cashier_id}`)}>
                            <Button variant="ghost" size="icon" className="hover:bg-purple-50">
                              <Eye className="w-4 h-4 text-purple-500" />
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                    </TabsContent>

                    {/* Ventas */}
                    <TabsContent value="sales" className="space-y-3">
                      {globalRankings.salesRanking
                        ?.filter(item => (!globalSearch || item.cashier?.name?.toLowerCase().includes(globalSearch.toLowerCase())) && (!globalStoreFilter || item.store_id === globalStoreFilter))
                        .map((item, idx) => (
                        <motion.div
                          key={item.cashier_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            item.rank <= 3 
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' 
                              : 'bg-white border-gray-100'
                          }`}
                        >
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                              item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                              item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              item.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            #{item.rank}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.cashier?.name}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {item.storeName}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-emerald-600">{formatCurrency(item.totalSales)}</p>
                            <p className="text-xs text-gray-400">{item.shifts} turnos</p>
                          </div>
                          <Link to={createPageUrl(`CashierProfile?id=${item.cashier_id}`)}>
                            <Button variant="ghost" size="icon" className="hover:bg-emerald-50">
                              <Eye className="w-4 h-4 text-emerald-500" />
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                    </TabsContent>

                    {/* Transacciones */}
                    <TabsContent value="transactions" className="space-y-3">
                      {globalRankings.transactionsRanking
                        ?.filter(item => (!globalSearch || item.cashier?.name?.toLowerCase().includes(globalSearch.toLowerCase())) && (!globalStoreFilter || item.store_id === globalStoreFilter))
                        .map((item, idx) => (
                        <motion.div
                          key={item.cashier_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            item.rank <= 3 
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' 
                              : 'bg-white border-gray-100'
                          }`}
                        >
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                              item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                              item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              item.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            #{item.rank}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.cashier?.name}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {item.storeName}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-blue-600">{item.totalTransactions.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">transacciones</p>
                          </div>
                          <Link to={createPageUrl(`CashierProfile?id=${item.cashier_id}`)}>
                            <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                    </TabsContent>

                    {/* Ticket Promedio */}
                    <TabsContent value="ticket" className="space-y-3">
                      {globalRankings.ticketRanking
                        ?.filter(item => (!globalSearch || item.cashier?.name?.toLowerCase().includes(globalSearch.toLowerCase())) && (!globalStoreFilter || item.store_id === globalStoreFilter))
                        .map((item, idx) => (
                        <motion.div
                          key={item.cashier_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            item.rank <= 3 
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                              : 'bg-white border-gray-100'
                          }`}
                        >
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                              item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                              item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              item.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            #{item.rank}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.cashier?.name}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {item.storeName}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-amber-600">{formatCurrency(item.avgTicket)}</p>
                            <p className="text-xs text-gray-400">{item.totalTickets} tickets</p>
                          </div>
                          <Link to={createPageUrl(`CashierProfile?id=${item.cashier_id}`)}>
                            <Button variant="ghost" size="icon" className="hover:bg-amber-50">
                              <Eye className="w-4 h-4 text-amber-500" />
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                    </TabsContent>

                    {/* Sugeridos */}
                    <TabsContent value="suggested" className="space-y-3">
                      {globalRankings.suggestedRanking
                        ?.filter(item => (!globalSearch || item.cashier?.name?.toLowerCase().includes(globalSearch.toLowerCase())) && (!globalStoreFilter || item.store_id === globalStoreFilter))
                        .map((item, idx) => (
                        <motion.div
                          key={item.cashier_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            item.rank <= 3 
                              ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200' 
                              : 'bg-white border-gray-100'
                          }`}
                        >
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                              item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                              item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              item.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                              'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            #{item.rank}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.cashier?.name}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {item.storeName}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-rose-600">{item.totalSuggested?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">sugeridos</p>
                          </div>
                          <Link to={createPageUrl(`CashierProfile?id=${item.cashier_id}`)}>
                            <Button variant="ghost" size="icon" className="hover:bg-rose-50">
                              <Eye className="w-4 h-4 text-rose-500" />
                            </Button>
                          </Link>
                        </motion.div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t text-center">
                  <p className="text-sm text-gray-500">
                    🏆 Mostrando todos los {globalRankings.salesRanking?.length || 0} cajeros de todas las tiendas
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedStore && (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🏆
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400 mb-6">Para ver los rankings de cajeros</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowGlobal(true)}
                className="bg-gradient-to-r from-pink-200 to-rose-300 text-rose-700 hover:from-pink-300 hover:to-rose-400 shadow-lg shadow-pink-200/50 gap-2 border border-pink-100"
              >
                <Globe className="w-4 h-4" />
                Ver Ranking Global
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}