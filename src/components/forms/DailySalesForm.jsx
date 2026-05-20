import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart2, ShoppingBag, DollarSign, Receipt, Zap, Gift,
  Info, Loader2, History, Edit2, Trash2, ArrowRight, X
} from 'lucide-react';

// Confetti Popsy
const PopsyConfetti = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999]">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-full"
        style={{
          left: `${50 + (Math.random() - 0.5) * 20}%`,
          top: '50%',
          background: ['#ec4899', '#f472b6', '#fbbf24', '#a855f7', '#f59e0b', '#fb923c'][i % 6],
        }}
        initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [1, 1, 0],
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 600,
          rotate: Math.random() * 720
        }}
        transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.02 }}
      />
    ))}
  </div>
);

export default function DailySalesForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('ventas');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_sales: '',
    total_tickets: '',
    total_transactions: '',
    total_suggested: '',
    total_takeaway: ''
  });

  const { data: salesHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['dailySalesHistory', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }, '-date', 30),
    enabled: !!storeId && showHistory,
    staleTime: 60000
  });

  const averageTicket = useMemo(() => {
    const sales = parseFloat(formData.total_sales) || 0;
    const transactions = parseInt(formData.total_transactions) || 0;
    if (transactions > 0 && sales > 0) return Math.round(sales / transactions);
    return null;
  }, [formData.total_sales, formData.total_transactions]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let existingRecord = data._editingRecord || null;
      if (!existingRecord) {
        const existing = await base44.entities.DailySales.filter({ store_id: storeId, date: data.date });
        if (existing.length > 0) existingRecord = existing[0];
      }

      let recordData;
      if (data.activeTab === 'llevar') {
        recordData = {
          store_id: storeId,
          date: data.date,
          total_sales: existingRecord?.total_sales ?? 0,
          total_tickets: existingRecord?.total_tickets ?? 0,
          total_transactions: existingRecord?.total_transactions ?? 0,
          total_suggested: existingRecord?.total_suggested ?? 0,
          total_takeaway: parseFloat(data.total_takeaway) || 0
        };
      } else {
        recordData = {
          store_id: storeId,
          date: data.date,
          total_sales: parseFloat(data.total_sales) || 0,
          total_tickets: parseInt(data.total_tickets) || 0,
          total_transactions: parseInt(data.total_transactions) || 0,
          total_suggested: parseInt(data.total_suggested) || 0,
          total_takeaway: existingRecord?.total_takeaway ?? 0
        };
      }

      let record, action = 'create';
      if (existingRecord) {
        record = await base44.entities.DailySales.update(existingRecord.id, recordData);
        action = 'update';
      } else {
        record = await base44.entities.DailySales.create(recordData);
      }

      try {
        const user = await base44.auth.me();
        await base44.entities.SalesLog.create({
          store_id: storeId,
          record_type: 'daily_sales',
          record_id: record.id,
          action,
          user_email: user.email,
          sales_amount: recordData.total_sales,
          action_date: data.date,
          details: JSON.stringify({ total_transactions: recordData.total_transactions })
        });
      } catch (logError) {
        console.warn('No se pudo crear el log:', logError);
      }

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
      queryClient.invalidateQueries({ queryKey: ['dailySalesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allDailySales'] });
      queryClient.invalidateQueries({ queryKey: ['genesis_sales'] });
      queryClient.invalidateQueries({ queryKey: ['salesLogs'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['gerenteHomeSales'] });
      queryClient.invalidateQueries({ queryKey: ['home-today-sales'] });

      toast.success('¡Venta guardada correctamente!');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEditingRecord(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          total_sales: '',
          total_tickets: '',
          total_transactions: '',
          total_suggested: '',
          total_takeaway: ''
        });
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailySales.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
      queryClient.invalidateQueries({ queryKey: ['dailySalesHistory'] });
      toast.success('Venta eliminada');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'ventas' && !formData.total_sales) {
      toast.error('Ingresa las ventas');
      return;
    }
    if (!storeId) {
      toast.error('No se ha seleccionado tienda');
      return;
    }
    createMutation.mutate({ ...formData, activeTab, _editingRecord: editingRecord });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      total_sales: record.total_sales?.toString() || '',
      total_tickets: record.total_tickets?.toString() || '',
      total_transactions: record.total_transactions?.toString() || '',
      total_suggested: record.total_suggested?.toString() || '',
      total_takeaway: record.total_takeaway?.toString() || ''
    });
    setShowHistory(false);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar este registro de ventas?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      total_sales: '',
      total_tickets: '',
      total_transactions: '',
      total_suggested: '',
      total_takeaway: ''
    });
  };

  return (
    <>
      <AnimatePresence>
        {showSuccess && <PopsyConfetti />}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-2xl overflow-hidden mb-3">
        {[
          { id: 'ventas', label: 'Ventas', Icon: BarChart2 },
          { id: 'llevar', label: 'Llevar', Icon: ShoppingBag }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#e11d48' : '#9ca3af',
              borderBottom: activeTab === tab.id ? '2px solid #e11d48' : '2px solid transparent'
            }}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Fecha */}
        <div className="border border-gray-200 rounded-2xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Fecha de la venta</p>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
          />
        </div>

        {/* Tab: Llevar */}
        {activeTab === 'llevar' && (
          <div className="border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Venta Producto para Llevar</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">Ingresa el total vendido en producto para llevar</p>
            <input
              type="number"
              placeholder="0"
              value={formData.total_takeaway}
              onChange={(e) => setFormData({ ...formData, total_takeaway: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
        )}

        {/* Tab: Ventas — grid 2 columnas */}
        {activeTab === 'ventas' && (
          <div className="grid grid-cols-2 gap-2">
            {/* Ventas */}
            <div className="border border-gray-200 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Ventas</p>
              </div>
              <p className="text-xs text-gray-400 mb-2">Ingresa el valor total de ventas</p>
              <input
                type="number"
                placeholder="0"
                value={formData.total_sales}
                onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">Valor total en pesos</p>
            </div>

            {/* Ticket Promedio */}
            <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Ticket Promedio</p>
                <Info className="w-3 h-3 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 mb-2">Calculado automáticamente</p>
              <input
                type="text"
                placeholder="Calculado automáticamente"
                value={averageTicket ? `$${averageTicket.toLocaleString('es-CO')}` : ''}
                readOnly
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 bg-white outline-none cursor-default"
              />
              <p className="text-[10px] text-gray-400 mt-1">Se calcula al guardar la venta</p>
            </div>

            {/* Transacciones */}
            <div className="border border-gray-200 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Transacciones</p>
              </div>
              <p className="text-xs text-gray-400 mb-2">Cantidad de transacciones</p>
              <input
                type="number"
                placeholder="0"
                value={formData.total_transactions}
                onChange={(e) => setFormData({ ...formData, total_transactions: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">Número total de transacciones</p>
            </div>

            {/* Sugeridos */}
            <div className="border border-gray-200 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-3.5 h-3.5 text-pink-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Sugeridos</p>
              </div>
              <p className="text-xs text-gray-400 mb-2">Productos sugeridos</p>
              <input
                type="number"
                placeholder="0"
                value={formData.total_suggested}
                onChange={(e) => setFormData({ ...formData, total_suggested: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">Número de productos sugeridos</p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => { resetForm(); if (onSuccess) onSuccess(); }}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #e11d48, #be185d)' }}
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <>{editingRecord ? 'Actualizar' : 'Guardar venta'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Botón historial */}
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? 'Ocultar historial' : 'Ver historial de ventas'}
        </button>
      </form>

      {/* Historial */}
      {showHistory && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {loadingHistory ? (
            <p className="text-gray-400 text-center py-4 text-sm">Cargando...</p>
          ) : salesHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No hay registros</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {salesHistory.map((record) => (
                <div key={record.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {format(new Date(record.date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                      <span>💰 ${record.total_sales?.toLocaleString('es-CO')}</span>
                      <span>🎫 {record.total_transactions}</span>
                      <span>✨ {record.total_suggested}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(record)}
                      className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}