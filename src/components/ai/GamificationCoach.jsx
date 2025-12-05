import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, MessageCircle, Target, TrendingUp, Award,
  Loader2, X, Lightbulb, Flame, Star, Zap, BarChart3, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
        prompt: `Eres un coach motivacional EXPERTO de Popsy Helados 🍦. Analiza profundamente el rendimiento de ${cashierName}.

Datos completos del cajero:
${JSON.stringify(performanceData, null, 2)}

Genera un coaching COMPLETO Y MOTIVACIONAL que incluya:

1. **Mensaje Motivacional** (2-3 líneas): Personalizado, específico a sus logros, con emojis 🍦
2. **Análisis de Fortalezas** (2-3 puntos): Qué hace bien, con números específicos
3. **Tips Estratégicos** (3-4 tips): Acciones concretas para mejorar KPIs débiles con impacto esperado (ej: "+20% en sugeridos")
4. **Metas Retadoras** (2-3 metas): Basadas en su rendimiento actual, alcanzables pero ambiciosas
5. **Pronóstico de Crecimiento**: Si sigue estos consejos, qué puede lograr en 7-14 días
6. **Gráficas Sugeridas**: Datos para visualizar progreso (tendencia ventas, comparativa con equipo)
7. **Frase de Cierre**: Motivacional estilo Popsy con el nombre del cajero

Sé MUY positivo, específico, usa datos duros y el nombre. Responde en español.`,
        response_json_schema: {
          type: "object",
          properties: {
            mensaje_motivacional: { type: "string" },
            fortalezas: {
              type: "array",
              items: { type: "string" }
            },
            tips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  impacto_esperado: { type: "string" },
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
                  tipo: { type: "string" },
                  periodo: { type: "string" }
                }
              }
            },
            pronostico: {
              type: "object",
              properties: {
                ventas_7_dias: { type: "number" },
                crecimiento_esperado: { type: "string" }
              }
            },
            graficas_data: {
              type: "object",
              properties: {
                tendencia_semanal: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dia: { type: "string" },
                      valor: { type: "number" }
                    }
                  }
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

                    {/* Fortalezas */}
                    {coaching.fortalezas?.length > 0 && (
                      <Card className="border-emerald-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                            <Star className="w-4 h-4" /> Tus Fortalezas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {coaching.fortalezas.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                              <span>✓</span>
                              <p>{f}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Tips Estratégicos con impacto */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Tips Estratégicos
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
                            <p className="font-bold text-sm text-amber-800">{tip.titulo}</p>
                            <p className="text-xs text-amber-600 mt-1">{tip.descripcion}</p>
                            {tip.impacto_esperado && (
                              <p className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full inline-block mt-2">
                                📈 {tip.impacto_esperado}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Pronóstico con gráfica */}
                    {coaching.pronostico && (
                      <Card className="border-blue-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Tu Pronóstico
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-blue-50 rounded-lg p-3 text-center mb-3">
                            <p className="text-xs text-gray-500 mb-1">Próximos 7 días</p>
                            <p className="text-2xl font-black text-blue-600">
                              ${(coaching.pronostico.ventas_7_dias / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-blue-500 mt-1">{coaching.pronostico.crecimiento_esperado}</p>
                          </div>
                          {coaching.graficas_data?.tendencia_semanal && (
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={coaching.graficas_data.tendencia_semanal}>
                                  <defs>
                                    <linearGradient id="coachGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
                                  <YAxis tick={{ fontSize: 9 }} />
                                  <RechartsTooltip />
                                  <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="url(#coachGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Metas sugeridas con período */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-500" />
                        Metas Retadoras
                      </h4>
                      <div className="space-y-2">
                        {coaching.metas_sugeridas?.map((meta, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 bg-violet-50 rounded-lg border border-violet-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-violet-700">{meta.nombre}</p>
                                {meta.periodo && (
                                  <p className="text-xs text-violet-500">
                                    {meta.periodo === 'daily' ? '📅 Meta Diaria' : meta.periodo === 'weekly' ? '📆 Meta Semanal' : '📊 Meta Mensual'}
                                  </p>
                                )}
                              </div>
                              <p className="text-xl font-black text-violet-600">
                                {meta.tipo === 'currency' ? `$${(meta.valor/1000000).toFixed(1)}M` : meta.valor}
                              </p>
                            </div>
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