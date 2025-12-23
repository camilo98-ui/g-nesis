import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import DateFilter from '@/components/DateFilter';
import { STORES, getDisplayName } from '@/components/StoreSelector';

export default function ExecutiveComparable({ onClose, allDailySales }) {
  const [period1, setPeriod1] = useState({ 
    from: startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))), 
    to: endOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  });
  const [period2, setPeriod2] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date())
  });

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  }).format(Math.round(v));

  const formatShort = (v) => `$${(v / 1000000).toFixed(1)}M`;

  const calculatePeriodData = (dateRange) => {
    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && !isNaN(d.getTime()) && d >= dateRange.from && d <= dateRange.to;
        } catch {
          return false;
        }
      });

      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        code: store.code,
        name: getDisplayName(store.code),
        sales: totalSales,
        transactions: totalTransactions,
        avgTicket
      };
    });
  };

  const period1Data = useMemo(() => calculatePeriodData(period1), [period1, allDailySales]);
  const period2Data = useMemo(() => calculatePeriodData(period2), [period2, allDailySales]);

  const comparisonData = useMemo(() => {
    return STORES.map(store => {
      const p1 = period1Data.find(s => s.code === store.code);
      const p2 = period2Data.find(s => s.code === store.code);

      const salesChange = p1.sales > 0 ? ((p2.sales - p1.sales) / p1.sales) * 100 : 0;
      const transactionsChange = p1.transactions > 0 ? ((p2.transactions - p1.transactions) / p1.transactions) * 100 : 0;
      const ticketChange = p1.avgTicket > 0 ? ((p2.avgTicket - p1.avgTicket) / p1.avgTicket) * 100 : 0;

      return {
        name: getDisplayName(store.code),
        salesP1: p1.sales / 1000000,
        salesP2: p2.sales / 1000000,
        salesChange,
        transactionsP1: p1.transactions,
        transactionsP2: p2.transactions,
        transactionsChange,
        ticketP1: p1.avgTicket,
        ticketP2: p2.avgTicket,
        ticketChange
      };
    }).filter(s => s.salesP1 > 0 || s.salesP2 > 0);
  }, [period1Data, period2Data]);

  const zoneTotals = useMemo(() => {
    const p1Sales = period1Data.reduce((sum, s) => sum + s.sales, 0);
    const p2Sales = period2Data.reduce((sum, s) => sum + s.sales, 0);
    const p1Trans = period1Data.reduce((sum, s) => sum + s.transactions, 0);
    const p2Trans = period2Data.reduce((sum, s) => sum + s.transactions, 0);
    
    return {
      salesChange: p1Sales > 0 ? ((p2Sales - p1Sales) / p1Sales) * 100 : 0,
      transactionsChange: p1Trans > 0 ? ((p2Trans - p1Trans) / p1Trans) * 100 : 0,
      ticketChange: p1Trans > 0 && p2Trans > 0 ? (((p2Sales/p2Trans) - (p1Sales/p1Trans)) / (p1Sales/p1Trans)) * 100 : 0,
      p1Sales,
      p2Sales,
      p1Trans,
      p2Trans
    };
  }, [period1Data, period2Data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Venta') ? formatShort(entry.value) : entry.value.toFixed(0)}
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
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/20 max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-4xl font-black text-white mb-2">Análisis Comparable</h2>
              <p className="text-slate-400">Compara el rendimiento entre dos periodos</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Filtros de Fecha */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-bold text-purple-300">Periodo 1</p>
              </div>
              <DateFilter dateRange={period1} onDateChange={setPeriod1} />
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-bold text-cyan-300">Periodo 2</p>
              </div>
              <DateFilter dateRange={period2} onDateChange={setPeriod2} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
          <div className="space-y-8">
            {/* KPIs de Cambio Global */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Cambio en Ventas</p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-black ${zoneTotals.salesChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {zoneTotals.salesChange >= 0 ? '+' : ''}{zoneTotals.salesChange.toFixed(1)}%
                  </p>
                  {zoneTotals.salesChange >= 0 ? 
                    <TrendingUp className="w-8 h-8 text-emerald-400" /> : 
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  }
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {formatCurrency(zoneTotals.p1Sales)} → {formatCurrency(zoneTotals.p2Sales)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Cambio en Transacciones</p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-black ${zoneTotals.transactionsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {zoneTotals.transactionsChange >= 0 ? '+' : ''}{zoneTotals.transactionsChange.toFixed(1)}%
                  </p>
                  {zoneTotals.transactionsChange >= 0 ? 
                    <TrendingUp className="w-8 h-8 text-emerald-400" /> : 
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  }
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {zoneTotals.p1Trans.toLocaleString()} → {zoneTotals.p2Trans.toLocaleString()}
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl p-6 border border-emerald-500/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Cambio en Ticket Promedio</p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-black ${zoneTotals.ticketChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {zoneTotals.ticketChange >= 0 ? '+' : ''}{zoneTotals.ticketChange.toFixed(1)}%
                  </p>
                  {zoneTotals.ticketChange >= 0 ? 
                    <TrendingUp className="w-8 h-8 text-emerald-400" /> : 
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  }
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {formatCurrency(zoneTotals.p1Sales/zoneTotals.p1Trans)} → {formatCurrency(zoneTotals.p2Sales/zoneTotals.p2Trans)}
                </p>
              </div>
            </div>

            {/* Gráfica de Ventas Comparadas */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">💰 Comparación de Ventas por Tienda</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Bar dataKey="salesP1" fill="#9333ea" radius={[4, 4, 0, 0]} name="Venta P1 (M)" />
                  <Bar dataKey="salesP2" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Venta P2 (M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Transacciones */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">🛒 Comparación de Transacciones</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="transactionsP1" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} name="Trans. P1" />
                  <Line type="monotone" dataKey="transactionsP2" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} name="Trans. P2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla Comparativa */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">📋 Detalle Comparativo</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Tienda</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase">Δ Ventas</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase">Δ Trans.</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase">Δ Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData
                      .sort((a, b) => b.salesChange - a.salesChange)
                      .map((store, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-white">{store.name}</p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-bold ${store.salesChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {store.salesChange >= 0 ? '+' : ''}{store.salesChange.toFixed(1)}%
                              </span>
                              {store.salesChange >= 0 ? 
                                <TrendingUp className="w-4 h-4 text-emerald-400" /> : 
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              }
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`font-bold ${store.transactionsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {store.transactionsChange >= 0 ? '+' : ''}{store.transactionsChange.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`font-bold ${store.ticketChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {store.ticketChange >= 0 ? '+' : ''}{store.ticketChange.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}