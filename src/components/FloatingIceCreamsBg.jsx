import React from 'react';
import { motion } from 'framer-motion';

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
const IceCreamCone = ({ opacity = 0.45 }) => (
  <svg viewBox="0 0 40 60" className="w-full h-full">
    <circle cx="20" cy="14" r="12" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="2,1" opacity={opacity} />
    <circle cx="20" cy="14" r="12" fill="#FFB5C5" opacity={opacity * 0.5} />
    <polygon points="10,22 20,55 30,22" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="2,1" opacity={opacity} />
    <polygon points="10,22 20,55 30,22" fill="#E8D5B0" opacity={opacity * 0.4} />
    <line x1="13" y1="28" x2="27" y2="28" stroke="#aaa" strokeWidth="0.5" strokeDasharray="1,1" opacity={opacity * 0.7} />
    <line x1="15" y1="36" x2="25" y2="36" stroke="#aaa" strokeWidth="0.5" strokeDasharray="1,1" opacity={opacity * 0.7} />
  </svg>
);

// Malteada estilo sketch
const Milkshake = ({ opacity = 0.4 }) => (
  <svg viewBox="0 0 35 55" className="w-full h-full">
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="2,1" opacity={opacity} />
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="#C5E8FF" opacity={opacity * 0.3} />
    <ellipse cx="17.5" cy="12" rx="10" ry="6" fill="none" stroke="#999" strokeWidth="0.6" strokeDasharray="1,1" opacity={opacity} />
    <circle cx="17" cy="4" r="3" fill="none" stroke="#999" strokeWidth="0.6" opacity={opacity} />
    <line x1="22" y1="5" x2="24" y2="35" stroke="#999" strokeWidth="1" opacity={opacity} />
  </svg>
);

// Paleta estilo sketch
const Popsicle = ({ opacity = 0.4 }) => (
  <svg viewBox="0 0 25 50" className="w-full h-full">
    <rect x="5" y="5" width="15" height="30" rx="7" fill="none" stroke="#999" strokeWidth="0.8" strokeDasharray="2,1" opacity={opacity} />
    <rect x="5" y="5" width="15" height="30" rx="7" fill="#C5E8FF" opacity={opacity * 0.5} />
    <rect x="10" y="32" width="5" height="15" fill="none" stroke="#999" strokeWidth="0.6" opacity={opacity} />
  </svg>
);

const sketchElements = [
  { x: '5%', y: '12%', size: 35, type: 'cone' },
  { x: '88%', y: '8%', size: 38, type: 'cone' },
  { x: '15%', y: '65%', size: 32, type: 'cone' },
  { x: '82%', y: '72%', size: 36, type: 'cone' },
  { x: '50%', y: '85%', size: 34, type: 'cone' },
  { x: '25%', y: '28%', size: 30, type: 'shake' },
  { x: '72%', y: '38%', size: 28, type: 'shake' },
  { x: '92%', y: '45%', size: 26, type: 'popsicle' },
  { x: '8%', y: '42%', size: 24, type: 'popsicle' },
];

// Destellos pastel
const sparkles = [
  { x: '10%', y: '20%', color: '#FFD1DC', size: 12 },
  { x: '20%', y: '45%', color: '#E0BBE4', size: 10 },
  { x: '35%', y: '15%', color: '#C5E8FF', size: 14 },
  { x: '45%', y: '70%', color: '#FFEFD5', size: 11 },
  { x: '55%', y: '30%', color: '#D4F0F0', size: 13 },
  { x: '65%', y: '55%', color: '#FFE4E1', size: 10 },
  { x: '75%', y: '18%', color: '#E6E6FA', size: 12 },
  { x: '80%', y: '60%', color: '#F0FFF0', size: 14 },
  { x: '90%', y: '35%', color: '#FFF0F5', size: 11 },
  { x: '30%', y: '80%', color: '#F5F5DC', size: 13 },
  { x: '60%', y: '88%', color: '#FFB6C1', size: 10 },
  { x: '85%', y: '82%', color: '#DDA0DD', size: 12 },
  { x: '12%', y: '75%', color: '#B0E0E6', size: 11 },
  { x: '42%', y: '40%', color: '#FFDAB9', size: 15 },
  { x: '68%', y: '12%', color: '#E0FFFF', size: 10 },
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
      
      {/* Elementos sketch */}
      {sketchElements.map((el, i) => (
        <motion.div
          key={`sketch-${i}`}
          className="absolute"
          style={{ 
            left: el.x, 
            top: el.y,
            width: el.size,
            height: el.size * 1.5
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1,
            y: [0, -6, 0],
          }}
          transition={{ 
            opacity: { duration: 1, delay: i * 0.1 },
            y: { duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {el.type === 'cone' && <IceCreamCone opacity={0.5} />}
          {el.type === 'shake' && <Milkshake opacity={0.45} />}
          {el.type === 'popsicle' && <Popsicle opacity={0.45} />}
        </motion.div>
      ))}
    </div>
  );
}