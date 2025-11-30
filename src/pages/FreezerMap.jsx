import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Sparkles, RotateCcw, ZoomIn, ZoomOut, Save, 
  Wand2, Moon, Sun, Camera, X, GripVertical, Check
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/c3a36de58_Capturadepantalla2025-11-251251441.png";

// Sabores predefinidos Popsy
const POPSY_FLAVORS = [
  { name: 'Chocolate', color: '#5D3A1A', type: 'helado' },
  { name: 'Vainilla', color: '#FFF8DC', type: 'helado' },
  { name: 'Fresa', color: '#FFB5C5', type: 'helado' },
  { name: 'Arequipe', color: '#D4A574', type: 'helado' },
  { name: 'Cookies & Cream', color: '#2F2F2F', type: 'premium' },
  { name: 'Mango Biche', color: '#FFD700', type: 'especial' },
  { name: 'Ron Pasas', color: '#8B4513', type: 'premium' },
  { name: 'Maracuyá', color: '#FFB347', type: 'helado' },
  { name: 'Limón', color: '#FFFACD', type: 'helado' },
  { name: 'Mora', color: '#4B0082', type: 'helado' },
  { name: 'Brownie', color: '#3D2314', type: 'premium' },
  { name: 'Chicle', color: '#FF69B4', type: 'especial' },
  { name: 'Coco', color: '#FFFFFF', type: 'helado' },
  { name: 'Café', color: '#6F4E37', type: 'helado' },
  { name: 'Pistacho', color: '#93C572', type: 'premium' },
  { name: 'Cheesecake', color: '#FFF5EE', type: 'premium' },
  { name: 'Nutella', color: '#4A2C2A', type: 'premium' },
  { name: 'Dulce de Leche', color: '#C19A6B', type: 'helado' },
];

const TYPE_COLORS = {
  helado: 'from-pink-100 to-pink-200',
  premium: 'from-purple-100 to-purple-200',
  light: 'from-green-100 to-green-200',
  especial: 'from-amber-100 to-amber-200',
  nuevo: 'from-cyan-100 to-cyan-200',
  vacio: 'from-gray-100 to-gray-200'
};

const TYPE_BORDERS = {
  helado: 'border-pink-300',
  premium: 'border-purple-300',
  light: 'border-green-300',
  especial: 'border-amber-300',
  nuevo: 'border-cyan-300',
  vacio: 'border-gray-300'
};

// Componente de slot individual 3D
function FreezerSlot3D({ slot, onClick, isSelected, isDarkMode, onDragStart, onDragEnd, onDrop }) {
  const isEmpty = slot.is_empty || !slot.flavor_name;
  const stockColors = {
    full: 'bg-green-400',
    medium: 'bg-yellow-400',
    low: 'bg-orange-400',
    empty: 'bg-red-400'
  };

  return (
    <motion.div
      draggable={!isEmpty}
      onDragStart={(e) => onDragStart(e, slot)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, slot)}
      whileHover={{ scale: 1.08, y: -5, rotateY: 5 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? { 
        scale: 1.1, 
        boxShadow: '0 20px 40px rgba(236,72,153,0.4)',
        rotateY: [0, 5, -5, 0]
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(slot)}
      className={`
        relative w-full aspect-square rounded-xl cursor-pointer
        transform-gpu perspective-1000
        ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : `bg-gradient-to-br ${TYPE_COLORS[slot.flavor_type || 'vacio']}`}
        ${isSelected ? 'ring-4 ring-pink-400 ring-offset-2' : ''}
        ${isDarkMode ? 'border border-pink-500/30' : `border-2 ${TYPE_BORDERS[slot.flavor_type || 'vacio']}`}
        shadow-lg hover:shadow-2xl
        overflow-hidden
      `}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isDarkMode 
          ? '0 10px 30px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' 
          : '0 10px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
      }}
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-xl pointer-events-none" />
      
      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
        {isEmpty ? (
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-400 text-center"
          >
            <div className="text-2xl mb-1">+</div>
            <span className="text-[8px]">Vacío</span>
          </motion.div>
        ) : (
          <>
            {/* Bola de helado 3D */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <div 
                className="w-10 h-10 rounded-full shadow-lg"
                style={{ 
                  background: `radial-gradient(circle at 30% 30%, ${slot.color || '#FFB5C5'}ee, ${slot.color || '#FFB5C5'}88)`,
                  boxShadow: `0 4px 15px ${slot.color || '#FFB5C5'}66, inset 0 -5px 10px rgba(0,0,0,0.2), inset 0 5px 10px rgba(255,255,255,0.3)`
                }}
              />
              {/* Brillo de la bola */}
              <div className="absolute top-1 left-2 w-3 h-2 bg-white/50 rounded-full blur-sm" />
            </motion.div>
            
            {/* Nombre del sabor */}
            <p className={`text-[9px] font-bold text-center mt-1 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {slot.flavor_name}
            </p>
            
            {/* Indicador de stock */}
            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${stockColors[slot.stock_level || 'full']}`} />
          </>
        )}
      </div>

      {/* Badge de tipo */}
      {!isEmpty && slot.flavor_type === 'premium' && (
        <div className="absolute top-1 right-1">
          <Sparkles className="w-3 h-3 text-purple-500" />
        </div>
      )}
      {!isEmpty && slot.flavor_type === 'nuevo' && (
        <div className="absolute top-1 left-1 bg-cyan-500 text-white text-[6px] px-1 rounded">NEW</div>
      )}
    </motion.div>
  );
}

