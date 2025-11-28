import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, Minus, BarChart3, 
  Clock, Zap, Target, Award, ChevronDown, ChevronUp,
  Sun, Sunset, Moon, Loader2
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import BadgesDisplay from '../gamification/BadgesDisplay';

const SHIFT_INFO = {
  morning: { icon: Sun, label: 'Mañana', color: 'text-amber-500' },
  afternoon: { icon: Sunset, label: 'Tarde', color: 'text-orange-500' },
  night: { icon: Moon, label: 'Noche', color: 'text-indigo-500' }
};

export default function CashierAnalysis({ cashierId, cashierName, storeId }) {
  const [expanded, setExpanded] = useState(false);
  const thisMonth = startOfMonth(new Date());
  const lastMonth = startOfMonth(subMonths(new Date(), 1));

  const { data: shiftRecords = [], isLoading } = useQuery({
    queryKey: ['cashierShifts', cashierId],
    queryFn: () => base44.entities.ShiftRecord.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  const { data: allCashierRecords = [] } = useQuery({
    queryKey: ['allShiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const analysis = useMemo(() => {
    if (shiftRecords.length === 0) return null;

    const thisMonthRecords = shiftRecords.filter(r => new Date(r.date) >= thisMonth);
    const lastMonthRecords = shiftRecords.filter(r => {
      const d = new Date(r.date);
      return d >= lastMonth && d < thisMonth;
    });

    // Current month stats
    const totalSales = thisMonthRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTickets = thisMonthRecords.reduce((sum, r) => sum + (r.tickets || 0), 0);
    const totalTransactions = thisMonthRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
    const daysWorked = thisMonthRecords.length;

    // Last month stats for comparison
    const lastTotalSales = lastMonthRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const salesGrowth = lastTotalSales > 0 ? ((totalSales - lastTotalSales) / lastTotalSales) * 100 : 0;

    // Best shift analysis
    const shiftStats = {};
    thisMonthRecords.forEach(r => {
      if (!shiftStats[r.shift]) shiftStats[r.shift] = { sales: 0, count: 0 };
      shiftStats[r.shift].sales += r.sales || 0;
      shiftStats[r.shift].count++;
    });
    
    let bestShift = 'morning';
    let bestAvg = 0;
    Object.entries(shiftStats).forEach(([shift, data]) => {
      const avg = data.count > 0 ? data.sales / data.count : 0;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestShift = shift;
      }
    });

    // Rank among all cashiers
    const cashierTotals = {};
    allCashierRecords
      .filter(r => new Date(r.date) >= thisMonth)
      .forEach(r => {
        if (!cashierTotals[r.cashier_id]) cashierTotals[r.cashier_id] = 0;
        cashierTotals[r.cashier_id] += r.sales || 0;
      });
    
    const sortedCashiers = Object.entries(cashierTotals).sort((a, b) => b[1] - a[1]);
    const rank = sortedCashiers.findIndex(([id]) => id === cashierId) + 1;
    const totalCashiers = sortedCashiers.length;

    // Consistency score (days with sales / total possible days)
    const consistencyScore = Math.min(100, (daysWorked / 20) * 100);

    return {
      totalSales,
      totalTickets,
      totalTransactions,
      avgTicket,
      daysWorked,
      salesGrowth,
      bestShift,
      bestShiftAvg: bestAvg,
      rank,
      totalCashiers,
      consistencyScore,
      shiftStats
    };
  }, [shiftRecords, allCashierRecords, thisMonth, lastMonth, cashierId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Sin datos de turnos registrados
      </div>
    );
  }

  const BestShiftIcon = SHIFT_INFO[analysis.bestShift]?.icon || Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
              {cashierName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{cashierName}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Ranking:</span>
                <span className={`font-bold ${analysis.rank <= 3 ? 'text-amber-500' : 'text-gray-700'}`}>
                  #{analysis.rank} de {analysis.totalCashiers}
                </span>
              </div>
            </div>
          </div>
          <BadgesDisplay cashierId={cashierId} compact />
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-emerald-50 rounded-xl">
          <p className="text-2xl font-bold text-emerald-600">${(analysis.totalSales/1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Ventas del mes</p>
          <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${analysis.salesGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {analysis.salesGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(analysis.salesGrowth).toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">${(analysis.avgTicket/1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500">Ticket promedio</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-xl">
          <p className="text-2xl font-bold text-purple-600">{analysis.daysWorked}</p>
          <p className="text-xs text-gray-500">Días trabajados</p>
        </div>
      </div>

      {/* Best Shift */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
          <div className="flex items-center gap-2">
            <BestShiftIcon className={`w-5 h-5 ${SHIFT_INFO[analysis.bestShift]?.color}`} />
            <span className="text-sm text-gray-700">Mejor turno:</span>
            <span className="font-bold text-gray-800">{SHIFT_INFO[analysis.bestShift]?.label}</span>
          </div>
          <span className="text-sm font-medium text-amber-600">
            ${(analysis.bestShiftAvg/1000).toFixed(0)}K promedio
          </span>
        </div>
      </div>

      {/* Consistency */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Consistencia</span>
          <span className="font-bold text-gray-800">{analysis.consistencyScore.toFixed(0)}%</span>
        </div>
        <Progress value={analysis.consistencyScore} className="h-2" />
      </div>

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 border-t border-gray-100 text-gray-500 text-sm flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? 'Ver menos' : 'Ver detalles por turno'}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-4 border-t border-gray-100 bg-gray-50"
        >
          <div className="space-y-3">
            {Object.entries(analysis.shiftStats).map(([shift, data]) => {
              const ShiftIcon = SHIFT_INFO[shift]?.icon || Sun;
              const avg = data.count > 0 ? data.sales / data.count : 0;
              return (
                <div key={shift} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShiftIcon className={`w-4 h-4 ${SHIFT_INFO[shift]?.color}`} />
                    <span className="font-medium text-gray-700">{SHIFT_INFO[shift]?.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">${(data.sales/1000000).toFixed(2)}M</p>
                    <p className="text-xs text-gray-400">{data.count} turnos · ${(avg/1000).toFixed(0)}K prom</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}