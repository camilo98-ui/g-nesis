import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_PRIZES_TIENDA = [
  { id: 1, name: 'Descanso Pago', value: 0, color: '#FFD4E5', emoji: '🏖️' },
  { id: 2, name: 'Bono $30.000', value: 30000, color: '#E5D4FF', emoji: '💳' },
  { id: 3, name: 'Malteada Gratis', value: 0, color: '#C7ECFF', emoji: '🍫' },
  { id: 4, name: 'Entradas Cine x2', value: 0, color: '#FFE7CC', emoji: '🎬' },
  { id: 5, name: 'Domingo Pago', value: 0, color: '#D4F4DD', emoji: '☀️' },
];

const DEFAULT_PRIZES_DISTRITO = [
  { id: 1, name: 'Bono $80.000 Olímpica', value: 80000, color: '#FFE4E8', emoji: '💰' },
  { id: 2, name: 'Pase Piscilago 4 personas', value: 0, color: '#E8E4FF', emoji: '🏊' },
  { id: 3, name: 'Domingo remunerado', value: 0, color: '#D4F1F4', emoji: '☀️' },
  { id: 4, name: 'Descanso remunerado', value: 0, color: '#FFF4E4', emoji: '🏖️' },
  { id: 5, name: 'Litro de helado', value: 0, color: '#E4F8E8', emoji: '🍦' },
  { id: 6, name: 'Entradas Cine PREMIUM', value: 0, color: '#FFE8DC', emoji: '🎥' },
  { id: 7, name: 'Descanso + Malteada', value: 0, color: '#F4E4FF', emoji: '🍹' },
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
                ? 'transform 3s cubic-bezier(0.33, 0.0, 0.2, 1)'
                : suspensePhase === 1 
                  ? 'transform 2.2s cubic-bezier(0.45, 0.0, 0.55, 1)'
                  : suspensePhase === 2
                    ? 'transform 1.2s cubic-bezier(0.6, 0.0, 0.4, 1)'
                    : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'none'
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <style>
                {`
                  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&display=swap');
                  text { font-family: 'Poppins', sans-serif; }
                `}
              </style>
            </defs>
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
              
              // Posición más cerca del borde exterior para mejor legibilidad
              const textRadius = 35;
              const textX = 50 + textRadius * Math.cos(midAngle);
              const textY = 50 + textRadius * Math.sin(midAngle);
              // Texto siempre horizontal para máxima legibilidad
              const textRotation = 0;
              
              // Calcular luminosidad del color para determinar si usar texto claro u oscuro
              const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
                } : null;
              };
              
              const rgb = hexToRgb(prize.color);
              const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 0.5;
              const textColor = luminance > 0.6 ? '#1f2937' : '#ffffff';
              
              // Ajustar tamaño del texto según longitud del nombre
              const nameLength = prize.name.length;
              let fontSize = 3.2;
              if (nameLength > 25) fontSize = 2.6;
              else if (nameLength > 20) fontSize = 2.8;
              else if (nameLength > 15) fontSize = 3;
              
              // Dividir texto en dos líneas de forma inteligente
              const words = prize.name.split(' ');
              const shouldSplit = nameLength > 18 && words.length > 2;
              let line1 = prize.name;
              let line2 = '';
              
              if (shouldSplit) {
                // Buscar punto de quiebre natural
                const mid = Math.floor(words.length / 2);
                line1 = words.slice(0, mid).join(' ');
                line2 = words.slice(mid).join(' ');
              }

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
                    fill={textColor}
                  >
                    <tspan x={textX} fontSize="4.5" dy="-3.5">{prize.emoji}</tspan>
                    {shouldSplit ? (
                      <>
                        <tspan x={textX} fontSize={fontSize} fontWeight="600" dy="3.8">{line1}</tspan>
                        <tspan x={textX} fontSize={fontSize} fontWeight="600" dy="3.4">{line2}</tspan>
                      </>
                    ) : (
                      <tspan x={textX} fontSize={fontSize} fontWeight="600" dy="3.8">{line1}</tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>


        </motion.div>
      </div>


    </div>
  );
}