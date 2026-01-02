import React from 'react';
import { motion } from 'framer-motion';

// Iconos mejorados con mejor diseño y detalles
const IceCreamCone = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cono con textura waffle */}
    <path d="M 30 45 L 50 90 L 70 45 Z" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="35" y1="52" x2="50" y2="84" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="65" y1="52" x2="50" y2="84" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="42" y1="58" x2="50" y2="74" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="58" y1="58" x2="50" y2="74" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="46" y1="64" x2="50" y2="70" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="54" y1="64" x2="50" y2="70" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Bola de helado principal con textura */}
    <circle cx="50" cy="35" r="20" stroke={color} strokeWidth="4" fill="none"/>
    <path d="M 35 35 Q 42 28 50 35 Q 58 28 65 35" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" fill="none"/>
    
    {/* Bola superior izquierda */}
    <circle cx="40" cy="18" r="12" stroke={color} strokeWidth="3.5" fill="none"/>
    <path d="M 32 18 Q 36 13 40 18" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" fill="none"/>
    
    {/* Bola superior derecha */}
    <circle cx="62" cy="20" r="10" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="60" cy="16" r="2" fill={color} opacity="0.3"/>
    
    {/* Cerezita en la punta */}
    <circle cx="50" cy="8" r="3.5" fill={color}/>
    <path d="M 50 8 Q 48 4 46 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const CookieIcon = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Círculo principal de la galleta con borde irregular */}
    <circle cx="50" cy="52" r="38" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M 30 20 Q 28 18 26 20" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M 70 88 Q 72 90 74 88" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
    
    {/* Mordida superior derecha más realista */}
    <path d="M 75 28 Q 88 22 92 32 Q 94 42 86 50 Q 78 54 73 46" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M 78 30 Q 85 28 88 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    
    {/* Migajas volando con movimiento */}
    <circle cx="88" cy="16" r="4" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="96" cy="24" r="3" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="93" cy="12" r="2.5" fill={color} opacity="0.5"/>
    
    {/* Chispas de chocolate con variedad de tamaños */}
    <circle cx="36" cy="48" r="6" stroke={color} strokeWidth="4" fill="none"/>
    <circle cx="58" cy="42" r="4.5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="46" cy="64" r="5.5" stroke={color} strokeWidth="4" fill="none"/>
    <circle cx="64" cy="56" r="6.5" stroke={color} strokeWidth="4" fill="none"/>
    <circle cx="40" cy="72" r="4.5" stroke={color} strokeWidth="3.5" fill="none"/>
    <circle cx="54" cy="74" r="5" stroke={color} strokeWidth="3.5" fill="none"/>
    
    {/* Detalles extras */}
    <circle cx="32" cy="36" r="3" fill={color} opacity="0.3"/>
    <circle cx="66" cy="68" r="3.5" fill={color} opacity="0.3"/>
  </svg>
);

const PopsyCup = ({ color = "#C2185B" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Vaso con perspectiva */}
    <path d="M 24 22 L 20 78 Q 20 88 50 88 Q 80 88 80 78 L 76 22 Z" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round"/>
    
    {/* Borde superior */}
    <ellipse cx="50" cy="22" rx="26" ry="6" stroke={color} strokeWidth="4" fill="none"/>
    
    {/* Líneas de volumen interior */}
    <path d="M 28 22 L 24 68 Q 24 74 50 74 Q 76 74 76 68 L 72 22" stroke={color} strokeWidth="1.5" opacity="0.2" fill="none"/>
    <ellipse cx="50" cy="45" rx="22" ry="2" stroke={color} strokeWidth="1" opacity="0.15" fill="none"/>
    
    {/* Logo Popsy con estilo */}
    <text x="50" y="54" fontSize="16" fill={color} textAnchor="middle" fontFamily="cursive" fontWeight="700" fontStyle="italic">Popsy</text>
    
    {/* Corazones decorativos */}
    <path d="M 32 30 Q 30 28 28 30 Q 28 32 32 35 Q 36 32 36 30 Q 34 28 32 30" fill={color} opacity="0.3"/>
    <path d="M 68 65 Q 66 63 64 65 Q 64 67 68 70 Q 72 67 72 65 Q 70 63 68 65" fill={color} opacity="0.3"/>
    
    {/* Brillo del vaso */}
    <ellipse cx="30" cy="35" rx="4" ry="8" fill="#ffffff" opacity="0.3"/>
  </svg>
);

const ICON_COMPONENTS = [PopsyCup];
const COLORS = ["#C2185B", "#D81B60", "#EC407A"];

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