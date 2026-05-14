import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

/**
 * Hook para oscilación suave infinita (respiración visual)
 */
export function useInfiniteOscillate(min = 0.95, max = 1.05, duration = 4) {
  return {
    animate: {
      scale: [min, max, min],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };
}

/**
 * Hook para pulso lento y suave
 */
export function useInfinitePulse(duration = 3, intensity = 0.15) {
  return {
    animate: {
      opacity: [1, 1 + intensity, 1],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };
}

/**
 * Hook para glow respirante
 */
export function useBreathingGlow(color = '#f97316', duration = 4) {
  return {
    animate: {
      boxShadow: [
        `0 0 8px ${color}40`,
        `0 0 20px ${color}80`,
        `0 0 8px ${color}40`,
      ],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };
}

/**
 * Línea animada viva con movimiento continuo y glow pulsante
 */
export function LiveLineChart({ children }) {
  const [isDots, setIsDots] = useState(false);

  return (
    <motion.div
      className="relative"
      {...useInfinitePulse(5, 0.08)}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.1) 0%, transparent 70%)',
        }}
        {...useInfiniteOscillate(0.98, 1.02, 6)}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/**
 * Puntos animados en gráficas (pulse + glow)
 */
export function LiveChartDot({ cx, cy, fill = '#f97316', r = 4 }) {
  return (
    <g key={`dot-${cx}-${cy}`}>
      {/* Glow exterior pulsante */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill="none"
        stroke={fill}
        strokeWidth={1}
        opacity={0.3}
        animate={{
          r: [r + 4, r + 10, r + 4],
          opacity: [0.5, 0.1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Punto central */}
      <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.9} />
      {/* Pulso interior */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </g>
  );
}

/**
 * Shimmer line - línea con brillo moviéndose lentamente
 */
export function ShimmerLine({ children, color = '#f97316' }) {
  return (
    <motion.div
      className="relative"
      style={{
        position: 'relative',
      }}
    >
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}15, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['-200% 0', '200% 0'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}

/**
 * KPI con efecto live update
 */
export function LiveKPI({ children, intensity = 0.1 }) {
  return (
    <motion.div
      animate={{
        opacity: [1, 1 + intensity, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Heatmap circle con pulsación continua
 */
export function LiveHeatmapCircle({ x, y, size = 40, color = '#be185d', intensity = 0.6 }) {
  return (
    <g key={`heatmap-${x}-${y}`}>
      {/* Pulsación de fondo */}
      <motion.circle
        cx={x}
        cy={y}
        r={size / 2}
        fill={color}
        animate={{
          opacity: [intensity * 0.3, intensity, intensity * 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Círculo sólido */}
      <circle cx={x} cy={y} r={size / 2.2} fill={color} opacity={intensity} />
    </g>
  );
}

/**
 * Donut chart con rotación super suave
 */
export function LiveDonutChart({ children }) {
  return (
    <motion.div
      animate={{
        rotate: [0, 2, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        transformOrigin: 'center',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Background con partículas flotantes sutiles
 */
export function LiveBackground() {
  const particles = Array.from({ length: 3 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-300 rounded-full opacity-20"
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 15}%`,
          }}
          animate={{
            y: [0, 20, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Grid animada con movimiento sutil
 */
export function LiveGrid() {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
      animate={{
        opacity: [0.03, 0.08, 0.03],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f97316" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </motion.svg>
  );
}

/**
 * Container wrapper para todas las gráficas vivas
 */
export function LiveChartContainer({ children, title, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden bg-white rounded-2xl shadow-lg border border-orange-100 p-6 ${className}`}
    >
      <LiveBackground />
      <LiveGrid />

      <motion.h3
        className="text-lg font-semibold text-gray-800 mb-6 relative z-10"
        animate={{
          opacity: [1, 1.05, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {title}
      </motion.h3>

      <div className="relative z-10">{children}</div>

      {/* Hover effect - glow edge */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none border border-orange-200"
        whileHover={{
          boxShadow: '0 0 20px rgba(249,115,22,0.2)',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}