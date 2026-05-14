import React, { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, AreaChart, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target, ArrowUpRight, TrendingDown, Zap } from 'lucide-react';

const COLORS = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  lightBg: 'rgba(255,255,255,0.95)',
  budget: '#cbd5e1'
};

// Datos realistas: ventas reales vs presupuesto/meta
const generateComplianceData = () => {
  const dailyBudget = 1500000;
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const actualSales = dailyBudget + (Math.random() - 0.4) * 500000;
    const variance = actualSales - dailyBudget;
    const compliancePercent = actualSales / dailyBudget * 100;

    return {
      date: date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
      day: date.toLocaleDateString('es-CO', { weekday: 'short' }).substring(0, 3),
      actualSales: Math.max(0, actualSales),
      budget: dailyBudget,
      variance: variance,
      compliance: compliancePercent,
      isSurplus: variance > 0
    };
  });
  return days;
};

// Datos de venta diaria vs proyección de cierre
const generateDailyVsSalesData = () => {
  const daysInMonth = 30;
  const dailySalesTarget = 1500000;
  const currentDay = 14;

  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    dailySales: i <= currentDay ? dailySalesTarget + (Math.random() - 0.5) * 300000 : null,
    projection: (i + 1) * dailySalesTarget,
    isToday: i === currentDay - 1
  }));
};

const CustomComplianceTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const compliance = (data.actualSales / data.budget * 100).toFixed(1);
    const variance = data.actualSales - data.budget;
    const variancePercent = (variance / data.budget * 100).toFixed(1);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-4 py-3 rounded-xl backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
        }}>
        <p className="text-xs font-bold text-white mb-2.5">
          Día {data.date} ({data.day})
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Venta Real:</span>
            <span className="font-semibold" style={{ color: COLORS.primary }}>
              ${(data.actualSales / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Presupuesto:</span>
            <span className="font-semibold" style={{ color: COLORS.budget }}>
              ${(data.budget / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="border-t border-slate-700 pt-1.5 mt-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Diferencia:</span>
              <span className="font-semibold" style={{ color: variance > 0 ? COLORS.success : COLORS.danger }}>
                {variance > 0 ? '+' : ''} ${(variance / 1000000).toFixed(2)}M ({variancePercent}%)
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Cumplimiento:</span>
              <span className="font-semibold" style={{ color: compliance > 100 ? COLORS.success : COLORS.warning }}>
                {compliance}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>);

  }
  return null;
};

const ProjectionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-3 py-2 rounded-lg backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
        }}>
        <p className="text-xs font-bold text-white mb-1">Día {data.day}</p>
        <div className="space-y-1 text-xs">
          {data.dailySales &&
          <div className="flex justify-between gap-3">
              <span className="text-slate-400">Venta Real:</span>
              <span className="font-semibold" style={{ color: COLORS.primary }}>
                ${(data.dailySales / 1000000).toFixed(2)}M
              </span>
            </div>
          }
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Proyección:</span>
            <span className="font-semibold" style={{ color: COLORS.secondary }}>
              ${(data.projection / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>
      </motion.div>);

  }
  return null;
};

