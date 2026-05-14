import React from 'react';
import { motion } from 'framer-motion';

/**
 * Wrapper para gráficos que añade efectos visuales de glow y respiración continua
 */
export function AnimatedChartWrapper({ children, label }) {
  return (
    <motion.div
      className="relative w-full"
      animate={{
        opacity: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Glow effect detrás del gráfico */}
      <motion.div
        className="absolute inset-0 rounded-lg blur-2xl opacity-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 77, 141, 0.15), transparent 70%)',
        }}
        animate={{
          opacity: [0, 0.08, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Container del contenido */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shimmer line animado (parte superior) */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 77, 141, 0.3), transparent)',
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

/**
 * Componente para animar puntos de gráficos con glow pulsante
 */
export function AnimatedChartDot({ cx, cy, payload, color = '#FF4D8D' }) {
  return (
    <motion.g
      animate={{
        opacity: [0.7, 1, 0.7],
        r: [4, 6, 4],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: (payload?.index || 0) * 0.1,
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        opacity="0.8"
      />
      {/* Glow circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={4}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
        animate={{
          r: [4, 8, 4],
          opacity: [0.8, 0.2, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: (payload?.index || 0) * 0.1,
        }}
      />
    </motion.g>
  );
}

/**
 * Barra de progreso animada con glow
 */
export function AnimatedProgressBar({ value, color = '#FF4D8D', height = 8 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(0,0,0,0.05)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Inner glow */}
        <motion.div
          className="w-full h-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
            boxShadow: `inset 0 0 20px rgba(255,255,255,0.2), 0 0 20px ${color}50`,
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
}

export default AnimatedChartWrapper;