import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, TrendingUp, Users, Award, Target, Loader2, 
  ChevronRight, Star, AlertTriangle, Sparkles, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subDays, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    
    const last30Days = subDays(new Date(), 30);
    const recentRecords = shiftRecords.filter(r => new Date(r.date) >= last30Days);
    
    // Preparar datos por cajero
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

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un analista de rendimiento de heladerías Popsy. Analiza estos datos de empleados de la tienda ${storeName} de los últimos 30 días:

${JSON.stringify(cashierData, null, 2)}

Genera un informe ejecutivo con:
1. Resumen general del equipo (2-3 líneas)
2. Top 3 mejores empleados con sus fortalezas
3. 3 empleados que necesitan apoyo y en qué áreas específicas
4. Recomendaciones de capacitación personalizadas (máximo 3)
5. Tendencia general del equipo (mejorando/estable/decayendo)

Responde en español, sé conciso y usa emojis para hacerlo visual.`,
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
                  puntaje: { type: "number" }
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
                  sugerencia: { type: "string" }
                }
              }
            },
            capacitaciones: {
              type: "array",
              items: { type: "string" }
            },
            tendencia: { type: "string" },
            tendencia_emoji: { type: "string" }
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
              {/* Resumen */}
              <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-violet-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Resumen</p>
                      <p className="text-sm text-gray-600">{report.resumen}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-2xl">{report.tendencia_emoji}</span>
                    <span className="text-sm font-medium text-violet-700">{report.tendencia}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
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
                      className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{p.nombre}</p>
                        <p className="text-xs text-emerald-600">{p.fortalezas}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Need Support */}
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
                      className="p-2 bg-amber-50 rounded-lg"
                    >
                      <p className="font-medium text-gray-700">{p.nombre}</p>
                      <p className="text-xs text-amber-600">{p.areas_mejora}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">💡 {p.sugerencia}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Capacitaciones */}
              <Card className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Capacitaciones Sugeridas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {report.capacitaciones?.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button onClick={analyzePerformance} variant="outline" className="w-full">
                <Brain className="w-4 h-4 mr-2" /> Regenerar Análisis
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}