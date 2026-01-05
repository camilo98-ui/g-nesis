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
import FreezerDimensionsEditor from '@/components/freezer/FreezerDimensionsEditor';
import SmartOrderPrediction from '@/components/freezer/SmartOrderPrediction';
import InventoryStatusOverview from '@/components/freezer/InventoryStatusOverview';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Sparkles, RotateCcw, ZoomIn, ZoomOut,
  Trash2, History, BarChart3, Undo2, Copy, Check, X, Plus, Search, FileDown } from
'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/c3a36de58_Capturadepantalla2025-11-251251441.png";

// Función para generar color dinámico basado en nombre del sabor
const getFlavorColor = (flavorName) => {
  const name = flavorName.toLowerCase();
  
  // Chocolates y oscuros
  if (name.includes('chocolate') || name.includes('belga')) return '#3D2314';
  if (name.includes('brownie')) return '#4A2511';
  if (name.includes('oreo')) return '#1A1A1A';
  if (name.includes('café') || name.includes('coffee')) return '#6F4E37';
  if (name.includes('ron') || name.includes('whisky')) return '#8B4513';
  
  // Frutas rojas y rosadas
  if (name.includes('fresa') || name.includes('strawberry')) return '#FF6B9D';
  if (name.includes('cherry') || name.includes('cereza')) return '#DC143C';
  if (name.includes('frambuesa') || name.includes('raspberry')) return '#E30B5C';
  if (name.includes('frutos')) return '#C71585';
  if (name.includes('chicle') || name.includes('gum')) return '#FFB6C1';
  
  // Naranjas y amarillos
  if (name.includes('maracuyá') || name.includes('passion')) return '#FFB347';
  if (name.includes('mandarina') || name.includes('orange')) return '#FFA500';
  if (name.includes('mango')) return '#FFBF00';
  if (name.includes('durazno') || name.includes('peach')) return '#FFDAB9';
  if (name.includes('naranja')) return '#FF8C00';
  
  // Limones y cítricos
  if (name.includes('limón') || name.includes('lemon')) return '#FFF44F';
  if (name.includes('crema limón') || name.includes('lemon cream')) return '#FFFACD';
  if (name.includes('lima') || name.includes('lime')) return '#C7EA46';
  
  // Vainillas y cremas
  if (name.includes('vainilla') || name.includes('vanilla')) return '#F3E5AB';
  if (name.includes('v. francesa')) return '#FFFDD0';
  if (name.includes('v. chips')) return '#F5DEB3';
  if (name.includes('crema')) return '#FFFACD';
  
  // Caramelos y dulces
  if (name.includes('arequipe') || name.includes('dulce')) return '#D4A574';
  if (name.includes('m&m')) return '#E31837';
  if (name.includes('milky')) return '#4169E1';
  if (name.includes('snickers')) return '#7B3F00';
  if (name.includes('kit kat')) return '#D70026';
  
  // Verdes y menta
  if (name.includes('menta') || name.includes('mint')) return '#98FF98';
  if (name.includes('pistacho') || name.includes('pistachio')) return '#93C572';
  
  // Morados y azules
  if (name.includes('mora') || name.includes('blackberry')) return '#8B008B';
  if (name.includes('arándano') || name.includes('blueberry')) return '#4169E1';
  if (name.includes('uva') || name.includes('grape')) return '#6A0DAD';
  
  // Otros
  if (name.includes('coco') || name.includes('coconut')) return '#FFFEF0';
  if (name.includes('nuez') || name.includes('nut')) return '#C19A6B';
  if (name.includes('macadamia')) return '#DEB887';
  if (name.includes('arroz') || name.includes('rice')) return '#F5F5DC';
  if (name.includes('yogurt')) return '#FFF5EE';
  
  // Default rosado
  return '#FFB5C5';
};

