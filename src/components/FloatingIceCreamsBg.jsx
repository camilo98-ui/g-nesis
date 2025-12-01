import React from 'react';
import { motion } from 'framer-motion';

// Hashtags estilo red social
const HASHTAGS = [
  '#MiraHeladoPositivoDeLasCosas',
  '#PorHeladoQueTúQuieras', 
  '#MejoresVentas',
  '#PopsyLovers',
  '#HeladosFelices',
  '#DulceMomento',
  '#VentasDeHelado',
  '#SaborQueEnamora',
  '#TeamPopsy',
  '#HeladosConAmor',
  '#MetasCumplidas',
  '#VendeMás',
  '#ClientesFelices',
  '#MomentoPopsy',
  '#DulzuraTotal'
];

// Floating Hashtag
const FloatingHashtag = ({ text, delay, x, speed }) => (
  <motion.div
    className="absolute whitespace-nowrap"
    style={{ left: x }}
    initial={{ opacity: 0, y: -50 }}
    animate={{ 
      opacity: [0, 0.15, 0.15, 0],
      y: [-50, window.innerHeight + 50],
    }}
    transition={{ 
      duration: speed,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    <span className="text-pink-300/40 font-light text-sm tracking-wide">
      {text}
    </span>
  </motion.div>
);

// Destellos de colores pastel
const Sparkle = ({ color, size = 6 }) => (
  <motion.div
    className="rounded-full"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(1px)'
    }}
    animate={{
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.3, 1],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Cono con bolita estilo sketch
const IceCreamCone = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 40 65" className="w-full h-full">
    <circle cx="20" cy="14" r="12" fill="none" stroke="#ec4899" strokeWidth="1.2" opacity={opacity} />
    <circle cx="20" cy="14" r="12" fill="#FFB5C5" opacity={opacity * 0.6} />
    <polygon points="10,22 20,58 30,22" fill="none" stroke="#d97706" strokeWidth="1" opacity={opacity} />
    <polygon points="10,22 20,58 30,22" fill="#E8D5B0" opacity={opacity * 0.5} />
    <line x1="13" y1="28" x2="27" y2="28" stroke="#d97706" strokeWidth="0.5" opacity={opacity * 0.7} />
    <line x1="15" y1="36" x2="25" y2="36" stroke="#d97706" strokeWidth="0.5" opacity={opacity * 0.7} />
  </svg>
);

// Malteada estilo sketch
const Milkshake = ({ opacity = 0.5 }) => (
  <svg viewBox="0 0 35 60" className="w-full h-full">
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="none" stroke="#3b82f6" strokeWidth="1" opacity={opacity} />
    <path d="M8 15 L10 48 L25 48 L27 15 Z" fill="#C5E8FF" opacity={opacity * 0.5} />
    <ellipse cx="17.5" cy="12" rx="10" ry="6" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity={opacity} />
    <circle cx="17" cy="4" r="3" fill="#FFB5C5" opacity={opacity * 0.6} />
    <line x1="22" y1="5" x2="24" y2="35" stroke="#d97706" strokeWidth="1" opacity={opacity} />
  </svg>
);

// Banana Split estilo sketch
const BananaSplit = ({ opacity = 0.45 }) => (
  <svg viewBox="0 0 60 35" className="w-full h-full">
    <ellipse cx="30" cy="28" rx="28" ry="6" fill="none" stroke="#999" strokeWidth="0.8" strokeDasharray="2,1" opacity={opacity} />
    <ellipse cx="30" cy="28" rx="28" ry="6" fill="#F5F5DC" opacity={opacity * 0.3} />
    <path d="M 8 22 Q 15 8 30 12 Q 45 8 52 22" fill="none" stroke="#DAA520" strokeWidth="1.2" opacity={opacity} />
    <path d="M 8 22 Q 15 8 30 12 Q 45 8 52 22" fill="#FFE135" opacity={opacity * 0.4} />
    <circle cx="18" cy="18" r="7" fill="#FFB5C5" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    <circle cx="30" cy="15" r="7" fill="#8B4513" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    <circle cx="42" cy="18" r="7" fill="#FFF8DC" opacity={opacity * 0.5} stroke="#999" strokeWidth="0.6" />
    <circle cx="30" cy="8" r="3" fill="#DC143C" opacity={opacity * 0.6} />
  </svg>
);

// Litro de helado estilo sketch
const IceCreamTub = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 40 50" className="w-full h-full">
    <ellipse cx="20" cy="8" rx="16" ry="5" fill="none" stroke="#ec4899" strokeWidth="1" opacity={opacity} />
    <ellipse cx="20" cy="8" rx="16" ry="5" fill="#E91E63" opacity={opacity * 0.5} />
    <path d="M 4 8 L 6 40 L 34 40 L 36 8" fill="none" stroke="#ec4899" strokeWidth="1" opacity={opacity} />
    <path d="M 4 8 L 6 40 L 34 40 L 36 8" fill="#FFFFFF" opacity={opacity * 0.4} />
    <rect x="10" y="18" width="20" height="12" rx="2" fill="#ec4899" opacity={opacity * 0.4} />
  </svg>
);

