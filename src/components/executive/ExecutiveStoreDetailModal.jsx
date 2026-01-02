import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, Target, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExecutiveStoreDetailModal({ store, onClose, allDailySales }) {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.ceil((monthEnd - now) / (1000 * 60 * 60 * 24));

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

  // Filtrar ventas de esta tienda
  const storeSales = useMemo(() => {
    return allDailySales.filter(s => s.store_id === store.code);
  }, [allDailySales, store.code]);

  // Datos de la semana actual - día por día
  const weekDailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    return days.map(day => {
      const sale = storeSales.find(s => {
        try {
          const saleDate = parseISO(s.date);
          return saleDate.getDate() === day.getDate() && 
                 saleDate.getMonth() === day.getMonth() &&
                 saleDate.getFullYear() === day.getFullYear();
        } catch {
          return false;
        }
      });

      return {
        date: format(day, 'EEE dd', { locale: es }),
        sales: sale?.total_sales || 0,
        transactions: sale?.total_transactions || 0,
        ticket: sale?.total_transactions > 0 ? (sale.total_sales / sale.total_transactions) : 0
      };
    });
  }, [storeSales, currentWeekStart, currentWeekEnd]);

  // Datos del mes - ventas diarias
  const monthDailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: now });
    return days.map(day => {
      const sale = storeSales.find(s => {
        try {
          const saleDate = parseISO(s.date);
          return saleDate.getDate() === day.getDate() && 
                 saleDate.getMonth() === day.getMonth() &&
                 saleDate.getFullYear() === day.getFullYear();
        } catch {
          return false;
        }
      });

      return {
        date: format(day, 'dd', { locale: es }),
        sales: sale?.total_sales || 0,
        budget: store.dailyBudget,
        compliance: sale?.total_sales > 0 ? ((sale.total_sales / store.dailyBudget) * 100) : 0
      };
    });
  }, [storeSales, monthStart, now, store.dailyBudget]);

  // Proyección de ventas restantes del mes
  const remainingProjection = store.avgDailySales * daysRemaining;
  const projectedTotal = store.monthTotalSales + remainingProjection;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 max-w-7xl w-full max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white mb-1">{store.name}</h2>
              <p className="text-sm text-slate-300">{store.code}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)] space-y-8">
          {/* KPIs Principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <p className="text-xs text-slate-400 uppercase font-bold">Venta Semana</p>
              </div>
              <p className="text-2xl font-black text-white mb-1">{formatShort(store.weekTotalSales)}</p>
              <p className={`text-xs font-bold ${
                store.weekCompliance >= 100 ? 'text-emerald-400' :
                store.weekCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {store.weekCompliance.toFixed(0)}% vs PPT {formatShort(store.weeklyBudget)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-pink-400" />
                <p className="text-xs text-slate-400 uppercase font-bold">Proyección Semana</p>
              </div>
              <p className="text-2xl font-black text-white mb-1">{formatShort(store.weekProjection)}</p>
              <p className={`text-xs font-bold ${
                store.weekProjectionCompliance >= 100 ? 'text-emerald-400' :
                store.weekProjectionCompliance >= 85 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {store.weekProjectionCompliance.toFixed(0)}% de cierre
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <p className="text-xs text-slate-400 uppercase font-bold">Ticket Promedio</p>
              </div>
              <p className="text-2xl font-black text-white mb-1">{formatCurrency(store.weekAvgTicket)}</p>
              <p className="text-xs text-slate-400">{store.weekTotalTransactions} transacciones</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="w-5 h-5 text-purple-400" />
                <p className="text-xs text-slate-400 uppercase font-bold">Cumplimiento Mes</p>
              </div>
              <p className={`text-2xl font-black mb-1 ${
                store.salesCompliance >= 90 ? 'text-emerald-400' :
                store.salesCompliance >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {store.salesCompliance.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-400">{formatShort(store.monthTotalSales)} vendido</p>
            </div>
          </div>

          {/* Desempeño Semanal - Detalle por Día */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Desempeño Semanal por Día
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekDailyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid #475569', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => {
                    if (name === 'sales') return [formatCurrency(value), 'Ventas'];
                    if (name === 'transactions') return [value, 'Transacciones'];
                    if (name === 'ticket') return [formatCurrency(value), 'Ticket Prom'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="sales" fill="url(#salesGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Proyección Mensual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Proyección vs Presupuesto */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-black text-white mb-4">Proyección de Cierre del Mes</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Vendido a la fecha</span>
                  <span className="text-xl font-black text-white">{formatShort(store.monthTotalSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Proyección restante</span>
                  <span className="text-xl font-black text-emerald-400">{formatShort(remainingProjection)}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Total proyectado</span>
                  <span className="text-2xl font-black text-white">{formatShort(projectedTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Presupuesto mes</span>
                  <span className="text-xl font-black text-purple-400">{formatShort(store.salesBudget)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm text-slate-300">% Proyectado</span>
                  <span className={`text-3xl font-black ${
                    store.monthProjectionCompliance >= 100 ? 'text-emerald-400' :
                    store.monthProjectionCompliance >= 85 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {store.monthProjectionCompliance.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Ventas Restantes */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
              <h3 className="text-lg font-black text-white mb-4">Por Vender del Mes</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Días restantes</span>
                  <span className="text-xl font-black text-white">{daysRemaining} días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Promedio diario actual</span>
                  <span className="text-xl font-black text-cyan-400">{formatShort(store.avgDailySales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">PPT diario requerido</span>
                  <span className="text-xl font-black text-purple-400">{formatShort(store.dailyBudget)}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Gap actual</span>
                  <span className={`text-2xl font-black ${store.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {store.gap > 0 ? formatShort(store.gap) : '+' + formatShort(Math.abs(store.gap))}
                  </span>
                </div>
                {store.gap > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Requerido x día</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatShort(store.gap / daysRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tendencia Diaria del Mes - Cumplimiento */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Cumplimiento Diario del Mes
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthDailyData}>
                <defs>
                  <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}%`} domain={[0, 150]} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid #475569', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => {
                    if (name === 'compliance') return [`${value.toFixed(0)}%`, 'Cumplimiento'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="compliance" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#complianceGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}