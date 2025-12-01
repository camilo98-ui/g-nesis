import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Sparkles, Loader2, Check, X, Clock, RefreshCw, Bell, Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Tiendas con horario especial (Viernes y Sábado extendido)
const SPECIAL_STORES = ['BTA 13', 'BTA 14', 'BTA 90', 'BTA 18', 'BTA 78'];

// Tiendas con DOS cajas (necesitan 2 personas en caja simultáneamente)
const TWO_CASHIER_STORES = ['BTA 62', 'BTA 52', 'BTA 78', 'BTA 18', 'BTA 90', 'BTA 89', 'BTA 13', 'TUNJA 1', 'TUNJA 2'];

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

// Icono de cono de helado animado
const IceCreamLogo = () => (
  <motion.svg 
    viewBox="0 0 40 60" 
    className="w-10 h-14"
    animate={{ rotate: [0, 5, -5, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    {/* Bola de helado */}
    <motion.circle 
      cx="20" cy="16" r="14" 
      fill="#ec4899" 
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <circle cx="20" cy="16" r="14" fill="url(#iceGradient)" />
    {/* Decoración */}
    <circle cx="14" cy="12" r="3" fill="#fce7f3" opacity="0.6" />
    <circle cx="24" cy="10" r="2" fill="#fce7f3" opacity="0.4" />
    {/* Cono */}
    <polygon points="8,26 20,58 32,26" fill="#d97706" />
    <polygon points="8,26 20,58 32,26" fill="url(#coneGradient)" />
    {/* Líneas del cono */}
    <line x1="12" y1="32" x2="28" y2="32" stroke="#b45309" strokeWidth="0.8" opacity="0.5" />
    <line x1="14" y1="40" x2="26" y2="40" stroke="#b45309" strokeWidth="0.8" opacity="0.5" />
    <line x1="16" y1="48" x2="24" y2="48" stroke="#b45309" strokeWidth="0.8" opacity="0.5" />
    {/* Chispas de IA */}
    <motion.circle cx="6" cy="8" r="2" fill="#fbbf24" animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
    <motion.circle cx="34" cy="6" r="1.5" fill="#a78bfa" animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
    <motion.circle cx="38" cy="18" r="1.5" fill="#34d399" animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
    <defs>
      <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </motion.svg>
);

export default function AIScheduleSuggestion({ 
  isOpen, onClose, storeId, storeName, cashiers, weekDays, existingShifts, salesData = [], budgetData = []
}) {
  const [suggestion, setSuggestion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const queryClient = useQueryClient();

  const isSpecialStore = SPECIAL_STORES.includes(storeId);
  const hasTwoCashiers = TWO_CASHIER_STORES.includes(storeId);

  const resetToStart = () => {
    setSuggestion(null);
    setCustomPrompt('');
  };

  const generateSuggestion = async () => {
    setGenerating(true);
    setSuggestion(null);

    // Determinar horarios según tipo de tienda
    const storeScheduleInfo = isSpecialStore
      ? `HORARIO ESPECIAL (${storeId}):
- Viernes y Sábado: 09:30 a 22:00 (12.5 horas)
- Resto de días: 09:30 a 21:30 (12 horas)`
      : `HORARIO NORMAL (${storeId}):
- Todos los días (Domingo a Domingo): 09:30 a 21:30 (12 horas)`;

    const cashierStationsInfo = hasTwoCashiers
      ? `⚠️ IMPORTANTE - TIENDA CON 2 CAJAS: Esta tienda tiene DOS puntos de caja. SIEMPRE debe haber 2 personas asignadas al rol "caja" en cada turno/horario para cubrir ambas cajas simultáneamente.`
      : `Esta tienda tiene 1 caja. Solo se necesita 1 persona en el rol "caja" por turno.`;

    // Información de colaboradores disponibles
    const totalCollaborators = cashiers.length;
    const collaboratorAdvice = totalCollaborators < 4 
      ? '⚠️ ALERTA: Pocos colaboradores. Priorizar posiciones críticas (Caja, Coneo).'
      : totalCollaborators < 6
        ? '⚠️ NOTA: Equipo pequeño. Distribuir eficientemente y considerar rotaciones.'
        : '✅ Equipo adecuado para cubrir todas las posiciones.';

    // Datos de ventas y metas
    const salesInfo = salesData.length > 0
      ? `HISTORIAL DE VENTAS RECIENTE:\n${salesData.slice(0, 7).map(s => `- ${s.date}: $${(s.total_sales || 0).toLocaleString()}`).join('\n')}`
      : 'Sin datos de ventas recientes disponibles.';

    const budgetInfo = budgetData.length > 0
      ? `META MENSUAL: $${(budgetData[0]?.sales_budget || 0).toLocaleString()}`
      : '';

    // Calcular rendimiento de colaboradores
    const cashierPerformance = cashiers.map(c => {
      const shiftsCount = existingShifts.filter(s => s.cashier_id === c.id).length;
      return {
        id: c.id,
        name: c.name,
        shiftsThisWeek: shiftsCount
      };
    });

    // Detectar días de mayor volumen según tipo de tienda
    const dayVolume = weekDays.map(d => {
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;
      
      let openTime = '09:30';
      let closeTime = '21:30';
      
      if (isSpecialStore && (isFriday || dayOfWeek === 6)) {
        closeTime = '22:00';
      }
      
      return {
        date: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEEE', { locale: es }),
        expectedVolume: isWeekend ? 'MUY ALTO' : isFriday ? 'ALTO' : 'NORMAL',
        staffNeeded: isWeekend ? Math.min(6, totalCollaborators) : isFriday ? Math.min(5, totalCollaborators) : Math.min(4, totalCollaborators),
        openTime,
        closeTime
      };
    });

    const prompt = `Eres un experto en gestión de horarios para heladería Popsy Colombia.

TIENDA: ${storeName} (${storeId})
TOTAL COLABORADORES DISPONIBLES: ${totalCollaborators}
${collaboratorAdvice}

${storeScheduleInfo}

${cashierStationsInfo}

COLABORADORES:
${cashierPerformance.map(c => `- ${c.name} (ID: ${c.id}) | Turnos asignados: ${c.shiftsThisWeek}`).join('\n')}

${salesInfo}
${budgetInfo}

VOLUMEN ESPERADO Y HORARIOS POR DÍA:
${dayVolume.map(d => `- ${d.dayName} (${d.date}): Volumen ${d.expectedVolume}, Personal: ${d.staffNeeded}, Horario tienda: ${d.openTime}-${d.closeTime}`).join('\n')}

POSICIONES: caja, coneo, bebidas, especialidades, coordinacion, cookie_jar, stocker, toma_pedidos, experiencia

REGLAS IMPORTANTES:
1. Los turnos deben estar DENTRO del horario de la tienda
2. Turnos sugeridos: Apertura (09:30-17:30), Medio (12:00-20:00), Cierre (14:00-21:30 o 22:00)
3. Máximo 5-6 turnos por colaborador a la semana
4. Fines de semana necesitan MÁS personal y los MEJORES colaboradores
5. SI HAY POCOS COLABORADORES: priorizar Caja y Coneo
6. Distribuir EQUITATIVAMENTE los turnos
7. ${hasTwoCashiers ? 'CRÍTICO: Esta tienda tiene 2 CAJAS - Asignar SIEMPRE 2 personas diferentes al rol "caja" en horarios que se crucen para cubrir ambas cajas' : 'Esta tienda tiene 1 caja'}

${customPrompt ? `INSTRUCCIONES DEL GERENTE:\n${customPrompt}` : ''}

Responde con JSON:
{
  "schedule": [{"cashier_id": "id", "cashier_name": "nombre", "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "role": "posicion", "reason": "razón"}],
  "insights": "Estrategia usada",
  "alerts": ["alertas importantes"],
  "positioning_tips": ["consejos de posicionamiento según el volumen de colaboradores"]
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
            alerts: { type: "array", items: { type: "string" } },
            positioning_tips: { type: "array", items: { type: "string" } }
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
    onClose();
  };

  const notifyCashiers = async () => {
    setNotifying(true);
    
    const shiftsByCashier = {};
    (suggestion?.schedule || []).forEach(s => {
      if (!shiftsByCashier[s.cashier_id]) {
        shiftsByCashier[s.cashier_id] = { name: s.cashier_name, shifts: [] };
      }
      shiftsByCashier[s.cashier_id].shifts.push(s);
    });

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

    toast.success('Notificaciones enviadas');
    setNotifying(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <IceCreamLogo />
            <div>
              <span className="text-lg font-bold">Generador Inteligente</span>
              <p className="text-xs text-gray-500 font-normal">
                {isSpecialStore ? '🕐 Horario especial Vie-Sáb' : '🕐 Horario normal'}
                {hasTwoCashiers && ' • 💳 2 Cajas'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!suggestion && !generating && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="text-center py-6">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-32 mx-auto mb-4 flex items-center justify-center">
                  <IceCreamLogo />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">IA Lista para Ayudarte</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Analizaré tus {cashiers.length} colaboradores, el volumen de ventas y las metas para crear el horario óptimo.
                </p>
                {cashiers.length < 4 && (
                  <p className="text-amber-600 text-xs mt-2 bg-amber-50 rounded-lg px-3 py-2 inline-block">
                    ⚠️ Tienes pocos colaboradores. La IA priorizará posiciones críticas.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Instrucciones adicionales</label>
                <Textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: María no puede el sábado, necesito más gente el domingo..."
                  className="min-h-[80px]"
                />
              </div>

              <Button onClick={generateSuggestion} className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white gap-2 py-6">
                <Sparkles className="w-5 h-5" /> Generar Horario Inteligente
              </Button>
            </motion.div>
          )}

          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-pink-500" />
              </motion.div>
              <p className="text-gray-600 font-medium">Analizando ventas y colaboradores...</p>
            </motion.div>
          )}

          {suggestion && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Insights */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                <p className="font-medium text-pink-800 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Estrategia
                </p>
                <p className="text-sm text-pink-600">{suggestion.insights}</p>
              </div>

              {/* Positioning Tips */}
              {suggestion.positioning_tips?.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 mb-2">💡 Consejos de Posicionamiento</p>
                  <ul className="space-y-1">
                    {suggestion.positioning_tips.map((tip, i) => (
                      <li key={i} className="text-xs text-blue-600">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alerts */}
              {suggestion.alerts?.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Alertas
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
                      className={`rounded-xl p-1.5 min-h-[160px] ${isWeekend ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <div className={`text-center mb-1.5 pb-1 border-b ${isWeekend ? 'border-amber-200' : 'border-gray-200'}`}>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">{format(day, 'EEE', { locale: es })}</p>
                        <p className={`text-base font-black ${isWeekend ? 'text-amber-600' : 'text-gray-700'}`}>{format(day, 'd')}</p>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetToStart} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Nueva consulta
                  </Button>
                  <Button variant="ghost" onClick={onClose}><X className="w-4 h-4 mr-1" /> Cerrar</Button>
                </div>
                <div className="flex gap-2">
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