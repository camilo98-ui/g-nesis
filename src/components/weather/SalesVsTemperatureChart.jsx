import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Thermometer, Loader2, Sun, CloudRain, Cloud, ToggleLeft, ToggleRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Area, ReferenceLine, Dot
} from 'recharts';
import { format, parseISO, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapear código de clima a tipo
const getWeatherType = (code, temp) => {
  if (code >= 51 && code <= 99) return 'rainy';
  if (temp >= 22) return 'hot';
  if (temp >= 16 && temp < 22) return 'neutral';
  return 'cold';
};

const getWeatherEmoji = (type) => {
  switch(type) {
    case 'hot': return '☀️';
    case 'rainy': return '🌧️';
    case 'cold': return '🥶';
    default: return '🌥️';
  }
};

const getWeatherColor = (type) => {
  switch(type) {
    case 'hot': return '#f59e0b';
    case 'rainy': return '#3b82f6';
    case 'cold': return '#8b5cf6';
    default: return '#6b7280';
  }
};

// Calcular correlación de Pearson
const calculateCorrelation = (data) => {
  const validData = data.filter(d => d.sales > 0 && d.temperature > 0);
  if (validData.length < 3) return { value: 0, strength: 'Sin datos' };
  
  const n = validData.length;
  const sumX = validData.reduce((s, d) => s + d.temperature, 0);
  const sumY = validData.reduce((s, d) => s + d.sales, 0);
  const sumXY = validData.reduce((s, d) => s + d.temperature * d.sales, 0);
  const sumX2 = validData.reduce((s, d) => s + d.temperature ** 2, 0);
  const sumY2 = validData.reduce((s, d) => s + d.sales ** 2, 0);
  
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  
  if (denominator === 0) return { value: 0, strength: 'Sin variación' };
  
  const r = numerator / denominator;
  
  let strength = '';
  let color = '';
  if (Math.abs(r) >= 0.7) { strength = 'Alta'; color = 'text-green-600'; }
  else if (Math.abs(r) >= 0.4) { strength = 'Moderada'; color = 'text-yellow-600'; }
  else { strength = 'Baja'; color = 'text-red-500'; }
  
  return { value: r, strength, color };
};

// Custom Dot para mostrar clima
const WeatherDot = ({ cx, cy, payload, climateMode }) => {
  if (!climateMode || !payload) return <Dot cx={cx} cy={cy} r={4} fill="#ec4899" />;
  
  const color = getWeatherColor(payload.weatherType);
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
};

export default function SalesVsTemperatureChart({ weatherData, dailySales = [], loading }) {
  const [climateMode, setClimateMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState('14');

  // Filtrar datos por período
  const filteredDays = useMemo(() => {
    if (!weatherData?.history?.time) return 0;
    return parseInt(timeFilter);
  }, [timeFilter, weatherData]);

  // Combinar datos de clima y ventas
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    const days = Math.min(filteredDays, weatherData.history.time.length);
    
    return weatherData.history.time.slice(-days).map((date, idx) => {
      const actualIdx = weatherData.history.time.length - days + idx;
      const temp = weatherData.history.temperature_2m_mean?.[actualIdx] || 0;
      const weatherCode = weatherData.history.weathercode?.[actualIdx] || 0;
      const sales = salesByDate[date] || 0;
      const weatherType = getWeatherType(weatherCode, temp);
      
      return {
        date: format(parseISO(date), 'dd', { locale: es }),
        fullDate: format(parseISO(date), "EEEE dd MMM", { locale: es }),
        temperature: Math.round(temp * 10) / 10,
        sales,
        weatherCode,
        weatherType,
        weatherEmoji: getWeatherEmoji(weatherType)
      };
    });
  }, [weatherData, dailySales, filteredDays]);

  // Calcular correlación
  const correlation = useMemo(() => calculateCorrelation(chartData), [chartData]);

  // Calcular impacto por tipo de clima
  const weatherImpact = useMemo(() => {
    const validData = chartData.filter(d => d.sales > 0);
    if (validData.length === 0) return { hot: 0, rainy: 0, neutral: 0 };
    
    const avgSales = validData.reduce((s, d) => s + d.sales, 0) / validData.length;
    
    const byType = { hot: [], rainy: [], neutral: [], cold: [] };
    validData.forEach(d => byType[d.weatherType]?.push(d.sales));
    
    const calcImpact = (arr) => {
      if (!arr.length) return 0;
      const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
      return ((avg - avgSales) / avgSales) * 100;
    };
    
    return {
      hot: calcImpact(byType.hot),
      rainy: calcImpact(byType.rainy),
      neutral: calcImpact(byType.neutral),
      cold: calcImpact(byType.cold)
    };
  }, [chartData]);

  // Generar insight automático
  const insight = useMemo(() => {
    if (chartData.length < 3) return null;
    
    const dataWithSales = chartData.filter(d => d.sales > 0);
    if (dataWithSales.length < 2) return 'No hay suficientes datos de ventas para analizar la correlación.';
    
    let maxIncrease = { tempChange: 0, salesChange: 0, from: null, to: null };
    
    for (let i = 1; i < dataWithSales.length; i++) {
      const tempChange = dataWithSales[i].temperature - dataWithSales[i-1].temperature;
      const salesChange = ((dataWithSales[i].sales - dataWithSales[i-1].sales) / dataWithSales[i-1].sales) * 100;
      
      if (tempChange > 0 && salesChange > maxIncrease.salesChange) {
        maxIncrease = {
          tempChange: Math.round(tempChange * 10) / 10,
          salesChange: Math.round(salesChange),
          from: dataWithSales[i-1],
          to: dataWithSales[i]
        };
      }
    }
    
    if (maxIncrease.tempChange > 0 && maxIncrease.salesChange > 5) {
      return `Cuando la temperatura subió de ${maxIncrease.from?.temperature}°C a ${maxIncrease.to?.temperature}°C, las ventas aumentaron un ${maxIncrease.salesChange}%.`;
    }
    
    return 'La temperatura tiene un impacto moderado en las ventas de esta tienda.';
  }, [chartData]);

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <TrendingUp className="w-4 h-4 text-pink-500" />
            </motion.div>
            Ventas vs Temperatura
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de tiempo */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-white/80">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimos 14 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Toggle Modo Clima */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setClimateMode(!climateMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                climateMode 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {climateMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Modo clima: {climateMode ? 'ON' : 'OFF'}
            </motion.button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Climate Impact Indicators (visible when mode is ON) */}
        <AnimatePresence>
          {climateMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                  <span className="text-lg">☀️</span>
                  <p className="text-[10px] text-gray-600 font-medium">Calor</p>
                  <p className={`text-sm font-bold ${weatherImpact.hot >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weatherImpact.hot >= 0 ? '+' : ''}{weatherImpact.hot.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                  <span className="text-lg">🌧️</span>
                  <p className="text-[10px] text-gray-600 font-medium">Lluvia</p>
                  <p className={`text-sm font-bold ${weatherImpact.rainy >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weatherImpact.rainy >= 0 ? '+' : ''}{weatherImpact.rainy.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                  <span className="text-lg">🌥️</span>
                  <p className="text-[10px] text-gray-600 font-medium">Templado</p>
                  <p className={`text-sm font-bold ${weatherImpact.neutral >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weatherImpact.neutral >= 0 ? '+' : ''}{weatherImpact.neutral.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-violet-50 rounded-xl p-2 text-center border border-violet-100">
                  <span className="text-lg">🥶</span>
                  <p className="text-[10px] text-gray-600 font-medium">Frío</p>
                  <p className={`text-sm font-bold ${weatherImpact.cold >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {weatherImpact.cold >= 0 ? '+' : ''}{weatherImpact.cold.toFixed(0)}%
                  </p>
                </div>
              </div>
              
              {/* Correlation Score */}
              <div className="mt-3 flex items-center justify-center gap-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3 border">
                <div className={`w-3 h-3 rounded-full ${
                  correlation.value >= 0.4 ? 'bg-green-500' : correlation.value >= 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Correlación clima–ventas:</span>{' '}
                  <span className={`font-bold ${correlation.color}`}>
                    {correlation.value.toFixed(2)} ({correlation.strength})
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="salesGradClimate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="tempGradClimate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                yAxisId="sales"
                orientation="left"
                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                tick={{ fontSize: 10, fill: '#ec4899' }}
                axisLine={{ stroke: '#ec4899' }}
              />
              <YAxis 
                yAxisId="temp"
                orientation="right"
                domain={[10, 30]}
                tickFormatter={(v) => `${v}°C`}
                tick={{ fontSize: 10, fill: '#0ea5e9' }}
                axisLine={{ stroke: '#0ea5e9' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  
                  // Calcular impacto del día
                  const avgSales = chartData.filter(d => d.sales > 0).reduce((s, d) => s + d.sales, 0) / chartData.filter(d => d.sales > 0).length || 1;
                  const impact = data?.sales ? ((data.sales - avgSales) / avgSales * 100).toFixed(0) : 0;
                  
                  return (
                    <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl border border-gray-100 text-sm">
                      <p className="font-bold text-gray-800 mb-2 capitalize flex items-center gap-2">
                        📅 {data?.fullDate}
                        {climateMode && <span className="text-lg">{data?.weatherEmoji}</span>}
                      </p>
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2">
                          <span className="text-sky-500">🌡️</span>
                          <span className="text-gray-500">Temp:</span>
                          <span className="font-bold text-sky-600">{data?.temperature}°C</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-pink-500">🍦</span>
                          <span className="text-gray-500">Ventas:</span>
                          <span className="font-bold text-pink-600">
                            ${(data?.sales / 1000000).toFixed(2)}M
                          </span>
                        </p>
                        {climateMode && (
                          <p className="flex items-center gap-2 pt-1 border-t">
                            <span>💥</span>
                            <span className="text-gray-500">Impacto:</span>
                            <span className={`font-bold ${parseInt(impact) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {parseInt(impact) >= 0 ? '+' : ''}{impact}%
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => value === 'sales' ? 'Ventas' : 'Temperatura'}
              />
              <Area 
                yAxisId="sales"
                type="monotone" 
                dataKey="sales" 
                fill="url(#salesGradClimate)" 
                stroke="#ec4899" 
                strokeWidth={2}
                name="sales"
                dot={(props) => <WeatherDot {...props} climateMode={climateMode} />}
                activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="temperature" 
                stroke="#0ea5e9" 
                strokeWidth={2.5}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#0ea5e9' }}
                name="temperature"
              />
              {/* Línea de referencia de temperatura promedio */}
              {climateMode && (
                <ReferenceLine 
                  yAxisId="temp" 
                  y={18} 
                  stroke="#9ca3af" 
                  strokeDasharray="5 5" 
                  label={{ value: '18°C', fontSize: 9, fill: '#9ca3af' }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda visual */}
        <div className="flex flex-wrap justify-center gap-4 mt-3 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-gradient-to-t from-pink-50 to-pink-300" />
            <span className="text-gray-600">Área rosa = <strong>Ventas</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-sky-500 rounded" />
            <span className="text-gray-600">Línea azul = <strong>Temperatura</strong></span>
          </div>
          {climateMode && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-500">Calor</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-500">Lluvia</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-gray-500">Templado</span>
              </div>
            </>
          )}
        </div>

        {/* Insight automático */}
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-50 to-sky-50 rounded-xl p-4 border border-pink-100"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-bold text-pink-600">📈 Análisis:</span> {insight}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}