// Sabores predefinidos - GOURMET Y EXCLUSIVO
const POPSY_FLAVORS = [
// GOURMET
{ name: 'Limón N.', type: 'gourmet', line: 'gourmet' },
{ name: 'Maracuyá N.', type: 'gourmet', line: 'gourmet' },
{ name: 'Mandarina N.', type: 'gourmet', line: 'gourmet' },
{ name: 'Vainilla', type: 'gourmet', line: 'gourmet' },
{ name: 'V. Francesa', type: 'gourmet', line: 'gourmet' },
{ name: 'V. Chips', type: 'gourmet', line: 'gourmet' },
{ name: 'Chocolate', type: 'gourmet', line: 'gourmet' },
{ name: 'Belga', type: 'gourmet', line: 'gourmet' },
{ name: 'Frutos', type: 'gourmet', line: 'gourmet' },
{ name: 'Fresa', type: 'gourmet', line: 'gourmet' },
{ name: 'Arequipe', type: 'gourmet', line: 'gourmet' },
{ name: 'Ron', type: 'gourmet', line: 'gourmet' },
// EXCLUSIVO
{ name: 'Cherry', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Arroz', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Chicle', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Brownie', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Crema Limón', type: 'exclusivo', line: 'exclusivo' },
{ name: "M&M", type: 'exclusivo', line: 'exclusivo' },
{ name: 'Milky', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Oreo', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Macadamia', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Café', type: 'exclusivo', line: 'exclusivo' },
{ name: 'Yogurt C.', type: 'exclusivo', line: 'exclusivo' }].map(f => ({
  ...f,
  color: getFlavorColor(f.name),
  dark: ['#3D2314', '#4A2511', '#1A1A1A', '#6F4E37', '#8B4513', '#DC143C', '#E30B5C', '#C71585', '#E31837', '#4169E1', '#7B3F00', '#D70026', '#8B008B', '#6A0DAD'].includes(getFlavorColor(f.name))
}));


// Función para determinar si el texto debe ser oscuro o claro basado en el color de fondo
const getTextColor = (hexColor) => {
  if (!hexColor) return '#1f2937';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
};

// Reglas de ubicación ideal
const IDEAL_RULES = {
  1: ['gourmet'], // Fila 1: Gourmet
  2: ['exclusivo'], // Fila 2: Exclusivos
  3: ['gourmet', 'exclusivo'] // Fila 3: Mixto
};

// Modal simplificado - SIN selección F/T (se infiere del slot clickeado)
function FlavorSelectorModal({ selectedSlot, onClose, onSelect, customFlavors }) {
  const [search, setSearch] = useState('');

  // Combinar sabores predefinidos con personalizados
  const allFlavors = [...POPSY_FLAVORS, ...customFlavors];
  const filteredFlavors = allFlavors.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">Seleccionar Sabor</h3>
            <p className="text-xs text-gray-500">
              Bajada {selectedSlot?.row}, Pos {selectedSlot?.position} - 
              <span className={selectedSlot?.slot_type === 'F' ? 'text-pink-600 font-bold' : 'text-purple-600 font-bold'}>
                {' '}{selectedSlot?.slot_type === 'F' ? 'FRONTAL' : 'TRASERO'}
              </span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
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
            onClick={() => onSelect({ name: '', color: '', type: 'vacio', is_empty: true })}
            className="flex flex-col items-center p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 mb-1" />
            <span className="text-[10px] text-gray-500">Vacío</span>
          </button>
          
          {filteredFlavors.map((flavor) => (
            <button
              key={flavor.name}
              onClick={() => onSelect(flavor)}
              className="flex flex-col items-center p-2 rounded-lg border border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full shadow-md mb-1"
                style={{ 
                  background: `radial-gradient(circle at 35% 35%, ${flavor.color}ff, ${flavor.color}cc, ${flavor.color}99)`,
                  boxShadow: `0 4px 12px ${flavor.color}40`
                }}
              />
              <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{flavor.name}</span>
            </button>
          ))}
        </div>
        
        {filteredFlavors.length === 0 && search && (
          <p className="text-center text-gray-400 text-sm py-4">No se encontró "{search}"</p>
        )}
      </div>
    </div>
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
  const [currentFreezer, setCurrentFreezer] = useState(1);
  const [longPressSlot, setLongPressSlot] = useState(null);
  const longPressTimer = useRef(null);
  const [customFlavors, setCustomFlavors] = useState([]);
  const [availableFreezers, setAvailableFreezers] = useState([1, 2, 3]);

  // Dimensiones independientes por nevera
  const [freezerDimensions, setFreezerDimensions] = useState({
    1: { rows: 7, cols: 5 },
    2: { rows: 7, cols: 5 },
    3: { rows: 7, cols: 5 }
  });

  const numRows = freezerDimensions[currentFreezer]?.rows || 7;
  const numCols = freezerDimensions[currentFreezer]?.cols || 5;

  // Cargar sabores personalizados al inicio y mantener sincronizado
  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
    
    // Cargar sabores personalizados del localStorage
    const loadCustomFlavors = () => {
      const savedFlavors = localStorage.getItem('customFlavors');
      if (savedFlavors) {
        try {
          const parsed = JSON.parse(savedFlavors);
          setCustomFlavors(parsed);
        } catch (e) {
          console.error('Error cargando sabores personalizados:', e);
          localStorage.removeItem('customFlavors');
        }
      }
    };
    
    loadCustomFlavors();
    
    // Listener para cambios en localStorage (para sincronizar entre pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'customFlavors') {
        loadCustomFlavors();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    setUndoStack([]);
  };

  const { data: slots = [], isLoading, refetch } = useQuery({
    queryKey: ['freezerSlots', selectedStore, currentFreezer],
    queryFn: async () => {
      const result = await base44.entities.FreezerSlot.filter({ store_id: `${selectedStore}_F${currentFreezer}` });
      return result;
    },
    enabled: !!selectedStore,
    staleTime: 0, // Sin caché para siempre tener datos frescos
    cacheTime: 0, // No guardar en caché
    refetchOnMount: 'always',
    refetchOnWindowFocus: true, // Recargar cuando vuelve a la app en móvil
    refetchOnReconnect: true // Recargar cuando se reconecta internet
  });

  // Fetch todas las neveras para análisis completo
  const { data: allFreezersSlots = [] } = useQuery({
    queryKey: ['allFreezersSlots', selectedStore, availableFreezers],
    queryFn: async () => {
      const allSlots = await Promise.all(
        availableFreezers.map(num => 
          base44.entities.FreezerSlot.filter({ store_id: `${selectedStore}_F${num}` })
        )
      );
      return allSlots.flat();
    },
    enabled: !!selectedStore,
    staleTime: 30000
  });

  // Historial para análisis de rotación
  const { data: freezerHistoryData = [] } = useQuery({
    queryKey: ['freezerHistory', selectedStore],
    queryFn: () => base44.entities.FreezerHistory.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // ANÁLISIS DE ROTACIÓN HISTÓRICA
  const rotationAnalysis = useMemo(() => {
    if (!freezerHistoryData || freezerHistoryData.length < 2) return {};

    const flavorRotations = {};
    const sortedHistory = [...freezerHistoryData].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Analizar cambios entre snapshots consecutivos
    for (let i = 1; i < sortedHistory.length; i++) {
      const prevSnapshot = JSON.parse(sortedHistory[i - 1].snapshot || '[]');
      const currSnapshot = JSON.parse(sortedHistory[i].snapshot || '[]');
      const daysDiff = differenceInDays(parseISO(sortedHistory[i].date), parseISO(sortedHistory[i - 1].date));

      // Crear mapa de slots previos
      const prevMap = {};
      prevSnapshot.forEach(slot => {
        const key = `${slot.row}-${slot.position}-${slot.slot_type}`;
        prevMap[key] = slot;
      });

      // Detectar cambios
      currSnapshot.forEach(slot => {
        const key = `${slot.row}-${slot.position}-${slot.slot_type}`;
        const prevSlot = prevMap[key];

        if (prevSlot && prevSlot.flavor_name && !prevSlot.is_empty) {
          const flavorKey = prevSlot.flavor_name.toLowerCase().trim();
          
          if (!flavorRotations[flavorKey]) {
            flavorRotations[flavorKey] = {
              name: prevSlot.flavor_name,
              type: prevSlot.flavor_type,
              timesRemoved: 0,
              timesAdded: 0,
              totalDays: 0,
              avgDaysPerRotation: 0,
              freezers: new Set()
            };
          }

          // Si cambió a vacío o a otro sabor, se "removió"
          if (slot.is_empty || slot.flavor_name !== prevSlot.flavor_name) {
            flavorRotations[flavorKey].timesRemoved++;
            flavorRotations[flavorKey].totalDays += daysDiff;
            flavorRotations[flavorKey].freezers.add(slot.store_id?.split('_F')[1] || '1');
          }
        }

        // Detectar sabores nuevos agregados
        if (slot.flavor_name && !slot.is_empty) {
          const flavorKey = slot.flavor_name.toLowerCase().trim();
          if (!prevSlot || prevSlot.is_empty || prevSlot.flavor_name !== slot.flavor_name) {
            if (!flavorRotations[flavorKey]) {
              flavorRotations[flavorKey] = {
                name: slot.flavor_name,
                type: slot.flavor_type,
                timesRemoved: 0,
                timesAdded: 0,
                totalDays: 0,
                avgDaysPerRotation: 0,
                freezers: new Set()
              };
            }
            flavorRotations[flavorKey].timesAdded++;
            flavorRotations[flavorKey].freezers.add(slot.store_id?.split('_F')[1] || '1');
          }
        }
      });
    }

    // Calcular promedio de días por rotación
    Object.values(flavorRotations).forEach(flavor => {
      if (flavor.timesRemoved > 0) {
        flavor.avgDaysPerRotation = flavor.totalDays / flavor.timesRemoved;
        flavor.rotationVelocity = flavor.avgDaysPerRotation > 0 ? (7 / flavor.avgDaysPerRotation) * 100 : 0;
      } else {
        flavor.avgDaysPerRotation = 99;
        flavor.rotationVelocity = 0;
      }
    });

    return flavorRotations;
  }, [freezerHistoryData]);

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
  const freezerGrid = useMemo(() => {
    const grid = [];
    for (let row = 1; row <= numRows; row++) {
      const rowBajadas = [];
      for (let pos = 1; pos <= numCols; pos++) {
        // Cada posición es una "bajada" con slot frontal y trasero
        const frontSlot = slots.find((s) => s.row === row && s.position === pos && s.slot_type === 'F') ||
        slots.find((s) => s.row === row && s.position === pos && !s.slot_type);
        const backSlot = slots.find((s) => s.row === row && s.position === pos && s.slot_type === 'T');

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
  }, [slots, selectedStore, numRows, numCols]);

  // Guardar en historial con usuario
  const saveToHistory = useCallback(async (changesCount = 1) => {
    if (!selectedStore || slots.length === 0) return;
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.FreezerHistory.create({
        store_id: selectedStore,
        date: format(new Date(), 'yyyy-MM-dd'),
        snapshot: JSON.stringify(slots),
        filled_slots: slots.filter((s) => !s.is_empty && s.flavor_name).length,
        changes_count: changesCount,
        created_by_user: user?.full_name || user?.email || 'Usuario'
      });
    } catch (e) {console.error(e);}
  }, [selectedStore, slots]);

  // Mutation para actualizar slot - CORREGIDO para evitar sobrescribir store_id
  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotData, isNew }) => {
      if (isNew) {
        // Para nuevo: incluir store_id completo
        const finalSlotData = {
          ...slotData,
          store_id: `${selectedStore}_F${currentFreezer}`
        };
        return await base44.entities.FreezerSlot.create(finalSlotData);
      }
      
      // Para update: NO enviar store_id, solo los campos editables
      const { store_id, id, ...editableFields } = slotData;
      return await base44.entities.FreezerSlot.update(id, editableFields);
    },
    onSuccess: async (data, variables) => {
      // Invalidar queries y esperar a que se actualicen
      await queryClient.invalidateQueries(['freezerSlots']);
      await queryClient.invalidateQueries(['allFreezersSlots']);
      
      // Forzar refetch inmediato para obtener datos actualizados
      await refetch();
      
      // Esperar un poco más en móvil para asegurar que se guardó
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setSavingSlot({ row: variables.slotData.row, position: variables.slotData.position, success: true });
      setTimeout(() => setSavingSlot(null), 1000);
      toast.success('✓ Sabor guardado');
    },
    onError: (error) => {
      console.error('Error al guardar slot:', error);
      toast.error('Error al guardar');
      setSavingSlot(null);
    }
  });

  // Borrar slot - CORREGIDO para identificar correctamente el slot por tipo y store
  const clearSlot = useCallback(async (slot) => {
    if (!slot || slot.is_empty) return;

    // Guardar para undo
    setUndoStack((prev) => [...prev.slice(-9), { action: 'clear', slot: { ...slot } }]);

    // Buscar el slot exacto por store_id, row, position Y slot_type
    const existing = slots.find((s) =>
    s.store_id === `${selectedStore}_F${currentFreezer}` &&
    s.row === slot.row &&
    s.position === slot.position &&
    s.slot_type === slot.slot_type
    );

    if (existing?.id) {
      setSavingSlot({ row: slot.row, position: slot.position, saving: true });
      // Solo actualizar los campos necesarios sin tocar store_id
      await base44.entities.FreezerSlot.update(existing.id, {
        flavor_name: '',
        flavor_type: 'vacio',
        color: '',
        is_empty: true,
        stock_level: 'full'
      });
      await queryClient.invalidateQueries(['freezerSlots']);
      await refetch();
      setSavingSlot({ row: slot.row, position: slot.position, success: true });
      setTimeout(() => setSavingSlot(null), 800);
      toast.success(`Slot ${slot.slot_type} vaciado`);
    }
  }, [slots, queryClient, selectedStore, currentFreezer]);

  // Doble click para borrar
  const handleDoubleClick = useCallback((slot) => {
    clearSlot(slot);
  }, [clearSlot]);

  // Click para seleccionar/editar
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowFlavorSelector(true);
  };

  // Seleccionar sabor - CORREGIDO: mantener slot_type y todos los datos
  const handleFlavorSelect = async (flavor) => {
    if (!selectedSlot) return;

    // CRÍTICO: usar el slot_type del slot que fue clickeado
    const slotType = selectedSlot.slot_type;

    setUndoStack((prev) => [...prev.slice(-9), { action: 'edit', slot: { ...selectedSlot } }]);
    setSavingSlot({ row: selectedSlot.row, position: selectedSlot.position, saving: true });

    // Buscar el slot existente ANTES de crear slotData
    const existing = slots.find((s) =>
      s.store_id === `${selectedStore}_F${currentFreezer}` &&
      s.row === selectedSlot.row &&
      s.position === selectedSlot.position &&
      s.slot_type === slotType
    );

    const slotData = {
      row: selectedSlot.row,
      position: selectedSlot.position,
      slot_type: slotType,
      flavor_name: flavor.name,
      flavor_type: flavor.type || flavor.line,
      color: flavor.color || getFlavorColor(flavor.name),
      is_empty: flavor.is_empty || false,
      stock_level: 'full'
    };

    // Si existe, agregar el ID pero NO store_id (se mantiene automáticamente)
    // Si es nuevo, agregar store_id
    if (existing?.id) {
      slotData.id = existing.id;
    } else {
      slotData.store_id = `${selectedStore}_F${currentFreezer}`;
    }

    updateSlotMutation.mutate({
      slotData,
      isNew: !existing
    });

    setShowFlavorSelector(false);
    setSelectedSlot(null);
  };

  // Vaciar toda la nevera
  const clearAllSlots = async () => {
    if (!confirm('¿Seguro que deseas vaciar toda la nevera?')) return;

    setUndoStack((prev) => [...prev.slice(-9), { action: 'clearAll', slots: [...slots] }]);

    toast.info('Vaciando nevera...');
    const filledSlots = slots.filter((s) => !s.is_empty && s.flavor_name);

    await Promise.all(filledSlots.map((s) =>
    base44.entities.FreezerSlot.update(s.id, {
      flavor_name: '', 
      flavor_type: 'vacio', 
      color: '', 
      is_empty: true,
      stock_level: 'full'
    })
    ));

    await queryClient.invalidateQueries(['freezerSlots']);
    await refetch();
    toast.success('Nevera vaciada');
  };

  // Deshacer última acción - CORREGIDO para identificar slots por tipo
  const handleUndo = async () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (lastAction.action === 'clear' || lastAction.action === 'edit') {
      const slot = lastAction.slot;
      // Buscar por store_id, row, position Y slot_type
      const existing = slots.find((s) =>
      s.store_id === slot.store_id &&
      s.row === slot.row &&
      s.position === slot.position &&
      s.slot_type === slot.slot_type
      );
      if (existing?.id) {
        // No sobrescribir store_id en undo
        await base44.entities.FreezerSlot.update(existing.id, {
          flavor_name: slot.flavor_name,
          flavor_type: slot.flavor_type,
          color: slot.color,
          is_empty: slot.is_empty,
          stock_level: slot.stock_level || 'full'
        });
      }
    } else if (lastAction.action === 'clearAll') {
      for (const slot of lastAction.slots) {
        if (slot.id && !slot.is_empty) {
          await base44.entities.FreezerSlot.update(slot.id, {
            flavor_name: slot.flavor_name,
            flavor_type: slot.flavor_type,
            color: slot.color,
            is_empty: slot.is_empty
          });
        }
      }
    }

    queryClient.invalidateQueries(['freezerSlots']);
    toast.success('Acción deshecha');
  };

  // Duplicar fila - Solo en la nevera actual
  const duplicateRow = async (rowIndex) => {
    const sourceRow = freezerGrid[rowIndex];
    const targetRowIndex = rowIndex + 1;
    if (targetRowIndex >= numRows) {
      toast.error('No hay fila disponible para duplicar');
      return;
    }

    for (const bajada of sourceRow) {
      // Duplicar slot frontal
      if (!bajada.front.is_empty) {
        const targetSlot = slots.find((s) =>
        s.store_id === `${selectedStore}_F${currentFreezer}` &&
        s.row === targetRowIndex + 1 &&
        s.position === bajada.position &&
        s.slot_type === 'F'
        );
        const slotData = {
          store_id: `${selectedStore}_F${currentFreezer}`,
          row: targetRowIndex + 1,
          position: bajada.position,
          slot_type: 'F',
          flavor_name: bajada.front.flavor_name,
          flavor_type: bajada.front.flavor_type,
          color: bajada.front.color,
          is_empty: false,
          stock_level: bajada.front.stock_level
        };
        if (targetSlot?.id) {
          await base44.entities.FreezerSlot.update(targetSlot.id, slotData);
        } else {
          await base44.entities.FreezerSlot.create(slotData);
        }
      }

      // Duplicar slot trasero
      if (!bajada.back.is_empty) {
        const targetSlot = slots.find((s) =>
        s.store_id === `${selectedStore}_F${currentFreezer}` &&
        s.row === targetRowIndex + 1 &&
        s.position === bajada.position &&
        s.slot_type === 'T'
        );
        const slotData = {
          store_id: `${selectedStore}_F${currentFreezer}`,
          row: targetRowIndex + 1,
          position: bajada.position,
          slot_type: 'T',
          flavor_name: bajada.back.flavor_name,
          flavor_type: bajada.back.flavor_type,
          color: bajada.back.color,
          is_empty: false,
          stock_level: bajada.back.stock_level
        };
        if (targetSlot?.id) {
          await base44.entities.FreezerSlot.update(targetSlot.id, slotData);
        } else {
          await base44.entities.FreezerSlot.create(slotData);
        }
      }
    }

    queryClient.invalidateQueries(['freezerSlots']);
    toast.success(`Fila ${rowIndex + 1} duplicada a fila ${targetRowIndex + 1} en Nevera #${currentFreezer}`);
  };

  // Drag & Drop
  const handleDragStart = (e, slot) => setDraggedSlot(slot);
  const handleDragEnd = () => setDraggedSlot(null);

  const handleDrop = async (e, targetSlot) => {
    e.preventDefault();
    if (!draggedSlot || draggedSlot.row === targetSlot.row && draggedSlot.position === targetSlot.position) return;

    const draggedExisting = slots.find((s) =>
    s.store_id === `${selectedStore}_F${currentFreezer}` &&
    s.row === draggedSlot.row &&
    s.position === draggedSlot.position &&
    s.slot_type === draggedSlot.slot_type
    );
    const targetExisting = slots.find((s) =>
    s.store_id === `${selectedStore}_F${currentFreezer}` &&
    s.row === targetSlot.row &&
    s.position === targetSlot.position &&
    s.slot_type === targetSlot.slot_type
    );

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
    const filledSlots = slots.filter((s) => !s.is_empty && s.flavor_name);
    // Contar vacíos reales: numRows filas x numCols posiciones x 2 slots (F y T)
    const totalSlotsInFreezer = numRows * numCols * 2;
    const emptySlots = totalSlotsInFreezer - filledSlots.length;

    // Detectar repetidos con más precisión
    const flavorCounts = {};
    const flavorDetails = {};
    filledSlots.forEach((s) => {
      const key = s.flavor_name.toLowerCase().trim();
      flavorCounts[key] = (flavorCounts[key] || 0) + 1;
      if (!flavorDetails[key]) {
        flavorDetails[key] = { name: s.flavor_name, positions: [] };
      }
      flavorDetails[key].positions.push(`${s.row}-${s.position}${s.slot_type || 'F'}`);
    });
    const repeatedFlavors = Object.entries(flavorCounts).
    filter(([_, count]) => count > 2).
    map(([key, count]) => ({
      name: flavorDetails[key].name,
      count,
      positions: flavorDetails[key].positions.join(', ')
    }));

    // Detectar mal ubicados
    const misplacedSlots = filledSlots.filter((s) => {
      const idealTypes = IDEAL_RULES[s.row] || ['gourmet', 'exclusivo'];
      return !idealTypes.includes(s.flavor_type);
    }).map((s) => ({
      ...s,
      reason: `Debería estar en fila ${s.flavor_type === 'gourmet' ? 1 : 2}`
    }));

    // Sugerencias
    const suggestions = [];
    if (emptySlots > 10) suggestions.push(`Hay ${emptySlots} espacios vacíos. Considera llenar la nevera.`);
    if (repeatedFlavors.length > 0) suggestions.push(`Reduce sabores repetidos: ${repeatedFlavors.map((f) => f.name).join(', ')}`);
    if (misplacedSlots.length > 0) suggestions.push(`Reorganiza ${misplacedSlots.length} sabores mal ubicados según las reglas de exhibición.`);

    const efficiency = Math.round(filledSlots.length / totalSlotsInFreezer * 100 - misplacedSlots.length * 2 - repeatedFlavors.length * 3);

    setAuditData({
      totalSlots: totalSlotsInFreezer, filledSlots: filledSlots.length, emptySlots,
      misplacedSlots, repeatedFlavors, suggestions,
      efficiency: Math.max(0, Math.min(100, efficiency))
    });
    setShowAudit(true);
  }, [slots, numRows, numCols]);

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
          const flavor = POPSY_FLAVORS.find((f) => f.name === item.flavor_name);
          const existing = slots.find((s) => s.row === item.row && s.position === item.position);
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

  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

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
              <h1 className="text-pink-700 text-xl font-semibold sm:text-2xl">Mapa de Nevera #{currentFreezer}</h1>
              {selectedStore && <p className="text-pink-700 text-xs sm:text-sm">{selectedStore} - {selectedStoreName}</p>}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ?
        <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white/80 rounded-xl shadow-sm">
              {/* Selector de Nevera */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg p-1">
                {availableFreezers.map((num) =>
              <Button
                key={num}
                size="sm"
                variant={currentFreezer === num ? "default" : "ghost"}
                onClick={() => setCurrentFreezer(num)}
                className={`text-xs h-7 px-3 ${currentFreezer === num ? 'bg-cyan-500 text-white' : 'text-cyan-700 hover:bg-cyan-200'}`}>

                    🧊 {num}
                  </Button>
              )}
                {/* Botón Agregar Nevera */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (availableFreezers.length >= 10) {
                      toast.error('Máximo 10 neveras');
                      return;
                    }
                    const newNum = Math.max(...availableFreezers) + 1;
                    setAvailableFreezers([...availableFreezers, newNum]);
                    setFreezerDimensions(prev => ({
                      ...prev,
                      [newNum]: { rows: 7, cols: 5 }
                    }));
                    setCurrentFreezer(newNum);
                    toast.success(`Nevera #${newNum} creada`);
                  }}
                  className="text-xs h-7 px-2 text-cyan-600 hover:bg-cyan-200"
                  title="Agregar nevera">
                  <Plus className="w-4 h-4" />
                </Button>
                {/* Botón Eliminar Nevera Actual */}
                {availableFreezers.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm(`¿Eliminar Nevera #${currentFreezer}? Se borrarán todos sus datos.`)) return;
                      
                      // Eliminar todos los slots de esta nevera
                      const slotsToDelete = slots.filter(s => s.store_id === `${selectedStore}_F${currentFreezer}`);
                      await Promise.all(slotsToDelete.map(s => base44.entities.FreezerSlot.delete(s.id)));
                      
                      // Actualizar estado
                      const newFreezers = availableFreezers.filter(n => n !== currentFreezer);
                      setAvailableFreezers(newFreezers);
                      
                      // Cambiar a la primera nevera disponible
                      setCurrentFreezer(newFreezers[0]);
                      
                      // Limpiar dimensiones
                      setFreezerDimensions(prev => {
                        const updated = { ...prev };
                        delete updated[currentFreezer];
                        return updated;
                      });
                      
                      await queryClient.invalidateQueries(['freezerSlots']);
                      await queryClient.invalidateQueries(['allFreezersSlots']);
                      toast.success(`Nevera #${currentFreezer} eliminada`);
                    }}
                    className="text-xs h-7 px-2 text-red-600 hover:bg-red-100"
                    title="Eliminar nevera actual">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="h-6 w-px bg-gray-200 mx-1" />
              
              <FreezerDimensionsEditor
              currentRows={numRows}
              currentCols={numCols}
              onAddRow={() => {
                if (numRows < 10) {
                  setFreezerDimensions((prev) => ({
                    ...prev,
                    [currentFreezer]: { ...prev[currentFreezer], rows: numRows + 1 }
                  }));
                  toast.success(`Fila agregada a Nevera #${currentFreezer}`);
                } else {
                  toast.error('Máximo 10 filas');
                }
              }}
              onRemoveRow={() => {
                if (numRows > 1) {
                  setFreezerDimensions((prev) => ({
                    ...prev,
                    [currentFreezer]: { ...prev[currentFreezer], rows: numRows - 1 }
                  }));
                  toast.success(`Fila eliminada de Nevera #${currentFreezer}`);
                }
              }}
              onAddCol={() => {
                if (numCols < 8) {
                  setFreezerDimensions((prev) => ({
                    ...prev,
                    [currentFreezer]: { ...prev[currentFreezer], cols: numCols + 1 }
                  }));
                  toast.success(`Columna agregada a Nevera #${currentFreezer}`);
                } else {
                  toast.error('Máximo 8 columnas');
                }
              }}
              onRemoveCol={() => {
                if (numCols > 1) {
                  setFreezerDimensions((prev) => ({
                    ...prev,
                    [currentFreezer]: { ...prev[currentFreezer], cols: numCols - 1 }
                  }));
                  toast.success(`Columna eliminada de Nevera #${currentFreezer}`);
                }
              }} />

              
              <div className="h-6 w-px bg-gray-200 mx-1" />
              
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoStack.length === 0} title="Deshacer">
                <Undo2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Deshacer</span>
              </Button>
              <Button size="sm" variant="outline" onClick={clearAllSlots} className="text-red-600 hover:bg-red-50" title="Vaciar Nevera">
                <Trash2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Vaciar</span>
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
              
              <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Exportar a PDF usando window.print con estilos específicos
                const printContent = document.querySelector('.min-w-\\[320px\\]');
                if (printContent) {
                  const printWindow = window.open('', '', 'width=800,height=600');
                  printWindow.document.write(`
                      <html>
                        <head>
                          <title>Mapa Nevera ${selectedStore} - Nevera #${currentFreezer}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            h1 { text-align: center; color: #ec4899; }
                            .info { text-align: center; margin-bottom: 20px; color: #666; }
                            .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
                            .row { display: flex; gap: 8px; margin-bottom: 10px; }
                            .slot { padding: 8px; border-radius: 8px; text-align: center; font-size: 10px; min-height: 40px; }
                            .empty { background: #f3f4f6; border: 1px dashed #ccc; }
                          </style>
                        </head>
                        <body>
                          <h1>🍦 Mapa Nevera #${currentFreezer}</h1>
                          <p class="info">Tienda: ${selectedStore} - ${selectedStoreName}<br/>Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                          ${freezerGrid.map((row, rowIdx) => `
                            <div class="row">
                              <strong style="width:30px;">${rowIdx + 1}</strong>
                              ${row.map((slot) => `
                                <div class="slot" style="flex:1; background: ${slot.front.color || '#f3f4f6'}; color: ${slot.front.is_empty ? '#999' : '#000'}">
                                  <small>F:</small> ${slot.front.flavor_name || 'Vacío'}<br/>
                                  <small>T:</small> ${slot.back.flavor_name || 'Vacío'}
                                </div>
                              `).join('')}
                            </div>
                          `).join('')}
                        </body>
                      </html>
                    `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
              title="Exportar PDF"
              className="text-rose-600 hover:bg-rose-50">

                <FileDown className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </Button>

            </div>

            {/* Freezer Grid */}
            <div className="overflow-x-auto pb-4">
              <motion.div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="bg-transparent min-w-[320px]"

              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>

                <motion.div
                className="relative rounded-3xl p-4 sm:p-6 mx-auto max-w-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}>

                  {/* Efectos de fondo animados */}
                  <motion.div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)'
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />


                  {/* Borde con gradiente animado */}
                  <motion.div className="bg-pink-700 rounded-3xl absolute inset-0"

                style={{
                  background: 'linear-gradient(45deg, #ec4899, #a855f7, #ec4899)',
                  backgroundSize: '200% 200%',
                  padding: '3px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />

                  
                  {/* Logo con efecto */}
                  <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}>

                    <motion.div
                    className="px-5 py-2 rounded-2xl bg-white shadow-2xl border-2 border-pink-200"
                    animate={{
                      boxShadow: ['0 10px 30px rgba(236, 72, 153, 0.2)', '0 15px 40px rgba(168, 85, 247, 0.3)', '0 10px 30px rgba(236, 72, 153, 0.2)']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}>

                      <img src={LOGO_URL} alt="Popsy" className="h-7 sm:h-9 object-contain" />
                    </motion.div>
                  </motion.div>

                  {/* Grid - Bajadas con F (frontal) y T (trasero) */}
                  <div className="space-y-3 mt-6 relative z-10">
                    {freezerGrid.map((row, rowIndex) =>
                  <motion.div
                    key={rowIndex}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rowIndex * 0.05 }}>

                        {/* Row number */}
                        <motion.div
                      className="absolute -left-5 sm:-left-7 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-lg"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}>

                          {rowIndex + 1}
                        </motion.div>
                        
                        {/* Row actions */}
                        <motion.button
                      onClick={() => duplicateRow(rowIndex)}
                      className="absolute -right-5 sm:-right-7 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-pink-100 hover:to-pink-200 text-gray-500 hover:text-pink-600 flex items-center justify-center transition-all shadow-md"
                      title="Duplicar fila"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}>

                          <Copy className="w-3 h-3" />
                        </motion.button>

                        {/* Bajadas - cada una con F y T en columna vertical */}
                        <motion.div
                      className="grid gap-3 p-3 rounded-2xl relative overflow-hidden"
                      style={{
                        gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
                        background: 'linear-gradient(135deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.4) 100%)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: rowIndex * 0.08 }}>

                          {/* Efecto de brillo en la fila */}
                          <motion.div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)'
                        }}
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: rowIndex * 0.3 }} />

                          {row.map((bajada, bajadaIndex) =>
                      <motion.div
                        key={`${rowIndex}-${bajadaIndex}`}
                        className="flex flex-col gap-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (rowIndex * numCols + bajadaIndex) * 0.02 }}>

                              {/* Slot Trasero (T) - arriba */}
                              <motion.div
                          onClick={() => {
                            setSelectedSlot({ ...bajada.back, row: bajada.row, position: bajada.position, slot_type: 'T' });
                            setShowFlavorSelector(true);
                          }}
                          onDoubleClick={() => clearSlot(bajada.back)}
                          whileHover={!bajada.back.is_empty ? {
                            scale: 1.08,
                            y: -2,
                            boxShadow: `0 8px 25px ${bajada.back.color || '#a855f7'}60`
                          } : { scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          className={`h-11 sm:h-12 rounded-xl cursor-pointer transition-all border-2 relative overflow-hidden ${
                          bajada.back.is_empty ?
                          'bg-purple-50/50 border-dashed border-purple-300 hover:border-purple-500' :
                          'border-purple-400 shadow-xl'}`
                          }
                          style={!bajada.back.is_empty ? {
                            background: `linear-gradient(145deg, ${bajada.back.color}ff 0%, ${bajada.back.color}ee 50%, ${bajada.back.color}cc 100%)`,
                            boxShadow: `0 8px 20px ${bajada.back.color}50, inset 0 2px 10px rgba(255,255,255,0.25)`
                          } : {}}>

                                {!bajada.back.is_empty &&
                          <>
                                    <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent"
                              animate={{
                                opacity: [0.4, 0.8, 0.4],
                                scale: [1, 1.05, 1]
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />

                                    <motion.div
                              className="absolute top-0 left-0 right-0 h-1/2"
                              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)' }} />

                                  </>
                          }
                                <motion.div
                            className="absolute top-0.5 left-0.5 bg-purple-600 text-white text-[6px] px-1.5 py-0.5 rounded-md font-bold z-10 shadow-sm"
                            whileHover={{ scale: 1.1 }}>

                                  T
                                </motion.div>
                                {bajada.back.is_empty ?
                          <div className="h-full flex items-center justify-center">
                                    <motion.div
                              animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, 90, 0]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}>

                                      <Plus className="w-3 h-3 text-purple-400" />
                                    </motion.div>
                                  </div> :

                          <div className="h-full flex items-center justify-center pt-1.5 relative z-10">
                                    <span
                              className="text-[7px] sm:text-[8px] font-black text-center leading-tight px-0.5 line-clamp-2"
                              style={{
                                color: getTextColor(bajada.back.color),
                                textShadow: getTextColor(bajada.back.color) === '#ffffff' ? '0 2px 4px rgba(0,0,0,0.7)' : '0 2px 3px rgba(255,255,255,0.6)'
                              }}>

                                      {bajada.back.flavor_name}
                                    </span>
                                  </div>
                          }
                              </motion.div>
                              
                              {/* Slot Frontal (F) - abajo */}
                              <motion.div
                          onClick={() => {
                            setSelectedSlot({ ...bajada.front, row: bajada.row, position: bajada.position, slot_type: 'F' });
                            setShowFlavorSelector(true);
                          }}
                          onDoubleClick={() => clearSlot(bajada.front)}
                          whileHover={!bajada.front.is_empty ? {
                            scale: 1.1,
                            y: -3,
                            boxShadow: `0 12px 35px ${bajada.front.color || '#ec4899'}70`,
                            zIndex: 50
                          } : { scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          className={`h-12 sm:h-14 rounded-xl cursor-pointer transition-all border-2 shadow-xl relative overflow-hidden ${
                          bajada.front.is_empty ?
                          'bg-white border-dashed border-pink-300 hover:border-pink-500' :
                          'border-pink-500'}`
                          }
                          style={!bajada.front.is_empty ? {
                            background: `linear-gradient(145deg, ${bajada.front.color}ff 0%, ${bajada.front.color}ee 50%, ${bajada.front.color}cc 100%)`,
                            boxShadow: `0 10px 25px ${bajada.front.color}60, inset 0 3px 12px rgba(255,255,255,0.3)`
                          } : {}}>

                                {!bajada.front.is_empty &&
                          <>
                                    <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent"
                              animate={{
                                opacity: [0.5, 0.9, 0.5],
                                scale: [1, 1.08, 1]
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />

                                    <motion.div
                              className="absolute top-0 left-0 right-0 h-1/2"
                              style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                                borderRadius: '12px 12px 0 0'
                              }} />

                                    <motion.div
                              className="absolute inset-0"
                              style={{ background: `radial-gradient(circle at 35% 35%, ${bajada.front.color}33 0%, transparent 65%)` }}
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 0.7, 0.4],
                                rotate: [0, 10, 0]
                              }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

                                  </>
                          }
                                <motion.div
                            className="absolute top-0.5 left-0.5 bg-pink-600 text-white text-[6px] px-1.5 py-0.5 rounded-md font-bold z-10 shadow-md"
                            whileHover={{ scale: 1.15 }}>

                                  F
                                </motion.div>
                                {bajada.front.is_empty ?
                          <div className="h-full flex items-center justify-center">
                                    <motion.div
                              animate={{
                                scale: [1, 1.4, 1],
                                rotate: [0, 90, 0]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}>

                                      <Plus className="w-4 h-4 text-pink-400" />
                                    </motion.div>
                                  </div> :

                          <div className="h-full flex items-center justify-center pt-1.5 relative z-10">
                                    <span
                              className="text-[8px] sm:text-[9px] font-black text-center leading-tight px-0.5 line-clamp-2"
                              style={{
                                color: getTextColor(bajada.front.color),
                                textShadow: getTextColor(bajada.front.color) === '#ffffff' ? '0 2px 5px rgba(0,0,0,0.8)' : '0 2px 4px rgba(255,255,255,0.7)',
                                letterSpacing: '-0.02em'
                              }}>

                                      {bajada.front.flavor_name}
                                    </span>
                                  </div>
                          }
                              </motion.div>
                            </motion.div>
                      )}
                        </motion.div>
                      </motion.div>
                  )}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Alertas de Inventario */}
            <InventoryStatusOverview
              allFreezersSlots={allFreezersSlots}
              rotationAnalysis={rotationAnalysis}
            />

            {/* Pronóstico de Pedido - Independiente */}
            <SmartOrderPrediction
              allFreezersSlots={allFreezersSlots}
              currentFreezer={currentFreezer}
              storeCode={selectedStore}
              storeId={selectedStore}
            />


            {/* Info Panel */}
            <div className="mt-4 p-3 bg-white/80 rounded-xl shadow-sm space-y-3">
              {/* Add flavor */}
              <div className="p-2 rounded-lg border border-pink-200 bg-pink-50/50">
                <button onClick={() => setShowAddFlavor(!showAddFlavor)} className="flex items-center gap-2 text-sm font-medium text-pink-700 w-full">
                  <Plus className="w-4 h-4" />
                  Crear Nuevo Sabor
                </button>
                <AnimatePresence>
                  {showAddFlavor &&
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
                        // Crear el nuevo sabor con todas sus propiedades
                        const flavorToAdd = {
                          name: newFlavor.name,
                          color: newFlavor.color,
                          type: newFlavor.line,
                          line: newFlavor.line,
                          dark: ['#3D2314', '#4A2511', '#1A1A1A', '#6F4E37', '#8B4513', '#DC143C', '#E30B5C', '#C71585', '#E31837', '#4169E1', '#7B3F00', '#D70026', '#8B008B', '#6A0DAD'].includes(newFlavor.color)
                        };
                        
                        // Agregar a sabores personalizados
                        const updatedCustomFlavors = [...customFlavors, flavorToAdd];
                        setCustomFlavors(updatedCustomFlavors);
                        
                        // Guardar en localStorage con verificación
                        try {
                          localStorage.setItem('customFlavors', JSON.stringify(updatedCustomFlavors));
                          // Verificar que se guardó correctamente
                          const verification = localStorage.getItem('customFlavors');
                          if (!verification) {
                            throw new Error('No se pudo guardar en localStorage');
                          }
                          toast.success(`✓ Sabor "${newFlavor.name}" guardado permanentemente`);
                        } catch (error) {
                          toast.error('Error al guardar sabor: ' + error.message);
                        }
                        
                        setNewFlavor({ name: '', color: '#FFB5C5', line: 'gourmet' });
                        setShowAddFlavor(false);
                      }
                    }}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                }
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
          </> :

        <div className="text-center py-16">
            <div className="text-6xl mb-4">🧊</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver y editar el mapa de la nevera</p>
          </div>
        }
      </div>

      {/* Flavor Selector Modal with Search */}
      <AnimatePresence>
        {showFlavorSelector &&
        <FlavorSelectorModal
          selectedSlot={selectedSlot}
          onClose={() => {setShowFlavorSelector(false);setSelectedSlot(null);}}
          onSelect={handleFlavorSelect}
          customFlavors={customFlavors} />

        }
      </AnimatePresence>

      {/* Audit Panel */}
      <AnimatePresence>
        {showAudit && <FreezerAuditPanel auditData={auditData} allSlots={slots} onClose={() => setShowAudit(false)} onApplySuggestions={() => toast.info('Sugerencias aplicadas')} onAutoCorrect={optimizeWithAI} isLoading={isOptimizing} />}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && <FreezerHistoryPanel history={history.map((h) => ({ ...h, filledSlots: h.filled_slots, changes: h.changes_count }))} onClose={() => setShowHistory(false)} onRestore={restoreFromHistory} isLoading={false} />}
      </AnimatePresence>
    </div>);

}