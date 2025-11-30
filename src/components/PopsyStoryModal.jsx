import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, Sparkles, Star, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Efectos de sonido simulados con animaciones
const SoundWave = () => (
  <motion.div className="flex items-end gap-0.5 h-4">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-pink-400 rounded-full"
        animate={{ height: [4, 12, 4] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </motion.div>
);

const STORY_SCENES = [
  {
    id: 1,
    title: "El Nacimiento de un Sueño",
    year: "1980s",
    text: "A finales de los años 80, en Colombia nació una idea revolucionaria...",
    fullText: "Crear helados premium con ingredientes naturales, sin conservantes y con el sabor auténtico de las frutas reales.",
    emoji: "🌟",
    color: "from-pink-400 to-rose-500",
    bgEmojis: ["✨", "💫", "🌸"],
    action: "zoom-in"
  },
  {
    id: 2,
    title: "Un Proyecto Familiar",
    year: "Inicios",
    text: "Popsy empezó como un pequeño proyecto familiar...",
    fullText: "Inspirado en la tradición de las heladerías artesanales europeas, pero con el corazón y los sabores colombianos.",
    emoji: "👨‍👩‍👧‍👦",
    color: "from-purple-400 to-pink-500",
    bgEmojis: ["🏠", "❤️", "🍦"],
    action: "slide-right"
  },
  {
    id: 3,
    title: "Primeras Tiendas",
    year: "1990s",
    text: "Las primeras tiendas en centros comerciales...",
    fullText: "Llevando la experiencia premium a todos los colombianos. Cada vitrina llena de colores se convirtió en un símbolo de alegría.",
    emoji: "🏪",
    color: "from-blue-400 to-purple-500",
    bgEmojis: ["🛍️", "🎉", "🌈"],
    action: "bounce"
  },
  {
    id: 4,
    title: "Sabores Icónicos",
    year: "2000s",
    text: "Fresa, vainilla, chocolate, arequipe, coco...",
    fullText: "Cada sabor fue creado con pasión, convirtiéndose en favoritos de generaciones enteras de colombianos.",
    emoji: "🍓",
    color: "from-rose-400 to-pink-500",
    bgEmojis: ["🍫", "🥥", "🍨"],
    action: "spin"
  },
  {
    id: 5,
    title: "Innovación Constante",
    year: "2010s",
    text: "Productos sin azúcar, malteadas, postres especiales...",
    fullText: "Popsy nunca dejó de evolucionar manteniendo su esencia de calidad y amor por el helado.",
    emoji: "🚀",
    color: "from-cyan-400 to-blue-500",
    bgEmojis: ["💡", "⚡", "🔬"],
    action: "fly-up"
  },
  {
    id: 6,
    title: "Popsy Hoy",
    year: "2024",
    text: "Cientos de puntos en todo Colombia...",
    fullText: "Una marca que representa tradición, calidad real, experiencia con corazón, y gente que trabaja con pasión.",
    emoji: "💜",
    color: "from-pink-500 to-purple-600",
    bgEmojis: ["🏆", "⭐", "🇨🇴"],
    action: "pulse"
  }
];

// Componentes animados estilo anime intenso
const FloatingEmoji = ({ emoji, delay, startX, startY }) => (
  <motion.div
    className="absolute text-3xl pointer-events-none"
    style={{ left: startX, top: startY }}
    initial={{ opacity: 0, scale: 0, rotate: -180 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      scale: [0, 1.5, 1, 0],
      rotate: [0, 360],
      y: [0, -100],
      x: [0, Math.random() * 40 - 20]
    }}
    transition={{ 
      duration: 2.5, 
      delay, 
      repeat: Infinity,
      ease: "easeOut"
    }}
  >
    {emoji}
  </motion.div>
);

const SpeedLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ 
          top: `${5 + i * 5}%`,
          left: '-100%',
          width: `${30 + Math.random() * 40}%`
        }}
        animate={{ x: ['0%', '400%'] }}
        transition={{ 
          duration: 0.8 + Math.random() * 0.4,
          repeat: Infinity,
          delay: i * 0.05,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

const ExplosionEffect = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-purple-500"
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              x: Math.cos(i * 30 * Math.PI / 180) * 150,
              y: Math.sin(i * 30 * Math.PI / 180) * 150,
              opacity: [1, 0]
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

const ShakeText = ({ children, className }) => (
  <motion.span
    className={className}
    animate={{ 
      x: [0, -2, 2, -2, 2, 0],
      rotate: [0, -1, 1, -1, 1, 0]
    }}
    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
  >
    {children}
  </motion.span>
);

const TypewriterText = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  
  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        |
      </motion.span>
    </span>
  );
};

