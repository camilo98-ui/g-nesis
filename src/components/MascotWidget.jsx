import { useState, useEffect, useRef, useCallback } from 'react';
import { useNova } from '@/components/NovaContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// Renders the mascot with white bg removed via mix-blend-mode multiply
// The outer div is white (isolated stacking context), the image multiplies against it — white becomes transparent
function MascotCanvas({ width = 96, height = 96, style = {} }) {
  return (
    <div style={{
      width, height,
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      isolation: 'isolate',
      borderRadius: 4,
      ...style,
    }}>
      <img
        src={MASCOT_IMG}
        alt="Nova"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'multiply',
          display: 'block',
        }}
      />
    </div>
  );
}

// Blinking eyes overlay — positioned absolutely over the mascot
function BlinkingEyes({ size = 96 }) {
  // Eye positions as % of image — adjust to match the character's eyes
  const scale = size / 96;
  const eyeSize = Math.max(3, 5 * scale);
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ inset: 0, zIndex: 20 }}
      animate={{ scaleY: [1, 1, 1, 0.05, 1, 1, 1, 1, 1, 0.05, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.38, 0.40, 0.42, 0.65, 0.73, 0.75, 0.77, 0.9, 1] }}
    >
      {/* Left eye */}
      <div style={{
        position: 'absolute',
        width: eyeSize,
        height: eyeSize,
        borderRadius: '50%',
        background: '#1a0a10',
        left: `${38 * scale}%`,
        top: `${36 * scale}%`,
      }} />
      {/* Right eye */}
      <div style={{
        position: 'absolute',
        width: eyeSize,
        height: eyeSize,
        borderRadius: '50%',
        background: '#1a0a10',
        left: `${54 * scale}%`,
        top: `${36 * scale}%`,
      }} />
    </motion.div>
  );
}

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

