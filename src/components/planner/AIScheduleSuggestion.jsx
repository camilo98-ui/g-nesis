import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Sparkles, Loader2, Check, X, User, Clock, RefreshCw, Brain,
  IceCream, Coffee, Package, Headphones, Cookie, ClipboardList, ShoppingCart, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLES_CONFIG = {
  caja: { label: 'Caja', icon: ShoppingCart, color: 'bg-emerald-500' },
  coneo: { label: 'Coneo', icon: IceCream, color: 'bg-pink-500' },
  bebidas: { label: 'Bebidas', icon: Coffee, color: 'bg-amber-500' },
  especialidades: { label: 'Especialidades', icon: Sparkles, color: 'bg-violet-500' },
  coordinacion: { label: 'Coord. Entregas', icon: ClipboardList, color: 'bg-blue-500' },
  cookie_jar: { label: 'Cookie Jar', icon: Cookie, color: 'bg-orange-500' },
  stocker: { label: 'Stocker', icon: Package, color: 'bg-slate-500' },
  toma_pedidos: { label: 'Toma Pedidos', icon: Headphones, color: 'bg-cyan-500' },
  experiencia: { label: 'Experiencia', icon: Crown, color: 'bg-yellow-500' },
};

export default function AIScheduleSuggestion({ 
  isOpen, onClose, storeId, storeName, cashiers, weekDays, existingShifts 
}) {
  const [suggestion, setSuggestion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const queryClient = useQueryClient();

  const generateSuggestion = async () => {
    setGenerating(true);
    setSuggestion(null);

    const cashierInfo = cashiers.map(c => ({
      id: c.id,
      name: c.name,
      shiftsThisWeek: existingShifts.filter(s => s.cashier_id === c.id).length
    }));

    const prompt = `Eres un experto en gestión de horarios para una heladería Popsy.

COLABORADORES DISPONIBLES:
${cashierInfo.map(c => `- ${c.name} (ID: ${c.id}) - ${c.shiftsThisWeek} turnos ya asignados`).join('\n')}

POSICIONES DISPONIBLES:
- caja: Atención en caja
- coneo: Preparación de conos de helado
- bebidas: Malteadas y bebidas
- especialidades: Postres especiales
- coordinacion: Coordinación de entregas
- cookie_jar: Estación de cookies
- stocker: Reposición de inventario
- toma_pedidos: Atención telefónica
- experiencia: Experiencia al cliente

DÍAS DE LA SEMANA: ${weekDays.map(d => format(d, 'EEEE d', { locale: es })).join(', ')}

INSTRUCCIONES:
1. Asigna a cada colaborador de manera EQUITATIVA (máximo 5-6 turnos por semana)
2. Considera que los fines de semana necesitan más personal
3. Varía las posiciones para que todos aprendan diferentes roles
4. Horarios típicos: Apertura (08:00-16:00), Medio (10:00-18:00), Cierre (14:00-22:00)
5. Asigna las posiciones según las necesidades del negocio

Genera un JSON con la estructura:
{
  "schedule": [
    {
      "cashier_id": "id",
      "cashier_name": "nombre",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "role": "posicion",
      "reason": "breve razón de la asignación"
    }
  ],
  "insights": "Explicación breve de la lógica usada"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cashier_id: { type: "string" },
                cashier_name: { type: "string" },
                date: { type: "string" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                role: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          insights: { type: "string" }
        }
      }
    });

    setSuggestion(response);
    setGenerating(false);
  };

  const applySuggestion = async () => {
    if (!suggestion?.schedule) return;
    setApplying(true);

    for (const shift of suggestion.schedule) {
      await base44.entities.Shift.create({
        store_id: storeId,
        cashier_id: shift.cashier_id,
        cashier_name: shift.cashier_name,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        role: shift.role,
        status: 'scheduled'
      });
    }

    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    toast.success(`${suggestion.schedule.length} turnos creados con IA`);
    setApplying(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            Sugerencia Inteligente de Horarios
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!suggestion && !generating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">IA Lista para Ayudarte</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Analizaré a tus {cashiers.length} colaboradores y generaré un horario óptimo considerando equidad, rotación de posiciones y necesidades del negocio.
              </p>
              <Button
                onClick={generateSuggestion}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2 px-6"
              >
                <Sparkles className="w-4 h-4" />
                Generar Sugerencia
              </Button>
            </motion.div>
          )}

          {generating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Loader2 className="w-16 h-16 text-violet-500" />
              </motion.div>
              <p className="text-gray-600 font-medium">Analizando equipo y generando horarios...</p>
              <p className="text-gray-400 text-sm">Esto puede tomar unos segundos</p>
            </motion.div>
          )}

          {suggestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Insights */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-violet-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-violet-800 mb-1">Análisis de IA</p>
                    <p className="text-sm text-violet-600">{suggestion.insights}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Preview */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayShifts = suggestion.schedule?.filter(s => s.date === dayStr) || [];
                  
                  return (
                    <div key={dayStr} className="bg-gray-50 rounded-xl p-2 min-h-[200px]">
                      <div className="text-center mb-2 pb-2 border-b border-gray-200">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">
                          {format(day, 'EEE', { locale: es })}
                        </p>
                        <p className="text-lg font-black text-gray-800">{format(day, 'd')}</p>
                      </div>
                      <div className="space-y-1">
                        {dayShifts.map((shift, idx) => {
                          const role = ROLES_CONFIG[shift.role] || ROLES_CONFIG.caja;
                          const RoleIcon = role.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-white rounded-lg p-1.5 shadow-sm text-[10px]"
                            >
                              <div className={`${role.color} text-white px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 mb-1`}>
                                <RoleIcon className="w-2.5 h-2.5" />
                                {role.label}
                              </div>
                              <p className="font-bold text-gray-800 truncate">{shift.cashier_name}</p>
                              <p className="text-gray-500">{shift.start_time}-{shift.end_time}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={generateSuggestion}
                  disabled={generating}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={applySuggestion}
                    disabled={applying}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white gap-2"
                  >
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aplicar {suggestion.schedule?.length || 0} Turnos
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}