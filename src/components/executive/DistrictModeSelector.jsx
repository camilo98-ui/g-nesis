import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const MODES = [
  { id: 'accumulated', label: 'Acumulado', icon: '📊', desc: 'Mes completo' },
  { id: 'retail', label: 'Semana Retail', icon: '📅', desc: 'Semanas del mes' },
  { id: 'gregorian', label: 'Gregoriano', icon: '🗓️', desc: 'Desde el 1° del mes' }
];

export default function DistrictModeSelector({ selectedMode, onModeChange }) {
  return (
    <div className="flex gap-2">
      {MODES.map((mode) => (
        <motion.button
          key={mode.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange(mode.id)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            selectedMode === mode.id
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
          }`}
        >
          <span className="mr-1">{mode.icon}</span>
          {mode.label}
        </motion.button>
      ))}
    </div>
  );
}