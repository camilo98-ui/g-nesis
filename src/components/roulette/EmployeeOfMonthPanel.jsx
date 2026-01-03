import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Crown, Star, Trophy, Search, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeOfMonthPanel({ storeId }) {
  const [selectedCashier, setSelectedCashier] = useState('');
  const [awardType, setAwardType] = useState('tienda');
  const [searchQuery, setSearchQuery] = useState('');
  const [cedula, setCedula] = useState('');
  const queryClient = useQueryClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Cargar TODOS los cajeros siempre
  const { data: allCashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.list()
  });

  // Filtrar según el tipo de award
  const cashiers = useMemo(() => {
    if (awardType === 'distrito') {
      return allCashiers;
    }
    return allCashiers.filter(c => c.store_id === storeId);
  }, [allCashiers, awardType, storeId]);

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
      const cashierStoreId = cashier.store_id;
      
      // Desactivar cualquier empleado del mes anterior
      for (const emp of currentEmployeeOfMonth) {
        await base44.entities.EmployeeOfMonth.update(emp.id, { is_active: false });
      }
      
      // Crear/actualizar configuración de ruleta para la tienda del cajero
      const existingConfigs = await base44.entities.RouletteConfig.filter({ store_id: cashierStoreId });
      const activeConfig = existingConfigs.find(c => c.is_active);
      
      const rouletteConfig = {
        store_id: cashierStoreId,
        award_type: awardType,
        validation_cedula: cedula,
        is_active: true,
        prizes: activeConfig?.prizes || JSON.stringify(awardType === 'distrito' ? [
          { id: 1, name: 'Pase Piscilago 4 personas', value: 0, color: '#FFB5C5', emoji: '🏊' },
          { id: 2, name: 'Domingo remunerado', value: 0, color: '#D4A5D8', emoji: '☀️' },
          { id: 3, name: 'Descanso remunerado', value: 0, color: '#A5D8FF', emoji: '🏖️' },
          { id: 4, name: 'Entradas Cine PREMIUM', value: 0, color: '#FFD9A5', emoji: '🎥' },
          { id: 5, name: 'Litro de helado', value: 0, color: '#C9FFD4', emoji: '🍦' },
          { id: 6, name: 'Descanso + Malteada', value: 0, color: '#FFE5CC', emoji: '🍹' },
          { id: 7, name: 'Bono $80.000 Olímpica', value: 80000, color: '#FFD0E5', emoji: '💰' }
        ] : [
          { id: 1, name: 'Descanso remunerado', value: 0, color: '#FFB5C5', emoji: '🏖️' },
          { id: 2, name: 'Bono $30.000 Olímpica', value: 30000, color: '#D4A5D8', emoji: '💳' },
          { id: 3, name: 'Malteada chocolate', value: 0, color: '#A5D8FF', emoji: '🍫' },
          { id: 4, name: 'Entradas Cinecolombia', value: 0, color: '#FFD9A5', emoji: '🎬' },
          { id: 5, name: 'Domingo remunerado', value: 0, color: '#C9FFD4', emoji: '☀️' }
        ]),
        spin_duration: activeConfig?.spin_duration || 6500
      };

      if (activeConfig) {
        await base44.entities.RouletteConfig.update(activeConfig.id, rouletteConfig);
      } else {
        await base44.entities.RouletteConfig.create(rouletteConfig);
      }
      
      // Crear nuevo empleado del mes
      return base44.entities.EmployeeOfMonth.create({
        cashier_id: cashierId,
        cashier_name: cashier.name,
        store_id: cashierStoreId,
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
      queryClient.invalidateQueries(['rouletteConfig']);
      toast.success('¡Empleado del Mes activado y ruleta configurada! 🎉');
      setSelectedCashier('');
      setCedula('');
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

            {/* Cédula de Validación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-bold text-gray-800">Cédula del Empleado</label>
              </div>
              <p className="text-xs text-gray-600 mb-3">El empleado deberá ingresar esta cédula para girar la ruleta</p>
              <Input
                placeholder="Ej: 1234567890"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="bg-white"
                type="number"
              />
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
              disabled={!selectedCashier || !cedula || activateEmployeeMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold py-6"
            >
              <Star className="w-5 h-5 mr-2" />
              Activar como Empleado del Mes
            </Button>
            {!cedula && selectedCashier && (
              <p className="text-xs text-red-500 text-center">⚠️ Debes ingresar la cédula del empleado</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}