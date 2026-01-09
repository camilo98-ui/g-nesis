import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function WeatherSalesMainChart({ data, selectedMetrics }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/20 rounded-xl p-4 shadow-2xl"
      >
        <p className="text-sm font-semibold text-white mb-2">{payload[0].payload.displayDate}</p>
        <div className="space-y-1.5 text-xs">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">
                {entry.name}: <span className="text-white font-semibold">{entry.value?.toFixed(0)}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-black text-white mb-2">Análisis de Correlación</h2>
        <p className="text-sm text-slate-400">Ventas vs Condiciones Climáticas</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            opacity={0.1}
            vertical={false}
          />

          <XAxis
            dataKey="displayDate"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />

          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#f59e0b"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={(value) => `${value}°C`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          <ReferenceLine
            yAxisId="left"
            y={data.length > 0 ? data.reduce((sum, d) => sum + d.sales, 0) / data.length : 0}
            stroke="#64748b"
            strokeDasharray="5 5"
            opacity={0.5}
          />

          {selectedMetrics.includes('sales') && (
            <Bar
              yAxisId="left"
              dataKey="sales"
              fill="url(#salesGradient)"
              name="💰 Ventas"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              animationDuration={800}
              onMouseEnter={(state) => setHoveredBar(state.index)}
              onMouseLeave={() => setHoveredBar(null)}
            />
          )}

          {selectedMetrics.includes('temperature') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              name="🌡️ Temperatura"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, index } = props;
                return (
                  <motion.circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={hoveredBar === index ? 6 : 4}
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth={2}
                    animate={{ r: hoveredBar === index ? 6 : 4 }}
                  />
                );
              }}
              animationDuration={800}
            />
          )}

          {selectedMetrics.includes('rainfall') && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="precipitation"
              name="🌧️ Precipitación"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={800}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          Hover sobre los datos para ver detalles adicionales
        </p>
      </div>
    </motion.div>
  );
}