import React, { useState, useMemo } from 'react';
import { CalendarRange, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, getWeek, getYear, setWeek, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateFilter({ dateRange, onDateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("week");

  // Generar opciones de semanas del año actual
  const weekOptions = useMemo(() => {
    const currentYear = getYear(new Date());
    const weeks = [];
    for (let w = 1; w <= 52; w++) {
      const weekStart = startOfWeek(setWeek(startOfYear(new Date(currentYear, 0, 1)), w, { weekStartsOn: 1 }), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: w.toString(),
        label: `Semana ${w}`,
        range: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
        from: weekStart,
        to: weekEnd
      });
    }
    return weeks;
  }, []);

  const currentWeek = getWeek(new Date(), { weekStartsOn: 1 });

  const handleWeekChange = (weekNum) => {
    const weekData = weekOptions.find(w => w.value === weekNum);
    if (weekData) {
      onDateChange({ from: weekData.from, to: weekData.to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Selector de Semanas */}
      <Select defaultValue={currentWeek.toString()} onValueChange={handleWeekChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-pink-300">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-pink-500" />
            <SelectValue placeholder="Seleccionar semana" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {weekOptions.map((week) => (
            <SelectItem key={week.value} value={week.value}>
              <div className="flex flex-col">
                <span className="font-medium">{week.label}</span>
                <span className="text-xs text-gray-400">{week.range}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Selector de rango personalizado */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedTab("custom")}
            className={`gap-2 border-gray-200 ${selectedTab === "custom" 
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none' 
              : 'hover:bg-pink-50 hover:border-pink-300'}`}
          >
            <CalendarRange className="w-4 h-4" />
            <span className="hidden md:inline">
              {dateRange.from && dateRange.to 
                ? `${format(dateRange.from, 'dd/MM', { locale: es })} - ${format(dateRange.to, 'dd/MM', { locale: es })}`
                : 'Personalizado'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-gray-200 rounded-xl" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range) {
                onDateChange(range);
                setSelectedTab("custom");
              }
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}