import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import MascotCone from '@/components/MascotCone';
import ExportExcel from '@/components/ExportExcel';
import NotificationSetup from '@/components/NotificationSetup';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, TrendingUp, 
  Award, Target, ChevronRight, FileText, FileSpreadsheet, Bell, MessageCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { startOfMonth } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/c3a36de58_Capturadepantalla2025-11-251251441.png";

const MENU_ITEMS = [
  { 
    name: 'Dashboard', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Estadísticas y métricas',
    bgColor: 'bg-gradient-to-br from-violet-100 to-purple-200',
    iconBg: 'bg-violet-200',
    iconColor: 'text-violet-600'
  },
  { 
    name: 'Registrar Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Agregar ventas diarias',
    bgColor: 'bg-gradient-to-br from-mint-100 to-emerald-200',
    iconBg: 'bg-emerald-200',
    iconColor: 'text-emerald-600'
  },
  { 
    name: 'Rankings', 
    page: 'Rankings',
    icon: Award, 
    description: 'Top cajeros',
    bgColor: 'bg-gradient-to-br from-amber-100 to-orange-200',
    iconBg: 'bg-amber-200',
    iconColor: 'text-amber-600'
  },
  { 
    name: 'Presupuestos', 
    page: 'Budget',
    icon: Target, 
    description: 'Metas mensuales',
    bgColor: 'bg-gradient-to-br from-sky-100 to-blue-200',
    iconBg: 'bg-sky-200',
    iconColor: 'text-sky-600'
  },
  { 
    name: 'Equipo', 
    page: 'Team',
    icon: Users, 
    description: 'Gestionar cajeros',
    bgColor: 'bg-gradient-to-br from-teal-100 to-cyan-200',
    iconBg: 'bg-teal-200',
    iconColor: 'text-teal-600'
  },
  { 
    name: 'Reportes', 
    page: 'Reports',
    icon: FileText, 
    description: 'Reportes gerenciales',
    bgColor: 'bg-gradient-to-br from-pink-100 to-rose-200',
    iconBg: 'bg-pink-200',
    iconColor: 'text-pink-600'
  },
];

export default function Home() {
  const [selectedStore, setSelectedStore] = useState('');
  const [showMascot, setShowMascot] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const monthStart = startOfMonth(new Date());
  const filteredSales = dailySales.filter(s => new Date(s.date) >= monthStart);
  const cashierExportData = shiftRecords
    .filter(r => new Date(r.date) >= monthStart)
    .map(r => ({
      ...r,
      cashierName: cashiers.find(c => c.id === r.cashier_id)?.name || 'N/A'
    }));

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <FloatingIceCreamsBg />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Header con logo imagen */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.img 
            src={LOGO_URL}
            alt="Popsy - Helado Gourmet"
            className="h-20 md:h-24 mx-auto mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />

          <p className="text-gray-500 text-sm mb-6">Sistema de Gestión de Ventas</p>
          
          {/* Store Selector prominente */}
          <motion.div 
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-gray-600 font-medium">¿A qué tienda deseas ingresar?</p>
            <StoreSelector 
              selectedStore={selectedStore} 
              onStoreChange={handleStoreChange} 
            />
          </motion.div>
          
          {selectedStore && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg shadow-pink-500/30"
            >
              <span className="text-sm font-medium">{selectedStore} - {selectedStoreName}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions: Export & Notifications */}
        {selectedStore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-3"
          >
            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExport(!showExport)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                showExport 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className={`w-6 h-6 ${showExport ? 'text-white' : 'text-green-600'}`} />
                <div className="text-left">
                  <p className={`font-bold ${showExport ? 'text-white' : 'text-gray-800'}`}>Exportar Datos a Excel</p>
                  <p className={`text-xs ${showExport ? 'text-white/80' : 'text-gray-500'}`}>Indicadores de tienda y cajeros</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${showExport ? 'rotate-90 text-white' : 'text-green-600'}`} />
            </motion.button>

            {showExport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <ExportExcel
                  storeData={filteredSales}
                  cashierData={cashierExportData}
                  storeName={selectedStore}
                  dateRange={{ from: monthStart, to: new Date() }}
                />
              </motion.div>
            )}

            {/* Notifications Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNotifications(true)}
              className="w-full p-4 rounded-2xl flex items-center justify-between bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 hover:border-pink-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bell className="w-6 h-6 text-pink-600" />
                </motion.div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Configurar Alertas</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> WhatsApp y Correo
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-pink-600" />
            </motion.button>
          </motion.div>
        )}

        {/* Menu Grid estilo Popsy */}
        {selectedStore ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
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
                      className={`${item.bgColor} rounded-2xl p-5 h-full shadow-sm hover:shadow-2xl transition-all duration-300 border border-white/50`}
                      animate={{ 
                        boxShadow: ["0 4px 6px rgba(0,0,0,0.1)", "0 8px 15px rgba(0,0,0,0.15)", "0 4px 6px rgba(0,0,0,0.1)"]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <motion.div 
                        className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mb-3`}
                        whileHover={{ rotate: [0, -15, 15, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </motion.div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500">{item.description}</p>
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
            <motion.div 
              className="text-8xl mb-6 inline-block"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🍦
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda para comenzar</h2>
            <p className="text-gray-400">Elige del menú superior la tienda con la que deseas trabajar</p>
          </motion.div>
        )}
      </div>

      {/* Mascot */}
      <MascotCone 
        storeId={selectedStore} 
        isOpen={showMascot} 
        onToggle={() => setShowMascot(!showMascot)} 
      />

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