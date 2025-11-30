import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, AlertTriangle } from 'lucide-react';

const TYPE_COLORS = {
  gourmet: 'from-pink-100 to-pink-200',
  exclusivo: 'from-purple-100 to-purple-200',
  helado: 'from-pink-100 to-pink-200',
  premium: 'from-purple-100 to-purple-200',
  light: 'from-green-100 to-green-200',
  especial: 'from-amber-100 to-amber-200',
  nuevo: 'from-cyan-100 to-cyan-200',
  vacio: 'from-gray-100 to-gray-200'
};

const TYPE_BORDERS = {
  gourmet: 'border-pink-300',
  exclusivo: 'border-purple-300',
  helado: 'border-pink-300',
  premium: 'border-purple-300',
  light: 'border-green-300',
  especial: 'border-amber-300',
  nuevo: 'border-cyan-300',
  vacio: 'border-gray-300'
};

const STOCK_COLORS = {
  full: 'bg-green-400',
  medium: 'bg-yellow-400',
  low: 'bg-orange-400',
  empty: 'bg-red-400'
};

const FreezerSlotCell = memo(function FreezerSlotCell({ 
  slot, 
  onClick, 
  onDoubleClick,
  isSelected, 
  isDarkMode, 
  onDragStart, 
  onDragEnd, 
  onDrop, 
  savingState,
  auditStatus // 'correct' | 'misplaced' | 'repeated' | 'empty_warning' | null
}) {
  const isEmpty = slot.is_empty || !slot.flavor_name;

  const getAuditBorder = () => {
    if (!auditStatus) return '';
    switch (auditStatus) {
      case 'correct': return 'ring-2 ring-green-500';
      case 'misplaced': return 'ring-2 ring-red-500';
      case 'repeated': return 'ring-2 ring-yellow-500';
      case 'empty_warning': return 'ring-2 ring-gray-500';
      default: return '';
    }
  };

  return (
    <motion.div
      draggable={!isEmpty}
      onDragStart={(e) => onDragStart?.(e, slot)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop?.(e, slot)}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(slot)}
      onDoubleClick={() => onDoubleClick?.(slot)}
      className={`
        relative w-full aspect-square rounded-lg sm:rounded-xl cursor-pointer
        ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : `bg-gradient-to-br ${TYPE_COLORS[slot.flavor_type || 'vacio']}`}
        ${isSelected ? 'ring-2 sm:ring-4 ring-pink-400 ring-offset-1' : ''}
        ${isDarkMode ? 'border border-pink-500/30' : `border ${TYPE_BORDERS[slot.flavor_type || 'vacio']}`}
        shadow-md hover:shadow-xl overflow-hidden transition-shadow
        ${getAuditBorder()}
      `}
    >
      {/* Brillo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-xl pointer-events-none" />
      
      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5">
        {isEmpty ? (
          <div className="text-gray-400 text-center">
            <div className="text-lg sm:text-2xl">+</div>
            <span className="text-[6px] sm:text-[8px]">Vacío</span>
          </div>
        ) : (
          <>
            {/* Bola de helado */}
            <div 
              className="w-6 h-6 sm:w-9 sm:h-9 rounded-full shadow-md relative"
              style={{ 
                background: `radial-gradient(circle at 30% 30%, ${slot.color || '#FFB5C5'}ee, ${slot.color || '#FFB5C5'}88)`,
                boxShadow: `0 3px 10px ${slot.color || '#FFB5C5'}55`
              }}
            >
              <div className="absolute top-0.5 left-1 w-2 h-1.5 bg-white/50 rounded-full blur-[1px]" />
            </div>
            
            {/* Nombre */}
            <p className={`text-[6px] sm:text-[8px] font-bold text-center mt-0.5 leading-tight line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {slot.flavor_name}
            </p>
            
            {/* Stock indicator */}
            <div className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${STOCK_COLORS[slot.stock_level || 'full']}`} />
          </>
        )}
      </div>

      {/* Badges */}
      {!isEmpty && (slot.flavor_type === 'exclusivo' || slot.flavor_type === 'premium') && (
        <Sparkles className="absolute top-0.5 right-0.5 w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
      )}

      {/* Audit indicators */}
      {auditStatus === 'misplaced' && (
        <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-2 h-2 text-white" />
        </div>
      )}
      {auditStatus === 'correct' && (
        <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-2 h-2 text-white" />
        </div>
      )}

      {/* Saving state */}
      {savingState?.saving && (
        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {savingState?.success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-green-500/90 rounded-xl flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
});

export default FreezerSlotCell;