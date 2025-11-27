import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCones from './FloatingCones';

export default function GoodbyeModal({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-pink-50 to-rose-100"
      >
        <FloatingCones count={15} />

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center px-8 max-w-2xl relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
              alt="Popsy Logo"
              className="h-28 md:h-36 mx-auto object-contain drop-shadow-lg"
            />
          </motion.div>

          {/* Animated ice creams */}
          <motion.div 
            className="flex justify-center gap-6 mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {['🍦', '🍨', '🍧', '🍦', '🍨'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-5xl"
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.2, 
                  repeat: Infinity,
                  repeatDelay: 0.3
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>

          <motion.h1 
            className="text-2xl md:text-4xl font-bold mb-6 leading-tight text-fuchsia-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gracias por hacer del mundo un lugar más dulce, feliz y divertido
          </motion.h1>

          <motion.p 
            className="text-xl text-fuchsia-600/70 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ¡Que bueno verte! Vuelve pronto 🍦
          </motion.p>

          <motion.div 
            className="flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-400 to-pink-400"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.1, 
                  repeat: Infinity 
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}