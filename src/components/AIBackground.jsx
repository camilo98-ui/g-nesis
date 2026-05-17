import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Floating particle
function Particle({ delay, x, size, duration }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: '-10px',
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(194,24,117,0.35) 0%, transparent 70%)`,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -120, -180],
        x: [0, Math.sin(delay) * 30, Math.sin(delay * 2) * 20],
        opacity: [0, 0.7, 0],
        scale: [0.5, 1, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

const PARTICLES = [
  { delay: 0,    x: 8,  size: 3, duration: 8 },
  { delay: 1.2,  x: 18, size: 2, duration: 11 },
  { delay: 2.4,  x: 32, size: 4, duration: 9 },
  { delay: 0.6,  x: 48, size: 2, duration: 13 },
  { delay: 3.1,  x: 63, size: 3, duration: 10 },
  { delay: 1.8,  x: 75, size: 2, duration: 12 },
  { delay: 4.2,  x: 88, size: 4, duration: 8.5 },
  { delay: 2.9,  x: 55, size: 2, duration: 14 },
  { delay: 0.4,  x: 24, size: 3, duration: 10.5 },
  { delay: 5.1,  x: 92, size: 2, duration: 9.5 },
];

export default function AIBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Base gradient — lives and breathes */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(165deg, #FEFCFD 0%, #FFFBFE 30%, #FAFAFA 60%, #FDFCFF 100%)',
            'linear-gradient(175deg, #FFF5FA 0%, #FFFBFE 35%, #FAF9FE 65%, #FDFCFF 100%)',
            'linear-gradient(155deg, #FEFCFD 0%, #FFF8FC 28%, #FAFAFA 58%, #FDFCFF 100%)',
          ],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient pink orb — top left — más intenso */}
      <motion.div
        className="absolute"
        style={{
          width: 700, height: 580,
          top: -180, left: -140,
          background: 'radial-gradient(ellipse, rgba(194,24,117,0.055) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, 35, -12, 0],
          y: [0, -22, 18, 0],
          scale: [1, 1.1, 0.93, 1],
          opacity: [0.85, 1, 0.7, 0.85],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient pink orb — bottom right */}
      <motion.div
        className="absolute"
        style={{
          width: 550, height: 450,
          bottom: -100, right: -110,
          background: 'radial-gradient(ellipse, rgba(194,24,117,0.04) 0%, transparent 65%)',
          filter: 'blur(55px)',
        }}
        animate={{
          x: [0, -28, 12, 0],
          y: [0, 20, -14, 0],
          scale: [1, 0.90, 1.08, 1],
          opacity: [0.7, 1, 0.55, 0.7],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: -8 }}
      />

      {/* Mid ambient — center right */}
      <motion.div
        className="absolute"
        style={{
          width: 400, height: 400,
          top: '30%', right: '8%',
          background: 'radial-gradient(circle, rgba(194,24,117,0.03) 0%, transparent 70%)',
          filter: 'blur(55px)',
        }}
        animate={{
          x: [0, 18, -10, 0],
          y: [0, -35, 22, 0],
          opacity: [0.55, 0.9, 0.4, 0.55],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: -14 }}
      />

      {/* Holographic horizontal light band */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          top: '18%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(194,24,117,0.08) 30%, rgba(194,24,117,0.12) 50%, rgba(194,24,117,0.08) 70%, transparent 100%)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </div>
    </div>
  );
}