import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, DollarSign, Users, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
};

const MiniChart = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={30}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area 
        type="monotone" 
        dataKey="value" 
        fill={`url(#grad-${color})`} 
        stroke={color}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const StrategyCard = ({ icon: Icon, title, current, target, impact, data, color, delay }) => {
  const improvement = ((target - current) / current * 100).toFixed(1);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-3 rounded-lg border"
      style={{
        background: 'rgba(255,255,255,0.5)',
        borderColor: `${color}20`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded" style={{ background: `${color}15` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <p className="text-[10px] font-bold text-slate-700">{title}</p>
        </div>
        <p className="text-[9px] font-bold" style={{ color: improvement > 0 ? COLORS.success : COLORS.warning }}>
          +{improvement}%
        </p>
      </div>
      
      <div className="mb-1.5">
        <MiniChart data={data} color={color} />
      </div>
      
      <div className="grid grid-cols-3 gap-1 text-[8px]">
        <div className="text-center">
          <p className="text-slate-500 font-medium">Actual</p>
          <p className="font-black text-slate-800">${current.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 font-medium">Meta</p>
          <p className="font-black" style={{ color }}>${target.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 font-medium">Impacto</p>
          <p className="font-black text-slate-800">${impact.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function SalesOptimizationStrategies() {
  const strategies = useMemo(() => {
    const salesData = Array.from({ length: 7 }, (_, i) => ({
      value: 45000000 + Math.random() * 15000000
    }));
    
    const ebitdaData = Array.from({ length: 7 }, (_, i) => ({
      value: 8000000 + Math.random() * 3000000
    }));
    
    const ticketData = Array.from({ length: 7 }, (_, i) => ({
      value: 42000 + Math.random() * 8000
    }));
    
    const footfallData = Array.from({ length: 7 }, (_, i) => ({
      value: 8500 + Math.random() * 2000
    }));

    return [
      {
        icon: TrendingUp,
        title: 'Incremento Ventas',
        current: 45000000,
        target: 52000000,
        impact: 7000000,
        data: salesData,
        color: COLORS.primary,
      },
      {
        icon: DollarSign,
        title: 'Optimizar EBITDA',
        current: 8000000,
        target: 9800000,
        impact: 1800000,
        data: ebitdaData,
        color: COLORS.success,
      },
      {
        icon: Target,
        title: 'Ticket Promedio',
        current: 42000,
        target: 48000,
        impact: 6000,
        data: ticketData,
        color: COLORS.secondary,
      },
      {
        icon: Users,
        title: 'Incrementar Tráfico',
        current: 8500,
        target: 10200,
        impact: 1700,
        data: footfallData,
        color: COLORS.accent,
      },
    ];
  }, []);

  return (
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
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Estrategias de Crecimiento</h3>
            <p className="text-[8px] text-slate-400 font-medium">Acciones numéricas prioritarias</p>
          </div>
        </div>

        {/* Estrategias Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {strategies.map((strategy, idx) => (
            <StrategyCard key={idx} {...strategy} delay={idx * 0.1} />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-2.5 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.15)'
          }}>
          <p className="text-[9px] font-bold text-slate-700 mb-1.5">Acciones Recomendadas:</p>
          <div className="space-y-1">
            <div className="flex items-start gap-1.5 text-[8px]">
              <Clock className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: COLORS.secondary }} />
              <p className="text-slate-600">Implementar ofertas en horarios pico (+8% ventas)</p>
            </div>
            <div className="flex items-start gap-1.5 text-[8px]">
              <Users className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: COLORS.accent }} />
              <p className="text-slate-600">Programas de lealtad para aumentar ticket</p>
            </div>
            <div className="flex items-start gap-1.5 text-[8px]">
              <TrendingUp className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: COLORS.success }} />
              <p className="text-slate-600">Optimizar costos operativos (-4% gastos)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}