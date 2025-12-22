import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, TrendingUp, TrendingDown, BarChart3, Calendar, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const PERIOD_OPTIONS = [
  { value: 'last7days', label: 'Últimos 7 días', days: 7 },
  { value: 'last14days', label: 'Últimos 14 días', days: 14 },
  { value: 'last30days', label: 'Últimos 30 días', days: 30 },
  { value: 'thisWeek', label: 'Esta semana', custom: 'thisWeek' },
  { value: 'lastWeek', label: 'Semana pasada', custom: 'lastWeek' },
  { value: 'thisMonth', label: 'Este mes', custom: 'thisMonth' },
  { value: 'lastMonth', label: 'Mes pasado', custom: 'lastMonth' }
];

const STORES = [
  { code: "BTA 11", name: "PALATINO" },
  { code: "BTA 37", name: "HOMECENTER 170" },
  { code: "BTA 62", name: "FONTANAR" },
  { code: "BTA 49", name: "HOMECENTER CEDRITOS" },
  { code: "BTA 42", name: "BULEVAR NIZA" },
  { code: "BTA 85", name: "MANSIÓN CAJICÁ" },
  { code: "BTA 52", name: "CENTRO SUBA" },
  { code: "BTA 21", name: "CENTRO CHÍA" },
  { code: "BTA 78", name: "PLAZA IMPERIAL 2" },
  { code: "BTA 18", name: "PLAZA IMPERIAL" },
  { code: "TUNJA 1", name: "UNICENTRO TUNJA" },
  { code: "BTA 90", name: "PORTAL 80" },
  { code: "BTA 59", name: "JUMBO 170" },
  { code: "BTA 14", name: "PORTAL 80 #2" },
  { code: "BTA 28", name: "DIVERPLAZA" },
  { code: "BTA 89", name: "DIVERPLAZA 2" },
  { code: "BTA 16", name: "SAN RAFAEL" },
  { code: "BTA 13", name: "PORTAL 80 #1" },
  { code: "TUNJA 2", name: "VIVA TUNJA" }
];

