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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Análisis Comparable</h2>
                <p className="text-white/80 text-sm">Compara rendimiento entre periodos</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* KPIs Comparativos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

          {/* Gráficas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventas */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Comparación de Ventas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="ventas" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ticket Promedio</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="ticketPromedio" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transacciones */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Transacciones</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="transacciones" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Tickets Vendidos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}