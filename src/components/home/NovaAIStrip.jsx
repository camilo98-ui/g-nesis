import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const INSIGHTS = [
  {
    icon: '📊',
    title: 'Ventas',
    message: 'Llevas $4.2M hoy, +12% vs ayer. Ritmo acelerado en horas pico.',
    color: '#ef4444'
  },
  {
    icon: '🎯',
    title: 'Cumplimiento',
    message: 'PPT al 94.2%. Si mantienes este ritmo, cierras en +$180K',
    color: '#f59e0b'
  },
  {
    icon: '👥',
    title: 'Top Performer',
    message: 'María García lidera con $1.1M. +23% arriba del promedio.',
    color: '#10b981'
  },
  {
    icon: '⚡',
    title: 'Eficiencia',
    message: 'Ticket promedio $48.3K. Sugeridos en crecimiento +15%.',
    color: '#8b5cf6'
  }
];

export default function NovaAIStrip() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % INSIGHTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const current = INSIGHTS[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.75) 100%)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
      
      {/* Animated background glow */}
      <div 
        className="absolute inset-0 opacity-40 blur-3xl"
        style={{
          background: `linear-gradient(135deg, ${current.color}20, transparent 70%)`,
          pointerEvents: 'none'
        }} />

      <div className="relative flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className="text-3xl sm:text-4xl flex-shrink-0 mt-0.5">
          {current.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: current.color }} />
            <h3 className="text-sm font-semibold text-slate-700">Nova · {current.title}</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
              className="text-[13px] text-slate-600 leading-relaxed font-medium">
              {current.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex gap-1 flex-shrink-0 mt-0.5">
          {INSIGHTS.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full"
              animate={{
                width: i === currentIndex ? 16 : 4,
                opacity: i === currentIndex ? 1 : 0.3
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: i === currentIndex ? current.color : '#cbd5e1'
              }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}