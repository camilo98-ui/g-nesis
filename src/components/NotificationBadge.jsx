import React from 'react';
import { motion } from 'framer-motion';

/**
 * NotificationBadge - Componente reutilizable para mostrar badges de notificación
 * @param {number} count - Número de notificaciones (opcional, si no se pasa muestra solo un punto)
 * @param {string} variant - Estilo: 'dot' | 'count' (default: 'dot')
 * @param {string} color - Color del badge: 'red' | 'blue' | 'green' | 'yellow' (default: 'red')
 * @param {boolean} pulse - Animar con pulso (default: true)
 */
export default function NotificationBadge({ 
  count = 0, 
  variant = 'dot', 
  color = 'red',
  pulse = true 
}) {
  const colorClasses = {
    red: 'bg-red-500 border-red-600',
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    yellow: 'bg-yellow-500 border-yellow-600',
    pink: 'bg-pink-500 border-pink-600'
  };

  if (variant === 'dot') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}
      />
    );
  }

  if (variant === 'count' && count > 0) {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full ${colorClasses[color]} border-2 border-white text-white text-xs font-bold shadow-lg ${pulse ? 'animate-pulse' : ''}`}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    );
  }

  return null;
}