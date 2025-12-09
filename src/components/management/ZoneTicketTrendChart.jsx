import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Receipt } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ZoneTicketTrendChart({ filteredDailySales, dateRange, formatCurrency }) {
  const ticketTrendData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySales = filteredDailySales.filter(s => s.date === dateStr);
      const totalSales = daySales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = daySales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
      
      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMMM', { locale: es }),
        avgTicket,
        transactions: daySales.reduce((sum, s) => sum + (s.total_transactions || 0), 0)
      };
    });
  }, [filteredDailySales, dateRange]);

  const avgTicketZone = ticketTrendData.reduce((sum, d) => sum + d.avgTicket, 0) / Math.max(ticketTrendData.length, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Tendencia de Ticket Promedio - Zona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ticketTrendData}>
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(v, name) => [formatCurrency(v), name === 'avgTicket' ? 'Ticket Promedio' : 'Transacciones']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <ReferenceLine y={avgTicketZone} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Promedio', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="avgTicket" fill="url(#ticketGradient)" stroke="#8b5cf6" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}