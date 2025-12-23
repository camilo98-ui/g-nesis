import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function KPIDetailModal({ kpiType, onClose, data, dateRange, storesAnalysis, zoneTotals }) {
  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const daySales = data.allDailySales
        .filter(s => {
          try {
            const d = new Date(s.date);
            return d.toDateString() === day.toDateString();
          } catch {
            return false;
          }
        });
      
      const totalSales = daySales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTransactions = daySales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      
      return {
        date: format(day, 'dd MMM', { locale: es }),
        sales: totalSales / 1000000,
        transactions: totalTransactions,
        avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        budget: 0
      };
    });
  }, [data, dateRange]);

  const topStores = useMemo(() => {
    return storesAnalysis
      .filter(s => s.hasData)
      .sort((a, b) => b.salesCompliance - a.salesCompliance)
      .slice(0, 10)
      .map(s => ({
        name: s.name,
        compliance: s.salesCompliance,
        sales: s.totalSales / 1000000,
        gap: s.gap / 1000000
      }));
  }, [storesAnalysis]);

  const statusData = useMemo(() => {
    return storesAnalysis
      .filter(s => s.hasData)
      .map(s => ({
        name: s.name.substring(0, 10),
        compliance: s.salesCompliance,
        fill: s.status === 'positive' ? '#10b981' : s.status === 'negative' ? '#f59e0b' : '#ef4444'
      }))
      .sort((a, b) => a.compliance - b.compliance);
  }, [storesAnalysis]);

  const getKPIConfig = () => {
    switch(kpiType) {
      case 'sales':
        return {
          title: 'Venta Total de la Zona',
          subtitle: `${formatCurrency(zoneTotals.totalSales)} de ${formatCurrency(zoneTotals.totalBudget)}`,
          icon: '💰',
          color: 'blue'
        };
      case 'compliance':
        return {
          title: 'Cumplimiento por Tienda',
          subtitle: `${((zoneTotals.totalSales/zoneTotals.totalBudget)*100).toFixed(1)}% de cumplimiento general`,
          icon: '📊',
          color: zoneTotals.totalSales/zoneTotals.totalBudget >= 0.9 ? 'emerald' : zoneTotals.totalSales/zoneTotals.totalBudget >= 0.7 ? 'amber' : 'red'
        };
      case 'critical':
        return {
          title: 'Tiendas Críticas',
          subtitle: `${storesAnalysis.filter(s => s.status === 'critical').length} tiendas necesitan intervención`,
          icon: '🔴',
          color: 'red'
        };
      case 'meta':
        return {
          title: 'Tiendas en Meta',
          subtitle: `${storesAnalysis.filter(s => s.status === 'positive').length} tiendas superando expectativas`,
          icon: '🟢',
          color: 'emerald'
        };
      default:
        return { title: '', subtitle: '', icon: '', color: 'gray' };
    }
  };

  const config = getKPIConfig();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-1">{payload[0].payload.date || payload[0].payload.name}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('$') || entry.name.includes('Venta') ? formatShort(entry.value) : entry.value.toFixed(0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-14 h-14 rounded-xl bg-${config.color}-500/20 flex items-center justify-center text-3xl`}>
                  {config.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">{config.title}</h2>
                  <p className="text-slate-400 mt-1">{config.subtitle}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Gráfica Principal de Tendencia */}
            {(kpiType === 'sales' || kpiType === 'compliance') && (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">📈 Tendencia Diaria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="salesGradientLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#salesGradientLarge)"
                      name="Venta (M)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top 10 Tiendas por Cumplimiento */}
            {kpiType === 'compliance' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">🏆 Ranking de Tiendas</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topStores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} style={{ fontSize: '11px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="compliance" fill="#10b981" radius={[0, 8, 8, 0]} name="% Cumplimiento" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Estado de Todas las Tiendas */}
            {(kpiType === 'critical' || kpiType === 'meta') && (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">
                  {kpiType === 'critical' ? '⚠️ Tiendas en Riesgo' : '✅ Tiendas Destacadas'}
                </h3>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={statusData.filter(s => 
                    kpiType === 'critical' ? s.fill === '#ef4444' : s.fill === '#10b981'
                  )}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="compliance" radius={[8, 8, 0, 0]} name="% Cumplimiento">
                      {statusData.map((entry, index) => (
                        <Bar key={`bar-${index}`} dataKey="compliance" fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Venta Promedio/Día</p>
                <p className="text-3xl font-black text-white">{formatShort(zoneTotals.totalSales / dailyData.length)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-6 border border-emerald-500/20">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Mejor Día</p>
                <p className="text-3xl font-black text-white">{formatShort(Math.max(...dailyData.map(d => d.sales)))}</p>
                <p className="text-xs text-emerald-400 mt-1">{dailyData.find(d => d.sales === Math.max(...dailyData.map(d => d.sales)))?.date}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Transacciones</p>
                <p className="text-3xl font-black text-white">{dailyData.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}