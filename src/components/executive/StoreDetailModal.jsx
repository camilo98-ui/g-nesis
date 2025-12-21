import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Receipt, Zap, DollarSign, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StoreDetailModal({ store, onClose, allDailySales, dateRange }) {
  const [activeMetric, setActiveMetric] = useState('ventas');
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
            {/* KPIs Interactivos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('ventas')}
                className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 group ${
                  activeMetric === 'ventas'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200'
                }`}
              >
                <motion.div
                  animate={{ scale: activeMetric === 'ventas' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${
                    activeMetric === 'ventas' ? 'bg-white/10' : 'bg-blue-200/30'
                  }`}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl ${
                      activeMetric === 'ventas' ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-200'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${activeMetric === 'ventas' ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeMetric === 'ventas' ? 'text-white translate-x-0' : 'text-blue-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold mb-2 ${activeMetric === 'ventas' ? 'text-white/80' : 'text-blue-600'}`}>
                    💰 VENTAS TOTALES
                  </p>
                  <p className={`text-2xl font-black mb-1 ${activeMetric === 'ventas' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totals.totalSales)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'ventas' ? 'bg-white/20' : 'bg-blue-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'ventas' ? 'h-full bg-white' : 'h-full bg-blue-600'}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${activeMetric === 'ventas' ? 'text-white/90' : 'text-blue-700'}`}>
                      {formatCurrency(totals.avgDailySales)}/día
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('transacciones')}
                className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 group ${
                  activeMetric === 'transacciones'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-200'
                }`}
              >
                <motion.div
                  animate={{ scale: activeMetric === 'transacciones' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${
                    activeMetric === 'transacciones' ? 'bg-white/10' : 'bg-amber-200/30'
                  }`}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl ${
                      activeMetric === 'transacciones' ? 'bg-white/20 backdrop-blur-sm' : 'bg-amber-200'
                    }`}>
                      <Zap className={`w-5 h-5 ${activeMetric === 'transacciones' ? 'text-white' : 'text-amber-600'}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeMetric === 'transacciones' ? 'text-white translate-x-0' : 'text-amber-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold mb-2 ${activeMetric === 'transacciones' ? 'text-white/80' : 'text-amber-600'}`}>
                    ⚡ TRANSACCIONES
                  </p>
                  <p className={`text-2xl font-black mb-1 ${activeMetric === 'transacciones' ? 'text-white' : 'text-gray-900'}`}>
                    {totals.totalTransactions.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'transacciones' ? 'bg-white/20' : 'bg-amber-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'transacciones' ? 'h-full bg-white' : 'h-full bg-amber-600'}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${activeMetric === 'transacciones' ? 'text-white/90' : 'text-amber-700'}`}>
                      {totals.daysWithSales} días
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('ticket')}
                className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 group ${
                  activeMetric === 'ticket'
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-2 border-emerald-200'
                }`}
              >
                <motion.div
                  animate={{ scale: activeMetric === 'ticket' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${
                    activeMetric === 'ticket' ? 'bg-white/10' : 'bg-emerald-200/30'
                  }`}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl ${
                      activeMetric === 'ticket' ? 'bg-white/20 backdrop-blur-sm' : 'bg-emerald-200'
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${activeMetric === 'ticket' ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeMetric === 'ticket' ? 'text-white translate-x-0' : 'text-emerald-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold mb-2 ${activeMetric === 'ticket' ? 'text-white/80' : 'text-emerald-600'}`}>
                    🎯 TICKET PROMEDIO
                  </p>
                  <p className={`text-2xl font-black mb-1 ${activeMetric === 'ticket' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totals.avgTicket)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'ticket' ? 'bg-white/20' : 'bg-emerald-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'ticket' ? 'h-full bg-white' : 'h-full bg-emerald-600'}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${activeMetric === 'ticket' ? 'text-white/90' : 'text-emerald-700'}`}>
                      vs promedio
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Gráfica Dinámica Detallada */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMetric}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-gray-100 shadow-lg">
                  <CardHeader className={`bg-gradient-to-r ${
                    activeMetric === 'ventas' ? 'from-blue-500 to-indigo-600' :
                    activeMetric === 'transacciones' ? 'from-amber-500 to-orange-600' :
                    'from-emerald-500 to-green-600'
                  }`}>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      {activeMetric === 'ventas' && '💰 Análisis Detallado: Ventas vs Promedio Diario'}
                      {activeMetric === 'transacciones' && '⚡ Análisis Detallado: Transacciones vs Objetivos'}
                      {activeMetric === 'ticket' && '🎯 Análisis Detallado: Ticket Promedio vs Tendencia'}
                    </CardTitle>
                    <p className="text-sm text-white/80 mt-1">
                      {activeMetric === 'ventas' && `Comparación de ventas diarias contra el promedio de ${formatCurrency(totals.avgDailySales)}`}
                      {activeMetric === 'transacciones' && `Evolución de transacciones y su impacto en los resultados totales`}
                      {activeMetric === 'ticket' && `Comportamiento del ticket promedio y su relación con las ventas`}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={350}>
                      {activeMetric === 'ventas' && (
                        <ComposedChart data={dailyData}>
                          <defs>
                            <linearGradient id="salesGradientDetailed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fill="url(#salesGradientDetailed)" 
                            name="Ventas Diarias"
                          />
                          <Line 
                            type="monotone" 
                            dataKey={() => totals.avgDailySales}
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Promedio Esperado"
                          />
                        </ComposedChart>
                      )}
                      {activeMetric === 'transacciones' && (
                        <ComposedChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar 
                            yAxisId="left"
                            dataKey="transactions" 
                            fill="#f59e0b" 
                            name="Transacciones"
                            radius={[6, 6, 0, 0]}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 5 }}
                            name="Ventas Generadas"
                          />
                        </ComposedChart>
                      )}
                      {activeMetric === 'ticket' && (
                        <ComposedChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="avgTicket" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fill="rgba(16, 185, 129, 0.1)"
                            name="Ticket Promedio"
                          />
                          <Line 
                            type="monotone" 
                            dataKey={() => totals.avgTicket}
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Ticket Promedio General"
                          />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}