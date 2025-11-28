import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, DollarSign, Receipt, Gift, Award, TrendingUp, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SmartSearch({ storeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState(null);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const filteredCashiers = useMemo(() => {
    if (!searchTerm) return cashiers.slice(0, 5);
    return cashiers.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cashiers, searchTerm]);

  // Calcular estadísticas del cajero seleccionado
  const cashierStats = useMemo(() => {
    if (!selectedCashier) return null;
    
    const monthStart = startOfMonth(new Date());
    const records = shiftRecords.filter(r => 
      r.cashier_id === selectedCashier.id && new Date(r.date) >= monthStart
    );

    const totals = records.reduce((acc, r) => ({
      sales: acc.sales + (r.sales || 0),
      tickets: acc.tickets + (r.tickets || 0),
      transactions: acc.transactions + (r.transactions || 0),
      suggested: acc.suggested + (r.suggested_sales || 0),
      shifts: acc.shifts + 1
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0, shifts: 0 });

    // Ranking
    const allCashierStats = {};
    shiftRecords.filter(r => new Date(r.date) >= monthStart).forEach(r => {
      if (!allCashierStats[r.cashier_id]) {
        allCashierStats[r.cashier_id] = { sales: 0 };
      }
      allCashierStats[r.cashier_id].sales += r.sales || 0;
    });

    const sortedCashiers = Object.entries(allCashierStats)
      .sort(([,a], [,b]) => b.sales - a.sales);
    
    const rank = sortedCashiers.findIndex(([id]) => id === selectedCashier.id) + 1;

    return {
      ...totals,
      avgTicket: totals.tickets > 0 ? totals.sales / totals.tickets : 0,
      rank,
      totalCashiers: sortedCashiers.length
    };
  }, [selectedCashier, shiftRecords]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(v);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedCashier(null);
    setSearchTerm('');
  };

  return (
    <>
      {/* Search Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-full shadow-sm hover:shadow-md hover:border-pink-300 transition-all"
      >
        <Search className="w-4 h-4 text-pink-500" />
        <span className="text-sm text-gray-500 hidden md:inline">Buscar cajero...</span>
      </motion.button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-pink-500" />
                  <Input
                    placeholder="Buscar cajero por nombre..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedCashier(null);
                    }}
                    className="border-0 focus-visible:ring-0 text-lg"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Results or Profile */}
              <div className="max-h-96 overflow-y-auto">
                {selectedCashier ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4"
                  >
                    {/* Cashier Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div 
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                      >
                        {selectedCashier.name?.charAt(0)?.toUpperCase()}
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedCashier.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Desde {selectedCashier.hire_date ? format(new Date(selectedCashier.hire_date), 'MMM yyyy', { locale: es }) : 'N/A'}
                        </p>
                        {cashierStats?.rank && (
                          <div className="flex items-center gap-1 mt-1">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-600">
                              Rank #{cashierStats.rank} de {cashierStats.totalCashiers}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {cashierStats && (
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs text-gray-500">Ventas del Mes</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-700">{formatCurrency(cashierStats.sales)}</p>
                        </motion.div>

                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-500">Tickets</span>
                          </div>
                          <p className="text-lg font-bold text-blue-700">{cashierStats.tickets}</p>
                        </motion.div>

                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-gray-500">Ticket Promedio</span>
                          </div>
                          <p className="text-lg font-bold text-amber-700">{formatCurrency(cashierStats.avgTicket)}</p>
                        </motion.div>

                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="w-4 h-4 text-pink-600" />
                            <span className="text-xs text-gray-500">Sugeridos</span>
                          </div>
                          <p className="text-lg font-bold text-pink-700">{cashierStats.suggested}</p>
                        </motion.div>
                      </div>
                    )}

                    {/* Shifts info */}
                    {cashierStats && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm text-gray-600">
                          <span className="font-bold text-gray-800">{cashierStats.shifts}</span> turnos trabajados este mes
                        </p>
                      </div>
                    )}

                    {/* Back button */}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-pink-600"
                      onClick={() => setSelectedCashier(null)}
                    >
                      ← Buscar otro cajero
                    </Button>
                  </motion.div>
                ) : (
                  <div className="p-2">
                    {filteredCashiers.length > 0 ? (
                      filteredCashiers.map((cashier, i) => (
                        <motion.button
                          key={cashier.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedCashier(cashier)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white font-bold">
                            {cashier.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{cashier.name}</p>
                            <p className="text-xs text-gray-400">
                              {cashier.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                            </p>
                          </div>
                          <User className="w-4 h-4 text-gray-300 ml-auto" />
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No se encontraron cajeros</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}