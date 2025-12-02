import React, { useState, useMemo } from 'react';
import { CalendarRange, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, getWeek, getYear, setWeek, startOfYear, min, max } from 'date-fns';
import { es } from 'date-fns/locale';

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

  // Manejar selección desde calendario (permite 1 día o rango) - dinámico
  const handleCalendarSelect = (range) => {
    if (range?.from) {
      onDateChange({ 
        from: range.from, 
        to: range.to || range.from 
      });
    }
  };

  const getWeeksLabel = () => {
    if (selectedWeeks.length === 0) return 'Semanas';
    if (selectedWeeks.length === 1) return `Sem ${selectedWeeks[0]}`;
    if (selectedWeeks.length <= 3) return selectedWeeks.map(w => `S${w}`).join(', ');
    return `${selectedWeeks.length} semanas`;
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
      
      {/* Selector de rango/día personalizado - dinámico */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-gray-200 hover:bg-pink-50 hover:border-pink-300"
          >
            <CalendarRange className="w-4 h-4 text-pink-500" />
            <span className="hidden md:inline">
              {dateRange.from && dateRange.to 
                ? dateRange.from.getTime() === dateRange.to.getTime()
                  ? format(dateRange.from, 'dd MMM', { locale: es })
                  : `${format(dateRange.from, 'dd/MM', { locale: es })} - ${format(dateRange.to, 'dd/MM', { locale: es })}`
                : 'Calendario'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-gray-200 rounded-xl" align="end">
          <div className="p-2 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
            <p className="text-xs text-gray-500">Selecciona fechas</p>
            {dateRange.from && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-pink-600"
                onClick={() => setIsCalendarOpen(false)}
              >
                <Check className="w-3 h-3 mr-1" /> Listo
              </Button>
            )}
          </div>
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}