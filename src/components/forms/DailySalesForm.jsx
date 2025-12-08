import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, DollarSign, Receipt, Zap, Gift, Loader2, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DailySalesForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_sales: '',
    total_tickets: '',
    total_transactions: '',
    total_suggested: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const salesValue = parseFloat(data.total_sales) || 0;
      const ticketsValue = parseInt(data.total_tickets) || 0;
      const transactionsValue = parseInt(data.total_transactions) || 0;
      const suggestedValue = parseInt(data.total_suggested) || 0;
      
      const existing = await base44.entities.DailySales.filter({ 
        store_id: storeId, 
        date: data.date 
      });
      
      const recordData = {
        store_id: storeId,
        date: data.date,
        total_sales: salesValue,
        total_tickets: ticketsValue,
        total_transactions: transactionsValue,
        total_suggested: suggestedValue
      };
      
      let record;
      if (existing.length > 0) {
        record = await base44.entities.DailySales.update(existing[0].id, recordData);
      } else {
        record = await base44.entities.DailySales.create(recordData);
      }
      
      // Crear log sin requerir autenticación
      try {
        const user = await base44.auth.me();
        await base44.entities.SalesLog.create({
          store_id: storeId,
          record_type: 'daily_sales',
          record_id: record.id,
          action: existing.length > 0 ? 'update' : 'create',
          user_email: user.email,
          sales_amount: salesValue,
          action_date: data.date,
          details: JSON.stringify({ total_transactions: transactionsValue })
        });
      } catch (logError) {
        // Si falla el log, continuar de todas formas
        console.warn('No se pudo crear el log:', logError);
      }
      
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
      queryClient.invalidateQueries({ queryKey: ['salesLogs'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      toast.success('¡Ventas registradas correctamente!');
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          total_sales: '',
          total_tickets: '',
          total_transactions: '',
          total_suggested: ''
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
    
    if (!formData.total_sales) {
      toast.error('Ingresa las ventas');
      return;
    }
    
    if (!storeId) {
      toast.error('No se ha seleccionado tienda');
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
              <motion.svg viewBox="0 0 80 120" className="w-24 h-32">
                {/* Bola de helado de chocolate */}
                <motion.circle 
                  cx="40" cy="28" r="22" 
                  fill="url(#chocolateIce)"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                />
                {/* Textura chocolate - puntos más oscuros */}
                <motion.circle cx="33" cy="22" r="3" fill="#3d2817" opacity="0.4"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} />
                <motion.circle cx="45" cy="26" r="2.5" fill="#3d2817" opacity="0.4"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45 }} />
                <motion.circle cx="38" cy="32" r="2" fill="#3d2817" opacity="0.4"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
                <motion.circle cx="47" cy="35" r="2.5" fill="#3d2817" opacity="0.4"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55 }} />
                {/* Brillo sutil */}
                <motion.ellipse cx="35" cy="20" rx="8" ry="5" fill="white" opacity="0.15"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ delay: 0.6 }} />
                {/* Cono */}
                <motion.polygon 
                  points="20,45 40,110 60,45" 
                  fill="url(#coneChoco)"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  style={{ transformOrigin: 'center top' }}
                />
                {/* Patrón del cono */}
                <motion.line x1="25" y1="55" x2="55" y2="55" stroke="#d97706" strokeWidth="1.5" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7 }} />
                <motion.line x1="27" y1="70" x2="53" y2="70" stroke="#d97706" strokeWidth="1.5" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.75 }} />
                <motion.line x1="30" y1="85" x2="50" y2="85" stroke="#d97706" strokeWidth="1.5" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8 }} />
                <defs>
                  <linearGradient id="chocolateIce">
                    <stop offset="0%" stopColor="#6b4423" />
                    <stop offset="50%" stopColor="#8b5a3c" />
                    <stop offset="100%" stopColor="#5d3a1a" />
                  </linearGradient>
                  <linearGradient id="coneChoco">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </motion.svg>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <CheckCircle className="w-6 h-6 text-amber-600 mx-auto mt-2" />
                <span className="text-lg font-bold text-gray-800 block mt-1">¡Guardado!</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-white/80 backdrop-blur-lg border-orange-100 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            Registrar Ventas del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Fecha
              </Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="border-orange-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Ventas totales
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.total_sales}
                  onChange={(e) => setFormData({...formData, total_sales: e.target.value})}
                  className="border-orange-200"
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
                  value={formData.total_tickets}
                  onChange={(e) => setFormData({...formData, total_tickets: e.target.value})}
                  className="border-orange-200"
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
                  value={formData.total_transactions}
                  onChange={(e) => setFormData({...formData, total_transactions: e.target.value})}
                  className="border-orange-200"
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
                  value={formData.total_suggested}
                  onChange={(e) => setFormData({...formData, total_suggested: e.target.value})}
                  className="border-orange-200"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
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