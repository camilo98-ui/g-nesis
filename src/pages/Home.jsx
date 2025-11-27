import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  LayoutDashboard, Users, TrendingUp, 
  Award, Target, ChevronRight, FileText
} from 'lucide-react';

const MENU_ITEMS = [
  { 
    name: 'Dashboard', 
    page: 'Dashboard',
    icon: LayoutDashboard, 
    description: 'Estadísticas y métricas',
    bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-500'
  },
  { 
    name: 'Registrar Ventas', 
    page: 'Sales',
    icon: TrendingUp, 
    description: 'Agregar ventas diarias',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-500'
  },
  { 
    name: 'Rankings', 
    page: 'Rankings',
    icon: Award, 
    description: 'Top cajeros',
    bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500'
  },
  { 
    name: 'Presupuestos', 
    page: 'Budget',
    icon: Target, 
    description: 'Metas mensuales',
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500'
  },
  { 
    name: 'Equipo', 
    page: 'Team',
    icon: Users, 
    description: 'Gestionar cajeros',
    bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-500'
  },
  { 
    name: 'Reportes', 
    page: 'Reports',
    icon: FileText, 
    description: 'Reportes gerenciales',
    bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500'
  },
];

export default function Home() {
  const [selectedStore, setSelectedStore] = useState('');

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
        {/* Header con logo texto */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div 
            className="mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <h1 className="text-4xl md:text-5xl font-black">
              <span className="text-gray-400 text-lg font-normal block">HELADO GOURMET</span>
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                Popsy
              </span>
            </h1>
          </motion.div>
          
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
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={createPageUrl(item.page)}>
                    <div className={`${item.bgColor} rounded-2xl p-5 h-full shadow-sm hover:shadow-xl transition-all duration-300 border border-white/50`}>
                      <motion.div 
                        className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mb-3`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </motion.div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
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
    </div>
  );
}