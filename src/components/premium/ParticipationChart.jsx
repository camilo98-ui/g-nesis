import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PARTICIPATION_DATA = [
  { name: 'Cones', value: 38, emoji: '🍦' },
  { name: 'Sundaes', value: 27, emoji: '🥤' },
  { name: 'Malteadas', value: 21, emoji: '🍨' },
  { name: 'Postres', value: 14, emoji: '🍰' },
];

const COLORS = ['#c21875', '#f59e0b', '#10b981', '#6366f1'];

export default function ParticipationChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 border border-slate-200 h-full flex flex-col"
    >
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900">Participación Tienda</h3>
        <p className="text-sm text-slate-500 mt-1">Mix del negocio por categoría</p>
      </div>

      {/* Chart */}
      <div className="flex items-center justify-center h-48 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PARTICIPATION_DATA}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {PARTICIPATION_DATA.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-3 border-t border-slate-200 pt-6">
        {PARTICIPATION_DATA.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">{item.value}%</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}