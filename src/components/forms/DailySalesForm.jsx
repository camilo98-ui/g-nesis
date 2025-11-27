import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, DollarSign, Receipt, Zap, Gift, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function DailySalesForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_sales: '',
    total_tickets: '',
    total_transactions: '',
    total_suggested: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Check if record exists for this date
      const existing = await base44.entities.DailySales.filter({ 
        store_id: storeId, 
        date: data.date 
      });
      
      const recordData = {
        store_id: storeId,
        date: data.date,
        total_sales: parseFloat(data.total_sales) || 0,
        total_tickets: parseInt(data.total_tickets) || 0,
        total_transactions: parseInt(data.total_transactions) || 0,
        total_suggested: parseInt(data.total_suggested) || 0
      };

      if (existing.length > 0) {
        return base44.entities.DailySales.update(existing[0].id, recordData);
      }
      return base44.entities.DailySales.create(recordData);
    },
    onSuccess: () => {
      toast.success('¡Ventas del día guardadas!');
      queryClient.invalidateQueries(['dailySales']);
      setFormData({
        ...formData,
        total_sales: '',
        total_tickets: '',
        total_transactions: '',
        total_suggested: ''
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error('Error al guardar las ventas');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
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

              {/* Tickets */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  Total Tickets
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