import React from 'react';
import { motion } from 'framer-motion';

// Íconos SVG monocromáticos simplificados
const IceCreamCone = ({ opacity, blur }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ filter: blur ? 'blur(2px)' : 'none', opacity }}>
    <path d="M12 2L8 10h8L12 2z" />
    <circle cx="12" cy="8" r="3" />
    <circle cx="12" cy="5" r="2" />
  </svg>
);

const Cookie = ({ opacity, blur }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ filter: blur ? 'blur(2px)' : 'none', opacity }}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="9" r="1.5" fill="white" opacity="0.6" />
    <circle cx="15" cy="10" r="1.5" fill="white" opacity="0.6" />
    <circle cx="10" cy="15" r="1.5" fill="white" opacity="0.6" />
    <circle cx="16" cy="15" r="1.5" fill="white" opacity="0.6" />
  </svg>
);

const PopsyCup = ({ opacity, blur }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ filter: blur ? 'blur(2px)' : 'none', opacity }}>
    <path d="M7 4h10l2 16H5L7 4z" />
    <rect x="6" y="2" width="12" height="3" rx="1" />
  </svg>
);

// Configuración de íconos flotantes (máximo 10)
const floatingElements = [
  { 
    Icon: IceCreamCone, 
    x: '8%', 
    y: '12%', 
    size: 80,
    duration: 35,
    rotation: [-8, 8],
    opacity: 0.08,
    blur: false,
    delay: 0
  },
  { 
    Icon: Cookie, 
    x: '75%', 
    y: '18%', 
    size: 60,
    duration: 42,
    rotation: [-12, 12],
    opacity: 0.06,
    blur: true,
    delay: 5
  },
  { 
    Icon: PopsyCup, 
    x: '15%', 
    y: '65%', 
    size: 70,
    duration: 38,
    rotation: [-10, 10],
    opacity: 0.10,
    blur: false,
    delay: 10
  },
  { 
    Icon: IceCreamCone, 
    x: '82%', 
    y: '70%', 
    size: 90,
    duration: 45,
    rotation: [-6, 6],
    opacity: 0.05,
    blur: true,
    delay: 15
  },
  { 
    Icon: Cookie, 
    x: '45%', 
    y: '8%', 
    size: 55,
    duration: 40,
    rotation: [-15, 15],
    opacity: 0.12,
    blur: false,
    delay: 20
  },
  { 
    Icon: PopsyCup, 
    x: '88%', 
    y: '40%', 
    size: 65,
    duration: 36,
    rotation: [-8, 8],
    opacity: 0.07,
    blur: true,
    delay: 8
  },
  { 
    Icon: IceCreamCone, 
    x: '25%', 
    y: '85%', 
    size: 75,
    duration: 50,
    rotation: [-10, 10],
    opacity: 0.09,
    blur: false,
    delay: 12
  },
  { 
    Icon: Cookie, 
    x: '60%', 
    y: '55%', 
    size: 58,
    duration: 44,
    rotation: [-12, 12],
    opacity: 0.06,
    blur: true,
    delay: 18
  },
  { 
    Icon: PopsyCup, 
    x: '92%', 
    y: '88%', 
    size: 85,
    duration: 39,
    rotation: [-7, 7],
    opacity: 0.11,
    blur: false,
    delay: 3
  },
  { 
    Icon: IceCreamCone, 
    x: '50%', 
    y: '92%', 
    size: 68,
    duration: 48,
    rotation: [-9, 9],
    opacity: 0.08,
    blur: true,
    delay: 25
  }
];

export default function PopsyFloatingBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {floatingElements.map((element, index) => {
        const Icon = element.Icon;
        
        return (
          <motion.div
            key={index}
            className="absolute text-pink-400"
            style={{
              left: element.x,
              top: element.y,
              width: element.size,
              height: element.size
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -10, 0],
              rotate: element.rotation,
              scale: [1, 1.05, 0.98, 1]
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.delay,
              times: [0, 0.3, 0.7, 1]
            }}
          >
            <Icon opacity={element.opacity} blur={element.blur} />
          </motion.div>
        );
      })}
    </div>
  );
}