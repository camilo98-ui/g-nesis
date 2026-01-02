import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BarChart3, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency, onConfigureBudget }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Calcular datos del presupuesto retail
  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) {
      // Sin presupuesto, mostrar solo información básica
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      const weeks = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn: 1 }
      );
      
      const currentWeekNumber = weeks.findIndex(w => {
        const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
        return now >= w && now <= weekEnd;
      }) + 1;
      
      return {
        noBudget: true,
        currentWeekNumber,
        totalWeeks: weeks.length,
        remainingDays: eachDayOfInterval({ start: now, end: monthEnd }).length
      };
    }

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

      // Si hay suficiente histórico, usar directamente el promedio histórico escalado al presupuesto mensual
      if (countByDayOfWeek[dayOfWeek] >= 3) {
        // Escalar el promedio histórico para que la suma semanal coincida con el presupuesto mensual
        const totalHistoricalAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
        const monthlyHistoricalProjection = totalHistoricalAvg * (daysInMonth / 7);
        const scaleFactor = activeBudget.sales_budget / monthlyHistoricalProjection;
        return avgByDayOfWeek[dayOfWeek] * scaleFactor;
      } else {
        // Sin suficiente histórico, usar presupuesto base
        return dailyBaseBudget;
      }
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

    // Presupuesto del día ajustado según patrón histórico
    let adjustedDailyBudget = getDailyBudget(now);

    // Si hay brecha acumulada, redistribuir de forma conservadora
    if (remainingDays > 0 && accumulatedGap > 0) {
      const remainingDaysArray = eachDayOfInterval({ start: now, end: monthEnd });

      // Calcular presupuesto base de días restantes según histórico
      const remainingBaseBudget = remainingDaysArray.reduce((sum, day) => sum + getDailyBudget(day), 0);

      // Redistribuir solo el 50% de la brecha para ser más conservador y realista
      const gapToRedistribute = accumulatedGap * 0.5;

      // Calcular peso del día actual vs total de días restantes
      const todayBaseBudget = getDailyBudget(now);
      const todayWeight = remainingBaseBudget > 0 ? todayBaseBudget / remainingBaseBudget : 1 / remainingDays;

      // Agregar proporción de la brecha al presupuesto base del día
      const additionalBudget = gapToRedistribute * todayWeight;
      adjustedDailyBudget = todayBaseBudget + additionalBudget;

      // Limitar incremento máximo al 40% del presupuesto base histórico para evitar metas irrealistas
      const maxIncrease = todayBaseBudget * 1.4;
      adjustedDailyBudget = Math.min(adjustedDailyBudget, maxIncrease);
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

  const isOnTrack = budgetData?.compliance >= 95;
  const needsRecovery = budgetData?.accumulatedGap > 0;

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
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-3 md:pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-xl font-black text-slate-900 flex items-center gap-2 md:gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Target className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-base md:text-2xl truncate">Presupuesto del Día</p>
                <p className="text-[10px] md:text-xs text-slate-600 font-normal mt-0.5">Calendario Retail - Semana {budgetData.currentWeekNumber} de {budgetData.totalWeeks}</p>
              </div>
            </CardTitle>
            <div className="text-right flex-shrink-0">
              <p className="text-xs md:text-sm text-slate-900 font-bold whitespace-nowrap">
                {format(new Date(), 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-[10px] md:text-xs text-slate-600">
                {budgetData.remainingDays} días restantes
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
          {/* Sin Presupuesto - Mensaje */}
          {budgetData?.noBudget ? (
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
          ) : (
            <>
          {/* Presupuesto del Día - DESTACADO */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-rose-300/40 relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Target className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  <p className="text-xs md:text-sm text-white/80 font-medium">Meta del Día</p>
                </div>
                {needsRecovery && (
                  <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-amber-100/60 rounded-full">
                    <p className="text-[8px] md:text-[10px] font-black text-amber-700">AJUSTADO</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-4">
                <div>
                  <p className="text-[10px] md:text-xs text-white/60 mb-1 md:mb-2">Presupuesto del Día</p>
                  <motion.p
                    key={budgetData.adjustedDailyBudget}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl md:text-4xl font-black text-white leading-tight"
                  >
                    {formatCurrency(budgetData.adjustedDailyBudget)}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-white/60 mb-1 md:mb-2">Promedio Histórico Hoy</p>
                  <p className="text-xl md:text-4xl font-black text-white leading-tight">
                    {formatCurrency(budgetData.historicalAvgToday)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                <div className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="text-white/70">Cumplimiento del día</span>
                  <span className="font-bold text-white">{budgetData.todayCompliance.toFixed(0)}%</span>
                </div>
                <div className="relative h-2 md:h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetData.todayCompliance, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>

              {needsRecovery && (
                <div className="bg-white/10 rounded-lg p-2 md:p-3 mb-2 md:mb-3">
                  <p className="text-[10px] md:text-xs text-white/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Incluye recuperación de {formatCurrency(budgetData.accumulatedGap)}</span>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 md:gap-2 text-white/80 pt-2 border-t border-white/20 w-full">
                {isExpanded ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="text-[10px] md:text-xs font-medium">{isExpanded ? 'Ver menos' : 'Ver más detalles'}</span>
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
                  className="bg-white rounded-xl p-3 md:p-4 border border-slate-200/60 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h4 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5 md:gap-2">
                      <LineChart className="w-4 h-4 md:w-5 md:h-5 text-rose-400/70" />
                      Tendencia Diaria del Mes
                    </h4>
                  </div>
                  <ResponsiveContainer width="100%" height={200} className="md:hidden">
                    <BarChart data={budgetData.dailyTrendData}>
                      <defs>
                        <linearGradient id="barCumplido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="barNoCumplido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af" 
                        fontSize={9}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        tick={{ fontWeight: 400 }}
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        fontSize={9}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        tick={{ fontWeight: 400 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#ffffff', 
                          border: '2px solid #e5e7eb', 
                          borderRadius: '12px', 
                          color: '#1e293b', 
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                          fontSize: '11px'
                        }}
                        labelStyle={{
                          color: '#64748b',
                          fontSize: '10px',
                          fontWeight: '700',
                          marginBottom: '6px'
                        }}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullDate || label;
                        }}
                        formatter={(value, name, props) => {
                          const { ventas, presupuesto, cumplimiento } = props.payload;
                          const diferencia = ventas - presupuesto;
                          const cumplido = cumplimiento >= 100;

                          return [
                            <div key="info" style={{ fontSize: '11px' }}>
                              <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                                💰 Venta: {formatCurrency(ventas)}
                              </div>
                              <div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                                🎯 Meta: {formatCurrency(presupuesto)}
                              </div>
                              <div style={{ 
                                fontWeight: 'bold', 
                                color: cumplido ? '#059669' : '#dc2626',
                                borderTop: '1px solid #e5e7eb',
                                paddingTop: '4px',
                                marginTop: '4px'
                              }}>
                                {cumplido ? '✅' : '❌'} {cumplimiento.toFixed(0)}% ({diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)})
                              </div>
                            </div>,
                            ''
                          ];
                        }}
                      />
                      <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                      <Bar 
                        dataKey={(data) => data.ventas - data.presupuesto} 
                        fill="url(#barCumplido)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                      >
                        {budgetData.dailyTrendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cumplimiento >= 100 ? 'url(#barCumplido)' : 'url(#barNoCumplido)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={280} className="hidden md:block">
                  <BarChart data={budgetData.dailyTrendData}>
                    <defs>
                      <linearGradient id="barCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="barNoCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}/>
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      angle={-35}
                      textAnchor="end"
                      height={65}
                      tick={{ fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      tick={{ fontWeight: 400 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#ffffff', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '14px', 
                        color: '#1e293b', 
                        padding: '14px 18px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                        minWidth: '220px'
                      }}
                      labelStyle={{
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: '700',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.fullDate || label;
                      }}
                      formatter={(value, name, props) => {
                        const { ventas, presupuesto, cumplimiento } = props.payload;
                        const diferencia = ventas - presupuesto;
                        const cumplido = cumplimiento >= 100;

                        return [
                          <div key="info" style={{ fontSize: '13px' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>
                              💰 Venta: {formatCurrency(ventas)}
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                              🎯 Meta: {formatCurrency(presupuesto)}
                            </div>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: cumplido ? '#059669' : '#dc2626',
                              borderTop: '2px solid #e5e7eb',
                              paddingTop: '8px',
                              marginTop: '4px',
                              fontSize: '14px'
                            }}>
                              {cumplido ? '✅ Cumplido' : '❌ No cumplido'}: {cumplimiento.toFixed(0)}%
                              <div style={{ fontSize: '12px', marginTop: '4px', color: cumplido ? '#10b981' : '#ef4444' }}>
                                Diferencia: {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
                              </div>
                            </div>
                          </div>,
                          ''
                        ];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '16px' }}
                      content={() => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #a7f3d0, #d1fae5)', borderRadius: '3px' }}></div>
                            <span style={{ color: '#059669' }}>✅ Meta superada</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #fda4af, #fecdd3)', borderRadius: '3px' }}></div>
                            <span style={{ color: '#dc2626' }}>❌ Meta no alcanzada</span>
                          </div>
                        </div>
                      )}
                    />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />
                    <Bar 
                      dataKey={(data) => data.ventas - data.presupuesto} 
                      radius={[6, 6, 0, 0]}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      filter="url(#barShadow)"
                    >
                      {budgetData.dailyTrendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cumplimiento >= 100 ? 'url(#barCumplidoDesktop)' : 'url(#barNoCumplidoDesktop)'} />
                      ))}
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
              </motion.div>

              {/* Semana Retail */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-gradient-to-r from-purple-50/40 to-pink-50/40 rounded-xl p-3 md:p-4 border border-purple-200/40"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400/70 flex-shrink-0" />
                    <h4 className="text-xs md:text-sm font-bold text-purple-700/80 truncate">
                      Semana {budgetData.currentWeekNumber} ({format(budgetData.currentWeekStart, 'dd MMM', { locale: es })} - {format(budgetData.currentWeekEnd, 'dd MMM', { locale: es })})
                    </h4>
                  </div>
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold flex-shrink-0 self-start md:self-auto ${
                    budgetData.weeklyCompliance >= 100 
                      ? 'bg-emerald-100/60 text-emerald-600' 
                      : 'bg-amber-100/60 text-amber-600'
                  }`}>
                    {budgetData.weeklyCompliance.toFixed(0)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(selectedMetric === 'weekly-budget' ? null : 'weekly-budget')}
                className={`bg-purple-50 rounded-lg p-2 md:p-3 border transition-all text-left ${
                  selectedMetric === 'weekly-budget' ? 'border-purple-400 ring-2 ring-purple-300' : 'border-purple-200/40'
                }`}
              >
                <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Meta Semanal</p>
                <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">
                  {formatCurrency(budgetData.weeklyBudget)}
                </p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(selectedMetric === 'weekly-sales' ? null : 'weekly-sales')}
                className={`bg-purple-50 rounded-lg p-2 md:p-3 border transition-all text-left ${
                  selectedMetric === 'weekly-sales' ? 'border-purple-400 ring-2 ring-purple-300' : 'border-purple-200/40'
                }`}
              >
                <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Venta Actual</p>
                <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">
                  {formatCurrency(budgetData.currentWeekSales)}
                </p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(selectedMetric === 'weekly-projection' ? null : 'weekly-projection')}
                className={`bg-pink-50 rounded-lg p-2 md:p-3 border transition-all text-left ${
                  selectedMetric === 'weekly-projection' ? 'border-pink-400 ring-2 ring-pink-300' : 'border-pink-200/40'
                }`}
              >
                <p className="text-[10px] md:text-xs text-pink-500/70 mb-1">Proyección</p>
                <p className="text-sm md:text-lg font-black text-pink-600 leading-tight">
                  {formatCurrency(budgetData.weekProjection)}
                </p>
              </motion.button>
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
                className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 rounded-2xl p-4 border-2 border-rose-200/30 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-rose-900 flex items-center gap-2 text-base">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <BarChart3 className="w-5 h-5 text-rose-400" />
                    </motion.div>
                    Comparativa Semanal
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetData.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barPresupuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.7}/>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="barVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.7}/>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.5}/>
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.3} />
                    <XAxis 
                      dataKey="semana" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      fontWeight={600}
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11}
                      fontWeight={500}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `$${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `$${(value / 1000).toFixed(0)}K`;
                        }
                        return `$${value.toLocaleString('es-CO')}`;
                      }}
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #fda4af', 
                        borderRadius: '12px', 
                        color: '#0f172a',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        padding: '12px 16px'
                      }}
                      labelStyle={{
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: '700',
                        marginBottom: '8px'
                      }}
                      formatter={(value, name) => {
                        const label = name === 'presupuesto' ? '🎯 Meta' : '💰 Venta';
                        return [
                          <span key={name} style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                            {formatCurrency(value)}
                          </span>,
                          label
                        ];
                      }}
                    />
                    <Bar 
                      dataKey="presupuesto" 
                      fill="url(#barPresupuesto)" 
                      radius={[8, 8, 0, 0]}
                      filter="url(#barShadow)"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="ventas" 
                      fill="url(#barVentas)" 
                      radius={[8, 8, 0, 0]}
                      filter="url(#barShadow)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Grid de métricas resumidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(selectedMetric === 'base' ? null : 'base')}
              className={`bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-2 md:p-3 border transition-all text-left ${
                selectedMetric === 'base' ? 'border-rose-400 ring-2 ring-rose-300' : 'border-rose-200/40'
              }`}
              >
              <p className="text-[10px] md:text-xs text-rose-500/70 mb-1">Base Diaria</p>
              <p className="text-sm md:text-lg font-bold text-rose-600 leading-tight">
                {formatCurrency(budgetData.dailyBaseBudget)}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(selectedMetric === 'remaining' ? null : 'remaining')}
              className={`bg-gradient-to-br from-emerald-50/40 to-green-50/40 rounded-lg p-2 md:p-3 border transition-all text-left ${
                selectedMetric === 'remaining' ? 'border-emerald-400 ring-2 ring-emerald-300' : 'border-emerald-200/40'
              }`}
              >
              <p className="text-[10px] md:text-xs text-emerald-500/70 mb-1">Días Restantes</p>
              <p className="text-sm md:text-lg font-bold text-emerald-600">
                {budgetData.remainingDays}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(selectedMetric === 'pending' ? null : 'pending')}
              className={`bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-2 md:p-3 border transition-all text-left ${
                selectedMetric === 'pending' ? 'border-rose-400 ring-2 ring-rose-300' : 'border-rose-200/40'
              }`}
              >
              <p className="text-[10px] md:text-xs text-rose-500/70 mb-1">Por Vender</p>
              <p className="text-sm md:text-lg font-bold text-rose-600 leading-tight">
                {formatCurrency(budgetData.remainingBudget)}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(selectedMetric === 'compliance' ? null : 'compliance')}
              className={`rounded-lg p-2 md:p-3 border transition-all text-left ${
                selectedMetric === 'compliance' 
                  ? isOnTrack 
                    ? 'border-emerald-400 ring-2 ring-emerald-300' 
                    : 'border-rose-400 ring-2 ring-rose-300'
                  : isOnTrack 
                    ? 'bg-gradient-to-br from-emerald-50/40 to-green-50/40 border-emerald-200/40' 
                    : 'bg-gradient-to-br from-rose-50/40 to-pink-50/40 border-rose-200/40'
              }`}
              >
              <p className={`text-[10px] md:text-xs mb-1 ${isOnTrack ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                Cumplimiento
              </p>
              <p className={`text-sm md:text-lg font-bold ${isOnTrack ? 'text-emerald-600' : 'text-rose-600'}`}>
                {budgetData.compliance.toFixed(1)}%
              </p>
                </motion.button>
              </div>

              {/* Detalle de métrica seleccionada */}
              <AnimatePresence mode="wait">
                {selectedMetric && (
                  <motion.div
                    key={selectedMetric}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {selectedMetric === 'base' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Presupuesto Base vs Ajustado</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-rose-50 rounded-lg p-3">
                            <p className="text-xs text-rose-600 mb-1">Base Diaria</p>
                            <p className="text-lg font-black text-rose-700">{formatCurrency(budgetData.dailyBaseBudget)}</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-600 mb-1">Meta Ajustada Hoy</p>
                            <p className="text-lg font-black text-amber-700">{formatCurrency(budgetData.adjustedDailyBudget)}</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={[
                            { name: 'Base', value: budgetData.dailyBaseBudget },
                            { name: 'Ajustado', value: budgetData.adjustedDailyBudget }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              <Cell fill="#fda4af" />
                              <Cell fill="#fbbf24" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          {budgetData.adjustedDailyBudget > budgetData.dailyBaseBudget 
                            ? `⬆️ Meta ajustada ${((budgetData.adjustedDailyBudget/budgetData.dailyBaseBudget - 1) * 100).toFixed(0)}% más alta para recuperar brecha`
                            : `✓ Meta base sin ajustes necesarios`}
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'remaining' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Proyección de Días Restantes</h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                            <span className="text-xs text-emerald-700">Días restantes</span>
                            <span className="font-bold text-emerald-900">{budgetData.remainingDays} días</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                            <span className="text-xs text-rose-700">Promedio diario necesario</span>
                            <span className="font-bold text-rose-900">{formatCurrency(budgetData.remainingBudget / budgetData.remainingDays)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-700">Ritmo actual</span>
                            <span className="font-bold text-slate-900">{formatCurrency(budgetData.todayActualSales)}/día</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={budgetData.dailyTrendData.slice(-7)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="ventas" fill="#a7f3d0" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 Últimos 7 días de ventas • Promedio: {formatCurrency(budgetData.dailyTrendData.slice(-7).reduce((a,b) => a + b.ventas, 0) / 7)}
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'pending' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Análisis de Venta Pendiente</h4>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-[10px] text-slate-600">Vendido</p>
                            <p className="text-base font-bold text-slate-900">{formatCurrency(budgetData.salesUntilYesterday + budgetData.todayActualSales)}</p>
                          </div>
                          <div className="bg-rose-50 rounded-lg p-2">
                            <p className="text-[10px] text-rose-600">Por Vender</p>
                            <p className="text-base font-bold text-rose-900">{formatCurrency(budgetData.remainingBudget)}</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart layout="vertical" data={[
                            { name: 'Vendido', value: budgetData.salesUntilYesterday + budgetData.todayActualSales, fill: '#10b981' },
                            { name: 'Por Vender', value: budgetData.remainingBudget, fill: '#fda4af' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(0)}M`} />
                            <YAxis type="category" dataKey="name" fontSize={11} width={70} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                              {[{ fill: '#10b981' }, { fill: '#fda4af' }].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          {budgetData.remainingBudget > 0 
                            ? `💪 Faltan ${formatCurrency(budgetData.remainingBudget)} para alcanzar el presupuesto mensual` 
                            : `🎉 ¡Presupuesto mensual alcanzado!`}
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'compliance' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Evolución del Cumplimiento</h4>
                        <div className="bg-gradient-to-r from-rose-50 to-emerald-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-700">Cumplimiento Actual</span>
                            <span className={`text-2xl font-black ${budgetData.compliance >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {budgetData.compliance.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-3 bg-white rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(budgetData.compliance, 100)}%` }}
                              transition={{ duration: 1 }}
                              className={`h-full rounded-full ${budgetData.compliance >= 95 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                            />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <AreaChart data={budgetData.dailyTrendData}>
                            <defs>
                              <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                            <YAxis fontSize={10} tickFormatter={(v) => `${v}%`} domain={[0, 150]} />
                            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" strokeWidth={2} label={{ value: '100%', fill: '#10b981', fontSize: 10 }} />
                            <Area type="monotone" dataKey="cumplimiento" stroke="#10b981" strokeWidth={2} fill="url(#complianceGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          {budgetData.compliance >= 100 
                            ? `🎯 ¡Excelente! Superando la meta en ${(budgetData.compliance - 100).toFixed(1)}%` 
                            : `📈 Faltan ${(100 - budgetData.compliance).toFixed(1)} puntos para alcanzar el 100%`}
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'weekly-budget' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Desglose de Meta Semanal</h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                            <span className="text-xs text-purple-700">Presupuesto total semana</span>
                            <span className="font-bold text-purple-900">{formatCurrency(budgetData.weeklyBudget)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-700">Días en la semana (en mes)</span>
                            <span className="font-bold text-slate-900">{eachDayOfInterval({ start: budgetData.currentWeekStart, end: budgetData.currentWeekEnd }).filter(d => d >= startOfMonth(new Date()) && d <= endOfMonth(new Date())).length} días</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                            <span className="text-xs text-purple-700">Promedio diario requerido</span>
                            <span className="font-bold text-purple-900">{formatCurrency(budgetData.weeklyBudget / 7)}</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={budgetData.dailyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="presupuesto" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          📆 Meta distribuida según patrón histórico de cada día de la semana
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'weekly-sales' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Ventas de la Semana</h4>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-purple-50 rounded-lg p-2">
                            <p className="text-[10px] text-purple-600">Venta Acumulada</p>
                            <p className="text-base font-bold text-purple-900">{formatCurrency(budgetData.currentWeekSales)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-2">
                            <p className="text-[10px] text-emerald-600">% de Meta</p>
                            <p className="text-base font-bold text-emerald-900">{budgetData.weeklyCompliance.toFixed(1)}%</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <AreaChart data={budgetData.dailyTrendData}>
                            <defs>
                              <linearGradient id="weekSalesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="ventas" stroke="#a78bfa" strokeWidth={2} fill="url(#weekSalesGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          {budgetData.weeklyCompliance >= 100 
                            ? `🎉 ¡Superando la meta semanal en ${(budgetData.weeklyCompliance - 100).toFixed(1)}%!` 
                            : `💪 Faltan ${formatCurrency(budgetData.weeklyBudget - budgetData.currentWeekSales)} para cumplir la meta`}
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'weekly-projection' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Proyección de Cierre Semanal</h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center p-2 bg-pink-50 rounded-lg">
                            <span className="text-xs text-pink-700">Proyección de cierre</span>
                            <span className="font-bold text-pink-900">{formatCurrency(budgetData.weekProjection)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                            <span className="text-xs text-purple-700">Meta semanal</span>
                            <span className="font-bold text-purple-900">{formatCurrency(budgetData.weeklyBudget)}</span>
                          </div>
                          <div className={`flex justify-between items-center p-2 rounded-lg ${budgetData.projectionCompliance >= 100 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <span className={`text-xs ${budgetData.projectionCompliance >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>Cumplimiento proyectado</span>
                            <span className={`font-bold ${budgetData.projectionCompliance >= 100 ? 'text-emerald-900' : 'text-amber-900'}`}>{budgetData.projectionCompliance.toFixed(1)}%</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart layout="vertical" data={[
                            { name: 'Proyección', value: budgetData.weekProjection },
                            { name: 'Meta', value: budgetData.weeklyBudget }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                              <Cell fill="#f9a8d4" />
                              <Cell fill="#a78bfa" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-600 mt-2">
                          {budgetData.projectionCompliance >= 100 
                            ? `🚀 Al ritmo actual, superarás la meta semanal en ${(budgetData.projectionCompliance - 100).toFixed(1)}%` 
                            : `⚠️ Necesitas acelerar el ritmo para alcanzar la meta semanal`}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mensaje de estado */}
              {needsRecovery ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-amber-50/40 border-l-4 border-amber-400/50 rounded-r-lg p-3 md:p-4"
                >
              <div className="flex items-start gap-2 md:gap-3">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500/70 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-amber-700/80 text-xs md:text-sm mb-1">
                    Presupuesto Redistribuido
                  </p>
                  <p className="text-[10px] md:text-xs text-amber-600/80 leading-relaxed">
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
                  className="bg-emerald-50/40 border-l-4 border-emerald-400/50 rounded-r-lg p-3 md:p-4"
                >
              <div className="flex items-start gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-emerald-700/80 text-xs md:text-sm mb-1">
                    ¡En meta!
                  </p>
                  <p className="text-[10px] md:text-xs text-emerald-600/80 leading-relaxed">
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
          </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}