import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCones from './FloatingCones';

export default function WelcomeModal({ userName, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100 via-fuchsia-50 to-purple-100"
        onClick={onClose}
      >
        <FloatingCones count={12} />
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="text-center text-gray-800 px-8 relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
              alt="Popsy Logo"
              className="h-32 md:h-40 mx-auto object-contain drop-shadow-lg"
            />
          </motion.div>

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-6xl mb-6"
          >
            🍦
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-5xl font-bold mb-4 text-fuchsia-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            ¡Bienvenido!
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-fuchsia-600/80 font-light"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {userName ? `¡Hola ${userName}!` : "¡Hagamos del mundo un lugar más dulce!"}
          </motion.p>

          <motion.div 
            className="mt-8 flex justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {['🍨', '🍧', '🍦', '🍨', '🍧'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-3xl"
                animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, delay: i * 0.15, repeat: Infinity, repeatDelay: 0.5 }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}