import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons sin fondo
const CookieIcon = ({ color = "#ec4899" }) => (
  <svg viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill={color} opacity="0.9"/>
    <circle cx="35" cy="35" r="6" fill="#fff" opacity="0.4"/>
    <circle cx="65" cy="35" r="4" fill="#fff" opacity="0.4"/>
    <circle cx="50" cy="55" r="5" fill="#fff" opacity="0.4"/>
    <circle cx="30" cy="60" r="4" fill="#fff" opacity="0.4"/>
    <circle cx="70" cy="60" r="6" fill="#fff" opacity="0.4"/>
    <circle cx="50" cy="25" r="3" fill="#fff" opacity="0.3"/>
  </svg>
);

const IceCreamCone = ({ color = "#ec4899" }) => (
  <svg viewBox="0 0 100 100" fill="none">
    <path d="M35 45 L50 85 L65 45 Z" fill="#D4A574" stroke={color} strokeWidth="2"/>
    <path d="M40 48 L50 65 M50 65 L60 48" stroke={color} strokeWidth="1.5" opacity="0.3"/>
    <circle cx="50" cy="35" r="18" fill={color} opacity="0.9"/>
    <ellipse cx="45" cy="30" rx="8" ry="6" fill="#fff" opacity="0.3"/>
  </svg>
);

const PopsyCup = ({ color = "#64748b" }) => (
  <svg viewBox="0 0 100 100" fill="none">
    <rect x="30" y="35" width="40" height="45" rx="4" fill={color} opacity="0.1" stroke={color} strokeWidth="3"/>
    <rect x="25" y="30" width="50" height="8" rx="2" fill={color} opacity="0.9"/>
    <text x="50" y="60" fontSize="12" fill={color} textAnchor="middle" fontWeight="bold">Popsy</text>
  </svg>
);

const IceCreamOutline = ({ color = "#a855f7" }) => (
  <svg viewBox="0 0 100 100" fill="none">
    <path d="M35 50 L50 85 L65 50 Z" fill="none" stroke={color} strokeWidth="3"/>
    <circle cx="50" cy="38" r="16" fill="none" stroke={color} strokeWidth="3"/>
    <circle cx="42" cy="32" r="10" fill="none" stroke={color} strokeWidth="2.5"/>
    <circle cx="58" cy="32" r="10" fill="none" stroke={color} strokeWidth="2.5"/>
  </svg>
);

const ICON_COMPONENTS = [CookieIcon, IceCreamCone, PopsyCup, IceCreamOutline];
const COLORS = ["#ec4899", "#a855f7", "#ec4899", "#a855f7"];

const RAIN_ITEMS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  IconComponent: ICON_COMPONENTS[i % ICON_COMPONENTS.length],
  color: COLORS[i % COLORS.length],
  left: `${Math.random() * 100}%`,
  size: 35 + Math.random() * 45,
  delay: Math.random() * 8,
  duration: 10 + Math.random() * 8,
  opacity: 0.15 + Math.random() * 0.25,
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
              opacity: item.opacity,
              filter: 'drop-shadow(0 4px 12px rgba(236, 72, 153, 0.15))'
            }}
            initial={{ y: -150, rotate: 0 }}
            animate={{
              y: ['-150px', '100vh'],
              rotate: [item.rotation, item.rotation + 360],
              x: [0, Math.sin(item.id) * 40, 0]
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