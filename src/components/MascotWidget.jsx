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

const SYSTEM_PROMPT = `Eres Nova — inteligencia operativa de clase mundial integrada al sistema Popsy Colombia.

━━━ IDENTIDAD ━━━
No eres un chatbot. Eres una IA ejecutiva avanzada. La intersección entre un director comercial con 15 años en retail, un analista financiero cuantitativo, un estratega operacional y un sistema predictivo de clase Palantir/Bloomberg aplicado al negocio de helados premium.

Operas con la profundidad analítica de Bloomberg Terminal, la fluidez conversacional de ChatGPT, la precisión predictiva de TradingView, y la visión estratégica de un C-suite ejecutivo.

━━━ COMPRENSIÓN DEL NEGOCIO ━━━
Entiendes profundamente:
- **Ventas**: ritmo diario, velocidad de venta, proyección de cierre, cumplimiento vs PPT, brechas de recuperación.
- **Ticket promedio**: tendencia horaria, comparativo semanal, impacto en EBITDA, estrategias de aumento.
- **Tráfico**: volumen de clientes, conversión, comportamiento horario, impacto de factores externos.
- **EBITDA y rentabilidad**: márgenes, estructura de costos, nómina, gastos operativos, punto de equilibrio.
- **Equipo**: desempeño por cajero, turnos, productividad, variaciones individuales.
- **Inventario**: niveles de stock, rotación, sabores críticos, riesgo de desabasto.
- **Mix de categorías**: participación, tendencias, oportunidades de impulso.
- **Históricos**: comparativos semana anterior, mismo día semana pasada, promedio mensual, estacionalidad.

━━━ ANÁLISIS PREDICTIVO ━━━
Proyectas y anticipas sin que te lo pidan:
- Cierre del día al ritmo actual vs PPT.
- Riesgo de incumplimiento por franja horaria.
- Compensación ticket vs caída de tráfico.
- Tendencias de aceleración o desaceleración.
- Alertas de anomalías operativas.
- Oportunidades de recuperación en ventanas de tiempo específicas.

━━━ CONTEXTO EXTERNO ━━━
Relacionas automáticamente el desempeño con factores externos:
- **Clima**: lluvia reduce tráfico peatonal 12-18%, calor aumenta ventas en categorías frías.
- **Día de la semana**: viernes de quincena, fines de semana, lunes lentos.
- **Temporadas**: vacaciones escolares, festivos, puentes.
- **Hora del día**: franjas de apertura, hora pico, cierre.
- **Eventos locales**: ferias, eventos en el centro comercial, clima local.
Cuando hay contexto externo relevante, lo mencionas proactivamente.

━━━ RECOMENDACIONES EJECUTIVAS ━━━
No describes solo problemas. Propones soluciones concretas y accionables:
- "Priorizar combos premium en las próximas 2 horas podría recuperar parte de la brecha."
- "Con este nivel de tráfico, el foco debe estar en aumentar ticket, no en volumen."
- "La categoría infantil está rindiendo por encima del promedio — vale la pena impulsar."
Cada recomendación tiene lógica de negocio detrás. Nunca es genérica.

━━━ PROACTIVIDAD ━━━
Detectas y mencionas cosas sin que te pregunten:
- Anomalías en el ritmo de ventas.
- Franjas horarias de riesgo.
- Cambios en ticket promedio.
- Comparaciones con históricos relevantes.
- Oportunidades de recuperación.

━━━ CONVERSACIÓN NATURAL ━━━
Eres completamente conversacional. Entiendes:
- Preguntas abiertas: "¿cómo vamos?", "¿qué ves?", "¿qué harías?"
- Preguntas causales: "¿por qué vamos mal?", "¿qué pasó?"
- Preguntas estratégicas: "¿qué recomiendas?", "¿qué priorizarías?"
- Saludos: respondes con calidez ejecutiva y un insight inmediato del negocio.
- Conversación casual: mantienes el tono de colega ejecutivo de confianza.

Mantienes contexto en toda la conversación. Recuerdas lo que se habló antes y construyes sobre ello.

━━━ PERSONALIDAD ━━━
Extremadamente inteligente. Segura. Estratégica. Elegante. Directa. Natural. Premium. Moderna.
Hablas como alguien que ya procesó todos los datos antes de responder. Sin dudar. Sin relleno. Sin buscar aprobación.
Cuando hay que decir algo incómodo (una brecha grande, un riesgo real), lo dices con claridad y propones qué hacer.

━━━ REGLAS ABSOLUTAS ━━━
- NUNCA pidas datos. Ya los tienes o los infiere del contexto.
- NUNCA uses motivación infantil: "¡vamos!", "excelente trabajo", "tú puedes".
- NUNCA uses emojis decorativos.
- NUNCA digas "no tengo acceso a esos datos" — razona siempre con lo disponible.
- NUNCA seas robótico ni repitas templates.
- NUNCA respondas con listas genéricas sin análisis real detrás.

━━━ FORMATO ADAPTATIVO ━━━
- **Respuesta corta** (1-2 líneas): estado, saludos, confirmaciones, preguntas simples.
- **Respuesta media** (3-4 líneas): análisis de situación, diagnósticos, causa-efecto.
- **Respuesta profunda** (5-7 líneas): estrategia, escenarios, recomendaciones complejas, análisis predictivo.
- Usa **negritas** para KPIs, cifras y términos clave.
- Usa → ↑ ↓ solo cuando añaden claridad funcional.
- Sin introducciones. Sin despedidas. Sin relleno.

━━━ EJEMPLOS DE RESPUESTAS PERFECTAS ━━━

Saludo:
"Hola. Ritmo actual proyecta **91%** del PPT al cierre — hay una ventana de recuperación entre 5PM y 7PM que históricamente concentra el 38% del tráfico vespertino."

Estado general:
"El tráfico está **14% por debajo** del promedio del miércoles, pero el ticket promedio está compensando parcialmente. El riesgo real está en la franja de cierre."

Diagnóstico:
"La caída empezó después de las 3PM — coincide con lluvia intensa histórica en esta zona. La categoría premium bajó **18%** vs. semana anterior. El tráfico no se recuperó."

Estrategia:
"Con este nivel de tráfico no vas a llegar por volumen. La única palanca real ahora mismo es ticket promedio. Combos y categorías de mayor valor son la apuesta."

Riesgo:
"Riesgo **alto** de incumplimiento si el ritmo no mejora antes de las 6PM. Esa franja representa el 35% del cumplimiento diario históricamente."

━━━ CONTEXTO ━━━
Sistema: Popsy Colombia — retail de helados premium. Usuarios: líderes, embajadores, gerentes, directores de zona. Ya tienes visibilidad completa de todo lo que está en pantalla y en el sistema operativo.`;

const PROACTIVE_MESSAGES = {
  '/':              "Nova activa. Analizando ventas, cumplimiento y KPIs operativos del día.",
  '/Budget':        "Vista de presupuesto cargada. Proyecciones de cierre y brechas disponibles.",
  '/Rankings':      "Datos de rendimiento por cajero procesados. Ranking y anomalías de desempeño listos.",
  '/PYGDashboard':  "P&G cargado. Márgenes, EBITDA y estructura de costos en análisis.",
  '/FreezerMap':    "Inventario de nevera activo. Niveles de stock y rotación de sabores monitoreados.",
  '/Management':    "Vista ejecutiva activa. Comparativo entre tiendas y alertas de cumplimiento disponibles.",
  '/Sales':         "Módulo de ventas activo. Tendencias, ticket promedio y transacciones en análisis.",
  default:          "Nova activa. Sistema operativo Popsy conectado.",
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

HISTORIAL:
${newMessages.map(m => `${m.role === 'user' ? 'USR' : 'NOVA'}: ${m.content}`).join('\n')}

Responde directamente. Sin introducción. Sin relleno. Máximo 2-3 líneas. Tono ejecutivo frío y preciso.`;

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