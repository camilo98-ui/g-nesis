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

// Componente de helado animado para éxito
const SuccessIceCream = () => (
  <motion.div className="relative">
    {/* Cono */}
    <motion.svg viewBox="0 0 80 120" className="w-24 h-32">
      {/* Bola de helado principal */}
      <motion.circle 
        cx="40" cy="28" r="22" 
        fill="url(#iceCreamGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1], y: [20, -5, 0] }}
        transition={{ duration: 0.6, ease: "backOut" }}
      />
      {/* Brillo */}
      <motion.circle 
        cx="32" cy="20" r="5" 
        fill="white" opacity="0.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      />
      {/* Cono */}
      <motion.polygon 
        points="20,45 40,110 60,45" 
        fill="url(#coneGradient)"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ transformOrigin: 'center top' }}
      />
      {/* Líneas del cono */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <line x1="26" y1="55" x2="54" y2="55" stroke="#b45309" strokeWidth="1" opacity="0.4" />
        <line x1="30" y1="70" x2="50" y2="70" stroke="#b45309" strokeWidth="1" opacity="0.4" />
        <line x1="34" y1="85" x2="46" y2="85" stroke="#b45309" strokeWidth="1" opacity="0.4" />
      </motion.g>
      {/* Chispas de celebración */}
      <motion.circle cx="15" cy="15" r="3" fill="#fbbf24" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
      <motion.circle cx="65" cy="10" r="2" fill="#f472b6" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
      <motion.circle cx="70" cy="35" r="2.5" fill="#34d399" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
      <motion.circle cx="10" cy="40" r="2" fill="#a78bfa" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.9 }} />
      <defs>
        <linearGradient id="iceCreamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </motion.svg>
    {/* Estrellas */}
    <motion.div
      className="absolute -top-2 -right-2"
      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      ✨
    </motion.div>
  </motion.div>
);

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
      try {
        const user = await base44.auth.me();
        
        // Check if record exists for this date
        const existing = await base44.entities.DailySales.filter({ 
          store_id: storeId, 
          date: data.date 
        });
        
        const salesValue = parseFloat(data.total_sales) || 0;
        const ticketsValue = parseInt(data.total_tickets) || 0;
        const transactionsValue = parseInt(data.total_transactions) || 0;
        const suggestedValue = parseInt(data.total_suggested) || 0;
        
        const recordData = {
          store_id: storeId,
          date: data.date,
          total_sales: salesValue,
          total_tickets: ticketsValue,
          total_transactions: transactionsValue,
          total_suggested: suggestedValue
        };
        
        let record;
        let action;
        
        if (existing.length > 0) {
          record = await base44.entities.DailySales.update(existing[0].id, recordData);
          action = 'update';
        } else {
          record = await base44.entities.DailySales.create(recordData);
          action = 'create';
        }
        
        // Log de la acción
        await base44.entities.SalesLog.create({
          store_id: storeId,
          record_type: 'daily_sales',
          record_id: record.id,
          action,
          user_email: user.email,
          sales_amount: salesValue,
          action_date: data.date,
          details: JSON.stringify({ total_transactions: transactionsValue, total_suggested: suggestedValue })
        });
        
        return record;
      } catch (error) {
        console.error('Error completo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailySales']);
      queryClient.invalidateQueries(['salesLogs']);
      setFormData({
        ...formData,
        total_sales: '',
        total_tickets: '',
        total_transactions: '',
        total_suggested: ''
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 2500);
    },
    onError: (error) => {
      console.error('Error guardando ventas:', error);
      toast.error('Error al guardar las ventas');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que tenga al menos las ventas
    if (!formData.total_sales) {
      toast.error('Ingresa al menos las ventas totales');
      return;
    }
    
    createMutation.mutate(formData);
  };

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
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <SuccessIceCream />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 justify-center mt-2"
              >
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-bold text-gray-800">¡Guardado!</span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-500 mt-1"
              >
                Ventas del día registradas
              </motion.p>
            </motion.div>
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
            {/* Fecha */}
            <div className="space-y-2">
              <Label className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Fecha
              </Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="border-orange-200 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Ventas totales */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Ventas totales ($)
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.total_sales}
                  onChange={(e) => setFormData({...formData, total_sales: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Ticket Promedio */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  Ticket Promedio
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.total_tickets}
                  onChange={(e) => setFormData({...formData, total_tickets: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Transacciones */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Total Transacciones
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.total_transactions}
                  onChange={(e) => setFormData({...formData, total_transactions: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Sugeridos */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-pink-500" />
                  Total Sugeridos
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.total_suggested}
                  onChange={(e) => setFormData({...formData, total_suggested: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Guardar Ventas
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}