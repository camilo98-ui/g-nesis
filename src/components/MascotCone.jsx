import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Trophy, Heart, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { startOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

const CONE_EXPRESSIONS = {
  happy: "😊",
  excited: "🤩",
  thinking: "🤔",
  worried: "😟",
  celebrating: "🎉",
  encouraging: "💪"
};

const MOTIVATIONAL_PHRASES = [
  "¡Vamos equipo! Cada venta cuenta 🍦",
  "¡Hoy es un gran día para superar metas!",
  "Recuerda: un cliente feliz siempre vuelve",
  "¡Los sugeridos hacen la diferencia!",
  "Juntos somos más fuertes 💪",
  "¡Cada ticket es una oportunidad!",
];

export default function MascotCone({ storeId, isOpen, onToggle }) {
  const [isThinking, setIsThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [expression, setExpression] = useState('happy');

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId, is_active: true }),
    enabled: !!storeId
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', storeId],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Análisis de datos
  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const monthSales = dailySales.filter(s => new Date(s.date) >= monthStart);
    const monthRecords = shiftRecords.filter(r => new Date(r.date) >= monthStart);
    
    const totals = monthSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, suggested: 0 });

    const currentBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear());
    const compliance = currentBudget?.sales_budget ? (totals.sales / currentBudget.sales_budget * 100) : 0;

    // Cajeros con oportunidad
    const cashierStats = {};
    monthRecords.forEach(r => {
      if (!cashierStats[r.cashier_id]) {
        cashierStats[r.cashier_id] = { sales: 0, suggested: 0, shifts: 0 };
      }
      cashierStats[r.cashier_id].sales += r.sales || 0;
      cashierStats[r.cashier_id].suggested += r.suggested_sales || 0;
      cashierStats[r.cashier_id].shifts += 1;
    });

    const avgSales = Object.values(cashierStats).reduce((a, b) => a + b.sales, 0) / Math.max(Object.keys(cashierStats).length, 1);
    
    const opportunities = Object.entries(cashierStats)
      .filter(([_, stats]) => stats.sales < avgSales * 0.8)
      .map(([id, stats]) => ({
        cashier: cashiers.find(c => c.id === id),
        ...stats,
        gap: avgSales - stats.sales
      }));

    const topPerformers = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.sales - a.sales)
      .slice(0, 3)
      .map(([id, stats]) => ({
        cashier: cashiers.find(c => c.id === id),
        ...stats
      }));

    return {
      totals,
      compliance,
      budget: currentBudget,
      opportunities,
      topPerformers,
      daysWorked: monthSales.length,
      avgTicket: totals.tickets > 0 ? totals.sales / totals.tickets : 0
    };
  }, [dailySales, shiftRecords, cashiers, budgets]);

  // Generar análisis con IA
  const generateAIAnalysis = async () => {
    setIsThinking(true);
    setExpression('thinking');
    
    try {
      const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
      
      const prompt = `Eres "Cony", una malteada de helado animada y amigable que es la mascota de Popsy. Genera un análisis breve, amigable y motivador (máximo 150 palabras) sobre el desempeño de la tienda con estos datos:

- Ventas del mes: ${formatCurrency(analysis.totals.sales)}
- Presupuesto: ${formatCurrency(analysis.budget?.sales_budget || 0)}
- Cumplimiento: ${analysis.compliance.toFixed(1)}%
- Tickets: ${analysis.totals.tickets}
- Ticket promedio: ${formatCurrency(analysis.avgTicket)}
- Sugeridos: ${analysis.totals.suggested}
- Días trabajados: ${analysis.daysWorked}
- Cajeros con oportunidad: ${analysis.opportunities.map(o => o.cashier?.name).filter(Boolean).join(', ') || 'Ninguno'}
- Top vendedores: ${analysis.topPerformers.map(t => t.cashier?.name).filter(Boolean).join(', ')}

Incluye:
1. Resumen del estado actual (positivo o áreas de mejora)
2. Reconocimiento a top performers
3. Mensaje de ánimo para cajeros con oportunidad (sin ser negativo)
4. Un tip concreto para mejorar
5. Usa emojis de helados 🍦🍨 y sé muy motivador

Habla como si fueras un helado animado y simpático.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mensaje: { type: "string" },
            estado: { type: "string", enum: ["excelente", "bueno", "oportunidad"] },
            tip: { type: "string" }
          }
        }
      });

      setAiMessage(result);
      setExpression(result.estado === 'excelente' ? 'celebrating' : result.estado === 'bueno' ? 'happy' : 'encouraging');
    } catch (e) {
      setAiMessage({ 
        mensaje: "¡Hola! Soy Cony 🍦 Tu malteada favorita está aquí para ayudarte. Hoy es un gran día para vender helados y hacer feliz a cada cliente. ¡Vamos equipo!",
        estado: "bueno",
        tip: "Recuerda siempre ofrecer un sugerido con cada venta 🍨"
      });
      setExpression('happy');
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (isOpen && storeId && !aiMessage) {
      generateAIAnalysis();
    }
  }, [isOpen, storeId]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  return (
    <>
      {/* Floating Mascot Button */}
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: [0, -8, 0],
        }}
        transition={{ 
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="relative">
          {/* Cone Body */}
          <svg viewBox="0 0 100 140" className="w-16 h-20 drop-shadow-xl">
            {/* Cone */}
            <polygon 
              points="25,60 75,60 55,130 45,130" 
              fill="url(#coneGradient)"
              stroke="#d4a574"
              strokeWidth="2"
            />
            {/* Cone lines */}
            <line x1="35" y1="65" x2="47" y2="125" stroke="#c99a5e" strokeWidth="1" opacity="0.5"/>
            <line x1="50" y1="60" x2="50" y2="128" stroke="#c99a5e" strokeWidth="1" opacity="0.5"/>
            <line x1="65" y1="65" x2="53" y2="125" stroke="#c99a5e" strokeWidth="1" opacity="0.5"/>
            
            {/* Ice cream scoops */}
            <ellipse cx="50" cy="45" rx="30" ry="25" fill="url(#iceCreamGradient1)"/>
            <ellipse cx="35" cy="35" rx="18" ry="15" fill="url(#iceCreamGradient2)"/>
            <ellipse cx="65" cy="35" rx="18" ry="15" fill="url(#iceCreamGradient3)"/>
            <ellipse cx="50" cy="22" rx="15" ry="12" fill="url(#iceCreamGradient4)"/>
            
            {/* Face */}
            <ellipse cx="40" cy="42" rx="4" ry="5" fill="#333"/>
            <ellipse cx="60" cy="42" rx="4" ry="5" fill="#333"/>
            <ellipse cx="41" cy="40" rx="1.5" ry="2" fill="white"/>
            <ellipse cx="61" cy="40" rx="1.5" ry="2" fill="white"/>
            
            {/* Smile */}
            <path d="M 40 52 Q 50 60 60 52" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
            
            {/* Blush */}
            <ellipse cx="32" cy="50" rx="5" ry="3" fill="#ffb6c1" opacity="0.6"/>
            <ellipse cx="68" cy="50" rx="5" ry="3" fill="#ffb6c1" opacity="0.6"/>
            
            {/* Sprinkles */}
            <circle cx="30" cy="25" r="2" fill="#ff69b4"/>
            <circle cx="45" cy="15" r="2" fill="#87ceeb"/>
            <circle cx="60" cy="20" r="2" fill="#98fb98"/>
            <circle cx="70" cy="30" r="2" fill="#ffd700"/>
            <circle cx="25" cy="40" r="2" fill="#dda0dd"/>
            
            <defs>
              <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8c078"/>
                <stop offset="100%" stopColor="#d4a254"/>
              </linearGradient>
              <linearGradient id="iceCreamGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff5f5"/>
                <stop offset="100%" stopColor="#ffc0cb"/>
              </linearGradient>
              <linearGradient id="iceCreamGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0ffff"/>
                <stop offset="100%" stopColor="#87ceeb"/>
              </linearGradient>
              <linearGradient id="iceCreamGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f0fff0"/>
                <stop offset="100%" stopColor="#98fb98"/>
              </linearGradient>
              <linearGradient id="iceCreamGradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fffacd"/>
                <stop offset="100%" stopColor="#ffd700"/>
              </linearGradient>
            </defs>
          </svg>
          
          {/* Notification dot */}
          {!isOpen && (
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 right-6 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-pink-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🍦
                  </motion.span>
                  <div>
                    <h3 className="font-bold">Cony - Tu Asistente</h3>
                    <p className="text-xs text-white/80">Malteada Inteligente Popsy</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {isThinking ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-pink-500" />
                  </motion.div>
                  <p className="text-gray-500 mt-3 text-sm">Cony está analizando los datos...</p>
                </div>
              ) : aiMessage ? (
                <div className="space-y-4">
                  {/* Main message */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100"
                  >
                    <p className="text-gray-700 text-sm leading-relaxed">{aiMessage.mensaje}</p>
                  </motion.div>

                  {/* Tip */}
                  {aiMessage.tip && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200"
                    >
                      <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Tip del día
                      </p>
                      <p className="text-sm text-amber-700 mt-1">{aiMessage.tip}</p>
                    </motion.div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Cumplimiento</p>
                      <p className={`text-lg font-bold ${analysis.compliance >= 100 ? 'text-green-600' : analysis.compliance >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                        {analysis.compliance.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Ticket Prom.</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(analysis.avgTicket)}</p>
                    </div>
                  </div>

                  {/* Top performers */}
                  {analysis.topPerformers.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" /> Top Vendedores
                      </p>
                      {analysis.topPerformers.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span>{['🥇', '🥈', '🥉'][i]} {p.cashier?.name || 'N/A'}</span>
                          <span className="font-medium text-amber-700">{formatCurrency(p.sales)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Opportunities */}
                  {analysis.opportunities.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-500" /> Apoyemos a
                      </p>
                      {analysis.opportunities.slice(0, 3).map((o, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span>💪 {o.cashier?.name || 'N/A'}</span>
                          <span className="text-xs text-gray-500">{o.shifts} turnos</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Refresh button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAIAnalysis}
                    className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Actualizar análisis
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Selecciona una tienda para ver el análisis</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}