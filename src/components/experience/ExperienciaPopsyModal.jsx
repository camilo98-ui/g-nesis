import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Star, TrendingUp, Award, Sparkles, ChevronRight, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ExperienciaPopsyModal({ onClose, storeId, userId, userName, userRole }) {
  const [currentScreen, setCurrentScreen] = useState('selectCashier'); // selectCashier, validation, survey, myPerformance, ranking, dashboard
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedInvoice, setValidatedInvoice] = useState(null);
  const [selectedCashier, setSelectedCashier] = useState(null);
  
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Queries
  const { data: todayExperiences = [] } = useQuery({
    queryKey: ['experiences', storeId, today],
    queryFn: () => base44.entities.CustomerExperience.filter({ store_id: storeId, date: today }),
    enabled: !!storeId
  });

  const { data: todaySales = [] } = useQuery({
    queryKey: ['todaySales', storeId, today],
    queryFn: () => base44.entities.SalesLog.filter({ store_id: storeId, date: today }),
    enabled: !!storeId
  });

  const { data: myDailyPoints } = useQuery({
    queryKey: ['myDailyPoints', selectedCashier?.id, today],
    queryFn: () => base44.entities.UserDailyPoints.filter({ cashier_id: selectedCashier?.id, date: today }),
    enabled: !!selectedCashier
  });

  const { data: weeklyExperiences = [] } = useQuery({
    queryKey: ['weeklyExperiences', storeId],
    queryFn: async () => {
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerExperience.list();
      return all.filter(e => e.store_id === storeId && e.date >= start && e.date <= end);
    },
    enabled: !!storeId
  });

  const { data: monthlyExperiences = [] } = useQuery({
    queryKey: ['monthlyExperiences', storeId],
    queryFn: async () => {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerExperience.list();
      return all.filter(e => e.store_id === storeId && e.date >= start && e.date <= end);
    },
    enabled: !!storeId
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  // Mutations
  const createExperienceMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerExperience.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['myDailyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyExperiences'] });
    }
  });

  const updateDailyPointsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserDailyPoints.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDailyPoints'] });
    }
  });

  const createDailyPointsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserDailyPoints.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDailyPoints'] });
    }
  });

  // Validación de factura
  const handleValidateInvoice = async () => {
    if (!invoiceSerial.trim()) {
      toast.error('Ingresa un número de factura');
      return;
    }

    setValidating(true);

    try {
      // Verificar que exista en ventas del día
      const saleExists = todaySales.some(s => s.invoice_number === invoiceSerial);
      
      if (!saleExists) {
        toast.error('Factura no encontrada en las ventas de hoy');
        setValidating(false);
        return;
      }

      // Verificar que no haya sido usada hoy
      const alreadyUsed = todayExperiences.some(e => e.invoice_serial === invoiceSerial);
      
      if (alreadyUsed) {
        toast.error('Esta factura ya fue evaluada hoy. ¡Gracias por tu opinión!');
        setValidating(false);
        setTimeout(() => {
          setInvoiceSerial('');
        }, 2000);
        return;
      }

      // Validación exitosa
      const sale = todaySales.find(s => s.invoice_number === invoiceSerial);
      setValidatedInvoice(sale);
      setCurrentScreen('survey');
      toast.success('¡Factura válida! Comparte tu experiencia');
    } catch (error) {
      toast.error('Error al validar factura');
    }

    setValidating(false);
  };

  // Enviar encuesta
  const handleSurveySubmit = async (rating) => {
    const experiencePoints = rating === 'excelente' ? 8 : rating === 'normal' ? 4 : 0;
    
    // Detectar productos sugeridos en la factura
    const suggestedProducts = validatedInvoice?.suggested_items || 0;
    const suggestedSalesPoints = Math.min(suggestedProducts * 2, 20);
    const totalPoints = experiencePoints + suggestedSalesPoints;

    // Guardar experiencia
    await createExperienceMutation.mutateAsync({
      invoice_serial: invoiceSerial,
      store_id: storeId,
      cashier_id: selectedCashier.id,
      cashier_name: selectedCashier.name,
      experience_rating: rating,
      experience_points: experiencePoints,
      suggested_sales_points: suggestedSalesPoints,
      total_points: totalPoints,
      date: today,
      has_suggested_products: suggestedProducts > 0,
      suggested_products_count: suggestedProducts
    });

    // Actualizar puntos diarios del usuario
    const existingPoints = myDailyPoints?.[0];
    
    if (existingPoints) {
      await updateDailyPointsMutation.mutateAsync({
        id: existingPoints.id,
        data: {
          experience_points: existingPoints.experience_points + experiencePoints,
          suggested_sales_points: existingPoints.suggested_sales_points + suggestedSalesPoints,
          total_points: existingPoints.total_points + totalPoints,
          excellent_count: existingPoints.excellent_count + (rating === 'excelente' ? 1 : 0),
          normal_count: existingPoints.normal_count + (rating === 'normal' ? 1 : 0),
          bad_count: existingPoints.bad_count + (rating === 'mala' ? 1 : 0),
          total_surveys: existingPoints.total_surveys + 1
        }
      });
    } else {
      await createDailyPointsMutation.mutateAsync({
        cashier_id: selectedCashier.id,
        cashier_name: selectedCashier.name,
        store_id: storeId,
        date: today,
        experience_points: experiencePoints,
        suggested_sales_points: suggestedSalesPoints,
        total_points: totalPoints,
        excellent_count: rating === 'excelente' ? 1 : 0,
        normal_count: rating === 'normal' ? 1 : 0,
        bad_count: rating === 'mala' ? 1 : 0,
        total_surveys: 1
      });
    }

    toast.success('¡Gracias por tu opinión! 🎉');
    
    // Reset
    setTimeout(() => {
      setInvoiceSerial('');
      setValidatedInvoice(null);
      setCurrentScreen('selectCashier');
      setSelectedCashier(null);
    }, 2000);
  };

  // Calcular mis stats de hoy
  const myStats = useMemo(() => {
    const points = myDailyPoints?.[0];
    if (!points) return { total: 0, excellent: 0, suggested: 0, surveys: 0 };

    const excellentPercent = points.total_surveys > 0 
      ? ((points.excellent_count / points.total_surveys) * 100).toFixed(0)
      : 0;

    return {
      total: points.total_points,
      excellent: excellentPercent,
      suggested: points.suggested_sales_points,
      surveys: points.total_surveys,
      streak: points.consecutive_days_streak || 0
    };
  }, [myDailyPoints]);

  // Rankings
  const weeklyRanking = useMemo(() => {
    const userPoints = {};
    weeklyExperiences.forEach(exp => {
      if (!userPoints[exp.cashier_id]) {
        userPoints[exp.cashier_id] = {
          name: exp.cashier_name,
          points: 0,
          surveys: 0,
          excellent: 0
        };
      }
      userPoints[exp.cashier_id].points += exp.total_points;
      userPoints[exp.cashier_id].surveys += 1;
      if (exp.experience_rating === 'excelente') {
        userPoints[exp.cashier_id].excellent += 1;
      }
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({
        id,
        ...data,
        excellentPercent: data.surveys > 0 ? ((data.excellent / data.surveys) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [weeklyExperiences]);

  const monthlyRanking = useMemo(() => {
    const userPoints = {};
    monthlyExperiences.forEach(exp => {
      if (!userPoints[exp.cashier_id]) {
        userPoints[exp.cashier_id] = {
          name: exp.cashier_name,
          points: 0,
          surveys: 0,
          excellent: 0
        };
      }
      userPoints[exp.cashier_id].points += exp.total_points;
      userPoints[exp.cashier_id].surveys += 1;
      if (exp.experience_rating === 'excelente') {
        userPoints[exp.cashier_id].excellent += 1;
      }
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({
        id,
        ...data,
        excellentPercent: data.surveys > 0 ? ((data.excellent / data.surveys) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [monthlyExperiences]);

  // Dashboard stats (para gerente)
  const dashboardStats = useMemo(() => {
    if (userRole !== 'lider') return null;

    const totalSurveys = todayExperiences.length;
    const excellent = todayExperiences.filter(e => e.experience_rating === 'excelente').length;
    const excellentPercent = totalSurveys > 0 ? ((excellent / totalSurveys) * 100).toFixed(1) : 0;
    const avgPoints = totalSurveys > 0 
      ? (todayExperiences.reduce((sum, e) => sum + e.total_points, 0) / totalSurveys).toFixed(1)
      : 0;
    const withSuggested = todayExperiences.filter(e => e.has_suggested_products).length;
    const suggestedPercent = totalSurveys > 0 ? ((withSuggested / totalSurveys) * 100).toFixed(1) : 0;

    return {
      totalSurveys,
      excellentPercent,
      avgPoints,
      suggestedPercent
    };
  }, [todayExperiences, userRole]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] overflow-y-auto"
      >
        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 p-6 relative overflow-hidden">
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Experiencia Popsy</h2>
                    <p className="text-white/80 text-sm">Tu opinión nos hace mejores</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'selectCashier', label: 'Encuesta', icon: Star },
                  { id: 'myPerformance', label: 'Mi Desempeño', icon: TrendingUp },
                  { id: 'ranking', label: 'Ranking', icon: Award },
                  ...(userRole === 'lider' ? [{ id: 'dashboard', label: 'Dashboard', icon: Sparkles }] : [])
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentScreen(tab.id)}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                        currentScreen === tab.id
                          ? 'bg-white text-pink-600 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {currentScreen === 'selectCashier' && (
                  <motion.div
                    key="selectCashier"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">¿Quién está en zona de experiencia?</h3>
                      <p className="text-gray-600">Selecciona el colaborador</p>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {allCashiers.map((cashier) => (
                        <motion.button
                          key={cashier.id}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCashier(cashier);
                            setCurrentScreen('validation');
                          }}
                          className="w-full p-4 rounded-xl bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border-2 border-gray-200 hover:border-pink-300 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                              {cashier.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{cashier.name}</p>
                              <p className="text-sm text-gray-600">{cashier.position || 'Colaborador'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-pink-500 ml-auto" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'validation' && selectedCashier && (
                  <motion.div
                    key="validation"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="mb-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl">
                        <p className="text-sm text-gray-600">Zona de experiencia:</p>
                        <p className="font-bold text-pink-700">{selectedCashier.name}</p>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Validar Factura</h3>
                      <p className="text-gray-600">Ingresa el número de factura para comenzar</p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        placeholder="Número de factura"
                        value={invoiceSerial}
                        onChange={(e) => setInvoiceSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateInvoice()}
                        className="h-14 text-lg text-center font-bold"
                        disabled={validating}
                      />
                      <Button
                        onClick={handleValidateInvoice}
                        disabled={validating || !invoiceSerial.trim()}
                        className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg"
                      >
                        {validating ? 'Validando...' : 'Validar Factura'}
                      </Button>
                    </div>

                    {todayExperiences.length > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200">
                        <p className="text-sm text-center text-emerald-700">
                          <strong>{todayExperiences.length}</strong> encuestas completadas hoy ✨
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentScreen === 'survey' && (
                  <motion.div
                    key="survey"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">¿Cómo fue tu experiencia?</h3>
                      <p className="text-gray-600">Selecciona una opción</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { rating: 'excelente', emoji: '😀', label: 'Excelente', color: 'from-emerald-400 to-green-500' },
                        { rating: 'normal', emoji: '😐', label: 'Normal', color: 'from-amber-400 to-orange-500' },
                        { rating: 'mala', emoji: '☹️', label: 'Mala', color: 'from-red-400 to-rose-500' }
                      ].map((option) => (
                        <motion.button
                          key={option.rating}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSurveySubmit(option.rating)}
                          className={`bg-gradient-to-br ${option.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
                        >
                          <div className="text-6xl mb-3">{option.emoji}</div>
                          <p className="font-bold text-lg">{option.label}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'myPerformance' && (
                  <motion.div
                    key="myPerformance"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Mi Desempeño de Hoy</h3>
                      <p className="text-gray-600">{selectedCashier?.name || 'Selecciona un colaborador'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
                        <p className="text-sm text-purple-700 uppercase tracking-wider mb-2">Puntos</p>
                        <p className="text-4xl font-black text-purple-900">{myStats.total}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-6 border-2 border-emerald-200">
                        <p className="text-sm text-emerald-700 uppercase tracking-wider mb-2">% Excelentes</p>
                        <p className="text-4xl font-black text-emerald-900">{myStats.excellent}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-200">
                        <p className="text-sm text-amber-700 uppercase tracking-wider mb-2">Ventas Sugestivas</p>
                        <p className="text-4xl font-black text-amber-900">{myStats.suggested}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-200">
                        <p className="text-sm text-blue-700 uppercase tracking-wider mb-2">Encuestas</p>
                        <p className="text-4xl font-black text-blue-900">{myStats.surveys}</p>
                      </div>
                    </div>

                    {myStats.streak > 0 && (
                      <div className="bg-gradient-to-r from-orange-400 to-rose-400 rounded-xl p-4 text-center">
                        <p className="text-white font-bold">🔥 Racha de {myStats.streak} días consecutivos</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentScreen === 'ranking' && (
                  <motion.div
                    key="ranking"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Ranking Semanal */}
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-4">🏆 Top 5 Semanal</h3>
                      <div className="space-y-2">
                        {weeklyRanking.map((user, idx) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-center justify-between p-4 rounded-xl ${
                              user.id === selectedCashier?.id
                                ? 'bg-gradient-to-r from-pink-200 to-purple-200 border-2 border-pink-400'
                                : 'bg-white border-2 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                                idx === 0 ? 'bg-yellow-400 text-white' :
                                idx === 1 ? 'bg-gray-300 text-white' :
                                idx === 2 ? 'bg-orange-400 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-600">{user.excellentPercent}% excelentes</p>
                              </div>
                            </div>
                            <p className="text-2xl font-black text-purple-600">{user.points}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Ranking Mensual */}
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-4">📅 Top 10 Mensual</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {monthlyRanking.map((user, idx) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              user.id === selectedCashier?.id
                                ? 'bg-gradient-to-r from-pink-200 to-purple-200 border-2 border-pink-400'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                            </div>
                            <p className="text-lg font-black text-purple-600">{user.points}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'dashboard' && userRole === 'lider' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Dashboard Gerencial</h3>
                      <p className="text-gray-600">Métricas de hoy</p>
                    </div>

                    {dashboardStats && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-200">
                          <p className="text-sm text-blue-700 uppercase tracking-wider mb-2">Total Encuestas</p>
                          <p className="text-4xl font-black text-blue-900">{dashboardStats.totalSurveys}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-6 border-2 border-emerald-200">
                          <p className="text-sm text-emerald-700 uppercase tracking-wider mb-2">% Excelente</p>
                          <p className="text-4xl font-black text-emerald-900">{dashboardStats.excellentPercent}%</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
                          <p className="text-sm text-purple-700 uppercase tracking-wider mb-2">Puntos Promedio</p>
                          <p className="text-4xl font-black text-purple-900">{dashboardStats.avgPoints}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-200">
                          <p className="text-sm text-amber-700 uppercase tracking-wider mb-2">% Con Sugeridos</p>
                          <p className="text-4xl font-black text-amber-900">{dashboardStats.suggestedPercent}%</p>
                        </div>
                      </div>
                    )}

                    {/* Ranking del día por anfitrión */}
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-3">Ranking de Hoy</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(
                          todayExperiences.reduce((acc, exp) => {
                            if (!acc[exp.cashier_id]) {
                              acc[exp.cashier_id] = { name: exp.cashier_name, points: 0 };
                            }
                            acc[exp.cashier_id].points += exp.total_points;
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b[1].points - a[1].points)
                          .map(([id, data], idx) => (
                            <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-semibold text-gray-700">{data.name}</span>
                              <span className="text-lg font-black text-purple-600">{data.points}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}