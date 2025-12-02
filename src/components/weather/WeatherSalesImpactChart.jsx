import React, { useState, useMemo } from 'react';
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

// Botón de vista con animación mejorada
const ViewButton = ({ active, onClick, icon: Icon, label, color }) => (
  <motion.button
    whileHover={{ scale: 1.08, y: -3 }}
    whileTap={{ scale: 0.92 }}
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
      animate={active ? { rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.6, repeat: active ? Infinity : 0, repeatDelay: 2 }}
    >
      <Icon className="w-4 h-4" />
    </motion.div>
    {label}
  </motion.button>
);

// Tarjeta de estadística MUY animada
const StatCard = ({ icon: Icon, label, value, subvalue, color, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.05, y: -5, rotate: 1 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg cursor-pointer relative overflow-hidden`}
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
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
    </div>
    {trend !== undefined && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.3 }}
        className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}
      >
        <motion.div animate={{ y: trend >= 0 ? [-2, 2, -2] : [2, -2, 2] }} transition={{ duration: 1, repeat: Infinity }}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </motion.div>
        <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
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

export default function WeatherSalesImpactChart({ weatherData, dailySales = [], formatCurrency }) {
  const [viewMode, setViewMode] = useState('bars');
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 29), to: new Date() });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

    return weatherData.history.time
      .filter(date => {
        const d = parseISO(date);
        return d >= dateRange.from && d <= dateRange.to;
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
          weatherColor: weatherType === 'sunny' ? '#f59e0b' : weatherType === 'rainy' ? '#3b82f6' : '#9ca3af'
        };
      });
  }, [weatherData, dailySales, dateRange]);

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

      {/* Estadísticas rápidas - MÁS DINÁMICAS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Sun}
            label="Días Soleados"
            value={stats.sunnyCount}
            subvalue={stats.avgSunny > 0 ? formatCurrency(stats.avgSunny) : 'Sin datos'}
            color="from-amber-400 to-orange-400"
            trend={stats.sunnyImpact}
            delay={0}
          />
          <StatCard
            icon={CloudRain}
            label="Días Lluviosos"
            value={stats.rainyCount}
            subvalue={stats.avgRainy > 0 ? formatCurrency(stats.avgRainy) : 'Sin datos'}
            color="from-blue-400 to-cyan-400"
            trend={stats.rainyImpact}
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            label="Mejor Día"
            value={stats.bestDay ? formatCurrency(stats.bestDay.sales) : '-'}
            subvalue={stats.bestDay?.fullDate}
            color="from-emerald-400 to-green-400"
            delay={0.2}
          />
          <StatCard
            icon={TrendingDown}
            label="Menor Día"
            value={stats.worstDay ? formatCurrency(stats.worstDay.sales) : '-'}
            subvalue={stats.worstDay?.fullDate}
            color="from-rose-400 to-red-400"
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
                    <Bar yAxisId="sales" dataKey="sales" name="Ventas" radius={[6, 6, 0, 0]}>
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
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-5 h-5 rounded bg-amber-500 shadow flex items-center justify-center"
                >
                  <Sun className="w-3 h-3 text-white" />
                </motion.div>
                <span className="text-gray-600">Soleado</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-5 h-5 rounded bg-gray-400 shadow flex items-center justify-center"
                >
                  <Cloud className="w-3 h-3 text-white" />
                </motion.div>
                <span className="text-gray-600">Nublado</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 rounded bg-blue-500 shadow flex items-center justify-center"
                >
                  <CloudRain className="w-3 h-3 text-white" />
                </motion.div>
                <span className="text-gray-600">Lluvioso</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-1 bg-gradient-to-r from-orange-300 to-orange-500 rounded" />
                <span className="text-gray-600">Temperatura</span>
              </div>
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