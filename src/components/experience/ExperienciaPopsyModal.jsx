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
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function SurveyButton({ rating, emoji, hoverEmoji, label, color, delay, message, onSubmit }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        toast.success(message, { duration: 3000 });
        onSubmit(rating);
      }}
      className={`bg-gradient-to-br ${color} rounded-3xl p-10 sm:p-16 text-white shadow-2xl hover:shadow-3xl transition-all aspect-square flex flex-col items-center justify-center`}
    >
      <motion.div 
        className="text-8xl sm:text-9xl mb-6"
        animate={{ 
          scale: isHovered ? [1, 1.2, 1] : 1,
          rotate: isHovered ? [0, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {isHovered ? hoverEmoji : emoji}
      </motion.div>
      <p className="font-black text-3xl sm:text-4xl">{label}</p>
    </motion.button>
  );
}

export default function ExperienciaPopsyModal({ onClose, storeId, userRole }) {
  const [currentScreen, setCurrentScreen] = useState('selectUser'); // selectUser, login, validation, survey, profile, ranking, dashboard, setPassword
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedInvoice, setValidatedInvoice] = useState(null);
  const [sessionCashier, setSessionCashier] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Cargar sesión guardada
  useEffect(() => {
    const savedSession = localStorage.getItem(`experienciaPopsy_${storeId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setSessionCashier(session);
      setSelectedUser(session);
      setCurrentScreen('validation');
    }
  }, [storeId]);

  const { data: cashierPasswords = [] } = useQuery({
    queryKey: ['cashierPasswords', storeId],
    queryFn: async () => {
      const all = await base44.entities.RolePassword.list();
      return all.filter(p => p.store_code === storeId);
    },
    enabled: !!storeId
  });

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
      const all = await base44.entities.CustomerExperience.list('-created_date');
      return all.filter(e => e.store_id === storeId && e.cashier_id === sessionCashier?.id);
    },
    enabled: !!sessionCashier
  });

  const { data: cashierBadges = [] } = useQuery({
    queryKey: ['cashierBadges', sessionCashier?.id],
    queryFn: async () => {
      const all = await base44.entities.ExperienceBadge.list('-earned_date');
      return all.filter(b => b.cashier_id === sessionCashier?.id);
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

  // Configurar contraseña del usuario
  const savePasswordMutation = useMutation({
    mutationFn: async ({ cashierId, password }) => {
      const existing = cashierPasswords.find(p => p.role === cashierId);
      if (existing) {
        return base44.entities.RolePassword.update(existing.id, { password });
      } else {
        return base44.entities.RolePassword.create({ 
          store_code: storeId, 
          role: cashierId, 
          password 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashierPasswords'] });
      toast.success('Contraseña guardada exitosamente');
      setCurrentScreen('login');
    }
  });

  const handleSavePassword = () => {
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    savePasswordMutation.mutate({ cashierId: selectedUser.id, password: newPassword });
  };

  // Login de anfitrión
  const handleLogin = () => {
    // Buscar contraseña del usuario seleccionado
    const userPassword = cashierPasswords.find(p => p.role === selectedUser?.id);
    
    // Si no tiene contraseña configurada, permitir acceso sin contraseña
    if (!userPassword) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`experienciaPopsy_${storeId}`, JSON.stringify(selectedUser));
      setCurrentScreen('validation');
      setLoginPassword('');
      setLoginError('');
      toast.success(`Bienvenido, ${selectedUser.name}`);
      return;
    }

    // Si tiene contraseña, validar
    if (!loginPassword.trim()) {
      setLoginError('Ingresa tu contraseña');
      return;
    }
    
    if (loginPassword === userPassword.password) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`experienciaPopsy_${storeId}`, JSON.stringify(selectedUser));
      setCurrentScreen('validation');
      setLoginPassword('');
      setLoginError('');
      toast.success(`Bienvenido, ${selectedUser.name}`);
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem(`experienciaPopsy_${storeId}`);
    setSessionCashier(null);
    setSelectedUser(null);
    setCurrentScreen('selectUser');
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
    const currentInvoice = invoiceSerial;
    const comment = customerComment.trim();
    
    setCurrentScreen('validation');
    setInvoiceSerial('');
    setValidatedInvoice(null);
    setCustomerComment('');
    setShowCommentInput(false);

    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'mañana' : hour < 18 ? 'tarde' : 'noche';

    const experiencePoints = rating === 'excelente' ? 8 : rating === 'normal' ? 4 : 0;
    const suggestedProducts = 0;
    const suggestedSalesPoints = 0;
    const totalPoints = experiencePoints + suggestedSalesPoints;

    const experienceData = {
      invoice_serial: currentInvoice,
      store_id: storeId,
      cashier_id: sessionCashier.id,
      cashier_name: sessionCashier.name,
      experience_rating: rating,
      experience_points: experiencePoints,
      suggested_sales_points: suggestedSalesPoints,
      total_points: totalPoints,
      date: today,
      has_suggested_products: suggestedProducts > 0,
      suggested_products_count: suggestedProducts,
      customer_comment: comment || undefined,
      time_of_day: timeOfDay
    };

    const existingPoints = cashierDailyPoints?.[0];
    
    try {
      if (existingPoints) {
        await Promise.all([
          createExperienceMutation.mutateAsync(experienceData),
          updateDailyPointsMutation.mutateAsync({
            id: existingPoints.id,
            data: {
              experience_points: (existingPoints.experience_points || 0) + experiencePoints,
              suggested_sales_points: (existingPoints.suggested_sales_points || 0) + suggestedSalesPoints,
              total_points: (existingPoints.total_points || 0) + totalPoints,
              excellent_count: (existingPoints.excellent_count || 0) + (rating === 'excelente' ? 1 : 0),
              normal_count: (existingPoints.normal_count || 0) + (rating === 'normal' ? 1 : 0),
              bad_count: (existingPoints.bad_count || 0) + (rating === 'mala' ? 1 : 0),
              total_surveys: (existingPoints.total_surveys || 0) + 1
            }
          })
        ]);
      } else {
        await Promise.all([
          createExperienceMutation.mutateAsync(experienceData),
          createDailyPointsMutation.mutateAsync({
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
          })
        ]);
      }

      // Check and award badges
      await checkAndAwardBadges(rating);
      
      toast.success('¡Encuesta registrada con éxito!');
    } catch (error) {
      console.error('Error saving survey:', error);
      toast.error('Error al guardar la encuesta. Intenta de nuevo.');
    }
  };

  // Sistema de insignias
  const checkAndAwardBadges = async (rating) => {
    try {
      const todayExcellent = cashierExperiences.filter(e => e.date === today && e.experience_rating === 'excelente').length + (rating === 'excelente' ? 1 : 0);
      const totalExcellent = cashierExperiences.filter(e => e.experience_rating === 'excelente').length + (rating === 'excelente' ? 1 : 0);
      const totalSurveys = cashierExperiences.length + 1;

      // Primer excelente
      if (totalExcellent === 1 && rating === 'excelente' && !cashierBadges.find(b => b.badge_type === 'primer_excelente')) {
        await base44.entities.ExperienceBadge.create({
          cashier_id: sessionCashier.id,
          badge_type: 'primer_excelente',
          earned_date: today,
          description: '¡Tu primera encuesta excelente!',
          icon: '🌟'
        });
        toast.success('🎉 ¡Insignia desbloqueada: Primera Estrella!', { duration: 5000 });
      }

      // 100 encuestas
      if (totalSurveys === 100 && !cashierBadges.find(b => b.badge_type === 'cien_encuestas')) {
        await base44.entities.ExperienceBadge.create({
          cashier_id: sessionCashier.id,
          badge_type: 'cien_encuestas',
          earned_date: today,
          description: '¡100 encuestas completadas!',
          icon: '💯'
        });
        toast.success('🎉 ¡Insignia desbloqueada: Centenario!', { duration: 5000 });
      }

      // Día perfecto (todas excelentes hoy)
      if (todayExcellent >= 5 && todayExcellent === (cashierStats.surveys + 1) && !cashierBadges.find(b => b.badge_type === 'perfecto_dia' && b.earned_date === today)) {
        await base44.entities.ExperienceBadge.create({
          cashier_id: sessionCashier.id,
          badge_type: 'perfecto_dia',
          earned_date: today,
          description: '¡Día perfecto con todas excelentes!',
          icon: '🏆'
        });
        toast.success('🎉 ¡Insignia desbloqueada: Día Perfecto!', { duration: 5000 });
      }

      queryClient.invalidateQueries({ queryKey: ['cashierBadges'] });
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Stats del anfitrión
  const cashierStats = useMemo(() => {
    const points = cashierDailyPoints?.[0];
    if (!points) return { total: 0, excellent: 0, normal: 0, bad: 0, suggested: 0, surveys: 0, excellentPercent: 0, streak: 0 };

    const excellentPercent = (points.total_surveys || 0) > 0 
      ? (((points.excellent_count || 0) / (points.total_surveys || 0)) * 100).toFixed(0)
      : 0;

    return {
      total: points.total_points || 0,
      excellent: points.excellent_count || 0,
      normal: points.normal_count || 0,
      bad: points.bad_count || 0,
      suggested: points.suggested_sales_points || 0,
      surveys: points.total_surveys || 0,
      excellentPercent,
      streak: points.consecutive_days_streak || 0
    };
  }, [cashierDailyPoints]);

  // Historial por día (últimos 30 días)
  const dailyHistory = useMemo(() => {
    if (!sessionCashier) return [];
    
    const last30Days = eachDayOfInterval({
      start: new Date(new Date().setDate(new Date().getDate() - 29)),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExperiences = cashierExperiences.filter(e => e.date === dayStr);
      
      const totalPoints = dayExperiences.reduce((sum, e) => sum + (e.total_points || 0), 0);
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
  }, [cashierExperiences, sessionCashier]);

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
            className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 p-4 sm:p-6 relative overflow-hidden">
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
                            ? 'bg-white text-blue-600 shadow-lg font-bold'
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
                {/* SELECT USER SCREEN */}
                {currentScreen === 'selectUser' && (
                  <motion.div
                    key="selectUser"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">¿Quién inicia turno hoy?</h3>
                      <p className="text-slate-600 text-sm sm:text-base">Selecciona tu nombre para continuar</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                      {allCashiers.map((cashier) => (
                        <motion.button
                          key={cashier.id}
                          whileHover={{ scale: 1.03, y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedUser(cashier);
                            setCurrentScreen('login');
                          }}
                          className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                              {cashier.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 text-lg">{cashier.name}</p>
                              <p className="text-sm text-slate-500">{cashier.position || 'Anfitrión'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-blue-500" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* LOGIN SCREEN */}
                {currentScreen === 'login' && selectedUser && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto space-y-6"
                  >
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-5 border border-blue-200 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {selectedUser.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{selectedUser.name}</p>
                          <p className="text-sm text-slate-600">{selectedUser.position || 'Anfitrión'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Ingresa tu contraseña</h3>
                      <p className="text-slate-600 text-sm sm:text-base">Para comenzar tu turno</p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="h-14 text-lg bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                      />
                      
                      {loginError && (
                        <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>
                      )}

                      <Button
                        onClick={handleLogin}
                        className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-lg shadow-lg"
                      >
                        Iniciar Turno
                      </Button>

                      <Button
                        onClick={() => setCurrentScreen('setPassword')}
                        variant="outline"
                        className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        Configurar mi contraseña
                      </Button>

                      <Button
                        onClick={() => {
                          setSelectedUser(null);
                          setCurrentScreen('selectUser');
                        }}
                        variant="ghost"
                        className="w-full text-slate-600 hover:text-slate-800"
                      >
                        ← Cambiar usuario
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* SET PASSWORD SCREEN */}
                {currentScreen === 'setPassword' && selectedUser && (
                  <motion.div
                    key="setPassword"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-md mx-auto space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Configurar Contraseña</h3>
                      <p className="text-slate-600">Para {selectedUser.name}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nueva Contraseña</label>
                        <Input
                          type="password"
                          placeholder="Ingresa contraseña"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-12 bg-white border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmar Contraseña</label>
                        <Input
                          type="password"
                          placeholder="Confirma contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 bg-white border-slate-300"
                        />
                      </div>

                      <Button
                        onClick={handleSavePassword}
                        disabled={savePasswordMutation.isPending}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold"
                      >
                        {savePasswordMutation.isPending ? 'Guardando...' : 'Guardar Contraseña'}
                      </Button>

                      <Button
                        onClick={() => setCurrentScreen('login')}
                        variant="outline"
                        className="w-full border-slate-300 text-slate-700"
                      >
                        Cancelar
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
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Validar Factura</h3>
                      <p className="text-slate-600">Ingresa el número de factura</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      <Input
                        placeholder="Número de factura"
                        value={invoiceSerial}
                        onChange={(e) => setInvoiceSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateInvoice()}
                        className="h-14 text-lg text-center font-bold bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                        disabled={validating}
                      />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleValidateInvoice}
                          disabled={validating || !invoiceSerial.trim()}
                          className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-lg shadow-lg"
                        >
                          {validating ? 'Validando...' : 'Validar Factura'}
                        </Button>
                      </motion.div>
                    </div>

                    {todayExperiences.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 max-w-md mx-auto">
                        <p className="text-sm text-center text-emerald-700 font-semibold">
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
                    className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto"
                  >
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mb-8"
                    >
                      <h3 className="text-3xl sm:text-5xl font-black text-slate-800 mb-4">¿Cómo fue tu experiencia?</h3>
                      <p className="text-slate-600 text-lg sm:text-xl">Selecciona una opción</p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl px-4 mb-6">
                      <SurveyButton 
                        rating="excelente"
                        emoji="😀"
                        hoverEmoji="🤩"
                        label="Excelente"
                        color="from-emerald-400 to-green-500"
                        delay={0.3}
                        message="¡Gracias por tu excelente opinión! 🎉✨"
                        onSubmit={handleSurveySubmit}
                      />
                      <SurveyButton 
                        rating="normal"
                        emoji="😐"
                        hoverEmoji="🙂"
                        label="Normal"
                        color="from-amber-400 to-orange-500"
                        delay={0.4}
                        message="¡Gracias por tu opinión! Seguiremos mejorando 💪"
                        onSubmit={handleSurveySubmit}
                      />
                      <SurveyButton 
                        rating="mala"
                        emoji="☹️"
                        hoverEmoji="😢"
                        label="Mala"
                        color="from-red-400 to-rose-500"
                        delay={0.5}
                        message="Gracias por tu honestidad, trabajaremos para mejorar 🙏💙"
                        onSubmit={handleSurveySubmit}
                      />
                    </div>

                    {/* Comentario opcional */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="w-full max-w-2xl px-4"
                    >
                      {!showCommentInput ? (
                        <Button
                          onClick={() => setShowCommentInput(true)}
                          variant="outline"
                          className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-blue-400 text-slate-700"
                        >
                          💬 Agregar comentario (opcional)
                        </Button>
                      ) : (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border-2 border-blue-300 shadow-lg">
                          <textarea
                            placeholder="¿Algún comentario adicional?"
                            value={customerComment}
                            onChange={(e) => setCustomerComment(e.target.value)}
                            className="w-full h-24 p-3 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 text-slate-700"
                            maxLength={200}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-500">{customerComment.length}/200</span>
                            <Button
                              onClick={() => {setShowCommentInput(false); setCustomerComment('');}}
                              variant="ghost"
                              size="sm"
                              className="text-slate-500"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
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
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                          {sessionCashier.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-800">{sessionCashier.name}</h3>
                          <p className="text-slate-600">{sessionCashier.position || 'Anfitrión'}</p>
                        </div>
                      </div>

                      {/* KPIs del día */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <Trophy className="w-5 h-5 text-indigo-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Puntos Hoy</p>
                          <p className="text-2xl font-black text-slate-800">{cashierStats.total}</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <Target className="w-5 h-5 text-emerald-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">% Excelentes</p>
                          <p className="text-2xl font-black text-emerald-600">{cashierStats.excellentPercent}%</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <Zap className="w-5 h-5 text-amber-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Sugeridos</p>
                          <p className="text-2xl font-black text-amber-600">{cashierStats.suggested}</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <Star className="w-5 h-5 text-blue-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Encuestas</p>
                          <p className="text-2xl font-black text-blue-600">{cashierStats.surveys}</p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Gráfica de Desempeño */}
                    {dailyHistory.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-indigo-500" />
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
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">Desglose de Calificaciones Hoy</h4>
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

                    {/* Insignias desbloqueadas */}
                    {cashierBadges.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-500" />
                          Insignias Desbloqueadas
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {cashierBadges.map((badge, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="bg-white rounded-xl p-3 border-2 border-amber-300 shadow-sm text-center"
                            >
                              <div className="text-3xl mb-1">{badge.icon}</div>
                              <p className="text-xs font-bold text-slate-700 leading-tight">{badge.description}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Historial detallado de encuestas */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Historial de Encuestas (Últimas 30)
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {cashierExperiences.slice(0, 30).map((exp, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`rounded-xl p-4 border-2 ${
                              exp.experience_rating === 'excelente' ? 'bg-emerald-50 border-emerald-200' :
                              exp.experience_rating === 'normal' ? 'bg-amber-50 border-amber-200' :
                              'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">
                                  {exp.experience_rating === 'excelente' ? '😀' : exp.experience_rating === 'normal' ? '😐' : '☹️'}
                                </div>
                                <div>
                                  <p className="text-slate-800 font-bold text-sm">Factura #{exp.invoice_serial}</p>
                                  <p className="text-xs text-slate-600">
                                    {format(parseISO(exp.created_date), "d 'de' MMMM, HH:mm", { locale: es })}
                                  </p>
                                  {exp.time_of_day && (
                                    <span className="text-xs text-slate-500">
                                      {exp.time_of_day === 'mañana' ? '🌅' : exp.time_of_day === 'tarde' ? '☀️' : '🌙'} {exp.time_of_day}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-black ${
                                  exp.experience_rating === 'excelente' ? 'text-emerald-600' :
                                  exp.experience_rating === 'normal' ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>+{exp.total_points}</p>
                                <p className="text-xs text-slate-500">puntos</p>
                              </div>
                            </div>
                            {/* Desglose de puntos */}
                            <div className="flex gap-3 text-xs text-slate-600 mb-2">
                              <span className="bg-white/60 px-2 py-1 rounded-lg">
                                ⭐ Experiencia: +{exp.experience_points}
                              </span>
                              {exp.suggested_sales_points > 0 && (
                                <span className="bg-white/60 px-2 py-1 rounded-lg">
                                  🎯 Sugeridos: +{exp.suggested_sales_points}
                                </span>
                              )}
                            </div>
                            {exp.customer_comment && (
                              <div className="bg-white/70 rounded-lg p-2 mt-2">
                                <p className="text-xs text-slate-700 italic">💬 "{exp.customer_comment}"</p>
                              </div>
                            )}
                          </motion.div>
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
                      <h3 className="text-xl font-black text-slate-800 mb-4">🏆 Top 5 Semanal</h3>
                      <div className="space-y-2">
                        {weeklyRanking.map((user, idx) => (
                          <motion.div
                            key={user.id}
                            whileHover={{ scale: 1.02, x: 3 }}
                            className={`flex items-center justify-between p-4 rounded-xl ${
                              user.id === sessionCashier?.id
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400'
                                : 'bg-white border border-slate-200'
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
                                <p className="font-bold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.excellentPercent}% excelentes</p>
                              </div>
                            </div>
                            <p className="text-2xl font-black text-indigo-600">{user.points}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Mensual */}
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">📅 Top 10 Mensual</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {monthlyRanking.map((user, idx) => (
                          <motion.div
                            key={user.id}
                            whileHover={{ scale: 1.02, x: 3 }}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              user.id === sessionCashier?.id
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                            </div>
                            <p className="text-lg font-black text-indigo-600">{user.points}</p>
                          </motion.div>
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
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Dashboard Gerencial</h3>
                      <p className="text-slate-600">Métricas de hoy</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                        <p className="text-xs text-blue-700 uppercase mb-2">Encuestas</p>
                        <p className="text-4xl font-black text-slate-800">{dashboardStats.totalSurveys}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-6 border border-emerald-200 shadow-sm">
                        <p className="text-xs text-emerald-700 uppercase mb-2">% Excelente</p>
                        <p className="text-4xl font-black text-slate-800">{dashboardStats.excellentPercent}%</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-6 border border-indigo-200 shadow-sm">
                        <p className="text-xs text-indigo-700 uppercase mb-2">Puntos Prom.</p>
                        <p className="text-4xl font-black text-slate-800">{dashboardStats.avgPoints}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border border-amber-200 shadow-sm">
                        <p className="text-xs text-amber-700 uppercase mb-2">% Sugeridos</p>
                        <p className="text-4xl font-black text-slate-800">{dashboardStats.suggestedPercent}%</p>
                      </motion.div>
                    </div>

                    {/* Ranking del día */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-3">Ranking de Hoy</h4>
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
                            <div key={id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-sm font-semibold text-slate-800">{data.name}</span>
                              <span className="text-lg font-black text-indigo-600">{data.points}</span>
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