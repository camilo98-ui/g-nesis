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
import DailySalesForm from '@/components/forms/DailySalesForm';
import ShiftRecordForm from '@/components/forms/ShiftRecordForm';
import MonthlyBudgetDashboard from '@/components/budget/MonthlyBudgetDashboard';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, TrendingUp,
  Award, Target, Bell, Phone, Download, FileText,
  Lock, Eye, EyeOff, Receipt, Snowflake } from
'lucide-react';
import { Button } from "@/components/ui/button";

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
  name: 'Presupuestos',
  page: 'Budget',
  icon: Target,
  description: 'Metas',
  bgColor: 'bg-gradient-to-br from-sky-100/90 to-blue-100/80',
  iconBg: 'bg-sky-200/60',
  iconColor: 'text-sky-500',
  textColor: 'text-sky-700',
  isSpecialAction: true,
  specialAction: 'budgetTrend'
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

  const ROLES = [
  { id: 'gerente', name: 'Gerente', icon: 'gerente', color: 'from-slate-600 to-gray-700', description: '🎯 Poder total', iconBaseColor: '#475569', hasExecutivePanel: true },
  { id: 'lider', name: 'Lider de Experiencia', icon: 'lider', color: 'from-amber-400 to-yellow-500', description: '⭐ Full acceso', iconBaseColor: '#f59e0b' },
  { id: 'embajador', name: 'Embajador', icon: 'embajador', color: 'from-pink-400 to-rose-500', description: '🍦 Team hero', iconBaseColor: '#ec4899' }];


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

    localStorage.setItem('lastVisitTime', now.toString());
  }, []);

  const handleStoreSelect = (store) => {
    setPendingStore(store);
    setLoginPassword('');
    setLoginError('');
  };

  const handleLogin = () => {
      if (!selectedRole) {
        setLoginError('Selecciona un rol');
        return;
      }

      // Gerente con clave 1998 - redirigir directo al panel ejecutivo
      if (selectedRole === 'gerente') {
        if (loginPassword === '1998') {
          localStorage.setItem('userRole', selectedRole);
          localStorage.setItem('popsySession', JSON.stringify({ role: selectedRole, time: Date.now() }));
          // Redirigir inmediatamente al panel ejecutivo
          window.location.href = createPageUrl('ExecutiveDashboard');
          return;
        } else {
          setLoginError('Contraseña de gerente incorrecta');
          return;
        }
      }

    // Para otros roles: validar contraseña de tienda
    if (!pendingStore) {
      setLoginError('Selecciona una tienda');
      return;
    }

    const storePassword = storePasswords.find((p) => p.store_code === pendingStore);

    if (!storePassword?.password || loginPassword === storePassword.password) {
      setSelectedStore(pendingStore);
      setIsLoggedIn(true);
      localStorage.setItem('selectedStore', pendingStore);
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('popsySession', JSON.stringify({ store: pendingStore, role: selectedRole, time: Date.now() }));
      setShowWelcome(true);
      setPendingStore('');
      setLoginPassword('');
    } else {
      setLoginError('Contraseña incorrecta');
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
      <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
        <PastelConfetti />
        <FloatingIceCreamsBg />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md my-auto">

          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-pink-100"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.25)" }}>

            {/* Logo animado */}
            <motion.img
              src={LOGO_URL}
              alt="Popsy"
              className="h-32 object-contain mx-auto mb-4 cursor-pointer"
              animate={{
                y: [0, -8, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              onClick={() => setShowStory(true)} />

            
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}>

              <motion.h2
                animate={{
                  scale: [1, 1.03, 1],
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ 
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
                }}
                className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] drop-shadow-sm"
              >
                {selectedRole === 'gerente' ? '¡Hola Gerente!' : selectedRole === 'lider' ? '¡Hola Líder!' : selectedRole === 'embajador' ? '¡Hola Embajador!' : '¡Bienvenido!'}
              </motion.h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedRole === 'gerente' ? 'El poder en tus manos' : selectedRole === 'lider' ? 'Listo para brillar' : selectedRole === 'embajador' ? 'El corazón del equipo' : 'Selecciona tu rol'}
              </p>
            </motion.div>

            {/* Selector de Rol */}
            <motion.div
              className="mb-4 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}>

              <div className="w-full md:w-[380px] space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4 font-medium">¿Quién eres hoy?</p>
                <div className="grid grid-cols-1 gap-3">
                  {ROLES.map((role, idx) =>
                  <motion.button
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {setSelectedRole(role.id);setLoginError('');}}
                    className={`relative p-4 rounded-2xl border-2 transition-all overflow-hidden ${
                    selectedRole === role.id ?
                    'border-transparent shadow-2xl' :
                    'border-gray-200 bg-white hover:border-pink-200 hover:shadow-lg'}`
                    }>

                      {/* Background gradient when selected */}
                      <AnimatePresence>
                        {selectedRole === role.id &&
                      <motion.div
                        layoutId="roleBackground"
                        className={`absolute inset-0 bg-gradient-to-br ${role.color}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} />

                      }
                      </AnimatePresence>

                      <div className="relative z-10 flex items-center gap-4">
                        {/* Icon container con animación */}
                        <motion.div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg ${
                        selectedRole === role.id ?
                        `bg-gradient-to-br ${role.color}` :
                        'bg-gradient-to-br from-gray-100 to-gray-200'}`
                        }
                        animate={selectedRole === role.id ? {
                          scale: [1, 1.08, 1],
                          rotate: [0, -3, 3, 0]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}>

                          <div className="w-7 h-7">
                            <RoleIcon roleId={role.id} isSelected={selectedRole === role.id} />
                          </div>
                        </motion.div>

                        <div className="text-left flex-1">
                          <p className={`text-base font-black leading-tight mb-1 ${
                        selectedRole === role.id ?
                        role.id === 'gerente' ? 'text-slate-700' : role.id === 'lider' ? 'text-amber-700' : 'text-pink-700' :
                        'text-gray-700'}`
                        }>
                            {role.name}
                          </p>
                          <p className={`text-xs font-medium ${
                        selectedRole === role.id ?
                        role.id === 'gerente' ? 'text-slate-600' : role.id === 'lider' ? 'text-amber-600' : 'text-pink-600' :
                        'text-gray-500'}`
                        }>
                            {role.description}
                          </p>
                        </div>

                        {/* Check indicator */}
                        <AnimatePresence>
                          {selectedRole === role.id &&
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg`}>

                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                        }
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Selector de tienda - Centrado (oculto para gerente) */}
            {selectedRole && selectedRole !== 'gerente' && (
              <motion.div
                className="mb-4 flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}>

                <StoreSelector
                  selectedStore={pendingStore}
                  onStoreChange={handleStoreSelect} />

              </motion.div>
            )}

            {/* Campo de contraseña */}
            {selectedRole &&
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-4 flex flex-col items-center">

                <Button
                variant="outline"
                className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-md hover:shadow-lg rounded-xl justify-between group h-auto py-2.5"
                onClick={() => {}}>

                  <div className="flex items-center gap-2 w-full">
                    <Lock className="w-4 h-4 text-pink-500" />
                    <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder={isGerente ? "Contraseña de gerente" : needsPassword ? "Ingresa la contraseña" : "Sin contraseña requerida"}
                    value={loginPassword}
                    onChange={(e) => {setLoginPassword(e.target.value);setLoginError('');}}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="flex-1 bg-transparent border-none outline-none text-pink-600 font-medium placeholder:text-gray-500 text-sm" />

                    <button
                    type="button"
                    onClick={(e) => {e.stopPropagation();setShowLoginPassword(!showLoginPassword);}}
                    className="text-gray-400 hover:text-pink-500">

                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Button>
              </motion.div>
            }

            {loginError &&
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs text-center mb-2">

                {loginError}
              </motion.p>
            }

            {/* Botón de ingresar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}>

              <Button
                onClick={handleLogin}
                disabled={(selectedRole !== 'gerente' && !pendingStore) || !selectedRole}
                className="w-full bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 hover:from-pink-500 hover:via-pink-600 hover:to-rose-600 text-white py-6 rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />

                <motion.span
                  animate={{ scale: pendingStore && selectedRole ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 relative z-10 text-lg font-bold">

                  {/* Helado de chocolate */}
                  <svg viewBox="0 0 40 65" className="w-6 h-9">
                    <defs>
                      <linearGradient id="coneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    {/* Cono */}
                    <polygon points="10,22 20,58 30,22" fill="url(#coneGradient)" />
                    <line x1="13" y1="28" x2="27" y2="28" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                    <line x1="15" y1="36" x2="25" y2="36" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                    <line x1="17" y1="44" x2="23" y2="44" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                    {/* Helado chocolate */}
                    <circle cx="20" cy="14" r="12" fill="#5D3A1A" />
                    {/* Brillo */}
                    <ellipse cx="16" cy="10" rx="5" ry="3" fill="white" opacity="0.3" />
                  </svg>
                  {selectedRole === 'gerente' ? 'Acceder al Panel Ejecutivo' : 'Ingresar a la tienda'}
                </motion.span>
              </Button>
            </motion.div>

            {/* Decoración */}
            <motion.div
              className="mt-6 text-center"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}>

              <p className="text-xs text-gray-500 flex items-center justify-center gap-1 flex-wrap">
                Haciendo del mundo un lugar más
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-500 font-medium">dulce</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-500 font-medium">feliz</span>
                y
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-500 font-medium">divertido</span>
                🍨
              </p>
            </motion.div>
          </motion.div>

          {/* Partículas flotantes sutiles */}
          <motion.div
            className="absolute top-1/4 -left-3"
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}>

            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-200 to-rose-200" />
          </motion.div>
          <motion.div
            className="absolute bottom-1/3 -right-2"
            animate={{ y: [0, 10, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}>

            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-200" />
          </motion.div>
          </motion.div>

        {/* Popsy Story Modal */}
        <AnimatePresence>
          {showStory &&
          <PopsyStoryModal onClose={() => setShowStory(false)} />
          }
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
              onClick={() => setShowNotifications(true)}
              className="text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all">

                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Bell className="w-4 h-4 mr-1" />
                </motion.div>
                Alertas
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDirectory(true)}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">

                <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Phone className="w-4 h-4 mr-1" />
                </motion.div>
                Directorio
              </Button>
            </motion.div>
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
        {selectedStore || selectedRole === 'gerente' ?
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">

            {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;

            // Restricciones: Panel Ejecutivo solo para gerente, otras opciones solo si hay tienda seleccionada
            const needsStore = item.page !== 'ExecutiveDashboard';
            if (needsStore && !selectedStore) return null;
            if (item.requiredRole && selectedRole !== item.requiredRole) return null;

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
                item.isSpecialAction ?
                <motion.div
                  onClick={() => {
                    if (item.specialAction === 'budgetTrend') {
                      setShowBudgetDashboard(true);
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
                      transition={{ duration: 0.4 }}>

                          <Icon className={`w-6 h-6 ${item.iconColor}`} />
                        </motion.div>
                        <h3 className={`font-bold ${item.textColor} text-sm`}>
                          {item.name}
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
          </motion.div> :
        null}
        
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