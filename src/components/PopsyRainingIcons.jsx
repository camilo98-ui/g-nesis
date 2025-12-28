import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons minimalistas estilo línea
const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="25" cy="25" r="18"/>
    <circle cx="18" cy="20" r="1.5" fill={color}/>
    <circle cx="32" cy="20" r="1.5" fill={color}/>
    <circle cx="25" cy="28" r="1.5" fill={color}/>
    <circle cx="17" cy="30" r="1.5" fill={color}/>
    <circle cx="33" cy="30" r="1.5" fill={color}/>
  </svg>
);

const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 22 L25 38 L30 22" fill="none"/>
    <line x1="22.5" y1="26" x2="25" y2="35"/>
    <line x1="27.5" y1="26" x2="25" y2="35"/>
    <circle cx="25" cy="17" r="6.5"/>
  </svg>
);

const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <rect x="17" y="20" width="16" height="20" rx="2"/>
    <ellipse cx="25" cy="20" rx="8" ry="2"/>
    <text x="25" y="32" fontSize="6" fill={color} textAnchor="middle" fontWeight="bold">Popsy</text>
  </svg>
);

const MilkshakeCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 22 L17 38 C17 40 19 41 25 41 C31 41 33 40 33 38 L31 22 Z"/>
    <ellipse cx="25" cy="22" rx="6.5" ry="2"/>
    <line x1="25" y1="14" x2="25" y2="22"/>
    <circle cx="25" cy="12" r="2"/>
    <text x="25" y="32" fontSize="5" fill={color} textAnchor="middle" fontWeight="bold">Popsy</text>
  </svg>
);

const IceCreamOutline = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 24 L25 40 L30 24"/>
    <circle cx="25" cy="18" r="7"/>
    <circle cx="19" cy="16" r="5"/>
    <circle cx="31" cy="16" r="5"/>
  </svg>
);

const ICON_COMPONENTS = [CookieIcon, IceCreamCone, PopsyCup, IceCreamOutline, MilkshakeCup];
const COLORS = ["#C2185B", "#C2185B", "#C2185B", "#C2185B", "#C2185B"];

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