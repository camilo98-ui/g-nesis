import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Send, Mic } from 'lucide-react';

const SUGGESTION_MESSAGES = [
  "¿Cuánto vendimos hoy?",
  "¿Cómo van los cajeros este mes?",
  "¿Cuál es el ticket promedio?",
  "¿Qué tienda lidera ventas?",
  "¿Cómo ver el presupuesto?",
  "¿Qué es la participación del negocio?",
];

// Mascota cono de helado 3D con SVG
function IceCreamMascot({ isTalking, isThinking }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <defs>
        {/* Gradientes 3D */}
        <radialGradient id="scoopGrad1" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="40%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>
        <radialGradient id="scoopGrad2" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="40%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="scoopGrad3" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="40%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </radialGradient>
        <radialGradient id="coneGrad" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <filter id="shadow3d">
          <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="rgba(0,0,0,0.25)" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Sombra del suelo */}
      <ellipse cx="60" cy="158" rx="28" ry="5" fill="rgba(0,0,0,0.12)" />

      {/* CONO - cuerpo principal */}
      <g filter="url(#shadow3d)">
        {/* Cono principal */}
        <path d="M35 95 L60 155 L85 95 Z" fill="url(#coneGrad)" />
        {/* Líneas de textura del cono */}
        <line x1="48" y1="95" x2="55" y2="148" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        <line x1="60" y1="95" x2="60" y2="155" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <line x1="72" y1="95" x2="65" y2="148" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        {/* Líneas horizontales del cono */}
        <path d="M37 105 Q60 110 83 105" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        <path d="M40 115 Q60 120 80 115" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        <path d="M43 125 Q60 130 77 125" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        <path d="M47 135 Q60 140 73 135" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
        {/* Brillo del cono */}
        <path d="M38 100 Q45 98 50 102 Q46 108 40 106 Z" fill="rgba(255,255,255,0.35)" />
      </g>

      {/* BOLA INFERIOR - Verde */}
      <g filter="url(#shadow3d)">
        <circle cx="60" cy="88" r="28" fill="url(#scoopGrad3)" />
        {/* Textura bola */}
        <circle cx="60" cy="88" r="28" fill="url(#shadowGrad)" />
        {/* Brillo 3D */}
        <ellipse cx="50" cy="76" rx="10" ry="7" fill="rgba(255,255,255,0.45)" transform="rotate(-20,50,76)" />
        <ellipse cx="53" cy="79" rx="5" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(-20,53,79)" />
      </g>

      {/* BOLA MEDIA - Amarilla */}
      <g filter="url(#shadow3d)">
        <circle cx="60" cy="62" r="26" fill="url(#scoopGrad2)" />
        <circle cx="60" cy="62" r="26" fill="url(#shadowGrad)" />
        <ellipse cx="50" cy="50" rx="9" ry="6" fill="rgba(255,255,255,0.45)" transform="rotate(-20,50,50)" />
        <ellipse cx="53" cy="53" rx="4.5" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(-20,53,53)" />
      </g>

      {/* BOLA SUPERIOR - Rosa (cabeza) */}
      <g filter="url(#shadow3d)">
        <circle cx="60" cy="37" r="30" fill="url(#scoopGrad1)" />
        <circle cx="60" cy="37" r="30" fill="url(#shadowGrad)" />
        {/* Brillo principal */}
        <ellipse cx="47" cy="23" rx="11" ry="8" fill="rgba(255,255,255,0.5)" transform="rotate(-20,47,23)" />
        <ellipse cx="50" cy="26" rx="5.5" ry="3.5" fill="rgba(255,255,255,0.65)" transform="rotate(-20,50,26)" />
      </g>

      {/* CARA - Ojos */}
      {/* Ojo izquierdo */}
      <g>
        <ellipse cx="50" cy="33" rx="6" ry="7" fill="white" />
        <ellipse cx="50" cy="33" rx="4" ry="5" fill="#1e1b4b" />
        <ellipse cx="51.5" cy="31" rx="1.5" ry="2" fill="white" />
        {/* Parpadeo */}
        <motion.rect
          x="44" y="27" width="12" height="12" rx="6" fill="url(#scoopGrad1)"
          animate={isTalking ? { scaleY: [1, 0.1, 1, 1, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: isTalking ? 0.8 : 4, repeat: Infinity, repeatDelay: isTalking ? 0.5 : 2 }}
          style={{ transformOrigin: '50px 33px' }}
        />
      </g>
      {/* Ojo derecho */}
      <g>
        <ellipse cx="70" cy="33" rx="6" ry="7" fill="white" />
        <ellipse cx="70" cy="33" rx="4" ry="5" fill="#1e1b4b" />
        <ellipse cx="71.5" cy="31" rx="1.5" ry="2" fill="white" />
        <motion.rect
          x="64" y="27" width="12" height="12" rx="6" fill="url(#scoopGrad1)"
          animate={isTalking ? { scaleY: [1, 0.1, 1, 1, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: isTalking ? 0.8 : 4, repeat: Infinity, repeatDelay: isTalking ? 0.5 : 2 }}
          style={{ transformOrigin: '70px 33px' }}
        />
      </g>

      {/* BOCA */}
      {isTalking ? (
        <motion.ellipse
          cx="60" cy="46" rx="7" ry="5"
          fill="#7c2d12"
          animate={{ ry: [5, 7, 4, 6, 5] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      ) : (
        <path d="M52 45 Q60 52 68 45" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}

      {/* Mejillas */}
      <ellipse cx="43" cy="44" rx="5" ry="3.5" fill="rgba(251,113,133,0.45)" />
      <ellipse cx="77" cy="44" rx="5" ry="3.5" fill="rgba(251,113,133,0.45)" />

      {/* Chispas/sprinkles decorativos en las bolas */}
      <rect x="65" y="70" width="4" height="2" rx="1" fill="#ef4444" transform="rotate(30,65,70)" />
      <rect x="52" y="78" width="4" height="2" rx="1" fill="#3b82f6" transform="rotate(-20,52,78)" />
      <rect x="70" y="82" width="3" height="1.5" rx="0.75" fill="#f59e0b" transform="rotate(45,70,82)" />
      <rect x="48" y="65" width="3" height="1.5" rx="0.75" fill="#8b5cf6" transform="rotate(-30,48,65)" />
      <rect x="67" y="58" width="4" height="2" rx="1" fill="#10b981" transform="rotate(15,67,58)" />
      <rect x="50" y="55" width="3" height="1.5" rx="0.75" fill="#f43f5e" transform="rotate(-45,50,55)" />

      {/* Antenita con estrellita */}
      <line x1="60" y1="7" x2="60" y2="14" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
      <motion.polygon
        points="60,3 61.5,7 65,7 62.5,9.5 63.5,13 60,11 56.5,13 57.5,9.5 55,7 58.5,7"
        fill="#fbbf24"
        filter="url(#glow)"
        animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '60px 8px' }}
      />

      {/* Efecto thinking - burbujas */}
      {isThinking && (
        <>
          <motion.circle cx="80" cy="20" r="3" fill="rgba(236,72,153,0.6)"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} />
          <motion.circle cx="88" cy="13" r="4" fill="rgba(236,72,153,0.6)"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.25 }} />
          <motion.circle cx="97" cy="6" r="5" fill="rgba(236,72,153,0.6)"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.5 }} />
        </>
      )}
    </svg>
  );
}

