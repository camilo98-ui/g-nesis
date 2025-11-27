import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import CashierProfile from '@/components/cashier/CashierProfile';
import AnimatedIcon from '@/components/AnimatedIcon';
import { ArrowLeft, Search, User, UserCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { startOfMonth } from 'date-fns';

export default function SearchCashier() {
  const [selectedStore, setSelectedStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  // Get cashierId from URL if coming from quick search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cashierId = params.get('cashierId');
    if (cashierId) {
      // Will be set when cashiers load
      setCashierIdFromUrl(cashierId);
    }
  }, [location]);

  const [cashierIdFromUrl, setCashierIdFromUrl] = useState(null);

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

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.list()
  });

  // Set cashier from URL after loading
  useEffect(() => {
    if (cashierIdFromUrl && (cashiers.length > 0 || allCashiers.length > 0)) {
      const cashier = cashiers.find(c => c.id === cashierIdFromUrl) || allCashiers.find(c => c.id === cashierIdFromUrl);
      if (cashier) {
        setSelectedCashier(cashier);
        if (cashier.store_id && !selectedStore) {
          setSelectedStore(cashier.store_id);
          localStorage.setItem('selectedStore', cashier.store_id);
        }
      }
    }
  }, [cashierIdFromUrl, cashiers, allCashiers, selectedStore]);

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Filter cashiers by search
  const filteredCashiers = useMemo(() => {
    const cashierList = selectedStore ? cashiers : allCashiers;
    if (!searchTerm) return cashierList;
    return cashierList.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cashiers, allCashiers, searchTerm, selectedStore]);

  // Calculate stats for selected cashier
  const cashierStats = useMemo(() => {
    if (!selectedCashier) return null;

    const records = shiftRecords.filter(r => {
      const date = new Date(r.date);
      return r.cashier_id === selectedCashier.id && 
             date >= dateRange.from && 
             date <= dateRange.to;
    });

    const stats = records.reduce((acc, r) => ({
      totalSales: acc.totalSales + (r.sales || 0),
      totalTickets: acc.totalTickets + (r.tickets || 0),
      totalTransactions: acc.totalTransactions + (r.transactions || 0),
      totalSuggested: acc.totalSuggested + (r.suggested_sales || 0),
      shiftsCount: acc.shiftsCount + 1
    }), { totalSales: 0, totalTickets: 0, totalTransactions: 0, totalSuggested: 0, shiftsCount: 0 });

    // Calculate rankings
    const allStats = {};
    shiftRecords.forEach(r => {
      const date = new Date(r.date);
      if (date >= dateRange.from && date <= dateRange.to) {
        if (!allStats[r.cashier_id]) {
          allStats[r.cashier_id] = { sales: 0, suggested: 0 };
        }
        allStats[r.cashier_id].sales += r.sales || 0;
        allStats[r.cashier_id].suggested += r.suggested_sales || 0;
      }
    });

    const salesRankings = Object.entries(allStats)
      .sort(([, a], [, b]) => b.sales - a.sales)
      .map(([id], i) => ({ id, rank: i + 1 }));
    
    const suggestedRankings = Object.entries(allStats)
      .sort(([, a], [, b]) => b.suggested - a.suggested)
      .map(([id], i) => ({ id, rank: i + 1 }));

    return {
      ...stats,
      salesRank: salesRankings.find(r => r.id === selectedCashier.id)?.rank || cashiers.length,
      suggestedRank: suggestedRankings.find(r => r.id === selectedCashier.id)?.rank || cashiers.length
    };
  }, [selectedCashier, shiftRecords, dateRange, cashiers]);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/30 to-purple-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-fuchsia-100">
                <ArrowLeft className="w-5 h-5 text-fuchsia-600" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <AnimatedIcon icon={Search} color="blue" size="md" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-800">Buscar Cajero</h1>
                {selectedStore && (
                  <p className="text-sm text-fuchsia-600/70">{selectedStore} - {selectedStoreName}</p>
                )}
              </div>
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fuchsia-400" />
            <Input
              placeholder="Buscar por nombre del cajero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-lg bg-white/80 backdrop-blur-sm border-fuchsia-200 focus:ring-fuchsia-500 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cashier List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-fuchsia-600/70 mb-3 flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              {selectedStore ? 'Cajeros de la tienda' : 'Todos los cajeros'} ({filteredCashiers.length})
            </h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {filteredCashiers.map((cashier, index) => (
                  <motion.div
                    key={cashier.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedCashier?.id === cashier.id
                          ? 'ring-2 ring-fuchsia-500 bg-fuchsia-50 border-fuchsia-200'
                          : 'bg-white/80 border-fuchsia-100 hover:border-fuchsia-200'
                      }`}
                      onClick={() => setSelectedCashier(cashier)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <motion.div 
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedCashier?.id === cashier.id
                              ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white'
                              : 'bg-gradient-to-br from-fuchsia-100 to-pink-100 text-fuchsia-600'
                          }`}
                        >
                          <User className="w-5 h-5" />
                        </motion.div>
                        <div>
                          <p className="font-medium text-gray-800">{cashier.name}</p>
                          <p className="text-xs text-gray-400">
                            {STORES.find(s => s.code === cashier.store_id)?.code || cashier.store_id}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredCashiers.length === 0 && (
                <div className="text-center py-8 text-fuchsia-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron cajeros</p>
                </div>
              )}
            </div>
          </div>

          {/* Cashier Profile */}
          <div className="lg:col-span-2">
            {selectedCashier && cashierStats ? (
              <div className="space-y-4">
                <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
                <CashierProfile cashier={selectedCashier} stats={cashierStats} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white/50 rounded-2xl border border-dashed border-fuchsia-200 min-h-[400px]">
                <div className="text-center text-fuchsia-400">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-4"
                  >
                    👤
                  </motion.div>
                  <p className="text-lg font-medium">Selecciona un cajero</p>
                  <p className="text-sm">Para ver su información y estadísticas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}