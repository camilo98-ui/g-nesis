import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';

import GrowthVelocityChart from '@/components/management/GrowthVelocityChart';
import StoreProductivityCard from '@/components/management/StoreProductivityCard';
import ManagementReportButton from '@/components/management/ManagementReportButton';
import ChartInsight from '@/components/management/ChartInsight';
import MarketComparisonChart from '@/components/management/MarketComparisonChart';
import BrandComparisonChart from '@/components/management/BrandComparisonChart';
import TicketAnalysisCard from '@/components/management/TicketAnalysisCard';
import { 
  ArrowLeft, Lock, TrendingUp, TrendingDown, Users, Store, 
  Target, AlertTriangle, Activity, Award, DollarSign, Calendar, MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { format, startOfMonth, subDays, isToday, isYesterday, startOfWeek, endOfWeek, addWeeks, startOfYear, getWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const ACCESS_CODE = '1998';
const PASTEL_COLORS = ['#FFB5C5', '#B5D8FF', '#C5FFB5', '#FFE4B5', '#E0B5FF', '#B5FFE4'];

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
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
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
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('mgmt_selectedWeek');
    return saved ? parseInt(saved) : getWeek(new Date(), { weekStartsOn: 1 });
  });
  const [dateRange, setDateRange] = useState(() => {
    const savedFrom = localStorage.getItem('mgmt_dateFrom');
    const savedTo = localStorage.getItem('mgmt_dateTo');
    if (savedFrom && savedTo) {
      return { from: new Date(savedFrom), to: new Date(savedTo) };
    }
    return { from: startOfMonth(new Date()), to: new Date() };
  });

  // Generate week options
  const weekOptions = useMemo(() => {
    const weeks = [];
    const yearStart = startOfYear(new Date());
    for (let i = 1; i <= 52; i++) {
      const weekStart = addWeeks(startOfWeek(yearStart, { weekStartsOn: 1 }), i - 1);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: i,
        label: `Sem ${i}: ${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`,
        from: weekStart,
        to: weekEnd
      });
    }
    return weeks;
  }, []);

  const handleWeekChange = (weekNum) => {
    const week = weekOptions.find(w => w.value === parseInt(weekNum));
    if (week) {
      setSelectedWeek(parseInt(weekNum));
      setDateRange({ from: week.from, to: week.to });
      localStorage.setItem('mgmt_selectedWeek', weekNum);
      localStorage.setItem('mgmt_dateFrom', week.from.toISOString());
      localStorage.setItem('mgmt_dateTo', week.to.toISOString());
    }
  };
  
  // Guardar fechas cuando cambian por calendario
  const handleDateRangeChange = (range) => {
    if (range?.from) {
      const newRange = { from: range.from, to: range.to || range.from };
      setDateRange(newRange);
      localStorage.setItem('mgmt_dateFrom', newRange.from.toISOString());
      localStorage.setItem('mgmt_dateTo', newRange.to.toISOString());
    }
  };

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

    return { totalSales, totalBudget, totalProjection, todayTotal, yesterdayTotal, compliance };
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
        storeName: STORES.find(s => s.code === stats.store_id)?.name || stats.store_id,
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
      const daySales = filteredDailySales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd MMM', { locale: es }),
        sales: daySales
      };
    });
  }, [filteredDailySales, dateRange]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(v);

  const criticalStores = storePerformance.filter(s => s.status === 'critical');
  const warningStores = storePerformance.filter(s => s.status === 'warning');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-purple-50/30 to-blue-50/50 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard Gerencial</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Bogotá Noroccidente • {format(new Date(), 'MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Week Filter */}
            <Select value={selectedWeek.toString()} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-[200px] bg-white/80">
                <SelectValue placeholder="Semana" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(week => (
                  <SelectItem key={week.value} value={week.value.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Calendar Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/80 gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>

            {/* Report Button */}
            <ManagementReportButton 
              storePerformance={storePerformance}
              zoneTotals={zoneTotals}
              topCashiers={topCashiers}
              formatCurrency={formatCurrency}
              criticalStores={criticalStores}
              warningStores={warningStores}
            />

            {/* Status Badge */}
            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${zoneTotals.compliance >= 90 ? 'bg-green-500' : zoneTotals.compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-xs font-medium text-gray-600">{zoneTotals.compliance.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Zone Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Venta Período', value: formatCurrency(zoneTotals.totalSales), sub: `de ${formatCurrency(zoneTotals.totalBudget)}`, icon: DollarSign, color: 'from-pink-100 to-rose-200' },
            { label: 'Proyección', value: formatCurrency(zoneTotals.totalProjection), sub: `${(zoneTotals.totalBudget > 0 ? (zoneTotals.totalProjection / zoneTotals.totalBudget) * 100 : 0).toFixed(0)}%`, icon: Activity, color: 'from-blue-100 to-cyan-200' },
            { label: 'Hoy', value: formatCurrency(zoneTotals.todayTotal), sub: zoneTotals.todayTotal >= zoneTotals.yesterdayTotal ? '↑ vs ayer' : '↓ vs ayer', icon: TrendingUp, color: 'from-green-100 to-emerald-200' },
            { label: 'Críticas', value: `${criticalStores.length} tiendas`, sub: `${warningStores.length} en alerta`, icon: AlertTriangle, color: 'from-red-100 to-orange-200' },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`bg-gradient-to-br ${card.color} rounded-xl p-3 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-1">
                <card.icon className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/80 p-1 rounded-xl grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-300 data-[state=active]:to-rose-300 data-[state=active]:text-white rounded-lg text-sm">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="stores" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-300 data-[state=active]:to-cyan-300 data-[state=active]:text-white rounded-lg text-sm">
              Tiendas
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-300 data-[state=active]:to-pink-300 data-[state=active]:text-white rounded-lg text-sm">
              Equipo
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Row 1: Productivity + Growth Velocity */}
            <div className="grid md:grid-cols-2 gap-4">
              <StoreProductivityCard 
                storePerformance={storePerformance}
                allCashiers={allCashiers}
                allShiftRecords={allShiftRecords}
                formatCurrency={formatCurrency}
              />
              <GrowthVelocityChart 
                dailyTrend={dailyTrend}
                budget={zoneTotals.totalBudget}
                formatCurrency={formatCurrency}
              />
            </div>

            {/* Row 2: Sales Trend */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <TrendingUp className="w-4 h-4 text-pink-500" />
                  </motion.div>
                  Tendencia de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={dailyTrend}>
                            <defs>
                              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                            <YAxis yAxisId="sales" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#888' }} />
                            <YAxis yAxisId="transactions" orientation="right" tickFormatter={(v) => v} tick={{ fontSize: 10, fill: '#888' }} />
                            <Tooltip 
                              formatter={(v, name) => name === 'sales' ? formatCurrency(v) : `${v} transacciones`} 
                              labelFormatter={(l, p) => p?.[0]?.payload?.fullDate || l} 
                            />
                            <Legend formatter={(value) => value === 'sales' ? 'Ventas' : 'Transacciones'} />
                            <Area yAxisId="sales" type="monotone" dataKey="sales" stroke="#10b981" fill="url(#salesGradient)" strokeWidth={2} name="sales" />
                            <Line yAxisId="transactions" type="monotone" dataKey="transactions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="transactions" />
                          </ComposedChart>
                        </ResponsiveContainer>
                <ChartInsight data={dailyTrend} type="sales" formatCurrency={formatCurrency} />
              </CardContent>
            </Card>

            {/* Row 2.5: Ticket Promedio Diario */}
            <TicketAnalysisCard dailyTrend={dailyTrend} formatCurrency={formatCurrency} />

            {/* Row 3: Store Compliance */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Cumplimiento por Tienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={storePerformance.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="code" type="category" width={50} tick={{ fontSize: 10, fill: '#666' }} />
                    <Tooltip formatter={(v, name) => name === 'compliance' ? `${v.toFixed(1)}%` : formatCurrency(v)} />
                    <Bar dataKey="compliance" radius={[0, 4, 4, 0]} barSize={14}>
                      {storePerformance.slice(0, 10).map((entry, index) => (
                        <Cell key={index} fill={entry.status === 'good' ? '#86efac' : entry.status === 'warning' ? '#fcd34d' : '#fca5a5'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey={() => 100} stroke="#9ca3af" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Row 4: Market & Brand Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <MarketComparisonChart />
              <BrandComparisonChart />
            </div>
          </TabsContent>

          {/* Stores Tab - Compact View */}
          <TabsContent value="stores" className="space-y-4">
            {criticalStores.length > 0 && (
              <Card className="bg-red-50/80 border-red-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tiendas Críticas ({criticalStores.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {criticalStores.map(store => (
                      <div key={store.code} className="bg-white rounded-lg px-3 py-2 text-sm">
                        <span className="font-bold text-gray-800">{store.code}</span>
                        <span className="text-red-500 ml-2">{store.compliance.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {storePerformance.map((store, index) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 border ${
                    store.status === 'critical' ? 'border-red-200' : 
                    store.status === 'warning' ? 'border-yellow-200' : 'border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{store.code}</span>
                    <span className={`text-sm font-bold ${
                      store.status === 'critical' ? 'text-red-500' : 
                      store.status === 'warning' ? 'text-yellow-600' : 'text-green-500'
                    }`}>
                      {store.compliance.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(store.compliance, 100)} 
                    className={`h-1.5 ${store.status === 'critical' ? '[&>div]:bg-red-400' : store.status === 'warning' ? '[&>div]:bg-yellow-400' : '[&>div]:bg-green-400'}`}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>{formatCurrency(store.totalSales)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Top 5 Cajeros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topCashiers.slice(0, 5).map((cashier, i) => (
                    <motion.div 
                      key={cashier.cashier_id}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-2 bg-white/60 rounded-lg p-2"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{cashier.cashier?.name}</p>
                        <p className="text-xs text-gray-400">{cashier.storeName}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(cashier.totalSales)}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top 10 Popsy Stars
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
                  {topCashiers.map((cashier, i) => (
                    <div key={cashier.cashier_id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{cashier.cashier?.name}</p>
                      </div>
                      <p className="font-bold text-gray-700">{formatCurrency(cashier.totalSales)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Panel Button - Panel de Distrito */}
        <motion.div 
          className="mt-8 mb-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to={createPageUrl('Reports')}>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button className="bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-xl px-8 py-6 rounded-2xl gap-3 hover:from-slate-800 hover:to-slate-900 text-base">
                <Store className="w-5 h-5" />
                Panel de Distrito
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}