import React from 'react';
import { motion } from 'framer-motion';

// Cono de helado con colores pastel
const IceCreamCone = ({ color1, color2 }) => (
  <svg viewBox="0 0 40 80" className="w-full h-full">
    <defs>
      <linearGradient id={`grad-${color1}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color1} stopOpacity="0.6" />
        <stop offset="100%" stopColor={color2} stopOpacity="0.4" />
      </linearGradient>
    </defs>
    <ellipse cx="20" cy="20" rx="18" ry="20" fill={`url(#grad-${color1})`} />
    <ellipse cx="20" cy="15" rx="14" ry="12" fill={color2} opacity="0.5" />
    <path d="M6 28 L20 75 L34 28 Z" fill="#F5D6BA" opacity="0.7" />
    <line x1="10" y1="35" x2="30" y2="35" stroke="#E8C4A0" strokeWidth="1" opacity="0.5" />
    <line x1="12" y1="45" x2="28" y2="45" stroke="#E8C4A0" strokeWidth="1" opacity="0.5" />
    <line x1="15" y1="55" x2="25" y2="55" stroke="#E8C4A0" strokeWidth="1" opacity="0.5" />
  </svg>
);

// Malteada
const Milkshake = ({ color }) => (
  <svg viewBox="0 0 50 80" className="w-full h-full">
    <defs>
      <linearGradient id={`shake-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.7" />
        <stop offset="100%" stopColor={color} stopOpacity="0.4" />
      </linearGradient>
    </defs>
    {/* Crema */}
    <ellipse cx="25" cy="18" rx="16" ry="14" fill="white" opacity="0.8" />
    <ellipse cx="20" cy="12" rx="8" ry="8" fill="white" opacity="0.6" />
    <ellipse cx="30" cy="14" rx="6" ry="6" fill="white" opacity="0.6" />
    {/* Vaso */}
    <path d="M10 22 L14 70 L36 70 L40 22 Z" fill={`url(#shake-${color})`} />
    {/* Cereza */}
    <circle cx="25" cy="6" r="5" fill="#FF6B8A" opacity="0.8" />
    <line x1="25" y1="1" x2="25" y2="6" stroke="#4A7C4E" strokeWidth="1.5" />
    {/* Pajilla */}
    <rect x="30" y="5" width="3" height="50" fill="#FF9EAA" opacity="0.7" rx="1" />
  </svg>
);

const elements = [
  { x: '3%', y: '8%', size: 35, type: 'cone', color1: '#FFB5C5', color2: '#FFC0CB', delay: 0 },
  { x: '12%', y: '55%', size: 32, type: 'shake', color: '#B5E8FF', delay: 1.2 },
  { x: '22%', y: '20%', size: 28, type: 'cone', color1: '#C5B5FF', color2: '#D8CFFF', delay: 0.6 },
  { x: '32%', y: '70%', size: 30, type: 'shake', color: '#FFD5B5', delay: 1.8 },
  { x: '48%', y: '12%', size: 32, type: 'cone', color1: '#B5FFD5', color2: '#C8FFE0', delay: 0.9 },
  { x: '58%', y: '45%', size: 28, type: 'shake', color: '#FFB5E8', delay: 2.1 },
  { x: '68%', y: '75%', size: 30, type: 'cone', color1: '#FFE5B5', color2: '#FFF0D5', delay: 1.5 },
  { x: '78%', y: '25%', size: 34, type: 'shake', color: '#B5D5FF', delay: 0.3 },
  { x: '88%', y: '60%', size: 28, type: 'cone', color1: '#E8B5FF', color2: '#F0CFFF', delay: 2.4 },
  { x: '93%', y: '8%', size: 26, type: 'shake', color: '#FFB5B5', delay: 0.7 },
];

export default function FloatingIceCreamsBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ 
            left: el.x, 
            top: el.y,
            width: el.size,
            height: el.size * 1.6
          }}
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ 
            opacity: 0.6,
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0],
            scale: [1, 1.01, 1]
          }}
          transition={{ 
            opacity: { duration: 1.2, delay: el.delay * 0.3 },
            y: { duration: 8 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 10 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 6 + i * 0.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {el.type === 'cone' ? (
            <IceCreamCone color1={el.color1} color2={el.color2} />
          ) : (
            <Milkshake color={el.color} />
          )}
        </motion.div>
      ))}
    </div>
  );
}