export default function PremiumMainChart({ dailySales = [], activeBudget = null, dailyBudgets = [] }) {
  const complianceData = useMemo(() => {
    if (!activeBudget || !dailySales.length) return generateComplianceData();
    
    // Procesar dailySales y dailyBudgets para el mes actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Obtener presupuesto diario del activeBudget (si está disponible) o calcular
    const monthlyBudget = activeBudget?.sales_budget || 0;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dailyTargetFromMonthly = monthlyBudget / daysInMonth;
    
    // Crear mapa de presupuestos diarios desde dailyBudgets
    const budgetsByDate = {};
    dailyBudgets.forEach(db => {
      if (db.date && db.sales_budget) {
        budgetsByDate[db.date] = db.sales_budget;
      }
    });
    
    // Construir datos de complianza
    const data = dailySales.map(ds => {
      const date = new Date(ds.date);
      const dateStr = ds.date;
      const budget = budgetsByDate[dateStr] || dailyTargetFromMonthly;
      const actualSales = ds.total_sales || 0;
      const variance = actualSales - budget;
      const compliance = budget > 0 ? (actualSales / budget) * 100 : 0;
      
      return {
        date: date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
        day: date.toLocaleDateString('es-CO', { weekday: 'short' }).substring(0, 3),
        actualSales,
        budget,
        variance,
        compliance,
        isSurplus: variance > 0
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return data.length > 0 ? data : generateComplianceData();
  }, [dailySales, activeBudget, dailyBudgets]);

  const dailyVsProjectionData = useMemo(() => generateDailyVsSalesData(), []);

  const complianceMetrics = useMemo(() => {
    if (complianceData.length === 0) {
      return {
        current: '0',
        accumulated: 0,
        budget: 0,
        variance: 0,
        variancePercent: '0',
        daysAbove: 0,
        daysBelow: 0,
        bestDay: null,
        monthlyProjection: 0,
        monthlyVariancePercent: '0',
        avgCompliance: '0',
        insight: 'Sin datos disponibles'
      };
    }

    const totalActualSales = complianceData.reduce((s, d) => s + d.actualSales, 0);
    const totalBudget = complianceData.reduce((s, d) => s + d.budget, 0);
    const variance = totalActualSales - totalBudget;
    const compliancePercent = totalBudget > 0 ? (totalActualSales / totalBudget * 100).toFixed(1) : '0';
    const daysAboveBudget = complianceData.filter((d) => d.actualSales >= d.budget).length;
    const daysBelow = complianceData.filter((d) => d.actualSales < d.budget).length;
    const bestDay = complianceData.reduce((max, d) => d.compliance > max.compliance ? d : max, complianceData[0]);
    
    // Proyección: si hay datos de hoy, proyectar al mes
    const daysWithData = complianceData.filter(d => d.actualSales > 0).length;
    const monthlyProjection = daysWithData > 0 ? (totalActualSales / daysWithData) * 30 : totalBudget;
    const monthlyVariancePercent = totalBudget > 0 ? ((monthlyProjection - totalBudget) / totalBudget * 100).toFixed(1) : '0';
    const avgDailyCompliance = complianceData.length > 0 ? (complianceData.reduce((s, d) => s + d.compliance, 0) / complianceData.length).toFixed(1) : '0';

    // IA Insights
    let insight = '';
    if (daysAboveBudget >= 3) {
      insight = `${daysAboveBudget} días superaron la meta`;
    } else if (daysBelow >= 3) {
      insight = 'Tendencia de bajo cumplimiento';
    } else if (parseFloat(monthlyVariancePercent) > 5) {
      insight = `Proyección al ${Math.round(parseFloat(monthlyVariancePercent) + 100)}% del presupuesto`;
    } else if (parseFloat(monthlyVariancePercent) < -5) {
      insight = 'Enfoque en recuperar presupuesto mensual';
    } else {
      insight = 'Vendimia estable, mantener ritmo actual';
    }

    return {
      current: compliancePercent,
      accumulated: totalActualSales,
      budget: totalBudget,
      variance: variance,
      variancePercent: totalBudget > 0 ? (variance / totalBudget * 100).toFixed(1) : '0',
      daysAbove: daysAboveBudget,
      daysBelow: daysBelow,
      bestDay: bestDay,
      monthlyProjection: monthlyProjection,
      monthlyVariancePercent: monthlyVariancePercent,
      avgCompliance: avgDailyCompliance,
      insight: insight
    };
  }, [complianceData]);

  const salesMetrics = useMemo(() => {
    const todayData = dailyVsProjectionData[13];
    const totalSalesAccum = dailyVsProjectionData.
    filter((_, i) => i < 14).
    reduce((s, d) => s + (d.dailySales || 0), 0);
    const projectedClose = dailyVsProjectionData[29].projection;
    const complianceProj = (totalSalesAccum / (14 * 1500000) * 100).toFixed(1);
    return {
      accumulated: `$${(totalSalesAccum / 1000000).toFixed(1)}M`,
      projection: `$${(projectedClose / 1000000).toFixed(0)}M`,
      compliance: complianceProj
    };
  }, [dailyVsProjectionData]);

  return (
    <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfica 1: Cumplimiento vs Presupuesto - REDISEÑO PREMIUM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 50%, rgba(236, 72, 153, 0.01) 100%)`,
          border: '1px solid rgba(236, 72, 153, 0.15)',
          boxShadow: '0 8px 32px rgba(236, 72, 153, 0.1), 0 0 1px rgba(236, 72, 153, 0.2) inset',
          backdropFilter: 'blur(30px)'
        }}>
        {/* Encabezado Premium */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                  <Target className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Cumplimiento vs Presupuesto</h3>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Análisis diario</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5 mb-0.5">
                <p className="text-2xl font-black" style={{ color: COLORS.primary }}>
                  {complianceMetrics.current}%
                </p>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  
                  {complianceMetrics.variancePercent > 0 ?
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: COLORS.success }} /> :

                  <TrendingDown className="w-3.5 h-3.5" style={{ color: COLORS.danger }} />
                  }
                </motion.div>
              </div>
              <p className="text-[8px] font-semibold text-slate-400">
                {complianceMetrics.variancePercent > 0 ? '+' : ''}{complianceMetrics.variancePercent}%
              </p>
            </div>
          </div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-2 rounded-lg flex items-start gap-2"
            style={{
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
            <Zap className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: COLORS.secondary }} />
            <p className="text-[8px] text-slate-700 font-medium leading-tight">
              {complianceMetrics.insight}
            </p>
          </motion.div>
        </div>

        {/* Gráfica - ComposedChart con dos líneas */}
        <div className="h-40 px-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={complianceData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              isAnimationActive={true}>
              
              <defs>
                <linearGradient id="complianceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="surplusGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="deficitGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.danger} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={COLORS.danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid
                strokeDasharray="0"
                stroke="rgba(100,116,139,0.08)"
                vertical={false} />
              
              <XAxis
                dataKey="date"
                stroke="rgba(100,116,139,0.3)"
                style={{ fontSize: '9px' }}
                tick={{ fill: 'rgba(100,116,139,0.6)' }} />

               <YAxis
                 stroke="rgba(100,116,139,0.3)"
                 style={{ fontSize: '9px' }}
                 tick={{ fill: 'rgba(100,116,139,0.6)' }}
                 tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              

               <Tooltip content={<CustomComplianceTooltip />} cursor={{ stroke: 'rgba(236, 72, 153, 0.2)', strokeWidth: 1 }} />
               <Legend 
                 verticalAlign="bottom" 
                 height={20}
                 wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />

               {/* Área suave debajo de ventas */}
              <Area
                type="monotone"
                dataKey="actualSales"
                fill="url(#complianceFill)"
                stroke="none"
                isAnimationActive={true} />
              
              
              {/* Línea de Ventas Reales - Rosa brillante */}
              <Line
                type="monotone"
                dataKey="actualSales"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, r: 4, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, strokeWidth: 3 }}
                isAnimationActive={true}
                animationDuration={1200}
                name="Ventas Reales" />
              
              
              {/* Línea de Presupuesto - Gris/Morado tenue */}
              <Line
                type="monotone"
                dataKey="budget"
                stroke={COLORS.budget}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={true}
                animationDuration={1200}
                name="Presupuesto" />
              
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Métricas Clave */}
        <div className="px-4 pb-4 grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.1)' }}>
            <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Acumulado</p>
            <p className="text-[9px] font-black" style={{ color: COLORS.primary }}>
              ${(complianceMetrics.accumulated / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(203,213,225,0.2)', border: '1px solid rgba(203,213,225,0.4)' }}>
            <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Presupuesto</p>
            <p className="text-[9px] font-black text-slate-500">
              ${(complianceMetrics.budget / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: complianceMetrics.variance > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${complianceMetrics.variance > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
            <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Diferencia</p>
            <p className="text-[9px] font-black" style={{ color: complianceMetrics.variance > 0 ? COLORS.success : COLORS.danger }}>
              {complianceMetrics.variance > 0 ? '+' : ''}${(complianceMetrics.variance / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Proyección</p>
            <p className="text-[9px] font-black" style={{ color: COLORS.accent }}>
              ${(complianceMetrics.monthlyProjection / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </motion.div>

      {/* Gráfica 2: Venta Diaria vs Proyección */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.lightBg} 0%, rgba(139, 92, 246, 0.02) 100%)`,
          border: '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          backdropFilter: 'blur(20px)'
        }}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Target className="w-3.5 h-3.5" style={{ color: COLORS.secondary }} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Venta Diaria vs Proyección</h3>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">Estimado a cierre</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-500 mb-1">Hoy:</p>
              <p className="text-lg font-black" style={{ color: COLORS.secondary }}>
                {salesMetrics.projection}
              </p>
            </div>
          </div>

          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVsProjectionData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(100,116,139,0.3)" style={{ fontSize: '9px' }} />
                <YAxis stroke="rgba(100,116,139,0.3)" style={{ fontSize: '9px' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip content={<ProjectionTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={20}
                  wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                <Line
                  type="natural"
                  dataKey="dailySales"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  dot={false}
                  name="Venta Real"
                  isAnimationActive={true}
                  animationDuration={1000} />
                <Line
                  type="natural"
                  dataKey="projection"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Proyección" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2.5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-2 rounded-lg text-center"
              style={{
                background: 'rgba(236, 72, 153, 0.06)',
                border: '1px solid rgba(236, 72, 153, 0.12)'
              }}>
              <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Hoy</p>
              <p className="text-[9px] font-black" style={{ color: COLORS.primary }}>{salesMetrics.accumulated}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="p-2 rounded-lg text-center"
              style={{
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.12)'
              }}>
              <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">% Meta</p>
              <p className="text-[9px] font-black" style={{ color: COLORS.secondary }}>{salesMetrics.compliance}%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-2 rounded-lg text-center"
              style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.12)'
              }}>
              <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Mes</p>
              <p className="text-[9px] font-bold" style={{ color: COLORS.accent }}>14/30</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              className="p-2 rounded-lg text-center"
              style={{
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.12)'
              }}>
              <p className="text-[7px] font-bold text-slate-500 uppercase mb-1">Crecimiento</p>
              <p className="text-[9px] font-black" style={{ color: COLORS.success }}>+8.2%</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>);

}