import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Cloud, Thermometer, TrendingUp, TrendingDown, Loader2, Info, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Lógica mejorada para determinar tipo de clima basada en código WMO
const getWeatherType = (code, precipitation) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  // 0: Clear sky
  // 1: Mainly clear
  // 2: Partly cloudy
  // 3: Overcast
  // 45, 48: Fog
  // 51-57: Drizzle (light to freezing)
  // 61-67: Rain (slight to freezing)
  // 71-77: Snow
  // 80-82: Rain showers
  // 85-86: Snow showers
  // 95-99: Thunderstorm
  
  // Primero evaluar por código de clima (más preciso)
  if (code === 0) return 'sunny'; // Cielo despejado
  if (code === 1) return 'sunny'; // Mayormente despejado
  if (code === 2) return 'cloudy'; // Parcialmente nublado
  if (code === 3) return 'cloudy'; // Nublado/Cubierto
  if (code === 45 || code === 48) return 'cloudy'; // Niebla
  
  // Códigos de precipitación (51+)
  if (code >= 51 && code <= 57) return 'rainy'; // Llovizna
  if (code >= 61 && code <= 67) return 'rainy'; // Lluvia
  if (code >= 71 && code <= 77) return 'rainy'; // Nieve (poco probable en Bogotá)
  if (code >= 80 && code <= 82) return 'rainy'; // Chubascos
  if (code >= 85 && code <= 86) return 'rainy'; // Chubascos de nieve
  if (code >= 95 && code <= 99) return 'rainy'; // Tormenta
  
  // Fallback basado en precipitación real (mm)
  if (precipitation > 5) return 'rainy'; // Más de 5mm = lluvia significativa
  if (precipitation > 1) return 'cloudy'; // 1-5mm = probablemente nublado con algo de lluvia
  
  return 'sunny'; // Por defecto si no hay código ni precipitación
};

const getWeatherEmoji = (type) => {
  switch(type) {
    case 'sunny': return '☀️';
    case 'rainy': return '🌧️';
    default: return '⛅';
  }
};

const getWeatherLabel = (type) => {
  switch(type) {
    case 'sunny': return 'Soleado';
    case 'rainy': return 'Lluvioso';
    default: return 'Nublado';
  }
};

const getWeatherColor = (type) => {
  switch(type) {
    case 'sunny': return '#f59e0b';
    case 'rainy': return '#3b82f6';
    default: return '#9ca3af';
  }
};

// Animated bar component
const AnimatedBar = (props) => {
  const { x, y, width, height, fill } = props;
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      initial={{ height: 0, y: y + height }}
      animate={{ height, y }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      rx={4}
    />
  );
};

