import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import WelcomeToast from '@/components/WelcomeToast';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import NotificationSetup from '@/components/NotificationSetup';
import ManagerialReportModal from '@/components/reports/ManagerialReportModal';
import PopsyStoryModal from '@/components/PopsyStoryModal';
import DirectoryModal from '@/components/DirectoryModal';
import ExperienciaPopsyModal from '@/components/experience/ExperienciaPopsyModal';
import DailySalesForm from '@/components/forms/DailySalesForm';
import ShiftRecordForm from '@/components/forms/ShiftRecordForm';
import MonthlyBudgetDashboard from '@/components/budget/MonthlyBudgetDashboard';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, TrendingUp,
  Award, Target, Bell, Phone, Download, FileText,
  Lock, Eye, EyeOff, Receipt, Snowflake, Settings as SettingsIcon, AlertTriangle, CheckCircle, Info, CalendarDays, LogOut } from
'lucide-react';
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
  name: 'Ventas',
  page: 'Dashboard',
  icon: Receipt,
  description: 'Registrar ventas',
  bgColor: 'bg-gradient-to-br from-emerald-100/90 to-green-100/80',
  iconBg: 'bg-emerald-200/60',
  iconColor: 'text-emerald-500',
  textColor: 'text-emerald-700',
  isSpecialAction: true
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
  name: 'Experiencia Popsy',
  page: 'ExperienciaPopsy',
  icon: Award,
  description: 'Encuesta clientes',
  bgColor: 'bg-gradient-to-br from-pink-100/90 to-purple-100/80',
  iconBg: 'bg-pink-200/60',
  iconColor: 'text-pink-500',
  textColor: 'text-pink-700',
  isSpecialAction: true,
  specialAction: 'experiencia',
  restrictedStores: ['BTA 78', 'TUNJA 2', 'BTA 62', 'BTA 28', 'BTA 89', 'TUNJA 1', 'BTA 16']
}];


// Confetti pastel muy sutil
const PastelConfetti = () =>
<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(10)].map((_, i) =>
  <motion.div
    key={i}
    className="absolute w-1 h-1 rounded-full"
    style={{
      left: `${Math.random() * 100}%`,
      background: ['#fce7f3', '#f3e8ff', '#e0f2fe', '#fef3c7', '#ecfdf5'][i % 5]
    }}
    initial={{ y: -20, opacity: 0 }}
    animate={{
      y: window.innerHeight + 50,
      opacity: [0, 0.2, 0.2, 0],
      rotate: [0, 360]
    }}
    transition={{
      duration: 14 + Math.random() * 4,
      delay: i * 0.6,
      repeat: Infinity,
      ease: "linear"
    }} />

  )}
  </div>;


