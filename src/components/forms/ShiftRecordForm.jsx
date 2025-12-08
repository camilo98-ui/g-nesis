import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User, DollarSign, Receipt, Zap, Gift, Loader2, CheckCircle, Sun, Sunset, Moon } from 'lucide-react';
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 rounded-3xl shadow-2xl border-2 border-violet-200/50 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-4 text-center relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ['100%', '-200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative z-10 flex items-center justify-center gap-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              👤
            </motion.div>
            <h3 className="text-xl font-black text-white">Turno de Cajero</h3>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}>
              ⏰
            </motion.div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-4 shadow-lg border-2 border-violet-200">
                <Label className="text-violet-700 flex items-center gap-2 mb-2 font-bold">
                  <User className="w-5 h-5" />
                  👤 Cajero
                </Label>
                <Select 
                  value={formData.cashier_id} 
                  onValueChange={(val) => setFormData({...formData, cashier_id: val})}
                >
                  <SelectTrigger className="border-2 border-violet-300 text-lg font-semibold">
                    <SelectValue placeholder="Selecciona cajero" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-4 shadow-lg border-2 border-fuchsia-200">
                <Label className="text-fuchsia-700 flex items-center gap-2 mb-2 font-bold">
                  📅 Fecha
                </Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="border-2 border-fuchsia-300 text-lg font-semibold"
                />
              </motion.div>

              <div className="md:col-span-2 bg-white rounded-2xl p-4 shadow-lg border-2 border-pink-200">
                <Label className="text-pink-700 font-bold mb-3 block">⏰ Turno</Label>
                <div className="grid grid-cols-3 gap-3">
                  {SHIFTS.map(shift => {
                    const Icon = shift.icon;
                    const isSelected = formData.shift === shift.value;
                    return (
                      <motion.button
                        key={shift.value}
                        type="button"
                        onClick={() => setFormData({...formData, shift: shift.value})}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected 
                            ? 'border-pink-500 bg-gradient-to-br from-pink-100 to-rose-100 shadow-lg' 
                            : 'border-gray-200 hover:border-pink-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? shift.color : 'text-gray-400'}`} />
                        <span className={`font-bold ${isSelected ? 'text-pink-600' : 'text-gray-600'}`}>
                          {shift.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 rounded-full" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl p-3 shadow-lg border-2 border-emerald-300">
                <Label className="flex items-center gap-1 mb-2 font-black text-emerald-700 text-xs">
                  <DollarSign className="w-4 h-4" />
                  💰
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales}
                  onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  className="border-2 border-emerald-400 font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-sky-100 to-blue-200 rounded-2xl p-3 shadow-lg border-2 border-sky-300">
                <Label className="flex items-center gap-1 mb-2 font-black text-sky-700 text-xs">
                  <Receipt className="w-4 h-4" />
                  🎫
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.tickets}
                  onChange={(e) => setFormData({...formData, tickets: e.target.value})}
                  className="border-2 border-sky-400 font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-violet-100 to-purple-200 rounded-2xl p-3 shadow-lg border-2 border-violet-300">
                <Label className="flex items-center gap-1 mb-2 font-black text-violet-700 text-xs">
                  <Zap className="w-4 h-4" />
                  ⚡
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.transactions}
                  onChange={(e) => setFormData({...formData, transactions: e.target.value})}
                  className="border-2 border-violet-400 font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl p-3 shadow-lg border-2 border-pink-300">
                <Label className="flex items-center gap-1 mb-2 font-black text-pink-700 text-xs">
                  <Gift className="w-4 h-4" />
                  🎁
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.suggested_sales}
                  onChange={(e) => setFormData({...formData, suggested_sales: e.target.value})}
                  className="border-2 border-pink-400 font-bold bg-white"
                />
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-2xl py-6 text-lg font-black rounded-2xl relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['100%', '-200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                {createMutation.isPending ? (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                    Guardando...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    ¡Guardar Turno!
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