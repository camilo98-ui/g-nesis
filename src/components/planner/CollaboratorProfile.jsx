import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isFuture, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  X, Clock, Calendar, CheckCircle2, AlertCircle, Send, 
  User, Mail, Phone, MapPin, LogIn, LogOut, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CollaboratorProfile({ cashier, shifts, storeId, onClose }) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState('day_off');
  const [requestReason, setRequestReason] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const queryClient = useQueryClient();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const todayShifts = shifts.filter(s => isToday(new Date(s.date)));
  const weekShifts = shifts.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const futureShifts = shifts.filter(s => isFuture(new Date(s.date))).slice(0, 5);

  // Calculate hours this week
  let weekHours = 0;
  weekShifts.forEach(s => {
    if (s.start_time && s.end_time) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      weekHours += (eh + em/60) - (sh + sm/60);
    }
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id, type }) => {
      const now = format(new Date(), 'HH:mm');
      return base44.entities.Shift.update(id, type === 'in' ? { check_in: now, status: 'in_progress' } : { check_out: now, status: 'completed' });
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(type === 'in' ? 'Check-in registrado' : 'Check-out registrado');
    }
  });

  const requestMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftRequests'] });
      setShowRequestForm(false);
      setRequestReason('');
      setRequestDate('');
      toast.success('Solicitud enviada');
    }
  });

  const handleSendRequest = () => {
    if (!requestDate) {
      toast.error('Selecciona una fecha');
      return;
    }
    requestMutation.mutate({
      store_id: storeId,
      cashier_id: cashier.id,
      cashier_name: cashier.name,
      type: requestType,
      request_date: requestDate,
      reason: requestReason,
      status: 'pending'
    });
  };

  const ROLE_COLORS = {
    ventas: 'bg-pink-100 text-pink-700',
    limpieza: 'bg-sky-100 text-sky-700',
    administrador: 'bg-violet-100 text-violet-700',
    apoyo: 'bg-amber-100 text-amber-700',
    entrenamiento: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
              {cashier.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{cashier.name}</h2>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" /> {cashier.email || 'Sin email'}
              </p>
              {cashier.phone && (
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {cashier.phone}
                </p>
              )}
            </div>
          </div>
          
          {/* Week Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/20 rounded-xl p-2 text-center">
              <p className="text-2xl font-bold">{weekShifts.length}</p>
              <p className="text-xs text-white/80">Turnos semana</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 text-center">
              <p className="text-2xl font-bold">{Math.round(weekHours)}h</p>
              <p className="text-xs text-white/80">Horas semana</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 text-center">
              <p className="text-2xl font-bold">{todayShifts.length}</p>
              <p className="text-xs text-white/80">Turnos hoy</p>
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {/* Today's Shifts */}
          {todayShifts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" /> Turnos de Hoy
              </h3>
              {todayShifts.map((shift) => (
                <div key={shift.id} className="bg-pink-50 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {shift.start_time} - {shift.end_time}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[shift.role] || 'bg-gray-100'}`}>
                        {shift.role}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!shift.check_in ? (
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate({ id: shift.id, type: 'in' })}
                          className="bg-emerald-500 text-white gap-1"
                        >
                          <LogIn className="w-4 h-4" /> Check-in
                        </Button>
                      ) : !shift.check_out ? (
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate({ id: shift.id, type: 'out' })}
                          className="bg-amber-500 text-white gap-1"
                        >
                          <LogOut className="w-4 h-4" /> Check-out
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Completado
                        </span>
                      )}
                    </div>
                  </div>
                  {(shift.check_in || shift.check_out) && (
                    <div className="mt-2 text-xs text-gray-500 flex gap-4">
                      {shift.check_in && <span>Entrada: {shift.check_in}</span>}
                      {shift.check_out && <span>Salida: {shift.check_out}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Shifts */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Próximos Turnos
            </h3>
            {futureShifts.length > 0 ? (
              <div className="space-y-2">
                {futureShifts.map((shift) => (
                  <div key={shift.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {format(new Date(shift.date), "EEEE d 'de' MMM", { locale: es })}
                      </p>
                      <p className="text-xs text-gray-500">{shift.start_time} - {shift.end_time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg ${ROLE_COLORS[shift.role] || 'bg-gray-100'}`}>
                      {shift.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Sin turnos programados</p>
            )}
          </div>

          {/* Request Form */}
          {!showRequestForm ? (
            <Button
              variant="outline"
              onClick={() => setShowRequestForm(true)}
              className="w-full gap-2"
            >
              <FileText className="w-4 h-4" /> Crear Solicitud
            </Button>
          ) : (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-medium text-gray-700 mb-3">Nueva Solicitud</h3>
              <div className="space-y-3">
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_off">🏖️ Día libre</SelectItem>
                    <SelectItem value="shift_change">🔄 Cambio de turno</SelectItem>
                    <SelectItem value="permission">📝 Permiso</SelectItem>
                    <SelectItem value="vacation">✈️ Vacaciones</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                />
                <Textarea
                  placeholder="Motivo de la solicitud..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSendRequest}
                    disabled={requestMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-2"
                  >
                    <Send className="w-4 h-4" /> Enviar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}