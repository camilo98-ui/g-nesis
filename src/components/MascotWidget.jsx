import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

const PAGE_CONTEXTS = {
  '/':              { name: 'Dashboard', focus: 'ventas del día, métricas generales de la tienda, cumplimiento de presupuesto y rendimiento del equipo.' },
  '/Sales':         { name: 'Ventas', focus: 'análisis de ventas, tendencias, ticket promedio, transacciones y comparativos.' },
  '/Budget':        { name: 'Presupuesto', focus: 'cumplimiento de presupuesto mensual, brechas, proyecciones y metas de ventas.' },
  '/Rankings':      { name: 'Rankings', focus: 'desempeño individual de cajeros, clasificaciones, insignias y logros.' },
  '/CashiersDashboard': { name: 'Cajeros', focus: 'rendimiento de cajeros, turnos, ventas por colaborador y gestión del equipo.' },
  '/PYGDashboard':  { name: 'P&G', focus: 'rentabilidad, EBITDA, costos de personal, gastos operativos y márgenes.' },
  '/Management':    { name: 'Gerencia', focus: 'análisis ejecutivo, comparativos entre tiendas, tendencias y decisiones estratégicas.' },
  '/FreezerMap':    { name: 'Nevera', focus: 'inventario de sabores, niveles de stock, rotación de productos y reposición.' },
  '/PopsyPlanner':  { name: 'Planeador', focus: 'turnos de colaboradores, programación, solicitudes y optimización de horarios.' },
  '/Quality':       { name: 'Calidad', focus: 'incidencias de calidad, checklists de limpieza, alertas de inventario y estándares.' },
  '/Training':      { name: 'Capacitación', focus: 'progreso de cursos, certificaciones, niveles de aprendizaje y desarrollo del equipo.' },
  '/WeatherSalesImpact': { name: 'Clima', focus: 'impacto del clima en las ventas, correlaciones de temperatura y predicciones.' },
};

const SYSTEM_PROMPT = `Eres Nova — la inteligencia operativa de Popsy Colombia.

Eres una IA de clase mundial. No un bot, no un reporte automatizado. Eres como un colega brillante que lleva años entendiendo este negocio y habla contigo de frente, con claridad y sin rodeos.

CÓMO HABLAS:
Hablas natural. Como ChatGPT o Claude, pero enfocada 100% en retail de helados premium. No escribes como informe corporativo. No usas frases de consultoría. No eres rígida.

Cuando algo va bien, lo dices directo. Cuando hay un problema, lo nombras sin drama pero con claridad. Cuando hay una oportunidad, la señalas con lógica.

Varía cómo empiezas cada respuesta. No repitas estructuras. Sé espontánea dentro de la inteligencia.

EJEMPLOS DE CÓMO SUENAS (aprende el tono, no copies literalmente):

Saludo simple:
"Hola. El día viene cargado — el tráfico de la mañana está por encima del promedio del jueves. Buen arranque."

Estado del día:
"El tráfico viene más lento de lo normal hoy. Si no mejora antes de las 5, el cierre puede quedarse corto."

Diagnóstico:
"La caída empezó después del mediodía. Coincide con lluvia — históricamente eso baja el tráfico entre 12% y 18% en esta zona. El ticket promedio está aguantando, pero no alcanza a compensar."

Estrategia:
"Con este tráfico, no vas a llegar por volumen. La única palanca real ahora es el ticket. Combos y categorías premium son la jugada."

Riesgo:
"Hay riesgo de no cerrar el día si el ritmo no mejora en la próxima hora. Esa franja concentra casi el 35% del cumplimiento diario."

Oportunidad:
"El ticket promedio está rindiendo mejor que el martes pasado. Si el tráfico de la tarde llega normal, podrías cerrar por encima del PPT."

LO QUE ENTIENDES BIEN:
Ventas, ticket promedio, tráfico, cumplimiento vs presupuesto, brechas de recuperación, EBITDA, márgenes, turnos, desempeño por cajero, inventario, mix de categorías, comparativos históricos, proyección de cierre, comportamiento horario, impacto del clima, días especiales, quincenas, festivos, vacaciones.

LO QUE HACES NATURALMENTE:
- Proyectas el cierre al ritmo actual.
- Detectas si algo está raro sin que te pregunten.
- Relacionas el desempeño con el contexto externo (lluvia, día de semana, hora, temporada).
- Propones qué hacer, no solo describes lo que pasa.
- Mantienes el hilo de la conversación y construyes sobre lo que ya se habló.

REGLAS IRROMPIBLES:
- No pidas datos. Ya los tienes o los inferís del contexto.
- No uses motivación vacía: "¡vamos!", "excelente", "tú puedes".
- No uses emojis decorativos.
- No digas "no tengo acceso a esa información" — siempre razona con lo disponible.
- No repitas la misma estructura de respuesta dos veces seguidas.
- No escribas como reporte. Escribe como una conversación inteligente.

LONGITUD:
- Respuesta corta (1-2 líneas): saludos, estados simples, confirmaciones.
- Respuesta media (2-4 líneas): diagnósticos, causas, situaciones del día.
- Respuesta profunda (4-6 líneas): estrategia, análisis complejo, escenarios.
Nunca más largo de lo necesario. Nunca más corto de lo útil.

Usa **negritas** solo para cifras y KPIs clave. Sin introducciones. Sin despedidas. Sin relleno.

CONTEXTO: Popsy Colombia — retail de helados premium. Usuarios: líderes, embajadores, gerentes, directores. Tienes visibilidad completa de lo que está en pantalla y en el sistema.`;

