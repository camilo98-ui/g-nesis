import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Eye, EyeOff, TrendingUp, Award, Star, Trophy, Target, Calendar, LogOut, Plus, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import FloatingIceCreams from './FloatingIceCreams';
import WelcomeGreeting from './WelcomeGreeting';

const ModernEmoji = ({ type, size = 120 }) => {
  const emojis = {
    excelente: (
      <motion.div 
        className="relative" 
        style={{ width: size, height: size }}
        animate={{ 
          rotate: [0, -5, 5, -3, 3, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="face-excellent">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFC107" />
              <stop offset="100%" stopColor="#FF6B9D" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Face */}
          <motion.circle 
            cx="60" cy="60" r="50" 
            fill="url(#face-excellent)" 
            filter="url(#glow)"
          />
          
          {/* Sparkles */}
          <motion.g
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          >
            <circle cx="25" cy="30" r="3" fill="#fff" opacity="0.8"/>
          </motion.g>
          <motion.g
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          >
            <circle cx="95" cy="35" r="2.5" fill="#fff" opacity="0.8"/>
          </motion.g>
          <motion.g
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          >
            <circle cx="20" cy="70" r="2" fill="#fff" opacity="0.8"/>
          </motion.g>
          
          {/* Happy eyes */}
          <motion.g
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <path d="M 40 45 Q 45 40 50 45" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 70 45 Q 75 40 80 45" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </motion.g>
          
          {/* Big smile */}
          <motion.path 
            d="M 35 65 Q 60 85 85 65" 
            stroke="#2D3748" 
            strokeWidth="5" 
            fill="none" 
            strokeLinecap="round"
            animate={{ d: ["M 35 65 Q 60 85 85 65", "M 35 65 Q 60 88 85 65", "M 35 65 Q 60 85 85 65"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Rosy cheeks */}
          <motion.circle 
            cx="30" cy="60" r="10" 
            fill="#FF69B4" 
            opacity="0.4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle 
            cx="90" cy="60" r="10" 
            fill="#FF69B4" 
            opacity="0.4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </svg>
      </motion.div>
    ),
    normal: (
      <motion.div 
        className="relative" 
        style={{ width: size, height: size }}
        animate={{ 
          y: [0, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="face-normal">
              <stop offset="0%" stopColor="#FFF4E6" />
              <stop offset="100%" stopColor="#FFE0B2" />
            </radialGradient>
          </defs>
          
          {/* Face */}
          <circle cx="60" cy="60" r="50" fill="url(#face-normal)"/>
          
          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          >
            <circle cx="45" cy="50" r="6" fill="#2D3748"/>
            <circle cx="75" cy="50" r="6" fill="#2D3748"/>
          </motion.g>
          
          {/* Neutral mouth */}
          <motion.line 
            x1="40" y1="75" x2="80" y2="75" 
            stroke="#2D3748" 
            strokeWidth="4" 
            strokeLinecap="round"
            animate={{ x1: [40, 42, 40], x2: [80, 78, 80] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Subtle cheeks */}
          <circle cx="32" cy="65" r="8" fill="#FFB74D" opacity="0.2"/>
          <circle cx="88" cy="65" r="8" fill="#FFB74D" opacity="0.2"/>
        </svg>
      </motion.div>
    ),
    mala: (
      <motion.div 
        className="relative" 
        style={{ width: size, height: size }}
        animate={{ 
          rotate: [0, 3, -3, 0],
          y: [0, 3, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="face-bad">
              <stop offset="0%" stopColor="#FFCDD2" />
              <stop offset="100%" stopColor="#EF5350" />
            </radialGradient>
          </defs>
          
          {/* Face */}
          <circle cx="60" cy="60" r="50" fill="url(#face-bad)"/>
          
          {/* Sad eyes */}
          <motion.g
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M 40 48 Q 45 52 50 48" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 70 48 Q 75 52 80 48" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </motion.g>
          
          {/* Tears */}
          <motion.g
            animate={{ 
              y: [0, 10, 15],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ellipse cx="42" cy="60" rx="3" ry="5" fill="#4FC3F7" opacity="0.6"/>
          </motion.g>
          <motion.g
            animate={{ 
              y: [0, 10, 15],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            <ellipse cx="78" cy="60" rx="3" ry="5" fill="#4FC3F7" opacity="0.6"/>
          </motion.g>
          
          {/* Sad mouth */}
          <motion.path 
            d="M 40 80 Q 60 68 80 80" 
            stroke="#2D3748" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            animate={{ d: ["M 40 80 Q 60 68 80 80", "M 40 80 Q 60 65 80 80", "M 40 80 Q 60 68 80 80"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </motion.div>
    )
  };
  
  return emojis[type] || emojis.normal;
};

const RatingCard = ({ rating, label, onClick, disabled }) => {
  const gradients = {
    excelente: 'from-emerald-200/80 via-teal-200/70 to-cyan-200/60',
    normal: 'from-amber-200/80 via-yellow-200/70 to-orange-200/60',
    mala: 'from-rose-200/80 via-pink-200/70 to-red-200/60'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gradient-to-br ${gradients[rating]} rounded-3xl p-8 sm:p-12 shadow-xl hover:shadow-2xl transition-all aspect-square flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/60 hover:scale-105 active:scale-95`}
    >
      <div className="mb-4">
        <ModernEmoji type={rating} size={100} />
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-800">{label}</p>
    </button>
  );
};

const SuccessAnimation = ({ rating, message, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center z-50 p-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="bg-white/40 backdrop-blur-xl rounded-full w-32 h-32 flex items-center justify-center mb-6 mx-auto shadow-2xl"
        >
          <Check className="w-20 h-20 text-pink-600" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ModernEmoji type={rating} size={140} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-black text-slate-800 mb-4"
        >
          ¡Guardado!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-xl text-slate-700 font-semibold max-w-2xl"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function CustomerExperienceModal({ onClose, storeId, userRole }) {
  const [currentScreen, setCurrentScreen] = useState('selectUser');
  const [status, setStatus] = useState('idle');
  const [selectedRating, setSelectedRating] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionCashier, setSessionCashier] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [validating, setValidating] = useState(false);
  const [showSuggestedSale, setShowSuggestedSale] = useState(false);
  const [suggestedSaleAmount, setSuggestedSaleAmount] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historyWeekFilter, setHistoryWeekFilter] = useState('current');

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

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
    enabled: !!storeId && currentScreen === 'selectUser',
    staleTime: 5 * 60 * 1000
  });

  const { data: cashierPasswords = [] } = useQuery({
    queryKey: ['cashierPasswords', storeId],
    queryFn: async () => {
      const all = await base44.entities.RolePassword.list();
      return all.filter(p => p.store_code === storeId);
    },
    enabled: !!storeId && (currentScreen === 'login' || currentScreen === 'selectUser'),
    staleTime: 10 * 60 * 1000
  });

  const { data: todayFeedback = [] } = useQuery({
    queryKey: ['customerFeedback', storeId, today],
    queryFn: async () => {
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date === today);
    },
    enabled: !!storeId && currentScreen === 'validation',
    staleTime: 30 * 1000,
    refetchInterval: false
  });

  const { data: allStoreFeedback = [] } = useQuery({
    queryKey: ['allStoreFeedback', storeId, sessionCashier?.id],
    queryFn: async () => {
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.cashier_id === sessionCashier?.id);
    },
    enabled: !!storeId && !!sessionCashier && (currentScreen === 'profile' || currentScreen === 'ranking'),
    staleTime: 60 * 1000
  });

  const { data: weeklyFeedback = [] } = useQuery({
    queryKey: ['weeklyFeedback', storeId],
    queryFn: async () => {
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date >= start && f.date <= end);
    },
    enabled: !!storeId && currentScreen === 'ranking',
    staleTime: 60 * 1000
  });

  const { data: monthlyFeedback = [] } = useQuery({
    queryKey: ['monthlyFeedback', storeId],
    queryFn: async () => {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date >= start && f.date <= end);
    },
    enabled: !!storeId && currentScreen === 'ranking',
    staleTime: 60 * 1000
  });

  const saveFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['allStoreFeedback'] });
      setStatus('success');
    },
    onError: () => {
      setStatus('idle');
      toast.error('Error al guardar');
    }
  });

  const handleLogin = () => {
    const userPassword = cashierPasswords.find(p => p.role === selectedUser?.id);
    
    if (!userPassword) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`customerExperience_${storeId}`, JSON.stringify(selectedUser));
      setShowGreeting(true);
      setTimeout(() => {
        setShowGreeting(false);
        setCurrentScreen('validation');
      }, 3000);
      setLoginPassword('');
      setLoginError('');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Ingresa tu contraseña');
      return;
    }
    
    if (loginPassword === userPassword.password) {
      setSessionCashier(selectedUser);
      localStorage.setItem(`customerExperience_${storeId}`, JSON.stringify(selectedUser));
      setShowGreeting(true);
      setTimeout(() => {
        setShowGreeting(false);
        setCurrentScreen('validation');
      }, 3000);
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`customerExperience_${storeId}`);
    setSessionCashier(null);
    setSelectedUser(null);
    setCurrentScreen('selectUser');
    setLoginPassword('');
    toast.success('Sesión cerrada');
  };

  const handleValidateInvoice = async () => {
    if (!invoiceSerial.trim()) {
      toast.error('Ingresa un número de factura');
      return;
    }

    setValidating(true);

    try {
      const alreadyUsed = todayFeedback.some(e => e.device === invoiceSerial);
      
      if (alreadyUsed) {
        toast.error('Esta factura ya fue evaluada hoy');
        setValidating(false);
        setTimeout(() => setInvoiceSerial(''), 2000);
        return;
      }

      setCurrentScreen('survey');
      toast.success('¡Factura válida! Comparte tu experiencia');
    } catch (error) {
      toast.error('Error al validar factura');
    }

    setValidating(false);
  };

  const handleRatingClick = (rating) => {
    if (status !== 'idle') return;

    const currentInvoice = invoiceSerial;
    setSelectedRating(rating);
    
    if (rating === 'excelente') {
      setShowSuggestedSale(true);
    } else {
      submitFeedback(rating, currentInvoice, false, 0);
    }
  };

  const submitFeedback = (rating, invoice, hasSuggested, suggestedAmount) => {
    setStatus('saving');

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
    const suggestedPoints = hasSuggested ? 5 : 0;
    const totalPoints = config.points + suggestedPoints;
    
    setSuccessMessage(config.message + (hasSuggested ? ' ¡+5 pts por venta sugerida!' : ''));

    const now = new Date();
    saveFeedbackMutation.mutate({
      store_id: storeId,
      cashier_id: sessionCashier.id,
      rating: rating,
      nps_type: config.nps,
      points: totalPoints,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
      device: invoice,
      has_suggested_sale: hasSuggested,
      suggested_sale_amount: suggestedAmount,
      suggested_sale_points: suggestedPoints
    });
  };

  const handleSuggestedSaleSubmit = () => {
    const amount = parseFloat(suggestedSaleAmount) || 0;
    submitFeedback(selectedRating, invoiceSerial, amount > 0, amount);
    setShowSuggestedSale(false);
    setSuggestedSaleAmount('');
  };

  const handleSuccessComplete = () => {
    setStatus('idle');
    setSelectedRating(null);
    setSuccessMessage('');
    setInvoiceSerial('');
    setCurrentScreen('validation');
  };

  const cashierStats = useMemo(() => {
    if (!sessionCashier) return { totalPoints: 0, totalSurveys: 0, promotores: 0, pasivos: 0, detractores: 0, nps: 0, suggestedSales: 0, totalSuggested: 0 };
    
    const totalPoints = allStoreFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
    const totalSurveys = allStoreFeedback.length;
    
    const npsData = allStoreFeedback.reduce((acc, f) => {
      acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
      return acc;
    }, {});
    
    const nps = totalSurveys > 0 
      ? Math.round((((npsData.promotor || 0) - (npsData.detractor || 0)) / totalSurveys) * 100)
      : 0;

    const suggestedSales = allStoreFeedback.filter(f => f.has_suggested_sale).length;
    const totalSuggested = allStoreFeedback.reduce((sum, f) => sum + (f.suggested_sale_amount || 0), 0);
    
    return {
      totalPoints,
      totalSurveys,
      promotores: npsData.promotor || 0,
      pasivos: npsData.pasivo || 0,
      detractores: npsData.detractor || 0,
      nps,
      suggestedSales,
      totalSuggested
    };
  }, [sessionCashier, allStoreFeedback]);

  const filteredHistory = useMemo(() => {
    if (!sessionCashier || !allStoreFeedback.length) return [];
    
    let filtered = allStoreFeedback;
    
    if (historyWeekFilter === 'current') {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      filtered = filtered.filter(f => {
        const date = parseISO(f.date);
        return date >= weekStart && date <= weekEnd;
      });
    } else if (historyWeekFilter === 'last') {
      const lastWeekStart = startOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), { weekStartsOn: 1 });
      filtered = filtered.filter(f => {
        const date = parseISO(f.date);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });
    }
    
    if (historyDateFilter) {
      filtered = filtered.filter(f => f.date === historyDateFilter);
    }
    
    return filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [sessionCashier, allStoreFeedback, historyDateFilter, historyWeekFilter]);

  const dailyHistory = useMemo(() => {
    if (!sessionCashier) return [];
    
    const last30Days = eachDayOfInterval({
      start: new Date(new Date().setDate(new Date().getDate() - 29)),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayFeedback = allStoreFeedback.filter(f => f.date === dayStr);
      
      const points = dayFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
      const promotores = dayFeedback.filter(f => f.nps_type === 'promotor').length;
      const suggested = dayFeedback.filter(f => f.has_suggested_sale).length;
      
      return {
        date: format(day, 'dd/MM'),
        fullDate: dayStr,
        points,
        surveys: dayFeedback.length,
        suggested,
        promotorPercent: dayFeedback.length > 0 ? ((promotores / dayFeedback.length) * 100).toFixed(0) : 0
      };
    }).filter(d => d.surveys > 0);
  }, [sessionCashier, allStoreFeedback]);

  const weeklyRanking = useMemo(() => {
    const cashierPoints = {};
    weeklyFeedback.forEach(f => {
      const cashierId = f.cashier_id || 'unknown';
      if (!cashierPoints[cashierId]) {
        const cashier = allCashiers.find(c => c.id === cashierId);
        cashierPoints[cashierId] = { 
          name: cashier?.name || 'Usuario', 
          points: 0, 
          surveys: 0, 
          promotores: 0,
          suggested: 0
        };
      }
      cashierPoints[cashierId].points += f.points || 0;
      cashierPoints[cashierId].surveys += 1;
      if (f.nps_type === 'promotor') cashierPoints[cashierId].promotores += 1;
      if (f.has_suggested_sale) cashierPoints[cashierId].suggested += 1;
    });

    return Object.entries(cashierPoints)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        promotorPercent: data.surveys > 0 ? ((data.promotores / data.surveys) * 100).toFixed(0) : 0 
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [weeklyFeedback, allCashiers]);

  const monthlyRanking = useMemo(() => {
    const cashierPoints = {};
    monthlyFeedback.forEach(f => {
      const cashierId = f.cashier_id || 'unknown';
      if (!cashierPoints[cashierId]) {
        const cashier = allCashiers.find(c => c.id === cashierId);
        cashierPoints[cashierId] = { 
          name: cashier?.name || 'Usuario', 
          points: 0, 
          surveys: 0, 
          promotores: 0 
        };
      }
      cashierPoints[cashierId].points += f.points || 0;
      cashierPoints[cashierId].surveys += 1;
      if (f.nps_type === 'promotor') cashierPoints[cashierId].promotores += 1;
    });

    return Object.entries(cashierPoints)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        promotorPercent: data.surveys > 0 ? ((data.promotores / data.surveys) * 100).toFixed(0) : 0 
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [monthlyFeedback, allCashiers]);

  const totalToday = todayFeedback.length;
  const npsData = todayFeedback.reduce((acc, f) => {
    acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
    return acc;
  }, {});

  const npsScore = totalToday > 0 
    ? Math.round((((npsData.promotor || 0) - (npsData.detractor || 0)) / totalToday) * 100)
    : 0;

  if (showGreeting) {
    return <WelcomeGreeting userName={selectedUser?.name} onComplete={() => setShowGreeting(false)} />;
  }

  if (currentScreen === 'selectUser') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <FloatingIceCreams />
        <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6 text-center">¿Quién atendió al cliente?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allCashiers.map((cashier) => (
              <button
                key={cashier.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(cashier);
                  setCurrentScreen('login');
                }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 rounded-2xl p-4 border-2 border-pink-200 hover:border-pink-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {cashier.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-slate-900">{cashier.name}</p>
                    <p className="text-sm text-slate-600">{cashier.position || 'Anfitrión'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'login' && selectedUser) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-50 flex items-center justify-center p-4">
        <FloatingIceCreams />
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg">
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

            <Button onClick={handleLogin} className="w-full h-14 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg">
              Iniciar
            </Button>

            <Button onClick={() => setCurrentScreen('selectUser')} variant="ghost" className="w-full text-slate-600">
              ← Cambiar usuario
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if ((currentScreen === 'validation' || currentScreen === 'profile' || currentScreen === 'ranking') && sessionCashier) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-50 overflow-y-auto">
        <FloatingIceCreams />
        <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Experiencia Cliente</h2>
                    <p className="text-white/90 text-xs sm:text-sm">{sessionCashier.name}</p>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/20">
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Cerrar</span>
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'validation', label: 'Encuesta', icon: Star },
                  { id: 'profile', label: 'Mi Perfil', icon: TrendingUp },
                  { id: 'ranking', label: 'Ranking', icon: Award }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentScreen(tab.id);
                      }}
                      className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
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

            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {currentScreen === 'validation' && (
                  <motion.div key="validation" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">Validar Factura</h3>
                      <p className="text-slate-600 text-sm sm:text-base">Ingresa el número de factura del cliente</p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      <Input
                        placeholder="Número de factura"
                        value={invoiceSerial}
                        onChange={(e) => setInvoiceSerial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateInvoice()}
                        className="h-12 sm:h-14 text-base sm:text-lg text-center font-bold"
                        disabled={validating}
                      />
                      <Button
                        onClick={handleValidateInvoice}
                        disabled={validating || !invoiceSerial.trim()}
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg shadow-lg"
                      >
                        {validating ? 'Validando...' : 'Continuar'}
                      </Button>
                    </div>

                    {todayFeedback.length > 0 && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 border border-emerald-200">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4 text-center">Resumen de Hoy</h4>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div className="bg-white rounded-xl p-3 sm:p-4 text-center border border-emerald-200">
                            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{todayFeedback.length}</p>
                            <p className="text-xs text-slate-600">Encuestas</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 sm:p-4 text-center border border-emerald-200">
                            <p className="text-2xl sm:text-3xl font-black text-purple-600">{npsScore}</p>
                            <p className="text-xs text-slate-600">NPS Score</p>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart data={[
                            { name: 'Excelente', value: npsData.promotor || 0 },
                            { name: 'Normal', value: npsData.pasivo || 0 },
                            { name: 'Mala', value: npsData.detractor || 0 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#ef4444" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentScreen === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4 sm:p-6 border border-purple-200">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg">
                          {sessionCashier.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-800">{sessionCashier.name}</h3>
                          <p className="text-slate-600 text-sm">{sessionCashier.position || 'Anfitrión'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[
                          { icon: Trophy, label: 'Puntos', value: cashierStats.totalPoints, color: 'purple' },
                          { icon: Target, label: 'NPS', value: cashierStats.nps, color: 'emerald' },
                          { icon: Star, label: 'Promotores', value: cashierStats.promotores, color: 'amber' },
                          { icon: Calendar, label: 'Encuestas', value: cashierStats.totalSurveys, color: 'blue' }
                        ].map((stat, idx) => {
                          const Icon = stat.icon;
                          return (
                            <div key={idx} className="bg-white rounded-xl p-3 border border-purple-200 shadow-sm">
                              <Icon className={`w-4 h-4 text-${stat.color}-500 mb-1`} />
                              <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                              <p className="text-lg sm:text-2xl font-black text-slate-800">{stat.value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtros de historial */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200">
                      <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        Historial de Encuestas
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <select
                          value={historyWeekFilter}
                          onChange={(e) => setHistoryWeekFilter(e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="all">Todas las semanas</option>
                          <option value="current">Semana actual</option>
                          <option value="last">Semana pasada</option>
                        </select>
                        <Input
                          type="date"
                          value={historyDateFilter}
                          onChange={(e) => setHistoryDateFilter(e.target.value)}
                          className="flex-1 text-sm"
                        />
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {filteredHistory.map((feedback, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl p-3 border-2 ${
                              feedback.rating === 'excelente' ? 'bg-emerald-50 border-emerald-200' :
                              feedback.rating === 'normal' ? 'bg-amber-50 border-amber-200' :
                              'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8">
                                  <ModernEmoji type={feedback.rating} size={32} />
                                </div>
                                <div>
                                  <p className="text-slate-800 font-bold text-sm">#{feedback.device}</p>
                                  <p className="text-xs text-slate-600">
                                    {format(parseISO(feedback.created_date), "d MMM, HH:mm", { locale: es })}
                                  </p>
                                  {feedback.has_suggested_sale && (
                                    <p className="text-xs text-emerald-600 font-semibold">💰 +Sugerido: ${feedback.suggested_sale_amount}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xl font-black ${
                                  feedback.nps_type === 'promotor' ? 'text-emerald-600' :
                                  feedback.nps_type === 'pasivo' ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                  {feedback.points > 0 ? '+' : ''}{feedback.points}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredHistory.length === 0 && (
                          <p className="text-center text-slate-400 py-6">No hay registros</p>
                        )}
                      </div>
                    </div>

                    {dailyHistory.length > 0 && (
                      <>
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Puntos Últimos 30 Días</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <ComposedChart data={dailyHistory}>
                              <defs>
                                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                              <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                              <Tooltip />
                              <Area type="monotone" dataKey="points" stroke="#a855f7" strokeWidth={2} fill="url(#colorPoints)" />
                              <Bar dataKey="suggested" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Desglose NPS</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { emoji: 'excelente', label: 'Promotores', value: cashierStats.promotores, color: 'emerald' },
                                { emoji: 'normal', label: 'Pasivos', value: cashierStats.pasivos, color: 'amber' },
                                { emoji: 'mala', label: 'Detractores', value: cashierStats.detractores, color: 'red' }
                              ].map((item, idx) => (
                                <div key={idx} className={`text-center bg-${item.color}-50 rounded-xl p-3 border border-${item.color}-200`}>
                                  <div className="mb-2 flex justify-center">
                                    <ModernEmoji type={item.emoji} size={40} />
                                  </div>
                                  <p className={`text-xl font-black text-${item.color}-500`}>{item.value}</p>
                                  <p className="text-xs text-slate-600">{item.label}</p>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-center">
                              <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Promotores', value: cashierStats.promotores, color: '#10b981' },
                                      { name: 'Pasivos', value: cashierStats.pasivos, color: '#f59e0b' },
                                      { name: 'Detractores', value: cashierStats.detractores, color: '#ef4444' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#ef4444" />
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {currentScreen === 'ranking' && (
                  <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 sm:mb-6 text-center">🏆 Podio Semanal</h3>
                      
                      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                        {weeklyRanking[1] && (
                          <div className="flex flex-col items-center">
                            <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-2 shadow-xl ${
                              weeklyRanking[1].id === sessionCashier?.id 
                                ? 'bg-gradient-to-br from-pink-400 to-purple-500 border-4 border-purple-300' 
                                : 'bg-gradient-to-br from-slate-300 to-gray-400 border-4 border-slate-200'
                            }`}>
                              <span className="text-2xl sm:text-3xl">🥈</span>
                            </div>
                            <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-2xl p-3 w-24 sm:w-32 h-20 sm:h-28 flex flex-col items-center justify-center shadow-lg">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 text-center mb-1 truncate w-full">{weeklyRanking[1].name}</p>
                              <p className="text-lg sm:text-2xl font-black text-purple-600">{weeklyRanking[1].points}</p>
                              <p className="text-xs text-slate-600">{weeklyRanking[1].promotorPercent}% ⭐</p>
                            </div>
                          </div>
                        )}

                        {weeklyRanking[0] && (
                          <div className="flex flex-col items-center">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-2 shadow-2xl ${
                                weeklyRanking[0].id === sessionCashier?.id
                                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-purple-400'
                                  : 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-4 border-yellow-200'
                              }`}
                            >
                              <span className="text-3xl sm:text-4xl">👑</span>
                            </motion.div>
                            <div className="bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-t-2xl p-3 sm:p-4 w-28 sm:w-36 h-28 sm:h-40 flex flex-col items-center justify-center shadow-2xl relative">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center"
                              >
                                <Trophy className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                              </motion.div>
                              <p className="text-sm sm:text-base font-bold text-slate-800 text-center mb-2 truncate w-full">{weeklyRanking[0].name}</p>
                              <p className="text-2xl sm:text-3xl font-black text-purple-600">{weeklyRanking[0].points}</p>
                              <p className="text-xs text-slate-600">{weeklyRanking[0].promotorPercent}% ⭐</p>
                            </div>
                          </div>
                        )}

                        {weeklyRanking[2] && (
                          <div className="flex flex-col items-center">
                            <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-2 shadow-xl ${
                              weeklyRanking[2].id === sessionCashier?.id
                                ? 'bg-gradient-to-br from-pink-400 to-purple-500 border-4 border-purple-300'
                                : 'bg-gradient-to-br from-orange-300 to-orange-500 border-4 border-orange-200'
                            }`}>
                              <span className="text-2xl sm:text-3xl">🥉</span>
                            </div>
                            <div className="bg-gradient-to-b from-orange-200 to-orange-300 rounded-t-2xl p-3 w-24 sm:w-32 h-16 sm:h-24 flex flex-col items-center justify-center shadow-lg">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 text-center mb-1 truncate w-full">{weeklyRanking[2].name}</p>
                              <p className="text-lg sm:text-2xl font-black text-purple-600">{weeklyRanking[2].points}</p>
                              <p className="text-xs text-slate-600">{weeklyRanking[2].promotorPercent}% ⭐</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {weeklyRanking.length > 3 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-600 mb-2">Resto del Top 5</h4>
                          {weeklyRanking.slice(3).map((user, idx) => (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between p-3 rounded-xl ${
                                user.id === sessionCashier?.id
                                  ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-purple-400'
                                  : 'bg-white border border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                                  {idx + 4}
                                </div>
                                <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg sm:text-xl font-black text-purple-600">{user.points}</p>
                                <p className="text-xs text-slate-500">{user.promotorPercent}% ⭐</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                        Top 10 Mensual
                      </h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {monthlyRanking.map((user, idx) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              user.id === sessionCashier?.id
                                ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-purple-400'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${
                                idx < 3 ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base sm:text-lg font-black text-purple-600">{user.points}</p>
                              <p className="text-xs text-slate-500">{user.promotorPercent}% ⭐</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {weeklyRanking.length > 0 && (
                      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Comparativa Top 5</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={weeklyRanking}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                            <Tooltip />
                            <Bar dataKey="points" radius={[8, 8, 0, 0]}>
                              {weeklyRanking.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                  index === 0 ? '#eab308' : 
                                  index === 1 ? '#94a3b8' : 
                                  index === 2 ? '#fb923c' : 
                                  '#a855f7'
                                } />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-50 overflow-hidden">
        <FloatingIceCreams />
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
          {status === 'idle' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-white/40 hover:bg-white/60 backdrop-blur-xl rounded-full flex items-center justify-center transition-all shadow-lg"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
            </button>
          )}

          <div className="text-center mb-8 sm:mb-12">
            <div className="text-5xl sm:text-6xl mb-4">✨</div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 mb-3 sm:mb-4">
              ¿Cómo fue tu experiencia?
            </h1>
            <p className="text-lg sm:text-2xl text-slate-600 font-medium">
              Selecciona una opción
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl w-full mb-6">
            <RatingCard
              rating="excelente"
              label="Excelente"
              onClick={() => handleRatingClick('excelente')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="normal"
              label="Normal"
              onClick={() => handleRatingClick('normal')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="mala"
              label="Mala"
              onClick={() => handleRatingClick('mala')}
              disabled={status !== 'idle'}
            />
          </div>

          {status === 'idle' && (
            <div className="text-center text-slate-400 text-sm">
              <p>Hoy: {totalToday} opiniones · NPS: {npsScore}</p>
            </div>
          )}
        </div>

        {status === 'success' && (
          <SuccessAnimation
            rating={selectedRating}
            message={successMessage}
            onComplete={handleSuccessComplete}
          />
        )}

        {showSuggestedSale && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 text-center">
                ¿Hubo venta sugerida?
              </h3>
              <p className="text-slate-600 mb-4 text-center text-sm sm:text-base">
                Gana +5 puntos adicionales si vendiste un sugerido
              </p>
              <Input
                type="number"
                placeholder="Monto de la venta sugerida"
                value={suggestedSaleAmount}
                onChange={(e) => setSuggestedSaleAmount(e.target.value)}
                className="h-12 sm:h-14 text-base sm:text-lg mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    submitFeedback(selectedRating, invoiceSerial, false, 0);
                    setShowSuggestedSale(false);
                  }}
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 text-sm sm:text-base"
                >
                  No hubo sugerido
                </Button>
                <Button
                  onClick={handleSuggestedSaleSubmit}
                  className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg"
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}