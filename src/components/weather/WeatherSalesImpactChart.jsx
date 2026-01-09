import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, Sun, Cloud, Thermometer, TrendingUp, TrendingDown, 
  Zap, Calendar as CalendarIcon, BarChart3, Activity, Droplets, Wind, Check, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Area, Legend, ReferenceLine
} from 'recharts';
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos animados de clima - MÁS DINÁMICOS
const WeatherIcon = ({ type, size = 'md', animated = true }) => {
  const sizeClass = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  
  if (type === 'sunny') {
    return (
      <motion.div
        animate={animated ? { 
          rotate: 360, 
          scale: [1, 1.2, 1],
          filter: ["drop-shadow(0 0 8px #fbbf24)", "drop-shadow(0 0 15px #fbbf24)", "drop-shadow(0 0 8px #fbbf24)"]
        } : {}}
        transition={{ 
          rotate: { duration: 15, repeat: Infinity, ease: "linear" }, 
          scale: { duration: 2, repeat: Infinity },
          filter: { duration: 1.5, repeat: Infinity }
        }}
        className={sizeClass}
      >
        <Sun className="w-full h-full text-amber-500" />
      </motion.div>
    );
  }
  if (type === 'rainy') {
    return (
      <motion.div className={`${sizeClass} relative`}>
        <motion.div
          animate={animated ? { y: [0, -4, 0], scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <CloudRain className="w-full h-full text-blue-500" />
        </motion.div>
        {animated && (
          <>
            <motion.div
              className="absolute -bottom-1 left-1/4 w-0.5 h-2 bg-blue-400 rounded-full"
              animate={{ y: [0, 8], opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute -bottom-1 left-1/2 w-0.5 h-2 bg-blue-400 rounded-full"
              animate={{ y: [0, 8], opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="absolute -bottom-1 left-3/4 w-0.5 h-2 bg-blue-400 rounded-full"
              animate={{ y: [0, 8], opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
      </motion.div>
    );
  }
  return (
    <motion.div
      animate={animated ? { x: [-3, 3, -3], scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 3, repeat: Infinity }}
      className={sizeClass}
    >
      <Cloud className="w-full h-full text-gray-400" />
    </motion.div>
  );
};

// Componente de clima animado para botones
const WeatherButtonIcon = ({ type, active }) => {
  if (type === 'sunny') {
    return (
      <motion.div className="relative w-5 h-5">
        <motion.div
          animate={active ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}
        >
          <Sun className="w-5 h-5 text-amber-400" />
        </motion.div>
        {active && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 w-1 h-1 bg-amber-300 rounded-full"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
      </motion.div>
    );
  }
  if (type === 'rainy') {
    return (
      <motion.div className="relative w-5 h-5">
        <motion.div
          animate={active ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <CloudRain className="w-5 h-5 text-blue-400" />
        </motion.div>
        {active && (
          <>
            <motion.div
              className="absolute bottom-0 left-1 w-0.5 h-1.5 bg-blue-400 rounded-full"
              animate={{ y: [0, 4], opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute bottom-0 right-1.5 w-0.5 h-1.5 bg-blue-400 rounded-full"
              animate={{ y: [0, 4], opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </motion.div>
    );
  }
  if (type === 'cloudy') {
    return (
      <motion.div className="relative w-5 h-5">
        <motion.div
          animate={active ? { x: [-2, 2, -2] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Cloud className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.div>
    );
  }
  return null;
};

// Botón de vista con animación mejorada y más dinámica
const ViewButton = ({ active, onClick, icon: Icon, label, color, weatherType }) => (
  <motion.button
    whileHover={{ scale: 1.08, y: -5, rotate: active ? 2 : 0 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    animate={active ? {
      boxShadow: ['0 4px 15px rgba(0,0,0,0.1)', '0 6px 25px rgba(0,0,0,0.15)', '0 4px 15px rgba(0,0,0,0.1)']
    } : {}}
    transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
    className={`
      flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
      transition-all duration-300 shadow-sm relative overflow-hidden
      ${active 
        ? `bg-gradient-to-r ${color} text-gray-800 shadow-lg ring-2 ring-offset-2 ${
            weatherType === 'sunny' ? 'ring-amber-300' : 
            weatherType === 'rainy' ? 'ring-blue-300' : 
            weatherType === 'cloudy' ? 'ring-gray-300' : 
            'ring-purple-300'
          }` 
        : 'bg-white/80 text-gray-500 hover:bg-gray-50 border border-gray-200'
      }
    `}
  >
    {/* Background animation for weather buttons */}
    {active && weatherType === 'sunny' && (
      <>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-orange-400/30"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Rayos de sol */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-full bg-yellow-300/40"
            style={{ left: `${20 + i * 20}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2], scaleY: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </>
    )}
    {active && weatherType === 'rainy' && (
      <>
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-blue-600/30"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Gotas de lluvia */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-2 bg-blue-400/60 rounded-full"
            style={{ left: `${10 + i * 15}%`, top: '0' }}
            animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
          />
        ))}
      </>
    )}
    {active && weatherType === 'cloudy' && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    )}
    
    <motion.div
      animate={active ? { 
        rotate: weatherType === 'sunny' ? 360 : [0, 15, -15, 0], 
        scale: [1, 1.3, 1],
        y: weatherType === 'rainy' ? [0, -3, 0] : 0
      } : {}}
      transition={{ 
        rotate: { duration: weatherType === 'sunny' ? 8 : 0.6, repeat: Infinity, ease: weatherType === 'sunny' ? "linear" : "easeInOut" },
        scale: { duration: 0.6, repeat: active ? Infinity : 0, repeatDelay: 2 },
        y: { duration: 1.5, repeat: Infinity }
      }}
      className="relative z-10"
    >
      {weatherType ? (
        <WeatherButtonIcon type={weatherType} active={active} />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </motion.div>
    <motion.span 
      className="relative z-10"
      animate={active ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {label}
    </motion.span>
    
    {/* Indicador de selección activa */}
    {active && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    )}
  </motion.button>
);

// Tarjeta de estadística MUY animada
const StatCard = ({ icon: Icon, label, value, subvalue, color, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.05, y: -5, rotate: 1 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-4 shadow-md cursor-pointer relative overflow-hidden`}
  >
    {/* Floating particles */}
    <motion.div
      className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full"
      animate={{ y: [-5, 5, -5], x: [-3, 3, -3], scale: [1, 1.2, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <motion.div
      className="absolute bottom-3 left-3 w-4 h-4 bg-white/10 rounded-full"
      animate={{ y: [5, -5, 5], scale: [1, 1.3, 1] }}
      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
    />
    
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-gray-600 text-xs font-medium">{label}</p>
        <motion.p 
          className="text-2xl font-black mt-1 text-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={value}
        >
          {value}
        </motion.p>
        {subvalue && <p className="text-gray-500 text-xs mt-1">{subvalue}</p>}
      </div>
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="p-2 bg-white/40 rounded-xl backdrop-blur-sm"
      >
        <Icon className="w-5 h-5 text-gray-600" />
      </motion.div>
    </div>
    {trend !== undefined && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.3 }}
        className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        <motion.div animate={{ y: trend >= 0 ? [-2, 2, -2] : [2, -2, 2] }} transition={{ duration: 1, repeat: Infinity }}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </motion.div>
        <span className="font-medium">{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
      </motion.div>
    )}
  </motion.div>
);

// Insight Card animada
const InsightCard = ({ icon, title, description, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: "spring" }}
    whileHover={{ scale: 1.02, x: 5 }}
    className={`flex items-start gap-3 p-4 rounded-xl ${color} border`}
  >
    <motion.span 
      className="text-2xl"
      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay }}
    >
      {icon}
    </motion.span>
    <div>
      <p className="font-bold text-sm text-gray-700">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </motion.div>
);

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
        <div className="text-center font-semibold text-gray-800 mb-3 capitalize text-sm">
          {format(month, 'MMMM yyyy', { locale: es })}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-gray-400 font-bold">{d}</div>
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
                className={`h-8 w-8 text-xs rounded-full transition-all relative flex items-center justify-center mx-auto
                  ${inRange && !start && !end ? 'bg-gradient-to-r from-sky-100 to-blue-100' : ''}
                  ${start ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold shadow-md' : ''}
                  ${end && !start ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold shadow-md' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-sky-50 text-gray-700' : ''}
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
    <div className="select-none bg-white rounded-2xl overflow-hidden shadow-xl border border-blue-100">
      <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-blue-100">
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickSelect(opt.getValue())}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-blue-50 text-blue-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex gap-6">
          {months.map((m, i) => (
            <span key={i} className="text-sm font-bold text-gray-700 capitalize">
              {format(m, 'MMMM', { locale: es })}
            </span>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-blue-50 text-blue-500"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="flex divide-x divide-gray-100">
        {months.map((month, i) => (
          <div key={i}>{renderMonth(month)}</div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tempSelection?.from ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                {format(tempSelection.from, 'dd MMM', { locale: es })}
              </span>
              {tempSelection.to && !isSameDay(tempSelection.from, tempSelection.to) && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-lg font-medium">
                    {format(tempSelection.to, 'dd MMM', { locale: es })}
                  </span>
                </>
              )}
            </motion.div>
          ) : (
            <span className="text-xs text-gray-400">Selecciona una fecha</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectingEnd && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-blue-500 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Selecciona fecha fin
            </motion.span>
          )}
          {tempSelection?.from && !selectingEnd && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 text-white text-xs font-medium shadow-md flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> OK
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

// Función para obtener tipo de clima basado en código WMO (más precisa)
const getWeatherType = (code, precipitation, temp) => {
  // Códigos WMO oficiales
  if (code === 0) return 'sunny'; // Cielo despejado
  if (code === 1) return 'sunny'; // Principalmente despejado
  if (code === 2) return 'cloudy'; // Parcialmente nublado
  if (code === 3) return 'cloudy'; // Nublado
  if (code === 45 || code === 48) return 'cloudy'; // Niebla
  if (code >= 51 && code <= 57) return precipitation > 2 ? 'rainy' : 'cloudy'; // Llovizna
  if (code >= 61 && code <= 67) return 'rainy'; // Lluvia
  if (code >= 71 && code <= 77) return 'rainy'; // Nieve
  if (code >= 80 && code <= 82) return 'rainy'; // Chubascos de lluvia
  if (code >= 85 && code <= 86) return 'rainy'; // Chubascos de nieve
  if (code >= 95) return 'rainy'; // Tormenta
  
  // Fallback basado en precipitación
  if (precipitation > 5) return 'rainy';
  if (precipitation > 1) return 'cloudy';
  if (precipitation > 0.1) return 'cloudy';
  
  return 'sunny'; // Por defecto soleado si no hay precipitación
};

export default function WeatherSalesImpactChart({ weatherData, dailySales = [], formatCurrency }) {
  const [viewMode, setViewMode] = useState('bars');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Cargar pronóstico cuando se activa
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

    // Normalizar fechas para comparación
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
        const weatherType = getWeatherType(weatherCode, precipitation, temp);

        return {
          date: format(parseISO(date), 'dd', { locale: es }),
          fullDate: format(parseISO(date), "EEE dd MMM", { locale: es }),
          dateStr: date,
          temperature: Math.round(temp * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10,
          sales,
          weatherType,
          weatherColor: weatherType === 'sunny' ? '#f59e0b' : weatherType === 'rainy' ? '#3b82f6' : '#9ca3af',
          isForecast: false
        };
      });

    // Agregar pronóstico si está activado y hay datos
    if (showForecast && forecastData?.time) {
      // Calcular promedio de ventas por tipo de clima (para predicción)
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

      // Usar promedio general si no hay datos de ese tipo de clima
      const overallAvg = historyData.filter(d => d.sales > 0).reduce((sum, d) => sum + d.sales, 0) / Math.max(historyData.filter(d => d.sales > 0).length, 1);

      const forecastItems = forecastData.time.map((date, idx) => {
        const temp = forecastData.temperature_2m_max?.[idx] || 0;
        const precipitation = forecastData.precipitation_sum?.[idx] || 0;
        const weatherCode = forecastData.weathercode?.[idx] || 0;
        const weatherType = getWeatherType(weatherCode, precipitation, temp);

        // Predecir ventas basado en tipo de clima histórico
        const predictedSales = avgSalesByWeather[weatherType] || overallAvg;

        return {
          date: format(parseISO(date), 'dd', { locale: es }),
          fullDate: format(parseISO(date), "EEE dd MMM", { locale: es }) + ' (Pronóstico)',
          dateStr: date,
          temperature: Math.round(temp * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10,
          sales: Math.round(predictedSales),
          weatherType,
          weatherColor: weatherType === 'sunny' ? '#fbbf24' : weatherType === 'rainy' ? '#60a5fa' : '#d1d5db',
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

  const handleResetToMonth = () => {
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setIsCalendarOpen(false);
  };

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

  // Generar insights dinámicos
  const insights = useMemo(() => {
    if (!stats) return [];
    const list = [];
    
    if (stats.sunnyImpact > 5) {
      list.push({
        icon: '☀️',
        title: 'Los días soleados impulsan ventas',
        description: `Las ventas suben ${stats.sunnyImpact.toFixed(0)}% en días soleados. Aprovecha para promociones outdoor.`,
        color: 'bg-amber-50 border-amber-200'
      });
    }
    
    if (stats.rainyImpact < -5) {
      list.push({
        icon: '🌧️',
        title: 'La lluvia afecta el tráfico',
        description: `Las ventas bajan ${Math.abs(stats.rainyImpact).toFixed(0)}% en días lluviosos. Considera delivery o promociones indoor.`,
        color: 'bg-blue-50 border-blue-200'
      });
    } else if (stats.rainyImpact > 0) {
      list.push({
        icon: '🌧️',
        title: '¡Sorpresa! La lluvia no afecta',
        description: `Las ventas se mantienen estables incluso con lluvia. Tu clientela es fiel.`,
        color: 'bg-green-50 border-green-200'
      });
    }
    
    if (stats.bestDay) {
      list.push({
        icon: '🏆',
        title: `Mejor día: ${stats.bestDay.fullDate}`,
        description: `Venta de ${formatCurrency(stats.bestDay.sales)} con clima ${stats.bestDay.weatherType === 'sunny' ? 'soleado' : stats.bestDay.weatherType === 'rainy' ? 'lluvioso' : 'nublado'}.`,
        color: 'bg-emerald-50 border-emerald-200'
      });
    }
    
    return list;
  }, [stats, formatCurrency]);

  return (
    <div className="space-y-4">
      {/* Header con controles dinámicos */}
      <Card className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 border-0 shadow-xl overflow-hidden relative">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0.5 }}
        >
          <motion.div
            className="absolute top-4 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
            animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-2 left-20 w-16 h-16 bg-white/10 rounded-full blur-xl"
            animate={{ scale: [1, 1.2, 1], y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
        </motion.div>

        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
              >
                <Thermometer className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">Impacto del Clima en Ventas</h2>
                <p className="text-white/70 text-sm">{chartData.length} días analizados</p>
              </div>
            </div>

            {/* Calendar Selector */}
            <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="secondary" className="gap-2 bg-white/20 text-white hover:bg-white/30 border-0">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="font-medium">{getDateLabel()}</span>
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

          {/* Botones de vista dinámicos con información */}
          <div className="flex flex-wrap gap-2 mt-4">
            <ViewButton
              active={viewMode === 'bars'}
              onClick={() => setViewMode('bars')}
              icon={BarChart3}
              label="Barras"
              color="from-purple-200 to-violet-200"
            />
            <ViewButton
              active={viewMode === 'trend'}
              onClick={() => setViewMode('trend')}
              icon={Activity}
              label="Tendencia"
              color="from-emerald-200 to-teal-200"
            />
            <ViewButton
              active={viewMode === 'sunny'}
              onClick={() => setViewMode('sunny')}
              icon={Sun}
              label={`Soleados ${stats ? `(${stats.sunnyCount})` : ''}`}
              color="from-amber-200 to-orange-200"
              weatherType="sunny"
            />
            <ViewButton
              active={viewMode === 'rainy'}
              onClick={() => setViewMode('rainy')}
              icon={CloudRain}
              label={`Lluviosos ${stats ? `(${stats.rainyCount})` : ''}`}
              color="from-blue-200 to-cyan-200"
              weatherType="rainy"
            />
            <ViewButton
              active={viewMode === 'comparison'}
              onClick={() => setViewMode('comparison')}
              icon={Thermometer}
              label="Temp vs Venta"
              color="from-orange-200 to-red-200"
            />
            <ViewButton
              active={showForecast}
              onClick={() => {
                setShowForecast(!showForecast);
                if (!showForecast) setForecastData(null);
              }}
              icon={Cloud}
              label={loadingForecast ? "..." : "Pronóstico 7D"}
              color="from-cyan-200 to-blue-200"
              weatherType={showForecast ? 'cloudy' : undefined}
            />
          </div>

          {/* Panel informativo según vista activa */}
          <AnimatePresence>
            {viewMode === 'sunny' && stats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border-2 border-amber-300/50"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                  >
                    <Sun className="w-8 h-8 text-amber-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-2">☀️ Días Soleados - Análisis</h4>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Días</p>
                        <p className="text-xl font-black text-amber-700">{stats.sunnyCount}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Venta Prom.</p>
                        <p className="text-xl font-black text-amber-700">{formatCurrency(stats.avgSunny)}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Impacto</p>
                        <p className={`text-xl font-black ${stats.sunnyImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.sunnyImpact >= 0 ? '+' : ''}{stats.sunnyImpact.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {stats.sunnyImpact > 5 ? 
                        `Los días soleados generan ${stats.sunnyImpact.toFixed(0)}% más ventas. Programa promociones outdoor y aumenta inventario estos días.` :
                        stats.sunnyImpact < -5 ?
                        `Curiosamente, los días soleados tienen ${Math.abs(stats.sunnyImpact).toFixed(0)}% menos ventas. La gente prefiere otras actividades.` :
                        'El clima soleado tiene impacto neutral en ventas.'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'rainy' && stats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border-2 border-blue-300/50"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <CloudRain className="w-8 h-8 text-blue-600" />
                    </motion.div>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-2 bg-blue-400 rounded-full"
                        style={{ left: `${8 + i * 8}px`, top: '32px' }}
                        animate={{ y: [0, 12], opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-2">🌧️ Días Lluviosos - Análisis</h4>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Días</p>
                        <p className="text-xl font-black text-blue-700">{stats.rainyCount}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Venta Prom.</p>
                        <p className="text-xl font-black text-blue-700">{formatCurrency(stats.avgRainy)}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Impacto</p>
                        <p className={`text-xl font-black ${stats.rainyImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.rainyImpact >= 0 ? '+' : ''}{stats.rainyImpact.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {stats.rainyImpact < -10 ? 
                        `La lluvia reduce ventas ${Math.abs(stats.rainyImpact).toFixed(0)}%. Considera delivery, promociones indoor y combos para llevar.` :
                        stats.rainyImpact > 5 ?
                        `¡Increíble! La lluvia aumenta ventas ${stats.rainyImpact.toFixed(0)}%. Los clientes buscan refugio con helado.` :
                        'La lluvia tiene impacto moderado en ventas.'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'comparison' && stats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border-2 border-orange-300/50"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Thermometer className="w-8 h-8 text-orange-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-2">🌡️ Temperatura vs Ventas</h4>
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Esta vista correlaciona la temperatura ambiente con el desempeño de ventas. Temperaturas extremas (muy altas o muy bajas) pueden impulsar o reducir el consumo de helados.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'trend' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border-2 border-emerald-300/50"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Activity className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-emerald-900 mb-2">📈 Vista de Tendencia</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Visualiza patrones de ventas a lo largo del tiempo con una curva suave que facilita identificar ciclos y tendencias climáticas.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {showForecast && forecastData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border-2 border-cyan-300/50"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Cloud className="w-8 h-8 text-cyan-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-cyan-900 mb-2">🔮 Pronóstico 7 Días - Clima & Ventas</h4>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {chartData.filter(d => d.isForecast).slice(0, 7).map((dayData, idx) => {
                        return (
                          <div key={idx} className="bg-white/80 rounded-lg p-1.5 text-center border border-cyan-200">
                            <p className="text-[9px] text-gray-500 font-medium">{format(parseISO(dayData.dateStr), 'EEE', { locale: es })}</p>
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
                              className="my-1 flex justify-center"
                            >
                              {dayData.weatherType === 'sunny' && <Sun className="w-4 h-4 text-amber-500" />}
                              {dayData.weatherType === 'rainy' && <CloudRain className="w-4 h-4 text-blue-500" />}
                              {dayData.weatherType === 'cloudy' && <Cloud className="w-4 h-4 text-gray-400" />}
                            </motion.div>
                            <p className="text-[10px] font-bold text-gray-700">{Math.round(dayData.temperature)}°</p>
                            <div className="mt-1 pt-1 border-t border-cyan-200">
                              <p className="text-[8px] text-cyan-600 font-medium">Venta Est.</p>
                              <p className="text-[9px] font-black text-cyan-700">{formatCurrency(dayData.sales).slice(0, -3)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg p-2 mb-2">
                      <p className="text-[10px] font-bold text-cyan-900 mb-1">💰 Proyección Total 7 Días:</p>
                      <p className="text-lg font-black text-cyan-700">
                        {formatCurrency(chartData.filter(d => d.isForecast).slice(0, 7).reduce((sum, d) => sum + d.sales, 0))}
                      </p>
                    </div>
                    <p className="text-xs text-cyan-800 leading-relaxed">
                      Las ventas proyectadas se basan en el patrón histórico según tipo de clima. Planifica inventario y personal en consecuencia.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas - MÁS DINÁMICAS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Sun}
            label="Días Soleados"
            value={stats.sunnyCount}
            subvalue={stats.avgSunny > 0 ? formatCurrency(stats.avgSunny) : 'Sin datos'}
            color="from-amber-100 to-orange-100"
            trend={stats.sunnyImpact}
            delay={0}
          />
          <StatCard
            icon={CloudRain}
            label="Días Lluviosos"
            value={stats.rainyCount}
            subvalue={stats.avgRainy > 0 ? formatCurrency(stats.avgRainy) : 'Sin datos'}
            color="from-blue-100 to-cyan-100"
            trend={stats.rainyImpact}
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            label="Mejor Día"
            value={stats.bestDay ? formatCurrency(stats.bestDay.sales) : '-'}
            subvalue={stats.bestDay?.fullDate}
            color="from-emerald-100 to-green-100"
            delay={0.2}
          />
          <StatCard
            icon={TrendingDown}
            label="Menor Día"
            value={stats.worstDay ? formatCurrency(stats.worstDay.sales) : '-'}
            subvalue={stats.worstDay?.fullDate}
            color="from-rose-100 to-red-100"
            delay={0.3}
          />
        </div>
      )}

      {/* Gráfica principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradientWeather" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="tempGradientWeather" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis
                    yAxisId="sales"
                    orientation="left"
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
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
                            <WeatherIcon type={data?.weatherType} size="sm" animated={false} />
                            <span className="font-bold capitalize">{data?.fullDate}</span>
                          </div>
                          <p className="flex justify-between gap-4">
                            <span className="text-gray-500">💰 Venta:</span>
                            <span className="font-bold">{formatCurrency(data?.sales)}{data?.isPredicted ? ' (Est.)' : ''}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-gray-500">🌡️ Temp:</span>
                            <span className="font-bold text-orange-500">{data?.temperature}°C</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-gray-500">🌧️ Lluvia:</span>
                            <span className="font-bold">{data?.precipitation}mm</span>
                          </p>
                          {data?.isForecast && (
                            <p className="text-xs text-cyan-500 mt-2 font-medium">📅 Pronóstico</p>
                          )}
                        </motion.div>
                      );
                    }}
                  />

                  <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />

                  {viewMode === 'bars' && (
                    <Bar yAxisId="sales" dataKey="sales" name="Ventas" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.weatherType === 'sunny' ? '#fbbf24' : entry.weatherType === 'rainy' ? '#3b82f6' : '#9ca3af'} 
                            opacity={entry.isForecast ? 0.5 : 0.85}
                            strokeDasharray={entry.isForecast ? "5 3" : "0"}
                            stroke={entry.isForecast ? '#06b6d4' : "none"}
                            strokeWidth={entry.isForecast ? 2 : 0}
                          />
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
                      <Bar yAxisId="sales" dataKey="sales" name="Ventas" radius={[6, 6, 0, 0]} fill="#8b5cf6" opacity={0.7} />
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

                  {viewMode === 'sunny' && (
                    <Bar yAxisId="sales" dataKey="sales" name="Ventas (Soleados)" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-sunny-${index}`} 
                          fill={entry.weatherType === 'sunny' ? '#fbbf24' : '#e5e7eb'} 
                          opacity={entry.weatherType === 'sunny' ? 1 : 0.3}
                        />
                      ))}
                    </Bar>
                  )}

                  {viewMode === 'rainy' && (
                    <Bar yAxisId="sales" dataKey="sales" name="Ventas (Lluviosos)" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-rainy-${index}`} 
                          fill={entry.weatherType === 'rainy' ? '#3b82f6' : '#e5e7eb'} 
                          opacity={entry.weatherType === 'rainy' ? 1 : 0.3}
                        />
                      ))}
                    </Bar>
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

            {/* Leyenda visual con iconos animados tipo clima real */}
            <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t">
              {/* Sol animado con rayos */}
              <div className="flex items-center gap-2 text-xs">
                <div className="relative w-8 h-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-2 bg-amber-400 rounded-full"
                        style={{
                          transform: `rotate(${i * 45}deg) translateY(-10px)`,
                        }}
                        animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-400/50" />
                  </motion.div>
                </div>
                <span className="text-gray-600 font-medium">Soleado</span>
              </div>

              {/* Nube animada */}
              <div className="flex items-center gap-2 text-xs">
                <motion.div
                  animate={{ x: [-3, 3, -3], y: [-1, 1, -1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative"
                >
                  <div className="w-8 h-5 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full shadow-md" />
                  <div className="absolute -top-1 left-1 w-4 h-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full" />
                  <div className="absolute -top-0.5 right-1 w-3 h-3 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full" />
                </motion.div>
                <span className="text-gray-600 font-medium">Nublado</span>
              </div>

              {/* Lluvia animada con gotas */}
              <div className="flex items-center gap-2 text-xs relative">
                <div className="relative w-8 h-10">
                  <motion.div
                    animate={{ y: [-2, 0, -2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-0 left-0 right-0"
                  >
                    <div className="w-8 h-4 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full shadow-md" />
                    <div className="absolute -top-1 left-1 w-3 h-3 bg-gradient-to-b from-blue-300 to-blue-400 rounded-full" />
                  </motion.div>
                  {/* Gotas de lluvia */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-0.5 bg-blue-400 rounded-full"
                      style={{ left: `${10 + i * 10}px`, height: '6px' }}
                      animate={{ 
                        y: [4, 12], 
                        opacity: [1, 0],
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.15,
                        ease: "linear"
                      }}
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">Lluvioso</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-1.5 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full shadow" />
                <span className="text-gray-600 font-medium">Temperatura</span>
              </div>
              {showForecast && (
                <div className="flex items-center gap-2 text-xs">
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-6 rounded-lg border-2 border-dashed border-cyan-400 bg-cyan-100/50 flex items-center justify-center"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-500" />
                  </motion.div>
                  <span className="text-gray-600 font-medium">Pronóstico</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights del impacto - NUEVO */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white shadow-xl border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </motion.div>
                Insights del Impacto Climático
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights.map((insight, i) => (
                  <InsightCard key={i} {...insight} delay={0.1 * i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}