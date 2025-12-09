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
  { value: 'morning', label: 'Mañana', icon: Sun, color: 'text-yellow-500' },
  { value: 'afternoon', label: 'Tarde', icon: Sunset, color: 'text-orange-500' },
  { value: 'night', label: 'Noche', icon: Moon, color: 'text-indigo-500' },
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

      const record = await base44.entities.ShiftRecord.create({
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
      queryClient.invalidateQueries({ queryKey: ['shiftRecords'] });
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
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
                  fill="url(#pinkIceCream)"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                />
                <motion.circle cx="32" cy="20" r="5" fill="white" opacity="0.5" />
                <motion.polygon 
                  points="20,45 40,110 60,45" 
                  fill="url(#coneGrad)"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  style={{ transformOrigin: 'center top' }}
                />
                <defs>
                  <linearGradient id="pinkIceCream">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="coneGrad">
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-pink-100/50"
      >
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cajero y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-violet-100/60 via-purple-50/40 to-violet-50/30 rounded-3xl p-6 shadow-md border border-violet-200/40"
              >
                <Label className="text-violet-700 flex items-center gap-2.5 mb-3 font-bold text-base">
                  <div className="w-10 h-10 bg-violet-200/60 rounded-2xl flex items-center justify-center">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  Cajero
                </Label>
                <Select 
                  value={formData.cashier_id} 
                  onValueChange={(val) => setFormData({...formData, cashier_id: val})}
                >
                  <SelectTrigger className="border-violet-300/50 focus:border-violet-500 text-base font-semibold bg-white/80 h-12 rounded-2xl shadow-sm">
                    <SelectValue placeholder="Selecciona cajero" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-amber-100/60 via-yellow-50/40 to-amber-50/30 rounded-3xl p-6 shadow-md border border-amber-200/40"
              >
                <Label className="text-amber-700 flex items-center gap-2.5 mb-3 font-bold text-base">
                  <div className="w-10 h-10 bg-amber-200/60 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  Fecha
                </Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="border-amber-300/50 focus:border-amber-500 text-base font-semibold bg-white/80 h-12 rounded-2xl shadow-sm"
                />
              </motion.div>
            </div>

            {/* Selector de Turno */}
            <div className="bg-gradient-to-br from-purple-100/50 via-pink-50/30 to-purple-50/40 rounded-3xl p-6 shadow-md border border-purple-200/40">
              <Label className="text-purple-700 font-bold text-base mb-4 block flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-200/60 rounded-2xl flex items-center justify-center">
                  <Sun className="w-5 h-5 text-purple-600" />
                </div>
                Turno
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {SHIFTS.map(shift => {
                  const Icon = shift.icon;
                  const isSelected = formData.shift === shift.value;
                  return (
                    <motion.button
                      key={shift.value}
                      type="button"
                      onClick={() => setFormData({...formData, shift: shift.value})}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 shadow-md ${
                        isSelected 
                          ? 'border-purple-400 bg-white shadow-lg' 
                          : 'border-gray-200/60 hover:border-purple-300 bg-white/60'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isSelected ? shift.color : 'text-gray-400'}`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-purple-700' : 'text-gray-500'}`}>
                        {shift.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Métricas de Venta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div 
                whileHover={{ scale: 1.03, y: -3 }} 
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-emerald-100/60 via-green-50/40 to-emerald-50/30 rounded-3xl p-6 shadow-md border border-emerald-200/40"
              >
                <Label className="flex items-center gap-2.5 mb-3 font-bold text-base text-emerald-700">
                  <div className="w-10 h-10 bg-emerald-200/60 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  Ventas
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales}
                  onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  className="border-emerald-300/50 focus:border-emerald-500 text-xl font-bold bg-white/80 h-14 rounded-2xl shadow-sm placeholder:text-gray-300"
                />
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03, y: -3 }} 
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-sky-50/30 rounded-3xl p-6 shadow-md border border-sky-200/40"
              >
                <Label className="flex items-center gap-2.5 mb-3 font-bold text-base text-sky-700">
                  <div className="w-10 h-10 bg-sky-200/60 rounded-2xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-sky-600" />
                  </div>
                  Tickets
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.tickets}
                  onChange={(e) => setFormData({...formData, tickets: e.target.value})}
                  className="border-sky-300/50 focus:border-sky-500 text-xl font-bold bg-white/80 h-14 rounded-2xl shadow-sm placeholder:text-gray-300"
                />
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03, y: -3 }} 
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-violet-100/60 via-purple-50/40 to-violet-50/30 rounded-3xl p-6 shadow-md border border-violet-200/40"
              >
                <Label className="flex items-center gap-2.5 mb-3 font-bold text-base text-violet-700">
                  <div className="w-10 h-10 bg-violet-200/60 rounded-2xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-violet-600" />
                  </div>
                  Transacciones
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.transactions}
                  onChange={(e) => setFormData({...formData, transactions: e.target.value})}
                  className="border-violet-300/50 focus:border-violet-500 text-xl font-bold bg-white/80 h-14 rounded-2xl shadow-sm placeholder:text-gray-300"
                />
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03, y: -3 }} 
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-gradient-to-br from-pink-100/60 via-rose-50/40 to-pink-50/30 rounded-3xl p-6 shadow-md border border-pink-200/40"
              >
                <Label className="flex items-center gap-2.5 mb-3 font-bold text-base text-pink-700">
                  <div className="w-10 h-10 bg-pink-200/60 rounded-2xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-pink-600" />
                  </div>
                  Sugeridos
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.suggested_sales}
                  onChange={(e) => setFormData({...formData, suggested_sales: e.target.value})}
                  className="border-pink-300/50 focus:border-pink-500 text-xl font-bold bg-white/80 h-14 rounded-2xl shadow-sm placeholder:text-gray-300"
                />
              </motion.div>
            </div>

            {/* Botón Guardar */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:via-rose-600 hover:to-pink-600 text-white shadow-xl py-7 text-lg font-bold rounded-2xl transition-all duration-300"
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
                    Guardar Venta
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
          </div>
          </motion.div>
    </>
  );
}