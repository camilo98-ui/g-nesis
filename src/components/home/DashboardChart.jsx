import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Lun', actual: 3200000, budget: 3000000 },
  { date: 'Mar', actual: 3500000, budget: 3000000 },
  { date: 'Mié', actual: 3800000, budget: 3000000 },
  { date: 'Jue', actual: 4100000, budget: 3200000 },
  { date: 'Vie', actual: 4200000, budget: 3500000 },
  { date: 'Sáb', actual: 4500000, budget: 4000000 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const actual = payload[0].value;
    const budget = payload[1]?.value;
    const variance = budget ? actual - budget : 0;
    const compliance = budget ? Math.round((actual / budget) * 100) : 0;

    return (
      <div 
        className="rounded-lg p-3 shadow-lg"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)'
        }}>
        <p className="text-xs font-semibold text-slate-700 mb-1">{data.date}</p>
        <p className="text-[11px] text-slate-600">
          <span style={{ color: '#ef4444' }}>●</span> Actual: ${(actual / 1000000).toFixed(1)}M
        </p>
        <p className="text-[11px] text-slate-600">
          <span style={{ color: '#94a3b8' }}>●</span> Presupuesto: ${(budget / 1000000).toFixed(1)}M
        </p>
        <p className={`text-[11px] font-semibold mt-1 ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {variance >= 0 ? '+' : ''} ${(variance / 1000000).toFixed(1)}M ({compliance}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="rounded-2xl p-5 lg:p-6"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
      }}>
      
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-800 mb-1">Cumplimiento de Ventas</h3>
        <p className="text-[12px] text-slate-400 font-medium">Comparativo Actual vs Presupuesto</p>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#cbd5e1" style={{ fontSize: '12px' }} />
            <YAxis stroke="#cbd5e1" style={{ fontSize: '12px' }} 
              tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={false}
              fill="url(#actualGradient)"
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="budget" 
              stroke="#cbd5e1" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="text-[11px] text-slate-600 font-medium">Venta Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#cbd5e1' }} />
          <span className="text-[11px] text-slate-600 font-medium">Presupuesto</span>
        </div>
      </div>
    </motion.div>
  );
}