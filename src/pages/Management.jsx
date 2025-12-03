import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  ArrowLeft, Lock, TrendingUp, TrendingDown, Users, Store, 
  Target, AlertTriangle, Activity, Award, DollarSign, Calendar, MapPin,
  BarChart3, PieChart, Zap, Crown, Medal, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { format, startOfMonth, subDays, isToday, isYesterday, startOfWeek, endOfWeek, addWeeks, startOfYear, getWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const ACCESS_CODE = '1998';

// KPI Card Component
const KPICard = ({ title, value, subvalue, icon: Icon, trend, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring" }}
    whileHover={{ scale: 1.02, y: -3 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-5 shadow-lg relative overflow-hidden`}
  >
    <motion.div
      className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-sm font-medium">{title}</span>
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <motion.p 
        className="text-3xl font-black text-white"
        key={value}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {value}
      </motion.p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-white/70 text-xs">{subvalue}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

// Store Performance Card
const StoreCard = ({ store, rank, formatCurrency }) => {
  const statusColors = {
    good: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    critical: 'border-rose-200 bg-rose-50/50'
  };
  const statusBadge = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-2xl p-4 border-2 ${statusColors[store.status]} transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {rank <= 3 && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              rank === 1 ? 'bg-amber-400' : rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
            } text-white text-xs font-bold`}>
              {rank}
            </div>
          )}
          <span className="font-bold text-gray-800">{getDisplayName(store.code)}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusBadge[store.status]} animate-pulse`} />
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Cumplimiento</span>
            <span className={`font-bold ${
              store.compliance >= 90 ? 'text-emerald-600' : 
              store.compliance >= 70 ? 'text-amber-600' : 'text-rose-600'
            }`}>{store.compliance.toFixed(0)}%</span>
          </div>
          <Progress 
            value={Math.min(store.compliance, 100)} 
            className={`h-2 ${
              store.status === 'good' ? '[&>div]:bg-emerald-500' : 
              store.status === 'warning' ? '[&>div]:bg-amber-500' : '[&>div]:bg-rose-500'
            }`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">${(store.totalSales/1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-gray-400">Ventas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">${(store.avgTicket/1000).toFixed(0)}K</p>
            <p className="text-[10px] text-gray-400">Ticket</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Management() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Código incorrecto');
      setCode('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Acceso Gerencial</h1>
            <p className="text-white/60 text-sm">Panel ejecutivo de la zona</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em] h-14 bg-white/10 border-white/20 text-white placeholder:text-white/30"
              maxLength={4}
            />
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm text-center">
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white h-12 font-semibold">
              Ingresar
            </Button>
          </form>

          <Link to={createPageUrl('Home')} className="block mt-6 text-center text-white/50 hover:text-pink-400 text-sm transition-colors">
            ← Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  return <ManagementDashboard />;
}

function ManagementDashboard() {
  const [dateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });

  // Fetch all data
  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiersManagement'],
    queryFn: () => base44.entities.Cashier.list()
  });

  const { data: allShiftRecords = [] } = useQuery({
    queryKey: ['allShiftRecordsManagement'],
    queryFn: () => base44.entities.ShiftRecord.list()
  });

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['allDailySalesManagement'],
    queryFn: () => base44.entities.DailySales.list()
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['allBudgetsManagement'],
    queryFn: () => base44.entities.Budget.list()
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter data by date range
  const filteredDailySales = useMemo(() => {
    return allDailySales.filter(s => {
      const d = new Date(s.date);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [allDailySales, dateRange]);

  // Process store performance data
  const storePerformance = useMemo(() => {
    return STORES.map(store => {
      const storeSales = filteredDailySales.filter(s => s.store_id === store.code);
      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      
      const budget = allBudgets.find(b => 
        b.store_id === store.code && b.month === currentMonth && b.year === currentYear
      );
      const budgetAmount = budget?.sales_budget || 0;
      const compliance = budgetAmount > 0 ? (totalSales / budgetAmount) * 100 : 0;
      
      const todaySales = allDailySales.find(s => 
        s.store_id === store.code && isToday(new Date(s.date))
      );
      const yesterdaySales = allDailySales.find(s => 
        s.store_id === store.code && isYesterday(new Date(s.date))
      );

      const daysElapsed = storeSales.length || 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const projection = daysElapsed > 0 ? (totalSales / daysElapsed) * daysInMonth : 0;

      let status = 'good';
      if (compliance < 70) status = 'critical';
      else if (compliance < 90) status = 'warning';

      return {
        ...store,
        totalSales,
        totalTickets,
        avgTicket: totalTickets > 0 ? totalSales / totalTickets : 0,
        budget: budgetAmount,
        compliance,
        todaySales: todaySales?.total_sales || 0,
        yesterdaySales: yesterdaySales?.total_sales || 0,
        projection,
        status,
        daysElapsed
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredDailySales, allDailySales, allBudgets, currentMonth, currentYear]);

  // Zone totals
  const zoneTotals = useMemo(() => {
    const totalSales = storePerformance.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storePerformance.reduce((sum, s) => sum + s.budget, 0);
    const totalProjection = storePerformance.reduce((sum, s) => sum + s.projection, 0);
    const todayTotal = storePerformance.reduce((sum, s) => sum + s.todaySales, 0);
    const yesterdayTotal = storePerformance.reduce((sum, s) => sum + s.yesterdaySales, 0);
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const avgTicket = storePerformance.reduce((sum, s) => sum + s.avgTicket, 0) / Math.max(storePerformance.length, 1);

    return { totalSales, totalBudget, totalProjection, todayTotal, yesterdayTotal, compliance, avgTicket };
  }, [storePerformance]);

  // Top cashiers
  const topCashiers = useMemo(() => {
    const filteredRecords = allShiftRecords.filter(r => {
      const d = new Date(r.date);
      return d >= dateRange.from && d <= dateRange.to;
    });
    
    const cashierStats = {};
    filteredRecords.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = {
          cashier_id: record.cashier_id,
          store_id: record.store_id,
          totalSales: 0,
          totalTickets: 0,
          shifts: 0
        };
      }
      cashierStats[record.cashier_id].totalSales += record.sales || 0;
      cashierStats[record.cashier_id].totalTickets += record.tickets || 0;
      cashierStats[record.cashier_id].shifts += 1;
    });

    return Object.values(cashierStats)
      .map(stats => ({
        ...stats,
        cashier: allCashiers.find(c => c.id === stats.cashier_id) || { name: 'Desconocido' },
        storeName: getDisplayName(stats.store_id),
        avgTicket: stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }, [allShiftRecords, allCashiers, dateRange]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySalesData = filteredDailySales.filter(s => s.date === dateStr);
      const daySales = daySalesData.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd', { locale: es }),
        sales: daySales
      };
    });
  }, [filteredDailySales, dateRange]);

  // Distribution by status
  const statusDistribution = useMemo(() => [
    { name: 'Óptimo', value: storePerformance.filter(s => s.status === 'good').length, color: '#10b981' },
    { name: 'Alerta', value: storePerformance.filter(s => s.status === 'warning').length, color: '#f59e0b' },
    { name: 'Crítico', value: storePerformance.filter(s => s.status === 'critical').length, color: '#ef4444' }
  ], [storePerformance]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(v);

  const criticalStores = storePerformance.filter(s => s.status === 'critical');
  const warningStores = storePerformance.filter(s => s.status === 'warning');
  const goodStores = storePerformance.filter(s => s.status === 'good');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <FloatingIceCreamsBg />
      
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <motion.h1 
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Panel Gerencial
              </motion.h1>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                Bogotá Noroccidente • {format(new Date(), 'MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.div 
              className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${
                zoneTotals.compliance >= 90 ? 'bg-emerald-100 text-emerald-700' :
                zoneTotals.compliance >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-4 h-4" />
              {zoneTotals.compliance.toFixed(0)}% Zona
            </motion.div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Venta del Mes"
            value={`$${(zoneTotals.totalSales/1000000).toFixed(1)}M`}
            subvalue={`Meta: $${(zoneTotals.totalBudget/1000000).toFixed(1)}M`}
            icon={DollarSign}
            trend={(zoneTotals.totalSales / Math.max(zoneTotals.totalBudget, 1) - 1) * 100}
            color="from-pink-500 to-rose-500"
            delay={0}
          />
          <KPICard
            title="Proyección"
            value={`$${(zoneTotals.totalProjection/1000000).toFixed(1)}M`}
            subvalue={`${((zoneTotals.totalProjection / Math.max(zoneTotals.totalBudget, 1)) * 100).toFixed(0)}% de meta`}
            icon={Target}
            color="from-violet-500 to-purple-500"
            delay={0.1}
          />
          <KPICard
            title="Venta Hoy"
            value={`$${(zoneTotals.todayTotal/1000000).toFixed(1)}M`}
            subvalue={zoneTotals.todayTotal >= zoneTotals.yesterdayTotal ? '↑ vs ayer' : '↓ vs ayer'}
            icon={Zap}
            trend={zoneTotals.yesterdayTotal > 0 ? ((zoneTotals.todayTotal / zoneTotals.yesterdayTotal) - 1) * 100 : 0}
            color="from-emerald-500 to-teal-500"
            delay={0.2}
          />
          <KPICard
            title="Ticket Promedio"
            value={`$${(zoneTotals.avgTicket/1000).toFixed(0)}K`}
            subvalue="Promedio zona"
            icon={BarChart3}
            color="from-amber-500 to-orange-500"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Trend */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-500" />
                  Tendencia de Ventas - {format(new Date(), 'MMMM', { locale: es })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="salesGradMgmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(v) => [formatCurrency(v), 'Ventas']}
                      labelFormatter={(l, p) => p?.[0]?.payload?.fullDate || l}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={3} fill="url(#salesGradMgmt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Store Performance Grid */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Store className="w-4 h-4 text-pink-500" />
                  Rendimiento por Tienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {storePerformance.slice(0, 9).map((store, idx) => (
                    <StoreCard key={store.code} store={store} rank={idx + 1} formatCurrency={formatCurrency} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-pink-500" />
                  Estado de Tiendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={180} height={180}>
                    <RechartsPie>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {statusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {criticalStores.length > 0 && (
              <Card className="bg-rose-50/80 backdrop-blur-sm border-rose-200 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tiendas Críticas ({criticalStores.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {criticalStores.map(store => (
                    <div key={store.code} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="font-medium text-slate-700">{getDisplayName(store.code)}</span>
                      <span className="text-rose-600 font-bold">{store.compliance.toFixed(0)}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top Cashiers */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Cajeros del Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topCashiers.slice(0, 5).map((cashier, idx) => (
                  <motion.div 
                    key={cashier.cashier_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' : 
                      idx === 1 ? 'bg-slate-300 text-white' : 
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{cashier.cashier?.name}</p>
                      <p className="text-[10px] text-slate-400">{cashier.storeName}</p>
                    </div>
                    <p className="text-sm font-bold text-pink-600">${(cashier.totalSales/1000000).toFixed(1)}M</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action */}
        <motion.div 
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to={createPageUrl('Reports')}>
            <Button className="bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-xl px-8 py-6 rounded-2xl gap-3 hover:from-slate-800 hover:to-slate-900 text-base">
              <Store className="w-5 h-5" />
              Ver Panel Completo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}