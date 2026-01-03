import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mensajes premium según hora del día
const getTimeBasedGreetings = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return [
      { text: "Gestión Premium", emoji: "💎", subtitle: "Control total de tu punto de venta", bg: "from-slate-800 to-slate-900" },
      { text: "Comando Central", emoji: "🎯", subtitle: "Optimiza tu operación en tiempo real", bg: "from-indigo-800 to-purple-900" },
      { text: "Dashboard Elite", emoji: "📊", subtitle: "Métricas y decisiones inteligentes", bg: "from-blue-800 to-cyan-900" },
      { text: "Plataforma Pro", emoji: "⚡", subtitle: "Tu negocio bajo control absoluto", bg: "from-violet-800 to-fuchsia-900" },
    ];
  } else if (hour < 18) {
    return [
      { text: "Sistema Premium", emoji: "🏆", subtitle: "Gestión avanzada en tiempo real", bg: "from-slate-800 to-gray-900" },
      { text: "Control Total", emoji: "🎯", subtitle: "Cada métrica cuenta para el éxito", bg: "from-emerald-800 to-teal-900" },
      { text: "Panel Ejecutivo", emoji: "📈", subtitle: "Análisis y estrategia en un solo lugar", bg: "from-blue-800 to-indigo-900" },
      { text: "Gestión Elite", emoji: "💼", subtitle: "Herramientas profesionales para líderes", bg: "from-purple-800 to-violet-900" },
    ];
  } else {
    return [
      { text: "Cierre Premium", emoji: "✨", subtitle: "Controla cada detalle hasta el final", bg: "from-slate-800 to-slate-900" },
      { text: "Modo Nocturno Pro", emoji: "🌙", subtitle: "Gestión 24/7 sin interrupciones", bg: "from-indigo-800 to-purple-900" },
      { text: "Dashboard Night", emoji: "🌃", subtitle: "Tu negocio nunca duerme", bg: "from-blue-800 to-slate-900" },
      { text: "Control Elite", emoji: "⭐", subtitle: "Excelencia operativa constante", bg: "from-violet-800 to-indigo-900" },
    ];
  }
};

const MOTIVATIONAL_PHRASES = [
  "Análisis en tiempo real",
  "Decisiones basadas en datos",
  "Optimización continua",
  "Excelencia operativa",
  "Gestión inteligente",
  "Rendimiento máximo",
  "Control absoluto",
  "Estrategia profesional",
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
        className="fixed top-28 right-4 z-50"
      >
        <motion.div 
          className={`bg-gradient-to-r ${greeting.bg} rounded-2xl shadow-xl px-5 py-4 relative overflow-hidden max-w-[300px]`}
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
                className="text-white font-black text-lg drop-shadow-md mb-0.5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {greeting.text}
              </motion.p>
              <motion.p 
                className="text-white/70 text-xs mb-2 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {greeting.subtitle}
              </motion.p>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="h-px flex-1 bg-white/20" />
                <motion.span 
                  className="text-white/90 font-bold text-xs px-2 py-0.5 bg-white/10 rounded-full border border-white/20"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {storeCode}
                </motion.span>
                <div className="h-px flex-1 bg-white/20" />
              </motion.div>
              <motion.p 
                className="text-white/60 text-[10px] font-medium mt-2 tracking-wide uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
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