export default function PopsyStoryModal({ onClose }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showExplosion, setShowExplosion] = useState(false);
  const [textPhase, setTextPhase] = useState(0);

  useEffect(() => {
    setShowExplosion(true);
    setTextPhase(0);
    const explosionTimer = setTimeout(() => setShowExplosion(false), 800);
    const textTimer = setTimeout(() => setTextPhase(1), 1500);
    
    return () => {
      clearTimeout(explosionTimer);
      clearTimeout(textTimer);
    };
  }, [currentScene]);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentScene < STORY_SCENES.length - 1) {
          setCurrentScene(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentScene, isPlaying]);

  const scene = STORY_SCENES[currentScene];
  
  const getActionAnimation = (action) => {
    switch(action) {
      case 'zoom-in': return { scale: [0.5, 1.3, 1], rotate: [0, 10, 0] };
      case 'slide-right': return { x: [-100, 20, 0], rotate: [-10, 5, 0] };
      case 'bounce': return { y: [-50, 10, -5, 0], scale: [0.8, 1.1, 0.95, 1] };
      case 'spin': return { rotate: [0, 360], scale: [0.5, 1] };
      case 'fly-up': return { y: [100, -20, 0], opacity: [0, 1], scale: [0.5, 1.2, 1] };
      case 'pulse': return { scale: [0.8, 1.2, 0.9, 1.1, 1] };
      default: return { scale: [0, 1] };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotateX: 90 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 rounded-3xl shadow-2xl overflow-hidden relative border-2 border-pink-500/30"
      >
        {/* Speed lines cuando cambia escena */}
        {showExplosion && <SpeedLines />}
        
        {/* Explosion effect */}
        <ExplosionEffect active={showExplosion} />
        
        {/* Emojis flotantes del tema actual */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {scene.bgEmojis.map((emoji, i) => (
            <FloatingEmoji 
              key={`${scene.id}-${i}`} 
              emoji={emoji} 
              delay={i * 0.4} 
              startX={`${20 + i * 30}%`}
              startY="80%"
            />
          ))}
        </div>

        {/* Header con efectos */}
        <div className="relative p-4 flex justify-between items-center bg-black/30">
          <motion.h2 
            className="text-white font-bold text-lg flex items-center gap-2"
            animate={{ textShadow: ["0 0 10px #ff69b4", "0 0 20px #ff69b4", "0 0 10px #ff69b4"] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <motion.span 
              className="text-2xl"
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🍦
            </motion.span>
            <ShakeText>La Historia de Popsy</ShakeText>
          </motion.h2>
          <div className="flex items-center gap-2">
            {isPlaying && <SoundWave />}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scene Container */}
        <div className="relative h-[380px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.2, rotateY: 90 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              {/* Fondo con pulso */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${scene.color} opacity-20`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Círculos concéntricos animados */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full border-2 border-white/20`}
                    style={{ width: 100 * i, height: 100 * i }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
              </div>

              {/* Emoji central con animación dinámica */}
              <motion.div 
                className="text-7xl md:text-8xl mb-4 relative z-10 drop-shadow-2xl"
                animate={getActionAnimation(scene.action)}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              >
                <motion.span
                  animate={{ 
                    filter: ["drop-shadow(0 0 20px rgba(255,105,180,0.8))", "drop-shadow(0 0 40px rgba(255,105,180,1))", "drop-shadow(0 0 20px rgba(255,105,180,0.8))"]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {scene.emoji}
                </motion.span>
              </motion.div>

              {/* Año con efecto glitch */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="relative z-10"
              >
                <motion.span 
                  className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${scene.color} text-white text-lg font-bold mb-3 shadow-lg`}
                  animate={{ boxShadow: ["0 0 20px rgba(255,105,180,0.5)", "0 0 40px rgba(255,105,180,0.8)", "0 0 20px rgba(255,105,180,0.5)"] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {scene.year}
                </motion.span>
              </motion.div>

              {/* Título con entrada dramática */}
              <motion.h3
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                className="text-2xl md:text-4xl font-black text-white mb-3 relative z-10"
                style={{ textShadow: "0 0 30px rgba(255,105,180,0.8)" }}
              >
                {scene.title}
              </motion.h3>

              {/* Texto con typewriter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/90 text-sm md:text-base max-w-md leading-relaxed relative z-10 min-h-[60px]"
              >
                {textPhase === 0 ? (
                  <TypewriterText text={scene.text} onComplete={() => setTextPhase(1)} />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {scene.text} <span className="text-pink-300 font-medium">{scene.fullText}</span>
                  </motion.span>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar animado */}
        <div className="px-6 py-2">
          <div className="flex justify-between items-center gap-1">
            {STORY_SCENES.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentScene(i)}
                className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/20"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={`h-full bg-gradient-to-r ${s.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: i <= currentScene ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/50 text-xs">{scene.year}</span>
            <span className="text-white/50 text-xs">{currentScene + 1}/{STORY_SCENES.length}</span>
          </div>
        </div>

        {/* Controls estilo reproductor */}
        <div className="p-4 flex justify-center items-center gap-4 bg-black/30">
          <motion.button
            onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
            disabled={currentScene === 0}
            className="text-white/70 hover:text-white disabled:opacity-30 transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack className="w-6 h-6" />
          </motion.button>
          
          <motion.button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying && currentScene === STORY_SCENES.length - 1) {
                setCurrentScene(0);
              }
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ boxShadow: isPlaying ? ["0 0 20px rgba(236,72,153,0.5)", "0 0 40px rgba(236,72,153,0.8)", "0 0 20px rgba(236,72,153,0.5)"] : "none" }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </motion.button>
          
          <motion.button
            onClick={() => setCurrentScene(Math.min(STORY_SCENES.length - 1, currentScene + 1))}
            disabled={currentScene === STORY_SCENES.length - 1}
            className="text-white/70 hover:text-white disabled:opacity-30 transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Footer con valores */}
        <motion.div 
          className="text-center py-3 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.p 
            className="text-white/80 text-sm font-medium"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💜 Calidad real • Experiencia con corazón • Gente con pasión 💜
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}