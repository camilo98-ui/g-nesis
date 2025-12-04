import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, TrendingUp, TrendingDown, Calendar, Plus, Save, Trash2,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, subWeeks, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart, Line, Area, AreaChart, Cell
} from 'recharts';

// Crear entidad si no existe
const COMPARABLE_ENTITY = 'ComparableSales';

export default function CompraValeModal({ isOpen, onClose, storeId, currentSales, dateRange }) {
  const [activeTab, setActiveTab] = useState('weekly');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newData, setNewData] = useState({
    period_type: 'weekly',
    period_label: '',
    total_sales: '',
    total_tickets: '',
    total_transactions: '',
    total_suggested: ''
  });
  
  const queryClient = useQueryClient();

  // Fetch comparable data
  const { data: comparableData = [] } = useQuery({
    queryKey: ['comparableSales', storeId],
    queryFn: async () => {
      try {
        return await base44.entities.ComparableSales.filter({ store_id: storeId });
      } catch (e) {
        return [];
      }
    },
    enabled: !!storeId && isOpen
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ComparableSales.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparableSales', storeId] });
      setShowAddForm(false);
      setNewData({
        period_type: activeTab,
        period_label: '',
        total_sales: '',
        total_tickets: '',
        total_transactions: '',
        total_suggested: ''
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ComparableSales.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparableSales', storeId] });
    }
  });

  // Filter data by period type
  const filteredData = useMemo(() => {
    return comparableData.filter(d => d.period_type === activeTab);
  }, [comparableData, activeTab]);

  // Calculate comparison with current
  const comparison = useMemo(() => {
    if (!filteredData.length || !currentSales) return null;
    
    // Get the most recent comparable period
    const sortedData = [...filteredData].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
    const lastPeriod = sortedData[0];
    
    if (!lastPeriod) return null;

    const salesDiff = currentSales.sales - (lastPeriod.total_sales || 0);
    const salesPct = lastPeriod.total_sales > 0 
      ? ((salesDiff / lastPeriod.total_sales) * 100) 
      : 0;
    
    const ticketDiff = currentSales.tickets - (lastPeriod.total_tickets || 0);
    const ticketPct = lastPeriod.total_tickets > 0 
      ? ((ticketDiff / lastPeriod.total_tickets) * 100) 
      : 0;

    const transDiff = currentSales.transactions - (lastPeriod.total_transactions || 0);
    const transPct = lastPeriod.total_transactions > 0 
      ? ((transDiff / lastPeriod.total_transactions) * 100) 
      : 0;

    const suggestedDiff = currentSales.suggested - (lastPeriod.total_suggested || 0);
    const suggestedPct = lastPeriod.total_suggested > 0 
      ? ((suggestedDiff / lastPeriod.total_suggested) * 100) 
      : 0;

    return {
      lastPeriod,
      sales: { diff: salesDiff, pct: salesPct },
      tickets: { diff: ticketDiff, pct: ticketPct },
      transactions: { diff: transDiff, pct: transPct },
      suggested: { diff: suggestedDiff, pct: suggestedPct }
    };
  }, [filteredData, currentSales]);

  // Chart data for comparison
  const chartData = useMemo(() => {
    if (!comparison) return [];
    
    return [
      {
        name: 'Ventas',
        anterior: comparison.lastPeriod.total_sales || 0,
        actual: currentSales?.sales || 0,
        fill: comparison.sales.pct >= 0 ? '#10b981' : '#ef4444'
      },
      {
        name: 'Tickets',
        anterior: comparison.lastPeriod.total_tickets || 0,
        actual: currentSales?.tickets || 0,
        fill: comparison.tickets.pct >= 0 ? '#10b981' : '#ef4444'
      },
      {
        name: 'Trans.',
        anterior: comparison.lastPeriod.total_transactions || 0,
        actual: currentSales?.transactions || 0,
        fill: comparison.transactions.pct >= 0 ? '#10b981' : '#ef4444'
      },
      {
        name: 'Sugeridos',
        anterior: comparison.lastPeriod.total_suggested || 0,
        actual: currentSales?.suggested || 0,
        fill: comparison.suggested.pct >= 0 ? '#10b981' : '#ef4444'
      }
    ];
  }, [comparison, currentSales]);

  // Progress chart - How much we've advanced
  const progressData = useMemo(() => {
    if (!comparison) return [];
    
    const getProgress = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.min(200, (current / previous) * 100);
    };

    return [
      { 
        name: 'Ventas', 
        progress: getProgress(currentSales?.sales || 0, comparison.lastPeriod.total_sales || 1),
        fill: comparison.sales.pct >= 0 ? '#10b981' : '#ef4444'
      },
      { 
        name: 'Tickets', 
        progress: getProgress(currentSales?.tickets || 0, comparison.lastPeriod.total_tickets || 1),
        fill: comparison.tickets.pct >= 0 ? '#10b981' : '#ef4444'
      },
      { 
        name: 'Trans.', 
        progress: getProgress(currentSales?.transactions || 0, comparison.lastPeriod.total_transactions || 1),
        fill: comparison.transactions.pct >= 0 ? '#10b981' : '#ef4444'
      },
      { 
        name: 'Sugeridos', 
        progress: getProgress(currentSales?.suggested || 0, comparison.lastPeriod.total_suggested || 1),
        fill: comparison.suggested.pct >= 0 ? '#10b981' : '#ef4444'
      }
    ];
  }, [comparison, currentSales]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

  const handleSave = () => {
    if (!newData.period_label || !newData.total_sales) return;
    
    saveMutation.mutate({
      store_id: storeId,
      period_type: activeTab,
      period_label: newData.period_label,
      total_sales: parseFloat(newData.total_sales) || 0,
      total_tickets: parseInt(newData.total_tickets) || 0,
      total_transactions: parseInt(newData.total_transactions) || 0,
      total_suggested: parseInt(newData.total_suggested) || 0
    });
  };

  const getPeriodSuggestions = () => {
    const now = new Date();
    if (activeTab === 'weekly') {
      return [
        `Semana ${format(subWeeks(now, 1), 'w')} - ${format(subWeeks(now, 1), 'yyyy')}`,
        `Semana ${format(subWeeks(now, 2), 'w')} - ${format(subWeeks(now, 2), 'yyyy')}`,
        `Semana ${format(subWeeks(now, 52), 'w')} - ${format(subWeeks(now, 52), 'yyyy')} (Año ant.)`
      ];
    } else if (activeTab === 'monthly') {
      return [
        format(subMonths(now, 1), 'MMMM yyyy', { locale: es }),
        format(subMonths(now, 2), 'MMMM yyyy', { locale: es }),
        format(subMonths(now, 12), 'MMMM yyyy', { locale: es }) + ' (Año ant.)'
      ];
    } else {
      return [
        format(subYears(now, 1), 'yyyy'),
        format(subYears(now, 2), 'yyyy')
      ];
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <BarChart3 className="w-6 h-6" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Compra Vale</h2>
                <p className="text-white/80 text-sm">Venta Comparable - Actual vs Períodos Anteriores</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Period Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Mensual
              </TabsTrigger>
              <TabsTrigger value="yearly" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Anual
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Comparison Summary */}
          {comparison ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className={`p-4 rounded-xl ${comparison.sales.pct >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Ventas</span>
                    {comparison.sales.pct >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${comparison.sales.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparison.sales.pct >= 0 ? '+' : ''}{comparison.sales.pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(comparison.sales.diff)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className={`p-4 rounded-xl ${comparison.tickets.pct >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tickets</span>
                    {comparison.tickets.pct >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${comparison.tickets.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparison.tickets.pct >= 0 ? '+' : ''}{comparison.tickets.pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comparison.tickets.diff >= 0 ? '+' : ''}{comparison.tickets.diff.toLocaleString()}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className={`p-4 rounded-xl ${comparison.transactions.pct >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Transacciones</span>
                    {comparison.transactions.pct >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${comparison.transactions.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparison.transactions.pct >= 0 ? '+' : ''}{comparison.transactions.pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comparison.transactions.diff >= 0 ? '+' : ''}{comparison.transactions.diff.toLocaleString()}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className={`p-4 rounded-xl ${comparison.suggested.pct >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sugeridos</span>
                    {comparison.suggested.pct >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${comparison.suggested.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparison.suggested.pct >= 0 ? '+' : ''}{comparison.suggested.pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comparison.suggested.diff >= 0 ? '+' : ''}{comparison.suggested.diff.toLocaleString()}
                  </p>
                </motion.div>
              </div>

              {/* Comparison Bar Chart */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Comparativa: {comparison.lastPeriod.period_label} vs Actual
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} 
                        tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : v} 
                      />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} width={80} />
                      <Tooltip 
                        formatter={(v, name) => [
                          name === 'Ventas' || name === 'anterior' || name === 'actual' 
                            ? formatCurrency(v) 
                            : v.toLocaleString(), 
                          name === 'anterior' ? 'Período Anterior' : 'Actual'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="anterior" fill="#94a3b8" name="Anterior" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="actual" fill="#8b5cf6" name="Actual" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Chart - How much we've advanced */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-500" />
                  ¿Cuánto Hemos Avanzado? (vs {comparison.lastPeriod.period_label})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {progressData.map((item, idx) => (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center"
                    >
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                          <motion.circle 
                            cx="40" cy="40" r="34" 
                            stroke={item.fill} 
                            strokeWidth="6" 
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.min(item.progress, 100) / 100 * 213.6} 213.6`}
                            initial={{ strokeDasharray: "0 213.6" }}
                            animate={{ strokeDasharray: `${Math.min(item.progress, 100) / 100 * 213.6} 213.6` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold" style={{ color: item.fill }}>
                            {item.progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.progress >= 100 ? '✅ Superado' : `Falta ${(100 - item.progress).toFixed(0)}%`}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Period Data Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">Períodos Registrados</h4>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Período
                  </Button>
                </div>
                
                {/* Add Form */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-violet-50 border-b"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Período</label>
                          <Select value={newData.period_label} onValueChange={(v) => setNewData({...newData, period_label: v})}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getPeriodSuggestions().map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Ventas</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newData.total_sales}
                            onChange={(e) => setNewData({...newData, total_sales: e.target.value})}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Tickets</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newData.total_tickets}
                            onChange={(e) => setNewData({...newData, total_tickets: e.target.value})}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Trans.</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newData.total_transactions}
                            onChange={(e) => setNewData({...newData, total_transactions: e.target.value})}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Sugeridos</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newData.total_suggested}
                            onChange={(e) => setNewData({...newData, total_suggested: e.target.value})}
                            className="bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={saveMutation.isPending || !newData.period_label || !newData.total_sales}
                          className="bg-violet-500 hover:bg-violet-600"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-600">Período</th>
                        <th className="text-right p-3 font-medium text-gray-600">Ventas</th>
                        <th className="text-right p-3 font-medium text-gray-600">Tickets</th>
                        <th className="text-right p-3 font-medium text-gray-600">Trans.</th>
                        <th className="text-right p-3 font-medium text-gray-600">Sugeridos</th>
                        <th className="text-center p-3 font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{item.period_label}</td>
                          <td className="p-3 text-right">{formatCurrency(item.total_sales)}</td>
                          <td className="p-3 text-right">{item.total_tickets?.toLocaleString()}</td>
                          <td className="p-3 text-right">{item.total_transactions?.toLocaleString()}</td>
                          <td className="p-3 text-right">{item.total_suggested?.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">
                            No hay datos registrados para este período
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                📊
              </motion.div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Sin datos comparables</h3>
              <p className="text-gray-500 mb-4">Agrega un período anterior para comenzar a comparar</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-violet-500 hover:bg-violet-600">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Primer Período
              </Button>
              
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-violet-50 rounded-xl text-left max-w-lg mx-auto"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 mb-1 block">Período</label>
                      <Select value={newData.period_label} onValueChange={(v) => setNewData({...newData, period_label: v})}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Seleccionar período..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getPeriodSuggestions().map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Ventas</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newData.total_sales}
                        onChange={(e) => setNewData({...newData, total_sales: e.target.value})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Tickets</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newData.total_tickets}
                        onChange={(e) => setNewData({...newData, total_tickets: e.target.value})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Trans.</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newData.total_transactions}
                        onChange={(e) => setNewData({...newData, total_transactions: e.target.value})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Sugeridos</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newData.total_suggested}
                        onChange={(e) => setNewData({...newData, total_suggested: e.target.value})}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={saveMutation.isPending || !newData.period_label || !newData.total_sales}
                      className="bg-violet-500 hover:bg-violet-600"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            💡 Compara tus ventas actuales con períodos anteriores para identificar tendencias y oportunidades
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}