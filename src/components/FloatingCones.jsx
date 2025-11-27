import React from 'react';
import { motion } from 'framer-motion';

const CONE_COLORS = [
  'from-pink-300 to-pink-400',
  'from-purple-300 to-purple-400',
  'from-rose-300 to-rose-400',
  'from-fuchsia-300 to-fuchsia-400',
  'from-amber-200 to-amber-300',
  'from-cyan-200 to-cyan-300',
  'from-lime-200 to-lime-300',
];

const IceCreamCone = ({ color, size = 40 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 40 56" fill="none">
    {/* Cone */}
    <path d="M8 24L20 54L32 24H8Z" fill="url(#cone)" />
    <defs>
      <linearGradient id="cone" x1="20" y1="24" x2="20" y2="54">
        <stop stopColor="#D4A574" />
        <stop offset="1" stopColor="#A67C52" />
      </linearGradient>
    </defs>
    {/* Cone lines */}
    <path d="M12 28L20 50M28 28L20 50M16 26L24 26" stroke="#8B6914" strokeOpacity="0.3" strokeWidth="0.5" />
    {/* Ice cream scoops */}
    <circle cx="20" cy="16" r="12" className={`fill-current`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
    <circle cx="14" cy="12" r="6" fill="white" fillOpacity="0.4" />
  </svg>
);

export default function FloatingCones({ count = 8, className = "" }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            rotate: Math.random() * 30 - 15,
            opacity: 0.4 + Math.random() * 0.3
          }}
          animate={{
            y: [null, `${Math.random() * 20 - 10}%`],
            rotate: [null, Math.random() * 20 - 10],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
          style={{
            left: `${5 + (i * 12) % 90}%`,
            top: `${10 + Math.random() * 70}%`
          }}
        >
          <div className={`text-${CONE_COLORS[i % CONE_COLORS.length].split(' ')[0].replace('from-', '')}`}>
            <svg width={30 + Math.random() * 20} height={(30 + Math.random() * 20) * 1.4} viewBox="0 0 40 56" fill="none">
              <path d="M8 24L20 54L32 24H8Z" fill="url(#cone)" />
              <defs>
                <linearGradient id={`cone-${i}`} x1="20" y1="24" x2="20" y2="54">
                  <stop stopColor="#D4A574" />
                  <stop offset="1" stopColor="#A67C52" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="16" r="12" className={`fill-gradient bg-gradient-to-br ${CONE_COLORS[i % CONE_COLORS.length]}`} fill={`hsl(${320 + i * 20}, 70%, ${75 + i * 3}%)`} />
              <circle cx="14" cy="12" r="5" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
        </motion.div>
      ))}
    </div>
  );
}