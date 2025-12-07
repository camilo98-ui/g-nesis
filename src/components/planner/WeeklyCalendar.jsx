import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, isToday, getWeek, eachWeekOfInterval, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Copy, Plus, Clock, Trash2, 
  GripVertical, User, Loader2, Download, Pencil, PartyPopper,
  IceCream, Coffee, Package, Headphones, Cookie, ClipboardList, Sparkles, ShoppingCart, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const HOLIDAYS = [
  '2024-01-01', '2024-01-08', '2024-03-25', '2024-03-28', '2024-03-29',
  '2024-05-01', '2024-05-13', '2024-06-03', '2024-06-10', '2024-07-01',
  '2024-07-20', '2024-08-07', '2024-08-19', '2024-10-14', '2024-11-04',
  '2024-11-11', '2024-12-08', '2024-12-25',
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

// Generador de apodos divertidos basado en el nombre
const generateNickname = (name) => {
  if (!name) return '';
  const firstName = name.split(' ')[0].toLowerCase();
  const nicknames = {
    // Nombres comunes y variaciones
    'maria': ['Mari 🌸', 'Marí la Dulce', 'Mary Pop'],
    'juan': ['Juancho 🎸', 'Juanito Helado', 'El Juanster'],
    'carlos': ['Carlitos 🚀', 'El Crack', 'Charles'],
    'ana': ['Anita ⭐', 'La Ana Banana', 'Anibella'],
    'luis': ['Lucho 💪', 'Luisito Rey', 'El Luigi'],
    'andrea': ['Andy 🎀', 'La Andreita', 'Drea'],
    'david': ['Davi 🎯', 'El Davidón', 'Dave'],
    'laura': ['Lau 🌟', 'Laurita Boom', 'La Lau'],
    'daniel': ['Dani 🔥', 'El Danielito', 'Dan'],
    'sofia': ['Sofi 💖', 'La Sofis', 'Sof'],
    'camilo': ['Cami 🎭', 'El Camilín', 'Cam'],
    'valentina': ['Vale 💫', 'La Valen', 'Tina'],
    'santiago': ['Santi ⚡', 'El Santy', 'Tiago'],
    'natalia': ['Naty 🌺', 'La Nati', 'Nat'],
    'sebastian': ['Sebas 🎪', 'El Seba', 'Sebi'],
    'paola': ['Pao 🦋', 'La Paolita', 'Paolis'],
    'miguel': ['Migue 🎤', 'El Mickey', 'Miguelón'],
    'carolina': ['Caro 🌈', 'La Carito', 'Carol'],
    'andres': ['El Andy 🏆', 'Andresito', 'Dres'],
    'juliana': ['Juli 🍀', 'La Julita', 'Ju'],
    'diego': ['Dieguito 🎨', 'El D', 'Diegón'],
    'paula': ['Pau 💝', 'Paulita', 'Paulis'],
    'felipe': ['Pipe 🎵', 'El Felipe', 'Feli'],
    'monica': ['Moni 🌙', 'La Moniquita', 'Mo'],
    'alejandro': ['Alejo 🔮', 'El Ale', 'Alex'],
    'marcela': ['Marce 🎁', 'La Marcelita', 'Mar'],
    'jorge': ['Jorgito 🎬', 'El George', 'Jor'],
    'diana': ['Di 💎', 'La Dianita', 'Didi'],
    'ricardo': ['Ricky 🎸', 'El Ricar', 'Rico'],
    'claudia': ['Clau 🦄', 'La Claudis', 'Claud'],
  };
  
  // Buscar coincidencia exacta o parcial
  for (const [key, values] of Object.entries(nicknames)) {
    if (firstName.includes(key) || key.includes(firstName.slice(0, 3))) {
      return values[Math.floor(Math.random() * values.length)];
    }
  }
  
  // Generar apodo genérico basado en la primera letra
  const funSuffixes = ['⭐', '🚀', '💫', '🎯', '🔥', '💪', '🌟', '✨', '🎭', '🏆'];
  const suffix = funSuffixes[firstName.charCodeAt(0) % funSuffixes.length];
  const shortName = firstName.charAt(0).toUpperCase() + firstName.slice(1, 4);
  return `${shortName} ${suffix}`;
};

import { Moon } from 'lucide-react';

const ROLES_CONFIG = {
  caja: { label: 'Caja', icon: ShoppingCart, bg: 'bg-gradient-to-br from-emerald-50 to-green-100', text: 'text-emerald-600', border: 'border-emerald-200', header: 'bg-gradient-to-r from-emerald-400 to-green-400', priority: 1 },
  coneo: { label: 'Coneo', icon: IceCream, bg: 'bg-gradient-to-br from-pink-50 to-rose-100', text: 'text-pink-600', border: 'border-pink-200', header: 'bg-gradient-to-r from-pink-400 to-rose-400', priority: 1 },
  bebidas: { label: 'Bebidas', icon: Coffee, bg: 'bg-gradient-to-br from-amber-50 to-orange-100', text: 'text-amber-600', border: 'border-amber-200', header: 'bg-gradient-to-r from-amber-400 to-orange-400', priority: 2 },
  especialidades: { label: 'Especialidades', icon: Sparkles, bg: 'bg-gradient-to-br from-violet-50 to-purple-100', text: 'text-violet-600', border: 'border-violet-200', header: 'bg-gradient-to-r from-violet-400 to-purple-400', priority: 2 },
  coordinacion: { label: 'Coord. Entregas', icon: ClipboardList, bg: 'bg-gradient-to-br from-blue-50 to-sky-100', text: 'text-blue-600', border: 'border-blue-200', header: 'bg-gradient-to-r from-blue-400 to-sky-400', priority: 3 },
  cookie_jar: { label: 'Cookie Jar', icon: Cookie, bg: 'bg-gradient-to-br from-orange-50 to-amber-100', text: 'text-orange-600', border: 'border-orange-200', header: 'bg-gradient-to-r from-orange-400 to-amber-400', priority: 3 },
  stocker: { label: 'Stocker', icon: Package, bg: 'bg-gradient-to-br from-slate-50 to-gray-100', text: 'text-slate-600', border: 'border-slate-200', header: 'bg-gradient-to-r from-slate-400 to-gray-400', priority: 3 },
  toma_pedidos: { label: 'Toma Pedidos', icon: Headphones, bg: 'bg-gradient-to-br from-cyan-50 to-teal-100', text: 'text-cyan-600', border: 'border-cyan-200', header: 'bg-gradient-to-r from-cyan-400 to-teal-400', priority: 3 },
  experiencia: { label: 'Experiencia', icon: Crown, bg: 'bg-gradient-to-br from-yellow-50 to-amber-100', text: 'text-yellow-600', border: 'border-yellow-200', header: 'bg-gradient-to-r from-yellow-400 to-amber-400', priority: 3 },
  descanso: { label: '😴 Descanso', icon: Moon, bg: 'bg-gradient-to-br from-indigo-100 to-purple-200', text: 'text-indigo-600', border: 'border-indigo-300', header: 'bg-gradient-to-r from-indigo-500 to-purple-500', priority: 0 },
};

// Decoraciones de helados para las tarjetas - ahora en BLANCO para contraste
const IceCreamDecorations = () => (
  <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
    <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
      {/* Cono pequeño */}
      <circle cx="8" cy="8" r="4" fill="white" opacity="0.2" />
      <polygon points="5,10 8,20 11,10" fill="white" opacity="0.15" />
      {/* Estrellas/Sparkles */}
      <path d="M25 6 L26 9 L29 9 L27 11 L28 14 L25 12 L22 14 L23 11 L21 9 L24 9 Z" fill="white" opacity="0.2" />
      {/* Malteada */}
      <rect x="40" y="5" width="8" height="14" rx="2" fill="white" opacity="0.15" />
      <ellipse cx="44" cy="5" rx="5" ry="3" fill="white" opacity="0.2" />
      {/* Cherry */}
      <circle cx="60" cy="10" r="3" fill="white" opacity="0.2" />
      <path d="M60 7 Q63 4 65 6" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
      {/* Helado copa */}
      <ellipse cx="80" cy="16" rx="7" ry="4" fill="white" opacity="0.12" />
      <circle cx="77" cy="10" r="4" fill="white" opacity="0.15" />
      <circle cx="83" cy="10" r="4" fill="white" opacity="0.15" />
      {/* Corazón */}
      <path d="M100 12 C100 8 104 8 104 12 C104 8 108 8 108 12 C108 16 104 20 104 20 C104 20 100 16 100 12" fill="white" opacity="0.15" />
      {/* Popsicle */}
      <rect x="5" y="25" width="6" height="10" rx="2" fill="white" opacity="0.12" />
      <rect x="7" y="33" width="2" height="4" fill="white" opacity="0.1" />
      {/* Sprinkles */}
      <rect x="35" y="28" width="3" height="1" rx="0.5" fill="white" opacity="0.2" transform="rotate(30 36 28)" />
      <rect x="45" y="32" width="3" height="1" rx="0.5" fill="white" opacity="0.2" transform="rotate(-20 46 32)" />
      <rect x="70" y="28" width="3" height="1" rx="0.5" fill="white" opacity="0.2" transform="rotate(45 71 28)" />
      <rect x="90" y="30" width="3" height="1" rx="0.5" fill="white" opacity="0.2" transform="rotate(-30 91 30)" />
      {/* Donut */}
      <circle cx="115" cy="30" r="5" fill="white" opacity="0.12" />
      <circle cx="115" cy="30" r="2" fill="none" stroke="white" strokeWidth="1" opacity="0.1" />
    </svg>
  </div>
);

export default function WeeklyCalendar({ 
  currentWeek, setCurrentWeek, weekDays, shifts, cashiers, storeId, loading, onExportPDF, readOnly = false 
}) {
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [newShift, setNewShift] = useState({ cashier_id: '', start_time: '09:30', end_time: '17:30', role: 'caja' });
  const [copying, setCopying] = useState(false);
  const queryClient = useQueryClient();

  const yearWeeks = useMemo(() => {
    const start = startOfYear(currentWeek);
    const end = endOfYear(currentWeek);
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(week => ({
      week,
      number: getWeek(week, { weekStartsOn: 1 }),
      label: `Sem ${getWeek(week, { weekStartsOn: 1 })} - ${format(week, "d MMM", { locale: es })}`
    }));
  }, [currentWeek]);

  const currentWeekNumber = getWeek(currentWeek, { weekStartsOn: 1 });

  const createMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddShift(false);
      setEditingShift(null);
      resetForm();
      toast.success('Turno guardado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddShift(false);
      setEditingShift(null);
      resetForm();
      toast.success('Turno actualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno eliminado');
    }
  });

  const resetForm = () => setNewShift({ cashier_id: '', start_time: '09:30', end_time: '17:30', role: 'caja' });

  // Ordenar roles por prioridad para el selector
  const sortedRoles = Object.entries(ROLES_CONFIG).sort((a, b) => {
    if (a[0] === 'descanso') return 1;
    if (b[0] === 'descanso') return -1;
    return (a[1].priority || 9) - (b[1].priority || 9);
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;
    updateMutation.mutate({ id: result.draggableId, data: { date: result.destination.droppableId } });
    toast.success('Turno movido');
  };

  const handleSaveShift = () => {
    if (!newShift.cashier_id) return toast.error('Selecciona un colaborador');
    const cashier = cashiers.find(c => c.id === newShift.cashier_id);
    const isRest = newShift.role === 'descanso';
    const shiftData = {
      store_id: storeId,
      cashier_id: newShift.cashier_id,
      cashier_name: cashier?.name || '',
      date: editingShift ? editingShift.date : format(selectedDay, 'yyyy-MM-dd'),
      start_time: isRest ? '00:00' : newShift.start_time,
      end_time: isRest ? '00:00' : newShift.end_time,
      role: newShift.role,
      status: 'scheduled'
    };
    
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data: shiftData });
    } else {
      createMutation.mutate(shiftData);
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setNewShift({ cashier_id: shift.cashier_id, start_time: shift.start_time, end_time: shift.end_time, role: shift.role });
    setShowAddShift(true);
  };

  const copyWeek = async () => {
    setCopying(true);
    const nextWeek = addWeeks(currentWeek, 1);
    for (const shift of shifts) {
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay();
      const newDate = new Date(nextWeek);
      newDate.setDate(nextWeek.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      await base44.entities.Shift.create({
        store_id: storeId, cashier_id: shift.cashier_id, cashier_name: shift.cashier_name,
        date: format(newDate, 'yyyy-MM-dd'), start_time: shift.start_time, end_time: shift.end_time,
        role: shift.role, status: 'scheduled'
      });
    }
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    toast.success(`${shifts.length} turnos copiados`);
    setCopying(false);
  };

  const getShiftsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter(s => (s.date?.split('T')[0] || s.date) === dayStr);
  };

  const isHoliday = (day) => HOLIDAYS.includes(format(day, 'yyyy-MM-dd'));

  const getRoleColor = (role) => {
    const colors = {
      caja: '#10b981', coneo: '#ec4899', bebidas: '#f59e0b', especialidades: '#8b5cf6',
      coordinacion: '#3b82f6', cookie_jar: '#f97316', stocker: '#64748b', toma_pedidos: '#06b6d4', experiencia: '#eab308'
    };
    return colors[role] || '#ec4899';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header - Optimizado para móvil */}
      <div className="p-2 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-rose-400 to-pink-400">
        {/* Navegación de semanas - MEJORADA */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} 
            className="text-white hover:bg-white/20 h-10 px-3"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex-1 text-center text-white">
            <p className="text-xs sm:text-sm opacity-90 font-medium">Semana {currentWeekNumber}</p>
            <h2 className="font-bold text-base sm:text-lg leading-tight">
              {format(currentWeek, "d MMM", { locale: es })} - {format(weekDays[6], "d MMM yyyy", { locale: es })}
            </h2>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} 
            className="text-white hover:bg-white/20 h-10 px-3"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Acciones - Grid responsive */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          <Select value={currentWeekNumber.toString()} onValueChange={(v) => {
            const selected = yearWeeks.find(w => w.number.toString() === v);
            if (selected) setCurrentWeek(selected.week);
          }}>
            <SelectTrigger className="bg-white/20 border-white/30 text-white text-xs h-9 col-span-2 sm:col-span-1 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{yearWeeks.map(w => <SelectItem key={w.number} value={w.number.toString()}>{w.label}</SelectItem>)}</SelectContent>
          </Select>
          {!readOnly && (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copyWeek} 
                disabled={copying || !shifts.length} 
                className="bg-white/20 text-white hover:bg-white/30 border-0 h-9 text-xs"
              >
                {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1.5 sm:ml-2">Copiar</span>
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  if (confirm('¿Borrar todos los turnos de esta semana?')) {
                    for (const shift of shifts) {
                      await base44.entities.Shift.delete(shift.id);
                    }
                    queryClient.invalidateQueries({ queryKey: ['shifts'] });
                    toast.success('Semana borrada');
                  }
                }}
                disabled={!shifts.length}
                className="bg-red-500/20 text-white hover:bg-red-500/30 border-0 h-9 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span className="ml-1.5 sm:ml-2">Borrar</span>
              </Button>
            </>
          )}
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onExportPDF} 
            className="bg-white text-pink-500 hover:bg-pink-50 h-9 text-xs col-span-2 sm:col-span-1"
          >
            <Download className="w-4 h-4" />
            <span className="ml-1.5 sm:ml-2">Exportar PDF</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid - OPTIMIZADO para móvil */}
      {loading ? (
        <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto" /></div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 divide-x divide-gray-100 overflow-x-auto touch-pan-x">
            {weekDays.map((day, idx) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentDay = isToday(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              const isHovered = hoveredDay === idx;
              const holiday = isHoliday(day);
              
              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onMouseEnter={() => setHoveredDay(idx)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`min-h-[400px] sm:min-h-[380px] min-w-[110px] sm:min-w-[140px] transition-all relative ${snapshot.isDraggingOver ? 'bg-pink-50/50' : ''} ${isCurrentDay ? 'bg-rose-50/30' : isHovered ? 'bg-gray-50/30' : 'bg-white'} ${holiday ? 'bg-gradient-to-b from-amber-50/50 to-orange-50/30' : ''}`}
                    >
                      {/* Day Header - Mejorado para móvil */}
                      <div className={`p-2 sm:p-2 text-center border-b sticky top-0 z-10 ${isCurrentDay ? 'bg-gradient-to-r from-rose-300 to-pink-300 text-white shadow-md' : holiday ? 'bg-gradient-to-r from-amber-300 to-orange-300 text-white' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isCurrentDay || holiday ? 'text-white/90' : 'text-gray-400'}`}>
                          {format(day, 'EEE', { locale: es })}
                        </p>
                        <p className={`text-2xl sm:text-xl font-black ${isCurrentDay || holiday ? 'text-white' : 'text-gray-700'}`}>{format(day, 'd')}</p>
                        {holiday && (
                          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity }} className="flex items-center justify-center gap-1 text-[10px] text-white/90 mt-0.5">
                            <PartyPopper className="w-3 h-3" /> Festivo
                          </motion.div>
                        )}
                        <p className={`text-[10px] sm:text-[9px] font-medium mt-1 ${isCurrentDay || holiday ? 'text-white/80' : 'text-gray-500'}`}>
                          {dayShifts.length} turno{dayShifts.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Shifts - OPTIMIZADO para móvil */}
                      <div className="p-1.5 sm:p-1.5 space-y-2 sm:space-y-1.5">
                        <AnimatePresence>
                          {dayShifts.map((shift, shiftIdx) => {
                            const role = ROLES_CONFIG[shift.role] || ROLES_CONFIG.caja;
                            const RoleIcon = role.icon;
                            const [startH, startM] = (shift.start_time || '09:30').split(':').map(Number);
                            const [endH, endM] = (shift.end_time || '17:30').split(':').map(Number);
                            const duration = ((endH + endM/60) - (startH + startM/60)).toFixed(1);
                            
                            return (
                              <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => !readOnly && handleEditShift(shift)}
                                    className={`rounded-xl overflow-hidden border-2 ${role.border} ${role.bg} shadow-md active:shadow-lg transition-all cursor-pointer relative ${snapshot.isDragging ? 'shadow-2xl scale-105' : ''}`}
                                  >
                                    {/* Role Header - Más grande en móvil */}
                                    <div className={`${role.header} px-2 py-1.5 sm:py-1.5 flex items-center justify-between relative overflow-hidden`}>
                                     <IceCreamDecorations />
                                     <div className="flex items-center gap-1.5 sm:gap-1.5 relative z-10">
                                       <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                         <RoleIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white drop-shadow-sm" />
                                       </motion.div>
                                       <span className="text-[11px] sm:text-[10px] font-bold text-white drop-shadow-sm">{role.label}</span>
                                     </div>
                                     <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing relative z-10 p-1 touch-manipulation">
                                       <GripVertical className="w-4 h-4 sm:w-3 sm:h-3 text-white/70" />
                                     </div>
                                    </div>

                                    {/* Content - Más espacioso en móvil */}
                                    <div className="p-2 sm:p-2 pt-2 sm:pt-2.5">
                                     <p className="font-bold text-[11px] sm:text-sm text-gray-700 truncate leading-tight mb-1.5">{shift.cashier_name || 'Sin asignar'}</p>
                                      {shift.role === 'descanso' ? (
                                        <div className="flex items-center justify-center bg-indigo-100/50 rounded px-2 py-1.5">
                                          <span className="text-[11px] sm:text-xs font-medium text-indigo-600">😴 Día libre</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between bg-white/80 rounded-lg px-2 py-1.5">
                                          <div className="flex items-center gap-1">
                                            <Clock className={`w-3.5 h-3.5 sm:w-3 sm:h-3 ${role.text}`} />
                                            <span className="text-[11px] sm:text-xs font-bold text-gray-700">{shift.start_time} - {shift.end_time}</span>
                                          </div>
                                          <span className={`text-[10px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${role.text} bg-white/60`}>{duration}h</span>
                                        </div>
                                      )}
                                      {!readOnly && (
                                        <div className="flex justify-end gap-1 mt-2 sm:mt-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                          <motion.button 
                                            whileTap={{ scale: 0.9 }} 
                                            onClick={(e) => { e.stopPropagation(); handleEditShift(shift); }} 
                                            className="p-1.5 sm:p-1 rounded-lg bg-blue-100 active:bg-blue-200 touch-manipulation"
                                          >
                                            <Pencil className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-blue-600" />
                                          </motion.button>
                                          <motion.button 
                                            whileTap={{ scale: 0.9 }} 
                                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(shift.id); }} 
                                            className="p-1.5 sm:p-1 rounded-lg bg-red-100 active:bg-red-200 touch-manipulation"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-red-600" />
                                          </motion.button>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </Draggable>
                            );
                          })}
                        </AnimatePresence>
                        {provided.placeholder}
                        
                        {!readOnly && (
                          <motion.button 
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedDay(day); setEditingShift(null); resetForm(); setShowAddShift(true); }}
                            className={`w-full py-3 sm:py-2 border-2 border-dashed rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation ${isHovered ? 'border-pink-400 text-pink-500 bg-pink-50/50' : 'border-gray-300 text-gray-500 active:border-pink-300 active:bg-pink-50/30'}`}
                          >
                            <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> 
                            <span>Agregar turno</span>
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Add/Edit Dialog - OPTIMIZADO para móvil */}
      <Dialog open={showAddShift} onOpenChange={(v) => { setShowAddShift(v); if (!v) setEditingShift(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-9 h-9 sm:w-8 sm:h-8 bg-gradient-to-r from-pink-300 to-rose-300 rounded-xl flex items-center justify-center flex-shrink-0">
                {editingShift ? <Pencil className="w-5 h-5 sm:w-4 sm:h-4 text-white" /> : <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-white" />}
              </div>
              <span className="leading-tight">
                {editingShift ? 'Editar Turno' : `Agregar Turno`}
                {selectedDay && <span className="block text-xs text-gray-500 font-normal">{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</span>}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Colaborador */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Colaborador</label>
              <Select value={newShift.cashier_id} onValueChange={(v) => setNewShift({ ...newShift, cashier_id: v })}>
                <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Seleccionar colaborador" /></SelectTrigger>
                <SelectContent>
                  {cashiers.map(c => (
                    <SelectItem key={c.id} value={c.id} className="h-12">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-base">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horario */}
            {newShift.role !== 'descanso' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Hora inicio</label>
                  <Input 
                    type="time" 
                    value={newShift.start_time} 
                    onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} 
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Hora fin</label>
                  <Input 
                    type="time" 
                    value={newShift.end_time} 
                    onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} 
                    className="h-12 text-base"
                  />
                </div>
              </div>
            )}
            {newShift.role === 'descanso' && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl text-center border-2 border-indigo-200">
                <p className="text-base text-indigo-700 font-bold">😴 Día de descanso</p>
                <p className="text-sm text-indigo-600">Sin horario de trabajo</p>
              </div>
            )}

            {/* Posición */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Posición de trabajo</label>
              <div className="grid grid-cols-3 gap-2.5">
                {sortedRoles.map(([key, config]) => {
                  const RoleIcon = config.icon;
                  const isSelected = newShift.role === key;
                  const isRest = key === 'descanso';
                  return (
                    <motion.button 
                      key={key} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => setNewShift({ ...newShift, role: key })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 touch-manipulation ${isSelected ? `${config.bg} ${config.border} shadow-lg scale-105` : 'border-gray-200 hover:border-gray-300 bg-white'} ${isRest ? 'col-span-3 bg-gradient-to-r from-indigo-50 to-purple-50' : ''}`}
                    >
                      <RoleIcon className={`w-6 h-6 ${isSelected ? config.text : 'text-gray-400'}`} />
                      <span className={`text-[11px] font-bold leading-tight text-center ${isSelected ? config.text : 'text-gray-600'}`}>{config.label}</span>
                      {config.priority === 1 && !isRest && <span className="text-[8px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">CRÍTICO</span>}
                      {config.priority === 2 && <span className="text-[8px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded">IMPORTANTE</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowAddShift(false)}
              className="flex-1 h-12 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveShift} 
              disabled={!newShift.cashier_id || createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {editingShift ? '✓ Guardar cambios' : '+ Crear turno'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ROLES_CONFIG };