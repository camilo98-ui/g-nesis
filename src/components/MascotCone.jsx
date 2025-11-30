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
      
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projectedSales = analysis.daysWorked > 0 ? (analysis.totals.sales / analysis.daysWorked) * daysInMonth : 0;
      const salesGap = (analysis.budget?.sales_budget || 0) - analysis.totals.sales;
      const daysRemaining = daysInMonth - analysis.daysWorked;
      const requiredDaily = daysRemaining > 0 ? salesGap / daysRemaining : 0;
      
      const prompt = `Eres "Conito", un cono de helado de fresa animado, dulce y muy amigable que es la mascota de Popsy. Genera un análisis DETALLADO, profesional pero amigable (máximo 250 palabras) sobre el desempeño de la tienda con estos datos:

DATOS DE VENTA:
- Ventas acumuladas del mes: ${formatCurrency(analysis.totals.sales)}
- Presupuesto del mes: ${formatCurrency(analysis.budget?.sales_budget || 0)}
- Cumplimiento actual: ${analysis.compliance.toFixed(1)}%
- Proyección de cierre: ${formatCurrency(projectedSales)}
- Brecha por cubrir: ${formatCurrency(salesGap)}
- Días restantes: ${daysRemaining}
- Venta diaria requerida para alcanzar meta: ${formatCurrency(requiredDaily)}

INDICADORES CLAVE:
- Ticket promedio actual: ${formatCurrency(analysis.avgTicket)}
- Total transacciones: ${analysis.totals.tickets}
- Sugeridos vendidos: ${analysis.totals.suggested}
- Tasa de sugeridos: ${analysis.totals.tickets > 0 ? ((analysis.totals.suggested / analysis.totals.tickets) * 100).toFixed(1) : 0}%
- Días trabajados: ${analysis.daysWorked}

EQUIPO:
- Cajeros con oportunidad de mejora: ${analysis.opportunities.map(o => `${o.cashier?.name} (${formatCurrency(o.sales)})`).filter(Boolean).join(', ') || 'Ninguno'}
- Top vendedores: ${analysis.topPerformers.map(t => `${t.cashier?.name} (${formatCurrency(t.sales)})`).filter(Boolean).join(', ')}

DEBE INCLUIR:
1. 📊 Estado actual: ¿Vamos bien o mal? Con números concretos
2. 📈 Proyección: Si seguimos así, ¿cumplimos o no? ¿Qué debemos hacer?
3. 💰 Acción inmediata: Cuánto debemos vender DIARIO para llegar a la meta
4. 🏆 Reconocimiento específico a top performers con sus cifras
5. 💪 Plan de apoyo para cajeros que necesitan mejorar (sin ser negativo)
6. 🎯 3 tips CONCRETOS y accionables para mejorar ventas HOY
7. 📌 Recomendación sobre días de mayor venta (fines de semana)

Usa emojis de helados 🍦🍨 y sé muy motivador pero con sustento en datos.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mensaje: { type: "string", description: "Análisis principal detallado" },
            estado: { type: "string", enum: ["excelente", "bueno", "oportunidad"] },
            tip: { type: "string", description: "Tip principal del día" },
            proyeccion: { type: "string", description: "Resumen de proyección de cierre" },
            acciones: { type: "array", items: { type: "string" }, description: "Lista de 3 acciones concretas" },
            alertas: { type: "array", items: { type: "string" }, description: "Alertas o puntos de atención" }
          }
        }
      });

      setAiMessage(result);
      setExpression(result.estado === 'excelente' ? 'celebrating' : result.estado === 'bueno' ? 'happy' : 'encouraging');
    } catch (e) {
      setAiMessage({ 
        mensaje: "¡Hola! Soy Conito 🍓 Tu cono de fresa favorito está aquí para ayudarte. Hoy es un gran día para vender helados y hacer feliz a cada cliente. ¡Vamos equipo!",
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
      {/* Floating Mascot Button - Conito de Fresa */}
      <motion.button
        onClick={onToggle}
        className="fixed top-28 right-4 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: [0, -6, 0],
        }}
        transition={{ 
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="relative">
          {/* Conito - Helado de Fresa */}
          <svg viewBox="0 0 100 140" className="w-12 h-14 drop-shadow-xl">
            {/* Cone */}
            <polygon 
              points="25,65 75,65 55,130 45,130" 
              fill="url(#coneGradConito)"
              stroke="#c99a5e"
              strokeWidth="2"
            />
            {/* Cone pattern */}
            <line x1="35" y1="70" x2="47" y2="125" stroke="#b8894e" strokeWidth="1" opacity="0.6"/>
            <line x1="50" y1="65" x2="50" y2="128" stroke="#b8894e" strokeWidth="1" opacity="0.6"/>
            <line x1="65" y1="70" x2="53" y2="125" stroke="#b8894e" strokeWidth="1" opacity="0.6"/>
            
            {/* Strawberry ice cream scoops */}
            <ellipse cx="50" cy="48" rx="32" ry="26" fill="url(#fresaGrad1)"/>
            <ellipse cx="35" cy="36" rx="20" ry="16" fill="url(#fresaGrad2)"/>
            <ellipse cx="65" cy="36" rx="20" ry="16" fill="url(#fresaGrad2)"/>
            <ellipse cx="50" cy="22" rx="16" ry="13" fill="url(#fresaGrad3)"/>
            
            {/* Strawberry drip effect */}
            <path d="M 22 50 Q 20 58 22 65" stroke="#FF6B8A" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 78 50 Q 80 60 78 65" stroke="#FF6B8A" strokeWidth="3" fill="none" strokeLinecap="round"/>
            
            {/* Face - Conito */}
            <ellipse cx="38" cy="44" rx="5" ry="6" fill="#1a1a1a"/>
            <ellipse cx="62" cy="44" rx="5" ry="6" fill="#1a1a1a"/>
            <ellipse cx="39" cy="42" rx="2" ry="2.5" fill="white"/>
            <ellipse cx="63" cy="42" rx="2" ry="2.5" fill="white"/>
            
            {/* Happy smile */}
            <path d="M 38 54 Q 50 64 62 54" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            
            {/* Blush */}
            <ellipse cx="30" cy="52" rx="6" ry="3.5" fill="#FF9EAA" opacity="0.6"/>
            <ellipse cx="70" cy="52" rx="6" ry="3.5" fill="#FF9EAA" opacity="0.6"/>
            
            {/* Strawberry seeds */}
            <ellipse cx="28" cy="28" rx="2" ry="1.5" fill="#D4546A" transform="rotate(-15 28 28)"/>
            <ellipse cx="72" cy="30" rx="2" ry="1.5" fill="#D4546A" transform="rotate(20 72 30)"/>
            <ellipse cx="50" cy="12" rx="2" ry="1.5" fill="#D4546A"/>
            <ellipse cx="38" cy="18" rx="1.5" ry="1" fill="#D4546A"/>
            <ellipse cx="62" cy="16" rx="1.5" ry="1" fill="#D4546A"/>
            <ellipse cx="30" cy="42" rx="1.5" ry="1" fill="#D4546A"/>
            <ellipse cx="70" cy="40" rx="1.5" ry="1" fill="#D4546A"/>
            
            <defs>
              <linearGradient id="coneGradConito" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8c078"/>
                <stop offset="100%" stopColor="#d4a254"/>
              </linearGradient>
              <linearGradient id="fresaGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFB5C5"/>
                <stop offset="50%" stopColor="#FF8FA3"/>
                <stop offset="100%" stopColor="#FF6B8A"/>
              </linearGradient>
              <linearGradient id="fresaGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFC5D3"/>
                <stop offset="100%" stopColor="#FF8FA3"/>
              </linearGradient>
              <linearGradient id="fresaGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD5E0"/>
                <stop offset="100%" stopColor="#FFB5C5"/>
              </linearGradient>
            </defs>
          </svg>
          
          {/* Name badge */}
          <motion.div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Conito
          </motion.div>
          
          {/* Notification dot */}
          {!isOpen && (
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center shadow-lg"
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
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="fixed top-40 right-4 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-pink-100 z-40 overflow-hidden"
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
                    🍓
                  </motion.span>
                  <div>
                    <h3 className="font-bold">Conito - Tu Asistente</h3>
                    <p className="text-xs text-white/80">Cono de Fresa IA</p>
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
                  <p className="text-gray-500 mt-3 text-sm">Conito está analizando los datos...</p>
                </div>
              ) : aiMessage ? (
                <div className="space-y-4">
                  {/* Main message */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100"
                  >
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{aiMessage.mensaje}</p>
                  </motion.div>

                  {/* Proyección */}
                  {aiMessage.proyeccion && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200"
                    >
                      <p className="text-xs font-medium text-blue-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Proyección de Cierre
                      </p>
                      <p className="text-sm text-blue-700 mt-1">{aiMessage.proyeccion}</p>
                    </motion.div>
                  )}

                  {/* Acciones */}
                  {aiMessage.acciones?.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200"
                    >
                      <p className="text-xs font-medium text-emerald-800 flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" />
                        Acciones para HOY
                      </p>
                      <ul className="space-y-1">
                        {aiMessage.acciones.map((accion, i) => (
                          <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            {accion}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Alertas */}
                  {aiMessage.alertas?.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200"
                    >
                      <p className="text-xs font-medium text-amber-800 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Puntos de Atención
                      </p>
                      <ul className="space-y-1">
                        {aiMessage.alertas.map((alerta, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="text-amber-500">⚠</span>
                            {alerta}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Tip */}
                  {aiMessage.tip && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200"
                    >
                      <p className="text-xs font-medium text-purple-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        💡 Tip Principal
                      </p>
                      <p className="text-sm text-purple-700 mt-1">{aiMessage.tip}</p>
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