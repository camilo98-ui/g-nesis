import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudRain, Sun, Droplets, Wind, Eye, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Legend, ReferenceLine } from 'recharts';
import { format, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns';

const WeatherMetricCard = ({ icon: Icon, label, value, unit, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-xl p-4 border border-white/10 shadow-lg`}
  >
    <motion.div
      className="absolute inset-0 opacity-0"
      animate={{ opacity: [0.1, 0.3, 0.1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm"
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        {trend !== undefined && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-bold">{Math.abs(trend)}%</span>
          </motion.div>
        )}
      </div>
      <p className="text-xs text-white/60 mb-2">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      {unit && <p className="text-xs text-white/40 mt-1">{unit}</p>}
    </div>
  </motion.div>
);

export default function ExecutiveWeatherSalesAnalysis({ weatherData, dailySales, storesAnalysis, dateRange, formatCurrency, formatKPI }) {
  const [selectedMetric, setSelectedMetric] = useState('correlation');

  const weatherAnalysis = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales?.length) {
      return {
        rainyDays: 0,
        sunnySales: 0,
        rainySales: 0,
        rainyCount: 0,
        temperatureAvg: 0,
        correlationScore: 0,
        bestCondition: 'Sin datos',
        worstCondition: 'Sin datos'
      };
    }

    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.to);
    end.setHours(23, 59, 59, 999);

    const weatherDays = (weatherData?.history?.time || [])
      .filter(date => {
        const d = parseISO(date);
        d.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
      })
      .map((date, idx) => {
        const temp = weatherData.history.temperature_2m_mean?.[idx] || 0;
        const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
        const weatherCode = weatherData.history.weathercode?.[idx] || 0;
        
        const isRainy = precipitation > 2 || [51, 52, 53, 61, 62, 63, 71, 72, 73, 80, 81, 82, 85, 86, 95, 96, 99].includes(weatherCode);
        const isSunny = weatherCode === 0 || weatherCode === 1;
        
        const daysSales = dailySales
          .filter(s => {
            try {
              const saleDate = parseISO(s.date);
              saleDate.setHours(0, 0, 0, 0);
              return saleDate.getTime() === parseISO(date).setHours(0, 0, 0, 0);
            } catch { return false; }
          })
          .reduce((sum, s) => sum + (s.total_sales || 0), 0);

        return {
          date,
          temp: Math.round(temp * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10,
          isRainy,
          isSunny,
          sales: daysSales || 0,
          weatherCode
        };
      });

    if (!weatherDays || weatherDays.length === 0) {
      return {
        rainyDays: 0,
        sunnyDays: 0,
        sunnySales: 0,
        rainySales: 0,
        avgSalesRainy: 0,
        avgSalesSunny: 0,
        rainyImpact: 0,
        sunnyImpact: 0,
        temperatureAvg: 0,
        precipitationTotal: 0,
        correlationScore: 'Sin datos',
        weatherDays: [],
        withSales: []
      };
    }

    const rainyDays = weatherDays.filter(d => d.isRainy);
    const sunnyDays = weatherDays.filter(d => d.isSunny);
    const withSales = weatherDays.filter(d => d.sales > 0);

    const avgSalesAll = withSales.length > 0 ? withSales.reduce((s, d) => s + d.sales, 0) / withSales.length : 0;
    const avgSalesRainy = rainyDays.filter(d => d.sales > 0).length > 0 
      ? rainyDays.filter(d => d.sales > 0).reduce((s, d) => s + d.sales, 0) / rainyDays.filter(d => d.sales > 0).length 
      : 0;
    const avgSalesSunny = sunnyDays.filter(d => d.sales > 0).length > 0 
      ? sunnyDays.filter(d => d.sales > 0).reduce((s, d) => s + d.sales, 0) / sunnyDays.filter(d => d.sales > 0).length 
      : 0;

    const rainyImpact = avgSalesAll > 0 ? ((avgSalesRainy - avgSalesAll) / avgSalesAll * 100) : 0;
    const sunnyImpact = avgSalesAll > 0 ? ((avgSalesSunny - avgSalesAll) / avgSalesAll * 100) : 0;

    return {
      rainyDays: rainyDays.length,
      sunnyDays: sunnyDays.length,
      sunnySales: sunnyDays.filter(d => d.sales > 0).reduce((s, d) => s + d.sales, 0),
      rainySales: rainyDays.filter(d => d.sales > 0).reduce((s, d) => s + d.sales, 0),
      avgSalesRainy,
      avgSalesSunny,
      rainyImpact,
      sunnyImpact,
      temperatureAvg: withSales.length > 0 ? (withSales.reduce((s, d) => s + d.temp, 0) / withSales.length).toFixed(1) : 0,
      precipitationTotal: weatherDays.reduce((s, d) => s + d.precipitation, 0).toFixed(0),
      correlationScore: Math.abs(rainyImpact) > Math.abs(sunnyImpact) ? 'Lluvia = -Ventas' : 'Solead = +Ventas',
      weatherDays,
      withSales
    };
  }, [weatherData, dailySales, dateRange]);

  const chartData = useMemo(() => {
    if (!weatherAnalysis.withSales || weatherAnalysis.withSales.length === 0) return [];
    return weatherAnalysis.withSales.map(day => ({
      date: format(parseISO(day.date), 'dd/MM'),
      fullDate: format(parseISO(day.date), 'EEE dd MMM'),
      sales: day.sales / 1000000,
      temperature: day.temp,
      precipitation: day.precipitation,
      isRainy: day.isRainy,
      weatherType: day.isRainy ? 'Lluvia' : day.isSunny ? 'Soleado' : 'Nublado',
      color: day.isRainy ? '#3b82f6' : day.isSunny ? '#fbbf24' : '#9ca3af'
    }));
  }, [weatherAnalysis]);

  return (
    <div className="space-y-4">
      {/* Tarjetas de Métricas - 4 Columnas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <WeatherMetricCard
          icon={CloudRain}
          label="Días Lluviosos"
          value={weatherAnalysis.rainyDays}
          unit={weatherAnalysis.rainyDays > 0 ? `${(weatherAnalysis.rainyDays / (weatherAnalysis.rainyDays + weatherAnalysis.sunnyDays) * 100).toFixed(0)}% del período` : ''}
          trend={weatherAnalysis.rainyImpact}
          color="from-blue-600/20 to-cyan-600/20"
        />
        <WeatherMetricCard
          icon={Sun}
          label="Días Soleados"
          value={weatherAnalysis.sunnyDays}
          unit={weatherAnalysis.sunnyDays > 0 ? `${(weatherAnalysis.sunnyDays / (weatherAnalysis.rainyDays + weatherAnalysis.sunnyDays) * 100).toFixed(0)}% del período` : ''}
          trend={weatherAnalysis.sunnyImpact}
          color="from-amber-600/20 to-orange-600/20"
        />
        <WeatherMetricCard
          icon={Droplets}
          label="Precipitación Total"
          value={`${weatherAnalysis.precipitationTotal}mm`}
          unit="Acumulado"
          color="from-indigo-600/20 to-purple-600/20"
        />
        <WeatherMetricCard
          icon={Wind}
          label="Temp. Promedio"
          value={`${weatherAnalysis.temperatureAvg}°C`}
          unit="Rango: 15-25°C óptimo"
          color="from-orange-600/20 to-red-600/20"
        />
      </div>

      {/* Gráfica Principal - Profesional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-white">Correlación: Clima vs Ventas</h3>
            <p className="text-sm text-slate-400">Análisis de impacto meteorológico en desempeño de ventas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('correlation')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedMetric === 'correlation'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Correlación
            </button>
            <button
              onClick={() => setSelectedMetric('detail')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedMetric === 'detail'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Detalle
            </button>
          </div>
        </div>

        {selectedMetric === 'correlation' && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="rainyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sunnyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tempLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                tickFormatter={(v) => `$${v.toFixed(0)}M`}
                fontSize={11}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f97316"
                tickFormatter={(v) => `${v}°`}
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fff'
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-300 font-bold">{data.fullDate}</p>
                      <p className="text-xs">📊 Ventas: <span className="font-bold text-emerald-400">{formatCurrency(data.sales * 1000000)}</span></p>
                      <p className="text-xs">🌡️ Temp: <span className="font-bold text-orange-400">{data.temperature}°C</span></p>
                      <p className="text-xs">💧 Lluvia: <span className="font-bold text-blue-400">{data.precipitation}mm</span></p>
                      <p className={`text-xs font-semibold ${data.isRainy ? 'text-blue-400' : 'text-amber-400'}`}>
                        {data.weatherType}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend />
              <ReferenceLine
                yAxisId="left"
                y={chartData.reduce((sum, d) => sum + d.sales, 0) / chartData.length}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{ value: 'Promedio', position: 'right', fill: '#10b981', fontSize: 10 }}
              />
              <Bar
                yAxisId="left"
                dataKey="sales"
                name="Ventas"
                radius={[6, 6, 0, 0]}
                fill="#10b981"
                opacity={0.7}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                fill="url(#rainyGradient)"
                stroke="none"
                name="Área de Ventas"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="temperature"
                stroke="url(#tempLine)"
                strokeWidth={3}
                name="Temperatura"
                dot={{ r: 4, fill: '#f97316' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {selectedMetric === 'detail' && (
          <div className="grid grid-cols-3 gap-4">
            {/* Impacto de Lluvia */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <CloudRain className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white">Impacto Lluvia</h4>
              </div>
              <p className="text-3xl font-black text-blue-300 mb-2">
                {weatherAnalysis.rainyImpact.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {weatherAnalysis.rainyImpact < -5 ? '❌ Reduce ventas' : weatherAnalysis.rainyImpact > 5 ? '✅ Aumenta ventas' : '➡️ Sin impacto significativo'}
              </p>
              <div className="space-y-1 text-xs text-slate-300">
                <p>Días: {weatherAnalysis.rainyDays}</p>
                <p>Total: {formatCurrency(weatherAnalysis.rainySales)}</p>
                <p>Promedio: {formatCurrency(weatherAnalysis.avgSalesRainy)}</p>
              </div>
            </motion.div>

            {/* Impacto Sol */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white">Impacto Sol</h4>
              </div>
              <p className="text-3xl font-black text-amber-300 mb-2">
                {weatherAnalysis.sunnyImpact.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {weatherAnalysis.sunnyImpact > 5 ? '✅ Aumenta ventas' : weatherAnalysis.sunnyImpact < -5 ? '❌ Reduce ventas' : '➡️ Sin impacto significativo'}
              </p>
              <div className="space-y-1 text-xs text-slate-300">
                <p>Días: {weatherAnalysis.sunnyDays}</p>
                <p>Total: {formatCurrency(weatherAnalysis.sunnySales)}</p>
                <p>Promedio: {formatCurrency(weatherAnalysis.avgSalesSunny)}</p>
              </div>
            </motion.div>

            {/* Recomendaciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-white">Recomendaciones</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {weatherAnalysis.rainyImpact < -10 && (
                  <p>🌧️ Refuerza promos en días lluviosos (entregas, combos)</p>
                )}
                {weatherAnalysis.sunnyImpact > 10 && (
                  <p>☀️ Aumenta stock en días soleados</p>
                )}
                <p>📍 Considera activaciones por cambios climáticos</p>
                <p>📊 Ajusta presupuestos por estacionalidad</p>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Insights */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/30"
          >
            <p className="text-sm font-bold text-emerald-300 mb-2">📈 Hallazgo Clave</p>
            <p className="text-sm text-slate-300">
              {Math.abs(weatherAnalysis.rainyImpact) > Math.abs(weatherAnalysis.sunnyImpact)
                ? `La lluvia es el factor climático más influyente con un impacto de ${weatherAnalysis.rainyImpact.toFixed(1)}%`
                : `El clima soleado incrementa las ventas en ${weatherAnalysis.sunnyImpact.toFixed(1)}%`}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/30"
          >
            <p className="text-sm font-bold text-blue-300 mb-2">💡 Oportunidad</p>
            <p className="text-sm text-slate-300">
              Período analizado: {weatherAnalysis.rainyDays + weatherAnalysis.sunnyDays} días · {(weatherAnalysis.rainyDays + weatherAnalysis.sunnyDays > 0 ? ((weatherAnalysis.rainyDays / (weatherAnalysis.rainyDays + weatherAnalysis.sunnyDays)) * 100).toFixed(0) : 0)}% lluvioso
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}