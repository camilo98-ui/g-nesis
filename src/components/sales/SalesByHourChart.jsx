import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Sunset, Moon, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart, Line, LineChart, ComposedChart } from 'recharts';

/**
 * Turnos:
 * Mañana: 9:30 AM - 5:30 PM
 * Tarde: 12:00 PM - 8:00 PM
 * Noche: 1:30 PM - 9:30 PM
 * 
 * Distribución por hora estimada basada en turnos
 */

const SHIFT_TIMES = {
  morning: { start: 9.5, end: 17.5, label: 'Mañana', icon: Sun, color: '#fbbf24', bgColor: 'from-amber-50 to-yellow-100' },
  afternoon: { start: 12, end: 20, label: 'Tarde', icon: Sunset, color: '#f472b6', bgColor: 'from-pink-50 to-rose-100' },
  night: { start: 13.5, end: 21.5, label: 'Noche', icon: Moon, color: '#6366f1', bgColor: 'from-indigo-50 to-purple-100' }
};

export default function SalesByHourChart({ shiftRecords = [], formatCurrency }) {
  const [selectedShift, setSelectedShift] = React.useState('all');
  const [chartType, setChartType] = React.useState('composed');

  const hourlyData = useMemo(() => {
    const hours = {};
    
    // Inicializar todas las horas
    for (let h = 9; h <= 21; h++) {
      hours[h] = { hour: h, sales: 0, transactions: 0, count: 0 };
    }
    
    // Filtrar registros según el turno seleccionado - AHORA SÍ FILTRA CORRECTAMENTE
    const filteredRecords = selectedShift === 'all' 
      ? shiftRecords 
      : shiftRecords.filter(r => r.shift === selectedShift);
    
    // Distribuir ventas de cada turno en sus horas ESPECÍFICAS
    filteredRecords.forEach(record => {
      const shiftInfo = SHIFT_TIMES[record.shift];
      if (!shiftInfo) return;
      
      const startHour = Math.floor(shiftInfo.start);
      const endHour = Math.floor(shiftInfo.end);
      const totalHours = endHour - startHour + 1;
      
      // Distribuir proporcionalmente las ventas en las horas del turno
      const salesPerHour = (record.sales || 0) / totalHours;
      const transPerHour = (record.transactions || 0) / totalHours;
      
      for (let h = startHour; h <= endHour; h++) {
        if (hours[h]) {
          hours[h].sales += salesPerHour;
          hours[h].transactions += transPerHour;
          hours[h].count += 1;
        }
      }
    });
    
    // Convertir a array y formatear - SOLO MOSTRAR HORAS DEL TURNO SELECCIONADO
    const allHours = Object.values(hours).map(h => ({
      ...h,
      hourLabel: `${h.hour}:00`,
      avgSales: h.count > 0 ? h.sales / h.count : h.sales,
      ticketProm: h.transactions > 0 ? h.sales / h.transactions : 0
    }));
    
    // Si hay un turno seleccionado, solo mostrar las horas de ese turno
    if (selectedShift !== 'all') {
      const shiftInfo = SHIFT_TIMES[selectedShift];
      if (shiftInfo) {
        const startHour = Math.floor(shiftInfo.start);
        const endHour = Math.floor(shiftInfo.end);
        return allHours.filter(h => h.hour >= startHour && h.hour <= endHour);
      }
    }
    
    // Si es "all", mostrar todas las horas que tengan ventas
    return allHours.filter(h => h.sales > 0);
  }, [shiftRecords, selectedShift]);

  const maxSales = Math.max(...hourlyData.map(h => h.sales), 1);
  const peakHour = hourlyData.reduce((max, h) => h.sales > max.sales ? h : max, hourlyData[0] || {});

  // Calcular datos adicionales para insights
  const totalSales = hourlyData.reduce((sum, h) => sum + h.sales, 0);
  const totalTransactions = hourlyData.reduce((sum, h) => sum + h.transactions, 0);
  const avgTicketOverall = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  // Identificar horas pico y valle
  const sortedByVolume = [...hourlyData].sort((a, b) => b.sales - a.sales);
  const topHours = sortedByVolume.slice(0, 3);
  const bottomHours = sortedByVolume.slice(-3).reverse();
  
  // Calcular momento del día con más ventas
  const morningHours = hourlyData.filter(h => h.hour >= 9 && h.hour < 12);
  const afternoonHours = hourlyData.filter(h => h.hour >= 12 && h.hour < 17);
  const eveningHours = hourlyData.filter(h => h.hour >= 17 && h.hour <= 21);
  
  const morningSales = morningHours.reduce((s, h) => s + h.sales, 0);
  const afternoonSales = afternoonHours.reduce((s, h) => s + h.sales, 0);
  const eveningSales = eveningHours.reduce((s, h) => s + h.sales, 0);
  
  const bestPeriod = Math.max(morningSales, afternoonSales, eveningSales);
  const bestPeriodName = bestPeriod === morningSales ? 'Mañana' : bestPeriod === afternoonSales ? 'Tarde' : 'Noche';
  const bestPeriodIcon = bestPeriod === morningSales ? Sun : bestPeriod === afternoonSales ? Sunset : Moon;

  return (
    <div className="bg-gradient-to-br from-purple-50/40 via-pink-50/30 to-rose-50/40 rounded-3xl border-2 border-purple-200/30 shadow-2xl overflow-hidden">
      {/* Header con gradiente vibrante */}
      <div className="bg-gradient-to-r from-purple-500/90 via-pink-500/90 to-rose-500/90 px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg"
            >
              <Clock className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-black text-white mb-0.5">Análisis de Flujo Horario</h3>
              <p className="text-xs text-white/80 font-medium">Patrones de comportamiento de ventas</p>
            </div>
          </div>
          {React.createElement(bestPeriodIcon, { className: "w-8 h-8 text-white/30" })}
        </div>
      </div>

      {/* KPIs destacados */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-white/50 backdrop-blur-sm border-b border-purple-200/20">
        <div className="text-center">
          <p className="text-xs text-purple-600 mb-2 font-semibold">Hora Pico</p>
          <p className="text-3xl font-black text-purple-900 mb-1">{peakHour.hourLabel || '-'}</p>
          <p className="text-xs text-purple-700">{formatCurrency ? formatCurrency(peakHour.sales || 0) : '-'}</p>
        </div>
        <div className="text-center border-x border-purple-200/40">
          <p className="text-xs text-pink-600 mb-2 font-semibold">Mejor Periodo</p>
          <p className="text-3xl font-black text-pink-900 mb-1">{bestPeriodName}</p>
          <p className="text-xs text-pink-700">{formatCurrency ? formatCurrency(bestPeriod) : '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-rose-600 mb-2 font-semibold">Ticket Promedio</p>
          <p className="text-3xl font-black text-rose-900 mb-1">{formatCurrency ? formatCurrency(avgTicketOverall).replace(/\.\d+/, '') : '-'}</p>
          <p className="text-xs text-rose-700">{totalTransactions} trans</p>
        </div>
      </div>

      {/* Gráfico principal con doble eje */}
      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.6}>
                    <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0.05}>
                    <animate attributeName="stopOpacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
                <filter id="glowEffect">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="shimmerEffect" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="-100%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="-50%" stopColor="rgba(255,255,255,0.6)" />
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <animate attributeName="x1" values="-100%;200%" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="0%;300%" dur="2.5s" repeatCount="indefinite" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" opacity={0.4} />
              <XAxis 
                dataKey="hourLabel" 
                stroke="#64748b" 
                fontSize={12}
                fontWeight={600}
                tick={{ fill: '#475569' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#ec4899" 
                fontSize={12}
                fontWeight={600}
                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                tick={{ fill: '#ec4899' }}
                label={{ value: 'Ventas', angle: -90, position: 'insideLeft', fill: '#ec4899', fontSize: 13, fontWeight: 700 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#8b5cf6" 
                fontSize={12}
                fontWeight={600}
                tick={{ fill: '#8b5cf6' }}
                label={{ value: 'Transacciones', angle: 90, position: 'insideRight', fill: '#8b5cf6', fontSize: 13, fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #fef3f9 100%)',
                  border: '2px solid #ec4899', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(236, 72, 153, 0.3)',
                  padding: '12px 16px',
                  fontSize: '12px'
                }}
                labelStyle={{
                  color: '#831843',
                  fontSize: '13px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  borderBottom: '2px solid #fbcfe8',
                  paddingBottom: '6px'
                }}
                formatter={(value, name) => {
                  if (name === 'sales') return [formatCurrency ? formatCurrency(value) : `$${value}`, '💰 Ventas'];
                  if (name === 'transactions') return [Math.round(value), '🧾 Transacciones'];
                  if (name === 'ticketProm') return [formatCurrency ? formatCurrency(value) : `$${value}`, '🎯 Ticket Promedio'];
                  return [value, name];
                }}
                labelFormatter={(label) => `🕐 ${label}`}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                stroke="#ec4899" 
                strokeWidth={3} 
                fill="url(#salesGradient)"
                filter="url(#glowEffect)"
                name="sales"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="transactions" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6, fill: '#a855f7' }}
                name="transactions"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ticketProm" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="ticketProm"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights de horas pico y valle */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-black text-emerald-900">Top 3 Horas</p>
            </div>
            <div className="space-y-2">
              {topHours.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg p-2 border border-emerald-200/40">
                  <span className="text-xs font-bold text-emerald-700">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {h.hourLabel}</span>
                  <span className="text-sm font-black text-emerald-900">{formatCurrency ? formatCurrency(h.sales) : `$${Math.round(h.sales/1000000)}M`}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-emerald-600 mt-2">🎯 Refuerza personal en estos horarios</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-black text-amber-900">Horas Valle</p>
            </div>
            <div className="space-y-2">
              {bottomHours.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg p-2 border border-amber-200/40">
                  <span className="text-xs font-bold text-amber-700">{h.hourLabel}</span>
                  <span className="text-sm font-black text-amber-900">{formatCurrency ? formatCurrency(h.sales) : `$${Math.round(h.sales/1000000)}M`}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-600 mt-2">💡 Oportunidad para promociones</p>
          </div>
        </div>

        {/* Análisis por periodo del día */}
        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200/50">
          <h4 className="text-base font-black text-indigo-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Distribución por Periodo del Día
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Mañana', value: morningSales, hours: '9-12h', icon: Sun, color: 'amber', percent: totalSales > 0 ? (morningSales/totalSales*100).toFixed(0) : 0 },
              { name: 'Tarde', value: afternoonSales, hours: '12-17h', icon: Sunset, color: 'pink', percent: totalSales > 0 ? (afternoonSales/totalSales*100).toFixed(0) : 0 },
              { name: 'Noche', value: eveningSales, hours: '17-21h', icon: Moon, color: 'indigo', percent: totalSales > 0 ? (eveningSales/totalSales*100).toFixed(0) : 0 }
            ].map((period, idx) => {
              const Icon = period.icon;
              const isTop = period.value === bestPeriod;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className={`bg-gradient-to-br from-white to-${period.color}-50 rounded-xl p-4 border-2 ${isTop ? `border-${period.color}-400 shadow-lg` : `border-${period.color}-200/40`} transition-all relative overflow-hidden`}
                >
                  {isTop && (
                    <div className="absolute top-2 right-2 bg-yellow-400 rounded-full px-2 py-0.5">
                      <p className="text-[8px] font-black text-yellow-900">TOP</p>
                    </div>
                  )}
                  <Icon className={`w-6 h-6 text-${period.color}-500 mb-2`} />
                  <p className="text-xs text-slate-600 font-medium mb-1">{period.name}</p>
                  <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrency ? formatCurrency(period.value) : '-'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500">{period.hours}</p>
                    <p className={`text-sm font-black text-${period.color}-600`}>{period.percent}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recomendación inteligente */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-5 border-2 border-blue-300/40"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 mb-2">Insight Estratégico</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                El periodo de <span className="font-bold text-purple-700">{bestPeriodName}</span> concentra el <span className="font-bold">{(bestPeriod/totalSales*100).toFixed(0)}%</span> de tus ventas. 
                {topHours[0] && ` La hora pico es ${topHours[0].hourLabel} con ${formatCurrency ? formatCurrency(topHours[0].sales) : 'alta actividad'}.`}
                {bottomHours[0] && ` Considera activar promociones en horas valle como ${bottomHours[0].hourLabel} para equilibrar el flujo.`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}