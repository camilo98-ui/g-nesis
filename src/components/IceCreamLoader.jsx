import React from 'react';
import { motion } from 'framer-motion';

const IceCreamCone = ({ color = "#ec4899" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 22 L25 38 L30 22" fill="none"/>
    <line x1="22.5" y1="26" x2="25" y2="35"/>
    <line x1="27.5" y1="26" x2="25" y2="35"/>
    <circle cx="25" cy="17" r="6.5"/>
  </svg>
);

const DoubleScoopCone = ({ color = "#f472b6" }) => (
  <svg viewBox="0 0 50 50" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 22 L25 38 L30 22" fill="none"/>
    <line x1="22.5" y1="26" x2="25" y2="35"/>
    <line x1="27.5" y1="26" x2="25" y2="35"/>
    <circle cx="22" cy="17" r="5"/>
    <circle cx="28" cy="17" r="5"/>
  </svg>
);

const ICONS = [IceCreamCone, DoubleScoopCone];
const COLORS = ["#ec4899", "#f472b6", "#db2777"];

export default function IceCreamLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-md max-h-96">
        {/* Iconos cayendo */}
        {Array.from({ length: 8 }, (_, i) => {
          const Icon = ICONS[i % ICONS.length];
          const color = COLORS[i % COLORS.length];
          const delay = i * 0.3;
          const leftPos = 20 + (i * 10);
          
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${leftPos}%`,
                width: 40,
                height: 40
              }}
              initial={{ y: -50, opacity: 0, rotate: 0 }}
              animate={{
                y: ['0vh', '100vh'],
                opacity: [0, 1, 1, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 2.5,
                delay,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <Icon color={color} />
            </motion.div>
          );
        })}
      </div>

      {/* Texto de carga */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black text-pink-600 mb-2">Cargando...</h2>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-pink-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}