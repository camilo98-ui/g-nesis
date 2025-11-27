import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, PartyPopper, Candy, IceCream } from 'lucide-react';

const greetings = [
  { text: "¡Hola!", emoji: "👋" },
  { text: "¡Bienvenido!", emoji: "🎉" },
  { text: "¡Qué alegría verte!", emoji: "😊" },
  { text: "¡Un dulce día!", emoji: "🍭" },
];

const floatingIcons = [Candy, IceCream, Star, Heart, PartyPopper, Sparkles];

export default function WelcomeModal({ userName, onClose }) {
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-400 via-red-400 to-pink-400"
        onClick={onClose}
      >
        {/* Floating animated icons */}
        {[...Array(12)].map((_, i) => {
          const Icon = floatingIcons[i % floatingIcons.length];
          return (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [null, Math.random() * -200],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute text-white/30"
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          );
        })}

        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="text-center text-white px-8"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            className="text-7xl mb-6"
          >
            {randomGreeting.emoji}
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {randomGreeting.text}
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white/90 font-light"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {userName ? `¡Qué bueno verte, ${userName}!` : "¡Hagamos del mundo un lugar más dulce!"}
          </motion.p>

          <motion.div 
            className="mt-8 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}
              >
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}