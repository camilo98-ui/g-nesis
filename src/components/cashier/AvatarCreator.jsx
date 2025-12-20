import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Sparkles, Palette } from 'lucide-react';
import { toast } from 'sonner';

const SKIN_TONES = ['#FFE0BD', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#6B4423'];

const HAIR_STYLES = [
  { id: 'short', label: '✂️ Corto', d: 'M8,8 Q20,5 32,8 L30,14 L10,14 Z' },
  { id: 'sidepart', label: '💼 Formal', d: 'M7,8 L15,7 L20,5 L25,7 L33,8 L32,15 L8,15 Z M15,7 L15,15' },
  { id: 'curly', label: '🌀 Rizado', d: 'M8,8 C8,5 12,4 16,6 C18,4 22,4 24,6 C28,4 32,5 32,8 C32,11 30,14 28,14 L12,14 C10,14 8,11 8,8 Z M12,8 C12,7 13,6 14,7 M18,7 C18,6 19,5 20,6 M26,7 C26,6 27,7 28,8' },
  { id: 'long', label: '👩 Largo', d: 'M7,8 Q20,5 33,8 L35,24 Q20,28 5,24 Z' },
  { id: 'ponytail', label: '🎀 Cola', d: 'M8,8 Q20,5 32,8 L32,14 L8,14 Z M30,10 Q35,8 38,12 Q35,16 30,14' },
  { id: 'bun', label: '🥯 Moño', d: 'M15,3 Q20,1 25,3 Q28,6 25,9 Q20,11 15,9 Q12,6 15,3 M12,9 L12,14 L28,14 L28,9' },
  { id: 'mohawk', label: '🤘 Mohawk', d: 'M18,2 L20,0 L22,2 L22,10 L18,10 Z M8,10 L8,14 L32,14 L32,10 Z' },
  { id: 'wavy', label: '🌊 Ondulado', d: 'M7,8 Q11,6 15,8 Q19,6 23,8 Q27,6 31,8 L33,20 Q20,24 7,20 Z' }
];

const HAIR_COLORS = ['#2C1810', '#5C4033', '#B55239', '#E9C67B', '#F0E68C', '#FF6B6B', '#4ECDC4'];

const EYE_COLORS = ['#4A90E2', '#8B7355', '#50C878', '#9B59B6', '#E74C3C'];

const FACIAL_HAIR = [
  { id: 'none', label: 'Sin barba', emoji: '😊' },
  { id: 'beard', label: 'Barba', emoji: '🧔' },
  { id: 'mustache', label: 'Bigote', emoji: '🥸' },
  { id: 'goatee', label: 'Perilla', emoji: '🧔‍♂️' }
];

const ACCESSORIES = [
  { id: 'none', label: 'Ninguno', emoji: '🚫' },
  { id: 'glasses', label: 'Lentes', emoji: '👓' },
  { id: 'sunglasses', label: 'Lentes sol', emoji: '😎' },
  { id: 'hat', label: 'Gorro', emoji: '🧢' },
  { id: 'bow', label: 'Moño', emoji: '🎀' },
  { id: 'headband', label: 'Diadema', emoji: '👑' }
];

export default function AvatarCreator({ cashierId, currentAvatar, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState(currentAvatar || {
    skin: SKIN_TONES[1],
    hair_style: 'short',
    hair_color: HAIR_COLORS[0],
    eye_color: EYE_COLORS[0],
    facial_hair: 'none',
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
    const hairStyle = HAIR_STYLES.find(h => h.id === config.hair_style);

    return (
      <motion.svg 
        viewBox="0 0 40 40" 
        className={`${size === 'large' ? 'w-36 h-36' : 'w-16 h-16'} mx-auto drop-shadow-lg`}
        animate={{ 
          y: [0, -4, 0],
          rotate: [-1, 1, -1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Background circle */}
        <circle cx="20" cy="20" r="19" fill="#F8F9FA" />
        
        {/* Cuello/Hombros */}
        <path d="M8,35 Q12,32 20,32 Q28,32 32,35" fill={config.skin} stroke="#000" strokeWidth="0.2" opacity="0.7" />
        <rect x="16" y="30" width="8" height="6" fill="#4A90E2" rx="1" />
        
        {/* Cabeza - más redonda estilo cartoon */}
        <ellipse cx="20" cy="18" rx="11" ry="12" fill={config.skin} stroke="#2C3E50" strokeWidth="0.4" />
        
        {/* Orejas */}
        <ellipse cx="9" cy="18" rx="2" ry="2.5" fill={config.skin} stroke="#2C3E50" strokeWidth="0.3" />
        <ellipse cx="31" cy="18" rx="2" ry="2.5" fill={config.skin} stroke="#2C3E50" strokeWidth="0.3" />
        
        {/* Cabello - MEJORADO */}
        <path d={hairStyle?.d || HAIR_STYLES[0].d} fill={config.hair_color} stroke="#2C3E50" strokeWidth="0.3" />
        
        {/* Cejas expresivas */}
        <motion.g
          animate={{ y: [0, -0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <path d="M12,14 Q14,13 16,14" fill="none" stroke="#2C3E50" strokeWidth="0.6" strokeLinecap="round" />
          <path d="M24,14 Q26,13 28,14" fill="none" stroke="#2C3E50" strokeWidth="0.6" strokeLinecap="round" />
        </motion.g>
        
        {/* Ojos grandes estilo cartoon */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
        >
          <circle cx="14" cy="17" r="2.8" fill="white" stroke="#2C3E50" strokeWidth="0.3" />
          <circle cx="26" cy="17" r="2.8" fill="white" stroke="#2C3E50" strokeWidth="0.3" />
          <circle cx="14" cy="17" r="1.8" fill={config.eye_color} />
          <circle cx="26" cy="17" r="1.8" fill={config.eye_color} />
          <circle cx="14.8" cy="16.2" r="0.8" fill="white" />
          <circle cx="26.8" cy="16.2" r="0.8" fill="white" />
        </motion.g>
        
        {/* Nariz simple */}
        <ellipse cx="20" cy="20" rx="1" ry="1.5" fill="#2C3E50" opacity="0.2" />
        
        {/* Boca sonriente grande */}
        <motion.path 
          d="M14,23 Q20,26 26,23" 
          fill="none" 
          stroke="#E91E63" 
          strokeWidth="1" 
          strokeLinecap="round"
          animate={{ d: ['M14,23 Q20,26 26,23', 'M14,23 Q20,27 26,23', 'M14,23 Q20,26 26,23'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Rubor en mejillas */}
        <ellipse cx="11" cy="21" rx="2" ry="1.5" fill="#FFB6C1" opacity="0.4" />
        <ellipse cx="29" cy="21" rx="2" ry="1.5" fill="#FFB6C1" opacity="0.4" />
        
        {/* Barba facial */}
        {config.facial_hair === 'beard' && (
          <path d="M12,25 Q14,28 16,28 Q18,29 20,29 Q22,29 24,28 Q26,28 28,25" 
            fill={config.hair_color} stroke="#2C3E50" strokeWidth="0.2" />
        )}
        {config.facial_hair === 'mustache' && (
          <g>
            <path d="M14,23 Q16,24 18,23" fill={config.hair_color} stroke="#2C3E50" strokeWidth="0.2" />
            <path d="M22,23 Q24,24 26,23" fill={config.hair_color} stroke="#2C3E50" strokeWidth="0.2" />
          </g>
        )}
        {config.facial_hair === 'goatee' && (
          <ellipse cx="20" cy="27" rx="2" ry="2.5" fill={config.hair_color} stroke="#2C3E50" strokeWidth="0.2" />
        )}
        
        {/* Accesorios MEJORADOS */}
        {config.accessory === 'glasses' && (
          <g>
            <ellipse cx="14" cy="17" rx="4" ry="3.5" fill="none" stroke="#2C3E50" strokeWidth="0.6" />
            <ellipse cx="26" cy="17" rx="4" ry="3.5" fill="none" stroke="#2C3E50" strokeWidth="0.6" />
            <line x1="18" y1="17" x2="22" y2="17" stroke="#2C3E50" strokeWidth="0.6" />
            <path d="M10,17 L8,16" stroke="#2C3E50" strokeWidth="0.5" />
            <path d="M30,17 L32,16" stroke="#2C3E50" strokeWidth="0.5" />
          </g>
        )}
        {config.accessory === 'sunglasses' && (
          <g>
            <rect x="10" y="14.5" width="8" height="5" rx="1" fill="#2C3E50" opacity="0.8" />
            <rect x="22" y="14.5" width="8" height="5" rx="1" fill="#2C3E50" opacity="0.8" />
            <line x1="18" y1="17" x2="22" y2="17" stroke="#2C3E50" strokeWidth="0.7" />
          </g>
        )}
        {config.accessory === 'hat' && (
          <g>
            <ellipse cx="20" cy="7" rx="12" ry="3" fill="#E91E63" stroke="#2C3E50" strokeWidth="0.3" />
            <rect x="14" y="4" width="12" height="7" fill="#E91E63" rx="1" stroke="#2C3E50" strokeWidth="0.3" />
          </g>
        )}
        {config.accessory === 'bow' && (
          <g transform="translate(8, 8)">
            <path d="M0,2 Q-2,0 0,-2 Q2,-4 4,-2 Q2,0 0,2" fill="#E91E63" stroke="#2C3E50" strokeWidth="0.2" />
            <circle cx="2" cy="0" r="1" fill="#FFF" opacity="0.5" />
          </g>
        )}
        {config.accessory === 'headband' && (
          <path d="M9,10 Q20,8 31,10" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
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
                      className={`p-2 rounded-xl border-2 text-[10px] font-bold leading-tight ${avatar.hair_style === style.id ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-600'}`}
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

              {/* Barba facial */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Barba / Bigote</label>
                <div className="grid grid-cols-4 gap-2">
                  {FACIAL_HAIR.map((fh) => (
                    <motion.button
                      key={fh.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatar({ ...avatar, facial_hair: fh.id })}
                      className={`p-2 rounded-xl border-2 text-xl ${avatar.facial_hair === fh.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}
                    >
                      {fh.emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Accesorios */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Accesorio</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <motion.button
                      key={acc.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatar({ ...avatar, accessory: acc.id })}
                      className={`p-2 rounded-xl border-2 text-xl ${avatar.accessory === acc.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
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