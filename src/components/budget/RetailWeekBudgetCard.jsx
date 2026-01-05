import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency, onConfigureBudget, currentDateRange }) {
  // Calcular mes retail (lunes anterior al 23 del mes anterior hasta domingo antes del 23 del mes actual)
  const retailMonth = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Encontrar el lunes más cercano antes o igual al 23 del mes anterior
    const prevMonth = new Date(currentYear, currentMonth - 1, 23);
    let retailMonthStart = new Date(prevMonth);
    while (getDay(retailMonthStart) !== 1) {
      retailMonthStart.setDate(retailMonthStart.getDate() - 1);
    }
    
    // Encontrar el domingo antes del 23 del mes actual
    const thisMonth23 = new Date(currentYear, currentMonth, 23);
    let retailMonthEnd = new Date(thisMonth23);
    retailMonthEnd.setDate(retailMonthEnd.getDate() - 1);
    while (getDay(retailMonthEnd) !== 0) {
      retailMonthEnd.setDate(retailMonthEnd.getDate() - 1);
    }
    
    return { start: retailMonthStart, end: retailMonthEnd };
  }, []);

  // Calcular días del mes retail
  const retailDays = useMemo(() => {
    return eachDayOfInterval({ start: retailMonth.start, end: retailMonth.end });
  }, [retailMonth]);

  // Ventas del mes retail
  const retailMonthSales = useMemo(() => {
    const startStr = format(retailMonth.start, 'yyyy-MM-dd');
    const endStr = format(retailMonth.end, 'yyyy-MM-dd');
    
    return dailySales.filter(s => {
      const saleDate = s.date?.split('T')[0] || s.date;
      return saleDate >= startStr && saleDate <= endStr;
    });
  }, [dailySales, retailMonth]);

  // Totales del mes retail
  const retailTotals = useMemo(() => {
    return retailMonthSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      transactions: acc.transactions + (s.total_transactions || 0)
    }), { sales: 0, transactions: 0 });
  }, [retailMonthSales]);

  if (!activeBudget?.sales_budget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
                <p className="text-xs text-slate-600 font-normal mt-0.5">
                  {format(new Date(), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={onConfigureBudget}
              className="w-full bg-gradient-to-br from-amber-400/80 to-orange-400/80 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-amber-300/40 relative overflow-hidden cursor-pointer"
            >
              <div className="relative z-10 text-center">
                <Target className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
                <p className="text-lg md:text-2xl font-black text-white mb-2">
                  Configura el Presupuesto
                </p>
                <p className="text-xs md:text-sm text-white/80 mb-4">
                  Para ver el presupuesto del día y el calendario retail, primero configura el presupuesto mensual de esta tienda.
                </p>
                <div className="inline-block px-4 py-2 bg-white/20 rounded-lg text-white text-xs md:text-sm font-bold">
                  👆 Haz clic aquí para configurar
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Cálculos con presupuesto activo
  const daysInRetailMonth = retailDays.length;
  const dailyBudget = activeBudget.sales_budget / daysInRetailMonth;
  
  // Días transcurridos en el mes retail
  const today = new Date();
  const daysElapsed = retailDays.filter(d => d <= today).length;
  const daysRemaining = daysInRetailMonth - daysElapsed;
  
  // Presupuesto esperado hasta hoy
  const expectedBudget = dailyBudget * daysElapsed;
  const budgetGap = expectedBudget - retailTotals.sales;
  const compliance = expectedBudget > 0 ? (retailTotals.sales / expectedBudget) * 100 : 0;
  
  // Venta requerida por día para alcanzar meta
  const remainingBudget = activeBudget.sales_budget - retailTotals.sales;
  const requiredDailySales = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  // Crear calendario de días con ventas
  const calendarDays = useMemo(() => {
    return retailDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find(s => {
        const saleDate = s.date?.split('T')[0] || s.date;
        return saleDate === dayStr;
      });
      
      const daySales = dayData?.total_sales || 0;
      const isPast = day < today;
      const isToday = isSameDay(day, today);
      const dayBudget = dailyBudget;
      const dayCompliance = dayBudget > 0 ? (daySales / dayBudget) * 100 : 0;
      
      return {
        date: day,
        sales: daySales,
        budget: dayBudget,
        compliance: dayCompliance,
        isPast,
        isToday,
        hasData: !!dayData
      };
    });
  }, [retailDays, dailySales, today, dailyBudget]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
          <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
            >
              <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                Mes Retail: {format(retailMonth.start, 'dd MMM', { locale: es })} - {format(retailMonth.end, 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 space-y-6">
          {/* Meta del día */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onConfigureBudget}
            className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-2xl shadow-md p-6 lg:p-8 border border-rose-300/40 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
            <div className="relative z-10">
              <div className="text-center">
                <p className="text-sm lg:text-base text-white/90 font-semibold mb-3">
                  Meta del Día
                </p>
                <motion.p
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-none mb-2"
                >
                  {formatCurrency(dailyBudget)}
                </motion.p>
                <p className="text-xs lg:text-sm text-white/70">
                  Presupuesto mensual: {formatCurrency(activeBudget.sales_budget)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Indicadores de cumplimiento */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, y: -3 }}
              className={`rounded-xl p-3 lg:p-4 border-2 text-center ${
                compliance >= 100 
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
                  : compliance >= 80
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
              }`}
            >
              {compliance >= 100 ? (
                <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600 mx-auto mb-2" />
              ) : compliance >= 80 ? (
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600 mx-auto mb-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 mx-auto mb-2" />
              )}
              <p className="text-[10px] lg:text-xs text-slate-600 mb-1 font-semibold">Cumplimiento</p>
              <p className={`text-xl lg:text-2xl font-black ${
                compliance >= 100 ? 'text-emerald-700' : compliance >= 80 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {compliance.toFixed(0)}%
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -3 }}
              className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-300 rounded-xl p-3 lg:p-4 text-center"
            >
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-sky-600 mx-auto mb-2" />
              <p className="text-[10px] lg:text-xs text-slate-600 mb-1 font-semibold">Días Restantes</p>
              <p className="text-xl lg:text-2xl font-black text-sky-700">{daysRemaining}</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -3 }}
              className={`rounded-xl p-3 lg:p-4 border-2 text-center ${
                requiredDailySales <= dailyBudget
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
                  : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
              }`}
            >
              <Target className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-2 ${
                requiredDailySales <= dailyBudget ? 'text-emerald-600' : 'text-orange-600'
              }`} />
              <p className="text-[10px] lg:text-xs text-slate-600 mb-1 font-semibold">Requerido/Día</p>
              <p className={`text-sm lg:text-base font-black ${
                requiredDailySales <= dailyBudget ? 'text-emerald-700' : 'text-orange-700'
              }`}>
                {formatCurrency(requiredDailySales)}
              </p>
            </motion.div>
          </div>

          {/* Calendario de días del mes retail */}
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-rose-200/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Calendario Retail
              </h4>
              <div className="flex gap-2 text-[9px] lg:text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-600">≥100%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-slate-600">80-99%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-slate-600">&lt;80%</span>
                </div>
              </div>
            </div>

            {/* Grid de días - 7 columnas (semana) */}
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-[10px] lg:text-xs font-bold text-slate-500 pb-1">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const dayNum = format(day.date, 'd');
                const bgColor = !day.isPast 
                  ? 'bg-slate-100 border-slate-300'
                  : !day.hasData
                  ? 'bg-gray-200 border-gray-400'
                  : day.compliance >= 100
                  ? 'bg-emerald-500 border-emerald-600'
                  : day.compliance >= 80
                  ? 'bg-amber-500 border-amber-600'
                  : 'bg-red-400 border-red-500';
                
                const textColor = day.isPast && day.hasData ? 'text-white' : 'text-slate-700';
                
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${bgColor} ${
                      day.isToday ? 'ring-2 ring-rose-500 ring-offset-1' : ''
                    }`}
                    title={`${format(day.date, 'dd MMM', { locale: es })}\nVenta: ${formatCurrency(day.sales)}\nMeta: ${formatCurrency(day.budget)}\nCumplimiento: ${day.compliance.toFixed(0)}%`}
                  >
                    <span className={`text-xs lg:text-sm font-bold ${textColor}`}>{dayNum}</span>
                    {day.hasData && (
                      <span className={`text-[8px] lg:text-[9px] font-semibold ${textColor} opacity-80`}>
                        {day.compliance.toFixed(0)}%
                      </span>
                    )}
                    {day.isToday && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Resumen estadístico */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-rose-200/40">
              <p className="text-[10px] lg:text-xs text-slate-600 mb-1 font-semibold">Venta Acumulada</p>
              <p className="text-lg lg:text-xl font-black text-rose-700">{formatCurrency(retailTotals.sales)}</p>
              <div className="flex items-center gap-1 mt-1">
                {budgetGap <= 0 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] lg:text-[10px] text-emerald-600 font-semibold">
                      ¡{formatCurrency(Math.abs(budgetGap))} arriba!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-[9px] lg:text-[10px] text-orange-600 font-semibold">
                      {formatCurrency(budgetGap)} abajo
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-rose-200/40">
              <p className="text-[10px] lg:text-xs text-slate-600 mb-1 font-semibold">Venta Diaria Promedio</p>
              <p className="text-lg lg:text-xl font-black text-pink-700">
                {formatCurrency(daysElapsed > 0 ? retailTotals.sales / daysElapsed : 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {retailTotals.sales / daysElapsed >= dailyBudget ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] lg:text-[10px] text-emerald-600 font-semibold">
                      Por encima de meta
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-[9px] lg:text-[10px] text-red-600 font-semibold">
                      Por debajo de meta
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Alerta si se requiere más esfuerzo */}
          {requiredDailySales > dailyBudget * 1.2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-4 text-white"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-1">⚠️ Aceleración Requerida</p>
                  <p className="text-xs leading-relaxed opacity-90">
                    Para alcanzar la meta mensual, necesitas vender {formatCurrency(requiredDailySales)} diarios 
                    ({((requiredDailySales / dailyBudget - 1) * 100).toFixed(0)}% más que el promedio).
                    Quedan {daysRemaining} días para cerrar la brecha de {formatCurrency(remainingBudget)}.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mensaje de éxito si va bien */}
          {compliance >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl p-4 text-white"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-1">🎉 ¡Excelente Desempeño!</p>
                  <p className="text-xs leading-relaxed opacity-90">
                    Vas {formatCurrency(Math.abs(budgetGap))} arriba de la meta esperada para hoy.
                    Mantén el ritmo de {formatCurrency(retailTotals.sales / daysElapsed)} diarios para superar el presupuesto mensual.
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