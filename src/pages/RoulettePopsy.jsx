import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RouletteWheel from '@/components/roulette/RouletteWheel';
import EmployeeOfMonthPanel from '@/components/roulette/EmployeeOfMonthPanel';
import RouletteHistory from '@/components/roulette/RouletteHistory';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Gift, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RoulettePopsy() {
  const [selectedStore, setSelectedStore] = useState('');
  const [userRole, setUserRole] = useState('');
  const [currentCashier, setCurrentCashier] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const savedStore = localStorage.getItem('selectedStore');
    const savedRole = localStorage.getItem('userRole');
    if (savedStore) setSelectedStore(savedStore);
    if (savedRole) setUserRole(savedRole);
  }, []);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: employeeOfMonth = [] } = useQuery({
    queryKey: ['employeeOfMonth', selectedStore, currentMonth, currentYear],
    queryFn: () => base44.entities.EmployeeOfMonth.filter({
      store_id: selectedStore,
      month: currentMonth,
      year: currentYear,
      is_active: true
    }),
    enabled: !!selectedStore
  });

  const recordWinMutation = useMutation({
    mutationFn: async (prize) => {
      const employee = employeeOfMonth[0];
      
      // Registrar el premio
      await base44.entities.RouletteWinner.create({
        cashier_id: employee.cashier_id,
        cashier_name: employee.cashier_name,
        store_id: selectedStore,
        prize: prize.name,
        prize_value: prize.value,
        spin_date: new Date().toISOString().split('T')[0],
        month: currentMonth,
        year: currentYear,
        claimed: false
      });
      
      // Marcar como que ya giró
      await base44.entities.EmployeeOfMonth.update(employee.id, { has_spun: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employeeOfMonth']);
      queryClient.invalidateQueries(['rouletteWinners']);
    }
  });

  const handleRouletteResult = (prize) => {
    setWonPrize(prize);
    setShowResult(true);
    recordWinMutation.mutate(prize);
  };

  const activeEmployee = employeeOfMonth.find(e => e.is_active);
  const isGerente = userRole === 'gerente';
  
  // TODOS pueden ver la ruleta si son empleado del mes
  // Solo el gerente puede girarla
  const canSpin = isGerente;

  // Si es gerente, mostrar panel de administración completo
  if (isGerente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 relative">
        <FloatingIceCreamsBg />
        
        <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                Ruleta Popsy 🎡
              </h1>
              <p className="text-sm text-gray-500">Panel de Administración</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmployeeOfMonthPanel storeId={selectedStore} />
            <RouletteHistory storeId={selectedStore} />
          </div>
        </div>
      </div>
    );
  }

  // Si no es empleado del mes Y no es gerente, mostrar mensaje
  if (!activeEmployee && !isGerente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 relative flex items-center justify-center">
        <FloatingIceCreamsBg />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-8xl mb-4"
          >
            🎡
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Ruleta Popsy</h2>
          <p className="text-gray-500">Esta función está disponible solo para el Empleado del Mes</p>
          <Link to={createPageUrl('Home')}>
            <Button className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              Volver al Inicio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Pantalla del empleado del mes
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
              <ArrowLeft className="w-5 h-5 text-pink-600" />
            </Button>
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent mb-3">
            ¡Felicitaciones, {activeEmployee.cashier_name}!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Eres nuestro <span className="font-bold text-pink-600">Popsy Star del Mes</span> 🎉
          </p>
          {!activeEmployee.has_spun && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white px-6 py-2 rounded-full shadow-lg mt-3"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Tienes 1 giro disponible</span>
            </motion.div>
          )}
        </motion.div>

        {/* Tipo de premio */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4"
        >
          <div className={`inline-block px-6 py-2 rounded-full font-bold text-white ${
            activeEmployee.award_type === 'distrito' 
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
              : 'bg-gradient-to-r from-pink-500 to-rose-500'
          }`}>
            {activeEmployee.award_type === 'distrito' ? '🏆 Popsy Star Distrito' : '⭐ Popsy Star Tienda'}
          </div>
        </motion.div>

        {/* Ruleta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          {activeEmployee.has_spun && !canSpin && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
              <div className="text-center p-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  ✅
                </motion.div>
                <p className="text-lg font-bold text-gray-700 mb-2">Ya giraste la ruleta este mes</p>
                <p className="text-sm text-gray-500">Espera al próximo mes para un nuevo giro</p>
              </div>
            </div>
          )}
          {!activeEmployee.has_spun && !canSpin && (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
              <div className="text-center p-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎡
                </motion.div>
                <p className="text-lg font-bold text-gray-700 mb-2">¡Tu ruleta está lista!</p>
                <p className="text-sm text-gray-500">Espera a que el gerente la gire por ti</p>
              </div>
            </div>
          )}
          <RouletteWheel 
            onResult={handleRouletteResult}
            disabled={activeEmployee.has_spun || !canSpin}
            awardType={activeEmployee.award_type}
          />
        </motion.div>

        {/* Modal de resultado */}
        <AnimatePresence>
          {showResult && wonPrize && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowResult(false)}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 p-8 text-center relative overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)'
                    }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-8xl mb-3 relative z-10"
                  >
                    {wonPrize.emoji}
                  </motion.div>
                  <h2 className="text-3xl font-black text-white mb-2 relative z-10">
                    ¡Felicidades!
                  </h2>
                  <p className="text-white/90 relative z-10">Has ganado</p>
                </div>

                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 mb-6"
                  >
                    <p className="text-3xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {wonPrize.name}
                    </p>
                    {wonPrize.value > 0 && (
                      <p className="text-2xl font-bold text-gray-700">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(wonPrize.value)}
                      </p>
                    )}
                  </motion.div>

                  <p className="text-sm text-gray-600 mb-6">
                    🎉 Tu premio estará disponible en los próximos días
                  </p>

                  <Button
                    onClick={() => setShowResult(false)}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 text-lg font-bold rounded-xl"
                  >
                    Finalizar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}