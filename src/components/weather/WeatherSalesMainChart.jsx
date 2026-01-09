import React, { useMemo } from 'react';
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '⛈️';
    return '🌤️';
  };

  const avgSales = payload.find(p => p.name === 'Ventas')?.value || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl rounded-xl border border-white/20 bg-slate-950/80 p-4 shadow-2xl"
    >
      <p className="text-sm font-bold text-white mb-2">{data.displayDate}</p>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Ventas:</span>
          <span className="font-bold text-blue-400">${(data.sales / 1000000).toFixed(1)}M</span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Temperatura:</span>
          <span className="font-bold text-amber-400">{data.temperature.toFixed(1)}°C {getWeatherIcon(data.weatherCode)}</span>
        </div>

        {data.precipitation > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Precipitación:</span>
            <span className="font-bold text-cyan-400">{data.precipitation.toFixed(1)}mm</span>
          </div>
        )}

        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">vs Promedio:</span>
            <span className={`font-bold ${data.sales > 5000000 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.sales > 5000000 ? '+' : ''}{((data.sales - 5000000) / 5000000 * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function WeatherSalesMainChart({ data, selectedMetrics }) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      salesM: d.sales / 1000000
    }));
  }, [data]);

  const avgSales = useMemo(() => {
    return chartData.length > 0
      ? chartData.reduce((sum, d) => sum + d.sales, 0) / chartData.length
      : 0;
  }, [chartData]);

  const maxSalesIndex = chartData.reduce((maxIdx, d, idx) => 
    d.sales > chartData[maxIdx].sales ? idx : maxIdx, 0);
  const minSalesIndex = chartData.reduce((minIdx, d, idx) => 
    d.sales < chartData[minIdx].sales ? idx : minIdx, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden
        backdrop-blur-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-black text-white mb-2">Correlación Clima & Ventas</h2>
        <p className="text-sm text-slate-400">
          Análisis de {chartData.length} días — patrones de venta según condiciones climáticas
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          {/* Reference line for average sales */}
          <ReferenceLine 
            y={avgSales / 1000000} 
            stroke="rgba(148, 163, 184, 0.3)"
            strokeDasharray="5 5"
            label={{ value: 'Promedio', position: 'right', fill: '#94a3b8', fontSize: 12 }}
          />

          <XAxis 
            dataKey="displayDate"
            stroke="rgba(148, 163, 184, 0.3)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
          />

          <YAxis 
            stroke="rgba(148, 163, 184, 0.3)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            label={{ value: 'Ventas (M)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />

          <YAxis 
            yAxisId="right"
            stroke="rgba(148, 163, 184, 0.3)"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            label={{ value: 'Temperatura (°C)', angle: 90, position: 'insideRight', fill: '#94a3b8' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Bars with rounded corners highlight */}
          <Bar 
            dataKey="salesM"
            name="Ventas"
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
          >
            {/* Highlight best and worst days */}
            {chartData.map((entry, index) => (
              <circle
                key={index}
                cx={0}
                cy={0}
                r={index === maxSalesIndex || index === minSalesIndex ? 8 : 0}
                fill={index === maxSalesIndex ? '#10b981' : '#ef4444'}
                opacity={0.5}
              />
            ))}
          </Bar>

          {/* Temperature line - smooth and organic */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="temperature"
            name="Temperatura"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />

          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="line"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Bottom insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div>
          <p className="text-xs text-slate-500 mb-1">Mejor Día</p>
          <p className="text-sm font-bold text-emerald-400">
            {chartData[maxSalesIndex]?.displayDate}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Peor Día</p>
          <p className="text-sm font-bold text-red-400">
            {chartData[minSalesIndex]?.displayDate}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Rango de Ventas</p>
          <p className="text-sm font-bold text-blue-400">
            ${((chartData[maxSalesIndex]?.sales - chartData[minSalesIndex]?.sales) / 1000000).toFixed(1)}M
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}