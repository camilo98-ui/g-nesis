import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';

const COLORS = {
  primary: '#c2187d',
  secondary: '#a78bfa',
  success: '#10b981',
  accent: '#ec4899'
};

// Datos de cumplimiento histórico (últimos 30 días)
const generateComplianceData = () => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: `${date.getDate()}`,
      compliance: 85 + Math.random() * 20,
      target: 100
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-3 py-2 rounded-xl backdrop-blur-md"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
        <p className="text-[10px] font-semibold text-slate-900 mb-1">
          {payload[0].payload.date || `Día ${payload[0].payload.day}`}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="text-[10px]" style={{ color: p.color }}>
            {p.name}: {p.value > 100 ? `$${(p.value / 1000000).toFixed(2)}M` : p.value.toFixed(1) + '%'}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export default function PremiumMainChart() {
  const complianceData = useMemo(() => generateComplianceData(), []);
  const dailyVsProjectionData = useMemo(() => generateDailyVsSalesData(), []);

  const complianceMetrics = useMemo(() => {
    const lastCompliance = complianceData[complianceData.length - 1];
    const avgCompliance = (complianceData.reduce((s, d) => s + d.compliance, 0) / complianceData.length).toFixed(1);
    return {
      current: lastCompliance.compliance.toFixed(1),
      average: avgCompliance,
      trend: lastCompliance.compliance > 95 ? 'Excelente' : lastCompliance.compliance > 85 ? 'Bueno' : 'En mejora'
    };
  }, [complianceData]);

  const salesMetrics = useMemo(() => {
    const todayData = dailyVsProjectionData[13];
    const totalSalesAccum = dailyVsProjectionData
      .filter((_, i) => i < 14)
      .reduce((s, d) => s + (d.dailySales || 0), 0);
    const projectedClose = dailyVsProjectionData[29].projection;
    const complianceProj = ((totalSalesAccum / (14 * 1500000)) * 100).toFixed(1);
    return {
      accumulated: `$${(totalSalesAccum / 1000000).toFixed(1)}M`,
      projection: `$${(projectedClose / 1000000).toFixed(0)}M`,
      compliance: complianceProj
    };
  }, [dailyVsProjectionData]);

  return (
    <div className="mb-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfica 1: Cumplimiento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-6 lg:p-8"
        style={{
          background: 'rgba(255,255,255,0.93)',
          border: '1px solid rgba(194,24,117,0.08)',
          boxShadow: '0 2px 16px rgba(194,24,117,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)'
        }}>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
              <h3 className="text-lg lg:text-xl font-black text-slate-900">Cumplimiento vs Presupuesto</h3>
            </div>
            <p className="text-[12px] text-slate-400">Últimos 30 días</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-black" style={{ color: COLORS.primary }}>
              {complianceMetrics.current}%
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {complianceMetrics.trend}
            </p>
          </div>
        </div>

        <div className="h-56 -mx-2 px-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(0,0,0,0.1)" style={{ fontSize: '10px' }} />
              <YAxis stroke="rgba(0,0,0,0.1)" style={{ fontSize: '10px' }} domain={[0, 120]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="compliance" 
                stroke={COLORS.primary} 
                strokeWidth={2.5}
                fill="url(#grad1)"
                dot={false}
                isAnimationActive={true}
                animationDuration={800} />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={COLORS.secondary} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3.5 rounded-xl"
            style={{
              background: 'rgba(194,24,117,0.04)',
              border: '1px solid rgba(194,24,117,0.1)'
            }}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Hoy</p>
            <p className="text-[18px] font-black" style={{ color: COLORS.primary }}>
              {complianceMetrics.current}%
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-3.5 rounded-xl"
            style={{
              background: 'rgba(167,139,250,0.04)',
              border: '1px solid rgba(167,139,250,0.1)'
            }}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Promedio 30d</p>
            <p className="text-[18px] font-black" style={{ color: COLORS.secondary }}>
              {complianceMetrics.average}%
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Gráfica 2: Venta Diaria vs Proyección */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-6 lg:p-8"
        style={{
          background: 'rgba(255,255,255,0.93)',
          border: '1px solid rgba(167,139,250,0.08)',
          boxShadow: '0 2px 16px rgba(167,139,250,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)'
        }}>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5" style={{ color: COLORS.secondary }} />
              <h3 className="text-lg lg:text-xl font-black text-slate-900">Venta Diaria vs Proyección</h3>
            </div>
            <p className="text-[12px] text-slate-400">Cierre estimado del mes</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-black" style={{ color: COLORS.secondary }}>
              {salesMetrics.projection}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              Cierre estimado
            </p>
          </div>
        </div>

        <div className="h-56 -mx-2 px-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyVsProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(0,0,0,0.1)" style={{ fontSize: '10px' }} />
              <YAxis stroke="rgba(0,0,0,0.1)" style={{ fontSize: '10px' }} tickFormatter={v => `$${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="dailySales" 
                stroke={COLORS.primary} 
                strokeWidth={2.5}
                dot={false}
                name="Venta Real"
                isAnimationActive={true}
                animationDuration={800} />
              <Line 
                type="monotone" 
                dataKey="projection" 
                stroke={COLORS.secondary} 
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                name="Proyección" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3.5 rounded-xl"
            style={{
              background: 'rgba(194,24,117,0.04)',
              border: '1px solid rgba(194,24,117,0.1)'
            }}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Acumulado</p>
            <p className="text-[18px] font-black" style={{ color: COLORS.primary }}>
              {salesMetrics.accumulated}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-3.5 rounded-xl"
            style={{
              background: 'rgba(167,139,250,0.04)',
              border: '1px solid rgba(167,139,250,0.1)'
            }}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Cumplimiento Proyectado</p>
            <p className="text-[18px] font-black" style={{ color: COLORS.secondary }}>
              {salesMetrics.compliance}%
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}