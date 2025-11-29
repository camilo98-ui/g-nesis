import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User, DollarSign, Receipt, Zap, Gift, Loader2, CheckCircle, Sun, Sunset, Moon, UserPlus } from 'lucide-react';
import CashierForm from './CashierForm';
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

  const { data: cashiers = [], isLoading: loadingCashiers } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftRecord.create({
      ...data,
      store_id: storeId,
      sales: parseFloat(data.sales) || 0,
      tickets: parseInt(data.tickets) || 0,
      transactions: parseInt(data.transactions) || 0,
      suggested_sales: parseInt(data.suggested_sales) || 0,
      average_ticket: data.tickets > 0 ? (parseFloat(data.sales) || 0) / parseInt(data.tickets) : 0
    }),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      queryClient.invalidateQueries(['shiftRecords']);
      queryClient.invalidateQueries(['dailySales']);
      setFormData({
        ...formData,
        sales: '',
        tickets: '',
        transactions: '',
        suggested_sales: ''
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Error al guardar el registro');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cashier_id) {
      toast.error('Selecciona un cajero');
      return;
    }
    createMutation.mutate(formData);
  };

  const selectedShift = SHIFTS.find(s => s.value === formData.shift);
  const ShiftIcon = selectedShift?.icon || Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-6xl mb-3"
              >
                🍦
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 justify-center"
              >
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-lg font-bold text-gray-800">¡Guardado!</span>
              </motion.div>
            </motion.div>
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
              {/* Cajero */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-500" />
                  Cajero
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.cashier_id} 
                    onValueChange={(val) => setFormData({...formData, cashier_id: val})}
                  >
                    <SelectTrigger className="border-pink-200 focus:ring-pink-500 flex-1">
                      <SelectValue placeholder="Selecciona cajero" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashiers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CashierForm storeId={storeId} />
                </div>
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label className="text-gray-600">Fecha</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="border-pink-200 focus:ring-pink-500"
                />
              </div>

              {/* Turno */}
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
                          isSelected 
                            ? 'border-pink-500 bg-pink-50 text-pink-600' 
                            : 'border-gray-200 hover:border-pink-300 text-gray-600'
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

            <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent my-6" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Ventas */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Ventas ($)
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales}
                  onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  className="border-pink-200 focus:ring-pink-500"
                />
              </div>

              {/* Tickets */}
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
                  className="border-pink-200 focus:ring-pink-500"
                />
              </div>

              {/* Transacciones */}
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
                  className="border-pink-200 focus:ring-pink-500"
                />
              </div>

              {/* Sugeridos */}
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
                  className="border-pink-200 focus:ring-pink-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Guardar Registro
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}