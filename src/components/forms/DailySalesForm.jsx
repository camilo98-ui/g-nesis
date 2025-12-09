import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, DollarSign, Receipt, Zap, Gift, Loader2, Calendar, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Explosión de confetti de colores Popsy
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
          boxShadow: '0 0 10px currentColor'
        }}
        initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [1, 1, 0],
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 600,
          rotate: Math.random() * 720
        }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
          delay: i * 0.02
        }}
      />
    ))}
  </div>
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
          <>
            <PopsyConfetti />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-amber-500/20 backdrop-blur-sm z-[9998]"
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                    y: [0, -30, -20, -25, -15, -10, -5, 0],
                    scale: [1, 1.2, 1.1, 1.15, 1.05, 1.1, 1, 1]
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <motion.svg viewBox="0 0 80 120" className="w-32 h-40 drop-shadow-2xl">
                    {/* Cono animado */}
                    <motion.polygon 
                      points="20,45 40,110 60,45" 
                      fill="url(#popsyCone)"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'center top' }}
                    />
                    {/* Patrón del cono */}
                    <motion.path d="M 25 55 L 55 55 M 27 65 L 53 65 M 29 75 L 51 75 M 31 85 L 49 85 M 33 95 L 47 95" 
                      stroke="#d97706" strokeWidth="1.5" opacity="0.3"
                      initial={{ pathLength: 0 }} 
                      animate={{ pathLength: 1 }} 
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />

                    {/* Helado rosa vibrante */}
                    <motion.circle 
                      cx="40" cy="28" r="24" 
                      fill="url(#popsyIce)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                    />

                    {/* Chispitas de colores */}
                    {[...Array(12)].map((_, i) => (
                      <motion.circle
                        key={i}
                        cx={30 + Math.cos(i * 30 * Math.PI / 180) * 15}
                        cy={25 + Math.sin(i * 30 * Math.PI / 180) * 15}
                        r="2"
                        fill={['#fbbf24', '#ec4899', '#a855f7', '#f472b6'][i % 4]}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
                        transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
                      />
                    ))}

                    {/* Brillo mágico */}
                    <motion.ellipse 
                      cx="32" cy="20" rx="10" ry="6" 
                      fill="white" opacity="0.6"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />

                    <defs>
                      <linearGradient id="popsyIce" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                      <linearGradient id="popsyCone" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.5 }}
                  className="mt-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xl font-black">¡Súper guardado!</span>
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-50/60 to-yellow-50/40 rounded-xl p-4 shadow-sm border border-amber-200/40"
          >
            <Label className="text-gray-600 flex items-center gap-2 mb-2 font-bold">
              <Calendar className="w-5 h-5 text-amber-500" />
              📅 Fecha
            </Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="border-2 border-amber-300 focus:border-amber-500 text-lg font-semibold"
            />
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="bg-gradient-to-br from-emerald-50/80 to-green-50/60 rounded-xl p-4 shadow-sm border border-emerald-200/50"
            >
              <Label className="flex items-center gap-2 mb-2 font-black text-emerald-700">
                <DollarSign className="w-5 h-5" />
                💰 Ventas
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_sales}
                onChange={(e) => setFormData({...formData, total_sales: e.target.value})}
                className="border-2 border-emerald-400 focus:border-emerald-600 text-lg font-bold bg-white"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="bg-gradient-to-br from-sky-50/80 to-blue-50/60 rounded-xl p-4 shadow-sm border border-sky-200/50"
            >
              <Label className="flex items-center gap-2 mb-2 font-black text-sky-700">
                <Receipt className="w-5 h-5" />
                🎫 Tickets
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_tickets}
                onChange={(e) => setFormData({...formData, total_tickets: e.target.value})}
                className="border-2 border-sky-400 focus:border-sky-600 text-lg font-bold bg-white"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="bg-gradient-to-br from-violet-50/80 to-purple-50/60 rounded-xl p-4 shadow-sm border border-violet-200/50"
            >
              <Label className="flex items-center gap-2 mb-2 font-black text-violet-700">
                <Zap className="w-5 h-5" />
                ⚡ Transacciones
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_transactions}
                onChange={(e) => setFormData({...formData, total_transactions: e.target.value})}
                className="border-2 border-violet-400 focus:border-violet-600 text-lg font-bold bg-white"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="bg-gradient-to-br from-pink-50/80 to-rose-50/60 rounded-xl p-4 shadow-sm border border-pink-200/50"
            >
              <Label className="flex items-center gap-2 mb-2 font-black text-pink-700">
                <Gift className="w-5 h-5" />
                🎁 Sugeridos
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_suggested}
                onChange={(e) => setFormData({...formData, total_suggested: e.target.value})}
                className="border-2 border-pink-400 focus:border-pink-600 text-lg font-bold bg-white"
              />
            </motion.div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg py-5 text-base font-bold rounded-xl"
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
      </motion.div>
    </>
  );
}