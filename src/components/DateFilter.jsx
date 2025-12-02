import React, { useState, useMemo } from 'react';
import { CalendarRange, Calendar as CalendarIcon, X, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, getWeek, getYear, setWeek, startOfYear, min, max, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isSameMonth, addMonths, subMonths, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Opciones rápidas de fecha
const QUICK_OPTIONS = [
  { label: 'Hoy', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Ayer', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Últimos 14 días', getValue: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
  { label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
];

// Calendario personalizado más dinámico y bonito
function CustomCalendar({ selected, onSelect, onClose, onApply }) {
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
                  ${inRange && !start && !end ? 'bg-gradient-to-r from-pink-100 to-rose-100' : ''}
                  ${start ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md' : ''}
                  ${end && !start ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-md' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-pink-50 text-gray-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-pink-400 ring-offset-1' : ''}
                `}
              >
                {format(day, 'd')}
                {today && !start && !end && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="select-none bg-white rounded-2xl overflow-hidden shadow-xl border border-pink-100">
      {/* Quick Options */}
      <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_OPTIONS.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelect(opt.getValue());
                setSelectingEnd(false);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-sm"
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <motion.button 
          whileHover={{ scale: 1.1, x: -2 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-pink-50 text-pink-500"
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
          className="p-1.5 rounded-full hover:bg-pink-50 text-pink-500"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
      
      {/* Meses */}
      <div className="flex divide-x divide-gray-100">
        {months.map((month, i) => (
          <div key={i}>{renderMonth(month)}</div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected?.from ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg font-medium">
                {format(selected.from, 'dd MMM', { locale: es })}
              </span>
              {selected.to && !isSameDay(selected.from, selected.to) && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg font-medium">
                    {format(selected.to, 'dd MMM', { locale: es })}
                  </span>
                </>
              )}
            </motion.div>
          ) : (
            <span className="text-xs text-gray-400">Selecciona una fecha</span>
          )}
        </div>
        {selectingEnd && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-pink-500 font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Selecciona fecha fin
          </motion.span>
        )}
      </div>
    </div>
  );
}

export default function DateFilter({ dateRange, onDateChange }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isWeekOpen, setIsWeekOpen] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  // Generar opciones de semanas del año actual
  const weekOptions = useMemo(() => {
    const currentYear = getYear(new Date());
    const weeks = [];
    for (let w = 1; w <= 52; w++) {
      const weekStart = startOfWeek(setWeek(startOfYear(new Date(currentYear, 0, 1)), w, { weekStartsOn: 1 }), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: w,
        label: `Sem ${w}`,
        range: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
        from: weekStart,
        to: weekEnd
      });
    }
    return weeks;
  }, []);

  const currentWeek = getWeek(new Date(), { weekStartsOn: 1 });

  const handleWeekToggle = (weekNum) => {
    setSelectedWeeks(prev => {
      if (prev.includes(weekNum)) {
        return prev.filter(w => w !== weekNum);
      } else {
        return [...prev, weekNum].sort((a, b) => a - b);
      }
    });
  };

  const applySelectedWeeks = () => {
    if (selectedWeeks.length === 0) return;
    
    const selectedWeeksData = selectedWeeks.map(w => weekOptions.find(opt => opt.value === w));
    const allFromDates = selectedWeeksData.map(w => w.from);
    const allToDates = selectedWeeksData.map(w => w.to);
    
    onDateChange({ 
      from: min(allFromDates), 
      to: max(allToDates) 
    });
    setIsWeekOpen(false);
  };

  const clearWeeks = () => {
    setSelectedWeeks([]);
  };

  const getWeeksLabel = () => {
    if (selectedWeeks.length === 0) return 'Semanas';
    if (selectedWeeks.length === 1) return `Sem ${selectedWeeks[0]}`;
    if (selectedWeeks.length <= 3) return selectedWeeks.map(w => `S${w}`).join(', ');
    return `${selectedWeeks.length} semanas`;
  };

  const getDateLabel = () => {
    if (!dateRange?.from) return 'Calendario';
    if (dateRange.from && dateRange.to && isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, 'dd MMM', { locale: es });
    }
    return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Selector de Semanas Multi-select - Diseño mejorado */}
      <Popover open={isWeekOpen} onOpenChange={setIsWeekOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 min-w-[130px] rounded-full shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 text-pink-500" />
              <span className="font-medium">{getWeeksLabel()}</span>
              {selectedWeeks.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                  {selectedWeeks.length}
                </Badge>
              )}
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 bg-white rounded-2xl shadow-xl border border-pink-100" align="start">
          <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-pink-500" />
                Seleccionar semanas
              </p>
              {selectedWeeks.length > 0 && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearWeeks} 
                  className="text-xs text-gray-500 hover:text-pink-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar
                </motion.button>
              )}
            </div>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {weekOptions.map((week) => {
                const isSelected = selectedWeeks.includes(week.value);
                const isCurrent = week.value === currentWeek;
                return (
                  <motion.button
                    key={week.value}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWeekToggle(week.value)}
                    className={`p-2 text-xs rounded-xl border-2 transition-all shadow-sm ${
                      isSelected 
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white border-pink-500 shadow-md' 
                        : isCurrent
                          ? 'bg-pink-50 border-pink-400 text-pink-600'
                          : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50 bg-white'
                    }`}
                  >
                    <div className="font-bold">S{week.value}</div>
                    <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {format(week.from, 'dd/MM')}
                    </div>
                    {isCurrent && !isSelected && (
                      <div className="text-[8px] text-pink-500 font-medium">actual</div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {selectedWeeks.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 border-t border-pink-100 bg-gray-50/50 rounded-b-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 font-medium">
                    {selectedWeeks.length} semana{selectedWeeks.length > 1 ? 's' : ''} seleccionada{selectedWeeks.length > 1 ? 's' : ''}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={applySelectedWeeks} 
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Aplicar selección
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
      
      {/* Selector de rango/día personalizado - Diseño premium */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-full shadow-sm"
            >
              <CalendarRange className="w-4 h-4 text-pink-500" />
              <span className="font-medium">{getDateLabel()}</span>
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="end">
          <CustomCalendar
            selected={dateRange}
            onSelect={onDateChange}
            onClose={() => setIsCalendarOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex justify-end"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCalendarOpen(false)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium text-sm shadow-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Aplicar
            </motion.button>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}