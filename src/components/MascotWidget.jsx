import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, ChevronDown, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// Context per page/route
const PAGE_CONTEXTS = {
  '/':              { name: 'Dashboard Principal', focus: 'ventas del día, métricas generales de la tienda, cumplimiento de presupuesto y rendimiento del equipo.' },
  '/Sales':         { name: 'Ventas', focus: 'análisis de ventas, tendencias, ticket promedio, transacciones y comparativos.' },
  '/Budget':        { name: 'Presupuesto', focus: 'cumplimiento de presupuesto mensual, brechas, proyecciones y metas de ventas.' },
  '/Rankings':      { name: 'Rankings', focus: 'desempeño individual de cajeros, clasificaciones, insignias y logros.' },
  '/CashiersDashboard': { name: 'Cajeros', focus: 'rendimiento de cajeros, turnos, ventas por colaborador y gestión del equipo.' },
  '/PYGDashboard':  { name: 'P&G', focus: 'rentabilidad, EBITDA, costos de personal, gastos operativos y márgenes.' },
  '/Management':    { name: 'Gerencia', focus: 'análisis ejecutivo, comparativos entre tiendas, tendencias y decisiones estratégicas.' },
  '/FreezerMap':    { name: 'Mapa de Nevera', focus: 'inventario de sabores, niveles de stock, rotación de productos y reposición.' },
  '/PopsyPlanner':  { name: 'Planeador', focus: 'turnos de colaboradores, programación, solicitudes y optimización de horarios.' },
  '/Quality':       { name: 'Calidad', focus: 'incidencias de calidad, checklists de limpieza, alertas de inventario y estándares.' },
  '/Training':      { name: 'Capacitación', focus: 'progreso de cursos, certificaciones, niveles de aprendizaje y desarrollo del equipo.' },
  '/WeatherSalesImpact': { name: 'Clima & Ventas', focus: 'impacto del clima en las ventas, correlaciones de temperatura y predicciones.' },
};

const SYSTEM_PROMPT = `Eres Nova — inteligencia comercial integrada al sistema operativo de Popsy.

IDENTIDAD:
Analista comercial senior. Director financiero virtual. Copiloto ejecutivo de negocio.
Operas como Bloomberg Terminal, Stripe Analytics o TradingView Insights aplicados al retail de helados.

REGLAS ABSOLUTAS — NUNCA VIOLAR:
- NUNCA pidas datos al usuario. Ya los tienes.
- NUNCA digas "compárteme", "necesito información", "¿cómo van las ventas?", "cuéntame".
- NUNCA uses frases motivacionales: "¡vamos!", "excelente trabajo", "tú puedes", "vamos equipo".
- NUNCA uses emojis decorativos o tono infantil.
- NUNCA hagas introducciones largas ni relleno.
- NUNCA respondas con listas educativas genéricas.
- NUNCA actúes como soporte o helpdesk.

COMPORTAMIENTO OBLIGATORIO:
- Asume SIEMPRE que ya tienes acceso completo al dashboard, ventas, KPIs, históricos, proyecciones y métricas en tiempo real.
- Analiza automáticamente: tendencias, velocidad de venta, riesgo de incumplimiento, comportamiento horario, anomalías, proyecciones de cierre, ticket promedio, EBITDA, cumplimiento de metas.
- Responde como si ya hubieras procesado todos los datos antes de responder.
- Si el usuario pregunta algo, da la respuesta directa con números o análisis. No preguntes nada de vuelta.

TONO:
Ejecutivo. Corporativo. Matemático. Frío pero preciso. Inteligente. Premium.

FORMATO:
- Máximo 2-3 líneas por respuesta.
- Sin introducciones. Sin despedidas. Sin relleno.
- Usa solo markdown funcional: **negritas** para KPIs clave, nunca listas decorativas.
- Sin emojis. Excepción: un símbolo funcional tipo → ↑ ↓ · si ayuda a la lectura.

EJEMPLOS DE RESPUESTAS CORRECTAS:
- "Ritmo actual proyecta cierre al **92%** del PPT. Brecha de recuperación: $1.2M en 8 días hábiles."
- "Venta cayó **14%** vs. promedio miércoles. Anomalía en franja 2PM–4PM. Ticket promedio estable."
- "EBITDA proyectado supera baseline mensual en **6%**. Costo de nómina es la única variable de riesgo."
- "Riesgo de incumplimiento: **medio**. Franja 5PM–7PM concentra el 38% del potencial de recuperación."

CONTEXTO DE OPERACIÓN:
Eres parte del sistema de gestión de tiendas Popsy Colombia. El usuario es un líder, embajador o gerente de tienda. Ya tienes visibilidad de todo lo que está en pantalla.`;