export default function Home() {
  const [selectedStore, setSelectedStore] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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
    const iconColor = isSelected ? '#ffffff' : role?.iconBaseColor || '#6b7280';

    if (roleId === 'gerente') {
      // Maletín ejecutivo con color
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.rect x="4" y="8" width="16" height="12" rx="2" stroke={iconColor} strokeWidth="2" fill={isSelected ? 'none' : 'rgba(71,85,105,0.1)'} animate={isSelected ? { scale: [1, 1.02, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
          <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke={iconColor} strokeWidth="2" fill="none" />
          <motion.line x1="4" y1="12" x2="20" y2="12" stroke={iconColor} strokeWidth="2" animate={isSelected ? { opacity: [0.5, 1, 0.5] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
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

  // Fetch store passwords
  const { data: storePasswords = [] } = useQuery({
    queryKey: ['storePasswords'],
    queryFn: () => base44.entities.StorePassword.list()
  });

  // Fetch role passwords
  const { data: rolePasswords = [] } = useQuery({
    queryKey: ['rolePasswords'],
    queryFn: () => base44.entities.RolePassword.list()
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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

    // Recordar último rol usado
    if (!isLoggedIn && lastRole) {
      setSelectedRole(lastRole);
    }

    localStorage.setItem('lastVisitTime', now.toString());
  }, []);

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

      // Gerente con clave 1998 - redirigir directo al panel ejecutivo
      if (selectedRole === 'gerente') {
        if (loginPassword === '1998') {
          localStorage.setItem('userRole', selectedRole);
          localStorage.setItem('popsySession', JSON.stringify({ role: selectedRole, time: Date.now() }));
          
          // Mostrar éxito antes de redirigir
          setLoginSuccess(true);
          setTimeout(() => {
            window.location.href = createPageUrl('ExecutiveDashboard');
          }, 800);
          return;
        } else {
          setLoginError('Contraseña de gerente incorrecta');
          setIsSubmitting(false);
          return;
        }
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
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-pink-50/40 relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/20 via-rose-400/15 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-48 -left-48 w-[700px] h-[700px] bg-gradient-to-br from-purple-400/15 via-blue-400/10 to-transparent rounded-full blur-3xl"
          />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]"
               style={{
                 backgroundImage: 'linear-gradient(rgba(100,100,100,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.1) 1px, transparent 1px)',
                 backgroundSize: '80px 80px'
               }}
          />
        </div>

        <div className="flex min-h-screen relative z-10">
          {/* Left Panel - Branding (55%) - Hidden on Mobile */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden lg:flex lg:w-[55%] relative px-12 xl:px-20 py-20 flex-col justify-center"
          >
            <div className="max-w-xl">
              {/* Logo */}
              <motion.img
                src={LOGO_URL}
                alt="Popsy Management"
                className="h-16 xl:h-20 object-contain mb-16 xl:mb-20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              />

              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-8 xl:space-y-10"
              >
                <div>
                  <h1 className="text-5xl xl:text-6xl font-bold leading-[1.05] mb-6">
                    <span className="text-slate-900">Bienvenido a</span><br />
                    <span className="bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                      Popsy Management
                    </span>
                  </h1>
                  <p className="text-lg xl:text-xl text-slate-600 leading-relaxed">
                    Plataforma de gestión empresarial para equipos de alto rendimiento
                  </p>
                </div>

                {/* Feature list */}
                <div className="space-y-6 xl:space-y-7 pt-6">
                  {[
                    { icon: TrendingUp, title: 'Métricas y KPIs en tiempo real', text: 'Monitoreo continuo del desempeño empresarial' },
                    { icon: Users, title: 'Gestión inteligente de equipos', text: 'Optimiza recursos y maximiza productividad' },
                    { icon: Target, title: 'Seguimiento automático de objetivos', text: 'Cumple tus metas con análisis predictivo' }
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.15 }}
                      className="flex items-start gap-5"
                    >
                      <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/25">
                        <feature.icon className="w-7 h-7 xl:w-8 xl:h-8 text-white" />
                      </div>
                      <div className="pt-3">
                        <p className="text-slate-900 font-bold text-lg xl:text-xl mb-1.5">{feature.title}</p>
                        <p className="text-slate-600 text-sm xl:text-base leading-relaxed">{feature.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Panel - Login Card (45%) - Mobile First */}
          <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-6 lg:p-12 xl:p-16 min-h-screen lg:min-h-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="w-full max-w-md lg:max-w-lg xl:max-w-xl"
            >
              {/* Mobile logo and branding */}
              <div className="lg:hidden mb-8 text-center">
                <motion.img 
                  src={LOGO_URL} 
                  alt="Popsy" 
                  className="h-16 object-contain mx-auto mb-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                />
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Popsy Management</h2>
                <p className="text-slate-600 text-base">Sistema de gestión empresarial</p>
              </div>

              {/* Login Card - Optimized for mobile */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl lg:rounded-[32px] shadow-2xl border border-slate-200/60 p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6 lg:space-y-8"
                   style={{ boxShadow: '0 25px 80px -15px rgba(236, 72, 153, 0.2), 0 10px 30px -10px rgba(0, 0, 0, 0.1)' }}>

                {/* Header - Mobile optimized */}
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2 lg:mb-3">
                    Iniciar sesión
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600">Selecciona tu rol para comenzar</p>
                </div>

                {/* Selector de Rol como Cards - Mobile First */}
                <div className="space-y-3 lg:space-y-4">
                  {ROLES.map((role) => {
                    const isSelected = selectedRole === role.id;

                    return (
                      <motion.button
                        key={role.id}
                        onClick={() => {setSelectedRole(role.id);setLoginError('');}}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative w-full p-4 sm:p-5 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-3 sm:gap-4 lg:gap-5 touch-manipulation ${
                          isSelected
                            ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 shadow-lg shadow-pink-500/20'
                            : 'border-slate-200 bg-white hover:border-pink-300 hover:shadow-md active:border-pink-400'
                        }`}
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30' 
                            : 'bg-slate-100'
                        }`}>
                          <div className="w-7 h-7 sm:w-8 sm:h-8">
                            <RoleIcon roleId={role.id} isSelected={isSelected} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-0.5 lg:mb-1">
                            {role.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {role.description}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 shadow-md"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Info para gerente - Mobile optimized */}
                {selectedRole === 'gerente' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl lg:rounded-2xl"
                  >
                    <p className="text-xs sm:text-sm text-blue-700 flex items-center gap-2 font-medium">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>Acceso a panel ejecutivo global</span>
                    </p>
                  </motion.div>
                )}

                {/* Selector de tienda - Mobile optimized */}
                {selectedRole && selectedRole !== 'gerente' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <label htmlFor="store-selector" className="block text-sm sm:text-base font-bold text-slate-900 mb-2.5 lg:mb-3">
                      Selecciona tu tienda
                    </label>
                    <StoreSelector
                      selectedStore={pendingStore}
                      onStoreChange={handleStoreSelect} />
                  </motion.div>
                )}

                {/* Campo de contraseña - Mobile optimized */}
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <label htmlFor="login-password" className="block text-sm sm:text-base font-bold text-slate-900 mb-2.5 lg:mb-3">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Sin contraseña"
                        value={loginPassword}
                        onChange={(e) => {setLoginPassword(e.target.value);setLoginError('');}}
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleLogin()}
                        disabled={isSubmitting}
                        className="w-full pl-11 sm:pl-12 pr-11 sm:pr-12 py-3.5 sm:py-4 border-2 border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm sm:text-base text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
                        aria-label="Campo de contraseña"
                        aria-invalid={!!loginError}
                        aria-describedby={loginError ? "password-error" : undefined} />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:text-slate-700 transition-colors touch-manipulation"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-3.5 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl lg:rounded-2xl"
                    id="password-error"
                    role="alert">
                    <p className="text-red-600 text-xs sm:text-sm flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      {loginError}
                    </p>
                  </motion.div>
                )}

                {/* Botón de ingresar - Mobile optimized */}
                <Button
                  onClick={handleLogin}
                  disabled={(selectedRole !== 'gerente' && !pendingStore) || !selectedRole || isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 hover:from-pink-600 hover:via-pink-700 hover:to-rose-700 active:from-pink-700 active:via-pink-800 active:to-rose-800 text-white py-4 sm:py-5 rounded-xl lg:rounded-2xl font-bold text-base sm:text-lg shadow-2xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 touch-manipulation"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Ingresando...
                    </span>
                  ) : (
                    'Gestionar mi punto'
                  )}
                </Button>

                {/* Footer text - Mobile optimized */}
                <div className="text-center pt-1">
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Tu acceso define lo que puedes ver y gestionar.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {loginSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-white rounded-full p-6 shadow-2xl"
              >
                <CheckCircle className="w-20 h-20 text-emerald-600" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popsy Story Modal */}
        <AnimatePresence>
          {showStory && <PopsyStoryModal onClose={() => setShowStory(false)} />}
        </AnimatePresence>
      </div>);

  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <PastelConfetti />
      <FloatingIceCreamsBg />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">


        {/* Header con logo animado premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6">

          <motion.img
            src={LOGO_URL}
            alt="Popsy"
            className="h-32 sm:h-36 md:h-40 object-contain mx-auto mb-2 cursor-pointer drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: [1, 1.03, 0.98, 1.02, 1],
              y: [0, -8, 0, -4, 0]
            }}
            transition={{
              opacity: { duration: 0.8, ease: "easeOut" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStory(true)} />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-sm mb-3">

            Sistema de Gestión
          </motion.p>
          
          {/* Store Selector */}
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>

            <p className="text-gray-600 font-medium text-sm">¿A qué tienda deseas ingresar?</p>
            <StoreSelector
              selectedStore={selectedStore}
              onStoreChange={handleStoreChange} />

          </motion.div>
        </motion.div>

        {/* Quick Actions - Más dinámicos */}
        {selectedStore &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex justify-center gap-2 flex-wrap">

            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem('selectedStore');
                localStorage.removeItem('popsySession');
                window.location.href = '/Home';
              }}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4 mr-1" />
                Cerrar Sesión
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBudgetDashboard(true)}
              className="text-gray-500 hover:text-sky-600 hover:bg-sky-50 transition-all">

                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Target className="w-4 h-4 mr-1" />
                </motion.div>
                Presupuestos
              </Button>
            </motion.div>
            <Link to={createPageUrl('PopsyPlanner')}>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all">

                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                  </motion.div>
                  Planner
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstall(true)}
              className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all">

                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Download className="w-4 h-4 mr-1" />
                </motion.div>
                Instalar App
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReport(true)}
              className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all">

                <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <FileText className="w-4 h-4 mr-1" />
                </motion.div>
                Informe Gerencial
              </Button>
            </motion.div>
          </motion.div>
        }

        {/* Menu Grid */}
        {(selectedStore || selectedRole === 'gerente') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">

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
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                whileHover={!isLocked ? { y: -8, scale: 1.05 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}>

                  {isLocked ?
                <motion.div
                  className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm opacity-60 cursor-not-allowed`}>

                      {/* Lock overlay */}
                      <div className="absolute inset-0 bg-gray-900/10 rounded-2xl flex items-center justify-center z-20">
                        <Lock className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center relative z-10">
                        <motion.div
                      className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}>

                          <Icon className={`w-6 h-6 ${item.iconColor}`} />
                        </motion.div>
                        <h3 className={`font-bold ${item.textColor} text-sm`}>
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </motion.div> :
                item.isSpecialAction && item.specialAction === 'comparable' ?
                <Link to={createPageUrl('ExecutiveDashboard') + '?comparison=true'}>
                  <motion.div
                    className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm cursor-pointer`}>
                    
                    {/* Subtle glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                    {/* Icon centered */}
                    <div className="flex flex-col items-center justify-center text-center relative z-10">
                      <motion.div
                        className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </motion.div>
                      <h3 className={`font-bold ${item.textColor} text-sm`}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </motion.div>
                </Link> :
                item.isSpecialAction ?
                <motion.div
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
                    } else {
                      setShowStoreSales(true);
                    }
                  }}
                  className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm cursor-pointer`}>

                  {/* Subtle glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                  {/* Icon centered */}
                  <div className="flex flex-col items-center justify-center text-center relative z-10">
                    <motion.div
                    className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    animate={item.specialAction === 'backup' && backupLoading ? { rotate: 360 } : {}}
                    style={{ transition: backupLoading ? 'none' : undefined }}>
                    {item.icon ? (
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    ) : (
                    <LogOut className={`w-6 h-6 ${item.iconColor}`} />
                    )}
                    </motion.div>
                    <h3 className={`font-bold ${item.textColor} text-sm`}>
                      {item.specialAction === 'backup' && backupLoading ? 'Guardando...' : item.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </motion.div> :

                <Link to={createPageUrl(item.page)}>
                      <motion.div
                    className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm`}>

                        {/* Subtle glow effect */}
                        <motion.div
                      className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />


                        {/* Icon centered */}
                        <div className="flex flex-col items-center justify-center text-center relative z-10">
                          <motion.div
                        className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}>

                            <Icon className={`w-6 h-6 ${item.iconColor}`} />
                          </motion.div>
                          <h3 className={`font-bold ${item.textColor} text-sm`}>
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                      </motion.div>
                    </Link>
                }
                </motion.div>);

          })}
        </motion.div>
        )}
        
      </div>



      {/* Notifications Setup Modal */}
      <AnimatePresence>
        {showNotifications &&
        <NotificationSetup
          storeId={selectedStore}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)} />

        }
      </AnimatePresence>

      {/* Popsy Story Modal */}
      <AnimatePresence>
        {showStory &&
        <PopsyStoryModal onClose={() => setShowStory(false)} />
        }
      </AnimatePresence>

      {/* Directory Modal */}
      <AnimatePresence>
        {showDirectory &&
        <DirectoryModal onClose={() => setShowDirectory(false)} />
        }
      </AnimatePresence>

      {/* Welcome Toast */}
      <AnimatePresence>
        {showWelcome && selectedStore &&
        <WelcomeToast
          storeName={selectedStoreName}
          storeCode={selectedStore}
          onClose={() => setShowWelcome(false)} />

        }
      </AnimatePresence>

      {/* Managerial Report Modal */}
      <AnimatePresence>
        {showReport &&
        <ManagerialReportModal
          storeId={selectedStore}
          storeName={selectedStoreName}
          storeCode={selectedStore}
          onClose={() => setShowReport(false)} />

        }
      </AnimatePresence>

      {/* Budget Dashboard Modal */}
      <MonthlyBudgetDashboard
        storeId={selectedStore}
        storeName={selectedStoreName}
        isOpen={showBudgetDashboard}
        onClose={() => setShowBudgetDashboard(false)} />




      {/* Store Sales Modal */}
      <AnimatePresence>
        {showStoreSales &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowStoreSales(false)}>

            <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-amber-50/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 border border-pink-200/50">

              <div className="bg-gradient-to-r from-pink-400/90 via-rose-400/90 to-pink-400/90 p-5 text-white text-center relative">
                <button
                onClick={() => setShowStoreSales(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">

                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Registrar Ventas</h2>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-pink-200/50 bg-white/50">
                <button
                onClick={() => setSalesTab('tienda')}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                salesTab === 'tienda' ?
                'text-pink-600' :
                'text-gray-500 hover:text-pink-500'}`
                }>

                  <span className="flex items-center justify-center gap-2">
                    🏪 Venta de Tienda
                  </span>
                  {salesTab === 'tienda' &&
                <motion.div
                  layoutId="salesTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-t-full" />

                }
                </button>
                <button
                onClick={() => setSalesTab('cajero')}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all relative ${
                salesTab === 'cajero' ?
                'text-violet-600' :
                'text-gray-500 hover:text-violet-500'}`
                }>

                  <span className="flex items-center justify-center gap-2">
                    👤 Venta de Cajero
                  </span>
                  {salesTab === 'cajero' &&
                <motion.div
                  layoutId="salesTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-full" />

                }
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {salesTab === 'tienda' ?
                <motion.div
                  key="tienda"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}>

                      <DailySalesForm
                    storeId={selectedStore}
                    onSuccess={() => {
                      setShowStoreSales(false);
                    }} />

                    </motion.div> :

                <motion.div
                  key="cajero"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}>

                      <ShiftRecordForm
                    storeId={selectedStore}
                    onSuccess={() => {}} />

                    </motion.div>
                }
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Experiencia Popsy Modal */}
      <AnimatePresence>
        {showExperienciaPopsy && (
          <ExperienciaPopsyModal
            onClose={() => setShowExperienciaPopsy(false)}
            storeId={selectedStore}
            userId="temp_user"
            userName="Usuario"
            userRole={selectedRole}
          />
        )}
      </AnimatePresence>

      {/* Install App Modal */}
      <AnimatePresence>
        {showInstall &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstall(false)}>

            <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-white text-center">
                <Download className="w-10 h-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Instalar Popsy App</h2>
                <p className="text-white/80 text-sm">Accede más rápido desde tu dispositivo</p>
              </div>

              <div className="p-5 space-y-4">
                <Button
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      setDeferredPrompt(null);
                      setShowInstall(false);
                    }
                  } else {
                    // Para iOS/Safari mostrar instrucciones rápidas
                    alert('Para instalar:\n\niPhone/iPad: Toca Compartir ⬆️ → "Añadir a inicio"\n\nAndroid: Menú ⋮ → "Instalar app"\n\nPC: Busca el ícono ⊕ en la barra de Chrome');
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6">

                    <Download className="w-5 h-5 mr-2" />
                    {deferredPrompt ? 'Instalar ahora' : 'Ver instrucciones'}
                  </Button>
              </div>

              <div className="p-4 bg-gray-50 border-t text-center">
                <Button variant="ghost" onClick={() => setShowInstall(false)} className="text-gray-500">
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}