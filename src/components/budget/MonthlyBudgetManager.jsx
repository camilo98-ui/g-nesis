import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Calendar, DollarSign, Save, Sparkles, Zap, TrendingUp, AlertTriangle, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonthlyBudgetManager({ storeId, isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [ticketBudget, setTicketBudget] = useState('');
  const [transactionsBudget, setTransactionsBudget] = useState('');
  const [suggestedBudget, setSuggestedBudget] = useState('');
  const [customBudgets, setCustomBudgets] = useState({});
  const [useCustom, setUseCustom] = useState(false);

  // Fetch datos históricos para análisis inteligente
  const { data: historicalSales = [] } = useQuery({
    queryKey: ['historicalSales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  const { data: currentDailyBudgets = [] } = useQuery({
    queryKey: ['currentDailyBudgets', storeId],
    queryFn: () => base44.entities.DailyBudget.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  // Análisis inteligente de patrones históricos
  const historicalAnalysis = useMemo(() => {
    if (!historicalSales.length) return null;

    // Agrupar ventas por día de la semana de los últimos 3 meses
    const salesByDayOfWeek = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    historicalSales.forEach(sale => {
      const date = new Date(sale.date);
      const dayOfWeek = getDay(date);
      const sales = sale.total_sales || 0;
      if (sales > 0) {
        salesByDayOfWeek[dayOfWeek].push(sales);
      }
    });

    // Calcular promedio por día de semana
    const avgByDayOfWeek = {};
    let totalAvg = 0;
    let count = 0;
    
    Object.keys(salesByDayOfWeek).forEach(day => {
      const sales = salesByDayOfWeek[day];
      if (sales.length > 0) {
        const avg = sales.reduce((a, b) => a + b, 0) / sales.length;
        avgByDayOfWeek[day] = avg;
        totalAvg += avg;
        count++;
      }
    });
    
    const overallAvg = count > 0 ? totalAvg / count : 0;

    // Calcular multiplicadores basados en datos reales
    const multipliers = {};
    Object.keys(avgByDayOfWeek).forEach(day => {
      multipliers[day] = overallAvg > 0 ? avgByDayOfWeek[day] / overallAvg : 1;
    });

    return { multipliers, avgByDayOfWeek, overallAvg };
  }, [historicalSales]);

  // Calcular días del mes con distribución inteligente
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = startOfDay(new Date());
    
    return days.map(day => {
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;
      const isPast = isBefore(day, today);
      const isToday = isSameDay(day, today);
      
      // Usar multiplicadores del análisis histórico si existen, sino usar valores predeterminados
      let multiplier = 1;
      if (historicalAnalysis?.multipliers?.[dayOfWeek]) {
        multiplier = historicalAnalysis.multipliers[dayOfWeek];
      } else {
        // Valores predeterminados si no hay historial
        if (dayOfWeek === 0) multiplier = 1.5;
        else if (dayOfWeek === 6) multiplier = 1.45;
        else if (dayOfWeek === 5) multiplier = 1.25;
        else if (dayOfWeek === 4) multiplier = 1.15;
        else if (dayOfWeek === 3) multiplier = 1.05;
        else if (dayOfWeek === 2) multiplier = 1;
        else multiplier = 0.9;
      }
      
      // Encontrar venta real del día si existe
      const actualSale = historicalSales.find(s => {
        const saleDate = new Date(s.date);
        return isSameDay(saleDate, day);
      });
      const actualSales = actualSale?.total_sales || 0;
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        dayName: format(day, 'EEEE', { locale: es }),
        dayNum: format(day, 'dd'),
        dayOfWeek,
        isWeekend,
        isFriday,
        isPast,
        isToday,
        multiplier,
        actualSales
      };
    });
  }, [historicalSales, historicalAnalysis]);

  // Distribuir presupuesto de forma inteligente con ajuste dinámico de brechas
  const distributedBudgets = useMemo(() => {
    if (!monthlyBudget) return {};
    
    const total = parseFloat(monthlyBudget);
    if (isNaN(total) || total <= 0) return {};
    
    const today = startOfDay(new Date());
    const futureDays = monthDays.filter(d => !d.isPast);
    const pastDays = monthDays.filter(d => d.isPast);
    
    // Calcular brecha acumulada de días pasados
    let accumulatedGap = 0;
    pastDays.forEach(day => {
      const existingBudget = currentDailyBudgets.find(b => b.date === day.date);
      if (existingBudget) {
        const dayGap = existingBudget.budget_amount - day.actualSales;
        if (dayGap > 0) {
          accumulatedGap += dayGap;
        }
      }
    });

    // Ventas totales ya realizadas
    const totalPastSales = pastDays.reduce((sum, d) => sum + d.actualSales, 0);
    
    // Presupuesto restante = presupuesto total - ventas realizadas + brecha acumulada
    const remainingBudget = total - totalPastSales + accumulatedGap;
    
    // Distribuir el presupuesto restante entre los días futuros
    const futureTotalMultiplier = futureDays.reduce((sum, d) => sum + d.multiplier, 0);
    
    const budgets = {};
    
    // Días pasados mantienen su presupuesto original o se actualizan con venta real
    pastDays.forEach(day => {
      const existingBudget = currentDailyBudgets.find(b => b.date === day.date);
      if (existingBudget) {
        budgets[day.date] = existingBudget.budget_amount;
      } else {
        // Si no existe, calcularlo proporcionalmente
        const totalMultiplier = monthDays.reduce((sum, d) => sum + d.multiplier, 0);
        budgets[day.date] = Math.round((total / totalMultiplier) * day.multiplier);
      }
    });
    
    // Días futuros reciben distribución ajustada con brecha acumulada
    futureDays.forEach(day => {
      if (futureTotalMultiplier > 0) {
        budgets[day.date] = Math.round((remainingBudget / futureTotalMultiplier) * day.multiplier);
      } else {
        budgets[day.date] = 0;
      }
    });
    
    return budgets;
  }, [monthlyBudget, monthDays, currentDailyBudgets, historicalSales]);

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

      // Guardar presupuesto mensual consolidado
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const existingMonthly = await base44.entities.Budget.filter({ 
        store_id: storeId, 
        month: currentMonth,
        year: currentYear
      });
      
      const monthlyData = {
        store_id: storeId,
        month: currentMonth,
        year: currentYear,
        sales_budget: parseFloat(monthlyBudget) || 0,
        tickets_budget: parseFloat(ticketBudget) || 0,
        transactions_budget: parseFloat(transactionsBudget) || 0,
        suggested_budget: parseFloat(suggestedBudget) || 0
      };
      
      if (existingMonthly.length > 0) {
        await base44.entities.Budget.update(existingMonthly[0].id, monthlyData);
      } else {
        await base44.entities.Budget.create(monthlyData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyBudgets']);
      queryClient.invalidateQueries(['budgets']);
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
              {/* Inputs de presupuestos mensuales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-pink-500" />
                    Presupuesto de Ventas
                  </label>
                  <Input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="Ej: 250000000"
                    className="text-lg font-bold border-pink-300 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    Presupuesto de Ticket Promedio
                  </label>
                  <Input
                    type="number"
                    value={ticketBudget}
                    onChange={(e) => setTicketBudget(e.target.value)}
                    placeholder="Ej: 35000"
                    className="text-lg font-bold border-blue-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    Presupuesto de Transacciones
                  </label>
                  <Input
                    type="number"
                    value={transactionsBudget}
                    onChange={(e) => setTransactionsBudget(e.target.value)}
                    placeholder="Ej: 7500"
                    className="text-lg font-bold border-purple-300 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    Presupuesto de Sugeridos
                  </label>
                  <Input
                    type="number"
                    value={suggestedBudget}
                    onChange={(e) => setSuggestedBudget(e.target.value)}
                    placeholder="Ej: 1500"
                    className="text-lg font-bold border-rose-300 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Análisis inteligente */}
              {historicalAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-blue-800">Análisis Inteligente del Historial</h3>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName, idx) => {
                      const mult = historicalAnalysis.multipliers?.[idx === 6 ? 0 : idx + 1] || 1;
                      const avg = historicalAnalysis.avgByDayOfWeek?.[idx === 6 ? 0 : idx + 1] || 0;
                      return (
                        <div key={dayName} className="bg-white rounded-lg p-2 border border-blue-100">
                          <p className="text-[9px] font-bold text-gray-600">{dayName}</p>
                          <p className="text-xs font-black text-blue-700">{(mult * 100).toFixed(0)}%</p>
                          <p className="text-[8px] text-gray-500">${(avg / 1000000).toFixed(1)}M</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    🧠 Basado en {historicalSales.filter(s => s.total_sales > 0).length} días de historial real
                  </p>
                </div>
              )}

              {/* Alerta de brecha acumulada */}
              {monthlyBudget && (() => {
                const pastDays = monthDays.filter(d => d.isPast);
                const accGap = pastDays.reduce((sum, day) => {
                  const existing = currentDailyBudgets.find(b => b.date === day.date);
                  if (existing && day.actualSales > 0) {
                    return sum + Math.max(0, existing.budget_amount - day.actualSales);
                  }
                  return sum;
                }, 0);
                
                if (accGap > 0) {
                  return (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-300 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-sm font-bold text-amber-800">Brecha Acumulada Detectada</h3>
                      </div>
                      <p className="text-xs text-amber-700 mb-2">
                        Los días pasados no cumplieron meta. La brecha de <span className="font-bold">{formatCurrency(accGap)}</span> se redistribuye automáticamente en los días restantes.
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-800 font-medium">
                          Presupuesto diario ajustado para recuperar
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                      const budget = distributedBudgets[day.date] || 0;
                      const actualSales = day.actualSales || 0;
                      const compliance = budget > 0 ? (actualSales / budget) * 100 : 0;
                      const dayGap = budget - actualSales;
                      
                      return (
                        <motion.div
                          key={day.date}
                          whileHover={{ scale: 1.05 }}
                          title={`${day.dayName} ${day.dayNum}\nPresupuesto: ${formatCurrency(budget)}${
                            day.isPast && actualSales > 0 
                              ? `\nVenta real: ${formatCurrency(actualSales)}\nCumplimiento: ${compliance.toFixed(0)}%`
                              : ''
                          }`}
                          className={`p-2 rounded-lg text-center transition-all cursor-pointer ${
                            day.isPast && actualSales > 0
                              ? compliance >= 100
                                ? 'bg-gradient-to-br from-emerald-200 to-green-300 border-2 border-emerald-500'
                                : compliance >= 70
                                  ? 'bg-gradient-to-br from-amber-200 to-yellow-300 border-2 border-amber-500'
                                  : 'bg-gradient-to-br from-red-200 to-rose-300 border-2 border-red-500'
                              : day.isToday
                                ? 'bg-gradient-to-br from-blue-200 to-cyan-300 border-2 border-blue-500'
                                : day.isWeekend 
                                  ? 'bg-gradient-to-br from-pink-100 to-rose-200 border-2 border-pink-300' 
                                  : day.isFriday
                                    ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200'
                                    : 'bg-white border border-gray-200'
                          }`}
                        >
                          <p className={`text-xs font-bold ${
                            day.isPast && actualSales > 0
                              ? compliance >= 100 ? 'text-emerald-900' : compliance >= 70 ? 'text-amber-900' : 'text-red-900'
                              : day.isToday ? 'text-blue-900'
                              : day.isWeekend ? 'text-pink-800' 
                              : day.isFriday ? 'text-amber-700' 
                              : 'text-gray-700'
                          }`}>
                            {day.dayNum}
                          </p>
                          <p className={`text-[9px] font-medium ${
                            day.isPast && actualSales > 0
                              ? compliance >= 100 ? 'text-emerald-700' : compliance >= 70 ? 'text-amber-700' : 'text-red-700'
                              : day.isToday ? 'text-blue-700'
                              : day.isWeekend ? 'text-pink-600' 
                              : day.isFriday ? 'text-amber-600' 
                              : 'text-gray-500'
                          }`}>
                            ${Math.round(budget / 1000000)}M
                          </p>
                          {day.isPast && actualSales > 0 && (
                            <p className={`text-[8px] font-bold ${
                              compliance >= 100 ? 'text-emerald-800' : 'text-red-800'
                            }`}>
                              {compliance >= 100 ? '✓' : dayGap > 0 ? `-$${(dayGap/1000000).toFixed(1)}M` : '✓'}
                            </p>
                          )}
                          {day.isToday && (
                            <p className="text-[7px] font-bold text-blue-800">HOY</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div className="flex justify-center gap-2 mt-3 text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-200 to-green-300 border border-emerald-500" />
                      <span className="text-gray-600">Meta cumplida</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-red-200 to-rose-300 border border-red-500" />
                      <span className="text-gray-600">No cumplió</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-200 to-cyan-300 border border-blue-500" />
                      <span className="text-gray-600">Hoy</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-100 to-rose-200 border border-pink-300" />
                      <span className="text-gray-600">Fin de semana</span>
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