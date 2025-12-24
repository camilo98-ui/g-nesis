import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Receipt, Zap, DollarSign, ChevronRight } from 'lucide-react';
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

  // Meta diaria (distribución proporcional del presupuesto mensual)
  const dailyBudget = store.salesBudget > 0 ? store.salesBudget / 30 : 0;

  // Datos por día con tendencia
  const dailyData = useMemo(() => {
    const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return allDays.map((day, idx) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const sale = storeSales.find(s => s.date === dayStr);
      const sales = sale?.total_sales || 0;
      const tickets = sale?.total_tickets || 0;
      const transactions = sale?.total_transactions || 0;
      const avgTicket = transactions > 0 ? sales / transactions : 0;
      
      // Calcular cumplimiento diario
      const dailyCompliance = dailyBudget > 0 && sales > 0 ? (sales / dailyBudget) * 100 : 0;
      const gap = dailyBudget - sales;
      
      // Tendencia vs día anterior
      let trend = 0;
      if (idx > 0) {
        const prevDay = allDays[idx - 1];
        const prevDayStr = format(prevDay, 'yyyy-MM-dd');
        const prevSale = storeSales.find(s => s.date === prevDayStr);
        const prevSales = prevSale?.total_sales || 0;
        if (prevSales > 0 && sales > 0) {
          trend = sales - prevSales;
        }
      }
      
      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: dayStr,
        dayOfWeek: format(day, 'EEEE', { locale: es }),
        sales,
        tickets,
        transactions,
        avgTicket,
        dailyCompliance,
        gap,
        trend
      };
    });
  }, [storeSales, dateRange, dailyBudget]);

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
        <div className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-lg shadow-lg border border-white/20">
          <p className="text-xs font-semibold text-white mb-1 capitalize">{data.dayOfWeek}</p>
          <p className="text-xs text-slate-400 mb-2">{label}</p>
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl my-4 sm:my-8 overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6 text-white relative overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold mb-1">{store.name}</h2>
                <p className="text-purple-100 text-xs sm:text-sm">{store.code}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Listado de Días con Tendencias */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Desempeño Diario
              </h3>
              <div className="grid grid-cols-1 gap-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
                {dailyData.filter(d => d.sales > 0).map((day, idx) => (
                  <motion.div
                    key={day.fullDate}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white/5 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <p className="text-xs sm:text-sm font-bold text-white capitalize">{day.dayOfWeek}</p>
                          <p className="text-xs text-slate-400">{day.date}</p>
                          {day.trend !== 0 && (
                            <motion.div
                              animate={{ 
                                y: day.trend > 0 ? [0, -2, 0] : [0, 2, 0],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className={`flex items-center gap-1 ${
                                day.trend > 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {day.trend > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-xs font-bold">
                                {formatCurrency(Math.abs(day.trend))}
                              </span>
                            </motion.div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mb-1">PPT Día</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-300">{formatCurrency(dailyBudget)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Venta Real</p>
                            <p className="text-xs sm:text-sm font-bold text-white">{formatCurrency(day.sales)}</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] sm:text-xs text-slate-400">Cumplimiento</span>
                            <p className={`text-base sm:text-lg font-black tabular-nums ${
                              day.dailyCompliance >= 100 ? 'text-emerald-400' :
                              day.dailyCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {day.dailyCompliance.toFixed(0)}%
                            </p>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1 sm:h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(day.dailyCompliance, 100)}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.03 }}
                              className={`h-full ${
                                day.dailyCompliance >= 100 ? 'bg-emerald-500' :
                                day.dailyCompliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <p className={`text-[10px] sm:text-xs font-semibold mt-1 text-right ${
                            day.gap <= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {day.gap <= 0 ? 'Superó por ' : 'Faltó '}{formatCurrency(Math.abs(day.gap))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* KPIs Interactivos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('ventas')}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 group ${
                  activeMetric === 'ventas'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-blue-500/30'
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
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                      activeMetric === 'ventas' ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10'
                    }`}>
                      <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${activeMetric === 'ventas' ? 'text-white' : 'text-blue-400'}`} />
                    </div>
                    <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      activeMetric === 'ventas' ? 'text-white translate-x-0' : 'text-slate-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-bold mb-1 sm:mb-2 ${activeMetric === 'ventas' ? 'text-white/80' : 'text-slate-400'}`}>
                    💰 VENTAS TOTALES
                  </p>
                  <p className={`text-lg sm:text-2xl font-black mb-1 ${activeMetric === 'ventas' ? 'text-white' : 'text-white'}`}>
                    {formatCurrency(totals.totalSales)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1 sm:h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'ventas' ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'ventas' ? 'h-full bg-white' : 'h-full bg-blue-500'}
                      />
                    </div>
                    <p className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${activeMetric === 'ventas' ? 'text-white/90' : 'text-slate-300'}`}>
                      {formatCurrency(totals.avgDailySales)}/día
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('transacciones')}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 group ${
                  activeMetric === 'transacciones'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-amber-500/30'
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
                      activeMetric === 'transacciones' ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10'
                    }`}>
                      <Zap className={`w-5 h-5 ${activeMetric === 'transacciones' ? 'text-white' : 'text-amber-400'}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeMetric === 'transacciones' ? 'text-white translate-x-0' : 'text-slate-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold mb-2 ${activeMetric === 'transacciones' ? 'text-white/80' : 'text-slate-400'}`}>
                    ⚡ TRANSACCIONES
                  </p>
                  <p className={`text-2xl font-black mb-1 ${activeMetric === 'transacciones' ? 'text-white' : 'text-white'}`}>
                    {totals.totalTransactions.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'transacciones' ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'transacciones' ? 'h-full bg-white' : 'h-full bg-amber-500'}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${activeMetric === 'transacciones' ? 'text-white/90' : 'text-slate-300'}`}>
                      {totals.daysWithSales} días
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMetric('ticket')}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 group ${
                  activeMetric === 'ticket'
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/30'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-emerald-500/30'
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
                      activeMetric === 'ticket' ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10'
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${activeMetric === 'ticket' ? 'text-white' : 'text-emerald-400'}`} />
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeMetric === 'ticket' ? 'text-white translate-x-0' : 'text-slate-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold mb-2 ${activeMetric === 'ticket' ? 'text-white/80' : 'text-slate-400'}`}>
                    🎯 TICKET PROMEDIO
                  </p>
                  <p className={`text-2xl font-black mb-1 ${activeMetric === 'ticket' ? 'text-white' : 'text-white'}`}>
                    {formatCurrency(totals.avgTicket)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      activeMetric === 'ticket' ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={activeMetric === 'ticket' ? 'h-full bg-white' : 'h-full bg-emerald-500'}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${activeMetric === 'ticket' ? 'text-white/90' : 'text-slate-300'}`}>
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
                <Card className="border-white/10 shadow-lg bg-white/5 backdrop-blur-xl">
                  <CardHeader className={`bg-gradient-to-r p-4 sm:p-6 ${
                    activeMetric === 'ventas' ? 'from-blue-500 to-indigo-600' :
                    activeMetric === 'transacciones' ? 'from-amber-500 to-orange-600' :
                    'from-emerald-500 to-green-600'
                  }`}>
                    <CardTitle className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                      {activeMetric === 'ventas' && '💰 Análisis Detallado: Ventas vs Promedio Diario'}
                      {activeMetric === 'transacciones' && '⚡ Análisis Detallado: Transacciones vs Objetivos'}
                      {activeMetric === 'ticket' && '🎯 Análisis Detallado: Ticket Promedio vs Tendencia'}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-white/80 mt-1">
                      {activeMetric === 'ventas' && `Comparación de ventas diarias contra el promedio de ${formatCurrency(totals.avgDailySales)}`}
                      {activeMetric === 'transacciones' && `Evolución de transacciones y su impacto en los resultados totales`}
                      {activeMetric === 'ticket' && `Comportamiento del ticket promedio y su relación con las ventas`}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6 p-2 sm:p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      {activeMetric === 'ventas' && (
                        <ComposedChart data={dailyData}>
                          <defs>
                            <linearGradient id="salesGradientDetailed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
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
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
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
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}