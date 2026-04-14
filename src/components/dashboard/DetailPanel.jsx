import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ChartInsight from '@/components/dashboard/ChartInsight';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';

export default function DetailPanel({ metric, data, onClose, chartData, formatCurrency, shiftData, gregorianTotal }) {
  const stats = useMemo(() => {
    const values = chartData.map((d) => d[metric === 'sales' ? 'ventas' : metric] || 0);
    const nonZero = values.filter((v) => v > 0);
    const max = Math.max(...values);
    const min = Math.min(...(nonZero.length ? nonZero : [0]));
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / Math.max(values[0], 1) * 100 : 0;
    const total = values.reduce((a, b) => a + b, 0);
    return { max, min, avg, trend, total };
  }, [chartData, metric]);

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
      { name: '🌙 Noche', value: dist.night, fill: '#6366f1' }
    ].filter((d) => d.value > 0);
  }, [shiftData, metric]);

  const getChartContent = () => {
    switch (metric) {
      case 'sales':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">📈 Ventas vs Ticket Promedio</h4>
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
                      formatter={(v, name) => [formatCurrency(v), name]} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fill="url(#colorSales)" name="Ventas" />
                    <Line yAxisId="right" type="monotone" dataKey="ticketPromedio" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Ticket Prom." />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 text-center cursor-pointer">
                <p className="text-sm text-gray-600 mb-2 font-semibold">🏆 Mejor día</p>
                <p className="text-xl md:text-2xl font-black text-green-600 mb-1">{formatCurrency(stats.max)}</p>
                <p className="text-xs text-gray-500 mt-2">{chartData.find(d => d.ventas === stats.max)?.fullDate || 'N/A'}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-5 text-center cursor-pointer">
                <p className="text-sm text-gray-600 mb-2 font-semibold">📊 Promedio</p>
                <p className="text-xl md:text-2xl font-black text-amber-600 mb-1">{formatCurrency(stats.avg)}</p>
                <p className="text-xs text-gray-500 mt-2">Diario en período</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-5 text-center cursor-pointer">
                <p className="text-sm text-gray-600 mb-2 font-semibold">📊 Total Mes</p>
                <p className="text-xl md:text-2xl font-black text-blue-600 mb-1">{formatCurrency(gregorianTotal ?? stats.total)}</p>
                <p className="text-xs text-gray-500 mt-2">Acumulado mes actual</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} className={`rounded-xl p-5 text-center cursor-pointer ${stats.trend >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}>
                <p className="text-sm text-gray-600 mb-2 font-semibold">{stats.trend >= 0 ? '📈' : '📉'} Crecimiento</p>
                <p className={`text-xl md:text-2xl font-black ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'} mb-1`}>{stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">vs inicio período</p>
              </motion.div>
            </div>
            {shiftDistribution.length > 0 &&
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">🕐 Distribución por Turno</h4>
                  <div className="h-48 bg-white rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={shiftDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                          {shiftDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
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
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label} formatter={(v) => [formatCurrency(v), 'Ticket Promedio']} />
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
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label} formatter={(v, name) => [name === 'Venta' ? formatCurrency(v) : v.toLocaleString(), name]} />
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
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{titles[metric]}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>
      <ChartInsight
        data={chartData}
        metric={metric === 'sales' ? 'ventas' : metric === 'tickets' ? 'ticketPromedio' : metric}
        formatCurrency={formatCurrency}
      />
      {getChartContent()}
    </motion.div>
  );
}