import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES, getDisplayName } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import WeekFilter from '@/components/dashboard/WeekFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';

import DailyGoalsCard from '@/components/gamification/DailyGoalsCard';
import WeatherSalesImpactChart from '@/components/weather/WeatherSalesImpactChart';
import DailyBudgetCard from '@/components/dashboard/DailyBudgetCard';
import ProjectionDetailModal from '@/components/dashboard/ProjectionDetailModal';

import GrowthVelocityChart from '@/components/management/GrowthVelocityChart';
import StoreReportGenerator from '@/components/reports/StoreReportGenerator';
import CompraValeModal from '@/components/dashboard/CompraValeModal';

import { 
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, AlertTriangle, CheckCircle2, X, FileSpreadsheet, Target,
  ClipboardCheck, Snowflake, Package
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line, RadialBarChart, RadialBar,
  Treemap, ScatterChart, Scatter, ZAxis
} from 'recharts';

const COLORS = ['#ec4899', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#fff1f2'];
const POPSY_PINK = '#ec4899';
const POPSY_ROSE = '#f43f5e';

// Colores pastel más vibrantes estilo heladería
const PASTEL_COLORS = {
  sales: 'from-emerald-100 to-green-200',
  tickets: 'from-sky-100 to-blue-200',
  transactions: 'from-violet-100 to-purple-200',
  suggested: 'from-pink-100 to-rose-200'
};

// Metric Card con panel expandible
function MetricCard({ title, value, budget, icon: Icon, bgColor, iconBg, iconColor, format: formatType = "number", onClick, isActive, insight }) {
  // Calculate velocity trend (comparing to expected daily rate)
  const daysInMonth = 30;
  const daysElapsed = Math.max(1, Math.floor((new Date() - new Date(new Date().getFullYear(), new Date().getMonth(), 1)) / (1000 * 60 * 60 * 24)));
  const expectedValue = budget ? (budget / daysInMonth) * daysElapsed : 0;
  const velocityPct = expectedValue > 0 ? ((value / expectedValue) * 100 - 100) : 0;
  
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
            velocityPct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {velocityPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {velocityPct >= 0 ? '+' : ''}{velocityPct.toFixed(0)}%
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <motion.p 
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-2xl font-semibold text-gray-700"
      >
        {formatValue(value)}
      </motion.p>
      
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
                📈 Ventas vs Ticket Promedio
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
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v, name) => [name === 'Ventas' ? formatCurrency(v) : formatCurrency(v), name]}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fill="url(#colorSales)" name="Ventas" />
                    <Line yAxisId="right" type="monotone" dataKey="ticketPromedio" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Ticket Prom." />
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
              <h4 className="font-semibold text-gray-700 mb-3">🎫 Tendencia Ticket Promedio por Día</h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTicketAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v) => [formatCurrency(v), 'Ticket Promedio']}
                    />
                    <Area type="monotone" dataKey="ticketPromedio" stroke="#f59e0b" strokeWidth={3} fill="url(#colorTicketAvg)" name="Ticket Promedio" />
                  </AreaChart>
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
              <h4 className="font-medium text-gray-600 mb-3">⚡ Transacciones vs Venta</h4>
              <div className="h-72 bg-white rounded-xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v, name) => [name === 'Venta' ? formatCurrency(v) : v.toLocaleString(), name]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="transactions" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Transacciones" />
                    <Line yAxisId="right" type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} name="Venta" />
                  </ComposedChart>
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

  const insights = {
    sales: 'La tendencia de ventas muestra el comportamiento diario. Identifica los días de mayor venta para replicar estrategias exitosas.',
    tickets: 'El ticket promedio es clave para aumentar ingresos sin necesidad de más clientes. Enfócate en venta sugerida.',
    transactions: 'Las transacciones muestran el flujo de clientes. Compara con la venta para identificar oportunidades de ticket promedio.',
    suggested: 'Los sugeridos impulsan el ticket promedio. Un incremento del 10% en sugeridos puede aumentar ventas en 15-20%.'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{titles[metric]}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>
      {/* Insight sutil */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-gray-400 mb-4 italic border-l-2 border-pink-200 pl-3"
      >
        💡 {insights[metric]}
      </motion.p>
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
  const [projectionMetric, setProjectionMetric] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [weekFilter, setWeekFilter] = useState(null); // Filtro de semana independiente
  const [showCompraVale, setShowCompraVale] = useState(false);
  
  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      try {
        const response = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=4.6097&longitude=-74.0817&start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}&daily=weathercode,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=America%2FBogota`
        );
        const data = await response.json();
        setWeatherData({ history: data.daily });
      } catch (e) {
        console.error('Error fetching weather:', e);
      }
    };
    
    if (selectedStore) fetchWeather();
  }, [selectedStore]);

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

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selectedStore],
    queryFn: () => base44.entities.CleaningChecklist.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: freezerSlots = [] } = useQuery({
    queryKey: ['freezerSlots', selectedStore],
    queryFn: () => base44.entities.FreezerSlot.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: inventoryAlerts = [] } = useQuery({
    queryKey: ['inventoryAlerts', selectedStore],
    queryFn: () => base44.entities.InventoryAlert.filter({ store_id: selectedStore }),
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
    if (!dailySales.length) return [];
    
    // Si hay filtro de semana activo, usarlo; sino usar el calendario
    const activeRange = weekFilter || dateRange;
    if (!activeRange?.from || !activeRange?.to) return [];
    
    // Formatear fechas del rango a strings YYYY-MM-DD para comparación exacta
    const fromStr = format(activeRange.from, 'yyyy-MM-dd');
    const toStr = format(activeRange.to, 'yyyy-MM-dd');
    
    return dailySales.filter(s => {
      // Extraer solo la fecha (YYYY-MM-DD) del registro
      const saleDateStr = s.date?.split('T')[0] || s.date;
      return saleDateStr >= fromStr && saleDateStr <= toStr;
    });
  }, [dailySales, dateRange, weekFilter]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  const chartData = useMemo(() => {
    const activeRange = weekFilter || dateRange;
    if (!activeRange?.from || !activeRange?.to) return [];
    const days = eachDayOfInterval({ start: activeRange.from, end: activeRange.to });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      // Buscar en dailySales comparando correctamente las fechas
      const dayData = dailySales.find(s => {
        const saleDate = s.date?.split('T')[0] || s.date;
        return saleDate === dayStr;
      }) || {};
      const transactions = dayData.total_transactions || 0;
      const tickets = dayData.total_tickets || 0;
      const sales = dayData.total_sales || 0;
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM', { locale: es }),
        dayName: format(day, 'EEEE', { locale: es }),
        ventas: sales,
        tickets: tickets,
        ticketPromedio: transactions > 0 ? sales / transactions : 0,
        transactions: transactions,
        suggested: dayData.total_suggested || 0
      };
    });
  }, [dateRange, dailySales]);



  // Proyecciones
  const projections = useMemo(() => {
    if (!currentBudget?.sales_budget) return null;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const totalDays = differenceInDays(monthEnd, monthStart) + 1;
    const daysElapsed = filteredSales.length || 1;
    const daysRemaining = totalDays - daysElapsed;

    const dailyAvgSales = totals.sales / daysElapsed;
    const projectedSales = totals.sales + (dailyAvgSales * daysRemaining);
    const salesGap = currentBudget.sales_budget - totals.sales;
    const requiredDailySales = daysRemaining > 0 ? salesGap / daysRemaining : 0;

    const avgTicket = totals.transactions > 0 ? totals.sales / totals.transactions : 0;
    const budgetTicket = currentBudget.tickets_budget || avgTicket;
    
    // Datos para proyección
    const projectionData = [];
    let accumulated = 0;
    chartData.forEach((d, i) => {
      accumulated += d.ventas;
      projectionData.push({ day: `Día ${i+1}`, real: accumulated, proyectado: null });
    });
    for (let i = 0; i < daysRemaining; i++) {
      accumulated += dailyAvgSales;
      projectionData.push({ day: `Día ${chartData.length + i + 1}`, real: null, proyectado: accumulated });
    }
    
    // Datos para requerimiento diario
    const dailyRequired = Array.from({ length: daysRemaining }, (_, i) => ({
      day: `Día ${i + 1}`,
      required: requiredDailySales
    }));
    
    return {
      projectedSales,
      salesGap,
      requiredDailySales,
      daysRemaining,
      daysElapsed,
      avgTicket,
      budgetTicket,
      salesOnTrack: projectedSales >= currentBudget.sales_budget * 0.95,
      ticketOnTrack: avgTicket >= budgetTicket * 0.95,
      projectionData,
      dailyRequired,
      totals,
      budget: currentBudget.sales_budget,
      chartData
    };
  }, [currentBudget, totals, filteredSales, chartData]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));
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

  // Calcular ticket promedio correctamente
  const avgTicket = totals.transactions > 0 ? totals.sales / totals.transactions : 0;

  const metrics = [
    { id: 'sales', title: 'Ventas Totales', value: totals.sales, budget: currentBudget.sales_budget, icon: DollarSign, bgColor: 'bg-gradient-to-br from-emerald-100 to-green-200', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700', format: 'currency' },
    { id: 'tickets', title: 'Ticket Promedio', value: avgTicket, budget: currentBudget.tickets_budget, icon: Receipt, bgColor: 'bg-gradient-to-br from-sky-100 to-blue-200', iconBg: 'bg-sky-200', iconColor: 'text-sky-700', format: 'currency' },
    { id: 'transactions', title: 'Transacciones', value: totals.transactions, budget: currentBudget.transactions_budget, icon: Zap, bgColor: 'bg-gradient-to-br from-violet-100 to-purple-200', iconBg: 'bg-violet-200', iconColor: 'text-violet-700' },
    { id: 'suggested', title: 'Sugeridos', value: totals.suggested, budget: currentBudget.suggested_budget, icon: Gift, bgColor: 'bg-gradient-to-br from-pink-100 to-rose-200', iconBg: 'bg-pink-200', iconColor: 'text-pink-700' },
  ];

  // Opportunities / Critical Indicators Data
  const opportunitiesData = useMemo(() => {
    const salesCompliance = currentBudget?.sales_budget > 0 ? (totals.sales / currentBudget.sales_budget) * 100 : 0;
    const ticketCompliance = currentBudget?.tickets_budget > 0 ? (avgTicket / currentBudget.tickets_budget) * 100 : 0;
    const checklistCompliance = checklists.length > 0 
      ? checklists.reduce((sum, c) => sum + (c.completion_percentage || 0), 0) / checklists.length 
      : 0;
    const filledSlots = freezerSlots.filter(s => !s.is_empty).length;
    const freezerEfficiency = freezerSlots.length > 0 ? (filledSlots / freezerSlots.length) * 100 : 0;
    const activeAlerts = inventoryAlerts.filter(a => a.status === 'low' || a.status === 'critical' || a.status === 'expired').length;
    const inventoryScore = activeAlerts === 0 ? 100 : Math.max(0, 100 - (activeAlerts * 10));
    
    return [
      { name: 'Ventas', value: salesCompliance, icon: DollarSign, fill: salesCompliance >= 90 ? '#10b981' : salesCompliance >= 70 ? '#f59e0b' : '#ef4444' },
      { name: 'Ticket', value: ticketCompliance, icon: Receipt, fill: ticketCompliance >= 90 ? '#10b981' : ticketCompliance >= 70 ? '#f59e0b' : '#ef4444' },
      { name: 'Checklists', value: checklistCompliance, icon: ClipboardCheck, fill: checklistCompliance >= 80 ? '#10b981' : checklistCompliance >= 60 ? '#f59e0b' : '#ef4444' },
      { name: 'Neveras', value: freezerEfficiency, icon: Snowflake, fill: freezerEfficiency >= 85 ? '#10b981' : freezerEfficiency >= 70 ? '#f59e0b' : '#ef4444' },
      { name: 'Inventario', value: inventoryScore, icon: Package, fill: inventoryScore >= 90 ? '#10b981' : inventoryScore >= 70 ? '#f59e0b' : '#ef4444' },
    ];
  }, [totals, currentBudget, avgTicket, checklists, freezerSlots, inventoryAlerts]);

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
              <motion.h1 
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600 bg-[length:200%_100%] bg-clip-text text-transparent"
              >
                Tienda
              </motion.h1>
              {selectedStore && (
                <p className="text-sm text-pink-500 font-medium">{getDisplayName(selectedStore)}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <WeekFilter onWeekChange={setWeekFilter} multiSelect={true} />
            <DateFilter dateRange={dateRange} onDateChange={(range) => { setDateRange(range); setWeekFilter(null); }} />
          </div>
        </div>

        {selectedStore ? (
          <div className="space-y-6">
            {/* Acciones rápidas - más sutil */}
            <div className="flex justify-end gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompraVale(true)}
                  className="text-violet-600 border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Comparable
                </Button>
              </motion.div>
              <StoreReportGenerator 
                storeId={selectedStore}
                storeName={selectedStoreName}
                storeCode={selectedStore}
              />
            </div>



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
                  onClick={() => {
                    const newMetric = activeMetric === metric.id ? null : metric.id;
                    setActiveMetric(newMetric);
                    // Auto scroll to detail panel
                    if (newMetric) {
                      setTimeout(() => {
                        const detailPanel = document.getElementById('detail-panel');
                        if (detailPanel) {
                          detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}
                  isActive={activeMetric === metric.id}
                  insight={getInsight(metric.id, metric.value, metric.budget)}
                />
              ))}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {activeMetric && (
                <div id="detail-panel">
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
                </div>
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
                      <CardTitle className="text-sm font-medium text-pink-600 flex items-center gap-2">
                        <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                          <DollarSign className="w-4 h-4 text-pink-500" />
                        </motion.div>
                        Tendencia de Ventas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center">
                          📊 Evolución de ventas diarias en el período seleccionado
                        </p>
                      </div>
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
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} label={{ value: 'Ventas (millones)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6b7280' } }} />
                            <Tooltip 
                              formatter={(v) => [formatCurrency(v), 'Venta']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#salesGrad)" name="Venta" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ticket Promedio */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-600 flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                          <Receipt className="w-4 h-4 text-pink-500" />
                        </motion.div>
                        Ticket Promedio Diario
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center">
                          🎯 Venta ÷ Transacciones = Ticket promedio por día
                        </p>
                      </div>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} label={{ value: 'Ticket (miles)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6b7280' } }} />
                            <Tooltip 
                              formatter={(v) => [formatCurrency(v), 'Ticket Promedio']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Area type="monotone" dataKey="ticketPromedio" stroke="#3b82f6" strokeWidth={2} fill="url(#ticketGrad)" name="Ticket Promedio" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row - Gráficas más grandes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transacciones vs Venta */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-600 flex items-center gap-2">
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          <Zap className="w-4 h-4 text-pink-500" />
                        </motion.div>
                        Transacciones vs Venta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center">
                          ⚡ Más transacciones = más clientes atendidos. Barras moradas = transacciones, línea rosa = ventas
                        </p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 10 }} label={{ value: 'Trans.', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6b7280' } }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} label={{ value: 'Ventas (M)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#6b7280' } }} />
                            <Tooltip 
                              formatter={(v, name) => [name === 'ventas' ? formatCurrency(v) : v.toLocaleString(), name === 'ventas' ? 'Venta' : 'Transacciones']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar yAxisId="left" dataKey="transactions" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Transacciones" />
                            <Line yAxisId="right" type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={2} dot={false} name="Ventas" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sugeridos y Distribución */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-600 flex items-center gap-2">
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Gift className="w-4 h-4 text-pink-500" />
                        </motion.div>
                        Sugeridos y Distribución
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 p-2 bg-pink-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center">
                          🎁 Más sugeridos = mejor ticket promedio. Verde = ventas, azul = tickets, rosa = sugeridos
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-56">
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
                              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#6b7280' } }} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                              <Area type="monotone" dataKey="suggested" stroke="#ec4899" strokeWidth={2} fill="url(#sugGrad)" name="Sugeridos" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="h-56">
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
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              />
                              <Tooltip contentStyle={{ fontSize: 11 }} />
                              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Third Row - Velocidad de Crecimiento */}
                <GrowthVelocityChart 
                  dailyTrend={chartData.map(d => ({ ...d, sales: d.ventas }))}
                  budget={currentBudget?.sales_budget || 0}
                  formatCurrency={formatCurrency}
                />
              </motion.div>
            )}



            {/* Daily Budget */}
            <DailyBudgetCard 
              dailySales={dailySales} 
              budgets={budgets} 
              storeId={selectedStore}
              formatCurrency={formatCurrency}
            />
            
            {/* Weather Impact Chart */}
            {weatherData && (
              <WeatherSalesImpactChart 
                weatherData={weatherData}
                dailySales={dailySales}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Compra Vale Modal */}
            <AnimatePresence>
              {showCompraVale && (
                <CompraValeModal
                  isOpen={showCompraVale}
                  onClose={() => setShowCompraVale(false)}
                  storeId={selectedStore}
                  currentSales={totals}
                  dateRange={weekFilter || dateRange}
                />
              )}
            </AnimatePresence>

            {/* Projection Detail Modal */}
            <AnimatePresence>
              {projectionMetric && projections && (
                <ProjectionDetailModal
                  isOpen={!!projectionMetric}
                  onClose={() => setProjectionMetric(null)}
                  metric={projectionMetric}
                  data={projections}
                  formatCurrency={formatCurrency}
                />
              )}
            </AnimatePresence>

            {/* Proyección del Mes - Diseño Mejorado con Gráficas */}
            {projections && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* Header con cumplimiento de VENTA ACTUAL */}
                <div className="bg-gradient-to-r from-pink-500/20 to-violet-500/20 p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-pink-400" />
                        Proyección del Mes
                      </h3>
                      <p className="text-white/60 text-sm mt-1">
                        {projections.daysRemaining} días restantes para cerrar el mes
                      </p>
                    </div>
                    {/* Cumplimiento circular - VENTA ACTUAL vs META */}
                    <div className="relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                        <motion.circle 
                          cx="48" cy="48" r="42" 
                          stroke={((totals.sales / (currentBudget?.sales_budget || 1)) * 100) >= 70 ? '#10b981' : '#f59e0b'}
                          strokeWidth="8" 
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 264" }}
                          animate={{ strokeDasharray: `${Math.min((totals.sales / (currentBudget?.sales_budget || 1)) * 264, 264)} 264` }}
                          transition={{ duration: 1.5 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                          className="text-2xl font-black text-white"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {currentBudget?.sales_budget > 0 ? ((totals.sales / currentBudget.sales_budget) * 100).toFixed(0) : 0}%
                        </motion.span>
                        <span className="text-[10px] text-white/60">Venta Actual</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid de métricas CON GRÁFICAS - Botones interactivos */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { 
                      key: 'sales', 
                      label: 'Venta Actual', 
                      value: totals.sales, 
                      icon: DollarSign, 
                      iconBg: 'bg-emerald-500/20', 
                      iconColor: 'text-emerald-400',
                      barColor: 'bg-emerald-400/60',
                      chartData: chartData.slice(-7).map(d => d.ventas),
                      footer: `${((totals.sales / (currentBudget?.sales_budget || 1)) * 100).toFixed(0)}% de meta`
                    },
                    { 
                      key: 'projection', 
                      label: 'Proyección Cierre', 
                      value: projections.projectedSales, 
                      icon: TrendingUp, 
                      iconBg: 'bg-violet-500/20', 
                      iconColor: 'text-violet-400',
                      isGauge: true,
                      gaugePercent: (projections.projectedSales / (currentBudget?.sales_budget || 1)) * 100,
                      footer: `${((projections.projectedSales / (currentBudget?.sales_budget || 1)) * 100).toFixed(0)}% proyectado`,
                      footerColor: projections.salesOnTrack ? 'text-emerald-400' : 'text-amber-400'
                    },
                    { 
                      key: 'required', 
                      label: 'Necesitas/Día', 
                      value: projections.requiredDailySales, 
                      icon: Zap, 
                      iconBg: 'bg-amber-500/20', 
                      iconColor: 'text-amber-400',
                      isTrend: true,
                      footer: `${formatCurrency(projections.salesGap)} restantes`
                    },
                    { 
                      key: 'ticket', 
                      label: 'Ticket Promedio', 
                      value: projections.avgTicket, 
                      icon: Receipt, 
                      iconBg: 'bg-sky-500/20', 
                      iconColor: 'text-sky-400',
                      isComparative: true,
                      comparePercent: (projections.avgTicket / (projections.budgetTicket || 1)) * 100,
                      footer: `Meta: ${formatCurrency(projections.budgetTicket)}`
                    }
                  ].map((item, idx) => {
                   const Icon = item.icon;
                   return (
                     <motion.button
                       key={item.key}
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setProjectionMetric(item.key)}
                       className="bg-white/5 rounded-2xl p-4 border border-white/10 text-left transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer"
                     >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${item.iconColor}`} />
                          </div>
                          <span className="text-white/70 text-xs">{item.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white mb-2">{formatCurrency(item.value)}</p>
                        
                        {/* Visualización según tipo */}
                        {item.chartData && (
                          <div className="flex items-end gap-0.5 h-10">
                            {item.chartData.map((val, i) => (
                              <motion.div
                                key={i}
                                className={`flex-1 ${item.barColor} rounded-t-lg shadow-sm`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ 
                                  height: `${Math.max(15, (val / Math.max(...item.chartData, 1)) * 100)}%`,
                                  opacity: 1,
                                  y: [0, -2, 0]
                                }}
                                transition={{ 
                                  delay: idx * 0.1 + i * 0.05,
                                  y: { duration: 1, repeat: Infinity, repeatDelay: 2, delay: i * 0.1 }
                                }}
                                whileHover={{ scaleY: 1.1, y: -3 }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {item.isGauge && (
                          <div className="flex justify-center">
                            <svg className="w-12 h-12 transform -rotate-90">
                              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                              <motion.circle 
                                cx="24" cy="24" r="20" 
                                stroke="#8b5cf6"
                                strokeWidth="4" 
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 126" }}
                                animate={{ strokeDasharray: `${Math.min(item.gaugePercent * 1.26, 126)} 126` }}
                                transition={{ delay: idx * 0.1, duration: 1 }}
                              />
                            </svg>
                          </div>
                        )}
                        
                        {item.isTrend && (
                          <div className="h-10 flex items-center relative">
                            <svg className="w-full h-full" viewBox="0 0 100 30">
                              <motion.path
                                d="M 0 25 Q 25 20 50 15 T 100 5"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: idx * 0.1, duration: 1.5, ease: "easeInOut" }}
                              />
                              <motion.circle
                                r="3"
                                fill="#f59e0b"
                                initial={{ offsetDistance: '0%', opacity: 0 }}
                                animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 2, delay: idx * 0.1 + 1, repeat: Infinity, repeatDelay: 1 }}
                              >
                                <animateMotion dur="2s" repeatCount="indefinite" begin={`${idx * 0.1 + 1}s`}>
                                  <mpath href="#trendPath" />
                                </animateMotion>
                              </motion.circle>
                            </svg>
                            <defs>
                              <path id="trendPath" d="M 0 25 Q 25 20 50 15 T 100 5" />
                            </defs>
                          </div>
                        )}
                        
                        {item.isComparative && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/50 w-10">Actual</span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-sky-400 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(item.comparePercent, 100)}%` }}
                                  transition={{ delay: idx * 0.1 }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/50 w-10">Meta</span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white/30 rounded-full w-full" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <p className={`text-[10px] mt-1 ${item.footerColor || 'text-white/50'}`}>{item.footer}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Barra de progreso visual - % VENTA ACTUAL */}
                <div className="px-6 pb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Progreso de Venta</span>
                      <span className="text-white font-bold">
                        {formatCurrency(currentBudget?.sales_budget - totals.sales)} por vender
                      </span>
                    </div>
                    <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totals.sales / (currentBudget?.sales_budget || 1)) * 100, 100)}%` }}
                        transition={{ duration: 1 }}
                      />
                      {/* Marcador del 100% */}
                      <div className="absolute right-0 top-0 h-full w-0.5 bg-white/50" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-white/50">
                      <span>Venta Actual: {((totals.sales / (currentBudget?.sales_budget || 1)) * 100).toFixed(0)}%</span>
                      <span>Meta: 100%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Resumen Ejecutivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 text-white"
            >
              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <BarChart3 className="w-5 h-5" />
                </motion.div>
                Resumen del Período
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Venta Total</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totals.sales)}</p>
                  <p className="text-xs text-white/50 mt-1">{filteredSales.length} días</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Ticket Promedio</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totals.transactions > 0 ? totals.sales / totals.transactions : 0)}</p>
                  <p className="text-xs text-white/50 mt-1">Venta ÷ Transacciones</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Total Transacciones</p>
                  <p className="text-2xl font-semibold">{totals.transactions.toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-1">Ventas realizadas</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Sugeridos Vendidos</p>
                  <p className="text-2xl font-semibold">{totals.suggested.toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-1">{totals.transactions > 0 ? ((totals.suggested / totals.transactions) * 100).toFixed(0) : 0}% de conversión</p>
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