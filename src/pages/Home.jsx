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

// Confetti pastel suave
const PastelConfetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          background: ['#FFD1DC', '#E0BBE4', '#C5E8FF', '#FFEFD5', '#D4F0F0'][i % 5],
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: window.innerHeight + 50,
          opacity: [0, 0.6, 0.6, 0],
          rotate: [0, 360]
        }}
        transition={{
          duration: 8 + Math.random() * 4,
          delay: i * 0.3,
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
      setSelectedStore('');
      setIsLoggedIn(false);
    } else if (savedSession) {
      const session = JSON.parse(savedSession);
      setSelectedStore(session.store);
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
    const storePassword = storePasswords.find(p => p.store_code === pendingStore);
    
    // Si no tiene contraseña o la contraseña coincide
    if (!storePassword?.password || loginPassword === storePassword.password) {
      setSelectedStore(pendingStore);
      setIsLoggedIn(true);
      localStorage.setItem('selectedStore', pendingStore);
      localStorage.setItem('popsySession', JSON.stringify({ store: pendingStore, time: Date.now() }));
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
    localStorage.removeItem('selectedStore');
    localStorage.removeItem('popsySession');
  };

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    localStorage.setItem('popsySession', JSON.stringify({ store, time: Date.now() }));
    setShowWelcome(true);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const needsPassword = pendingStore && storePasswords.find(p => p.store_code === pendingStore)?.password;

  // Si no está logueado, mostrar pantalla de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 relative overflow-hidden flex items-center justify-center">
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
                ¡Bienvenido!
              </h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa para continuar</p>
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

            {/* Campo de contraseña - Mismo estilo que selector de tienda */}
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
              {loginError && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {loginError}
                </motion.p>
              )}
            </motion.div>

            {/* Botón de ingresar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleLogin}
                disabled={!pendingStore}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 rounded-xl shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.span
                  animate={{ scale: pendingStore ? [1, 1.05, 1] : 1 }}
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

          {/* Decoración flotante - Conos */}
          <motion.div
            className="absolute -top-6 -right-6"
            animate={{ rotate: [0, 15, -15, 0], y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg viewBox="0 0 40 55" className="w-12 h-16">
              <circle cx="20" cy="12" r="10" fill="#FFB5C5" />
              <circle cx="16" cy="9" r="3" fill="#fff" opacity="0.5" />
              <polygon points="10,20 20,50 30,20" fill="#D4A574" />
              <line x1="13" y1="28" x2="27" y2="28" stroke="#c99a5e" strokeWidth="0.8" />
              <line x1="15" y1="36" x2="25" y2="36" stroke="#c99a5e" strokeWidth="0.8" />
            </svg>
          </motion.div>
          <motion.div
            className="absolute -bottom-4 -left-4"
            animate={{ rotate: [0, -10, 10, 0], y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <svg viewBox="0 0 40 55" className="w-10 h-14">
              <circle cx="20" cy="12" r="10" fill="#E0BBE4" />
              <circle cx="24" cy="9" r="2.5" fill="#fff" opacity="0.4" />
              <polygon points="10,20 20,50 30,20" fill="#D4A574" />
              <line x1="13" y1="28" x2="27" y2="28" stroke="#c99a5e" strokeWidth="0.8" />
            </svg>
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
        {/* Botón de cerrar sesión */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 z-20"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 rounded-full shadow-sm gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </motion.div>
        </motion.div>

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
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
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
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}
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