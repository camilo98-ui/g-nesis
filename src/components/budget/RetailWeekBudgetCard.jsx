import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BarChart3, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular datos del presupuesto retail
  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Semana retail actual: de lunes a domingo (puede empezar en mes anterior)
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Obtener todas las semanas retail que tocan el mes actual
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    // Calcular días del mes que efectivamente tienen venta (lunes a domingo del mes)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

    // Analizar histórico de ventas por día de la semana (0=Domingo, 6=Sábado)
    const salesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sum
    const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Count

    dailySales.forEach(s => {
      try {
        const saleDate = parseISO(s.date);
        const dayOfWeek = saleDate.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
        salesByDayOfWeek[dayOfWeek] += s.total_sales || 0;
        countByDayOfWeek[dayOfWeek]++;
      } catch {}
    });

    // Promedio histórico del día de la semana actual
    const todayDayOfWeek = now.getDay();
    const historicalAvgToday = countByDayOfWeek[todayDayOfWeek] > 0 
      ? salesByDayOfWeek[todayDayOfWeek] / countByDayOfWeek[todayDayOfWeek]
      : 0;

    // Calcular promedio por día de semana
    const avgByDayOfWeek = salesByDayOfWeek.map((sum, idx) => 
      countByDayOfWeek[idx] > 0 ? sum / countByDayOfWeek[idx] : 0
    );

    // Calcular peso relativo de cada día (proporción del total semanal)
    const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
    const weightByDayOfWeek = avgByDayOfWeek.map(avg => 
      totalWeeklyAvg > 0 ? avg / totalWeeklyAvg : 1/7
    );

    // Calcular presupuesto base usando el 100% del presupuesto mensual
    const dailyBaseBudget = activeBudget.sales_budget / daysInMonth;

    // Función para obtener presupuesto ajustado según día de la semana y tendencia histórica
    const getDailyBudget = (date) => {
      if (totalWeeklyAvg === 0) return dailyBaseBudget; // Sin histórico
      const dayOfWeek = date.getDay();
      const weeklyBudgetAvg = dailyBaseBudget * 7;
      const historicalBudget = weeklyBudgetAvg * weightByDayOfWeek[dayOfWeek];
      
      // Usar promedio entre histórico y presupuesto base
      const historicalWeight = countByDayOfWeek[dayOfWeek] >= 4 ? 0.95 : 0.85;
      return (historicalBudget * historicalWeight) + (dailyBaseBudget * (1 - historicalWeight));
    };

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

    // Presupuesto acumulado hasta ayer - suma de presupuestos ajustados
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const daysUntilYesterday = eachDayOfInterval({ start: monthStart, end: yesterday });
    const budgetUntilYesterday = daysUntilYesterday.reduce((sum, day) => sum + getDailyBudget(day), 0);

    // Brecha acumulada
    const accumulatedGap = budgetUntilYesterday - salesUntilYesterday;

    // Días restantes del mes (incluyendo hoy)
    const remainingDays = eachDayOfInterval({ start: now, end: monthEnd }).length;

    // Presupuesto restante a alcanzar
    const remainingBudget = activeBudget.sales_budget - salesUntilYesterday - todayActualSales;

    // Presupuesto del día ajustado
    let adjustedDailyBudget = getDailyBudget(now);
    
    // Si hay brecha acumulada, redistribuir
    if (remainingDays > 0 && accumulatedGap > 0) {
      const remainingDaysArray = eachDayOfInterval({ start: now, end: monthEnd });
      const totalWeightRemaining = remainingDaysArray.reduce((sum, day) => {
        const dayOfWeek = day.getDay();
        return sum + (weightByDayOfWeek[dayOfWeek] || 1/7);
      }, 0);
      const todayWeight = weightByDayOfWeek[now.getDay()] || 1/7;
      
      // Redistribuir 85% de la brecha
      const redistributionBudget = remainingBudget + (accumulatedGap * 0.85);
      const redistributedBudget = (redistributionBudget / totalWeightRemaining) * todayWeight;
      
      // No limitar el presupuesto redistribuido
      adjustedDailyBudget = Math.max(getDailyBudget(now), redistributedBudget);
    }

    // Calcular número de semana retail (considerando semanas que empiezan antes del mes)
    const currentWeekNumber = weeks.findIndex(w => {
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      return now >= w && now <= weekEnd;
    }) + 1;

    // Ventas de la semana actual - usar parseISO para parseo correcto
    const currentWeekSales = dailySales.filter(s => {
      try {
        const saleDate = parseISO(s.date);
        return saleDate >= currentWeekStart && saleDate <= currentWeekEnd;
      } catch {
        return false;
      }
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    // Presupuesto semanal - SOLO días que caen en el mes actual (calendario retail)
    const daysInCurrentWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd })
      .filter(d => d >= monthStart && d <= monthEnd);
    
    // Si la semana tiene menos de 7 días en el mes, ajustar proporcionalmente
    const weeklyBudget = daysInCurrentWeek.reduce((sum, day) => sum + getDailyBudget(day), 0);

    // Calcular proyección de la semana basada en ritmo actual
    const daysPassedInWeek = eachDayOfInterval({ start: currentWeekStart, end: now })
      .filter(d => d <= now).length;
    const avgDailySales = daysPassedInWeek > 0 ? currentWeekSales / daysPassedInWeek : 0;
    const totalDaysInWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }).length;
    const weekProjection = avgDailySales * totalDaysInWeek;
    const projectionCompliance = weeklyBudget > 0 ? (weekProjection / weeklyBudget * 100) : 0;

    // Datos para gráficos - incluir TODOS los días de la semana retail actual (incluso del mes anterior)
    const dailyTrendData = eachDayOfInterval({ start: currentWeekStart, end: now }).map(day => {
      // Buscar venta exacta del día usando parseISO
      const sale = dailySales.find(s => {
        try {
          const saleDate = parseISO(s.date);
          return isSameDay(saleDate, day);
        } catch {
          return false;
        }
      });

      const ventasDelDia = sale ? (sale.total_sales || 0) : 0;
      const presupuestoDia = getDailyBudget(day); // Presupuesto ajustado por día de semana

      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        ventas: ventasDelDia,
        presupuesto: presupuestoDia,
        cumplimiento: ventasDelDia > 0 ? (ventasDelDia / presupuestoDia * 100) : 0
      };
    });

    const weeklyData = weeks.map((weekStart, idx) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
        .filter(d => d >= monthStart && d <= monthEnd);
      
      const weekSales = dailySales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= weekStart && saleDate <= weekEnd;
      }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

      const weekBudget = daysInWeek.reduce((sum, day) => sum + getDailyBudget(day), 0);

      return {
        semana: `S${idx + 1}`,
        ventas: weekSales,
        presupuesto: weekBudget,
        cumplimiento: weekBudget > 0 ? (weekSales / weekBudget * 100) : 0
      };
    });

    return {
      dailyBaseBudget,
      adjustedDailyBudget,
      todayActualSales,
      historicalAvgToday,
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
      weeklyCompliance: weeklyBudget > 0 ? (currentWeekSales / weeklyBudget * 100) : 0,
      weekProjection,
      projectionCompliance,
      dailyTrendData,
      weeklyData,
      currentWeekStart,
      currentWeekEnd
    };
  }, [dailySales, activeBudget]);

  if (!budgetData) return null;

  const isOnTrack = budgetData.compliance >= 95;
  const needsRecovery = budgetData.accumulatedGap > 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md"
              >
                <Target className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <p className="text-2xl">Presupuesto del Día</p>
                <p className="text-xs text-slate-600 font-normal mt-0.5">Calendario Retail - Semana {budgetData.currentWeekNumber} de {budgetData.totalWeeks}</p>
              </div>
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-slate-900 font-bold">
                {format(new Date(), 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-xs text-slate-600">
                {budgetData.remainingDays} días restantes
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Presupuesto del Día - DESTACADO */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-2xl shadow-md p-6 border border-rose-300/40 relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-white" />
                  <p className="text-sm text-white/80 font-medium">Meta del Día</p>
                </div>
                {needsRecovery && (
                  <div className="px-2 py-1 bg-amber-100/60 rounded-full">
                    <p className="text-[10px] font-black text-amber-700">AJUSTADO</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs text-white/60 mb-2">Presupuesto del Día</p>
                  <motion.p
                    key={budgetData.adjustedDailyBudget}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-white"
                  >
                    {formatCurrency(budgetData.adjustedDailyBudget)}
                  </motion.p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-2">Promedio Histórico Hoy</p>
                  <p className="text-4xl font-black text-white">
                    {formatCurrency(budgetData.historicalAvgToday)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Cumplimiento del día</span>
                  <span className="font-bold text-white">{budgetData.todayCompliance.toFixed(0)}%</span>
                </div>
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetData.todayCompliance, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>

              {needsRecovery && (
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Incluye recuperación de {formatCurrency(budgetData.accumulatedGap)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-white/80 pt-2 border-t border-white/20 w-full">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-xs font-medium">{isExpanded ? 'Ver menos' : 'Ver más detalles'}</span>
              </div>
            </div>
          </motion.div>

          {/* Contenido expandible */}
          <AnimatePresence>
            {isExpanded && (
              <>
                {/* Gráfico de Tendencia Diaria */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-rose-400/70" />
                    Tendencia Diaria del Mes
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={budgetData.dailyTrendData}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#f472b6" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#fda4af" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c026d3" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#e879f9" stopOpacity={0.1}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#be185d" 
                      fontSize={11}
                      angle={-35}
                      textAnchor="end"
                      height={65}
                      tick={{ fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#be185d" 
                      fontSize={11}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      tick={{ fontWeight: 500 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'linear-gradient(135deg, #ec4899 0%, #c026d3 100%)', 
                        border: 'none', 
                        borderRadius: '16px', 
                        color: '#fff', 
                        padding: '16px',
                        boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4)'
                      }}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.fullDate || label;
                      }}
                      formatter={(value, name, props) => {
                        const cumplimiento = props.payload.cumplimiento;
                        if (name === 'ventas') {
                          return [
                            <div key="ventas" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              {formatCurrency(value)}
                              {cumplimiento > 0 && (
                                <span style={{ 
                                  marginLeft: '8px', 
                                  color: cumplimiento >= 100 ? '#86efac' : '#fcd34d',
                                  fontSize: '12px'
                                }}>
                                  ({cumplimiento.toFixed(0)}%)
                                </span>
                              )}
                            </div>,
                            '💰 Venta Real'
                          ];
                        } else {
                          return [
                            <div key="ppto" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              {formatCurrency(value)}
                            </div>,
                            '🎯 Presupuesto Diario'
                          ];
                        }
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '12px' }}
                      formatter={(value) => value === 'ventas' ? '💰 Venta Real' : '🎯 Presupuesto Diario'}
                      iconType="circle"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="presupuesto" 
                      stroke="#c026d3" 
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      fillOpacity={1} 
                      fill="url(#colorPresupuesto)"
                      name="presupuesto"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#ec4899" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorVentas)"
                      name="ventas"
                      animationDuration={1800}
                      animationEasing="ease-out"
                      filter="url(#glow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Semana Retail */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-gradient-to-r from-purple-50/40 to-pink-50/40 rounded-xl p-4 border border-purple-200/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400/70" />
                    <h4 className="font-bold text-purple-700/80">
                      Semana {budgetData.currentWeekNumber} ({format(budgetData.currentWeekStart, 'dd MMM', { locale: es })} - {format(budgetData.currentWeekEnd, 'dd MMM', { locale: es })})
                    </h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    budgetData.weeklyCompliance >= 100 
                      ? 'bg-emerald-100/60 text-emerald-600' 
                      : 'bg-amber-100/60 text-amber-600'
                  }`}>
                    {budgetData.weeklyCompliance.toFixed(0)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-purple-500/70 mb-1">Meta Semanal</p>
                <p className="text-lg font-black text-purple-600">
                  {formatCurrency(budgetData.weeklyBudget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-500/70 mb-1">Venta Actual</p>
                <p className="text-lg font-black text-purple-600">
                  {formatCurrency(budgetData.currentWeekSales)}
                </p>
              </div>
              <div>
                <p className="text-xs text-pink-500/70 mb-1">Proyección</p>
                <p className="text-lg font-black text-pink-600">
                  {formatCurrency(budgetData.weekProjection)}
                </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-500/60">Cumplimiento actual</span>
                <span className="font-bold text-purple-600">{budgetData.weeklyCompliance.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetData.weeklyCompliance, 100)}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-400/60 to-pink-400/60 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-pink-500/60">Proyección de cierre</span>
                <span className={`font-bold ${budgetData.projectionCompliance >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {budgetData.projectionCompliance.toFixed(0)}%
                </span>
                  </div>
                </div>
              </motion.div>

              {/* Gráfico de Semanas */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400/70" />
                    Comparativa Semanal
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budgetData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="semana" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="presupuesto" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ventas" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Grid de métricas resumidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-3 border border-rose-200/40"
            >
              <p className="text-xs text-rose-500/70 mb-1">Base Diaria</p>
              <p className="text-lg font-bold text-rose-600">
                {formatCurrency(budgetData.dailyBaseBudget)}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-purple-50/40 to-violet-50/40 rounded-lg p-3 border border-purple-200/40"
            >
              <p className="text-xs text-purple-500/70 mb-1">Días Restantes</p>
              <p className="text-lg font-bold text-purple-600">
                {budgetData.remainingDays}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-pink-50/40 to-rose-50/40 rounded-lg p-3 border border-pink-200/40"
            >
              <p className="text-xs text-pink-500/70 mb-1">Por Vender</p>
              <p className="text-lg font-bold text-pink-600">
                {formatCurrency(budgetData.remainingBudget)}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className={`rounded-lg p-3 border ${
                isOnTrack 
                  ? 'bg-gradient-to-br from-emerald-50/40 to-green-50/40 border-emerald-200/40' 
                  : 'bg-gradient-to-br from-amber-50/40 to-orange-50/40 border-amber-200/40'
              }`}
            >
              <p className={`text-xs mb-1 ${isOnTrack ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
                Cumplimiento
              </p>
              <p className={`text-lg font-bold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                {budgetData.compliance.toFixed(1)}%
              </p>
                </motion.div>
              </div>

              {/* Mensaje de estado */}
              {needsRecovery ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-amber-50/40 border-l-4 border-amber-400/50 rounded-r-lg p-4"
                >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700/80 text-sm mb-1">
                    Presupuesto Redistribuido
                  </p>
                  <p className="text-xs text-amber-600/80 leading-relaxed">
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
                  className="bg-emerald-50/40 border-l-4 border-emerald-400/50 rounded-r-lg p-4"
                >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-700/80 text-sm mb-1">
                    ¡En meta!
                  </p>
                  <p className="text-xs text-emerald-600/80 leading-relaxed">
                    El negocio está cumpliendo el presupuesto. Mantén el ritmo de ventas para alcanzar 
                    la meta del mes. Presupuesto diario: {formatCurrency(budgetData.adjustedDailyBudget)}
                  </p>
                </div>
                  </div>
                </motion.div>
              )}
            </>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}