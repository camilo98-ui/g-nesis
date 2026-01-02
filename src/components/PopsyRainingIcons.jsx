import React from 'react';
import { motion } from 'framer-motion';

// Nuevos iconos de helado, galleta y vasito
const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cono */}
    <path d="M32 48 L50 88 L68 48 Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
    <line x1="37" y1="56" x2="50" y2="82" stroke={color} strokeWidth="2.5"/>
    <line x1="63" y1="56" x2="50" y2="82" stroke={color} strokeWidth="2.5"/>
    <line x1="44" y1="60" x2="50" y2="72" stroke={color} strokeWidth="2"/>
    <line x1="56" y1="60" x2="50" y2="72" stroke={color} strokeWidth="2"/>
    {/* Bola de helado principal */}
    <circle cx="50" cy="38" r="18" stroke={color} strokeWidth="3.5" fill="none"/>
    {/* Bola pequeña en la parte superior */}
    <circle cx="45" cy="22" r="10" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="58" cy="25" r="8" stroke={color} strokeWidth="3" fill="none"/>
  </svg>
);

const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Círculo principal de la galleta */}
    <path d="M 20 50 A 30 30 0 1 1 80 50 A 30 30 0 0 1 73 68 Q 72 72 68 73 A 30 30 0 0 1 20 50" stroke={color} strokeWidth="4.5" fill="none"/>
    {/* Mordida superior derecha */}
    <path d="M 73 30 Q 85 25 87 35 Q 88 42 82 47 Q 76 50 73 45" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none"/>
    {/* Migajas cerca de la mordida */}
    <circle cx="85" cy="20" r="3.5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="92" cy="28" r="2.5" stroke={color} strokeWidth="3" fill="none"/>
    {/* Chispas de chocolate */}
    <circle cx="38" cy="50" r="5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="55" cy="45" r="4" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="48" cy="62" r="4.5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="60" cy="58" r="5.5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="42" cy="72" r="4" stroke={color} strokeWidth="3" fill="none"/>
  </svg>
);

const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 25 L22 75 Q22 85 50 85 Q78 85 78 75 L75 25 Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
    <ellipse cx="50" cy="25" rx="25" ry="5" stroke={color} strokeWidth="3.5" fill="none"/>
    <path d="M30 25 L27 65 Q27 70 50 70 Q73 70 73 65 L70 25" stroke={color} strokeWidth="2" opacity="0.3" fill="none"/>
    <text x="50" y="55" fontSize="14" fill={color} textAnchor="middle" fontFamily="cursive" fontWeight="600" fontStyle="italic">Popsy</text>
  </svg>
);

const ICON_COMPONENTS = [IceCreamCone, CookieIcon, PopsyCup];
const COLORS = ["#C2185B", "#D81B60", "#C2185B"];

const RAIN_ITEMS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  IconComponent: ICON_COMPONENTS[i % ICON_COMPONENTS.length],
  color: COLORS[i % COLORS.length],
  left: `${Math.random() * 100}%`,
  size: 28 + Math.random() * 30,
  delay: Math.random() * 10,
  duration: 12 + Math.random() * 10,
  opacity: 0.08 + Math.random() * 0.12,
  rotation: Math.random() * 360
}));

export default function PopsyRainingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {RAIN_ITEMS.map((item) => {
        const IconComponent = item.IconComponent;
        return (
          <motion.div
            key={item.id}
            className="absolute"
            style={{
              left: item.left,
              width: item.size,
              height: item.size,
              opacity: item.opacity
            }}
            initial={{ y: -100, rotate: 0 }}
            animate={{
              y: ['-100px', '110vh'],
              rotate: [item.rotation, item.rotation + 180],
              x: [0, Math.sin(item.id) * 30]
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <IconComponent color={item.color} />
          </motion.div>
        );
      })}
    </div>
  );
}