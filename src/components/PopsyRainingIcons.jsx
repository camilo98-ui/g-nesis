import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons minimalistas estilo línea
const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <circle cx="25" cy="25" r="18"/>
    <circle cx="18" cy="20" r="2" fill="#8B4513" opacity="0.8"/>
    <circle cx="32" cy="20" r="2" fill="#8B4513" opacity="0.8"/>
    <circle cx="25" cy="28" r="2.2" fill="#8B4513" opacity="0.8"/>
    <circle cx="17" cy="30" r="1.8" fill="#8B4513" opacity="0.8"/>
    <circle cx="33" cy="30" r="1.8" fill="#8B4513" opacity="0.8"/>
    <circle cx="22" cy="24" r="1" fill="#FF69B4" opacity="0.6"/>
    <circle cx="28" cy="25" r="1" fill="#87CEEB" opacity="0.6"/>
    <circle cx="25" cy="33" r="1" fill="#FFD700" opacity="0.6"/>
  </svg>
);

const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 22 L25 38 L30 22" fill="none"/>
    <line x1="22.5" y1="26" x2="25" y2="35"/>
    <line x1="27.5" y1="26" x2="25" y2="35"/>
    <circle cx="25" cy="17" r="6.5"/>
    <circle cx="22" cy="15" r="3" opacity="0.6"/>
    <circle cx="28" cy="16" r="2.5" opacity="0.6"/>
    <rect x="23" y="14" width="2" height="1.5" fill="#FF1493" opacity="0.8" rx="0.3"/>
    <rect x="27" y="15" width="1.5" height="1" fill="#00CED1" opacity="0.8" rx="0.3"/>
    <rect x="24" y="18" width="1.8" height="1.2" fill="#FFD700" opacity="0.8" rx="0.3"/>
  </svg>
);

const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 20 L18 38 C18 39.5 20 41 25 41 C30 41 32 39.5 32 38 L31 20 Z"/>
    <ellipse cx="25" cy="20" rx="6.5" ry="2"/>
    <rect x="24" y="41" width="2" height="4" fill={color} opacity="0.8" rx="0.5"/>
    <text x="25" y="31" fontSize="5.5" fill={color} textAnchor="middle" fontWeight="bold" fontStyle="italic">Popsy</text>
    <circle cx="22" cy="24" r="0.8" fill="#FF69B4" opacity="0.7"/>
    <circle cx="28" cy="26" r="0.8" fill="#87CEEB" opacity="0.7"/>
    <circle cx="25" cy="35" r="0.8" fill="#FFD700" opacity="0.7"/>
  </svg>
);

const IceCreamCupScoop = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 23 L18 38 C18 39.5 20 41 25 41 C30 41 32 39.5 32 38 L31 23 Z"/>
    <ellipse cx="25" cy="23" rx="6.5" ry="2"/>
    <circle cx="25" cy="16" r="7"/>
    <circle cx="22" cy="14" r="4" opacity="0.7"/>
    <circle cx="28" cy="15" r="4.5" opacity="0.7"/>
    <circle cx="24" cy="17" r="1.5" fill="#ffffff" opacity="0.5"/>
    <circle cx="26" cy="14" r="1.2" fill="#ffffff" opacity="0.5"/>
    <text x="25" y="33" fontSize="4.5" fill={color} textAnchor="middle" fontWeight="bold" fontStyle="italic">P</text>
  </svg>
);

const IceCreamOutline = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 22 L25 38 L30 22" fill="none"/>
    <line x1="22.5" y1="26" x2="25" y2="35"/>
    <line x1="27.5" y1="26" x2="25" y2="35"/>
    <circle cx="22" cy="17" r="5"/>
    <circle cx="28" cy="17" r="5"/>
  </svg>
);

const ICON_COMPONENTS = [CookieIcon, IceCreamCone, PopsyCup, IceCreamOutline, IceCreamCupScoop];
const COLORS = ["#C2185B", "#C2185B", "#C2185B", "#C2185B", "#C2185B"];

const RAIN_ITEMS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  IconComponent: ICON_COMPONENTS[i % ICON_COMPONENTS.length],
  color: COLORS[i % COLORS.length],
  left: `${Math.random() * 100}%`,
  size: 32 + Math.random() * 35,
  delay: Math.random() * 10,
  duration: 12 + Math.random() * 10,
  opacity: 0.09 + Math.random() * 0.14,
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