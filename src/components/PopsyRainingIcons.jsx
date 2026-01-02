import React from 'react';
import { motion } from 'framer-motion';

// Nuevos iconos de helado, galleta y vasito
const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 45 L50 85 L70 45 Z" stroke={color} strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
    <line x1="35" y1="52" x2="50" y2="77" stroke={color} strokeWidth="2.5"/>
    <line x1="65" y1="52" x2="50" y2="77" stroke={color} strokeWidth="2.5"/>
    <line x1="42" y1="55" x2="50" y2="70" stroke={color} strokeWidth="2"/>
    <line x1="58" y1="55" x2="50" y2="70" stroke={color} strokeWidth="2"/>
    <circle cx="50" cy="35" r="15" stroke={color} strokeWidth="3.5" fill="none"/>
  </svg>
);

const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="3.5" fill="none"/>
    <path d="M 75 35 Q 80 25 85 30" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <circle cx="88" cy="22" r="3" fill={color}/>
    <circle cx="92" cy="30" r="3" fill={color}/>
    <circle cx="35" cy="45" r="4" fill={color}/>
    <circle cx="55" cy="40" r="3.5" fill={color}/>
    <circle cx="45" cy="58" r="4.5" fill={color}/>
    <circle cx="65" cy="55" r="3" fill={color}/>
    <circle cx="58" cy="68" r="4" fill={color}/>
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