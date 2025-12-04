import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MessageCircle, Send, Loader2, X, Sparkles, AlertTriangle, 
  CheckCircle, Clock, Users, Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const QUICK_ACTIONS = [
  { id: 'generate', label: '✨ Generar horario', prompt: 'Genera un horario óptimo para esta semana' },
  { id: 'conflicts', label: '⚠️ Detectar conflictos', prompt: 'Analiza los horarios actuales y detecta conflictos o sobrecarga' },
  { id: 'optimize', label: '🎯 Optimizar turnos', prompt: 'Optimiza la distribución de turnos según demanda' },
  { id: 'coverage', label: '📊 Verificar cobertura', prompt: 'Verifica que todas las posiciones estén cubiertas' },
];

export default function AIScheduleAssistant({ 
  isOpen, onClose, storeId, storeName, cashiers, weekDays, existingShifts, salesData = []
}) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `¡Hola! 👋 Soy tu asistente de horarios para ${storeName || 'la tienda'}. Puedo ayudarte a:\n\n• Generar horarios óptimos\n• Detectar conflictos\n• Sugerir mejoras\n• Analizar cobertura\n\n¿En qué puedo ayudarte hoy?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detectar conflictos automáticamente
  useEffect(() => {
    if (existingShifts?.length > 0) {
      const detected = detectConflicts();
      setConflicts(detected);
    }
  }, [existingShifts]);

  const detectConflicts = () => {
    const issues = [];
    
    // Agrupar turnos por día
    const shiftsByDay = {};
    existingShifts.forEach(s => {
      const date = s.date?.split('T')[0] || s.date;
      if (!shiftsByDay[date]) shiftsByDay[date] = [];
      shiftsByDay[date].push(s);
    });

    // Verificar cada día
    Object.entries(shiftsByDay).forEach(([date, shifts]) => {
      // 1. Verificar si hay caja cubierta
      const hasCaja = shifts.some(s => s.role === 'caja');
      if (!hasCaja && shifts.length > 0) {
        issues.push({ type: 'critical', message: `${format(new Date(date), 'EEEE dd', { locale: es })}: Sin caja asignada` });
      }

      // 2. Verificar si hay coneo cubierto
      const hasConeo = shifts.some(s => s.role === 'coneo');
      if (!hasConeo && shifts.length > 0) {
        issues.push({ type: 'warning', message: `${format(new Date(date), 'EEEE dd', { locale: es })}: Sin coneo asignado` });
      }

      // 3. Verificar sobrecarga (mismo empleado múltiples turnos)
      const employeeShifts = {};
      shifts.forEach(s => {
        if (!employeeShifts[s.cashier_id]) employeeShifts[s.cashier_id] = [];
        employeeShifts[s.cashier_id].push(s);
      });

      Object.entries(employeeShifts).forEach(([id, empShifts]) => {
        if (empShifts.length > 1) {
          const name = empShifts[0].cashier_name;
          issues.push({ type: 'info', message: `${name} tiene ${empShifts.length} turnos el ${format(new Date(date), 'EEEE', { locale: es })}` });
        }
      });

      // 4. Verificar horas totales del día
      const totalHours = shifts.reduce((acc, s) => {
        if (s.role === 'descanso') return acc;
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return acc + ((endH + endM/60) - (startH + startM/60));
      }, 0);

      if (totalHours < 16) {
        issues.push({ type: 'warning', message: `${format(new Date(date), 'EEEE dd', { locale: es })}: Pocas horas de cobertura (${totalHours.toFixed(1)}h)` });
      }
    });

    // Verificar días sin turnos
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (!shiftsByDay[dateStr] || shiftsByDay[dateStr].length === 0) {
        issues.push({ type: 'critical', message: `${format(day, 'EEEE dd', { locale: es })}: Sin turnos programados` });
      }
    });

    return issues;
  };

  const handleSend = async (customPrompt) => {
    const userMessage = customPrompt || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    const contextPrompt = `Eres un asistente experto en gestión de horarios para heladería Popsy.

CONTEXTO:
- Tienda: ${storeName} (${storeId})
- Colaboradores disponibles: ${cashiers.length}
- Turnos programados esta semana: ${existingShifts.length}
- Días de la semana: ${weekDays.map(d => format(d, 'EEEE', { locale: es })).join(', ')}

COLABORADORES:
${cashiers.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

TURNOS ACTUALES:
${existingShifts.slice(0, 20).map(s => `- ${s.cashier_name}: ${s.date} ${s.start_time}-${s.end_time} (${s.role})`).join('\n')}

CONFLICTOS DETECTADOS:
${conflicts.length > 0 ? conflicts.map(c => `- [${c.type.toUpperCase()}] ${c.message}`).join('\n') : 'Ninguno detectado'}

VENTAS RECIENTES:
${salesData.slice(0, 5).map(s => `- ${s.date}: $${(s.total_sales || 0).toLocaleString()}`).join('\n')}

SOLICITUD DEL USUARIO: ${userMessage}

INSTRUCCIONES:
1. Si piden generar horarios, sugiere turnos específicos con formato: "nombre | fecha | hora inicio-fin | rol"
2. Si piden detectar conflictos, analiza y lista problemas específicos
3. Si piden optimizar, da sugerencias concretas de mejora
4. Responde de forma concisa y práctica
5. Usa emojis para hacer la respuesta más visual
6. Si detectas problemas críticos, menciónalos primero`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.' 
      }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-4 bottom-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <div>
              <h3 className="font-bold">Asistente IA</h3>
              <p className="text-xs text-white/80">Gestión de horarios</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Conflictos detectados */}
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-white/10 rounded-lg p-2"
          >
            <p className="text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {conflicts.filter(c => c.type === 'critical').length} críticos, {conflicts.filter(c => c.type === 'warning').length} advertencias
            </p>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Acciones rápidas:</p>
        <div className="flex flex-wrap gap-1">
          {QUICK_ACTIONS.map(action => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => handleSend(action.prompt)}
              className="text-xs h-7 px-2"
              disabled={loading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              <span className="text-sm text-gray-500">Analizando...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe tu pregunta..."
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}