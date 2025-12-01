import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Sparkles } from 'lucide-react';

const QUOTES = [
  { text: "Cada helado que vendes, es una sonrisa que regalas", type: "motivational", icon: "🍦" },
  { text: "Hoy es un gran día para superar tus metas", type: "motivational", icon: "🎯" },
  { text: "Tu actitud positiva contagia a todo el equipo", type: "motivational", icon: "✨" },
  { text: "Eres parte esencial de la familia Popsy", type: "motivational", icon: "💖" },
  { text: "Cada cliente es una oportunidad de brillar", type: "motivational", icon: "⭐" },
  { text: "El éxito se construye con pequeños logros diarios", type: "motivational", icon: "🏆" },
  { text: "Filipenses 4:13 - Todo lo puedo en Cristo que me fortalece", type: "verse", icon: "📖" },
  { text: "Proverbios 16:3 - Encomienda tus obras al Señor", type: "verse", icon: "🙏" },
  { text: "Tu sonrisa es el mejor ingrediente", type: "motivational", icon: "😊" },
  { text: "Juntos hacemos la diferencia", type: "motivational", icon: "🤝" },
];

export default function MotivationalHeader() {
  const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        setIsVisible(true);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex items-center justify-center px-4 bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-amber-50/80">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentQuote.text}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-sm">{currentQuote.icon}</span>
            <span className="text-gray-500 font-light tracking-wide">
              {currentQuote.text}
            </span>
            {currentQuote.type === 'verse' && (
              <span className="text-pink-400/60">✝</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}