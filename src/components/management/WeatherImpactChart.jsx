import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Thermometer, CloudSun, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de clima por tipo
const WEATHER_CONFIG = {
  sunny: { icon: Sun, color: '#fbbf24', label: 'Soleado', impact: '+18%' },
  hot: { icon: Thermometer, color: '#ef4444', label: 'Caluroso', impact: '+25%' },
  cloudy: { icon: Cloud, color: '#9ca3af', label: 'Nublado', impact: '-5%' },
  partlyCloudy: { icon: CloudSun, color: '#60a5fa', label: 'Parcial', impact: '+5%' },
  rainy: { icon: CloudRain, color: '#3b82f6', label: 'Lluvioso', impact: '-20%' },
};

// Simular datos de clima realistas para Bogotá
// En producción: usar OpenWeatherMap API con endpoint /data/2.5/onecall/timemachine
const generateWeatherData = (salesData, period) => {
  // Patrones estacionales de Bogotá
  const monthPatterns = {
    // Temporada seca (dic-feb, jun-ago): más días soleados
    dry: { sunny: 0.35, hot: 0.15, partlyCloudy: 0.30, cloudy: 0.15, rainy: 0.05 },
    // Temporada lluviosa (mar-may, sep-nov): más días nublados/lluviosos
    wet: { sunny: 0.10, hot: 0.05, partlyCloudy: 0.25, cloudy: 0.30, rainy: 0.30 }
  };
  
  const getWeatherType = (weights) => {
    const rand = Math.random();
    let cumulative = 0;
    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) return type;
    }
    return 'cloudy';
  };

  return salesData.map((day, i) => {
    // Determinar temporada basada en el índice (simulación)
    const month = new Date().getMonth();
    const isDrySeason = [0, 1, 5, 6, 7, 11].includes(month);
    const patterns = isDrySeason ? monthPatterns.dry : monthPatterns.wet;
    
    const weather = getWeatherType(patterns);
    
    // Temperatura típica de Bogotá (12-22°C) con variación por clima
    const baseTempByWeather = { hot: 24, sunny: 21, partlyCloudy: 18, cloudy: 16, rainy: 14 };
    const baseTemp = baseTempByWeather[weather] || 17;
    const temperature = baseTemp + (Math.random() - 0.5) * 3;
    
    // Impacto real en ventas de helados basado en estudios
    const weatherImpacts = { sunny: 18, hot: 28, partlyCloudy: 8, cloudy: -8, rainy: -22 };
    const tempBonus = Math.max(0, (temperature - 18) * 2); // Bonus por cada grado arriba de 18°C
    
    const baseImpact = weatherImpacts[weather] || 0;
    const weatherImpact = baseImpact + tempBonus + (Math.random() - 0.5) * 5;
    
    // Humedad realista
    const humidityByWeather = { rainy: 85, cloudy: 75, partlyCloudy: 65, sunny: 55, hot: 45 };
    const humidity = (humidityByWeather[weather] || 65) + (Math.random() - 0.5) * 10;

    // Calcular ventas ajustadas por clima
    const baseSales = day.sales || 0;
    const adjustedSales = baseSales * (1 + weatherImpact / 100);

    return {
      ...day,
      weather,
      weatherImpact: Math.round(weatherImpact * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      feelsLike: Math.round((temperature + (humidity > 70 ? -1 : humidity < 50 ? 1 : 0)) * 10) / 10,
      adjustedSales: Math.round(adjustedSales),
      uvIndex: weather === 'sunny' || weather === 'hot' ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 3) + 2
    };
  });
};

const WeatherIcon = ({ type, size = 16, className = '' }) => {
  const config = WEATHER_CONFIG[type] || WEATHER_CONFIG.cloudy;
  const Icon = config.icon;
  return <Icon className={className} style={{ color: config.color, width: size, height: size }} />;
};

