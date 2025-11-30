import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, Sparkles, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

const STORY_SCENES = [
  {
    id: 1,
    title: "El Nacimiento de un Sueño",
    year: "1980s",
    text: "A finales de los años 80, en Colombia nació una idea revolucionaria: crear helados premium con ingredientes naturales, sin conservantes y con el sabor auténtico de las frutas reales.",
    emoji: "🌟",
    color: "from-pink-400 to-rose-500"
  },
  {
    id: 2,
    title: "Un Proyecto Familiar",
    year: "Inicios",
    text: "Popsy empezó como un pequeño proyecto familiar, inspirado en la tradición de las heladerías artesanales europeas, pero con el corazón y los sabores colombianos.",
    emoji: "👨‍👩‍👧‍👦",
    color: "from-purple-400 to-pink-500"
  },
  {
    id: 3,
    title: "Primeras Tiendas",
    year: "1990s",
    text: "Las primeras tiendas se ubicaron en centros comerciales, llevando la experiencia premium a todos los colombianos. Cada vitrina llena de colores se convirtió en un símbolo de alegría.",
    emoji: "🏪",
    color: "from-blue-400 to-purple-500"
  },
  {
    id: 4,
    title: "Sabores Icónicos",
    year: "2000s",
    text: "Fresa de verdad, vainilla francesa, chocolate suizo, arequipe, coco... Cada sabor fue creado con pasión, convirtiéndose en favoritos de generaciones.",
    emoji: "🍓",
    color: "from-rose-400 to-pink-500"
  },
  {
    id: 5,
    title: "Innovación Constante",
    year: "2010s",
    text: "Nuevos productos sin azúcar, malteadas, postres especiales, y experiencias únicas. Popsy nunca dejó de evolucionar manteniendo su esencia.",
    emoji: "🚀",
    color: "from-cyan-400 to-blue-500"
  },
  {
    id: 6,
    title: "Popsy Hoy",
    year: "Presente",
    text: "Cientos de puntos en todo Colombia. Una marca que representa tradición, calidad real, experiencia con corazón, y gente que trabaja con pasión.",
    emoji: "💜",
    color: "from-pink-500 to-purple-600"
  }
];

// Componentes animados estilo anime
const FloatingHeart = ({ delay, x }) => (
  <motion.div
    className="absolute text-pink-400"
    initial={{ y: 100, x, opacity: 0, scale: 0 }}
    animate={{ 
      y: -50, 
      opacity: [0, 1, 1, 0], 
      scale: [0, 1, 1, 0.5],
      rotate: [0, 10, -10, 0]
    }}
    transition={{ 
      duration: 3, 
      delay, 
      repeat: Infinity,
      ease: "easeOut"
    }}
  >
    <Heart className="w-4 h-4 fill-pink-400" />
  </motion.div>
);

const FloatingStar = ({ delay, x }) => (
  <motion.div
    className="absolute text-yellow-400"
    initial={{ y: 80, x, opacity: 0 }}
    animate={{ 
      y: -30, 
      opacity: [0, 1, 0], 
      rotate: [0, 180, 360],
      scale: [0.5, 1, 0.5]
    }}
    transition={{ 
      duration: 2.5, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Star className="w-3 h-3 fill-yellow-400" />
  </motion.div>
);

const SparkleEffect = ({ delay }) => (
  <motion.div
    className="absolute"
    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0], 
      scale: [0, 1, 0],
      rotate: [0, 180]
    }}
    transition={{ duration: 1.5, delay, repeat: Infinity }}
  >
    <Sparkles className="w-4 h-4 text-white" />
  </motion.div>
);

export default function PopsyStoryModal({ onClose }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentScene < STORY_SCENES.length - 1) {
          setCurrentScene(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentScene, isPlaying]);

  const scene = STORY_SCENES[currentScene];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Efectos de partículas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <FloatingHeart key={`heart-${i}`} delay={i * 0.5} x={50 + i * 80} />
          ))}
          {[...Array(8)].map((_, i) => (
            <FloatingStar key={`star-${i}`} delay={i * 0.3} x={30 + i * 70} />
          ))}
          {[...Array(10)].map((_, i) => (
            <SparkleEffect key={`sparkle-${i}`} delay={i * 0.2} />
          ))}
        </div>

        {/* Header */}
        <div className="relative p-4 flex justify-between items-center">
          <motion.h2 
            className="text-white font-bold text-lg flex items-center gap-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl">🍦</span>
            La Historia de Popsy
          </motion.h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scene Container */}
        <div className="relative h-[400px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Fondo animado del escenario */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${scene.color} opacity-30`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 8, repeat: Infinity }}
              />

              {/* Emoji central animado */}
              <motion.div 
                className="text-8xl mb-6 relative z-10"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {scene.emoji}
              </motion.div>

              {/* Año */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
              >
                <span className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${scene.color} text-white text-sm font-bold mb-3`}>
                  {scene.year}
                </span>
              </motion.div>

              {/* Título */}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-white mb-4 relative z-10"
              >
                {scene.title}
              </motion.h3>

              {/* Texto */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-sm md:text-base max-w-md leading-relaxed relative z-10"
              >
                {scene.text}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {STORY_SCENES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentScene(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentScene 
                  ? 'bg-pink-400 w-6' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 flex justify-center gap-3">
          <Button
            onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
            disabled={currentScene === 0}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20 disabled:opacity-30"
          >
            ← Anterior
          </Button>
          
          <Button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying && currentScene === STORY_SCENES.length - 1) {
                setCurrentScene(0);
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-6"
          >
            {isPlaying ? (
              <>⏸ Pausar</>
            ) : (
              <><Play className="w-4 h-4 mr-1" /> {currentScene === STORY_SCENES.length - 1 ? 'Reiniciar' : 'Reproducir'}</>
            )}
          </Button>
          
          <Button
            onClick={() => setCurrentScene(Math.min(STORY_SCENES.length - 1, currentScene + 1))}
            disabled={currentScene === STORY_SCENES.length - 1}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20 disabled:opacity-30"
          >
            Siguiente →
          </Button>
        </div>

        {/* Footer */}
        <motion.div 
          className="text-center pb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-white/60 text-xs">
            💜 Calidad real • Experiencia con corazón • Gente con pasión 💜
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}