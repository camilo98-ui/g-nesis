import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 border-2 ${
        isActive ? 'border-pink-400 shadow-xl shadow-pink-500/20' : 'border-transparent shadow-md hover:shadow-lg'
      } ${bgColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div 
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}
          animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
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

// Panel de detalle con gráficas
function DetailPanel({ metric, data, onClose, chartData, formatCurrency }) {
  const getChartContent = () => {
    switch(metric) {
      case 'sales':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">📈 Ventas Diarias</h4>
              <div className="h-64 bg-white rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={3} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Mejor día</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(Math.max(...chartData.map(d => d.ventas || 0)))}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Promedio diario</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(chartData.reduce((a, b) => a + (b.ventas || 0), 0) / Math.max(chartData.length, 1))}
                </p>
              </div>
            </div>
          </div>
        );
      case 'tickets':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">🎫 Tickets por Día</h4>
              <div className="h-64 bg-white rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">💡 Insight</p>
              <p className="text-gray-700">Mayor flujo de clientes = más oportunidades de venta. Considera promociones en días de bajo tráfico.</p>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">⚡ Transacciones Diarias</h4>
              <div className="h-64 bg-white rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'suggested':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">🎁 Sugeridos Vendidos</h4>
              <div className="h-64 bg-white rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSuggested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="suggested" stroke="#f472b6" strokeWidth={3} fill="url(#colorSuggested)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">💡 Tip</p>
              <p className="text-gray-700">Los sugeridos aumentan el ticket promedio. Capacita al equipo en técnicas de venta sugerida.</p>
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
                  chartData={chartData}
                  onClose={() => setActiveMetric(null)}
                  formatCurrency={formatCurrency}
                />
              )}
            </AnimatePresence>

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
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Ticket Promedio</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.tickets > 0 ? totals.sales / totals.tickets : 0)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Trans/Ticket</p>
                  <p className="text-2xl font-bold">{totals.tickets > 0 ? (totals.transactions / totals.tickets).toFixed(2) : '0'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Sugeridos/Ticket</p>
                  <p className="text-2xl font-bold">{totals.tickets > 0 ? (totals.suggested / totals.tickets).toFixed(2) : '0'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Días Registrados</p>
                  <p className="text-2xl font-bold">{filteredSales.length}</p>
                </div>
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