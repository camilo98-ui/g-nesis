import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, DollarSign, Receipt, Zap, Gift, Loader2, CheckCircle, Sun, Sunset, Moon, Calendar, Plus, Upload, X, Pencil, Trash2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

const SHIFTS = [
  { value: 'morning', label: 'Apertura', icon: Sun, color: 'text-yellow-500' },
  { value: 'afternoon', label: 'Intermedio', icon: Sunset, color: 'text-orange-500' },
  { value: 'night', label: 'Cierre', icon: Moon, color: 'text-indigo-500' },
];

export default function ShiftRecordForm({ storeId, onSuccess }) {
    const queryClient = useQueryClient();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showAddCashier, setShowAddCashier] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingCashier, setEditingCashier] = useState(null);
    const [newCashier, setNewCashier] = useState({ name: '', email: '', phone: '', photo_url: '' });
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [formData, setFormData] = useState({
      cashier_id: '',
      date: new Date().toISOString().split('T')[0],
      shift: 'morning',
      sales: '',
      tickets: '',
      transactions: '',
      suggested_sales: ''
    });
    const [editingRecord, setEditingRecord] = useState(null);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Buscar registro existente cuando cambian cajero, fecha o turno
  const { data: existingRecords = [] } = useQuery({
    queryKey: ['shiftRecord', storeId, formData.cashier_id, formData.date, formData.shift],
    queryFn: () => base44.entities.ShiftRecord.filter({ 
      store_id: storeId,
      cashier_id: formData.cashier_id,
      date: formData.date,
      shift: formData.shift
    }),
    enabled: !!storeId && !!formData.cashier_id && !!formData.date,
    staleTime: 0
  });

  // Historial de turnos del cajero seleccionado
  const { data: shiftHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['shiftHistory', storeId, formData.cashier_id],
    queryFn: () => base44.entities.ShiftRecord.filter({ 
      store_id: storeId,
      cashier_id: formData.cashier_id
    }, '-date', 30),
    enabled: !!storeId && !!formData.cashier_id && showHistory,
    staleTime: 60000
  });

  // Cargar datos existentes en el formulario
  React.useEffect(() => {
    if (existingRecords.length > 0) {
      const record = existingRecords[0];
      setEditingRecord(record);
      setFormData(prev => ({
        ...prev,
        sales: record.sales?.toString() || '',
        tickets: record.tickets?.toString() || '',
        transactions: record.transactions?.toString() || '',
        suggested_sales: record.suggested_sales?.toString() || ''
      }));
    } else {
      setEditingRecord(null);
    }
  }, [existingRecords, formData.cashier_id, formData.date, formData.shift]);

  const createCashierMutation = useMutation({
    mutationFn: async (cashierData) => {
      if (editingCashier) {
        return await base44.entities.Cashier.update(editingCashier.id, cashierData);
      }
      return await base44.entities.Cashier.create({
        ...cashierData,
        store_id: storeId,
        is_active: true,
        hire_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: (savedCashier) => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast.success(editingCashier ? '✅ Cajero actualizado' : '✅ Cajero agregado correctamente');
      if (!editingCashier) {
        setFormData({ ...formData, cashier_id: savedCashier.id });
      }
      setShowAddCashier(false);
      setEditingCashier(null);
      setNewCashier({ name: '', email: '', phone: '', photo_url: '' });
    },
    onError: (error) => {
      toast.error('Error al guardar cajero: ' + error.message);
    }
  });

  const deleteCashierMutation = useMutation({
    mutationFn: async (cashierId) => {
      await base44.entities.Cashier.update(cashierId, { is_active: false });
      return cashierId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast.success('✅ Cajero eliminado');
      setShowAddCashier(false);
      setEditingCashier(null);
      setNewCashier({ name: '', email: '', phone: '', photo_url: '' });
    },
    onError: (error) => {
      toast.error('Error al eliminar cajero: ' + error.message);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewCashier({ ...newCashier, photo_url: file_url });
      toast.success('✅ Foto cargada');
    } catch (error) {
      toast.error('Error al cargar foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (recordId) => {
      await base44.entities.ShiftRecord.delete(recordId);
      return recordId;
    },
    onSuccess: () => {
      queryClient.removeQueries();
      queryClient.clear();
      queryClient.refetchQueries({ queryKey: ['shiftRecords'] });
      queryClient.refetchQueries({ queryKey: ['shiftHistory'] });
      toast.success('✅ Turno eliminado');
      if (editingRecord) {
        setEditingRecord(null);
        setFormData({
          cashier_id: '',
          date: new Date().toISOString().split('T')[0],
          shift: 'morning',
          sales: '',
          tickets: '',
          transactions: '',
          suggested_sales: ''
        });
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cashier = cashiers.find(c => c.id === data.cashier_id);

      const salesValue = parseFloat(data.sales) || 0;
      const ticketsValue = parseInt(data.tickets) || 0;
      const transactionsValue = parseInt(data.transactions) || 0;
      const suggestedValue = parseInt(data.suggested_sales) || 0;
      
      // Calcular ticket promedio correctamente: ventas / transacciones
      const avgTicket = transactionsValue > 0 ? salesValue / transactionsValue : 0;

      // Datos del registro
      const recordData = {
        sales: salesValue,
        tickets: ticketsValue,
        transactions: transactionsValue,
        suggested_sales: suggestedValue,
        average_ticket: avgTicket
      };

      // Verificar si ya existe un registro para este cajero, fecha y turno
      const existingRecords = await base44.entities.ShiftRecord.filter({ 
        store_id: storeId, 
        cashier_id: data.cashier_id,
        date: data.date,
        shift: data.shift
      });

      let record;
      if (existingRecords.length > 0) {
        // Actualizar el registro existente
        record = await base44.entities.ShiftRecord.update(existingRecords[0].id, recordData);
        console.log('✅ ShiftRecord actualizado:', record.id, recordData);
      } else {
        // Crear nuevo registro
        record = await base44.entities.ShiftRecord.create({
          store_id: storeId,
          cashier_id: data.cashier_id,
          cashier_name: cashier?.name || '',
          date: data.date,
          shift: data.shift,
          ...recordData
        });
        console.log('✅ ShiftRecord creado:', record.id, recordData);
      }

      // NO actualizar DailySales automáticamente desde ShiftRecord
      // DailySales solo se actualiza manualmente desde DailySalesForm

      // Crear log sin bloquear el guardado
      try {
        const user = await base44.auth.me();
        await base44.entities.SalesLog.create({
          store_id: storeId,
          record_type: 'shift_record',
          record_id: record.id,
          action: 'create',
          user_email: user.email,
          cashier_name: cashier?.name,
          sales_amount: salesValue,
          action_date: data.date,
          details: JSON.stringify({ shift: data.shift })
        });
      } catch (logError) {
        console.warn('No se pudo crear el log:', logError);
      }

      return record;
    },
    onSuccess: (savedRecord) => {
      console.log('✅ Registro guardado exitosamente:', savedRecord);
      
      // SOLUCIÓN DEFINITIVA: Eliminar TODO el caché y forzar recarga
      queryClient.removeQueries(); // Elimina TODAS las queries
      queryClient.clear(); // Limpia completamente el caché
      
      // Refetch inmediato de las queries críticas
      queryClient.refetchQueries({ queryKey: ['shiftRecords'] });
      queryClient.refetchQueries({ queryKey: ['shiftHistory'] });
      queryClient.refetchQueries({ queryKey: ['cashiers'] });
      queryClient.refetchQueries({ queryKey: ['dailySales'] });

      toast.success(editingRecord ? '✅ Turno actualizado' : '✅ Turno registrado');

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEditingRecord(null);
        setFormData({
          cashier_id: '',
          date: new Date().toISOString().split('T')[0],
          shift: 'morning',
          sales: '',
          tickets: '',
          transactions: '',
          suggested_sales: ''
        });
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.cashier_id) {
      toast.error('Selecciona un cajero');
      return;
    }

    if (!formData.sales && !formData.transactions) {
      toast.error('Ingresa al menos las ventas');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEditShift = (shift) => {
    setEditingRecord(shift);
    setFormData({
      cashier_id: shift.cashier_id,
      date: shift.date,
      shift: shift.shift,
      sales: shift.sales.toString(),
      tickets: shift.tickets.toString(),
      transactions: shift.transactions.toString(),
      suggested_sales: shift.suggested_sales.toString()
    });
    setShowHistory(false);
  };

  const handleDeleteShift = (shiftId) => {
    if (confirm('¿Eliminar este registro de turno?')) {
      deleteMutation.mutate(shiftId);
    }
  };

  return (
    <>
      {/* Dialog para añadir/editar cajero */}
      <Dialog open={showAddCashier} onOpenChange={(open) => {
        setShowAddCashier(open);
        if (!open) {
          setEditingCashier(null);
          setNewCashier({ name: '', email: '', phone: '', photo_url: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700">
              <User className="w-5 h-5" />
              {editingCashier ? 'Editar Cajero' : 'Añadir Nuevo Cajero'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              {newCashier.photo_url ? (
                <div className="relative">
                  <img 
                    src={newCashier.photo_url} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-violet-200"
                  />
                  <button
                    type="button"
                    onClick={() => setNewCashier({ ...newCashier, photo_url: '' })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 bg-violet-50 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-violet-300 hover:border-violet-500 transition-all">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-violet-500" />
                      <span className="text-[10px] text-violet-600 mt-1">Subir foto</span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Nombre */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre Completo *</Label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={newCashier.name}
                onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email</Label>
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={newCashier.email}
                onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Teléfono</Label>
              <Input
                placeholder="3001234567"
                value={newCashier.phone}
                onChange={(e) => setNewCashier({ ...newCashier, phone: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddCashier(false);
                  setEditingCashier(null);
                  setNewCashier({ name: '', email: '', phone: '', photo_url: '' });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              {editingCashier && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('¿Seguro que deseas eliminar este cajero?')) {
                      deleteCashierMutation.mutate(editingCashier.id);
                    }
                  }}
                  disabled={deleteCashierMutation.isPending}
                  className="flex-1"
                >
                  {deleteCashierMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => {
                  if (!newCashier.name.trim()) {
                    toast.error('Ingresa el nombre del cajero');
                    return;
                  }
                  createCashierMutation.mutate(newCashier);
                }}
                disabled={createCashierMutation.isPending}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                {createCashierMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingCashier ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCashier ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-[9999]"
          >
            <div className="text-center">
              <motion.svg viewBox="0 0 80 120" className="w-24 h-32 mx-auto">
                <motion.circle 
                  cx="40" cy="28" r="22" 
                  fill="url(#shiftRecordPinkIceCream)"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                />
                <motion.circle cx="32" cy="20" r="5" fill="white" opacity="0.5" />
                <motion.polygon 
                  points="20,45 40,110 60,45" 
                  fill="url(#shiftRecordConeGrad)"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  style={{ transformOrigin: 'center top' }}
                />
                <defs>
                  <linearGradient id="shiftRecordPinkIceCream">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="shiftRecordConeGrad">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </motion.svg>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 justify-center mt-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-lg font-bold text-gray-800">¡Guardado!</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        {editingRecord && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3 border-b border-amber-200 flex items-center gap-2">
            <span className="text-amber-700 font-bold text-sm">✏️ Editando registro existente</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selector de Cajero con botón Añadir */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[20px] p-5 shadow-md border border-violet-100"
          >
            <Label className="text-violet-700 flex items-center gap-3 mb-4 text-base font-bold">
              <div className="w-10 h-10 bg-violet-200/60 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-violet-600" />
              </div>
              Identificación de Cajero
            </Label>

            <div className="flex gap-2">
              <Select 
                value={formData.cashier_id} 
                onValueChange={(val) => setFormData({...formData, cashier_id: val})}
              >
                <SelectTrigger className="border-2 border-violet-200 focus:border-violet-400 bg-white rounded-xl h-12 text-base font-semibold focus:ring-2 focus:ring-violet-200 transition-all">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {cashiers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        {c.photo_url && (
                          <img src={c.photo_url} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                onClick={() => {
                  const selectedCashier = cashiers.find(c => c.id === formData.cashier_id);
                  if (selectedCashier) {
                    setEditingCashier(selectedCashier);
                    setNewCashier({
                      name: selectedCashier.name || '',
                      email: selectedCashier.email || '',
                      phone: selectedCashier.phone || '',
                      photo_url: selectedCashier.photo_url || ''
                    });
                  }
                  setShowAddCashier(true);
                }}
                disabled={!formData.cashier_id}
                className="bg-amber-600 hover:bg-amber-700 text-white h-12 w-12 rounded-xl flex items-center justify-center shadow-md disabled:opacity-50"
                title="Editar cajero seleccionado"
              >
                <Pencil className="w-5 h-5" />
              </Button>
              
              <Button
                type="button"
                onClick={() => {
                  setEditingCashier(null);
                  setNewCashier({ name: '', email: '', phone: '', photo_url: '' });
                  setShowAddCashier(true);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white h-12 w-12 rounded-xl flex items-center justify-center shadow-md"
                title="Añadir nuevo cajero"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Fecha */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[20px] p-5 shadow-md border border-amber-100 hover:shadow-lg transition-all"
          >
            <Label className="text-amber-700 flex items-center gap-3 mb-3 text-base font-bold">
              <div className="w-10 h-10 bg-amber-200/60 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              Fecha
            </Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="border-2 border-amber-200 focus:border-amber-400 bg-white rounded-xl text-base font-semibold h-12 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </motion.div>

          {/* Turno */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[20px] p-5 shadow-md border border-purple-100"
          >
            <Label className="text-purple-700 font-bold mb-4 block text-base">Turno</Label>
            <div className="grid grid-cols-3 gap-3">
              {SHIFTS.map(shift => {
                const Icon = shift.icon;
                const isSelected = formData.shift === shift.value;
                return (
                  <motion.button
                    key={shift.value}
                    type="button"
                    onClick={() => setFormData({...formData, shift: shift.value})}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 shadow-sm ${
                      isSelected 
                        ? 'border-purple-400 bg-white shadow-md' 
                        : 'border-gray-200 hover:border-purple-300 bg-white/50'
                    }`}
                  >
                    <Icon className={`w-7 h-7 ${isSelected ? shift.color : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                      {shift.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-2 gap-5">
            {/* Ventas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-[20px] p-5 shadow-md border border-emerald-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-emerald-700">
                <div className="w-10 h-10 bg-emerald-200/60 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                Ventas
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.sales}
                onChange={(e) => setFormData({...formData, sales: e.target.value})}
                className="border-2 border-emerald-200 focus:border-emerald-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </motion.div>

            {/* Ticket Promedio - Calculado automáticamente */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-[20px] p-5 shadow-md border border-sky-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-sky-700">
                <div className="w-10 h-10 bg-sky-200/60 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-sky-600" />
                </div>
                Ticket Promedio
              </Label>
              <div className="border-2 border-sky-200 bg-sky-50/50 rounded-xl text-lg font-bold h-12 flex items-center px-3 text-sky-700">
                {(() => {
                  const sales = parseFloat(formData.sales) || 0;
                  const transactions = parseInt(formData.transactions) || 0;
                  const avgTicket = transactions > 0 ? sales / transactions : 0;
                  return `$${avgTicket.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                })()}
              </div>
              <p className="text-xs text-sky-600 mt-2">Calculado: Ventas ÷ Transacciones</p>
            </motion.div>

            {/* Transacciones */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[20px] p-5 shadow-md border border-violet-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-violet-700">
                <div className="w-10 h-10 bg-violet-200/60 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-violet-600" />
                </div>
                Transacciones
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.transactions}
                onChange={(e) => setFormData({...formData, transactions: e.target.value})}
                className="border-2 border-violet-200 focus:border-violet-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-violet-200 transition-all"
              />
            </motion.div>

            {/* Sugeridos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[20px] p-5 shadow-md border border-pink-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-pink-700">
                <div className="w-10 h-10 bg-pink-200/60 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
                Sugeridos
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.suggested_sales}
                onChange={(e) => setFormData({...formData, suggested_sales: e.target.value})}
                className="border-2 border-pink-200 focus:border-pink-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </motion.div>
          </div>

          {/* Botones Guardar, Eliminar e Historial */}
          <div className="flex gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex gap-3 flex-1"
            >
              {editingRecord && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Seguro que deseas eliminar este turno?')) {
                        deleteMutation.mutate(editingRecord.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl py-7 text-lg font-bold rounded-[20px] transition-all"
                  >
                    {deleteMutation.isPending ? (
                      <span className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Eliminando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        🗑️ Eliminar
                      </span>
                    )}
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={editingRecord ? 'flex-1' : 'w-full'}
              >
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className={`w-full ${editingRecord ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600' : 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 hover:from-violet-600 hover:via-purple-600 hover:to-violet-600'} text-white shadow-lg hover:shadow-xl py-7 text-lg font-bold rounded-[20px] transition-all`}
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className="w-6 h-6" />
                      </motion.div>
                      {editingRecord ? 'Actualizando...' : 'Guardando...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <Save className="w-6 h-6" />
                      {editingRecord ? 'Actualizar' : 'Guardar'}
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Historial clicked, current state:', showHistory);
                  setShowHistory(!showHistory);
                }}
                disabled={!formData.cashier_id}
                className={`${showHistory ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'} text-white shadow-lg hover:shadow-xl py-7 px-6 text-lg font-bold rounded-[20px] transition-all disabled:opacity-30`}
              >
                <History className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>

          {editingRecord && (
            <Button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setFormData({
                  cashier_id: '',
                  date: new Date().toISOString().split('T')[0],
                  shift: 'morning',
                  sales: '',
                  tickets: '',
                  transactions: '',
                  suggested_sales: ''
                });
              }}
              variant="outline"
              className="w-full"
            >
              Cancelar edición
            </Button>
          )}
        </form>

        {/* Historial de Turnos - MEJORADO */}
        <AnimatePresence>
          {showHistory && formData.cashier_id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Historial de Turnos
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-gray-500">Cargando historial...</p>
                  </div>
                ) : shiftHistory.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">No hay registros previos</p>
                    <p className="text-xs text-gray-400 mt-1">Los turnos guardados aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {shiftHistory.map((shift) => {
                      const ShiftIcon = SHIFTS.find(s => s.value === shift.shift)?.icon || Sun;
                      const shiftLabel = SHIFTS.find(s => s.value === shift.shift)?.label || shift.shift;
                      const shiftColor = SHIFTS.find(s => s.value === shift.shift)?.color || 'text-gray-500';
                      
                      return (
                        <motion.div
                          key={shift.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white rounded-xl p-4 shadow-md border border-blue-100 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-800 text-base">{shift.date}</p>
                              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 ${shiftColor} border border-gray-200`}>
                                <ShiftIcon className="w-4 h-4" />
                                <span className="text-xs font-bold">{shiftLabel}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                              <p className="text-xs text-emerald-600 font-semibold mb-1">Ventas</p>
                              <p className="text-lg font-bold text-emerald-700">${shift.sales?.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="bg-sky-50 rounded-lg p-2 border border-sky-200">
                              <p className="text-xs text-sky-600 font-semibold mb-1">Ticket Prom.</p>
                              <p className="text-lg font-bold text-sky-700">${shift.average_ticket?.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="bg-violet-50 rounded-lg p-2 border border-violet-200">
                              <p className="text-xs text-violet-600 font-semibold mb-1">Transacciones</p>
                              <p className="text-lg font-bold text-violet-700">{shift.transactions}</p>
                            </div>
                            <div className="bg-pink-50 rounded-lg p-2 border border-pink-200">
                              <p className="text-xs text-pink-600 font-semibold mb-1">Sugeridos</p>
                              <p className="text-lg font-bold text-pink-700">{shift.suggested_sales}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditShift(shift);
                              }}
                              className="flex-1 text-blue-600 hover:bg-blue-50 border-blue-200 font-semibold"
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteShift(shift.id);
                              }}
                              className="flex-1 text-red-600 hover:bg-red-50 border-red-200 font-semibold"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}