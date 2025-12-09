import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, getWeek, startOfYear, endOfYear, startOfWeek, endOfWeek, isSameDay, isWithinInterval, subDays, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Clock, Calendar, TrendingUp, Award, Target, Zap, Info, ChevronLeft, ChevronRight, Sparkles, Check, CalendarRange, BarChart3 } from 'lucide-react';

const ROLES_COLORS = {
  caja: '#10b981', coneo: '#ec4899', bebidas: '#f59e0b', especialidades: '#8b5cf6',
  coordinacion: '#3b82f6', cookie_jar: '#f97316', stocker: '#64748b', toma_pedidos: '#06b6d4', experiencia: '#eab308', descanso: '#6366f1'
};

const ROLES_LABELS = {
  caja: 'Caja', coneo: 'Coneo', bebidas: 'Bebidas', especialidades: 'Especialidades',
  coordinacion: 'Coord.', cookie_jar: 'Cookie', stocker: 'Stocker', toma_pedidos: 'Pedidos', experiencia: 'Experiencia', descanso: 'Descanso'
};

const ROLES_EMOJIS = {
  caja: '💳', coneo: '🍦', bebidas: '☕', especialidades: '✨',
  coordinacion: '📋', cookie_jar: '🍪', stocker: '📦', toma_pedidos: '🎧', experiencia: '👑', descanso: '😴'
};

