import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, Plus, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DailyBudgetCard({ dailySales = [], storeId, formatCurrency }) {
  const [showDialog, setShowDialog] = useState(false);
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

  // Datos de últimos 10 días con presupuesto
  const chartData = useMemo(() => {
    const budgetsMap = {};
    dailyBudgets.forEach(b => {
      budgetsMap[b.date] = b;
    });

    const last10Days = dailySales.slice(-10);
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
            <Button
              size="sm"
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              {hasTodayBudget ? 'Editar' : 'Agregar'}
            </Button>
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

          {/* Gráfica histórica */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M COP`} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(v, name) => {
                    if (name === 'Cumplimiento') return [`${v.toFixed(0)}%`, name];
                    return [formatCurrency(v), name === 'real' ? 'Real' : 'Presupuesto'];
                  }}
                />
                <Area type="monotone" dataKey="presupuesto" stroke="#8b5cf6" strokeWidth={2} fill="url(#budgetGrad)" name="Presupuesto" />
                <Area type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} fill="url(#realGrad)" name="Real" />
              </AreaChart>
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
    </>
  );
}