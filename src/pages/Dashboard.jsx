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
import ComparableChartsGrid from '@/components/executive/ComparableChartsGrid';

import DailyGoalsCard from '@/components/gamification/DailyGoalsCard';
import RetailWeekBudgetCard from '@/components/budget/RetailWeekBudgetCard';
import ProjectionDetailModal from '@/components/dashboard/ProjectionDetailModal';
import SalesByHourChart from '@/components/sales/SalesByHourChart';

import GrowthVelocityChart from '@/components/management/GrowthVelocityChart';
import StoreReportGenerator from '@/components/reports/StoreReportGenerator';
import CompraValeModal from '@/components/dashboard/CompraValeModal';
import StoreSalesModal from '@/components/forms/StoreSalesModal';
import MonthlyBudgetManager from '@/components/budget/MonthlyBudgetManager';

import {
  DollarSign, Receipt, Zap, Gift, TrendingUp, TrendingDown, ArrowLeft,
  BarChart3, AlertTriangle, CheckCircle2, X, Target,
  ClipboardCheck, Snowflake, Package, Calendar, Activity } from
'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line } from
'recharts';

// Metric Card con panel expandible
function MetricCard({ title, value, budget, icon: Icon, bgColor, iconBg, iconColor, format: formatType = "number", onClick, isActive, insight, comparisonValue, showComparison }) {
  // Calculate velocity trend (comparing to expected daily rate)
  const daysInMonth = 30;
  const daysElapsed = Math.max(1, Math.floor((new Date() - new Date(new Date().getFullYear(), new Date().getMonth(), 1)) / (1000 * 60 * 60 * 24)));
  const expectedValue = budget ? budget / daysInMonth * daysElapsed : 0;
  const velocityPct = expectedValue > 0 ? value / expectedValue * 100 - 100 : 0;

  const percentage = budget ? (value / budget * 100).toFixed(1) : 0;
  const isPositive = percentage >= 100;
  const isWarning = percentage >= 70 && percentage < 100;

  // Comparación con período anterior
  const comparisonPercentage = showComparison && comparisonValue > 0 ?
  ((value - comparisonValue) / comparisonValue * 100).toFixed(1) :
  null;
  const isComparisonPositive = comparisonPercentage > 0;

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
      isActive ? 'border-pink-400 shadow-xl shadow-pink-500/20' : 'border-transparent shadow-md hover:shadow-xl'} ${
      bgColor}`}>

      <div className="flex items-start justify-between mb-3">
        <motion.div
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}
          animate={isActive ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}>

          <Icon className={`w-6 h-6 ${iconColor}`} />
        </motion.div>
        {budget > 0 && !showComparison &&
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
        percentage >= 100 ? 'bg-green-100 text-green-700' : percentage >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`
        }>
            {percentage >= 100 ? <CheckCircle2 className="w-3 h-3" /> : percentage >= 70 ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {percentage}%
          </div>
        }
      </div>
      
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-2xl font-semibold text-gray-700">

        {formatValue(value)}
      </motion.p>
      
      {budget > 0 && !showComparison &&
      <div className="mt-3">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${
            isPositive ? 'bg-green-400' : isWarning ? 'bg-amber-400' : 'bg-red-400'}`
            } />

          </div>
          <p className="text-xs text-gray-400 mt-1">Meta: {formatValue(budget)}</p>
        </div>
      }

      {/* Comparación con período anterior */}
      {showComparison && comparisonValue !== null && comparisonValue !== undefined &&
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-2 rounded-lg bg-white/30 border border-white/50">

          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">vs Anterior</span>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
          isComparisonPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`
          }>
              {isComparisonPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isComparisonPositive ? '+' : ''}{comparisonPercentage}%
            </div>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Anterior:</span>
            <span className="text-gray-700 font-semibold">{formatValue(comparisonValue)}</span>
          </div>
          <div className="flex justify-between text-[10px] mt-0.5">
            <span className="text-gray-500">Diferencia:</span>
            <span className={`font-bold ${isComparisonPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatValue(Math.abs(value - comparisonValue))} {isComparisonPositive ? 'más' : 'menos'}
            </span>
          </div>
        </motion.div>
      }

      {insight && !showComparison &&
      <p className="text-xs text-gray-500 mt-2 italic">{insight}</p>
      }
    </motion.div>);

}

// Panel de detalle con gráficas avanzadas
function DetailPanel({ metric, data, onClose, chartData, formatCurrency, shiftData }) {
  // Calcular estadísticas avanzadas
  const stats = useMemo(() => {
    const values = chartData.map((d) => d[metric === 'sales' ? 'ventas' : metric] || 0);
    const nonZero = values.filter((v) => v > 0);
    const max = Math.max(...values);
    const min = Math.min(...(nonZero.length ? nonZero : [0]));
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / Math.max(values[0], 1) * 100 : 0;

    return { max, min, avg, trend, total: values.reduce((a, b) => a + b, 0) };
  }, [chartData, metric]);

  // Datos para gráfica de distribución por turno
  const shiftDistribution = useMemo(() => {
    if (!shiftData?.length) return [];
    const dist = { morning: 0, afternoon: 0, night: 0 };
    shiftData.forEach((r) => {
      const key = metric === 'sales' ? 'sales' : metric === 'tickets' ? 'tickets' : metric === 'transactions' ? 'transactions' : 'suggested_sales';
      dist[r.shift] = (dist[r.shift] || 0) + (r[key] || 0);
    });
    return [
    { name: '🌅 Mañana', value: dist.morning, fill: '#fbbf24' },
    { name: '☀️ Tarde', value: dist.afternoon, fill: '#f472b6' },
    { name: '🌙 Noche', value: dist.night, fill: '#6366f1' }].
    filter((d) => d.value > 0);
  }, [shiftData, metric]);

  const getChartContent = () => {
    switch (metric) {
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
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v, name) => [name === 'Ventas' ? formatCurrency(v) : formatCurrency(v), name]} />

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
            {shiftDistribution.length > 0 &&
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
                        dataKey="value">

                          {shiftDistribution.map((entry, index) =>
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                        )}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">💡 Insights</h4>
                  {shiftDistribution.map((shift, i) =>
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{shift.name}</span>
                      <span className="font-bold text-gray-700">{(shift.value / stats.total * 100).toFixed(0)}%</span>
                    </div>
                )}
                </div>
              </div>
            }
          </div>);

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
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v) => [formatCurrency(v), 'Ticket Promedio']} />

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
          </div>);

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
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      formatter={(v, name) => [name === 'Venta' ? formatCurrency(v) : v.toLocaleString(), name]} />

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
          </div>);

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
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05} />
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
          </div>);

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
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6">

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
        className="text-xs text-gray-400 mb-4 italic border-l-2 border-pink-200 pl-3">

        💡 {insights[metric]}
      </motion.p>
      {getChartContent()}
    </motion.div>);

}

export default function Dashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  // Inicializar con la semana actual del mes (lunes a domingo)
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 })
  });
  const [activeMetric, setActiveMetric] = useState(null);
  const [projectionMetric, setProjectionMetric] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [weekFilter, setWeekFilter] = useState(null);
  const [showCompraVale, setShowCompraVale] = useState(false);
  const [showStoreSales, setShowStoreSales] = useState(false);
  const [showMonthlyBudget, setShowMonthlyBudget] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRange, setComparisonRange] = useState(null);

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
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      
      // Incluir también días de la semana retail que caen en el mes anterior
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      
      const allSales = await base44.entities.DailySales.filter({ store_id: selectedStore });
      
      // Filtrar ventas del mes actual + días de la semana retail actual del mes anterior
      return allSales.filter(sale => {
        const saleDate = sale.date?.split('T')[0] || sale.date;
        return saleDate >= weekStartStr && saleDate <= monthEnd;
      });
    },
    enabled: !!selectedStore,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const allBudgets = await base44.entities.Budget.filter({ store_id: selectedStore });
      // Filtrar solo presupuestos del mes/año actual
      return allBudgets.filter(b => b.month === currentMonth && b.year === currentYear);
    },
    enabled: !!selectedStore,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const allRecords = await base44.entities.ShiftRecord.filter({ store_id: selectedStore });
      // Filtrar solo registros del mes actual
      return allRecords.filter(record => {
        const recordDate = record.date?.split('T')[0] || record.date;
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
    },
    enabled: !!selectedStore,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
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



  const currentBudget = useMemo(() => {
    // Primero buscar el presupuesto activo
    const activeBudget = budgets.find((b) => b.is_active === true);
    if (activeBudget) return activeBudget;
    
    // Si no hay activo, usar el del mes/año actual
    const now = new Date();
    return budgets.find((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};
  }, [budgets]);

  const filteredSales = useMemo(() => {
    if (!dailySales.length) return [];

    const activeRange = weekFilter || dateRange;
    if (!activeRange?.from || !activeRange?.to) return [];

    const fromStr = format(activeRange.from, 'yyyy-MM-dd');
    const toStr = format(activeRange.to, 'yyyy-MM-dd');

    return dailySales.filter((s) => {
      const saleDateStr = s.date?.split('T')[0] || s.date;
      return saleDateStr >= fromStr && saleDateStr <= toStr;
    });
  }, [dailySales, dateRange, weekFilter]);

  // Ventas del período de comparación
  const comparisonSales = useMemo(() => {
    if (!showComparison || !comparisonRange || !dailySales.length) return [];

    const fromStr = format(comparisonRange.from, 'yyyy-MM-dd');
    const toStr = format(comparisonRange.to, 'yyyy-MM-dd');

    return dailySales.filter((s) => {
      const saleDateStr = s.date?.split('T')[0] || s.date;
      return saleDateStr >= fromStr && saleDateStr <= toStr;
    });
  }, [dailySales, comparisonRange, showComparison]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  // Totales del período de comparación
  const comparisonTotals = useMemo(() => {
    if (!showComparison || !comparisonSales.length) return null;
    return comparisonSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [comparisonSales, showComparison]);

  const chartData = useMemo(() => {
    const activeRange = weekFilter || dateRange;
    if (!activeRange?.from || !activeRange?.to) return [];

    // Generar días de ambos períodos para comparación
    const currentDays = eachDayOfInterval({ start: activeRange.from, end: activeRange.to });
    const maxDays = currentDays.length;

    const dataWithSales = currentDays.map((day, idx) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find((s) => {
        const saleDate = s.date?.split('T')[0] || s.date;
        return saleDate === dayStr;
      }) || {};
      const transactions = dayData.total_transactions || 0;
      const sales = dayData.total_sales || 0;

      // Datos de comparación
      let compData = {};
      if (showComparison && comparisonRange) {
        const compDays = eachDayOfInterval({ start: comparisonRange.from, end: comparisonRange.to });
        // Mapear día relativo del período actual al día relativo del período de comparación
        const compDayIdx = Math.min(idx, compDays.length - 1);
        const compDay = compDays[compDayIdx];

        if (compDay) {
          const compDayStr = format(compDay, 'yyyy-MM-dd');
          const compDayData = dailySales.find((s) => {
            const saleDate = s.date?.split('T')[0] || s.date;
            return saleDate === compDayStr;
          }) || {};
          const compTrans = compDayData.total_transactions || 0;
          const compSales = compDayData.total_sales || 0;
          compData = {
            ventasComparacion: compSales,
            transactionsComparacion: compTrans,
            ticketComparacion: compTrans > 0 ? compSales / compTrans : 0,
            suggestedComparacion: compDayData.total_suggested || 0
          };
        }
      }

      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMM yyyy', { locale: es }),
        dayName: format(day, 'EEEE', { locale: es }),
        ventas: sales,
        tickets: dayData.total_tickets || 0,
        ticketPromedio: transactions > 0 ? sales / transactions : 0,
        transactions: transactions,
        suggested: dayData.total_suggested || 0,
        index: idx,
        ...compData
      };
    });

    // Calcular proyección
    const validData = dataWithSales.filter((d) => d.ventas > 0);
    if (validData.length >= 2) {
      const n = validData.length;
      let sumX = 0,sumY = 0,sumXY = 0,sumX2 = 0;
      validData.forEach((d) => {
        sumX += d.index;
        sumY += d.ventas;
        sumXY += d.index * d.ventas;
        sumX2 += d.index * d.index;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return dataWithSales.map((d) => ({
        ...d,
        proyeccion: slope * d.index + intercept
      }));
    }

    return dataWithSales;
  }, [dateRange, dailySales, weekFilter, showComparison, comparisonRange]);



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
    const projectedSales = totals.sales + dailyAvgSales * daysRemaining;
    const salesGap = currentBudget.sales_budget - totals.sales;
    const requiredDailySales = daysRemaining > 0 ? salesGap / daysRemaining : 0;

    const avgTicket = totals.transactions > 0 ? totals.sales / totals.transactions : 0;
    const budgetTicket = currentBudget.tickets_budget || avgTicket;

    // Datos para proyección
    const projectionData = [];
    let accumulated = 0;
    chartData.forEach((d, i) => {
      accumulated += d.ventas;
      projectionData.push({ day: `Día ${i + 1}`, real: accumulated, proyectado: null });
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
  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

  const getInsight = (type, value, budget) => {
    const pct = budget ? value / budget * 100 : 0;
    if (type === 'sales') {
      if (pct >= 100) return "🎉 ¡Meta superada!";
      if (pct >= 80) return "👍 Cerca de la meta";
      return "📈 Impulsar ventas";
    }
    return null;
  };

  // Calcular ticket promedio correctamente
  const avgTicket = totals.transactions > 0 ? totals.sales / totals.transactions : 0;
  const comparisonAvgTicket = comparisonTotals && comparisonTotals.transactions > 0 ?
  comparisonTotals.sales / comparisonTotals.transactions :
  0;

  const metrics = [
  {
    id: 'sales',
    title: 'Ventas Totales',
    value: totals.sales,
    comparisonValue: comparisonTotals?.sales,
    budget: currentBudget.sales_budget,
    icon: DollarSign,
    bgColor: 'bg-gradient-to-br from-emerald-100 to-green-200',
    iconBg: 'bg-emerald-200',
    iconColor: 'text-emerald-700',
    format: 'currency'
  },
  {
    id: 'tickets',
    title: 'Ticket Promedio',
    value: avgTicket,
    comparisonValue: comparisonAvgTicket,
    budget: currentBudget.tickets_budget,
    icon: Receipt,
    bgColor: 'bg-gradient-to-br from-sky-100 to-blue-200',
    iconBg: 'bg-sky-200',
    iconColor: 'text-sky-700',
    format: 'currency'
  },
  {
    id: 'transactions',
    title: 'Transacciones',
    value: totals.transactions,
    comparisonValue: comparisonTotals?.transactions,
    budget: currentBudget.transactions_budget,
    icon: Zap,
    bgColor: 'bg-gradient-to-br from-violet-100 to-purple-200',
    iconBg: 'bg-violet-200',
    iconColor: 'text-violet-700'
  },
  {
    id: 'suggested',
    title: 'Sugeridos',
    value: totals.suggested,
    comparisonValue: comparisonTotals?.suggested,
    budget: currentBudget.suggested_budget,
    icon: Gift,
    bgColor: 'bg-gradient-to-br from-pink-100 to-rose-200',
    iconBg: 'bg-pink-200',
    iconColor: 'text-pink-700'
  }];




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
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }} className="bg-clip-text text-pink-700 text-2xl font-bold md:text-3xl from-violet-600 via-pink-500 to-violet-600">Tienda



              </motion.h1>
              {selectedStore &&
              <p className="text-pink-700 text-sm font-medium">{getDisplayName(selectedStore)}</p>
              }
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            {!showComparison && <WeekFilter onWeekChange={setWeekFilter} multiSelect={true} />}
            <DateFilter
              dateRange={dateRange}
              onDateChange={(range) => {setDateRange(range);setWeekFilter(null);}}
              buttonText={showComparison ? "📅 Período Actual" : undefined}
              buttonClassName={showComparison ? "border-blue-300 hover:border-blue-500" : undefined} />

            {showComparison &&
            <DateFilter
              dateRange={comparisonRange || { from: startOfMonth(new Date()), to: new Date() }}
              onDateChange={setComparisonRange}
              buttonClassName="border-pink-300 hover:border-pink-500"
              buttonText="📅 Comparar con" />

            }
          </div>
        </div>

        {selectedStore ?
        <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="flex justify-end gap-2 items-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                variant={!showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowComparison(false);
                  setComparisonRange(null);
                }}
                className={`gap-1 ${!showComparison ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'border-gray-300 hover:border-blue-500'}`}>

                  <Activity className="w-4 h-4" />
                  Actual
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!showComparison) {
                    setShowComparison(true);
                    if (!comparisonRange) {
                      const now = new Date();
                      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                      setComparisonRange({ from: lastMonthStart, to: lastMonthEnd });
                    }
                  }
                }}
                className={`gap-1 ${showComparison ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'border-purple-300 hover:border-purple-500'}`}>

                  <BarChart3 className="w-4 h-4" />
                  Comparable
                </Button>
              </motion.div>

              <StoreReportGenerator
              storeId={selectedStore}
              storeName={selectedStoreName}
              storeCode={selectedStore} />

            </div>

            {/* Retail Week Budget - PRESUPUESTO DEL DÍA (LO MÁS IMPORTANTE) */}
            {!showComparison && currentBudget?.sales_budget &&
          <RetailWeekBudgetCard
            dailySales={dailySales}
            activeBudget={currentBudget}
            storeId={selectedStore}
            formatCurrency={formatCurrency} />

          }

            {/* Sustentación Ejecutiva - Modo Comparable */}
            {showComparison && comparisonTotals &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-700 rounded-xl shadow-sm mb-6 overflow-hidden">

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-base">Análisis Comparativo de Desempeño</h4>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Conclusiones */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1">
                        <span className="text-blue-600">📊</span> Conclusiones
                      </h5>
                      <p className="text-xs text-blue-900 leading-relaxed">
                        {(() => {
                      const salesGrowth = comparisonTotals.sales > 0 ? (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 : 0;
                      const transGrowth = comparisonTotals.transactions > 0 ? (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 : 0;
                      const ticketChange = comparisonTotals.transactions > 0 && totals.transactions > 0 ?
                      (totals.sales / totals.transactions - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100 :
                      0;

                      if (salesGrowth > 10 && transGrowth > 5 && ticketChange > 0) {
                        return `El negocio muestra salud robusta: crecimiento de ${salesGrowth.toFixed(1)}% en facturación, impulsado por mayor tráfico (+${transGrowth.toFixed(1)}%) y mejor ticket promedio (+${ticketChange.toFixed(1)}%). Esto indica efectividad en captación de clientes y capacidad comercial del equipo.`;
                      } else if (salesGrowth > 0 && transGrowth < 0) {
                        return `Facturación creció ${salesGrowth.toFixed(1)}% pese a caída de ${Math.abs(transGrowth).toFixed(1)}% en tráfico. La mejora en ticket promedio compensó la reducción de clientes, pero la dependencia de menos clientes es riesgosa para sostenibilidad.`;
                      } else if (salesGrowth < 0 && transGrowth > 0) {
                        return `Situación crítica: más clientes (+${transGrowth.toFixed(1)}%) pero menos ventas (${salesGrowth.toFixed(1)}%). El ticket promedio cayó significativamente, revelando falta de efectividad comercial en conversión.`;
                      } else if (salesGrowth < -5) {
                        return `Deterioro preocupante de ${Math.abs(salesGrowth).toFixed(1)}% en ventas. La caída simultánea en tráfico y eficiencia comercial indica problemas operativos, de mercado o competitivos que requieren atención inmediata.`;
                      } else {
                        return `Desempeño estable con variación menor al 5%. Si bien muestra consistencia, la falta de crecimiento sugiere estancamiento y necesidad de estrategias para impulsar resultados.`;
                      }
                    })()}
                      </p>
                    </div>

                    {/* Plan de Acción */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <h5 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1">
                        <span className="text-emerald-600">🎯</span> Plan de Acción
                      </h5>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {(() => {
                      const salesGrowth = comparisonTotals.sales > 0 ? (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 : 0;
                      const transGrowth = comparisonTotals.transactions > 0 ? (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 : 0;
                      const ticketChange = comparisonTotals.transactions > 0 && totals.transactions > 0 ?
                      (totals.sales / totals.transactions - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100 :
                      0;

                      if (salesGrowth > 10 && transGrowth > 5 && ticketChange > 0) {
                        return `1) Documentar prácticas exitosas del equipo actual para replicarlas. 2) Incrementar inversión en estrategias de atracción que están funcionando. 3) Establecer nuevas metas 15-20% superiores para mantener momentum de crecimiento.`;
                      } else if (salesGrowth > 0 && transGrowth < 0) {
                        return `1) URGENTE: Auditar causas de pérdida de tráfico (competencia, ubicación, marketing). 2) Implementar estrategias de captación: promociones, redes sociales, alianzas. 3) Mientras tanto, reforzar venta cruzada para maximizar cada cliente que ingresa.`;
                      } else if (salesGrowth < 0 && transGrowth > 0) {
                        return `1) PRIORIDAD MÁXIMA: Capacitación intensiva en técnicas de venta consultiva y cierre. 2) Revisar pricing y mix de productos - puede estar desbalanceado. 3) Implementar script de venta sugerida y supervisión diaria de conversión por vendedor.`;
                      } else if (salesGrowth < -5) {
                        return `PLAN DE RECUPERACIÓN INMEDIATO: 1) Reunión con equipo en 24hrs para diagnóstico de campo. 2) Análisis competitivo urgente del entorno. 3) Promoción agresiva corto plazo para reactivar tráfico. 4) Revisión de servicio al cliente y experiencia de compra. Objetivo: detener caída en 7 días.`;
                      } else {
                        return `1) Definir objetivos de crecimiento ambiciosos (15-20%) para próximo período. 2) Probar estrategias nuevas: productos, promociones, horarios. 3) Benchmarking con tiendas de mejor desempeño. 4) Establecer incentivos al equipo por superación de metas.`;
                      }
                    })()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
          }

            {/* Panel de comparación COMPACTO */}
            {showComparison && comparisonTotals &&
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'sales_comp' ? null : 'sales_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'sales_comp' ? 'ring-2 ring-emerald-400' : ''} ${

              comparisonTotals.sales > 0 && (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ?
              'bg-gradient-to-r from-emerald-500 to-green-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Ventas</span>
                    </div>
                    {comparisonTotals.sales > 0 && (totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.sales > 0 ? ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100 >= 0 ? '+' : '') + ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {formatCurrency(comparisonTotals.sales).slice(0, -3)}</span>
                    <span>Act: {formatCurrency(totals.sales).slice(0, -3)}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'trans_comp' ? null : 'trans_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'trans_comp' ? 'ring-2 ring-purple-400' : ''} ${

              comparisonTotals.transactions > 0 && (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ?
              'bg-gradient-to-r from-purple-500 to-violet-500' :
              'bg-gradient-to-r from-orange-500 to-amber-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Tráfico</span>
                    </div>
                    {comparisonTotals.transactions > 0 && (totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.transactions > 0 ? ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100 >= 0 ? '+' : '') + ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {comparisonTotals.transactions.toLocaleString()}</span>
                    <span>Act: {totals.transactions.toLocaleString()}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'ticket_comp' ? null : 'ticket_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'ticket_comp' ? 'ring-2 ring-blue-400' : ''} ${

              avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
              'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-amber-500 to-orange-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Ticket</span>
                    </div>
                    {avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.transactions > 0 ?
                ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100 >= 0 ? '+' : '') +
                ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1) :
                0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {formatCurrency(comparisonTotals.transactions > 0 ? comparisonTotals.sales / comparisonTotals.transactions : 0).slice(0, -3)}</span>
                    <span>Act: {formatCurrency(avgTicket).slice(0, -3)}</span>
                  </div>
                </motion.button>

                <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMetric = activeMetric === 'suggested_comp' ? null : 'suggested_comp';
                setActiveMetric(newMetric);
                if (newMetric) {
                  setTimeout(() => {
                    const detailPanel = document.getElementById('detail-panel');
                    if (detailPanel) {
                      detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className={`relative overflow-hidden rounded-xl transition-all cursor-pointer p-3 ${
              activeMetric === 'suggested_comp' ? 'ring-2 ring-pink-400' : ''} ${

              comparisonTotals.suggested > 0 && (totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ?
              'bg-gradient-to-r from-pink-500 to-rose-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Sugeridos</span>
                    </div>
                    {comparisonTotals.suggested > 0 && (totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ?
                <TrendingUp className="w-4 h-4 text-white" /> :
                <TrendingDown className="w-4 h-4 text-white" />
                }
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {comparisonTotals.suggested > 0 ? ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100 >= 0 ? '+' : '') + ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex justify-between text-[9px] text-white/80">
                    <span>Ant: {comparisonTotals.suggested.toLocaleString()}</span>
                    <span>Act: {totals.suggested.toLocaleString()}</span>
                  </div>
                </motion.button>
              </motion.div>
          }

            {/* Metrics Grid - Clickeable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) =>
            <MetricCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              comparisonValue={metric.comparisonValue}
              showComparison={showComparison}
              budget={metric.budget}
              icon={metric.icon}
              bgColor={metric.bgColor}
              iconBg={metric.iconBg}
              iconColor={metric.iconColor}
              format={metric.format}
              onClick={() => {
                const newMetric = activeMetric === metric.id ? null : metric.id;
                setActiveMetric(newMetric);
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
              insight={getInsight(metric.id, metric.value, metric.budget)} />

            )}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {activeMetric && !activeMetric.includes('_comp') &&
            <div id="detail-panel">
                  <DetailPanel
                metric={activeMetric}
                data={totals}
                chartData={chartData.map((d) => ({
                  ...d,
                  avgTicket: d.tickets > 0 ? d.ventas / d.tickets : 0
                }))}
                onClose={() => setActiveMetric(null)}
                formatCurrency={formatCurrency}
                shiftData={shiftRecords} />

                </div>
            }
              
              {/* Detail Panel Comparativo */}
              {activeMetric && activeMetric.includes('_comp') && showComparison && comparisonTotals &&
            <motion.div
              id="detail-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl p-6 border border-white/10">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {activeMetric === 'sales_comp' && '💰 Análisis Comparativo de Ventas'}
                      {activeMetric === 'trans_comp' && '⚡ Análisis Comparativo de Transacciones'}
                      {activeMetric === 'ticket_comp' && '🎫 Análisis Comparativo de Ticket'}
                      {activeMetric === 'suggested_comp' && '🎁 Análisis Comparativo de Sugeridos'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setActiveMetric(null)} className="text-white hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Gráfica comparativa detallada */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={chartData}>
                        <defs>
                          <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="previousGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} tickFormatter={(v) =>
                    activeMetric === 'sales_comp' || activeMetric === 'ticket_comp' ? `$${(v / 1000000).toFixed(1)}M` : v.toLocaleString()
                    } />
                        <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff' }}
                      formatter={(v, name) => [
                      activeMetric === 'sales_comp' || activeMetric === 'ticket_comp' ? formatCurrency(v) : v.toLocaleString(),
                      name]
                      } />

                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Area
                      type="monotone"
                      dataKey={
                      activeMetric === 'sales_comp' ? 'ventasComparacion' :
                      activeMetric === 'trans_comp' ? 'transactionsComparacion' :
                      activeMetric === 'ticket_comp' ? 'ticketComparacion' :
                      'suggestedComparacion'
                      }
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fill="url(#previousGrad)"
                      name="Período Anterior"
                      strokeDasharray="5 5" />

                        <Area
                      type="monotone"
                      dataKey={
                      activeMetric === 'sales_comp' ? 'ventas' :
                      activeMetric === 'trans_comp' ? 'transactions' :
                      activeMetric === 'ticket_comp' ? 'ticketPromedio' :
                      'suggested'
                      }
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#currentGrad)"
                      name="Período Actual" />

                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                   {/* Stats comparativos con insights ejecutivos */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
                      <p className="text-xs text-emerald-200 mb-1">Período Actual</p>
                      <p className="text-2xl font-black text-white">
                        {activeMetric === 'sales_comp' && formatCurrency(totals.sales)}
                        {activeMetric === 'trans_comp' && totals.transactions.toLocaleString()}
                        {activeMetric === 'ticket_comp' && formatCurrency(avgTicket)}
                        {activeMetric === 'suggested_comp' && totals.suggested.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-500/20 rounded-xl p-4 border border-slate-400/30">
                      <p className="text-xs text-slate-200 mb-1">Período Anterior</p>
                      <p className="text-2xl font-black text-white">
                        {activeMetric === 'sales_comp' && formatCurrency(comparisonTotals.sales)}
                        {activeMetric === 'trans_comp' && comparisonTotals.transactions.toLocaleString()}
                        {activeMetric === 'ticket_comp' && formatCurrency(comparisonTotals.transactions > 0 ? comparisonTotals.sales / comparisonTotals.transactions : 0)}
                        {activeMetric === 'suggested_comp' && comparisonTotals.suggested.toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-xl p-4 border ${
                activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                'bg-emerald-500/20 border-emerald-400/30' :
                'bg-red-500/20 border-red-400/30'}`
                }>
                      <p className={`text-xs mb-1 ${
                  activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                  activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                  activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                  activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                  'text-emerald-200' :
                  'text-red-200'}`
                  }>Variación</p>
                      <p className={`text-2xl font-black ${
                  activeMetric === 'sales_comp' && totals.sales > comparisonTotals.sales ||
                  activeMetric === 'trans_comp' && totals.transactions > comparisonTotals.transactions ||
                  activeMetric === 'ticket_comp' && avgTicket > comparisonTotals.sales / comparisonTotals.transactions ||
                  activeMetric === 'suggested_comp' && totals.suggested > comparisonTotals.suggested ?
                  'text-emerald-400' :
                  'text-red-400'}`
                  }>
                        {activeMetric === 'sales_comp' &&
                    (totals.sales > comparisonTotals.sales ? '+' : '') +
                    ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'trans_comp' &&
                    (totals.transactions > comparisonTotals.transactions ? '+' : '') +
                    ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'ticket_comp' &&
                    (avgTicket > comparisonTotals.sales / comparisonTotals.transactions ? '+' : '') +
                    ((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1) + '%'
                    }
                        {activeMetric === 'suggested_comp' &&
                    (totals.suggested > comparisonTotals.suggested ? '+' : '') +
                    ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1) + '%'
                    }
                      </p>
                    </div>
                  </div>

                  {/* Análisis Gerencial */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Conclusiones */}
                        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                          <h5 className="text-sm font-bold text-blue-200 mb-2 flex items-center gap-1">
                            <span>📊</span> Conclusiones
                          </h5>
                          <p className="text-xs text-blue-100 leading-relaxed">
                            {activeMetric === 'sales_comp' && (
                        totals.sales > comparisonTotals.sales ?
                        `La facturación creció ${((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1)}%, superando el período anterior por ${formatCurrency(totals.sales - comparisonTotals.sales)}. Este resultado demuestra que las estrategias comerciales actuales están funcionando y el equipo está ejecutando efectivamente.` :
                        `Las ventas cayeron ${Math.abs((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100).toFixed(1)}%, representando ${formatCurrency(Math.abs(totals.sales - comparisonTotals.sales))} menos que el período anterior. Esta contracción impacta directamente los objetivos mensuales y señala problemas operativos o de mercado que deben resolverse urgentemente.`)
                        }
                            {activeMetric === 'trans_comp' && (
                        totals.transactions > comparisonTotals.transactions ?
                        `El tráfico aumentó ${((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1)}%, con ${Math.abs(totals.transactions - comparisonTotals.transactions)} clientes adicionales. Esto indica éxito en captación, pero debe verificarse si las ventas crecieron proporcionalmente para confirmar efectividad comercial.` :
                        `Perdimos ${Math.abs(totals.transactions - comparisonTotals.transactions)} clientes (${Math.abs((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100).toFixed(1)}% menos tráfico). Esto es crítico porque reduce oportunidades de venta. Probablemente causado por factores externos, competencia o deterioro en servicio que aleja a los clientes.`)
                        }
                            {activeMetric === 'ticket_comp' && (
                        avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                        `El ticket promedio mejoró ${((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1)}% (${formatCurrency(avgTicket - comparisonTotals.sales / comparisonTotals.transactions)} más por cliente). Cada cliente está comprando más, lo que maximiza rentabilidad y evidencia mejor capacidad de venta consultiva del equipo.` :
                        `El ticket promedio bajó ${Math.abs((avgTicket - comparisonTotals.sales / comparisonTotals.transactions) / (comparisonTotals.sales / comparisonTotals.transactions) * 100).toFixed(1)}%. Los clientes compran menos por visita, afectando márgenes. Esto sugiere falta de venta sugerida, problemas en mix de productos o migración a opciones de menor valor.`)
                        }
                            {activeMetric === 'suggested_comp' && (
                        totals.suggested > comparisonTotals.suggested ?
                        `Los sugeridos crecieron ${((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1)}%, vendiendo ${Math.abs(totals.suggested - comparisonTotals.suggested)} unidades más. Esto impacta directamente la rentabilidad porque cada sugerido tiene mayor margen y demuestra habilidad comercial del equipo.` :
                        `Vendimos ${Math.abs(totals.suggested - comparisonTotals.suggested)} sugeridos menos (${Math.abs((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100).toFixed(1)}% de caída). Esto representa pérdida directa de margen y señala que el equipo no está ejecutando técnicas de venta consultiva efectivamente.`)
                        }
                          </p>
                        </div>

                        {/* Plan de Acción */}
                        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                          <h5 className="text-sm font-bold text-emerald-200 mb-2 flex items-center gap-1">
                            <span>🎯</span> Plan de Acción
                          </h5>
                          <p className="text-xs text-emerald-100 leading-relaxed">
                            {activeMetric === 'sales_comp' && (
                        totals.sales > comparisonTotals.sales ?
                        `1) Documentar qué hizo diferente el equipo este período (horarios, productos, técnicas). 2) Replicar estas prácticas exitosas en otros puntos. 3) Establecer nueva meta 10-15% superior para mantener momentum. Resultado esperado: consolidar crecimiento y llevarlo a otros puntos de venta.` :
                        `PLAN URGENTE: 1) Reunión HOY con equipo para identificar problemas específicos. 2) Analizar competencia directa esta semana. 3) Lanzar promoción agresiva en 48hrs para reactivar. 4) Revisar experiencia de cliente completamente. Resultado esperado: detener caída en 7 días máximo.`)
                        }
                            {activeMetric === 'trans_comp' && (
                        totals.transactions > comparisonTotals.transactions ?
                        `1) Analizar si ventas crecieron al mismo ritmo que tráfico. 2) Si no, capacitar equipo en cierre de ventas esta semana. 3) Implementar seguimiento diario de conversión por vendedor. Resultado esperado: convertir el mayor tráfico en ventas proporcionalmente mayores.` :
                        `PRIORIDAD ALTA: 1) Identificar por qué perdimos clientes (auditoría de servicio en 24hrs). 2) Revisar presencia digital y competencia. 3) Activar campaña de reactivación inmediata. 4) Mejorar experiencia física del punto. Resultado esperado: recuperar al menos 50% del tráfico perdido en 14 días.`)
                        }
                            {activeMetric === 'ticket_comp' && (
                        avgTicket > comparisonTotals.sales / comparisonTotals.transactions ?
                        `1) Identificar qué vendedores tienen mejor ticket y documentar su método. 2) Capacitar resto del equipo en estas técnicas. 3) Establecer metas individuales de ticket para todos. Resultado esperado: llevar a todos los vendedores al nivel del mejor performer.` :
                        `ACCIÓN INMEDIATA: 1) Entrenamiento intensivo en venta sugerida mañana. 2) Implementar script obligatorio de cierre. 3) Verificar disponibilidad de productos complementarios. 4) Supervisión diaria de ticket por vendedor. Resultado esperado: recuperar ticket promedio anterior en 10 días.`)
                        }
                            {activeMetric === 'suggested_comp' && (
                        totals.suggested > comparisonTotals.suggested ?
                        `1) Reconocer públicamente a vendedores con más sugeridos. 2) Crear competencia interna con premio semanal. 3) Mantener inventario óptimo de productos complementarios. Resultado esperado: mantener y superar nivel actual, estableciendo nuevo estándar.` :
                        `INTERVENCIÓN URGENTE: 1) Reforzar capacitación en venta consultiva esta semana. 2) Revisar inventario de productos complementarios. 3) Implementar script de sugerido obligatorio. 4) Seguimiento diario individual. Resultado esperado: duplicar sugeridos en 14 días.`)
                        }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            }
              </AnimatePresence>

              {/* Gráficas adicionales en modo comparable */}
              {showComparison && comparisonTotals && !activeMetric &&
          <ComparableChartsGrid
            chartData={chartData}
            totals={totals}
            comparisonTotals={comparisonTotals}
            formatCurrency={formatCurrency} />

          }

            {/* Overview Charts - Solo visible en modo ACTUAL */}
            {!activeMetric && !showComparison &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6">

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales Trend */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Ventas Diarias {showComparison && '- Comparativo'}
                        </CardTitle>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="mt-3 bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50 border-2 border-emerald-200/60 rounded-xl px-4 py-3 shadow-md">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-bold text-emerald-700">💡 Insight:</span> Los picos muestran días exitosos a replicar. Las caídas requieren promociones. Analiza qué funciona mejor.
                        </p>
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="comparisonGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          formatter={(v, name) => [formatCurrency(v), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <Area
                          type="monotone"
                          dataKey="ventasComparacion"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fill="url(#comparisonGrad)"
                          name="Período Anterior"
                          strokeDasharray="5 5" />

                        }
                            <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#salesGrad)" name={showComparison ? "Período Actual" : "Ventas"} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ventas por Hora */}
                  <SalesByHourChart shiftRecords={shiftRecords} formatCurrency={formatCurrency} />
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transacciones vs Venta */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        Transacciones vs Ventas {showComparison && '- Comparativo'}
                      </CardTitle>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="mt-3 bg-gradient-to-br from-purple-50 via-violet-50 to-blue-50 border-2 border-purple-200/60 rounded-xl px-4 py-3 shadow-md">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-bold text-purple-700">💡 Insight:</span> Más clientes pero pocas ventas indica problema de conversión. Capacita en cierre de ventas.
                        </p>
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(v, name) => [name.includes('Ventas') ? formatCurrency(v) : v.toLocaleString(), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <>
                                <Bar yAxisId="left" dataKey="transactionsComparacion" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Trans. Anterior" />
                                <Line yAxisId="right" type="monotone" dataKey="ventasComparacion" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#94a3b8', r: 3 }} name="Ventas Anterior" />
                              </>
                        }
                            <Bar yAxisId="left" dataKey="transactions" fill="#a855f7" radius={[4, 4, 0, 0]} name={showComparison ? "Trans. Actual" : "Transacciones"} />
                            <Line yAxisId="right" type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} name={showComparison ? "Ventas Actual" : "Ventas"} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ticket Promedio */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        Ticket Promedio {showComparison && '- Comparativo'}
                      </CardTitle>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="mt-3 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 border-2 border-blue-200/60 rounded-xl px-4 py-3 shadow-md">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-bold text-blue-700">💡 Insight:</span> Aumenta ticket con combos y venta consultiva. Entrena al equipo en cross-selling.
                        </p>
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="ticketCompGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                            <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(v, name) => [formatCurrency(v), name]} />

                            <Legend />
                            {showComparison && comparisonTotals &&
                        <Area
                          type="monotone"
                          dataKey="ticketComparacion"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fill="url(#ticketCompGrad)"
                          name="Ticket Anterior"
                          strokeDasharray="5 5" />

                        }
                            <Area type="monotone" dataKey="ticketPromedio" stroke="#3b82f6" strokeWidth={2} fill="url(#ticketGrad)" name={showComparison ? "Ticket Actual" : "Ticket Promedio"} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Third Row - Velocidad de Crecimiento */}
                <GrowthVelocityChart
              dailyTrend={chartData.map((d) => ({ ...d, sales: d.ventas }))}
              budget={currentBudget?.sales_budget || 0}
              formatCurrency={formatCurrency} />

              </motion.div>
          }



            {/* Monthly Budget Manager Button */}
            <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}>

              <Button
              onClick={() => setShowMonthlyBudget(true)}
              className="mb-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2">

                <Calendar className="w-4 h-4" />
                Configurar Presupuestos del Mes
              </Button>
            </motion.div>

            {/* Monthly Budget Manager Modal */}
            <MonthlyBudgetManager
            storeId={selectedStore}
            isOpen={showMonthlyBudget}
            onClose={() => setShowMonthlyBudget(false)}
            onSuccess={() => {
              queryClient.invalidateQueries(['dailyBudgets']);
              queryClient.invalidateQueries(['budgets']);
            }} />




            {/* Compra Vale Modal */}
            <AnimatePresence>
              {showCompraVale &&
            <CompraValeModal
              isOpen={showCompraVale}
              onClose={() => setShowCompraVale(false)}
              storeId={selectedStore}
              currentSales={totals}
              dateRange={weekFilter || dateRange} />

            }
            </AnimatePresence>

            {/* Store Sales Modal */}
            <AnimatePresence>
              {showStoreSales &&
            <StoreSalesModal
              isOpen={showStoreSales}
              onClose={() => setShowStoreSales(false)}
              storeId={selectedStore} />

            }
            </AnimatePresence>

            {/* Projection Detail Modal */}
            <AnimatePresence>
              {projectionMetric && projections &&
            <ProjectionDetailModal
              isOpen={!!projectionMetric}
              onClose={() => setProjectionMetric(null)}
              metric={projectionMetric}
              data={projections}
              formatCurrency={formatCurrency} />

            }
            </AnimatePresence>

            {/* Proyección del Mes - Solo en modo ACTUAL */}
            {projections && !showComparison &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden">

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
                      stroke={totals.sales / (currentBudget?.sales_budget || 1) * 100 >= 70 ? '#10b981' : '#f59e0b'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 264" }}
                      animate={{ strokeDasharray: `${Math.min(totals.sales / (currentBudget?.sales_budget || 1) * 264, 264)} 264` }}
                      transition={{ duration: 1.5 }} />

                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                      className="text-2xl font-black text-white"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}>

                          {currentBudget?.sales_budget > 0 ? (totals.sales / currentBudget.sales_budget * 100).toFixed(0) : 0}%
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
                chartData: chartData.slice(-7).map((d) => d.ventas),
                footer: `${(totals.sales / (currentBudget?.sales_budget || 1) * 100).toFixed(0)}% de meta`
              },
              {
                key: 'projection',
                label: 'Proyección Cierre',
                value: projections.projectedSales,
                icon: TrendingUp,
                iconBg: 'bg-violet-500/20',
                iconColor: 'text-violet-400',
                isGauge: true,
                gaugePercent: projections.projectedSales / (currentBudget?.sales_budget || 1) * 100,
                footer: `${(projections.projectedSales / (currentBudget?.sales_budget || 1) * 100).toFixed(0)}% proyectado`,
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
                comparePercent: projections.avgTicket / (projections.budgetTicket || 1) * 100,
                footer: `Meta: ${formatCurrency(projections.budgetTicket)}`
              }].
              map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.key}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProjectionMetric(item.key)}
                    className="bg-white/5 rounded-2xl p-4 border border-white/10 text-left transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">

                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${item.iconColor}`} />
                          </div>
                          <span className="text-white/70 text-xs">{item.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white mb-2">{formatCurrency(item.value)}</p>
                        
                        {/* Visualización según tipo */}
                        {item.chartData &&
                    <div className="flex items-end gap-0.5 h-10">
                            {item.chartData.map((val, i) =>
                      <motion.div
                        key={i}
                        className={`flex-1 ${item.barColor} rounded-t-lg shadow-sm`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: `${Math.max(15, val / Math.max(...item.chartData, 1) * 100)}%`,
                          opacity: 1,
                          y: [0, -2, 0]
                        }}
                        transition={{
                          delay: idx * 0.1 + i * 0.05,
                          y: { duration: 1, repeat: Infinity, repeatDelay: 2, delay: i * 0.1 }
                        }}
                        whileHover={{ scaleY: 1.1, y: -3 }} />

                      )}
                          </div>
                    }
                        
                        {item.isGauge &&
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
                          transition={{ delay: idx * 0.1, duration: 1 }} />

                            </svg>
                          </div>
                    }
                        
                        {item.isTrend &&
                    <div className="h-10 flex items-center relative">
                            <svg className="w-full h-full" viewBox="0 0 100 30">
                              <defs>
                                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                              <motion.path
                          d="M 0 25 Q 25 20 50 15 T 100 5"
                          fill="none"
                          stroke="url(#trendGradient)"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: idx * 0.1, duration: 1.5, ease: "easeInOut" }} />

                              <motion.circle
                          cx="50"
                          cy="15"
                          r="3"
                          fill="#f59e0b"
                          initial={{ opacity: 0 }}
                          animate={{
                            cx: [0, 50, 100],
                            cy: [25, 15, 5],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{ duration: 2, delay: idx * 0.1 + 1, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }} />

                            </svg>
                          </div>
                    }
                        
                        {item.isComparative &&
                    <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/50 w-10">Actual</span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                            className="h-full bg-sky-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(item.comparePercent, 100)}%` }}
                            transition={{ delay: idx * 0.1 }} />

                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/50 w-10">Meta</span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white/30 rounded-full w-full" />
                              </div>
                            </div>
                          </div>
                    }
                        
                        <p className={`text-[10px] mt-1 ${item.footerColor || 'text-white/50'}`}>{item.footer}</p>
                      </motion.button>);

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
                    animate={{ width: `${Math.min(totals.sales / (currentBudget?.sales_budget || 1) * 100, 100)}%` }}
                    transition={{ duration: 1 }} />

                      {/* Marcador del 100% */}
                      <div className="absolute right-0 top-0 h-full w-0.5 bg-white/50" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-white/50">
                      <span>Venta Actual: {(totals.sales / (currentBudget?.sales_budget || 1) * 100).toFixed(0)}%</span>
                      <span>Meta: 100%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
          }

            {/* Resumen Ejecutivo */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 text-white">

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
                  <p className="text-xs text-white/50 mt-1">{totals.transactions > 0 ? (totals.suggested / totals.transactions * 100).toFixed(0) : 0}% de conversión</p>
                </motion.div>
              </div>
            </motion.div>
          </div> :

        <div className="text-center py-20">
            <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-7xl mb-4">

              📊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver el dashboard de estadísticas</p>
          </div>
        }
      </div>
    </div>);

}