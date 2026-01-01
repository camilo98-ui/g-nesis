import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency }) {
  // Calcular datos del presupuesto retail
  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Obtener semanas retail del mes (lunes a domingo)
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } // Semana inicia en lunes
    );

    // Calcular días por semana y presupuesto diario base
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    const dailyBaseBudget = activeBudget.sales_budget / daysInMonth;

    // Ventas acumuladas hasta hoy
    const todaySales = dailySales.find(s => {
      const saleDate = new Date(s.date);
      return isSameDay(saleDate, now);
    });
    const todayActualSales = todaySales?.total_sales || 0;

    // Calcular ventas realizadas hasta ayer
    const salesUntilYesterday = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate < now && saleDate >= monthStart;
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    // Presupuesto acumulado hasta ayer
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const daysUntilYesterday = eachDayOfInterval({ start: monthStart, end: yesterday }).length;
    const budgetUntilYesterday = dailyBaseBudget * daysUntilYesterday;

    // Brecha acumulada (positiva = estamos por debajo, negativa = estamos arriba)
    const accumulatedGap = budgetUntilYesterday - salesUntilYesterday;

    // Días restantes del mes (incluyendo hoy)
    const remainingDays = eachDayOfInterval({ start: now, end: monthEnd }).length;

    // Presupuesto restante a alcanzar
    const remainingBudget = activeBudget.sales_budget - salesUntilYesterday - todayActualSales;

    // Presupuesto del día redistribuido
    let adjustedDailyBudget = dailyBaseBudget;
    if (remainingDays > 0 && remainingBudget > 0) {
      adjustedDailyBudget = remainingBudget / remainingDays;
    }

    // Calcular semana retail actual
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const currentWeekNumber = weeks.findIndex(w => {
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      return now >= w && now <= weekEnd;
    }) + 1;

    // Ventas de la semana actual
    const currentWeekSales = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= currentWeekStart && saleDate <= currentWeekEnd;
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    // Presupuesto semanal proporcional
    const daysInCurrentWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd })
      .filter(d => d >= monthStart && d <= monthEnd).length;
    const weeklyBudget = dailyBaseBudget * daysInCurrentWeek;

    return {
      dailyBaseBudget,
      adjustedDailyBudget,
      todayActualSales,
      accumulatedGap,
      remainingDays,
      remainingBudget,
      salesUntilYesterday,
      budgetUntilYesterday,
      compliance: budgetUntilYesterday > 0 ? (salesUntilYesterday / budgetUntilYesterday * 100) : 0,
      todayCompliance: adjustedDailyBudget > 0 ? (todayActualSales / adjustedDailyBudget * 100) : 0,
      currentWeekNumber,
      totalWeeks: weeks.length,
      currentWeekSales,
      weeklyBudget,
      weeklyCompliance: weeklyBudget > 0 ? (currentWeekSales / weeklyBudget * 100) : 0
    };
  }, [dailySales, activeBudget]);

  if (!budgetData) return null;

  const isOnTrack = budgetData.compliance >= 95;
  const needsRecovery = budgetData.accumulatedGap > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200/50 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Target className="w-6 h-6 text-blue-600" />
              </motion.div>
              Presupuesto del Día - Calendario Retail
            </CardTitle>
            <div className="text-right">
              <p className="text-xs text-slate-600">Semana {budgetData.currentWeekNumber} de {budgetData.totalWeeks}</p>
              <p className="text-xs text-slate-500 font-medium">
                {format(new Date(), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Presupuesto del Día */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Presupuesto del Día (Redistribuido)</p>
                <motion.p
                  key={budgetData.adjustedDailyBudget}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-blue-700"
                >
                  {formatCurrency(budgetData.adjustedDailyBudget)}
                </motion.p>
                {needsRecovery && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Incluye recuperación de ${formatCurrency(budgetData.accumulatedGap).replace('$', '')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 mb-1">Venta Hoy</p>
                <p className="text-3xl font-black text-emerald-600">
                  {formatCurrency(budgetData.todayActualSales)}
                </p>
                <div className={`flex items-center gap-1 justify-end mt-1 ${
                  budgetData.todayCompliance >= 100 ? 'text-emerald-600' : 
                  budgetData.todayCompliance >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {budgetData.todayCompliance >= 100 ? 
                    <CheckCircle2 className="w-3 h-3" /> : 
                    <AlertTriangle className="w-3 h-3" />
                  }
                  <span className="text-xs font-bold">
                    {budgetData.todayCompliance.toFixed(0)}% cumplido
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de progreso del día */}
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetData.todayCompliance, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  budgetData.todayCompliance >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                  budgetData.todayCompliance >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
              />
              <div className="absolute right-0 top-0 h-full w-0.5 bg-slate-400" />
            </div>
          </div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Presupuesto Base */}
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"
            >
              <p className="text-xs text-slate-600 mb-1">Base Diaria</p>
              <p className="text-lg font-bold text-slate-700">
                {formatCurrency(budgetData.dailyBaseBudget)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Sin ajuste
              </p>
            </motion.div>

            {/* Días restantes */}
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-3 border border-blue-200"
            >
              <p className="text-xs text-blue-700 mb-1">Días Restantes</p>
              <p className="text-lg font-bold text-blue-800">
                {budgetData.remainingDays}
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5">
                Incluyendo hoy
              </p>
            </motion.div>

            {/* Por vender */}
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-3 border border-purple-200"
            >
              <p className="text-xs text-purple-700 mb-1">Por Vender</p>
              <p className="text-lg font-bold text-purple-800">
                {formatCurrency(budgetData.remainingBudget)}
              </p>
              <p className="text-[10px] text-purple-600 mt-0.5">
                Del mes
              </p>
            </motion.div>

            {/* Cumplimiento mes */}
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className={`rounded-lg p-3 border ${
                isOnTrack 
                  ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200' 
                  : 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200'
              }`}
            >
              <p className={`text-xs mb-1 ${isOnTrack ? 'text-emerald-700' : 'text-amber-700'}`}>
                Cumplimiento
              </p>
              <p className={`text-lg font-bold ${isOnTrack ? 'text-emerald-800' : 'text-amber-800'}`}>
                {budgetData.compliance.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isOnTrack ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600">En meta</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] text-amber-600">Por debajo</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Semana Retail Actual */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-purple-900">Semana {budgetData.currentWeekNumber} (Retail)</h4>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                budgetData.weeklyCompliance >= 100 
                  ? 'bg-emerald-200 text-emerald-800' 
                  : 'bg-amber-200 text-amber-800'
              }`}>
                {budgetData.weeklyCompliance.toFixed(0)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-purple-700 mb-1">Meta Semanal</p>
                <p className="text-xl font-black text-purple-800">
                  {formatCurrency(budgetData.weeklyBudget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-700 mb-1">Venta Semanal</p>
                <p className="text-xl font-black text-purple-800">
                  {formatCurrency(budgetData.currentWeekSales)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetData.weeklyCompliance, 100)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>

          {/* Mensaje de estado */}
          {needsRecovery ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 text-sm mb-1">
                    Presupuesto Redistribuido
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Existe una brecha de {formatCurrency(budgetData.accumulatedGap)} que debe recuperarse. 
                    El presupuesto diario se ajustó de {formatCurrency(budgetData.dailyBaseBudget)} a {formatCurrency(budgetData.adjustedDailyBudget)} 
                    para alcanzar la meta del mes en los {budgetData.remainingDays} días restantes.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900 text-sm mb-1">
                    ¡En meta!
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    El negocio está cumpliendo el presupuesto. Mantén el ritmo de ventas para alcanzar 
                    la meta del mes. Presupuesto diario: {formatCurrency(budgetData.adjustedDailyBudget)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}