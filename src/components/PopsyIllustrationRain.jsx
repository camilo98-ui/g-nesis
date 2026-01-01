import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ILLUSTRATIONS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/9076985b8_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/e93c2022e_image.png'
];

export default function PopsyIllustrationRain() {
  const rainItems = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      image: ILLUSTRATIONS[Math.floor(Math.random() * ILLUSTRATIONS.length)],
      left: `${Math.random() * 100}%`,
      size: 40 + Math.random() * 40,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      opacity: 0.15 + Math.random() * 0.2,
      rotation: -30 + Math.random() * 60
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {rainItems.map((item) => (
        <motion.img
          key={item.id}
          src={item.image}
          alt=""
          className="absolute"
          style={{
            left: item.left,
            width: item.size,
            height: item.size,
            opacity: item.opacity,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
          initial={{ y: -100, rotate: item.rotation }}
          animate={{ 
            y: '110vh',
            rotate: item.rotation + 360
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}