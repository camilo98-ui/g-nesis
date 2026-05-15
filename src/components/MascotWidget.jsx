import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/0811d99f8_generated_image.png";

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
        <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 mt-0.5"
          style={{ border: '1px solid rgba(244,114,182,0.25)', background: 'linear-gradient(145deg,#fff8fc,#fdf0f7)', boxShadow: '0 2px 6px rgba(244,114,182,0.12)' }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
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

  const PAGE_BUBBLES = {
    '/':          ["¿Cómo va el día? 👀", "Tengo los datos listos ✨", "¿Vamos a revisar el PPT?", "El equipo te espera 🚀"],
    '/Budget':    ["¿Cómo va el presupuesto?", "Revisa la proyección de cierre", "¿Hay brecha que recuperar? 📊"],
    '/Rankings':  ["¿Quién lidera hoy? 🏆", "Top cajeros a la vista", "¿Quieres ver el ranking?"],
    '/Sales':     ["Analizando las ventas 📈", "¿Qué quieres comparar?", "Tendencias listas para revisar"],
    '/FreezerMap':["¿Cómo está el inventario? 🧊", "Stock al día", "¿Hay sabores en riesgo?"],
    '/PopsyPlanner': ["Turnos listos para revisar 📅", "¿Cómo está el equipo hoy?"],
    '/Management':["Vista ejecutiva activa 👁️", "Comparativo de tiendas listo"],
    default:      ["¡Hola! Soy Nova 👋", "Aquí estoy para ayudarte", "¿Tienes alguna consulta?", "Lista para analizar ✨"],
  };

  useEffect(() => {
    const msgs = PAGE_BUBBLES[path] || PAGE_BUBBLES.default;
    const t = setTimeout(() => {
      setBubbleMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setShowBubble(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [path]);

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
    <div className="fixed bottom-5 right-4 z-[9999] flex flex-col items-end gap-1.5">

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, duration: 0.35 }}
            className="w-72 flex flex-col rounded-3xl overflow-hidden"
            style={{
              height: 420,
              background: 'rgba(255,252,255,0.97)',
              backdropFilter: 'blur(60px)',
              WebkitBackdropFilter: 'blur(60px)',
              border: '1px solid rgba(244,114,182,0.18)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(244,114,182,0.12), 0 0 0 0.5px rgba(255,255,255,0.8) inset',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,240,249,0.9) 0%, rgba(255,252,255,0.85) 100%)',
                borderBottom: '1px solid rgba(244,114,182,0.12)',
                backdropFilter: 'blur(20px)',
              }}>
              <div className="w-9 h-9 rounded-2xl overflow-hidden flex-shrink-0"
                style={{
                  border: '1.5px solid rgba(244,114,182,0.3)',
                  background: 'linear-gradient(145deg, #fff8fc, #fdf0f7)',
                  boxShadow: '0 2px 8px rgba(244,114,182,0.15)',
                }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold tracking-tight" style={{ color: '#1a0a14' }}>Nova</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full tracking-widest uppercase"
                    style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.15),rgba(216,180,254,0.1))', color: '#be185d', border: '0.5px solid rgba(244,114,182,0.25)' }}>
                    AI
                  </span>
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"
                    animate={{ opacity: [0.7,1,0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }} />
                </div>
                <p className="text-[10px] font-medium tracking-wide" style={{ color: '#c084a8' }}>{pageCtx.name} — activo</p>
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
                  <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(244,114,182,0.25)', background: 'linear-gradient(145deg,#fff8fc,#fdf0f7)', boxShadow: '0 2px 6px rgba(244,114,182,0.12)' }}>
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
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

      {/* Estado minimalista — ultra discreto */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="px-3 py-1.5 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(190,24,93,0.12)',
              boxShadow: '0 2px 12px rgba(190,24,93,0.08), 0 1px 3px rgba(0,0,0,0.04)',
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <p className="text-[11px] font-semibold text-slate-600 tracking-tight whitespace-nowrap">{bubbleMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nova Button — Ultra premium */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14"
      >
        {/* Outer cinematic glow ring */}
        <motion.div className="absolute -inset-2 rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.35) 0%, rgba(216,180,254,0.12) 60%, transparent 75%)' }}
        />
        {/* Soft energy ring */}
        <motion.div className="absolute -inset-0.5 rounded-full"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ background: 'conic-gradient(from 0deg, rgba(244,114,182,0.6), rgba(248,187,217,0.1), rgba(244,114,182,0.6))', filter: 'blur(2px)' }}
        />
        {/* Avatar shell */}
        <motion.div
          className="relative w-14 h-14 rounded-full overflow-hidden"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            border: '1.5px solid rgba(244,114,182,0.45)',
            boxShadow: '0 4px 24px rgba(244,114,182,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 8px 32px rgba(0,0,0,0.08)',
            background: 'linear-gradient(145deg, #fff8fc 0%, #fdf0f7 100%)',
          }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }} />
        </motion.div>
        {/* Live pulse dot */}
        <motion.div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }}
        />
      </motion.button>
    </div>
  );
}