import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import BudgetForm from '@/components/forms/BudgetForm';
import { ArrowLeft, Target, DollarSign, Receipt, Zap, Gift, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Budget() {
  const [selectedStore, setSelectedStore] = useState('');

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
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Sort budgets by year and month
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                  <Target className="w-6 h-6" />
                </div>
                Presupuestos
              </h1>
              {selectedStore && (
                <p className="text-sm text-gray-500 mt-1">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <BudgetForm storeId={selectedStore} />

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
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-gray-500">Ventas:</span>
                                <span className="font-medium text-gray-800">{formatCurrency(budget.sales_budget)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Receipt className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Tickets:</span>
                                <span className="font-medium text-gray-800">{budget.tickets_budget?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-purple-500" />
                                <span className="text-gray-500">Trans:</span>
                                <span className="font-medium text-gray-800">{budget.transactions_budget?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Gift className="w-4 h-4 text-pink-500" />
                                <span className="text-gray-500">Sugeridos:</span>
                                <span className="font-medium text-gray-800">{budget.suggested_budget?.toLocaleString() || 0}</span>
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
        ) : (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500">Para configurar presupuestos mensuales</p>
          </div>
        )}
      </div>
    </div>
  );
}