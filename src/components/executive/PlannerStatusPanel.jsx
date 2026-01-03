import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, differenceInMinutes, parse, isSunday, parseISO } from 'date-fns';

// Días festivos Colombia 2025
const HOLIDAYS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

export default function PlannerStatusPanel({ stores }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: allShifts = [] } = useQuery({
    queryKey: ['allShifts'],
    queryFn: () => base44.entities.Shift.list()
  });

  const plannerStatus = useMemo(() => {
    return stores.map(store => {
      const storeShifts = allShifts.filter(shift => {
        const shiftDate = shift.date?.split('T')[0] || shift.date;
        if (!shiftDate) return false;
        
        try {
          const date = new Date(shiftDate);
          return shift.store_id === store.code && 
                 isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd });
        } catch {
          return false;
        }
      });

      // Calcular horas extras según legislación colombiana
      let totalOvertimeHours = 0;
      const weeklyHours = {};

      storeShifts.forEach(shift => {
        if (!shift.cashier_id || !shift.start_time || !shift.end_time) return;

        const shiftDate = shift.date?.split('T')[0] || shift.date;
        const startTime = parse(shift.start_time, 'HH:mm', new Date());
        const endTime = parse(shift.end_time, 'HH:mm', new Date());
        
        let totalMinutes = differenceInMinutes(endTime, startTime);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        
        const totalHours = totalMinutes / 60;

        // Rastrear horas por colaborador por semana
        if (!weeklyHours[shift.cashier_id]) weeklyHours[shift.cashier_id] = 0;
        weeklyHours[shift.cashier_id] += totalHours;

        // Horas extras diarias (más de 8 horas)
        const dailyOvertimeThreshold = 8;
        if (totalHours > dailyOvertimeThreshold) {
          totalOvertimeHours += (totalHours - dailyOvertimeThreshold);
        }

        // Verificar si es domingo o festivo (no aplican como extras pero son importantes)
        const isHoliday = HOLIDAYS_2025.includes(shiftDate);
        const isSundayShift = isSunday(parseISO(shiftDate));
      });

      // Horas extras por exceso semanal (más de 44h/semana por colaborador)
      const WEEKLY_LIMIT = 44;
      Object.values(weeklyHours).forEach(hours => {
        if (hours > WEEKLY_LIMIT) {
          totalOvertimeHours += (hours - WEEKLY_LIMIT);
        }
      });

      const hasPlanner = storeShifts.length > 0;
      const totalShifts = storeShifts.length;

      return {
        code: store.code,
        name: store.name,
        hasPlanner,
        totalShifts,
        overtimeHours: totalOvertimeHours
      };
    });
  }, [allShifts, stores, currentWeekStart, currentWeekEnd]);

  const stats = useMemo(() => {
    const withPlanner = plannerStatus.filter(s => s.hasPlanner).length;
    const pending = plannerStatus.length - withPlanner;
    const totalOvertime = plannerStatus.reduce((sum, s) => sum + s.overtimeHours, 0);
    const withOvertime = plannerStatus.filter(s => s.overtimeHours > 0).length;
    return { withPlanner, pending, totalOvertime, withOvertime };
  }, [plannerStatus]);

  const filteredStores = useMemo(() => {
    if (!activeFilter) return [];
    if (activeFilter === 'all') return plannerStatus;
    if (activeFilter === 'complete') return plannerStatus.filter(s => s.hasPlanner);
    if (activeFilter === 'pending') return plannerStatus.filter(s => !s.hasPlanner);
    if (activeFilter === 'overtime') return plannerStatus.filter(s => s.overtimeHours > 0);
    return [];
  }, [plannerStatus, activeFilter]);

  const handleFilterClick = (filter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-xl md:rounded-2xl border border-indigo-500/30 p-3 md:p-6">
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-2xl font-black text-white truncate">Estado del Planner</h3>
            <p className="text-xs md:text-sm text-slate-400">Semana actual</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <button
            onClick={() => handleFilterClick('all')}
            className={`rounded-lg md:rounded-xl p-2.5 md:p-4 border transition-all ${
              activeFilter === 'all' 
                ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5 text-indigo-400 flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Todas</p>
            </div>
            <p className="text-xl md:text-3xl font-black text-white">{plannerStatus.length}</p>
            <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 md:mt-1">Total tiendas</p>
          </button>

          <button
            onClick={() => handleFilterClick('complete')}
            className={`rounded-lg md:rounded-xl p-2.5 md:p-4 border transition-all ${
              activeFilter === 'complete' 
                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Con Planner</p>
            </div>
            <p className="text-xl md:text-3xl font-black text-emerald-400">{stats.withPlanner}</p>
            <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
              {Math.round((stats.withPlanner / plannerStatus.length) * 100)}% del total
            </p>
          </button>

          <button
            onClick={() => handleFilterClick('pending')}
            className={`rounded-lg md:rounded-xl p-2.5 md:p-4 border transition-all ${
              activeFilter === 'pending' 
                ? 'bg-amber-500/20 border-amber-500/50 shadow-lg' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <AlertCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-400 flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Pendientes</p>
            </div>
            <p className="text-xl md:text-3xl font-black text-amber-400">{stats.pending}</p>
            <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
              {Math.round((stats.pending / plannerStatus.length) * 100)}% del total
            </p>
          </button>

          <button
            onClick={() => handleFilterClick('overtime')}
            className={`rounded-lg md:rounded-xl p-2.5 md:p-4 border transition-all ${
              activeFilter === 'overtime' 
                ? 'bg-red-500/20 border-red-500/50 shadow-lg' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Horas Extras</p>
            </div>
            <p className="text-xl md:text-3xl font-black text-red-400">{stats.totalOvertime.toFixed(1)}h</p>
            <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 md:mt-1">{stats.withOvertime} tiendas</p>
          </button>
        </div>
      </div>

      {/* Lista de tiendas - Solo se muestra cuando hay un filtro activo */}
      {activeFilter && filteredStores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden"
        >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left py-2.5 px-3 md:py-4 md:px-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tienda
                </th>
                <th className="text-center py-2.5 px-3 md:py-4 md:px-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-center py-2.5 px-3 md:py-4 md:px-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Turnos
                </th>
                <th className="text-center py-2.5 px-3 md:py-4 md:px-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  H. Extras
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStores
                .sort((a, b) => {
                  if (a.hasPlanner === b.hasPlanner) {
                    return b.totalShifts - a.totalShifts;
                  }
                  return a.hasPlanner ? -1 : 1;
                })
                .map((store, idx) => (
                  <motion.tr
                    key={store.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2.5 px-3 md:py-4 md:px-6">
                      <p className="font-bold text-white text-xs md:text-base">{store.name}</p>
                      <p className="text-[10px] md:text-xs text-slate-500">{store.code}</p>
                    </td>
                    
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center">
                      {store.hasPlanner ? (
                        <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                          <span className="text-[10px] md:text-xs font-bold text-emerald-400">Completo</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                          <span className="text-[10px] md:text-xs font-bold text-amber-400">Pendiente</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center">
                      <span className="text-base md:text-lg font-black text-white">
                        {store.totalShifts}
                      </span>
                    </td>
                    
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center">
                      {store.overtimeHours > 0 ? (
                        <div className="inline-flex items-center gap-1 md:gap-2">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                          <span className={`text-sm md:text-lg font-black ${
                            store.overtimeHours > 10 ? 'text-red-400' :
                            store.overtimeHours > 5 ? 'text-amber-400' : 'text-white'
                          }`}>
                            {store.overtimeHours.toFixed(1)}h
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs md:text-sm text-slate-500">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
        </motion.div>
      )}




    </div>
  );
}