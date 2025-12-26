import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';

const WelcomeGreeting = ({ userName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center px-8"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="mb-6 inline-block"
        >
          <Sparkles className="w-20 h-20 text-pink-400" strokeWidth={1.5} />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl font-black text-slate-800 mb-4"
        >
          ¡Hola, {userName}!
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-slate-600 flex items-center justify-center gap-2"
        >
          Bienvenido a Experiencia Cliente <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeGreeting;