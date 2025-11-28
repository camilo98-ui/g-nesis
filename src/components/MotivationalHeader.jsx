import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, BookOpen } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  { text: "¡Hoy es un gran día para superar metas!", type: "motivation" },
  { text: "Cada cliente es una oportunidad de brillar ✨", type: "motivation" },
  { text: "El éxito es la suma de pequeños esfuerzos", type: "motivation" },
  { text: "¡Tu actitud determina tu altitud!", type: "motivation" },
  { text: "Juntos hacemos la diferencia 🍦", type: "motivation" },
  { text: "La excelencia no es un acto, es un hábito", type: "motivation" },
  { text: "¡Sonríe! Tu energía contagia", type: "motivation" },
  { text: "Pequeños pasos, grandes resultados", type: "motivation" },
  { text: "Hoy es el día perfecto para ser increíble", type: "motivation" },
  { text: "¡Vamos por ese récord de ventas!", type: "motivation" },
  // Versículos bíblicos
  { text: "Todo lo puedo en Cristo que me fortalece - Filipenses 4:13", type: "bible", icon: "📖" },
  { text: "Esfuérzate y sé valiente - Josué 1:9", type: "bible", icon: "📖" },
  { text: "El Señor es mi pastor, nada me faltará - Salmo 23:1", type: "bible", icon: "📖" },
  { text: "Confía en el Señor con todo tu corazón - Proverbios 3:5", type: "bible", icon: "📖" },
  { text: "Sean fuertes y valientes - Deuteronomio 31:6", type: "bible", icon: "📖" },
  { text: "El gozo del Señor es nuestra fortaleza - Nehemías 8:10", type: "bible", icon: "📖" },
  { text: "En quietud y confianza será vuestra fortaleza - Isaías 30:15", type: "bible", icon: "📖" },
  { text: "Porque yo sé los planes que tengo para ustedes - Jeremías 29:11", type: "bible", icon: "📖" },
];

export default function MotivationalHeader() {
  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);
        setIsVisible(true);
      }, 300);
    }, 8000);

    // Initial random quote
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="flex items-center justify-center gap-2 py-1 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2"
        >
          {currentQuote.type === 'bible' ? (
            <BookOpen className="w-3 h-3 text-amber-500" />
          ) : (
            <Sparkles className="w-3 h-3 text-pink-400" />
          )}
          <span className={`text-xs md:text-sm ${currentQuote.type === 'bible' ? 'text-amber-700 italic' : 'text-gray-600'}`}>
            {currentQuote.icon && <span className="mr-1">{currentQuote.icon}</span>}
            {currentQuote.text}
          </span>
          {currentQuote.type === 'bible' ? (
            <Heart className="w-3 h-3 text-rose-400" />
          ) : (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              💪
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}