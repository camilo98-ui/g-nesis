import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WelcomeModal from '@/components/WelcomeModal';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import { 
  LayoutDashboard, Users, TrendingUp, Search, 
  Award, Target, ChevronRight, Sparkles, Store
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const MENU_ITEMS = [
  { 
    name: 'Dashboard', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Estadísticas y métricas de venta',
    color: 'from-orange-500 to-red-500',
    lightColor: 'bg-orange-100'
  },
  { 
    name: 'Registrar Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Agregar ventas diarias y por turno',
    color: 'from-green-500 to-emerald-500',
    lightColor: 'bg-green-100'
  },
  { 
    name: 'Rankings', 
    page: 'Rankings',
    icon: Award, 
    description: 'Top cajeros y sugeridos',
    color: 'from-yellow-500 to-amber-500',
    lightColor: 'bg-yellow-100'
  },
  { 
    name: 'Buscar Cajero', 
    page: 'SearchCashier',
    icon: Search, 
    description: 'Consultar información por cajero',
    color: 'from-blue-500 to-indigo-500',
    lightColor: 'bg-blue-100'
  },
  { 
    name: 'Presupuestos', 
    page: 'Budget',
    icon: Target, 
    description: 'Configurar metas mensuales',
    color: 'from-purple-500 to-pink-500',
    lightColor: 'bg-purple-100'
  },
  { 
    name: 'Equipo', 
    page: 'Team',
    icon: Users, 
    description: 'Gestionar cajeros',
    color: 'from-cyan-500 to-teal-500',
    lightColor: 'bg-cyan-100'
  },
];

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
    
    // Get user name
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <AnimatePresence>
        {showWelcome && <WelcomeModal userName={userName} onClose={() => setShowWelcome(false)} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Sistema de Ventas
          </h1>
          <p className="text-gray-500 mb-6">Seguimiento y análisis de rendimiento</p>
          
          {/* Store Selector */}
          <div className="flex justify-center">
            <StoreSelector 
              selectedStore={selectedStore} 
              onStoreChange={handleStoreChange} 
            />
          </div>
          
          {selectedStore && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-orange-600 font-medium"
            >
              <Store className="w-4 h-4 inline mr-1" />
              {selectedStore} - {selectedStoreName}
            </motion.p>
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
                    <Card className="group h-full bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-orange-600 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
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
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-12 h-12 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Para comenzar, elige la tienda con la que deseas trabajar del menú superior
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}