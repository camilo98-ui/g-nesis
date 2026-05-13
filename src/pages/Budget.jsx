import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import BudgetForm from '@/components/forms/BudgetForm';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, Target, DollarSign, Receipt, Zap, Gift, Calendar, Pencil, Trash2, Search, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Budget() {
  const [selectedStore, setSelectedStore] = useState('');
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: async () => {
      // Intentar con el código actual
      let results = await base44.entities.Budget.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.Budget.filter({ store_id: oldCode });
      }
      return results;
    },
    enabled: !!selectedStore
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['dailyBudgets', selectedStore],
    queryFn: async () => {
      // Intentar con el código actual
      let results = await base44.entities.DailyBudget.filter({ store_id: selectedStore });
      // Si no hay resultados, intentar con código antiguo (BOGOTA)
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.DailyBudget.filter({ store_id: oldCode });
      }
      return results;
    },
    enabled: !!selectedStore
  });

  const { data: salesData = [] } = useQuery({
    queryKey: ['salesData', selectedStore],
    queryFn: async () => {
      let results = await base44.entities.DailySales.filter({ store_id: selectedStore }).catch(() => []);
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.DailySales.filter({ store_id: oldCode }).catch(() => []);
      }
      return results.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    enabled: !!selectedStore
  });

  const { data: allStoresData = [] } = useQuery({
    queryKey: ['allStoresComparative'],
    queryFn: async () => {
      const storePromises = STORES.map(async (store) => {
        try {
          const sales = await base44.entities.DailySales.filter({ store_id: store.code }).catch(() => []);
          const last30Days = sales.slice(-30);
          const avgDaily = last30Days.reduce((sum, s) => sum + (s.total_sales || 0), 0) / (last30Days.length || 1);
          const avgTickets = last30Days.reduce((sum, s) => sum + (s.total_tickets || 0), 0) / (last30Days.length || 1);
          const avgTransactions = last30Days.reduce((sum, s) => sum + (s.total_transactions || 0), 0) / (last30Days.length || 1);
          return { storeName: store.name, storeCode: store.code, avgDaily, avgTickets, avgTransactions };
        } catch {
          return null;
        }
      });
      const results = await Promise.all(storePromises);
      return results.filter(Boolean).sort((a, b) => b.avgDaily - a.avgDaily);
    }
  });

  const selectedDailyBudget = dailyBudgets.find(db => {
    const dbDate = db.date?.split('T')[0] || db.date;
    return dbDate === selectedDate;
  });

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Sort budgets by year and month
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

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
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">Presupuestos</h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {/* Comparative Benchmark - All Stores */}
            {allStoresData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800 border-indigo-700 shadow-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-white text-lg">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      Ranking de Tiendas - Promedio Últimos 30 Días
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={allStoresData} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                        <defs>
                          <linearGradient id="gradVentas" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="storeName" 
                          stroke="#9ca3af"
                          tick={{ fontSize: 11 }}
                          width={100}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #4f46e5',
                            borderRadius: '8px',
                            color: '#f3f4f6'
                          }}
                          formatter={(value) => `$${(value / 1000000).toFixed(2)}M`}
                        />
                        <Bar 
                          dataKey="avgDaily" 
                          fill="url(#gradVentas)"
                          radius={[8, 8, 0, 0]}
                          name="Venta Diaria Promedio"
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Store Rankings Table */}
                    <div className="mt-6 space-y-2">
                      {allStoresData.map((store, idx) => {
                        const isSelected = store.storeCode === selectedStore;
                        const topColor = idx === 0 ? 'from-amber-500/20 to-amber-600/10 border-amber-500/50' : idx === 1 ? 'from-slate-500/20 to-slate-600/10 border-slate-500/50' : idx === 2 ? 'from-orange-500/20 to-orange-600/10 border-orange-500/50' : 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/30';
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                        return (
                          <motion.div 
                            key={store.storeCode}
                            className={`bg-gradient-to-r ${topColor} border rounded-xl p-3 flex items-center justify-between ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{medal}</span>
                              <div>
                                <p className="text-white font-semibold">{store.storeName}</p>
                                <p className="text-gray-400 text-xs">{store.storeCode}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-right">
                              <div>
                                <p className="text-indigo-300 text-xs">Venta/día</p>
                                <p className="text-white font-bold">${(store.avgDaily / 1000000).toFixed(2)}M</p>
                              </div>
                              <div>
                                <p className="text-purple-300 text-xs">Tickets/día</p>
                                <p className="text-white font-bold">{Math.round(store.avgTickets)}</p>
                              </div>
                              <div>
                                <p className="text-blue-300 text-xs">Trans/día</p>
                                <p className="text-white font-bold">{Math.round(store.avgTransactions)}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Budget Form and Configuration */}
            <BudgetForm storeId={selectedStore} editingBudget={editingBudget} onClearEdit={() => setEditingBudget(null)} />

            {/* Existing Budgets List */}
            {sortedBudgets.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-white/80 backdrop-blur-lg border-orange-100 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      Presupuestos Configurados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {sortedBudgets.map((budget, index) => {
                        const isCurrent = budget.month === currentMonth && budget.year === currentYear;
                        return (
                          <motion.div
                            key={budget.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl border ${
                              isCurrent 
                                ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' 
                                : 'bg-gray-50 border-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">
                                  {MONTHS[budget.month - 1]} {budget.year}
                                </h4>
                                {isCurrent && (
                                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                                    Actual
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setEditingBudget(budget)}
                                  className="p-1.5 rounded-lg bg-white/50 hover:bg-blue-100 text-blue-500 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={async () => {
                                    if (confirm(`¿Eliminar presupuesto de ${MONTHS[budget.month - 1]} ${budget.year}?`)) {
                                      await base44.entities.Budget.delete(budget.id);
                                      queryClient.invalidateQueries(['budgets']);
                                      toast.success('Presupuesto eliminado');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-white/50 hover:bg-red-100 text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-gray-500">Ventas:</span>
                                <span className="font-medium text-gray-800">{formatCurrency(budget.sales_budget)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Receipt className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Ticket:</span>
                                <span className="font-medium text-gray-800">{formatCurrency(budget.tickets_budget)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-purple-500" />
                                <span className="text-gray-500">Trans:</span>
                                <span className="font-medium text-gray-800">{(budget.transactions_budget || 0).toLocaleString('es-CO')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Gift className="w-4 h-4 text-pink-500" />
                                <span className="text-gray-500">Sugeridos:</span>
                                <span className="font-medium text-gray-800">{(budget.suggested_budget || 0).toLocaleString('es-CO')}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🎯
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para configurar presupuestos mensuales</p>
          </div>
        )}
      </div>
    </div>
  );
}