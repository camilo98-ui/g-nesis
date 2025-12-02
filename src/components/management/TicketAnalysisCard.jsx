import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Receipt, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function TicketAnalysisCard({ dailyTrend = [], formatCurrency }) {
  const ticketData = useMemo(() => {
    if (!dailyTrend.length) return { data: [], avg: 0, best: null, worst: null, opportunities: [], goodDays: [] };
    
    // Calcular ticket promedio por día
    const data = dailyTrend.map(day => {
      const tickets = day.tickets || day.total_tickets || 1;
      const sales = day.sales || day.total_sales || 0;
      const avgTicket = tickets > 0 ? sales / tickets : 0;
      return {
        ...day,
        avgTicket,
        tickets
      };
    }).filter(d => d.avgTicket > 0);
    
    if (data.length === 0) return { data: [], avg: 0, best: null, worst: null, opportunities: [], goodDays: [] };
    
    const totalTicket = data.reduce((sum, d) => sum + d.avgTicket, 0);
    const avg = totalTicket / data.length;
    
    // Encontrar mejor y peor día
    const sorted = [...data].sort((a, b) => b.avgTicket - a.avgTicket);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    // Clasificar días
    const opportunities = data.filter(d => d.avgTicket < avg * 0.9); // 10% bajo promedio
    const goodDays = data.filter(d => d.avgTicket >= avg * 1.1); // 10% sobre promedio
    
    return { data, avg, best, worst, opportunities, goodDays };
  }, [dailyTrend]);

  if (!ticketData.data.length) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="py-8 text-center text-gray-400">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin datos de ticket promedio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Receipt className="w-4 h-4 text-blue-500" />
          </motion.div>
          Análisis de Ticket Promedio Diario
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-2 text-center"
          >
            <p className="text-[10px] text-gray-500">Promedio</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency?.(ticketData.avg) || `$${Math.round(ticketData.avg/1000)}K`}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-2 text-center"
          >
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Mejor
            </p>
            <p className="text-lg font-bold text-green-600">{formatCurrency?.(ticketData.best?.avgTicket) || `$${Math.round((ticketData.best?.avgTicket || 0)/1000)}K`}</p>
            <p className="text-[9px] text-green-400 truncate">{ticketData.best?.fullDate || ticketData.best?.date}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-2 text-center"
          >
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Oportunidad
            </p>
            <p className="text-lg font-bold text-amber-600">{ticketData.opportunities.length}</p>
            <p className="text-[9px] text-amber-400">días bajo prom.</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-2 text-center"
          >
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              Buenos
            </p>
            <p className="text-lg font-bold text-emerald-600">{ticketData.goodDays.length}</p>
            <p className="text-[9px] text-emerald-400">días sobre prom.</p>
          </motion.div>
        </div>

        {/* Chart */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ticketData.data}>
              <defs>
                <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 9 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  const isGood = data.avgTicket >= ticketData.avg * 1.1;
                  const isOpportunity = data.avgTicket < ticketData.avg * 0.9;
                  return (
                    <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                      <p className="font-bold text-gray-800">{data.fullDate || data.date}</p>
                      <p className={`font-bold ${isGood ? 'text-green-600' : isOpportunity ? 'text-amber-600' : 'text-blue-600'}`}>
                        Ticket: {formatCurrency?.(data.avgTicket) || `$${Math.round(data.avgTicket/1000)}K`}
                      </p>
                      {isGood && <p className="text-green-500 text-[10px]">✅ Buen día</p>}
                      {isOpportunity && <p className="text-amber-500 text-[10px]">⚠️ Oportunidad de mejora</p>}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={ticketData.avg} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Prom', fontSize: 9, fill: '#10b981' }} />
              <Area type="monotone" dataKey="avgTicket" stroke="#3b82f6" fill="url(#ticketGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100"
        >
          <p className="text-xs text-blue-800">
            <span className="font-bold">💡 Resumen:</span>{' '}
            <span className="text-green-700">✅ Buenos días ({ticketData.goodDays.length}): </span>
            {ticketData.goodDays.slice(0, 3).map(d => d.fullDate || d.date).join(', ') || 'Ninguno'}.{' '}
            <span className="text-amber-600">⚠️ Oportunidad ({ticketData.opportunities.length}): </span>
            {ticketData.opportunities.slice(0, 3).map(d => d.fullDate || d.date).join(', ') || 'Ninguno'}.
            {ticketData.opportunities.length > 0 && (
              <span className="block mt-1 text-gray-600">
                Sugerencia: Implementar estrategias de venta sugerida en días de menor ticket.
              </span>
            )}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}