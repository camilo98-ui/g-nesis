import React, { useState, useMemo } from 'react';
import { CalendarRange, Calendar as CalendarIcon, X, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, getWeek, getYear, setWeek, startOfYear, min, max, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isSameMonth, addMonths, subMonths, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Calendario personalizado más dinámico
function CustomCalendar({ selected, onSelect, numberOfMonths = 2 }) {
  const [currentMonth, setCurrentMonth] = useState(selected?.from || new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < numberOfMonths; i++) {
      result.push(addMonths(currentMonth, i));
    }
    return result;
  }, [currentMonth, numberOfMonths]);

  const handleDayClick = (day) => {
    if (!selected?.from || (selected.from && selected.to) || !selectingEnd) {
      // Iniciar nueva selección
      onSelect({ from: day, to: day });
      setSelectingEnd(true);
    } else {
      // Completar selección
      if (day < selected.from) {
        onSelect({ from: day, to: selected.from });
      } else {
        onSelect({ from: selected.from, to: day });
      }
      setSelectingEnd(false);
    }
  };

  const handleDayHover = (day) => {
    if (selectingEnd && selected?.from) {
      setHoverDate(day);
    }
  };

  const isInRange = (day) => {
    if (!selected?.from) return false;
    
    const endDate = selectingEnd && hoverDate ? hoverDate : selected.to;
    if (!endDate) return false;
    
    const start = selected.from < endDate ? selected.from : endDate;
    const end = selected.from < endDate ? endDate : selected.from;
    
    return isWithinInterval(day, { start, end });
  };

  const isStart = (day) => selected?.from && isSameDay(day, selected.from);
  const isEnd = (day) => {
    if (selectingEnd && hoverDate) return isSameDay(day, hoverDate);
    return selected?.to && isSameDay(day, selected.to);
  };

  const renderMonth = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Obtener día de la semana del primer día (0=dom, 1=lun...)
    const startDay = monthStart.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1; // Ajustar para que lunes sea el primer día
    
    return (
      <div className="p-2">
        <div className="text-center font-medium text-gray-700 mb-2 capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {/* Espacios vacíos para alinear */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {days.map((day) => {
            const inRange = isInRange(day);
            const start = isStart(day);
            const end = isEnd(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => handleDayHover(day)}
                className={`h-8 w-full text-xs rounded-md transition-all relative
                  ${inRange && !start && !end ? 'bg-pink-100' : ''}
                  ${start || end ? 'bg-pink-500 text-white font-bold' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-pink-50' : ''}
                  ${isToday && !start && !end ? 'ring-1 ring-pink-300' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="select-none">
      {/* Navegación */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-4">
          {months.map((m, i) => (
            <span key={i} className="text-sm font-medium text-gray-600 capitalize">
              {format(m, 'MMM yyyy', { locale: es })}
            </span>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Meses */}
      <div className="flex">
        {months.map((month, i) => (
          <div key={i} className={i > 0 ? 'border-l' : ''}>
            {renderMonth(month)}
          </div>
        ))}
      </div>
      
      {/* Footer con selección actual */}
      <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {selected?.from && (
            <>
              {format(selected.from, 'dd MMM', { locale: es })}
              {selected.to && !isSameDay(selected.from, selected.to) && (
                <> → {format(selected.to, 'dd MMM', { locale: es })}</>
              )}
            </>
          )}
          {!selected?.from && 'Clic para seleccionar'}
        </span>
        {selectingEnd && <span className="text-pink-500">Selecciona fecha fin</span>}
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
      {/* Selector de Semanas Multi-select */}
      <Popover open={isWeekOpen} onOpenChange={setIsWeekOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-gray-200 hover:border-pink-300 min-w-[140px]"
          >
            <CalendarIcon className="w-4 h-4 text-pink-500" />
            <span>{getWeeksLabel()}</span>
            {selectedWeeks.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-pink-100 text-pink-600">
                {selectedWeeks.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-3 bg-white" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Seleccionar semanas</p>
              {selectedWeeks.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearWeeks} className="h-7 text-xs text-gray-500">
                  <X className="w-3 h-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-1.5 max-h-[240px] overflow-y-auto pr-1">
              {weekOptions.map((week) => {
                const isSelected = selectedWeeks.includes(week.value);
                const isCurrent = week.value === currentWeek;
                return (
                  <button
                    key={week.value}
                    onClick={() => handleWeekToggle(week.value)}
                    className={`p-2 text-xs rounded-lg border transition-all ${
                      isSelected 
                        ? 'bg-pink-500 text-white border-pink-500' 
                        : isCurrent
                          ? 'bg-pink-50 border-pink-300 text-pink-600'
                          : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                    }`}
                  >
                    <div className="font-medium">S{week.value}</div>
                    <div className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {format(week.from, 'dd/MM')}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedWeeks.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {selectedWeeks.length} semana{selectedWeeks.length > 1 ? 's' : ''} seleccionada{selectedWeeks.length > 1 ? 's' : ''}
                  </span>
                </div>
                <Button 
                  onClick={applySelectedWeeks} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" /> Aplicar
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Selector de rango/día personalizado - más dinámico */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-gray-200 hover:bg-pink-50 hover:border-pink-300"
          >
            <CalendarRange className="w-4 h-4 text-pink-500" />
            <span className="hidden md:inline">{getDateLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-gray-200 rounded-xl" align="end">
          <CustomCalendar
            selected={dateRange}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
          <div className="p-2 border-t flex justify-end">
            <Button 
              size="sm" 
              className="bg-pink-500 hover:bg-pink-600 text-white"
              onClick={() => setIsCalendarOpen(false)}
            >
              <Check className="w-3 h-3 mr-1" /> Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}