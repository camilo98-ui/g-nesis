import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, DollarSign, Receipt, Zap, Gift, Loader2, CheckCircle, Sun, Sunset, Moon, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const SHIFTS = [
  { value: 'morning', label: 'Apertura', icon: Sun, color: 'text-yellow-500' },
  { value: 'afternoon', label: 'Intermedio', icon: Sunset, color: 'text-orange-500' },
  { value: 'night', label: 'Cierre', icon: Moon, color: 'text-indigo-500' },
];

export default function ShiftRecordForm({ storeId, onSuccess }) {
    const queryClient = useQueryClient();
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
      cashier_id: '',
      date: new Date().toISOString().split('T')[0],
      shift: 'morning',
      sales: '',
      tickets: '',
      transactions: '',
      suggested_sales: ''
    });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cashier = cashiers.find(c => c.id === data.cashier_id);

      const salesValue = parseFloat(data.sales) || 0;
      const ticketsValue = parseInt(data.tickets) || 0;
      const transactionsValue = parseInt(data.transactions) || 0;
      const suggestedValue = parseInt(data.suggested_sales) || 0;

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
        record = await base44.entities.ShiftRecord.update(existingRecords[0].id, {
          sales: salesValue,
          tickets: ticketsValue,
          transactions: transactionsValue,
          suggested_sales: suggestedValue,
          average_ticket: ticketsValue > 0 ? salesValue / ticketsValue : 0
        });
      } else {
        // Crear nuevo registro
        record = await base44.entities.ShiftRecord.create({
          store_id: storeId,
          cashier_id: data.cashier_id,
          cashier_name: cashier?.name || '',
          date: data.date,
          shift: data.shift,
          sales: salesValue,
          tickets: ticketsValue,
          transactions: transactionsValue,
          suggested_sales: suggestedValue,
          average_ticket: ticketsValue > 0 ? salesValue / ticketsValue : 0
        });
      }

      const allDayRecords = await base44.entities.ShiftRecord.filter({ 
        store_id: storeId, 
        date: data.date 
      });

      const dailyTotals = allDayRecords.reduce((acc, r) => ({
        sales: acc.sales + (r.sales || 0),
        tickets: acc.tickets + (r.tickets || 0),
        transactions: acc.transactions + (r.transactions || 0),
        suggested: acc.suggested + (r.suggested_sales || 0)
      }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });

      const existingDailySales = await base44.entities.DailySales.filter({ 
        store_id: storeId, 
        date: data.date 
      });

      if (existingDailySales.length > 0) {
        await base44.entities.DailySales.update(existingDailySales[0].id, {
          total_sales: dailyTotals.sales,
          total_tickets: dailyTotals.tickets,
          total_transactions: dailyTotals.transactions,
          total_suggested: dailyTotals.suggested
        });
      } else {
        await base44.entities.DailySales.create({
          store_id: storeId,
          date: data.date,
          total_sales: dailyTotals.sales,
          total_tickets: dailyTotals.tickets,
          total_transactions: dailyTotals.transactions,
          total_suggested: dailyTotals.suggested
        });
      }

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
    onSuccess: () => {
      // Forzar refresco inmediato de todos los datos
      queryClient.refetchQueries({ queryKey: ['shiftRecords'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['dailySales'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['cashiers'], type: 'active' });
      queryClient.invalidateQueries({ queryKey: ['salesLogs'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      toast.success('¡Turno registrado correctamente!');

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          ...formData,
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

  return (
    <>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cajero y Fecha */}
          <div className="grid grid-cols-2 gap-5">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[20px] p-5 shadow-md border border-violet-100 hover:shadow-lg transition-all"
            >
              <Label className="text-violet-700 flex items-center gap-3 mb-3 text-base font-bold">
                <div className="w-10 h-10 bg-violet-200/60 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-violet-600" />
                </div>
                Cajero
              </Label>
              <Select 
                value={formData.cashier_id} 
                onValueChange={(val) => setFormData({...formData, cashier_id: val})}
              >
                <SelectTrigger className="border-2 border-violet-200 focus:border-violet-400 bg-white rounded-xl h-12 text-base font-semibold focus:ring-2 focus:ring-violet-200 transition-all">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {cashiers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

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
          </div>

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

            {/* Tickets */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-[20px] p-5 shadow-md border border-sky-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-sky-700">
                <div className="w-10 h-10 bg-sky-200/60 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-sky-600" />
                </div>
                Tickets
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.tickets}
                onChange={(e) => setFormData({...formData, tickets: e.target.value})}
                className="border-2 border-sky-200 focus:border-sky-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-sky-200 transition-all"
              />
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

          {/* Botón Guardar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 hover:from-violet-600 hover:via-purple-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl py-7 text-lg font-bold rounded-[20px] transition-all"
            >
              {createMutation.isPending ? (
                <span className="flex items-center justify-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-6 h-6" />
                  </motion.div>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Save className="w-6 h-6" />
                  Guardar Turno
                </span>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </>
  );
}