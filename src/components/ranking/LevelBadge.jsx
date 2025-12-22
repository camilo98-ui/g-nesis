import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Star } from 'lucide-react';

const LEVELS = {
  Rookie: { 
    icon: Sparkles, 
    color: 'from-gray-400 to-slate-500', 
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
    emoji: '🌱',
    minScore: 0,
    nextLevel: 'Pro'
  },
  Pro: { 
    icon: Zap, 
    color: 'from-green-400 to-emerald-500', 
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    emoji: '⚡',
    minScore: 45,
    nextLevel: 'Master'
  },
  Master: { 
    icon: Star, 
    color: 'from-blue-400 to-indigo-500', 
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    emoji: '⭐',
    minScore: 65,
    nextLevel: 'Elite'
  },
  Elite: { 
    icon: Crown, 
    color: 'from-purple-500 to-pink-600', 
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100',
    emoji: '👑',
    minScore: 80,
    nextLevel: null
  }
};

export default function LevelBadge({ level, score, compact = false }) {
  const config = LEVELS[level] || LEVELS.Rookie;
  const Icon = config.icon;
  
  // Calcular progreso al siguiente nivel
  const nextLevelConfig = config.nextLevel ? LEVELS[config.nextLevel] : null;
  const progressToNext = nextLevelConfig 
    ? Math.min(100, ((score - config.minScore) / (nextLevelConfig.minScore - config.minScore)) * 100)
    : 100;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white shadow-lg cursor-pointer`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-black">{level}</span>
      </motion.div>
    );
  }

  return (
    <div className={`${config.bgColor} border-2 border-${level === 'Elite' ? 'purple' : level === 'Master' ? 'blue' : level === 'Pro' ? 'emerald' : 'gray'}-300 rounded-2xl p-4 shadow-lg relative overflow-hidden`}>
      {/* Efecto de brillo */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={{ rotate: level === 'Elite' ? [0, 360] : 0 }}
            transition={{ duration: 3, repeat: level === 'Elite' ? Infinity : 0, ease: "linear" }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-lg font-black ${config.textColor}`}>{level}</p>
              <span className="text-xl">{config.emoji}</span>
            </div>
            {nextLevelConfig && (
              <p className="text-[10px] text-gray-500 font-medium">
                Siguiente: {config.nextLevel} ({nextLevelConfig.minScore} pts)
              </p>
            )}
          </div>
        </div>

        {/* Barra de progreso al siguiente nivel */}
        {nextLevelConfig && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Progreso a {config.nextLevel}</span>
              <span className="font-bold">{progressToNext.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${LEVELS[config.nextLevel].color}`}
              />
            </div>
          </div>
        )}

        {level === 'Elite' && (
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] text-purple-600 font-bold text-center mt-2"
          >
            ✨ Nivel Máximo Alcanzado ✨
          </motion.p>
        )}
      </div>
    </div>
  );
}