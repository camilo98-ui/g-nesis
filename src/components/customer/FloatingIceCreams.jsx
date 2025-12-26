import React from 'react';
import { motion } from 'framer-motion';

const IceCreamCone = ({ color = "#FFB6C1" }) => (
  <svg viewBox="0 0 100 120" className="w-full h-full">
    <defs>
      <linearGradient id={`cone-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F4A460" />
        <stop offset="100%" stopColor="#D2691E" />
      </linearGradient>
      <linearGradient id={`ice-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <path d="M50 60 L30 110 L70 110 Z" fill={`url(#cone-${color})`} />
    <circle cx="50" cy="60" r="25" fill={`url(#ice-${color})`} />
    <circle cx="50" cy="40" r="20" fill={`url(#ice-${color})`} opacity="0.8" />
  </svg>
);

const FloatingIceCreams = () => {
  const iceCreams = [
    { x: '5%', y: '10%', size: 60, color: '#FFB6C1', delay: 0 },
    { x: '85%', y: '15%', size: 50, color: '#FFE4B5', delay: 1 },
    { x: '15%', y: '75%', size: 55, color: '#E6E6FA', delay: 2 },
    { x: '90%', y: '70%', size: 45, color: '#FFDAB9', delay: 3 },
    { x: '50%', y: '85%', size: 50, color: '#F0E68C', delay: 1.5 },
    { x: '70%', y: '40%', size: 40, color: '#DDA0DD', delay: 2.5 }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
      {iceCreams.map((ice, idx) => (
        <motion.div
          key={idx}
          className="absolute"
          style={{
            left: ice.x,
            top: ice.y,
            width: ice.size,
            height: ice.size
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 6 + idx,
            repeat: Infinity,
            delay: ice.delay,
            ease: "easeInOut"
          }}
        >
          <IceCreamCone color={ice.color} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingIceCreams;