import React from 'react';
import { motion } from 'framer-motion';

const ICON_COLORS = {
  orange: { bg: 'bg-gradient-to-br from-amber-100 to-orange-100', icon: 'text-amber-500' },
  pink: { bg: 'bg-gradient-to-br from-pink-100 to-rose-100', icon: 'text-pink-500' },
  purple: { bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100', icon: 'text-purple-500' },
  blue: { bg: 'bg-gradient-to-br from-blue-100 to-cyan-100', icon: 'text-blue-500' },
  green: { bg: 'bg-gradient-to-br from-emerald-100 to-teal-100', icon: 'text-emerald-500' },
  yellow: { bg: 'bg-gradient-to-br from-yellow-100 to-amber-100', icon: 'text-yellow-600' },
  fuchsia: { bg: 'bg-gradient-to-br from-fuchsia-100 to-pink-100', icon: 'text-fuchsia-500' },
  cyan: { bg: 'bg-gradient-to-br from-cyan-100 to-sky-100', icon: 'text-cyan-500' },
};

export default function AnimatedIcon({ icon: Icon, color = 'pink', size = 'md', isActive = false }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  const colorStyle = ICON_COLORS[color] || ICON_COLORS.pink;

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { 
        scale: [1, 1.05, 1],
        rotate: [0, 3, -3, 0]
      } : {}}
      transition={{ 
        duration: isActive ? 0.5 : 0.3,
        repeat: isActive ? Infinity : 0,
        repeatDelay: 2
      }}
      className={`${sizeClasses[size]} ${colorStyle.bg} rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/50`}
    >
      <Icon className={`${iconSizes[size]} ${colorStyle.icon}`} />
    </motion.div>
  );
}