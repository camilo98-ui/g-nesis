import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import CashierRankingCard from '@/components/ranking/CashierRankingCard';
import CashierRecommendation from '@/components/CashierRecommendation';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, Award, Gift, Trophy, Star, Receipt } from 'lucide-react';
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

    return { salesRanking, suggestedRanking, ticketRanking };
  }, [filteredRecords, cashiers]);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">Rankings</h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {/* Date Filter */}
        {selectedStore && (
          <div className="mb-6">
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        )}

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-white border border-gray-100 p-1 rounded-xl mb-6 grid grid-cols-3 shadow-sm">
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Top</span> Ventas
                </TabsTrigger>
                <TabsTrigger 
                  value="ticket" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Top</span> Ticket
                </TabsTrigger>
                <TabsTrigger 
                  value="suggested" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg"
                >
                  <Star className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Top</span> Sugeridos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-3">
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

              <TabsContent value="ticket" className="space-y-3">
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

              <TabsContent value="suggested" className="space-y-3">
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
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🏆
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver los rankings de cajeros</p>
          </div>
        )}
      </div>
    </div>
  );
}