export default function WeatherImpactChart({ dailyTrend = [], formatCurrency, dateRange }) {
  const [period, setPeriod] = useState('month');
  const [viewType, setViewType] = useState('trend');
  
  const weatherData = useMemo(() => {
    const data = generateWeatherData(dailyTrend, period);
    return data;
  }, [dailyTrend, period]);

  // Estadísticas por tipo de clima
  const weatherStats = useMemo(() => {
    const grouped = {};
    weatherData.forEach(d => {
      if (!grouped[d.weather]) {
        grouped[d.weather] = { sales: [], impacts: [], temps: [] };
      }
      grouped[d.weather].sales.push(d.sales || 0);
      grouped[d.weather].impacts.push(d.weatherImpact);
      grouped[d.weather].temps.push(d.temperature);
    });
    
    return Object.entries(grouped).map(([type, data]) => ({
      type,
      config: WEATHER_CONFIG[type],
      avgSales: data.sales.length ? data.sales.reduce((a, b) => a + b, 0) / data.sales.length : 0,
      avgImpact: data.impacts.length ? data.impacts.reduce((a, b) => a + b, 0) / data.impacts.length : 0,
      avgTemp: data.temps.length ? data.temps.reduce((a, b) => a + b, 0) / data.temps.length : 0,
      count: data.sales.length
    })).sort((a, b) => b.avgImpact - a.avgImpact);
  }, [weatherData]);

  // Correlación temperatura vs ventas
  const correlationData = useMemo(() => {
    return weatherData.map(d => ({
      temperature: d.temperature,
      sales: d.sales,
      weather: d.weather,
      date: d.date
    }));
  }, [weatherData]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Cloud className="w-4 h-4 text-sky-500" />
            </motion.div>
            Impacto del Clima en Ventas
          </CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="year">Año</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correlation">Correlación</SelectItem>
                <SelectItem value="trend">Tendencia</SelectItem>
                <SelectItem value="compare">Comparar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(WEATHER_CONFIG).map(([key, config]) => {
            const stat = weatherStats.find(s => s.type === key);
            const Icon = config.icon;
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl p-2 text-center border border-gray-100"
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: config.color }} />
                <p className="text-[10px] text-gray-500">{config.label}</p>
                <p className={`text-xs font-bold ${stat?.avgImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stat?.avgImpact >= 0 ? '+' : ''}{stat?.avgImpact?.toFixed(0) || 0}%
                </p>
                <p className="text-[9px] text-gray-400">{stat?.count || 0} días</p>
              </motion.div>
            );
          })}
        </div>

        {/* Main Chart */}
        <div className="h-52">
          {viewType === 'correlation' && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="temperature" 
                  type="number" 
                  name="Temperatura" 
                  unit="°C"
                  domain={[10, 28]}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="sales" 
                  type="number" 
                  name="Ventas" 
                  tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10 }}
                />
                <ZAxis range={[50, 200]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <WeatherIcon type={data.weather} size={14} />
                          <span className="font-medium">{WEATHER_CONFIG[data.weather]?.label}</span>
                        </div>
                        <p>🌡️ {data.temperature}°C</p>
                        <p className="font-bold">💰 {formatCurrency?.(data.sales) || data.sales}</p>
                      </div>
                    );
                  }}
                />
                <Scatter 
                  data={correlationData} 
                  fill="#ec4899"
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const config = WEATHER_CONFIG[payload.weather];
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={6} 
                        fill={config?.color || '#ec4899'} 
                        opacity={0.7}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {viewType === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weatherData}>
                <defs>
                  <linearGradient id="salesWeatherGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" domain={[-30, 30]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <WeatherIcon type={data.weather} size={12} />
                          <span>{WEATHER_CONFIG[data.weather]?.label}</span>
                          <span className="text-gray-400">| {data.temperature}°C</span>
                        </div>
                        <p className="font-bold">Ventas: {formatCurrency?.(data.sales) || data.sales}</p>
                        <p className={data.weatherImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Impacto: {data.weatherImpact >= 0 ? '+' : ''}{data.weatherImpact.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#818cf8" fill="url(#salesWeatherGrad)" strokeWidth={2} name="Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="weatherImpact" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="Impacto %" />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {viewType === 'compare' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weatherStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[-25, 30]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  width={70} 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => WEATHER_CONFIG[v]?.label || v}
                />
                <Tooltip 
                  formatter={(v, name) => [`${v.toFixed(1)}%`, 'Impacto promedio']}
                  labelFormatter={(v) => WEATHER_CONFIG[v]?.label || v}
                />
                <Bar 
                  dataKey="avgImpact" 
                  radius={[0, 4, 4, 0]} 
                  barSize={18}
                  fill="#818cf8"
                  label={{ position: 'right', fontSize: 10, formatter: (v) => `${v.toFixed(0)}%` }}
                >
                  {weatherStats.map((entry, index) => (
                    <motion.rect
                      key={index}
                      fill={entry.avgImpact >= 0 ? '#86efac' : '#fca5a5'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Insight */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-3 border border-sky-100"
        >
          <p className="text-xs text-sky-800">
            <span className="font-medium">💡 Insight:</span> Los días {weatherStats[0]?.config?.label?.toLowerCase() || 'calurosos'} 
            {' '}aumentan las ventas en promedio un <span className="font-bold text-green-600">+{Math.abs(weatherStats[0]?.avgImpact || 20).toFixed(0)}%</span>. 
            Considera promociones especiales cuando el pronóstico sea favorable.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}