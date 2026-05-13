import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function KPICard({ title, value, change, unit = '', icon, gradient = 'from-blue-50 to-blue-100', lineColor = '#3b82f6' }) {
  const mockData = useMemo(() => [
    { v: Math.random() * 80 + 20 },
    { v: Math.random() * 80 + 30 },
    { v: Math.random() * 80 + 40 },
    { v: Math.random() * 80 + 35 },
    { v: Math.random() * 80 + 50 },
    { v: Math.random() * 80 + 45 },
    { v: Math.random() * 80 + 55 },
  ], []);

  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 border border-white/40 backdrop-blur-sm cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold text-slate-900">{value}</h3>
            {unit && <span className="text-lg text-slate-500">{unit}</span>}
          </div>
        </div>
        {icon && <div className="text-4xl">{icon}</div>}
      </div>

      {/* Sparkline */}
      <div className="h-12 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <Line type="monotone" dataKey="v" stroke={lineColor} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`flex items-center gap-0.5 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-slate-600">vs ayer</span>
      </div>
    </motion.div>
  );
}