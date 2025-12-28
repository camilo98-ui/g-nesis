import React from 'react';
import { motion } from 'framer-motion';

// SVG Icons basados en las imágenes compartidas
const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15 L13 35 C13 37 15 39 25 39 C35 39 37 37 37 35 L35 15 Z" stroke={color} strokeWidth="2.5" fill="none"/>
    <line x1="13" y1="15" x2="37" y2="15" stroke={color} strokeWidth="2.5"/>
    <path d="M18 22 Q18 20 20 20 Q22 20 22 22 Q22 24 20 24 Q18 24 18 22 Z" fill={color}/>
    <path d="M23 26 Q24 25 26 25.5 Q28 26 27.5 28 Q27 30 25 29.5 Q23 29 23 27 Q22.5 25.5 23 26 Z" fill={color}/>
    <path d="M28 22 Q29 21 31 21.5 Q32.5 22 32 23.5 Q31.5 25 30 24.5 Q28 24 28 22 Z" fill={color}/>
  </svg>
);

const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="15" stroke={color} strokeWidth="2.5"/>
    <circle cx="19" cy="20" r="2" fill={color}/>
    <circle cx="31" cy="22" r="2" fill={color}/>
    <circle cx="25" cy="27" r="2" fill={color}/>
    <circle cx="18" cy="30" r="1.5" fill={color}/>
    <circle cx="32" cy="30" r="1.5" fill={color}/>
    <circle cx="25" cy="18" r="1.5" fill={color}/>
  </svg>
);

const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="18" r="8" stroke={color} strokeWidth="2.5" fill="none"/>
    <path d="M18 18 L25 38 L32 18" stroke={color} strokeWidth="2.5" fill="none"/>
    <line x1="21" y1="23" x2="25" y2="35" stroke={color} strokeWidth="1.5"/>
    <line x1="29" y1="23" x2="25" y2="35" stroke={color} strokeWidth="1.5"/>
  </svg>
);

const HappyFace = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="15" stroke={color} strokeWidth="2.5"/>
    <circle cx="19" cy="22" r="2" fill={color}/>
    <circle cx="31" cy="22" r="2" fill={color}/>
    <path d="M17 28 Q25 35 33 28" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const ICON_COMPONENTS = [PopsyCup, CookieIcon, IceCreamCone, HappyFace];
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