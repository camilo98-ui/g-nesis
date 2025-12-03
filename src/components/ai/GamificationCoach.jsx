import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, MessageCircle, Target, TrendingUp, Award,
  Loader2, X, Lightbulb, Flame, Star, Zap
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays } from 'date-fns';

export default function GamificationCoach({ cashierId, cashierName, storeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coaching, setCoaching] = useState(null);

  const { data: badges = [] } = useQuery({
    queryKey: ['cashierBadges', cashierId],
    queryFn: () => base44.entities.CashierBadge.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['cashierGoals', cashierId],
    queryFn: () => base44.entities.CashierGoal.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['cashierShifts', cashierId],
    queryFn: () => base44.entities.ShiftRecord.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  const getCoaching = async () => {
    setIsLoading(true);
    
    const last30Days = subDays(new Date(), 30);
    const recentRecords = shiftRecords.filter(r => new Date(r.date) >= last30Days);
    
    const totalSales = recentRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTransactions = recentRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const totalSuggested = recentRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const currentGoal = goals[0];

    const performanceData = {
      nombre: cashierName,
      ventas_30_dias: totalSales,
      transacciones: totalTransactions,
      sugeridos: totalSuggested,
      ticket_promedio: avgTicket,
      dias_trabajados: recentRecords.length,
      insignias_ganadas: badges.length,
      tipos_insignias: badges.map(b => b.badge_type),
      meta_ventas: currentGoal?.sales_goal || 0,
      meta_ticket: currentGoal?.tickets_goal || 0,
      meta_sugeridos: currentGoal?.suggested_goal || 0
    };

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un coach motivacional de Popsy Helados 🍦. Tu rol es motivar y ayudar a los cajeros a mejorar su rendimiento.

Datos del cajero ${cashierName}:
${JSON.stringify(performanceData, null, 2)}

Genera un coaching personalizado que incluya:
1. Un mensaje motivacional personalizado (máx 2 líneas, usa emojis de helado 🍦🍨)
2. 3 tips específicos para mejorar sus KPIs débiles
3. 2 metas sugeridas basadas en su rendimiento (alcanzables pero retadoras)
4. Una frase de cierre motivacional estilo Popsy

Sé positivo, específico y usa el nombre del cajero. Responde en español.`,
        response_json_schema: {
          type: "object",
          properties: {
            mensaje_motivacional: { type: "string" },
            tips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  icono: { type: "string" }
                }
              }
            },
            metas_sugeridas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  valor: { type: "number" },
                  tipo: { type: "string" }
                }
              }
            },
            frase_cierre: { type: "string" }
          }
        }
      });
      
      setCoaching(result);
    } catch (e) {
      console.error(e);
    }
    
    setIsLoading(false);
  };

  const tipIcons = {
    'ventas': TrendingUp,
    'ticket': Target,
    'sugeridos': Sparkles,
    'default': Lightbulb
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => { setIsOpen(true); if (!coaching) getCoaching(); }}
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
          </motion.div>
          Coach IA
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold">Coach Popsy IA</h3>
                      <p className="text-xs text-white/80">Para {cashierName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-10 h-10 text-pink-500" />
                    </motion.div>
                    <p className="text-gray-500 mt-3 text-sm">Preparando tu coaching personalizado...</p>
                  </div>
                ) : coaching ? (
                  <div className="space-y-4">
                    {/* Mensaje motivacional */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200"
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-5 h-5 text-pink-500 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed">{coaching.mensaje_motivacional}</p>
                      </div>
                    </motion.div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Tips para ti
                      </h4>
                      <div className="space-y-2">
                        {coaching.tips?.map((tip, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                          >
                            <p className="font-medium text-sm text-amber-800">{tip.titulo}</p>
                            <p className="text-xs text-amber-600 mt-1">{tip.descripcion}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Metas sugeridas */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-500" />
                        Metas sugeridas
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {coaching.metas_sugeridas?.map((meta, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 bg-violet-50 rounded-lg border border-violet-200 text-center"
                          >
                            <p className="text-lg font-bold text-violet-600">
                              {meta.tipo === 'currency' ? `$${(meta.valor/1000000).toFixed(1)}M` : meta.valor}
                            </p>
                            <p className="text-xs text-violet-500">{meta.nombre}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Frase de cierre */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl"
                    >
                      <Flame className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-pink-700 italic">"{coaching.frase_cierre}"</p>
                    </motion.div>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50">
                <Button onClick={getCoaching} disabled={isLoading} className="w-full bg-pink-500 hover:bg-pink-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isLoading ? 'Generando...' : 'Nuevo Coaching'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}