import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, CloudSun, CloudLightning, CloudSnow,
  Droplets, Wind, Thermometer, TrendingUp, TrendingDown, 
  Calendar, Loader2, ChevronDown, ChevronUp, Umbrella
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, Line, Cell
} from 'recharts';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de códigos WMO a información visual
const getWeatherInfo = (code) => {
  if (code === 0) return { icon: Sun, label: 'Despejado', color: 'text-amber-500', bgGradient: 'from-amber-100 to-yellow-50', barColor: '#f59e0b' };
  if (code >= 1 && code <= 2) return { icon: CloudSun, label: 'Parcialmente nublado', color: 'text-sky-500', bgGradient: 'from-sky-100 to-blue-50', barColor: '#0ea5e9' };
  if (code === 3) return { icon: Cloud, label: 'Nublado', color: 'text-gray-500', bgGradient: 'from-gray-100 to-slate-50', barColor: '#6b7280' };
  if (code >= 45 && code <= 48) return { icon: Cloud, label: 'Neblina', color: 'text-gray-400', bgGradient: 'from-gray-100 to-slate-100', barColor: '#9ca3af' };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: 'Lluvia', color: 'text-blue-500', bgGradient: 'from-blue-100 to-indigo-50', barColor: '#3b82f6' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: 'Nieve', color: 'text-cyan-500', bgGradient: 'from-cyan-100 to-blue-50', barColor: '#06b6d4' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Aguacero', color: 'text-blue-600', bgGradient: 'from-blue-200 to-indigo-100', barColor: '#2563eb' };
  if (code >= 95 && code <= 99) return { icon: CloudLightning, label: 'Tormenta', color: 'text-purple-600', bgGradient: 'from-purple-100 to-indigo-100', barColor: '#9333ea' };
  return { icon: CloudSun, label: 'Variable', color: 'text-sky-500', bgGradient: 'from-sky-50 to-blue-50', barColor: '#0ea5e9' };
};

