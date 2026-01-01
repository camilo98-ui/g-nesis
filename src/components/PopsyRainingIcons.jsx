import React from 'react';
import { motion } from 'framer-motion';

// URLs de las ilustraciones Popsy
const POPSY_ICONS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/8baaec2fd_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/7ea85527c_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/9ec6d5dc1_image.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/d736571fa_image.png'
];

const RAIN_ITEMS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  iconUrl: POPSY_ICONS[i % POPSY_ICONS.length],
  left: `${Math.random() * 100}%`,
  size: 40, // Tamaño uniforme
  delay: Math.random() * 10,
  duration: 12 + Math.random() * 10,
  opacity: 0.15,
  rotation: Math.random() * 360
}));

export default function PopsyRainingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {RAIN_ITEMS.map((item) => {
        return (
          <motion.div
            key={item.id}
            className="absolute"
            style={{
              left: item.left,
              width: item.size,
              height: item.size,
              opacity: item.opacity
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
          >
            <img 
              src={item.iconUrl} 
              alt="Popsy"
              className="w-full h-full object-contain"
              style={{
                filter: 'brightness(0) saturate(100%) invert(20%) sepia(83%) saturate(2519%) hue-rotate(314deg) brightness(91%) contrast(91%)'
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}