import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Patrones de portada dinámicos
const COVER_PATTERNS = [
  'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500',
  'bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500',
  'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500',
  'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500',
  'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500',
];

// Generar patrón basado en ID del cajero
const getCoverPattern = (cashierId) => {
  const index = (cashierId?.charCodeAt(0) || 0) % COVER_PATTERNS.length;
  return COVER_PATTERNS[index];
};

export default function CashierProfileHeader({ cashier, storeCode }) {
  const coverPattern = getCoverPattern(cashier?.id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Cover Photo con patrón dinámico */}
      <div className={`h-32 md:h-40 relative overflow-hidden ${coverPattern}`}>
        {/* Patrón decorativo */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Elementos decorativos flotantes */}
        <motion.div
          className="absolute top-4 left-10 text-white/30 text-3xl"
          animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🍦
        </motion.div>
        <motion.div
          className="absolute bottom-8 right-16 text-white/20 text-2xl"
          animate={{ y: [0, 15, 0], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        >
          ⭐
        </motion.div>
      </div>
      
      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
          {/* Profile Picture */}
          <motion.div 
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center border-4 border-white"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            {cashier?.photo_url ? (
              <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl md:text-5xl font-bold text-pink-500">
                {cashier?.name?.charAt(0)}
              </span>
            )}
          </motion.div>
          
          {/* Name and Store */}
          <div className="pb-2 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{cashier?.name}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {storeCode}
            </p>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {cashier?.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{cashier.email}</span>
            </div>
          )}
          {cashier?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Phone className="w-4 h-4 text-gray-400" />
              {cashier.phone}
            </div>
          )}
          {cashier?.hire_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 md:col-span-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {(() => {
                try {
                  const date = new Date(cashier.hire_date);
                  if (isNaN(date.getTime())) return 'Miembro del equipo';
                  return `Miembro del equipo desde ${format(date, "MMMM yyyy", { locale: es })}`;
                } catch {
                  return 'Miembro del equipo';
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}