export default function StoreMascot({ storeId, storeName, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [bubbleMsg, setBubbleMsg] = useState('');
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const messagesEndRef = useRef(null);

  // Rotar sugerencias en el globo de voz
  useEffect(() => {
    setBubbleMsg(SUGGESTION_MESSAGES[0]);
    const interval = setInterval(() => {
      setBubbleIndex(prev => {
        const next = (prev + 1) % SUGGESTION_MESSAGES.length;
        setBubbleMsg(SUGGESTION_MESSAGES[next]);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const storePart = storeName ? ` de ${storeName}` : '';
      setMessages([{
        role: 'assistant',
        content: `¡Hola! 🍦 Soy **Popsy**, tu asistente inteligente${storePart}. Puedo responderte sobre ventas, cajeros, presupuestos, tickets, métricas y mucho más. ¿En qué te puedo ayudar hoy?`
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const question = text || input.trim();
    if (!question) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setIsLoading(true);
    setIsTalking(false);

    const storeContext = storeName ? `Tienda activa: ${storeName} (ID: ${storeId})` : 'Sin tienda seleccionada (vista gerencial)';
    const roleContext = `Rol del usuario: ${userRole || 'desconocido'}`;

    const systemPrompt = `Eres Popsy, la mascota inteligente de la cadena de heladerías Popsy. Eres amigable, divertido y muy conocedor del negocio. Respondes en español de Colombia, con emojis ocasionales y un tono cálido pero profesional.

CONTEXTO ACTUAL:
- ${storeContext}
- ${roleContext}

SOBRE EL SISTEMA:
- El sistema gestiona tiendas de helados Popsy en Colombia
- Las tiendas tienen métricas de: ventas diarias (total_sales), tickets (total_tickets), transacciones (total_transactions), sugeridos (total_suggested), ticket promedio
- Los cajeros tienen turnos (mañana/tarde/noche), metas y rankings
- Hay presupuestos mensuales por tienda
- Hay un mapa de nevera para inventario
- Hay informes gerenciales, P&G, comparables entre tiendas
- Los roles son: gerente (visión global), líder (gestión punto), embajador (ejecución)
- La app tiene: Dashboard (tienda), Cajeros, Mapa Nevera, Rankings, Presupuesto, Txn por Hora, Participación, P&G, Informe

CÓMO NAVEGAR:
- Para ver ventas → ir a "Tienda" (Dashboard)
- Para ver cajeros → ir a "Cajeros" 
- Para ver inventario → ir a "Mapa Nevera"
- Para ver presupuesto → presionar el botón de Presupuesto en Dashboard
- Para registrar ventas → presionar el card "Registrar Ventas" en el menú principal
- Para ver informes → card "Informe" en el menú
- Para P&G → card "Ver P&G" en el menú

Responde de forma concisa y útil. Si no sabes algo específico de los datos actuales de la tienda, orienta al usuario hacia dónde encontrar esa información en el sistema.`;

    const prompt = `${systemPrompt}\n\nHistorial:\n${newMessages.map(m => `${m.role === 'user' ? 'Usuario' : 'Popsy'}: ${m.content}`).join('\n')}\n\nResponde como Popsy:`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setIsLoading(false);
    setIsTalking(true);
    setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    setTimeout(() => setIsTalking(false), 3000);
  };

  return (
    <>
      {/* Mascota flotante */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Globo de sugerencia */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key={bubbleMsg}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              transition={{ duration: 0.4 }}
              className="relative bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-pink-100 max-w-[180px] cursor-pointer"
              onClick={() => { setIsOpen(true); handleSend(bubbleMsg); }}
              style={{ boxShadow: '0 4px 20px rgba(236,72,153,0.2)' }}
            >
              <p className="text-xs font-medium text-slate-700 leading-tight">{bubbleMsg}</p>
              {/* Puntita del globo */}
              <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-b border-r border-pink-100 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascota botón */}
        <motion.div
          className="w-20 h-28 cursor-pointer relative"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IceCreamMascot isTalking={isTalking && isOpen} isThinking={isLoading} />
        </motion.div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-36 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col"
            style={{ maxHeight: '520px', boxShadow: '0 20px 60px rgba(236,72,153,0.25), 0 4px 20px rgba(0,0,0,0.1)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-14 flex-shrink-0">
                <IceCreamMascot isTalking={isTalking} isThinking={isLoading} />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Popsy 🍦</p>
                <p className="text-white/80 text-[11px]">
                  {isLoading ? '✨ Pensando...' : storeName ? `Asistente de ${storeName}` : 'Asistente Popsy'}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-pink-50/30 to-white">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-br-sm'
                      : 'bg-white text-slate-700 shadow-sm border border-pink-100 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-pink-100">
                    <div className="flex gap-1">
                      <motion.div className="w-2 h-2 bg-pink-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-pink-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                      <motion.div className="w-2 h-2 bg-pink-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-pink-50 bg-pink-50/30">
              {SUGGESTION_MESSAGES.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  className="flex-shrink-0 text-[10px] bg-white border border-pink-200 text-pink-600 rounded-full px-2.5 py-1 hover:bg-pink-50 transition-colors disabled:opacity-50 font-medium"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-pink-100 bg-white flex gap-2 items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Pregúntame algo..."
                disabled={isLoading}
                className="flex-1 text-xs border border-pink-200 rounded-xl px-3 py-2 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:opacity-50 bg-pink-50/30"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center disabled:opacity-40 hover:shadow-lg transition-all"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}