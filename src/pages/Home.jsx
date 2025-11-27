import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WelcomeModal from '@/components/WelcomeModal';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingCones from '@/components/FloatingCones';
import AnimatedIcon from '@/components/AnimatedIcon';
import { 
  LayoutDashboard, Users, TrendingUp, 
  Award, Target, ChevronRight, Store, FileText
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const MENU_ITEMS = [
  { 
    name: 'Dashboard', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Estadísticas y métricas de venta',
    color: 'purple'
  },
  { 
    name: 'Registrar Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Agregar ventas diarias y por turno',
    color: 'green'
  },
  { 
    name: 'Rankings', 
    page: 'Rankings',
    icon: Award, 
    description: 'Top cajeros, ventas y sugeridos',
    color: 'yellow'
  },
  { 
    name: 'Presupuestos', 
    page: 'Budget',
    icon: Target, 
    description: 'Configurar metas mensuales',
    color: 'blue'
  },
  { 
    name: 'Equipo', 
    page: 'Team',
    icon: Users, 
    description: 'Gestionar cajeros',
    color: 'cyan'
  },
  { 
    name: 'Reportes', 
    page: 'Reports',
    icon: FileText, 
    description: 'Generar reportes gerenciales',
    color: 'fuchsia'
  },
];

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
    
    base44.auth.me().then(user => {
      if (user?.full_name) setUserName(user.full_name);
    }).catch(() => {});
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/50 to-purple-50 relative overflow-hidden">
      <AnimatePresence>
        {showWelcome && <WelcomeModal userName={userName} onClose={() => setShowWelcome(false)} />}
      </AnimatePresence>

      <FloatingCones count={10} className="opacity-30" />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-6">
            <motion.img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
              alt="Popsy Logo"
              className="h-24 md:h-32 object-contain drop-shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-800 mb-2">
            Sistema de Gestión de Ventas
          </h1>
          <p className="text-fuchsia-600/70 mb-6">Seguimiento y análisis de rendimiento</p>
          
          {/* Store Selector */}
          <div className="flex justify-center">
            <StoreSelector 
              selectedStore={selectedStore} 
              onStoreChange={handleStoreChange} 
            />
          </div>
          
          {selectedStore && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-fuchsia-200"
            >
              <Store className="w-4 h-4 text-fuchsia-500" />
              <span className="text-sm font-medium text-fuchsia-700">{selectedStore} - {selectedStoreName}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Menu Grid */}
        {selectedStore ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(item.page)}>
                    <Card className="group h-full bg-white/70 backdrop-blur-sm border-fuchsia-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <AnimatedIcon icon={Icon} color={item.color} size="md" />
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-fuchsia-600 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <motion.div
                            className="text-gray-300 group-hover:text-fuchsia-500"
                            whileHover={{ x: 5 }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div 
              className="text-7xl mb-6"
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🍦
            </motion.div>
            <h2 className="text-2xl font-bold text-fuchsia-700 mb-2">Selecciona una tienda</h2>
            <p className="text-fuchsia-600/60 max-w-md mx-auto">
              Para comenzar, elige la tienda con la que deseas trabajar del menú superior
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}