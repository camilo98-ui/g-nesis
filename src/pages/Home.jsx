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
  Award, Target, Bell, Phone, Download, Smartphone, Monitor, ClipboardCheck, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { startOfMonth } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const MENU_ITEMS = [
  { 
    name: 'Tienda', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Ventas y métricas',
    bgColor: 'bg-gradient-to-br from-violet-50/80 to-purple-100/60',
    iconBg: 'bg-violet-100/80',
    iconColor: 'text-violet-400'
  },
  { 
    name: 'Cajeros', 
    page: 'CashiersDashboard',
    icon: Users, 
    description: 'Rendimiento del equipo',
    bgColor: 'bg-gradient-to-br from-pink-50/80 to-rose-100/60',
    iconBg: 'bg-pink-100/80',
    iconColor: 'text-pink-400'
  },
  { 
    name: 'Registrar Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Agregar ventas diarias',
    bgColor: 'bg-gradient-to-br from-emerald-50/80 to-green-100/60',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-400'
  },
  { 
    name: 'PopsyStars', 
    page: 'Rankings',
    icon: Award, 
    description: 'Top cajeros',
    bgColor: 'bg-gradient-to-br from-amber-50/80 to-yellow-100/60',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-400'
  },
  { 
    name: 'Presupuestos', 
    page: 'Budget',
    icon: Target, 
    description: 'Metas mensuales',
    bgColor: 'bg-gradient-to-br from-sky-50/80 to-blue-100/60',
    iconBg: 'bg-sky-100/80',
    iconColor: 'text-sky-400'
  },
  { 
    name: 'Calidad', 
    page: 'Quality',
    icon: ClipboardCheck, 
    description: 'Checklists y visitas',
    bgColor: 'bg-gradient-to-br from-teal-50/80 to-cyan-100/60',
    iconBg: 'bg-teal-100/80',
    iconColor: 'text-teal-400'
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

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Cargar tienda guardada
  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    const lastVisit = localStorage.getItem('lastVisitTime');
    const now = Date.now();
    
    // Si pasaron más de 4 horas, limpiar tienda
    if (lastVisit && (now - parseInt(lastVisit)) > 4 * 60 * 60 * 1000) {
      localStorage.removeItem('selectedStore');
      setSelectedStore('');
    } else if (saved) {
      setSelectedStore(saved);
    }
    
    localStorage.setItem('lastVisitTime', now.toString());
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    setShowWelcome(true);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -10, scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={createPageUrl(item.page)}>
                    <motion.div 
                      className={`${item.bgColor} rounded-xl sm:rounded-2xl p-3 sm:p-5 h-full shadow-sm hover:shadow-2xl transition-all duration-300 border border-white/50 group`}
                    >
                      <motion.div 
                        className={`w-10 h-10 sm:w-12 sm:h-12 ${item.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3`}
                        whileHover={{ rotate: [0, -15, 15, -10, 10, 0], scale: 1.2 }}
                        animate={{ rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className="group-hover:animate-bounce"
                        >
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
                        </motion.div>
                      </motion.div>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm mb-0.5 sm:mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{item.description}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            {/* Cono estilo lápiz/sketch */}
            <motion.div
              className="w-28 h-40 mx-auto mb-6 opacity-60"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 80 120" className="w-full h-full">
                <ellipse cx="40" cy="28" rx="28" ry="24" fill="none" stroke="#888" strokeWidth="1.5" strokeDasharray="2,1" />
                <ellipse cx="40" cy="28" rx="28" ry="24" fill="#FFB5C5" opacity="0.3" />
                <path d="M 20 22 Q 25 18 30 22 Q 35 18 40 22 Q 45 18 50 22 Q 55 18 60 22" fill="none" stroke="#888" strokeWidth="0.8" opacity="0.6" />
                <path d="M 25 45 Q 23 52 26 48" fill="none" stroke="#888" strokeWidth="0.8" />
                <path d="M 55 45 Q 57 50 54 47" fill="none" stroke="#888" strokeWidth="0.8" />
                <polygon points="18,48 40,115 62,48" fill="none" stroke="#888" strokeWidth="1.5" strokeDasharray="3,1" />
                <polygon points="18,48 40,115 62,48" fill="#E8D5B0" opacity="0.25" />
                <line x1="24" y1="58" x2="56" y2="58" stroke="#999" strokeWidth="0.6" strokeDasharray="2,2" />
                <line x1="28" y1="72" x2="52" y2="72" stroke="#999" strokeWidth="0.6" strokeDasharray="2,2" />
                <line x1="32" y1="86" x2="48" y2="86" stroke="#999" strokeWidth="0.6" strokeDasharray="2,2" />
                <line x1="36" y1="100" x2="44" y2="100" stroke="#999" strokeWidth="0.6" strokeDasharray="2,2" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda para comenzar</h2>
            <p className="text-gray-400">Elige del menú superior la tienda con la que deseas trabajar</p>
          </motion.div>
        )}
      </div>

      {/* Footer Message - Solo visible en Home */}
      {!selectedStore && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-0 right-0 text-center px-4"
        >
          <motion.p 
            className="text-sm text-gray-400 tracking-wide flex items-center justify-center gap-2"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span>Gracias por hacer del mundo un lugar más</span>
            <span className="text-pink-400 font-medium">dulce</span>
            <span>,</span>
            <span className="text-amber-400 font-medium">feliz</span>
            <span>y</span>
            <span className="text-purple-400 font-medium">divertido</span>
            <span>💗</span>
          </motion.p>
        </motion.div>
      )}

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