// Copa de helado estilo sketch
const IceCreamCup = ({ opacity = 0.55 }) => (
  <svg viewBox="0 0 35 55" className="w-full h-full">
    <path d="M 5 20 Q 3 45 17.5 48 Q 32 45 30 20" fill="none" stroke="#a855f7" strokeWidth="1" opacity={opacity} />
    <path d="M 5 20 Q 3 45 17.5 48 Q 32 45 30 20" fill="#E8E8E8" opacity={opacity * 0.4} />
    <ellipse cx="17.5" cy="47" rx="8" ry="2" fill="none" stroke="#a855f7" strokeWidth="0.6" opacity={opacity} />
    <ellipse cx="17.5" cy="18" rx="14" ry="8" fill="none" stroke="#ec4899" strokeWidth="0.8" opacity={opacity} />
    <ellipse cx="17.5" cy="18" rx="14" ry="8" fill="#FFB5C5" opacity={opacity * 0.5} />
    <ellipse cx="12" cy="12" rx="8" ry="5" fill="#87CEEB" opacity={opacity * 0.5} stroke="#3b82f6" strokeWidth="0.5" />
    <ellipse cx="23" cy="12" rx="8" ry="5" fill="#DDA0DD" opacity={opacity * 0.5} stroke="#a855f7" strokeWidth="0.5" />
    <path d="M 14 6 Q 17.5 2 21 6" fill="none" stroke="#ec4899" strokeWidth="0.6" opacity={opacity} />
    <circle cx="17.5" cy="4" r="2.5" fill="#DC143C" opacity={opacity * 0.7} />
  </svg>
);

const sketchElements = [
  { x: '5%', size: 30, type: 'cone', delay: 0 },
  { x: '15%', size: 26, type: 'shake', delay: 2 },
  { x: '25%', size: 28, type: 'tub', delay: 5 },
  { x: '35%', size: 24, type: 'cup', delay: 1 },
  { x: '45%', size: 38, type: 'banana', delay: 4 },
  { x: '55%', size: 28, type: 'cone', delay: 3 },
  { x: '65%', size: 26, type: 'shake', delay: 6 },
  { x: '75%', size: 28, type: 'tub', delay: 2.5 },
  { x: '85%', size: 30, type: 'cup', delay: 4.5 },
  { x: '95%', size: 32, type: 'cone', delay: 1.5 },
];

// Hashtags positions
const hashtagElements = HASHTAGS.map((tag, i) => ({
  text: tag,
  x: `${(i * 7) % 100}%`,
  delay: i * 1.5,
  speed: 18 + (i % 5) * 2
}));

// Destellos pastel
const sparkles = [
  { x: '10%', y: '20%', color: '#FFD1DC', size: 10 },
  { x: '20%', y: '45%', color: '#E0BBE4', size: 8 },
  { x: '35%', y: '15%', color: '#C5E8FF', size: 12 },
  { x: '45%', y: '70%', color: '#FFEFD5', size: 9 },
  { x: '55%', y: '30%', color: '#D4F0F0', size: 11 },
  { x: '65%', y: '55%', color: '#FFE4E1', size: 8 },
  { x: '75%', y: '18%', color: '#E6E6FA', size: 10 },
  { x: '80%', y: '60%', color: '#F0FFF0', size: 12 },
  { x: '90%', y: '35%', color: '#FFF0F5', size: 9 },
  { x: '30%', y: '80%', color: '#F5F5DC', size: 11 },
];

export default function FloatingIceCreamsBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Hashtags flotantes estilo red social */}
      {hashtagElements.map((hashtag, i) => (
        <FloatingHashtag 
          key={`hashtag-${i}`} 
          text={hashtag.text} 
          x={hashtag.x} 
          delay={hashtag.delay}
          speed={hashtag.speed}
        />
      ))}

      {/* Destellos pastel */}
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{ left: sparkle.x, top: sparkle.y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Sparkle color={sparkle.color} size={sparkle.size} />
        </motion.div>
      ))}
      
      {/* Elementos sketch - lluvia cayendo */}
      {sketchElements.map((el, i) => (
        <motion.div
          key={`sketch-${i}`}
          className="absolute"
          style={{ 
            left: el.x, 
            width: el.size,
            height: el.size * 1.5
          }}
          initial={{ opacity: 0, y: -100 }}
          animate={{ 
            opacity: [0, 0.6, 0.6, 0],
            y: [-100, window.innerHeight + 100],
          }}
          transition={{ 
            duration: 14 + i * 0.5,
            delay: el.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {el.type === 'cone' && <IceCreamCone opacity={0.5} />}
          {el.type === 'shake' && <Milkshake opacity={0.45} />}
          {el.type === 'banana' && <BananaSplit opacity={0.45} />}
          {el.type === 'tub' && <IceCreamTub opacity={0.45} />}
          {el.type === 'cup' && <IceCreamCup opacity={0.45} />}
        </motion.div>
      ))}
    </div>
  );
}