export default function ComparableAnalysisModal({ onClose }) {
  const [period1, setPeriod1] = useState('last7days');
  const [period2, setPeriod2] = useState('last14days');
  const [selectedStore, setSelectedStore] = useState('all');
  const [chartView, setChartView] = useState('ventas');

  // Calcular fechas según los periodos
  const getDateRange = (periodValue) => {
    const today = new Date();
    const option = PERIOD_OPTIONS.find(p => p.value === periodValue);
    
    if (option.custom === 'thisWeek') {
      return { start: startOfWeek(today, { locale: es }), end: endOfWeek(today, { locale: es }) };
    } else if (option.custom === 'lastWeek') {
      const lastWeek = subWeeks(today, 1);
      return { start: startOfWeek(lastWeek, { locale: es }), end: endOfWeek(lastWeek, { locale: es }) };
    } else if (option.custom === 'thisMonth') {
      return { start: startOfMonth(today), end: endOfMonth(today) };
    } else if (option.custom === 'lastMonth') {
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else {
      return { start: subDays(today, option.days), end: today };
    }
  };

  const range1 = getDateRange(period1);
  const range2 = getDateRange(period2);

  // Fetch datos de ventas
  const { data: allSales = [] } = useQuery({
    queryKey: ['comparableSales'],
    queryFn: () => base44.entities.DailySales.list()
  });

  // Filtrar y agregar datos por periodo
  const periodData = useMemo(() => {
    const filterByDateRange = (sales, start, end) => {
      return sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end && (selectedStore === 'all' || s.store_id === selectedStore);
      });
    };

    const period1Sales = filterByDateRange(allSales, range1.start, range1.end);
    const period2Sales = filterByDateRange(allSales, range2.start, range2.end);

    const aggregate = (sales) => ({
      total_sales: sales.reduce((sum, s) => sum + (s.total_sales || 0), 0),
      total_tickets: sales.reduce((sum, s) => sum + (s.total_tickets || 0), 0),
      total_transactions: sales.reduce((sum, s) => sum + (s.total_transactions || 0), 0),
      avg_ticket: sales.length > 0 
        ? sales.reduce((sum, s) => sum + (s.total_sales || 0), 0) / sales.reduce((sum, s) => sum + (s.total_transactions || 1), 0)
        : 0
    });

    const p1 = aggregate(period1Sales);
    const p2 = aggregate(period2Sales);

    return {
      period1: p1,
      period2: p2,
      comparison: {
        sales_diff: p1.total_sales - p2.total_sales,
        sales_percent: p2.total_sales > 0 ? ((p1.total_sales - p2.total_sales) / p2.total_sales) * 100 : 0,
        tickets_diff: p1.total_tickets - p2.total_tickets,
        transactions_diff: p1.total_transactions - p2.total_transactions,
        avg_ticket_diff: p1.avg_ticket - p2.avg_ticket
      }
    };
  }, [allSales, period1, period2, selectedStore, range1, range2]);

  // Datos para gráficas
  const chartData = [
    {
      name: PERIOD_OPTIONS.find(p => p.value === period1)?.label || 'Periodo 1',
      ventas: periodData.period1.total_sales,
      tickets: periodData.period1.total_tickets,
      transacciones: periodData.period1.total_transactions,
      ticketPromedio: periodData.period1.avg_ticket
    },
    {
      name: PERIOD_OPTIONS.find(p => p.value === period2)?.label || 'Periodo 2',
      ventas: periodData.period2.total_sales,
      tickets: periodData.period2.total_tickets,
      transacciones: periodData.period2.total_transactions,
      ticketPromedio: periodData.period2.avg_ticket
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-50 to-slate-100 z-[100] overflow-y-auto"
    >
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white transition-colors border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Análisis Comparable</h1>
                <p className="text-sm text-gray-500">Comparación de rendimiento entre periodos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Periodo 1 (Actual)
              </label>
              <Select value={period1} onValueChange={setPeriod1}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Periodo 2 (Comparación)
              </label>
              <Select value={period2} onValueChange={setPeriod2}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Tienda
              </label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tiendas (Zona)</SelectItem>
                  {STORES.map(store => (
                    <SelectItem key={store.code} value={store.code}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPIs Comparativos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Ventas</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(periodData.period1.total_sales)}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${periodData.comparison.sales_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {periodData.comparison.sales_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{periodData.comparison.sales_percent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">Tickets</p>
              <p className="text-2xl font-bold text-blue-700">{periodData.period1.total_tickets.toLocaleString()}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${periodData.comparison.tickets_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {periodData.comparison.tickets_diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{Math.abs(periodData.comparison.tickets_diff).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
              <p className="text-xs text-violet-600 font-semibold mb-1">Transacciones</p>
              <p className="text-2xl font-bold text-violet-700">{periodData.period1.total_transactions.toLocaleString()}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${periodData.comparison.transactions_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {periodData.comparison.transactions_diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{Math.abs(periodData.comparison.transactions_diff).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold mb-1">Ticket Promedio</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(periodData.period1.avg_ticket)}</p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${periodData.comparison.avg_ticket_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {periodData.comparison.avg_ticket_diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{formatCurrency(Math.abs(periodData.comparison.avg_ticket_diff))}</span>
              </div>
            </div>
          </div>

        {/* Tabs de Vista */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'ventas', label: 'Ventas', icon: DollarSign, color: 'blue' },
            { id: 'ticket', label: 'Ticket Promedio', icon: Receipt, color: 'amber' },
            { id: 'transacciones', label: 'Transacciones', icon: Zap, color: 'purple' },
            { id: 'comparacion', label: 'Comparación General', icon: TrendingUp, color: 'emerald' }
          ].map((view) => {
            const Icon = view.icon;
            const isActive = chartView === view.id;
            return (
              <motion.button
                key={view.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setChartView(view.id)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap shadow-md ${
                  isActive
                    ? `bg-gradient-to-br from-${view.color}-500 to-${view.color}-600 text-white shadow-${view.color}-500/50`
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </motion.button>
            );
          })}
        </div>

        {/* Gráficas Dinámicas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={chartView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Gráfica Principal */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <ResponsiveContainer width="100%" height={450}>
                {chartView === 'ventas' && (
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="ventas" fill="url(#salesGrad1)" radius={[8, 8, 0, 0]} name="Periodo Actual" />
                  </BarChart>
                )}

                {chartView === 'ticket' && (
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb' }}
                    />
                    <Bar dataKey="ticketPromedio" fill="url(#ticketGrad)" radius={[8, 8, 0, 0]} name="Ticket Promedio" />
                  </BarChart>
                )}

                {chartView === 'transacciones' && (
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 13 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb' }} />
                    <Bar dataKey="transacciones" fill="url(#transGrad)" radius={[8, 8, 0, 0]} name="Transacciones" />
                  </BarChart>
                )}

                {chartView === 'comparacion' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} name="Ventas" dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="ticketPromedio" stroke="#f59e0b" strokeWidth={3} name="Ticket" dot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Tabla de Tiendas */}
            {selectedStore === 'all' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Detalle por Tienda</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tienda</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Ventas</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Ticket Prom.</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Transacciones</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Crecimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STORES.map((store) => {
                        const p1Sales = allSales.filter(s => 
                          s.store_id === store.code && 
                          new Date(s.date) >= range1.start && 
                          new Date(s.date) <= range1.end
                        ).reduce((sum, s) => sum + (s.total_sales || 0), 0);
                        
                        const p1Trans = allSales.filter(s => 
                          s.store_id === store.code && 
                          new Date(s.date) >= range1.start && 
                          new Date(s.date) <= range1.end
                        ).reduce((sum, s) => sum + (s.total_transactions || 0), 0);
                        
                        const p2Sales = allSales.filter(s => 
                          s.store_id === store.code && 
                          new Date(s.date) >= range2.start && 
                          new Date(s.date) <= range2.end
                        ).reduce((sum, s) => sum + (s.total_sales || 0), 0);

                        const avgTicket = p1Trans > 0 ? p1Sales / p1Trans : 0;
                        const growth = p2Sales > 0 ? ((p1Sales - p2Sales) / p2Sales) * 100 : 0;

                        return (
                          <tr key={store.code} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-900">{store.name}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(p1Sales)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(avgTicket)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{p1Trans.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                growth >= 0 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}