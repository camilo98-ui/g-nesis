import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, ChevronRight, Lock, Eye, EyeOff, TrendingUp, Award, Star, Trophy, Target, Calendar, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const RatingCard = ({ rating, emoji, color, gradient, label, onClick, disabled }) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={onClick}
      disabled={disabled}
      className={`${gradient} rounded-[40px] p-12 sm:p-16 shadow-2xl hover:shadow-3xl transition-all aspect-square flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white/50`}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="text-[120px] sm:text-[150px] mb-6"
      >
        {emoji}
      </motion.div>
      <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">{label}</p>
    </motion.button>
  );
};

const SuccessAnimation = ({ rating, message, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const emojis = {
    excelente: '😀',
    normal: '😐',
    mala: '☹️'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center z-50 p-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="bg-white/20 backdrop-blur-xl rounded-full w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-8 mx-auto shadow-2xl"
        >
          <Check className="w-20 h-20 sm:w-24 sm:h-24 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-8xl sm:text-9xl mb-8"
        >
          {emojis[rating]}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-4xl sm:text-5xl font-black text-white mb-6 drop-shadow-2xl"
        >
          ¡Guardado!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl sm:text-3xl text-white font-bold max-w-3xl leading-relaxed px-8"
        >
          {message}
        </motion.p>

        {/* Confetti decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 100, 
                rotate: Math.random() * 360,
                opacity: 0
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                delay: Math.random() * 0.5,
                ease: "linear"
              }}
              className="absolute w-4 h-4 rounded-full"
              style={{ 
                backgroundColor: ['#fff', '#fef3c7', '#fbcfe8', '#ddd6fe'][i % 4] 
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default function CustomerExperienceModal({ onClose, storeId, userRole }) {
  const [currentScreen, setCurrentScreen] = useState('selectUser'); // selectUser, login, validation, survey, profile, ranking
  const [status, setStatus] = useState('idle'); // idle, saving, success
  const [selectedRating, setSelectedRating] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionCashier, setSessionCashier] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [validating, setValidating] = useState(false);

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Cargar sesión guardada
  useEffect(() => {
    const savedSession = localStorage.getItem(`customerExperience_${storeId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setSessionCashier(session);
      setSelectedUser(session);
      setCurrentScreen('validation');
    }
  }, [storeId]);

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const { data: cashierPasswords = [] } = useQuery({
    queryKey: ['cashierPasswords', storeId],
    queryFn: async () => {
      const all = await base44.entities.RolePassword.list();
      return all.filter(p => p.store_code === storeId);
    },
    enabled: !!storeId
  });

  const { data: todayFeedback = [] } = useQuery({
    queryKey: ['customerFeedback', storeId, today],
    queryFn: async () => {
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date === today);
    },
    enabled: !!storeId
  });

  const { data: allStoreFeedback = [] } = useQuery({
    queryKey: ['allStoreFeedback', storeId],
    queryFn: async () => {
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId);
    },
    enabled: !!storeId && !!sessionCashier
  });

  const { data: weeklyFeedback = [] } = useQuery({
    queryKey: ['weeklyFeedback', storeId],
    queryFn: async () => {
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date >= start && f.date <= end);
    },
    enabled: !!storeId && currentScreen === 'ranking'
  });

  const { data: monthlyFeedback = [] } = useQuery({
    queryKey: ['monthlyFeedback', storeId],
    queryFn: async () => {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date >= start && f.date <= end);
    },
    enabled: !!storeId && currentScreen === 'ranking'
  });

  const saveFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerFeedback'] });
      setStatus('success');
    },
    onError: () => {
      setStatus('idle');
    }
  });

  // Login de anfitrión
  const handleLogin = () => {
    const userPassword = cashierPasswords.find(p => p.role === selectedUser?.id);
    
    if (!userPassword) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`customerExperience_${storeId}`, JSON.stringify(selectedUser));
      setCurrentScreen('validation');
      setLoginPassword('');
      setLoginError('');
      toast.success(`Bienvenido, ${selectedUser.name}`);
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Ingresa tu contraseña');
      return;
    }
    
    if (loginPassword === userPassword.password) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`customerExperience_${storeId}`, JSON.stringify(selectedUser));
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
    localStorage.removeItem(`customerExperience_${storeId}`);
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
      const alreadyUsed = todayFeedback.some(e => e.device === invoiceSerial);
      
      if (alreadyUsed) {
        toast.error('Esta factura ya fue evaluada hoy. ¡Gracias por tu opinión!');
        setValidating(false);
        setTimeout(() => setInvoiceSerial(''), 2000);
        return;
      }

      setCurrentScreen('survey');
      toast.success('¡Factura válida! Comparte tu experiencia');
    } catch (error) {
      toast.error('Error al validar factura');
      console.error(error);
    }

    setValidating(false);
  };

  const handleRatingClick = (rating) => {
    if (status !== 'idle') return;

    const currentInvoice = invoiceSerial;
    
    setStatus('saving');
    setSelectedRating(rating);

    const ratingConfig = {
      excelente: {
        nps: 'promotor',
        points: 10,
        message: '¡Gracias! Nos encanta saber que tu experiencia fue excelente 💚'
      },
      normal: {
        nps: 'pasivo',
        points: 3,
        message: '¡Gracias por tu opinión! Seguiremos mejorando para ti 🧡'
      },
      mala: {
        nps: 'detractor',
        points: -5,
        message: 'Gracias por contarnos. Vamos a revisar tu experiencia para hacerlo mejor ❤️'
      }
    };

    const config = ratingConfig[rating];
    setSuccessMessage(config.message);

    const now = new Date();
    saveFeedbackMutation.mutate({
      store_id: storeId,
      rating: rating,
      nps_type: config.nps,
      points: config.points,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
      device: currentInvoice
    });
  };

  const handleSuccessComplete = () => {
    setStatus('idle');
    setSelectedRating(null);
    setSuccessMessage('');
    setInvoiceSerial('');
    setCurrentScreen('validation');
  };

  // Stats del cajero
  const cashierStats = useMemo(() => {
    if (!sessionCashier) return { totalPoints: 0, totalSurveys: 0, promotores: 0, pasivos: 0, detractores: 0, nps: 0 };
    
    const cashierFeedback = allStoreFeedback.filter(f => f.device && f.device.includes(sessionCashier.id));
    const totalPoints = cashierFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
    const totalSurveys = cashierFeedback.length;
    
    const npsData = cashierFeedback.reduce((acc, f) => {
      acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
      return acc;
    }, {});
    
    const nps = totalSurveys > 0 
      ? Math.round((((npsData.promotor || 0) - (npsData.detractor || 0)) / totalSurveys) * 100)
      : 0;
    
    return {
      totalPoints,
      totalSurveys,
      promotores: npsData.promotor || 0,
      pasivos: npsData.pasivo || 0,
      detractores: npsData.detractor || 0,
      nps
    };
  }, [sessionCashier, allStoreFeedback]);

  // Historial diario (últimos 30 días)
  const dailyHistory = useMemo(() => {
    if (!sessionCashier) return [];
    
    const last30Days = eachDayOfInterval({
      start: new Date(new Date().setDate(new Date().getDate() - 29)),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayFeedback = allStoreFeedback.filter(f => f.date === dayStr && f.device && f.device.includes(sessionCashier.id));
      
      const points = dayFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
      const promotores = dayFeedback.filter(f => f.nps_type === 'promotor').length;
      
      return {
        date: format(day, 'dd/MM'),
        fullDate: dayStr,
        points,
        surveys: dayFeedback.length,
        promotorPercent: dayFeedback.length > 0 ? ((promotores / dayFeedback.length) * 100).toFixed(0) : 0
      };
    }).filter(d => d.surveys > 0);
  }, [sessionCashier, allStoreFeedback]);

  // Rankings
  const weeklyRanking = useMemo(() => {
    const userPoints = {};
    weeklyFeedback.forEach(f => {
      const userId = f.device || 'unknown';
      if (!userPoints[userId]) userPoints[userId] = { name: 'Usuario', points: 0, surveys: 0, promotores: 0 };
      userPoints[userId].points += f.points || 0;
      userPoints[userId].surveys += 1;
      if (f.nps_type === 'promotor') userPoints[userId].promotores += 1;
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        promotorPercent: data.surveys > 0 ? ((data.promotores / data.surveys) * 100).toFixed(0) : 0 
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [weeklyFeedback]);

  const monthlyRanking = useMemo(() => {
    const userPoints = {};
    monthlyFeedback.forEach(f => {
      const userId = f.device || 'unknown';
      if (!userPoints[userId]) userPoints[userId] = { name: 'Usuario', points: 0, surveys: 0, promotores: 0 };
      userPoints[userId].points += f.points || 0;
      userPoints[userId].surveys += 1;
      if (f.nps_type === 'promotor') userPoints[userId].promotores += 1;
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        promotorPercent: data.surveys > 0 ? ((data.promotores / data.surveys) * 100).toFixed(0) : 0 
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [monthlyFeedback]);

  const totalToday = todayFeedback.length;
  const npsData = todayFeedback.reduce((acc, f) => {
    acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
    return acc;
  }, {});

  const npsScore = totalToday > 0 
    ? Math.round((((npsData.promotor || 0) - (npsData.detractor || 0)) / totalToday) * 100)
    : 0;

  // SELECT USER SCREEN
  if (currentScreen === 'selectUser') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-3xl font-black text-slate-800 mb-6 text-center">¿Quién atendió al cliente?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allCashiers.map((cashier) => (
              <motion.button
                key={cashier.id}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedUser(cashier);
                  setCurrentScreen('login');
                }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {cashier.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-slate-900">{cashier.name}</p>
                    <p className="text-sm text-slate-600">{cashier.position || 'Anfitrión'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-500" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // LOGIN SCREEN
  if (currentScreen === 'login' && selectedUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 z-50 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
              {selectedUser.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-black text-slate-800">{selectedUser.name}</h3>
            <p className="text-slate-600">{selectedUser.position || 'Anfitrión'}</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="h-14 text-lg pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {loginError && (
              <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>
            )}

            <Button onClick={handleLogin} className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg">
              Iniciar
            </Button>

            <Button onClick={() => setCurrentScreen('selectUser')} variant="ghost" className="w-full">
              ← Cambiar usuario
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // VALIDATION/PROFILE/RANKING SCREENS
  if ((currentScreen === 'validation' || currentScreen === 'profile' || currentScreen === 'ranking') && sessionCashier) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 z-50 overflow-y-auto"
      >
        <div className="min-h-full flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 relative overflow-hidden">
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
                    <h2 className="text-2xl font-black text-white">Experiencia Cliente</h2>
                    <p className="text-white/80 text-sm">{sessionCashier.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20">
                    <LogOut className="w-4 h-4 mr-1" />
                    Cerrar
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'validation', label: 'Encuesta', icon: Star },
                  { id: 'profile', label: 'Mi Perfil', icon: TrendingUp },
                  { id: 'ranking', label: 'Ranking', icon: Award }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentScreen(tab.id)}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                        currentScreen === tab.id
                          ? 'bg-white text-purple-600 shadow-lg font-bold'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* VALIDATION TAB */}
                {currentScreen === 'validation' && (
                  <motion.div key="validation" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Validar Factura</h3>
                      <p className="text-slate-600">Ingresa el número de factura del cliente</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
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
                        className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg"
                      >
                        {validating ? 'Validando...' : 'Continuar'}
                      </Button>
                    </div>

                    {todayFeedback.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 max-w-md mx-auto">
                        <p className="text-sm text-center text-emerald-700 font-semibold">
                          <strong>{todayFeedback.length}</strong> encuestas hoy ✨
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* PROFILE TAB */}
                {currentScreen === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    {/* Header del Perfil */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                          {sessionCashier.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-800">{sessionCashier.name}</h3>
                          <p className="text-slate-600">{sessionCashier.position || 'Anfitrión'}</p>
                        </div>
                      </div>

                      {/* KPIs del perfil */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                          <Trophy className="w-5 h-5 text-purple-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Puntos Total</p>
                          <p className="text-2xl font-black text-slate-800">{cashierStats.totalPoints}</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                          <Target className="w-5 h-5 text-emerald-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">NPS Score</p>
                          <p className="text-2xl font-black text-emerald-600">{cashierStats.nps}</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                          <Star className="w-5 h-5 text-amber-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Promotores</p>
                          <p className="text-2xl font-black text-amber-600">{cashierStats.promotores}</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                          <Calendar className="w-5 h-5 text-blue-500 mb-2" />
                          <p className="text-xs text-slate-600 mb-1">Encuestas</p>
                          <p className="text-2xl font-black text-blue-600">{cashierStats.totalSurveys}</p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Gráfica de Desempeño */}
                    {dailyHistory.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-purple-500" />
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
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="points" stroke="#a855f7" strokeWidth={3} fill="url(#colorPoints)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Desglose NPS */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">Desglose NPS</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-4xl mb-2">😀</div>
                          <p className="text-2xl font-black text-emerald-500">{cashierStats.promotores}</p>
                          <p className="text-xs text-slate-500">Promotores</p>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl mb-2">😐</div>
                          <p className="text-2xl font-black text-amber-500">{cashierStats.pasivos}</p>
                          <p className="text-xs text-slate-500">Pasivos</p>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl mb-2">☹️</div>
                          <p className="text-2xl font-black text-red-500">{cashierStats.detractores}</p>
                          <p className="text-xs text-slate-500">Detractores</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* RANKING TAB */}
                {currentScreen === 'ranking' && (
                  <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Semanal */}
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">🏆 Top 5 Semanal</h3>
                      <div className="space-y-2">
                        {weeklyRanking.map((user, idx) => (
                          <motion.div
                            key={user.id}
                            whileHover={{ scale: 1.02, x: 3 }}
                            className={`flex items-center justify-between p-4 rounded-xl ${
                              user.id.includes(sessionCashier?.id)
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                                idx === 0 ? 'bg-yellow-400 text-white' :
                                idx === 1 ? 'bg-gray-300 text-white' :
                                idx === 2 ? 'bg-orange-400 text-white' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.promotorPercent}% promotores</p>
                              </div>
                            </div>
                            <p className="text-2xl font-black text-purple-600">{user.points}</p>
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
                              user.id.includes(sessionCashier?.id)
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                            </div>
                            <p className="text-lg font-black text-purple-600">{user.points}</p>
                          </motion.div>
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
    );
  }

  // SURVEY SCREEN
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 z-50 overflow-hidden"
        onClick={status === 'idle' ? undefined : undefined}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
                x: [0, Math.random() * 50 - 25, 0],
                y: [0, Math.random() * 50 - 25, 0],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 h-full flex flex-col items-center justify-center p-6 sm:p-12"
        >
          {/* Close button */}
          {status === 'idle' && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-7 h-7 text-white" />
            </motion.button>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              ✨
            </motion.div>
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 drop-shadow-2xl">
              ¿Cómo fue tu experiencia?
            </h1>
            <p className="text-2xl sm:text-3xl text-white/80 font-medium">
              Selecciona una opción
            </p>
          </motion.div>

          {/* Rating Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-6xl w-full mb-8">
            <RatingCard
              rating="excelente"
              emoji="😀"
              color="emerald"
              gradient="bg-gradient-to-br from-emerald-400 via-green-400 to-teal-500"
              label="Excelente"
              onClick={() => handleRatingClick('excelente')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="normal"
              emoji="😐"
              color="amber"
              gradient="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500"
              label="Normal"
              onClick={() => handleRatingClick('normal')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="mala"
              emoji="☹️"
              color="red"
              gradient="bg-gradient-to-br from-red-400 via-rose-400 to-pink-500"
              label="Mala"
              onClick={() => handleRatingClick('mala')}
              disabled={status !== 'idle'}
            />
          </div>

          {/* Stats (pequeño, discreto) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-white/40 text-sm"
          >
            <p>Hoy: {totalToday} opiniones · NPS: {npsScore}</p>
          </motion.div>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {status === 'success' && (
            <SuccessAnimation
              rating={selectedRating}
              message={successMessage}
              onComplete={handleSuccessComplete}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}