import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-lg p-4 rounded-xl shadow-xl border border-orange-100">
        <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold text-gray-800">
              {new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ComparisonChart({ data, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>
      
      <div className="h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.9}>
                  <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                </stop>
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0.6}>
                  <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                </stop>
              </linearGradient>
              <linearGradient id="barPrevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9}>
                  <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                </stop>
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.6}>
                  <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                </stop>
              </linearGradient>
              <filter id="barGlowComp">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="period" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="current" 
              name="Período actual" 
              fill="url(#barCurrentGrad)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              filter="url(#barGlowComp)"
            />
            <Bar 
              dataKey="previous" 
              name="Período anterior" 
              fill="url(#barPrevGrad)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              filter="url(#barGlowComp)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}