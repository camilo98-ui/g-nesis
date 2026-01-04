import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Zap, Gift, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart, Line, LineChart, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesByHourChart({ shiftRecords = [], dailySales = [], formatCurrency }) {
  
  // Análisis de métricas clave del negocio
  const performanceData = useMemo(() => {
    if (!shiftRecords || shiftRecords.length === 0) return null;

    const totalSales = shiftRecords.reduce((s, r) => s + (r.sales || 0), 0);
    const totalTransactions = shiftRecords.reduce((s, r) => s + (r.transactions || 0), 0);
    const totalTickets = shiftRecords.reduce((s, r) => s + (r.tickets || 0), 0);
    const totalSuggested = shiftRecords.reduce((s, r) => s + (r.suggested_sales || 0), 0);
    
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const conversionRate = totalTickets > 0 ? (totalTransactions / totalTickets * 100) : 0;
    const suggestedRate = totalTransactions > 0 ? (totalSuggested / totalTransactions * 100) : 0;
    
    // Análisis por turno
    const shiftAnalysis = ['morning', 'afternoon', 'night'].map(shift => {
      const records = shiftRecords.filter(r => r.shift === shift);
      const sales = records.reduce((s, r) => s + (r.sales || 0), 0);
      const trans = records.reduce((s, r) => s + (r.transactions || 0), 0);
      const sugg = records.reduce((s, r) => s + (r.suggested_sales || 0), 0);
      
      return {
        turno: shift === 'morning' ? 'Mañana' : shift === 'afternoon' ? 'Tarde' : 'Noche',
        ventas: sales,
        transacciones: trans,
        ticketProm: trans > 0 ? sales / trans : 0,
        sugeridos: sugg,
        tasaSugeridos: trans > 0 ? (sugg / trans * 100) : 0
      };
    });

    // Evolución diaria (últimos registros)
    const dailyEvolution = shiftRecords
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7)
      .reverse()
      .map(r => ({
        fecha: format(parseISO(r.date), 'dd/MM', { locale: es }),
        ticketPromedio: r.transactions > 0 ? r.sales / r.transactions : 0,
        sugeridos: r.suggested_sales || 0,
        transacciones: r.transactions || 0
      }));

    // Radar de eficiencia operativa
    const radarData = [
      { metric: 'Ticket Promedio', value: Math.min((avgTicket / 40000) * 100, 100), fullMark: 100 },
      { metric: 'Tasa Sugeridos', value: Math.min(suggestedRate, 100), fullMark: 100 },
      { metric: 'Conversión', value: Math.min(conversionRate, 100), fullMark: 100 },
      { metric: 'Volumen Trans', value: Math.min((totalTransactions / 500) * 100, 100), fullMark: 100 }
    ];

    return {
      totalSales,
      totalTransactions,
      avgTicket,
      conversionRate,
      suggestedRate,
      totalSuggested,
      shiftAnalysis,
      dailyEvolution,
      radarData
    };
  }, [shiftRecords, dailySales]);

  if (!performanceData) return null;

  const topShift = performanceData.shiftAnalysis.reduce((max, s) => s.ventas > max.ventas ? s : max, performanceData.shiftAnalysis[0]);
  const bestSuggestedShift = performanceData.shiftAnalysis.reduce((max, s) => s.tasaSugeridos > max.tasaSugeridos ? s : max, performanceData.shiftAnalysis[0]);

  return (
    <div className="bg-gradient-to-br from-violet-50/40 via-fuchsia-50/30 to-pink-50/40 rounded-3xl border-2 border-violet-200/30 shadow-2xl overflow-hidden">
      {/* Header con gradiente premium */}
      <div className="bg-gradient-to-r from-violet-600/95 via-fuchsia-600/95 to-pink-600/95 px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg"
            >
              <Target className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-black text-white mb-0.5">Performance Operacional</h3>
              <p className="text-xs text-white/80 font-medium">Métricas clave del negocio</p>
            </div>
          </div>
          <Award className="w-8 h-8 text-white/30" />
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 lg:p-6 bg-white/50 backdrop-blur-sm border-b border-violet-200/20">
        <motion.div whileHover={{ scale: 1.05, y: -3 }} className="text-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 lg:p-4 border-2 border-emerald-300/50 shadow-md">
          <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600 mx-auto mb-1 lg:mb-2" />
          <p className="text-[9px] lg:text-[10px] text-emerald-600 mb-1 font-semibold">Ticket Promedio</p>
          <p className="text-lg lg:text-2xl font-black text-emerald-900">{formatCurrency ? formatCurrency(performanceData.avgTicket).replace(/\.\d+/, '') : '-'}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -3 }} className="text-center bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-3 lg:p-4 border-2 border-pink-300/50 shadow-md">
          <Gift className="w-5 h-5 lg:w-6 lg:h-6 text-pink-600 mx-auto mb-1 lg:mb-2" />
          <p className="text-[9px] lg:text-[10px] text-pink-600 mb-1 font-semibold">Tasa Sugeridos</p>
          <p className="text-lg lg:text-2xl font-black text-pink-900">{performanceData.suggestedRate.toFixed(0)}%</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -3 }} className="text-center bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 lg:p-4 border-2 border-violet-300/50 shadow-md">
          <Users className="w-5 h-5 lg:w-6 lg:h-6 text-violet-600 mx-auto mb-1 lg:mb-2" />
          <p className="text-[9px] lg:text-[10px] text-violet-600 mb-1 font-semibold">Transacciones</p>
          <p className="text-lg lg:text-2xl font-black text-violet-900">{performanceData.totalTransactions}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05, y: -3 }} className="text-center bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 lg:p-4 border-2 border-amber-300/50 shadow-md">
          <Target className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600 mx-auto mb-1 lg:mb-2" />
          <p className="text-[9px] lg:text-[10px] text-amber-600 mb-1 font-semibold">Conversión</p>
          <p className="text-lg lg:text-2xl font-black text-amber-900">{performanceData.conversionRate.toFixed(0)}%</p>
        </motion.div>
      </div>

      <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Gráfico radar de eficiencia */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-violet-200/40 shadow-lg">
          <h4 className="text-xs lg:text-sm font-black text-violet-900 mb-3 lg:mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 lg:w-5 lg:h-5 text-violet-500" />
            Radar de Eficiencia
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={performanceData.radarData}>
              <defs>
                <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
              <Radar name="Eficiencia" dataKey="value" stroke="#a855f7" strokeWidth={3} fill="url(#radarGrad)" />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-center text-violet-600 mt-2">Equilibrio operacional multicanal</p>
        </div>

        {/* Performance por turno */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-pink-200/40 shadow-lg">
          <h4 className="text-xs lg:text-sm font-black text-pink-900 mb-3 lg:mb-4">Análisis por Turno</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData.shiftAnalysis} layout="horizontal">
              <defs>
                <linearGradient id="barShift" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="category" dataKey="turno" fontSize={10} fontWeight={600} tick={{ fill: '#475569' }} />
              <YAxis type="number" fontSize={9} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: 14, border: '2px solid #ec4899', background: '#fff', padding: '10px 14px' }}
                formatter={(v, name) => {
                  if (name === 'ventas') return [formatCurrency ? formatCurrency(v) : v, '💰 Ventas'];
                  if (name === 'ticketProm') return [formatCurrency ? formatCurrency(v) : v, '🎯 Ticket'];
                  return [v, name];
                }}
              />
              <Bar dataKey="ventas" fill="url(#barShift)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 lg:mt-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-1 lg:gap-0 text-[10px] lg:text-xs">
            <span className="text-slate-600">Mejor: <span className="font-black text-pink-700">{topShift.turno}</span></span>
            <span className="text-slate-600">Top sugeridos: <span className="font-black text-violet-700">{bestSuggestedShift.turno}</span></span>
          </div>
        </div>
      </div>

      {/* Evolución de ticket promedio */}
      <div className="px-4 lg:px-6 pb-4 lg:pb-6">
        <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/70 rounded-2xl p-4 lg:p-5 border-2 border-rose-200/40 shadow-lg">
          <h4 className="text-xs lg:text-sm font-black text-rose-900 mb-3 lg:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-rose-500" />
            Evolución Ticket Promedio y Sugeridos
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={performanceData.dailyEvolution}>
              <defs>
                <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="fecha" fontSize={9} fontWeight={600} tick={{ fill: '#475569' }} />
              <YAxis yAxisId="left" fontSize={9} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fill: '#f43f5e' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={9} tick={{ fill: '#8b5cf6' }} />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: '2px solid #f43f5e', background: '#fff', fontSize: 11 }}
                formatter={(v, name) => {
                  if (name === 'ticketPromedio') return [formatCurrency ? formatCurrency(v) : v, '🎯 Ticket'];
                  if (name === 'sugeridos') return [v, '🎁 Sugeridos'];
                  return [v, name];
                }}
              />
              <Area yAxisId="left" type="monotone" dataKey="ticketPromedio" stroke="#f43f5e" strokeWidth={3} fill="url(#ticketGrad)" name="ticketPromedio" />
              <Line yAxisId="right" type="monotone" dataKey="sugeridos" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="sugeridos" />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[9px] lg:text-[10px] text-rose-600 mt-2 lg:mt-3 text-center">📊 Últimos 7 registros • Enfoque en maximizar ticket y sugeridos</p>
        </div>
      </div>
    </div>
  );
}