// Modal de selección de sabor
function FlavorSelector({ isOpen, onClose, onSelect, currentSlot, isDarkMode }) {
  const [search, setSearch] = useState('');
  
  const filteredFlavors = POPSY_FLAVORS.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Seleccionar Sabor</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Bajada {currentSlot?.row}, Posición {currentSlot?.position}
        </p>

        <Input
          placeholder="Buscar sabor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
          {/* Opción vacío */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect({ name: '', color: '', type: 'vacio', is_empty: true })}
            className="flex flex-col items-center p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 mb-2" />
            <span className="text-xs text-gray-500">Vacío</span>
          </motion.button>
          
          {filteredFlavors.map((flavor) => (
            <motion.button
              key={flavor.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(flavor)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                isDarkMode ? 'border-gray-700 hover:border-pink-500' : 'border-gray-200 hover:border-pink-400'
              }`}
            >
              <div 
                className="w-8 h-8 rounded-full shadow-md mb-2"
                style={{ 
                  background: `radial-gradient(circle at 30% 30%, ${flavor.color}ee, ${flavor.color}88)`,
                  boxShadow: `0 2px 8px ${flavor.color}44`
                }}
              />
              <span className="text-xs font-medium text-center leading-tight">{flavor.name}</span>
              {flavor.type === 'premium' && (
                <Sparkles className="w-3 h-3 text-purple-500 mt-1" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FreezerMap() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showFlavorSelector, setShowFlavorSelector] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const freezerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['freezerSlots', selectedStore],
    queryFn: () => base44.entities.FreezerSlot.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Crear grid inicial si no existe
  const freezerGrid = useMemo(() => {
    const grid = [];
    for (let row = 1; row <= 7; row++) {
      const rowSlots = [];
      for (let pos = 1; pos <= 6; pos++) {
        const existingSlot = slots.find(s => s.row === row && s.position === pos);
        rowSlots.push(existingSlot || {
          row,
          position: pos,
          flavor_name: '',
          flavor_type: 'vacio',
          color: '',
          is_empty: true,
          stock_level: 'full',
          store_id: selectedStore
        });
      }
      grid.push(rowSlots);
    }
    return grid;
  }, [slots, selectedStore]);

  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotData, isNew }) => {
      if (isNew) {
        return base44.entities.FreezerSlot.create(slotData);
      } else {
        return base44.entities.FreezerSlot.update(slotData.id, slotData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['freezerSlots']);
      toast.success('¡Nevera actualizada!');
    }
  });

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowFlavorSelector(true);
  };

  const handleFlavorSelect = (flavor) => {
    if (!selectedSlot) return;
    
    const slotData = {
      ...selectedSlot,
      store_id: selectedStore,
      flavor_name: flavor.name,
      flavor_type: flavor.type,
      color: flavor.color,
      is_empty: flavor.is_empty || false
    };

    const existingSlot = slots.find(s => s.row === selectedSlot.row && s.position === selectedSlot.position);
    
    updateSlotMutation.mutate({
      slotData: existingSlot ? { ...slotData, id: existingSlot.id } : slotData,
      isNew: !existingSlot
    });

    setShowFlavorSelector(false);
    setSelectedSlot(null);
  };

  const handleDragStart = (e, slot) => {
    setDraggedSlot(slot);
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
  };

  const handleDrop = async (e, targetSlot) => {
    e.preventDefault();
    if (!draggedSlot || (draggedSlot.row === targetSlot.row && draggedSlot.position === targetSlot.position)) {
      return;
    }

    // Intercambiar slots
    const draggedExisting = slots.find(s => s.row === draggedSlot.row && s.position === draggedSlot.position);
    const targetExisting = slots.find(s => s.row === targetSlot.row && s.position === targetSlot.position);

    // Actualizar dragged a posición target
    if (draggedExisting) {
      await base44.entities.FreezerSlot.update(draggedExisting.id, {
        row: targetSlot.row,
        position: targetSlot.position
      });
    }

    // Actualizar target a posición dragged
    if (targetExisting) {
      await base44.entities.FreezerSlot.update(targetExisting.id, {
        row: draggedSlot.row,
        position: draggedSlot.position
      });
    }

    queryClient.invalidateQueries(['freezerSlots']);
    toast.success('¡Sabores intercambiados!');
    setDraggedSlot(null);
  };

  const handleAIReorder = async () => {
    toast.info('🤖 Analizando ventas para optimizar la nevera...');
    // Simulación de reordenamiento IA
    setTimeout(() => {
      toast.success('✨ Nevera optimizada según patrones de venta');
    }, 2000);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-pink-50 via-white to-purple-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
              </Button>
            </Link>
            <div>
              <h1 className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                🧊 Mapa de Nevera 3D
              </h1>
              {selectedStore && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedStore} - {selectedStoreName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
          </div>
        </div>

        {selectedStore ? (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className={isDarkMode ? 'border-gray-700 text-gray-300' : ''}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                  className={isDarkMode ? 'border-gray-700 text-gray-300' : ''}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(r => (r + 5) % 360)}
                  className={isDarkMode ? 'border-gray-700 text-gray-300' : ''}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`${isDarkMode ? 'border-pink-500 text-pink-400 bg-pink-500/10' : ''}`}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 mr-1" /> : <Moon className="w-4 h-4 mr-1" />}
                  {isDarkMode ? 'Claro' : 'Gourmet'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAIReorder}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  IA Optimizar
                </Button>
              </div>
            </div>

            {/* Freezer 3D View */}
            <motion.div
              ref={freezerRef}
              style={{ 
                transform: `scale(${zoom}) rotateY(${rotation}deg)`,
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
              className="relative mx-auto"
            >
              {/* Freezer Frame */}
              <div className={`
                relative rounded-3xl p-6 mx-auto max-w-2xl
                ${isDarkMode 
                  ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border border-pink-500/30' 
                  : 'bg-gradient-to-b from-white via-gray-50 to-white border-4 border-pink-200'}
                shadow-2xl
              `}
              style={{
                boxShadow: isDarkMode 
                  ? '0 0 60px rgba(236,72,153,0.2), 0 20px 60px rgba(0,0,0,0.5)' 
                  : '0 20px 60px rgba(236,72,153,0.15), 0 10px 30px rgba(0,0,0,0.1)'
              }}
              >
                {/* Logo Popsy en la nevera */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`px-6 py-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                  >
                    <img src={LOGO_URL} alt="Popsy" className="h-8 object-contain" />
                  </motion.div>
                </div>

                {/* Bajadas */}
                <div className="space-y-3 mt-4">
                  {freezerGrid.map((row, rowIndex) => (
                    <motion.div
                      key={rowIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: rowIndex * 0.1 }}
                      className="relative"
                    >
                      {/* Número de bajada */}
                      <div className={`absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${isDarkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}
                      >
                        {rowIndex + 1}
                      </div>

                      {/* Slots de la bajada */}
                      <div className={`grid grid-cols-6 gap-2 p-2 rounded-xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-100/50'}`}>
                        {row.map((slot, slotIndex) => (
                          <FreezerSlot3D
                            key={`${rowIndex}-${slotIndex}`}
                            slot={slot}
                            onClick={handleSlotClick}
                            isSelected={selectedSlot?.row === slot.row && selectedSlot?.position === slot.position}
                            isDarkMode={isDarkMode}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Reflejo inferior */}
                <div className={`absolute -bottom-6 left-4 right-4 h-6 rounded-b-3xl opacity-20 blur-sm
                  ${isDarkMode ? 'bg-pink-500' : 'bg-pink-300'}`} 
                />
              </div>
            </motion.div>

            {/* Leyenda */}
            <div className={`mt-8 p-4 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/80'} shadow-lg max-w-2xl mx-auto`}>
              <h4 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                📋 Leyenda
              </h4>
              <div className="flex flex-wrap gap-4">
                {[
                  { type: 'helado', label: 'Helado Regular' },
                  { type: 'premium', label: 'Premium', icon: <Sparkles className="w-3 h-3 text-purple-500" /> },
                  { type: 'especial', label: 'Especial' },
                  { type: 'nuevo', label: 'Nuevo' },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded bg-gradient-to-br ${TYPE_COLORS[item.type]} border ${TYPE_BORDERS[item.type]}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                    {item.icon}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-200">
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stock:</span>
                {[
                  { level: 'full', label: 'Completo', color: 'bg-green-400' },
                  { level: 'medium', label: 'Medio', color: 'bg-yellow-400' },
                  { level: 'low', label: 'Bajo', color: 'bg-orange-400' },
                  { level: 'empty', label: 'Agotado', color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🧊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver y editar el mapa de la nevera</p>
          </div>
        )}
      </div>

      {/* Flavor Selector Modal */}
      <AnimatePresence>
        {showFlavorSelector && (
          <FlavorSelector
            isOpen={showFlavorSelector}
            onClose={() => {
              setShowFlavorSelector(false);
              setSelectedSlot(null);
            }}
            onSelect={handleFlavorSelect}
            currentSlot={selectedSlot}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}