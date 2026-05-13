import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Star, IceCream } from 'lucide-react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

const MESSAGES = [
  "¡Hola! Soy Nova, tu asistente Popsy ✨",
  "¿Cómo van las ventas hoy? 🍦",
  "Todo bajo control en tu tienda 💕",
  "¡Excelente trabajo, equipo! 🌸",
  "Revisando tus métricas...",
  "¿En qué puedo ayudarte? 💫",
];

export default function MascotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showBubble) return;
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showBubble]);

  return (
    <div className="fixed bottom-6 right-5 z-[9999] flex flex-col items-end gap-3">

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="w-72 rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(194,24,117,0.2)',
              boxShadow: '0 8px 48px rgba(194,24,117,0.18), 0 2px 16px rgba(168,85,247,0.1), 0 32px 64px rgba(0,0,0,0.08)'
            }}
          >
            {/* Header */}
            <div className="relative p-4 flex items-center gap-3 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #C21875 0%, #E91E63 50%, #A855F7 100%)',
              }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.6)' }} />
              <div className="absolute -bottom-4 left-8 w-12 h-12 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.5)' }} />

              <div className="relative w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg"
                style={{ border: '2px solid rgba(255,255,255,0.5)' }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div className="relative">
                <p className="text-white font-black text-sm tracking-wide">Nova ✨</p>
                <p className="text-pink-100 text-[10px] font-semibold">Asistente Popsy AI</p>
              </div>
              <div className="relative flex items-center gap-1 ml-auto">
                <div className="w-2 h-2 rounded-full bg-lime-300 shadow-sm" style={{ boxShadow: '0 0 6px rgba(163,230,53,0.8)' }} />
                <button onClick={() => setIsOpen(false)} className="ml-2 text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Message bubble */}
              <motion.div
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl rounded-tl-sm p-3.5 text-sm font-medium leading-relaxed"
                style={{
                  background: 'linear-gradient(135deg, #FFF7FB 0%, #F8D7E8 100%)',
                  border: '1px solid rgba(194,24,117,0.15)',
                  color: '#7b1450',
                }}
              >
                {MESSAGES[msgIndex]}
              </motion.div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: TrendingUp,  label: 'Ver ventas',  gradient: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#C21875', border: 'rgba(194,24,117,0.2)' },
                  { icon: IceCream,    label: 'Mi tienda',   gradient: 'linear-gradient(135deg,#fdf4ff,#f3e8ff)', color: '#A855F7', border: 'rgba(168,85,247,0.2)' },
                  { icon: Star,        label: 'Rankings',    gradient: 'linear-gradient(135deg,#fef9c3,#fef3c7)', color: '#d97706', border: 'rgba(217,119,6,0.2)'  },
                  { icon: Sparkles,    label: 'Insights',    gradient: 'linear-gradient(135deg,#fce7f3,#ede9fe)', color: '#E91E63', border: 'rgba(233,30,99,0.2)'   },
                ].map(({ icon: Icon, label, gradient, color, border }) => (
                  <button key={label}
                    className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all hover:scale-[1.03] active:scale-95"
                    style={{ background: gradient, border: `1.5px solid ${border}`, color }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Footer tag */}
              <p className="text-center text-[9px] font-bold tracking-widest uppercase"
                style={{ color: 'rgba(194,24,117,0.35)' }}>
                Powered by Popsy AI
              </p>
            </div>

            {/* Bottom gradient bar */}
            <div className="h-1" style={{
              background: 'linear-gradient(90deg, #C21875, #E91E63, #A855F7, #E91E63, #C21875)',
              backgroundSize: '300% 100%',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.75, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.75, x: 12 }}
            transition={{ type: 'spring', damping: 20 }}
            className="max-w-[190px] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(194,24,117,0.25)',
              color: '#7b1450',
              boxShadow: '0 4px 24px rgba(194,24,117,0.2)',
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <motion.span key={msgIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {MESSAGES[msgIndex]}
            </motion.span>
            {/* Little arrow */}
            <div className="absolute -bottom-2 right-6 w-3 h-2 overflow-hidden">
              <div className="w-3 h-3 rotate-45 -translate-y-1.5"
                style={{ background: 'white', border: '1.5px solid rgba(194,24,117,0.25)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Orb Button */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-16 h-16 rounded-full overflow-visible"
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(194,24,117,0.35) 0%, transparent 70%)',
          }}
        />

        {/* Second pulse ring */}
        <motion.div
          className="absolute -inset-1 rounded-full"
          animate={{ opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{
            border: '2px solid rgba(233,30,99,0.4)',
            borderRadius: '50%',
          }}
        />

        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden"
          style={{
            border: '2.5px solid rgba(194,24,117,0.6)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.8) inset, 0 8px 32px rgba(194,24,117,0.35)',
          }}
        >
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
          {/* Glossy overlay */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)' }} />
        </div>

        {/* Online dot */}
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'white', border: '1.5px solid rgba(194,24,117,0.3)' }}>
          <div className="w-2 h-2 rounded-full bg-lime-400"
            style={{ boxShadow: '0 0 6px rgba(163,230,53,0.9)' }} />
        </div>
      </motion.button>
    </div>
  );
}