import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, getWeek, getYear } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WeekFilter({ selectedWeek, onWeekChange }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekData = useMemo(() => {
    const baseDate = weekOffset === 0 ? new Date() : (weekOffset < 0 ? subWeeks(new Date(), Math.abs(weekOffset)) : addWeeks(new Date(), weekOffset));
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
    const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
    const year = getYear(weekStart);

    return {
      weekNum,
      year,
      start: weekStart,
      end: weekEnd,
      label: `Semana ${weekNum}`,
      dateRange: `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`
    };
  }, [weekOffset]);

  const handlePrevWeek = () => {
    const newOffset = weekOffset - 1;
    setWeekOffset(newOffset);
    const baseDate = subWeeks(new Date(), Math.abs(newOffset));
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
    onWeekChange?.({ from: weekStart, to: weekEnd, weekNum: getWeek(weekStart, { weekStartsOn: 1 }) });
  };

  const handleNextWeek = () => {
    if (weekOffset >= 0) return;
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    const baseDate = newOffset === 0 ? new Date() : subWeeks(new Date(), Math.abs(newOffset));
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
    onWeekChange?.({ from: weekStart, to: weekEnd, weekNum: getWeek(weekStart, { weekStartsOn: 1 }) });
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    onWeekChange?.({ from: weekStart, to: weekEnd, weekNum: getWeek(weekStart, { weekStartsOn: 1 }) });
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="h-8 w-8 rounded-full border-violet-200 hover:border-violet-400 hover:bg-violet-50"
        >
          <ChevronLeft className="w-4 h-4 text-violet-500" />
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 cursor-pointer"
        onClick={handleCurrentWeek}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <div className="text-center">
            <motion.p 
              key={currentWeekData.weekNum}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-sm font-bold text-violet-700"
            >
              {currentWeekData.label}
            </motion.p>
            <p className="text-[10px] text-violet-500">{currentWeekData.dateRange}</p>
          </div>
        </div>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          disabled={weekOffset >= 0}
          className="h-8 w-8 rounded-full border-violet-200 hover:border-violet-400 hover:bg-violet-50 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-violet-500" />
        </Button>
      </motion.div>

      {weekOffset !== 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCurrentWeek}
          className="text-xs text-violet-500 hover:text-violet-700 font-medium"
        >
          Hoy
        </motion.button>
      )}
    </div>
  );
}