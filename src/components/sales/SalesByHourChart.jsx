import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';
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
    
    // Filtrar registros según el turno seleccionado
    const filteredRecords = selectedShift === 'all' 
      ? shiftRecords 
      : shiftRecords.filter(r => r.shift === selectedShift);
    
    // Distribuir ventas de cada turno en sus horas
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
    
    // Convertir a array y formatear
    return Object.values(hours)
      .map(h => ({
        ...h,
        hourLabel: `${h.hour}:00`,
        avgSales: h.count > 0 ? h.sales / h.count : h.sales,
        ticketProm: h.transactions > 0 ? h.sales / h.transactions : 0
      }))
      .filter(h => h.sales > 0);
  }, [shiftRecords, selectedShift]);

  const maxSales = Math.max(...hourlyData.map(h => h.sales), 1);
  const peakHour = hourlyData.reduce((max, h) => h.sales > max.sales ? h : max, hourlyData[0] || {});

  return (
    <Card className="bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 shadow-xl border-0 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Clock className="w-6 h-6" />
            </motion.div>
            Ventas por Hora
          </CardTitle>
          {peakHour.hour && (
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold shadow-lg"
            >
              🔥 Pico: {peakHour.hourLabel}
            </motion.div>
          )}
        </div>
        
        {/* Botones de vista - MÁS DIVERTIDOS Y NUMÉRICOS */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setChartType('composed')}
            className={`flex-1 h-9 transition-all ${
              chartType === 'composed'
                ? 'bg-white text-cyan-600 shadow-lg font-bold'
                : 'bg-white/20 text-white hover:bg-white/30 border-0'
            }`}
          >
            📊 Mixta
          </Button>
          <Button
            size="sm"
            onClick={() => setChartType('area')}
            className={`flex-1 h-9 transition-all ${
              chartType === 'area'
                ? 'bg-white text-purple-600 shadow-lg font-bold'
                : 'bg-white/20 text-white hover:bg-white/30 border-0'
            }`}
          >
            📈 Área
          </Button>
          <Button
            size="sm"
            onClick={() => setChartType('line')}
            className={`flex-1 h-9 transition-all ${
              chartType === 'line'
                ? 'bg-white text-pink-600 shadow-lg font-bold'
                : 'bg-white/20 text-white hover:bg-white/30 border-0'
            }`}
          >
            📉 Línea
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Indicadores de turno CLICKEABLES - MUESTRAN INFO */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Object.entries(SHIFT_TIMES).map(([key, shift]) => {
            const Icon = shift.icon;
            const shiftSales = shiftRecords
              .filter(r => r.shift === key)
              .reduce((sum, r) => sum + (r.sales || 0), 0);
            const shiftTransactions = shiftRecords
              .filter(r => r.shift === key)
              .reduce((sum, r) => sum + (r.transactions || 0), 0);
            const avgTicket = shiftTransactions > 0 ? shiftSales / shiftTransactions : 0;
            const shiftCount = shiftRecords.filter(r => r.shift === key).length;
            const isSelected = selectedShift === key;
            
            return (
              <motion.button
                key={key}
                onClick={() => setSelectedShift(selectedShift === key ? 'all' : key)}
                whileHover={{ scale: 1.08, y: -5, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gradient-to-br ${shift.bgColor} rounded-2xl p-4 text-center shadow-lg cursor-pointer border-2 transition-all ${
                  isSelected ? 'border-gray-800 ring-4 ring-offset-2' : 'border-white'
                }`}
                style={isSelected ? { ringColor: shift.color } : {}}
              >
                <motion.div
                  animate={isSelected ? { rotate: [0, 360] } : { rotate: [0, 10, -10, 0] }}
                  transition={isSelected ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                >
                  <Icon className="w-7 h-7 mx-auto mb-2" style={{ color: shift.color }} />
                </motion.div>
                <p className="text-xs font-bold text-gray-700 mb-2">{shift.label}</p>
                <p className="text-2xl font-black mb-1" style={{ color: shift.color }}>
                  ${Math.round(shiftSales/1000000)}M
                </p>
                <div className="flex flex-col gap-1 text-[10px] text-gray-600 font-bold">
                  <div className="flex items-center justify-center gap-2">
                    <span className="bg-white/60 px-2 py-0.5 rounded-full">{shiftTransactions} trans</span>
                    <span className="bg-white/60 px-2 py-0.5 rounded-full">${Math.round(avgTicket/1000)}K</span>
                  </div>
                  <span className="bg-white/80 px-2 py-1 rounded-full font-black text-gray-700">{shiftCount} turnos</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Gráfica DINÁMICA */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'composed' ? (
              <ComposedChart data={hourlyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fill: '#0e7490', fontSize: 11, fontWeight: 'bold' }}
                  stroke="#06b6d4"
                />
                <YAxis 
                  tick={{ fill: '#0e7490', fontSize: 11, fontWeight: 'bold' }} 
                  tickFormatter={(v) => `$${Math.round(v/1000000)}M`}
                  stroke="#06b6d4"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 16, 
                    border: '2px solid #06b6d4', 
                    boxShadow: '0 8px 30px rgba(6,182,212,0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)'
                  }}
                  formatter={(v) => [`$${Math.round(v/1000000)}M`, 'Ventas']}
                  labelFormatter={(label) => `⏰ ${label}`}
                />
                <Area type="monotone" dataKey="sales" fill="url(#salesGradient)" stroke="#06b6d4" strokeWidth={3} />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]} fill="#06b6d4" opacity={0.6} />
                <Line type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 5 }} />
              </ComposedChart>
            ) : chartType === 'area' ? (
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke="#f3e8ff" />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fill: '#7c3aed', fontSize: 11, fontWeight: 'bold' }}
                  stroke="#a855f7"
                />
                <YAxis 
                  tick={{ fill: '#7c3aed', fontSize: 11, fontWeight: 'bold' }} 
                  tickFormatter={(v) => `$${Math.round(v/1000000)}M`}
                  stroke="#a855f7"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 16, 
                    border: '2px solid #a855f7', 
                    boxShadow: '0 8px 30px rgba(168,85,247,0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)'
                  }}
                  formatter={(v) => [`$${Math.round(v/1000000)}M`, 'Ventas']}
                  labelFormatter={(label) => `⏰ ${label}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#a855f7" strokeWidth={4} fill="url(#purpleGradient)" />
              </AreaChart>
            ) : (
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fill: '#ec4899', fontSize: 11, fontWeight: 'bold' }}
                  stroke="#ec4899"
                />
                <YAxis 
                  tick={{ fill: '#ec4899', fontSize: 11, fontWeight: 'bold' }} 
                  tickFormatter={(v) => `$${Math.round(v/1000000)}M`}
                  stroke="#ec4899"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 16, 
                    border: '2px solid #ec4899', 
                    boxShadow: '0 8px 30px rgba(236,72,153,0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)'
                  }}
                  formatter={(v) => [`$${Math.round(v/1000000)}M`, 'Ventas']}
                  labelFormatter={(label) => `⏰ ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#ec4899" 
                  strokeWidth={4} 
                  dot={{ fill: '#ec4899', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Insights MEJORADOS - Más numéricos y divertidos */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="p-4 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-2xl border-2 border-cyan-200 shadow-md"
          >
            <p className="text-xs font-black text-cyan-800 mb-2 flex items-center gap-1">
              💡 Insight clave
            </p>
            <p className="text-sm text-gray-700 font-bold leading-relaxed">
              {peakHour.hour 
                ? <>Pico: <span className="text-cyan-600 text-xl">{peakHour.hourLabel}</span> con <span className="text-green-600 font-black">${Math.round(peakHour.sales/1000000)}M</span></> 
                : 'Registra más datos'}
            </p>
          </motion.div>
          
          {peakHour.hour && hourlyData.length > 3 && (
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl border-2 border-pink-200 shadow-md"
            >
              <p className="text-xs font-black text-pink-800 mb-2 flex items-center gap-1">
                🎯 Acción urgente
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Refuerza <span className="font-black text-pink-700">{peakHour.hourLabel}</span> con <span className="text-green-600 font-black">+1 cajero</span> para 📈 maximizar ventas
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}