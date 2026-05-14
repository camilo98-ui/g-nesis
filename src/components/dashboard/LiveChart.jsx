import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { LiveChartContainer, ShimmerLine, useInfinitePulse } from '@/components/animations/LiveDashboardAnimations';

/**
 * Bar Chart vivo con animaciones continuas
 */
export function LiveBarChart({ data, title, dataKey = 'value', color = '#f97316' }) {
  return (
    <LiveChartContainer title={title}>
      <div className="h-[300px]">
        <ShimmerLine color={color}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`barGrad${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip />
              <Bar 
                dataKey={dataKey} 
                fill={`url(#barGrad${color})`}
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <motion.g key={index} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }}>
                    <rect />
                  </motion.g>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ShimmerLine>
      </div>
    </LiveChartContainer>
  );
}

/**
 * Donut Chart vivo con rotación suave
 */
export function LiveDonutChart({ data, title, colors = ['#f97316', '#6366f1', '#ec4899', '#14b8a6'] }) {
  return (
    <LiveChartContainer title={title}>
      <div className="h-[300px] flex items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 3, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </LiveChartContainer>
  );
}

/**
 * Line Chart vivo con glow y movimiento
 */
export function LiveLineChart({ data, title, dataKey = 'value', color = '#f97316' }) {
  return (
    <LiveChartContainer title={title}>
      <div className="h-[300px]">
        <ShimmerLine color={color}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <filter id={`lineGlow${color}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
                filter={`url(#lineGlow${color})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </ShimmerLine>
      </div>
    </LiveChartContainer>
  );
}