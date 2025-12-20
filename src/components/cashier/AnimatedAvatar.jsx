import React from 'react';
import { motion } from 'framer-motion';

const HAIR_STYLES = {
  short: 'M10,5 Q20,3 30,5 L28,12 L12,12 Z',
  long: 'M8,5 Q20,2 32,5 L32,20 Q20,25 8,20 Z',
  curly: 'M10,5 C10,5 20,0 30,5 C32,8 30,12 28,12 L12,12 C10,12 8,8 10,5',
  bun: 'M15,3 Q20,1 25,3 Q28,5 25,8 Q20,10 15,8 Q12,5 15,3 M12,8 L12,12 L28,12 L28,8'
};

export default function AnimatedAvatar({ cashier, size = 'medium', onClick, showRank, rank }) {
  let avatarConfig;
  try {
    avatarConfig = cashier.avatar ? JSON.parse(cashier.avatar) : null;
  } catch {
    avatarConfig = null;
  }

  const dimensions = size === 'large' ? { w: 80, h: 80 } : size === 'medium' ? { w: 60, h: 60 } : { w: 40, h: 40 };

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

  // Si tiene avatar personalizado
  if (avatarConfig) {
    const hairPath = HAIR_STYLES[avatarConfig.hair_style] || HAIR_STYLES.short;

    return (
      <motion.div
        whileHover={{ scale: 1.1, y: -3 }}
        onClick={onClick}
        className="relative cursor-pointer"
      >
        <motion.svg 
          viewBox="0 0 40 40" 
          className={`${size === 'large' ? 'w-20 h-20' : size === 'medium' ? 'w-16 h-16' : 'w-12 h-12'} drop-shadow-lg`}
          animate={{ 
            y: [0, -3, 0],
            rotate: [-2, 2, -2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Cabeza */}
          <circle cx="20" cy="20" r="14" fill={avatarConfig.skin} stroke="#000" strokeWidth="0.3" />
          
          {/* Cabello */}
          <path d={hairPath} fill={avatarConfig.hair_color} stroke="#000" strokeWidth="0.2" />
          
          {/* Ojos */}
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          >
            <ellipse cx="14" cy="18" rx="2" ry="3" fill={avatarConfig.eye_color} />
            <ellipse cx="26" cy="18" rx="2" ry="3" fill={avatarConfig.eye_color} />
            <circle cx="14.5" cy="17" r="1" fill="white" opacity="0.8" />
            <circle cx="26.5" cy="17" r="1" fill="white" opacity="0.8" />
          </motion.g>
          
          {/* Nariz */}
          <path d="M20,22 Q19,24 20,24 Q21,24 20,22" fill="none" stroke="#000" strokeWidth="0.3" opacity="0.3" />
          
          {/* Boca */}
          <motion.path 
            d="M15,25 Q20,28 25,25" 
            fill="none" 
            stroke="#E91E63" 
            strokeWidth="0.8" 
            strokeLinecap="round"
            animate={{ d: ['M15,25 Q20,28 25,25', 'M15,25 Q20,29 25,25'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Accesorios */}
          {avatarConfig.accessory === 'glasses' && (
            <g>
              <ellipse cx="14" cy="18" rx="3.5" ry="3" fill="none" stroke="#333" strokeWidth="0.5" />
              <ellipse cx="26" cy="18" rx="3.5" ry="3" fill="none" stroke="#333" strokeWidth="0.5" />
              <line x1="17.5" y1="18" x2="22.5" y2="18" stroke="#333" strokeWidth="0.5" />
            </g>
          )}
          {avatarConfig.accessory === 'hat' && (
            <g>
              <ellipse cx="20" cy="8" rx="10" ry="3" fill="#E91E63" />
              <rect x="15" y="5" width="10" height="6" fill="#E91E63" rx="1" />
            </g>
          )}
          {avatarConfig.accessory === 'bow' && (
            <path d="M10,10 Q8,8 10,6 Q12,4 14,6 Q12,8 10,10" fill="#E91E63" />
          )}
        </motion.svg>
        
        {showRank && (
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white">
            {rank}
          </div>
        )}
      </motion.div>
    );
  }

  // Avatar por defecto
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