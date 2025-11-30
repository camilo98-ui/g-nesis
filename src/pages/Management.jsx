import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  ArrowLeft, Lock, TrendingUp, TrendingDown, Users, Store, 
  Target, AlertTriangle, CheckCircle, Clock, BarChart3, 
  PieChart, Activity, Zap, Award, MapPin, DollarSign
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { format, startOfMonth, subDays, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

const ACCESS_CODE = '1998';

const PASTEL_COLORS = ['#FFB5C5', '#B5D8FF', '#C5FFB5', '#FFE4B5', '#E0B5FF', '#B5FFE4', '#FFB5E0', '#B5C5FF'];

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <FloatingIceCreamsBg />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🔐
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Gerencia</h1>
            <p className="text-gray-500 text-sm">Ingresa el código de acceso</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••"
                className="pl-10 text-center text-2xl tracking-widest h-14"
                maxLength={4}
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white h-12">
              Ingresar
            </Button>
          </form>

          <Link to={createPageUrl('Home')} className="block mt-6 text-center text-gray-400 hover:text-pink-500 text-sm">
            ← Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  return <ManagementDashboard />;
}

function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all data
  const { data: allStores = [] } = useQuery({
    queryKey: ['allStores'],
    queryFn: () => base44.entities.Store.list()
  });

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

  // Process store performance data
  const storePerformance = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    
    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => 
        s.store_id === store.code && new Date(s.date) >= monthStart
      );
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

      const daysElapsed = new Date().getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const projection = daysElapsed > 0 ? (totalSales / daysElapsed) * daysInMonth : 0;
      const projectionCompliance = budgetAmount > 0 ? (projection / budgetAmount) * 100 : 0;

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
        projectionCompliance,
        status,
        daysElapsed
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [allDailySales, allBudgets, currentMonth, currentYear]);

  // Zone totals
  const zoneTotals = useMemo(() => {
    const totalSales = storePerformance.reduce((sum, s) => sum + s.totalSales, 0);
    const totalBudget = storePerformance.reduce((sum, s) => sum + s.budget, 0);
    const totalProjection = storePerformance.reduce((sum, s) => sum + s.projection, 0);
    const todayTotal = storePerformance.reduce((sum, s) => sum + s.todaySales, 0);
    const yesterdayTotal = storePerformance.reduce((sum, s) => sum + s.yesterdaySales, 0);
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const projectionCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : 0;

    return { totalSales, totalBudget, totalProjection, todayTotal, yesterdayTotal, compliance, projectionCompliance };
  }, [storePerformance]);

  // Top cashiers
  const topCashiers = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthRecords = allShiftRecords.filter(r => new Date(r.date) >= monthStart);
    
    const cashierStats = {};
    monthRecords.forEach(record => {
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
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id,
        avgTicket: stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }, [allShiftRecords, allCashiers]);

  // Sales by hour (simulated based on shift data)
  const salesByHour = useMemo(() => {
    const todayRecords = allShiftRecords.filter(r => isToday(new Date(r.date)));
    const shiftSales = { morning: 0, afternoon: 0, night: 0 };
    
    todayRecords.forEach(r => {
      if (r.shift === 'morning') shiftSales.morning += r.sales || 0;
      else if (r.shift === 'afternoon') shiftSales.afternoon += r.sales || 0;
      else shiftSales.night += r.sales || 0;
    });

    return [
      { name: 'Mañana (6-12)', sales: shiftSales.morning, fill: '#FFB5C5' },
      { name: 'Tarde (12-18)', sales: shiftSales.afternoon, fill: '#B5D8FF' },
      { name: 'Noche (18-22)', sales: shiftSales.night, fill: '#E0B5FF' }
    ];
  }, [allShiftRecords]);

  // Daily trend last 7 days
  const dailyTrend = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySales = allDailySales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);
      days.push({
        date: format(date, 'EEE', { locale: es }),
        fullDate: format(date, 'dd/MM'),
        sales: daySales
      });
    }
    return days;
  }, [allDailySales]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(v);

  const criticalStores = storePerformance.filter(s => s.status === 'critical');
  const warningStores = storePerformance.filter(s => s.status === 'warning');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Gerencial</h1>
              <p className="text-gray-500 text-sm">Zona Bogotá Noroccidente • {format(new Date(), 'MMMM yyyy', { locale: es })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${zoneTotals.compliance >= 90 ? 'bg-green-500' : zoneTotals.compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm font-medium text-gray-700">{zoneTotals.compliance.toFixed(1)}% cumplimiento</span>
          </div>
        </div>

        {/* Zone Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-pink-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-pink-600" />
              </div>
              <span className="text-xs text-gray-500">Venta Mes</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-800">{formatCurrency(zoneTotals.totalSales)}</p>
            <p className="text-xs text-gray-400">de {formatCurrency(zoneTotals.totalBudget)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Proyección</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-800">{formatCurrency(zoneTotals.totalProjection)}</p>
            <p className={`text-xs ${zoneTotals.projectionCompliance >= 100 ? 'text-green-500' : 'text-amber-500'}`}>
              {zoneTotals.projectionCompliance.toFixed(1)}% del presupuesto
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Hoy</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-800">{formatCurrency(zoneTotals.todayTotal)}</p>
            <p className={`text-xs flex items-center gap-1 ${zoneTotals.todayTotal >= zoneTotals.yesterdayTotal ? 'text-green-500' : 'text-red-500'}`}>
              {zoneTotals.todayTotal >= zoneTotals.yesterdayTotal ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              vs ayer {formatCurrency(zoneTotals.yesterdayTotal)}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-500">Críticas</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-800">{criticalStores.length} tiendas</p>
            <p className="text-xs text-amber-500">{warningStores.length} en alerta</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 p-1 rounded-xl grid grid-cols-3 w-full max-w-lg mx-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="stores" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg gap-1">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Tiendas</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Equipo</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-pink-500" />
                    Tendencia de Ventas (7 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l, p) => p[0]?.payload?.fullDate} />
                      <Area type="monotone" dataKey="sales" stroke="#ec4899" fill="url(#salesGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2 bg-pink-50 p-2 rounded-lg">
                    💡 <strong>Análisis:</strong> {dailyTrend[6]?.sales > dailyTrend[5]?.sales 
                      ? 'Las ventas de hoy van por encima del día anterior. ¡Buen ritmo!' 
                      : 'Las ventas de hoy están por debajo. Revisar operación en tiendas críticas.'}
                  </p>
                </CardContent>
              </Card>

              {/* Sales by Shift */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Ventas por Turno (Hoy)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={salesByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                        {salesByHour.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded-lg">
                    💡 <strong>Análisis:</strong> {salesByHour[1]?.sales > salesByHour[0]?.sales 
                      ? 'El turno de la tarde lidera en ventas. Reforzar personal en horario pico.' 
                      : 'Turno de la mañana con buen desempeño. Mantener estrategia.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Store Performance Chart */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Cumplimiento por Tienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={storePerformance.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 120]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="code" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, name) => name === 'compliance' ? `${v.toFixed(1)}%` : formatCurrency(v)} />
                    <Bar dataKey="compliance" radius={[0, 4, 4, 0]} barSize={20}>
                      {storePerformance.slice(0, 10).map((entry, index) => (
                        <Cell key={index} fill={entry.status === 'good' ? '#86efac' : entry.status === 'warning' ? '#fcd34d' : '#fca5a5'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey={() => 100} stroke="#9ca3af" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2 bg-purple-50 p-2 rounded-lg">
                  💡 <strong>Oportunidad:</strong> {criticalStores.length > 0 
                    ? `Las tiendas ${criticalStores.slice(0, 3).map(s => s.code).join(', ')} requieren atención inmediata. Están por debajo del 70% de cumplimiento.`
                    : 'Todas las tiendas van en buen camino hacia la meta mensual.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            {/* Critical Stores Alert */}
            {criticalStores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-red-700">Tiendas Críticas (Menos del 70%)</h3>
                </div>
                <div className="grid gap-2">
                  {criticalStores.map(store => (
                    <div key={store.code} className="bg-white rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{store.code}</p>
                        <p className="text-xs text-gray-500">{store.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-bold">{store.compliance.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">Faltan {formatCurrency(store.budget - store.totalSales)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-600 mt-3 bg-red-100 p-2 rounded-lg">
                  ⚠️ <strong>Acción requerida:</strong> Programar visita de seguimiento y revisar rotación de personal en estas tiendas.
                </p>
              </motion.div>
            )}

            {/* All Stores */}
            <div className="grid gap-3">
              {storePerformance.map((store, index) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${
                    store.status === 'critical' ? 'border-red-200' : 
                    store.status === 'warning' ? 'border-yellow-200' : 'border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        store.status === 'critical' ? 'bg-red-400' : 
                        store.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{store.code}</p>
                        <p className="text-xs text-gray-500">{store.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(store.totalSales)}</p>
                      <p className="text-xs text-gray-400">Meta: {formatCurrency(store.budget)}</p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(store.compliance, 100)} 
                    className={`h-2 ${store.status === 'critical' ? '[&>div]:bg-red-400' : store.status === 'warning' ? '[&>div]:bg-yellow-400' : '[&>div]:bg-green-400'}`}
                  />
                  
                  <div className="flex justify-between mt-2 text-xs">
                    <span className={`font-medium ${store.status === 'critical' ? 'text-red-600' : store.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {store.compliance.toFixed(1)}% cumplimiento
                    </span>
                    <span className="text-gray-500">
                      Proyección: {store.projectionCompliance.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>📊 Ticket prom: {formatCurrency(store.avgTicket)}</span>
                    <span>📅 Hoy: {formatCurrency(store.todaySales)}</span>
                    <span className={store.todaySales >= store.yesterdaySales ? 'text-green-500' : 'text-red-500'}>
                      {store.todaySales >= store.yesterdaySales ? '↑' : '↓'} vs ayer
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top 10 Popsy Stars del Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCashiers.map((cashier, index) => {
                  const avgSalesPerShift = cashier.shifts > 0 ? cashier.totalSales / cashier.shifts : 0;
                  let performance = 'good';
                  if (avgSalesPerShift < 500000) performance = 'critical';
                  else if (avgSalesPerShift < 800000) performance = 'warning';

                  return (
                    <motion.div
                      key={cashier.cashier_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{cashier.cashier?.name}</p>
                        <p className="text-xs text-gray-500">📍 {cashier.storeName} • {cashier.shifts} turnos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatCurrency(cashier.totalSales)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <div className={`w-2 h-2 rounded-full ${
                            performance === 'good' ? 'bg-green-500' : 
                            performance === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-400">{formatCurrency(avgSalesPerShift)}/turno</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 bg-purple-50 p-3 rounded-xl">
              💡 <strong>Análisis de productividad:</strong> Los indicadores de color muestran el rendimiento por turno: 
              <span className="text-green-600 font-medium"> Verde (+$800K)</span>, 
              <span className="text-yellow-600 font-medium"> Amarillo ($500K-$800K)</span>, 
              <span className="text-red-600 font-medium"> Rojo (-$500K)</span>. 
              Considera capacitación adicional para colaboradores en rojo.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}