const PROACTIVE_MESSAGES = {
  '/':              "Nova activa. Analizando ventas, cumplimiento y KPIs operativos del día.",
  '/Budget':        "Vista de presupuesto cargada. Proyecciones de cierre y brechas disponibles.",
  '/Rankings':      "Datos de rendimiento por cajero procesados. Ranking y anomalías de desempeño listos.",
  '/PYGDashboard':  "P&G cargado. Márgenes, EBITDA y estructura de costos en análisis.",
  '/FreezerMap':    "Inventario de nevera activo. Niveles de stock y rotación de sabores monitoreados.",
  '/Management':    "Vista ejecutiva activa. Comparativo entre tiendas y alertas de cumplimiento disponibles.",
  '/Sales':         "Módulo de ventas activo. Tendencias, ticket promedio y transacciones en análisis.",
  '/Rankings':      "Rendimiento individual procesado. Identifica variaciones y patrones por colaborador.",
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
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          style={{ background: '#C21875' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isNova = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isNova ? 'items-start' : 'items-end flex-row-reverse'}`}
    >
      {isNova && (
        <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 mt-0.5 shadow-sm"
          style={{ border: '1.5px solid rgba(194,24,117,0.3)' }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain" style={{ background: 'white' }} />
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        isNova ? 'rounded-tl-sm' : 'rounded-tr-sm'
      }`}
        style={isNova ? {
          background: 'linear-gradient(135deg, #FFF7FB 0%, #F8D7E8 100%)',
          border: '1px solid rgba(194,24,117,0.15)',
          color: '#5a0e38',
        } : {
          background: 'linear-gradient(135deg, #C21875 0%, #E91E63 100%)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(194,24,117,0.3)',
        }}
      >
        {isNova ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold" style={{ color: '#C21875' }}>{children}</strong>,
              ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 mt-1">{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
              h3: ({ children }) => <h3 className="font-black text-sm mb-1" style={{ color: '#C21875' }}>{children}</h3>,
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Init welcome message when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [isOpen]);

  // Reset and re-init when page changes (if open)
  useEffect(() => {
    if (isOpen) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [path]);

  // Show bubble after delay
  useEffect(() => {
    const t = setTimeout(() => {
      setBubbleMsg(PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default);
      setShowBubble(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOpen) setShowBubble(false);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

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
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema técnico. ¿Puedes intentarlo de nuevo? 🍦' }]);
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

  const panelWidth = isExpanded ? 'w-96' : 'w-80';
  const panelHeight = isExpanded ? 'h-[600px]' : 'h-[480px]';

  return (
    <div className="fixed bottom-6 right-5 z-[9999] flex flex-col items-end gap-3">

      {/* Main Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className={`${panelWidth} ${panelHeight} rounded-3xl flex flex-col overflow-hidden`}
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1.5px solid rgba(194,24,117,0.18)',
              boxShadow: '0 12px 60px rgba(194,24,117,0.2), 0 4px 20px rgba(168,85,247,0.1), 0 40px 80px rgba(0,0,0,0.1)',
            }}
          >
            {/* ── Header ── */}
            <div className="relative flex items-center gap-3 px-4 py-3 flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #C21875 0%, #E91E63 60%, #A855F7 100%)' }}>
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15" style={{ background: 'white' }} />
              <div className="absolute -bottom-4 left-10 w-14 h-14 rounded-full opacity-10" style={{ background: 'white' }} />

              <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-md"
                style={{ border: '2px solid rgba(255,255,255,0.5)' }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain" style={{ background: 'white' }} />
                </div>
                    <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-black text-sm">Nova</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">AI Copilot</span>
                </div>
                <p className="text-pink-100 text-[10px] truncate">{pageCtx.name}</p>
              </div>
              <div className="relative flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-lime-300" style={{ boxShadow: '0 0 6px rgba(163,230,53,0.9)' }} />
                <button onClick={reset} className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10" title="Nueva conversación">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsExpanded(e => !e)} className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(194,24,117,0.2) transparent' }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
                    style={{ border: '1.5px solid rgba(194,24,117,0.3)' }}>
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-contain" style={{ background: 'white' }} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm"
                    style={{ background: 'linear-gradient(135deg,#FFF7FB,#F8D7E8)', border: '1px solid rgba(194,24,117,0.15)' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestions ── */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0"
                style={{ scrollbarWidth: 'none' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg,#FFF7FB,#F8D7E8)',
                      border: '1px solid rgba(194,24,117,0.2)',
                      color: '#C21875',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* ── Input ── */}
            <div className="px-3 pb-3 flex-shrink-0">
              <div className="flex items-end gap-2 rounded-2xl px-3 py-2"
                style={{
                  background: 'linear-gradient(135deg,#FFF7FB,#fff)',
                  border: '1.5px solid rgba(194,24,117,0.2)',
                  boxShadow: '0 2px 12px rgba(194,24,117,0.08)',
                }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregúntame algo sobre tu tienda..."
                  rows={1}
                  className="flex-1 resize-none text-sm bg-transparent outline-none leading-relaxed"
                  style={{ color: '#5a0e38', maxHeight: 80, minHeight: 24 }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#C21875,#E91E63)' }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
              <p className="text-center text-[9px] font-bold tracking-widest mt-1.5"
                style={{ color: 'rgba(194,24,117,0.3)' }}>
                NOVA · POPSY AI COPILOT
              </p>
            </div>

            {/* Bottom bar */}
            <div className="h-0.5 flex-shrink-0" style={{
              background: 'linear-gradient(90deg, #C21875, #E91E63, #A855F7)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative max-w-[200px] rounded-2xl rounded-br-sm px-4 py-3 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(194,24,117,0.25)',
              color: '#7b1450',
              boxShadow: '0 6px 28px rgba(194,24,117,0.22)',
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <p className="text-xs font-semibold leading-snug">{bubbleMsg}</p>
            <p className="text-[9px] mt-1.5 font-bold" style={{ color: '#C21875' }}>Toca para chatear ✨</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Button */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-16 h-16 rounded-full"
      >
        {/* Glow */}
        <motion.div className="absolute -inset-2 rounded-full"
          animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.4) 0%, transparent 70%)' }}
        />
        <motion.div className="absolute -inset-1 rounded-full"
          animate={{ opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
          style={{ border: '2px solid rgba(233,30,99,0.45)', borderRadius: '50%' }}
        />
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden"
          style={{
            border: '2.5px solid rgba(194,24,117,0.65)',
            boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9) inset, 0 8px 32px rgba(194,24,117,0.4)',
            background: 'white',
          }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover scale-[1.6]" style={{ objectPosition: 'center center' }} />
        </div>
        {/* Status dot */}
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'white', border: '1.5px solid rgba(194,24,117,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <div className="w-2 h-2 rounded-full bg-lime-400"
            style={{ boxShadow: '0 0 5px rgba(163,230,53,0.9)' }} />
        </div>
      </motion.button>
    </div>
  );
}