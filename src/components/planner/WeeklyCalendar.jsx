import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Copy, Plus, Clock, X, Trash2, 
  GripVertical, User, Loader2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ROLE_COLORS = {
  ventas: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  limpieza: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
  administrador: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  apoyo: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  entrenamiento: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
};

const ROLE_LABELS = {
  ventas: 'Ventas',
  limpieza: 'Limpieza',
  administrador: 'Admin',
  apoyo: 'Apoyo',
  entrenamiento: 'Entreno'
};

export default function WeeklyCalendar({ 
  currentWeek, setCurrentWeek, weekDays, shifts, cashiers, storeId, loading 
}) {
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newShift, setNewShift] = useState({
    cashier_id: '',
    start_time: '08:00',
    end_time: '16:00',
    role: 'ventas'
  });
  const [copying, setCopying] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddShift(false);
      setNewShift({ cashier_id: '', start_time: '08:00', end_time: '16:00', role: 'ventas' });
      toast.success('Turno creado exitosamente');
    },
    onError: (error) => {
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

  const getShiftsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter(s => {
      const shiftDateStr = s.date?.split('T')[0] || s.date;
      return shiftDateStr === dayStr;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 to-rose-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-gray-800">
            {format(currentWeek, "d 'de' MMMM", { locale: es })} - {format(weekDays[6], "d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyWeek}
            disabled={copying || shifts.length === 0}
            className="gap-2"
          >
            {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copiar semana
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
              
              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] ${snapshot.isDraggingOver ? 'bg-pink-50' : ''} ${isCurrentDay ? 'bg-rose-50/50' : ''}`}
                    >
                      {/* Day Header */}
                      <div className={`p-2 text-center border-b ${isCurrentDay ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gray-50'}`}>
                        <p className="text-xs font-medium uppercase">
                          {format(day, 'EEE', { locale: es })}
                        </p>
                        <p className={`text-lg font-bold ${isCurrentDay ? '' : 'text-gray-800'}`}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      {/* Shifts */}
                      <div className="p-1 space-y-1">
                        {dayShifts.map((shift, shiftIdx) => {
                          const colors = ROLE_COLORS[shift.role] || ROLE_COLORS.ventas;
                          const [startH, startM] = (shift.start_time || '08:00').split(':').map(Number);
                          const [endH, endM] = (shift.end_time || '16:00').split(':').map(Number);
                          const duration = (endH + endM/60) - (startH + startM/60);
                          
                          return (
                            <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  className={`rounded-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-all ${snapshot.isDragging ? 'shadow-2xl scale-105 z-50' : 'shadow-sm'}`}
                                >
                                  {/* Header con Posición/Rol */}
                                  <div className={`${colors.bg} px-2 py-1 flex items-center justify-between`}>
                                    <span className={`text-[10px] font-bold ${colors.text} uppercase tracking-wide`}>
                                      📍 {ROLE_LABELS[shift.role] || shift.role}
                                    </span>
                                    <div {...provided.dragHandleProps} className="opacity-50 group-hover:opacity-100">
                                      <GripVertical className="w-3 h-3 text-gray-500" />
                                    </div>
                                  </div>
                                  
                                  {/* Body */}
                                  <div className={`bg-white border-x border-b ${colors.border} p-2`}>
                                    {/* Colaborador */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`w-7 h-7 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-sm`}>
                                        <span className={`text-xs font-bold ${colors.text}`}>
                                          {shift.cashier_name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-gray-800 truncate">
                                          {shift.cashier_name || 'Sin asignar'}
                                        </p>
                                        <p className="text-[9px] text-gray-400">Colaborador</p>
                                      </div>
                                    </div>
                                    
                                    {/* Horario destacado */}
                                    <div className={`${colors.bg} rounded-lg p-1.5 mb-1.5`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                          <Clock className={`w-3.5 h-3.5 ${colors.text}`} />
                                          <span className={`text-sm font-bold ${colors.text}`}>
                                            {shift.start_time}
                                          </span>
                                          <span className="text-gray-400 text-xs">→</span>
                                          <span className={`text-sm font-bold ${colors.text}`}>
                                            {shift.end_time}
                                          </span>
                                        </div>
                                        <span className={`text-[10px] font-semibold ${colors.text} bg-white/60 px-1.5 py-0.5 rounded`}>
                                          {duration.toFixed(1)}h
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Delete */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(shift.id); }}
                                      className="w-full opacity-0 group-hover:opacity-100 transition-all text-[9px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded py-0.5 flex items-center justify-center gap-1"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" /> Eliminar
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        
                        {/* Add Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedDay(day); setShowAddShift(true); }}
                          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50 transition-all flex items-center justify-center gap-1 text-xs font-medium"
                        >
                          <Plus className="w-4 h-4" /> Turno
                        </motion.button>
                      </div>
                    </div>
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
              <Plus className="w-5 h-5 text-pink-500" />
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rol</label>
              <Select value={newShift.role} onValueChange={(v) => setNewShift({ ...newShift, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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