// Stat Card MUY animada
const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.9 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    transition={{ delay, type: "spring", stiffness: 200 }} 
    whileHover={{ y: -8, scale: 1.05, rotate: 1 }}
  >
    <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all relative overflow-hidden">
      {/* Floating elements */}
      <motion.div 
        className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full opacity-50"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <motion.p 
              className={`text-2xl font-black ${color}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: "spring" }}
            >
              {value}
            </motion.p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
          </div>
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} 
            transition={{ duration: 3, repeat: Infinity, delay }} 
            className={`w-12 h-12 rounded-xl ${color.includes('pink') ? 'bg-pink-100' : color.includes('emerald') ? 'bg-emerald-100' : color.includes('violet') ? 'bg-violet-100' : 'bg-amber-100'} flex items-center justify-center shadow-inner`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ChartDescription = ({ children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded-lg"
  >
    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    </motion.div>
    <p className="text-[11px] text-gray-500 leading-relaxed">{children}</p>
  </motion.div>
);

// Custom Calendar para Stats
function StatsCalendar({ selected, onSelect, onApply }) {
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
    { label: 'Esta semana', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
    { label: 'Últimos 14 días', getValue: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
    { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Último mes', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
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
                  ${inRange && !start && !end ? 'bg-gradient-to-r from-emerald-100 to-teal-100' : ''}
                  ${start ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md' : ''}
                  ${end && !start ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-md' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-emerald-50 text-gray-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}
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
    <div className="select-none bg-white rounded-2xl overflow-hidden shadow-xl border border-emerald-100">
      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickSelect(opt.getValue())}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-500">
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex gap-6">
          {months.map((m, i) => <span key={i} className="text-sm font-bold text-gray-700 capitalize">{format(m, 'MMMM', { locale: es })}</span>)}
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-500">
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="flex divide-x divide-gray-100">
        {months.map((month, i) => <div key={i}>{renderMonth(month)}</div>)}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tempSelection?.from ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium">{format(tempSelection.from, 'dd MMM', { locale: es })}</span>
              {tempSelection.to && !isSameDay(tempSelection.from, tempSelection.to) && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-lg font-medium">{format(tempSelection.to, 'dd MMM', { locale: es })}</span>
                </>
              )}
            </motion.div>
          ) : <span className="text-xs text-gray-400">Selecciona fechas</span>}
        </div>
        {tempSelection?.from && !selectingEnd && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleApply}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium shadow-md flex items-center gap-1">
            <Check className="w-3 h-3" /> OK
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default function PlannerStats({ shifts, cashiers, storeId, currentWeek, salesData = [], shiftRecords = [] }) {
  const [dateRange, setDateRange] = useState({ from: startOfMonth(currentWeek), to: endOfMonth(currentWeek) });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Generar semanas del año
  const yearWeeks = useMemo(() => {
    const start = startOfYear(currentWeek);
    const end = endOfYear(currentWeek);
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(week => ({
      week,
      number: getWeek(week, { weekStartsOn: 1 }),
      label: `Sem ${getWeek(week, { weekStartsOn: 1 })} - ${format(week, "d MMM", { locale: es })}`
    }));
  }, [currentWeek]);

  const handleWeekSelect = (weekNum) => {
    const selected = yearWeeks.find(w => w.number === parseInt(weekNum));
    if (selected) {
      setSelectedWeek(weekNum);
      setDateRange({ from: selected.week, to: endOfWeek(selected.week, { weekStartsOn: 1 }) });
    }
  };

  const stats = useMemo(() => {
    const filteredShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    const hoursByCashier = cashiers.map(c => {
      const cashierShifts = filteredShifts.filter(s => s.cashier_id === c.id);
      const totalHours = cashierShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      const cashierSales = shiftRecords.filter(sr => sr.cashier_id === c.id);
      const totalSales = cashierSales.reduce((sum, sr) => sum + (sr.sales || 0), 0);
      
      // Calcular roles por colaborador
      const roleCount = {};
      cashierShifts.forEach(s => {
        roleCount[s.role] = (roleCount[s.role] || 0) + 1;
      });
      
      return { 
        id: c.id,
        name: c.name?.split(' ')[0] || 'N/A', 
        hours: Math.round(totalHours), 
        fullName: c.name, 
        sales: totalSales, 
        shifts: cashierShifts.length,
        roleCount 
      };
    }).sort((a, b) => b.hours - a.hours);

    const roleDistribution = Object.entries(ROLES_LABELS).map(([key, label]) => ({
      name: label, value: filteredShifts.filter(s => s.role === key).length, color: ROLES_COLORS[key], key
    })).filter(r => r.value > 0);

    const shiftsByDay = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => ({
      day, turnos: filteredShifts.filter(s => new Date(s.date).getDay() === (idx === 6 ? 0 : idx + 1)).length
    }));

    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
    const weeklyTrend = weeks.map((week, i) => {
      const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
      const weekShifts = filteredShifts.filter(s => { const d = new Date(s.date); return d >= week && d <= weekEnd; });
      const hours = weekShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      return { week: `Sem ${getWeek(week, { weekStartsOn: 1 })}`, turnos: weekShifts.length, horas: Math.round(hours) };
    });

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const productivityData = days.slice(0, 14).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayShifts = filteredShifts.filter(s => (s.date?.split('T')[0] || s.date) === dayStr);
      const hoursScheduled = dayShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      const daySales = salesData.find(sd => sd.date === dayStr);
      const sales = daySales ? Math.round(daySales.total_sales / 1000) : 0;
      return { fecha: format(day, 'd MMM', { locale: es }), horas: Math.round(hoursScheduled), ventas: sales, productividad: hoursScheduled > 0 ? Math.round(sales * 1000 / hoursScheduled / 1000) : 0 };
    });

    const topPositions = Object.entries(ROLES_LABELS).map(([key, label]) => ({
      role: key, label, count: filteredShifts.filter(s => s.role === key).length, color: ROLES_COLORS[key]
    })).sort((a, b) => b.count - a.count);

    const totalHours = filteredShifts.reduce((sum, s) => {
      const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
      const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
      return sum + (endH + endM/60) - (startH + startM/60);
    }, 0);

    // Datos para radar de roles por colaborador
    const collaboratorRolesData = cashiers.slice(0, 6).map(c => {
      const cashierData = hoursByCashier.find(h => h.id === c.id) || { roleCount: {} };
      return {
        name: c.name?.split(' ')[0] || 'N/A',
        ...Object.fromEntries(Object.keys(ROLES_LABELS).map(role => [role, cashierData.roleCount[role] || 0]))
      };
    });

    return { 
      totalShifts: filteredShifts.length, 
      totalHours: Math.round(totalHours), 
      avgHours: cashiers.length ? Math.round(totalHours / cashiers.length) : 0, 
      hoursByCashier, 
      roleDistribution, 
      shiftsByDay, 
      weeklyTrend, 
      topPositions, 
      productivityData,
      collaboratorRolesData
    };
  }, [shifts, cashiers, dateRange, salesData, shiftRecords]);

  const getDateLabel = () => {
    if (!dateRange?.from) return 'Seleccionar período';
    if (isSameDay(dateRange.from, dateRange.to)) return format(dateRange.from, 'dd MMM', { locale: es });
    return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="font-bold text-gray-800">Reportes del Planner</h2>
              <p className="text-xs text-gray-400">{stats.totalShifts} turnos en el período</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Week Selector */}
            <Select value={selectedWeek?.toString() || ''} onValueChange={handleWeekSelect}>
              <SelectTrigger className="w-44 border-emerald-200">
                <SelectValue placeholder="Filtrar por semana" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {yearWeeks.map(w => (
                  <SelectItem key={w.number} value={w.number.toString()}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Calendar */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-full">
                    <CalendarRange className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">{getDateLabel()}</span>
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="end">
                <StatsCalendar selected={dateRange} onSelect={setDateRange} onApply={() => setIsCalendarOpen(false)} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Turnos del Período" value={stats.totalShifts} icon={Calendar} color="text-pink-500" delay={0} />
        <StatCard title="Horas Totales" value={`${stats.totalHours}h`} icon={Clock} color="text-emerald-500" delay={0.1} />
        <StatCard title="Promedio/Persona" value={`${stats.avgHours}h`} icon={Users} color="text-violet-500" delay={0.2} />
        <StatCard title="Colaboradores" value={cashiers.length} icon={Award} color="text-amber-500" delay={0.3} />
      </div>

      {/* Productividad Chart - MUY DINÁMICO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Zap className="w-5 h-5 text-amber-500" />
              </motion.div>
              Análisis de Productividad
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">Relación entre horas programadas y ventas</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.productivityData}>
                  <defs>
                    <linearGradient id="colorVentasPlanner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-4 rounded-xl shadow-xl border text-xs">
                      <p className="font-bold text-gray-800 mb-2 text-sm">{payload[0]?.payload?.fecha}</p>
                      <div className="space-y-1.5">
                        <p className="text-emerald-600 font-semibold">💰 Ventas: ${payload[0]?.payload?.ventas}K</p>
                        <p className="text-violet-600 font-semibold">⏱️ Horas: {payload[0]?.payload?.horas}h</p>
                        <div className="pt-1.5 border-t border-gray-200">
                          <p className="text-amber-600 font-black text-base">
                            ⚡ Productividad: ${payload[0]?.payload?.productividad.toLocaleString()}K/h
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="ventas" fill="url(#colorVentasPlanner)" stroke="#10b981" strokeWidth={2} name="Ventas (K)" />
                  <Bar yAxisId="right" dataKey="horas" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Horas" opacity={0.7} />
                  <Line yAxisId="left" type="monotone" dataKey="productividad" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} name="$/Hora (K)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartDescription>
              <strong>¿Qué muestra?</strong> Relaciona las horas programadas (barras moradas) con las ventas generadas (área verde). 
              La línea naranja es la <strong>productividad</strong> (ventas ÷ horas). 
              <strong>Usa esto para:</strong> Identificar días donde vendes mucho con poco personal (alta eficiencia) o viceversa (oportunidad de ajuste).
            </ChartDescription>
          </CardContent>
        </Card>
      </motion.div>

      {/* Colaboradores por Rol - NUEVO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Target className="w-5 h-5 text-violet-500" />
              </motion.div>
              Colaboradores por Estación
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">Veces que cada colaborador ha estado en cada posición</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Colaborador</th>
                    {Object.entries(ROLES_LABELS).slice(0, 9).map(([key, label]) => (
                      <th key={key} className="text-center py-2 px-1 font-medium text-[9px]" style={{ color: ROLES_COLORS[key] }}>
                        {label}
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.hoursByCashier.slice(0, 8).map((cashier, idx) => (
                    <motion.tr 
                      key={cashier.id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: 0.1 * idx }}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-2 px-2 font-medium text-gray-700">{cashier.name}</td>
                      {Object.keys(ROLES_LABELS).slice(0, 9).map(role => (
                        <td key={role} className="text-center py-2 px-1">
                          {cashier.roleCount[role] > 0 ? (
                            <motion.span 
                              whileHover={{ scale: 1.3 }}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold"
                              style={{ backgroundColor: ROLES_COLORS[role] }}
                            >
                              {cashier.roleCount[role]}
                            </motion.span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="text-center py-2 px-2 font-bold text-gray-700">{cashier.shifts}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ChartDescription>
              <strong>¿Qué muestra?</strong> Tabla de versatilidad. Cada número indica cuántas veces el colaborador trabajó en esa estación. 
              <strong>Usa esto para:</strong> Identificar quiénes son versátiles (múltiples estaciones) vs especializados. Planifica mejor en días de alta demanda asignando a los más experimentados en cada rol.
            </ChartDescription>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas por Colaborador */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Users className="w-4 h-4 text-pink-500" />
                </motion.div>
                Distribución de Horas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hoursByCashier.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                        <p className="font-bold">{payload[0].payload.fullName}</p>
                        <p className="text-pink-600">{payload[0].value} horas</p>
                        <p className="text-gray-500">{payload[0].payload.shifts} turnos</p>
                      </motion.div>
                    ) : null} />
                    <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                      {stats.hoursByCashier.slice(0, 8).map((_, i) => <Cell key={i} fill={i === 0 ? '#ec4899' : i === 1 ? '#f472b6' : '#fce7f3'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartDescription>
                <strong>¿Qué muestra?</strong> Ranking de horas trabajadas por colaborador. 
                <strong>Usa esto para:</strong> Balancear la carga laboral - evita que unos pocos trabajen mucho y otros poco. Equidad = equipo feliz.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribución por Rol */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Target className="w-4 h-4 text-violet-500" />
                </motion.div>
                Cobertura de Posiciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={stats.roleDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2} dataKey="value">
                      {stats.roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {stats.roleDistribution.map((item, i) => (
                    <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }} whileHover={{ x: 5 }} className="flex items-center gap-2 text-xs cursor-pointer">
                      <motion.div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-bold ml-auto">{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <ChartDescription>
                <strong>¿Qué muestra?</strong> Distribución de turnos por estación (caja, coneo, bebidas, etc.). 
                <strong>Usa esto para:</strong> Ver si hay estaciones sobrecargadas o desatendidas. Un balance adecuado mejora el servicio y reduce tiempos de espera.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnos por Día */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </motion.div>
                Patrón Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.shiftsByDay}>
                    <defs>
                      <linearGradient id="colorTurnosPlanner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                        <p className="font-bold text-gray-800 mb-1">{payload[0]?.payload?.day}</p>
                        <p className="text-emerald-600 font-semibold">📊 Turnos programados: {payload[0]?.value}</p>
                      </motion.div>
                    ) : null} />
                    <Area type="monotone" dataKey="turnos" stroke="#10b981" fill="url(#colorTurnosPlanner)" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ChartDescription>
                <strong>¿Qué muestra?</strong> Patrón de turnos por día de la semana. 
                <strong>Usa esto para:</strong> Identificar qué días requieren más personal (típicamente fines de semana) y ajustar la programación futura.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tendencia Semanal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </motion.div>
                Evolución por Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="turnos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} name="Turnos" />
                    <Line yAxisId="right" type="monotone" dataKey="horas" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} name="Horas" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <ChartDescription>
                <strong>¿Qué muestra?</strong> Evolución de turnos y horas totales semana a semana. 
                <strong>Usa esto para:</strong> Detectar tendencias (¿estás programando más o menos?) y planificar recursos a futuro.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Posiciones - MÁS DINÁMICO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Award className="w-5 h-5 text-yellow-500" />
              </motion.div>
              Ranking de Posiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
              {stats.topPositions.map((pos, i) => (
                <motion.div 
                  key={pos.role} 
                  whileHover={{ scale: 1.1, y: -8, rotate: 5 }} 
                  initial={{ opacity: 0, y: 30, scale: 0.8 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ delay: 0.9 + i * 0.05, type: "spring" }}
                  className="bg-gray-50 rounded-xl p-3 text-center relative cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {i === 0 && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} 
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-2 -right-2 bg-yellow-400 text-white text-[8px] px-2 py-1 rounded-full font-bold shadow"
                    >
                      🏆 #1
                    </motion.div>
                  )}
                  <motion.div 
                    className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-inner" 
                    style={{ backgroundColor: `${pos.color}20` }}
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <span className="text-2xl">{ROLES_EMOJIS[pos.role]}</span>
                  </motion.div>
                  <p className="text-[10px] font-medium text-gray-600 truncate">{pos.label}</p>
                  <motion.p 
                    className="text-xl font-black" 
                    style={{ color: pos.color }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  >
                    {pos.count}
                  </motion.p>
                </motion.div>
              ))}
            </div>
            <ChartDescription>
              <strong>¿Qué muestra?</strong> Estaciones con más turnos asignados. 
              <strong>Usa esto para:</strong> Ver dónde se concentra tu equipo y ajustar según las necesidades operativas de la tienda.
            </ChartDescription>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}