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
import { ArrowLeft, BarChart3, Calendar, Pencil, Trash2, DollarSign, Receipt, Zap, Gift, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: async () => {
      let results = await base44.entities.Budget.filter({ store_id: selectedStore });
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

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
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
            {/* COMPARATIVE RANKING SECTION */}
            {allStoresData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800 border-indigo-700 shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-white text-lg">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      Benchmark: Comparativa de Tiendas (Últimos 30 Días)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={allStoresData}>
                        <defs>
                          <linearGradient id="gradVentas" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8"/>
                            <stop offset="100%" stopColor="#a78bfa"/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="storeName" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4f46e5', borderRadius: '8px', color: '#f3f4f6' }}
                          formatter={(value) => `$${(value / 1000000).toFixed(2)}M`}
                        />
                        <Bar dataKey="avgDaily" fill="url(#gradVentas)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Rankings Cards */}
                    <div className="space-y-2">
                      {allStoresData.map((store, idx) => {
                        const isSelected = store.storeCode === selectedStore;
                        const topColor = idx === 0 ? 'from-amber-500/20 to-amber-600/10 border-amber-500/50' : idx === 1 ? 'from-slate-500/20 to-slate-600/10 border-slate-500/50' : idx === 2 ? 'from-orange-500/20 to-orange-600/10 border-orange-500/50' : 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/30';
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                        return (
                          <motion.div 
                            key={store.storeCode}
                            className={`bg-gradient-to-r ${topColor} border rounded-xl p-3 flex items-center justify-between ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-2xl">{medal}</span>
                              <div>
                                <p className="text-white font-semibold">{store.storeName}</p>
                                <p className="text-gray-400 text-xs">{store.storeCode}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                              <div className="text-right">
                                <p className="text-indigo-300 text-xs">Venta/día</p>
                                <p className="text-white font-bold text-lg">${(store.avgDaily / 1000000).toFixed(2)}M</p>
                              </div>
                              <div className="text-right">
                                <p className="text-purple-300 text-xs">Tickets/día</p>
                                <p className="text-white font-bold text-lg">{Math.round(store.avgTickets)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-blue-300 text-xs">Trans/día</p>
                                <p className="text-white font-bold text-lg">{Math.round(store.avgTransactions)}</p>
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

            {/* BUDGET FORM */}
            <BudgetForm storeId={selectedStore} editingBudget={editingBudget} onClearEdit={() => setEditingBudget(null)} />

            {/* BUDGETS LIST */}
            {sortedBudgets.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-white/90 backdrop-blur-lg border-orange-100 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      Presupuestos Configurados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {sortedBudgets.map((budget) => {
                        const isCurrent = budget.month === currentMonth && budget.year === currentYear;
                        return (
                          <motion.div
                            key={budget.id}
                            className={`p-4 rounded-xl border ${isCurrent ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">{MONTHS[budget.month - 1]} {budget.year}</h4>
                                {isCurrent && <Badge className="bg-orange-500 text-white text-xs">Actual</Badge>}
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingBudget(budget)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Pencil className="w-4 h-4" /></button>
                                <button onClick={async () => { if (confirm(`¿Eliminar presupuesto de ${MONTHS[budget.month - 1]}?`)) { await base44.entities.Budget.delete(budget.id); queryClient.invalidateQueries(['budgets']); toast.success('Eliminado'); } }} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" /><span className="text-gray-600">Ventas: {formatCurrency(budget.sales_budget)}</span></div>
                              <div className="flex items-center gap-1"><Receipt className="w-3 h-3 text-blue-500" /><span className="text-gray-600">Ticket: {formatCurrency(budget.tickets_budget)}</span></div>
                              <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-500" /><span className="text-gray-600">Trans: {(budget.transactions_budget || 0).toLocaleString()}</span></div>
                              <div className="flex items-center gap-1"><Gift className="w-3 h-3 text-pink-500" /><span className="text-gray-600">Sugeridos: {(budget.suggested_budget || 0).toLocaleString()}</span></div>
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
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-7xl mb-4">🎯</motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver comparativa y presupuestos</p>
          </div>
        )}
      </div>
    </div>
  );
}