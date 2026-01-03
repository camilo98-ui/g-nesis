import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_PRIZES_TIENDA = [
  { id: 1, name: 'Descanso remunerado', value: 0, color: '#FFB5C5', emoji: '🏖️' },
  { id: 2, name: 'Bono $30.000 Olímpica', value: 30000, color: '#D4A5D8', emoji: '💳' },
  { id: 3, name: 'Malteada chocolate', value: 0, color: '#A5D8FF', emoji: '🍫' },
  { id: 4, name: 'Entradas Cinecolombia', value: 0, color: '#FFD9A5', emoji: '🎬' },
  { id: 5, name: 'Domingo remunerado', value: 0, color: '#C9FFD4', emoji: '☀️' },
];

const DEFAULT_PRIZES_DISTRITO = [
  { id: 1, name: 'Pase Piscilago 4 personas', value: 0, color: '#FFB5C5', emoji: '🏊' },
  { id: 2, name: 'Domingo remunerado', value: 0, color: '#D4A5D8', emoji: '☀️' },
  { id: 3, name: 'Descanso remunerado', value: 0, color: '#A5D8FF', emoji: '🏖️' },
  { id: 4, name: 'Entradas Cine PREMIUM', value: 0, color: '#FFD9A5', emoji: '🎥' },
  { id: 5, name: 'Litro de helado', value: 0, color: '#C9FFD4', emoji: '🍦' },
  { id: 6, name: 'Descanso + Malteada', value: 0, color: '#FFE5CC', emoji: '🍹' },
  { id: 7, name: 'Bono $80.000 Olímpica', value: 80000, color: '#FFD0E5', emoji: '💰' },
];

export default function RouletteWheel({ onResult, disabled, awardType = 'tienda', storeId }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [suspensePhase, setSuspensePhase] = useState(0);

  const { data: configs = [] } = useQuery({
    queryKey: ['rouletteConfig', storeId],
    queryFn: () => base44.entities.RouletteConfig.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const activeConfig = configs.find(c => c.is_active && c.award_type === awardType);
  
  const PRIZES = activeConfig?.prizes 
    ? JSON.parse(activeConfig.prizes) 
    : (awardType === 'distrito' ? DEFAULT_PRIZES_DISTRITO : DEFAULT_PRIZES_TIENDA);
  
  const SPIN_DURATION = activeConfig?.spin_duration || 6500;

  const handleSpin = () => {
    if (spinning || disabled) return;
    
    setSpinning(true);
    setWinner(null);
    setSuspensePhase(0);
    
    // Seleccionar premio aleatorio
    const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const prizeIndex = PRIZES.findIndex(p => p.id === randomPrize.id);
    
    // Calcular rotación final con suspenso extra
    const degreesPerSegment = 360 / PRIZES.length;
    const targetRotation = 360 * 8 + (prizeIndex * degreesPerSegment) + (degreesPerSegment / 2);
    
    setRotation(targetRotation);
    
    // Fase de suspenso 1
    setTimeout(() => setSuspensePhase(1), 3000);
    
    // Fase de suspenso 2 (casi detiene)
    setTimeout(() => setSuspensePhase(2), 5500);
    
    // Resultado final con rebote
    setTimeout(() => {
      setSuspensePhase(3);
      setSpinning(false);
      setWinner(randomPrize);
      setShowConfetti(true);
      onResult(randomPrize);
      
      setTimeout(() => setShowConfetti(false), 4000);
    }, SPIN_DURATION);
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
      <div className="relative w-[500px] h-[500px] mx-auto max-w-full">
        {/* Indicador superior */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          animate={{ 
            y: [0, -8, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-pink-500 filter drop-shadow-2xl" />
        </motion.div>

        {/* Círculo de la ruleta - SVG */}
        <motion.div
          className="w-full h-full rounded-full relative border-[12px] border-white overflow-hidden"
          animate={{
            boxShadow: spinning 
              ? ['0 25px 50px -12px rgba(0, 0, 0, 0.25)', '0 25px 50px -12px rgba(236, 72, 153, 0.5)', '0 25px 50px -12px rgba(0, 0, 0, 0.25)']
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          transition={{
            boxShadow: { duration: 0.5, repeat: spinning ? Infinity : 0 }
          }}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: spinning 
              ? suspensePhase === 0 
                ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                : suspensePhase === 1 
                  ? 'transform 2.5s cubic-bezier(0.4, 0.0, 0.6, 1)'
                  : suspensePhase === 2
                    ? 'transform 1s cubic-bezier(0.5, 0.0, 0.75, 0.0)'
                    : 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              : 'none'
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {PRIZES.map((prize, index) => {
              const segmentAngle = 360 / PRIZES.length;
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
              const x1 = 50 + 50 * Math.cos(startAngle);
              const y1 = 50 + 50 * Math.sin(startAngle);
              const x2 = 50 + 50 * Math.cos(endAngle);
              const y2 = 50 + 50 * Math.sin(endAngle);
              const largeArc = segmentAngle > 180 ? 1 : 0;
              const midAngle = (startAngle + endAngle) / 2;
              const textX = 50 + 32 * Math.cos(midAngle);
              const textY = 50 + 32 * Math.sin(midAngle);
              const textRotation = (midAngle * 180 / Math.PI) + 90;

              return (
                <g key={prize.id}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation} ${textX} ${textY})`}
                    fontSize="8"
                    fontWeight="bold"
                    fill="#1f2937"
                  >
                    <tspan x={textX} dy="-3" fontSize="6">{prize.emoji}</tspan>
                    <tspan x={textX} dy="4" fontSize="2.5" fontWeight="900">{prize.name}</tspan>
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Centro de la ruleta */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-2xl border-6 border-white z-10"
            animate={{
              scale: spinning ? [1, 1.1, 1] : 1,
              rotate: spinning ? 360 : 0
            }}
            transition={{
              scale: { duration: 0.5, repeat: spinning ? Infinity : 0 },
              rotate: { duration: 2, repeat: spinning ? Infinity : 0, ease: "linear" }
            }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
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