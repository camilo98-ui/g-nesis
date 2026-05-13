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
import { ArrowLeft, BarChart3, Calendar, Pencil, Trash2, DollarSign, Receipt, Zap, Gift } from 'lucide-react';
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
      if (!selectedStore) return [];
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
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const { data: allStoresData = [] } = useQuery({
    queryKey: ['allStoresComparative'],
    queryFn: async () => {
      const results = await Promise.all(
        STORES.map(async (store) => {
          try {
            const sales = await base44.entities.DailySales.filter({ store_id: store.code }).catch(() => []);
            const last30 = sales.slice(-30);
            return {
              storeName: store.name,
              storeCode: store.code,
              avgDaily: last30.reduce((sum, s) => sum + (s.total_sales || 0), 0) / (last30.length || 1),
              avgTickets: last30.reduce((sum, s) => sum + (s.total_tickets || 0), 0) / (last30.length || 1),
              avgTransactions: last30.reduce((sum, s) => sum + (s.total_transactions || 0), 0) / (last30.length || 1),
            };
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean).sort((a, b) => b.avgDaily - a.avgDaily);
    }
  });

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const sortedBudgets = [...budgets].sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingIceCreamsBg />
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-800">Presupuestos</h1>
              {selectedStore && <p className="text-sm text-gray-500">{selectedStore}</p>}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {allStoresData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-700 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <BarChart3 className="w-5 h-5" />
                      Benchmark: Comparativa de Tiendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={allStoresData}>
                        <defs>
                          <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#a78bfa" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="storeName" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4f46e5', color: '#f3f4f6' }} formatter={(v) => `$${(v / 1000000).toFixed(2)}M`} />
                        <Bar dataKey="avgDaily" fill="url(#grad1)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                      {allStoresData.map((store, idx) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        const bgColors = ['from-amber-500/20 to-amber-600/10 border-amber-500/50', 'from-slate-500/20 to-slate-600/10 border-slate-500/50', 'from-orange-500/20 to-orange-600/10 border-orange-500/50', 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/30'];
                        return (
                          <motion.div key={store.storeCode} className={`bg-gradient-to-r ${bgColors[idx] || bgColors[3]} border rounded-xl p-3 flex items-center justify-between ${store.storeCode === selectedStore ? 'ring-2 ring-indigo-400' : ''}`} whileHover={{ scale: 1.01 }}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{medals[idx] || `#${idx + 1}`}</span>
                              <div>
                                <p className="text-white font-semibold">{store.storeName}</p>
                                <p className="text-gray-400 text-xs">{store.storeCode}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-right">
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

            <BudgetForm storeId={selectedStore} editingBudget={editingBudget} onClearEdit={() => setEditingBudget(null)} />

            {sortedBudgets.length > 0 && (
              <Card className="bg-white/90 border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <Calendar className="w-5 h-5" />
                    Presupuestos Configurados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedBudgets.map((b) => (
                      <div key={b.id} className={`p-3 rounded-lg border ${b.month === currentMonth && b.year === currentYear ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{MONTHS[b.month - 1]} {b.year}</span>
                            {b.month === currentMonth && b.year === currentYear && <Badge className="bg-orange-500 text-white text-xs">Actual</Badge>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingBudget(b)} className="p-1 hover:bg-blue-100 rounded"><Pencil className="w-4 h-4 text-blue-600" /></button>
                            <button onClick={async () => { if (confirm('¿Eliminar?')) { await base44.entities.Budget.delete(b.id); queryClient.invalidateQueries(['budgets']); toast.success('Eliminado'); } }} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Ventas: {formatCurrency(b.sales_budget)}</div>
                          <div className="flex items-center gap-1"><Receipt className="w-3 h-3" />Ticket: {formatCurrency(b.tickets_budget)}</div>
                          <div className="flex items-center gap-1"><Zap className="w-3 h-3" />Trans: {b.transactions_budget?.toLocaleString() || 0}</div>
                          <div className="flex items-center gap-1"><Gift className="w-3 h-3" />Sugeridos: {b.suggested_budget?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-gray-700">Selecciona una tienda</h2>
          </div>
        )}
      </div>
    </div>
  );
}