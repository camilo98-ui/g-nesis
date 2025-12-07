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
      const user = await base44.auth.me();
      const cashier = cashiers.find(c => c.id === data.cashier_id);
      
      const salesValue = parseFloat(data.sales) || 0;
      const ticketsValue = parseInt(data.tickets) || 0;
      const transactionsValue = parseInt(data.transactions) || 0;
      const suggestedValue = parseInt(data.suggested_sales) || 0;
      
      // 1. Crear ShiftRecord
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
      
      console.log('✅ ShiftRecord creado:', record);
      
      // 2. Recalcular DailySales
      const allDayRecords = await base44.entities.ShiftRecord.filter({ 
        store_id: storeId, 
        date: data.date 
      });
      
      console.log('📊 Registros del día:', allDayRecords.length);
      
      const dailyTotals = allDayRecords.reduce((acc, r) => ({
        sales: acc.sales + (r.sales || 0),
        tickets: acc.tickets + (r.tickets || 0),
        transactions: acc.transactions + (r.transactions || 0),
        suggested: acc.suggested + (r.suggested_sales || 0)
      }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
      
      console.log('📈 Totales calculados:', dailyTotals);
      
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
        console.log('✅ DailySales actualizado');
      } else {
        await base44.entities.DailySales.create({
          store_id: storeId,
          date: data.date,
          total_sales: dailyTotals.sales,
          total_tickets: dailyTotals.tickets,
          total_transactions: dailyTotals.transactions,
          total_suggested: dailyTotals.suggested
        });
        console.log('✅ DailySales creado');
      }
        
      // 3. Crear log
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
      
      console.log('✅ TODO GUARDADO CORRECTAMENTE');
      
      return record;
    },
    onSuccess: async () => {
      console.log('🎉 Guardado exitoso, invalidando queries...');
      
      toast.success('¡Turno registrado correctamente!');
      
      // Invalidar TODAS las queries y remover del caché
      await queryClient.invalidateQueries({ refetchType: 'all' });
      await queryClient.removeQueries({ queryKey: ['shiftRecords'] });
      await queryClient.removeQueries({ queryKey: ['dailySales'] });
      await queryClient.removeQueries({ queryKey: ['salesLogs'] });
      
      console.log('✅ Queries invalidadas y caché limpiado');
      
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
      console.error('❌ ERROR COMPLETO:', error);
      toast.error(`Error al guardar: ${error.message || 'Intenta de nuevo'}`);
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

      <Card className="bg-white/80 backdrop-blur-lg border-pink-100 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white">
              <Receipt className="w-5 h-5" />
            </div>
            Registrar Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-500" />
                  Cajero
                </Label>
                <Select 
                  value={formData.cashier_id} 
                  onValueChange={(val) => setFormData({...formData, cashier_id: val})}
                >
                  <SelectTrigger className="border-pink-200">
                    <SelectValue placeholder="Selecciona cajero" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600">Fecha</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="border-pink-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-600">Turno</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SHIFTS.map(shift => {
                    const Icon = shift.icon;
                    const isSelected = formData.shift === shift.value;
                    return (
                      <button
                        key={shift.value}
                        type="button"
                        onClick={() => setFormData({...formData, shift: shift.value})}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                          isSelected ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? shift.color : ''}`} />
                        <span className="font-medium">{shift.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Ventas
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales}
                  onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  className="border-pink-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  Tickets
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.tickets}
                  onChange={(e) => setFormData({...formData, tickets: e.target.value})}
                  className="border-pink-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Transacciones
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.transactions}
                  onChange={(e) => setFormData({...formData, transactions: e.target.value})}
                  className="border-pink-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-pink-500" />
                  Sugeridos
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.suggested_sales}
                  onChange={(e) => setFormData({...formData, suggested_sales: e.target.value})}
                  className="border-pink-200"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}