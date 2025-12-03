import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, subWeeks, getWeek, getYear, startOfYear, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WeekFilter({ selectedWeek, onWeekChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWeekData, setSelectedWeekData] = useState(null);

  // Generar lista de semanas del año
  const weeksOfYear = useMemo(() => {
    const year = new Date().getFullYear();
    const start = startOfYear(new Date(year, 0, 1));
    const end = new Date();
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
      return {
        weekNum,
        year: getYear(weekStart),
        start: weekStart,
        end: weekEnd,
        label: `Semana ${weekNum}`,
        dateRange: `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`,
        isCurrent: getWeek(new Date(), { weekStartsOn: 1 }) === weekNum
      };
    }).reverse();
  }, []);

  const handleSelectWeek = (week) => {
    setSelectedWeekData(week);
    onWeekChange?.({ from: week.start, to: week.end, weekNum: week.weekNum });
    setIsOpen(false);
  };

  const currentLabel = selectedWeekData 
    ? `Sem ${selectedWeekData.weekNum}` 
    : 'Semana';

  const currentRange = selectedWeekData?.dateRange || 'Seleccionar';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            variant="outline" 
            className="gap-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-full shadow-sm bg-white/80 min-w-[180px]"
          >
            <Calendar className="w-4 h-4 text-pink-500" />
            <div className="text-left">
              <span className="font-bold text-pink-600">{currentLabel}</span>
              <span className="text-xs text-gray-500 ml-2">{currentRange}</span>
            </div>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 border-0 shadow-xl" align="start">
        <div className="bg-white rounded-2xl overflow-hidden border border-pink-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 text-white">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-bold">Seleccionar Semana</span>
            </div>
            <p className="text-xs text-white/80 mt-1">Año {new Date().getFullYear()}</p>
          </div>

          {/* Lista de semanas */}
          <div className="max-h-64 overflow-y-auto p-2">
            {weeksOfYear.map((week, idx) => (
              <motion.button
                key={week.weekNum}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleSelectWeek(week)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl mb-1 transition-all ${
                  selectedWeekData?.weekNum === week.weekNum
                    ? 'bg-gradient-to-r from-pink-100 to-rose-100 border-2 border-pink-300'
                    : week.isCurrent
                      ? 'bg-pink-50 border border-pink-200 hover:border-pink-300'
                      : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${
                      selectedWeekData?.weekNum === week.weekNum ? 'text-pink-600' : 'text-gray-700'
                    }`}>
                      {week.label}
                    </span>
                    {week.isCurrent && (
                      <span className="px-1.5 py-0.5 bg-pink-500 text-white text-[9px] rounded-full font-bold">
                        HOY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{week.dateRange}</span>
                </div>
                {selectedWeekData?.weekNum === week.weekNum && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedWeekData(null);
                onWeekChange?.(null);
                setIsOpen(false);
              }}
              className="w-full text-gray-500 hover:text-pink-600"
            >
              Limpiar filtro
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}