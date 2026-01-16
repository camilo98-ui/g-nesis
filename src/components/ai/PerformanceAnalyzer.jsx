import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, TrendingUp, Users, Award, Target, Loader2, 
  ChevronRight, Star, AlertTriangle, Sparkles, BarChart3, Zap, TrendingDown, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subDays, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

export default function PerformanceAnalyzer({ storeId, storeName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', storeId],
    queryFn: () => base44.entities.CleaningChecklist.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['allBadges', storeId],
    queryFn: async () => {
      const allBadges = [];
      for (const c of cashiers) {
        const cb = await base44.entities.CashierBadge.filter({ cashier_id: c.id });
        allBadges.push(...cb);
      }
      return allBadges;
    },
    enabled: cashiers.length > 0
  });

  // Preparar datos de cajeros
  const last30Days = subDays(new Date(), 30);
  const recentRecords = shiftRecords.filter(r => new Date(r.date) >= last30Days);
  
  const cashierData = cashiers.map(c => {
    const records = recentRecords.filter(r => r.cashier_id === c.id);
    const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTransactions = records.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const totalSuggested = records.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const cashierBadges = badges.filter(b => b.cashier_id === c.id);
    const cashierChecklists = checklists.filter(ch => ch.cashier_id === c.id);
    const avgChecklist = cashierChecklists.length > 0 
      ? cashierChecklists.reduce((a, ch) => a + (ch.completion_percentage || 0), 0) / cashierChecklists.length 
      : 0;

    return {
      name: c.name,
      id: c.id,
      totalSales,
      totalTransactions,
      totalSuggested,
      avgTicket,
      daysWorked: records.length,
      badges: cashierBadges.length,
      avgChecklist
    };
  });

  const analyzePerformance = async () => {
    setIsAnalyzing(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un analista experto de rendimiento de heladerías Popsy. Analiza PROFUNDAMENTE estos datos de ${storeName}:

${JSON.stringify(cashierData, null, 2)}

Genera un informe EJECUTIVO DETALLADO con:

1. **Resumen Ejecutivo** (3-4 líneas): Diagnóstico preciso del equipo
2. **Top 3 Mejores Empleados**: Nombre, fortalezas específicas (ventas, ticket, sugeridos), y puntaje cuantitativo
3. **3 Áreas de Mejora**: Empleados específicos que necesitan apoyo, qué KPI mejorar, y plan de acción concreto
4. **Recomendaciones de Capacitación**: 3 capacitaciones específicas con beneficio esperado (ej: "Curso Venta Sugerida → +15% conversión")
5. **Tendencia del Equipo**: Análisis de si mejora/estable/decae con datos duros
6. **Pronósticos**: Proyección de ventas para próximos 7-14 días basado en tendencia
7. **Consejos Estratégicos**: 2-3 acciones inmediatas para el gerente
8. **Datos de Soporte**: Gráficas sugeridas (ventas por cajero, ticket promedio, tendencia semanal)

Sé muy específico, usa números, porcentajes y emojis.`,
        response_json_schema: {
          type: "object",
          properties: {
            resumen: { type: "string" },
            top_performers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  fortalezas: { type: "string" },
                  puntaje: { type: "number" },
                  kpi_destacado: { type: "string" }
                }
              }
            },
            need_support: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  areas_mejora: { type: "string" },
                  sugerencia: { type: "string" },
                  plan_accion: { type: "string" }
                }
              }
            },
            capacitaciones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  beneficio: { type: "string" }
                }
              }
            },
            tendencia: { type: "string" },
            tendencia_emoji: { type: "string" },
            pronosticos: {
              type: "object",
              properties: {
                ventas_7_dias: { type: "number" },
                ventas_14_dias: { type: "number" },
                confianza: { type: "string" }
              }
            },
            consejos_gerente: {
              type: "array",
              items: { type: "string" }
            },
            graficas_sugeridas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  titulo: { type: "string" },
                  data_keys: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      
      setReport(result);
    } catch (e) {
      console.error(e);
    }
    
    setIsAnalyzing(false);
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => { setIsOpen(true); if (!report) analyzePerformance(); }}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
        >
          <Brain className="w-4 h-4 mr-2" />
          Análisis IA
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ec4899">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Brain className="w-6 h-6 text-violet-500" />
              </motion.div>
              Análisis de Rendimiento IA
            </DialogTitle>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-12 h-12 text-violet-500" />
              </motion.div>
              <p className="text-gray-500 mt-4">Analizando rendimiento del equipo...</p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Resumen Ejecutivo */}
              <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-violet-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-700 mb-1">Resumen Ejecutivo</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{report.resumen}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-2xl">{report.tendencia_emoji}</span>
                    <span className="text-sm font-medium text-violet-700">{report.tendencia}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pronósticos con gráficas */}
              {report.pronosticos && (
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Pronósticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Próximos 7 días</p>
                        <p className="text-xl font-black text-blue-600">
                          ${(report.pronosticos.ventas_7_dias / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Próximos 14 días</p>
                        <p className="text-xl font-black text-violet-600">
                          ${(report.pronosticos.ventas_14_dias / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Nivel de confianza: <span className="font-bold text-blue-600">{report.pronosticos.confianza}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Performers con KPIs */}
              <Card className="border-emerald-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.top_performers?.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{p.nombre}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">{p.fortalezas}</p>
                          {p.kpi_destacado && (
                            <p className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full inline-block mt-1">
                              ⭐ {p.kpi_destacado}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">{p.puntaje}</p>
                          <p className="text-[9px] text-gray-500">pts</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Need Support con plan de acción */}
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Áreas de Mejora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.need_support?.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <p className="font-bold text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-amber-600 mt-1">📊 {p.areas_mejora}</p>
                      <p className="text-xs text-gray-600 mt-1">💡 {p.sugerencia}</p>
                      {p.plan_accion && (
                        <p className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded mt-2">
                          ✓ Plan: {p.plan_accion}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Capacitaciones con beneficio */}
              <Card className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Capacitaciones Sugeridas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.capacitaciones?.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <p className="font-bold text-sm text-blue-800">{c.nombre || c}</p>
                      {c.beneficio && (
                        <p className="text-xs text-blue-600 mt-1">→ {c.beneficio}</p>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Consejos para Gerente */}
              {report.consejos_gerente?.length > 0 && (
                <Card className="border-pink-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-pink-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Acciones Inmediatas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.consejos_gerente.map((consejo, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-pink-50 rounded-lg">
                        <ChevronRight className="w-4 h-4 text-pink-500 mt-0.5" />
                        <p className="text-xs text-gray-700">{consejo}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Gráfica visual de cajeros */}
              {cashierData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-700">📊 Performance Visual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashierData.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                          <RechartsTooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ventas']} />
                          <Bar dataKey="totalSales" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={analyzePerformance} variant="outline" className="w-full gap-2">
                <Brain className="w-4 h-4" /> Regenerar Análisis
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}