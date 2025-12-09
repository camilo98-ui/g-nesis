import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BudgetTrendModal({ storeId, storeName, isOpen, onClose }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch monthly budget
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', storeId],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  // Fetch daily sales for current month
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  const currentMonthBudget = budgets.find(b => b.month === currentMonth && b.year === currentYear);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!currentMonthBudget) return [];

    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const dailyBudget = currentMonthBudget.sales_budget / daysInMonth.length;

    return daysInMonth.map((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySales = dailySales.find(s => s.date === dateStr);
      const realSales = daySales?.total_sales || 0;
      const accumulatedBudget = dailyBudget * (index + 1);
      
      // Calcular acumulado real hasta el día
      const accumulatedReal = dailySales
        .filter(s => parseISO(s.date) <= day)
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);

      return {
        day: format(day, 'dd'),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        metaAcumulada: Math.round(accumulatedBudget),
        realAcumulado: Math.round(accumulatedReal),
        metaDiaria: Math.round(dailyBudget),
        realDiaria: Math.round(realSales),
        diferencia: Math.round(accumulatedReal - accumulatedBudget),
        cumplimiento: accumulatedBudget > 0 ? Math.round((accumulatedReal / accumulatedBudget) * 100) : 0
      };
    });
  }, [currentMonthBudget, dailySales]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(val));

  if (!isOpen) return null;

  const totalBudget = currentMonthBudget?.sales_budget || 0;
  const totalReal = chartData[chartData.length - 1]?.realAcumulado || 0;
  const compliance = totalBudget > 0 ? Math.round((totalReal / totalBudget) * 100) : 0;

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
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-7 h-7" />
                    Tendencia de Presupuesto
                  </h2>
                  <p className="text-white/80 text-sm mt-1">{storeName} - {format(new Date(), 'MMMM yyyy', { locale: es })}</p>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {currentMonthBudget ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200"
                    >
                      <Target className="w-5 h-5 text-violet-500 mb-2" />
                      <p className="text-xs text-violet-600 font-medium mb-1">Meta del Mes</p>
                      <p className="text-2xl font-black text-violet-700">{formatCurrency(totalBudget)}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                    >
                      <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
                      <p className="text-xs text-emerald-600 font-medium mb-1">Ventas Reales</p>
                      <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalReal)}</p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.2 }}
                      className={`rounded-xl p-4 border ${
                        compliance >= 100 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                          : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                      }`}
                    >
                      <TrendingUp className={`w-5 h-5 mb-2 ${compliance >= 100 ? 'text-green-500' : 'text-amber-500'}`} />
                      <p className="text-xs text-gray-600 font-medium mb-1">Cumplimiento</p>
                      <p className={`text-2xl font-black ${compliance >= 100 ? 'text-green-700' : 'text-amber-700'}`}>
                        {compliance}%
                      </p>
                    </motion.div>
                  </div>

                  {/* Gráfica de tendencia acumulada */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Evolución Acumulada del Mes</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${Math.round(v/1000000)}M`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11, padding: 12 }}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                            formatter={(v, name) => {
                              const val = formatCurrency(v);
                              return [val, name];
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="metaAcumulada" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fill="url(#budgetGradient)"
                            name="🎯 Meta Acumulada"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="realAcumulado" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fill="url(#realGradient)"
                            name="💰 Venta Real Acumulada"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfica de barras diarias */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Cumplimiento Diario</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.filter(d => d.realDiaria > 0)}>
                          <defs>
                            <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <YAxis 
                            domain={[0, 150]}
                            tick={{ fill: '#6b7280', fontSize: 10 }} 
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(v) => [`${v}%`, 'Cumplimiento']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumplimiento" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            fill="url(#complianceGradient)"
                            name="% Cumplimiento"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No hay presupuesto configurado para este mes</p>
                  <p className="text-sm">Configura el presupuesto mensual para ver la tendencia</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}