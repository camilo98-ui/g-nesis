import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, eachDayOfInterval, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles, X, Loader2, Wand2, Check, Edit2, Clock, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AIScheduleGenerator({ storeId, storeName, cashiers, currentWeek, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [applying, setApplying] = useState(false);
  const queryClient = useQueryClient();

  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeek, end: weekEnd });

  const generateSchedule = async () => {
    if (!prompt.trim()) {
      toast.error('Escribe instrucciones para generar horarios');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un experto en gestión de horarios para heladerías Popsy. Genera horarios óptimos para la tienda ${storeName || storeId}.

COLABORADORES DISPONIBLES:
${cashiers.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

SEMANA: ${format(currentWeek, "d 'de' MMMM", { locale: es })} al ${format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}

INSTRUCCIONES DEL ADMINISTRADOR:
${prompt}

REGLAS OBLIGATORIAS:
- Máximo 8 horas por turno
- Mínimo 1 día de descanso por semana por persona
- No más de 48 horas semanales por persona
- Horarios típicos: 08:00-16:00, 10:00-18:00, 12:00-20:00, 14:00-22:00
- Roles disponibles: ventas, limpieza, administrador, apoyo, entrenamiento

Genera un JSON con los turnos optimizados. Para cada turno incluye:
- cashier_id (del listado de colaboradores)
- cashier_name
- date (formato YYYY-MM-DD, dentro de la semana indicada)
- start_time (formato HH:mm)
- end_time (formato HH:mm)
- role (uno de los roles disponibles)

Asegúrate de distribuir equitativamente las horas entre los colaboradores.`,
        response_json_schema: {
          type: "object",
          properties: {
            shifts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cashier_id: { type: "string" },
                  cashier_name: { type: "string" },
                  date: { type: "string" },
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  role: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            total_hours_per_person: {
              type: "object",
              additionalProperties: { type: "number" }
            }
          }
        }
      });

      setGeneratedSchedule(response);
      toast.success('¡Horarios generados con éxito!');
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error('Error al generar horarios');
    } finally {
      setGenerating(false);
    }
  };

  const applySchedule = async () => {
    if (!generatedSchedule?.shifts?.length) return;
    
    setApplying(true);
    try {
      for (const shift of generatedSchedule.shifts) {
        await base44.entities.Shift.create({
          store_id: storeId,
          cashier_id: shift.cashier_id,
          cashier_name: shift.cashier_name,
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          role: shift.role || 'ventas',
          status: 'scheduled'
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(`${generatedSchedule.shifts.length} turnos creados exitosamente`);
      onClose();
    } catch (error) {
      console.error('Error applying schedule:', error);
      toast.error('Error al aplicar horarios');
    } finally {
      setApplying(false);
    }
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
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <div>
              <h2 className="font-bold text-lg">Generador de Horarios con IA</h2>
              <p className="text-white/80 text-sm">
                Semana del {format(currentWeek, "d MMM", { locale: es })} al {format(weekEnd, "d MMM", { locale: es })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!generatedSchedule ? (
            <>
              {/* Input Section */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  ¿Cómo quieres organizar los horarios?
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Ejemplo: "Necesito cubrir de 8am a 10pm todos los días. Tengo 5 empleados. María y Juan prefieren turnos de mañana. Necesito mínimo 2 personas en horas pico (12pm-2pm y 6pm-8pm). El domingo es día de mayor venta."`}
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Quick Templates */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Plantillas rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Turnos rotativos de 8 horas para toda la semana',
                    'Cubrir de 10am a 9pm con descansos escalonados',
                    'Fines de semana con más personal',
                    'Turnos de medio tiempo para estudiantes'
                  ].map((template) => (
                    <Button
                      key={template}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(template)}
                      className="text-xs"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Collaborators Preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{cashiers.length} colaboradores disponibles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cashiers.map((c) => (
                    <span key={c.id} className="text-xs bg-white px-2 py-1 rounded-lg border">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateSchedule}
                disabled={generating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-6 text-lg gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generando horarios...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generar Horarios con IA</>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Generated Schedule Preview */}
              <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Horarios generados exitosamente</span>
                </div>
                <p className="text-sm text-emerald-600">{generatedSchedule.summary}</p>
              </div>

              {/* Hours Summary */}
              {generatedSchedule.total_hours_per_person && (
                <div className="mb-4 bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Horas por colaborador:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(generatedSchedule.total_hours_per_person).map(([name, hours]) => (
                      <span key={name} className="text-xs bg-white px-3 py-1.5 rounded-lg border flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {name}: <strong>{hours}h</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shifts Grid */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map((day) => {
                  const dayShifts = generatedSchedule.shifts?.filter(
                    (s) => s.date === format(day, 'yyyy-MM-dd')
                  ) || [];
                  
                  return (
                    <div key={day.toISOString()} className="bg-gray-50 rounded-xl p-2">
                      <p className="text-xs font-medium text-gray-600 text-center mb-2">
                        {format(day, 'EEE d', { locale: es })}
                      </p>
                      <div className="space-y-1">
                        {dayShifts.map((shift, idx) => (
                          <div
                            key={idx}
                            className={`${ROLE_COLORS[shift.role] || 'bg-gray-100 text-gray-700'} rounded-lg p-1.5 text-[10px]`}
                          >
                            <p className="font-medium truncate">{shift.cashier_name}</p>
                            <p className="opacity-75">{shift.start_time}-{shift.end_time}</p>
                          </div>
                        ))}
                        {dayShifts.length === 0 && (
                          <p className="text-[10px] text-gray-400 text-center py-2">Sin turnos</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedSchedule(null)}
                  className="flex-1 gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Modificar
                </Button>
                <Button
                  onClick={applySchedule}
                  disabled={applying}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white gap-2"
                >
                  {applying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Aplicando...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Aplicar Horarios</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}