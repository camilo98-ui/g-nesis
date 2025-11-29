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
    name: 'Dashboard Tienda', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Ventas y métricas',
    bgColor: 'bg-gradient-to-br from-violet-50/80 to-purple-100/60',
    iconBg: 'bg-violet-100/80',
    iconColor: 'text-violet-400'
  },
  { 
    name: 'Dashboard Cajeros', 
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
          {/* Logo removido del inicio */}

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

        {/* Quick Actions sutiles */}
                      {selectedStore && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 flex justify-center gap-3"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowExport(!showExport)}
                            className="text-gray-500 hover:text-green-600 hover:bg-green-50"
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Exportar
                          </Button>
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

                      {showExport && selectedStore && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mb-6"
                        >
                          <ExportExcel
                            storeData={filteredSales}
                            cashierData={cashierExportData}
                            storeName={selectedStore}
                            dateRange={{ from: monthStart, to: new Date() }}
                          />
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