const SYSTEM_PROMPT = `Eres Nova — la asistente de IA de Popsy Colombia.

Eres una IA de clase mundial, como ChatGPT. Puedes responder sobre cualquier tema: operaciones de la tienda, ventas, estrategia de negocio, preguntas generales, conocimiento del mundo, redacción, ideas, matemáticas, o lo que sea que te pregunten.

CÓMO HABLAS:
Natural, inteligente y directo. Sin rodeos, sin relleno corporativo, sin motivación vacía. Eres como un colega brillante que sabe de todo y habla de frente.

Cuando el tema sea de la app o el negocio, dale contexto operativo de Popsy (ventas, cajeros, presupuesto, turnos, etc). Cuando sea un tema general, responde como lo haría un experto en ese tema.

Varía cómo empiezas cada respuesta. No repitas estructuras. Sé espontánea dentro de la inteligencia.

REGLAS IRROMPIBLES:
- Responde sobre CUALQUIER tema, nunca digas que no puedes ayudar.
- No uses emojis decorativos.
- No uses motivación vacía: "¡vamos!", "excelente", "tú puedes".
- No escribas como reporte. Escribe como una conversación inteligente.
- Mantén el hilo de la conversación.

LONGITUD:
- Corta (1-2 líneas): saludos, preguntas simples, confirmaciones.
- Media (2-4 líneas): explicaciones, diagnósticos, análisis.
- Profunda (4-8 líneas): estrategia, temas complejos, múltiples puntos.
Nunca más largo de lo necesario.

Usa **negritas** para conceptos clave y cifras importantes. Sin introducciones ni despedidas innecesarias.

CONTEXTO DE LA APP: Popsy Colombia — retail de helados premium. Usuarios: líderes, embajadores, gerentes, directores.`;

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
        <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 mt-0.5 flex items-center justify-center"
          style={{ border: '1px solid rgba(194,24,117,0.15)', background: 'rgba(255,240,248,0.8)' }}>
          <MascotCanvas width={24} height={24} />
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
  const { pageData } = useNova() || {};
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

    const fmt = (n) => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(n)) : '$0';
    
    const d = pageData || {};
    const dataBlock = pageData ? `
DATOS REALES DE LA TIENDA (usa estos números exactos al responder):
- Tienda: ${d.store} (${d.storeCode})
${d.venta_hoy != null ? `- Venta de hoy: ${fmt(d.venta_hoy)} · ${d.transacciones_hoy ?? 0} transacciones · ticket promedio ${fmt(d.ticket_promedio_hoy)} · variación vs ayer: ${d.variacion_vs_ayer > 0 ? '+' : ''}${d.variacion_vs_ayer ?? 0}%` : ''}
${d.ventas_acumuladas != null ? `- Ventas acumuladas mes: ${fmt(d.ventas_acumuladas)}` : ''}
${d.presupuesto_mes ? `- Presupuesto mensual: ${fmt(d.presupuesto_mes)}` : ''}
${d.ppt_dia ? `- PPT del día: ${fmt(d.ppt_dia)}` : ''}
${d.cumplimiento_pct != null ? `- Cumplimiento vs PPT: ${d.cumplimiento_pct}%` : ''}
${d.cumplimiento_proyeccion != null ? `- Cumplimiento proyectado: ${d.cumplimiento_proyeccion?.toFixed ? d.cumplimiento_proyeccion.toFixed(1) : d.cumplimiento_proyeccion}%` : ''}
${d.ticket_promedio ? `- Ticket promedio: ${fmt(d.ticket_promedio)} | Meta: ${fmt(d.ticket_meta)}` : ''}
${d.transacciones != null ? `- Transacciones mes: ${d.transacciones?.toLocaleString()} | Meta: ${d.transacciones_meta?.toLocaleString()}` : ''}
${d.sugeridos != null ? `- Sugeridos vendidos: ${d.sugeridos?.toLocaleString()} | Meta: ${d.sugeridos_meta?.toLocaleString()}` : ''}
${d.proyeccion_cierre ? `- Proyección cierre del mes: ${fmt(d.proyeccion_cierre)}` : ''}
${d.brecha != null ? `- Brecha acumulada vs presupuesto: ${fmt(d.brecha_mes ?? d.brecha)} ${(d.brecha_mes ?? d.brecha) < 0 ? '(por debajo)' : '(por encima)'}` : ''}
${d.venta_diaria_requerida ? `- Venta diaria requerida para cerrar: ${fmt(d.venta_diaria_requerida)}` : ''}
${d.dias_restantes ? `- Días restantes del mes: ${d.dias_restantes}` : ''}
${d.promedio_diario ? `- Promedio diario actual: ${fmt(d.promedio_diario)}` : ''}
- Equipo: ${d.cajeros_activos ?? '?'} cajeros activos${d.total_cajeros ? ` de ${d.total_cajeros} totales` : ''}
` : '';

    const contextPrompt = `${SYSTEM_PROMPT}

SECCIÓN ACTIVA: ${pageCtx.name} — ${pageCtx.focus}
${dataBlock}
CONVERSACIÓN HASTA AHORA:
${newMessages.map(m => `${m.role === 'user' ? 'Usuario' : 'Nova'}: ${m.content}`).join('\n')}

Responde ahora. Natural, inteligente, directo. Cuando hables de la tienda, usa los números exactos del bloque de datos. Adapta la longitud al contexto — corto si es simple, más desarrollado si lo requiere. Sin relleno.`;

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
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-0">

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="w-64 flex flex-col rounded-2xl overflow-hidden mb-1"
            style={{
              height: 390,
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(48px) saturate(160%)',
              WebkitBackdropFilter: 'blur(48px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(190,24,93,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.85)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                backdropFilter: 'blur(20px)',
              }}>
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ border: '1px solid rgba(190,24,93,0.15)', background: 'rgba(255,240,248,0.8)' }}>
                <MascotCanvas width={32} height={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">Nova</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-rose-600"
                    style={{ background: 'rgba(190,24,93,0.08)', letterSpacing: '0.04em' }}>
                    AI
                  </span>
                  <div className="live-dot ml-auto" />
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
                    style={{ border: '1px solid rgba(190,24,93,0.15)', background: 'rgba(255,240,248,0.8)' }}>
                    <MascotCanvas width={24} height={24} />
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
                  placeholder="Pregúntame lo que sea..."
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

      {/* Nova — Free-floating mascot, no container, no background */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 148, height: 158,
          background: 'none', border: 'none', padding: 0,
          position: 'relative', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Ambient ground glow */}
        <motion.div
          className="absolute pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2], scaleX: [0.8, 1.1, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            bottom: -4, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 24,
            background: 'radial-gradient(ellipse, rgba(190,24,93,0.3) 0%, transparent 70%)',
            filter: 'blur(10px)',
            borderRadius: '50%',
          }}
        />

        {/* Floating holographic micro-particles */}
        {[
          { left: 12, top: 22, size: 3, dur: 2.8, delay: 0 },
          { left: 78, top: 38, size: 4, dur: 3.6, delay: 0.9 },
          { left: 44, top: 6,  size: 2.5, dur: 2.4, delay: 1.7 },
          { left: 88, top: 18, size: 2,   dur: 3.1, delay: 0.4 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size, height: p.size,
              left: p.left, top: p.top,
              background: 'rgba(190,24,93,0.55)',
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: [-3, -14, -3],
              x: [0, i % 2 === 0 ? 5 : -5, 0],
              opacity: [0, 0.85, 0],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        {/* The mascot — multiply blend removes white bg, blinking eyes overlay */}
        <motion.div
          className="relative z-10"
          animate={{
            y: [0, -8, -3, -10, -2, 0],
            rotate: [0, 0.6, -0.4, 0.8, -0.2, 0],
            scaleX: [1, 1.014, 1, 1.008, 1],
            scaleY: [1, 1.022, 1, 1.014, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -12, scale: 1.05, transition: { duration: 0.35 } }}
          style={{
            filter: isOpen
              ? 'drop-shadow(0 0 18px rgba(190,24,93,0.6)) drop-shadow(0 6px 20px rgba(190,24,93,0.3))'
              : 'drop-shadow(0 2px 14px rgba(190,24,93,0.3)) drop-shadow(0 8px 24px rgba(190,24,93,0.18))',
            position: 'relative',
          }}
        >
          <MascotCanvas width={140} height={140} />
          <BlinkingEyes size={140} />
        </motion.div>

        {/* Pink glow ring — rendered below the blended image layer */}
        <motion.div
          className="absolute pointer-events-none z-0"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 70, height: 70,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(190,24,93,0.18) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />

        {/* Active indicator */}
        {isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              width: 11, height: 11,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 10px rgba(52,211,153,0.9)',
              zIndex: 20,
            }}
          />
        )}
      </motion.button>
    </div>
  );
}