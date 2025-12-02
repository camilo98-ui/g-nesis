import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Saludos según hora del día
const getTimeBasedGreetings = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return [
      { text: "¡Buenos días,", emoji: "☀️", suffix: "! A brillar hoy", bg: "from-amber-400 to-orange-400" },
      { text: "¡Feliz mañana en", emoji: "🌅", suffix: "! Empieza fuerte", bg: "from-rose-400 to-pink-400" },
      { text: "¡Arrancamos el día en", emoji: "🚀", suffix: "!", bg: "from-violet-400 to-purple-400" },
      { text: "¡El sol salió para", emoji: "🌞", suffix: "! Vamos por todo", bg: "from-yellow-400 to-amber-400" },
    ];
  } else if (hour < 18) {
    return [
      { text: "¡Buenas tardes,", emoji: "🍦", suffix: "! La dulzura continúa", bg: "from-pink-400 to-rose-400" },
      { text: "¡Sigue brillando en", emoji: "⭐", suffix: "!", bg: "from-cyan-400 to-blue-400" },
      { text: "¡La tarde es tuya en", emoji: "💫", suffix: "! A dar lo mejor", bg: "from-emerald-400 to-teal-400" },
      { text: "¡Qué flow en", emoji: "🔥", suffix: "! Sigue así", bg: "from-orange-400 to-red-400" },
    ];
  } else {
    return [
      { text: "¡Buenas noches,", emoji: "🌙", suffix: "! Último empujón", bg: "from-indigo-400 to-purple-400" },
      { text: "¡Terminamos fuerte en", emoji: "💪", suffix: "!", bg: "from-violet-400 to-fuchsia-400" },
      { text: "¡La noche es joven en", emoji: "✨", suffix: "! Vamos", bg: "from-blue-400 to-indigo-400" },
      { text: "¡Cierre épico en", emoji: "🎯", suffix: "!", bg: "from-purple-400 to-pink-400" },
    ];
  }
};

const MOTIVATIONAL_PHRASES = [
  "¡Hoy vendes más que ayer! 📈",
  "¡Cada helado es una sonrisa! 😊",
  "¡Eres parte del mejor equipo! 🏆",
  "¡La meta está cerca! 🎯",
  "¡Tú haces la diferencia! ⭐",
  "¡Que fluya la dulzura! 🍨",
  "¡Éxito asegurado! 🚀",
  "¡A conquistar el día! 💪",
];

const CONFETTI_COLORS = ['#FFB5C5', '#E0BBE4', '#C5E8FF', '#FFEFD5', '#D4F0F0', '#fbbf24', '#a78bfa'];

const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${5 + Math.random() * 90}%`,
          width: 4 + Math.random() * 6,
          height: 4 + Math.random() * 6,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        }}
        initial={{ y: -10, opacity: 0, scale: 0 }}
        animate={{ 
          y: [0, -40, 80],
          opacity: [0, 1, 0],
          scale: [0, 1.2, 0.3],
          rotate: [0, 360, 720],
          x: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60]
        }}
        transition={{
          duration: 2,
          delay: i * 0.08,
          ease: "easeOut"
        }}
      />
    ))}
  </div>
);

// Icono de helado animado
const AnimatedIceCream = () => (
  <motion.svg 
    viewBox="0 0 40 60" 
    className="w-12 h-16"
    animate={{ rotate: [0, -5, 5, -5, 0], y: [0, -3, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <motion.circle 
      cx="20" cy="14" r="12" 
      fill="#FFB5C5"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <circle cx="14" cy="10" r="3" fill="#fff" opacity="0.5" />
    <polygon points="10,24 20,55 30,24" fill="#D4A574" />
    <line x1="13" y1="32" x2="27" y2="32" stroke="#c99a5e" strokeWidth="0.8" opacity="0.6" />
    <line x1="15" y1="40" x2="25" y2="40" stroke="#c99a5e" strokeWidth="0.8" opacity="0.6" />
    {/* Sparkles */}
    <motion.circle cx="6" cy="6" r="2" fill="#fbbf24" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
    <motion.circle cx="34" cy="8" r="1.5" fill="#a78bfa" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
    <motion.circle cx="36" cy="20" r="1.5" fill="#34d399" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
  </motion.svg>
);

export default function WelcomeToast({ storeName, storeCode, onClose }) {
  const [greeting] = useState(() => {
    const greetings = getTimeBasedGreetings();
    return greetings[Math.floor(Math.random() * greetings.length)];
  });
  const [motivational] = useState(() => MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);

  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.6, rotateX: 45 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: -30, scale: 0.8 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
      >
        <motion.div 
          className={`bg-gradient-to-r ${greeting.bg} rounded-3xl shadow-2xl px-6 py-5 relative overflow-hidden min-w-[320px]`}
          whileHover={{ scale: 1.02, rotate: 1 }}
          animate={{ 
            boxShadow: [
              "0 20px 40px rgba(0,0,0,0.2)",
              "0 25px 50px rgba(0,0,0,0.3)",
              "0 20px 40px rgba(0,0,0,0.2)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Confetti />
          
          {/* Fondo con patrón */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-4 text-4xl">🍦</div>
            <div className="absolute top-4 right-6 text-2xl">✨</div>
            <div className="absolute bottom-4 left-8 text-2xl">🍨</div>
            <div className="absolute bottom-2 right-4 text-3xl">⭐</div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <AnimatedIceCream />
            </motion.div>
            
            <div className="flex-1">
              <motion.p 
                className="text-white font-bold text-lg drop-shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {greeting.text}{" "}
                <motion.span 
                  className="text-yellow-200 font-black"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {storeCode}
                </motion.span>
                {greeting.suffix}
              </motion.p>
              <motion.p 
                className="text-white/80 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {storeName}
              </motion.p>
              <motion.p 
                className="text-yellow-200 text-xs font-medium mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {motivational}
              </motion.p>
            </div>
            
            <motion.span 
              className="text-5xl"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
              }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, -15, 15, -15, 0],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              >
                {greeting.emoji}
              </motion.div>
            </motion.span>
          </div>

          {/* Progress bar animada */}
          <motion.div 
            className="absolute bottom-0 left-0 h-1.5 bg-white/50 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
          
          {/* Borde brillante */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-white/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}