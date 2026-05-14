import React, { useState, useMemo } from 'react';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const FILTERS = [
  { id: 'sales-vs-budget', label: 'Venta vs Presupuesto', icon: '📊' },
  { id: 'weekly', label: 'Semanal vs Presupuesto', icon: '📈' },
  { id: 'projection', label: 'Proyección de Cierre', icon: '🎯' }
];

const CHART_COLORS = {
  primary: '#c2187d',
  secondary: '#a78bfa',
  accent: '#ec4899',
  success: '#10b981'
};

const generateSalesData = () => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days.map((day, i) => ({
    day,
    sales: Math.floor(Math.random() * 1500000) + 800000,
    budget: 1100000 + Math.random() * 200000,
    projection: 1000000 + i * 50000,
    week: Math.floor(Math.random() * 8000000) + 5000000
  }));
};

const generateWeeklyData = () => {
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  return weeks.map((week, i) => ({
    week,
    sales: 4000000 + Math.random() * 2000000,
    budget: 4500000,
    variance: Math.random() * 15 - 5
  }));
};

const generateProjectionData = () => {
  const days = Array.from({ length: 30 }, (_, i) => ({
    day: `D${i + 1}`,
    cumulative: (i + 1) * 35000 + Math.random() * 500000,
    target: (i + 1) * 36000
  }));
  return days;
};

export default function PremiumMainChart() {
  const [activeFilter, setActiveFilter] = useState('sales-vs-budget');
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    if (activeFilter === 'sales-vs-budget') {
      setData(generateSalesData());
    } else if (activeFilter === 'weekly') {
      setData(generateWeeklyData());
    } else {
      setData(generateProjectionData());
    }
  }, [activeFilter]);

  const metrics = useMemo(() => {
    if (!data.length) return {};

    if (activeFilter === 'sales-vs-budget') {
      const totalSales = data.reduce((s, d) => s + d.sales, 0);
      const totalBudget = data.reduce((s, d) => s + d.budget, 0);
      const compliance = ((totalSales / totalBudget) * 100).toFixed(1);
      const diff = totalSales - totalBudget;
      return {
        primary: `$${(totalSales / 1000000).toFixed(1)}M`,
        secondary: compliance + '%',
        trend: diff > 0 ? '+' : '',
        trendValue: `${(diff / 1000000).toFixed(2)}M`,
        label1: 'Venta Total',
        label2: 'Cumplimiento'
      };
    } else if (activeFilter === 'weekly') {
      const avgSales = (data.reduce((s, d) => s + d.sales, 0) / data.length).toFixed(0);
      const avgVariance = (data.reduce((s, d) => s + d.variance, 0) / data.length).toFixed(1);
      return {
        primary: `$${(avgSales / 1000000).toFixed(2)}M`,
        secondary: avgVariance + '%',
        trend: avgVariance > 0 ? '+' : '',
        trendValue: 'vs presupuesto',
        label1: 'Promedio Semanal',
        label2: 'Variación'
      };
    } else {
      const lastDay = data[data.length - 1];
      const compliance = ((lastDay.cumulative / lastDay.target) * 100).toFixed(1);
      return {
        primary: `$${(lastDay.cumulative / 1000000).toFixed(1)}M`,
        secondary: compliance + '%',
        trend: compliance >= 100 ? '✓' : '',
        trendValue: 'Acumulado',
        label1: 'Cierre Estimado',
        label2: 'Cumplimiento'
      };
    }
  }, [data, activeFilter]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 rounded-xl backdrop-blur-md border"
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}>
          <p className="text-[11px] font-semibold text-slate-900">
            {payload[0].payload[Object.keys(payload[0].payload)[0]]}
          </p>
          {payload.map((p, i) => (
            <p key={i} className="text-[10px] text-slate-500" style={{ color: p.color }}>
              {p.name}: ${(p.value / 1000000).toFixed(2)}M
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-7 rounded-3xl p-6 lg:p-8"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(194,24,117,0.08)',
        boxShadow: '0 2px 16px rgba(194,24,117,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
        backdropFilter: 'blur(12px)'
      }}>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl lg:text-2xl font-black text-slate-900">Centro Inteligente</h2>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: CHART_COLORS.success }} />
            </div>
            <p className="text-[12px] text-slate-400 font-medium">
              {FILTERS.find(f => f.id === activeFilter)?.label}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(filter.id)}
              className="px-3.5 py-2 rounded-xl font-medium text-[11px] transition-all duration-300"
              style={{
                background: activeFilter === filter.id ? CHART_COLORS.primary : 'rgba(0,0,0,0.02)',
                color: activeFilter === filter.id ? 'white' : 'rgb(100,116,139)',
                border: activeFilter === filter.id ? 'none' : '1px solid rgba(0,0,0,0.06)'
              }}>
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative mb-6 h-80 -mx-2 px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full">
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                
                <defs>
                  <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gradientSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.01} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid 
                  strokeDasharray="0"
                  stroke="rgba(0,0,0,0.04)"
                  vertical={false} />
                
                <XAxis
                  dataKey={activeFilter === 'weekly' ? 'week' : activeFilter === 'projection' ? 'day' : 'day'}
                  stroke="rgba(0,0,0,0.1)"
                  style={{ fontSize: '11px', fontWeight: '500' }} />
                
                <YAxis
                  stroke="rgba(0,0,0,0.1)"
                  style={{ fontSize: '10px' }}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                
                <Tooltip content={<CustomTooltip />} />

                {activeFilter === 'projection' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2.5}
                      fill="url(#gradientPrimary)"
                      dot={false}
                      filter="url(#glow)" />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false} />
                  </>
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2.5}
                      fill="url(#gradientPrimary)"
                      dot={false}
                      filter="url(#glow)" />
                    <Line
                      type="monotone"
                      dataKey={activeFilter === 'weekly' ? 'budget' : 'budget'}
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false} />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* KPI Footer */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: metrics.primary, label: metrics.label1 },
          { value: metrics.secondary, label: metrics.label2 }
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-3.5 rounded-xl"
            style={{
              background: i === 0 ? 'rgba(194,24,117,0.04)' : 'rgba(167,139,250,0.04)',
              border: '1px solid ' + (i === 0 ? 'rgba(194,24,117,0.1)' : 'rgba(167,139,250,0.1)')
            }}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[18px] lg:text-[20px] font-black" style={{ color: i === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary }}>
                {kpi.value}
              </p>
              {metrics.trend && (
                <span className="text-[11px] font-semibold" style={{ color: CHART_COLORS.success }}>
                  {metrics.trend} {metrics.trendValue}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}