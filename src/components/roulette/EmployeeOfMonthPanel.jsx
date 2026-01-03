import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Crown, Star, Trophy, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeOfMonthPanel({ storeId }) {
  const [selectedCashier, setSelectedCashier] = useState('');
  const [awardType, setAwardType] = useState('tienda');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: storeCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const { data: allDistrictCashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.filter({ is_active: true }),
    enabled: awardType === 'distrito'
  });

  const cashiers = awardType === 'distrito' ? allDistrictCashiers : storeCashiers;

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
        award_type: awardType,
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

  // Filtrar cajeros por búsqueda
  const filteredCashiers = useMemo(() => {
    if (!searchQuery) return cashiers;
    return cashiers.filter(c => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cashiers, searchQuery]);

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
            <p className="text-xs text-gray-500 mb-1 font-bold">
              {currentEmployee.award_type === 'distrito' ? '🏆 Popsy Star Distrito' : '⭐ Popsy Star Tienda'}
            </p>
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
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Selecciona al Popsy Star del mes:</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setAwardType('tienda')}
                variant={awardType === 'tienda' ? 'default' : 'outline'}
                className={awardType === 'tienda' ? 'bg-gradient-to-r from-pink-400 to-rose-400' : ''}
              >
                ⭐ Tienda
              </Button>
              <Button
                onClick={() => setAwardType('distrito')}
                variant={awardType === 'distrito' ? 'default' : 'outline'}
                className={awardType === 'distrito' ? 'bg-gradient-to-r from-purple-400 to-indigo-400' : ''}
              >
                🏆 Distrito
              </Button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar cajero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>

            {/* Listado de Cajeros */}
            <div className="space-y-2 max-h-60 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200">
              {filteredCashiers.length > 0 ? (
                filteredCashiers.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedCashier(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedCashier === c.id
                        ? 'bg-gradient-to-r from-pink-100 to-rose-100 border-2 border-pink-400'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-rose-200 flex-shrink-0">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pink-600 font-bold text-lg">
                          {c.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.position || 'Cajero'}</p>
                    </div>
                    {selectedCashier === c.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0"
                      >
                        <Star className="w-4 h-4 text-white fill-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se encontraron cajeros</p>
                </div>
              )}
            </div>

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