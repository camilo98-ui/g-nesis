import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BarChart3, LineChart as LineChartIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LineChart, Line } from 'recharts';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency, onConfigureBudget, currentDateRange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generar recomendaciones dinámicas
  const getSmartRecommendation = (data) => {
    if (!data || data.noBudget) return null;
    
    const { compliance, weeklyCompliance, projectionCompliance, accumulatedGap, todayCompliance } = data;
    
    if (projectionCompliance >= 110) {
      return {
        icon: '🚀',
        title: 'Ritmo Excepcional',
        message: 'Superando proyecciones. Considera potenciar productos premium para maximizar margen.',
        color: 'emerald',
        action: 'Optimizar Mix de Productos'
      };
    }
    
    if (compliance >= 100 && weeklyCompliance >= 95) {
      return {
        icon: '🎯',
        title: 'En Meta Perfecta',
        message: 'Cumplimiento sólido. Mantén el enfoque en experiencia de cliente y upselling.',
        color: 'emerald',
        action: 'Mantener Estrategia Actual'
      };
    }
    
    if (projectionCompliance >= 85 && projectionCompliance < 100) {
      return {
        icon: '📈',
        title: 'Cerca de la Meta',
        message: 'A punto de alcanzar objetivo. Enfoca en ticket promedio y productos sugeridos.',
        color: 'amber',
        action: 'Potenciar Ticket Promedio'
      };
    }
    
    if (accumulatedGap > 0 && todayCompliance < 80) {
      return {
        icon: '⚡',
        title: 'Acción Requerida',
        message: 'Brecha acumulada detectada. Revisa inventario de productos top y activa promociones.',
        color: 'rose',
        action: 'Activar Plan de Recuperación'
      };
    }
    
    if (weeklyCompliance < 70) {
      return {
        icon: '🎪',
        title: 'Impulso Necesario',
        message: 'Considera activar campañas de tráfico y revisar horarios de mayor venta.',
        color: 'orange',
        action: 'Revisar Estrategia Comercial'
      };
    }
    
    return {
      icon: '💡',
      title: 'Análisis Continuo',
      message: 'Monitorea tendencias de venta por hora para optimizar personal y stock.',
      color: 'blue',
      action: 'Optimizar Operaciones'
    };
  };

  // Calcular datos del presupuesto retail
  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) {
      // Sin presupuesto, mostrar solo información básica
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const currentWeekStart = currentDateRange?.from || startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = currentDateRange?.to || endOfWeek(now, { weekStartsOn: 1 });
      
      const weeks = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn: 1 }
      );
      
      const currentWeekNumber = weeks.findIndex(w => {
        const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
        return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
      }) + 1;
      
      return {
        noBudget: true,
        currentWeekNumber,
        totalWeeks: weeks.length,
        remainingDays: eachDayOfInterval({ start: now, end: monthEnd }).length,
        currentWeekStart,
        currentWeekEnd
      };
    }

    const now = new Date();
    
    // CALENDARIO RETAIL: Mes empieza el 29 del mes anterior
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Determinar el inicio del mes retail (29 del mes anterior)
    const retailMonthStart = new Date(currentYear, currentMonth - 1, 29);
    
    // Determinar el fin del mes retail (28 del mes actual)
    const retailMonthEnd = new Date(currentYear, currentMonth, 28);
    
    const monthStart = retailMonthStart;
    const monthEnd = retailMonthEnd;

    // Usar el rango de fechas del filtro si está disponible, de lo contrario, la semana retail actual
    const currentWeekStart = currentDateRange?.from || startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = currentDateRange?.to || endOfWeek(now, { weekStartsOn: 1 });

    // Obtener todas las semanas retail que tocan el mes actual
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    // Calcular días del mes que efectivamente tienen venta (lunes a domingo del mes)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

    // Días completos de la semana retail seleccionada (siempre 7 días)
    const fullCurrentRetailWeekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

    // Analizar histórico de ventas por día de la semana (0=Domingo, 6=Sábado)
    // INCLUYE TODOS LOS DATOS HISTÓRICOS, no solo del mes actual
    const salesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sum
    const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Count

    dailySales.forEach(s => {
      try {
        const saleDate = parseISO(s.date);
        const dayOfWeek = saleDate.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
        if (s.total_sales && s.total_sales > 0) { // Solo contar días con ventas reales
          salesByDayOfWeek[dayOfWeek] += s.total_sales;
          countByDayOfWeek[dayOfWeek]++;
        }
      } catch (error) {
        console.error('Error parsing date:', s.date, error);
      }
    });

    // Promedio histórico del día de la semana actual (ej: promedio de todos los viernes)
    const todayDayOfWeek = now.getDay();
    
    // Buscar TODOS los registros históricos del mismo día de la semana (ej: todos los viernes)
    const historicalSalesForDay = dailySales.filter(s => {
      try {
        const saleDate = parseISO(s.date);
        return saleDate.getDay() === todayDayOfWeek && s.total_sales > 0;
      } catch {
        return false;
      }
    });
    
    const historicalAvgToday = historicalSalesForDay.length > 0
      ? historicalSalesForDay.reduce((sum, s) => sum + s.total_sales, 0) / historicalSalesForDay.length
      : 0;
    
    // Log para debug
    console.log('📊 Histórico día actual:', {
      dia: format(now, 'EEEE', { locale: es }),
      promedio: historicalAvgToday,
      cantidadDias: historicalSalesForDay.length,
      fechasEncontradas: historicalSalesForDay.map(s => s.date)
    });

    // Calcular promedio por día de semana
    const avgByDayOfWeek = salesByDayOfWeek.map((sum, idx) => 
      countByDayOfWeek[idx] > 0 ? sum / countByDayOfWeek[idx] : 0
    );

    // Calcular peso relativo de cada día (proporción del total semanal)
    const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
    const weightByDayOfWeek = avgByDayOfWeek.map(avg => 
      totalWeeklyAvg > 0 ? avg / totalWeeklyAvg : 1/7
    );

    // Calcular presupuesto base usando el 105% del presupuesto mensual para cumplir meta alcanzable
    const TARGET_PERCENTAGE = 1.05; // 105% del presupuesto
    const adjustedMonthlyBudget = activeBudget.sales_budget * TARGET_PERCENTAGE;
    const dailyBaseBudget = adjustedMonthlyBudget / daysInMonth;

    // Función para obtener presupuesto ajustado según día de la semana y tendencia histórica
    const getDailyBudget = (date) => {
      if (totalWeeklyAvg === 0) return dailyBaseBudget; // Sin histórico
      const dayOfWeek = date.getDay();

      // Si hay suficiente histórico, usar directamente el promedio histórico escalado al presupuesto mensual
      if (countByDayOfWeek[dayOfWeek] >= 3) {
        // Escalar el promedio histórico para que la suma semanal coincida con el presupuesto mensual ajustado al 105%
        const totalHistoricalAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
        const monthlyHistoricalProjection = totalHistoricalAvg * (daysInMonth / 7);
        const scaleFactor = adjustedMonthlyBudget / monthlyHistoricalProjection;
        return avgByDayOfWeek[dayOfWeek] * scaleFactor;
      } else {
        // Sin suficiente histórico, usar presupuesto base ajustado
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

    // Presupuesto restante a alcanzar (meta del 105%)
    const remainingBudget = adjustedMonthlyBudget - salesUntilYesterday - todayActualSales;

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
      return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
    }) + 1;

    // Ventas de la semana SELECCIONADA (no necesariamente la actual)
    const currentWeekSales = dailySales.filter(s => {
      try {
        const saleDate = parseISO(s.date);
        return isWithinInterval(saleDate, { start: currentWeekStart, end: currentWeekEnd });
      } catch {
        return false;
      }
    }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

    // Presupuesto de la semana SELECCIONADA - TODA la semana retail (7 días completos)
    const weeklyBudget = fullCurrentRetailWeekDays.reduce((sum, day) => sum + getDailyBudget(day), 0);

    // Calcular proyección de la semana - SUAVIZADA con histórico
    const daysPassedInWeek = eachDayOfInterval({ start: currentWeekStart, end: now })
      .filter(d => isWithinInterval(d, { start: currentWeekStart, end: currentWeekEnd }) && d <= now).length;
    const avgDailySales = daysPassedInWeek > 0 ? currentWeekSales / daysPassedInWeek : 0;

    // Calcular proyección más realista combinando ritmo actual con histórico
    const totalDaysInWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }).length;

    // Si solo han pasado 1-2 días, ponderar más el histórico (80% histórico, 20% actual)
    // Si han pasado más días, ponderar más el actual (40% histórico, 60% actual)
    const historicalWeight = daysPassedInWeek <= 2 ? 0.8 : 0.4;
    const currentWeight = 1 - historicalWeight;

    // Proyección ponderada
    const historicalDailyAvg = totalWeeklyAvg > 0 ? totalWeeklyAvg / 7 : avgDailySales;
    const blendedDailyAvg = (historicalDailyAvg * historicalWeight) + (avgDailySales * currentWeight);
    const weekProjection = blendedDailyAvg * totalDaysInWeek;
    const projectionCompliance = weeklyBudget > 0 ? (weekProjection / weeklyBudget * 100) : 0;

    // Datos para gráficos - TODOS los días de la semana seleccionada
    const dailyTrendData = fullCurrentRetailWeekDays.map(day => {
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
      
      // CRÍTICO: usar presupuesto ajustado SOLO para el día de hoy (real 'now')
      const isDayToday = isSameDay(day, now);
      const presupuestoDia = isDayToday ? adjustedDailyBudget : getDailyBudget(day);

      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        ventas: ventasDelDia,
        presupuesto: presupuestoDia,
        cumplimiento: presupuestoDia > 0 ? (ventasDelDia / presupuestoDia * 100) : 0
      };
    });

    const weeklyData = weeks.map((weekStart, idx) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      // Todos los días de la semana retail (7 días completos)
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
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

    // Calcular proyección de cierre mensual basada en el ritmo acumulado
    const totalMonthSales = salesUntilYesterday + todayActualSales;
    const daysElapsed = now.getDate();
    const monthAvgDailySales = daysElapsed > 0 ? totalMonthSales / daysElapsed : 0;
    const monthProjection = totalMonthSales + (monthAvgDailySales * (remainingDays - 1));
    const monthProjectionCompliance = adjustedMonthlyBudget > 0 ? (monthProjection / adjustedMonthlyBudget * 100) : 0;

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
      currentWeekEnd,
      // Proyección mensual
      totalMonthSales,
      daysElapsed,
      avgDailySales: monthAvgDailySales,
      monthProjection,
      monthProjectionCompliance,
      monthlyBudget: adjustedMonthlyBudget,
      // Datos para sparklines (últimos 7 días)
      last7DaysSales: dailySales
        .filter(s => {
          try {
            const saleDate = parseISO(s.date);
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return saleDate >= sevenDaysAgo && saleDate <= now && s.total_sales > 0;
          } catch {
            return false;
          }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(s => ({ value: s.total_sales })),
      // Días de mayor oportunidad (por peso histórico)
      topDays: avgByDayOfWeek
        .map((avg, idx) => ({
          day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][idx],
          dayFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][idx],
          avg,
          weight: weightByDayOfWeek[idx],
          count: countByDayOfWeek[idx]
        }))
        .filter(d => d.count >= 2)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3)
    };
  }, [dailySales, activeBudget, currentDateRange]);

  const smartRecommendation = getSmartRecommendation(budgetData);

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
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
                <p className="text-xs text-slate-600 font-normal mt-0.5">Calendario Retail - Semana {budgetData.currentWeekNumber} de {budgetData.totalWeeks}</p>
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
            className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-2xl shadow-md p-6 lg:p-8 border border-rose-300/40 relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-7 lg:mb-5">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Target className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  <p className="text-sm lg:text-base text-white/90 font-semibold lg:font-bold">Meta del Día</p>
                </div>
                {needsRecovery && (
                  <div className="px-3 py-1 lg:px-4 lg:py-1.5 bg-amber-100/70 rounded-full">
                    <p className="text-[10px] lg:text-xs font-black text-amber-700">AJUSTADO</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 lg:gap-10 mb-6 lg:mb-5">
                <div className="text-left">
                  <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-2 font-semibold">Meta del Día (105%)</p>
                  <motion.p
                    key={budgetData.adjustedDailyBudget}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl md:text-3xl lg:text-5xl font-black text-white leading-none mb-2"
                  >
                    {formatCurrency(budgetData.adjustedDailyBudget)}
                  </motion.p>
                  <p className="text-xs lg:text-sm text-white/70">Base: {formatCurrency(budgetData.adjustedDailyBudget / 1.05)}</p>
                  
                  {/* Sparkline debajo del número */}
                  {budgetData.last7DaysSales?.length > 0 && (
                    <div className="mt-3 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={budgetData.last7DaysSales}>
                          <defs>
                            <filter id="glow1">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="-20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="-0.2;1.2;1.2" dur="3s" repeatCount="indefinite"/>
                              </stop>
                              <stop offset="0%" stopColor="#fff" stopOpacity="1">
                                <animate attributeName="offset" values="0;1.4;1.4" dur="3s" repeatCount="indefinite"/>
                              </stop>
                              <stop offset="20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="0.2;1.6;1.6" dur="3s" repeatCount="indefinite"/>
                              </stop>
                            </linearGradient>
                          </defs>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#fff" 
                            strokeWidth={1.5} 
                            dot={false}
                            strokeOpacity={0.3}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="url(#lineGrad1)" 
                            strokeWidth={2.5} 
                            dot={false}
                            filter="url(#glow1)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                
                <div className="text-left">
                  <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-2 font-semibold">Promedio Histórico</p>
                  <p className="text-2xl md:text-3xl lg:text-5xl font-black text-white leading-none mb-2">
                    {formatCurrency(budgetData.historicalAvgToday)}
                  </p>
                  <p className="text-xs lg:text-sm text-white/70">{format(new Date(), 'EEEE', { locale: es })}s anteriores</p>
                  
                  {/* Sparkline debajo del número */}
                  {budgetData.last7DaysSales?.length > 0 && (
                    <div className="mt-3 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={budgetData.last7DaysSales}>
                          <defs>
                            <filter id="glow2">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="-20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="-0.5;-0.5;1.2" dur="3s" repeatCount="indefinite"/>
                              </stop>
                              <stop offset="0%" stopColor="#fff" stopOpacity="1">
                                <animate attributeName="offset" values="-0.3;-0.3;1.4" dur="3s" repeatCount="indefinite"/>
                              </stop>
                              <stop offset="20%" stopColor="#fff" stopOpacity="0">
                                <animate attributeName="offset" values="-0.1;-0.1;1.6" dur="3s" repeatCount="indefinite"/>
                              </stop>
                            </linearGradient>
                          </defs>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#fff" 
                            strokeWidth={1.5} 
                            dot={false}
                            strokeOpacity={0.3}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="url(#lineGrad2)" 
                            strokeWidth={2.5} 
                            dot={false}
                            filter="url(#glow2)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-white/70">Proyección Semanal</span>
                  <span className="font-bold lg:font-black text-white lg:text-lg">{budgetData.projectionCompliance.toFixed(0)}%</span>
                </div>
                <div className="relative h-3 lg:h-4 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetData.projectionCompliance, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                    className={`h-full rounded-full relative overflow-hidden ${
                      budgetData.projectionCompliance >= 100 
                        ? 'bg-gradient-to-r from-emerald-300/80 to-green-200/80' 
                        : budgetData.projectionCompliance >= 85
                        ? 'bg-gradient-to-r from-amber-200/80 to-yellow-100/80'
                        : 'bg-gradient-to-r from-orange-200/80 to-red-200/80'
                    }`}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 40%, transparent 70%)',
                        filter: 'blur(8px)'
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.1, 0.8]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.div>
                </div>
                <p className="text-[10px] lg:text-xs text-white/50 lg:text-white/60">
                  {budgetData.projectionCompliance >= 100 
                    ? `🚀 Superando meta en ${(budgetData.projectionCompliance - 100).toFixed(0)}%`
                    : `📈 ${formatCurrency(budgetData.weeklyBudget - budgetData.weekProjection)} para alcanzar meta`}
                </p>
                </div>

                {/* Barra de Proyección Mensual */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs lg:text-sm">
                    <span className="text-white/70">Proyección Cierre Mes</span>
                    <span className="font-bold lg:font-black text-white lg:text-lg">{budgetData.monthProjectionCompliance.toFixed(0)}%</span>
                  </div>
                  <div className="relative h-3 lg:h-4 bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={() => {
                    setSelectedMetric('month-projection');
                    setIsModalOpen(true);
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetData.monthProjectionCompliance, 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className={`h-full rounded-full relative overflow-hidden ${
                        budgetData.monthProjectionCompliance >= 100 
                          ? 'bg-gradient-to-r from-emerald-300/80 to-green-200/80' 
                          : budgetData.monthProjectionCompliance >= 90
                          ? 'bg-gradient-to-r from-amber-200/80 to-yellow-100/80'
                          : 'bg-gradient-to-r from-orange-200/80 to-red-200/80'
                      }`}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 40%, transparent 70%)',
                          filter: 'blur(8px)'
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.8, 1.1, 0.8]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    </motion.div>
                  </div>
                  <p className="text-[10px] lg:text-xs text-white/50 lg:text-white/60">
                    {budgetData.monthProjectionCompliance >= 100 
                      ? `🎉 Proyectas superar en ${formatCurrency(budgetData.monthProjection - budgetData.monthlyBudget)}`
                      : `📊 Falta ${formatCurrency(budgetData.monthlyBudget - budgetData.monthProjection)} para meta mensual`}
                  </p>
                </div>

                {needsRecovery && (
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Incluye recuperación de {formatCurrency(budgetData.accumulatedGap)}</span>
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
              {/* Días de Mayor Oportunidad */}
              {budgetData.topDays?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-xl p-3 md:p-4 border-2 border-indigo-200/50 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm md:text-base font-black text-indigo-900">
                      Días Clave para Empuje de Ventas
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {budgetData.topDays.map((day, idx) => (
                      <motion.button
                        key={day.day}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMetric(`top-day-${idx}`);
                          setIsModalOpen(true);
                        }}
                        className="bg-white/80 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-indigo-200/40 text-center hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <p className="text-lg md:text-2xl font-black text-indigo-600 mb-1">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </p>
                        <p className="text-xs md:text-sm font-bold text-indigo-900 mb-1">
                          {day.dayFull}
                        </p>
                        <p className="text-[10px] md:text-xs text-indigo-600 font-semibold">
                          ~{formatCurrency(day.avg)}
                        </p>
                        <p className="text-[8px] md:text-[10px] text-indigo-500 mt-1">
                          {(day.weight * 100).toFixed(0)}% del total
                        </p>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-3 text-center">
                    📊 Basado en {budgetData.topDays[0]?.count || 0}+ registros históricos por día
                  </p>
                </motion.div>
              )}

              {/* Gráfico de Tendencia Diaria */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl p-3 md:p-4 border border-slate-200/60 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h4 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5 md:gap-2">
                      <LineChartIcon className="w-4 h-4 md:w-5 md:h-5 text-rose-400/70" />
                      Tendencia Diaria de la Semana
                    </h4>
                  </div>
                  <ResponsiveContainer width="100%" height={200} className="md:hidden">
                    <BarChart data={budgetData.dailyTrendData.filter(d => d.ventas > 0)}>
                      <defs>
                        <linearGradient id="barCumplido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}>
                            <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                          </stop>
                          <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}>
                            <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                          </stop>
                        </linearGradient>
                        <linearGradient id="barNoCumplido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}>
                            <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                          </stop>
                          <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}>
                            <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                          </stop>
                        </linearGradient>
                        <filter id="barGlow">
                          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <linearGradient id="barShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="-50%" stopColor="#ffffff" stopOpacity="0">
                            <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite"/>
                          </stop>
                          <stop offset="-25%" stopColor="#ffffff" stopOpacity="0.4">
                            <animate attributeName="offset" values="-0.25;1.75" dur="3s" repeatCount="indefinite"/>
                          </stop>
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0">
                            <animate attributeName="offset" values="0;2" dur="3s" repeatCount="indefinite"/>
                          </stop>
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
                        filter="url(#barGlow)"
                      >
                        {budgetData.dailyTrendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cumplimiento >= 100 ? 'url(#barCumplido)' : 'url(#barNoCumplido)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={280} className="hidden md:block">
                  <BarChart data={budgetData.dailyTrendData.filter(d => d.ventas > 0)}>
                    <defs>
                      <linearGradient id="barCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.9}>
                          <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.6}>
                          <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                        </stop>
                      </linearGradient>
                      <linearGradient id="barNoCumplidoDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.9}>
                          <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.6}>
                          <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                        </stop>
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                      <filter id="barGlowDesktop">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
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
                      filter="url(#barGlowDesktop)"
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
                onClick={() => {
                  setSelectedMetric('weekly-budget');
                  setIsModalOpen(true);
                }}
                className="bg-purple-50 rounded-lg p-2 md:p-3 border border-purple-200/40 transition-all text-left hover:border-purple-400"
              >
                <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Meta Semanal</p>
                <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">
                  {formatCurrency(budgetData.weeklyBudget)}
                </p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedMetric('weekly-sales');
                  setIsModalOpen(true);
                }}
                className="bg-purple-50 rounded-lg p-2 md:p-3 border border-purple-200/40 transition-all text-left hover:border-purple-400"
              >
                <p className="text-[10px] md:text-xs text-purple-500/70 mb-1">Venta Actual</p>
                <p className="text-sm md:text-lg font-black text-purple-600 leading-tight">
                  {formatCurrency(budgetData.currentWeekSales)}
                </p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedMetric('weekly-projection');
                  setIsModalOpen(true);
                }}
                className="bg-pink-50 rounded-lg p-2 md:p-3 border border-pink-200/40 transition-all text-left hover:border-pink-400"
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

              {/* Barra de Proyección Mensual */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedMetric('month-projection');
                  setIsModalOpen(true);
                }}
                className="w-full bg-white/40 rounded-xl p-3 md:p-4 border border-indigo-200/40 hover:border-indigo-400 transition-all cursor-pointer"
              >
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
                      className={`h-full rounded-full relative ${
                        budgetData.monthProjectionCompliance >= 100 
                          ? 'bg-gradient-to-r from-emerald-400/80 to-green-300/80' 
                          : budgetData.monthProjectionCompliance >= 90
                          ? 'bg-gradient-to-r from-amber-400/80 to-orange-300/80'
                          : 'bg-gradient-to-r from-rose-400/80 to-pink-400/80'
                      }`}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                          width: '40%',
                          animation: 'slideRight 2.5s linear infinite'
                        }}
                      />
                    </motion.div>
                  </div>
                  <p className="text-[10px] lg:text-xs text-indigo-600/60">
                    {budgetData.monthProjectionCompliance >= 100 
                      ? `🎉 Proyectas superar en ${formatCurrency(budgetData.monthProjection - budgetData.monthlyBudget)}`
                      : `📊 Proyección: ${formatCurrency(budgetData.monthProjection)} • Falta: ${formatCurrency(budgetData.monthlyBudget - budgetData.monthProjection)}`}
                  </p>
                </div>
              </motion.button>

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
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.7}>
                          <animate attributeName="stopOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="100%" stopColor="#d1fae5" stopOpacity={0.4}>
                          <animate attributeName="stopOpacity" values="0.4;0.6;0.4" dur="2.5s" repeatCount="indefinite"/>
                        </stop>
                      </linearGradient>
                      <linearGradient id="barVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity={0.7}>
                          <animate attributeName="stopOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="100%" stopColor="#fecdd3" stopOpacity={0.4}>
                          <animate attributeName="stopOpacity" values="0.4;0.6;0.4" dur="2.5s" repeatCount="indefinite"/>
                        </stop>
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                      <filter id="barGlowWeekly">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
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
                    <Legend 
                      wrapperStyle={{ paddingTop: '16px' }}
                      content={() => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #a7f3d0, #d1fae5)', borderRadius: '3px' }}></div>
                            <span style={{ color: '#059669' }}>🎯 Meta</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to bottom, #fda4af, #fecdd3)', borderRadius: '3px' }}></div>
                            <span style={{ color: '#dc2626' }}>💰 Venta</span>
                          </div>
                        </div>
                      )}
                    />
                    <Bar 
                      dataKey="presupuesto" 
                      fill="url(#barPresupuesto)" 
                      radius={[8, 8, 0, 0]}
                      filter="url(#barGlowWeekly)"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="ventas" 
                      fill="url(#barVentas)" 
                      radius={[8, 8, 0, 0]}
                      filter="url(#barGlowWeekly)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Proyección de Semanas Futuras */}
              {(() => {
                const now = new Date();
                const monthStart = startOfMonth(now);
                const monthEnd = endOfMonth(now);
                const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
                
                const futureWeeks = weeks
                  .map((weekStart, idx) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
                      .filter(d => d >= monthStart && d <= monthEnd);
                    
                    const weekBudget = daysInWeek.reduce((sum, day) => {
                      const dayOfWeek = day.getDay();
                      const avgByDayOfWeek = [0,0,0,0,0,0,0].map((_, i) => {
                        const historicalForDay = dailySales.filter(s => {
                          try {
                            const saleDate = parseISO(s.date);
                            return saleDate.getDay() === i && s.total_sales > 0;
                          } catch {
                            return false;
                          }
                        });
                        return historicalForDay.length > 0
                          ? historicalForDay.reduce((s, sale) => s + sale.total_sales, 0) / historicalForDay.length
                          : 0;
                      });
                      
                      const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
                      if (totalWeeklyAvg === 0) return sum + (activeBudget.sales_budget * 1.05 / 30);
                      
                      const scaleFactor = (activeBudget.sales_budget * 1.05) / (totalWeeklyAvg * (30 / 7));
                      return sum + (avgByDayOfWeek[dayOfWeek] * scaleFactor);
                    }, 0);
                    
                    return {
                      semana: `S${idx + 1}`,
                      weekStart,
                      weekEnd,
                      presupuesto: weekBudget,
                      isCurrent: idx + 1 === budgetData.currentWeekNumber,
                      isFuture: idx + 1 > budgetData.currentWeekNumber
                    };
                  })
                  .filter(w => w.isFuture);
                
                if (futureWeeks.length === 0) return null;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-purple-50/40 to-indigo-50/40 rounded-2xl p-4 border-2 border-purple-200/30 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-purple-900 flex items-center gap-2 text-sm md:text-base">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                        Presupuesto Proyectado Semanas Restantes
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Estimación basada en patrones históricos de cada día de la semana
                    </p>
                    <div className="space-y-2">
                      {futureWeeks.map((week, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/40 hover:border-purple-400 transition-all"
                        >
                          <div>
                            <span className="text-sm font-bold text-purple-700">{week.semana}</span>
                            <span className="text-xs text-purple-600 ml-2">
                              ({format(week.weekStart, 'dd MMM', { locale: es })} - {format(week.weekEnd, 'dd MMM', { locale: es })})
                            </span>
                          </div>
                          <span className="font-black text-purple-900 text-base">{formatCurrency(week.presupuesto)}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-[10px] text-purple-500 mt-3 text-center">
                      💡 Proyecciones estimadas - ajusta según estrategia comercial
                    </p>
                  </motion.div>
                );
              })()}

              {/* Grid de métricas resumidas */}
              <div className="grid grid-cols-2 gap-3">
              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMetric('base');
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-3 border border-rose-200/40 transition-all text-left hover:border-rose-400"
              >
              <p className="text-xs text-rose-500/70 mb-1">Base Diaria</p>
              <p className="text-lg font-bold text-rose-600 leading-tight">
                {formatCurrency(budgetData.dailyBaseBudget)}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMetric('remaining');
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-br from-emerald-50/40 to-green-50/40 rounded-lg p-3 border border-emerald-200/40 transition-all text-left hover:border-emerald-400"
              >
              <p className="text-xs text-emerald-500/70 mb-1">Días Restantes</p>
              <p className="text-lg font-bold text-emerald-600">
                {budgetData.remainingDays}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMetric('pending');
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-br from-rose-50/40 to-pink-50/40 rounded-lg p-3 border border-rose-200/40 transition-all text-left hover:border-rose-400"
              >
              <p className="text-xs text-rose-500/70 mb-1">Por Vender</p>
              <p className="text-lg font-bold text-rose-600 leading-tight">
                {formatCurrency(budgetData.remainingBudget)}
              </p>
              </motion.button>

              <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMetric('compliance');
                setIsModalOpen(true);
              }}
              className={`rounded-lg p-3 border transition-all text-left ${
                isOnTrack 
                  ? 'bg-gradient-to-br from-emerald-50/40 to-green-50/40 border-emerald-200/40 hover:border-emerald-400' 
                  : 'bg-gradient-to-br from-rose-50/40 to-pink-50/40 border-rose-200/40 hover:border-rose-400'
              }`}
              >
              <p className={`text-xs mb-1 ${isOnTrack ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                Cumplimiento
              </p>
              <p className={`text-lg font-bold ${isOnTrack ? 'text-emerald-600' : 'text-rose-600'}`}>
                {budgetData.compliance.toFixed(1)}%
              </p>
                </motion.button>
              </div>

              {/* Modal de métricas */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      {selectedMetric === 'base' && '📊 Presupuesto Base vs Ajustado'}
                      {selectedMetric === 'remaining' && '📅 Proyección de Días Restantes'}
                      {selectedMetric === 'pending' && '💰 Análisis de Venta Pendiente'}
                      {selectedMetric === 'compliance' && '📈 Evolución del Cumplimiento'}
                      {selectedMetric === 'weekly-budget' && '🎯 Desglose de Meta Semanal'}
                      {selectedMetric === 'weekly-sales' && '💵 Ventas de la Semana'}
                      {selectedMetric === 'weekly-projection' && '🚀 Proyección de Cierre Semanal'}
                      {selectedMetric === 'month-projection' && '📊 Proyección de Cierre Mensual'}
                      {selectedMetric === 'recovery-plan' && '⚠️ Plan de Recuperación'}
                      {selectedMetric === 'on-track' && '✅ Rendimiento en Meta'}
                      {selectedMetric?.startsWith('top-day-') && `${budgetData.topDays[parseInt(selectedMetric.split('-')[2])]?.dayFull} - Día Estratégico`}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
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
                        
                        {/* Lista de días restantes */}
                        <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-lg p-3 mb-3 border border-emerald-200/40">
                          <p className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1">
                            📅 Días restantes del mes:
                          </p>
                          <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
                            {eachDayOfInterval({ start: new Date(), end: endOfMonth(new Date()) }).map((day, idx) => (
                              <div 
                                key={idx}
                                className={`text-center p-1.5 rounded-md text-[10px] font-semibold ${
                                  isSameDay(day, new Date()) 
                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                    : 'bg-white text-emerald-700 border border-emerald-200/50'
                                }`}
                              >
                                <div className="text-[8px] opacity-70">{format(day, 'EEE', { locale: es })}</div>
                                <div>{format(day, 'd')}</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-2 text-center">
                            {isSameDay(new Date(), endOfMonth(new Date())) 
                              ? '🎯 ¡Último día del mes!' 
                              : `Quedan ${budgetData.remainingDays} días para alcanzar la meta`}
                          </p>
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
                            <span className="font-bold text-slate-900">{eachDayOfInterval({ start: budgetData.currentWeekStart, end: budgetData.currentWeekEnd }).filter(d => isWithinInterval(d, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).length} días</span>
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

                    {selectedMetric === 'weekly-projection' && (() => {
                      const now = new Date();
                      const monthStart = startOfMonth(now);
                      const monthEnd = endOfMonth(now);
                      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
                      
                      // Proyectar presupuestos de semanas futuras basado en el ritmo actual
                      const futureWeeks = weeks
                        .map((weekStart, idx) => {
                          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                          const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
                            .filter(d => d >= monthStart && d <= monthEnd);
                          
                          const weekBudget = daysInWeek.reduce((sum, day) => {
                            const dayOfWeek = day.getDay();
                            const avgByDayOfWeek = [0,0,0,0,0,0,0].map((_, i) => {
                              const historicalForDay = dailySales.filter(s => {
                                try {
                                  const saleDate = parseISO(s.date);
                                  return saleDate.getDay() === i && s.total_sales > 0;
                                } catch {
                                  return false;
                                }
                              });
                              return historicalForDay.length > 0
                                ? historicalForDay.reduce((s, sale) => s + sale.total_sales, 0) / historicalForDay.length
                                : 0;
                            });
                            
                            const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
                            if (totalWeeklyAvg === 0) return sum + (activeBudget.sales_budget * 1.05 / 30);
                            
                            const scaleFactor = (activeBudget.sales_budget * 1.05) / (totalWeeklyAvg * (30 / 7));
                            return sum + (avgByDayOfWeek[dayOfWeek] * scaleFactor);
                          }, 0);
                          
                          return {
                            semana: `S${idx + 1}`,
                            weekStart,
                            weekEnd,
                            presupuesto: weekBudget,
                            isCurrent: idx + 1 === budgetData.currentWeekNumber,
                            isFuture: idx + 1 > budgetData.currentWeekNumber
                          };
                        })
                        .filter(w => w.isFuture);
                      
                      return (
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

                        {/* Proyección de Semanas Futuras */}
                        {futureWeeks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <h5 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              Presupuesto Proyectado Semanas Restantes
                            </h5>
                            <p className="text-xs text-slate-600 mb-3">
                              Estimación basada en patrones históricos de cada día de la semana
                            </p>
                            <div className="space-y-2">
                              {futureWeeks.map((week, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/40"
                                >
                                  <div>
                                    <span className="text-xs font-bold text-purple-700">{week.semana}</span>
                                    <span className="text-[10px] text-purple-600 ml-2">
                                      ({format(week.weekStart, 'dd MMM', { locale: es })} - {format(week.weekEnd, 'dd MMM', { locale: es })})
                                    </span>
                                  </div>
                                  <span className="font-bold text-purple-900">{formatCurrency(week.presupuesto)}</span>
                                </motion.div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 text-center">
                              💡 Estas son proyecciones estimadas basadas en histórico. Ajusta según estrategia comercial.
                            </p>
                          </div>
                        )}
                      </div>
                      );
                    })()}

                    {selectedMetric === 'month-projection' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Proyección de Cierre Mensual</h4>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200/50">
                            <p className="text-xs text-indigo-600 mb-1">Proyección de Cierre</p>
                            <p className="text-xl font-black text-indigo-900">{formatCurrency(budgetData.monthProjection)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center border border-purple-200/50">
                            <p className="text-xs text-purple-600 mb-1">Meta Mensual (105%)</p>
                            <p className="text-xl font-black text-purple-900">{formatCurrency(budgetData.monthlyBudget)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs text-emerald-600 mb-1">Vendido Hasta Hoy</p>
                            <p className="text-lg font-bold text-emerald-900">{formatCurrency(budgetData.totalMonthSales)}</p>
                            <p className="text-[10px] text-emerald-600 mt-1">{budgetData.daysElapsed} días</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-600 mb-1">Promedio Diario</p>
                            <p className="text-lg font-bold text-amber-900">{formatCurrency(budgetData.avgDailySales)}</p>
                            <p className="text-[10px] text-amber-600 mt-1">Ritmo actual</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-indigo-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-indigo-900">Cumplimiento Proyectado</span>
                            <span className={`text-3xl font-black ${
                              budgetData.monthProjectionCompliance >= 100 
                                ? 'text-emerald-600' 
                                : budgetData.monthProjectionCompliance >= 90
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}>
                              {budgetData.monthProjectionCompliance.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(budgetData.monthProjectionCompliance, 100)}%` }}
                              transition={{ duration: 1.5 }}
                              className={`h-full rounded-full ${
                                budgetData.monthProjectionCompliance >= 100 
                                  ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                                  : budgetData.monthProjectionCompliance >= 90
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                  : 'bg-gradient-to-r from-rose-400 to-pink-500'
                              }`}
                            />
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={[
                            { name: 'Vendido', value: budgetData.totalMonthSales },
                            { name: 'Proyección', value: budgetData.monthProjection },
                            { name: 'Meta', value: budgetData.monthlyBudget }
                          ]}>
                            <defs>
                              <linearGradient id="monthProjGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#monthProjGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>

                        <div className={`mt-4 p-4 rounded-xl border-2 ${
                          budgetData.monthProjectionCompliance >= 100 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : budgetData.monthProjectionCompliance >= 90
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-rose-50 border-rose-200'
                        }`}>
                          <p className="text-xs font-bold mb-2 ${
                            budgetData.monthProjectionCompliance >= 100 
                              ? 'text-emerald-900' 
                              : budgetData.monthProjectionCompliance >= 90
                              ? 'text-amber-900'
                              : 'text-rose-900'
                          }">
                            {budgetData.monthProjectionCompliance >= 100 
                              ? '🎉 Análisis: En Camino al Éxito' 
                              : budgetData.monthProjectionCompliance >= 90
                              ? '⚠️ Análisis: Atención Requerida'
                              : '🚨 Análisis: Acción Urgente Necesaria'}
                          </p>
                          <ul className={`text-xs space-y-1 ml-4 ${
                            budgetData.monthProjectionCompliance >= 100 
                              ? 'text-emerald-800' 
                              : budgetData.monthProjectionCompliance >= 90
                              ? 'text-amber-800'
                              : 'text-rose-800'
                          }`}>
                            <li>• Ventas acumuladas: {formatCurrency(budgetData.totalMonthSales)} ({(budgetData.totalMonthSales / budgetData.monthlyBudget * 100).toFixed(1)}%)</li>
                            <li>• Ritmo diario actual: {formatCurrency(budgetData.avgDailySales)} (basado en {budgetData.daysElapsed} días)</li>
                            <li>• Días restantes: {budgetData.remainingDays} días</li>
                            <li>• {budgetData.monthProjectionCompliance >= 100 
                              ? `Proyectas superar la meta en ${formatCurrency(budgetData.monthProjection - budgetData.monthlyBudget)}` 
                              : `Necesitas ${formatCurrency(budgetData.monthlyBudget - budgetData.monthProjection)} adicionales al ritmo actual`}
                            </li>
                            <li>• Promedio requerido/día: {formatCurrency(budgetData.remainingBudget / budgetData.remainingDays)} vs actual {formatCurrency(budgetData.avgDailySales)}</li>
                          </ul>
                        </div>

                        {budgetData.monthProjectionCompliance < 100 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                            <p className="text-xs font-bold text-orange-900 mb-2">💡 Plan de Acción Inmediato:</p>
                            <ul className="text-xs text-orange-800 space-y-1 ml-4">
                              <li>• Necesitas incrementar {formatCurrency((budgetData.remainingBudget / budgetData.remainingDays) - budgetData.avgDailySales)} por día</li>
                              <li>• Prioriza días de alto tráfico histórico para recuperación</li>
                              <li>• Revisa inventario de productos de mayor margen</li>
                              <li>• Activa promociones agresivas en próximos 3-5 días</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMetric === 'recovery-plan' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Plan de Recuperación de Brecha</h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                            <span className="text-xs text-rose-700">Brecha acumulada</span>
                            <span className="font-bold text-rose-900">{formatCurrency(budgetData.accumulatedGap)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                            <span className="text-xs text-amber-700">Presupuesto base diario</span>
                            <span className="font-bold text-amber-900">{formatCurrency(budgetData.dailyBaseBudget)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                            <span className="text-xs text-amber-700">Presupuesto ajustado (hoy)</span>
                            <span className="font-bold text-amber-900">{formatCurrency(budgetData.adjustedDailyBudget)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                            <span className="text-xs text-emerald-700">Días para recuperar</span>
                            <span className="font-bold text-emerald-900">{budgetData.remainingDays} días</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                            <span className="text-xs text-purple-700">% de recuperación distribuida</span>
                            <span className="font-bold text-purple-900">50%</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={[
                            { name: 'Brecha', value: budgetData.accumulatedGap, fill: '#fda4af' },
                            { name: 'Redistribuido', value: budgetData.accumulatedGap * 0.5, fill: '#fbbf24' },
                            { name: 'Días restantes', value: budgetData.remainingDays * budgetData.dailyBaseBudget, fill: '#a7f3d0' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {[
                                { fill: '#fda4af' },
                                { fill: '#fbbf24' },
                                { fill: '#a7f3d0' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs font-bold text-amber-900 mb-2">📊 Estrategia de recuperación:</p>
                          <ul className="text-xs text-amber-800 space-y-1 ml-4">
                            <li>• Se distribuye el 50% de la brecha ({formatCurrency(budgetData.accumulatedGap * 0.5)}) entre los días restantes</li>
                            <li>• Cada día tiene un incremento proporcional a su peso histórico</li>
                            <li>• El incremento máximo está limitado al 40% del presupuesto base</li>
                            <li>• Esto hace la recuperación realista y alcanzable</li>
                          </ul>
                        </div>
                        <p className="text-xs text-slate-600 mt-3">
                          ⚡ Con este plan, necesitas vender {formatCurrency(budgetData.adjustedDailyBudget)} hoy en lugar de {formatCurrency(budgetData.dailyBaseBudget)} para recuperar el terreno perdido.
                        </p>
                      </div>
                    )}

                    {selectedMetric === 'on-track' && (
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3">Rendimiento en Meta</h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                            <span className="text-xs text-emerald-700">Cumplimiento actual</span>
                            <span className="font-bold text-emerald-900">{budgetData.compliance.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                            <span className="text-xs text-emerald-700">Vendido hasta hoy</span>
                            <span className="font-bold text-emerald-900">{formatCurrency(budgetData.salesUntilYesterday + budgetData.todayActualSales)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-700">Presupuesto hasta hoy</span>
                            <span className="font-bold text-slate-900">{formatCurrency(budgetData.budgetUntilYesterday + budgetData.adjustedDailyBudget)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                            <span className="text-xs text-purple-700">Ritmo diario promedio</span>
                            <span className="font-bold text-purple-900">{formatCurrency((budgetData.salesUntilYesterday + budgetData.todayActualSales) / (new Date().getDate()))}</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <AreaChart data={budgetData.dailyTrendData}>
                            <defs>
                              <linearGradient id="onTrackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                            <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip 
                              formatter={(v, name) => [
                                formatCurrency(v),
                                name === 'ventas' ? '💰 Venta' : '🎯 Meta'
                              ]} 
                            />
                            <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#onTrackGradient)" name="ventas" />
                            <Area type="monotone" dataKey="presupuesto" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="none" name="presupuesto" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-xs font-bold text-emerald-900 mb-2">🎯 Indicadores positivos:</p>
                          <ul className="text-xs text-emerald-800 space-y-1 ml-4">
                            <li>• El ritmo de ventas es consistente con el presupuesto</li>
                            <li>• No hay brecha acumulada que recuperar</li>
                            <li>• El cumplimiento está por encima del 95%</li>
                            <li>• Se proyecta alcanzar la meta mensual manteniendo este ritmo</li>
                          </ul>
                        </div>
                        <p className="text-xs text-slate-600 mt-3">
                         ✅ Continúa con este ritmo constante para garantizar el cumplimiento de la meta ambiciosa del 105%: {formatCurrency(activeBudget?.sales_budget * 1.05)}.
                        </p>
                      </div>
                    )}

                    {selectedMetric?.startsWith('top-day-') && (() => {
                      const dayIndex = parseInt(selectedMetric.split('-')[2]);
                      const dayData = budgetData.topDays[dayIndex];
                      if (!dayData) return null;

                      // Obtener todas las ventas históricas de este día de la semana
                      const dayOfWeekIndex = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(dayData.dayFull);
                      const historicalSales = dailySales
                        .filter(s => {
                          try {
                            const saleDate = parseISO(s.date);
                            return saleDate.getDay() === dayOfWeekIndex && s.total_sales > 0;
                          } catch {
                            return false;
                          }
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10);

                      const maxSale = Math.max(...historicalSales.map(s => s.total_sales));
                      const minSale = Math.min(...historicalSales.map(s => s.total_sales));

                      return (
                        <div>
                          <div className="text-center mb-4">
                            <div className="text-5xl mb-2">{dayIndex === 0 ? '🥇' : dayIndex === 1 ? '🥈' : '🥉'}</div>
                            <h4 className="text-xl font-black text-indigo-900 mb-1">{dayData.dayFull}</h4>
                            <p className="text-sm text-indigo-600">Día #{dayIndex + 1} con mayor potencial</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-indigo-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-indigo-600 mb-1">Promedio Histórico</p>
                              <p className="text-lg font-black text-indigo-900">{formatCurrency(dayData.avg)}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-purple-600 mb-1">Peso en Semana</p>
                              <p className="text-lg font-black text-purple-900">{(dayData.weight * 100).toFixed(0)}%</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-emerald-600 mb-1">Venta Máxima</p>
                              <p className="text-base font-bold text-emerald-900">{formatCurrency(maxSale)}</p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-rose-600 mb-1">Venta Mínima</p>
                              <p className="text-base font-bold text-rose-900">{formatCurrency(minSale)}</p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200 mb-3">
                            <p className="text-xs font-bold text-indigo-900 mb-2">📊 Análisis del {dayData.dayFull}:</p>
                            <ul className="text-xs text-indigo-800 space-y-1 ml-4">
                              <li>• Promedio basado en {dayData.count} registros históricos</li>
                              <li>• Representa el {(dayData.weight * 100).toFixed(0)}% de las ventas semanales</li>
                              <li>• Rango de ventas: {formatCurrency(minSale)} - {formatCurrency(maxSale)}</li>
                              <li>• Variación: ±{formatCurrency(maxSale - minSale)}</li>
                            </ul>
                          </div>

                          {historicalSales.length > 0 && (() => {
                            // Comparar este día vs los demás días de la semana
                            const allDaysComparison = budgetData.topDays
                              .sort((a, b) => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(a.dayFull) - 
                                              ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(b.dayFull));

                            return (
                              <>
                                <div className="mb-3">
                                  <p className="text-xs font-bold text-slate-700 mb-2">📈 Comportamiento de {dayData.dayFull}s</p>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={historicalSales.reverse().map(s => ({
                                      fecha: format(parseISO(s.date), 'dd/MM/yy', { locale: es }),
                                      venta: s.total_sales,
                                      promedio: dayData.avg
                                    }))}>
                                      <defs>
                                        <linearGradient id="areaVenta" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.1}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                      <XAxis dataKey="fecha" fontSize={9} angle={-45} textAnchor="end" height={50} />
                                      <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                                      <Tooltip 
                                        formatter={(v, name) => [
                                          formatCurrency(v),
                                          name === 'venta' ? `💰 ${dayData.dayFull}` : '📊 Promedio'
                                        ]}
                                        contentStyle={{ 
                                          background: '#fff', 
                                          border: '2px solid #6366f1', 
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          padding: '8px 12px'
                                        }}
                                      />
                                      <ReferenceLine y={dayData.avg} stroke="#a78bfa" strokeDasharray="5 5" strokeWidth={2} 
                                        label={{ value: `Promedio: ${formatCurrency(dayData.avg)}`, fill: '#7c3aed', fontSize: 9, position: 'top' }} />
                                      <Area type="monotone" dataKey="venta" stroke="#6366f1" strokeWidth={3} fill="url(#areaVenta)" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                  <p className="text-[10px] text-slate-500 mt-1 text-center">
                                    Últimos {historicalSales.length} {dayData.dayFull}s registrados
                                  </p>
                                </div>

                                <div className="mb-3">
                                  <p className="text-xs font-bold text-slate-700 mb-2">📊 {dayData.dayFull} vs Otros Días</p>
                                  <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={[...budgetData.topDays].sort((a, b) => 
                                      ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(a.dayFull) - 
                                      ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(b.dayFull)
                                    ).map(d => ({
                                      dia: d.day,
                                      promedio: d.avg,
                                      peso: d.weight * 100,
                                      isSelected: d.dayFull === dayData.dayFull
                                    }))}>
                                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                      <XAxis dataKey="dia" fontSize={10} />
                                      <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                                      <Tooltip 
                                        formatter={(v, name) => {
                                          if (name === 'promedio') return [formatCurrency(v), 'Promedio'];
                                          if (name === 'peso') return [`${v.toFixed(1)}%`, 'Peso'];
                                          return [v, name];
                                        }}
                                        contentStyle={{ 
                                          background: '#fff', 
                                          border: '2px solid #e5e7eb', 
                                          borderRadius: '12px',
                                          fontSize: '11px'
                                        }}
                                      />
                                      <Bar dataKey="promedio" radius={[8, 8, 0, 0]}>
                                        {budgetData.topDays.map((entry, index) => (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.dayFull === dayData.dayFull ? '#6366f1' : '#cbd5e1'} 
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                  <p className="text-[10px] text-slate-500 mt-1 text-center">
                                    {dayData.dayFull} es el día #{dayIndex + 1} con mayor potencial de venta
                                  </p>
                                </div>
                              </>
                            );
                          })()}

                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200 mb-3">
                            <p className="text-xs font-bold text-amber-900 mb-2">💡 Estrategia recomendada:</p>
                            <ul className="text-xs text-amber-800 space-y-1 ml-4">
                              <li>• Reforzar personal en este día clave</li>
                              <li>• Asegurar inventario completo de productos top</li>
                              <li>• Activar promociones especiales de alto impacto</li>
                              <li>• Monitorear cumplimiento hora a hora</li>
                            </ul>
                          </div>

                          {historicalSales.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-slate-700 mb-2">📅 Últimos {dayData.dayFull}s registrados:</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {historicalSales.slice(0, 5).map((sale, i) => (
                                  <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded text-[10px]">
                                    <span className="text-slate-600">{format(parseISO(sale.date), 'dd MMM yyyy', { locale: es })}</span>
                                    <span className={`font-bold ${sale.total_sales >= dayData.avg ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {formatCurrency(sale.total_sales)}
                                      <span className="text-[8px] ml-1">
                                        {sale.total_sales >= dayData.avg ? '↑' : '↓'}{Math.abs(((sale.total_sales / dayData.avg - 1) * 100)).toFixed(0)}%
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mensaje de estado - interactivo */}
              {needsRecovery ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMetric('recovery-plan');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-amber-50/40 border-l-4 border-amber-400/50 rounded-r-lg p-3 md:p-4 text-left hover:bg-amber-100/50 transition-all cursor-pointer"
                >
              <div className="flex items-start gap-2 md:gap-3">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500/70 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-amber-700/80 text-xs md:text-sm mb-1">
                    Presupuesto Redistribuido
                  </p>
                  <p className="text-[10px] md:text-xs text-amber-600/80 leading-relaxed">
                    Existe una brecha de {formatCurrency(budgetData.accumulatedGap)} que debe recuperarse. 
                    El presupuesto diario se ajustó de {formatCurrency(budgetData.dailyBaseBudget)} a {formatCurrency(budgetData.adjustedDailyBudget)} 
                    para alcanzar la meta del mes en los {budgetData.remainingDays} días restantes.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMetric('on-track');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-emerald-50/40 border-l-4 border-emerald-400/50 rounded-r-lg p-3 md:p-4 text-left hover:bg-emerald-100/50 transition-all cursor-pointer"
                >
              <div className="flex items-start gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-emerald-700/80 text-xs md:text-sm mb-1">
                    ¡En meta!
                  </p>
                  <p className="text-[10px] md:text-xs text-emerald-600/80 leading-relaxed">
                    El negocio está cumpliendo el presupuesto. Mantén el ritmo de ventas para alcanzar 
                    la meta del mes. Presupuesto diario: {formatCurrency(budgetData.adjustedDailyBudget)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                  </div>
                </motion.button>
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