import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, TrendingUp, Thermometer, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

const KPICard = ({ icon: Icon, label, value, subtext, color, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-4 backdrop-blur-xl border border-white/20 ${color}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-300 font-medium">{label}</p>
        <p className="text-2xl font-black text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <motion.div 
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="p-3 bg-white/10 rounded-lg"
      >
        <Icon className="w-5 h-5 text-white" />
      </motion.div>
    </div>
    {trend !== undefined && (
      <div className={`text-sm font-bold mt-2 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
      </div>
    )}
  </motion.div>
);

export default function WeatherSalesImpactChart({ weatherData, dailySales = [], formatCurrency }) {
  const [viewMode, setViewMode] = useState('all');

  const chartData = useMemo(() => {
    if (!weatherData?.history?.time) return [];

    const salesMap = {};
    dailySales.forEach(s => {
      const key = s.date?.split('T')[0] || s.date;
      salesMap[key] = s.total_sales || 0;
    });

    return weatherData.history.time.slice(0, 30).map((date, idx) => {
      const code = weatherData.history.weathercode?.[idx] || 0;
      const temp = weatherData.history.temperature_2m_mean?.[idx] || 0;
      const precip = weatherData.history.precipitation_sum?.[idx] || 0;
      const sales = salesMap[date] || 0;

      const weatherType = 
        code === 0 || code === 1 ? 'sunny' :
        code >= 51 && code <= 82 ? 'rainy' : 'cloudy';

      return {
        date: format(parseISO(date), 'dd'),
        fullDate: format(parseISO(date), 'EEE dd'),
        temperature: Math.round(temp * 10) / 10,
        precipitation: Math.round(precip * 10) / 10,
        sales,
        weatherType
      };
    });
  }, [weatherData, dailySales]);

  const stats = useMemo(() => {
    if (!chartData.length) return null;
    const withSales = chartData.filter(d => d.sales > 0);
    const sunny = withSales.filter(d => d.weatherType === 'sunny');
    const rainy = withSales.filter(d => d.weatherType === 'rainy');
    
    const avgTotal = withSales.reduce((s, d) => s + d.sales, 0) / Math.max(withSales.length, 1);
    const avgSunny = sunny.reduce((s, d) => s + d.sales, 0) / Math.max(sunny.length, 1);
    const avgRainy = rainy.reduce((s, d) => s + d.sales, 0) / Math.max(rainy.length, 1);

    return {
      avgTotal,
      avgSunny,
      avgRainy,
      sunnyCount: sunny.length,
      rainyCount: rainy.length,
      sunnyImpact: avgTotal ? ((avgSunny - avgTotal) / avgTotal * 100) : 0,
      rainyImpact: avgTotal ? ((avgRainy - avgTotal) / avgTotal * 100) : 0
    };
  }, [chartData]);

  if (!chartData.length) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Cloud className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const getBarColor = (weatherType) => {
    switch(weatherType) {
      case 'sunny': return '#fbbf24';
      case 'rainy': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stats && (
          <>
            <KPICard
              icon={Sun}
              label="Días Soleados"
              value={`${stats.sunnyCount}`}
              subtext={formatCurrency(stats.avgSunny)}
              color="bg-gradient-to-br from-amber-500/20 to-orange-500/10"
              trend={stats.sunnyImpact}
            />
            <KPICard
              icon={CloudRain}
              label="Días Lluviosos"
              value={`${stats.rainyCount}`}
              subtext={formatCurrency(stats.avgRainy)}
              color="bg-gradient-to-br from-blue-500/20 to-cyan-500/10"
              trend={stats.rainyImpact}
            />
            <KPICard
              icon={Thermometer}
              label="Temp. Promedio"
              value={`${(chartData.reduce((s, d) => s + d.temperature, 0) / chartData.length).toFixed(1)}°C`}
              color="bg-gradient-to-br from-orange-500/20 to-red-500/10"
            />
            <KPICard
              icon={Droplets}
              label="Precipitación"
              value={`${chartData.reduce((s, d) => s + d.precipitation, 0).toFixed(1)}mm`}
              color="bg-gradient-to-br from-blue-500/20 to-indigo-500/10"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Impacto del Clima en Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#f97316', fontSize: 12 }} width={50} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '12px'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar yAxisId="left" dataKey="sales" name="Ventas" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={getBarColor(entry.weatherType)} opacity={0.8} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f97316" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-400" />
                <span className="text-sm text-gray-300">Soleado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-300">Lluvioso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500" />
                <span className="text-sm text-gray-300">Nublado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="text-sm text-gray-300">Temperatura</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sun className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-100 mb-1">Días Soleados</p>
                  <p className="text-xs text-amber-100/70">
                    {stats.sunnyImpact > 5 ? `Generan ${stats.sunnyImpact.toFixed(0)}% más ventas. Aumenta inventario.` : 
                     stats.sunnyImpact < -5 ? `Reducen ventas ${Math.abs(stats.sunnyImpact).toFixed(0)}%.` :
                     'Impacto neutral en ventas.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CloudRain className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-100 mb-1">Días Lluviosos</p>
                  <p className="text-xs text-blue-100/70">
                    {stats.rainyImpact < -10 ? `Reducen ventas ${Math.abs(stats.rainyImpact).toFixed(0)}%. Implementa delivery.` :
                     stats.rainyImpact > 5 ? `¡Aumentan ventas ${stats.rainyImpact.toFixed(0)}%! Prepara más stock.` :
                     'Impacto moderado en ventas.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}