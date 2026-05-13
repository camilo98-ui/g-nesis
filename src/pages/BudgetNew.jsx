import React, { useState, useEffect } from 'react';
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

export default function BudgetNew() {
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

  const sortedBudgets = [...budgets].sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FloatingIceCreamsBg />
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black">Presupuestos - Comparativa</h1>
              {selectedStore && <p className="text-sm text-gray-500">{selectedStore}</p>}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {/* COMPARATIVA DE TIENDAS */}
            {allStoresData.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-xl p-6 shadow-2xl border border-indigo-700">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Ranking de Tiendas (Últimos 30 Días)</h2>
                </div>

                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={allStoresData}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="storeName" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4f46e5', color: '#fff' }}
                        formatter={(v) => `$${(v / 1000000).toFixed(2)}M`}
                      />
                      <Bar dataKey="avgDaily" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {allStoresData.map((store, idx) => (
                    <div key={store.storeCode} className={`bg-gray-800 rounded-lg p-4 flex items-center justify-between border ${store.storeCode === selectedStore ? 'border-indigo-500 ring-2 ring-indigo-400' : 'border-gray-700'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <div>
                          <p className="text-white font-semibold">{store.storeName}</p>
                          <p className="text-gray-400 text-xs">{store.storeCode}</p>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-right">
                          <p className="text-gray-400 text-xs">Venta/día</p>
                          <p className="text-white font-bold">${(store.avgDaily / 1000000).toFixed(2)}M</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs">Tickets</p>
                          <p className="text-white font-bold">{Math.round(store.avgTickets)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-xs">Trans</p>
                          <p className="text-white font-bold">{Math.round(store.avgTransactions)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FORMULARIO DE PRESUPUESTO */}
            <BudgetForm storeId={selectedStore} editingBudget={editingBudget} onClearEdit={() => setEditingBudget(null)} />

            {/* LISTA DE PRESUPUESTOS */}
            {sortedBudgets.length > 0 && (
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Presupuestos Guardados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedBudgets.map((b) => (
                      <div key={b.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-semibold">{MONTHS[b.month - 1]} {b.year}</span>
                            {b.month === currentMonth && b.year === currentYear && <Badge className="ml-2 bg-orange-500">Actual</Badge>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingBudget(b)} className="p-1 hover:bg-blue-200 rounded"><Pencil className="w-4 h-4 text-blue-600" /></button>
                            <button onClick={async () => { if (confirm('¿Eliminar?')) { await base44.entities.Budget.delete(b.id); queryClient.invalidateQueries(['budgets']); toast.success('Presupuesto eliminado'); } }} className="p-1 hover:bg-red-200 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-600" /><span>Ventas: {formatCurrency(b.sales_budget)}</span></div>
                          <div className="flex items-center gap-1"><Receipt className="w-3 h-3 text-blue-600" /><span>Ticket: {formatCurrency(b.tickets_budget)}</span></div>
                          <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-600" /><span>Trans: {b.transactions_budget?.toLocaleString() || 0}</span></div>
                          <div className="flex items-center gap-1"><Gift className="w-3 h-3 text-pink-600" /><span>Sugeridos: {b.suggested_budget?.toLocaleString() || 0}</span></div>
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
            <p className="text-6xl mb-4">🎯</p>
            <p className="text-xl font-bold">Selecciona una tienda</p>
          </div>
        )}
      </div>
    </div>
  );
}