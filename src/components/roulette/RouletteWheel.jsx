import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PRIZES = [
  { id: 1, name: 'Bono $50.000', value: 50000, color: '#FFB5C5', emoji: '💰' },
  { id: 2, name: 'Bono $30.000', value: 30000, color: '#D4A5D8', emoji: '💵' },
  { id: 3, name: 'Un día libre', value: 0, color: '#A5D8FF', emoji: '🏖️' },
  { id: 4, name: 'Medio turno libre', value: 0, color: '#FFD9A5', emoji: '⏰' },
  { id: 5, name: 'Combo Doble Popsy', value: 15000, color: '#C9FFD4', emoji: '🍦' },
  { id: 6, name: 'Popsy Pack', value: 20000, color: '#FFE5CC', emoji: '🎁' },
  { id: 7, name: 'Outfit libre', value: 0, color: '#E5CCFF', emoji: '👕' },
  { id: 8, name: 'Tarjeta Regalo', value: 40000, color: '#FFD0E5', emoji: '💳' },
];

export default function RouletteWheel({ onResult, disabled }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSpin = () => {
    if (spinning || disabled) return;
    
    setSpinning(true);
    setWinner(null);
    
    // Seleccionar premio aleatorio
    const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const prizeIndex = PRIZES.findIndex(p => p.id === randomPrize.id);
    
    // Calcular rotación final
    const degreesPerSegment = 360 / PRIZES.length;
    const targetRotation = 360 * 5 + (prizeIndex * degreesPerSegment) + (degreesPerSegment / 2);
    
    setRotation(targetRotation);
    
    // Después de 4 segundos, mostrar resultado
    setTimeout(() => {
      setSpinning(false);
      setWinner(randomPrize);
      setShowConfetti(true);
      onResult(randomPrize);
      
      setTimeout(() => setShowConfetti(false), 3000);
    }, 4000);
  };

  return (
    <div className="relative">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${50}%`,
                  top: `${50}%`,
                  background: PRIZES[i % PRIZES.length].color,
                }}
                initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                  x: (Math.random() - 0.5) * 800,
                  y: (Math.random() - 0.5) * 800,
                  rotate: Math.random() * 720
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                  delay: i * 0.02
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Ruleta */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Indicador superior */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-pink-500 filter drop-shadow-lg" />
        </motion.div>

        {/* Círculo de la ruleta */}
        <motion.div
          className="w-full h-full rounded-full relative shadow-2xl overflow-hidden border-8 border-white"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {/* Segmentos */}
          {PRIZES.map((prize, index) => {
            const rotation = (360 / PRIZES.length) * index;
            return (
              <div
                key={prize.id}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.tan((Math.PI * 2) / (PRIZES.length * 2)) * 50}% 0%)`,
                }}
              >
                <div 
                  className="w-full h-full flex items-start justify-center pt-8"
                  style={{ background: prize.color }}
                >
                  <div 
                    className="text-center"
                    style={{ transform: `rotate(${22.5}deg)` }}
                  >
                    <div className="text-3xl mb-1">{prize.emoji}</div>
                    <p className="text-[9px] font-bold text-gray-700 leading-tight px-1">
                      {prize.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Centro de la ruleta */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-xl border-4 border-white z-10">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Botón de girar */}
      <motion.div className="mt-8 text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleSpin}
            disabled={spinning || disabled}
            className="px-12 py-6 text-xl font-black bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:from-pink-500 hover:via-rose-500 hover:to-pink-600 text-white rounded-full shadow-2xl disabled:opacity-50 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: spinning ? ['-100%', '200%'] : '-100%' }}
              transition={{ duration: 1, repeat: spinning ? Infinity : 0, ease: "linear" }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {spinning ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  Girando...
                </>
              ) : (
                <>
                  <Gift className="w-6 h-6" />
                  GIRAR RULETA
                </>
              )}
            </span>
          </Button>
        </motion.div>
        {disabled && (
          <p className="text-sm text-gray-500 mt-3">🎉 Giro utilizado</p>
        )}
      </motion.div>
    </div>
  );
}