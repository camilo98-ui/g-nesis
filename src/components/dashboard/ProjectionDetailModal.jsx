import React from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, TrendingUp, Zap, Receipt } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar } from 'recharts';

export default function ProjectionDetailModal({ isOpen, onClose, metric, data, formatCurrency }) {
  const configs = {
    sales: {
      title: '💰 Detalle de Ventas Actuales',
      color: '#10b981',
      description: 'Evolución de ventas acumuladas',
      chart: (
        <ComposedChart data={data.chartData}>
          <defs>
            <linearGradient id="salesDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [formatCurrency(v), 'Ventas']} contentStyle={{ borderRadius: 12 }} />
          <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fill="url(#salesDetail)" />
        </ComposedChart>
      ),
      stats: [
        { label: 'Total Periodo', value: formatCurrency(data.totals.sales), color: 'from-emerald-50 to-green-100', textColor: 'text-emerald-600' },
        { label: 'Promedio/Día', value: formatCurrency(data.totals.sales / Math.max(data.daysElapsed, 1)), color: 'from-blue-50 to-cyan-100', textColor: 'text-blue-600' },
        { label: 'Meta Mes', value: formatCurrency(data.budget), color: 'from-violet-50 to-purple-100', textColor: 'text-violet-600' },
        { label: 'Cumplimiento', value: `${((data.totals.sales / data.budget) * 100).toFixed(1)}%`, color: 'from-amber-50 to-orange-100', textColor: 'text-amber-600' },
      ]
    },
    projection: {
      title: '📈 Proyección de Cierre',
      color: '#8b5cf6',
      description: 'Estimación basada en tendencia actual',
      chart: (
        <ComposedChart data={data.projectionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v, name) => [formatCurrency(v), name]} contentStyle={{ borderRadius: 12 }} />
          <Area type="monotone" dataKey="real" stroke="#10b981" fill="#10b98120" name="Real" />
          <Line type="monotone" dataKey="proyectado" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" name="Proyectado" />
        </ComposedChart>
      ),
      stats: [
        { label: 'Proyección Final', value: formatCurrency(data.projectedSales), color: 'from-violet-50 to-purple-100', textColor: 'text-violet-600' },
        { label: 'Meta Mes', value: formatCurrency(data.budget), color: 'from-slate-50 to-gray-100', textColor: 'text-slate-600' },
        { label: 'Diferencia', value: formatCurrency(data.projectedSales - data.budget), color: data.projectedSales >= data.budget ? 'from-green-50 to-emerald-100' : 'from-red-50 to-rose-100', textColor: data.projectedSales >= data.budget ? 'text-green-600' : 'text-red-600' },
        { label: 'Probabilidad', value: data.projectedSales >= data.budget ? '85%' : '45%', color: 'from-cyan-50 to-blue-100', textColor: 'text-cyan-600' },
      ]
    },
    required: {
      title: '⚡ Meta Diaria Necesaria',
      color: '#f59e0b',
      description: 'Venta requerida por día para cumplir meta',
      chart: (
        <BarChart data={data.dailyRequired}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [formatCurrency(v), 'Requerido']} contentStyle={{ borderRadius: 12 }} />
          <Bar dataKey="required" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      ),
      stats: [
        { label: 'Venta Diaria Necesaria', value: formatCurrency(data.requiredDailySales), color: 'from-amber-50 to-orange-100', textColor: 'text-amber-600' },
        { label: 'Días Restantes', value: `${data.daysRemaining} días`, color: 'from-blue-50 to-sky-100', textColor: 'text-blue-600' },
        { label: 'Restante por Vender', value: formatCurrency(data.salesGap), color: 'from-pink-50 to-rose-100', textColor: 'text-pink-600' },
        { label: 'Promedio Actual/Día', value: formatCurrency(data.totals.sales / Math.max(data.daysElapsed, 1)), color: 'from-emerald-50 to-green-100', textColor: 'text-emerald-600' },
      ]
    },
    ticket: {
      title: '🎫 Análisis Ticket Promedio',
      color: '#3b82f6',
      description: 'Rendimiento del ticket promedio',
      chart: (
        <AreaChart data={data.chartData}>
          <defs>
            <linearGradient id="ticketDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [formatCurrency(v), 'Ticket Promedio']} contentStyle={{ borderRadius: 12 }} />
          <Area type="monotone" dataKey="ticketPromedio" stroke="#3b82f6" strokeWidth={3} fill="url(#ticketDetail)" />
        </AreaChart>
      ),
      stats: [
        { label: 'Ticket Actual', value: formatCurrency(data.avgTicket), color: 'from-sky-50 to-blue-100', textColor: 'text-sky-600' },
        { label: 'Meta Ticket', value: formatCurrency(data.budgetTicket), color: 'from-violet-50 to-purple-100', textColor: 'text-violet-600' },
        { label: 'Cumplimiento', value: `${((data.avgTicket / data.budgetTicket) * 100).toFixed(0)}%`, color: 'from-amber-50 to-orange-100', textColor: 'text-amber-600' },
        { label: 'Total Transacciones', value: data.totals.transactions.toLocaleString(), color: 'from-pink-50 to-rose-100', textColor: 'text-pink-600' },
      ]
    }
  };

  const config = configs[metric];
  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-inner p-4 border border-gray-100">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {config.chart}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-center`}
              >
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-lg font-black ${stat.textColor}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Close button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}