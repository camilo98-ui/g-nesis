import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Sparkles, BarChart3, UserPlus, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import WeeklyCalendar from '@/components/planner/WeeklyCalendar';
import PlannerStats from '@/components/planner/PlannerStats';
import CashierManagerModal from '@/components/planner/CashierManagerModal';
import AIScheduleSuggestion from '@/components/planner/AIScheduleSuggestion';
import AIScheduleAssistant from '@/components/planner/AIScheduleAssistant';
import ConeoRotationSuggestion from '@/components/planner/ConeoRotationSuggestion';
import AIScheduleOptimizer from '@/components/planner/AIScheduleOptimizer';
import { generateSchedulePDF } from '@/components/planner/SchedulePDFExport';

export default function PopsyPlanner() {
  const [selectedStore, setSelectedStore] = useState('');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCashierManager, setShowCashierManager] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Check if view only mode (for Calidad, Embajador, C.Interno roles)
  const urlParams = new URLSearchParams(window.location.search);
  const viewOnly = urlParams.get('viewOnly') === 'true';
  const userRole = localStorage.getItem('userRole') || 'lider';
  const isReadOnly = viewOnly || userRole === 'embajador' || userRole === 'calidad' || userRole === 'c_interno';

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

  const { data: salesData = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgetData = [] } = useQuery({
    queryKey: ['budget', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const weekShifts = useMemo(() => {
    const weekStartStr = format(currentWeek, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    return shifts.filter(s => {
      const shiftDateStr = s.date?.split('T')[0] || s.date;
      return shiftDateStr >= weekStartStr && shiftDateStr <= weekEndStr;
    });
  }, [shifts, currentWeek, weekEnd]);

  const storeName = STORES.find(s => s.code === selectedStore)?.name || '';

  const handleExportPDF = () => generateSchedulePDF(weekDays, weekShifts, storeName, selectedStore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-white to-violet-50/30 p-4 md:p-6">
      {/* Botón flotante de regreso */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed top-24 left-4 z-50"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="sm"
            className="bg-white/95 backdrop-blur-sm border-gray-200 hover:border-violet-300 hover:bg-violet-50 shadow-lg gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
        </motion.div>
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-800">Popsy Planner</h1>
                <p className="text-gray-500 text-sm">Gestión inteligente de horarios</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isReadOnly && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                  🔒 Solo lectura
                </span>
              )}
              <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
              {selectedStore && !isReadOnly && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setShowCashierManager(true)} variant="outline" className="gap-2 border-violet-200 text-violet-600 hover:bg-violet-50">
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Colaboradores</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setShowAISuggestion(true)} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2 shadow-lg">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Elige una tienda para gestionar los horarios</p>
          </motion.div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="calendar" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-400 data-[state=active]:to-pink-400 data-[state=active]:text-white">
                <CalendarIcon className="w-4 h-4" /> Calendario
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-400 data-[state=active]:to-teal-400 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" /> Reportes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-0 space-y-4">
              {/* Optimizador IA */}
              {!isReadOnly && (
                <AIScheduleOptimizer
                  storeId={selectedStore}
                  currentWeek={currentWeek}
                  shifts={weekShifts}
                  cashiers={cashiers}
                  sales={salesData}
                  budgets={budgetData}
                />
              )}
              
              <WeeklyCalendar
                currentWeek={currentWeek}
                setCurrentWeek={setCurrentWeek}
                weekDays={weekDays}
                shifts={weekShifts}
                cashiers={cashiers}
                storeId={selectedStore}
                loading={loadingShifts}
                onExportPDF={handleExportPDF}
                readOnly={isReadOnly}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              {isReadOnly ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Acceso Restringido</h3>
                  <p className="text-gray-500 text-sm">Los reportes solo están disponibles para Líderes de Experiencia</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <PlannerStats 
                    shifts={shifts} 
                    cashiers={cashiers} 
                    storeId={selectedStore}
                    currentWeek={currentWeek}
                    salesData={salesData}
                    shiftRecords={shiftRecords}
                  />
                  <ConeoRotationSuggestion 
                    shifts={shifts}
                    cashiers={cashiers}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AIScheduleSuggestion
        isOpen={showAISuggestion}
        onClose={() => setShowAISuggestion(false)}
        storeId={selectedStore}
        storeName={storeName}
        cashiers={cashiers}
        weekDays={weekDays}
        existingShifts={weekShifts}
        salesData={salesData}
        budgetData={budgetData}
      />

      <CashierManagerModal
        isOpen={showCashierManager}
        onClose={() => setShowCashierManager(false)}
        cashiers={cashiers}
        storeId={selectedStore}
      />

      <AIScheduleAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        storeId={selectedStore}
        storeName={storeName}
        cashiers={cashiers}
        weekDays={weekDays}
        existingShifts={weekShifts}
        salesData={salesData}
      />
    </div>
  );
}