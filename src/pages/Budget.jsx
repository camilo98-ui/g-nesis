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
            {/* Analytics Section - Ventas vs Presupuesto */}
            {salesData.length > 0 && budgets.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-white text-lg">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      Análisis Dinámico: Ventas vs Presupuesto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      {/* KPI Cards */}
                      <motion.div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4" whileHover={{ scale: 1.02 }}>
                        <p className="text-emerald-300 text-sm font-medium">Ventas Hoy</p>
                        <p className="text-3xl font-black text-emerald-400 mt-2">
                          ${(salesData[salesData.length - 1]?.total_sales / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-emerald-300/70 text-xs mt-2">+{((salesData[salesData.length - 1]?.total_sales - (salesData[salesData.length - 2]?.total_sales || 0)) / (salesData[salesData.length - 2]?.total_sales || 1) * 100).toFixed(1)}% vs ayer</p>
                      </motion.div>

                      <motion.div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4" whileHover={{ scale: 1.02 }}>
                        <p className="text-blue-300 text-sm font-medium">Promedio 7d</p>
                        <p className="text-3xl font-black text-blue-400 mt-2">
                          ${(salesData.slice(-7).reduce((s, d) => s + d.total_sales, 0) / 7 / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-blue-300/70 text-xs mt-2">Rendimiento tendencial</p>
                      </motion.div>

                      <motion.div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4" whileHover={{ scale: 1.02 }}>
                        <p className="text-purple-300 text-sm font-medium">Gap Presupuesto</p>
                        <p className="text-3xl font-black text-purple-400 mt-2">
                          {budgets[0]?.sales_gap ? `$${(budgets[0].sales_gap / 1000000).toFixed(2)}M` : '-'}
                        </p>
                        <p className="text-purple-300/70 text-xs mt-2">Vs meta mensual</p>
                      </motion.div>
                    </div>

                    {/* Chart Area */}
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={salesData.slice(-15)} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tick={{ fontSize: 12 }}
                          tickFormatter={d => new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#f3f4f6'
                          }}
                          formatter={(value) => `$${(value / 1000000).toFixed(2)}M`}
                          labelFormatter={label => new Date(label).toLocaleDateString('es-CO')}
                        />
                        <Legend wrapperStyle={{ color: '#d1d5db' }} />
                        <Area 
                          type="monotone" 
                          dataKey="total_sales" 
                          fillOpacity={1} 
                          fill="url(#colorSales)"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          name="Ventas"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <BudgetForm storeId={selectedStore} editingBudget={editingBudget} onClearEdit={() => setEditingBudget(null)} />

            {/* Existing Budgets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-lg border-orange-100 shadow-xl h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                      <Calendar className="w-5 h-5" />
                    </div>
                    Presupuestos Configurados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedBudgets.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay presupuestos configurados</p>
                      <p className="text-sm">Configura el primer presupuesto</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            </div>
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