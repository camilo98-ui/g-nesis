import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, Sun, Cloud, Thermometer, TrendingUp, TrendingDown, 
  Zap, Calendar as CalendarIcon, BarChart3, Activity, X, Check, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Area
} from 'recharts';
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// Custom Calendar Component
function WeatherCalendar({ selected, onSelect, onApply }) {
  const [currentMonth, setCurrentMonth] = useState(selected?.from || new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [tempSelection, setTempSelection] = useState(selected);

  const months = useMemo(() => [currentMonth, addMonths(currentMonth, 1)], [currentMonth]);

  const handleDayClick = (day) => {
    if (!tempSelection?.from || (tempSelection.from && tempSelection.to && !selectingEnd) || !selectingEnd) {
      setTempSelection({ from: day, to: day });
      setSelectingEnd(true);
    } else {
      if (day < tempSelection.from) {
        setTempSelection({ from: day, to: tempSelection.from });
      } else {
        setTempSelection({ from: tempSelection.from, to: day });
      }
      setSelectingEnd(false);
    }
  };

  const handleApply = () => {
    if (tempSelection?.from) {
      onSelect(tempSelection);
      onApply?.();
    }
  };

  const handleQuickSelect = (range) => {
    setTempSelection(range);
    setSelectingEnd(false);
  };

  const handleDayHover = (day) => {
    if (selectingEnd && tempSelection?.from) setHoverDate(day);
  };

  const isInRange = (day) => {
    if (!tempSelection?.from) return false;
    const endDate = selectingEnd && hoverDate ? hoverDate : tempSelection.to;
    if (!endDate) return false;
    const start = tempSelection.from < endDate ? tempSelection.from : endDate;
    const end = tempSelection.from < endDate ? endDate : tempSelection.from;
    return isWithinInterval(day, { start, end });
  };

  const isStart = (day) => tempSelection?.from && isSameDay(day, tempSelection.from);
  const isEnd = (day) => {
    if (selectingEnd && hoverDate) return isSameDay(day, hoverDate);
    return tempSelection?.to && isSameDay(day, tempSelection.to);
  };

  const quickOptions = [
    { label: '7 días', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: '14 días', getValue: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
    { label: '30 días', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  ];

  const renderMonth = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;

    return (
      <div className="p-3">
        <div className="text-center font-semibold text-slate-700 mb-3 capitalize text-sm">
          {format(month, 'MMMM yyyy', { locale: es })}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-slate-400 font-bold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="h-8" />)}
          {days.map((day) => {
            const inRange = isInRange(day);
            const start = isStart(day);
            const end = isEnd(day);
            const today = isToday(day);

            return (
              <motion.button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => handleDayHover(day)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`h-8 w-8 text-xs rounded-lg transition-all relative flex items-center justify-center mx-auto font-semibold
                  ${inRange && !start && !end ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : ''}
                  ${start ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' : ''}
                  ${end && !start ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-slate-100 text-slate-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                `}
              >
                {format(day, 'd')}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="select-none bg-slate-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="p-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickSelect(opt.getValue())}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all"
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex gap-6">
          {months.map((m, i) => (
            <span key={i} className="text-sm font-bold text-slate-200 capitalize">
              {format(m, 'MMMM', { locale: es })}
            </span>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="flex divide-x divide-slate-700">
        {months.map((month, i) => (
          <div key={i}>{renderMonth(month)}</div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tempSelection?.from ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded-lg font-medium text-xs border border-blue-400/50">
                {format(tempSelection.from, 'dd MMM', { locale: es })}
              </span>
              {tempSelection.to && !isSameDay(tempSelection.from, tempSelection.to) && (
                <>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded-lg font-medium text-xs border border-cyan-400/50">
                    {format(tempSelection.to, 'dd MMM', { locale: es })}
                  </span>
                </>
              )}
            </motion.div>
          ) : (
            <span className="text-xs text-slate-400">Selecciona una fecha</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tempSelection?.from && !selectingEnd && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Aplicar
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

// Función para obtener tipo de clima
const getWeatherType = (code, precipitation) => {
  if (code === 0 || code === 1) return 'sunny';
  if (code >= 51 && code <= 67) return precipitation > 2 ? 'rainy' : 'cloudy';
  if (code >= 61) return 'rainy';
  if (precipitation > 5) return 'rainy';
  if (precipitation > 0.1) return 'cloudy';
  return 'sunny';
};

// Botón climático con neumorphism y glow
const ClimateButton = ({ active, onClick, icon: Icon, label, color, glowColor, weatherType }) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      relative px-5 py-3 rounded-2xl font-bold text-sm
      transition-all duration-500 overflow-hidden
      ${active 
        ? `bg-gradient-to-br ${color} text-slate-900 shadow-xl` 
        : 'bg-slate-800/40 backdrop-blur-sm text-slate-400 hover:text-slate-200 border border-slate-700/50'
      }
    `}
    style={active ? {
      boxShadow: `0 0 30px ${glowColor}40, 0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`
    } : {}}
  >
    {/* Glow effect para botón activo */}
    {active && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    )}

    {/* Partículas climáticas internas */}
    {active && weatherType === 'rainy' && (
      <>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-3 bg-blue-300/60 rounded-full"
            style={{ left: `${15 + i * 18}%`, top: '-10px' }}
            animate={{ y: ['0%', '200%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
          />
        ))}
      </>
    )}

    {active && weatherType === 'sunny' && (
      <>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 bg-yellow-300/40"
            style={{ 
              left: `${10 + i * 15}%`,
              height: '100%',
              transformOrigin: 'center'
            }}
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              scaleY: [0.6, 1, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </>
    )}

    <div className="relative z-10 flex items-center gap-2">
      <motion.div
        animate={active ? {
          rotate: weatherType === 'sunny' ? 360 : 0,
          scale: [1, 1.2, 1]
        } : {}}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity }
        }}
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      <span>{label}</span>
    </div>

    {/* Barra inferior indicadora */}
    {active && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
      />
    )}
  </motion.button>
);

// KPI Card ejecutiva con glassmorphism
const ExecutiveKPI = ({ icon: Icon, label, value, subvalue, trend, onClick, delay = 0, iconColor, bgGradient, glowColor }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 30, rotateX: -15 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ delay, type: "spring", stiffness: 150 }}
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative bg-gradient-to-br ${bgGradient} backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden group cursor-pointer`}
    style={{ 
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)`
    }}
  >
    {/* Animated glow orbs */}
    <motion.div
      className={`absolute -top-10 -right-10 w-32 h-32 ${glowColor} rounded-full blur-3xl opacity-20`}
      animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <motion.div
      className={`absolute -bottom-8 -left-8 w-24 h-24 ${glowColor} rounded-full blur-2xl opacity-15`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
    />

    {/* Icon con animación */}
    <div className="relative z-10 flex items-start justify-between mb-4">
      <div>
        <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">{label}</p>
        <motion.p 
          className="text-3xl font-black text-white mb-1"
          key={value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {value}
        </motion.p>
        {subvalue && (
          <p className="text-slate-300 text-xs font-medium">{subvalue}</p>
        )}
      </div>
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg`}
      >
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </motion.div>
    </div>

    {/* Trend indicator */}
    {trend !== undefined && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.2 }}
        className="relative z-10 flex items-center gap-2"
      >
        <motion.div 
          animate={{ y: trend >= 0 ? [-3, 3, -3] : [3, -3, 3] }} 
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`p-1.5 rounded-lg ${trend >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}
        >
          {trend >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
        </motion.div>
        <span className={`text-sm font-bold ${trend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs promedio
        </span>
      </motion.div>
    )}

    {/* Hover overlay */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />
  </motion.button>
);

// Tooltip inteligente con contexto
const SmartTooltip = ({ active, payload, stats, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  const avgSales = stats?.avgTotal || 0;
  const deviation = avgSales > 0 ? ((data.sales - avgSales) / avgSales * 100) : 0;
  const weatherImpact = 
    data.weatherType === 'sunny' ? stats?.sunnyImpact :
    data.weatherType === 'rainy' ? stats?.rainyImpact :
    stats?.cloudyImpact;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-slate-900/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-700 p-5 min-w-[280px]"
      style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}
    >
      {/* Header con clima */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              rotate: data.weatherType === 'sunny' ? 360 : 0,
              scale: [1, 1.15, 1]
            }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
            className={`p-2.5 rounded-xl ${
              data.weatherType === 'sunny' ? 'bg-amber-500/20' :
              data.weatherType === 'rainy' ? 'bg-blue-500/20' :
              'bg-slate-500/20'
            }`}
          >
            {data.weatherType === 'sunny' && <Sun className="w-6 h-6 text-amber-400" />}
            {data.weatherType === 'rainy' && <CloudRain className="w-6 h-6 text-blue-400" />}
            {data.weatherType === 'cloudy' && <Cloud className="w-6 h-6 text-slate-400" />}
          </motion.div>
          <div>
            <p className="text-white font-bold text-sm capitalize">{data.fullDate}</p>
            <p className="text-slate-400 text-xs">
              {data.weatherType === 'sunny' ? '☀️ Soleado' : 
               data.weatherType === 'rainy' ? '🌧️ Lluvioso' : 
               '☁️ Nublado'}
            </p>
          </div>
        </div>
        {data.isForecast && (
          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-bold border border-cyan-500/30">
            Proyección
          </span>
        )}
      </div>

      {/* Métricas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Ventas
          </span>
          <span className="text-white font-black text-lg">{formatCurrency(data.sales)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm flex items-center gap-2">
            <Thermometer className="w-3 h-3 text-orange-400" />
            Temperatura
          </span>
          <span className="text-orange-400 font-bold">{data.temperature}°C</span>
        </div>
        {data.precipitation > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <CloudRain className="w-3 h-3 text-blue-400" />
              Precipitación
            </span>
            <span className="text-blue-400 font-bold">{data.precipitation}mm</span>
          </div>
        )}
      </div>

      {/* Insight contextual */}
      {!data.isForecast && (
        <div className={`mt-4 p-3 rounded-xl ${
          deviation > 10 ? 'bg-emerald-500/10 border border-emerald-500/30' :
          deviation < -10 ? 'bg-rose-500/10 border border-rose-500/30' :
          'bg-slate-700/30 border border-slate-600/30'
        }`}>
          <p className="text-xs leading-relaxed">
            <span className={`font-bold ${
              deviation > 10 ? 'text-emerald-400' :
              deviation < -10 ? 'text-rose-400' :
              'text-slate-300'
            }`}>
              {deviation > 10 ? '↗ ' : deviation < -10 ? '↘ ' : '→ '}
              {Math.abs(deviation).toFixed(0)}% {deviation >= 0 ? 'sobre' : 'bajo'} promedio
            </span>
            <span className="text-slate-300 ml-2">•</span>
            <span className="text-slate-400 ml-2">
              {weatherImpact !== undefined && `Impacto climático típico: ${weatherImpact.toFixed(0)}%`}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default function WeatherSalesImpactChart({ weatherData, dailySales = [], formatCurrency }) {
  const [viewMode, setViewMode] = useState('all');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Cargar pronóstico
  useEffect(() => {
    const fetchForecast = async () => {
      if (!showForecast || forecastData) return;
      setLoadingForecast(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=4.6097&longitude=-74.0817&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FBogota&forecast_days=7`
        );
        const data = await response.json();
        setForecastData(data.daily);
      } catch (e) {
        console.error('Error fetching forecast:', e);
      }
      setLoadingForecast(false);
    };
    fetchForecast();
  }, [showForecast, forecastData]);

  // Procesar datos
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time) return [];

    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });

    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.to);
    end.setHours(23, 59, 59, 999);

    const historyData = weatherData.history.time
      .filter(date => {
        const d = parseISO(date);
        d.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
      })
      .map((date) => {
        const idx = weatherData.history.time.indexOf(date);
        const temp = weatherData.history.temperature_2m_mean?.[idx] || 0;
        const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
        const weatherCode = weatherData.history.weathercode?.[idx] || 0;
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
          isForecast: false
        };
      });

    // Agregar pronóstico
    if (showForecast && forecastData?.time) {
      const salesByWeather = historyData.reduce((acc, d) => {
        if (d.sales > 0) {
          if (!acc[d.weatherType]) acc[d.weatherType] = [];
          acc[d.weatherType].push(d.sales);
        }
        return acc;
      }, {});

      const avgSalesByWeather = {
        sunny: salesByWeather.sunny?.length ? salesByWeather.sunny.reduce((a, b) => a + b, 0) / salesByWeather.sunny.length : 0,
        rainy: salesByWeather.rainy?.length ? salesByWeather.rainy.reduce((a, b) => a + b, 0) / salesByWeather.rainy.length : 0,
        cloudy: salesByWeather.cloudy?.length ? salesByWeather.cloudy.reduce((a, b) => a + b, 0) / salesByWeather.cloudy.length : 0,
      };

      const overallAvg = historyData.filter(d => d.sales > 0).reduce((sum, d) => sum + d.sales, 0) / Math.max(historyData.filter(d => d.sales > 0).length, 1);

      const forecastItems = forecastData.time.map((date, idx) => {
        const temp = forecastData.temperature_2m_max?.[idx] || 0;
        const precipitation = forecastData.precipitation_sum?.[idx] || 0;
        const weatherCode = forecastData.weathercode?.[idx] || 0;
        const weatherType = getWeatherType(weatherCode, precipitation);
        const predictedSales = avgSalesByWeather[weatherType] || overallAvg;

        return {
          date: format(parseISO(date), 'dd', { locale: es }),
          fullDate: format(parseISO(date), "EEE dd MMM", { locale: es }),
          dateStr: date,
          temperature: Math.round(temp * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10,
          sales: Math.round(predictedSales),
          weatherType,
          isForecast: true,
          isPredicted: true
        };
      });
      return [...historyData, ...forecastItems];
    }

    return historyData;
  }, [weatherData, dailySales, dateRange, showForecast, forecastData]);

  // Estadísticas
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    const withSales = chartData.filter(d => d.sales > 0 && !d.isForecast);
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
      cloudyImpact: avgTotal > 0 ? ((avgCloudy - avgTotal) / avgTotal * 100) : 0,
      bestDay,
      worstDay
    };
  }, [chartData]);

  const getDateLabel = () => {
    if (!dateRange?.from) return 'Calendario';
    if (dateRange.from && dateRange.to && isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, 'dd MMM', { locale: es });
    }
    return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`;
  };

  if (!chartData.length) {
    return (
      <div className="bg-slate-900 rounded-3xl p-12 text-center">
        <Cloud className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No hay datos de clima disponibles</p>
      </div>
    );
  }

  // Datos filtrados por vista
  const filteredData = viewMode === 'all' ? chartData :
    chartData.map(d => ({
      ...d,
      sales: d.weatherType === viewMode ? d.sales : 0
    }));

  // Calcular métricas financieras clave
  const financialMetrics = useMemo(() => {
    if (!stats || !chartData.length) return null;

    const withSales = chartData.filter(d => d.sales > 0 && !d.isForecast);
    const rainyDays = withSales.filter(d => d.weatherType === 'rainy');
    const sunnyDays = withSales.filter(d => d.weatherType === 'sunny');

    // Impacto neto en pesos
    const rainyLoss = rainyDays.reduce((sum, d) => {
      const expected = stats.avgTotal;
      const diff = d.sales - expected;
      return diff < 0 ? sum + Math.abs(diff) : sum;
    }, 0);

    const sunnyGain = sunnyDays.reduce((sum, d) => {
      const expected = stats.avgTotal;
      const diff = d.sales - expected;
      return diff > 0 ? sum + diff : sum;
    }, 0);

    const netImpact = sunnyGain - rainyLoss;

    // Proyección 7 días
    const forecastDays = chartData.filter(d => d.isForecast).slice(0, 7);
    const forecastTotal = forecastDays.reduce((s, d) => s + d.sales, 0);
    const forecastAvg = forecastTotal / Math.max(forecastDays.length, 1);
    const forecastVariation = stats.avgTotal > 0 ? ((forecastAvg - stats.avgTotal) / stats.avgTotal * 100) : 0;

    // Riesgo climático
    const rainyForecast = forecastDays.filter(d => d.weatherType === 'rainy').length;
    const estimatedLoss = rainyForecast * (stats.avgTotal - stats.avgRainy);
    const riskLevel = estimatedLoss > stats.avgTotal * 0.5 ? 'alto' : estimatedLoss > stats.avgTotal * 0.2 ? 'medio' : 'bajo';

    return {
      netImpact,
      rainyLoss,
      sunnyGain,
      forecastTotal,
      forecastVariation,
      riskLevel,
      estimatedLoss,
      rainyForecast
    };
  }, [stats, chartData]);

  return (
    <div className="space-y-5">
      {/* Header Ejecutivo Minimalista */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="p-3 bg-slate-100/90 backdrop-blur-sm rounded-2xl border border-slate-300/50 shadow-lg"
            style={{ boxShadow: '0 4px 20px rgba(100, 116, 139, 0.15)' }}
          >
            <Activity className="w-7 h-7 text-slate-700" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Impacto Climático en Ventas</h2>
            <p className="text-slate-600 text-sm font-semibold">
              {chartData.filter(d => !d.isForecast).length} días • Análisis financiero ejecutivo
            </p>
          </div>
        </div>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="bg-slate-800/80 backdrop-blur-sm text-slate-200 hover:bg-slate-700/80 border border-slate-600/50 shadow-lg gap-2 h-10 px-4 rounded-xl font-semibold text-sm"
              >
                <CalendarIcon className="w-4 h-4" />
                {getDateLabel()}
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="end">
            <WeatherCalendar
              selected={dateRange}
              onSelect={setDateRange}
              onApply={() => setIsCalendarOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs Financieros Críticos - Máximo 3 */}
      {financialMetrics && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Impacto Neto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 overflow-hidden"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Impacto Neto del Clima</p>
              <motion.p 
                className={`text-4xl font-black mb-1 ${financialMetrics.netImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                key={financialMetrics.netImpact}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {financialMetrics.netImpact >= 0 ? '+' : '−'}{formatCurrency(Math.abs(financialMetrics.netImpact))}
              </motion.p>
              <p className="text-slate-400 text-xs">
                {financialMetrics.netImpact >= 0 ? 
                  `Sol generó +${formatCurrency(financialMetrics.sunnyGain)} adicionales` :
                  `Lluvia impactó −${formatCurrency(financialMetrics.rainyLoss)}`
                }
              </p>
            </div>
          </motion.div>

          {/* Variación Porcentual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 overflow-hidden"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <motion.div
              className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Mayor Desviación Climática</p>
              <motion.p 
                className={`text-4xl font-black mb-1 ${Math.abs(stats.rainyImpact) > Math.abs(stats.sunnyImpact) ? 'text-blue-400' : 'text-amber-400'}`}
                key={Math.max(Math.abs(stats.rainyImpact), Math.abs(stats.sunnyImpact))}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {Math.abs(stats.rainyImpact) > Math.abs(stats.sunnyImpact) ? 
                  (stats.rainyImpact >= 0 ? '+' : '−') + Math.abs(stats.rainyImpact).toFixed(0) :
                  (stats.sunnyImpact >= 0 ? '+' : '−') + Math.abs(stats.sunnyImpact).toFixed(0)
                }%
              </motion.p>
              <p className="text-slate-400 text-xs">
                {Math.abs(stats.rainyImpact) > Math.abs(stats.sunnyImpact) ? 
                  `🌧️ Lluvia vs día promedio` :
                  `☀️ Sol vs día promedio`
                }
              </p>
            </div>
          </motion.div>

          {/* Proyección 7 Días */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 overflow-hidden"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Proyección 7 Días</p>
              <motion.p 
                className={`text-4xl font-black mb-1 ${financialMetrics.forecastVariation >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}
                key={financialMetrics.forecastTotal}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {formatCurrency(financialMetrics.forecastTotal)}
              </motion.p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${financialMetrics.forecastVariation >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
                  {financialMetrics.forecastVariation >= 0 ? '+' : ''}{financialMetrics.forecastVariation.toFixed(1)}%
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{
                  backgroundColor: financialMetrics.riskLevel === 'alto' ? 'rgba(239, 68, 68, 0.2)' :
                                   financialMetrics.riskLevel === 'medio' ? 'rgba(251, 146, 60, 0.2)' :
                                   'rgba(34, 197, 94, 0.2)',
                  color: financialMetrics.riskLevel === 'alto' ? '#fca5a5' :
                         financialMetrics.riskLevel === 'medio' ? '#fdba74' :
                         '#86efac',
                  borderColor: financialMetrics.riskLevel === 'alto' ? 'rgba(239, 68, 68, 0.3)' :
                               financialMetrics.riskLevel === 'medio' ? 'rgba(251, 146, 60, 0.3)' :
                               'rgba(34, 197, 94, 0.3)'
                }}>
                  Riesgo {financialMetrics.riskLevel}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Selectores de Escenario Climático */}
      <div className="flex items-center gap-3">
        <span className="text-slate-700 text-sm font-black">Escenario:</span>
        <div className="flex flex-wrap gap-2">
          <ClimateButton
            active={viewMode === 'all'}
            onClick={() => setViewMode('all')}
            icon={BarChart3}
            label="General"
            color="from-slate-400 to-slate-500"
            glowColor="#64748b"
          />
          <ClimateButton
            active={viewMode === 'sunny'}
            onClick={() => setViewMode('sunny')}
            icon={Sun}
            label={`Soleado (${stats?.sunnyCount || 0})`}
            color="from-amber-400 to-orange-500"
            glowColor="#fbbf24"
            weatherType="sunny"
          />
          <ClimateButton
            active={viewMode === 'rainy'}
            onClick={() => setViewMode('rainy')}
            icon={CloudRain}
            label={`Lluvia (${stats?.rainyCount || 0})`}
            color="from-blue-400 to-cyan-500"
            glowColor="#3b82f6"
            weatherType="rainy"
          />
          <ClimateButton
            active={viewMode === 'cloudy'}
            onClick={() => setViewMode('cloudy')}
            icon={Cloud}
            label={`Nublado (${stats?.cloudyCount || 0})`}
            color="from-slate-400 to-gray-500"
            glowColor="#64748b"
            weatherType="cloudy"
          />
          <ClimateButton
            active={viewMode === 'temp'}
            onClick={() => setViewMode('temp')}
            icon={Thermometer}
            label="Temperatura"
            color="from-orange-400 to-red-500"
            glowColor="#f97316"
          />
        </div>
      </div>

      {/* Gráfica Principal - 70% del foco visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
      >
        {/* Efectos climáticos interactivos dentro del área de gráfica */}
        <AnimatePresence>
          {viewMode === 'rainy' && (
            <>
              {/* Lluvia animada */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`rain-${i}`}
                  className="absolute w-0.5 bg-gradient-to-b from-blue-400/60 to-transparent rounded-full pointer-events-none z-20"
                  style={{ 
                    left: `${5 + (i * 4.5)}%`,
                    height: '25px'
                  }}
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ 
                    y: ['0%', '120%'],
                    opacity: [0, 0.6, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                />
              ))}
              {/* Relámpago esporádico muy sutil */}
              {Math.random() > 0.7 && (
                <motion.div
                  className="absolute inset-0 bg-blue-300/5 pointer-events-none z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 8 }}
                />
              )}
              {/* Oscurecimiento leve */}
              <div className="absolute inset-0 bg-slate-900/10 pointer-events-none z-5" />
            </>
          )}

          {viewMode === 'sunny' && (
            <>
              {/* Luz cálida */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none z-5"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {/* Partículas de luz */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`light-${i}`}
                  className="absolute w-1 h-1 bg-amber-300/40 rounded-full pointer-events-none z-10"
                  style={{ 
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`
                  }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 5
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Textura sutil de fondo */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />

        <div className="relative z-30 p-8">
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <defs>
                  {/* Gradientes 3D profesionales */}
                  <linearGradient id="sunnyBar3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="rainyBar3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="cloudyBar3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                    <stop offset="50%" stopColor="#64748b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#475569" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="generalBar3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7} />
                  </linearGradient>
                  {/* Sombra 3D real */}
                  <filter id="bar3DShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="6" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.4"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  {/* Reflejo sutil */}
                  <linearGradient id="barReflection" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.15)" />
                
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} 
                  stroke="rgba(148, 163, 184, 0.4)"
                  axisLine={{ strokeWidth: 2 }}
                />
                
                <YAxis
                  yAxisId="sales"
                  orientation="left"
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }}
                  stroke="rgba(71, 85, 105, 0.4)"
                  axisLine={{ strokeWidth: 2 }}
                  width={80}
                  label={{ value: 'Ventas', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 12, fontWeight: 700 }}
                />
                
                <YAxis
                  yAxisId="temp"
                  orientation="right"
                  domain={[10, 26]}
                  tickFormatter={(v) => `${v}°`}
                  tick={{ fontSize: 12, fill: '#ea580c', fontWeight: 700 }}
                  stroke="rgba(234, 88, 12, 0.5)"
                  axisLine={{ strokeWidth: 2 }}
                  width={55}
                  label={{ value: 'Temp °C', angle: 90, position: 'insideRight', fill: '#ea580c', fontSize: 12, fontWeight: 700 }}
                />

                {/* Línea de promedio sutil */}
                {stats && viewMode === 'all' && (
                  <Line
                    yAxisId="sales"
                    type="monotone"
                    dataKey={() => stats.avgTotal}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="10 5"
                    dot={false}
                  />
                )}

                <Tooltip content={(props) => <SmartTooltip {...props} stats={stats} formatCurrency={formatCurrency} />} />

                {/* Barras con extrusión 3D real */}
                <Bar 
                  yAxisId="sales" 
                  dataKey="sales" 
                  radius={[10, 10, 0, 0]}
                  filter="url(#bar3DShadow)"
                  animationDuration={1500}
                  animationEasing="ease-out"
                  isAnimationActive={true}
                >
                  {filteredData.map((entry, index) => {
                    const isRainy = entry.weatherType === 'rainy';
                    const isSunny = entry.weatherType === 'sunny';
                    const isCloudy = entry.weatherType === 'cloudy';
                    const isVisible = entry.sales > 0 && (viewMode === 'all' || entry.weatherType === viewMode || viewMode === 'temp');
                    
                    let fill = 'url(#generalBar3D)';
                    if (viewMode === 'sunny' || (viewMode === 'all' && isSunny)) fill = 'url(#sunnyBar3D)';
                    if (viewMode === 'rainy' || (viewMode === 'all' && isRainy)) fill = 'url(#rainyBar3D)';
                    if (viewMode === 'cloudy' || (viewMode === 'all' && isCloudy)) fill = 'url(#cloudyBar3D)';
                    if (viewMode === 'temp') fill = 'url(#generalBar3D)';

                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={fill}
                        opacity={entry.isForecast ? 0.35 : isVisible ? 1 : 0.12}
                        stroke={entry.isForecast ? '#06b6d4' : 'rgba(255,255,255,0.1)'}
                        strokeWidth={entry.isForecast ? 2 : 1}
                        strokeDasharray={entry.isForecast ? "6 4" : "0"}
                      />
                    );
                  })}
                </Bar>

                {/* Línea de temperatura volumétrica con glow térmico */}
                <Line
                  yAxisId="temp"
                  type="natural"
                  dataKey="temperature"
                  stroke="#fb923c"
                  strokeWidth={4}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    return (
                      <g>
                        {/* Glow pulsante */}
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill="rgba(251, 146, 60, 0.15)"
                          initial={{ scale: 0 }}
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{ 
                            duration: 2.5,
                            repeat: Infinity,
                            delay: 0.08 * index
                          }}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill="#fb923c"
                          stroke="#fff"
                          strokeWidth={2.5}
                          filter="drop-shadow(0 0 6px rgba(251, 146, 60, 0.8))"
                        />
                      </g>
                    );
                  }}
                  activeDot={(props) => {
                    const { cx, cy } = props;
                    return (
                      <g>
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          r={18}
                          fill="rgba(251, 146, 60, 0.15)"
                          animate={{ r: [18, 24, 18], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <circle cx={cx} cy={cy} r={10} fill="#fb923c" stroke="#fff" strokeWidth={3} 
                          filter="drop-shadow(0 0 12px rgba(251, 146, 60, 1))" 
                        />
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda minimalista */}
          <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-slate-200/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-10 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm shadow-lg" 
                style={{ boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }}
              />
              <span className="text-slate-700 text-sm font-bold">Ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-lg" 
                style={{ boxShadow: '0 0 8px rgba(251, 146, 60, 0.5)' }}
              />
              <span className="text-slate-700 text-sm font-bold">Temperatura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-10 bg-gradient-to-b from-cyan-400/40 to-cyan-600/40 rounded-sm border-2 border-dashed border-cyan-400" />
              <span className="text-slate-700 text-sm font-bold">Pronóstico</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Panel de Insights Cuantitativos Ejecutivos */}
      {stats && financialMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl p-6"
          style={{ boxShadow: '0 15px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30"
            >
              <Zap className="w-5 h-5 text-purple-400" />
            </motion.div>
            <h3 className="text-lg font-black text-white">Análisis Financiero Ejecutivo</h3>
          </div>

          <div className="space-y-4">
            {/* Impacto por día lluvioso */}
            {stats.rainyCount > 0 && (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <CloudRain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm mb-1">Costo por día lluvioso</p>
                    <p className="text-slate-300 text-lg font-black">
                      {stats.avgRainy < stats.avgTotal ? '−' : '+'}{formatCurrency(Math.abs(stats.avgRainy - stats.avgTotal))}
                      <span className="text-slate-400 text-xs font-normal ml-2">vs día promedio</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-2">
                      Cada día lluvioso implica {stats.avgRainy < stats.avgTotal ? 'una pérdida' : 'una ganancia'} estimada de {formatCurrency(Math.abs(stats.avgRainy - stats.avgTotal))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Riesgo semanal */}
            {showForecast && forecastData && (
              <div className={`backdrop-blur-sm rounded-xl p-4 border ${
                financialMetrics.riskLevel === 'alto' ? 'bg-rose-500/10 border-rose-500/30' :
                financialMetrics.riskLevel === 'medio' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingDown className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      financialMetrics.riskLevel === 'alto' ? 'text-rose-400' :
                      financialMetrics.riskLevel === 'medio' ? 'text-orange-400' :
                      'text-emerald-400'
                    }`} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-sm">Riesgo climático próximos 7 días</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        financialMetrics.riskLevel === 'alto' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' :
                        financialMetrics.riskLevel === 'medio' ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' :
                        'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      }`}>
                        {financialMetrics.riskLevel}
                      </span>
                    </div>
                    <p className="text-slate-300 text-lg font-black">
                      {financialMetrics.estimatedLoss > 0 ? '−' : '+'}{formatCurrency(Math.abs(financialMetrics.estimatedLoss))}
                      <span className="text-slate-400 text-xs font-normal ml-2">impacto estimado</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-2">
                      {financialMetrics.rainyForecast > 0 && `Con ${financialMetrics.rainyForecast} día${financialMetrics.rainyForecast > 1 ? 's' : ''} lluvioso${financialMetrics.rainyForecast > 1 ? 's' : ''} proyectado${financialMetrics.rainyForecast > 1 ? 's' : ''}, `}
                      {financialMetrics.riskLevel === 'alto' ? 'prepara estrategia de mitigación inmediata' :
                       financialMetrics.riskLevel === 'medio' ? 'monitorea pronóstico y ajusta inventario' :
                       'condiciones favorables, mantén operación estándar'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparativa cuantitativa */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-3">Comparativa de rendimiento por clima</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <p className="text-amber-300 text-xs font-bold">Soleado</p>
                      </div>
                      <p className="text-white font-black text-base">{formatCurrency(stats.avgSunny).slice(0, -3)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${stats.sunnyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.sunnyImpact >= 0 ? '+' : ''}{stats.sunnyImpact.toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CloudRain className="w-4 h-4 text-blue-400" />
                        <p className="text-blue-300 text-xs font-bold">Lluvioso</p>
                      </div>
                      <p className="text-white font-black text-base">{formatCurrency(stats.avgRainy).slice(0, -3)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${stats.rainyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.rainyImpact >= 0 ? '+' : ''}{stats.rainyImpact.toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Cloud className="w-4 h-4 text-slate-400" />
                        <p className="text-slate-300 text-xs font-bold">Nublado</p>
                      </div>
                      <p className="text-white font-black text-base">{formatCurrency(stats.avgCloudy).slice(0, -3)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${stats.cloudyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.cloudyImpact >= 0 ? '+' : ''}{stats.cloudyImpact.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acción recomendada */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-purple-300 font-bold text-sm mb-1">Acción recomendada</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {Math.abs(stats.rainyImpact) > Math.abs(stats.sunnyImpact) && stats.rainyImpact < -10 ?
                      `Prioridad: Estrategia anti-lluvia. Cada día lluvioso pierdes ~${formatCurrency(Math.abs(stats.avgRainy - stats.avgTotal))}. Implementa delivery, promociones indoor y combos para llevar.` :
                      Math.abs(stats.sunnyImpact) > Math.abs(stats.rainyImpact) && stats.sunnyImpact > 10 ?
                      `Maximiza días soleados: cada día genera +${formatCurrency(stats.avgSunny - stats.avgTotal)}. Aumenta inventario, extiende horarios y promociona productos refrescantes.` :
                      `El clima tiene impacto moderado (±${Math.max(Math.abs(stats.rainyImpact), Math.abs(stats.sunnyImpact)).toFixed(0)}%). Enfócate en optimización operacional, marketing y experiencia de cliente.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}