import React from 'react';
import { motion } from 'framer-motion';

const ICONS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/a5126c038_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/34cd1940d_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/81576c6b8_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/e31583047_image.png'
];

const RAIN_ITEMS = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  icon: ICONS[i % ICONS.length],
  left: `${Math.random() * 100}%`,
  size: 30 + Math.random() * 40,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 6,
  opacity: 0.3 + Math.random() * 0.4,
  rotation: Math.random() * 360
}));

export default function PopsyRainingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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
            filter: 'drop-shadow(0 2px 8px rgba(236, 72, 153, 0.2))',
            mixBlendMode: 'multiply'
          }}
          initial={{ y: -100, rotate: 0 }}
          animate={{
            y: ['100vh', '110vh'],
            rotate: [item.rotation, item.rotation + 360],
            x: [0, Math.sin(item.id) * 50]
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