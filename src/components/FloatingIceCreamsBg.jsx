import React from 'react';
import { motion } from 'framer-motion';

// Cono con bolita (estilo dibujo a lápiz sutil)
const IceCreamCone = ({ opacity = 0.3 }) => (
  <svg viewBox="0 0 40 60" className="w-full h-full">
    <defs>
      <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB5C5" stopOpacity={opacity} />
        <stop offset="100%" stopColor="#FF8FA3" stopOpacity={opacity * 0.8} />
      </linearGradient>
    </defs>
    {/* Bolita de helado */}
    <circle cx="20" cy="14" r="12" fill="url(#ballGrad)" stroke="#888" strokeWidth="0.5" opacity={opacity} />
    {/* Cono */}
    <polygon points="10,22 20,55 30,22" fill="#E8D5B0" stroke="#999" strokeWidth="0.5" opacity={opacity * 0.9} />
    {/* Líneas del cono */}
    <line x1="13" y1="28" x2="27" y2="28" stroke="#aaa" strokeWidth="0.3" opacity={opacity * 0.6} />
    <line x1="15" y1="36" x2="25" y2="36" stroke="#aaa" strokeWidth="0.3" opacity={opacity * 0.6} />
    <line x1="17" y1="44" x2="23" y2="44" stroke="#aaa" strokeWidth="0.3" opacity={opacity * 0.6} />
  </svg>
);

// Malteada estilo sketch
const Milkshake = ({ opacity = 0.25 }) => (
  <svg viewBox="0 0 35 55" className="w-full h-full">
    {/* Vaso */}
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="none" stroke="#888" strokeWidth="0.8" opacity={opacity} />
    {/* Crema */}
    <ellipse cx="17.5" cy="12" rx="10" ry="6" fill="none" stroke="#888" strokeWidth="0.5" opacity={opacity} />
    <ellipse cx="14" cy="8" rx="5" ry="4" fill="none" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.8} />
    <ellipse cx="21" cy="9" rx="4" ry="3" fill="none" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.8} />
    {/* Cereza */}
    <circle cx="17" cy="4" r="3" fill="none" stroke="#888" strokeWidth="0.5" opacity={opacity} />
    {/* Pajilla */}
    <line x1="22" y1="5" x2="24" y2="35" stroke="#888" strokeWidth="0.8" opacity={opacity} />
  </svg>
);

// Paleta estilo sketch
const Popsicle = ({ opacity = 0.25 }) => (
  <svg viewBox="0 0 25 50" className="w-full h-full">
    {/* Paleta */}
    <rect x="5" y="5" width="15" height="30" rx="7" fill="none" stroke="#888" strokeWidth="0.6" opacity={opacity} />
    {/* Palo */}
    <rect x="10" y="32" width="5" height="15" fill="none" stroke="#888" strokeWidth="0.5" opacity={opacity} />
  </svg>
);

// Cupcake estilo sketch
const Cupcake = ({ opacity = 0.2 }) => (
  <svg viewBox="0 0 40 45" className="w-full h-full">
    {/* Base */}
    <path d="M10 25 L8 40 L32 40 L30 25 Z" fill="none" stroke="#888" strokeWidth="0.6" opacity={opacity} />
    {/* Crema */}
    <path d="M8 25 Q12 18 16 22 Q20 15 24 22 Q28 18 32 25" fill="none" stroke="#888" strokeWidth="0.5" opacity={opacity} />
    <ellipse cx="20" cy="20" rx="8" ry="5" fill="none" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.8} />
    {/* Cereza */}
    <circle cx="20" cy="12" r="3" fill="none" stroke="#888" strokeWidth="0.4" opacity={opacity} />
  </svg>
);

// Donut estilo sketch
const Donut = ({ opacity = 0.2 }) => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <circle cx="20" cy="20" r="15" fill="none" stroke="#888" strokeWidth="0.6" opacity={opacity} />
    <circle cx="20" cy="20" r="6" fill="none" stroke="#888" strokeWidth="0.5" opacity={opacity} />
    {/* Sprinkles */}
    <line x1="12" y1="12" x2="14" y2="10" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.7} />
    <line x1="26" y1="10" x2="28" y2="12" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.7} />
    <line x1="10" y1="24" x2="12" y2="26" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.7} />
    <line x1="28" y1="26" x2="30" y2="24" stroke="#888" strokeWidth="0.4" opacity={opacity * 0.7} />
  </svg>
);

const elements = [
  // Conos con bolita
  { x: '5%', y: '10%', size: 40, type: 'cone', delay: 0 },
  { x: '15%', y: '60%', size: 35, type: 'cone', delay: 1.2 },
  { x: '85%', y: '15%', size: 38, type: 'cone', delay: 0.8 },
  { x: '75%', y: '70%', size: 42, type: 'cone', delay: 1.5 },
  { x: '45%', y: '80%', size: 36, type: 'cone', delay: 2.0 },
  
  // Malteadas sketch
  { x: '25%', y: '25%', size: 32, type: 'shake', delay: 0.4 },
  { x: '65%', y: '45%', size: 30, type: 'shake', delay: 1.8 },
  
  // Paletas sketch
  { x: '90%', y: '40%', size: 28, type: 'popsicle', delay: 0.6 },
  { x: '10%', y: '35%', size: 26, type: 'popsicle', delay: 1.4 },
  
  // Cupcakes sketch
  { x: '55%', y: '12%', size: 30, type: 'cupcake', delay: 1.0 },
  { x: '35%', y: '55%', size: 28, type: 'cupcake', delay: 2.2 },
  
  // Donuts sketch
  { x: '80%', y: '85%', size: 32, type: 'donut', delay: 0.9 },
  { x: '20%', y: '85%', size: 28, type: 'donut', delay: 1.6 },
];

export default function FloatingIceCreamsBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, i) => (
        <motion.div
          key={i}
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
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ 
            opacity: { duration: 1, delay: el.delay * 0.15 },
            y: { duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 5 + i * 0.2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {el.type === 'cone' && <IceCreamCone opacity={0.35} />}
          {el.type === 'shake' && <Milkshake opacity={0.25} />}
          {el.type === 'popsicle' && <Popsicle opacity={0.25} />}
          {el.type === 'cupcake' && <Cupcake opacity={0.2} />}
          {el.type === 'donut' && <Donut opacity={0.2} />}
        </motion.div>
      ))}
    </div>
  );
}