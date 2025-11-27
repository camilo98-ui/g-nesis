import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Target, DollarSign, Receipt, Zap, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export default function BudgetForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    sales_budget: '',
    tickets_budget: '',
    transactions_budget: '',
    suggested_budget: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Check if budget exists for this month/year
      const existing = await base44.entities.Budget.filter({ 
        store_id: storeId, 
        month: data.month,
        year: data.year
      });
      
      const budgetData = {
        store_id: storeId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        sales_budget: parseFloat(data.sales_budget) || 0,
        tickets_budget: parseInt(data.tickets_budget) || 0,
        transactions_budget: parseInt(data.transactions_budget) || 0,
        suggested_budget: parseInt(data.suggested_budget) || 0
      };

      if (existing.length > 0) {
        return base44.entities.Budget.update(existing[0].id, budgetData);
      }
      return base44.entities.Budget.create(budgetData);
    },
    onSuccess: () => {
      toast.success('¡Presupuesto guardado!');
      queryClient.invalidateQueries(['budgets']);
      onSuccess?.();
    },
    onError: () => {
      toast.error('Error al guardar el presupuesto');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/80 backdrop-blur-lg border-orange-100 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
              <Target className="w-5 h-5" />
            </div>
            Configurar Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Mes */}
              <div className="space-y-2">
                <Label className="text-gray-600">Mes</Label>
                <Select 
                  value={formData.month.toString()} 
                  onValueChange={(val) => setFormData({...formData, month: parseInt(val)})}
                >
                  <SelectTrigger className="border-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Año */}
              <div className="space-y-2">
                <Label className="text-gray-600">Año</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(val) => setFormData({...formData, year: parseInt(val)})}
                >
                  <SelectTrigger className="border-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

            <div className="grid grid-cols-2 gap-4">
              {/* Presupuesto ventas */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Presupuesto Ventas ($)
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.sales_budget}
                  onChange={(e) => setFormData({...formData, sales_budget: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Presupuesto tickets */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  Presupuesto Tickets
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.tickets_budget}
                  onChange={(e) => setFormData({...formData, tickets_budget: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Presupuesto transacciones */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Presupuesto Transacciones
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.transactions_budget}
                  onChange={(e) => setFormData({...formData, transactions_budget: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              {/* Presupuesto sugeridos */}
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-pink-500" />
                  Presupuesto Sugeridos
                </Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.suggested_budget}
                  onChange={(e) => setFormData({...formData, suggested_budget: e.target.value})}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Guardar Presupuesto
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}