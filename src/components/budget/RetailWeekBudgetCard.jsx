import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BarChart3, LineChart as LineChartIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BudgetMetricsModal from './BudgetMetricsModal';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LineChart, Line } from 'recharts';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, dailyBudgets = [], storeId, formatCurrency, onConfigureBudget, currentDateRange, onExpandChange, gregorianMode }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSmartRecommendation = (data) => {
    if (!data || data.noBudget) return null;
    const { compliance, weeklyCompliance, projectionCompliance, accumulatedGap, todayCompliance } = data;
    if (projectionCompliance >= 110) return { icon: '🚀', title: 'Ritmo Excepcional', message: 'Superando proyecciones. Considera potenciar productos premium para maximizar margen.', color: 'emerald', action: 'Optimizar Mix de Productos' };
    if (compliance >= 100 && weeklyCompliance >= 95) return { icon: '🎯', title: 'En Meta Perfecta', message: 'Cumplimiento sólido. Mantén el enfoque en experiencia de cliente y upselling.', color: 'emerald', action: 'Mantener Estrategia Actual' };
    if (projectionCompliance >= 85 && projectionCompliance < 100) return { icon: '📈', title: 'Cerca de la Meta', message: 'A punto de alcanzar objetivo. Enfoca en ticket promedio y productos sugeridos.', color: 'amber', action: 'Potenciar Ticket Promedio' };
    if (accumulatedGap > 0 && todayCompliance < 80) return { icon: '⚡', title: 'Acción Requerida', message: 'Brecha acumulada detectada. Revisa inventario de productos top y activa promociones.', color: 'rose', action: 'Activar Plan de Recuperación' };
    if (weeklyCompliance < 70) return { icon: '🎪', title: 'Impulso Necesario', message: 'Considera activar campañas de tráfico y revisar horarios de mayor venta.', color: 'orange', action: 'Revisar Estrategia Comercial' };
    return { icon: '💡', title: 'Análisis Continuo', message: 'Monitorea tendencias de venta por hora para optimizar personal y stock.', color: 'blue', action: 'Optimizar Operaciones' };
  };

  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const currentWeekStart = currentDateRange?.from || startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = currentDateRange?.to || endOfWeek(now, { weekStartsOn: 1 });
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      const currentWeekNumber = weeks.findIndex((w) => {
        const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
        return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
      }) + 1;
      return { noBudget: true, currentWeekNumber, totalWeeks: weeks.length, remainingDays: eachDayOfInterval({ start: now, end: monthEnd }).length, currentWeekStart, currentWeekEnd, monthStart, monthEnd };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

    dailySales = storeId ? dailySales.filter((s) => s.store_id === storeId) : dailySales;

    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const displayWeekStart = currentDateRange?.from || currentWeekStart;
    const displayWeekEnd = currentDateRange?.to || currentWeekEnd;
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const fullCurrentRetailWeekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    const fullDisplayWeekDays = eachDayOfInterval({ start: displayWeekStart, end: displayWeekEnd });

    const salesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    const ninetyDaysAgoForAvg = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    dailySales.forEach((s) => {
      try {
        const saleDate = parseISO(s.date);
        if (saleDate < ninetyDaysAgoForAvg || saleDate >= now) return;
        const dayOfWeek = saleDate.getDay();
        if (s.total_sales && s.total_sales > 0) {salesByDayOfWeek[dayOfWeek] += s.total_sales;countByDayOfWeek[dayOfWeek]++;}
      } catch {}
    });

    const todayDayOfWeek = now.getDay();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const historicalSalesForDay = dailySales.filter((s) => {
      try {const saleDate = parseISO(s.date);return saleDate.getDay() === todayDayOfWeek && s.total_sales > 0 && saleDate >= ninetyDaysAgo && saleDate < now;} catch {return false;}
    });
    const _hSorted = historicalSalesForDay.map((s) => s.total_sales).sort((a, b) => a - b);
    const _hTrimmed = _hSorted.length >= 4 ? _hSorted.slice(1, -1) : _hSorted;
    const historicalAvgToday = _hTrimmed.length > 0 ? _hTrimmed.reduce((s, v) => s + v, 0) / _hTrimmed.length : 0;

    const avgByDayOfWeek = salesByDayOfWeek.map((sum, idx) => countByDayOfWeek[idx] > 0 ? sum / countByDayOfWeek[idx] : 0);
    const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
    const weightByDayOfWeek = avgByDayOfWeek.map((avg) => totalWeeklyAvg > 0 ? avg / totalWeeklyAvg : 1 / 7);

    const adjustedMonthlyBudget = activeBudget.sales_budget;
    const dailyBaseBudget = adjustedMonthlyBudget / daysInMonth;

    const getDailyBudget = (date) => {
      if (!dailyBaseBudget || dailyBaseBudget <= 0) return 0;
      if (totalWeeklyAvg === 0) return dailyBaseBudget;
      const dayOfWeek = date.getDay();
      if (countByDayOfWeek[dayOfWeek] >= 3) {
        const totalHistoricalAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
        const monthlyHistoricalProjection = totalHistoricalAvg * (daysInMonth / 7);
        if (monthlyHistoricalProjection <= 0) return dailyBaseBudget;
        const scaleFactor = adjustedMonthlyBudget / monthlyHistoricalProjection;
        const calculatedBudget = avgByDayOfWeek[dayOfWeek] * scaleFactor;
        return Math.min(calculatedBudget > 0 ? calculatedBudget : dailyBaseBudget, dailyBaseBudget * 1.5);
      } else {
        const weight = weightByDayOfWeek[dayOfWeek];
        if (!weight || weight <= 0) return dailyBaseBudget;
        const weeklyBudget = dailyBaseBudget * 7;
        const calculatedBudget = weeklyBudget * weight;
        return Math.min(calculatedBudget > 0 ? calculatedBudget : dailyBaseBudget, dailyBaseBudget * 1.5);
      }
    };

    const todaySales = dailySales.find((s) => {try {return isSameDay(parseISO(s.date), now);} catch {return false;}});
    const todayActualSales = todaySales?.total_sales || 0;

    const salesUntilYesterday = dailySales.filter((s) => {
      try {const saleDate = parseISO(s.date);return saleDate < now && saleDate >= monthStart && saleDate <= monthEnd;} catch {return false;}
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const daysUntilYesterday = eachDayOfInterval({ start: monthStart, end: yesterday });
    const budgetUntilYesterday = daysUntilYesterday.reduce((sum, day) => sum + getDailyBudget(day), 0);
    const accumulatedGap = budgetUntilYesterday - salesUntilYesterday;
    const remainingDays = eachDayOfInterval({ start: now, end: monthEnd }).length;
    const remainingBudget = adjustedMonthlyBudget - salesUntilYesterday - todayActualSales;

    const todayStr = format(now, 'yyyy-MM-dd');
    const excelRec = dailyBudgets?.find((db) => db.store_id === storeId && (db.date?.split('T')[0] || db.date) === todayStr);
    const excelBudgetForToday = excelRec?.budget_amount > 0 ? excelRec.budget_amount : activeBudget.sales_budget / daysInMonth;

    const manualGap = activeBudget.sales_gap !== undefined && activeBudget.sales_gap !== null ? activeBudget.sales_gap : null;
    const effectiveGap = manualGap !== null ? manualGap : -accumulatedGap;
    const salesGap = effectiveGap;

    let gapRecoveryIncrement = 0;
    let adjustedDailyBudget = excelBudgetForToday;

    if (salesGap !== 0 && remainingDays > 0) {
      const remainingDaysList = eachDayOfInterval({ start: now, end: monthEnd });
      const remainingWeights = remainingDaysList.map((day) => {
        const dow = day.getDay();
        const isWeekend = dow === 0 || dow === 5 || dow === 6;
        const historicalAvg = avgByDayOfWeek[dow] || dailyBaseBudget;
        return historicalAvg * (isWeekend ? 1.5 : 1.0);
      });
      const totalWeight = remainingWeights.reduce((a, b) => a + b, 0);
      const todayDow = now.getDay();
      const isWeekend = todayDow === 0 || todayDow === 5 || todayDow === 6;
      const todayHistoricalAvg = avgByDayOfWeek[todayDow] || dailyBaseBudget;
      const todayWeight = todayHistoricalAvg * (isWeekend ? 1.5 : 1.0);
      let todayGapShare = totalWeight > 0 ? Math.abs(salesGap) * (todayWeight / totalWeight) : Math.abs(salesGap) / remainingDays;
      const aggressionFactor = salesGap < 0 ? 1.3 : 0.5;
      todayGapShare = todayGapShare * aggressionFactor;
      gapRecoveryIncrement = todayGapShare;
      adjustedDailyBudget = excelBudgetForToday + gapRecoveryIncrement;
    }

    const currentWeekNumber = weeks.findIndex((w) => {
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
    }) + 1;

    const currentWeekSales = dailySales.filter((s) => {
      try {return isWithinInterval(parseISO(s.date), { start: displayWeekStart, end: displayWeekEnd });} catch {return false;}
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    const weeklyBudget = fullCurrentRetailWeekDays.reduce((sum, day) => sum + getDailyBudget(day), 0);
    const daysPassedInWeek = eachDayOfInterval({ start: displayWeekStart, end: now }).filter((d) => isWithinInterval(d, { start: displayWeekStart, end: displayWeekEnd }) && d <= now).length;
    const avgDailySales = daysPassedInWeek > 0 ? currentWeekSales / daysPassedInWeek : 0;
    const totalDaysInWeek = eachDayOfInterval({ start: displayWeekStart, end: displayWeekEnd }).length;
    const historicalWeight = daysPassedInWeek <= 2 ? 0.8 : 0.4;
    const currentWeight = 1 - historicalWeight;
    const historicalDailyAvg = totalWeeklyAvg > 0 ? totalWeeklyAvg / 7 : avgDailySales;
    const blendedDailyAvg = historicalDailyAvg * historicalWeight + avgDailySales * currentWeight;
    const weekProjection = blendedDailyAvg * totalDaysInWeek;
    const projectionCompliance = weeklyBudget > 0 ? weekProjection / weeklyBudget * 100 : 0;

    const dailyTrendData = fullDisplayWeekDays.map((day) => {
      const sale = dailySales.find((s) => {try {return isSameDay(parseISO(s.date), day);} catch {return false;}});
      const ventasDelDia = sale ? sale.total_sales || 0 : 0;
      const isDayToday = isSameDay(day, now);
      const presupuestoDia = isDayToday ? adjustedDailyBudget : getDailyBudget(day);
      return { date: format(day, 'dd MMM', { locale: es }), fullDate: format(day, 'EEEE dd MMM', { locale: es }), ventas: ventasDelDia, presupuesto: presupuestoDia, cumplimiento: presupuestoDia > 0 ? ventasDelDia / presupuestoDia * 100 : 0 };
    });

    const displayWeeks = eachWeekOfInterval({ start: displayWeekStart, end: displayWeekEnd }, { weekStartsOn: 1 });
    const weeklyData = displayWeeks.map((weekStart, idx) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const weekSales = dailySales.filter((s) => {try {const sd = parseISO(s.date);return sd >= weekStart && sd <= weekEnd;} catch {return false;}}).reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const weekBudget = daysInWeek.reduce((sum, day) => sum + getDailyBudget(day), 0);
      return { semana: `S${idx + 1}`, ventas: weekSales, presupuesto: weekBudget, cumplimiento: weekBudget > 0 ? weekSales / weekBudget * 100 : 0 };
    });

    const totalMonthSales = salesUntilYesterday + todayActualSales;
    const daysElapsed = eachDayOfInterval({ start: monthStart, end: now }).length;
    const monthAvgDailySales = daysElapsed > 0 ? totalMonthSales / daysElapsed : 0;
    const monthProjection = monthAvgDailySales * daysInMonth;
    const monthProjectionCompliance = adjustedMonthlyBudget > 0 ? monthProjection / adjustedMonthlyBudget * 100 : 0;

    return {
      dailyBaseBudget, adjustedDailyBudget, todayActualSales, historicalAvgToday, accumulatedGap, remainingDays, remainingBudget, salesUntilYesterday, budgetUntilYesterday,
      compliance: budgetUntilYesterday > 0 ? salesUntilYesterday / budgetUntilYesterday * 100 : 0,
      todayCompliance: adjustedDailyBudget > 0 ? todayActualSales / adjustedDailyBudget * 100 : 0,
      currentWeekNumber, totalWeeks: weeks.length, currentWeekSales, weeklyBudget,
      weeklyCompliance: weeklyBudget > 0 ? currentWeekSales / weeklyBudget * 100 : 0,
      weekProjection, projectionCompliance, dailyTrendData, weeklyData, currentWeekStart, currentWeekEnd,
      totalMonthSales, daysElapsed, avgDailySales: monthAvgDailySales, monthProjection, monthProjectionCompliance,
      monthlyBudget: adjustedMonthlyBudget,
      last7DaysSales: dailySales.filter((s) => {
        try {const sd = parseISO(s.date);const ago = new Date(now);ago.setDate(ago.getDate() - 7);return sd >= ago && sd <= now && s.total_sales > 0;} catch {return false;}
      }).sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => ({ value: s.total_sales })),
      topDays: avgByDayOfWeek.map((avg, idx) => ({
        day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][idx],
        dayFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][idx],
        avg, weight: weightByDayOfWeek[idx], count: countByDayOfWeek[idx]
      })).filter((d) => d.count >= 2).sort((a, b) => b.avg - a.avg).slice(0, 3),
      monthStart, monthEnd, getDailyBudget, excelBudgetForToday, gapRecoveryIncrement, salesGap
    };
  }, [dailySales, activeBudget, dailyBudgets, storeId, currentDateRange, gregorianMode]);

  const smartRecommendation = getSmartRecommendation(budgetData);
  const isOnTrack = budgetData?.compliance >= 95;
  const needsRecovery = activeBudget?.sales_gap < 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6">
      
      <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0">
                <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
                <p className="text-xs text-slate-600 font-normal mt-0.5">
                  {budgetData.monthStart && budgetData.monthEnd ?
                  `${format(budgetData.monthStart, 'dd MMM', { locale: es })} - ${format(budgetData.monthEnd, 'dd MMM', { locale: es })} · Semana ${budgetData.currentWeekNumber} de ${budgetData.totalWeeks}` :
                  `Semana ${budgetData.currentWeekNumber} de ${budgetData.totalWeeks}`}
                </p>
              </div>
            </CardTitle>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-slate-900 font-bold whitespace-nowrap">
                {format(new Date(), 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-xs text-slate-600">
                {budgetData.remainingDays} días restantes
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          {budgetData?.noBudget ?
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onConfigureBudget}
            className="w-full bg-gradient-to-br from-amber-400/80 to-orange-400/80 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-amber-300/40 relative overflow-hidden cursor-pointer">
              <div className="relative z-10 text-center">
                <Target className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
                <p className="text-lg md:text-2xl font-black text-white mb-2">Configura el Presupuesto</p>
                <p className="text-xs md:text-sm text-white/80 mb-4">Para ver el presupuesto del día y el calendario retail, primero configura el presupuesto mensual de esta tienda.</p>
                <div className="inline-block px-4 py-2 bg-white/20 rounded-lg text-white text-xs md:text-sm font-bold">👆 Haz clic aquí para configurar</div>
              </div>
            </motion.div> :

          <>
          {/* Presupuesto del Día - DESTACADO */}
          <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                onExpandChange?.(newExpanded);
              }}
              className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-2xl shadow-md p-6 lg:p-8 border border-rose-300/40 relative overflow-hidden cursor-pointer">
              
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-7 lg:mb-5">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Target className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  <p className="text-sm lg:text-base text-white/90 font-semibold lg:font-bold">Meta del Día</p>
                </div>
                





                  
              </div>

              <div className="grid grid-cols-2 gap-6 lg:gap-10 mb-6 lg:mb-5 items-start">
                {/* Panel izquierdo: PPT del Día */}
                <div className="text-left">
                  <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-2 font-semibold">
                    {needsRecovery ? `PPT del Día + Recuperación` : budgetData.gapRecoveryIncrement > 0 ? `PPT del Día + Ambición` : `PPT del Día`}
                  </p>
                  <motion.p
                      key={`${budgetData.excelBudgetForToday + budgetData.gapRecoveryIncrement}-${gregorianMode}`}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl lg:text-5xl font-black text-white leading-none mb-2">
                    {formatCurrency(budgetData.excelBudgetForToday + budgetData.gapRecoveryIncrement)}
                  </motion.p>
                  <div className="space-y-1">
                    {budgetData.gapRecoveryIncrement > 0 && budgetData.excelBudgetForToday > 0 &&
                      <p className="text-xs text-white/70">
                        Excel: {formatCurrency(budgetData.excelBudgetForToday)} + {formatCurrency(budgetData.gapRecoveryIncrement)} ({(budgetData.gapRecoveryIncrement / budgetData.excelBudgetForToday * 100).toFixed(1)}% {needsRecovery ? 'recuperación' : 'extra'})
                      </p>
                      }
                  </div>

                  {/* Sparkline debajo del número */}
                  {budgetData.last7DaysSales?.length > 0 &&
                    <div className="mt-3 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={budgetData.last7DaysSales}>
                          <defs>
                            <filter id="glow1">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="-20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="-0.2;1.2;1.2" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="0%" stopColor="#fff" stopOpacity="1">
                                <animate attributeName="offset" values="0;1.4;1.4" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="0.2;1.6;1.6" dur="3s" repeatCount="indefinite" />
                              </stop>
                            </linearGradient>
                          </defs>
                          <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={1.5} dot={false} strokeOpacity={0.3} />
                          <Line type="monotone" dataKey="value" stroke="url(#lineGrad1)" strokeWidth={2.5} dot={false} filter="url(#glow1)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    }
                </div>

                {/* Panel derecho: Brecha del Mes */}
                {(() => {
                    const monthGap = activeBudget?.sales_gap !== undefined && activeBudget?.sales_gap !== null ?
                    activeBudget.sales_gap : -budgetData.accumulatedGap;
                    return (
                      <div className="text-right">
                      <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-2 font-semibold">Brecha del Mes</p>
                      <motion.p
                          key={`${monthGap}-brecha-mes`}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-slate-50 text-2xl md:text-3xl lg:text-5xl font-black leading-none mb-2">
                        {monthGap < 0 ? '📉' : '📈'} {formatCurrency(Math.abs(monthGap))}
                      </motion.p>
                      {budgetData.monthlyBudget > 0 &&
                        <div className="space-y-1.5">
                          <p className="text-xs lg:text-sm text-white/80">Impacto en presupuesto</p>
                          <motion.p
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-xl md:text-2xl lg:text-3xl font-black ${monthGap < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                            {(Math.abs(monthGap) / budgetData.monthlyBudget * 100).toFixed(1)}%
                          </motion.p>
                          {budgetData.last7DaysSales?.length > 0 &&
                          <div className="mt-3 h-10">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={budgetData.last7DaysSales}>
                                  <defs>
                                    <filter id="glow2">
                                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                      <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                      </feMerge>
                                    </filter>
                                    <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="-20%" stopColor="#fff" stopOpacity="0">
                                        <animate attributeName="offset" values="-0.2;1.2;1.2" dur="3s" repeatCount="indefinite" />
                                      </stop>
                                      <stop offset="0%" stopColor="#fff" stopOpacity="1">
                                        <animate attributeName="offset" values="0;1.4;1.4" dur="3s" repeatCount="indefinite" />
                                      </stop>
                                      <stop offset="20%" stopColor="#fff" stopOpacity="0">
                                        <animate attributeName="offset" values="0.2;1.6;1.6" dur="3s" repeatCount="indefinite" />
                                      </stop>
                                    </linearGradient>
                                  </defs>
                                  <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={1.5} dot={false} strokeOpacity={0.3} />
                                  <Line type="monotone" dataKey="value" stroke="url(#lineGrad2)" strokeWidth={2.5} dot={false} filter="url(#glow2)" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          }
                        </div>
                        }
                    </div>);

                  })()}
              </div>

              {/* Barra de Proyección Mensual */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-white/70">Proyección Cierre Mes</span>
                  <span className="font-bold lg:font-black text-white lg:text-lg">{budgetData.monthProjectionCompliance.toFixed(0)}%</span>
                </div>
                <div className="relative h-3 lg:h-4 bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={() => {setSelectedMetric('month-projection');setIsModalOpen(true);}}>
                  <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetData.monthProjectionCompliance, 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className={`h-full rounded-full relative overflow-hidden ${budgetData.monthProjectionCompliance >= 100 ? 'bg-emerald-300' : budgetData.monthProjectionCompliance >= 90 ? 'bg-amber-300' : 'bg-rose-300'}`}>
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ width: '50%' }} />
                  </motion.div>
                </div>
              </div>

              {needsRecovery &&
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Incluye recuperación de {formatCurrency(budgetData.accumulatedGap)}</span>
                  </p>
                </div>
                }

              <div className="flex items-center justify-center gap-2 text-white/80 pt-2 border-t border-white/20 w-full">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-xs font-medium">{isExpanded ? 'Ver menos' : 'Ver más detalles'}</span>
              </div>
            </div>
          </motion.div>

          {/* Contenido expandible */}
          <AnimatePresence>
            {isExpanded &&
              <>
              <div id="budget-expanded-content" />
              {budgetData.topDays?.length > 0 &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-xl p-3 md:p-4 border-2 border-indigo-200/50 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm md:text-base font-black text-indigo-900">Días Clave para Empuje de Ventas</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {budgetData.topDays.map((day, idx) =>
                    <motion.button
                      key={day.day}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {setSelectedMetric(`top-day-${idx}`);setIsModalOpen(true);}}
                      className="bg-white/80 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-indigo-200/40 text-center hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer">
                        <p className="text-lg md:text-2xl font-black text-indigo-600 mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</p>
                        <p className="text-xs md:text-sm font-bold text-indigo-900 mb-1">{day.dayFull}</p>
                        <p className="text-[10px] md:text-xs text-indigo-600 font-semibold">~{formatCurrency(day.avg)}</p>
                        <p className="text-[8px] md:text-[10px] text-indigo-500 mt-1">{(day.weight * 100).toFixed(0)}% del total</p>
                      </motion.button>
                    )}
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-3 text-center">📊 Basado en {budgetData.topDays[0]?.count || 0}+ registros históricos por día</p>
                </motion.div>
                }

              {/* Gráfico de Tendencia Diaria */}
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl p-3 md:p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h4 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5 md:gap-2">
                    <LineChartIcon className="w-4 h-4 md:w-5 md:h-5 text-rose-400/70" />
                    Tendencia Diaria del Período
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height={200} className="md:hidden">
                  <BarChart data={budgetData.dailyTrendData}>
                    <defs>
                      <linearGradient id="barCumplido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}><animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}><animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <linearGradient id="barNoCumplido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}><animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}><animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <filter id="barGlow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} angle={-45} textAnchor="end" height={50} tick={{ fontWeight: 400 }} />
                    <YAxis stroke="#9ca3af" fontSize={9} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} tick={{ fontWeight: 400 }} />
                    <Tooltip
                        contentStyle={{ background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '12px', color: '#1e293b', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '11px' }}
                        labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: '700', marginBottom: '6px' }}
                        labelFormatter={(label, payload) => {const data = payload?.[0]?.payload;return data?.fullDate || label;}}
                        formatter={(value, name, props) => {
                          const { ventas, presupuesto, cumplimiento } = props.payload;
                          const diferencia = ventas - presupuesto;
                          const cumplido = cumplimiento >= 100;
                          return [<div key="info" style={{ fontSize: '11px' }}><div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>💰 Venta: {formatCurrency(ventas)}</div><div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>🎯 Meta: {formatCurrency(presupuesto)}</div><div style={{ fontWeight: 'bold', color: cumplido ? '#059669' : '#dc2626', borderTop: '1px solid #e5e7eb', paddingTop: '4px', marginTop: '4px' }}>{cumplido ? '✅' : '❌'} {cumplimiento.toFixed(0)}% ({diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)})</div></div>, ''];
                        }} />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                    <Bar dataKey={(data) => data.ventas - data.presupuesto} fill="url(#barCumplido)" radius={[4, 4, 0, 0]} animationDuration={1000} filter="url(#barGlow)">
                      {budgetData.dailyTrendData.map((entry, index) =>
                        <Cell key={`cell-${index}`} fill={entry.cumplimiento >= 100 ? 'url(#barCumplido)' : 'url(#barNoCumplido)'} />
                        )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={280} className="hidden md:block">
                  <BarChart data={budgetData.dailyTrendData}>
                    <defs>
                      <linearGradient id="barCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}><animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}><animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <linearGradient id="barNoCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}><animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}><animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <filter id="barGlowDesktop">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} angle={-35} textAnchor="end" height={65} tick={{ fontWeight: 500 }} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} tick={{ fontWeight: 400 }} />
                    <Tooltip
                        contentStyle={{ background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '14px', color: '#1e293b', padding: '14px 18px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', minWidth: '220px' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: '700', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}
                        labelFormatter={(label, payload) => {const data = payload?.[0]?.payload;return data?.fullDate || label;}}
                        formatter={(value, name, props) => {
                          const { ventas, presupuesto, cumplimiento } = props.payload;
                          const diferencia = ventas - presupuesto;
                          const cumplido = cumplimiento >= 100;
                          return [<div key="info" style={{ fontSize: '13px' }}><div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>💰 Venta: {formatCurrency(ventas)}</div><div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>🎯 Meta: {formatCurrency(presupuesto)}</div><div style={{ fontWeight: 'bold', color: cumplido ? '#059669' : '#dc2626', borderTop: '2px solid #e5e7eb', paddingTop: '8px', marginTop: '4px', fontSize: '14px' }}>{cumplido ? '✅ Cumplido' : '❌ No cumplido'}: {cumplimiento.toFixed(0)}%<div style={{ fontSize: '12px', marginTop: '4px', color: cumplido ? '#10b981' : '#ef4444' }}>Diferencia: {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}</div></div></div>, ''];
                        }} />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} content={() =>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #a7f3d0, #d1fae5)', borderRadius: '3px' }}></div><span style={{ color: '#059669' }}>✅ Meta superada</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #fda4af, #fecdd3)', borderRadius: '3px' }}></div><span style={{ color: '#dc2626' }}>❌ Meta no alcanzada</span></div>
                      </div>
                      } />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />
                    <Bar dataKey={(data) => data.ventas - data.presupuesto} radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" filter="url(#barGlowDesktop)">
                      {budgetData.dailyTrendData.map((entry, index) =>
                        <Cell key={`cell-${index}`} fill={entry.cumplimiento >= 100 ? 'url(#barCumplidoDesktop)' : 'url(#barNoCumplidoDesktop)'} />
                        )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Semana Retail */}
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full bg-gradient-to-r from-purple-50/40 to-pink-50/40 rounded-xl p-3 md:p-4 border border-purple-200/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400/70 flex-shrink-0" />
                    <h4 className="text-xs md:text-sm font-bold text-purple-700/80 truncate">
                      Semana Actual ({format(budgetData.currentWeekStart, 'dd MMM', { locale: es })} - {format(budgetData.currentWeekEnd, 'dd MMM', { locale: es })})
                    </h4>
                  </div>
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold flex-shrink-0 self-start md:self-auto ${budgetData.weeklyCompliance >= 100 ? 'bg-emerald-100/60 text-emerald-600' : 'bg-amber-100/60 text-amber-600'}`}>
                    {budgetData.weeklyCompliance.toFixed(0)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('weekly-budget');setIsModalOpen(true);}} className="bg-purple-50 rounded-lg p-2 md:p-3 border border-purple-200/40 transition-all text-left hover:border-purple-400">
                    <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Meta Semanal</p>
                    <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">{formatCurrency(budgetData.weeklyBudget)}</p>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('weekly-sales');setIsModalOpen(true);}} className="bg-purple-50 rounded-lg p-2 md:p-3 border border-purple-200/40 transition-all text-left hover:border-purple-400">
                    <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Venta Actual</p>
                    <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">{formatCurrency(budgetData.currentWeekSales)}</p>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('weekly-projection');setIsModalOpen(true);}} className="bg-pink-50 rounded-lg p-2 md:p-3 border border-pink-200/40 transition-all text-left hover:border-pink-400">
                    <p className="text-[10px] md:text-xs text-pink-500/70 mb-1">Proyección</p>
                    <p className="text-sm md:text-lg font-black text-pink-600 leading-tight">{formatCurrency(budgetData.weekProjection)}</p>
                  </motion.button>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-500/60">Cumplimiento actual</span>
                    <span className="font-bold text-purple-600">{budgetData.weeklyCompliance.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(budgetData.weeklyCompliance, 100)}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-purple-400/60 to-pink-400/60 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-pink-500/60">Proyección de cierre</span>
                    <span className={`font-bold ${budgetData.projectionCompliance >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {budgetData.projectionCompliance.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Barra de Proyección Mensual */}
              <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {setSelectedMetric('month-projection');setIsModalOpen(true);}}
                  className="w-full bg-white/40 rounded-xl p-3 md:p-4 border border-indigo-200/40 hover:border-indigo-400 transition-all cursor-pointer">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs lg:text-sm">
                    <span className="text-indigo-700/70 font-semibold">Proyección Cierre Mes</span>
                    <span className="font-bold lg:font-black text-indigo-900 lg:text-lg">{budgetData.monthProjectionCompliance.toFixed(0)}%</span>
                  </div>
                  <div className="relative h-3 lg:h-4 bg-white/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(budgetData.monthProjectionCompliance, 100)}%` }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                        className={`h-full rounded-full relative ${budgetData.monthProjectionCompliance >= 100 ? 'bg-gradient-to-r from-emerald-400/80 to-green-300/80' : budgetData.monthProjectionCompliance >= 90 ? 'bg-gradient-to-r from-amber-400/80 to-orange-300/80' : 'bg-gradient-to-r from-rose-400/80 to-pink-400/80'}`}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)', width: '40%', animation: 'slideRight 2.5s linear infinite' }} />
                    </motion.div>
                  </div>
                  <p className="text-[10px] lg:text-xs text-indigo-600/60">
                    {budgetData.monthProjectionCompliance >= 100 ?
                      `🎉 Proyectas superar en ${formatCurrency(budgetData.monthProjection - budgetData.monthlyBudget)}` :
                      `📊 Proyección: ${formatCurrency(budgetData.monthProjection)} • Falta: ${formatCurrency(budgetData.monthlyBudget - budgetData.monthProjection)}`}
                  </p>
                </div>
              </motion.button>

              {/* Gráfico de Semanas */}
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 rounded-2xl p-4 border-2 border-rose-200/30 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-rose-900 flex items-center gap-2 text-base">
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}>
                      <BarChart3 className="w-5 h-5 text-rose-400" />
                    </motion.div>
                    Comparativa Semanal
                  </h4>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetData.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barPresupuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.7}><animate attributeName="stopOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.4}><animate attributeName="stopOpacity" values="0.4;0.6;0.4" dur="2.5s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <linearGradient id="barVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.7}><animate attributeName="stopOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.4}><animate attributeName="stopOpacity" values="0.4;0.6;0.4" dur="2.5s" repeatCount="indefinite" /></stop>
                      </linearGradient>
                      <filter id="barGlowWeekly">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.3} />
                    <XAxis dataKey="semana" stroke="#9ca3af" fontSize={11} fontWeight={600} tick={{ fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" fontSize={11} fontWeight={500} tickFormatter={(value) => {if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;return `$${value.toLocaleString('es-CO')}`;}} tick={{ fill: '#9ca3af' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #fda4af', borderRadius: '12px', color: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '12px 16px' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}
                        formatter={(value, name) => [<span key={name} style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(value)}</span>, name === 'presupuesto' ? '🎯 Meta' : '💰 Venta']} />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} content={() =>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #a7f3d0, #d1fae5)', borderRadius: '3px' }}></div><span style={{ color: '#059669' }}>🎯 Meta</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #fda4af, #fecdd3)', borderRadius: '3px' }}></div><span style={{ color: '#dc2626' }}>💰 Venta</span></div>
                      </div>
                      } />
                    <Bar dataKey="presupuesto" fill="url(#barPresupuesto)" radius={[8, 8, 0, 0]} filter="url(#barGlowWeekly)" animationDuration={1200} animationEasing="ease-out" />
                    <Bar dataKey="ventas" fill="url(#barVentas)" radius={[8, 8, 0, 0]} filter="url(#barGlowWeekly)" animationDuration={1500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Proyección de Semanas Futuras */}
              {(() => {
                  const now = new Date();
                  const monthStartCalc = startOfMonth(now);
                  const monthEndCalc = endOfMonth(now);
                  const weeks = eachWeekOfInterval({ start: monthStartCalc, end: monthEndCalc }, { weekStartsOn: 1 });
                  const futureWeeks = weeks.map((weekStart, idx) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter((d) => d >= monthStartCalc && d <= monthEndCalc);
                    const weekBudget = daysInWeek.reduce((sum, day) => {
                      const dayOfWeek = day.getDay();
                      const avgByDayOfWeekLocal = [0, 0, 0, 0, 0, 0, 0].map((_, i) => {
                        const historicalForDay = dailySales.filter((s) => {try {const sd = parseISO(s.date);return sd.getDay() === i && s.total_sales > 0;} catch {return false;}});
                        return historicalForDay.length > 0 ? historicalForDay.reduce((s, sale) => s + sale.total_sales, 0) / historicalForDay.length : 0;
                      });
                      const totalWeeklyAvgLocal = avgByDayOfWeekLocal.reduce((a, b) => a + b, 0);
                      if (totalWeeklyAvgLocal === 0) return sum + activeBudget.sales_budget * 1.05 / 30;
                      const scaleFactor = activeBudget.sales_budget * 1.05 / (totalWeeklyAvgLocal * (30 / 7));
                      return sum + avgByDayOfWeekLocal[dayOfWeek] * scaleFactor;
                    }, 0);
                    return { semana: `S${idx + 1}`, weekStart, weekEnd, presupuesto: weekBudget, isCurrent: idx + 1 === budgetData.currentWeekNumber, isFuture: idx + 1 > budgetData.currentWeekNumber };
                  }).filter((w) => w.isFuture);

                  if (futureWeeks.length === 0) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gradient-to-br from-purple-50/40 to-indigo-50/40 rounded-2xl p-4 border-2 border-purple-200/30 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-purple-900 flex items-center gap-2 text-sm md:text-base">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                        Presupuesto Proyectado Semanas Restantes
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">Estimación basada en patrones históricos de cada día de la semana</p>
                    <div className="space-y-2">
                      {futureWeeks.map((week, idx) =>
                        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/40 hover:border-purple-400 transition-all">
                          <div>
                            <span className="text-sm font-bold text-purple-700">{week.semana}</span>
                            <span className="text-xs text-purple-600 ml-2">({format(week.weekStart, 'dd MMM', { locale: es })} - {format(week.weekEnd, 'dd MMM', { locale: es })})</span>
                          </div>
                          <span className="font-black text-purple-900 text-base">{formatCurrency(week.presupuesto)}</span>
                        </motion.div>
                        )}
                    </div>
                    <p className="text-[10px] text-purple-500 mt-3 text-center">💡 Proyecciones estimadas - ajusta según estrategia comercial</p>
                  </motion.div>);

                })()}

              {/* Grid de métricas resumidas */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('base');setIsModalOpen(true);}} className="bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-3 border border-rose-200/40 transition-all text-left hover:border-rose-400">
                  <p className="text-xs text-rose-500/70 mb-1">Base Diaria</p>
                  <p className="text-lg font-bold text-rose-600 leading-tight">{formatCurrency(budgetData.dailyBaseBudget)}</p>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('remaining');setIsModalOpen(true);}} className="bg-gradient-to-br from-emerald-50/40 to-green-50/40 rounded-lg p-3 border border-emerald-200/40 transition-all text-left hover:border-emerald-400">
                  <p className="text-xs text-emerald-500/70 mb-1">Días Restantes</p>
                  <p className="text-lg font-bold text-emerald-600">{budgetData.remainingDays}</p>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('pending');setIsModalOpen(true);}} className="bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-3 border border-rose-200/40 transition-all text-left hover:border-rose-400">
                  <p className="text-xs text-rose-500/70 mb-1">Por Vender</p>
                  <p className="text-lg font-bold text-rose-600 leading-tight">{formatCurrency(budgetData.remainingBudget)}</p>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => {setSelectedMetric('compliance');setIsModalOpen(true);}} className={`rounded-lg p-3 border transition-all text-left ${isOnTrack ? 'bg-gradient-to-br from-emerald-50/40 to-green-50/40 border-emerald-200/40 hover:border-emerald-400' : 'bg-gradient-to-br from-rose-50/40 to-pink-50/40 border-rose-200/40 hover:border-rose-400'}`}>
                  <p className={`text-xs mb-1 ${isOnTrack ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Cumplimiento</p>
                  <p className={`text-lg font-bold ${isOnTrack ? 'text-emerald-600' : 'text-rose-600'}`}>{budgetData.compliance.toFixed(1)}%</p>
                </motion.button>
              </div>

              {/* Modal de métricas */}
              <BudgetMetricsModal
                  isOpen={isModalOpen}
                  onClose={setIsModalOpen}
                  selectedMetric={selectedMetric}
                  budgetData={budgetData}
                  activeBudget={activeBudget}
                  dailySales={dailySales}
                  formatCurrency={formatCurrency}
                  gregorianMode={gregorianMode} />
              </>
              }
          </AnimatePresence>
          </>
          }
        </CardContent>
      </Card>
    </motion.div>);

}