import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ZoneDailyPerformanceTable({ filteredDailySales, dateRange, formatCurrency }) {
  const dailyPerformance = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.slice(-14).map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySales = filteredDailySales.filter(s => s.date === dateStr);
      const totalSales = daySales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = daySales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const totalTransactions = daySales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
      const storesActive = daySales.length;
      
      return {
        date: format(day, 'EEE dd MMM', { locale: es }),
        isWeekend: isWeekend(day),
        totalSales,
        avgTicket,
        totalTransactions,
        storesActive
      };
    }).reverse();
  }, [filteredDailySales, dateRange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
            <Table className="w-4 h-4" />
            Rendimiento Diario de la Zona (Últimos 14 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-bold text-gray-700">Fecha</th>
                  <th className="text-right py-3 px-3 font-bold text-emerald-700">Ventas</th>
                  <th className="text-right py-3 px-3 font-bold text-violet-700">Ticket Prom.</th>
                  <th className="text-right py-3 px-3 font-bold text-pink-700">Transacciones</th>
                  <th className="text-center py-3 px-3 font-bold text-gray-700">Tiendas</th>
                </tr>
              </thead>
              <tbody>
                {dailyPerformance.map((day, idx) => (
                  <motion.tr
                    key={day.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${day.isWeekend ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      {day.date}
                      {day.isWeekend && <span className="ml-1 text-blue-500">🌟</span>}
                    </td>
                    <td className="text-right py-2.5 px-3 font-bold text-emerald-600">
                      {formatCurrency(day.totalSales)}
                    </td>
                    <td className="text-right py-2.5 px-3 font-bold text-violet-600">
                      {formatCurrency(day.avgTicket)}
                    </td>
                    <td className="text-right py-2.5 px-3 font-bold text-pink-600">
                      {day.totalTransactions.toLocaleString()}
                    </td>
                    <td className="text-center py-2.5 px-3 text-gray-600 font-semibold">
                      {day.storesActive}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}