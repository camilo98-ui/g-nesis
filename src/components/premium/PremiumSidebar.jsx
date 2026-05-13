import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Settings } from 'lucide-react';

export default function PremiumSidebar({ selectedStore, onStoreChange, onLogout, storeName }) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-50 to-slate-100/50 border-r border-slate-200 z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md"
        >
          🍦
        </motion.div>
      </div>

      {/* Store Selector */}
      <div className="p-6 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Tienda Activa</p>
        <div className="bg-white rounded-lg p-3 border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <p className="text-sm font-medium text-slate-900">{storeName}</p>
          <p className="text-xs text-slate-500 mt-1">{selectedStore}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <p className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">Navegación</p>
        <div className="space-y-2">
          <NavItem icon="📊" label="Dashboard" active />
          <NavItem icon="📈" label="Análisis" />
          <NavItem icon="🎯" label="Metas" />
          <NavItem icon="👥" label="Equipo" />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-sm text-slate-600">
          <Settings className="w-4 h-4" />
          Configuración
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition text-sm text-red-600">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </motion.div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
      active 
        ? 'bg-pink-100 text-pink-900 font-medium' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}