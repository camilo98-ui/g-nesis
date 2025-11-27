import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import ExportExcel from '@/components/ExportExcel';
import { 
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, AlertTriangle, CheckCircle2, X, FileSpreadsheet
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line, RadialBarChart, RadialBar,
  Treemap, ScatterChart, Scatter, ZAxis
} from 'recharts';

const COLORS = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];

// Metric Card con panel expandible
function MetricCard({ title, value, budget, icon: Icon, bgColor, iconBg, iconColor, format: formatType = "number", onClick, isActive, insight }) {
  const percentage = budget ? ((value / budget) * 100).toFixed(1) : 0;
  const isPositive = percentage >= 100;
  const isWarning = percentage >= 70 && percentage < 100;
  
  const formatValue = (val) => {
    if (formatType === "currency") {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO').format(val);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03, rotate: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      animate={isActive ? { 
        boxShadow: ["0 10px 40px rgba(236,72,153,0.3)", "0 15px 50px rgba(236,72,153,0.4)", "0 10px 40px rgba(236,72,153,0.3)"]
      } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 border-2 ${
        isActive ? 'border-pink-400 shadow-xl shadow-pink-500/20' : 'border-transparent shadow-md hover:shadow-xl'
      } ${bgColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div 
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}
          animate={isActive ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </motion.div>
        {budget > 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            isPositive ? 'bg-green-100 text-green-700' : 
            isWarning ? 'bg-amber-100 text-amber-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {isPositive ? <CheckCircle2 className="w-3 h-3" /> : 
             isWarning ? <AlertTriangle className="w-3 h-3" /> : 
             <TrendingDown className="w-3 h-3" />}
            {percentage}%
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-black text-gray-800">{formatValue(value)}</p>
      
      {budget > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                isPositive ? 'bg-green-400' : isWarning ? 'bg-amber-400' : 'bg-red-400'
              }`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Meta: {formatValue(budget)}</p>
        </div>
      )}

      {insight && (
        <p className="text-xs text-gray-500 mt-2 italic">{insight}</p>
      )}
    </motion.div>
  );
}

// Panel de detalle con gráficas avanzadas
function DetailPanel({ metric, data, onClose, chartData, formatCurrency, shiftData }) {
  // Calcular estadísticas avanzadas
  const stats = useMemo(() => {
    const values = chartData.map(d => d[metric === 'sales' ? 'ventas' : metric] || 0);
    const nonZero = values.filter(v => v > 0);
    const max = Math.max(...values);
    const min = Math.min(...nonZero.length ? nonZero : [0]);
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    const trend = values.length > 1 ? ((values[values.length - 1] - values[0]) / Math.max(values[0], 1)) * 100 : 0;
    
    return { max, min, avg, trend, total: values.reduce((a, b) => a + b, 0) };
  }, [chartData, metric]);

  // Datos para gráfica de distribución por turno
  const shiftDistribution = useMemo(() => {
    if (!shiftData?.length) return [];
    const dist = { morning: 0, afternoon: 0, night: 0 };
    shiftData.forEach(r => {
      const key = metric === 'sales' ? 'sales' : metric === 'tickets' ? 'tickets' : metric === 'transactions' ? 'transactions' : 'suggested_sales';
      dist[r.shift] = (dist[r.shift] || 0) + (r[key] || 0);
    });
    return [
      { name: '🌅 Mañana', value: dist.morning, fill: '#fbbf24' },
      { name: '☀️ Tarde', value: dist.afternoon, fill: '#f472b6' },
      { name: '🌙 Noche', value: dist.night, fill: '#6366f1' }
    ].filter(d => d.value > 0);
  }, [shiftData, metric]);

  const getChartContent = () => {
    switch(metric) {
      case 'sales':
        return (
          <div className="space-y-6">
            {/* Gráfica principal combinada */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📈 Ventas vs Tickets (Comparativo)
              </h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v, name) => [name === 'ventas' ? formatCurrency(v) : v, name === 'ventas' ? 'Ventas' : 'Tickets']}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fill="url(#colorSales)" name="Ventas" />
                    <Line yAxisId="right" type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Tickets" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🏆 Mejor día</p>
                <p className="text-lg font-black text-green-600">{formatCurrency(stats.max)}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">📊 Promedio</p>
                <p className="text-lg font-black text-amber-600">{formatCurrency(stats.avg)}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">📉 Mínimo</p>
                <p className="text-lg font-black text-blue-600">{formatCurrency(stats.min)}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className={`rounded-xl p-4 text-center ${stats.trend >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}>
                <p className="text-xs text-gray-500 mb-1">{stats.trend >= 0 ? '📈' : '📉'} Tendencia</p>
                <p className={`text-lg font-black ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>{stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%</p>
              </motion.div>
            </div>

            {/* Distribución por turno */}
            {shiftDistribution.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">🕐 Distribución por Turno</h4>
                  <div className="h-48 bg-white rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={shiftDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {shiftDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">💡 Insights</h4>
                  {shiftDistribution.map((shift, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{shift.name}</span>
                      <span className="font-bold text-gray-700">{((shift.value / stats.total) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'tickets':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">🎫 Tickets y Ticket Promedio</h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tickets" fill="url(#colorTickets)" radius={[6, 6, 0, 0]} name="Tickets" />
                    <Line yAxisId="right" type="monotone" dataKey="avgTicket" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} name="Ticket Prom." />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Tickets</p>
                <p className="text-2xl font-black text-blue-600">{stats.total.toLocaleString()}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Prom. Diario</p>
                <p className="text-2xl font-black text-amber-600">{Math.round(stats.avg).toLocaleString()}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Mejor Día</p>
                <p className="text-2xl font-black text-green-600">{stats.max.toLocaleString()}</p>
              </motion.div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">💡 Recomendación</p>
              <p className="text-gray-600 text-sm">Mayor flujo de clientes = más oportunidades. Identifica los días de bajo tráfico para lanzar promociones específicas.</p>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">⚡ Transacciones vs Tickets</h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="transactions" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Transacciones" />
                    <Bar dataKey="tickets" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Trans/Ticket</span>
                  <span className="text-2xl font-black text-purple-600">
                    {(chartData.reduce((a, b) => a + (b.transactions || 0), 0) / Math.max(chartData.reduce((a, b) => a + (b.tickets || 0), 0), 1)).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Eficiencia</span>
                  <span className="text-2xl font-black text-cyan-600">85%</span>
                </div>
                <div className="h-2 bg-cyan-200 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'suggested':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">🎁 Sugeridos - Evolución y Metas</h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSuggested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="suggested" stroke="#ec4899" strokeWidth={3} fill="url(#colorSuggested)" name="Sugeridos" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🎯 Total</p>
                <p className="text-2xl font-black text-pink-600">{stats.total.toLocaleString()}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">📊 Promedio</p>
                <p className="text-2xl font-black text-purple-600">{Math.round(stats.avg)}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🏆 Récord</p>
                <p className="text-2xl font-black text-amber-600">{stats.max}</p>
              </motion.div>
            </div>
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
              <p className="text-sm font-medium text-pink-800 mb-1">💡 Tip de Venta</p>
              <p className="text-gray-600 text-sm">Los sugeridos aumentan el ticket promedio un 15-25%. Capacita al equipo en técnicas de venta sugerida y ofrece incentivos por cumplimiento.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const titles = {
    sales: '💰 Análisis de Ventas',
    tickets: '🎫 Análisis de Tickets',
    transactions: '⚡ Análisis de Transacciones',
    suggested: '🎁 Análisis de Sugeridos'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">{titles[metric]}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>
      {getChartContent()}
    </motion.div>
  );
}

export default function Dashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [activeMetric, setActiveMetric] = useState(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Preparar datos de cajeros para exportación
  const cashierExportData = useMemo(() => {
    return shiftRecords
      .filter(r => {
        const date = new Date(r.date);
        return date >= dateRange.from && date <= dateRange.to;
      })
      .map(r => ({
        ...r,
        cashierName: cashiers.find(c => c.id === r.cashier_id)?.name || 'N/A'
      }));
  }, [shiftRecords, cashiers, dateRange]);

  const currentBudget = useMemo(() => {
    const now = new Date();
    return budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};
  }, [budgets]);

  const filteredSales = useMemo(() => {
    return dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [dailySales, dateRange]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find(s => s.date === dayStr) || {};
      return {
        date: format(day, 'dd', { locale: es }),
        ventas: dayData.total_sales || 0,
        tickets: dayData.total_tickets || 0,
        transactions: dayData.total_transactions || 0,
        suggested: dayData.total_suggested || 0
      };
    });
  }, [dateRange, dailySales]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  const getInsight = (type, value, budget) => {
    const pct = budget ? (value / budget * 100) : 0;
    if (type === 'sales') {
      if (pct >= 100) return "🎉 ¡Meta superada!";
      if (pct >= 80) return "👍 Cerca de la meta";
      return "📈 Impulsar ventas";
    }
    return null;
  };

  const metrics = [
    { id: 'sales', title: 'Ventas Totales', value: totals.sales, budget: currentBudget.sales_budget, icon: DollarSign, bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', format: 'currency' },
    { id: 'tickets', title: 'Tickets', value: totals.tickets, budget: currentBudget.tickets_budget, icon: Receipt, bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'transactions', title: 'Transacciones', value: totals.transactions, budget: currentBudget.transactions_budget, icon: Zap, bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'suggested', title: 'Sugeridos', value: totals.suggested, budget: currentBudget.suggested_budget, icon: Gift, bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">Dashboard</h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {/* Export Section */}
            <div className="flex justify-end">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={showExport ? "default" : "outline"}
                  onClick={() => setShowExport(!showExport)}
                  className={`gap-2 ${showExport ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel
                </Button>
              </motion.div>
            </div>

            <AnimatePresence>
              {showExport && (
                <ExportExcel
                  storeData={filteredSales}
                  cashierData={cashierExportData}
                  storeName={selectedStore}
                  dateRange={dateRange}
                  onClose={() => setShowExport(false)}
                />
              )}
            </AnimatePresence>

            {/* Metrics Grid - Clickeable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  title={metric.title}
                  value={metric.value}
                  budget={metric.budget}
                  icon={metric.icon}
                  bgColor={metric.bgColor}
                  iconBg={metric.iconBg}
                  iconColor={metric.iconColor}
                  format={metric.format}
                  onClick={() => setActiveMetric(activeMetric === metric.id ? null : metric.id)}
                  isActive={activeMetric === metric.id}
                  insight={getInsight(metric.id, metric.value, metric.budget)}
                />
              ))}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {activeMetric && (
                <DetailPanel 
                  metric={activeMetric}
                  data={totals}
                  chartData={chartData.map(d => ({
                    ...d,
                    avgTicket: d.tickets > 0 ? d.ventas / d.tickets : 0
                  }))}
                  onClose={() => setActiveMetric(null)}
                  formatCurrency={formatCurrency}
                  shiftData={shiftRecords}
                />
              )}
            </AnimatePresence>

            {/* Overview Charts - Always visible */}
            {!activeMetric && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales Trend */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        Tendencia de Ventas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#salesGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tickets Bar */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        Tickets Diarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Transactions vs Tickets */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        Trans. vs Tickets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="transactions" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                            <Line type="monotone" dataKey="tickets" stroke="#06b6d4" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggested Trend */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-500" />
                        Sugeridos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="sugGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="suggested" stroke="#ec4899" strokeWidth={2} fill="url(#sugGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribution Pie */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        📊 Distribución
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Ventas', value: totals.sales, fill: '#10b981' },
                                { name: 'Tickets', value: totals.tickets * 10000, fill: '#3b82f6' },
                                { name: 'Sugeridos', value: totals.suggested * 5000, fill: '#ec4899' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                            </Pie>
                            <Tooltip />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Indicadores Clave
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer">
                  <p className="text-white/70 text-sm">Ticket Promedio</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.tickets > 0 ? totals.sales / totals.tickets : 0)}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer">
                  <p className="text-white/70 text-sm">Trans/Ticket</p>
                  <p className="text-2xl font-bold">{totals.tickets > 0 ? (totals.transactions / totals.tickets).toFixed(2) : '0'}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer">
                  <p className="text-white/70 text-sm">Sugeridos/Ticket</p>
                  <p className="text-2xl font-bold">{totals.tickets > 0 ? (totals.suggested / totals.tickets).toFixed(2) : '0'}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer">
                  <p className="text-white/70 text-sm">Días Registrados</p>
                  <p className="text-2xl font-bold">{filteredSales.length}</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              📊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver el dashboard de estadísticas</p>
          </div>
        )}
      </div>
    </div>
  );
}