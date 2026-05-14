import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import NovaMascot from '@/components/NovaMascot';

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

const SYSTEM_PROMPT = `Eres Nova, la asistente AI copiloto de Popsy — una marca de helados premium de Colombia. Eres inteligente, cálida, elegante y experta en operaciones de retail de helados.

Tu personalidad:
- Hablas en español, con un tono profesional pero amigable y cálido
- Eres proactiva: no esperas que te pregunten, sino que ofreces insights relevantes
- Eres experta en: ventas, métricas de retail, gestión de equipos, rentabilidad y operaciones de tienda
- Usas emojis ocasionalmente pero con elegancia (🍦✨💕📊)
- Respondes de forma concisa pero completa
- Usas formato markdown cuando ayuda (listas, negritas, etc.)
- Si no tienes datos específicos, ofreces orientación general basada en mejores prácticas del retail

Tu rol es ser el copiloto operacional de los gerentes y líderes de tiendas Popsy. Ayudas a:
- Analizar métricas de ventas y desempeño
- Identificar oportunidades de mejora
- Detectar problemas operativos
- Recomendar acciones concretas
- Explicar tendencias y anomalías
- Motivar y guiar al equipo

Siempre responde siendo accionable: da recomendaciones específicas, no solo observaciones.`;

const PROACTIVE_MESSAGES = {
  '/':              "¡Hola! Soy Nova 🍦 ¿Cómo van las ventas hoy? Cuéntame qué necesitas analizar.",
  '/Budget':        "Estoy viendo tu sección de presupuesto. ¿Quieres que analice el cumplimiento de metas o las proyecciones del mes?",
  '/Rankings':      "En rankings puedo ayudarte a identificar quiénes necesitan apoyo y quiénes merecen reconocimiento. ¿Qué cajero te preocupa?",
  '/PYGDashboard':  "El P&G es clave para la rentabilidad. Puedo ayudarte a entender dónde están las mayores oportunidades de mejora. ¿Por dónde empezamos?",
  '/FreezerMap':    "Analizando tu inventario... ¿hay algún sabor que esté bajo en stock o que debas reordenar pronto?",
  '/Management':    "Vista ejecutiva activa. Puedo generar un resumen de las tiendas con mejor y peor desempeño. ¿Lo hacemos?",
  default:          "¡Hola! Soy Nova, tu copiloto Popsy ✨ ¿En qué puedo ayudarte hoy?",
};

const SUGGESTIONS = {
  '/':              ["¿Cuál es mi meta de ventas de hoy?", "¿Cómo va el equipo esta semana?", "¿Qué debo mejorar?"],
  '/Budget':        ["Analiza mi cumplimiento de presupuesto", "¿Voy a llegar a la meta del mes?", "¿Dónde tengo mayor brecha?"],
  '/Rankings':      ["¿Quién tiene el mejor ticket promedio?", "Identifica al cajero con más potencial", "¿Quién necesita capacitación?"],
  '/PYGDashboard':  ["Explica mi EBITDA", "¿Cómo bajo el costo de personal?", "¿Dónde pierdo más dinero?"],
  '/FreezerMap':    ["¿Qué sabores tengo críticos?", "¿Cuáles se venden más?", "¿Qué debo reordenar?"],
  '/Management':    ["Compara todas las tiendas", "¿Cuál tienda tiene más riesgo?", "Resumen ejecutivo de la semana"],
  default:          ["Analiza mi desempeño", "¿Qué debo priorizar hoy?", "Dame un resumen operacional"],
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
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
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

CONTEXTO ACTUAL:
- El usuario está en la sección: ${pageCtx.name}
- Esta sección se enfoca en: ${pageCtx.focus}
- Adapta tu respuesta a este contexto operacional específico.

HISTORIAL DE CONVERSACIÓN:
${newMessages.map(m => `${m.role === 'user' ? 'Usuario' : 'Nova'}: ${m.content}`).join('\n')}

Responde como Nova de forma concisa, accionable y cálida. Máximo 3-4 párrafos cortos o una lista clara.`;

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
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">

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
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
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
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
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

      {/* Speech Bubble — iMessage style */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, x: 16, y: 6 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, x: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative max-w-[210px] cursor-pointer"
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <div
              className="rounded-3xl rounded-br-lg px-4 py-3.5"
              style={{
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(194,24,117,0.2)',
                boxShadow: '0 8px 32px rgba(194,24,117,0.18), 0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <p className="text-xs font-medium leading-relaxed" style={{ color: '#5a0e38' }}>{bubbleMsg}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C21875' }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }} />
                <p className="text-[9px] font-bold tracking-wide uppercase" style={{ color: '#C21875' }}>Nova · toca para chatear</p>
              </div>
            </div>
            {/* Bubble tail */}
            <div className="absolute -bottom-1.5 right-6"
              style={{
                width: 12, height: 12,
                background: 'rgba(255,255,255,0.98)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                border: '1.5px solid rgba(194,24,117,0.2)',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nova Full-Body Mascot */}
      <NovaMascot
        isOpen={isOpen}
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        size={82}
      />
    </div>
  );
}