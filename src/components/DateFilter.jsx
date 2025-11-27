import React, { useState } from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateFilter({ dateRange, onDateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("today");

  const presets = {
    today: { 
      label: "Hoy", 
      getValue: () => ({ from: new Date(), to: new Date() }) 
    },
    yesterday: { 
      label: "Ayer", 
      getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) 
    },
    thisWeek: { 
      label: "Esta semana", 
      getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }) 
    },
    lastWeek: { 
      label: "Semana pasada", 
      getValue: () => ({ 
        from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 
        to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) 
      }) 
    },
    thisMonth: { 
      label: "Este mes", 
      getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) 
    },
    lastMonth: { 
      label: "Mes pasado", 
      getValue: () => ({ 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      }) 
    },
  };

  const handlePresetChange = (preset) => {
    setSelectedTab(preset);
    if (preset !== "custom") {
      onDateChange(presets[preset].getValue());
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-orange-100">
        {Object.entries(presets).map(([key, { label }]) => (
          <Button
            key={key}
            variant={selectedTab === key ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePresetChange(key)}
            className={`text-xs ${selectedTab === key 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'}`}
          >
            {label}
          </Button>
        ))}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedTab("custom")}
            className={`gap-2 border-orange-200 ${selectedTab === "custom" 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-none' 
              : 'hover:bg-orange-50'}`}
          >
            <CalendarRange className="w-4 h-4" />
            <span className="hidden md:inline">
              {dateRange.from && dateRange.to 
                ? `${format(dateRange.from, 'dd/MM', { locale: es })} - ${format(dateRange.to, 'dd/MM', { locale: es })}`
                : 'Rango'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-orange-200" align="end">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range) {
                onDateChange(range);
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