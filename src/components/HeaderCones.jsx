import React from 'react';
import { motion } from 'framer-motion';

export default function HeaderCones() {
  const cones = [
    { emoji: '🍦', x: '5%', delay: 0 },
    { emoji: '🍨', x: '15%', delay: 0.2 },
    { emoji: '🍧', x: '85%', delay: 0.1 },
    { emoji: '🍦', x: '75%', delay: 0.3 },
    { emoji: '🍨', x: '92%', delay: 0.15 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cones.map((cone, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 text-2xl"
          style={{ left: cone.x }}
          animate={{
            y: [-5, 5, -5],
            rotate: [-10, 10, -10]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: cone.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {cone.emoji}
        </motion.div>
      ))}
    </div>
  );
}