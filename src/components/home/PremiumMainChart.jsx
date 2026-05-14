import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target, ArrowUpRight } from 'lucide-react';

const COLORS = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  lightBg: 'rgba(255,255,255,0.95)'
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl backdrop-blur-md"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
        <p className="text-[10px] font-semibold text-white mb-1">
          {payload[0].payload.date || `Día ${payload[0].payload.day}`}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="text-[10px]" style={{ color: p.color }}>
            {p.name}: {p.value > 100 ? `$${(p.value / 1000000).toFixed(2)}M` : p.value.toFixed(1) + '%'}
          </p>
        ))}
      </div>
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
    <div className="mb-7 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Gráfica 1: Cumplimiento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.lightBg} 0%, rgba(236, 72, 153, 0.02) 100%)`,
          border: '1px solid rgba(236, 72, 153, 0.1)',
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          backdropFilter: 'blur(20px)'
        }}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cumplimiento vs Presupuesto</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Últimos 30 días</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black" style={{ color: COLORS.primary }}>
                  {complianceMetrics.current}%
                </p>
                <ArrowUpRight className="w-4 h-4" style={{ color: COLORS.success }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{complianceMetrics.trend}</p>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(100,116,139,0.3)" style={{ fontSize: '9px' }} />
                <YAxis stroke="rgba(100,116,139,0.3)" style={{ fontSize: '9px' }} domain={[70, 120]} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="natural" 
                  dataKey="compliance" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  fill="url(#grad1)"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(236, 72, 153, 0.06)',
                border: '1px solid rgba(236, 72, 153, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Hoy</p>
              <p className="text-sm font-black" style={{ color: COLORS.primary }}>{complianceMetrics.current}%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Prom 30d</p>
              <p className="text-sm font-black" style={{ color: COLORS.secondary }}>{complianceMetrics.average}%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Estado</p>
              <p className="text-xs font-bold" style={{ color: COLORS.accent }}>Bueno</p>
            </motion.div>
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
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Target className="w-4 h-4" style={{ color: COLORS.secondary }} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Venta Diaria vs Proyección</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Estimado a cierre</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black" style={{ color: COLORS.secondary }}>
                  {salesMetrics.projection}
                </p>
                <ArrowUpRight className="w-4 h-4" style={{ color: COLORS.success }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Meta del mes</p>
            </div>
          </div>

          <div className="h-48">
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
                <YAxis stroke="rgba(100,116,139,0.3)" style={{ fontSize: '9px' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
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

          <div className="grid grid-cols-3 gap-2 mt-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(236, 72, 153, 0.06)',
                border: '1px solid rgba(236, 72, 153, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Acumulado</p>
              <p className="text-xs font-black" style={{ color: COLORS.primary }}>{salesMetrics.accumulated}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Cumpl. Proy</p>
              <p className="text-sm font-black" style={{ color: COLORS.secondary }}>{salesMetrics.compliance}%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-2.5 rounded-lg text-center"
              style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.12)'
              }}>
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Día</p>
              <p className="text-xs font-bold" style={{ color: COLORS.accent }}>14/30</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}