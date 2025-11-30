import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWeek, startOfWeek, endOfWeek, addWeeks, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WeekFilter({ onWeekChange, currentWeek }) {
  const weekOptions = useMemo(() => {
    const weeks = [];
    const year = new Date().getFullYear();
    const yearStart = startOfYear(new Date(year, 0, 1));
    
    for (let i = 1; i <= 52; i++) {
      const weekStart = addWeeks(startOfWeek(yearStart, { weekStartsOn: 1 }), i - 1);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: i,
        label: `Sem ${i}`,
        sublabel: `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`,
        from: weekStart,
        to: weekEnd
      });
    }
    return weeks;
  }, []);

  const currentWeekNum = currentWeek || getWeek(new Date(), { weekStartsOn: 1 });

  const handleChange = (weekNum) => {
    const week = weekOptions.find(w => w.value === parseInt(weekNum));
    if (week && onWeekChange) {
      onWeekChange({ from: week.from, to: week.to, weekNum: week.value });
    }
  };

  return (
    <Select onValueChange={handleChange} defaultValue="">
      <SelectTrigger className="w-[130px] border-gray-200 bg-white text-sm">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-pink-500" />
          <SelectValue placeholder={`Sem ${currentWeekNum}`} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-60 bg-white">
        {weekOptions.map(w => (
          <SelectItem key={w.value} value={w.value.toString()} className="text-sm">
            <div className="flex flex-col">
              <span className="font-medium">{w.label}</span>
              <span className="text-xs text-gray-400">{w.sublabel}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}