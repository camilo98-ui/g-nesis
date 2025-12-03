import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FreezerSlotCell from '@/components/freezer/FreezerSlotCell';
import FreezerAuditPanel from '@/components/freezer/FreezerAuditPanel';
import FreezerHistoryPanel from '@/components/freezer/FreezerHistoryPanel';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Sparkles, RotateCcw, ZoomIn, ZoomOut, 
  Trash2, History, BarChart3, Undo2, Copy, Check, X, Plus, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/c3a36de58_Capturadepantalla2025-11-251251441.png";

// Sabores predefinidos - GOURMET Y EXCLUSIVO (SOLO LISTA OFICIAL)
const POPSY_FLAVORS = [
  // GOURMET (12 sabores)
  { name: 'Limón N.', color: '#FFFACD', type: 'gourmet', line: 'gourmet' },
  { name: 'Maracuyá N.', color: '#FFB347', type: 'gourmet', line: 'gourmet' },
  { name: 'Mandarina N.', color: '#FFA500', type: 'gourmet', line: 'gourmet' },
  { name: 'Vainilla', color: '#FFF8DC', type: 'gourmet', line: 'gourmet' },
  { name: 'V. Francesa', color: '#FFFDD0', type: 'gourmet', line: 'gourmet' },
  { name: 'V. Chips', color: '#F5DEB3', type: 'gourmet', line: 'gourmet' },
  { name: 'Chocolate', color: '#5D3A1A', type: 'gourmet', line: 'gourmet' },
  { name: 'Belga', color: '#3D2314', type: 'gourmet', line: 'gourmet' },
  { name: 'Frutos', color: '#C71585', type: 'gourmet', line: 'gourmet' },
  { name: 'Fresa', color: '#FFB5C5', type: 'gourmet', line: 'gourmet' },
  { name: 'Arequipe', color: '#D4A574', type: 'gourmet', line: 'gourmet' },
  { name: 'Ron', color: '#8B4513', type: 'gourmet', line: 'gourmet' },
  // EXCLUSIVO (12 sabores)
  { name: 'Cherry', color: '#DC143C', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Arroz', color: '#F5F5DC', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Chicle', color: '#FFB6C1', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Brownie', color: '#3D2314', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Crema Limón', color: '#FFFACD', type: 'exclusivo', line: 'exclusivo' },
  { name: "M&M", color: '#E31837', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Milky', color: '#4169E1', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Oreo', color: '#1A1A1A', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Macadamia', color: '#DEB887', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Café', color: '#6F4E37', type: 'exclusivo', line: 'exclusivo' },
  { name: 'Yogurt C.', color: '#FFF5EE', type: 'exclusivo', line: 'exclusivo' },
];

// Reglas de ubicación ideal
const IDEAL_RULES = {
  1: ['gourmet'], // Fila 1: Gourmet
  2: ['exclusivo'], // Fila 2: Exclusivos
  3: ['gourmet', 'exclusivo'], // Fila 3: Mixto
};

// Modal de selección con búsqueda
function FlavorSelectorModal({ selectedSlot, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [slotType, setSlotType] = useState('F'); // F = Frontal, T = Trasero
  
  const filteredFlavors = POPSY_FLAVORS.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

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
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Seleccionar Sabor</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs text-gray-500">Bajada {selectedSlot?.row}, Pos {selectedSlot?.position}</p>
          <div className="flex gap-1 ml-auto">
            <Button 
              size="sm" 
              variant={slotType === 'F' ? 'default' : 'outline'}
              onClick={() => setSlotType('F')}
              className={`text-xs h-7 ${slotType === 'F' ? 'bg-pink-500' : ''}`}
            >
              F Frontal
            </Button>
            <Button 
              size="sm" 
              variant={slotType === 'T' ? 'default' : 'outline'}
              onClick={() => setSlotType('T')}
              className={`text-xs h-7 ${slotType === 'T' ? 'bg-purple-500' : ''}`}
            >
              T Trasero
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar sabor..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50"
          />
        </div>
        
        {/* Flavors Grid */}
        <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 pr-1">
          {/* Vacío */}
          <button 
            onClick={() => onSelect({ name: '', color: '', type: 'vacio', is_empty: true, slotType })} 
            className="flex flex-col items-center p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 mb-1" />
            <span className="text-[10px] text-gray-500">Vacío</span>
          </button>
          
          {filteredFlavors.map((flavor) => (
            <button 
              key={flavor.name} 
              onClick={() => onSelect({ ...flavor, slotType })} 
              className="flex flex-col items-center p-2 rounded-lg border border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-full shadow-md mb-1" 
                style={{ background: `radial-gradient(circle at 30% 30%, ${flavor.color}ee, ${flavor.color}88)` }} 
              />
              <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{flavor.name}</span>
              {flavor.brand && <Sparkles className="w-2.5 h-2.5 text-purple-500 mt-0.5" />}
            </button>
          ))}
        </div>
        
        {filteredFlavors.length === 0 && search && (
          <p className="text-center text-gray-400 text-sm py-4">No se encontró "{search}"</p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function FreezerMap() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showFlavorSelector, setShowFlavorSelector] = useState(false);
  const [showAddFlavor, setShowAddFlavor] = useState(false);
  const [newFlavor, setNewFlavor] = useState({ name: '', color: '#FFB5C5', line: 'gourmet' });
  const [zoom, setZoom] = useState(1);
  const [showAudit, setShowAudit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [savingSlot, setSavingSlot] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentFreezer, setCurrentFreezer] = useState(1); // Nueva nevera selector
  const [longPressSlot, setLongPressSlot] = useState(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    setUndoStack([]);
  };

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['freezerSlots', selectedStore, currentFreezer],
    queryFn: () => base44.entities.FreezerSlot.filter({ store_id: `${selectedStore}_F${currentFreezer}` }),
    enabled: !!selectedStore
  });

  // Long press para borrar
  const handleLongPressStart = (slot) => {
    longPressTimer.current = setTimeout(() => {
      clearSlot(slot);
      setLongPressSlot(null);
    }, 600);
    setLongPressSlot(slot);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressSlot(null);
  };

  const { data: history = [] } = useQuery({
    queryKey: ['freezerHistory', selectedStore],
    queryFn: () => base44.entities.FreezerHistory.filter({ store_id: selectedStore }, '-created_date', 20),
    enabled: !!selectedStore && showHistory
  });

  // Grid de la nevera - Ahora con bajadas (cada bajada tiene 2 espacios: F y T)
  // 7 bajadas x 6 posiciones = 42 posiciones visuales pero cada una es una bajada con F/T
  const freezerGrid = useMemo(() => {
    const grid = [];
    for (let row = 1; row <= 7; row++) {
      const rowBajadas = [];
      for (let pos = 1; pos <= 6; pos++) {
        // Cada posición es una "bajada" con slot frontal y trasero
        const frontSlot = slots.find(s => s.row === row && s.position === pos && s.slot_type === 'F') ||
          slots.find(s => s.row === row && s.position === pos && !s.slot_type);
        const backSlot = slots.find(s => s.row === row && s.position === pos && s.slot_type === 'T');
        
        rowBajadas.push({
          row,
          position: pos,
          front: frontSlot || {
            row, position: pos, slot_type: 'F', flavor_name: '', flavor_type: 'vacio',
            color: '', is_empty: true, stock_level: 'full', store_id: selectedStore
          },
          back: backSlot || {
            row, position: pos, slot_type: 'T', flavor_name: '', flavor_type: 'vacio',
            color: '', is_empty: true, stock_level: 'full', store_id: selectedStore
          }
        });
      }
      grid.push(rowBajadas);
    }
    return grid;
  }, [slots, selectedStore]);

  // Guardar en historial
  const saveToHistory = useCallback(async () => {
    if (!selectedStore || slots.length === 0) return;
    try {
      await base44.entities.FreezerHistory.create({
        store_id: selectedStore,
        date: format(new Date(), 'yyyy-MM-dd'),
        snapshot: JSON.stringify(slots),
        filled_slots: slots.filter(s => !s.is_empty && s.flavor_name).length,
        changes_count: 1
      });
    } catch (e) { console.error(e); }
  }, [selectedStore, slots]);

  // Mutation para actualizar slot
  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotData, isNew }) => {
      if (isNew) return base44.entities.FreezerSlot.create(slotData);
      return base44.entities.FreezerSlot.update(slotData.id, slotData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['freezerSlots']);
      setSavingSlot({ row: variables.slotData.row, position: variables.slotData.position, success: true });
      setTimeout(() => setSavingSlot(null), 1000);
    },
    onError: () => {
      toast.error('Error al guardar');
      setSavingSlot(null);
    }
  });

  // Borrar slot
  const clearSlot = useCallback(async (slot) => {
    if (!slot || slot.is_empty) return;
    
    // Guardar para undo
    setUndoStack(prev => [...prev.slice(-9), { action: 'clear', slot: { ...slot } }]);
    
    const existing = slots.find(s => s.row === slot.row && s.position === slot.position);
    if (existing?.id) {
      setSavingSlot({ row: slot.row, position: slot.position, saving: true });
      await base44.entities.FreezerSlot.update(existing.id, {
        flavor_name: '', flavor_type: 'vacio', color: '', is_empty: true
      });
      queryClient.invalidateQueries(['freezerSlots']);
      setSavingSlot({ row: slot.row, position: slot.position, success: true });
      setTimeout(() => setSavingSlot(null), 800);
      toast.success('Slot vaciado');
    }
  }, [slots, queryClient]);

  // Doble click para borrar
  const handleDoubleClick = useCallback((slot) => {
    clearSlot(slot);
  }, [clearSlot]);

  // Click para seleccionar/editar
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowFlavorSelector(true);
  };

  // Seleccionar sabor
  const handleFlavorSelect = (flavor) => {
    if (!selectedSlot) return;
    
    const slotType = flavor.slotType || selectedSlot.slot_type || 'F';
    
    setUndoStack(prev => [...prev.slice(-9), { action: 'edit', slot: { ...selectedSlot } }]);
    setSavingSlot({ row: selectedSlot.row, position: selectedSlot.position, saving: true });
    
    const slotData = {
      store_id: `${selectedStore}_F${currentFreezer}`,
      row: selectedSlot.row,
      position: selectedSlot.position,
      slot_type: slotType,
      flavor_name: flavor.name,
      flavor_type: flavor.type || flavor.line,
      color: flavor.color,
      is_empty: flavor.is_empty || false
    };
    
    const existing = slots.find(s => 
      s.row === selectedSlot.row && 
      s.position === selectedSlot.position && 
      (s.slot_type === slotType || (!s.slot_type && slotType === 'F'))
    );
    
    updateSlotMutation.mutate({
      slotData: existing ? { ...slotData, id: existing.id } : slotData,
      isNew: !existing
    });
    
    setShowFlavorSelector(false);
    setSelectedSlot(null);
  };

  // Vaciar toda la nevera
  const clearAllSlots = async () => {
    if (!confirm('¿Seguro que deseas vaciar toda la nevera?')) return;
    
    setUndoStack(prev => [...prev.slice(-9), { action: 'clearAll', slots: [...slots] }]);
    
    toast.info('Vaciando nevera...');
    const filledSlots = slots.filter(s => !s.is_empty && s.flavor_name);
    
    await Promise.all(filledSlots.map(s => 
      base44.entities.FreezerSlot.update(s.id, {
        flavor_name: '', flavor_type: 'vacio', color: '', is_empty: true
      })
    ));
    
    queryClient.invalidateQueries(['freezerSlots']);
    toast.success('Nevera vaciada');
  };

  // Deshacer última acción
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    if (lastAction.action === 'clear' || lastAction.action === 'edit') {
      const slot = lastAction.slot;
      const existing = slots.find(s => s.row === slot.row && s.position === slot.position);
      if (existing?.id) {
        await base44.entities.FreezerSlot.update(existing.id, {
          flavor_name: slot.flavor_name, flavor_type: slot.flavor_type,
          color: slot.color, is_empty: slot.is_empty
        });
      }
    } else if (lastAction.action === 'clearAll') {
      for (const slot of lastAction.slots) {
        if (slot.id && !slot.is_empty) {
          await base44.entities.FreezerSlot.update(slot.id, {
            flavor_name: slot.flavor_name, flavor_type: slot.flavor_type,
            color: slot.color, is_empty: slot.is_empty
          });
        }
      }
    }
    
    queryClient.invalidateQueries(['freezerSlots']);
    toast.success('Acción deshecha');
  };

  // Duplicar fila
  const duplicateRow = async (rowIndex) => {
    const sourceRow = freezerGrid[rowIndex];
    const targetRowIndex = rowIndex + 1;
    if (targetRowIndex >= 7) {
      toast.error('No hay fila disponible para duplicar');
      return;
    }
    
    for (const slot of sourceRow) {
      if (slot.is_empty) continue;
      const targetSlot = slots.find(s => s.row === targetRowIndex + 1 && s.position === slot.position);
      const slotData = {
        store_id: selectedStore, row: targetRowIndex + 1, position: slot.position,
        flavor_name: slot.flavor_name, flavor_type: slot.flavor_type,
        color: slot.color, is_empty: false, stock_level: slot.stock_level
      };
      if (targetSlot?.id) {
        await base44.entities.FreezerSlot.update(targetSlot.id, slotData);
      } else {
        await base44.entities.FreezerSlot.create(slotData);
      }
    }
    
    queryClient.invalidateQueries(['freezerSlots']);
    toast.success(`Fila ${rowIndex + 1} duplicada a fila ${targetRowIndex + 1}`);
  };

  // Drag & Drop
  const handleDragStart = (e, slot) => setDraggedSlot(slot);
  const handleDragEnd = () => setDraggedSlot(null);
  
  const handleDrop = async (e, targetSlot) => {
    e.preventDefault();
    if (!draggedSlot || (draggedSlot.row === targetSlot.row && draggedSlot.position === targetSlot.position)) return;
    
    const draggedExisting = slots.find(s => s.row === draggedSlot.row && s.position === draggedSlot.position);
    const targetExisting = slots.find(s => s.row === targetSlot.row && s.position === targetSlot.position);
    
    if (draggedExisting) {
      await base44.entities.FreezerSlot.update(draggedExisting.id, { row: targetSlot.row, position: targetSlot.position });
    }
    if (targetExisting) {
      await base44.entities.FreezerSlot.update(targetExisting.id, { row: draggedSlot.row, position: draggedSlot.position });
    }
    
    queryClient.invalidateQueries(['freezerSlots']);
    toast.success('Sabores intercambiados');
    setDraggedSlot(null);
  };

  // Auditoría
  const runAudit = useCallback(() => {
    const filledSlots = slots.filter(s => !s.is_empty && s.flavor_name);
    const emptySlots = 42 - filledSlots.length;
    
    // Detectar repetidos
    const flavorCounts = {};
    filledSlots.forEach(s => {
      flavorCounts[s.flavor_name] = (flavorCounts[s.flavor_name] || 0) + 1;
    });
    const repeatedFlavors = Object.entries(flavorCounts)
      .filter(([_, count]) => count > 2)
      .map(([name, count]) => ({ name, count }));
    
    // Detectar mal ubicados
    const misplacedSlots = filledSlots.filter(s => {
      const idealTypes = IDEAL_RULES[s.row] || ['gourmet', 'exclusivo'];
      return !idealTypes.includes(s.flavor_type);
    }).map(s => ({
      ...s,
      reason: `Debería estar en fila ${s.flavor_type === 'gourmet' ? 1 : 2}`
    }));
    
    // Sugerencias
    const suggestions = [];
    if (emptySlots > 10) suggestions.push(`Hay ${emptySlots} espacios vacíos. Considera llenar la nevera.`);
    if (repeatedFlavors.length > 0) suggestions.push(`Reduce sabores repetidos: ${repeatedFlavors.map(f => f.name).join(', ')}`);
    if (misplacedSlots.length > 0) suggestions.push(`Reorganiza ${misplacedSlots.length} sabores mal ubicados según las reglas de exhibición.`);
    
    const efficiency = Math.round((filledSlots.length / 42) * 100 - (misplacedSlots.length * 2) - (repeatedFlavors.length * 3));
    
    setAuditData({
      totalSlots: 42, filledSlots: filledSlots.length, emptySlots,
      misplacedSlots, repeatedFlavors, suggestions,
      efficiency: Math.max(0, Math.min(100, efficiency))
    });
    setShowAudit(true);
  }, [slots]);

  // Optimizar con IA
  const optimizeWithAI = async () => {
    setIsOptimizing(true);
    toast.info('🤖 IA optimizando la nevera...');
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un experto en merchandising de heladerías. Organiza estos 42 espacios de nevera (7 filas x 6 posiciones) con estos sabores disponibles:
        
Gourmet: Chocolate, Vainilla, Fresa, Arequipe, Maracuyá, Limón, Mora, Coco, Café, Dulce de Leche
Exclusivos: OREO, M&M's, SNICKERS, MILKY WAY, TWIX, KIT KAT, Nutella, Brownie, Cheesecake, Red Velvet, Tiramisú, Cookies & Cream

Reglas:
- Fila 1-2: Sabores más atractivos y vendidos (OREO, Chocolate, M&M's)
- Fila 3-4: Sabores populares secundarios
- Fila 5-7: Resto de sabores
- No repetir más de 2 veces un sabor
- Centro de cada fila debe tener los más llamativos

Devuelve un JSON con array de 42 objetos con: row (1-7), position (1-6), flavor_name, flavor_type (gourmet/exclusivo)`,
        response_json_schema: {
          type: "object",
          properties: {
            layout: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  row: { type: "number" },
                  position: { type: "number" },
                  flavor_name: { type: "string" },
                  flavor_type: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (result?.layout && confirm('¿Aplicar la nueva distribución sugerida por la IA?')) {
        await saveToHistory();
        
        for (const item of result.layout) {
          const flavor = POPSY_FLAVORS.find(f => f.name === item.flavor_name);
          const existing = slots.find(s => s.row === item.row && s.position === item.position);
          const slotData = {
            store_id: selectedStore, row: item.row, position: item.position,
            flavor_name: item.flavor_name, flavor_type: item.flavor_type,
            color: flavor?.color || '#FFB5C5', is_empty: false, stock_level: 'full'
          };
          
          if (existing?.id) {
            await base44.entities.FreezerSlot.update(existing.id, slotData);
          } else {
            await base44.entities.FreezerSlot.create(slotData);
          }
        }
        
        queryClient.invalidateQueries(['freezerSlots']);
        toast.success('✨ Nevera optimizada por IA');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al optimizar');
    }
    
    setIsOptimizing(false);
  };

  // Restaurar historial
  const restoreFromHistory = async (entry) => {
    if (!confirm('¿Restaurar este mapa? Se perderán los cambios actuales.')) return;
    
    try {
      const snapshot = JSON.parse(entry.snapshot);
      
      // Limpiar actual
      for (const s of slots) {
        if (s.id) await base44.entities.FreezerSlot.delete(s.id);
      }
      
      // Restaurar
      for (const s of snapshot) {
        await base44.entities.FreezerSlot.create({
          store_id: selectedStore, row: s.row, position: s.position,
          flavor_name: s.flavor_name, flavor_type: s.flavor_type,
          color: s.color, is_empty: s.is_empty, stock_level: s.stock_level
        });
      }
      
      queryClient.invalidateQueries(['freezerSlots']);
      toast.success('Mapa restaurado');
      setShowHistory(false);
    } catch (e) {
      toast.error('Error al restaurar');
    }
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-700">Mapa de Nevera #{currentFreezer}</h1>
              {selectedStore && <p className="text-xs sm:text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-white/80 rounded-xl shadow-sm">
              {/* Selector de Nevera */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg p-1">
                {[1, 2, 3].map(num => (
                  <Button
                    key={num}
                    size="sm"
                    variant={currentFreezer === num ? "default" : "ghost"}
                    onClick={() => setCurrentFreezer(num)}
                    className={`text-xs h-7 px-3 ${currentFreezer === num ? 'bg-cyan-500 text-white' : 'text-cyan-700 hover:bg-cyan-200'}`}
                  >
                    🧊 {num}
                  </Button>
                ))}
              </div>
              
              <div className="h-6 w-px bg-gray-200 mx-1" />
              
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <div className="h-6 w-px bg-gray-200 mx-1" />
              
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoStack.length === 0} title="Deshacer">
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={clearAllSlots} className="text-red-600 hover:bg-red-50" title="Vaciar Nevera">
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <div className="h-6 w-px bg-gray-200 mx-1" />
              
              <Button size="sm" variant="outline" onClick={runAudit} title="Auditoría">
                <BarChart3 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Auditoría</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowHistory(true)} title="Historial">
                <History className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Historial</span>
              </Button>

            </div>

            {/* Freezer Grid */}
            <div className="overflow-x-auto pb-4">
              <motion.div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="min-w-[320px]">
                <div className="relative rounded-2xl p-3 sm:p-5 mx-auto max-w-xl bg-gradient-to-b from-white via-gray-50 to-white border-2 border-pink-200 shadow-xl">
                  {/* Logo */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 rounded-full bg-white shadow-md">
                      <img src={LOGO_URL} alt="Popsy" className="h-6 sm:h-8 object-contain" />
                    </div>
                  </div>

                  {/* Grid - Bajadas con F (frontal) y T (trasero) */}
                  <div className="space-y-3 mt-4">
                    {freezerGrid.map((row, rowIndex) => (
                      <div key={rowIndex} className="relative">
                        {/* Row number */}
                        <div className="absolute -left-5 sm:-left-7 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                          {rowIndex + 1}
                        </div>
                        
                        {/* Row actions */}
                        <button
                          onClick={() => duplicateRow(rowIndex)}
                          className="absolute -right-5 sm:-right-7 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-400 hover:text-pink-600 flex items-center justify-center transition-colors"
                          title="Duplicar fila"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        {/* Bajadas - cada una con F y T en columna vertical */}
                        <div className="grid grid-cols-6 gap-3 p-2 rounded-xl bg-gray-100/50">
                          {row.map((bajada, bajadaIndex) => (
                            <div 
                              key={`${rowIndex}-${bajadaIndex}`} 
                              className="flex flex-col gap-1"
                            >
                              {/* Slot Trasero (T) - arriba */}
                              <div
                                onClick={() => {
                                  setSelectedSlot({ ...bajada.back, row: bajada.row, position: bajada.position, slot_type: 'T' });
                                  setShowFlavorSelector(true);
                                }}
                                onDoubleClick={() => clearSlot(bajada.back)}
                                className={`h-10 sm:h-11 rounded-lg cursor-pointer transition-all border-2 relative ${
                                  bajada.back.is_empty 
                                    ? 'bg-purple-50/50 border-dashed border-purple-200 hover:border-purple-400' 
                                    : 'border-purple-300 shadow-sm hover:scale-105'
                                }`}
                                style={!bajada.back.is_empty ? { 
                                  background: `linear-gradient(135deg, ${bajada.back.color}cc, ${bajada.back.color}88)` 
                                } : {}}
                              >
                                <div className="absolute top-0.5 left-0.5 bg-purple-500 text-white text-[6px] px-1 rounded font-bold z-10">T</div>
                                {bajada.back.is_empty ? (
                                  <div className="h-full flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-purple-300" />
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center pt-1.5">
                                    <span className="text-[7px] sm:text-[8px] font-medium text-white drop-shadow-sm text-center leading-tight px-0.5 line-clamp-2">
                                      {bajada.back.flavor_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Slot Frontal (F) - abajo */}
                              <div
                                onClick={() => {
                                  setSelectedSlot({ ...bajada.front, row: bajada.row, position: bajada.position, slot_type: 'F' });
                                  setShowFlavorSelector(true);
                                }}
                                onDoubleClick={() => clearSlot(bajada.front)}
                                className={`h-11 sm:h-12 rounded-lg cursor-pointer transition-all border-2 shadow-md relative ${
                                  bajada.front.is_empty 
                                    ? 'bg-white border-dashed border-pink-200 hover:border-pink-400' 
                                    : 'border-pink-300 hover:scale-105'
                                }`}
                                style={!bajada.front.is_empty ? { 
                                  background: `linear-gradient(135deg, ${bajada.front.color}ee, ${bajada.front.color}aa)` 
                                } : {}}
                              >
                                <div className="absolute top-0.5 left-0.5 bg-pink-500 text-white text-[6px] px-1 rounded font-bold z-10">F</div>
                                {bajada.front.is_empty ? (
                                  <div className="h-full flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-pink-300" />
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center pt-1.5">
                                    <span className="text-[8px] sm:text-[9px] font-bold text-white drop-shadow-md text-center leading-tight px-0.5 line-clamp-2">
                                      {bajada.front.flavor_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Info Panel */}
            <div className="mt-4 p-3 bg-white/80 rounded-xl shadow-sm space-y-3">
              {/* Add flavor */}
              <div className="p-2 rounded-lg border border-pink-200 bg-pink-50/50">
                <button onClick={() => setShowAddFlavor(!showAddFlavor)} className="flex items-center gap-2 text-sm font-medium text-pink-700 w-full">
                  <Plus className="w-4 h-4" />
                  Crear Nuevo Sabor
                </button>
                <AnimatePresence>
                  {showAddFlavor && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-2">
                      <Input placeholder="Nombre del sabor" value={newFlavor.name} onChange={(e) => setNewFlavor({ ...newFlavor, name: e.target.value })} className="text-sm" />
                      <div className="flex gap-2">
                        <Input type="color" value={newFlavor.color} onChange={(e) => setNewFlavor({ ...newFlavor, color: e.target.value })} className="w-12 h-9 p-1" />
                        <select value={newFlavor.line} onChange={(e) => setNewFlavor({ ...newFlavor, line: e.target.value })} className="flex-1 text-sm border rounded-md px-2">
                          <option value="gourmet">🍦 Gourmet</option>
                          <option value="exclusivo">✨ Exclusivo</option>
                        </select>
                        <Button size="sm" className="bg-pink-500 text-white" onClick={() => {
                          if (newFlavor.name.trim()) {
                            POPSY_FLAVORS.push({ name: newFlavor.name, color: newFlavor.color, type: newFlavor.line, line: newFlavor.line });
                            toast.success(`Sabor "${newFlavor.name}" agregado`);
                            setNewFlavor({ name: '', color: '#FFB5C5', line: 'gourmet' });
                            setShowAddFlavor(false);
                          }
                        }}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> Lleno</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> Medio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Agotado</span>
                <span className="text-gray-400">|</span>
                <span>Doble click = Borrar</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧊</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver y editar el mapa de la nevera</p>
          </div>
        )}
      </div>

      {/* Flavor Selector Modal with Search */}
      <AnimatePresence>
        {showFlavorSelector && (
          <FlavorSelectorModal
            selectedSlot={selectedSlot}
            onClose={() => { setShowFlavorSelector(false); setSelectedSlot(null); }}
            onSelect={handleFlavorSelect}
          />
        )}
      </AnimatePresence>

      {/* Audit Panel */}
      <AnimatePresence>
        {showAudit && <FreezerAuditPanel auditData={auditData} onClose={() => setShowAudit(false)} onApplySuggestions={() => toast.info('Sugerencias aplicadas')} onAutoCorrect={optimizeWithAI} isLoading={isOptimizing} />}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && <FreezerHistoryPanel history={history.map(h => ({ ...h, filledSlots: h.filled_slots, changes: h.changes_count }))} onClose={() => setShowHistory(false)} onRestore={restoreFromHistory} isLoading={false} />}
      </AnimatePresence>
    </div>
  );
}