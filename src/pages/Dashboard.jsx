import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import AnimatedIcon from '@/components/AnimatedIcon';
import { 
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, PieChart, Activity, Target, AlertTriangle, CheckCircle2, 
  Lightbulb, Heart, ThermometerSun
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

// Stat Card with advice
function StatCardWithAdvice({ title, value, budget, icon: Icon, color, format: formatType = "number", advice }) {
  const percentage = budget ? ((value / budget) * 100).toFixed(1) : 0;
  const isPositive = percentage >= 100;
  const isWarning = percentage >= 70 && percentage < 100;
  const isCritical = percentage < 70;

  const formatValue = (val) => {
    if (formatType === "currency") {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO').format(val);
  };

  const colorClasses = {
    pink: { bg: 'bg-gradient-to-br from-pink-100 to-rose-100', icon: 'text-pink-500', border: 'border-pink-200' },
    purple: { bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100', icon: 'text-purple-500', border: 'border-purple-200' },
    blue: { bg: 'bg-gradient-to-br from-blue-100 to-cyan-100', icon: 'text-blue-500', border: 'border-blue-200' },
    green: { bg: 'bg-gradient-to-br from-emerald-100 to-teal-100', icon: 'text-emerald-500', border: 'border-emerald-200' },
    yellow: { bg: 'bg-gradient-to-br from-yellow-100 to-amber-100', icon: 'text-yellow-600', border: 'border-yellow-200' },
    fuchsia: { bg: 'bg-gradient-to-br from-fuchsia-100 to-pink-100', icon: 'text-fuchsia-500', border: 'border-fuchsia-200' },
  };

  const colorStyle = colorClasses[color] || colorClasses.pink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border ${colorStyle.border} p-5 overflow-hidden relative`}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div 
          whileHover={{ rotate: [0, -10, 10, 0] }}
          className={`p-3 rounded-xl ${colorStyle.bg}`}
        >
          <Icon className={`w-5 h-5 ${colorStyle.icon}`} />
        </motion.div>
        {budget > 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPositive ? 'bg-green-100 text-green-700' : 
            isWarning ? 'bg-yellow-100 text-yellow-700' : 
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
      <p className="text-2xl font-bold text-gray-800">{formatValue(value)}</p>
      
      {budget > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                isPositive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                isWarning ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Meta: {formatValue(budget)}</p>
        </div>
      )}

      {/* Advice */}
      {advice && (
        <div className={`mt-4 p-3 rounded-xl text-xs ${
          advice.type === 'success' ? 'bg-green-50 text-green-700' :
          advice.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{advice.message}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Health Score Component
function HealthScore({ score, label }) {
  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getLabel = () => {
    if (score >= 80) return '¡Excelente!';
    if (score >= 60) return 'Puede mejorar';
    return 'Necesita atención';
  };

  const data = [{ name: 'Score', value: score, fill: getColor() }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-fuchsia-100 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-fuchsia-500" />
        <h3 className="font-semibold text-gray-800">Salud de la Tienda</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                background={{ fill: '#f3f4f6' }}
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="relative -mt-20 text-center">
            <p className="text-3xl font-bold text-gray-800">{score}</p>
            <p className="text-xs text-gray-500">/ 100</p>
          </div>
        </div>
        <div className="flex-grow">
          <p className={`text-lg font-semibold ${
            score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getLabel()}
          </p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  // Fetch data
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Current month budget
  const currentBudget = useMemo(() => {
    const now = new Date();
    return budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};
  }, [budgets]);

  // Filter data by date range
  const filteredSales = useMemo(() => {
    return dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [dailySales, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  // Calculate health score
  const healthScore = useMemo(() => {
    let score = 50;
    const salesPct = currentBudget.sales_budget ? (totals.sales / currentBudget.sales_budget * 100) : 50;
    const ticketPct = currentBudget.tickets_budget ? (totals.tickets / currentBudget.tickets_budget * 100) : 50;
    
    if (salesPct >= 100) score += 30;
    else if (salesPct >= 80) score += 20;
    else if (salesPct >= 60) score += 10;
    
    if (ticketPct >= 100) score += 20;
    else if (ticketPct >= 80) score += 10;
    
    return Math.min(100, Math.round(score));
  }, [totals, currentBudget]);

  // Generate advice
  const getAdvice = (type, value, budget) => {
    const pct = budget ? (value / budget * 100) : 0;
    
    if (type === 'sales') {
      if (pct >= 100) return { type: 'success', message: '¡Felicitaciones! Has superado la meta. Mantén este ritmo.' };
      if (pct >= 80) return { type: 'warning', message: 'Estás cerca de la meta. Un pequeño esfuerzo más y lo logras.' };
      return { type: 'error', message: 'Las ventas están por debajo. Considera promociones o incentivos.' };
    }
    if (type === 'tickets') {
      if (pct >= 100) return { type: 'success', message: '¡Excelente flujo de clientes! Sigue así.' };
      if (pct >= 80) return { type: 'warning', message: 'Buen tráfico. Intenta aumentar la conversión.' };
      return { type: 'error', message: 'Pocos clientes. Revisa la ubicación o promociones.' };
    }
    if (type === 'suggested') {
      if (pct >= 100) return { type: 'success', message: '¡Gran trabajo en sugeridos! El equipo está motivado.' };
      if (pct >= 80) return { type: 'warning', message: 'Buenos sugeridos. Refuerza el entrenamiento.' };
      return { type: 'error', message: 'Mejorar técnica de sugeridos. Considera capacitación.' };
    }
    return null;
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const dailyBudget = currentBudget.sales_budget ? currentBudget.sales_budget / 30 : 0;
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find(s => s.date === dayStr) || {};
      return {
        date: format(day, 'dd', { locale: es }),
        ventas: dayData.total_sales || 0,
        meta: dailyBudget
      };
    });
  }, [dateRange, dailySales, currentBudget]);

  // Shift distribution
  const shiftDistribution = useMemo(() => {
    const distribution = { morning: 0, afternoon: 0, night: 0 };
    shiftRecords.forEach(r => {
      distribution[r.shift] = (distribution[r.shift] || 0) + (r.sales || 0);
    });
    return [
      { name: 'Mañana', value: distribution.morning, color: '#fbbf24' },
      { name: 'Tarde', value: distribution.afternoon, color: '#d946ef' },
      { name: 'Noche', value: distribution.night, color: '#6366f1' }
    ].filter(d => d.value > 0);
  }, [shiftRecords]);

  const daysElapsed = differenceInDays(new Date(), startOfMonth(new Date())) + 1;
  const totalDays = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;
  const monthTotalSales = useMemo(() => {
    const now = new Date();
    return dailySales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);
  }, [dailySales]);

  const dailyAverage = daysElapsed > 0 ? monthTotalSales / daysElapsed : 0;
  const projectedSales = dailyAverage * totalDays;
  const projectedPct = currentBudget.sales_budget ? (projectedSales / currentBudget.sales_budget * 100).toFixed(1) : 0;

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/30 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-fuchsia-100">
                <ArrowLeft className="w-5 h-5 text-fuchsia-600" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <AnimatedIcon icon={BarChart3} color="purple" size="md" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-800">Dashboard</h1>
                {selectedStore && (
                  <p className="text-sm text-fuchsia-600/70">{selectedStore} - {selectedStoreName}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {selectedStore ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Health Score & Projection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HealthScore 
                score={healthScore} 
                label={`Basado en cumplimiento de ventas y tickets`}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl shadow-xl p-6 text-white relative overflow-hidden ${
                  projectedPct >= 100 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  projectedPct >= 80 ? 'bg-gradient-to-br from-yellow-500 to-amber-500' :
                  'bg-gradient-to-br from-red-500 to-rose-600'
                }`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Proyección de Cierre</h3>
                  </div>
                  <p className="text-3xl font-bold mb-2">{formatCurrency(projectedSales)}</p>
                  <p className="text-white/80">Proyectado al {projectedPct}% del presupuesto</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-white/70">
                    <span>Día {daysElapsed}/{totalDays}</span>
                    <span>•</span>
                    <span>Prom. diario: {formatCurrency(dailyAverage)}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardWithAdvice 
                title="Ventas" 
                value={totals.sales}
                budget={currentBudget.sales_budget || 0}
                icon={DollarSign}
                color="green"
                format="currency"
                advice={getAdvice('sales', totals.sales, currentBudget.sales_budget)}
              />
              <StatCardWithAdvice 
                title="Tickets" 
                value={totals.tickets}
                budget={currentBudget.tickets_budget || 0}
                icon={Receipt}
                color="blue"
                advice={getAdvice('tickets', totals.tickets, currentBudget.tickets_budget)}
              />
              <StatCardWithAdvice 
                title="Transacciones" 
                value={totals.transactions}
                budget={currentBudget.transactions_budget || 0}
                icon={Zap}
                color="purple"
              />
              <StatCardWithAdvice 
                title="Sugeridos" 
                value={totals.suggested}
                budget={currentBudget.suggested_budget || 0}
                icon={Gift}
                color="pink"
                advice={getAdvice('suggested', totals.suggested, currentBudget.suggested_budget)}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Sales Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-fuchsia-100 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-fuchsia-500" />
                  Ventas Diarias vs Meta
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="ventas" stroke="#d946ef" strokeWidth={3} fill="url(#colorVentas)" />
                      <Line type="monotone" dataKey="meta" stroke="#6366f1" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Shift Distribution */}
              {shiftDistribution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-fuchsia-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-fuchsia-500" />
                    Por Turno
                  </h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={shiftDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {shiftDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-fuchsia-100 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-fuchsia-500" />
                Indicadores Clave
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-fuchsia-50 to-transparent rounded-xl">
                  <span className="text-sm text-gray-500">Ticket Promedio</span>
                  <p className="text-xl font-bold text-fuchsia-600">{formatCurrency(totals.tickets > 0 ? totals.sales / totals.tickets : 0)}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl">
                  <span className="text-sm text-gray-500">Trans/Ticket</span>
                  <p className="text-xl font-bold text-blue-600">{totals.tickets > 0 ? (totals.transactions / totals.tickets).toFixed(2) : '0'}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl">
                  <span className="text-sm text-gray-500">Sugeridos/Ticket</span>
                  <p className="text-xl font-bold text-green-600">{totals.tickets > 0 ? (totals.suggested / totals.tickets).toFixed(2) : '0'}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl">
                  <span className="text-sm text-gray-500">Días Registrados</span>
                  <p className="text-xl font-bold text-purple-600">{filteredSales.length}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📊
            </motion.div>
            <h2 className="text-xl font-bold text-fuchsia-700 mb-2">Selecciona una tienda</h2>
            <p className="text-fuchsia-600/60">Para ver el dashboard de estadísticas</p>
          </div>
        )}
      </div>
    </div>
  );
}