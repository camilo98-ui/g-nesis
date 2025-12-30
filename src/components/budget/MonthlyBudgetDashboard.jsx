import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Edit2, Trash2, TrendingUp, Target, Calendar, DollarSign, Save, Receipt, Zap, Gift, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

export default function MonthlyBudgetDashboard({ storeId, storeName, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    sales_budget: '',
    tickets_budget: '',
    transactions_budget: '',
    suggested_budget: ''
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', storeId],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  // Fetch daily sales para cálculos
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  // Create budget mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create({ ...data, store_id: storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Presupuesto creado exitosamente');
      resetForm();
    },
    onError: () => toast.error('Error al crear presupuesto')
  });

  // Update budget mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Presupuesto actualizado');
      resetForm();
    },
    onError: () => toast.error('Error al actualizar')
  });

  // Delete budget mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Presupuesto eliminado');
    },
    onError: () => toast.error('Error al eliminar')
  });

  // Toggle active budget mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (budgetId) => {
      // Desactivar todos los presupuestos de la tienda
      const allBudgets = await base44.entities.Budget.filter({ store_id: storeId });
      await Promise.all(
        allBudgets.map(b => base44.entities.Budget.update(b.id, { is_active: false }))
      );
      // Activar el seleccionado
      await base44.entities.Budget.update(budgetId, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Presupuesto activo actualizado');
    },
    onError: () => toast.error('Error al activar')
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      sales_budget: '',
      tickets_budget: '',
      transactions_budget: '',
      suggested_budget: ''
    });
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      month: budget.month,
      year: budget.year,
      sales_budget: budget.sales_budget,
      tickets_budget: budget.tickets_budget || '',
      transactions_budget: budget.transactions_budget || '',
      suggested_budget: budget.suggested_budget || ''
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.sales_budget) {
      toast.error('Ingresa el presupuesto');
      return;
    }

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Calcular datos de crecimiento
  const growthData = budgets
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((budget, index, array) => {
      const monthSales = dailySales
        .filter(s => {
          const date = new Date(s.date);
          return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
        })
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);

      const compliance = budget.sales_budget > 0 ? Math.round((monthSales / budget.sales_budget) * 100) : 0;
      
      const prevBudget = array[index - 1];
      const growth = prevBudget ? Math.round(((budget.sales_budget - prevBudget.sales_budget) / prevBudget.sales_budget) * 100) : 0;

      return {
        monthLabel: `${format(new Date(budget.year, budget.month - 1), 'MMM yyyy', { locale: es })}`,
        budget: Math.round(budget.sales_budget),
        real: Math.round(monthSales),
        compliance,
        growth,
        month: budget.month,
        year: budget.year
      };
    });

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(val));

  const totalBudget = budgets.reduce((sum, b) => sum + (b.sales_budget || 0), 0);
  const avgGrowth = growthData.length > 1 
    ? Math.round(growthData.reduce((sum, d) => sum + d.growth, 0) / (growthData.length - 1))
    : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Target className="w-7 h-7" />
                    Gestión de Presupuestos
                  </h2>
                  <p className="text-white/80 text-sm mt-1">{storeName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => {
                      setEditingBudget(null);
                      setFormData({
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        sales_budget: '',
                        tickets_budget: '',
                        transactions_budget: '',
                        suggested_budget: ''
                      });
                      setShowForm(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Presupuesto
                  </Button>
                  <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200"
                >
                  <Calendar className="w-5 h-5 text-sky-500 mb-2" />
                  <p className="text-xs text-sky-600 font-medium mb-1">Meses Registrados</p>
                  <p className="text-2xl font-black text-sky-700">{budgets.length}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200"
                >
                  <DollarSign className="w-5 h-5 text-violet-500 mb-2" />
                  <p className="text-xs text-violet-600 font-medium mb-1">Total Presupuestado</p>
                  <p className="text-2xl font-black text-violet-700">{formatCurrency(totalBudget)}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                >
                  <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
                  <p className="text-xs text-emerald-600 font-medium mb-1">Crecimiento Promedio</p>
                  <p className="text-2xl font-black text-emerald-700">{avgGrowth}%</p>
                </motion.div>
              </div>

              {/* Form Modal */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-sky-50/50 to-blue-50/50 rounded-xl p-5 mb-6 border border-sky-200"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Mes</label>
                        <select
                          value={formData.month}
                          onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {format(new Date(2024, i), 'MMMM', { locale: es })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Año</label>
                        <Input
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          className="border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-pink-500" />
                          Presupuesto de Ventas
                        </label>
                        <Input
                          type="number"
                          value={formData.sales_budget}
                          onChange={(e) => setFormData({ ...formData, sales_budget: parseFloat(e.target.value) })}
                          placeholder="250000000"
                          className="border-pink-300 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          💳 Presupuesto de Ticket Promedio
                        </label>
                        <Input
                          type="number"
                          value={formData.tickets_budget}
                          onChange={(e) => setFormData({ ...formData, tickets_budget: parseFloat(e.target.value) })}
                          placeholder="35000"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          ⚡ Presupuesto de Transacciones
                        </label>
                        <Input
                          type="number"
                          value={formData.transactions_budget}
                          onChange={(e) => setFormData({ ...formData, transactions_budget: parseFloat(e.target.value) })}
                          placeholder="7500"
                          className="border-purple-300 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          🎁 Presupuesto de Sugeridos
                        </label>
                        <Input
                          type="number"
                          value={formData.suggested_budget}
                          onChange={(e) => setFormData({ ...formData, suggested_budget: parseFloat(e.target.value) })}
                          placeholder="1500"
                          className="border-rose-300 focus:border-rose-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {editingBudget ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gráfica de crecimiento */}
              {growthData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Evolución de Presupuestos</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="budgetAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="monthLabel" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v/1000000)}M`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(v) => [formatCurrency(v), 'Presupuesto']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="budget" 
                          stroke="#0ea5e9" 
                          strokeWidth={3}
                          fill="url(#budgetAreaGradient)"
                          name="Presupuesto"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Historial de presupuestos */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Historial de Presupuestos</h3>
                {budgets.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No hay presupuestos registrados</p>
                    <p className="text-sm">Crea tu primer presupuesto mensual</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {budgets
                      .sort((a, b) => b.year - a.year || b.month - a.month)
                      .map((budget, index) => {
                        const monthSales = dailySales
                          .filter(s => {
                            const date = new Date(s.date);
                            return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
                          })
                          .reduce((sum, s) => sum + (s.total_sales || 0), 0);
                        
                        const compliance = budget.sales_budget > 0 ? Math.round((monthSales / budget.sales_budget) * 100) : 0;
                        
                        return (
                          <motion.div
                            key={budget.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border rounded-xl p-4 hover:shadow-md transition-all ${
                              budget.is_active
                                ? 'bg-emerald-50/50 border-emerald-500/50'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-800">
                                    {format(new Date(budget.year, budget.month - 1), 'MMMM yyyy', { locale: es })}
                                  </h4>
                                  {budget.is_active && (
                                    <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                                      ACTIVO
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                                  <div className="bg-pink-50 rounded-lg p-2">
                                    <p className="text-gray-500 mb-0.5">💰 Ventas</p>
                                    <p className="font-bold text-pink-600">{formatCurrency(budget.sales_budget)}</p>
                                  </div>
                                  {budget.tickets_budget > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-2">
                                      <p className="text-gray-500 mb-0.5">💳 Ticket Prom.</p>
                                      <p className="font-bold text-blue-600">{formatCurrency(budget.tickets_budget)}</p>
                                    </div>
                                  )}
                                  {budget.transactions_budget > 0 && (
                                    <div className="bg-purple-50 rounded-lg p-2">
                                      <p className="text-gray-500 mb-0.5">⚡ Transacciones</p>
                                      <p className="font-bold text-purple-600">{budget.transactions_budget.toLocaleString()}</p>
                                    </div>
                                  )}
                                  {budget.suggested_budget > 0 && (
                                    <div className="bg-rose-50 rounded-lg p-2">
                                      <p className="text-gray-500 mb-0.5">🎁 Sugeridos</p>
                                      <p className="font-bold text-rose-600">{budget.suggested_budget.toLocaleString()}</p>
                                    </div>
                                  )}
                                  <div className="bg-emerald-50 rounded-lg p-2">
                                    <p className="text-gray-500 mb-0.5">Venta Real</p>
                                    <p className="font-bold text-emerald-600">{formatCurrency(monthSales)}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <p className="text-gray-500 mb-0.5">Cumplimiento</p>
                                    <p className={`font-bold ${compliance >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                      {compliance}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => toggleActiveMutation.mutate(budget.id)}
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                    budget.is_active
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                                  }`}
                                  title={budget.is_active ? 'Presupuesto activo' : 'Marcar como activo'}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(budget)}
                                  className="text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (window.confirm('¿Eliminar este presupuesto?')) {
                                      deleteMutation.mutate(budget.id);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}