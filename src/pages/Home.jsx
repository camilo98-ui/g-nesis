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
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, TrendingUp, 
  Award, Target, Bell, Phone, Download, Smartphone, Monitor, ClipboardCheck, FileText,
  LogOut, Lock, Eye, EyeOff
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startOfMonth } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const MENU_ITEMS = [
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
    name: 'Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Registrar',
    bgColor: 'bg-gradient-to-br from-emerald-100/90 to-teal-100/80',
    iconBg: 'bg-emerald-200/60',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-700'
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
    textColor: 'text-sky-700'
  },
  { 
    name: 'Calidad', 
    page: 'Quality',
    icon: ClipboardCheck, 
    description: 'Checklists',
    bgColor: 'bg-gradient-to-br from-rose-100/90 to-pink-100/80',
    iconBg: 'bg-rose-200/60',
    iconColor: 'text-rose-500',
    textColor: 'text-rose-700'
  },
];

// Confetti pastel muy sutil
const PastelConfetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          background: ['#fce7f3', '#f3e8ff', '#e0f2fe', '#fef3c7', '#ecfdf5'][i % 5],
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
        }}
      />
    ))}
  </div>
);

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

  const ROLES = [
    { id: 'lider', name: 'Líder de Experiencia', icon: 'lider', color: 'from-amber-400 to-yellow-500', description: 'Acceso completo' },
    { id: 'embajador', name: 'Embajador', icon: 'embajador', color: 'from-pink-400 to-rose-500', description: 'Acceso limitado' },
    { id: 'calidad', name: 'Calidad', icon: 'calidad', color: 'from-teal-400 to-cyan-500', description: 'Solo visualización' },
    { id: 'c_interno', name: 'C. Interno', icon: 'c_interno', color: 'from-violet-400 to-purple-500', description: 'Solo Planner' },
  ];

  // Iconos profesionales por rol
  const RoleIcon = ({ roleId, isSelected }) => {
    const iconColor = isSelected ? '#ffffff' : '#6b7280';
    
    if (roleId === 'lider') {
      // Corona profesional
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.path 
            d="M3 18h18v2H3v-2zm1-8l4 4 4-6 4 6 4-4v8H4v-8z" 
            fill={iconColor}
            animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle cx="5" cy="8" r="1.5" fill={isSelected ? '#fbbf24' : iconColor} animate={isSelected ? { opacity: [0.7, 1, 0.7] } : {}} transition={{ duration: 1, repeat: Infinity }} />
          <motion.circle cx="12" cy="5" r="2" fill={isSelected ? '#fbbf24' : iconColor} animate={isSelected ? { opacity: [0.7, 1, 0.7] } : {}} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
          <motion.circle cx="19" cy="8" r="1.5" fill={isSelected ? '#fbbf24' : iconColor} animate={isSelected ? { opacity: [0.7, 1, 0.7] } : {}} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
        </svg>
      );
    }
    if (roleId === 'embajador') {
      // Grupo de personas profesional
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.g animate={isSelected ? { y: [0, -1, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
            <circle cx="12" cy="6" r="3" fill={iconColor} />
            <path d="M12 11c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" fill={iconColor} />
          </motion.g>
          <motion.g animate={isSelected ? { y: [0, -1, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
            <circle cx="5" cy="9" r="2" fill={iconColor} opacity="0.7" />
            <path d="M5 12c-2 0-4 1.5-4 3v1h5v-2c0-.7.2-1.4.5-2H5z" fill={iconColor} opacity="0.7" />
          </motion.g>
          <motion.g animate={isSelected ? { y: [0, -1, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
            <circle cx="19" cy="9" r="2" fill={iconColor} opacity="0.7" />
            <path d="M19 12c2 0 4 1.5 4 3v1h-5v-2c0-.7-.2-1.4-.5-2h1.5z" fill={iconColor} opacity="0.7" />
          </motion.g>
        </svg>
      );
    }
    if (roleId === 'calidad') {
      // Checklist profesional
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke={iconColor} strokeWidth="2" fill="none" />
          <motion.path 
            d="M8 10l2 2 4-4" 
            stroke={isSelected ? '#22c55e' : iconColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
            animate={isSelected ? { pathLength: [0, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
          />
          <line x1="8" y1="16" x2="16" y2="16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (roleId === 'c_interno') {
      // Documento con lupa profesional
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={iconColor} strokeWidth="2" fill="none" />
          <path d="M14 2v6h6" stroke={iconColor} strokeWidth="2" fill="none" />
          <motion.circle 
            cx="11" cy="14" r="3" 
            stroke={iconColor} 
            strokeWidth="2" 
            fill="none"
            animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.line 
            x1="13.5" y1="16.5" x2="16" y2="19" 
            stroke={iconColor} 
            strokeWidth="2" 
            strokeLinecap="round"
            animate={isSelected ? { x2: [16, 17, 16], y2: [19, 20, 19] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
      );
    }
    return null;
  };

  // Fetch store passwords
  const { data: storePasswords = [] } = useQuery({
    queryKey: ['storePasswords'],
    queryFn: () => base44.entities.StorePassword.list(),
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
    if (lastVisit && (now - parseInt(lastVisit)) > 4 * 60 * 60 * 1000) {
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
    
    // Calidad y C. Interno no requieren contraseña
    if (selectedRole === 'calidad' || selectedRole === 'c_interno') {
      setSelectedStore(pendingStore);
      setIsLoggedIn(true);
      localStorage.setItem('selectedStore', pendingStore);
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('popsySession', JSON.stringify({ store: pendingStore, role: selectedRole, time: Date.now() }));
      setShowWelcome(true);
      setPendingStore('');
      setLoginPassword('');
      return;
    }
    
    const storePassword = storePasswords.find(p => p.store_code === pendingStore);
    
    // Si no tiene contraseña o la contraseña coincide
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

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const needsPassword = pendingStore && selectedRole !== 'calidad' && selectedRole !== 'c_interno' && storePasswords.find(p => p.store_code === pendingStore)?.password;

  // Si no está logueado, mostrar pantalla de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-pink-50/30 to-purple-50/20 relative overflow-hidden flex items-center justify-center">
        <PastelConfetti />
        <FloatingIceCreamsBg />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-pink-100"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.25)" }}
          >
            {/* Logo animado */}
            <motion.img 
              src={LOGO_URL} 
              alt="Popsy" 
              className="h-20 object-contain mx-auto mb-4 cursor-pointer"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              onClick={() => setShowStory(true)}
            />
            
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                {selectedRole === 'calidad' ? '¡Hola María!' : selectedRole === 'c_interno' ? '¡Hola Julián!' : '¡Bienvenido!'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa para continuar</p>
            </motion.div>

            {/* Selector de Rol */}
            <motion.div 
              className="mb-4 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="w-full md:w-[340px] space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">Selecciona tu rol</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role, idx) => (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedRole(role.id); setLoginError(''); }}
                      className={`relative p-3 rounded-xl border-2 transition-all overflow-hidden ${
                        selectedRole === role.id
                          ? 'border-transparent shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Background gradient when selected */}
                      {selectedRole === role.id && (
                        <motion.div 
                          layoutId="roleBackground"
                          className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-20`}
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-2">
                        {/* Icon container con animación */}
                        <motion.div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
                            selectedRole === role.id 
                              ? `bg-gradient-to-br ${role.color} shadow-md` 
                              : 'bg-gray-100'
                          }`}
                          animate={selectedRole === role.id ? { 
                            scale: [1, 1.05, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="w-5 h-5">
                            <RoleIcon roleId={role.id} isSelected={selectedRole === role.id} />
                          </div>
                        </motion.div>
                        
                        <div className="text-left flex-1">
                          <p className={`text-xs font-bold leading-tight ${
                            selectedRole === role.id ? 'text-gray-800' : 'text-gray-700'
                          }`}>
                            {role.name}
                          </p>
                          <p className={`text-[9px] ${
                            selectedRole === role.id ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {role.description}
                          </p>
                        </div>
                        
                        {/* Check indicator */}
                        {selectedRole === role.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center`}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Selector de tienda - Centrado */}
            <motion.div 
              className="mb-4 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StoreSelector 
                selectedStore={pendingStore} 
                onStoreChange={handleStoreSelect}
              />
            </motion.div>

            {/* Campo de contraseña - Solo si no es Calidad ni C. Interno */}
            {selectedRole !== 'calidad' && selectedRole !== 'c_interno' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-4 flex flex-col items-center"
              >
                <Button 
                  variant="outline" 
                  className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-md hover:shadow-lg rounded-xl justify-between group h-auto py-2.5"
                  onClick={() => {}}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Lock className="w-4 h-4 text-pink-500" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder={needsPassword ? "Ingresa la contraseña" : "Sin contraseña requerida"}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="flex-1 bg-transparent border-none outline-none text-pink-600 font-medium placeholder:text-gray-500 text-sm"
                      disabled={!needsPassword && pendingStore}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowLoginPassword(!showLoginPassword); }}
                      className="text-gray-400 hover:text-pink-500"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Button>
              </motion.div>
            )}

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs text-center mb-2"
              >
                {loginError}
              </motion.p>
            )}

            {/* Botón de ingresar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleLogin}
                disabled={!pendingStore || !selectedRole}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.span
                  animate={{ scale: pendingStore && selectedRole ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  🍦 Ingresar a la tienda
                </motion.span>
              </Button>
            </motion.div>

            {/* Decoración */}
            <motion.div 
              className="mt-6 text-center"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
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

          {/* Decoración flotante - Cambia según el rol */}
          {selectedRole === 'lider' ? (
            /* Líder - Persona con corona */
            <>
              <motion.div
                className="absolute -top-6 -right-6"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 60 80" className="w-20 h-24 drop-shadow-lg">
                  {/* Corona */}
                  <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <path d="M15 25 L20 15 L25 22 L30 10 L35 22 L40 15 L45 25 L42 28 L18 28 Z" fill="#fbbf24" />
                    <circle cx="20" cy="15" r="2" fill="#ef4444" />
                    <circle cx="30" cy="10" r="2.5" fill="#3b82f6" />
                    <circle cx="40" cy="15" r="2" fill="#22c55e" />
                    <motion.path d="M15 25 L20 15 L25 22 L30 10 L35 22 L40 15 L45 25" stroke="#f59e0b" strokeWidth="1" fill="none" animate={{ strokeDashoffset: [0, 10] }} transition={{ duration: 2, repeat: Infinity }} />
                  </motion.g>
                  {/* Cabeza */}
                  <circle cx="30" cy="40" r="12" fill="#fcd9b6" />
                  <ellipse cx="26" cy="38" rx="2" ry="2.5" fill="#1e293b" />
                  <ellipse cx="34" cy="38" rx="2" ry="2.5" fill="#1e293b" />
                  <motion.path d="M26 46 Q30 50 34 46" stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ d: ["M26 46 Q30 50 34 46", "M26 46 Q30 52 34 46", "M26 46 Q30 50 34 46"] }} transition={{ duration: 2, repeat: Infinity }} />
                  {/* Cuerpo */}
                  <path d="M18 52 Q30 48 42 52 L44 72 L16 72 Z" fill="#ec4899" />
                  <motion.ellipse cx="30" cy="60" rx="8" ry="3" fill="#f472b6" animate={{ ry: [3, 4, 3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </svg>
              </motion.div>
              <motion.div className="absolute -bottom-4 -left-4" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className="text-3xl">👑</span>
              </motion.div>
            </>
          ) : selectedRole === 'embajador' ? (
            /* Embajador - Grupo de personas */
            <>
              <motion.div
                className="absolute -top-4 -right-4"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 80 70" className="w-24 h-20 drop-shadow-lg">
                  {/* Persona 1 - izquierda */}
                  <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>
                    <circle cx="18" cy="25" r="10" fill="#fcd9b6" />
                    <ellipse cx="15" cy="24" rx="1.5" ry="2" fill="#1e293b" />
                    <ellipse cx="21" cy="24" rx="1.5" ry="2" fill="#1e293b" />
                    <path d="M15 29 Q18 32 21 29" stroke="#ec4899" strokeWidth="1.5" fill="none" />
                    <path d="M8 35 Q18 32 28 35 L30 55 L6 55 Z" fill="#8b5cf6" />
                  </motion.g>
                  {/* Persona 2 - centro */}
                  <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}>
                    <circle cx="40" cy="20" r="11" fill="#e5c8a8" />
                    <ellipse cx="36" cy="19" rx="1.8" ry="2.2" fill="#1e293b" />
                    <ellipse cx="44" cy="19" rx="1.8" ry="2.2" fill="#1e293b" />
                    <motion.path d="M36 25 Q40 29 44 25" stroke="#ec4899" strokeWidth="2" fill="none" animate={{ d: ["M36 25 Q40 29 44 25", "M36 25 Q40 31 44 25"] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <path d="M26 32 Q40 28 54 32 L56 58 L24 58 Z" fill="#ec4899" />
                  </motion.g>
                  {/* Persona 3 - derecha */}
                  <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.1, repeat: Infinity, delay: 0.6 }}>
                    <circle cx="62" cy="25" r="10" fill="#d4a88e" />
                    <ellipse cx="59" cy="24" rx="1.5" ry="2" fill="#1e293b" />
                    <ellipse cx="65" cy="24" rx="1.5" ry="2" fill="#1e293b" />
                    <path d="M59 29 Q62 32 65 29" stroke="#ec4899" strokeWidth="1.5" fill="none" />
                    <path d="M52 35 Q62 32 72 35 L74 55 L50 55 Z" fill="#06b6d4" />
                  </motion.g>
                </svg>
              </motion.div>
              <motion.div className="absolute -bottom-3 -left-3 flex" animate={{ x: [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-2xl">🙋</motion.span>
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="text-2xl -ml-1">🙋‍♀️</motion.span>
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="text-2xl -ml-1">🙋‍♂️</motion.span>
              </motion.div>
            </>
          ) : selectedRole === 'calidad' ? (
            /* Calidad - Limpieza y desinfección */
            <>
              <motion.div
                className="absolute -top-6 -right-6"
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  y: [0, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 60 80" className="w-18 h-24 drop-shadow-lg">
                  {/* Botella spray */}
                  <rect x="20" y="30" width="20" height="35" rx="3" fill="#06b6d4" />
                  <rect x="22" y="32" width="16" height="8" fill="#0891b2" opacity="0.5" />
                  <rect x="26" y="20" width="8" height="12" fill="#334155" />
                  <rect x="24" y="15" width="12" height="6" rx="2" fill="#475569" />
                  <motion.path d="M18 18 L12 10" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  <motion.path d="M15 22 L8 18" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                  <motion.path d="M16 26 L6 26" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                  <text x="30" y="55" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">✓</text>
                </svg>
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4"
                animate={{ rotate: [-20, 20, -20], x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg viewBox="0 0 50 60" className="w-14 h-16 drop-shadow-lg">
                  {/* Escoba/Cepillo */}
                  <rect x="23" y="5" width="4" height="35" fill="#92400e" rx="1" />
                  <path d="M12 40 L38 40 L35 58 L15 58 Z" fill="#22c55e" />
                  <line x1="15" y1="45" x2="15" y2="55" stroke="#16a34a" strokeWidth="2" />
                  <line x1="20" y1="44" x2="20" y2="56" stroke="#16a34a" strokeWidth="2" />
                  <line x1="25" y1="44" x2="25" y2="56" stroke="#16a34a" strokeWidth="2" />
                  <line x1="30" y1="44" x2="30" y2="56" stroke="#16a34a" strokeWidth="2" />
                  <line x1="35" y1="45" x2="35" y2="55" stroke="#16a34a" strokeWidth="2" />
                </svg>
              </motion.div>
              <motion.div className="absolute top-1/2 -left-6" animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <span className="text-xl">✨</span>
              </motion.div>
              <motion.div className="absolute top-1/4 -right-3" animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}>
                <span className="text-lg">🧴</span>
              </motion.div>
            </>
          ) : selectedRole === 'c_interno' ? (
            /* C. Interno - Chico con gafas */
            <>
              <motion.div
                className="absolute -top-6 -right-6"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 60 80" className="w-20 h-24 drop-shadow-lg">
                  {/* Cabeza */}
                  <circle cx="30" cy="30" r="14" fill="#fcd9b6" />
                  {/* Pelo */}
                  <path d="M16 25 Q20 12 30 14 Q40 12 44 25" fill="#1e293b" />
                  <path d="M18 22 Q22 18 26 20" fill="#1e293b" />
                  <path d="M34 20 Q38 18 42 22" fill="#1e293b" />
                  {/* Gafas - más grandes y animadas */}
                  <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <rect x="18" y="26" width="11" height="9" rx="2" fill="none" stroke="#1e293b" strokeWidth="2" />
                    <rect x="31" y="26" width="11" height="9" rx="2" fill="none" stroke="#1e293b" strokeWidth="2" />
                    <line x1="29" y1="30" x2="31" y2="30" stroke="#1e293b" strokeWidth="2" />
                    <line x1="18" y1="30" x2="14" y2="28" stroke="#1e293b" strokeWidth="1.5" />
                    <line x1="42" y1="30" x2="46" y2="28" stroke="#1e293b" strokeWidth="1.5" />
                    {/* Reflejo en gafas */}
                    <motion.ellipse cx="22" cy="29" rx="2" ry="1.5" fill="white" opacity="0.4" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
                    <motion.ellipse cx="35" cy="29" rx="2" ry="1.5" fill="white" opacity="0.4" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
                  </motion.g>
                  {/* Ojos detrás de gafas */}
                  <motion.ellipse cx="23" cy="30" rx="2" ry="2.5" fill="#1e293b" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} />
                  <motion.ellipse cx="37" cy="30" rx="2" ry="2.5" fill="#1e293b" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} />
                  {/* Sonrisa */}
                  <motion.path d="M25 38 Q30 42 35 38" stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ d: ["M25 38 Q30 42 35 38", "M25 38 Q30 44 35 38", "M25 38 Q30 42 35 38"] }} transition={{ duration: 2.5, repeat: Infinity }} />
                  {/* Cuerpo con corbata */}
                  <path d="M16 44 Q30 40 44 44 L46 72 L14 72 Z" fill="#6366f1" />
                  <path d="M28 44 L30 55 L32 44 Z" fill="#ef4444" />
                  <rect x="28" y="44" width="4" height="3" fill="#dc2626" />
                </svg>
              </motion.div>
              <motion.div className="absolute -bottom-3 -left-3" animate={{ rotate: [0, 10, -10, 0], y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className="text-2xl">📋</span>
              </motion.div>
              <motion.div className="absolute top-1/3 -left-5" animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <span className="text-lg">🔍</span>
              </motion.div>
            </>
          ) : (
            /* Default - Helados */
            <>
              <motion.div
                className="absolute -top-8 -right-8"
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 8, -8, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 50 70" className="w-16 h-20 drop-shadow-lg">
                  <defs>
                    <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fce7f3" />
                      <stop offset="50%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="25" cy="14" rx="12" ry="11" fill="url(#pinkGrad)" />
                  <ellipse cx="21" cy="10" rx="4" ry="3" fill="white" opacity="0.5" />
                  <ellipse cx="25" cy="28" rx="13" ry="12" fill="#fdf2f8" />
                  <path d="M12 36 L25 65 L38 36 Z" fill="url(#coneGrad)" />
                  <circle cx="25" cy="5" r="3.5" fill="#dc2626" />
                </svg>
              </motion.div>
              <motion.div
                className="absolute -bottom-6 -left-6"
                animate={{ y: [0, 8, 0], rotate: [0, -12, 12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              >
                <span className="text-4xl">🍦</span>
              </motion.div>
            </>
          )}

          {/* Partículas flotantes */}
          <motion.div
            className="absolute top-1/4 -left-3"
            animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-300 to-rose-300" />
          </motion.div>
          <motion.div
            className="absolute bottom-1/3 -right-2"
            animate={{ y: [0, 10, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-200 to-yellow-300" />
          </motion.div>
          </motion.div>

        {/* Popsy Story Modal */}
        <AnimatePresence>
          {showStory && (
            <PopsyStoryModal onClose={() => setShowStory(false)} />
          )}
        </AnimatePresence>
      </div>
    );
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
          className="text-center mb-6"
        >
          <motion.img 
            src={LOGO_URL} 
            alt="Popsy" 
            className="h-24 sm:h-28 md:h-32 object-contain mx-auto mb-2 cursor-pointer drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.03, 0.98, 1.02, 1],
              y: [0, -8, 0, -4, 0],
            }}
            transition={{
              opacity: { duration: 0.8, ease: "easeOut" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStory(true)}
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-sm mb-3"
          >
            Sistema de Gestión
          </motion.p>
          
          {/* Store Selector */}
          <motion.div 
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-600 font-medium text-sm">¿A qué tienda deseas ingresar?</p>
            <StoreSelector 
              selectedStore={selectedStore} 
              onStoreChange={handleStoreChange} 
            />
          </motion.div>
        </motion.div>

        {/* Quick Actions - Más dinámicos */}
        {selectedStore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-center gap-2"
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all"
              >
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
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
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
                className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
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
                className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <FileText className="w-4 h-4 mr-1" />
                </motion.div>
                Informe Gerencial
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Menu Grid */}
        {selectedStore ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          >
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              
              // Restricciones por rol
              const isLocked = (selectedRole === 'embajador' && item.page === 'Budget') ||
                              (selectedRole === 'calidad' && !['Quality'].includes(item.page)) ||
                              (selectedRole === 'c_interno' && item.page !== 'Quality');
              
              // Para Calidad, solo mostrar Calidad
              if (selectedRole === 'calidad' && item.page !== 'Quality') {
                return null;
              }
              
              // Para C. Interno, no mostrar nada del menú (solo verá el planner embebido)
              if (selectedRole === 'c_interno') {
                return null;
              }
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={!isLocked ? { y: -8, scale: 1.05 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                >
                  {isLocked ? (
                    <motion.div 
                      className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm opacity-60 cursor-not-allowed`}
                    >
                      {/* Lock overlay */}
                      <div className="absolute inset-0 bg-gray-900/10 rounded-2xl flex items-center justify-center z-20">
                        <Lock className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center relative z-10">
                        <motion.div 
                          className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}
                        >
                          <Icon className={`w-6 h-6 ${item.iconColor}`} />
                        </motion.div>
                        <h3 className={`font-bold ${item.textColor} text-sm`}>
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <Link to={createPageUrl(item.page)}>
                      <motion.div 
                        className={`${item.bgColor} rounded-2xl p-4 h-full shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden border border-white/50 backdrop-blur-sm`}
                      >
                        {/* Subtle glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                        />

                        {/* Icon centered */}
                        <div className="flex flex-col items-center justify-center text-center relative z-10">
                          <motion.div 
                            className={`w-12 h-12 ${item.iconBg} backdrop-blur-sm rounded-xl flex items-center justify-center mb-2`}
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                          >
                            <Icon className={`w-6 h-6 ${item.iconColor}`} />
                          </motion.div>
                          <h3 className={`font-bold ${item.textColor} text-sm`}>
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}
        
        {/* Vista especial para Calidad - Planner en solo lectura */}
        {selectedStore && selectedRole === 'calidad' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      📅 Planner de la Tienda
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Solo lectura</span>
                    </h3>
                    <p className="text-sm text-white/80">{selectedStoreName}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-3xl"
                  >
                    🧹
                  </motion.div>
                </div>
              </div>
              <div className="p-4">
                <iframe 
                  src={createPageUrl('PopsyPlanner') + `?viewOnly=true`}
                  className="w-full h-[500px] border-0 rounded-xl"
                  title="Planner"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Vista especial para C. Interno - Solo Planner */}
        {selectedStore && selectedRole === 'c_interno' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      📋 Control Interno - Planner
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Solo lectura</span>
                    </h3>
                    <p className="text-sm text-white/80">{selectedStoreName}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-3xl"
                  >
                    🍦
                  </motion.div>
                </div>
              </div>
              <div className="p-4">
                <iframe 
                  src={createPageUrl('PopsyPlanner') + `?viewOnly=true`}
                  className="w-full h-[600px] border-0 rounded-xl"
                  title="Planner"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>



      {/* Notifications Setup Modal */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationSetup
            storeId={selectedStore}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>

      {/* Popsy Story Modal */}
      <AnimatePresence>
        {showStory && (
          <PopsyStoryModal onClose={() => setShowStory(false)} />
        )}
      </AnimatePresence>

      {/* Directory Modal */}
      <AnimatePresence>
        {showDirectory && (
          <DirectoryModal onClose={() => setShowDirectory(false)} />
        )}
      </AnimatePresence>

      {/* Welcome Toast */}
      <AnimatePresence>
        {showWelcome && selectedStore && (
          <WelcomeToast 
            storeName={selectedStoreName}
            storeCode={selectedStore}
            onClose={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>

      {/* Managerial Report Modal */}
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

      {/* Install App Modal */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInstall(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-white text-center">
                <Download className="w-10 h-10 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Instalar Popsy App</h2>
                <p className="text-white/80 text-sm">Accede más rápido desde tu dispositivo</p>
              </div>

              <div className="p-5 space-y-4">
                {deferredPrompt ? (
                  <Button
                    onClick={async () => {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        setDeferredPrompt(null);
                        setShowInstall(false);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Instalar ahora
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="w-6 h-6 text-blue-500" />
                        <span className="font-medium">iPhone / iPad</span>
                      </div>
                      <ol className="text-sm text-gray-600 space-y-1 ml-9">
                        <li>1. Toca el botón <strong>Compartir</strong> ⬆️</li>
                        <li>2. Selecciona <strong>"Añadir a inicio"</strong></li>
                        <li>3. Confirma tocando <strong>"Añadir"</strong></li>
                      </ol>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="w-6 h-6 text-green-500" />
                        <span className="font-medium">Android</span>
                      </div>
                      <ol className="text-sm text-gray-600 space-y-1 ml-9">
                        <li>1. Toca el menú <strong>⋮</strong> del navegador</li>
                        <li>2. Selecciona <strong>"Instalar app"</strong></li>
                        <li>3. Confirma la instalación</li>
                      </ol>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Monitor className="w-6 h-6 text-purple-500" />
                        <span className="font-medium">PC / Mac</span>
                      </div>
                      <ol className="text-sm text-gray-600 space-y-1 ml-9">
                        <li>1. En Chrome, busca el ícono ⊕ en la barra</li>
                        <li>2. Click en <strong>"Instalar"</strong></li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t text-center">
                <Button variant="ghost" onClick={() => setShowInstall(false)} className="text-gray-500">
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}