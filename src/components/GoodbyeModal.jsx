import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Candy, IceCream, Sparkles, Star } from 'lucide-react';

export default function GoodbyeModal({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-400 via-red-400 to-orange-400"
      >
        {/* Floating hearts */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: `${Math.random() * 100}vw`,
              y: "100vh"
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0.5],
              y: "-20vh",
            }}
            transition={{ 
              duration: 3,
              delay: Math.random() * 1.5,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Heart className="w-6 h-6 text-white/50 fill-white/30" />
          </motion.div>
        ))}

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center text-white px-8 max-w-2xl"
        >
          <motion.div 
            className="flex justify-center gap-4 mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <motion.div animate={{ rotate: [-15, 15, -15] }} transition={{ duration: 1, repeat: Infinity }}>
              <Candy className="w-12 h-12 text-yellow-200" />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <Heart className="w-14 h-14 text-pink-200 fill-pink-200" />
            </motion.div>
            <motion.div animate={{ rotate: [15, -15, 15] }} transition={{ duration: 1, repeat: Infinity }}>
              <IceCream className="w-12 h-12 text-yellow-200" />
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-5xl font-bold mb-6 leading-tight drop-shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gracias por hacer del mundo un lugar más dulce, feliz y divertido
          </motion.h1>

          <motion.div 
            className="flex justify-center gap-3 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.1, 
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              >
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </motion.div>
            ))}
          </motion.div>

          <motion.p 
            className="mt-6 text-white/80 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            ¡Hasta pronto! 👋
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}