import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Hook para animar valores numéricos con count-up elegante
 */
export function useAnimatedNumber(value, duration = 0.8) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!value || typeof value !== 'number') return;

    const start = displayValue;
    const difference = value - start;
    const steps = 60;
    const stepValue = difference / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      setDisplayValue(Math.round(start + stepValue * current));
      if (current === steps) clearInterval(timer);
    }, (duration * 1000) / steps);

    return () => clearInterval(timer);
  }, [value]);

  return displayValue;
}

/**
 * Contenedor para gráficas con respuesta elegante a hover
 */
export function LiveGraphContainer({ children, className = '' }) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.3 } }}
      className={`transition-all duration-300 ${className}`}
      style={{
        cursor: 'pointer',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Efecto de glow pulsante para elementos de gráficas
 */
export function PulsingGlow({ intensity = 0.15, duration = 3 }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      animate={{
        opacity: [intensity * 0.5, intensity, intensity * 0.5],
        scale: [0.95, 1.05, 0.95],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: 'radial-gradient(circle, rgba(190,24,93,0.3) 0%, transparent 70%)',
      }}
    />
  );
}

/**
 * Línea animada respirante para gráficas
 */
export function AnimatedLineWrapper({ children, glowColor = '#be185d', duration = 4 }) {
  return (
    <motion.div
      animate={{
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        filter: `drop-shadow(0 0 8px rgba(190,24,93,0.15))`,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Barra de progreso animada con glow
 */
export function AnimatedProgressBar({ value = 0, color = '#be185d', duration = 1.2 }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration, ease: 'easeOut' }}
        className="h-full rounded-full relative"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          boxShadow: `0 0 12px ${color}40`,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: `linear-gradient(90deg, transparent, white, transparent)`,
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Contenedor con fondo respirante sutil
 */
export function BreathingCard({ children, className = '' }) {
  return (
    <motion.div
      animate={{
        backgroundColor: [
          'rgba(255,255,255,0.5)',
          'rgba(255,255,255,0.55)',
          'rgba(255,255,255,0.5)',
        ],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Efecto de cambio suave en números
 */
export function AnimatedValue({ value, format = (v) => v.toString(), className = '' }) {
  const animatedValue = useAnimatedNumber(value);

  return <span className={className}>{format(animatedValue)}</span>;
}