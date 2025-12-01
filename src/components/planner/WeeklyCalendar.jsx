import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Copy, Plus, Clock, Trash2, 
  GripVertical, User, Loader2, Download, Heart, ThumbsUp, Star,
  IceCream, Coffee, Package, Headphones, Cookie, ClipboardList, Sparkles, ShoppingCart, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Nuevos roles con iconos y colores
const ROLES_CONFIG = {
  caja: { 
    label: 'Caja', 
    icon: ShoppingCart, 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-400',
    gradient: 'from-emerald-400 to-green-500'
  },
  coneo: { 
    label: 'Coneo', 
    icon: IceCream, 
    bg: 'bg-pink-100', 
    text: 'text-pink-700', 
    border: 'border-pink-400',
    gradient: 'from-pink-400 to-rose-500'
  },
  bebidas: { 
    label: 'Bebidas', 
    icon: Coffee, 
    bg: 'bg-amber-100', 
    text: 'text-amber-700', 
    border: 'border-amber-400',
    gradient: 'from-amber-400 to-orange-500'
  },
  especialidades: { 
    label: 'Especialidades', 
    icon: Sparkles, 
    bg: 'bg-violet-100', 
    text: 'text-violet-700', 
    border: 'border-violet-400',
    gradient: 'from-violet-400 to-purple-500'
  },
  coordinacion: { 
    label: 'Coord. Entregas', 
    icon: ClipboardList, 
    bg: 'bg-blue-100', 
    text: 'text-blue-700', 
    border: 'border-blue-400',
    gradient: 'from-blue-400 to-indigo-500'
  },
  cookie_jar: { 
    label: 'Cookie Jar', 
    icon: Cookie, 
    bg: 'bg-orange-100', 
    text: 'text-orange-700', 
    border: 'border-orange-400',
    gradient: 'from-orange-400 to-red-500'
  },
  stocker: { 
    label: 'Stocker', 
    icon: Package, 
    bg: 'bg-slate-100', 
    text: 'text-slate-700', 
    border: 'border-slate-400',
    gradient: 'from-slate-400 to-gray-500'
  },
  toma_pedidos: { 
    label: 'Toma de Pedidos', 
    icon: Headphones, 
    bg: 'bg-cyan-100', 
    text: 'text-cyan-700', 
    border: 'border-cyan-400',
    gradient: 'from-cyan-400 to-teal-500'
  },
  experiencia: { 
    label: 'Experiencia', 
    icon: Crown, 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700', 
    border: 'border-yellow-500',
    gradient: 'from-yellow-400 to-amber-500'
  },
};

