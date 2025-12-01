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
                      <div className="p-2 space-y-2">
                        {dayShifts.map((shift, shiftIdx) => {
                          const colors = ROLE_COLORS[shift.role] || ROLE_COLORS.ventas;
                          return (
                            <Draggable key={shift.id} draggableId={shift.id} index={shiftIdx}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`${colors.bg} ${colors.border} border rounded-xl p-2 group cursor-pointer hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                                >
                                  <div className="flex items-start gap-1">
                                    <div {...provided.dragHandleProps} className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <GripVertical className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-medium text-xs truncate ${colors.text}`}>
                                        {shift.cashier_name || 'Sin nombre'}
                                      </p>
                                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {shift.start_time} - {shift.end_time}
                                      </p>
                                      <span className={`text-[9px] ${colors.text} font-medium`}>
                                        {ROLE_LABELS[shift.role] || shift.role}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(shift.id); }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
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
                          className="w-full p-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-pink-300 hover:text-pink-500 transition-all flex items-center justify-center gap-1 text-xs"
                        >
                          <Plus className="w-3 h-3" /> Agregar
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