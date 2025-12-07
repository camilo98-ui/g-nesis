import React from 'react';
import { motion } from 'framer-motion';

// Ya no se usan hashtags

// Destellos de colores pastel
const Sparkle = ({ color, size = 6 }) => (
  <motion.div
    className="rounded-full"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(1px)'
    }}
    animate={{
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.3, 1],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Cono con bolita estilo sketch
const IceCreamCone = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 40 65" className="w-full h-full">
    <circle cx="20" cy="14" r="12" fill="none" stroke="#ec4899" strokeWidth="1.2" opacity={opacity} />
    <circle cx="20" cy="14" r="12" fill="#FFB5C5" opacity={opacity * 0.6} />
    <polygon points="10,22 20,58 30,22" fill="none" stroke="#d97706" strokeWidth="1" opacity={opacity} />
    <polygon points="10,22 20,58 30,22" fill="#E8D5B0" opacity={opacity * 0.5} />
    <line x1="13" y1="28" x2="27" y2="28" stroke="#d97706" strokeWidth="0.5" opacity={opacity * 0.7} />
    <line x1="15" y1="36" x2="25" y2="36" stroke="#d97706" strokeWidth="0.5" opacity={opacity * 0.7} />
  </svg>
);

// Malteada estilo sketch
const Milkshake = ({ opacity = 0.5 }) => (
  <svg viewBox="0 0 35 60" className="w-full h-full">
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="none" stroke="#3b82f6" strokeWidth="1" opacity={opacity} />
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="#C5E8FF" opacity={opacity * 0.5} />
    <ellipse cx="17.5" cy="12" rx="10" ry="6" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity={opacity} />
    <circle cx="17" cy="4" r="3" fill="#FFB5C5" opacity={opacity * 0.6} />
    <line x1="22" y1="5" x2="24" y2="35" stroke="#d97706" strokeWidth="1" opacity={opacity} />
  </svg>
);

// Banana Split estilo sketch - MEJORADO
const BananaSplit = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 60 35" className="w-full h-full">
    {/* Plato */}
    <ellipse cx="30" cy="28" rx="28" ry="6" fill="none" stroke="#999" strokeWidth="0.8" strokeDasharray="2,1" opacity={opacity} />
    <ellipse cx="30" cy="28" rx="28" ry="6" fill="#F5F5DC" opacity={opacity * 0.3} />
    {/* Banana */}
    <path d="M 8 22 Q 15 8 30 12 Q 45 8 52 22" fill="none" stroke="#DAA520" strokeWidth="1.2" opacity={opacity} />
    <path d="M 8 22 Q 15 8 30 12 Q 45 8 52 22" fill="#FFE135" opacity={opacity * 0.4} />
    {/* Bolas de helado */}
    <circle cx="18" cy="18" r="7" fill="#FFB5C5" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    <circle cx="30" cy="15" r="7" fill="#8B4513" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    <circle cx="42" cy="18" r="7" fill="#FFF8DC" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    {/* Cherry */}
    <circle cx="30" cy="8" r="3" fill="#DC143C" opacity={opacity * 0.6} />
    {/* Detalles */}
    <circle cx="25" cy="20" r="1" fill="#FF1493" opacity={opacity * 0.4} />
    <circle cx="35" cy="19" r="1" fill="#FF1493" opacity={opacity * 0.4} />
  </svg>
);

// Litro de helado estilo sketch
const IceCreamTub = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 40 50" className="w-full h-full">
    <ellipse cx="20" cy="8" rx="16" ry="5" fill="none" stroke="#ec4899" strokeWidth="1" opacity={opacity} />
    <ellipse cx="20" cy="8" rx="16" ry="5" fill="#E91E63" opacity={opacity * 0.5} />
    <path d="M 4 8 L 6 40 L 34 40 L 36 8" fill="none" stroke="#ec4899" strokeWidth="1" opacity={opacity} />
    <path d="M 4 8 L 6 40 L 34 40 L 36 8" fill="#FFFFFF" opacity={opacity * 0.4} />
    <rect x="10" y="18" width="20" height="12" rx="2" fill="#ec4899" opacity={opacity * 0.4} />
  </svg>
);

