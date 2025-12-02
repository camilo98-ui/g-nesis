import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, Sun, Cloud, Thermometer, TrendingUp, TrendingDown, 
  Zap, Calendar, BarChart3, Activity, Droplets, Wind
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Area, Legend, ReferenceLine
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos animados de clima
const WeatherIcon = ({ type, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  
  if (type === 'sunny') {
    return (
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        className={sizeClass}
      >
        <Sun className="w-full h-full text-amber-500" />
      </motion.div>
    );
  }
  if (type === 'rainy') {
    return (
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={sizeClass}
      >
        <CloudRain className="w-full h-full text-blue-500" />
      </motion.div>
    );
  }
  return (
    <motion.div
      animate={{ x: [-2, 2, -2] }}
      transition={{ duration: 3, repeat: Infinity }}
      className={sizeClass}
    >
      <Cloud className="w-full h-full text-gray-400" />
    </motion.div>
  );
};

// Botón de vista con animación
const ViewButton = ({ active, onClick, icon: Icon, label, color }) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
      transition-all duration-300 shadow-sm
      ${active 
        ? `bg-gradient-to-r ${color} text-white shadow-lg` 
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }
    `}
  >
    <motion.div
      animate={active ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Icon className="w-4 h-4" />
    </motion.div>
    {label}
  </motion.button>
);

// Tarjeta de estadística animada
const StatCard = ({ icon: Icon, label, value, subvalue, color, trend }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -3 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/80 text-xs font-medium">{label}</p>
        <motion.p 
          className="text-2xl font-black mt-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={value}
        >
          {value}
        </motion.p>
        {subvalue && <p className="text-white/70 text-xs mt-1">{subvalue}</p>}
      </div>
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="p-2 bg-white/20 rounded-xl"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
      </div>
    )}
  </motion.div>
);

export default function WeatherSalesImpactChart({ weatherData, dailySales = [], formatCurrency }) {
  const [viewMode, setViewMode] = useState('bars'); // 'bars' | 'trend' | 'comparison'
  const [timeRange, setTimeRange] = useState(30); // 7, 14, 30

  // Procesar datos
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    const getWeatherType = (code, precipitation) => {
      if (code === 0 || code === 1) return 'sunny';
      if (code >= 51 || precipitation > 5) return 'rainy';
      return 'cloudy';
    };
    
    return weatherData.history.time.slice(-timeRange).map((date, idx) => {
      const realIdx = weatherData.history.time.length - timeRange + idx;
      const temp = weatherData.history.temperature_2m_mean?.[realIdx] || 0;
      const precipitation = weatherData.history.precipitation_sum?.[realIdx] || 0;
      const weatherCode = weatherData.history.weathercode?.[realIdx] || 0;
      const sales = salesByDate[date] || 0;
      const weatherType = getWeatherType(weatherCode, precipitation);
      
      return {
        date: format(parseISO(date), 'dd', { locale: es }),
        fullDate: format(parseISO(date), "EEE dd MMM", { locale: es }),
        dateStr: date,
        temperature: Math.round(temp * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        sales,
        weatherType,
        weatherColor: weatherType === 'sunny' ? '#f59e0b' : weatherType === 'rainy' ? '#3b82f6' : '#9ca3af'
      };
    });
  }, [weatherData, dailySales, timeRange]);

  // Estadísticas
  const stats = useMemo(() => {
    if (!chartData.length) return null;
    
    const withSales = chartData.filter(d => d.sales > 0);
    const sunny = withSales.filter(d => d.weatherType === 'sunny');
    const rainy = withSales.filter(d => d.weatherType === 'rainy');
    const cloudy = withSales.filter(d => d.weatherType === 'cloudy');
    
    const avgTotal = withSales.reduce((sum, d) => sum + d.sales, 0) / Math.max(withSales.length, 1);
    const avgSunny = sunny.reduce((sum, d) => sum + d.sales, 0) / Math.max(sunny.length, 1);
    const avgRainy = rainy.reduce((sum, d) => sum + d.sales, 0) / Math.max(rainy.length, 1);
    const avgCloudy = cloudy.reduce((sum, d) => sum + d.sales, 0) / Math.max(cloudy.length, 1);
    
    const bestDay = withSales.reduce((best, d) => d.sales > (best?.sales || 0) ? d : best, null);
    const worstDay = withSales.reduce((worst, d) => d.sales < (worst?.sales || Infinity) ? d : worst, null);
    
    return {
      avgTotal,
      avgSunny,
      avgRainy,
      avgCloudy,
      sunnyCount: sunny.length,
      rainyCount: rainy.length,
      cloudyCount: cloudy.length,
      sunnyImpact: avgTotal > 0 ? ((avgSunny - avgTotal) / avgTotal * 100) : 0,
      rainyImpact: avgTotal > 0 ? ((avgRainy - avgTotal) / avgTotal * 100) : 0,
      bestDay,
      worstDay
    };
  }, [chartData]);

  if (!chartData.length) {
    return (
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos de clima disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con controles dinámicos */}
      <Card className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 border-0 shadow-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-3 bg-white/20 rounded-2xl"
              >
                <Thermometer className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">Impacto del Clima en Ventas</h2>
                <p className="text-white/70 text-sm">Análisis de los últimos {timeRange} días</p>
              </div>
            </div>
            
            {/* Botones de tiempo */}
            <div className="flex gap-2">
              {[7, 14, 30].map(days => (
                <motion.button
                  key={days}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeRange(days)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    timeRange === days 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {days}D
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Botones de vista */}
          <div className="flex flex-wrap gap-2 mt-4">
            <ViewButton 
              active={viewMode === 'bars'} 
              onClick={() => setViewMode('bars')}
              icon={BarChart3}
              label="Barras"
              color="from-violet-500 to-purple-500"
            />
            <ViewButton 
              active={viewMode === 'trend'} 
              onClick={() => setViewMode('trend')}
              icon={Activity}
              label="Tendencia"
              color="from-emerald-500 to-teal-500"
            />
            <ViewButton 
              active={viewMode === 'comparison'} 
              onClick={() => setViewMode('comparison')}
              icon={Zap}
              label="Comparativo"
              color="from-amber-500 to-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            icon={Sun} 
            label="Días Soleados" 
            value={stats.sunnyCount}
            subvalue={stats.avgSunny > 0 ? formatCurrency(stats.avgSunny) : 'Sin datos'}
            color="from-amber-400 to-orange-400"
            trend={stats.sunnyImpact}
          />
          <StatCard 
            icon={CloudRain} 
            label="Días Lluviosos" 
            value={stats.rainyCount}
            subvalue={stats.avgRainy > 0 ? formatCurrency(stats.avgRainy) : 'Sin datos'}
            color="from-blue-400 to-cyan-400"
            trend={stats.rainyImpact}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Mejor Día" 
            value={stats.bestDay ? formatCurrency(stats.bestDay.sales) : '-'}
            subvalue={stats.bestDay?.fullDate}
            color="from-emerald-400 to-green-400"
          />
          <StatCard 
            icon={TrendingDown} 
            label="Menor Día" 
            value={stats.worstDay ? formatCurrency(stats.worstDay.sales) : '-'}
            subvalue={stats.worstDay?.fullDate}
            color="from-rose-400 to-red-400"
          />
        </div>
      )}

      {/* Gráfica principal */}
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="salesGradientWeather" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="tempGradientWeather" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
                <YAxis 
                  yAxisId="sales"
                  orientation="left"
                  tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10, fill: '#666' }}
                  width={65}
                />
                <YAxis 
                  yAxisId="temp"
                  orientation="right"
                  domain={[10, 25]}
                  tickFormatter={(v) => `${v}°C`}
                  tick={{ fontSize: 10, fill: '#f97316' }}
                  width={45}
                />
                
                {stats && (
                  <ReferenceLine 
                    yAxisId="sales" 
                    y={stats.avgTotal} 
                    stroke="#9ca3af" 
                    strokeDasharray="8 4"
                    strokeWidth={2}
                  />
                )}
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl border-2 border-gray-100 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <WeatherIcon type={data?.weatherType} size="sm" />
                          <span className="font-bold capitalize">{data?.fullDate}</span>
                        </div>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">💰 Venta:</span>
                          <span className="font-bold">{formatCurrency(data?.sales)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">🌡️ Temp:</span>
                          <span className="font-bold text-orange-500">{data?.temperature}°C</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">🌧️ Lluvia:</span>
                          <span className="font-bold">{data?.precipitation}mm</span>
                        </p>
                      </motion.div>
                    );
                  }}
                />
                
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                
                {viewMode === 'bars' && (
                  <Bar 
                    yAxisId="sales"
                    dataKey="sales" 
                    name="Ventas"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.weatherColor} opacity={0.8} />
                    ))}
                  </Bar>
                )}
                
                {viewMode === 'trend' && (
                  <Area 
                    yAxisId="sales"
                    type="monotone" 
                    dataKey="sales" 
                    name="Ventas"
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fill="url(#salesGradientWeather)"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                )}
                
                {viewMode === 'comparison' && (
                  <>
                    <Bar 
                      yAxisId="sales"
                      dataKey="sales" 
                      name="Ventas"
                      radius={[6, 6, 0, 0]}
                      fill="#8b5cf6"
                      opacity={0.7}
                    />
                    <Area 
                      yAxisId="temp"
                      type="monotone" 
                      dataKey="temperature" 
                      name="Temperatura"
                      stroke="#f97316" 
                      strokeWidth={2}
                      fill="url(#tempGradientWeather)"
                      dot={false}
                    />
                  </>
                )}
                
                <Line 
                  yAxisId="temp"
                  type="monotone" 
                  dataKey="temperature" 
                  name="Temperatura °C"
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 3, strokeWidth: 2, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda visual */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-amber-500 shadow flex items-center justify-center">
                <Sun className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">Soleado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-gray-400 shadow flex items-center justify-center">
                <Cloud className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">Nublado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-blue-500 shadow flex items-center justify-center">
                <CloudRain className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">Lluvioso</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-1 bg-gradient-to-r from-orange-300 to-orange-500 rounded" />
              <span className="text-gray-600">Temperatura</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}