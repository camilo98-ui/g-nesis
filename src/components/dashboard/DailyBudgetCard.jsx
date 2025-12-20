import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, Plus, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line, Legend, BarChart, Bar, Cell } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DailyBudgetCard({ dailySales = [], storeId, formatCurrency }) {
  const [showDialog, setShowDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [ticketGoal, setTicketGoal] = useState('');
  const [transactionsGoal, setTransactionsGoal] = useState('');
  const queryClient = useQueryClient();

  const today = startOfDay(new Date()).toISOString().split('T')[0];

  // Fetch daily budgets
  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['dailyBudgets', storeId],
    queryFn: () => base44.entities.DailyBudget.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Mutation para crear/actualizar presupuesto
  const saveBudgetMutation = useMutation({
    mutationFn: async ({ amount }) => {
      const todayBudget = dailyBudgets.find(b => b.date === today);
      const todaySales = dailySales.find(s => s.date === today);
      const actualSales = todaySales?.total_sales || 0;
      const completed = actualSales > 0;
      const compliance = amount > 0 ? (actualSales / amount) * 100 : 0;

      if (todayBudget) {
        return base44.entities.DailyBudget.update(todayBudget.id, {
          budget_amount: amount,
          actual_sales: actualSales,
          completed,
          compliance_percentage: compliance
        });
      } else {
        return base44.entities.DailyBudget.create({
          store_id: storeId,
          date: today,
          budget_amount: amount,
          actual_sales: actualSales,
          completed,
          compliance_percentage: compliance
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyBudgets'] });
      setShowDialog(false);
      setBudgetAmount('');
    }
  });

  // Datos de últimos 10 días con presupuesto - ORDENADOS DE IZQUIERDA A DERECHA
  const chartData = useMemo(() => {
    const budgetsMap = {};
    dailyBudgets.forEach(b => {
      budgetsMap[b.date] = b;
    });

    const last10Days = dailySales.slice(-10).sort((a, b) => new Date(a.date) - new Date(b.date));
    return last10Days.map(day => {
      const budget = budgetsMap[day.date];
      const real = day.total_sales || 0;
      const presupuesto = budget?.budget_amount || 0;
      return {
        date: format(parseISO(day.date), 'dd MMM', { locale: es }),
        fullDate: format(parseISO(day.date), 'EEEE dd MMM', { locale: es }),
        real,
        presupuesto,
        diferencia: real - presupuesto,
        cumplimiento: presupuesto > 0 ? (real / presupuesto) * 100 : 0
      };
    });
  }, [dailySales, dailyBudgets]);

  const todayBudget = dailyBudgets.find(b => b.date === today);
  const todaySales = dailySales.find(s => s.date === today);
  const hasTodayBudget = !!todayBudget;
  const compliance = todayBudget?.compliance_percentage || 0;

  // Stats del historial
  const historyStats = useMemo(() => {
    const budgetsWithData = dailyBudgets.filter(b => b.completed);
    const totalDays = budgetsWithData.length;
    const daysCompliant = budgetsWithData.filter(b => b.compliance_percentage >= 100).length;
    const avgCompliance = totalDays > 0 ? budgetsWithData.reduce((sum, b) => sum + (b.compliance_percentage || 0), 0) / totalDays : 0;
    const totalBudget = budgetsWithData.reduce((sum, b) => sum + (b.budget_amount || 0), 0);
    const totalSales = budgetsWithData.reduce((sum, b) => sum + (b.actual_sales || 0), 0);
    
    return { totalDays, daysCompliant, avgCompliance, totalBudget, totalSales };
  }, [dailyBudgets]);

  return (
    <>
      <Card className="bg-white shadow-xl border-0">
        <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-500" />
                Presupuesto del Día
              </CardTitle>
              <p className="text-xs text-gray-500">Histórico de cumplimiento</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHistoryModal(true)}
                className="border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Historial
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                {hasTodayBudget ? 'Editar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Resultado del día de hoy */}
          {hasTodayBudget && todayBudget.completed && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mb-4 p-4 rounded-xl ${
                compliance >= 100 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-200' 
                  : 'bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Resultado de Hoy</span>
                {compliance >= 100 ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <X className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-600">Meta</p>
                  <p className="text-sm font-black text-violet-600">{formatCurrency(todayBudget.budget_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Real</p>
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(todayBudget.actual_sales)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">%</p>
                  <p className={`text-sm font-black ${compliance >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    {compliance.toFixed(0)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-center mt-2 font-medium">
                {compliance >= 100 
                  ? `🎉 Superaste el presupuesto en ${formatCurrency(todayBudget.actual_sales - todayBudget.budget_amount)}!` 
                  : `💪 No se cumplió la meta por ${formatCurrency(todayBudget.budget_amount - todayBudget.actual_sales)}`}
              </p>
            </motion.div>
          )}

          {/* Gráfica histórica con líneas claras */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11, padding: 12 }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(v, name) => {
                    const emoji = name === 'Venta Real' ? '💰' : name === 'Meta' ? '🎯' : '📊';
                    const color = name === 'Venta Real' ? '#10b981' : name === 'Meta' ? '#8b5cf6' : '#f59e0b';
                    return [
                      <span style={{ color }}>{emoji} {formatCurrency(v)}</span>,
                      name
                    ];
                  }}
                />
                <Legend 
                  iconType="circle"
                  formatter={(value) => {
                    if (value === 'real') return '💰 Venta Real';
                    if (value === 'presupuesto') return '🎯 Meta';
                    return value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="presupuesto" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Meta"
                />
                <Line 
                  type="monotone" 
                  dataKey="real" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Venta Real"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </CardContent>
      </Card>

      {/* Dialog para agregar presupuesto */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Presupuesto del Día</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Fecha</label>
              <p className="text-lg font-bold text-gray-800">{format(new Date(), 'EEEE dd MMMM yyyy', { locale: es })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">💰 Meta de Ventas</label>
              <Input
                type="number"
                placeholder="Ej: 5000000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">🎫 Meta de Ticket Promedio (opcional)</label>
              <Input
                type="number"
                placeholder="Ej: 45000"
                value={ticketGoal}
                onChange={(e) => setTicketGoal(e.target.value)}
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">⚡ Meta de Transacciones (opcional)</label>
              <Input
                type="number"
                placeholder="Ej: 120"
                value={transactionsGoal}
                onChange={(e) => setTransactionsGoal(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={() => saveBudgetMutation.mutate({ amount: parseFloat(budgetAmount) })}
                disabled={!budgetAmount || saveBudgetMutation.isPending}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
              >
                {saveBudgetMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      Historial de Presupuestos
                    </h2>
                    <p className="text-white/80 text-sm mt-1">Análisis completo del cumplimiento</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)} className="text-white/80 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Días con Presupuesto</p>
                    <p className="text-3xl font-black text-emerald-700">{historyStats.totalDays}</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                    <p className="text-xs text-violet-600 font-medium mb-1">Días Cumplidos</p>
                    <p className="text-3xl font-black text-violet-700">{historyStats.daysCompliant}</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium mb-1">% Promedio</p>
                    <p className="text-3xl font-black text-amber-700">{historyStats.avgCompliance.toFixed(0)}%</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
                    <p className="text-xs text-pink-600 font-medium mb-1">Efectividad</p>
                    <p className="text-3xl font-black text-pink-700">{historyStats.totalDays > 0 ? ((historyStats.daysCompliant / historyStats.totalDays) * 100).toFixed(0) : 0}%</p>
                  </motion.div>
                </div>

                {/* Gráfica de cumplimiento histórico */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Evolución de Cumplimiento</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11, padding: 12 }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          formatter={(v, name) => {
                            const emoji = name === 'Venta Real' ? '💰' : name === 'Meta' ? '🎯' : '📊';
                            const color = name === 'Venta Real' ? '#10b981' : name === 'Meta' ? '#8b5cf6' : '#f59e0b';
                            return [
                              <span style={{ color }}>{emoji} {formatCurrency(v)}</span>,
                              name
                            ];
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="presupuesto" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#8b5cf6', r: 4 }} name="Meta" />
                        <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Venta Real" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica de barras de diferencias */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Diferencia vs Presupuesto</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.filter(d => d.presupuesto > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(v) => [formatCurrency(v), v >= 0 ? 'Superávit' : 'Déficit']}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                        <Bar dataKey="diferencia" radius={[4, 4, 0, 0]}>
                          {chartData.filter(d => d.presupuesto > 0).map((entry, idx) => (
                            <Cell key={idx} fill={entry.diferencia >= 0 ? '#10b981' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla de detalles */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Detalle por Día</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-2 font-bold text-gray-700">Fecha</th>
                          <th className="text-right py-2 px-2 font-bold text-violet-700">Meta</th>
                          <th className="text-right py-2 px-2 font-bold text-emerald-700">Real</th>
                          <th className="text-right py-2 px-2 font-bold text-gray-700">Diferencia</th>
                          <th className="text-center py-2 px-2 font-bold text-gray-700">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.filter(d => d.presupuesto > 0).reverse().map((day, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 px-2 font-medium text-gray-800">{day.fullDate}</td>
                            <td className="text-right py-2 px-2 text-violet-600 font-semibold">{formatCurrency(day.presupuesto)}</td>
                            <td className="text-right py-2 px-2 text-emerald-600 font-semibold">{formatCurrency(day.real)}</td>
                            <td className={`text-right py-2 px-2 font-bold ${day.diferencia >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {day.diferencia >= 0 ? '+' : ''}{formatCurrency(day.diferencia)}
                            </td>
                            <td className="text-center py-2 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                day.cumplimiento >= 100 ? 'bg-emerald-100 text-emerald-700' :
                                day.cumplimiento >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {day.cumplimiento.toFixed(0)}%
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}