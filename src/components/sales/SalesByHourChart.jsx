import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const hourlyData = useMemo(() => {
    const hours = {};
    
    // Inicializar todas las horas
    for (let h = 9; h <= 21; h++) {
      hours[h] = { hour: h, sales: 0, transactions: 0, count: 0 };
    }
    
    // Distribuir ventas de cada turno en sus horas
    shiftRecords.forEach(record => {
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
  }, [shiftRecords]);

  const maxSales = Math.max(...hourlyData.map(h => h.sales), 1);
  const peakHour = hourlyData.reduce((max, h) => h.sales > max.sales ? h : max, hourlyData[0] || {});

  return (
    <Card className="bg-white shadow-xl border-0">
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
        <CardTitle className="text-sm font-bold text-cyan-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            Ventas por Hora
          </div>
          {peakHour.hour && (
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              🔥 Pico: {peakHour.hourLabel}
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-gray-500">Distribución horaria basada en turnos</p>
      </CardHeader>
      <CardContent className="p-4">
        {/* Indicadores de turno */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(SHIFT_TIMES).map(([key, shift]) => {
            const Icon = shift.icon;
            const shiftSales = shiftRecords
              .filter(r => r.shift === key)
              .reduce((sum, r) => sum + (r.sales || 0), 0);
            
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.03, y: -2 }}
                className={`bg-gradient-to-br ${shift.bgColor} rounded-xl p-3 text-center`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: shift.color }} />
                <p className="text-xs text-gray-600 mb-1">{shift.label}</p>
                <p className="text-sm font-black" style={{ color: shift.color }}>
                  ${(shiftSales/1000000).toFixed(1)}M
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Gráfica */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="hourLabel" 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [formatCurrency(v), 'Ventas']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                {hourlyData.map((entry, index) => {
                  // Color basado en la intensidad
                  const intensity = entry.sales / maxSales;
                  const color = intensity > 0.7 ? '#10b981' : intensity > 0.4 ? '#f59e0b' : '#6366f1';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
          <p className="text-xs text-blue-700 font-medium">
            💡 {peakHour.hour 
              ? `Tu mejor hora es ${peakHour.hourLabel} con ${formatCurrency(peakHour.sales)} en ventas` 
              : 'Registra más datos para ver patrones horarios'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}