// Copa de helado estilo sketch
const IceCreamCup = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 35 55" className="w-full h-full">
    <path d="M 5 20 Q 3 45 17.5 48 Q 32 45 30 20" fill="none" stroke="#a855f7" strokeWidth="1" opacity={opacity} />
    <path d="M 5 20 Q 3 45 17.5 48 Q 32 45 30 20" fill="#E8E8E8" opacity={opacity * 0.4} />
    <ellipse cx="17.5" cy="47" rx="8" ry="2" fill="none" stroke="#a855f7" strokeWidth="0.6" opacity={opacity} />
    <ellipse cx="17.5" cy="18" rx="14" ry="8" fill="none" stroke="#ec4899" strokeWidth="0.8" opacity={opacity} />
    <ellipse cx="17.5" cy="18" rx="14" ry="8" fill="#FFB5C5" opacity={opacity * 0.5} />
    <ellipse cx="12" cy="12" rx="8" ry="5" fill="#87CEEB" opacity={opacity * 0.5} stroke="#3b82f6" strokeWidth="0.5" />
    <ellipse cx="23" cy="12" rx="8" ry="5" fill="#DDA0DD" opacity={opacity * 0.5} stroke="#a855f7" strokeWidth="0.5" />
    <path d="M 14 6 Q 17.5 2 21 6" fill="none" stroke="#ec4899" strokeWidth="0.6" opacity={opacity} />
    <circle cx="17.5" cy="4" r="2.5" fill="#DC143C" opacity={opacity * 0.7} />
  </svg>
);

const sketchElements = [
  { x: '5%', size: 30, type: 'cone', delay: 0 },
  { x: '12%', size: 26, type: 'shake', delay: 2 },
  { x: '20%', size: 38, type: 'banana', delay: 5 },
  { x: '28%', size: 28, type: 'tub', delay: 5 },
  { x: '35%', size: 24, type: 'cup', delay: 1 },
  { x: '42%', size: 36, type: 'banana', delay: 4 },
  { x: '50%', size: 28, type: 'cone', delay: 3 },
  { x: '58%', size: 26, type: 'shake', delay: 6 },
  { x: '65%', size: 40, type: 'banana', delay: 2 },
  { x: '72%', size: 28, type: 'tub', delay: 2.5 },
  { x: '80%', size: 30, type: 'cup', delay: 4.5 },
  { x: '88%', size: 32, type: 'cone', delay: 1.5 },
  { x: '95%', size: 34, type: 'banana', delay: 3.5 },
];

// Destellos pastel
const sparkles = [
  { x: '10%', y: '20%', color: '#FFB5C5', size: 14 },
  { x: '20%', y: '45%', color: '#D4A5D8', size: 12 },
  { x: '35%', y: '15%', color: '#A5D8FF', size: 16 },
  { x: '45%', y: '70%', color: '#FFD9A5', size: 13 },
  { x: '55%', y: '30%', color: '#A5E8E8', size: 15 },
  { x: '65%', y: '55%', color: '#FFCAC9', size: 12 },
  { x: '75%', y: '18%', color: '#C9C9FF', size: 14 },
  { x: '80%', y: '60%', color: '#D0FFD0', size: 16 },
  { x: '90%', y: '35%', color: '#FFD0E5', size: 13 },
  { x: '30%', y: '80%', color: '#ECECB0', size: 15 },
];

export default function FloatingIceCreamsBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Destellos pastel */}
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{ left: sparkle.x, top: sparkle.y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Sparkle color={sparkle.color} size={sparkle.size} />
        </motion.div>
      ))}
      
      {/* Elementos sketch - lluvia cayendo */}
      {sketchElements.map((el, i) => (
        <motion.div
          key={`sketch-${i}`}
          className="absolute"
          style={{ 
            left: el.x, 
            width: el.size,
            height: el.size * 1.5
          }}
          initial={{ opacity: 0, y: -100 }}
          animate={{ 
            opacity: [0, 0.6, 0.6, 0],
            y: [-100, window.innerHeight + 100],
          }}
          transition={{ 
            duration: 14 + i * 0.5,
            delay: el.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {el.type === 'cone' && <IceCreamCone opacity={0.5} />}
          {el.type === 'shake' && <Milkshake opacity={0.45} />}
          {el.type === 'banana' && <BananaSplit opacity={0.45} />}
          {el.type === 'tub' && <IceCreamTub opacity={0.45} />}
          {el.type === 'cup' && <IceCreamCup opacity={0.45} />}
        </motion.div>
      ))}
    </div>
  );
}