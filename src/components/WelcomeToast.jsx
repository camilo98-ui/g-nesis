import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GREETINGS = [
  { text: "¡Bienvenido a", emoji: "🍦", suffix: "! Que sea un día dulce" },
  { text: "¡Hola,", emoji: "✨", suffix: "! A romperla hoy" },
  { text: "¡Llegaste a", emoji: "🚀", suffix: "! Vamos con todo" },
  { text: "¡Qué bueno verte en", emoji: "💪", suffix: "!" },
  { text: "¡Arrancamos en", emoji: "🎯", suffix: "! Metas por cumplir" },
  { text: "¡Hey!", emoji: "👋", suffix: " te espera. ¡Éxitos!" },
];

const CONFETTI_COLORS = ['#FFB5C5', '#E0BBE4', '#C5E8FF', '#FFEFD5', '#D4F0F0'];

const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: `${10 + Math.random() * 80}%`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        }}
        initial={{ y: 0, opacity: 1, scale: 0 }}
        animate={{ 
          y: [0, -30, 60],
          opacity: [0, 1, 0],
          scale: [0, 1, 0.5],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.05,
          ease: "easeOut"
        }}
      />
    ))}
  </div>
);

export default function WelcomeToast({ storeName, storeCode, onClose }) {
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
      >
        <motion.div 
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl px-6 py-4 border border-pink-100 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          <Confetti />
          
          <div className="flex items-center gap-3 relative z-10">
            <motion.span 
              className="text-3xl"
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 0.6 }}
            >
              {greeting.emoji}
            </motion.span>
            
            <div>
              <motion.p 
                className="text-gray-700 font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {greeting.text}{" "}
                <span className="font-bold text-pink-600">{storeCode}</span>
                {greeting.suffix}
              </motion.p>
              <motion.p 
                className="text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {storeName}
              </motion.p>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-400 to-rose-400"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}