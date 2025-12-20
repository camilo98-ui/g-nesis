import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Calendar, DollarSign, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonthlyBudgetManager({ storeId, isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [customBudgets, setCustomBudgets] = useState({});
  const [useCustom, setUseCustom] = useState(false);

  // Calcular días del mes con distribución inteligente
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sábado o Domingo
      const isFriday = dayOfWeek === 5;
      
      // Distribución analítica por día de la semana basada en comportamiento real:
      // Domingo (0): +50% - día de mayor venta
      // Sábado (6): +45% - segundo día más fuerte
      // Viernes (5): +25% - día fuerte
      // Jueves (4): +15% - día medio-alto
      // Miércoles (3): +5% - día medio
      // Martes (2): +0% - día base
      // Lunes (1): -10% - día más bajo
      
      let multiplier = 1;
      if (dayOfWeek === 0) multiplier = 1.5;      // Domingo +50%
      else if (dayOfWeek === 6) multiplier = 1.45; // Sábado +45%
      else if (dayOfWeek === 5) multiplier = 1.25; // Viernes +25%
      else if (dayOfWeek === 4) multiplier = 1.15; // Jueves +15%
      else if (dayOfWeek === 3) multiplier = 1.05; // Miércoles +5%
      else if (dayOfWeek === 2) multiplier = 1;    // Martes base
      else multiplier = 0.9;                        // Lunes -10%
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        dayName: format(day, 'EEEE', { locale: es }),
        dayNum: format(day, 'dd'),
        dayOfWeek,
        isWeekend,
        isFriday,
        multiplier
      };
    });
  }, []);

  // Distribuir presupuesto de forma inteligente
  const distributedBudgets = useMemo(() => {
    if (!monthlyBudget) return {};
    
    const total = parseFloat(monthlyBudget);
    if (isNaN(total) || total <= 0) return {};
    
    // Calcular suma de multiplicadores
    const totalMultiplier = monthDays.reduce((sum, d) => sum + d.multiplier, 0);
    
    // Distribuir según multiplicador
    const budgets = {};
    monthDays.forEach(day => {
      budgets[day.date] = Math.round((total / totalMultiplier) * day.multiplier);
    });
    
    return budgets;
  }, [monthlyBudget, monthDays]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const budgetsToSave = useCustom ? customBudgets : distributedBudgets;
      const budgetEntries = Object.entries(budgetsToSave).map(([date, amount]) => ({
        store_id: storeId,
        date,
        budget_amount: amount,
        actual_sales: 0,
        completed: false,
        compliance_percentage: 0
      }));
      
      // Verificar si ya existen y actualizar, o crear nuevos
      for (const entry of budgetEntries) {
        const existing = await base44.entities.DailyBudget.filter({ 
          store_id: storeId, 
          date: entry.date 
        });
        
        if (existing.length > 0) {
          await base44.entities.DailyBudget.update(existing[0].id, entry);
        } else {
          await base44.entities.DailyBudget.create(entry);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyBudgets']);
      toast.success('Presupuestos guardados correctamente');
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast.error('Error al guardar presupuestos');
    }
  });

  const handleSave = () => {
    if (!monthlyBudget && !useCustom) {
      toast.error('Ingresa el presupuesto mensual');
      return;
    }
    
    saveMutation.mutate();
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(val));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-7 h-7" />
                    Configurar Presupuestos del Mes
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    Distribución inteligente según días de la semana
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Input presupuesto mensual */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-violet-500" />
                  Presupuesto Total del Mes
                </label>
                <Input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="Ej: 250000000"
                  className="text-lg font-bold border-violet-300 focus:border-violet-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Distribución analítica: Dom +50%, Sáb +45%, Vie +25%, Jue +15%, Mié +5%, Mar base, Lun -10%
                </p>
              </div>

              {/* Preview de distribución */}
              {monthlyBudget && distributedBudgets && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-bold text-violet-700">Vista Previa - Distribución Inteligente</h3>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-gray-500">{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 max-h-64 overflow-y-auto">
                    {monthDays.map(day => {
                      const budget = distributedBudgets[day.date];
                      return (
                        <motion.div
                          key={day.date}
                          whileHover={{ scale: 1.05 }}
                          className={`p-2 rounded-lg text-center transition-all ${
                            day.isWeekend 
                              ? 'bg-gradient-to-br from-pink-200 to-rose-300 border-2 border-pink-400' 
                              : day.isFriday
                                ? 'bg-gradient-to-br from-amber-100 to-yellow-200 border-2 border-amber-300'
                                : 'bg-white border border-gray-200'
                          }`}
                        >
                          <p className={`text-xs font-bold ${day.isWeekend ? 'text-pink-800' : day.isFriday ? 'text-amber-800' : 'text-gray-700'}`}>
                            {day.dayNum}
                          </p>
                          <p className={`text-[9px] font-medium ${day.isWeekend ? 'text-pink-600' : day.isFriday ? 'text-amber-600' : 'text-gray-500'}`}>
                            ${Math.round(budget / 1000000)}M
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div className="flex justify-center gap-2 mt-3 text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-200 to-rose-300" />
                      <span className="text-gray-600">Fin de semana</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-100 to-yellow-200" />
                      <span className="text-gray-600">Viernes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-white border border-gray-200" />
                      <span className="text-gray-600">Entre semana</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!monthlyBudget || saveMutation.isPending}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Presupuestos'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}