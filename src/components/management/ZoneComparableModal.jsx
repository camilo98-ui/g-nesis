import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, TrendingUp, TrendingDown, Calendar, Plus, Save, Trash2,
  BarChart3, ArrowUpRight, ArrowDownRight, Store
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subWeeks, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart, Line, Cell
} from 'recharts';
import { STORES, getDisplayName } from '@/components/StoreSelector';

export default function ZoneComparableModal({ isOpen, onClose, currentZoneData, currentStoresData }) {
  const [activeTab, setActiveTab] = useState('zona');
  const [periodType, setPeriodType] = useState('weekly');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newData, setNewData] = useState({
    period_type: 'weekly',
    period_label: '',
    total_sales: '',
    store_id: ''
  });
  
  const queryClient = useQueryClient();

  // Fetch comparable data for zone
  const { data: zoneComparableData = [] } = useQuery({
    queryKey: ['zoneComparableSales'],
    queryFn: async () => {
      try {
        return await base44.entities.ComparableSales.filter({ store_id: 'ZONA_NOROCCIDENTE' });
      } catch (e) {
        return [];
      }
    },
    enabled: isOpen && activeTab === 'zona'
  });

  // Fetch comparable data for all stores
  const { data: allComparableData = [] } = useQuery({
    queryKey: ['allComparableSales'],
    queryFn: async () => {
      try {
        return await base44.entities.ComparableSales.list();
      } catch (e) {
        return [];
      }
    },
    enabled: isOpen && activeTab === 'tiendas'
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ComparableSales.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoneComparableSales'] });
      queryClient.invalidateQueries({ queryKey: ['allComparableSales'] });
      setShowAddForm(false);
      setNewData({
        period_type: periodType,
        period_label: '',
        total_sales: '',
        store_id: activeTab === 'zona' ? 'ZONA_NOROCCIDENTE' : ''
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ComparableSales.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoneComparableSales'] });
      queryClient.invalidateQueries({ queryKey: ['allComparableSales'] });
    }
  });

  // Filter by period type
  const filteredZoneData = useMemo(() => {
    return zoneComparableData.filter(d => d.period_type === periodType);
  }, [zoneComparableData, periodType]);

  // Calculate zone comparison
  const zoneComparison = useMemo(() => {
    if (!filteredZoneData.length || !currentZoneData) return null;
    
    const sortedData = [...filteredZoneData].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
    const lastPeriod = sortedData[0];
    
    if (!lastPeriod) return null;

    const salesDiff = currentZoneData.totalSales - (lastPeriod.total_sales || 0);
    const salesPct = lastPeriod.total_sales > 0 
      ? ((salesDiff / lastPeriod.total_sales) * 100) 
      : 0;

    return {
      lastPeriod,
      sales: { diff: salesDiff, pct: salesPct }
    };
  }, [filteredZoneData, currentZoneData]);

  // Calculate stores comparison
  const storesComparison = useMemo(() => {
    if (!currentStoresData || activeTab !== 'tiendas') return [];
    
    return currentStoresData.map(store => {
      const storeCompData = allComparableData.filter(d => 
        d.store_id === store.code && d.period_type === periodType
      );
      
      if (!storeCompData.length) return { ...store, comparison: null };
      
      const sorted = [...storeCompData].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      const lastPeriod = sorted[0];
      
      const salesDiff = store.totalSales - (lastPeriod.total_sales || 0);
      const salesPct = lastPeriod.total_sales > 0 
        ? ((salesDiff / lastPeriod.total_sales) * 100) 
        : 0;
      
      return {
        ...store,
        comparison: {
          lastPeriod,
          sales: { diff: salesDiff, pct: salesPct }
        }
      };
    }).filter(s => s.comparison);
  }, [currentStoresData, allComparableData, periodType, activeTab]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

  const handleSave = () => {
    if (!newData.period_label || !newData.total_sales) return;
    
    saveMutation.mutate({
      store_id: activeTab === 'zona' ? 'ZONA_NOROCCIDENTE' : newData.store_id,
      period_type: periodType,
      period_label: newData.period_label,
      total_sales: parseFloat(newData.total_sales) || 0,
      total_tickets: parseInt(newData.total_tickets) || 0,
      total_transactions: parseInt(newData.total_transactions) || 0,
      total_suggested: parseInt(newData.total_suggested) || 0
    });
  };

  const getPeriodSuggestions = () => {
    const now = new Date();
    if (periodType === 'weekly') {
      return [
        `Semana ${format(subWeeks(now, 1), 'w')} - ${format(subWeeks(now, 1), 'yyyy')}`,
        `Semana ${format(subWeeks(now, 2), 'w')} - ${format(subWeeks(now, 2), 'yyyy')}`,
        `Semana ${format(subWeeks(now, 52), 'w')} - ${format(subWeeks(now, 52), 'yyyy')} (Año ant.)`
      ];
    } else if (periodType === 'monthly') {
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
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-5 text-white">
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
                <h2 className="text-xl font-bold">Comparable Zona</h2>
                <p className="text-white/80 text-sm">Análisis vs Períodos Anteriores</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Tabs: Zona / Tiendas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="zona" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-1" />
                Zona Completa
              </TabsTrigger>
              <TabsTrigger value="tiendas" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                <Store className="w-4 h-4 mr-1" />
                Por Tiendas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Period Type Selector */}
          <div className="flex gap-2 mb-4 justify-center">
            {['weekly', 'monthly', 'yearly'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={periodType === type ? 'default' : 'outline'}
                onClick={() => setPeriodType(type)}
                className={periodType === type ? 'bg-pink-500 text-white' : ''}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {type === 'weekly' ? 'Semanal' : type === 'monthly' ? 'Mensual' : 'Anual'}
              </Button>
            ))}
          </div>

          {/* Zone View */}
          {activeTab === 'zona' && zoneComparison && (
            <div className="space-y-4">
              {/* Quick Stat */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl ${zoneComparison.sales.pct >= 0 ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-red-50 border-2 border-red-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Zona Noroccidente</p>
                    <p className={`text-4xl font-black ${zoneComparison.sales.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {zoneComparison.sales.pct >= 0 ? '+' : ''}{zoneComparison.sales.pct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">vs {zoneComparison.lastPeriod.period_label}</p>
                  </div>
                  {zoneComparison.sales.pct >= 0 ? (
                    <ArrowUpRight className="w-16 h-16 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-16 h-16 text-red-500" />
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Anterior:</span>
                    <span className="font-bold">{formatCurrency(zoneComparison.lastPeriod.total_sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-bold">{formatCurrency(currentZoneData?.totalSales || 0)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold mt-2 ${zoneComparison.sales.pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>Diferencia:</span>
                    <span>{zoneComparison.sales.pct >= 0 ? '+' : ''}{formatCurrency(zoneComparison.sales.diff)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Chart */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-700 mb-4">Comparativa Zona</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { 
                        name: 'Ventas', 
                        anterior: zoneComparison.lastPeriod.total_sales || 0,
                        actual: currentZoneData?.totalSales || 0
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v) => [formatCurrency(v), '']} />
                      <Legend />
                      <Bar dataKey="anterior" fill="#94a3b8" name="Anterior" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" fill={zoneComparison.sales.pct >= 0 ? '#10b981' : '#ef4444'} name="Actual" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Stores View */}
          {activeTab === 'tiendas' && (
            <div className="space-y-3">
              {storesComparison.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {storesComparison.map((store, idx) => (
                    <motion.div
                      key={store.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-xl border-2 ${
                        store.comparison.sales.pct >= 0 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{getDisplayName(store.code)}</p>
                          <p className="text-xs text-gray-500">{store.code}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          store.comparison.sales.pct >= 0 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {store.comparison.sales.pct >= 0 ? '+' : ''}{store.comparison.sales.pct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Anterior:</span>
                          <span className="font-medium">{formatCurrency(store.comparison.lastPeriod.total_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual:</span>
                          <span className="font-medium">{formatCurrency(store.totalSales)}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${
                          store.comparison.sales.pct >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <span>Diferencia:</span>
                          <span>{formatCurrency(store.comparison.sales.diff)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos comparables para las tiendas</p>
                </div>
              )}
            </div>
          )}

          {/* Add Data Section */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
              <h4 className="font-semibold text-gray-700 text-sm">Períodos Registrados</h4>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar
              </Button>
            </div>
            
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-violet-50 border-b"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {activeTab === 'tiendas' && (
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Tienda</label>
                        <Select value={newData.store_id} onValueChange={(v) => setNewData({...newData, store_id: v})}>
                          <SelectTrigger className="bg-white h-9 text-xs">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STORES.map(s => (
                              <SelectItem key={s.code} value={s.code} className="text-xs">{getDisplayName(s.code)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className={activeTab === 'zona' ? 'col-span-2' : ''}>
                      <label className="text-xs text-gray-600 mb-1 block">Período</label>
                      <Select value={newData.period_label} onValueChange={(v) => setNewData({...newData, period_label: v})}>
                        <SelectTrigger className="bg-white h-9 text-xs">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getPeriodSuggestions().map(p => (
                            <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
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
                        className="bg-white h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-xs h-8">
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={saveMutation.isPending || !newData.period_label || !newData.total_sales || (activeTab === 'tiendas' && !newData.store_id)}
                      className="bg-pink-500 hover:bg-pink-600 text-xs h-8"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {activeTab === 'tiendas' && <th className="text-left p-2 font-medium text-gray-600">Tienda</th>}
                    <th className="text-left p-2 font-medium text-gray-600">Período</th>
                    <th className="text-right p-2 font-medium text-gray-600">Ventas</th>
                    <th className="text-center p-2 font-medium text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'zona' ? filteredZoneData : allComparableData.filter(d => d.period_type === periodType && d.store_id !== 'ZONA_NOROCCIDENTE')).map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      {activeTab === 'tiendas' && <td className="p-2 font-medium">{getDisplayName(item.store_id)}</td>}
                      <td className="p-2 font-medium">{item.period_label}</td>
                      <td className="p-2 text-right">{formatCurrency(item.total_sales)}</td>
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            💡 Monitorea el crecimiento de la zona vs períodos anteriores
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}