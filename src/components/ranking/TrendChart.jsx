import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function TrendChart({ shiftRecords, cashiers, dateRange, metricType = 'sales' }) {
  const chartData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to || !shiftRecords.length) return [];

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    // Agrupar por cajero y fecha
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

    // Crear datos para el gráfico
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        dayName: format(day, 'EEEE', { locale: es })
      };

      cashiers.forEach(cashier => {
        const data = cashierDailyData[cashier.id]?.[dateStr];
        if (metricType === 'sales') {
          dayData[cashier.name] = data?.sales || 0;
        } else if (metricType === 'transactions') {
          dayData[cashier.name] = data?.transactions || 0;
        } else if (metricType === 'ticket') {
          dayData[cashier.name] = data?.tickets > 0 ? data.sales / data.tickets : 0;
        }
      });

      return dayData;
    });
  }, [shiftRecords, cashiers, dateRange, metricType]);

  // Obtener top cajeros para mostrar en la leyenda
  const topCashiers = useMemo(() => {
    const totals = {};
    cashiers.forEach(c => {
      totals[c.name] = chartData.reduce((sum, d) => sum + (d[c.name] || 0), 0);
    });
    return cashiers
      .sort((a, b) => (totals[b.name] || 0) - (totals[a.name] || 0))
      .slice(0, 8);
  }, [cashiers, chartData]);

  const formatValue = (val) => {
    if (metricType === 'sales' || metricType === 'ticket') {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val.toLocaleString();
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
      <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
        📈 Tendencia de {getYAxisLabel()} por Cajero
      </h4>
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