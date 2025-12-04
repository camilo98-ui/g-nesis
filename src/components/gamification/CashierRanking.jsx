import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Crown, Medal, TrendingUp, TrendingDown, 
  ChevronRight, ChevronLeft, Check, Sparkles, CalendarRange, Eye
} from 'lucide-react';
import { ViewProfileButton } from '@/components/cashier/CashierFullProfile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const PODIUM_COLORS = ['from-pink-400 to-rose-500', 'from-gray-300 to-slate-400', 'from-amber-400 to-orange-500'];
const PODIUM_ICONS = [Crown, Medal, Medal];

// Calendario personalizado para ranking
function RankingCalendar({ selected, onSelect, onApply }) {
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
    { label: 'Esta semana', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }) },
    { label: 'Semana pasada', getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
    { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    { label: 'Mes pasado', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  ];

  const renderMonth = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;

    return (
      <div className="p-3">
        <div className="text-center font-semibold text-gray-700 mb-3 capitalize text-sm">
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
                  ${inRange && !start && !end ? 'bg-gradient-to-r from-amber-100 to-yellow-100' : ''}
                  ${start ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white font-bold shadow-md' : ''}
                  ${end && !start ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white font-bold shadow-md' : ''}
                  ${!inRange && !start && !end ? 'hover:bg-amber-50 text-gray-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
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
    <div className="select-none bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-100">
      <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickSelect(opt.getValue())}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-amber-200 text-amber-600 hover:bg-amber-400 hover:text-white hover:border-amber-400 transition-all shadow-sm"
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-full hover:bg-amber-50 text-amber-500"
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
          className="p-1.5 rounded-full hover:bg-amber-50 text-amber-500"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="flex divide-x divide-gray-100">
        {months.map((month, i) => (
          <div key={i}>{renderMonth(month)}</div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tempSelection?.from ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                {format(tempSelection.from, 'dd MMM', { locale: es })}
              </span>
              {tempSelection.to && !isSameDay(tempSelection.from, tempSelection.to) && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
                    {format(tempSelection.to, 'dd MMM', { locale: es })}
                  </span>
                </>
              )}
            </motion.div>
          ) : (
            <span className="text-xs text-gray-400">Selecciona fechas</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectingEnd && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-amber-500 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Fecha fin
            </motion.span>
          )}
          {tempSelection?.from && !selectingEnd && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs font-medium shadow-md flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> OK
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CashierRanking({ storeId, onSelectCashier }) {
  const [period, setPeriod] = useState('weekly');
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: new Date()
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Calcular ranking
  const ranking = useMemo(() => {
    const filteredRecords = shiftRecords.filter(r => {
      const d = new Date(r.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    const cashierStats = {};
    cashiers.filter(c => c.is_active !== false).forEach(c => {
      const records = filteredRecords.filter(r => r.cashier_id === c.id);
      const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
      const totalTransactions = records.reduce((sum, r) => sum + (r.transactions || 0), 0);
      const totalSuggested = records.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
      const daysWorked = records.length;

      cashierStats[c.id] = {
        ...c,
        totalSales,
        totalTransactions,
        totalSuggested,
        daysWorked,
        avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        avgDaily: daysWorked > 0 ? totalSales / daysWorked : 0
      };
    });

    return Object.values(cashierStats)
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashiers, shiftRecords, dateRange]);

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val/1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'weekly') {
      setDateRange({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: new Date()
      });
    } else {
      setDateRange({
        from: startOfMonth(new Date()),
        to: new Date()
      });
    }
  };

  const getDateLabel = () => {
    if (isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, 'dd MMM', { locale: es });
    }
    return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM', { locale: es })}`;
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-pink-50/70 via-rose-50/50 to-amber-50/30 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-6 h-6 text-pink-500" />
            </motion.div>
            <motion.span
              className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
            >
              Ranking
            </motion.span>
          </CardTitle>
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList className="bg-white/60">
              <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                Mensual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Selector de fecha con calendario - posicionado a la derecha */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-full shadow-sm bg-white/80"
                >
                  <CalendarRange className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-pink-600">{getDateLabel()}</span>
                </Button>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="center">
              <RankingCalendar
                selected={dateRange}
                onSelect={setDateRange}
                onApply={() => setIsCalendarOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Podio Top 3 */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-6 h-36">
            {[1, 0, 2].map((podiumIdx) => {
              const cashier = ranking[podiumIdx];
              if (!cashier) return null;
              const Icon = PODIUM_ICONS[podiumIdx];
              const height = podiumIdx === 0 ? 'h-32' : podiumIdx === 1 ? 'h-24' : 'h-20';
              
              return (
                <motion.div
                  key={cashier.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: podiumIdx * 0.1, type: "spring" }}
                  whileHover={{ y: -5 }}
                  onClick={() => onSelectCashier?.(cashier)}
                  className="flex flex-col items-center cursor-pointer"
                >
                  {/* Avatar */}
                  <motion.div
                    animate={podiumIdx === 0 ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${PODIUM_COLORS[podiumIdx]} flex items-center justify-center mb-2 shadow-lg border-2 border-white`}
                  >
                    <Icon className="w-6 h-6 text-white drop-shadow" />
                  </motion.div>
                  
                  {/* Nombre */}
                  <p className="text-xs font-bold text-center mb-1 truncate w-20 text-gray-700">
                    {cashier.name?.split(' ')[0]}
                  </p>
                  
                  {/* Ventas animadas */}
                  <motion.p 
                    className="text-[10px] text-pink-600 font-bold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatCurrency(cashier.totalSales)}
                  </motion.p>
                  
                  {/* Podio */}
                  <div className={`${height} w-16 bg-gradient-to-t ${PODIUM_COLORS[podiumIdx]} rounded-t-lg mt-2 flex items-center justify-center shadow-lg`}>
                    <motion.span 
                      className="text-2xl font-black text-white/90"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: podiumIdx * 0.2 }}
                    >
                      {podiumIdx + 1}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Lista del resto */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {ranking.slice(3).map((cashier, idx) => (
            <motion.div
              key={cashier.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 5, backgroundColor: 'rgba(236, 72, 153, 0.1)' }}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors bg-white/50"
            >
              <motion.span 
                className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 text-center text-xs font-black text-pink-700 flex items-center justify-center shadow-sm"
                whileHover={{ scale: 1.1 }}
              >
                #{cashier.rank}
              </motion.span>
              <div className="flex-1" onClick={() => onSelectCashier?.(cashier)}>
                <p className="text-sm font-medium text-gray-700">{cashier.name}</p>
                <p className="text-xs text-gray-400">{cashier.daysWorked} turnos</p>
              </div>
              <div className="text-right mr-2" onClick={() => onSelectCashier?.(cashier)}>
                <motion.p 
                  className="text-sm font-bold text-pink-600"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {formatCurrency(cashier.totalSales)}
                </motion.p>
                <p className="text-[10px] text-pink-400">
                  Ticket: {formatCurrency(cashier.avgTicket)}
                </p>
              </div>
              <ViewProfileButton 
                cashier={cashier}
                stats={cashier}
                storeId={storeId}
                teamStats={{
                  avgSales: ranking.reduce((s, c) => s + c.totalSales, 0) / ranking.length,
                  avgTicket: ranking.reduce((s, c) => s + c.avgTicket, 0) / ranking.length,
                  avgSuggested: ranking.reduce((s, c) => s + c.totalSuggested, 0) / ranking.length
                }}
              />
            </motion.div>
          ))}
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin datos para este período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}