import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, CloudRain, Thermometer, CloudSun, HelpCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { format, eachDayOfInterval, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de clima por tipo
const WEATHER_CONFIG = {
  sunny: { icon: Sun, color: '#fbbf24', bgColor: 'from-amber-50 to-yellow-100', label: 'Soleado', impact: '+18%' },
  hot: { icon: Thermometer, color: '#ef4444', bgColor: 'from-red-50 to-orange-100', label: 'Caluroso', impact: '+25%' },
  cloudy: { icon: Cloud, color: '#9ca3af', bgColor: 'from-gray-50 to-slate-100', label: 'Nublado', impact: '-5%' },
  partlyCloudy: { icon: CloudSun, color: '#60a5fa', bgColor: 'from-blue-50 to-sky-100', label: 'Parcial', impact: '+5%' },
  rainy: { icon: CloudRain, color: '#3b82f6', bgColor: 'from-blue-100 to-indigo-100', label: 'Lluvioso', impact: '-20%' },
};

// Explicaciones de cada vista
const VIEW_EXPLANATIONS = {
  correlation: {
    title: '📊 Correlación Temperatura vs Ventas',
    description: 'Cada punto representa un día. El eje X muestra la temperatura y el eje Y las ventas. Los colores indican el tipo de clima. Puntos arriba a la derecha = días calurosos con altas ventas.',
    tip: 'Busca patrones: ¿Los puntos amarillos (soleados) tienden a estar más arriba?'
  },
  trend: {
    title: '📈 Tendencia de Ventas y Clima',
    description: 'El área púrpura muestra las ventas diarias. La línea rosa muestra el impacto del clima (%). Valores positivos = el clima ayudó a vender más.',
    tip: 'Identifica qué días el clima afectó más las ventas.'
  },
  compare: {
    title: '📊 Comparativo por Tipo de Clima',
    description: 'Muestra el impacto promedio en ventas para cada tipo de clima. Barras verdes = impacto positivo. Barras rojas = impacto negativo.',
    tip: 'Usa esto para planificar promociones según pronóstico del clima.'
  }
};

// Simular datos de clima realistas para Bogotá
const generateWeatherData = (salesData, dateRange) => {
  const monthPatterns = {
    dry: { sunny: 0.35, hot: 0.15, partlyCloudy: 0.30, cloudy: 0.15, rainy: 0.05 },
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

  // Generar días del rango
  const days = dateRange?.from && dateRange?.to 
    ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
    : salesData.map((_, i) => subDays(new Date(), salesData.length - 1 - i));

  return days.map((day, i) => {
    const month = day.getMonth();
    const isDrySeason = [0, 1, 5, 6, 7, 11].includes(month);
    const patterns = isDrySeason ? monthPatterns.dry : monthPatterns.wet;
    
    const weather = getWeatherType(patterns);
    
    const baseTempByWeather = { hot: 24, sunny: 21, partlyCloudy: 18, cloudy: 16, rainy: 14 };
    const baseTemp = baseTempByWeather[weather] || 17;
    const temperature = baseTemp + (Math.random() - 0.5) * 3;
    
    const weatherImpacts = { sunny: 18, hot: 28, partlyCloudy: 8, cloudy: -8, rainy: -22 };
    const tempBonus = Math.max(0, (temperature - 18) * 2);
    
    const baseImpact = weatherImpacts[weather] || 0;
    const weatherImpact = baseImpact + tempBonus + (Math.random() - 0.5) * 5;
    
    const humidityByWeather = { rainy: 85, cloudy: 75, partlyCloudy: 65, sunny: 55, hot: 45 };
    const humidity = (humidityByWeather[weather] || 65) + (Math.random() - 0.5) * 10;

    const baseSales = salesData[i]?.sales || Math.random() * 2000000 + 500000;

    return {
      date: format(day, 'dd', { locale: es }),
      fullDate: format(day, 'EEEE dd MMM', { locale: es }),
      dayOfWeek: format(day, 'EEEE', { locale: es }),
      dateObj: day,
      sales: baseSales,
      weather,
      weatherImpact: Math.round(weatherImpact * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
    };
  });
};

const WeatherIcon = ({ type, size = 16, className = '' }) => {
  const config = WEATHER_CONFIG[type] || WEATHER_CONFIG.cloudy;
  const Icon = config.icon;
  return <Icon className={className} style={{ color: config.color, width: size, height: size }} />;
};

// Tooltip de ayuda
const HelpTooltip = ({ viewType }) => {
  const [open, setOpen] = useState(false);
  const explanation = VIEW_EXPLANATIONS[viewType];
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-sky-100">
          <HelpCircle className="w-4 h-4 text-sky-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <h4 className="font-bold text-sm text-gray-800 mb-2">{explanation.title}</h4>
        <p className="text-xs text-gray-600 mb-2">{explanation.description}</p>
        <p className="text-xs text-sky-600 bg-sky-50 p-2 rounded-lg">💡 {explanation.tip}</p>
      </PopoverContent>
    </Popover>
  );
};

export default function WeatherImpactChart({ dailyTrend = [], formatCurrency, dateRange: externalDateRange }) {
  const [viewType, setViewType] = useState('trend');
  const [dateRange, setDateRange] = useState({
    from: externalDateRange?.from || subWeeks(new Date(), 2),
    to: externalDateRange?.to || new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState(null);
  
  const weatherData = useMemo(() => {
    return generateWeatherData(dailyTrend, dateRange);
  }, [dailyTrend, dateRange]);

  // Estadísticas por tipo de clima
  const weatherStats = useMemo(() => {
    const grouped = {};
    weatherData.forEach(d => {
      if (!grouped[d.weather]) {
        grouped[d.weather] = { sales: [], impacts: [], temps: [], days: [] };
      }
      grouped[d.weather].sales.push(d.sales || 0);
      grouped[d.weather].impacts.push(d.weatherImpact);
      grouped[d.weather].temps.push(d.temperature);
      grouped[d.weather].days.push(d.dayOfWeek);
    });
    
    return Object.entries(grouped).map(([type, data]) => ({
      type,
      config: WEATHER_CONFIG[type],
      avgSales: data.sales.length ? data.sales.reduce((a, b) => a + b, 0) / data.sales.length : 0,
      avgImpact: data.impacts.length ? data.impacts.reduce((a, b) => a + b, 0) / data.impacts.length : 0,
      avgTemp: data.temps.length ? data.temps.reduce((a, b) => a + b, 0) / data.temps.length : 0,
      count: data.sales.length,
      topDay: data.days.sort((a, b) => data.days.filter(v => v === a).length - data.days.filter(v => v === b).length).pop()
    })).sort((a, b) => b.avgImpact - a.avgImpact);
  }, [weatherData]);

  // Correlación temperatura vs ventas
  const correlationData = useMemo(() => {
    return weatherData.map(d => ({
      temperature: d.temperature,
      sales: d.sales,
      weather: d.weather,
      date: d.date,
      fullDate: d.fullDate,
      dayOfWeek: d.dayOfWeek
    }));
  }, [weatherData]);

  // Datos filtrados por clima seleccionado
  const filteredByWeather = useMemo(() => {
    if (!selectedWeather) return weatherData;
    return weatherData.filter(d => d.weather === selectedWeather);
  }, [weatherData, selectedWeather]);

  // Stats del clima seleccionado
  const selectedWeatherStats = useMemo(() => {
    if (!selectedWeather) return null;
    const stat = weatherStats.find(s => s.type === selectedWeather);
    const days = filteredByWeather;
    const totalSales = days.reduce((sum, d) => sum + (d.sales || 0), 0);
    const bestDay = days.reduce((best, d) => (d.sales || 0) > (best?.sales || 0) ? d : best, days[0]);
    const worstDay = days.reduce((worst, d) => (d.sales || 0) < (worst?.sales || 0) ? d : worst, days[0]);
    
    return {
      ...stat,
      totalSales,
      bestDay,
      worstDay,
      days
    };
  }, [selectedWeather, weatherStats, filteredByWeather]);

  // Mejor y peor día
  const bestDay = weatherStats[0];
  const worstDay = weatherStats[weatherStats.length - 1];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Cloud className="w-4 h-4 text-sky-500" />
            </motion.div>
            Impacto del Clima en Ventas
            <HelpTooltip viewType={viewType} />
          </CardTitle>
          <div className="flex gap-2 items-center">
            {/* Calendar Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-white/80">
                  <CalendarIcon className="w-3 h-3" />
                  {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to || range.from });
                    }
                  }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>

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
        {/* Stats Cards - Clickeables */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(WEATHER_CONFIG).map(([key, config]) => {
            const stat = weatherStats.find(s => s.type === key);
            const Icon = config.icon;
            const isTop = stat?.type === bestDay?.type;
            const isWorst = stat?.type === worstDay?.type;
            const isSelected = selectedWeather === key;
            
            return (
              <motion.div
                key={key}
                onClick={() => setSelectedWeather(isSelected ? null : key)}
                whileHover={{ scale: 1.08, y: -4, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                animate={isTop && !selectedWeather ? { 
                  boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 20px 4px rgba(34, 197, 94, 0.3)', '0 0 0 0 rgba(34, 197, 94, 0)'] 
                } : {}}
                transition={isTop ? { duration: 2, repeat: Infinity } : { type: "spring", stiffness: 400 }}
                className={`bg-gradient-to-br ${config.bgColor} rounded-xl p-2 text-center border-2 cursor-pointer relative overflow-hidden ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg' :
                  isTop ? 'border-green-400 ring-2 ring-green-200' : 
                  isWorst ? 'border-red-300' : 'border-transparent'
                }`}
              >
                {isTop && !selectedWeather && (
                  <motion.div 
                    className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    TOP
                  </motion.div>
                )}
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-bold"
                  >
                    VER
                  </motion.div>
                )}
                <motion.div
                  animate={isSelected ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] } : isTop ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: isSelected ? 0.5 : 2, repeat: isSelected ? 0 : Infinity }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-1" style={{ color: config.color }} />
                </motion.div>
                <p className="text-[10px] text-gray-600 font-medium">{config.label}</p>
                <motion.p 
                  className={`text-sm font-bold ${stat?.avgImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}
                  animate={isTop ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {stat?.avgImpact >= 0 ? '+' : ''}{stat?.avgImpact?.toFixed(0) || 0}%
                </motion.p>
                <p className="text-[9px] text-gray-400">{stat?.count || 0} días</p>
              </motion.div>
            );
          })}
        </div>



        {/* Header del clima seleccionado */}
        <AnimatePresence>
          {selectedWeather && selectedWeatherStats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-3 bg-gradient-to-r ${WEATHER_CONFIG[selectedWeather].bgColor} rounded-xl p-3 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WeatherIcon type={selectedWeather} size={20} />
                  <span className="font-bold text-gray-800 text-sm">{WEATHER_CONFIG[selectedWeather].label}</span>
                  <span className="text-xs text-gray-500">• {selectedWeatherStats.count} días</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-bold ${selectedWeatherStats.avgImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    Impacto: {selectedWeatherStats.avgImpact >= 0 ? '+' : ''}{selectedWeatherStats.avgImpact?.toFixed(1)}%
                  </span>
                  <span className="text-gray-600">Temp: {selectedWeatherStats.avgTemp?.toFixed(1)}°C</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedWeather(null)}
                    className="h-5 w-5 p-0 rounded-full text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  label={{ value: 'Temperatura °C', position: 'bottom', fontSize: 9, fill: '#888' }}
                />
                <YAxis 
                  dataKey="sales" 
                  type="number" 
                  name="Ventas" 
                  tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Ventas', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#888' }}
                />
                <ZAxis range={[50, 200]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <WeatherIcon type={data.weather} size={18} />
                          <div>
                            <span className="font-bold text-gray-800">{WEATHER_CONFIG[data.weather]?.label}</span>
                            <p className="text-gray-400 text-[10px] capitalize">{data.fullDate}</p>
                          </div>
                        </div>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">🌡️ Temperatura:</span>
                          <span className="font-bold">{data.temperature}°C</span>
                        </p>
                        <p className="flex justify-between gap-4 mt-1">
                          <span className="text-gray-500">💰 Ventas:</span>
                          <span className="font-bold text-green-600">{formatCurrency?.(data.sales) || data.sales}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Scatter 
                  data={selectedWeather ? filteredByWeather : correlationData} 
                  fill="#ec4899"
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const config = WEATHER_CONFIG[payload.weather];
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={7} 
                        fill={config?.color || '#ec4899'} 
                        opacity={0.8}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {viewType === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={selectedWeather ? filteredByWeather : weatherData}>
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
                      <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <WeatherIcon type={data.weather} size={18} />
                          <div>
                            <span className="font-bold text-gray-800 capitalize">{data.fullDate}</span>
                            <p className="text-gray-400 text-[10px]">{WEATHER_CONFIG[data.weather]?.label} • {data.temperature}°C</p>
                          </div>
                        </div>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">💰 Ventas:</span>
                          <span className="font-bold">{formatCurrency?.(data.sales) || data.sales}</span>
                        </p>
                        <p className={`flex justify-between gap-4 mt-1 ${data.weatherImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          <span className="text-gray-500">📊 Impacto:</span>
                          <span className="font-bold">{data.weatherImpact >= 0 ? '+' : ''}{data.weatherImpact.toFixed(1)}%</span>
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

          {/* Leyenda de líneas del gráfico de tendencia */}
          {viewType === 'trend' && (
            <div className="mt-2 flex justify-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-2 rounded-sm bg-indigo-400/50" />
                <span className="text-gray-600">Área morada = <strong>Ventas del día</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-0.5 bg-pink-400 rounded" />
                <span className="text-gray-600">Línea rosa = <strong>Impacto del clima (%)</strong></span>
              </div>
            </div>
          )}

          {viewType === 'compare' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={selectedWeather ? weatherStats.filter(s => s.type === selectedWeather) : weatherStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[-30, 35]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  width={70} 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => WEATHER_CONFIG[v]?.label || v}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <WeatherIcon type={data.type} size={18} />
                          <span className="font-bold text-gray-800">{data.config?.label}</span>
                        </div>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-500">Impacto promedio:</span>
                          <span className={`font-bold ${data.avgImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {data.avgImpact >= 0 ? '+' : ''}{data.avgImpact.toFixed(1)}%
                          </span>
                        </p>
                        <p className="flex justify-between gap-4 mt-1">
                          <span className="text-gray-500">Días registrados:</span>
                          <span className="font-bold">{data.count}</span>
                        </p>
                        <p className="flex justify-between gap-4 mt-1">
                          <span className="text-gray-500">Temp. promedio:</span>
                          <span className="font-bold">{data.avgTemp?.toFixed(1)}°C</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="avgImpact" 
                  radius={[0, 4, 4, 0]} 
                  barSize={20}
                >
                  {weatherStats.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={entry.avgImpact >= 0 ? '#86efac' : '#fca5a5'} 
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leyenda de colores con significado */}
        <div className="mt-3 p-2 bg-gray-50 rounded-xl">
          <p className="text-[10px] text-gray-500 text-center mb-2 font-medium">¿Qué significa cada color?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(WEATHER_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const stat = weatherStats.find(s => s.type === key);
              const impactText = stat?.avgImpact >= 0 
                ? `↑ Aumenta ventas ${stat?.avgImpact?.toFixed(0)}%` 
                : `↓ Reduce ventas ${Math.abs(stat?.avgImpact || 0)?.toFixed(0)}%`;
              return (
                <div 
                  key={key} 
                  className="flex items-center gap-1.5 text-[10px] bg-white px-2 py-1.5 rounded-lg border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{config.label}</span>
                    <span className={`text-[8px] ${stat?.avgImpact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {impactText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight dinámico */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-3 border border-sky-100"
        >
          <p className="text-xs text-sky-800">
            <span className="font-bold">💡 Insight:</span> Los días <span className="font-bold">{bestDay?.config?.label?.toLowerCase() || 'calurosos'}</span> 
            {' '}aumentan las ventas un <span className="font-bold text-green-600">+{Math.abs(bestDay?.avgImpact || 20).toFixed(0)}%</span> en promedio,
            mientras que los días <span className="font-bold">{worstDay?.config?.label?.toLowerCase() || 'lluviosos'}</span> las reducen 
            {' '}<span className="font-bold text-red-500">{worstDay?.avgImpact?.toFixed(0) || -15}%</span>.
            {bestDay?.count > 0 && ` (${bestDay.count} días ${bestDay?.config?.label?.toLowerCase()} registrados)`}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}