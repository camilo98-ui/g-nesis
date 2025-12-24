import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, TrendingUp, Award, Sparkles, ChevronRight, LogOut, Calendar, TrendingDown, Zap, Trophy, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ExperienciaPopsyModal({ onClose, storeId, userRole }) {
  const [currentScreen, setCurrentScreen] = useState('login'); // login, validation, survey, profile, ranking, dashboard
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedInvoice, setValidatedInvoice] = useState(null);
  const [sessionCashier, setSessionCashier] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Cargar sesión guardada
  useEffect(() => {
    const savedSession = localStorage.getItem(`experienciaPopsy_${storeId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setSessionCashier(session);
      setCurrentScreen('validation');
    }
  }, [storeId]);

  // Queries
  const { data: todayExperiences = [] } = useQuery({
    queryKey: ['experiences', storeId, today],
    queryFn: () => base44.entities.CustomerExperience.filter({ store_id: storeId, date: today }),
    enabled: !!storeId
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const { data: storePasswords = [] } = useQuery({
    queryKey: ['storePasswords'],
    queryFn: () => base44.entities.StorePassword.list()
  });

  const { data: rolePasswords = [] } = useQuery({
    queryKey: ['rolePasswords'],
    queryFn: () => base44.entities.RolePassword.list()
  });

  const { data: cashierDailyPoints } = useQuery({
    queryKey: ['cashierDailyPoints', sessionCashier?.id, today],
    queryFn: () => base44.entities.UserDailyPoints.filter({ cashier_id: sessionCashier?.id, date: today }),
    enabled: !!sessionCashier
  });

  const { data: cashierExperiences = [] } = useQuery({
    queryKey: ['cashierExperiences', sessionCashier?.id, storeId],
    queryFn: async () => {
      const all = await base44.entities.CustomerExperience.list();
      return all.filter(e => e.store_id === storeId && e.cashier_id === sessionCashier?.id);
    },
    enabled: !!sessionCashier
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

  // Mutations
  const createExperienceMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerExperience.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['cashierDailyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['cashierExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyExperiences'] });
    }
  });

  const updateDailyPointsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserDailyPoints.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashierDailyPoints'] });
    }
  });

  const createDailyPointsMutation = useMutation({
    mutationFn: (data) => base44.entities.UserDailyPoints.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashierDailyPoints'] });
    }
  });

  // Login de anfitrión
  const handleLogin = () => {
    if (!loginPassword.trim()) {
      setLoginError('Ingresa tu contraseña');
      return;
    }

    // Líder puede usar contraseña de tienda
    if (userRole === 'lider') {
      const storePassword = storePasswords.find(p => p.store_code === storeId);
      if (loginPassword === storePassword?.password) {
        const defaultCashier = { id: 'lider_' + storeId, name: 'Líder de Tienda', position: 'Líder' };
        setSessionCashier(defaultCashier);
        localStorage.setItem(`experienciaPopsy_${storeId}`, JSON.stringify(defaultCashier));
        setCurrentScreen('validation');
        toast.success('Bienvenido, Líder');
        return;
      }
    }

    // Embajadores con contraseña de rol o personal
    const rolePassword = rolePasswords.find(p => p.store_code === storeId && p.role === 'embajador');
    
    // Buscar cajero que coincida
    const matchingCashier = allCashiers.find(c => {
      // Opción 1: Contraseña específica del cajero (si se implementa)
      // Opción 2: Contraseña de rol embajador
      return rolePassword && loginPassword === rolePassword.password;
    });

    if (matchingCashier || (rolePassword && loginPassword === rolePassword.password)) {
      const cashier = matchingCashier || allCashiers[0];
      setSessionCashier(cashier);
      localStorage.setItem(`experienciaPopsy_${storeId}`, JSON.stringify(cashier));
      setCurrentScreen('validation');
      toast.success(`Bienvenido, ${cashier.name}`);
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem(`experienciaPopsy_${storeId}`);
    setSessionCashier(null);
    setCurrentScreen('login');
    setLoginPassword('');
    toast.success('Sesión cerrada');
  };

  // Validación de factura
  const handleValidateInvoice = async () => {
    if (!invoiceSerial.trim()) {
      toast.error('Ingresa un número de factura');
      return;
    }

    setValidating(true);

    try {
      const alreadyUsed = todayExperiences.some(e => e.invoice_serial === invoiceSerial);
      
      if (alreadyUsed) {
        toast.error('Esta factura ya fue evaluada hoy. ¡Gracias por tu opinión!');
        setValidating(false);
        setTimeout(() => setInvoiceSerial(''), 2000);
        return;
      }

      setValidatedInvoice({ invoice_number: invoiceSerial, suggested_items: 0 });
      setCurrentScreen('survey');
      toast.success('¡Factura válida! Comparte tu experiencia');
    } catch (error) {
      toast.error('Error al validar factura');
      console.error(error);
    }

    setValidating(false);
  };

  // Enviar encuesta
  const handleSurveySubmit = async (rating) => {
    const ratingMessages = {
      excelente: '¡Gracias por tu excelente calificación! 🎉',
      normal: 'Gracias por tu opinión, trabajaremos para mejorar 💪',
      mala: 'Lamentamos tu experiencia, trabajaremos para ser mejores 🙏'
    };

    toast.success(ratingMessages[rating]);

    const experiencePoints = rating === 'excelente' ? 8 : rating === 'normal' ? 4 : 0;
    const suggestedProducts = validatedInvoice?.suggested_items || 0;
    const suggestedSalesPoints = Math.min(suggestedProducts * 2, 20);
    const totalPoints = experiencePoints + suggestedSalesPoints;

    await createExperienceMutation.mutateAsync({
      invoice_serial: invoiceSerial,
      store_id: storeId,
      cashier_id: sessionCashier.id,
      cashier_name: sessionCashier.name,
      experience_rating: rating,
      experience_points: experiencePoints,
      suggested_sales_points: suggestedSalesPoints,
      total_points: totalPoints,
      date: today,
      has_suggested_products: suggestedProducts > 0,
      suggested_products_count: suggestedProducts
    });

    const existingPoints = cashierDailyPoints?.[0];
    
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
        cashier_id: sessionCashier.id,
        cashier_name: sessionCashier.name,
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

    setTimeout(() => {
      setInvoiceSerial('');
      setValidatedInvoice(null);
      setCurrentScreen('validation');
    }, 2000);
  };

  // Stats del anfitrión
  const cashierStats = useMemo(() => {
    const points = cashierDailyPoints?.[0];
    if (!points) return { total: 0, excellent: 0, suggested: 0, surveys: 0, excellentPercent: 0 };

    const excellentPercent = points.total_surveys > 0 
      ? ((points.excellent_count / points.total_surveys) * 100).toFixed(0)
      : 0;

    return {
      total: points.total_points,
      excellent: points.excellent_count,
      normal: points.normal_count,
      bad: points.bad_count,
      suggested: points.suggested_sales_points,
      surveys: points.total_surveys,
      excellentPercent,
      streak: points.consecutive_days_streak || 0
    };
  }, [cashierDailyPoints]);

  // Historial por día (últimos 30 días)
  const dailyHistory = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: new Date(new Date().setDate(new Date().getDate() - 29)),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExperiences = cashierExperiences.filter(e => e.date === dayStr);
      
      const totalPoints = dayExperiences.reduce((sum, e) => sum + e.total_points, 0);
      const excellent = dayExperiences.filter(e => e.experience_rating === 'excelente').length;
      const total = dayExperiences.length;

      return {
        date: format(day, 'dd/MM'),
        fullDate: dayStr,
        points: totalPoints,
        surveys: total,
        excellentPercent: total > 0 ? ((excellent / total) * 100).toFixed(0) : 0
      };
    }).filter(d => d.surveys > 0);
  }, [cashierExperiences]);

  // Rankings
  const weeklyRanking = useMemo(() => {
    const userPoints = {};
    weeklyExperiences.forEach(exp => {
      if (!userPoints[exp.cashier_id]) {
        userPoints[exp.cashier_id] = { name: exp.cashier_name, points: 0, surveys: 0, excellent: 0 };
      }
      userPoints[exp.cashier_id].points += exp.total_points;
      userPoints[exp.cashier_id].surveys += 1;
      if (exp.experience_rating === 'excelente') userPoints[exp.cashier_id].excellent += 1;
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({ id, ...data, excellentPercent: data.surveys > 0 ? ((data.excellent / data.surveys) * 100).toFixed(0) : 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [weeklyExperiences]);

  const monthlyRanking = useMemo(() => {
    const userPoints = {};
    monthlyExperiences.forEach(exp => {
      if (!userPoints[exp.cashier_id]) {
        userPoints[exp.cashier_id] = { name: exp.cashier_name, points: 0, surveys: 0, excellent: 0 };
      }
      userPoints[exp.cashier_id].points += exp.total_points;
      userPoints[exp.cashier_id].surveys += 1;
      if (exp.experience_rating === 'excelente') userPoints[exp.cashier_id].excellent += 1;
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({ id, ...data, excellentPercent: data.surveys > 0 ? ((data.excellent / data.surveys) * 100).toFixed(0) : 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [monthlyExperiences]);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    if (userRole !== 'lider') return null;

    const totalSurveys = todayExperiences.length;
    const excellent = todayExperiences.filter(e => e.experience_rating === 'excelente').length;
    const excellentPercent = totalSurveys > 0 ? ((excellent / totalSurveys) * 100).toFixed(1) : 0;
    const avgPoints = totalSurveys > 0 ? (todayExperiences.reduce((sum, e) => sum + e.total_points, 0) / totalSurveys).toFixed(1) : 0;
    const withSuggested = todayExperiences.filter(e => e.has_suggested_products).length;
    const suggestedPercent = totalSurveys > 0 ? ((withSuggested / totalSurveys) * 100).toFixed(1) : 0;

    return { totalSurveys, excellentPercent, avgPoints, suggestedPercent };
  }, [todayExperiences, userRole]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] overflow-y-auto"
      >
        <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 p-4 sm:p-6 relative overflow-hidden">
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Experiencia Popsy</h2>
                    <p className="text-white/80 text-xs sm:text-sm">
                      {sessionCashier ? sessionCashier.name : 'Inicia sesión'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sessionCashier && (
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/20 text-xs sm:text-sm"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Cerrar Sesión</span>
                    </Button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              {sessionCashier && (
                <div className="mt-4 sm:mt-6 flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'validation', label: 'Encuesta', icon: Star },
                    { id: 'profile', label: 'Mi Perfil', icon: TrendingUp },
                    { id: 'ranking', label: 'Ranking', icon: Award },
                    ...(userRole === 'lider' ? [{ id: 'dashboard', label: 'Dashboard', icon: Sparkles }] : [])
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCurrentScreen(tab.id)}
                        className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap text-xs sm:text-sm ${
                          currentScreen === tab.id
                            ? 'bg-white text-pink-600 shadow-lg font-bold'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline font-bold">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
              <AnimatePresence mode="wait">
                {/* LOGIN SCREEN */}
                {currentScreen === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Iniciar Turno</h3>
                      <p className="text-slate-400 text-sm sm:text-base">Ingresa tu contraseña para comenzar</p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      
                      {loginError && (
                        <p className="text-red-400 text-sm text-center">{loginError}</p>
                      )}

                      <Button
                        onClick={handleLogin}
                        className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg"
                      >
                        Iniciar Turno
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* VALIDATION SCREEN */}
                {currentScreen === 'validation' && sessionCashier && (
                  <motion.div
                    key="validation"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Validar Factura</h3>
                      <p className="text-slate-400">Ingresa el número de factura</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      <Input
                        placeholder="Número de factura"
                        value={invoiceSerial}
                        onChange={(e) => setInvoiceSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateInvoice()}
                        className="h-14 text-lg text-center font-bold bg-white/10 border-white/20 text-white placeholder:text-white/50"
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
                      <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/30 max-w-md mx-auto">
                        <p className="text-sm text-center text-emerald-300">
                          <strong>{todayExperiences.length}</strong> encuestas completadas hoy ✨
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* SURVEY SCREEN - FULLSCREEN */}
                {currentScreen === 'survey' && (
                  <motion.div
                    key="survey"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mb-12"
                    >
                      <h3 className="text-3xl sm:text-5xl font-black text-white mb-4">¿Cómo fue tu experiencia?</h3>
                      <p className="text-slate-300 text-lg sm:text-xl">Selecciona una opción</p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl">
                      {[
                        { rating: 'excelente', emoji: '😀', label: 'Excelente', color: 'from-emerald-400 to-green-500', delay: 0.3 },
                        { rating: 'normal', emoji: '😐', label: 'Normal', color: 'from-amber-400 to-orange-500', delay: 0.4 },
                        { rating: 'mala', emoji: '☹️', label: 'Mala', color: 'from-red-400 to-rose-500', delay: 0.5 }
                      ].map((option) => (
                        <motion.button
                          key={option.rating}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: option.delay, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1, y: -10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSurveySubmit(option.rating)}
                          className={`bg-gradient-to-br ${option.color} rounded-3xl p-8 sm:p-12 text-white shadow-2xl hover:shadow-3xl transition-all aspect-square flex flex-col items-center justify-center`}
                        >
                          <motion.div 
                            className="text-7xl sm:text-9xl mb-4"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {option.emoji}
                          </motion.div>
                          <p className="font-black text-2xl sm:text-3xl">{option.label}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PROFILE SCREEN */}
                {currentScreen === 'profile' && sessionCashier && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Header del Perfil */}
                    <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-pink-500/30">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-black text-2xl">
                          {sessionCashier.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white">{sessionCashier.name}</h3>
                          <p className="text-slate-400">{sessionCashier.position || 'Anfitrión'}</p>
                        </div>
                      </div>

                      {/* KPIs del día */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <Trophy className="w-5 h-5 text-purple-400 mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Puntos Hoy</p>
                          <p className="text-2xl font-black text-white">{cashierStats.total}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <Target className="w-5 h-5 text-emerald-400 mb-2" />
                          <p className="text-xs text-slate-400 mb-1">% Excelentes</p>
                          <p className="text-2xl font-black text-emerald-400">{cashierStats.excellentPercent}%</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <Zap className="w-5 h-5 text-amber-400 mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Sugeridos</p>
                          <p className="text-2xl font-black text-amber-400">{cashierStats.suggested}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <Star className="w-5 h-5 text-pink-400 mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Encuestas</p>
                          <p className="text-2xl font-black text-pink-400">{cashierStats.surveys}</p>
                        </div>
                      </div>
                    </div>

                    {/* Gráfica de Desempeño */}
                    {dailyHistory.length > 0 && (
                      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-purple-400" />
                          Historial de Puntos (Últimos 30 días)
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={dailyHistory}>
                            <defs>
                              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="points" stroke="#a855f7" strokeWidth={3} fill="url(#colorPoints)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Desglose de Calificaciones */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4">Desglose de Calificaciones Hoy</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-4xl mb-2">😀</div>
                          <p className="text-2xl font-black text-emerald-400">{cashierStats.excellent}</p>
                          <p className="text-xs text-slate-400">Excelentes</p>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl mb-2">😐</div>
                          <p className="text-2xl font-black text-amber-400">{cashierStats.normal}</p>
                          <p className="text-xs text-slate-400">Normales</p>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl mb-2">☹️</div>
                          <p className="text-2xl font-black text-red-400">{cashierStats.bad}</p>
                          <p className="text-xs text-slate-400">Malas</p>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Facturas del día */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-pink-400" />
                        Encuestas de Hoy
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {cashierExperiences
                          .filter(e => e.date === today)
                          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                          .map((exp, idx) => (
                            <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">
                                  {exp.experience_rating === 'excelente' ? '😀' : exp.experience_rating === 'normal' ? '😐' : '☹️'}
                                </div>
                                <div>
                                  <p className="text-white font-semibold text-sm">Factura #{exp.invoice_serial}</p>
                                  <p className="text-xs text-slate-400">
                                    {format(parseISO(exp.created_date), 'HH:mm', { locale: es })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-purple-400">+{exp.total_points}</p>
                                <p className="text-xs text-slate-400">puntos</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* RANKING SCREEN */}
                {currentScreen === 'ranking' && (
                  <motion.div
                    key="ranking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Semanal */}
                    <div>
                      <h3 className="text-xl font-black text-white mb-4">🏆 Top 5 Semanal</h3>
                      <div className="space-y-2">
                        {weeklyRanking.map((user, idx) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-4 rounded-xl ${
                              user.id === sessionCashier?.id
                                ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-400'
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                                idx === 0 ? 'bg-yellow-400 text-white' :
                                idx === 1 ? 'bg-gray-300 text-white' :
                                idx === 2 ? 'bg-orange-400 text-white' :
                                'bg-white/10 text-slate-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-white">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.excellentPercent}% excelentes</p>
                              </div>
                            </div>
                            <p className="text-2xl font-black text-purple-400">{user.points}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mensual */}
                    <div>
                      <h3 className="text-xl font-black text-white mb-4">📅 Top 10 Mensual</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {monthlyRanking.map((user, idx) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              user.id === sessionCashier?.id
                                ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-400'
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-white text-sm">{user.name}</p>
                            </div>
                            <p className="text-lg font-black text-purple-400">{user.points}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DASHBOARD SCREEN */}
                {currentScreen === 'dashboard' && userRole === 'lider' && dashboardStats && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-white mb-2">Dashboard Gerencial</h3>
                      <p className="text-slate-400">Métricas de hoy</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                        <p className="text-xs text-blue-300 uppercase mb-2">Encuestas</p>
                        <p className="text-4xl font-black text-white">{dashboardStats.totalSurveys}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl p-6 border border-emerald-500/30">
                        <p className="text-xs text-emerald-300 uppercase mb-2">% Excelente</p>
                        <p className="text-4xl font-black text-white">{dashboardStats.excellentPercent}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                        <p className="text-xs text-purple-300 uppercase mb-2">Puntos Prom.</p>
                        <p className="text-4xl font-black text-white">{dashboardStats.avgPoints}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30">
                        <p className="text-xs text-amber-300 uppercase mb-2">% Sugeridos</p>
                        <p className="text-4xl font-black text-white">{dashboardStats.suggestedPercent}%</p>
                      </div>
                    </div>

                    {/* Ranking del día */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="font-bold text-white mb-3">Ranking de Hoy</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(
                          todayExperiences.reduce((acc, exp) => {
                            if (!acc[exp.cashier_id]) acc[exp.cashier_id] = { name: exp.cashier_name, points: 0 };
                            acc[exp.cashier_id].points += exp.total_points;
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b[1].points - a[1].points)
                          .map(([id, data], idx) => (
                            <div key={id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-sm font-semibold text-white">{data.name}</span>
                              <span className="text-lg font-black text-purple-400">{data.points}</span>
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