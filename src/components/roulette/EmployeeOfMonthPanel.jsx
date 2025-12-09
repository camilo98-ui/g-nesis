import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Star, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeOfMonthPanel({ storeId }) {
  const [selectedCashier, setSelectedCashier] = useState('');
  const queryClient = useQueryClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const { data: currentEmployeeOfMonth = [] } = useQuery({
    queryKey: ['employeeOfMonth', storeId, currentMonth, currentYear],
    queryFn: () => base44.entities.EmployeeOfMonth.filter({ 
      store_id: storeId, 
      month: currentMonth, 
      year: currentYear,
      is_active: true 
    }),
    enabled: !!storeId
  });

  const activateEmployeeMutation = useMutation({
    mutationFn: async (cashierId) => {
      const cashier = cashiers.find(c => c.id === cashierId);
      
      // Desactivar cualquier empleado del mes anterior
      for (const emp of currentEmployeeOfMonth) {
        await base44.entities.EmployeeOfMonth.update(emp.id, { is_active: false });
      }
      
      // Crear nuevo empleado del mes
      return base44.entities.EmployeeOfMonth.create({
        cashier_id: cashierId,
        cashier_name: cashier.name,
        store_id: storeId,
        month: currentMonth,
        year: currentYear,
        is_active: true,
        has_spun: false,
        selection_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employeeOfMonth']);
      toast.success('¡Empleado del Mes activado! 🎉');
      setSelectedCashier('');
    }
  });

  const currentEmployee = currentEmployeeOfMonth.find(e => e.is_active);

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <Crown className="w-6 h-6" />
          Empleado del Mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentEmployee ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 text-center shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl mb-3"
            >
              🏆
            </motion.div>
            <p className="text-2xl font-black text-amber-600 mb-2">{currentEmployee.cashier_name}</p>
            <p className="text-sm text-gray-600 mb-3">
              {currentEmployee.has_spun ? '✅ Ya giró la ruleta' : '🎰 Ruleta disponible'}
            </p>
            <Button
              onClick={() => activateEmployeeMutation.mutate('')}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
            >
              Desactivar
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Selecciona al Popsy Star del mes:</p>
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecciona un cajero" />
              </SelectTrigger>
              <SelectContent>
                {cashiers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => activateEmployeeMutation.mutate(selectedCashier)}
              disabled={!selectedCashier || activateEmployeeMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold py-6"
            >
              <Star className="w-5 h-5 mr-2" />
              Activar como Empleado del Mes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}