import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShoppingBag, TrendingUp, Star } from 'lucide-react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/38b5802c3_generated_image.png";

const MESSAGES = [
  "¡Hola! Soy Nova, tu asistente IA 🚀",
  "¿Necesitas ayuda con tus ventas? 📊",
  "Todo bajo control en tu tienda ✨",
  "¡Excelente trabajo hoy! 🌟",
  "Revisando métricas en tiempo real...",
  "¿Cómo puedo ayudarte hoy? 💡",
];

export default function MascotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 3000);
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
    <div className="fixed bottom-6 right-5 z-[9999] flex flex-col items-end gap-2">

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="w-72 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #fff0f6 0%, #ffe4f0 50%, #ffd6ec 100%)',
              border: '2px solid #f0147c',
              boxShadow: '0 0 40px rgba(240,20,124,0.25), 0 25px 50px rgba(0,0,0,0.15)'
            }}
          >
            {/* Header */}
            <div className="relative p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #f0147c 0%, #ff4da6 100%)' }}>
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg flex-shrink-0">
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-black text-sm drop-shadow">Nova AI ✨</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" />
                  <p className="text-pink-100 text-[10px] font-semibold">En línea</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="ml-auto text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#fff' }} />
              <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full opacity-10" style={{ background: '#fff' }} />
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <motion.div
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl rounded-tl-sm p-3 text-sm font-medium"
                style={{
                  background: 'white',
                  border: '1.5px solid #fbc8e0',
                  color: '#6b1240',
                  boxShadow: '0 2px 12px rgba(240,20,124,0.08)'
                }}
              >
                {MESSAGES[msgIndex]}
              </motion.div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: TrendingUp, label: 'Ver ventas', bg: '#fff0f6', color: '#f0147c', border: '#fbc8e0' },
                  { icon: ShoppingBag, label: 'Mi tienda', bg: '#fff4f9', color: '#c9176b', border: '#f9c2de' },
                  { icon: Star, label: 'Rankings', bg: '#fff8e6', color: '#d97706', border: '#fde68a' },
                  { icon: Sparkles, label: 'Insights', bg: '#fdf0ff', color: '#9333ea', border: '#e9d5ff' },
                ].map(({ icon: Icon, label, bg, color, border }) => (
                  <button key={label}
                    className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all hover:scale-105"
                    style={{ background: bg, border: `1.5px solid ${border}`, color }}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer gradient bar */}
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f0147c, #ff6eb4, #ffb347, #ff6eb4, #f0147c)', backgroundSize: '200%' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="max-w-[190px] rounded-2xl rounded-br-sm px-3 py-2.5 text-xs font-bold shadow-xl cursor-pointer"
            style={{
              background: 'white',
              border: '2px solid #f0147c',
              color: '#6b1240',
              boxShadow: '0 4px 20px rgba(240,20,124,0.25)'
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <motion.span key={msgIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {MESSAGES[msgIndex]}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Button */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-3xl overflow-hidden"
        style={{
          boxShadow: '0 0 0 3px #f0147c, 0 0 25px rgba(240,20,124,0.5), 0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />

        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ border: '3px solid #f0147c' }}
        />

        {/* Online dot */}
        <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-lime-400 border-2 border-white shadow" />
      </motion.button>
    </div>
  );
}