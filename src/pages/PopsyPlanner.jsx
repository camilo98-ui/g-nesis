import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, Users, Sparkles, Copy, ChevronLeft, ChevronRight,
  Clock, BarChart3, FileText, Bell, Plus, Loader2, GripVertical, UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import WeeklyCalendar from '@/components/planner/WeeklyCalendar';
import AIScheduleGenerator from '@/components/planner/AIScheduleGenerator';
import ShiftRequestsPanel from '@/components/planner/ShiftRequestsPanel';
import PlannerStats from '@/components/planner/PlannerStats';
import CollaboratorProfile from '@/components/planner/CollaboratorProfile';
import CashierManagerModal from '@/components/planner/CashierManagerModal';

export default function PopsyPlanner() {
  const [selectedStore, setSelectedStore] = useState('');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showCashierManager, setShowCashierManager] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeek, end: weekEnd });

  // Fetch data
  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts', selectedStore, format(currentWeek, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Shift.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['shiftRequests', selectedStore],
    queryFn: () => base44.entities.ShiftRequest.filter({ store_id: selectedStore, status: 'pending' }),
    enabled: !!selectedStore
  });

  // Filter shifts for current week
  const weekShifts = useMemo(() => {
    return shifts.filter(s => {
      const shiftDate = new Date(s.date);
      return shiftDate >= currentWeek && shiftDate <= weekEnd;
    });
  }, [shifts, currentWeek, weekEnd]);

  const storeName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-violet-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center"
                >
                  <CalendarIcon className="w-5 h-5 text-white" />
                </motion.div>
                Popsy Planner
              </h1>
              <p className="text-gray-500 text-sm mt-1">Gestión inteligente de horarios y turnos</p>
            </div>
            <div className="flex items-center gap-3">
              <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
              {selectedStore && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setShowCashierManager(true)}
                      variant="outline"
                      className="gap-2 border-violet-200 text-violet-600 hover:bg-violet-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Colaboradores</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setShowAIGenerator(true)}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Generar con IA</span>
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {!selectedStore ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Elige una tienda para gestionar los horarios</p>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-100 p-1 rounded-xl shadow-sm">
                <TabsTrigger value="calendar" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
                  <CalendarIcon className="w-4 h-4" /> Calendario
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  <Users className="w-4 h-4" /> Equipo
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white relative">
                  <Bell className="w-4 h-4" /> Solicitudes
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4" /> Reportes
                </TabsTrigger>
              </TabsList>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="mt-0">
                <WeeklyCalendar
                  currentWeek={currentWeek}
                  setCurrentWeek={setCurrentWeek}
                  weekDays={weekDays}
                  shifts={weekShifts}
                  cashiers={cashiers}
                  storeId={selectedStore}
                  loading={loadingShifts}
                />
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cashiers.map((cashier, i) => (
                    <motion.div
                      key={cashier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => setSelectedCashier(cashier)}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {cashier.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{cashier.name}</h3>
                          <p className="text-xs text-gray-400">{cashier.email || 'Sin email'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-lg">
                          {weekShifts.filter(s => s.cashier_id === cashier.id).length} turnos esta semana
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {cashiers.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
                      No hay colaboradores registrados
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="mt-0">
                <ShiftRequestsPanel requests={requests} storeId={selectedStore} />
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-0">
                <PlannerStats 
                  shifts={shifts} 
                  cashiers={cashiers} 
                  storeId={selectedStore}
                  currentWeek={currentWeek}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* AI Generator Modal */}
      <AnimatePresence>
        {showAIGenerator && (
          <AIScheduleGenerator
            storeId={selectedStore}
            storeName={storeName}
            cashiers={cashiers}
            currentWeek={currentWeek}
            onClose={() => setShowAIGenerator(false)}
          />
        )}
      </AnimatePresence>

      {/* Collaborator Profile Modal */}
      <AnimatePresence>
        {selectedCashier && (
          <CollaboratorProfile
            cashier={selectedCashier}
            shifts={shifts.filter(s => s.cashier_id === selectedCashier.id)}
            storeId={selectedStore}
            onClose={() => setSelectedCashier(null)}
          />
        )}
      </AnimatePresence>

      {/* Cashier Manager Modal */}
      <CashierManagerModal
        isOpen={showCashierManager}
        onClose={() => setShowCashierManager(false)}
        cashiers={cashiers}
        storeId={selectedStore}
      />
    </div>
  );
}