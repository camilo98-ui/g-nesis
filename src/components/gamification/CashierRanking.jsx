import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Crown, Medal, TrendingUp, TrendingDown, 
  Calendar, ChevronRight, Flame, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const PODIUM_COLORS = ['from-amber-400 to-yellow-500', 'from-gray-300 to-slate-400', 'from-amber-600 to-orange-700'];
const PODIUM_ICONS = [Crown, Medal, Medal];

export default function CashierRanking({ storeId, onSelectCashier }) {
  const [period, setPeriod] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = semana actual, -1 = anterior, etc.

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

  // Calcular rango de fechas según período
  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'weekly') {
      const weekStart = startOfWeek(subWeeks(now, Math.abs(selectedWeek)), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return { from: weekStart, to: weekEnd };
    } else {
      const monthStart = startOfMonth(subMonths(now, Math.abs(selectedWeek)));
      const monthEnd = endOfMonth(monthStart);
      return { from: monthStart, to: monthEnd };
    }
  }, [period, selectedWeek]);

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

  const getPeriodLabel = () => {
    if (period === 'weekly') {
      return `Semana ${format(dateRange.from, 'dd', { locale: es })} - ${format(dateRange.to, 'dd MMM', { locale: es })}`;
    }
    return format(dateRange.from, 'MMMM yyyy', { locale: es });
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-6 h-6 text-amber-400" />
            </motion.div>
            Ranking
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => { setPeriod(v); setSelectedWeek(0); }}>
            <TabsList className="bg-white/10">
              <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Mensual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Selector de período */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedWeek(prev => prev - 1)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </motion.button>
          <span className="text-sm font-medium px-4 py-1 rounded-full bg-white/10">
            {getPeriodLabel()}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedWeek(prev => Math.min(0, prev + 1))}
            disabled={selectedWeek >= 0}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
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
                    animate={podiumIdx === 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${PODIUM_COLORS[podiumIdx]} flex items-center justify-center mb-2 shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  {/* Nombre */}
                  <p className="text-xs font-bold text-center mb-1 truncate w-20">
                    {cashier.name?.split(' ')[0]}
                  </p>
                  
                  {/* Ventas */}
                  <p className="text-[10px] text-amber-400 font-medium">
                    {formatCurrency(cashier.totalSales)}
                  </p>
                  
                  {/* Podio */}
                  <div className={`${height} w-16 bg-gradient-to-t ${PODIUM_COLORS[podiumIdx]} rounded-t-lg mt-2 flex items-center justify-center`}>
                    <span className="text-2xl font-black text-white/80">{podiumIdx + 1}</span>
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
              whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => onSelectCashier?.(cashier)}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
            >
              <span className="w-6 text-center text-sm font-bold text-gray-400">
                #{cashier.rank}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{cashier.name}</p>
                <p className="text-xs text-gray-400">{cashier.daysWorked} turnos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-400">{formatCurrency(cashier.totalSales)}</p>
                <p className="text-[10px] text-gray-400">
                  Ticket: {formatCurrency(cashier.avgTicket)}
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