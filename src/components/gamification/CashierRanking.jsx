import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Crown, Medal, TrendingUp, TrendingDown, 
  ChevronRight, ChevronLeft, Check, Sparkles, CalendarRange, Edit2
} from 'lucide-react';
import AnimatedAvatar from '@/components/cashier/AnimatedAvatar';
import WeekFilter from '@/components/dashboard/WeekFilter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const PODIUM_COLORS = ['from-pink-200 to-rose-300', 'from-violet-200 to-purple-300', 'from-amber-200 to-orange-300'];
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
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [weekFilter, setWeekFilter] = useState(null);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Calcular ranking con score de gestión integral
  const ranking = useMemo(() => {
    const activeRange = weekFilter || dateRange;
    const filteredRecords = shiftRecords.filter(r => {
      try {
        const d = new Date(r.date);
        if (isNaN(d.getTime())) return false;
        return d >= activeRange.from && d <= activeRange.to;
      } catch {
        return false;
      }
    });

    const cashierStats = {};
    cashiers.filter(c => c.is_active !== false).forEach(c => {
      const records = filteredRecords.filter(r => r.cashier_id === c.id);
      const allRecords = shiftRecords.filter(r => r.cashier_id === c.id);
      const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
      const totalTickets = records.reduce((sum, r) => sum + (r.tickets || 0), 0);
      const totalTransactions = records.reduce((sum, r) => sum + (r.transactions || 0), 0);
      const totalSuggested = records.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
      const daysWorked = records.length;
      
      const historicalSales = allRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
      const historicalTickets = allRecords.reduce((sum, r) => sum + (r.tickets || 0), 0);
      const historicalDays = allRecords.length;
      const historicalTransactions = allRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
      
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const avgDaily = daysWorked > 0 ? totalSales / daysWorked : 0;
      const historicalAvgTicket = historicalTransactions > 0 ? historicalSales / historicalTransactions : 0;
      const historicalAvgDaily = historicalDays > 0 ? historicalSales / historicalDays : 0;

      // Score de gestión integral: ticket promedio (40%) + ventas (40%) + transacciones (20%)
      const managementScore = (avgTicket * 0.4) + (totalSales * 0.4) + (totalTransactions * 0.2);
      
      cashierStats[c.id] = {
        ...c,
        totalSales,
        totalTickets,
        totalTransactions,
        totalSuggested,
        daysWorked,
        avgTicket,
        avgDaily,
        managementScore,
        hasData: daysWorked > 0,
        historicalSales,
        historicalTickets,
        historicalDays,
        historicalTransactions,
        historicalAvgTicket,
        historicalAvgDaily
      };
    });

    // Ordenar por score de gestión integral
    return Object.values(cashierStats)
      .sort((a, b) => b.managementScore - a.managementScore)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashiers, shiftRecords, dateRange, weekFilter]);

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${Math.round(val/1000000)}M`;
    if (val >= 1000) return `$${Math.round(val/1000)}K`;
    return `$${Math.round(val)}`;
  };

  const getDateLabel = () => {
    const activeRange = weekFilter || dateRange;
    if (isSameDay(activeRange.from, activeRange.to)) {
      return format(activeRange.from, 'dd MMM', { locale: es });
    }
    return `${format(activeRange.from, 'dd MMM', { locale: es })} - ${format(activeRange.to, 'dd MMM', { locale: es })}`;
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-white via-pink-50/30 to-rose-50/20 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
          
          {/* Filtros de fecha */}
          <div className="flex items-center gap-2">
            <WeekFilter onWeekChange={(range) => { setWeekFilter(range); }} />
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
                  onSelect={(range) => { setDateRange(range); setWeekFilter(null); }}
                  onApply={() => setIsCalendarOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Podio Top 3 - Profesional */}
        {ranking.length >= 3 && (
          <div className="relative mb-8">
            {/* Base del podio */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-100 via-purple-100 to-amber-100 rounded-full" />

            <div className="flex items-end justify-center gap-4 pt-4">
              {[1, 0, 2].map((podiumIdx) => {
                const cashier = ranking[podiumIdx];
                if (!cashier) return null;
                const Icon = PODIUM_ICONS[podiumIdx];
                const heights = ['h-72', 'h-48', 'h-40'];
                const height = heights[podiumIdx];
                const isFirst = podiumIdx === 0;
                const isSecond = podiumIdx === 1;
                const isThird = podiumIdx === 2;
                
                return (
                  <motion.div
                    key={cashier.id}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: podiumIdx * 0.2, type: "spring", stiffness: 120 }}
                    whileHover={{ y: -12, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectCashier?.(cashier)}
                    className="flex flex-col items-center cursor-pointer relative group"
                    style={{ zIndex: isFirst ? 20 : 10 }}
                  >
                    {/* Efectos especiales para el primero */}
                    {isFirst && (
                      <>
                        {/* Corona flotante */}
                        <motion.div
                          animate={{ 
                            y: [0, -8, 0], 
                            rotate: [-8, 8, -8],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute -top-10 text-5xl"
                        >
                          👑
                        </motion.div>
                        
                        {/* Partículas brillantes */}
                        <motion.div
                          animate={{ 
                            opacity: [0.4, 1, 0.4],
                            scale: [0.8, 1.2, 0.8]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-6 -left-6 text-2xl"
                        >
                          ✨
                        </motion.div>
                        <motion.div
                          animate={{ 
                            opacity: [0.4, 1, 0.4],
                            scale: [0.8, 1.2, 0.8]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                          className="absolute -top-6 -right-6 text-2xl"
                        >
                          ⭐
                        </motion.div>
                      </>
                    )}

                    {/* Medallas para segundo y tercero */}
                    {isSecond && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-6 text-3xl"
                      >
                        🥈
                      </motion.div>
                    )}
                    {isThird && (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-6 text-3xl"
                      >
                        🥉
                      </motion.div>
                    )}
                    
                    {/* Avatar con anillo pulsante */}
                    <div className="relative mb-3">
                      <motion.div
                        animate={isFirst ? {
                          boxShadow: [
                            '0 0 0 0 rgba(236, 72, 153, 0)',
                            '0 0 0 8px rgba(236, 72, 153, 0.2)',
                            '0 0 0 0 rgba(236, 72, 153, 0)'
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="rounded-full"
                      >
                        <AnimatedAvatar 
                          cashier={cashier} 
                          size={isFirst ? 'large' : 'medium'}
                        />
                      </motion.div>
                      
                      {/* Badge de posición mejorado */}
                      <motion.div 
                        animate={isFirst ? { 
                          rotate: [0, 360],
                          scale: [1, 1.15, 1]
                        } : {}}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${isFirst ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-gradient-to-br ${PODIUM_COLORS[podiumIdx]} shadow-2xl flex items-center justify-center border-4 border-white`}
                      >
                        <span className={`${isFirst ? 'text-lg' : 'text-sm'} font-black text-white drop-shadow-md`}>
                          {podiumIdx + 1}
                        </span>
                      </motion.div>
                    </div>
                    
                    {/* Nombre y Score */}
                    <p className={`${isFirst ? 'text-base' : 'text-sm'} font-black text-center mb-2 w-28 text-gray-900`}>
                      {cashier.name?.split(' ').slice(0, 2).join(' ')}
                    </p>
                    
                    {/* Score Total - DESTACADO */}
                    <motion.div
                      animate={isFirst ? { 
                        scale: [1, 1.08, 1],
                        y: [0, -2, 0]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`${isFirst ? 'mb-3' : 'mb-2'} px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border-2 ${
                        isFirst ? 'border-pink-300' : isSecond ? 'border-purple-300' : 'border-amber-300'
                      }`}
                    >
                      <p className={`${isFirst ? 'text-xs' : 'text-[10px]'} font-medium text-gray-500`}>SCORE</p>
                      <p className={`${isFirst ? 'text-2xl' : 'text-lg'} font-black bg-gradient-to-r ${PODIUM_COLORS[podiumIdx]} bg-clip-text text-transparent`}>
                        {cashier.overallScore?.toFixed(0) || '0'}
                      </p>
                    </motion.div>
                    
                    {/* Métricas compactas */}
                    <div className="space-y-1 mb-2">
                      <div className={`flex items-center gap-1.5 ${isFirst ? 'text-xs' : 'text-[10px]'} font-bold`}>
                        <span className="text-emerald-600">💰</span>
                        <span className="text-gray-700">{formatCurrency(cashier.totalSales)}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isFirst ? 'text-xs' : 'text-[10px]'} font-bold`}>
                        <span className="text-blue-600">🎫</span>
                        <span className="text-gray-700">{formatCurrency(cashier.avgTicket)}</span>
                      </div>
                      {cashier.totalSuggested > 0 && (
                        <div className={`flex items-center gap-1.5 ${isFirst ? 'text-xs' : 'text-[10px]'} font-bold`}>
                          <span className="text-pink-600">🎁</span>
                          <span className="text-gray-700">{cashier.totalSuggested}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Columna del podio mejorada */}
                    <motion.div 
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.6 + podiumIdx * 0.15, type: "spring", damping: 15 }}
                      className={`${height} ${isFirst ? 'w-28' : 'w-24'} bg-gradient-to-t ${PODIUM_COLORS[podiumIdx]} rounded-t-3xl mt-3 flex flex-col items-center justify-end pb-4 shadow-2xl relative overflow-hidden border-t-4 ${
                        isFirst ? 'border-pink-400' : isSecond ? 'border-purple-400' : 'border-amber-400'
                      }`}
                      style={{ transformOrigin: 'bottom' }}
                    >
                      {/* Efecto brillante dinámico */}
                      <motion.div
                        animate={{ x: ['-150%', '250%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                      />
                      
                      {/* Confetti para el primero */}
                      {isFirst && (
                        <>
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              opacity: [0.6, 1, 0.6]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="absolute top-4 left-4 text-2xl"
                          >
                            ⭐
                          </motion.div>
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              opacity: [0.6, 1, 0.6]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            className="absolute top-4 right-4 text-2xl"
                          >
                            💫
                          </motion.div>
                        </>
                      )}
                      
                      {/* Icono del rango */}
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: isFirst ? 4 : 6, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity }
                        }}
                        className={`${isFirst ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white/50 relative z-10`}
                      >
                        <Icon className={`${isFirst ? 'w-7 h-7' : 'w-5 h-5'} text-gray-700`} />
                      </motion.div>

                      {/* Texto en la columna */}
                      <p className={`${isFirst ? 'text-xs' : 'text-[10px]'} text-white/90 font-black mt-2 uppercase tracking-wider relative z-10`}>
                        {isFirst ? '¡Campeón!' : isSecond ? 'Subcampeón' : 'Tercer Lugar'}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
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
              whileHover={{ x: 5, scale: 1.01 }}
              onClick={() => onSelectCashier?.(cashier)}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all bg-gradient-to-r from-white to-pink-50/30 hover:shadow-md border border-pink-100/50"
            >
              <AnimatedAvatar 
                cashier={cashier} 
                size="small"
                showRank
                rank={cashier.rank}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{cashier.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>💼 {cashier.hasData ? cashier.daysWorked : cashier.historicalDays} turnos</span>
                </div>
              </div>
              <div className="text-right">
                <motion.p 
                  className="text-base font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Ticket: {formatCurrency(cashier.hasData ? cashier.avgTicket : cashier.historicalAvgTicket)}
                </motion.p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  💰 {formatCurrency(cashier.hasData ? cashier.totalSales : cashier.historicalSales)}
                </p>
              </div>
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