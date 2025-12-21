import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Receipt, Zap, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StoreDetailModal({ store, onClose, allDailySales, dateRange }) {
  // Filtrar ventas de la tienda en el rango
  const storeSales = useMemo(() => {
    return allDailySales
      .filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= dateRange.from && d <= dateRange.to;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allDailySales, store.code, dateRange]);

  // Datos por día
  const dailyData = useMemo(() => {
    const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return allDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const sale = storeSales.find(s => s.date === dayStr);
      const sales = sale?.total_sales || 0;
      const tickets = sale?.total_tickets || 0;
      const transactions = sale?.total_transactions || 0;
      const avgTicket = transactions > 0 ? sales / transactions : 0;
      
      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: dayStr,
        dayOfWeek: format(day, 'EEEE', { locale: es }),
        sales,
        tickets,
        transactions,
        avgTicket
      };
    });
  }, [storeSales, dateRange]);

  // Datos para venta vs transacciones
  const salesVsTransactions = useMemo(() => {
    return dailyData.map(d => ({
      date: d.date,
      dayOfWeek: d.dayOfWeek,
      ventas: d.sales,
      transacciones: d.transactions
    }));
  }, [dailyData]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900 mb-1 capitalize">{data.dayOfWeek}</p>
          <p className="text-xs text-gray-500 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Venta') || entry.name.includes('Ticket') ? formatCurrency(entry.value) : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Totales
  const totals = useMemo(() => {
    const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const totalTickets = storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
    const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const daysWithSales = storeSales.length;
    const avgDailySales = daysWithSales > 0 ? totalSales / daysWithSales : 0;
    
    return { totalSales, totalTickets, totalTransactions, avgTicket, daysWithSales, avgDailySales };
  }, [storeSales]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{store.name}</h2>
                <p className="text-blue-100 text-sm">{store.code}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">Venta Total</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalSales)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Promedio: {formatCurrency(totals.avgDailySales)}/día
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Receipt className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">Tickets</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{totals.totalTickets.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {totals.daysWithSales} días con venta
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">Transacciones</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{totals.totalTransactions.toLocaleString()}</p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">Ticket Promedio</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.avgTicket)}</p>
              </div>
            </div>

            {/* Gráficas */}
            <div className="space-y-6">
              {/* Ventas por día */}
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    💰 Ventas por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#salesGradient)" 
                        name="Ventas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ticket Promedio por día */}
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    🎯 Ticket Promedio por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgTicket" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        name="Ticket Promedio"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transacciones vs Ventas */}
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    ⚡ Transacciones vs Ventas por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={salesVsTransactions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="ventas" 
                        fill="#3b82f6" 
                        name="Ventas"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="transacciones" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 4 }}
                        name="Transacciones"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}