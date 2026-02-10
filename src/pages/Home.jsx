import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import PopsyRainingIcons from '@/components/PopsyRainingIcons';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Lazy load de componentes pesados
const WelcomeToast = lazy(() => import('@/components/WelcomeToast'));
const NotificationSetup = lazy(() => import('@/components/NotificationSetup'));
const ManagerialReportModal = lazy(() => import('@/components/reports/ManagerialReportModal'));
const PopsyStoryModal = lazy(() => import('@/components/PopsyStoryModal'));
const DirectoryModal = lazy(() => import('@/components/DirectoryModal'));
const ExperienciaPopsyModal = lazy(() => import('@/components/experience/ExperienciaPopsyModal'));
const CustomerExperienceModal = lazy(() => import('@/components/customer/CustomerExperienceModal'));
const DailySalesForm = lazy(() => import('@/components/forms/DailySalesForm'));
const ShiftRecordForm = lazy(() => import('@/components/forms/ShiftRecordForm'));
const MonthlyBudgetDashboard = lazy(() => import('@/components/budget/MonthlyBudgetDashboard'));
import {
  LayoutDashboard, Users, TrendingUp,
  Award, Target, Bell, Phone, Download, FileText,
  Lock, Eye, EyeOff, Receipt, Snowflake, Settings as SettingsIcon, AlertTriangle, CheckCircle, Info, CalendarDays, LogOut, Sparkles, Palette, Trophy } from
'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const MENU_ITEMS = [
  {
    name: 'Panel Ejecutivo',
    page: 'ExecutiveDashboard',
    icon: TrendingUp,
    description: 'Análisis Gerencial',
    bgColor: 'bg-gradient-to-br from-slate-100/90 to-gray-100/80',
    iconBg: 'bg-slate-200/60',
    iconColor: 'text-slate-600',
    textColor: 'text-slate-700',
    requiredRole: 'gerente'
  },
  {
    name: 'Experiencia Gerencial',
    page: 'ExecutiveExperience',
    icon: Sparkles,
    description: 'NPS por tiendas',
    bgColor: 'bg-gradient-to-br from-pink-100/90 to-purple-100/80',
    iconBg: 'bg-pink-200/60',
    iconColor: 'text-pink-500',
    textColor: 'text-pink-700',
    requiredRole: 'gerente'
  },
{
  name: 'Comparable',
  page: 'Comparable',
  icon: TrendingUp,
  description: 'Análisis Comparativo',
  bgColor: 'bg-gradient-to-br from-indigo-100/90 to-blue-100/80',
  iconBg: 'bg-indigo-200/60',
  iconColor: 'text-indigo-600',
  textColor: 'text-indigo-700',
  requiredRole: 'gerente',
  isSpecialAction: true,
  specialAction: 'comparable'
},
{
  name: 'Tienda',
  page: 'Dashboard',
  icon: LayoutDashboard,
  description: 'Ventas y métricas',
  bgColor: 'bg-gradient-to-br from-pink-100/90 to-rose-100/80',
  iconBg: 'bg-pink-200/60',
  iconColor: 'text-pink-500',
  textColor: 'text-pink-700'
},
{
  name: 'Cajeros',
  page: 'CashiersDashboard',
  icon: Users,
  description: 'Rendimiento',
  bgColor: 'bg-gradient-to-br from-violet-100/90 to-purple-100/80',
  iconBg: 'bg-violet-200/60',
  iconColor: 'text-violet-500',
  textColor: 'text-violet-700'
},

{
  name: 'Mapa Nevera',
  page: 'FreezerMap',
  icon: Snowflake,
  description: 'Inventario helados',
  bgColor: 'bg-gradient-to-br from-cyan-100/90 to-blue-100/80',
  iconBg: 'bg-cyan-200/60',
  iconColor: 'text-cyan-500',
  textColor: 'text-cyan-700'
},
{
  name: 'PopsyStars',
  page: 'Rankings',
  icon: Award,
  description: 'Top cajeros',
  bgColor: 'bg-gradient-to-br from-amber-100/90 to-yellow-100/80',
  iconBg: 'bg-amber-200/60',
  iconColor: 'text-amber-500',
  textColor: 'text-amber-700'
},
{
  name: 'Ruleta Popsy',
  page: 'RoulettePopsy',
  icon: Trophy,
  description: 'Premios del mes',
  bgColor: 'bg-gradient-to-br from-yellow-100/90 to-amber-100/80',
  iconBg: 'bg-yellow-200/60',
  iconColor: 'text-yellow-600',
  textColor: 'text-yellow-700',
  requiredRole: 'gerente'
},

{
  name: 'Backup Drive',
  page: 'Settings',
  icon: Download,
  description: 'Respaldar datos',
  bgColor: 'bg-gradient-to-br from-blue-100/90 to-cyan-100/80',
  iconBg: 'bg-blue-200/60',
  iconColor: 'text-blue-500',
  textColor: 'text-blue-700',
  requiredRole: 'gerente',
  isSpecialAction: true,
  specialAction: 'backup'
},
{
  name: 'Experiencia Cliente',
  page: 'CustomerExperience',
  icon: Sparkles,
  description: 'Feedback rápido',
  bgColor: 'bg-gradient-to-br from-purple-100/90 to-fuchsia-100/80',
  iconBg: 'bg-purple-200/60',
  iconColor: 'text-purple-500',
  textColor: 'text-purple-700',
  isSpecialAction: true,
  specialAction: 'customerFeedback'
}];




