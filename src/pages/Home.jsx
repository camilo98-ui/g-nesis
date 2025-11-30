import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import NotificationSetup from '@/components/NotificationSetup';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, TrendingUp, 
  Award, Target, FileText, Bell, Snowflake
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { startOfMonth } from 'date-fns';

const ICE_CREAM_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/89e24fb79_Capturadepantalla2025-11-30074009.png";
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
    name: 'Rankings', 
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
    name: 'Reportes', 
    page: 'Reports',
    icon: FileText, 
    description: 'Reportes gerenciales',
    bgColor: 'bg-gradient-to-br from-teal-50/80 to-cyan-100/60',
    iconBg: 'bg-teal-100/80',
    iconColor: 'text-teal-400'
  },
];



export default function Home() {
  const [selectedStore, setSelectedStore] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <FloatingIceCreamsBg />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Header con logo - compacto */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.img 
            src={LOGO_URL} 
            alt="Popsy" 
            className="h-28 md:h-32 object-contain mx-auto mb-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
          />
          <p className="text-gray-500 text-sm mb-3">Sistema de Gestión</p>
          
          {/* Store Selector */}
          <motion.div 
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-gray-600 font-medium text-sm">¿A qué tienda deseas ingresar?</p>
            <StoreSelector 
              selectedStore={selectedStore} 
              onStoreChange={handleStoreChange} 
            />
          </motion.div>
        </motion.div>

        {/* Alertas button */}
        {selectedStore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="text-gray-500 hover:text-pink-600 hover:bg-pink-50"
            >
              <Bell className="w-4 h-4 mr-1" />
              Alertas
            </Button>
          </motion.div>
        )}

        {/* Menu Grid */}
        {selectedStore ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
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
                      <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.description}</p>
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
                {/* Bolita de helado - estilo sketch */}
                <ellipse cx="40" cy="28" rx="28" ry="24" fill="none" stroke="#888" strokeWidth="1.5" strokeDasharray="2,1" />
                <ellipse cx="40" cy="28" rx="28" ry="24" fill="#FFB5C5" opacity="0.3" />
                <path d="M 20 22 Q 25 18 30 22 Q 35 18 40 22 Q 45 18 50 22 Q 55 18 60 22" fill="none" stroke="#888" strokeWidth="0.8" opacity="0.6" />
                {/* Drip effect */}
                <path d="M 25 45 Q 23 52 26 48" fill="none" stroke="#888" strokeWidth="0.8" />
                <path d="M 55 45 Q 57 50 54 47" fill="none" stroke="#888" strokeWidth="0.8" />
                {/* Cono */}
                <polygon points="18,48 40,115 62,48" fill="none" stroke="#888" strokeWidth="1.5" strokeDasharray="3,1" />
                <polygon points="18,48 40,115 62,48" fill="#E8D5B0" opacity="0.25" />
                {/* Líneas del cono */}
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
    </div>
  );
}