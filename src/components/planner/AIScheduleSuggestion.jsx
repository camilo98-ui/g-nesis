import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Sparkles, Loader2, Check, X, Clock, RefreshCw, Brain, Bell, Send,
  IceCream, Coffee, Package, Headphones, Cookie, ClipboardList, ShoppingCart, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ROLES_CONFIG = {
  caja: { label: 'Caja', color: 'bg-emerald-400' },
  coneo: { label: 'Coneo', color: 'bg-pink-400' },
  bebidas: { label: 'Bebidas', color: 'bg-amber-400' },
  especialidades: { label: 'Especialidades', color: 'bg-violet-400' },
  coordinacion: { label: 'Coord.', color: 'bg-blue-400' },
  cookie_jar: { label: 'Cookie', color: 'bg-orange-400' },
  stocker: { label: 'Stocker', color: 'bg-slate-400' },
  toma_pedidos: { label: 'Pedidos', color: 'bg-cyan-400' },
  experiencia: { label: 'Experiencia', color: 'bg-yellow-400' },
};

export default function AIScheduleSuggestion({ 
  isOpen, onClose, storeId, storeName, cashiers, weekDays, existingShifts, rankingData = [], salesData = []
}) {
  const [suggestion, setSuggestion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const queryClient = useQueryClient();

  const generateSuggestion = async () => {
    setGenerating(true);
    setSuggestion(null);

    // Preparar datos de ranking para la IA
    const cashierPerformance = cashiers.map(c => {
      const ranking = rankingData.find(r => r.cashier_id === c.id);
      const shiftsCount = existingShifts.filter(s => s.cashier_id === c.id).length;
      return {
        id: c.id,
        name: c.name,
        shiftsThisWeek: shiftsCount,
        // Datos de desempeño (si están disponibles)
        salesRank: ranking?.sales_rank || 'N/A',
        avgTicket: ranking?.avg_ticket || 0,
        performance: ranking?.performance || 'normal'
      };
    });

    // Detectar días de mayor volumen
    const dayVolume = weekDays.map(d => {
      const dayOfWeek = d.getDay();
      // Fin de semana = mayor volumen
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;
      return {
        date: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEEE', { locale: es }),
        expectedVolume: isWeekend ? 'muy alto' : isFriday ? 'alto' : 'normal',
        staffNeeded: isWeekend ? 6 : isFriday ? 5 : 4
      };
    });

    const prompt = `Eres un experto en gestión de horarios para heladería Popsy. 

TIENDA: ${storeName} (${storeId})

COLABORADORES Y SU DESEMPEÑO:
${cashierPerformance.map(c => `- ${c.name} (ID: ${c.id}) | Turnos esta semana: ${c.shiftsThisWeek} | Ranking ventas: ${c.salesRank} | Ticket promedio: $${c.avgTicket}`).join('\n')}

VOLUMEN ESPERADO POR DÍA:
${dayVolume.map(d => `- ${d.dayName} (${d.date}): Volumen ${d.expectedVolume}, personal sugerido: ${d.staffNeeded}`).join('\n')}

POSICIONES DISPONIBLES: caja, coneo, bebidas, especialidades, coordinacion, cookie_jar, stocker, toma_pedidos, experiencia

INSTRUCCIONES IMPORTANTES:
1. Los colaboradores con MEJOR ranking deben estar en días de MAYOR volumen (fines de semana)
2. Distribuir turnos EQUITATIVAMENTE (máx 5-6 turnos/semana por persona)
3. Rotar posiciones para desarrollo profesional
4. Horarios: Apertura 08:00-16:00, Medio 10:00-18:00, Cierre 14:00-22:00
5. Fines de semana requieren más personal y los MEJORES colaboradores

${customPrompt ? `INSTRUCCIONES ADICIONALES DEL GERENTE:\n${customPrompt}` : ''}

Genera un JSON con:
{
  "schedule": [
    {"cashier_id": "id", "cashier_name": "nombre", "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "role": "posicion", "reason": "razón corta"}
  ],
  "insights": "Explicación de la estrategia usada",
  "alerts": ["Lista de alertas o recomendaciones importantes"]
}`;

    try {
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
            insights: { type: "string" },
            alerts: { type: "array", items: { type: "string" } }
          }
        }
      });
      setSuggestion(response);
    } catch (error) {
      toast.error('Error al generar sugerencia');
    }
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
    toast.success(`${suggestion.schedule.length} turnos creados`);
    setApplying(false);
  };

  const notifyCashiers = async () => {
    setNotifying(true);
    
    // Agrupar turnos por colaborador
    const shiftsByCashier = {};
    (suggestion?.schedule || []).forEach(s => {
      if (!shiftsByCashier[s.cashier_id]) {
        shiftsByCashier[s.cashier_id] = { name: s.cashier_name, shifts: [] };
      }
      shiftsByCashier[s.cashier_id].shifts.push(s);
    });

    // Enviar notificación a cada colaborador
    for (const [cashierId, data] of Object.entries(shiftsByCashier)) {
      const cashier = cashiers.find(c => c.id === cashierId);
      if (cashier?.email) {
        const shiftsText = data.shifts.map(s => 
          `• ${format(new Date(s.date), 'EEEE d MMM', { locale: es })}: ${s.start_time}-${s.end_time} (${ROLES_CONFIG[s.role]?.label || s.role})`
        ).join('\n');

        await base44.integrations.Core.SendEmail({
          to: cashier.email,
          subject: `🍦 Tu horario está listo - ${storeName}`,
          body: `¡Hola ${data.name}!\n\nTu horario para esta semana ha sido publicado:\n\n${shiftsText}\n\n¡Gracias por hacer del mundo un lugar más dulce! 💗\n\nEquipo Popsy`
        });
      }
    }

    toast.success('Notificaciones enviadas a los colaboradores');
    setNotifying(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            Generador Inteligente de Horarios
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!suggestion && !generating && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="text-center py-6">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-violet-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">IA Lista para Ayudarte</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Analizaré el ranking de desempeño de tus {cashiers.length} colaboradores y asignaré a los mejores en días de mayor volumen.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Instrucciones adicionales (opcional)</label>
                <Textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: María no puede trabajar el sábado, necesito más personal el domingo por evento especial..."
                  className="min-h-[80px]"
                />
              </div>

              <Button onClick={generateSuggestion} className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2 py-6">
                <Sparkles className="w-5 h-5" /> Generar Horario Inteligente
              </Button>
            </motion.div>
          )}

          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-violet-500" />
              </motion.div>
              <p className="text-gray-600 font-medium">Analizando equipo y volumen de ventas...</p>
              <p className="text-gray-400 text-sm">Optimizando asignaciones</p>
            </motion.div>
          )}

          {suggestion && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Insights */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-violet-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-violet-800 mb-1">Estrategia de la IA</p>
                    <p className="text-sm text-violet-600">{suggestion.insights}</p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {suggestion.alerts?.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Alertas y Recomendaciones
                  </p>
                  <ul className="space-y-1">
                    {suggestion.alerts.map((alert, i) => (
                      <li key={i} className="text-xs text-amber-600">• {alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule Preview */}
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayShifts = suggestion.schedule?.filter(s => s.date === dayStr) || [];
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <motion.div key={dayStr} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-xl p-1.5 min-h-[180px] ${isWeekend ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <div className={`text-center mb-1.5 pb-1 border-b ${isWeekend ? 'border-amber-200' : 'border-gray-200'}`}>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">{format(day, 'EEE', { locale: es })}</p>
                        <p className={`text-base font-black ${isWeekend ? 'text-amber-600' : 'text-gray-700'}`}>{format(day, 'd')}</p>
                        {isWeekend && <p className="text-[8px] text-amber-500">⭐ Alto volumen</p>}
                      </div>
                      <div className="space-y-1">
                        {dayShifts.map((shift, idx) => {
                          const role = ROLES_CONFIG[shift.role] || ROLES_CONFIG.caja;
                          return (
                            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                              className="bg-white rounded-lg p-1.5 shadow-sm text-[9px]">
                              <div className={`${role.color} text-white px-1.5 py-0.5 rounded text-[8px] font-bold mb-1`}>{role.label}</div>
                              <p className="font-bold text-gray-800 truncate">{shift.cashier_name}</p>
                              <p className="text-gray-500 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />{shift.start_time}-{shift.end_time}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-between items-center pt-4 border-t gap-2">
                <Button variant="outline" onClick={generateSuggestion} disabled={generating} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Regenerar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                  <Button onClick={applySuggestion} disabled={applying} className="bg-gradient-to-r from-emerald-400 to-green-500 text-white gap-2">
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aplicar {suggestion.schedule?.length || 0} Turnos
                  </Button>
                  <Button onClick={notifyCashiers} disabled={notifying || applying} variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                    {notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Notificar
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