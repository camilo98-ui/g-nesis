import React from 'react';
import { motion } from 'framer-motion';

const ICONS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/a5126c038_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/34cd1940d_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/81576c6b8_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/e31583047_image.png'
];

const RAIN_ITEMS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  icon: ICONS[i % ICONS.length],
  left: `${Math.random() * 100}%`,
  size: 25 + Math.random() * 35,
  delay: Math.random() * 10,
  duration: 12 + Math.random() * 10,
  opacity: 0.08 + Math.random() * 0.15,
  rotation: Math.random() * 360
}));

export default function PopsyRainingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {RAIN_ITEMS.map((item) => (
        <motion.img
          key={item.id}
          src={item.icon}
          alt=""
          className="absolute"
          style={{
            left: item.left,
            width: item.size,
            height: item.size,
            opacity: item.opacity,
            filter: 'grayscale(0.1) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.05))',
            mixBlendMode: 'normal'
          }}
          initial={{ y: -100, rotate: 0 }}
          animate={{
            y: ['-100px', '110vh'],
            rotate: [item.rotation, item.rotation + 180],
            x: [0, Math.sin(item.id) * 30]
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}