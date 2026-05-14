import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LiveChartContainer, ShimmerLine } from '@/components/animations/LiveDashboardAnimations';

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

export default function SalesChart({ data, title, showBudget = true }) {
  return (
    <LiveChartContainer title={title}>
      <div className="h-[300px] md:h-[350px]">
        <ShimmerLine color="#f97316">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <filter id="glowVentas">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feFlood floodColor="#f97316" floodOpacity="0.3" result="coloredBlur2"/>
                  <feComposite in="coloredBlur2" in2="coloredBlur" operator="in" result="coloredBlur3"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur3"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <motion.g
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
              </motion.g>
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Ventas"
                stroke="#f97316"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVentas)"
                filter="url(#glowVentas)"
                dot={false}
                isAnimationActive={true}
              />
              {showBudget && (
                <Area
                  type="monotone"
                  dataKey="budget"
                  name="Presupuesto"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorPresupuesto)"
                  dot={false}
                  isAnimationActive={true}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ShimmerLine>
      </div>
    </LiveChartContainer>
  );
}