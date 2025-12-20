import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedAvatar({ cashier, size = 'medium', onClick, showRank, rank }) {
  // Si tiene foto, mostrarla
  if (cashier.photo_url) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        onClick={onClick}
        className={`relative ${size === 'large' ? 'w-20 h-20' : size === 'medium' ? 'w-16 h-16' : 'w-12 h-12'} rounded-full overflow-hidden shadow-xl border-4 border-white cursor-pointer`}
      >
        <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
        {showRank && (
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white">
            {rank}
          </div>
        )}
      </motion.div>
    );
  }

  // Avatar por defecto con inicial
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      onClick={onClick}
      className={`relative ${size === 'large' ? 'w-20 h-20' : size === 'medium' ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center shadow-xl border-4 border-white cursor-pointer`}
    >
      <span className={`${size === 'large' ? 'text-3xl' : size === 'medium' ? 'text-2xl' : 'text-xl'} font-black text-white`}>
        {cashier.name?.charAt(0)}
      </span>
      {showRank && (
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white">
          {rank}
        </div>
      )}
    </motion.div>
  );
}