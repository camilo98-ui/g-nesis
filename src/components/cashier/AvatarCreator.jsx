import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Sparkles, Palette } from 'lucide-react';
import { toast } from 'sonner';

const SKIN_TONES = ['#FFE0BD', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#6B4423'];
const HAIR_STYLES = [
  { id: 'short', label: 'Corto', path: 'M10,5 Q20,3 30,5 L28,12 L12,12 Z' },
  { id: 'long', label: 'Largo', path: 'M8,5 Q20,2 32,5 L32,20 Q20,25 8,20 Z' },
  { id: 'curly', label: 'Rizado', path: 'M10,5 C10,5 20,0 30,5 C32,8 30,12 28,12 L12,12 C10,12 8,8 10,5' },
  { id: 'bun', label: 'Moño', path: 'M15,3 Q20,1 25,3 Q28,5 25,8 Q20,10 15,8 Q12,5 15,3 M12,8 L12,12 L28,12 L28,8' }
];
const HAIR_COLORS = ['#2C1810', '#5C4033', '#B55239', '#E9C67B', '#F0E68C'];
const EYE_COLORS = ['#4A90E2', '#8B7355', '#50C878', '#9B59B6'];
const ACCESSORIES = [
  { id: 'none', label: 'Ninguno', emoji: '🚫' },
  { id: 'glasses', label: 'Lentes', emoji: '👓' },
  { id: 'hat', label: 'Gorro', emoji: '🧢' },
  { id: 'bow', label: 'Moño', emoji: '🎀' }
];

export default function AvatarCreator({ cashierId, currentAvatar, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState(currentAvatar || {
    skin: SKIN_TONES[1],
    hair_style: 'short',
    hair_color: HAIR_COLORS[0],
    eye_color: EYE_COLORS[0],
    accessory: 'none'
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Cashier.update(cashierId, { 
      avatar: JSON.stringify(avatar) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashiers']);
      toast.success('¡Avatar guardado!');
      onClose();
    }
  });

  const AvatarPreview = ({ config, size = 'large' }) => {
    const dimensions = size === 'large' ? { w: 120, h: 120 } : { w: 60, h: 60 };
    const hairStyle = HAIR_STYLES.find(h => h.id === config.hair_style);

    return (
      <motion.svg 
        viewBox="0 0 40 40" 
        className={`${size === 'large' ? 'w-32 h-32' : 'w-16 h-16'} mx-auto drop-shadow-lg`}
        animate={{ 
          y: [0, -3, 0],
          rotate: [-2, 2, -2]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Cabeza */}
        <circle cx="20" cy="20" r="14" fill={config.skin} stroke="#000" strokeWidth="0.3" />
        
        {/* Cabello */}
        <path d={hairStyle.path} fill={config.hair_color} stroke="#000" strokeWidth="0.2" />
        
        {/* Ojos */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
        >
          <ellipse cx="14" cy="18" rx="2" ry="3" fill={config.eye_color} />
          <ellipse cx="26" cy="18" rx="2" ry="3" fill={config.eye_color} />
          <circle cx="14.5" cy="17" r="1" fill="white" opacity="0.8" />
          <circle cx="26.5" cy="17" r="1" fill="white" opacity="0.8" />
        </motion.g>
        
        {/* Nariz */}
        <path d="M20,22 Q19,24 20,24 Q21,24 20,22" fill="none" stroke="#000" strokeWidth="0.3" opacity="0.3" />
        
        {/* Boca sonriente */}
        <motion.path 
          d="M15,25 Q20,28 25,25" 
          fill="none" 
          stroke="#E91E63" 
          strokeWidth="0.8" 
          strokeLinecap="round"
          animate={{ d: ['M15,25 Q20,28 25,25', 'M15,25 Q20,29 25,25', 'M15,25 Q20,28 25,25'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Accesorios */}
        {config.accessory === 'glasses' && (
          <g>
            <ellipse cx="14" cy="18" rx="3.5" ry="3" fill="none" stroke="#333" strokeWidth="0.5" />
            <ellipse cx="26" cy="18" rx="3.5" ry="3" fill="none" stroke="#333" strokeWidth="0.5" />
            <line x1="17.5" y1="18" x2="22.5" y2="18" stroke="#333" strokeWidth="0.5" />
          </g>
        )}
        {config.accessory === 'hat' && (
          <g>
            <ellipse cx="20" cy="8" rx="10" ry="3" fill="#E91E63" />
            <rect x="15" y="5" width="10" height="6" fill="#E91E63" rx="1" />
          </g>
        )}
        {config.accessory === 'bow' && (
          <g>
            <path d="M10,10 Q8,8 10,6 Q12,4 14,6 Q12,8 10,10" fill="#E91E63" />
            <circle cx="12" cy="8" r="1" fill="#FFF" opacity="0.5" />
          </g>
        )}
      </motion.svg>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Palette className="w-6 h-6" />
                    Crear tu Avatar
                  </h3>
                  <p className="text-white/80 text-sm">¡Personaliza tu perfil!</p>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-200">
                <AvatarPreview config={avatar} size="large" />
              </div>

              {/* Tono de piel */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Tono de piel</label>
                <div className="flex gap-2 flex-wrap">
                  {SKIN_TONES.map((tone) => (
                    <motion.button
                      key={tone}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAvatar({ ...avatar, skin: tone })}
                      className={`w-10 h-10 rounded-full border-4 ${avatar.skin === tone ? 'border-pink-500 shadow-lg' : 'border-gray-200'}`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>

              {/* Estilo de cabello */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Estilo de cabello</label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_STYLES.map((style) => (
                    <motion.button
                      key={style.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatar({ ...avatar, hair_style: style.id })}
                      className={`p-3 rounded-xl border-2 text-xs font-bold ${avatar.hair_style === style.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
                    >
                      {style.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color de cabello */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Color de cabello</label>
                <div className="flex gap-2 flex-wrap">
                  {HAIR_COLORS.map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAvatar({ ...avatar, hair_color: color })}
                      className={`w-10 h-10 rounded-full border-4 ${avatar.hair_color === color ? 'border-pink-500 shadow-lg' : 'border-gray-200'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Color de ojos */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Color de ojos</label>
                <div className="flex gap-2 flex-wrap">
                  {EYE_COLORS.map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAvatar({ ...avatar, eye_color: color })}
                      className={`w-10 h-10 rounded-full border-4 ${avatar.eye_color === color ? 'border-pink-500 shadow-lg' : 'border-gray-200'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Accesorios */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Accesorio</label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <motion.button
                      key={acc.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatar({ ...avatar, accessory: acc.id })}
                      className={`p-3 rounded-xl border-2 text-2xl ${avatar.accessory === acc.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
                    >
                      {acc.emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Botón guardar */}
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-6 text-lg font-bold rounded-xl"
              >
                <Save className="w-5 h-5 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Avatar'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { AvatarCreator };