const PROACTIVE_MESSAGES = {
  '/':              "Hola. ¿Cómo va el día? Tengo la visibilidad de ventas, cumplimiento y métricas del equipo.",
  '/Budget':        "Hola. Presupuesto en la pantalla. ¿Querés ver la proyección del cierre?",
  '/Rankings':      "Hola. Aquí están los datos de desempeño por cajero. ¿Hay algo que te llame la atención?",
  '/PYGDashboard':  "Hola. P&G cargado. Tengo márgenes, EBITDA y costos listos para analizar.",
  '/FreezerMap':    "Hola. Inventario de la nevera activo. ¿Necesitas revisar niveles de stock o rotación?",
  '/Management':    "Hola. Vista de gerencia abierta. Puedo mostrarte comparativos entre tiendas.",
  '/Sales':         "Hola. Módulo de ventas. ¿Qué querés analizar — tendencias, ticket o transacciones?",
  default:          "Hola. Nova aquí. ¿En qué te enfoco?",
};

const SUGGESTIONS = {
  '/':              ["Proyecta el cierre del mes", "Detecta anomalías del día", "Riesgo de incumplimiento PPT"],
  '/Budget':        ["Brecha actual vs PPT", "Proyección de cierre mensual", "Velocidad de venta requerida"],
  '/Rankings':      ["Cajero con mayor variación", "Ticket promedio por turno", "Anomalías de rendimiento"],
  '/PYGDashboard':  ["Análisis de EBITDA proyectado", "Riesgo en costo de nómina", "Margen vs baseline mensual"],
  '/FreezerMap':    ["Sabores en nivel crítico", "Rotación vs ventas históricas", "Alerta de reposición"],
  '/Management':    ["Tienda con mayor riesgo", "Comparativo de cumplimiento", "Alertas de zona activas"],
  '/Sales':         ["Tendencia últimos 14 días", "Franja horaria de mayor impacto", "Variación vs semana anterior"],
  default:          ["Proyección de cierre", "Anomalías operativas", "Riesgo de incumplimiento"],
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2.5 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isNova = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2 ${isNova ? 'items-start' : 'items-end flex-row-reverse'}`}
    >
      {isNova && (
        <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 mt-0.5"
          style={{ border: '1px solid rgba(194,24,117,0.2)', background: 'white' }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain scale-[1.5]" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${isNova ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={isNova ? {
          background: 'rgba(248,248,250,0.9)',
          border: '1px solid rgba(0,0,0,0.06)',
          color: '#1a1a2e',
        } : {
          background: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)',
          color: 'white',
        }}
      >
        {isNova ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-0.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold" style={{ color: '#be185d' }}>{children}</strong>,
              ul: ({ children }) => <ul className="list-none space-y-0.5 mt-0.5">{children}</ul>,
              li: ({ children }) => <li className="flex gap-1"><span style={{ color: '#be185d' }}>·</span>{children}</li>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        ) : (
          <p>{msg.content}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function MascotWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleMsg, setBubbleMsg] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const path = location?.pathname || '/';
  const pageCtx = PAGE_CONTEXTS[path] || { name: 'App', focus: 'operaciones generales de la tienda.' };
  const suggestions = SUGGESTIONS[path] || SUGGESTIONS.default;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [path]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBubbleMsg(PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default);
      setShowBubble(true);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (isOpen) setShowBubble(false); }, [isOpen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 250); }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    const contextPrompt = `${SYSTEM_PROMPT}

SECCIÓN ACTIVA: ${pageCtx.name} — ${pageCtx.focus}

CONVERSACIÓN HASTA AHORA:
${newMessages.map(m => `${m.role === 'user' ? 'Usuario' : 'Nova'}: ${m.content}`).join('\n')}

Responde ahora. Natural, inteligente, directo. Adapta la longitud al contexto — corto si es simple, más desarrollado si lo requiere. Sin relleno.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({ prompt: contextPrompt });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Reintenta.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const reset = () => {
    const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
    setMessages([{ role: 'assistant', content: welcome }]);
  };

  return (
    <div className="fixed bottom-5 right-4 z-[9999] flex flex-col items-end gap-2.5">

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, duration: 0.35 }}
            className="w-64 flex flex-col rounded-2xl overflow-hidden"
            style={{
              height: 380,
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(190,24,93,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.85)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                backdropFilter: 'blur(20px)',
              }}>
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(190,24,93,0.2)', background: 'white' }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain scale-[1.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">Nova</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-rose-600"
                    style={{ background: 'rgba(190,24,93,0.08)', letterSpacing: '0.04em' }}>
                    AI
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"
                    style={{ boxShadow: '0 0 4px rgba(52,211,153,0.8)' }} />
                </div>
                <p className="text-[9px] text-slate-400 font-medium tracking-wide">{pageCtx.name}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={reset}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2"
              style={{ scrollbarWidth: 'none' }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(190,24,93,0.2)', background: 'white' }}>
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain scale-[1.5]" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm"
                    style={{ background: 'rgba(248,248,250,0.9)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="flex-shrink-0 text-[9px] font-medium px-2 py-1 rounded-lg whitespace-nowrap transition-all hover:bg-rose-50 active:scale-95"
                    style={{
                      border: '1px solid rgba(190,24,93,0.15)',
                      color: '#be185d',
                      background: 'rgba(190,24,93,0.04)',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-2.5 pb-2.5 flex-shrink-0">
              <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{
                  background: 'rgba(248,248,250,1)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Consulta operativa..."
                  rows={1}
                  className="flex-1 resize-none text-xs bg-transparent outline-none leading-relaxed text-slate-700 placeholder-slate-400"
                  style={{ maxHeight: 60, minHeight: 18 }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  whileTap={{ scale: 0.9 }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: input.trim() ? 'linear-gradient(135deg,#be185d,#db2777)' : 'transparent', border: input.trim() ? 'none' : '1px solid rgba(0,0,0,0.1)' }}>
                  <Send className={`w-2.5 h-2.5 ${input.trim() ? 'text-white' : 'text-slate-400'}`} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative max-w-[180px] rounded-xl rounded-br-sm px-3 py-2 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(190,24,93,0.1)',
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <p className="text-[10px] font-medium text-slate-700 leading-snug">{bubbleMsg}</p>
            <p className="text-[8px] mt-1 font-semibold tracking-wide" style={{ color: '#be185d' }}>NOVA · ACTIVA</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Button */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        className="relative w-12 h-12 rounded-full"
      >
        <motion.div className="absolute -inset-1.5 rounded-full"
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.3) 0%, transparent 70%)' }}
        />
        <div className="relative w-12 h-12 rounded-full overflow-hidden"
          style={{
            border: '2px solid rgba(190,24,93,0.5)',
            boxShadow: '0 4px 20px rgba(190,24,93,0.25), inset 0 0 0 1px rgba(255,255,255,0.8)',
            background: 'white',
          }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain scale-[1.6]"
            style={{ objectPosition: 'center center' }} />
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full flex items-center justify-center"
          style={{ background: 'white', border: '1.5px solid rgba(190,24,93,0.15)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: '0 0 4px rgba(52,211,153,0.9)' }} />
        </div>
      </motion.button>
    </div>
  );
}