export default function Home() {
  const [selectedStore, setSelectedStore] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pendingStore, setPendingStore] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showStoreSales, setShowStoreSales] = useState(false);
  const [salesTab, setSalesTab] = useState('tienda');
  const [showBudgetDashboard, setShowBudgetDashboard] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showExperienciaPopsy, setShowExperienciaPopsy] = useState(false);
  const [showCustomerExperience, setShowCustomerExperience] = useState(false);


  const ROLES = [
  { 
    id: 'gerente', 
    name: 'Gerente', 
    icon: 'gerente', 
    color: 'from-slate-600 to-gray-700', 
    description: 'Visión completa del negocio y toma de decisiones', 
    iconBaseColor: '#475569', 
    hasExecutivePanel: true,
    buttonText: 'Ver métricas generales'
  },
  { 
    id: 'lider', 
    name: 'Líder de Experiencia', 
    icon: 'lider', 
    color: 'from-amber-400 to-yellow-500', 
    description: 'Control diario del punto, equipo y resultados', 
    iconBaseColor: '#f59e0b',
    buttonText: 'Gestionar mi punto',
    isRecommended: true
  },
  { 
    id: 'embajador', 
    name: 'Embajador', 
    icon: 'embajador', 
    color: 'from-pink-400 to-rose-500', 
    description: 'Ejecución operativa y apoyo en ventas', 
    iconBaseColor: '#ec4899',
    buttonText: 'Comenzar mi turno'
  }];


  // Iconos profesionales por rol con colores dinámicos
  const RoleIcon = ({ roleId, isSelected }) => {
    const role = ROLES.find((r) => r.id === roleId);
    const iconColor = role?.iconBaseColor || '#6b7280';

    if (roleId === 'gerente') {
      // Maletín ejecutivo con color
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <rect x="4" y="8" width="16" height="12" rx="2" stroke={iconColor} strokeWidth="2" fill={isSelected ? 'none' : 'rgba(71,85,105,0.1)'} />
          <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke={iconColor} strokeWidth="2" fill="none" />
          <line x1="4" y1="12" x2="20" y2="12" stroke={iconColor} strokeWidth="2" />
        </svg>);

    }
    if (roleId === 'lider') {
      // Corona profesional con brillo dorado
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.path
            d="M3 18h18v2H3v-2zm1-8l4 4 4-6 4 6 4-4v8H4v-8z"
            fill={isSelected ? iconColor : '#fbbf24'}
            animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }} />

          <motion.circle cx="5" cy="8" r="1.5" fill={isSelected ? '#fbbf24' : '#f59e0b'} animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <motion.circle cx="12" cy="5" r="2" fill={isSelected ? '#fbbf24' : '#f59e0b'} animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
          <motion.circle cx="19" cy="8" r="1.5" fill={isSelected ? '#fbbf24' : '#f59e0b'} animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
        </svg>);

    }
    if (roleId === 'embajador') {
      // Grupo de personas con color rosa
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <circle cx="12" cy="6" r="3" fill={isSelected ? iconColor : '#ec4899'} />
            <path d="M12 11c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" fill={isSelected ? iconColor : '#ec4899'} />
          </motion.g>
          <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
            <circle cx="5" cy="9" r="2" fill={isSelected ? iconColor : '#f472b6'} opacity="0.7" />
            <path d="M5 12c-2 0-4 1.5-4 3v1h5v-2c0-.7.2-1.4.5-2H5z" fill={isSelected ? iconColor : '#f472b6'} opacity="0.7" />
          </motion.g>
          <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
            <circle cx="19" cy="9" r="2" fill={isSelected ? iconColor : '#f472b6'} opacity="0.7" />
            <path d="M19 12c2 0 4 1.5 4 3v1h-5v-2c0-.7-.2-1.4-.5-2h1.5z" fill={isSelected ? iconColor : '#f472b6'} opacity="0.7" />
          </motion.g>
        </svg>);

    }
    if (roleId === 'calidad') {
      // Checklist profesional con color teal
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke={isSelected ? iconColor : '#14b8a6'} strokeWidth="2" fill={isSelected ? 'none' : 'rgba(20,184,166,0.1)'} />
          <motion.path
            d="M8 10l2 2 4-4"
            stroke={isSelected ? '#22c55e' : '#14b8a6'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ pathLength: [0, 1], opacity: [0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }} />

          <line x1="8" y1="16" x2="16" y2="16" stroke={isSelected ? iconColor : '#14b8a6'} strokeWidth="2" strokeLinecap="round" />
        </svg>);

    }
    if (roleId === 'c_interno') {
      // Documento con lupa en violeta
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={isSelected ? iconColor : '#8b5cf6'} strokeWidth="2" fill={isSelected ? 'none' : 'rgba(139,92,246,0.1)'} />
          <path d="M14 2v6h6" stroke={isSelected ? iconColor : '#8b5cf6'} strokeWidth="2" fill="none" />
          <motion.circle
            cx="11" cy="14" r="3"
            stroke={isSelected ? iconColor : '#8b5cf6'}
            strokeWidth="2"
            fill="none"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }} />

          <motion.line
            x1="13.5" y1="16.5" x2="16" y2="19"
            stroke={isSelected ? iconColor : '#8b5cf6'}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ x2: [16, 17, 16], y2: [19, 20, 19] }}
            transition={{ duration: 1.5, repeat: Infinity }} />

        </svg>);

    }
    return null;
  };

  // Fetch passwords solo cuando hay rol seleccionado
  const { data: storePasswords = [] } = useQuery({
    queryKey: ['storePasswords'],
    queryFn: () => base44.entities.StorePassword.list(),
    enabled: !!selectedRole && !isLoggedIn,
    staleTime: 10 * 60 * 1000
  });

  const { data: rolePasswords = [] } = useQuery({
    queryKey: ['rolePasswords'],
    queryFn: () => base44.entities.RolePassword.list(),
    enabled: !!selectedRole && !isLoggedIn,
    staleTime: 10 * 60 * 1000
  });

  // Fetch datos para el mini resumen "Hoy en la tienda"
  const { data: todaySales } = useQuery({
    queryKey: ['todaySales', selectedStore],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sales = await base44.entities.DailySales.filter({ store_id: selectedStore, date: today });
      return sales[0] || null;
    },
    enabled: !!selectedStore && isLoggedIn,
    staleTime: 2 * 60 * 1000
  });

  const { data: currentBudget } = useQuery({
    queryKey: ['currentBudget', selectedStore],
    queryFn: async () => {
      const now = new Date();
      const budgets = await base44.entities.Budget.filter({ 
        store_id: selectedStore,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      return budgets.find(b => b.is_active) || budgets[0] || null;
    },
    enabled: !!selectedStore && isLoggedIn,
    staleTime: 10 * 60 * 1000
  });

  const { data: topCashiers } = useQuery({
    queryKey: ['topCashiers', selectedStore],
    queryFn: async () => {
      const startOfMonthDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const records = await base44.entities.ShiftRecord.filter({ store_id: selectedStore });
      const monthRecords = records.filter(r => r.date >= startOfMonthDate);
      
      const cashierSales = {};
      monthRecords.forEach(r => {
        if (!cashierSales[r.cashier_id]) {
          cashierSales[r.cashier_id] = { sales: 0, name: r.cashier_id };
        }
        cashierSales[r.cashier_id].sales += r.sales || 0;
      });
      
      return Object.values(cashierSales).sort((a, b) => b.sales - a.sales).slice(0, 1);
    },
    enabled: !!selectedStore && isLoggedIn,
    staleTime: 5 * 60 * 1000
  });

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(Math.round(val));

  // Cargar sesión guardada
  useEffect(() => {
    const savedSession = localStorage.getItem('popsySession');
    const lastVisit = localStorage.getItem('lastVisitTime');
    const lastRole = localStorage.getItem('lastSelectedRole');
    const now = Date.now();

    // Si pasaron más de 4 horas, cerrar sesión
    if (lastVisit && now - parseInt(lastVisit) > 4 * 60 * 60 * 1000) {
      localStorage.removeItem('selectedStore');
      localStorage.removeItem('popsySession');
      localStorage.removeItem('userRole');
      setSelectedStore('');
      setIsLoggedIn(false);
    } else if (savedSession) {
      const session = JSON.parse(savedSession);
      setSelectedStore(session.store);
      setSelectedRole(session.role || 'lider');
      setIsLoggedIn(true);
    }

    // Preseleccionar último rol usado automáticamente
    if (!isLoggedIn && lastRole) {
      setSelectedRole(lastRole);
    }

    localStorage.setItem('lastVisitTime', now.toString());
  }, []);

  // Auto-focus en contraseña cuando se selecciona rol
  useEffect(() => {
    if (selectedRole && !isLoggedIn) {
      setTimeout(() => {
        const passwordInput = document.getElementById('login-password');
        if (passwordInput) passwordInput.focus();
      }, 300);
    }
  }, [selectedRole, isLoggedIn]);

  const handleStoreSelect = (store) => {
    setPendingStore(store);
    setLoginPassword('');
    setLoginError('');
  };

  const handleLogin = async () => {
      if (!selectedRole) {
        setLoginError('Selecciona un rol');
        return;
      }

      setIsSubmitting(true);

      // Simular delay mínimo para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 400));

      // Guardar último rol usado
      localStorage.setItem('lastSelectedRole', selectedRole);

      // Contraseña maestra 1998 - permite acceso a todo
      if (loginPassword === '1998') {
        localStorage.setItem('userRole', selectedRole);
        
        // Si no hay tienda seleccionada y es gerente, ir al panel ejecutivo
        if (!pendingStore && selectedRole === 'gerente') {
          localStorage.setItem('popsySession', JSON.stringify({ role: selectedRole, time: Date.now() }));
          setLoginSuccess(true);
          setTimeout(() => {
            window.location.href = createPageUrl('ExecutiveDashboard');
          }, 800);
          return;
        }
        
        // Si hay tienda seleccionada, entrar a esa tienda
        if (pendingStore) {
          setLoginSuccess(true);
          setTimeout(() => {
            setSelectedStore(pendingStore);
            setIsLoggedIn(true);
            localStorage.setItem('selectedStore', pendingStore);
            localStorage.setItem('popsySession', JSON.stringify({ store: pendingStore, role: selectedRole, time: Date.now() }));
            setShowWelcome(true);
            setPendingStore('');
            setLoginPassword('');
            setIsSubmitting(false);
          }, 800);
          return;
        }
        
        // Si no hay tienda y no es gerente, pedir seleccionar tienda
        setLoginError('Selecciona una tienda');
        setIsSubmitting(false);
        return;
      }

      // Gerente sin contraseña maestra
      if (selectedRole === 'gerente') {
        setLoginError('Contraseña de gerente incorrecta');
        setIsSubmitting(false);
        return;
      }

    // Para otros roles: validar contraseña de tienda o rol
    if (!pendingStore) {
      setLoginError('Selecciona una tienda');
      setIsSubmitting(false);
      return;
    }

    // Primero buscar contraseña específica del rol
    const rolePassword = rolePasswords.find((p) => p.store_code === pendingStore && p.role === selectedRole);
    // Si no hay contraseña de rol, usar la general de tienda
    const storePassword = storePasswords.find((p) => p.store_code === pendingStore);

    const requiredPassword = rolePassword?.password || storePassword?.password;

    if (!requiredPassword || loginPassword === requiredPassword) {
      setLoginSuccess(true);
      
      setTimeout(() => {
        setSelectedStore(pendingStore);
        setIsLoggedIn(true);
        localStorage.setItem('selectedStore', pendingStore);
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('popsySession', JSON.stringify({ store: pendingStore, role: selectedRole, time: Date.now() }));
        setShowWelcome(true);
        setPendingStore('');
        setLoginPassword('');
        setIsSubmitting(false);
      }, 800);
    } else {
      setLoginError('Contraseña incorrecta');
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setSelectedStore('');
    setIsLoggedIn(false);
    setPendingStore('');
    setSelectedRole('');
    localStorage.removeItem('selectedStore');
    localStorage.removeItem('popsySession');
    localStorage.removeItem('userRole');
  };

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    localStorage.setItem('popsySession', JSON.stringify({ store, role: selectedRole, time: Date.now() }));
    setShowWelcome(true);
  };

  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const needsPassword = pendingStore;
  const isGerente = selectedRole === 'gerente';

  // Si no está logueado, mostrar pantalla de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Fondo 3D con relieve profesional y siluetas */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          {/* Gradiente base */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/40" />
          
          {/* Silueta principal superior derecha - relieve fuerte */}
          <motion.div 
            animate={{ 
              x: [0, 40, 0],
              y: [0, -25, 0],
              rotateZ: [0, 8, 0]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-96 h-96 rounded-[40%]"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(244, 114, 182, 0.08) 50%, rgba(251, 207, 232, 0.04) 100%)',
              boxShadow: 'inset -15px -15px 40px rgba(255, 255, 255, 0.6), inset 15px 15px 40px rgba(0, 0, 0, 0.08), 0 25px 80px rgba(236, 72, 153, 0.15)',
              filter: 'blur(2px)'
            }}
          />
          
          {/* Silueta inferior izquierda - relieve medio */}
          <motion.div 
            animate={{ 
              x: [0, -35, 0],
              y: [0, 40, 0],
              rotateZ: [0, -10, 0]
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-48 -left-48 w-[450px] h-[450px] rounded-[45%]"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.10) 0%, rgba(192, 132, 252, 0.06) 50%, rgba(233, 213, 255, 0.03) 100%)',
              boxShadow: 'inset -12px -12px 35px rgba(255, 255, 255, 0.5), inset 12px 12px 35px rgba(0, 0, 0, 0.06), 0 20px 70px rgba(168, 85, 247, 0.12)',
              filter: 'blur(2px)'
            }}
          />
          
          {/* Silueta central - efecto de profundidad */}
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              rotateZ: [0, 180, 360]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(236, 72, 153, 0.06) 50%, rgba(244, 114, 182, 0.04) 100%)',
              boxShadow: 'inset -10px -10px 30px rgba(255, 255, 255, 0.4), inset 10px 10px 30px rgba(0, 0, 0, 0.05), 0 15px 60px rgba(147, 51, 234, 0.1)',
              filter: 'blur(3px)'
            }}
          />

          {/* Formas geométricas pequeñas con relieve - superior */}
          <motion.div
            animate={{ 
              rotate: 360,
              x: [0, 15, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] left-[15%] w-28 h-28 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.09), rgba(96, 165, 250, 0.05))',
              boxShadow: 'inset -6px -6px 20px rgba(255, 255, 255, 0.6), inset 6px 6px 20px rgba(0, 0, 0, 0.06)',
              transform: 'rotate(25deg)',
              filter: 'blur(1px)'
            }}
          />

          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[25%] right-[18%] w-32 h-32 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.08), rgba(253, 164, 175, 0.04))',
              boxShadow: 'inset -7px -7px 22px rgba(255, 255, 255, 0.5), inset 7px 7px 22px rgba(0, 0, 0, 0.05)',
              filter: 'blur(1.5px)'
            }}
          />

          {/* Textura de puntos para profundidad */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden min-h-screen flex flex-col justify-center relative z-10">
          <div className="flex-1 flex flex-col justify-center px-4 py-4 overflow-y-auto">
            <div className="max-w-md mx-auto w-full bg-white/0 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-rose-200/40 p-5" style={{ boxShadow: '0 0 12px rgba(251, 113, 133, 0.25), 0 0 20px rgba(251, 113, 133, 0.15)' }}>
              <div className="mb-5 text-center">
                <motion.img 
                  src={LOGO_URL} 
                  alt="Popsy" 
                  className="h-20 object-contain mx-auto mb-3"
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -8, 0]
                  }}
                  transition={{
                    opacity: { duration: 0.6 },
                    scale: { duration: 0.6 },
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                />
                <h1 className="text-xl font-black text-rose-300 mb-1">Iniciar sesión</h1>
                <p className="text-slate-600 text-xs font-medium">Selecciona tu rol y comienza</p>
              </div>

              <div className="space-y-2 mb-4">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  const lastUsedRole = localStorage.getItem('lastSelectedRole');
                  const isLastUsed = role.id === lastUsedRole && !isSelected;
                  
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id);
                        setLoginError('');
                        localStorage.setItem('lastSelectedRole', role.id);
                      }}
                      className={`relative w-full min-h-[60px] p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                       isSelected
                         ? 'border-rose-300 bg-gradient-to-r from-rose-100/30 via-pink-100/20 to-purple-100/30 shadow-xl shadow-rose-200/40 scale-[1.02]'
                         : 'border-slate-300/60 bg-white/8 backdrop-blur-md active:border-rose-200 hover:scale-[1.01] hover:shadow-lg'
                      }`}
                    >
                      {isLastUsed && (
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1.5 right-2 px-2 py-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full text-[8px] font-bold text-white shadow-lg"
                        >
                          ✨ Reciente
                        </motion.div>
                      )}
                      <div className="flex items-center gap-2">
                        <motion.div 
                          animate={isSelected ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                          isSelected 
                            ? 'bg-white/60 backdrop-blur-sm' 
                            : 'bg-gradient-to-br from-rose-50 to-purple-50'
                          }`}>
                          <div className="w-4 h-4">
                            <RoleIcon roleId={role.id} isSelected={isSelected} />
                          </div>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-slate-800' : 'text-slate-900'}`}>{role.name}</p>
                          <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-slate-600' : 'text-slate-600'}`}>{role.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md"
                          >
                            <CheckCircle className="w-3 h-3 text-rose-500" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRole === 'gerente' && (
                <div className="mb-3 p-2.5 bg-blue-50/60 backdrop-blur-sm border border-blue-200/40 rounded-lg">
                  <p className="text-[10px] text-blue-700 flex items-center gap-1.5 font-medium">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Acceso a panel ejecutivo global
                  </p>
                </div>
              )}

              {selectedRole && selectedRole !== 'gerente' && (
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-900 mb-2 text-center">Selecciona tu tienda</label>
                  <div className="max-w-sm mx-auto">
                    <StoreSelector selectedStore={pendingStore} onStoreChange={handleStoreSelect} />
                  </div>
                </div>
              )}

              {selectedRole && (
                <div className="mb-3">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-900 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => {setLoginPassword(e.target.value);setLoginError('');}}
                      onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleLogin()}
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      className="w-full h-11 pl-4 pr-12 border-2 border-rose-200/60 rounded-xl focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 outline-none text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Contraseña asignada por la empresa</p>
                </div>
              )}

              {loginError && (
                <div className="mb-3 p-2.5 bg-red-50/60 backdrop-blur-sm border border-red-200/40 rounded-lg">
                  <p className="text-[10px] text-red-700 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {loginError}
                  </p>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleLogin}
                  disabled={(selectedRole !== 'gerente' && !pendingStore) || !selectedRole || isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-rose-300 to-pink-300 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl font-bold text-sm disabled:opacity-40 mt-4 shadow-xl shadow-rose-200/30"
                >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar 🚀'
                )}
              </Button>
              </motion.div>

              <div className="text-center mt-3">
                <Link to={createPageUrl('ExecutiveDashboard')} className="text-[10px] text-slate-500">
                  ¿Eres administrador?
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:flex min-h-screen relative z-10">
          <div className="w-[40%] px-10 xl:px-12 py-8 flex flex-col justify-center">
            <div className="max-w-lg">
              <motion.img
                src={LOGO_URL}
                alt="Popsy Management"
                className="h-24 xl:h-28 object-contain mb-8 drop-shadow-2xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="space-y-6">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl xl:text-5xl font-black leading-tight mb-3"
                  >
                    <span className="text-slate-600">Bienvenido a</span><br />
                    <span className="bg-gradient-to-r from-rose-300 via-pink-200 to-purple-300 bg-clip-text text-transparent">
                      Popsy Management
                    </span>
                  </motion.h1>
                  <p className="text-base xl:text-lg text-slate-700 leading-relaxed font-medium">Gestión empresarial inteligente para equipos de alto impacto 🚀</p>
                </div>

                <div className="space-y-4 pt-3">
                  {[
                    { icon: TrendingUp, title: 'Métricas en tiempo real', text: 'Monitoreo continuo del desempeño', gradient: 'from-rose-300 to-pink-300' },
                    { icon: Users, title: 'Gestión de equipos', text: 'Optimiza recursos y productividad', gradient: 'from-purple-300 to-indigo-300' },
                    { icon: Target, title: 'Logro de objetivos', text: 'Cumple metas con análisis predictivo', gradient: 'from-blue-300 to-cyan-300' }
                  ].map((feature, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-start gap-3"
                    >
                      <motion.div 
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <feature.icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="pt-1.5">
                        <p className="text-slate-900 font-bold text-base mb-0.5">{feature.title}</p>
                        <p className="text-slate-600 text-sm leading-relaxed">{feature.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-[60%] flex items-center justify-center p-8 xl:p-10">
            <div className="w-full max-w-lg">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/0 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-rose-200/40 p-7 xl:p-8 space-y-5"
                style={{ boxShadow: '0 0 12px rgba(251, 113, 133, 0.25), 0 0 20px rgba(251, 113, 133, 0.15), 0 25px 80px -15px rgba(217, 70, 239, 0.3)' }}>
                
                <div className="text-center">
                  <h2 className="text-3xl font-black text-rose-300 mb-2">Iniciar sesión</h2>
                  <p className="text-sm text-slate-700 font-medium">Selecciona tu rol y comienza</p>
                </div>

                <div className="space-y-3">
                  {ROLES.map((role) => {
                    const isSelected = selectedRole === role.id;
                    const lastUsedRole = localStorage.getItem('lastSelectedRole');
                    const isLastUsed = role.id === lastUsedRole && !isSelected;

                    return (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setLoginError('');
                          localStorage.setItem('lastSelectedRole', role.id);
                        }}
                        className={`relative w-full p-4 rounded-2xl border-3 transition-all duration-300 text-left flex items-center gap-3 ${
                          isSelected
                            ? 'border-rose-300 bg-gradient-to-r from-rose-100/30 to-purple-100/30 shadow-xl shadow-rose-200/40 scale-[1.01]'
                            : 'border-slate-300/60 bg-white/8 backdrop-blur-md hover:border-rose-200 hover:shadow-lg hover:scale-[1.01]'
                        }`}
                      >
                        {isLastUsed && (
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 right-3 px-2.5 py-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full text-[10px] font-bold text-white shadow-lg"
                          >
                            ✨ Reciente
                          </motion.div>
                        )}
                        <motion.div 
                          animate={isSelected ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${
                          isSelected ? 'bg-white/60 backdrop-blur-sm' : 'bg-gradient-to-br from-rose-50 to-purple-50'
                          }`}>
                          <div className="w-6 h-6">
                            <RoleIcon roleId={role.id} isSelected={isSelected} />
                          </div>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold mb-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-900'}`}>{role.name}</p>
                          <p className={`text-xs leading-snug ${isSelected ? 'text-slate-600' : 'text-slate-600'}`}>{role.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-rose-500" strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedRole === 'gerente' && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-700 flex items-center gap-2 font-medium">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      Acceso a panel ejecutivo global
                    </p>
                  </div>
                )}

                {selectedRole && selectedRole !== 'gerente' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2 text-center">Selecciona tu tienda</label>
                    <div className="max-w-md mx-auto">
                      <StoreSelector selectedStore={pendingStore} onStoreChange={handleStoreSelect} />
                    </div>
                  </div>
                )}

                {selectedRole && (
                  <div>
                    <label htmlFor="login-password-desktop" className="block text-sm font-bold text-slate-900 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="login-password-desktop"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => {setLoginPassword(e.target.value);setLoginError('');}}
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleLogin()}
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        className="w-full pl-11 pr-11 py-3.5 border-2 border-rose-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">Contraseña asignada por la empresa</p>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
                    <p className="text-red-600 text-xs flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {loginError}
                    </p>
                  </div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleLogin}
                    disabled={(selectedRole !== 'gerente' && !pendingStore) || !selectedRole || isSubmitting}
                    className="w-full bg-gradient-to-r from-rose-300 to-pink-300 hover:from-rose-400 hover:to-pink-400 text-white py-4 rounded-xl font-black text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-base font-black">Entrar 🚀</span>
                    </span>
                  )}
                </Button>
                </motion.div>

                <div className="text-center">
                  <Link to={createPageUrl('ExecutiveDashboard')} className="text-xs text-slate-400 hover:text-rose-400 transition-colors inline-block">
                    Acceso administrativo
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Success Animation */}
        {loginSuccess && (
          <div className="fixed inset-0 bg-emerald-500/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-full p-6 shadow-2xl">
              <CheckCircle className="w-16 h-16 text-emerald-600" />
            </div>
          </div>
        )}

        {/* Popsy Story Modal */}
        <Suspense fallback={null}>
          {showStory && <PopsyStoryModal onClose={() => setShowStory(false)} />}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo orgánico premium luxury */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Base cálida y elegante */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50/30 to-purple-50/20" />
        
        {/* Blob orgánico 1 - Rosado pastel superior derecha */}
        <motion.div 
          animate={{ 
            x: [0, 40, -15, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.95, 1],
            rotate: [0, 8, -5, 0]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -right-48 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, rgba(251, 207, 232, 0.08) 0%, rgba(253, 242, 248, 0.05) 40%, transparent 70%)',
            filter: 'blur(80px)',
            borderRadius: '45% 55% 60% 40% / 50% 45% 55% 50%'
          }}
        />
        
        {/* Blob orgánico 2 - Lila suave inferior izquierda */}
        <motion.div 
          animate={{ 
            x: [0, -35, 20, 0],
            y: [0, 40, -25, 0],
            scale: [1, 0.9, 1.15, 1],
            rotate: [0, -10, 6, 0]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-56 -left-56 w-[700px] h-[700px]"
          style={{
            background: 'radial-gradient(ellipse at 60% 50%, rgba(216, 180, 254, 0.09) 0%, rgba(233, 213, 255, 0.06) 35%, transparent 65%)',
            filter: 'blur(90px)',
            borderRadius: '60% 40% 45% 55% / 55% 60% 40% 45%'
          }}
        />

        {/* Blob orgánico 3 - Durazno claro centro */}
        <motion.div 
          animate={{ 
            x: [0, 25, -30, 0],
            y: [0, -20, 35, 0],
            scale: [1, 1.05, 0.92, 1],
            rotate: [0, 12, -8, 0]
          }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/3 w-[550px] h-[550px]"
          style={{
            background: 'radial-gradient(ellipse at 45% 55%, rgba(254, 215, 170, 0.07) 0%, rgba(254, 237, 218, 0.04) 40%, transparent 70%)',
            filter: 'blur(75px)',
            borderRadius: '50% 50% 55% 45% / 45% 50% 50% 55%'
          }}
        />

        {/* Blob orgánico 4 - Menta muy sutil inferior derecha */}
        <motion.div 
          animate={{ 
            x: [0, 45, -20, 0],
            y: [0, 30, -15, 0],
            scale: [1, 0.88, 1.08, 1],
            rotate: [0, -15, 10, 0]
          }}
          transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/5 w-[480px] h-[480px]"
          style={{
            background: 'radial-gradient(ellipse at 55% 45%, rgba(167, 243, 208, 0.06) 0%, rgba(209, 250, 229, 0.03) 45%, transparent 75%)',
            filter: 'blur(70px)',
            borderRadius: '55% 45% 50% 50% / 50% 55% 45% 50%'
          }}
        />

        {/* Blob orgánico 5 - Rosa pálido superior centro */}
        <motion.div 
          animate={{ 
            x: [0, -28, 35, 0],
            y: [0, -35, 18, 0],
            scale: [1, 1.12, 0.96, 1],
            rotate: [0, 9, -12, 0]
          }}
          transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/6 left-1/3 w-[520px] h-[520px]"
          style={{
            background: 'radial-gradient(ellipse at 40% 60%, rgba(252, 165, 165, 0.08) 0%, rgba(254, 205, 211, 0.05) 38%, transparent 68%)',
            filter: 'blur(85px)',
            borderRadius: '48% 52% 58% 42% / 52% 48% 52% 48%'
          }}
        />

        {/* Wave suave inferior - overlay de profundidad */}
        <motion.div 
          animate={{ 
            x: [0, 15, -10, 0],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 right-0 h-[400px]"
          style={{
            background: 'linear-gradient(to top, rgba(251, 207, 232, 0.06) 0%, transparent 100%)',
            filter: 'blur(60px)'
          }}
        />

        {/* Capa de resplandor superior sutil */}
        <motion.div 
          animate={{ 
            opacity: [0.02, 0.04, 0.02],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 right-0 h-[300px]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(233, 213, 255, 0.08) 0%, transparent 70%)',
            filter: 'blur(100px)'
          }}
        />

        {/* Textura finísima para profundidad */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(251, 113, 133, 0.4) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(216, 180, 254, 0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px, 45px 45px'
          }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10"
      >
        {/* Header Premium con mucho aire */}
        <div className="text-center mb-16">
          <motion.img
            src={LOGO_URL}
            alt="Popsy"
            className="h-28 sm:h-32 md:h-36 object-contain mx-auto mb-8 cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -5, 0]
            }}
            transition={{
              opacity: { duration: 0.6 },
              scale: { duration: 0.6 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowStory(true)}
          />

          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-10"
          >
            Sistema de Gestión
          </motion.h2>

          {/* Pregunta humana */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <p className="text-slate-700 font-medium text-lg mb-4">
              ¿A qué tienda deseas ingresar?
            </p>
            
            {/* Selector tipo pill premium */}
            <div className="max-w-md mx-auto">
              <StoreSelector
                selectedStore={selectedStore}
                onStoreChange={handleStoreChange}
              />
            </div>
          </motion.div>
        </div>

        {/* Mini resumen "Hoy en la tienda" */}
        {selectedStore && todaySales && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 p-6 sm:p-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </motion.div>
                <h3 className="text-slate-700 font-bold text-lg">Hoy en la tienda</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="text-center bg-gradient-to-br from-rose-50/60 to-pink-50/40 rounded-2xl p-4 border border-rose-100/50"
                >
                  <p className="text-rose-400 text-xs font-semibold mb-2">Ventas</p>
                  <p className="text-2xl font-black text-rose-600">{formatCurrency(todaySales.total_sales || 0)}</p>
                  {currentBudget?.sales_budget && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((todaySales.total_sales / (currentBudget.sales_budget / 30)) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {((todaySales.total_sales / (currentBudget.sales_budget / 30)) * 100).toFixed(0)}% de meta
                      </p>
                    </div>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="text-center bg-gradient-to-br from-purple-50/60 to-violet-50/40 rounded-2xl p-4 border border-purple-100/50"
                >
                  <p className="text-purple-400 text-xs font-semibold mb-2">Ticket Promedio</p>
                  <p className="text-2xl font-black text-purple-600">
                    {todaySales.total_transactions > 0 
                      ? formatCurrency(todaySales.total_sales / todaySales.total_transactions)
                      : '$0'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {todaySales.total_transactions || 0} transacciones
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="text-center bg-gradient-to-br from-amber-50/60 to-yellow-50/40 rounded-2xl p-4 border border-amber-100/50"
                >
                  <p className="text-amber-500 text-xs font-semibold mb-2">Ranking</p>
                  {topCashiers?.[0] ? (
                    <>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <p className="text-lg font-black text-amber-600">Top 1</p>
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">{formatCurrency(topCashiers[0].sales)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 mt-2">Sin datos</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tarjetas principales - Layout horizontal premium */}
        {(selectedStore || selectedRole === 'gerente') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Tienda */}
              <Link to={createPageUrl('Dashboard')}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60 overflow-hidden cursor-pointer h-full"
                  style={{ 
                    boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-rose-300/20 to-pink-300/10 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="relative z-10 text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <LayoutDashboard className="w-8 h-8 text-rose-500" />
                    </motion.div>
                    <h3 className="text-slate-800 font-black text-base mb-1">Tienda</h3>
                    <p className="text-slate-500 text-xs font-medium">Ventas y métricas</p>
                  </div>
                </motion.div>
              </Link>

              {/* Cajeros */}
              <Link to={createPageUrl('CashiersDashboard')}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60 overflow-hidden cursor-pointer h-full"
                  style={{ 
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-violet-300/20 to-purple-300/10 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  />
                  
                  <div className="relative z-10 text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Users className="w-8 h-8 text-violet-500" />
                    </motion.div>
                    <h3 className="text-slate-800 font-black text-base mb-1">Cajeros</h3>
                    <p className="text-slate-500 text-xs font-medium">Rendimiento del equipo</p>
                  </div>
                </motion.div>
              </Link>

              {/* Mapa Nevera */}
              <Link to={createPageUrl('FreezerMap')}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60 overflow-hidden cursor-pointer h-full"
                  style={{ 
                    boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-300/20 to-blue-300/10 rounded-full blur-2xl"
                    animate={{ 
                      scale: [1, 1.2, 1], 
                      opacity: [0.3, 0.6, 0.3] 
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  />
                  
                  <div className="relative z-10 text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-lg"
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(6, 182, 212, 0)',
                          '0 0 0 8px rgba(6, 182, 212, 0.2)',
                          '0 0 0 0 rgba(6, 182, 212, 0)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Snowflake className="w-8 h-8 text-cyan-500" />
                    </motion.div>
                    <h3 className="text-slate-800 font-black text-base mb-1">Mapa Nevera</h3>
                    <p className="text-slate-500 text-xs font-medium">Inventario de helados</p>
                  </div>
                </motion.div>
              </Link>

              {/* PopsyStars */}
              <Link to={createPageUrl('Rankings')}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60 overflow-hidden cursor-pointer h-full"
                  style={{ 
                    boxShadow: '0 8px 32px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-300/20 to-yellow-300/10 rounded-full blur-2xl"
                    animate={{ 
                      scale: [1, 1.4, 1], 
                      opacity: [0.4, 0.6, 0.4],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
                  />
                  
                  <div className="relative z-10 text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center shadow-lg relative"
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Award className="w-8 h-8 text-amber-500" />
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                    <h3 className="text-slate-800 font-black text-base mb-1">PopsyStars</h3>
                    <p className="text-slate-500 text-xs font-medium">Top cajeros del mes</p>
                  </div>
                </motion.div>
              </Link>

              {/* Experiencia Cliente */}
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCustomerExperience(true)}
                className="group relative bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60 overflow-hidden cursor-pointer h-full"
                style={{ 
                  boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                }}
              >
                <motion.div
                  className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-fuchsia-300/10 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
                
                <div className="relative z-10 text-center">
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </motion.div>
                  <h3 className="text-slate-800 font-black text-base mb-1">Experiencia Cliente</h3>
                  <p className="text-slate-500 text-xs font-medium">Feedback rápido</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Botones de acción secundarios */}
        {(selectedStore || selectedRole === 'gerente') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-3 flex-wrap mt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReport(true)}
                className="bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-600 hover:text-rose-600 shadow-md hover:shadow-lg transition-all rounded-full px-5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Informe
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedRole === 'gerente') {
                    import('@/components/executive/ZoneBudgetManager').then(module => {
                      const ZoneBudgetManager = module.default;
                      const modalRoot = document.createElement('div');
                      document.body.appendChild(modalRoot);
                      const root = require('react-dom/client').createRoot(modalRoot);
                      const handleClose = () => {
                        root.unmount();
                        document.body.removeChild(modalRoot);
                      };
                      root.render(
                        React.createElement(ZoneBudgetManager, {
                          zoneName: 'Bogotá Noroccidente',
                          onClose: handleClose
                        })
                      );
                    });
                  } else {
                    setShowBudgetDashboard(true);
                  }
                }}
                className="bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-600 hover:text-sky-600 shadow-md hover:shadow-lg transition-all rounded-full px-5"
              >
                <Target className="w-4 h-4 mr-2" />
                Presupuestos
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-600 hover:text-red-600 shadow-md hover:shadow-lg transition-all rounded-full px-5"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Modales con Lazy Loading */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showNotifications && (
            <NotificationSetup
              storeId={selectedStore}
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStory && <PopsyStoryModal onClose={() => setShowStory(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showDirectory && <DirectoryModal onClose={() => setShowDirectory(false)} />}
        </AnimatePresence>



        <AnimatePresence>
          {showReport && (
            <ManagerialReportModal
              storeId={selectedStore}
              storeName={selectedStoreName}
              storeCode={selectedStore}
              onClose={() => setShowReport(false)}
            />
          )}
        </AnimatePresence>

        {showBudgetDashboard && (
          <MonthlyBudgetDashboard
            storeId={selectedStore}
            storeName={selectedStoreName}
            isOpen={showBudgetDashboard}
            onClose={() => setShowBudgetDashboard(false)}
          />
        )}
      </Suspense>




      {/* Store Sales Modal */}
      <Suspense fallback={null}>
        {showStoreSales && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStoreSales(false)}>
            <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()} 
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-white/60"
          >
              <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 p-5 text-white text-center relative">
                <button onClick={() => setShowStoreSales(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                </motion.div>
                <h2 className="text-xl font-black">Registrar Ventas</h2>
              </div>

              <div className="flex border-b-2 border-pink-200/50 bg-gradient-to-r from-pink-50/50 to-violet-50/50 backdrop-blur-sm">
                <button
                  onClick={() => setSalesTab('tienda')}
                  className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                    salesTab === 'tienda' ? 'text-pink-600' : 'text-gray-500'
                  }`}
                >
                  🏪 Venta de Tienda
                  {salesTab === 'tienda' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-t-full" 
                    />
                  )}
                </button>
                <button
                  onClick={() => setSalesTab('cajero')}
                  className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                    salesTab === 'cajero' ? 'text-violet-600' : 'text-gray-500'
                  }`}
                >
                  👤 Venta de Cajero
                  {salesTab === 'cajero' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-full" 
                    />
                  )}
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {salesTab === 'tienda' ? (
                  <DailySalesForm storeId={selectedStore} onSuccess={() => setShowStoreSales(false)} />
                ) : (
                  <ShiftRecordForm storeId={selectedStore} onSuccess={() => {}} />
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showExperienciaPopsy && (
          <ExperienciaPopsyModal
            onClose={() => setShowExperienciaPopsy(false)}
            storeId={selectedStore}
            userId="temp_user"
            userName="Usuario"
            userRole={selectedRole}
          />
        )}

        {showCustomerExperience && (
          <CustomerExperienceModal
            onClose={() => setShowCustomerExperience(false)}
            storeId={selectedStore}
            userRole={selectedRole}
          />
        )}
      </Suspense>




    </div>
  );
}