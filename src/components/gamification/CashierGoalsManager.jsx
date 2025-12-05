import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, DollarSign, Receipt, Gift, Zap, Save, 
  Loader2, CheckCircle, Edit2, X, Plus, TrendingUp, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from 'sonner';

const GOAL_TYPES = [
  { key: 'sales_goal', label: 'Ventas', icon: DollarSign, color: 'emerald', format: 'currency' },
  { key: 'tickets_goal', label: 'Ticket Promedio', icon: Receipt, color: 'blue', format: 'currency' },
  { key: 'transactions_goal', label: 'Transacciones', icon: Zap, color: 'purple', format: 'number' },
  { key: 'suggested_goal', label: 'Sugeridos', icon: Gift, color: 'pink', format: 'number' },
];

export default function CashierGoalsManager({ cashierId, cashierName, storeId, shiftRecords = [] }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState('monthly'); // daily, weekly, monthly
  const [formData, setFormData] = useState({
    sales_goal: '',
    tickets_goal: '',
    transactions_goal: '',
    suggested_goal: '',
    custom_goal_name: '',
    custom_goal_value: '',
    notes: '',
    period: 'monthly'
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: goals = [] } = useQuery({
    queryKey: ['cashierGoals', cashierId, currentMonth, currentYear],
    queryFn: () => base44.entities.CashierGoal.filter({ 
      cashier_id: cashierId,
      month: currentMonth,
      year: currentYear
    }),
    enabled: !!cashierId
  });

  const currentGoal = goals[0];

  // Calcular progreso actual
  const progress = useMemo(() => {
    const monthRecords = shiftRecords.filter(r => {
      const d = new Date(r.date);
      return r.cashier_id === cashierId && 
             d.getMonth() + 1 === currentMonth && 
             d.getFullYear() === currentYear;
    });

    const totalSales = monthRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTransactions = monthRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const totalSuggested = monthRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return {
      sales: totalSales,
      tickets: avgTicket,
      transactions: totalTransactions,
      suggested: totalSuggested
    };
  }, [shiftRecords, cashierId, currentMonth, currentYear]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const goalData = {
        cashier_id: cashierId,
        store_id: storeId,
        month: currentMonth,
        year: currentYear,
        sales_goal: parseFloat(data.sales_goal) || 0,
        tickets_goal: parseFloat(data.tickets_goal) || 0,
        transactions_goal: parseInt(data.transactions_goal) || 0,
        suggested_goal: parseInt(data.suggested_goal) || 0,
        custom_goal_name: data.custom_goal_name || '',
        custom_goal_value: parseFloat(data.custom_goal_value) || 0,
        notes: data.notes || ''
      };

      if (currentGoal?.id) {
        return base44.entities.CashierGoal.update(currentGoal.id, goalData);
      }
      return base44.entities.CashierGoal.create(goalData);
    },
    onSuccess: () => {
      toast.success('Metas guardadas');
      queryClient.invalidateQueries(['cashierGoals']);
      setEditMode(false);
    }
  });

  const handleEdit = () => {
    setFormData({
      sales_goal: currentGoal?.sales_goal || '',
      tickets_goal: currentGoal?.tickets_goal || '',
      transactions_goal: currentGoal?.transactions_goal || '',
      suggested_goal: currentGoal?.suggested_goal || '',
      custom_goal_name: currentGoal?.custom_goal_name || '',
      custom_goal_value: currentGoal?.custom_goal_value || '',
      notes: currentGoal?.notes || ''
    });
    setEditMode(true);
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const formatValue = (value, format) => {
    if (format === 'currency') {
      if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value/1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-red-400';
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            Metas de {cashierName?.split(' ')[0]}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {currentGoal ? 'Editar' : 'Crear'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {currentGoal ? (
          <div className="space-y-4">
            {GOAL_TYPES.map((type) => {
              const goal = currentGoal[type.key];
              const current = type.key === 'sales_goal' ? progress.sales :
                             type.key === 'tickets_goal' ? progress.tickets :
                             type.key === 'transactions_goal' ? progress.transactions :
                             progress.suggested;
              const percentage = getProgressPercentage(current, goal);
              const Icon = type.icon;

              if (!goal || goal === 0) return null;

              return (
                <motion.div
                  key={type.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 text-${type.color}-500`} />
                      <span className="font-medium text-gray-700">{type.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {formatValue(current, type.format)}
                      </span>
                      <span className="text-gray-300">/</span>
                      <span className="font-medium text-gray-700">
                        {formatValue(goal, type.format)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        percentage >= 100 ? 'bg-emerald-100 text-emerald-700' :
                        percentage >= 70 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${getProgressColor(percentage)}`}
                    />
                  </div>
                </motion.div>
              );
            })}

            {currentGoal.custom_goal_name && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-violet-50 rounded-lg border border-violet-200"
              >
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  <span className="font-medium text-violet-700">{currentGoal.custom_goal_name}</span>
                  <span className="ml-auto font-bold text-violet-600">
                    Meta: {currentGoal.custom_goal_value}
                  </span>
                </div>
              </motion.div>
            )}

            {currentGoal.notes && (
              <p className="text-xs text-gray-500 italic border-l-2 border-violet-200 pl-2">
                {currentGoal.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin metas asignadas</p>
            <p className="text-xs mt-1">Haz clic en "Crear" para asignar metas</p>
          </div>
        )}
      </CardContent>

      {/* Modal de edición */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-500" />
              Metas para {cashierName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Selector de período */}
            <Tabs value={goalPeriod} onValueChange={setGoalPeriod} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="daily" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Diaria
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Semanal
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Mensual
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              {GOAL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="space-y-1">
                    <Label className="text-xs text-gray-600 flex items-center gap-1">
                      <Icon className={`w-3 h-3 text-${type.color}-500`} />
                      {type.label}
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData[type.key]}
                      onChange={(e) => setFormData({ ...formData, [type.key]: e.target.value })}
                      className="h-9"
                    />
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Meta personalizada (opcional)</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nombre de la meta"
                  value={formData.custom_goal_name}
                  onChange={(e) => setFormData({ ...formData, custom_goal_name: e.target.value })}
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Valor"
                  value={formData.custom_goal_value}
                  onChange={(e) => setFormData({ ...formData, custom_goal_value: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Notas</Label>
              <Input
                placeholder="Notas para el cajero..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}