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

  const toggleCashier = (cashierId) => {
    setSelectedCashiers(prev => 
      prev.includes(cashierId) ? prev.filter(id => id !== cashierId) : [...prev, cashierId]
    );
  };

  const activeCashiers = selectedCashiers.length > 0 
    ? topCashiers.filter(c => selectedCashiers.includes(c.id))
    : topCashiers;

  const formatValue = (val) => {
    if (metricType === 'sales') return `$${(val/1000000).toFixed(1)}M`;
    if (metricType === 'ticket') return `$${(val/1000).toFixed(0)}K`;
    return Math.round(val).toLocaleString();
  };

  const getTitle = () => {
    switch (metricType) {
      case 'sales': return 'Ventas Diarias';
      case 'transactions': return 'Transacciones Diarias';
      case 'ticket': return 'Ticket Promedio';
      default: return 'Tendencia';
    }
  };

  const getIcon = () => {
    switch (metricType) {
      case 'sales': return '💰';
      case 'transactions': return '📊';
      case 'ticket': return '🎫';
      default: return '📈';
    }
  };

  if (!chartData.length || !topCashiers.length) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-lg">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl mb-3"
        >
          📊
        </motion.div>
        <p className="text-gray-400 text-sm">No hay datos suficientes</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 rounded-2xl shadow-xl p-6 border border-pink-100/50 backdrop-blur-sm"
    >
      {/* Header con selector de cajeros */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-black text-gray-800 flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getIcon()}
            </motion.span>
            {getTitle()}
          </h4>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Top {topCashiers.length}</span>
          </div>
        </div>

        {/* Selector de cajeros con toggle */}
        <div className="flex flex-wrap gap-2">
          {topCashiers.map((cashier, idx) => {
            const isActive = selectedCashiers.length === 0 || selectedCashiers.includes(cashier.id);
            const colorConfig = CASHIER_COLORS[idx] || CASHIER_COLORS[0];
            
            return (
              <motion.button
                key={cashier.id}
                onClick={() => toggleCashier(cashier.id)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-xl border-2 transition-all text-xs font-bold flex items-center gap-2 ${
                  isActive 
                    ? `bg-gradient-to-r ${colorConfig.gradient} text-white border-white shadow-lg`
                    : 'bg-white/60 text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${isActive ? 'border-white' : 'border-gray-200'}`}>
                  {cashier.photo_url ? (
                    <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xs font-black ${isActive ? 'bg-white/30' : 'bg-gray-100'}`}>
                      {cashier.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="truncate max-w-[80px]">{cashier.name?.split(' ')[0]}</span>
                {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chart - Barras apiladas por día */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <defs>
              {activeCashiers.map((cashier, idx) => {
                const colorConfig = CASHIER_COLORS[idx] || CASHIER_COLORS[0];
                return (
                  <linearGradient key={cashier.id} id={`grad-${cashier.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorConfig.solid} stopOpacity={0.9}>
                      <animate attributeName="stopOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor={colorConfig.solid} stopOpacity={0.6}>
                      <animate attributeName="stopOpacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                    </stop>
                  </linearGradient>
                );
              })}
              <filter id="trendGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v) => {
                if (metricType === 'sales') return `$${(v/1000000).toFixed(1)}M`;
                if (metricType === 'ticket') return `$${(v/1000).toFixed(0)}K`;
                return v;
              }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border-2 border-pink-200"
                  >
                    <p className="font-black text-gray-800 mb-3 text-sm">{data.fullDate}</p>
                    <div className="space-y-2">
                      {activeCashiers.map((cashier, idx) => {
                        const value = data[cashier.id] || 0;
                        if (value === 0) return null;
                        const colorConfig = CASHIER_COLORS[idx] || CASHIER_COLORS[0];
                        return (
                          <div key={cashier.id} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${colorConfig.gradient}`} />
                            <div className="flex-1 flex items-center gap-2">
                              {cashier.photo_url && (
                                <img src={cashier.photo_url} alt={cashier.name} className="w-5 h-5 rounded-full object-cover" />
                              )}
                              <span className="text-xs font-medium text-gray-700 truncate">{cashier.name?.split(' ')[0]}</span>
                            </div>
                            <span className="text-xs font-black text-gray-900">{formatValue(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              }}
            />
            {activeCashiers.map((cashier, idx) => (
              <Bar
                key={cashier.id}
                dataKey={cashier.id}
                stackId="a"
                fill={`url(#grad-${cashier.id})`}
                radius={idx === activeCashiers.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                filter="url(#trendGlow)"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen de totales */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {activeCashiers.map((cashier, idx) => {
          const colorConfig = CASHIER_COLORS[idx] || CASHIER_COLORS[0];
          return (
            <motion.div
              key={cashier.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${colorConfig.gradient} rounded-xl p-3 text-white shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white">
                  {cashier.photo_url ? (
                    <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/30 flex items-center justify-center text-xs font-black">
                      {cashier.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold truncate">{cashier.name?.split(' ')[0]}</span>
              </div>
              <p className="text-lg font-black">{formatValue(cashierTotals[cashier.id])}</p>
              <p className="text-[10px] text-white/80">Total período</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}