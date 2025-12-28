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
    <path d="M20 25 L25 42 L30 25"/>
    <path d="M22 27 L25 37 M25 37 L28 27"/>
    <circle cx="25" cy="20" r="8"/>
    <path d="M18 18 Q25 10 32 18"/>
  </svg>
);

const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <rect x="18" y="18" width="14" height="18" rx="2"/>
    <line x1="16" y1="18" x2="34" y2="18"/>
    <path d="M20 25 L30 25 M20 30 L30 30"/>
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

const ICON_COMPONENTS = [CookieIcon, IceCreamCone, PopsyCup, IceCreamOutline];
const COLORS = ["#C2185B", "#C2185B", "#C2185B", "#C2185B"];

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