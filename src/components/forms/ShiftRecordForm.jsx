import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-violet-50/80 to-purple-50/60 rounded-xl p-4 shadow-sm border border-violet-200/50">
                <Label className="text-violet-700 flex items-center gap-2 mb-2 font-black">
                  <User className="w-5 h-5" />
                  👤 Cajero
                </Label>
                <Select 
                  value={formData.cashier_id} 
                  onValueChange={(val) => setFormData({...formData, cashier_id: val})}
                >
                  <SelectTrigger className="border-2 border-violet-400 focus:border-violet-600 text-lg font-bold bg-white">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-amber-50/80 to-yellow-50/60 rounded-xl p-4 shadow-sm border border-amber-200/50">
                <Label className="text-amber-700 flex items-center gap-2 mb-2 font-black">
                  <Calendar className="w-5 h-5" />
                  📅 Fecha
                </Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="border-2 border-amber-400 focus:border-amber-600 text-lg font-bold bg-white"
                />
              </motion.div>
            </div>

            <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/60 rounded-xl p-4 shadow-sm border border-purple-200/50">
              <Label className="text-purple-700 font-black mb-2 block">🌅 Turno</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHIFTS.map(shift => {
                  const Icon = shift.icon;
                  const isSelected = formData.shift === shift.value;
                  return (
                    <motion.button
                      key={shift.value}
                      type="button"
                      onClick={() => setFormData({...formData, shift: shift.value})}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 shadow-md ${
                        isSelected 
                          ? 'border-purple-400 bg-purple-100' 
                          : 'border-gray-200 hover:border-purple-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? shift.color : 'text-gray-400'}`} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-purple-600' : 'text-gray-600'}`}>
                        {shift.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="bg-gradient-to-br from-emerald-50/80 to-green-50/60 rounded-xl p-4 shadow-sm border border-emerald-200/50">
                <Label className="flex items-center gap-2 mb-2 font-black text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                  💰 Ventas
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales}
                  onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  className="border-2 border-emerald-400 focus:border-emerald-600 text-lg font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="bg-gradient-to-br from-sky-50/80 to-blue-50/60 rounded-xl p-4 shadow-sm border border-sky-200/50">
                <Label className="flex items-center gap-2 mb-2 font-black text-sky-700">
                  <Receipt className="w-5 h-5" />
                  🎫 Tickets
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.tickets}
                  onChange={(e) => setFormData({...formData, tickets: e.target.value})}
                  className="border-2 border-sky-400 focus:border-sky-600 text-lg font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="bg-gradient-to-br from-violet-50/80 to-purple-50/60 rounded-xl p-4 shadow-sm border border-violet-200/50">
                <Label className="flex items-center gap-2 mb-2 font-black text-violet-700">
                  <Zap className="w-5 h-5" />
                  ⚡ Transacciones
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.transactions}
                  onChange={(e) => setFormData({...formData, transactions: e.target.value})}
                  className="border-2 border-violet-400 focus:border-violet-600 text-lg font-bold bg-white"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="bg-gradient-to-br from-pink-50/80 to-rose-50/60 rounded-xl p-4 shadow-sm border border-pink-200/50">
                <Label className="flex items-center gap-2 mb-2 font-black text-pink-700">
                  <Gift className="w-5 h-5" />
                  🎁 Sugeridos
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.suggested_sales}
                  onChange={(e) => setFormData({...formData, suggested_sales: e.target.value})}
                  className="border-2 border-pink-400 focus:border-pink-600 text-lg font-bold bg-white"
                />
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg py-5 text-base font-bold rounded-xl"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    Guardar
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