// Tarjeta de día individual
const DayForecastCard = ({ day, index, isExpanded, onToggle, salesHistory }) => {
  const weatherInfo = getWeatherInfo(day.weathercode);
  const WeatherIcon = weatherInfo.icon;
  
  // Estimar ventas basado en historial
  const avgSalesSimilar = useMemo(() => {
    if (!salesHistory?.length) return null;
    const similarDays = salesHistory.filter(s => {
      const dayCode = s.weather_code || 0;
      const isSimilar = Math.abs(dayCode - day.weathercode) <= 10;
      return isSimilar && s.total_sales > 0;
    });
    if (similarDays.length === 0) return null;
    return similarDays.reduce((sum, s) => sum + s.total_sales, 0) / similarDays.length;
  }, [salesHistory, day.weathercode]);
  
  const isRainy = day.precipitation_probability_max > 50 || day.precipitation_sum > 2;
  const isHot = day.temperature_2m_max >= 25;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="cursor-pointer"
      onClick={() => onToggle(index)}
    >
      <Card className={`bg-gradient-to-br ${weatherInfo.bgGradient} border-0 shadow-md hover:shadow-xl transition-all overflow-hidden`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                {format(parseISO(day.date), 'EEE', { locale: es })}
              </p>
              <p className="text-lg font-black text-gray-800">
                {format(parseISO(day.date), 'd MMM', { locale: es })}
              </p>
            </div>
            <motion.div
              animate={{ 
                rotate: weatherInfo.icon === Sun ? [0, 10, -10, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <WeatherIcon className={`w-10 h-10 ${weatherInfo.color}`} />
            </motion.div>
          </div>
          
          {/* Temperaturas */}
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-rose-500" />
            <span className="text-xl font-bold text-gray-800">
              {Math.round(day.temperature_2m_max)}°
            </span>
            <span className="text-sm text-gray-500">
              / {Math.round(day.temperature_2m_min)}°C
            </span>
          </div>
          
          {/* Métricas principales */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <Umbrella className={`w-4 h-4 mx-auto mb-1 ${isRainy ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className={`text-sm font-bold ${isRainy ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.precipitation_probability_max || 0}%
              </p>
              <p className="text-[9px] text-gray-500">Prob. lluvia</p>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <Droplets className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-700">
                {(day.precipitation_sum || 0).toFixed(1)}mm
              </p>
              <p className="text-[9px] text-gray-500">Precipitación</p>
            </div>
          </div>
          
          {/* Etiqueta de clima */}
          <div className={`text-center py-1.5 rounded-lg ${isRainy ? 'bg-blue-100 text-blue-700' : isHot ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
            <p className="text-xs font-bold">
              {isRainy ? '🌧️ Día lluvioso' : isHot ? '☀️ Día cálido' : '⛅ Día templado'}
            </p>
          </div>
          
          {/* Estimación de ventas */}
          {avgSalesSimilar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 pt-2 border-t border-white/50"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Venta estimada:</span>
                <span className="font-bold text-emerald-600">
                  ${(avgSalesSimilar / 1000000).toFixed(1)}M
                </span>
              </div>
            </motion.div>
          )}
          
          {/* Expandir */}
          <div className="flex justify-center mt-2">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {/* Detalles expandidos */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-white/50 space-y-2"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 rounded p-2">
                    <p className="text-gray-500">Viento</p>
                    <p className="font-bold">{Math.round(day.windspeed_10m_max || 0)} km/h</p>
                  </div>
                  <div className="bg-white/50 rounded p-2">
                    <p className="text-gray-500">UV Máx</p>
                    <p className="font-bold">{(day.uv_index_max || 0).toFixed(1)}</p>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500 mb-1">Recomendación:</p>
                  <p className="text-xs text-gray-700">
                    {isRainy 
                      ? '🏠 Activa promociones de domicilios y bebidas calientes'
                      : isHot 
                        ? '🍦 Refuerza stock de conos y malteadas frías'
                        : '👨‍👩‍👧 Buen día para familias, promociona combos'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function WeatherForecast7Days({ forecastData, salesHistory = [], loading, locationName = 'Bogotá' }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // cards, chart
  
  const forecast = useMemo(() => {
    if (!forecastData?.daily) return [];
    const daily = forecastData.daily;
    return daily.time?.slice(0, 7).map((date, idx) => ({
      date,
      temperature_2m_max: daily.temperature_2m_max?.[idx],
      temperature_2m_min: daily.temperature_2m_min?.[idx],
      precipitation_probability_max: daily.precipitation_probability_max?.[idx],
      precipitation_sum: daily.precipitation_sum?.[idx],
      weathercode: daily.weathercode?.[idx],
      windspeed_10m_max: daily.windspeed_10m_max?.[idx],
      uv_index_max: daily.uv_index_max?.[idx],
    })) || [];
  }, [forecastData]);
  
  // Datos para gráficos
  const chartData = useMemo(() => {
    return forecast.map(day => {
      const weatherInfo = getWeatherInfo(day.weathercode);
      return {
        name: format(parseISO(day.date), 'EEE', { locale: es }),
        fullDate: format(parseISO(day.date), 'd MMM', { locale: es }),
        tempMax: day.temperature_2m_max,
        tempMin: day.temperature_2m_min,
        rain: day.precipitation_probability_max || 0,
        precipitation: day.precipitation_sum || 0,
        color: weatherInfo.barColor
      };
    });
  }, [forecast]);
  
  if (loading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (!forecast.length) {
    return (
      <Card className="bg-gradient-to-br from-sky-50 to-blue-100 border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay datos de pronóstico disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            Pronóstico 7 Días - {locationName}
          </h3>
          <p className="text-sm text-gray-500">
            {format(parseISO(forecast[0].date), "d MMM", { locale: es })} - {format(parseISO(forecast[6].date), "d MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className={viewMode === 'cards' ? 'bg-sky-500 hover:bg-sky-600' : ''}
          >
            📅 Tarjetas
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
            className={viewMode === 'chart' ? 'bg-sky-500 hover:bg-sky-600' : ''}
          >
            📊 Gráficos
          </Button>
        </div>
      </div>
      
      {viewMode === 'cards' ? (
        /* Vista de tarjetas */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, idx) => (
            <DayForecastCard
              key={day.date}
              day={day}
              index={idx}
              isExpanded={expandedDay === idx}
              onToggle={(i) => setExpandedDay(expandedDay === i ? null : i)}
              salesHistory={salesHistory}
            />
          ))}
        </div>
      ) : (
        /* Vista de gráficos */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico de temperatura */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-500" />
                Temperatura (°C)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tempMaxGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="tempMinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white shadow-lg rounded-lg p-3 border text-sm">
                            <p className="font-bold text-gray-700">{payload[0]?.payload.fullDate}</p>
                            <p className="text-orange-500">Máx: {payload[0]?.value}°C</p>
                            <p className="text-blue-500">Mín: {payload[1]?.value}°C</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="tempMax" stroke="#f97316" strokeWidth={2} fill="url(#tempMaxGrad)" name="Máxima" />
                    <Area type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={2} fill="url(#tempMinGrad)" name="Mínima" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de lluvia */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-blue-500" />
                Probabilidad de Lluvia (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#06b6d4' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white shadow-lg rounded-lg p-3 border text-sm">
                            <p className="font-bold text-gray-700">{payload[0]?.payload.fullDate}</p>
                            <p className="text-blue-500">Prob. lluvia: {payload[0]?.value}%</p>
                            <p className="text-cyan-500">Precipitación: {payload[1]?.value}mm</p>
                          </div>
                        );
                      }}
                    />
                    <Bar yAxisId="left" dataKey="rain" radius={[4, 4, 0, 0]} name="Probabilidad">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rain > 50 ? '#3b82f6' : '#93c5fd'} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name="Precipitación (mm)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Resumen semanal */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Temp. promedio</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.round(chartData.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) / chartData.length)}°C
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Días lluviosos</p>
              <p className="text-2xl font-bold text-blue-600">
                {chartData.filter(d => d.rain > 50).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Días soleados</p>
              <p className="text-2xl font-bold text-amber-500">
                {chartData.filter(d => d.rain < 30).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Precip. total</p>
              <p className="text-2xl font-bold text-cyan-600">
                {chartData.reduce((sum, d) => sum + d.precipitation, 0).toFixed(1)}mm
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}