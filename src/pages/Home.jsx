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
import GerenteHomePanel from '@/components/executive/GerenteHomePanel.jsx';
import {
  LayoutDashboard, Users, TrendingUp, Activity,
  Award, Target, Bell, Phone, Download, FileText,
  Lock, Eye, EyeOff, Receipt, Snowflake, Settings as SettingsIcon, AlertTriangle, CheckCircle, Info, CalendarDays, LogOut, Sparkles, Palette, Trophy, FileSpreadsheet } from
'lucide-react';
import BudgetExcelImporter from '@/components/executive/BudgetExcelImporter';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const MENU_ITEMS = [

  {
    name: 'Command Center',
    page: 'GenesisCommandCenter',
    icon: Activity,
    description: 'Monitoreo Global',
    bgColor: 'bg-gradient-to-br from-slate-800 to-slate-900',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    textColor: 'text-cyan-300',
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
  name: 'Configuración',
  page: 'Settings',
  icon: SettingsIcon,
  description: 'Tiendas y ajustes',
  bgColor: 'bg-gradient-to-br from-slate-100/90 to-gray-100/80',
  iconBg: 'bg-slate-200/60',
  iconColor: 'text-slate-600',
  textColor: 'text-slate-700',
  requiredRole: 'gerente'
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
  const [showBudgetImporter, setShowBudgetImporter] = useState(false);


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
        <div className="hidden lg:flex min-h-screen relative z-10 items-center justify-center">
          <div className="flex items-center justify-center p-8 xl:p-10 w-full max-w-2xl">
            <div className="w-full max-w-lg">
              {/* Logo flotante desktop */}
              <div className="text-center mb-6">
                <motion.img
                  src={LOGO_URL}
                  alt="Popsy"
                  className="h-28 xl:h-32 object-contain mx-auto drop-shadow-xl cursor-pointer"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => setShowStory(true)}
                />
                <p className="text-slate-400 text-sm mt-2">Sistema de Gestión</p>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 xl:p-10 space-y-6"
                style={{ 
                  boxShadow: '0 0 0 1.5px rgba(251,113,133,0.25), 0 8px 40px rgba(236,72,153,0.12), 0 32px 80px rgba(168,85,247,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}>
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-3xl font-bold text-slate-500">Iniciar sesión</h2>
                  <p className="text-sm text-slate-700 font-medium">Selecciona tu rol y comienza</p>
                </div>

                {/* Role Cards */}
                <div className="space-y-2.5">
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
                        className={`relative w-full p-4 rounded-2xl border transition-all duration-200 text-left flex items-center gap-3.5 ${
                          isSelected
                            ? 'border-rose-300/60 bg-gradient-to-r from-rose-50 to-pink-50/80 shadow-md shadow-rose-100/60'
                            : 'border-slate-200/80 bg-white/60 hover:border-rose-200 hover:bg-rose-50/30 hover:shadow-sm'
                        }`}
                        style={isSelected ? { boxShadow: '0 2px 16px rgba(251,113,133,0.18), inset 0 1px 0 rgba(255,255,255,0.9)' } : { boxShadow: '0 1px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                      >
                        {isLastUsed && (
                          <div className="absolute -top-2 right-3 px-2 py-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full text-[9px] font-bold text-white shadow">
                            ✨ Reciente
                          </div>
                        )}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white shadow-sm' : 'bg-rose-50/80'
                        }`}>
                          <div className="w-6 h-6">
                            <RoleIcon roleId={role.id} isSelected={isSelected} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 mb-0.5">{role.name}</p>
                          <p className="text-xs text-slate-500 leading-snug">{role.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center flex-shrink-0 shadow"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Gerente info */}
                {selectedRole === 'gerente' && (
                  <div className="px-3 py-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl">
                    <p className="text-xs text-blue-600 flex items-center gap-2 font-medium">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      Acceso a panel ejecutivo global
                    </p>
                  </div>
                )}

                {/* Store Selector */}
                {selectedRole && selectedRole !== 'gerente' && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Selecciona tu tienda</label>
                    <StoreSelector selectedStore={pendingStore} onStoreChange={handleStoreSelect} />
                  </div>
                )}

                {/* Password */}
                {selectedRole && (
                  <div className="space-y-1.5">
                    <label htmlFor="login-password-desktop" className="block text-sm font-semibold text-slate-700">
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
                        className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white/80"
                        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">Contraseña asignada por la empresa</p>
                  </div>
                )}

                {/* Error */}
                {loginError && (
                  <div className="px-3 py-2.5 bg-red-50/80 border border-red-200/60 rounded-xl">
                    <p className="text-red-500 text-xs flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {loginError}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleLogin}
                    disabled={(selectedRole !== 'gerente' && !pendingStore) || !selectedRole || isSubmitting}
                    className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-rose-200/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border-0"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Entrar <span className="text-base">🚀</span>
                      </span>
                    )}
                  </Button>
                </motion.div>

                <div className="text-center">
                  <Link to={createPageUrl('ExecutiveDashboard')} className="text-xs text-slate-400 hover:text-rose-400 transition-colors">
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
      {/* Fondo blanco */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-white" />
        <React.Fragment>
        {/* Silueta principal superior derecha - relieve sofisticado */}
        <motion.div 
          animate={{ 
            x: [0, 40, 0],
            y: [0, -25, 0],
            rotateZ: [0, 8, 0]
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -right-48 w-[480px] h-[480px]"
          style={{
            background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.12), rgba(244, 114, 182, 0.07), rgba(251, 207, 232, 0.02))',
            borderRadius: '42% 58% 45% 55% / 48% 62% 38% 52%',
            boxShadow: `
              inset -22px -22px 55px rgba(255, 255, 255, 0.8),
              inset 22px 22px 55px rgba(236, 72, 153, 0.13),
              0 35px 100px rgba(236, 72, 153, 0.18),
              0 15px 40px rgba(236, 72, 153, 0.08)
            `,
            filter: 'blur(1px)'
          }}
        />
        
        {/* Silueta inferior izquierda - profundidad intensa */}
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, 40, 0],
            rotateZ: [0, -10, 0]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-60 -left-60 w-[600px] h-[600px]"
          style={{
            background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.11), rgba(192, 132, 252, 0.06), rgba(221, 214, 254, 0.02))',
            borderRadius: '55% 45% 62% 38% / 45% 55% 45% 55%',
            boxShadow: `
              inset -20px -20px 50px rgba(255, 255, 255, 0.7),
              inset 20px 20px 50px rgba(168, 85, 247, 0.11),
              0 30px 90px rgba(168, 85, 247, 0.16),
              0 12px 35px rgba(168, 85, 247, 0.07)
            `,
            filter: 'blur(1.5px)'
          }}
        />
        
        {/* Silueta central rotante - efecto hipnótico */}
        <motion.div 
          animate={{ 
            scale: [1, 1.18, 1],
            rotateZ: [0, 180, 360]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px]"
          style={{
            background: 'linear-gradient(145deg, rgba(147, 51, 234, 0.08), rgba(236, 72, 153, 0.05), rgba(244, 114, 182, 0.02))',
            borderRadius: '38% 62% 55% 45% / 62% 45% 55% 38%',
            boxShadow: `
              inset -15px -15px 40px rgba(255, 255, 255, 0.6),
              inset 15px 15px 40px rgba(147, 51, 234, 0.09),
              0 25px 75px rgba(147, 51, 234, 0.11)
            `,
            filter: 'blur(2px)'
          }}
        />

        {/* Elemento superior izquierda - cristal */}
        <motion.div
          animate={{ 
            rotate: [0, 360],
            x: [0, 25, 0],
            y: [0, -18, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[18%] left-[12%] w-36 h-36"
          style={{
            background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.10), rgba(96, 165, 250, 0.05), rgba(147, 197, 253, 0.02))',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            boxShadow: `
              inset -10px -10px 30px rgba(255, 255, 255, 0.9),
              inset 10px 10px 30px rgba(59, 130, 246, 0.11),
              0 18px 55px rgba(59, 130, 246, 0.13)
            `,
            transform: 'rotate(25deg)',
            filter: 'blur(0.5px)'
          }}
        />

        {/* Elemento inferior derecha - esfera suave */}
        <motion.div
          animate={{ 
            rotate: [0, -360],
            scale: [1, 1.3, 1],
            x: [0, -25, 0],
            y: [0, 15, 0]
          }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[22%] right-[15%] w-40 h-40"
          style={{
            background: 'linear-gradient(145deg, rgba(251, 113, 133, 0.09), rgba(253, 164, 175, 0.05), rgba(254, 205, 211, 0.02))',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            boxShadow: `
              inset -12px -12px 35px rgba(255, 255, 255, 0.8),
              inset 12px 12px 35px rgba(251, 113, 133, 0.10),
              0 20px 65px rgba(251, 113, 133, 0.12)
            `,
            filter: 'blur(1px)'
          }}
        />

        {/* Partículas de luz flotantes */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] right-[25%] w-2 h-2 rounded-full bg-pink-300/40 blur-sm"
        />
        <motion.div
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[35%] left-[30%] w-3 h-3 rounded-full bg-purple-300/30 blur-sm"
        />

        {/* Grid ultra sutil para textura */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(120, 120, 120, 0.4) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        {/* Luz ambiental superior */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at 30% 15%, rgba(255, 255, 255, 0.5), transparent 45%), radial-gradient(circle at 70% 85%, rgba(236, 72, 153, 0.06), transparent 50%)'
          }}
        />
        </React.Fragment>}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-6">
          <motion.img
            src={LOGO_URL}
            alt="Popsy"
            className="h-20 sm:h-24 object-contain mx-auto mb-2 cursor-pointer drop-shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => setShowStory(true)}
          />
          {selectedRole !== 'gerente' && (
            <>
              <p className="text-gray-400 text-sm mb-3">Sistema de Gestión</p>
              <div className="flex flex-col items-center gap-2">
                <p className="text-gray-600 font-medium text-sm">¿A qué tienda deseas ingresar?</p>
                <div className="w-full max-w-sm mx-auto">
                  <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
                </div>
              </div>
            </>
          )}
          {selectedRole === 'gerente' && (
            <p className="text-gray-400 text-sm">Sistema de Gestión · Gerencia</p>
          )}
        </div>

        {/* Quick Actions */}
        {(selectedStore || selectedRole === 'gerente') && (
        <div className="mb-4 flex justify-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem('selectedStore');
                localStorage.removeItem('popsySession');
                localStorage.removeItem('userRole');
                window.location.href = '/Home';
              }}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Cerrar Sesión
            </Button>
            {selectedRole !== 'gerente' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBudgetDashboard(true)}
                className="text-gray-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all text-xs"
              >
                <Target className="w-3.5 h-3.5 mr-1" />
                Presupuestos
              </Button>
            )}
            {selectedRole === 'gerente' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBudgetImporter(true)}
                className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all text-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                PPT Excel
              </Button>
            )}
            {selectedRole !== 'gerente' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReport(true)}
                className="text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all text-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Informe
              </Button>
            )}
          </div>
        )}

        {/* Menu Grid - solo para no-gerente o gerente con tienda */}
        {(selectedStore || selectedRole === 'gerente') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

            {MENU_ITEMS.filter((item) => {
              // Restricciones: Panel Ejecutivo solo para gerente, otras opciones solo si hay tienda seleccionada
              const needsStore = item.page !== 'ExecutiveDashboard';
              if (needsStore && !selectedStore && item.requiredRole !== 'gerente') return false;
              if (item.requiredRole && selectedRole !== item.requiredRole) return false;
              
              // Restricción de tiendas específicas para Experiencia Popsy
              if (item.restrictedStores && !item.restrictedStores.includes(selectedStore)) return false;
              
              return true;
            }).map((item, index) => {
            const Icon = item.icon;

            // Restricciones por rol - solo embajador no ve Presupuestos
            const isLocked = selectedRole === 'embajador' && item.page === 'Budget';

            return (
              <div key={item.name}>

                  {isLocked ?
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 h-full shadow-lg transition-all duration-300 group relative overflow-hidden border border-white/20 opacity-60 cursor-not-allowed">

                      {/* Lock overlay */}
                      <div className="absolute inset-0 bg-gray-900/10 rounded-2xl flex items-center justify-center z-20">
                        <Lock className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 shadow-sm">
                          <Icon className={`w-6 h-6 ${item.iconColor}`} />
                        </div>
                        <h3 className={`font-bold ${item.textColor} text-sm`}>
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-gray-600 mt-0.5">{item.description}</p>
                      </div>
                      </div> :
                item.isSpecialAction && item.specialAction === 'comparable' ?
                <Link to={createPageUrl('ExecutiveDashboard') + '?comparison=true'}>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 h-full shadow-lg hover:shadow-2xl hover:bg-white/15 transition-all duration-300 group relative overflow-hidden border border-white/20 cursor-pointer">
                    
                    {/* Icon centered */}
                    <div className="flex flex-col items-center justify-center text-center relative z-10">
                      <div className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <h3 className={`font-bold ${item.textColor} text-sm`}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    </div>
                    </Link> :
                item.isSpecialAction ?
                <div
                  onClick={async () => {
                    if (item.specialAction === 'logout') {
                      localStorage.removeItem('selectedStore');
                      localStorage.removeItem('popsySession');
                      window.location.href = '/Home';
                    } else if (item.specialAction === 'budgetTrend') {
                      setShowBudgetDashboard(true);
                    } else if (item.specialAction === 'backup') {
                      setBackupLoading(true);
                      try {
                        const response = await base44.functions.invoke('backupToGoogleDrive', {});
                        console.log('✅ Respuesta completa:', response);

                        if (response.data.success) {
                          // Descargar backup localmente
                          const backupBlob = new Blob([JSON.stringify(response.data.full_backup, null, 2)], { type: 'application/json' });
                          const url = window.URL.createObjectURL(backupBlob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = response.data.file_name;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          a.remove();

                          toast.success(
                            `✅ ${response.data.message}\n📥 Descargado localmente\n📧 Revisa tu email: ${response.data.email_sent ? 'Enviado ✓' : 'Error al enviar'}`,
                            { duration: 12000 }
                          );
                        } else {
                          toast.error(
                            `❌ ${response.data.error}\n\nDetalles: ${response.data.details || 'Ver consola (F12)'}`,
                            { duration: 15000 }
                          );
                          console.error('❌ Error completo:', response.data);
                        }
                      } catch (error) {
                        toast.error(`❌ Error: ${error.message}\n\nVer consola (F12) para más detalles`, { duration: 12000 });
                        console.error('❌ Exception:', error);
                      }
                      setBackupLoading(false);
                    } else if (item.specialAction === 'experiencia') {
                      setShowExperienciaPopsy(true);
                    } else if (item.specialAction === 'customerFeedback') {
                      setShowCustomerExperience(true);
                    } else {
                      setShowStoreSales(true);
                    }
                  }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 h-full shadow-lg hover:shadow-2xl hover:bg-white/15 transition-all duration-300 group relative overflow-hidden border border-white/20 cursor-pointer"
                  >
                  {/* Icon centered */}
                  {/* Icon centered */}
                  <div className="flex flex-col items-center justify-center text-center relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 shadow-sm">
                      {item.icon ? (
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      ) : (
                        <LogOut className={`w-6 h-6 ${item.iconColor}`} />
                      )}
                    </div>
                    <h3 className={`font-bold ${item.textColor} text-sm`}>
                      {item.specialAction === 'backup' && backupLoading ? 'Guardando...' : item.name}
                    </h3>
                    <p className="text-[10px] text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                  </div> :

                <Link to={createPageUrl(item.page)}>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 h-full shadow-lg hover:shadow-2xl hover:bg-white/15 transition-all duration-300 group relative overflow-hidden border border-white/20">
                    {/* Icon centered */}
                    <div className="flex flex-col items-center justify-center text-center relative z-10">
                      <div className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <h3 className={`font-bold ${item.textColor} text-sm`}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </Link>
                }
              </div>
            );
          })}
        </div>
        )}
      </div>

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