export default function WeeklyCalendar({ 
  currentWeek, setCurrentWeek, weekDays, shifts, cashiers, storeId, loading, onExportPDF 
}) {
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [newShift, setNewShift] = useState({
    cashier_id: '',
    start_time: '08:00',
    end_time: '16:00',
    role: 'caja'
  });
  const [copying, setCopying] = useState(false);
  const queryClient = useQueryClient();
  const calendarRef = useRef(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.Shift.create(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['shifts'] });
      }, 500);
      setShowAddShift(false);
      setNewShift({ cashier_id: '', start_time: '08:00', end_time: '16:00', role: 'caja' });
      toast.success('Turno creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating shift:', error);
      toast.error('Error al crear turno: ' + (error.message || 'Intenta de nuevo'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno eliminado');
    }
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const shiftId = result.draggableId;
    const newDate = result.destination.droppableId;
    
    if (result.source.droppableId !== newDate) {
      updateMutation.mutate({ id: shiftId, data: { date: newDate } });
      toast.success('Turno movido');
    }
  };

  const handleAddShift = () => {
    if (!newShift.cashier_id || !selectedDay) {
      toast.error('Selecciona un colaborador');
      return;
    }
    
    const cashier = cashiers.find(c => c.id === newShift.cashier_id);
    const shiftData = {
      store_id: storeId,
      cashier_id: newShift.cashier_id,
      cashier_name: cashier?.name || '',
      date: format(selectedDay, 'yyyy-MM-dd'),
      start_time: newShift.start_time,
      end_time: newShift.end_time,
      role: newShift.role,
      status: 'scheduled'
    };
    
    createMutation.mutate(shiftData);
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
        store_id: storeId,
        cashier_id: shift.cashier_id,
        cashier_name: shift.cashier_name,
        date: format(newDate, 'yyyy-MM-dd'),
        start_time: shift.start_time,
        end_time: shift.end_time,
        role: shift.role,
        status: 'scheduled'
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    toast.success(`${shifts.length} turnos copiados a la próxima semana`);
    setCopying(false);
  };

  const handleReaction = async (shiftId, reaction) => {
    await updateMutation.mutateAsync({ 
      id: shiftId, 
      data: { reaction, reaction_date: new Date().toISOString() } 
    });
    toast.success('¡Reacción guardada!');
  };

  const getShiftsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter(s => {
      const shiftDateStr = s.date?.split('T')[0] || s.date;
      return shiftDateStr === dayStr;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" ref={calendarRef}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-500">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-white hover:bg-white/20">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-bold text-white text-lg">
            {format(currentWeek, "d 'de' MMMM", { locale: es })} - {format(weekDays[6], "d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-white hover:bg-white/20">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyWeek}
            disabled={copying || shifts.length === 0}
            className="gap-2 bg-white/20 text-white hover:bg-white/30 border-0"
          >
            {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copiar semana
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportPDF}
            className="gap-2 bg-white text-pink-600 hover:bg-pink-50"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {weekDays.map((day, idx) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentDay = isToday(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              const isHovered = hoveredDay === idx;
              
              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onMouseEnter={() => setHoveredDay(idx)}
                      onMouseLeave={() => setHoveredDay(null)}
                      animate={{ 
                        scale: isHovered ? 1.02 : 1,
                        zIndex: isHovered ? 10 : 1
                      }}
                      className={`min-h-[450px] transition-all relative ${snapshot.isDraggingOver ? 'bg-pink-50' : ''} ${isCurrentDay ? 'bg-gradient-to-b from-rose-50 to-pink-50' : isHovered ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      {/* Day Header */}
                      <div className={`p-3 text-center border-b sticky top-0 z-10 ${isCurrentDay ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : isHovered ? 'bg-gradient-to-r from-violet-100 to-purple-100' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isCurrentDay ? 'text-white/80' : 'text-gray-500'}`}>
                          {format(day, 'EEEE', { locale: es })}
                        </p>
                        <p className={`text-2xl font-black ${isCurrentDay ? 'text-white' : 'text-gray-800'}`}>
                          {format(day, 'd')}
                        </p>
                        <p className={`text-[10px] ${isCurrentDay ? 'text-white/70' : 'text-gray-400'}`}>
                          {dayShifts.length} turno{dayShifts.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Shifts */}
                      <div className="p-2 space-y-2">
                        <AnimatePresence>
                          {dayShifts.map((shift, shiftIdx) => {
                            const roleConfig = ROLES_CONFIG[shift.role] || ROLES_CONFIG.caja;
                            const RoleIcon = roleConfig.icon;
                            const [startH, startM] = (shift.start_time || '08:00').split(':').map(Number);
                            const [endH, endM] = (shift.end_time || '16:00').split(':').map(Number);
                            const duration = (endH + endM/60) - (startH + startM/60);
                            
                            return (
                              <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    className={`rounded-xl overflow-hidden group cursor-pointer transition-all shadow-md hover:shadow-xl ${snapshot.isDragging ? 'shadow-2xl scale-105 z-50 rotate-2' : ''}`}
                                  >
                                    {/* Header con gradiente del rol */}
                                    <div className={`bg-gradient-to-r ${roleConfig.gradient} p-2 flex items-center justify-between`}>
                                      <div className="flex items-center gap-2">
                                        <motion.div
                                          animate={{ rotate: [0, 10, -10, 0] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                          className="w-6 h-6 bg-white/30 rounded-lg flex items-center justify-center"
                                        >
                                          <RoleIcon className="w-4 h-4 text-white" />
                                        </motion.div>
                                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                                          {roleConfig.label}
                                        </span>
                                      </div>
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-white/60" />
                                      </div>
                                    </div>
                                    
                                    {/* Body */}
                                    <div className={`${roleConfig.bg} p-2`}>
                                      {/* Colaborador */}
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center shadow-md`}>
                                          <span className="text-sm font-bold text-white">
                                            {shift.cashier_name?.charAt(0)?.toUpperCase() || '?'}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-sm text-gray-800 truncate">
                                            {shift.cashier_name || 'Sin asignar'}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {/* Horario */}
                                      <div className="bg-white/60 rounded-lg p-2 mb-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <Clock className={`w-4 h-4 ${roleConfig.text}`} />
                                            <span className={`text-base font-black ${roleConfig.text}`}>
                                              {shift.start_time}
                                            </span>
                                            <span className="text-gray-400 mx-1">→</span>
                                            <span className={`text-base font-black ${roleConfig.text}`}>
                                              {shift.end_time}
                                            </span>
                                          </div>
                                          <span className={`text-xs font-bold ${roleConfig.text} bg-white px-2 py-0.5 rounded-full shadow-sm`}>
                                            {duration.toFixed(1)}h
                                          </span>
                                        </div>
                                      </div>

                                      {/* Reacciones */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                          {[
                                            { icon: ThumbsUp, emoji: '👍' },
                                            { icon: Heart, emoji: '❤️' },
                                            { icon: Star, emoji: '⭐' }
                                          ].map((r, i) => (
                                            <motion.button
                                              key={i}
                                              whileHover={{ scale: 1.2 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => { e.stopPropagation(); handleReaction(shift.id, r.emoji); }}
                                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${shift.reaction === r.emoji ? 'bg-yellow-200 shadow-md' : 'bg-white/80 hover:bg-white'}`}
                                            >
                                              {r.emoji}
                                            </motion.button>
                                          ))}
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(shift.id); }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                      </div>

                                      {/* Indicador de visto */}
                                      {shift.reaction && (
                                        <motion.div 
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="mt-1 text-[10px] text-center text-gray-500 bg-white/50 rounded-full py-0.5"
                                        >
                                          ✅ Visto
                                        </motion.div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </Draggable>
                            );
                          })}
                        </AnimatePresence>
                        {provided.placeholder}
                        
                        {/* Add Button */}
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedDay(day); setShowAddShift(true); }}
                          className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isHovered ? 'border-pink-400 text-pink-500 bg-pink-50' : 'border-gray-200 text-gray-400 hover:border-pink-300 hover:text-pink-500'}`}
                        >
                          <Plus className="w-5 h-5" /> Agregar Turno
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Add Shift Dialog */}
      <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Agregar Turno - {selectedDay && format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Colaborador</label>
              <Select value={newShift.cashier_id} onValueChange={(v) => setNewShift({ ...newShift, cashier_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {cashiers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Hora inicio</label>
                <Input 
                  type="time" 
                  value={newShift.start_time}
                  onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Hora fin</label>
                <Input 
                  type="time" 
                  value={newShift.end_time}
                  onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rol / Posición</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ROLES_CONFIG).map(([key, config]) => {
                  const RoleIcon = config.icon;
                  const isSelected = newShift.role === key;
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewShift({ ...newShift, role: key })}
                      className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? `${config.bg} ${config.border} shadow-md` : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <RoleIcon className={`w-5 h-5 ${isSelected ? config.text : 'text-gray-400'}`} />
                      <span className={`text-[10px] font-medium ${isSelected ? config.text : 'text-gray-500'}`}>
                        {config.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddShift(false)}>Cancelar</Button>
            <Button 
              onClick={handleAddShift}
              disabled={!newShift.cashier_id || createMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Turno
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ROLES_CONFIG };