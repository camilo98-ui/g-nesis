import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BarChart3, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency }) {
  const [expandedSection, setExpandedSection] = useState(null);

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

    // Brecha acumulada
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

    // Calcular número de semana retail (considerando semanas que empiezan antes del mes)
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

    // Datos para gráficos - incluir TODOS los días de la semana retail actual (incluso del mes anterior)
    const dailyTrendData = eachDayOfInterval({ start: currentWeekStart, end: now }).map(day => {
      const sale = dailySales.find(s => isSameDay(new Date(s.date), day));
      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        ventas: sale?.total_sales || 0,
        presupuesto: dailyBaseBudget,
        cumplimiento: sale?.total_sales ? (sale.total_sales / dailyBaseBudget * 100) : 0
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

      const weekBudget = dailyBaseBudget * daysInWeek.length;

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
      dailyTrendData,
      weeklyData
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
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200/50 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta del Día */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSection('daily')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-left border-2 border-blue-400 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-white" />
                    <p className="text-sm text-white/80 font-medium">Meta del Día</p>
                  </div>
                  {needsRecovery && (
                    <div className="px-2 py-1 bg-amber-400 rounded-full">
                      <p className="text-[10px] font-black text-amber-900">AJUSTADO</p>
                    </div>
                  )}
                </div>
                <motion.p
                  key={budgetData.adjustedDailyBudget}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black text-white mb-2"
                >
                  {formatCurrency(budgetData.adjustedDailyBudget)}
                </motion.p>
                {needsRecovery && (
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Incluye recuperación de {formatCurrency(budgetData.accumulatedGap)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 text-white/80">
                  {expandedSection === 'daily' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span className="text-xs font-medium">Ver tendencia diaria</span>
                </div>
              </div>
            </motion.button>

            {/* Venta del Día */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSection('daily')}
              className={`rounded-2xl shadow-xl p-6 text-left border-2 relative overflow-hidden group ${
                budgetData.todayCompliance >= 100 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400' 
                  : budgetData.todayCompliance >= 70
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400'
                  : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-white" />
                    <p className="text-sm text-white/80 font-medium">Venta Hoy</p>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    budgetData.todayCompliance >= 100 ? 'text-white' : 'text-white/90'
                  }`}>
                    {budgetData.todayCompliance >= 100 ? 
                      <CheckCircle2 className="w-4 h-4" /> : 
                      <AlertTriangle className="w-4 h-4" />
                    }
                  </div>
                </div>
                <p className="text-4xl font-black text-white mb-2">
                  {formatCurrency(budgetData.todayActualSales)}
                </p>
                <div className="space-y-2">
                  <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetData.todayCompliance, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {budgetData.todayCompliance.toFixed(0)}% del objetivo
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3 text-white/80">
                  {expandedSection === 'daily' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span className="text-xs font-medium">Ver tendencia diaria</span>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Gráfico de Tendencia Diaria */}
          <AnimatePresence>
            {expandedSection === 'daily' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    Tendencia Diaria del Mes
                  </h4>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={budgetData.dailyTrendData}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', padding: '12px' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(value, name) => [
                        formatCurrency(value), 
                        name === 'ventas' ? '💰 Venta Real' : '🎯 Presupuesto'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value) => value === 'ventas' ? '💰 Venta Real' : '🎯 Presupuesto Diario'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="presupuesto" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill="url(#colorPresupuesto)"
                      name="presupuesto"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVentas)"
                      name="ventas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Semana Retail */}
          <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => toggleSection('weekly')}
            className="w-full bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-purple-900">Semana {budgetData.currentWeekNumber} (Lun-Dom)</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  budgetData.weeklyCompliance >= 100 
                    ? 'bg-emerald-200 text-emerald-800' 
                    : 'bg-amber-200 text-amber-800'
                }`}>
                  {budgetData.weeklyCompliance.toFixed(0)}%
                </div>
                {expandedSection === 'weekly' ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
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
          </motion.button>

          {/* Gráfico de Semanas */}
          <AnimatePresence>
            {expandedSection === 'weekly' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Comparativa Semanal
                  </h4>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
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
                    <Bar dataKey="ventas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid de métricas resumidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200"
            >
              <p className="text-xs text-slate-600 mb-1">Base Diaria</p>
              <p className="text-lg font-bold text-slate-700">
                {formatCurrency(budgetData.dailyBaseBudget)}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-3 border border-blue-200"
            >
              <p className="text-xs text-blue-700 mb-1">Días Restantes</p>
              <p className="text-lg font-bold text-blue-800">
                {budgetData.remainingDays}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-3 border border-purple-200"
            >
              <p className="text-xs text-purple-700 mb-1">Por Vender</p>
              <p className="text-lg font-bold text-purple-800">
                {formatCurrency(budgetData.remainingBudget)}
              </p>
            </motion.div>

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
            </motion.div>
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