export default function WeatherMainChart({ weatherData, dailySales = [], dateRange, loading, formatCurrency }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Combinar datos de clima y ventas con lógica mejorada
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    // Calcular promedio para comparar
    const validSales = dailySales.filter(s => s.total_sales > 0);
    const avgSales = validSales.length > 0 
      ? validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0) / validSales.length 
      : 0;
    
    return weatherData.history.time.map((date, idx) => {
      const temp = weatherData.history.temperature_2m_mean?.[idx] || 0;
      const tempMax = weatherData.history.temperature_2m_max?.[idx] || 0;
      const tempMin = weatherData.history.temperature_2m_min?.[idx] || 0;
      const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
      const weatherCode = weatherData.history.weathercode?.[idx] || 0;
      const sales = salesByDate[date] || 0;
      const weatherType = getWeatherType(weatherCode, precipitation);
      
      // Calcular impacto vs promedio
      const impact = sales > 0 && avgSales > 0 ? sales - avgSales : 0;
      const impactPct = avgSales > 0 ? ((sales - avgSales) / avgSales * 100) : 0;
      
      return {
        date: format(parseISO(date), 'dd', { locale: es }),
        fullDate: format(parseISO(date), "EEEE dd 'de' MMMM", { locale: es }),
        shortDate: format(parseISO(date), 'dd MMM', { locale: es }),
        dayName: format(parseISO(date), 'EEE', { locale: es }),
        dateStr: date,
        temperature: Math.round(temp * 10) / 10,
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        weatherCode,
        sales,
        avgSales,
        weatherType,
        weatherEmoji: getWeatherEmoji(weatherType),
        weatherLabel: getWeatherLabel(weatherType),
        weatherColor: getWeatherColor(weatherType),
        impact,
        impactPct: Math.round(impactPct * 10) / 10
      };
    });
  }, [weatherData, dailySales]);

  // Estadísticas del período
  const periodStats = useMemo(() => {
    if (!chartData.length) return null;
    
    const withSales = chartData.filter(d => d.sales > 0);
    const sunnyDays = chartData.filter(d => d.weatherType === 'sunny');
    const rainyDays = chartData.filter(d => d.weatherType === 'rainy');
    const cloudyDays = chartData.filter(d => d.weatherType === 'cloudy');
    
    const avgSalesSunny = sunnyDays.filter(d => d.sales > 0).reduce((sum, d) => sum + d.sales, 0) / Math.max(sunnyDays.filter(d => d.sales > 0).length, 1);
    const avgSalesRainy = rainyDays.filter(d => d.sales > 0).reduce((sum, d) => sum + d.sales, 0) / Math.max(rainyDays.filter(d => d.sales > 0).length, 1);
    const avgSalesCloudy = cloudyDays.filter(d => d.sales > 0).reduce((sum, d) => sum + d.sales, 0) / Math.max(cloudyDays.filter(d => d.sales > 0).length, 1);
    
    const totalAvg = withSales.reduce((sum, d) => sum + d.sales, 0) / Math.max(withSales.length, 1);
    
    return {
      totalDays: chartData.length,
      sunnyCount: sunnyDays.length,
      rainyCount: rainyDays.length,
      cloudyCount: cloudyDays.length,
      avgSalesSunny,
      avgSalesRainy,
      avgSalesCloudy,
      totalAvg,
      sunnyImpact: totalAvg > 0 ? ((avgSalesSunny - totalAvg) / totalAvg * 100) : 0,
      rainyImpact: totalAvg > 0 ? ((avgSalesRainy - totalAvg) / totalAvg * 100) : 0
    };
  }, [chartData]);

  // Estadísticas del día seleccionado
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return chartData.find(d => d.dateStr === selectedDay);
  }, [selectedDay, chartData]);

  if (loading) {
    return (
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-sky-500" />
          </motion.div>
          <p className="text-gray-500 mt-4">Cargando datos del clima...</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos disponibles para este período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Chart Card */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <motion.div 
              animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }} 
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Thermometer className="w-5 h-5" />
            </motion.div>
            Ventas vs Clima - Análisis Diario
          </CardTitle>
          <p className="text-white/80 text-xs mt-1">
            Haz clic en una barra para ver el detalle • {chartData.length} días analizados
          </p>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Period Summary Mini Cards */}
          {periodStats && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-3 border border-amber-200"
              >
                <div className="flex items-center gap-2">
                  <motion.span 
                    className="text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    ☀️
                  </motion.span>
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Soleados</p>
                    <p className="text-xl font-bold text-amber-800">{periodStats.sunnyCount}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-3 border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <motion.span 
                    className="text-2xl"
                    animate={{ x: [-2, 2, -2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ⛅
                  </motion.span>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Nublados</p>
                    <p className="text-xl font-bold text-gray-800">{periodStats.cloudyCount}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl p-3 border border-blue-200"
              >
                <div className="flex items-center gap-2">
                  <motion.span 
                    className="text-2xl"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🌧️
                  </motion.span>
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Lluviosos</p>
                    <p className="text-xl font-bold text-blue-800">{periodStats.rainyCount}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-3 border border-violet-200"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar className="w-6 h-6 text-violet-500" />
                  </motion.div>
                  <div>
                    <p className="text-xs text-violet-700 font-medium">Total días</p>
                    <p className="text-xl font-bold text-violet-800">{periodStats.totalDays}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Selected Day Detail */}
          <AnimatePresence>
            {selectedDayInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <motion.span 
                        className="text-5xl"
                        animate={{ scale: [1, 1.1, 1], rotate: selectedDayInfo.weatherType === 'sunny' ? [0, 10, -10, 0] : [0, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {selectedDayInfo.weatherEmoji}
                      </motion.span>
                      <div>
                        <h4 className="text-xl font-bold capitalize">{selectedDayInfo.fullDate}</h4>
                        <p className="text-white/60 text-sm">
                          {selectedDayInfo.weatherLabel} • {selectedDayInfo.tempMin}°C - {selectedDayInfo.tempMax}°C • Lluvia: {selectedDayInfo.precipitation}mm
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="text-white/60 hover:text-white text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                      <p className="text-white/60 text-xs mb-1">💰 Venta del Día</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedDayInfo.sales)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                      <p className="text-white/60 text-xs mb-1">📊 Promedio Período</p>
                      <p className="text-xl font-semibold text-white/80">{formatCurrency(selectedDayInfo.avgSales)}</p>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${selectedDayInfo.impact >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      <p className="text-white/60 text-xs mb-1">
                        {selectedDayInfo.impact >= 0 ? '📈 Vendí de más' : '📉 Dejé de vender'}
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedDayInfo.impact >= 0 ? '+' : ''}{formatCurrency(selectedDayInfo.impact)}
                      </p>
                      <p className="text-xs text-white/60">
                        ({selectedDayInfo.impactPct >= 0 ? '+' : ''}{selectedDayInfo.impactPct}%)
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData}
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload?.dateStr) {
                    setSelectedDay(prev => prev === e.activePayload[0].payload.dateStr ? null : e.activePayload[0].payload.dateStr);
                  }
                }}
              >
                <defs>
                  <linearGradient id="tempGradientMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="dayName" 
                  tick={{ fontSize: 10, fill: '#666' }}
                  interval={0}
                />
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
                  domain={[8, 28]}
                  tickFormatter={(v) => `${v}°C`}
                  tick={{ fontSize: 10, fill: '#f97316' }}
                  width={50}
                />
                
                {/* Reference line for average */}
                <ReferenceLine 
                  yAxisId="sales" 
                  y={chartData[0]?.avgSales || 0} 
                  stroke="#9ca3af" 
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{ value: 'Promedio', fontSize: 10, fill: '#9ca3af', position: 'insideTopLeft' }}
                />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl border-2 border-gray-100 text-sm min-w-[220px]"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                          <span className="text-3xl">{data?.weatherEmoji}</span>
                          <div>
                            <p className="font-bold text-gray-800 capitalize">{data?.fullDate}</p>
                            <p className="text-xs text-gray-500">{data?.weatherLabel} • {data?.tempMin}°C - {data?.tempMax}°C</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="flex justify-between">
                            <span className="text-gray-500">💰 Venta:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(data?.sales)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">🌡️ Temp media:</span>
                            <span className="font-bold text-orange-500">{data?.temperature}°C</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">🌧️ Precipitación:</span>
                            <span className="font-semibold">{data?.precipitation}mm</span>
                          </p>
                          <hr className="my-2" />
                          <p className={`flex justify-between font-bold ${data?.impact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{data?.impact >= 0 ? '📈 Ganancia:' : '📉 Pérdida:'}</span>
                            <span>{data?.impact >= 0 ? '+' : ''}{formatCurrency(data?.impact)}</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  }}
                />
                
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
                
                {/* Sales bars */}
                <Bar 
                  yAxisId="sales"
                  dataKey="sales" 
                  name="Ventas del día"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  shape={<AnimatedBar />}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.weatherColor}
                      opacity={selectedDay === entry.dateStr ? 1 : 0.75}
                      stroke={selectedDay === entry.dateStr ? '#1f2937' : 'none'}
                      strokeWidth={selectedDay === entry.dateStr ? 2 : 0}
                    />
                  ))}
                </Bar>
                
                {/* Temperature area */}
                <Area 
                  yAxisId="temp"
                  type="monotone" 
                  dataKey="temperature" 
                  name="Temperatura °C"
                  stroke="#f97316" 
                  strokeWidth={3}
                  fill="url(#tempGradientMain)"
                  dot={{ fill: '#f97316', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#ea580c' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend explicativo */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-amber-500 shadow" />
              <span className="text-gray-600">☀️ Día Soleado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-gray-400 shadow" />
              <span className="text-gray-600">⛅ Día Nublado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded bg-blue-500 shadow" />
              <span className="text-gray-600">🌧️ Día Lluvioso</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-1 bg-gradient-to-r from-orange-300 to-orange-500 rounded" />
              <span className="text-gray-600">🌡️ Temperatura</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-8 h-0.5 bg-gray-400 rounded border-dashed border border-gray-400" />
              <span className="text-gray-600">📊 Promedio</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary Card */}
      {periodStats && (
        <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl border-0">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Zap className="w-5 h-5" />
              </motion.div>
              Resumen del Análisis - {chartData.length} días
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">☀️</span>
                  <span className="font-medium">Días Soleados ({periodStats.sunnyCount})</span>
                </div>
                <p className="text-2xl font-bold mb-1">
                  {periodStats.avgSalesSunny > 0 ? formatCurrency(periodStats.avgSalesSunny) : 'Sin datos'}
                </p>
                {periodStats.avgSalesSunny > 0 && (
                  <p className={`text-sm ${periodStats.sunnyImpact >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {periodStats.sunnyImpact >= 0 ? '↑' : '↓'} {Math.abs(periodStats.sunnyImpact).toFixed(1)}% vs promedio
                  </p>
                )}
              </div>
              
              <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌧️</span>
                  <span className="font-medium">Días Lluviosos ({periodStats.rainyCount})</span>
                </div>
                <p className="text-2xl font-bold mb-1">
                  {periodStats.avgSalesRainy > 0 ? formatCurrency(periodStats.avgSalesRainy) : 'Sin datos'}
                </p>
                {periodStats.avgSalesRainy > 0 && (
                  <p className={`text-sm ${periodStats.rainyImpact >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {periodStats.rainyImpact >= 0 ? '↑' : '↓'} {Math.abs(periodStats.rainyImpact).toFixed(1)}% vs promedio
                  </p>
                )}
              </div>
              
              <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium">Promedio General</span>
                </div>
                <p className="text-2xl font-bold mb-1">{formatCurrency(periodStats.totalAvg)}</p>
                <p className="text-sm text-white/70">Base de comparación</p>
              </div>
            </div>
            
            {/* Insight final */}
            <div className="mt-4 bg-white/10 rounded-xl p-4">
              <p className="text-sm">
                💡 <strong>Conclusión:</strong> {' '}
                {periodStats.sunnyCount > periodStats.rainyCount 
                  ? `El período fue mayormente soleado (${periodStats.sunnyCount} días). ${periodStats.sunnyImpact > 5 ? 'El buen clima favoreció las ventas.' : 'Las ventas se mantuvieron estables.'}`
                  : periodStats.rainyCount > periodStats.sunnyCount 
                    ? `El período tuvo muchos días lluviosos (${periodStats.rainyCount} días). ${periodStats.rainyImpact < -5 ? 'Esto afectó negativamente las ventas.' : 'A pesar de la lluvia, las ventas se mantuvieron.'}`
                    : `El período tuvo un clima mixto. Las ventas se comportaron de manera variable según las condiciones del día.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}