import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";

const CASHIER_COLORS = {
  0: { gradient: 'from-pink-400 to-rose-500', solid: '#ec4899' },
  1: { gradient: 'from-violet-400 to-purple-500', solid: '#8b5cf6' },
  2: { gradient: 'from-blue-400 to-indigo-500', solid: '#3b82f6' },
  3: { gradient: 'from-emerald-400 to-green-500', solid: '#10b981' },
  4: { gradient: 'from-amber-400 to-orange-500', solid: '#f59e0b' },
  5: { gradient: 'from-red-400 to-rose-500', solid: '#ef4444' },
  6: { gradient: 'from-cyan-400 to-blue-500', solid: '#06b6d4' },
  7: { gradient: 'from-lime-400 to-green-500', solid: '#84cc16' }
};

export default function TrendChart({ shiftRecords, cashiers, dateRange, metricType = 'sales' }) {
  const [selectedCashiers, setSelectedCashiers] = useState([]);

  const { chartData, topCashiers, cashierTotals } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to || !shiftRecords.length) return { chartData: [], topCashiers: [], cashierTotals: {} };

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    const cashierDailyData = {};
    
    shiftRecords.forEach(record => {
      const cashierId = record.cashier_id;
      const dateStr = record.date;
      
      if (!cashierDailyData[cashierId]) {
        cashierDailyData[cashierId] = {};
      }
      
      if (!cashierDailyData[cashierId][dateStr]) {
        cashierDailyData[cashierId][dateStr] = {
          sales: 0,
          transactions: 0,
          tickets: 0
        };
      }
      
      cashierDailyData[cashierId][dateStr].sales += record.sales || 0;
      cashierDailyData[cashierId][dateStr].transactions += record.transactions || 0;
      cashierDailyData[cashierId][dateStr].tickets += record.tickets || 0;
    });

    // Calcular totales por cajero
    const totals = {};
    cashiers.forEach(c => {
      totals[c.id] = Object.values(cashierDailyData[c.id] || {}).reduce((sum, d) => {
        if (metricType === 'sales') return sum + d.sales;
        if (metricType === 'transactions') return sum + d.transactions;
        if (metricType === 'ticket') return sum + (d.transactions > 0 ? d.sales / d.transactions : 0);
        return sum;
      }, 0);
    });

    const topCashiers = cashiers
      .filter(c => totals[c.id] > 0)
      .sort((a, b) => totals[b.id] - totals[a.id])
      .slice(0, 5);

    const chartData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd MMM', { locale: es })
      };

      topCashiers.forEach(cashier => {
        const data = cashierDailyData[cashier.id]?.[dateStr];
        if (metricType === 'sales') {
          dayData[cashier.id] = data?.sales || 0;
        } else if (metricType === 'transactions') {
          dayData[cashier.id] = data?.transactions || 0;
        } else if (metricType === 'ticket') {
          dayData[cashier.id] = data?.transactions > 0 ? data.sales / data.transactions : 0;
        }
      });

      return dayData;
    });

    return { chartData, topCashiers, cashierTotals: totals };
  }, [shiftRecords, cashiers, dateRange, metricType]);

  const formatValue = (val) => {
    if (metricType === 'sales' || metricType === 'ticket') {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(val));
    }
    return Math.round(val).toLocaleString();
  };

  const getYAxisLabel = () => {
    switch (metricType) {
      case 'sales': return 'Ventas';
      case 'transactions': return 'Transacciones';
      case 'ticket': return 'Ticket Promedio';
      default: return '';
    }
  };

  if (!chartData.length || !topCashiers.length) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-gray-400">
        No hay datos suficientes para mostrar la tendencia
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
    >
      <motion.h4 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📈
        </motion.span>
        Tendencia de {getYAxisLabel()} por Cajero
      </motion.h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v) => metricType === 'sales' ? `$${(v/1000000).toFixed(1)}M` : metricType === 'ticket' ? `$${(v/1000).toFixed(0)}K` : v}
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: 11
              }}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload;
                return data?.fullDate || label;
              }}
              formatter={(value, name) => [formatValue(value), name]}
            />
            <Legend 
              wrapperStyle={{ fontSize: 10 }}
              iconSize={8}
            />
            {topCashiers.map((cashier, index) => (
              <Line
                key={cashier.id}
                type="monotone"
                dataKey={cashier.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}