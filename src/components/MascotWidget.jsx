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

  // Mostrar burbuja de mensaje automáticamente
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
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
              border: '1px solid rgba(255, 140, 50, 0.3)',
              boxShadow: '0 0 40px rgba(255, 100, 20, 0.2), 0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div className="relative p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(255,100,20,0.15), rgba(255,50,100,0.08))' }}>
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-orange-400/30 shadow-lg flex-shrink-0">
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Nova AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-400 text-[10px] font-medium">En línea</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="ml-auto text-white/40 hover:text-white/80 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <motion.div
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl rounded-tl-sm p-3 text-sm text-white/90"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {MESSAGES[msgIndex]}
              </motion.div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: TrendingUp, label: 'Ver ventas', color: 'text-orange-400' },
                  { icon: ShoppingBag, label: 'Mi tienda', color: 'text-pink-400' },
                  { icon: Star, label: 'Rankings', color: 'text-yellow-400' },
                  { icon: Sparkles, label: 'Insights', color: 'text-cyan-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <button key={label}
                    className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium text-white/70 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer glow */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #ff6414, #ff1464, #6414ff)' }} />
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
            className="max-w-[180px] rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white font-medium shadow-xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
              border: '1px solid rgba(255, 140, 50, 0.4)',
              boxShadow: '0 0 20px rgba(255,100,20,0.2)'
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <motion.span
              key={msgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          boxShadow: '0 0 30px rgba(255,100,20,0.5), 0 0 60px rgba(255,100,20,0.2), 0 10px 30px rgba(0,0,0,0.4)',
          border: '2px solid rgba(255, 140, 50, 0.6)'
        }}
      >
        <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />

        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ border: '3px solid rgba(255,140,50,0.6)' }}
        />

        {/* Online dot */}
        <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
      </motion.button>
    </div>
  );
}