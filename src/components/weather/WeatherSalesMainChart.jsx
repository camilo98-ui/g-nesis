import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Cloud, CloudRain, Sun, Droplets } from 'lucide-react';

const getWeatherIcon = (precipitation) => {
  if (precipitation > 5) return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
  if (precipitation > 1) return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
  return <Sun className="w-3.5 h-3.5 text-amber-400" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const avgSales = payload[0].payload.avgSales || 2500000;
  const diff = ((data.sales - avgSales) / avgSales) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl backdrop-blur-xl bg-slate-900/95 border border-white/20 p-4 shadow-2xl"
    >
      <p className="font-bold text-white mb-3">{data.displayDate}</p>
      
      <div className="space-y-2.5 text-sm">
        {/* Sales */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
            <span className="text-slate-300">Ventas</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-white">${(data.sales / 1000000).toFixed(2)}M</p>
            <p className={`text-xs ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs promedio
            </p>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-slate-300">Temperatura</span>
          </div>
          <p className="font-semibold text-white">{data.temperature.toFixed(1)}°C</p>
        </div>

        {/* Precipitation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">Precipitación</span>
          </div>
          <p className="font-semibold text-white">{data.precipitation.toFixed(1)}mm</p>
        </div>

        {/* Weather Type */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Clima</span>
          </div>
          <div className="flex items-center gap-1">
            {getWeatherIcon(data.precipitation)}
            <span className="font-semibold text-white text-xs">
              {data.precipitation > 5 ? 'Lluvioso' : data.precipitation > 1 ? 'Nublado' : 'Soleado'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function WeatherSalesMainChart({ data, selectedMetrics }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const avgSales = data.reduce((sum, d) => sum + d.sales, 0) / data.length;
    
    return data.map((d, idx) => ({
      ...d,
      avgSales,
      isBest: d.sales === Math.max(...data.map(x => x.sales)),
      isWorst: d.sales === Math.min(...data.map(x => x.sales)),
      index: idx
    }));
  }, [data]);

  // Calcular insights
  const insights = useMemo(() => {
    if (chartData.length === 0) return null;

    const rainyDays = chartData.filter(d => d.precipitation > 1);
    const sunnyDays = chartData.filter(d => d.precipitation <= 1);

    if (rainyDays.length === 0 || sunnyDays.length === 0) return null;

    const rainyAvg = rainyDays.reduce((sum, d) => sum + d.sales, 0) / rainyDays.length;
    const sunnyAvg = sunnyDays.reduce((sum, d) => sum + d.sales, 0) / sunnyDays.length;
    const diff = ((sunnyAvg - rainyAvg) / rainyAvg) * 100;

    return {
      text: `Las ventas caen un ${Math.abs(diff).toFixed(0)}% en días lluviosos`,
      percentage: diff,
      rainyCount: rainyDays.length,
      sunnyCount: sunnyDays.length
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-80 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
      >
        <p className="text-slate-400">Cargando datos...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl backdrop-blur-xl border border-white/10 p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
      }}
    >
      {/* Insight Banner */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 flex items-start gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {insights.text}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {insights.rainyCount} días lluviosos vs {insights.sunnyCount} soleados
            </p>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis 
            dataKey="displayDate" 
            stroke="rgba(255,255,255,0.2)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />

          <YAxis 
            yAxisId="left"
            stroke="rgba(255,255,255,0.2)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />

          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="rgba(255,255,255,0.2)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgba(255,255,255,0.5)' }}
          />

          {/* Reference Line for Average */}
          <ReferenceLine 
            yAxisId="left"
            y={chartData[0]?.avgSales || 0}
            stroke="rgba(100, 200, 255, 0.3)"
            strokeDasharray="4 4"
            label={{
              value: 'Promedio',
              position: 'right',
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 12
            }}
          />

          {/* Bars with conditional styling */}
          <Bar 
            yAxisId="left"
            dataKey="sales" 
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            onMouseEnter={(data) => setHoveredBar(data.index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isBest ? '#10b981' :
                  entry.isWorst ? '#ef4444' :
                  'url(#barGradient)'
                }
                opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.3}
              />
            ))}
          </Bar>

          {/* Temperature Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="temperature"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />

          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => {
              const labels = { sales: 'Ventas', temperature: 'Temperatura (°C)' };
              return labels[value] || value;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend below chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-3 gap-4 text-sm"
      >
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Mejor día</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-400">Ventas</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-400">Peor día</span>
        </div>
      </motion.div>
    </motion.div>
  );
}