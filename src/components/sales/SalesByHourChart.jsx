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

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Ventas por Hora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hourLabel" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M COP`} tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [formatCurrency ? formatCurrency(v) : `$${v}`, 'Ventas']}
                labelFormatter={(label) => `Hora: ${label}`}
              />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} fill="url(#hourGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Indicadores de turno con mini gráficas */}
        <div className="grid grid-cols-3 gap-3 mt-4">
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
            
            // Datos del turno por hora
            const shiftHourlyData = hourlyData.filter(h => {
              const hour = h.hour;
              return hour >= Math.floor(shift.start) && hour <= Math.floor(shift.end);
            });
            
            return (
              <motion.button
                key={key}
                onClick={() => setSelectedShift(selectedShift === key ? 'all' : key)}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${shift.bgColor} rounded-xl p-3 text-center shadow-md transition-all ${
                  selectedShift === key ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{ ringColor: shift.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5" style={{ color: shift.color }} />
                  <span className="text-[10px] font-medium text-gray-600">{shiftCount} reg</span>
                </div>
                
                {/* Mini gráfica sparkline */}
                {shiftHourlyData.length > 0 && (
                  <div className="h-8 mb-2 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={shiftHourlyData}>
                        <defs>
                          <linearGradient id={`shiftGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={shift.color} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={shift.color} stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke={shift.color} 
                          strokeWidth={1.5} 
                          fill={`url(#shiftGrad-${key})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <p className="text-xs font-medium text-gray-700">{shift.label}</p>
                <p className="text-base font-bold mb-1" style={{ color: shift.color }}>
                  {formatCurrency ? formatCurrency(shiftSales) : `$${Math.round(shiftSales/1000000)}M COP`}
                </p>
                
                {/* Indicadores adicionales */}
                <div className="flex justify-around text-[9px] text-gray-500 pt-2 border-t border-gray-200/50">
                  <div>
                    <p className="font-medium">Trans</p>
                    <p className="font-bold text-gray-700">{shiftTransactions}</p>
                  </div>
                  <div>
                    <p className="font-medium">Ticket</p>
                    <p className="font-bold text-gray-700">
                      {avgTicket > 0 ? `$${Math.round(avgTicket/1000)}K` : '-'}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}