import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import ZoneComparableModal from '@/components/management/ZoneComparableModal';
import { 
  ArrowLeft, Lock, TrendingUp, TrendingDown, Users, Store, 
  Target, AlertTriangle, Activity, Award, DollarSign, Calendar, MapPin,
  BarChart3, Zap, ChevronRight, Sun, CloudRain, Cloud, Clock,
  Thermometer, Package, ClipboardCheck, Snowflake, Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, ReferenceLine
} from 'recharts';
import { format, startOfMonth, subDays, isToday, isYesterday, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ACCESS_CODE = '1998';
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

// KPI Card Component with Compliance
const KPICard = ({ title, value, subvalue, icon: Icon, trend, color, delay = 0, compliance }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring" }}
    whileHover={{ scale: 1.02, y: -3 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-4 shadow-lg relative overflow-hidden`}
  >
    <motion.div
      className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/80 text-xs font-medium">{title}</span>
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <motion.p className="text-2xl font-black text-white" key={value}>
        {value}
      </motion.p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-white/70 text-[10px]">{subvalue}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      {compliance !== undefined && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[10px]">Cumplimiento</span>
            <span className={`text-xs font-black ${compliance >= 90 ? 'text-green-200' : compliance >= 70 ? 'text-yellow-200' : 'text-red-200'}`}>
              {compliance.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${compliance >= 90 ? 'bg-green-300' : compliance >= 70 ? 'bg-yellow-300' : 'bg-red-300'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(compliance, 100)}%` }}
              transition={{ delay: delay + 0.3, duration: 0.8 }}
            />
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Store Card Component - More Dynamic and Professional
const StoreCard = ({ store, index, formatCurrency }) => {
  const getStatusColor = (value) => value >= 90 ? 'emerald' : value >= 70 ? 'amber' : 'rose';
  const statusColor = getStatusColor(store.compliance);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 150 }}
      whileHover={{ scale: 1.03, y: -5, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.15)' }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:border-pink-200 transition-all relative overflow-hidden group"
    >
      {/* Decorative gradient */}
      <motion.div 
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
          statusColor === 'emerald' ? 'from-emerald-400 to-green-500' : 
          statusColor === 'amber' ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-red-500'
        }`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.04 + 0.2 }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div 
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              statusColor === 'emerald' ? 'from-emerald-100 to-green-100' : 
              statusColor === 'amber' ? 'from-amber-100 to-orange-100' : 'from-rose-100 to-red-100'
            } flex items-center justify-center`}
            whileHover={{ rotate: [0, -10, 10, 0] }}
          >
            <Store className={`w-5 h-5 ${
              statusColor === 'emerald' ? 'text-emerald-600' : 
              statusColor === 'amber' ? 'text-amber-600' : 'text-rose-600'
            }`} />
          </motion.div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{getDisplayName(store.code)}</h3>
            <span className="text-[10px] text-gray-400">{store.code}</span>
          </div>
        </div>
        <motion.div 
          className={`px-2.5 py-1 rounded-full text-xs font-black ${
            statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 
            statusColor === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {store.compliance.toFixed(0)}%
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div 
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${
            statusColor === 'emerald' ? 'from-emerald-400 to-green-500' : 
            statusColor === 'amber' ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(store.compliance, 100)}%` }}
          transition={{ delay: index * 0.04 + 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-black text-gray-800">${(store.totalSales/1000000).toFixed(1)}M</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Ventas</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-black text-gray-800">${(store.avgTicket/1000).toFixed(0)}K</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Ticket</p>
        </div>
      </div>

      {/* Mini indicators */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <ClipboardCheck className={`w-3 h-3 ${store.checklistCompliance >= 80 ? 'text-emerald-500' : 'text-gray-300'}`} />
          <Snowflake className={`w-3 h-3 ${store.freezerEfficiency >= 80 ? 'text-cyan-500' : 'text-gray-300'}`} />
          <Package className={`w-3 h-3 ${store.inventoryAlerts === 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
        </div>
        <span className="text-[9px] text-gray-400">{store.totalTransactions.toLocaleString()} trans.</span>
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
      <div className="min-h-screen bg-white/80 backdrop-blur-sm relative flex items-center justify-center p-4">
        <FloatingIceCreamsBg />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-pink-100 relative z-10"
        >
          <div className="text-center mb-8">
            <motion.img 
              src={LOGO_URL} 
              alt="Popsy" 
              className="h-20 object-contain mx-auto mb-4"
              animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center border border-pink-200"
            >
              <Lock className="w-8 h-8 text-pink-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Gerencial</h1>
            <p className="text-gray-500 text-sm">Panel ejecutivo de la zona</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em] h-14 bg-white/50 border-pink-200 placeholder:text-gray-300"
              maxLength={4}
            />
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm text-center">
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white h-12 font-semibold">
              Ingresar
            </Button>
          </form>

          <Link to={createPageUrl('Home')} className="block mt-6 text-center text-gray-400 hover:text-pink-500 text-sm transition-colors">
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
  const [rankingFilter, setRankingFilter] = useState('sales');
  const [activeSection, setActiveSection] = useState('zona');
  const [showComparable, setShowComparable] = useState(false);

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

  const { data: allChecklists = [] } = useQuery({
    queryKey: ['allChecklistsManagement'],
    queryFn: () => base44.entities.CleaningChecklist.list()
  });

  const { data: allFreezerSlots = [] } = useQuery({
    queryKey: ['allFreezerSlotsManagement'],
    queryFn: () => base44.entities.FreezerSlot.list()
  });

  const { data: allInventoryAlerts = [] } = useQuery({
    queryKey: ['allInventoryAlertsManagement'],
    queryFn: () => base44.entities.InventoryAlert.list()
  });

  const { data: weatherHistory = [] } = useQuery({
    queryKey: ['weatherHistoryManagement'],
    queryFn: () => base44.entities.WeatherHistory.list()
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

  // Zone Totals & Metrics
  const zoneTotals = useMemo(() => {
    let totalSales = 0, totalBudget = 0, totalTickets = 0, totalTransactions = 0;
    let todayTotal = 0, yesterdayTotal = 0;

    STORES.forEach(store => {
      const storeSales = filteredDailySales.filter(s => s.store_id === store.code);
      totalSales += storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      totalTickets += storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      totalTransactions += storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);

      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      totalBudget += budget?.sales_budget || 0;

      const todaySales = allDailySales.find(s => s.store_id === store.code && isToday(new Date(s.date)));
      const yesterdaySales = allDailySales.find(s => s.store_id === store.code && isYesterday(new Date(s.date)));
      todayTotal += todaySales?.total_sales || 0;
      yesterdayTotal += yesterdaySales?.total_sales || 0;
    });

    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : 0;
    const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
    const daysElapsed = eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const projection = daysElapsed > 0 ? (totalSales / daysElapsed) * daysInMonth : 0;

    return { totalSales, totalBudget, totalTickets, totalTransactions, todayTotal, yesterdayTotal, compliance, avgTicket, projection };
  }, [filteredDailySales, allDailySales, allBudgets, dateRange, currentMonth, currentYear]);

  // Daily Zone Trend
  const zoneDailyTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    let cumulative = 0;
    return days.map((day, idx) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySales = filteredDailySales.filter(s => s.date === dateStr);
      const sales = daySales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const tickets = daySales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const transactions = daySales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      cumulative += sales;
      const expected = (zoneTotals.totalBudget / 30) * (idx + 1);
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd', { locale: es }),
        sales, tickets, transactions, cumulative, expected,
        velocity: expected > 0 ? (cumulative / expected) * 100 : 0
      };
    });
  }, [filteredDailySales, dateRange, zoneTotals.totalBudget]);

  // Growth Velocity
  const velocityData = useMemo(() => {
    return zoneDailyTrend.map(d => ({
      date: d.date,
      velocity: Math.min(150, Math.max(50, d.velocity)),
      target: 100
    }));
  }, [zoneDailyTrend]);

  // Store Performance for Ranking
  const storePerformance = useMemo(() => {
    return STORES.map(store => {
      const storeSales = filteredDailySales.filter(s => s.store_id === store.code);
      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = storeSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;
      
      const budget = allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const compliance = budget?.sales_budget > 0 ? (totalSales / budget.sales_budget) * 100 : 0;

      // Checklists compliance
      const storeChecklists = allChecklists.filter(c => c.store_id === store.code);
      const checklistCompliance = storeChecklists.length > 0 
        ? storeChecklists.reduce((sum, c) => sum + (c.completion_percentage || 0), 0) / storeChecklists.length 
        : 0;

      // Freezer efficiency
      const storeSlots = allFreezerSlots.filter(s => s.store_id === store.code);
      const filledSlots = storeSlots.filter(s => !s.is_empty).length;
      const freezerEfficiency = storeSlots.length > 0 ? (filledSlots / storeSlots.length) * 100 : 0;

      // Inventory alerts
      const storeAlerts = allInventoryAlerts.filter(a => a.store_id === store.code && (a.status === 'low' || a.status === 'critical' || a.status === 'expired'));

      return {
        ...store,
        totalSales, totalTickets, totalTransactions, avgTicket, compliance,
        checklistCompliance, freezerEfficiency, inventoryAlerts: storeAlerts.length
      };
    });
  }, [filteredDailySales, allBudgets, allChecklists, allFreezerSlots, allInventoryAlerts, currentMonth, currentYear]);

  // Ranking data based on filter
  const rankingData = useMemo(() => {
    let sorted = [...storePerformance];
    if (rankingFilter === 'sales') sorted.sort((a, b) => b.totalSales - a.totalSales);
    else if (rankingFilter === 'tickets') sorted.sort((a, b) => b.avgTicket - a.avgTicket);
    else if (rankingFilter === 'transactions') sorted.sort((a, b) => b.totalTransactions - a.totalTransactions);
    return sorted.slice(0, 10).map((s, i) => ({
      name: getDisplayName(s.code),
      value: rankingFilter === 'sales' ? s.totalSales : rankingFilter === 'tickets' ? s.avgTicket : s.totalTransactions,
      rank: i + 1
    }));
  }, [storePerformance, rankingFilter]);

  // Sales by Hour (simulated from shift records)
  const salesByHour = useMemo(() => {
    const hours = {};
    for (let h = 9; h <= 21; h++) hours[h] = { hour: `${h}:00`, sales: 0, count: 0 };
    
    allShiftRecords.forEach(record => {
      if (!record.shift) return;
      const shiftHours = record.shift === 'morning' ? [9,10,11,12,13] : record.shift === 'afternoon' ? [14,15,16,17] : [18,19,20,21];
      const salesPerHour = (record.sales || 0) / shiftHours.length;
      shiftHours.forEach(h => {
        if (hours[h]) {
          hours[h].sales += salesPerHour;
          hours[h].count++;
        }
      });
    });

    return Object.values(hours).map(h => ({
      ...h,
      avgSales: h.count > 0 ? h.sales / h.count : 0
    }));
  }, [allShiftRecords]);

  // Weather vs Sales
  const weatherSalesData = useMemo(() => {
    const weatherMap = {};
    weatherHistory.forEach(w => {
      const dateKey = w.date;
      if (!weatherMap[dateKey]) weatherMap[dateKey] = { temp: w.temperature_mean || 0, precipitation: w.precipitation || 0, code: w.weather_code || 0 };
    });

    return zoneDailyTrend.map(d => {
      const dateStr = format(parseISO(d.fullDate.includes('(') ? d.fullDate.split('(')[0].trim() : `2024-${d.date}`), 'yyyy-MM-dd');
      const weather = weatherMap[dateStr] || { temp: 18, precipitation: 0 };
      const weatherType = weather.precipitation > 5 ? 'rainy' : weather.precipitation > 0.5 ? 'cloudy' : 'sunny';
      return { ...d, temp: weather.temp, precipitation: weather.precipitation, weatherType };
    });
  }, [zoneDailyTrend, weatherHistory]);

  // Checklist Compliance by Store
  const checklistData = useMemo(() => {
    return storePerformance.map(s => ({
      name: getDisplayName(s.code),
      compliance: s.checklistCompliance
    })).sort((a, b) => b.compliance - a.compliance).slice(0, 10);
  }, [storePerformance]);

  // Freezer Efficiency by Store
  const freezerData = useMemo(() => {
    return storePerformance.map(s => ({
      name: getDisplayName(s.code),
      efficiency: s.freezerEfficiency
    })).sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);
  }, [storePerformance]);

  // Inventory Alerts by Store
  const inventoryAlertsData = useMemo(() => {
    return storePerformance.map(s => ({
      name: getDisplayName(s.code),
      alerts: s.inventoryAlerts
    })).sort((a, b) => b.alerts - a.alerts).slice(0, 10);
  }, [storePerformance]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(v);

  const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'];

  // Opportunities / Critical Indicators Data
  const opportunitiesData = useMemo(() => {
    const salesCompliance = zoneTotals.totalBudget > 0 ? (zoneTotals.totalSales / zoneTotals.totalBudget) * 100 : 0;
    const avgChecklistCompliance = storePerformance.reduce((sum, s) => sum + s.checklistCompliance, 0) / Math.max(storePerformance.length, 1);
    const avgFreezerEfficiency = storePerformance.reduce((sum, s) => sum + s.freezerEfficiency, 0) / Math.max(storePerformance.length, 1);
    const totalAlerts = storePerformance.reduce((sum, s) => sum + s.inventoryAlerts, 0);
    const inventoryScore = totalAlerts === 0 ? 100 : Math.max(0, 100 - (totalAlerts * 5));
    
    return [
      { name: 'Ventas', value: salesCompliance, target: 100, fill: salesCompliance >= 90 ? '#10b981' : salesCompliance >= 70 ? '#f59e0b' : '#ef4444' },
      { name: 'Checklists', value: avgChecklistCompliance, target: 100, fill: avgChecklistCompliance >= 80 ? '#10b981' : avgChecklistCompliance >= 60 ? '#f59e0b' : '#ef4444' },
      { name: 'Neveras', value: avgFreezerEfficiency, target: 100, fill: avgFreezerEfficiency >= 85 ? '#10b981' : avgFreezerEfficiency >= 70 ? '#f59e0b' : '#ef4444' },
      { name: 'Inventario', value: inventoryScore, target: 100, fill: inventoryScore >= 90 ? '#10b981' : inventoryScore >= 70 ? '#f59e0b' : '#ef4444' },
    ];
  }, [zoneTotals, storePerformance]);

  // Projection compliance
  const projectionCompliance = zoneTotals.totalBudget > 0 ? (zoneTotals.projection / zoneTotals.totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
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
              <motion.h1 
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparable(true)}
              className="text-violet-600 border-violet-200 hover:bg-violet-50"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Comparable
            </Button>
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

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeSection === 'zona' ? 'default' : 'outline'}
            onClick={() => setActiveSection('zona')}
            className={activeSection === 'zona' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            Zona
          </Button>
          <Button
            variant={activeSection === 'tiendas' ? 'default' : 'outline'}
            onClick={() => setActiveSection('tiendas')}
            className={activeSection === 'tiendas' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : ''}
          >
            <Store className="w-4 h-4 mr-2" />
            Tiendas
          </Button>
        </div>

        {activeSection === 'zona' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPICard title="Venta Zona" value={`$${(zoneTotals.totalSales/1000000).toFixed(1)}M`} subvalue={`Meta: $${(zoneTotals.totalBudget/1000000).toFixed(1)}M`} icon={DollarSign} color="from-pink-500 to-rose-500" delay={0} compliance={zoneTotals.compliance} />
              <KPICard title="Proyección" value={`$${(zoneTotals.projection/1000000).toFixed(1)}M`} subvalue={`Meta: $${(zoneTotals.totalBudget/1000000).toFixed(1)}M`} icon={Target} color="from-violet-500 to-purple-500" delay={0.1} compliance={projectionCompliance} />
              <KPICard title="Venta Hoy" value={`$${(zoneTotals.todayTotal/1000000).toFixed(1)}M`} subvalue="vs ayer" icon={Zap} trend={zoneTotals.yesterdayTotal > 0 ? ((zoneTotals.todayTotal / zoneTotals.yesterdayTotal) - 1) * 100 : 0} color="from-emerald-500 to-teal-500" delay={0.2} />
              <KPICard title="Ticket Prom." value={`$${(zoneTotals.avgTicket/1000).toFixed(0)}K`} subvalue="Promedio zona" icon={BarChart3} color="from-amber-500 to-orange-500" delay={0.3} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Zone Sales Trend */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Tendencia de Ventas - Zona
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={zoneDailyTrend}>
                      <defs>
                        <linearGradient id="salesGradZone" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip formatter={(v) => [formatCurrency(v), 'Ventas']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={3} fill="url(#salesGradZone)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth Velocity */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Velocidad de Crecimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={velocityData}>
                      <defs>
                        <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[50, 150]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                      <ReferenceLine y={100} stroke="#9ca3af" strokeDasharray="5 5" />
                      <Tooltip formatter={(v) => [`${v.toFixed(0)}%`, 'Velocidad']} />
                      <Area type="monotone" dataKey="velocity" stroke="#8b5cf6" strokeWidth={2} fill="url(#velocityGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Hour */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Ventas por Hora - Zona
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={salesByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                      <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v) => [formatCurrency(v), 'Ventas']} />
                      <Bar dataKey="avgSales" fill="#f472b6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weather vs Sales */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Ventas vs Clima
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={weatherSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis yAxisId="sales" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 9 }} />
                      <YAxis yAxisId="temp" orientation="right" domain={[10, 25]} tickFormatter={(v) => `${v}°`} tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v, name) => [name === 'sales' ? formatCurrency(v) : `${v}°C`, name === 'sales' ? 'Ventas' : 'Temp']} />
                      <Bar yAxisId="sales" dataKey="sales" radius={[4, 4, 0, 0]}>
                        {weatherSalesData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.weatherType === 'sunny' ? '#fbbf24' : entry.weatherType === 'rainy' ? '#3b82f6' : '#9ca3af'} />
                        ))}
                      </Bar>
                      <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px]"><Sun className="w-3 h-3 text-amber-500" /> Soleado</span>
                    <span className="flex items-center gap-1 text-[10px]"><Cloud className="w-3 h-3 text-gray-400" /> Nublado</span>
                    <span className="flex items-center gap-1 text-[10px]"><CloudRain className="w-3 h-3 text-blue-500" /> Lluvia</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Checklist Compliance */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    Cumplimiento Checklists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={checklistData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 8 }} />
                      <Tooltip formatter={(v) => [`${v.toFixed(0)}%`, 'Cumplimiento']} />
                      <Bar dataKey="compliance" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Freezer Efficiency */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Snowflake className="w-4 h-4" />
                    Eficiencia Neveras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={freezerData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 8 }} />
                      <Tooltip formatter={(v) => [`${v.toFixed(0)}%`, 'Eficiencia']} />
                      <Bar dataKey="efficiency" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Inventory Alerts */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Rupturas de Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={inventoryAlertsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 9 }} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 8 }} />
                      <Tooltip formatter={(v) => [v, 'Alertas']} />
                      <Bar dataKey="alerts" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Comparable Modal */}
        <AnimatePresence>
          {showComparable && (
            <ZoneComparableModal
              isOpen={showComparable}
              onClose={() => setShowComparable(false)}
              currentZoneData={zoneTotals}
              currentStoresData={storePerformance}
            />
          )}
        </AnimatePresence>

        {activeSection === 'tiendas' && (
          <>
            {/* Opportunities Chart */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Oportunidades Críticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {opportunitiesData.map((item, idx) => (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center"
                    >
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                          <motion.circle 
                            cx="40" cy="40" r="35" 
                            stroke={item.fill} 
                            strokeWidth="6" 
                            fill="none"
                            strokeDasharray={`${(item.value / 100) * 220} 220`}
                            initial={{ strokeDasharray: "0 220" }}
                            animate={{ strokeDasharray: `${(item.value / 100) * 220} 220` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color: item.fill }}>
                          {item.value.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">{item.name}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Store Ranking with Filter */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Ranking de Tiendas
                  </CardTitle>
                  <div className="flex gap-2">
                    {[
                      { key: 'sales', label: 'Ventas' },
                      { key: 'tickets', label: 'Ticket' },
                      { key: 'transactions', label: 'Transacciones' }
                    ].map(f => (
                      <Button
                        key={f.key}
                        size="sm"
                        variant={rankingFilter === f.key ? 'default' : 'outline'}
                        onClick={() => setRankingFilter(f.key)}
                        className={rankingFilter === f.key ? 'bg-pink-500 text-white text-xs' : 'text-xs'}
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(v) => rankingFilter === 'sales' ? `$${(v/1000000).toFixed(1)}M` : rankingFilter === 'tickets' ? `$${(v/1000).toFixed(0)}K` : v.toLocaleString()} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [rankingFilter === 'sales' ? formatCurrency(v) : rankingFilter === 'tickets' ? formatCurrency(v) : v.toLocaleString(), rankingFilter === 'sales' ? 'Ventas' : rankingFilter === 'tickets' ? 'Ticket Prom.' : 'Transacciones']} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {rankingData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Store Performance Grid - New Professional Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {storePerformance.map((store, idx) => (
                <StoreCard key={store.code} store={store} index={idx} formatCurrency={formatCurrency} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}