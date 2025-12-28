import React, { useState, useMemo } from 'react';
import { CalendarRange, Check, ChevronLeft, ChevronRight, Sparkles, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, subDays, isToday, startOfWeek, endOfWeek, getWeek, startOfYear, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

// Opciones rápidas de fecha
const QUICK_OPTIONS = [
{ label: 'Hoy', getValue: () => ({ from: new Date(), to: new Date() }) },
{ label: 'Ayer', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
{ label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
{ label: 'Últimos 14 días', getValue: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
{ label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
{ label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) }];


// Generador de semanas del año
function generateWeeksOfYear() {
  const now = new Date();
  const yearStart = startOfYear(now);
  const currentWeekNum = getWeek(now, { weekStartsOn: 1 });
  const weeks = [];

  for (let i = 1; i <= currentWeekNum; i++) {
    const weekStart = startOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weeks.push({
      number: i,
      start: weekStart,
      end: weekEnd > now ? now : weekEnd,
      label: `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd > now ? now : weekEnd, 'dd MMM', { locale: es })}`,
      isCurrent: i === currentWeekNum
    });
  }

  return weeks.reverse();
}

// Calendario personalizado más dinámico y bonito
function CustomCalendar({ selected, onSelect, onClose, onApply }) {
  const [currentMonth, setCurrentMonth] = useState(selected?.from || new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [tempSelection, setTempSelection] = useState(selected);
  const [showWeeks, setShowWeeks] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const months = useMemo(() => isMobile ? [currentMonth] : [currentMonth, addMonths(currentMonth, 1)], [currentMonth, isMobile]);
  const weeksOfYear = useMemo(() => generateWeeksOfYear(), []);

  const handleDayClick = (day) => {
    if (!tempSelection?.from || tempSelection.from && tempSelection.to && !selectingEnd || !selectingEnd) {
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
    setSelectedWeeks([]);
  };

  const toggleWeekSelection = (week) => {
    const isSelected = selectedWeeks.some((w) => w.number === week.number);
    let newSelection;
    if (isSelected) {
      newSelection = selectedWeeks.filter((w) => w.number !== week.number);
    } else {
      newSelection = [...selectedWeeks, week].sort((a, b) => a.number - b.number);
    }
    setSelectedWeeks(newSelection);

    if (newSelection.length > 0) {
      const from = newSelection[0].start;
      const to = newSelection[newSelection.length - 1].end;
      setTempSelection({ from, to });
      setSelectingEnd(false);
    }
  };

  const applyWeeks = () => {
    if (selectedWeeks.length > 0) {
      const from = selectedWeeks[0].start;
      const to = selectedWeeks[selectedWeeks.length - 1].end;
      onSelect({ from, to });
      onApply?.();
    }
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
      <div className={`${isMobile ? 'p-2' : 'p-3'}`}>
        <div className={`text-center font-semibold text-gray-800 ${isMobile ? 'mb-2 text-sm' : 'mb-3 text-sm'} capitalize`}>
          {format(month, 'MMMM yyyy', { locale: es })}
        </div>
        <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-2' : 'gap-1 mb-2'}`}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) =>
          <div key={i} className={`text-center ${isMobile ? 'text-[10px]' : 'text-[10px]'} text-gray-400 font-bold`}>{d}</div>
          )}
        </div>
        <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-1'}`}>
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className={`${isMobile ? 'h-8' : 'h-8'}`} />)}
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
                className={`${isMobile ? 'h-8 w-8 text-xs' : 'h-8 w-8 text-xs'} rounded-full transition-all relative flex items-center justify-center mx-auto
                  ${inRange && !start && !end ? 'bg-gradient-to-r from-pink-100 to-rose-100' : ''}
                  ${start ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md' : ''}
                  ${end && !start ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-md' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-pink-50 text-gray-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-pink-400 ring-offset-1' : ''}
                `}>

                {format(day, 'd')}
                {today && !start && !end &&
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
                }
              </motion.button>);

          })}
        </div>
      </div>);

  };

  return (
    <div className={`select-none bg-white rounded-2xl overflow-hidden shadow-xl border border-pink-100 ${isMobile ? 'h-[85vh] flex flex-col' : ''}`}>
      {/* Tabs: Calendario / Semanas */}
      <div className="flex border-b border-pink-100 flex-shrink-0">
        <button
          onClick={() => setShowWeeks(false)}
          className={`flex-1 ${isMobile ? 'py-2' : 'py-3'} text-xs font-medium transition-all ${!showWeeks ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>

          <CalendarRange className="w-4 h-4 inline mr-1" />
          Calendario
        </button>
        <button
          onClick={() => setShowWeeks(true)}
          className={`flex-1 ${isMobile ? 'py-2' : 'py-3'} text-xs font-medium transition-all ${showWeeks ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>

          <Calendar className="w-4 h-4 inline mr-1" />
          Semanas
        </button>
      </div>

      {showWeeks ? (
      <>
        {/* Vista de semanas */}
        <div className={`p-3 flex-1 overflow-y-auto`}>
          <p className="text-xs text-gray-500 mb-2 text-center">Selecciona una o más semanas</p>
          <div className={`space-y-1.5`}>
            {weeksOfYear.map((week) => {
            const isSelected = selectedWeeks.some((w) => w.number === week.number);
            return (
              <motion.button
                key={week.number}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleWeekSelection(week)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${
                isSelected ?
                'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' :
                week.isCurrent ?
                'bg-pink-50 border-2 border-pink-300 text-pink-700' :
                'bg-gray-50 hover:bg-pink-50 text-gray-700'}`
                }>

                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
                      {week.number}
                    </span>
                    <span className="font-medium">{week.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4" />}
                  {week.isCurrent && !isSelected && <span className="text-[10px] bg-pink-200 text-pink-700 px-1.5 py-0.5 rounded-full">Actual</span>}
                </motion.button>);

          })}
          </div>
        </div>
        {selectedWeeks.length > 0 && (
          <div className="p-3 border-t border-pink-100 flex-shrink-0">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={applyWeeks}
              className={`w-full ${isMobile ? 'py-4' : 'py-2'} rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white ${isMobile ? 'text-base' : 'text-xs'} font-bold shadow-lg flex items-center justify-center gap-2`}>

              <Check className={`${isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              Aplicar {selectedWeeks.length} semana{selectedWeeks.length > 1 ? 's' : ''}
            </motion.button>
          </div>
        )}
      </>
      ) :

      <>
          {/* Quick Options */}
          <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 flex-shrink-0 ${isMobile ? 'overflow-x-auto' : ''}`}>
            <div className={`flex ${isMobile ? 'gap-1.5' : 'flex-wrap gap-1.5'}`}>
              {QUICK_OPTIONS.map((opt) =>
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickSelect(opt.getValue())}
              className={`${isMobile ? 'px-2.5 py-1.5 text-[11px] whitespace-nowrap' : 'px-3 py-1.5 text-xs'} font-medium rounded-full bg-white border border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-sm`}>

                  {opt.label}
                </motion.button>
            )}
            </div>
          </div>

      {/* Navegación */}
      <div className={`flex items-center justify-between ${isMobile ? 'px-2 py-2' : 'px-4 py-3'} border-b border-gray-100 flex-shrink-0`}>
        <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-pink-50 text-pink-500">

          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <div className={`flex ${isMobile ? 'gap-2' : 'gap-6'} items-center`}>
          {months.map((m, i) =>
            <button
              key={i}
              onClick={() => setShowYearSelector(!showYearSelector)}
              className="text-sm font-bold text-gray-700 capitalize hover:text-pink-600 transition-colors">

              {format(m, isMobile ? 'MMMM yyyy' : 'MMMM', { locale: es })}
              {!isMobile && i === 0 &&
              <span className="ml-2 text-xs text-pink-600 cursor-pointer hover:underline">
                  {format(m, 'yyyy')} ▾
                </span>
              }
            </button>
            )}
        </div>
        <motion.button
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-pink-50 text-pink-500">

          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Selector de año rápido */}
      {showYearSelector &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 border-b border-gray-100 bg-pink-50">

          <div className="flex gap-2 flex-wrap justify-center">
            {[2024, 2025, 2026].map((year) =>
            <motion.button
              key={year}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setFullYear(year);
                setCurrentMonth(newMonth);
                setShowYearSelector(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentMonth.getFullYear() === year ?
              'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' :
              'bg-white text-gray-700 hover:bg-pink-100 border border-pink-200'}`
              }>

                {year}
              </motion.button>
            )}
          </div>
        </motion.div>
        }
      
      {/* Meses */}
      <div className={`flex ${isMobile ? 'overflow-y-auto flex-1' : 'divide-x divide-gray-100'}`}>
        {months.map((month, i) =>
          <div key={i} className={isMobile ? 'w-full' : ''}>{renderMonth(month)}</div>
          )}
      </div>
      
          {/* Footer */}
          <div className={`${isMobile ? 'px-2 py-2' : 'px-4 py-3'} border-t border-gray-100 bg-gray-50/50 ${isMobile ? 'flex-col space-y-2' : 'flex items-center justify-between'} flex-shrink-0`}>
            <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
              {tempSelection?.from ?
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm">

                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg font-medium text-xs">
                    {format(tempSelection.from, 'dd MMM', { locale: es })}
                  </span>
                  {tempSelection.to && !isSameDay(tempSelection.from, tempSelection.to) &&
              <>
                      <span className="text-gray-400">→</span>
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg font-medium text-xs">
                        {format(tempSelection.to, 'dd MMM', { locale: es })}
                      </span>
                    </>
              }
                </motion.div> :

            <span className="text-xs text-gray-400">Selecciona una fecha</span>
            }
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'justify-center w-full' : ''}`}>
              {selectingEnd && !isMobile &&
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-pink-500 font-medium flex items-center gap-1">

                  <Sparkles className="w-3 h-3" />
                  Selecciona fecha fin
                </motion.span>
            }
              {tempSelection?.from && !selectingEnd &&
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className={`${isMobile ? 'w-full py-3' : 'px-4 py-1.5'} rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white ${isMobile ? 'text-sm' : 'text-sm'} font-bold shadow-lg flex items-center justify-center gap-2`}>

                  <Check className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} /> Aplicar Fechas
                </motion.button>
            }
            </div>
          </div>
        </>
      }
    </div>);

}

export default function DateFilter({ dateRange, onDateChange, buttonClassName = '', buttonText = null }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getDateLabel = () => {
    if (!dateRange?.from) return 'Calendario';
    if (dateRange.from && dateRange.to && isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, 'dd MMM', { locale: es });
    }
    return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Selector de rango/día personalizado */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm" className="bg-background text-pink-700 px-3 text-xs font-medium rounded-full inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-8 gap-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 shadow-sm">


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
            onApply={() => setIsCalendarOpen(false)} />

        </PopoverContent>
      </Popover>
    </div>);

}