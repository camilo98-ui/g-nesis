import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, CheckCircle2, Circle, Flame, TrendingUp, Ticket, Gift, Plus, Calendar, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from "sonner";

export default function DailyGoalsCard({ storeId }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showForm, setShowForm] = useState(false);
  const [goalType, setGoalType] = useState('daily'); // 'daily' | 'weekly'
  const [goals, setGoals] = useState({ sales_goal: '', tickets_goal: '', suggested_goal: '' });
  const [weeklyGoal, setWeeklyGoal] = useState({ sales_goal: '' });
  
  // Días de la semana
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const { data: dailyGoal } = useQuery({
    queryKey: ['dailyGoal', storeId, today],
    queryFn: async () => {
      const results = await base44.entities.DailyGoal.filter({ store_id: storeId, date: today });
      return results[0] || null;
    },
    enabled: !!storeId
  });

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId, today],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId, date: today }),
    enabled: !!storeId
  });

  const currentSales = dailySales[0] || { total_sales: 0, total_tickets: 0, total_suggested: 0 };

  const progress = useMemo(() => {
    if (!dailyGoal) return { sales: 0, tickets: 0, suggested: 0 };
    return {
      sales: dailyGoal.sales_goal ? Math.min(100, (currentSales.total_sales / dailyGoal.sales_goal) * 100) : 0,
      tickets: dailyGoal.tickets_goal ? Math.min(100, (currentSales.total_tickets / dailyGoal.tickets_goal) * 100) : 0,
      suggested: dailyGoal.suggested_goal ? Math.min(100, ((currentSales.total_suggested || 0) / dailyGoal.suggested_goal) * 100) : 0
    };
  }, [dailyGoal, currentSales]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (dailyGoal?.id) {
        return base44.entities.DailyGoal.update(dailyGoal.id, data);
      }
      return base44.entities.DailyGoal.create({ ...data, store_id: storeId, date: today });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyGoal', storeId, today]);
      setShowForm(false);
      toast.success('Objetivos guardados');
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      sales_goal: Number(goals.sales_goal) || 0,
      tickets_goal: Number(goals.tickets_goal) || 0,
      suggested_goal: Number(goals.suggested_goal) || 0
    });
  };

  // Guardar objetivo semanal (divide automáticamente en 7 días)
  const saveWeeklyGoalMutation = useMutation({
    mutationFn: async (weeklyTotal) => {
      const dailyAmount = Math.round(weeklyTotal / 7);
      const promises = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return base44.entities.DailyGoal.filter({ store_id: storeId, date: dateStr })
          .then(existing => {
            if (existing[0]?.id) {
              return base44.entities.DailyGoal.update(existing[0].id, { sales_goal: dailyAmount });
            }
            return base44.entities.DailyGoal.create({ store_id: storeId, date: dateStr, sales_goal: dailyAmount });
          });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyGoal']);
      setShowForm(false);
      toast.success('Objetivo semanal distribuido en 7 días');
    }
  });

  const handleSaveWeekly = () => {
    const total = Number(weeklyGoal.sales_goal);
    if (total > 0) {
      saveWeeklyGoalMutation.mutate(total);
    }
  };

  const goalItems = [
    { key: 'sales', label: 'Ventas', icon: TrendingUp, color: 'emerald', current: currentSales.total_sales, goal: dailyGoal?.sales_goal, format: (v) => `$${(v/1000).toFixed(0)}K` },
    { key: 'tickets', label: 'Tickets', icon: Ticket, color: 'blue', current: currentSales.total_tickets, goal: dailyGoal?.tickets_goal, format: (v) => v },
    { key: 'suggested', label: 'Sugeridos', icon: Gift, color: 'amber', current: currentSales.total_suggested || 0, goal: dailyGoal?.suggested_goal, format: (v) => v }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Objetivos del Día</h3>
            <p className="text-xs text-gray-400">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
          </div>
        </div>
        {progress.sales >= 100 && progress.tickets >= 100 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-bold"
          >
            <Flame className="w-3 h-3" /> ¡Día Perfecto!
          </motion.div>
        )}
      </div>

      {!dailyGoal && !showForm ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Definir objetivos
        </motion.button>
      ) : showForm ? (
        <div className="space-y-3">
          {/* Tabs para elegir tipo de objetivo */}
          <Tabs value={goalType} onValueChange={setGoalType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="daily" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                📅 Objetivo del Día
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                📆 Objetivo Semanal
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Meta ventas"
                  value={goals.sales_goal}
                  onChange={(e) => setGoals({...goals, sales_goal: e.target.value})}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Meta tickets"
                  value={goals.tickets_goal}
                  onChange={(e) => setGoals({...goals, tickets_goal: e.target.value})}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Meta sugeridos"
                  value={goals.suggested_goal}
                  onChange={(e) => setGoals({...goals, suggested_goal: e.target.value})}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button size="sm" onClick={handleSave} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white">Guardar</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-3">
              <div className="bg-purple-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-purple-600 mb-2">💡 El objetivo semanal se dividirá automáticamente entre los 7 días</p>
                <Input
                  type="number"
                  placeholder="Meta de ventas semanal total"
                  value={weeklyGoal.sales_goal}
                  onChange={(e) => setWeeklyGoal({ sales_goal: e.target.value })}
                  className="text-sm bg-white"
                />
                {weeklyGoal.sales_goal && Number(weeklyGoal.sales_goal) > 0 && (
                  <div className="mt-2 grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[9px] text-purple-500 font-medium">{format(day, 'EEE', { locale: es })}</p>
                        <p className="text-[10px] font-bold text-purple-700">
                          ${(Number(weeklyGoal.sales_goal) / 7 / 1000).toFixed(0)}K
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveWeekly} 
                  disabled={saveWeeklyGoalMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white"
                >
                  {saveWeeklyGoalMutation.isPending ? 'Guardando...' : 'Distribuir en 7 días'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-3">
          {goalItems.map((item) => {
            const Icon = item.icon;
            const progressVal = progress[item.key];
            const isComplete = progressVal >= 100;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className={`w-4 h-4 text-${item.color}-500`} />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={isComplete ? 'text-gray-800 font-medium' : 'text-gray-600'}>{item.label}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {item.format(item.current)} / {item.format(item.goal || 0)}
                  </span>
                </div>
                <Progress value={progressVal} className="h-2" />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}