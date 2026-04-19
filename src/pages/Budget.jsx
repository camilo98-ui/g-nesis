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
import { ArrowLeft, Target, DollarSign, Receipt, Zap, Gift, Calendar, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

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
            {/* Consulta PPT por día */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/80 backdrop-blur-lg border-pink-100 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-gray-800 text-base">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white">
                      <Search className="w-4 h-4" />
                    </div>
                    Consultar PPT de un día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    {selectedDailyBudget ? (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-gray-600">PPT del día:</span>
                        <span className="text-lg font-black text-emerald-700">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedDailyBudget.budget_amount || 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Sin presupuesto diario registrado para esta fecha</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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