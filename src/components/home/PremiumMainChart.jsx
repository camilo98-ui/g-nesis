import React, { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, AreaChart, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target, ArrowUpRight, TrendingDown, Zap } from 'lucide-react';
import SalesOptimizationStrategies from './SalesOptimizationStrategies';

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
    dailyBudgets.forEach((db) => {
      if (db.date && db.sales_budget) {
        budgetsByDate[db.date] = db.sales_budget;
      }
    });

    // Construir datos de complianza
    const data = dailySales.map((ds) => {
      const date = new Date(ds.date);
      const dateStr = ds.date;
      const budget = budgetsByDate[dateStr] || dailyTargetFromMonthly;
      const actualSales = ds.total_sales || 0;
      const variance = actualSales - budget;
      const compliance = budget > 0 ? actualSales / budget * 100 : 0;

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
    const daysWithData = complianceData.filter((d) => d.actualSales > 0).length;
    const monthlyProjection = daysWithData > 0 ? totalActualSales / daysWithData * 30 : totalBudget;
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

  return null;


















































































































































































































































































































}