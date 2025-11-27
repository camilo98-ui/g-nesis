import React from 'react';
import { motion } from 'framer-motion';

// Helados sin color - solo contornos grises claros
const IceCreamOutline = ({ className }) => (
  <svg viewBox="0 0 40 80" className={className}>
    <path 
      d="M20 0 C8 0 0 10 0 22 C0 34 8 40 20 45 C32 40 40 34 40 22 C40 10 32 0 20 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.3"
    />
    <path 
      d="M8 45 L20 78 L32 45"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.3"
    />
    <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <line x1="12" y1="55" x2="28" y2="55" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <line x1="14" y1="60" x2="26" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
  </svg>
);

const positions = [
  { x: '5%', y: '10%', size: 60, delay: 0 },
  { x: '15%', y: '60%', size: 45, delay: 1.5 },
  { x: '25%', y: '25%', size: 35, delay: 0.8 },
  { x: '35%', y: '75%', size: 50, delay: 2.2 },
  { x: '50%', y: '15%', size: 40, delay: 1.2 },
  { x: '60%', y: '50%', size: 55, delay: 0.5 },
  { x: '70%', y: '80%', size: 38, delay: 1.8 },
  { x: '80%', y: '30%', size: 48, delay: 2.5 },
  { x: '90%', y: '65%', size: 42, delay: 0.3 },
  { x: '95%', y: '10%', size: 35, delay: 1.0 },
  { x: '45%', y: '85%', size: 52, delay: 2.0 },
  { x: '75%', y: '5%', size: 45, delay: 0.7 },
];

export default function FloatingIceCreamsBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute text-gray-300"
          style={{ 
            left: pos.x, 
            top: pos.y,
            width: pos.size,
            height: pos.size * 2
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1,
            y: [0, -15, 0],
            rotate: [0, 3, -3, 0]
          }}
          transition={{ 
            opacity: { duration: 0.5, delay: pos.delay * 0.3 },
            y: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 6 + i * 0.3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <IceCreamOutline className="w-full h-full" />
        </motion.div>
      ))}
    </div>
  );
}