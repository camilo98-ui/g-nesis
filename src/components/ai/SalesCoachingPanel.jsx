import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, TrendingUp, Target, Lightbulb, AlertCircle, 
  CheckCircle2, ArrowRight, Brain, Calendar, Zap 
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesCoachingPanel({ 
  dailySales = [], 
  shiftRecords = [], 
  currentBudget = {}, 
  storeId,
  formatCurrency 
}) {
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily'); // daily | weekly

  const generateDailyCoaching = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Datos de hoy y ayer
      const todaySales = dailySales.find(s => 
        new Date(s.date).toDateString() === today.toDateString()
      );
      const yesterdaySales = dailySales.find(s => 
        new Date(s.date).toDateString() === yesterday.toDateString()
      );
      
      // Últimos 7 días
      const last7Days = dailySales.slice(-7);
      const avgLast7Days = last7Days.reduce((sum, s) => sum + (s.total_sales || 0), 0) / Math.max(last7Days.length, 1);
      const avgTicketLast7 = last7Days.reduce((sum, s) => {
        const trans = s.total_transactions || 0;
        return sum + (trans > 0 ? s.total_sales / trans : 0);
      }, 0) / Math.max(last7Days.length, 1);
      
      // Turnos de hoy si existen
      const todayShifts = shiftRecords.filter(r => 
        new Date(r.date).toDateString() === today.toDateString()
      );

      const prompt = `Eres un coach experto en ventas retail de helados. Analiza los datos y genera recomendaciones TÁCTICAS Y ESPECÍFICAS para hoy.

**DATOS DEL NEGOCIO:**
- Venta de hoy hasta ahora: ${formatCurrency(todaySales?.total_sales || 0)}
- Venta de ayer: ${formatCurrency(yesterdaySales?.total_sales || 0)}
- Promedio últimos 7 días: ${formatCurrency(avgLast7Days)}
- Ticket promedio últimos 7 días: ${formatCurrency(avgTicketLast7)}
- Transacciones hoy: ${todaySales?.total_tickets || 0}
- Sugeridos vendidos hoy: ${todaySales?.total_suggested || 0}
- Presupuesto mensual: ${formatCurrency(currentBudget.sales_budget || 0)}
- Día de la semana: ${format(today, 'EEEE', { locale: es })}

**TURNOS DE HOY:**
${todayShifts.length > 0 ? todayShifts.map(s => 
  `- ${s.cashier_name || 'Cajero'}: ${s.shift} - Venta: ${formatCurrency(s.sales || 0)}, Ticket prom: ${formatCurrency(s.transactions > 0 ? s.sales / s.transactions : 0)}, Sugeridos: ${s.suggested_sales || 0}`
).join('\n') : 'No hay datos de turnos aún'}

**GENERA UN COACHING DIARIO CON EXACTAMENTE ESTA ESTRUCTURA JSON:**
{
  "prioridad_del_dia": "Una acción específica y clara para maximizar ventas HOY (ej: 'Impulsar combos familiares en horario tarde')",
  "diagnostico_rapido": "Análisis breve de cómo va el día vs. histórico (2-3 líneas máximo)",
  "acciones_inmediatas": [
    "Acción concreta 1 con qué hacer y por qué",
    "Acción concreta 2 con qué hacer y por qué",
    "Acción concreta 3 con qué hacer y por qué"
  ],
  "enfoque_sugeridos": "Qué productos complementarios promover HOY específicamente y cómo",
  "meta_realista_hoy": "Meta de venta realista para cerrar el día bien, basada en histórico y ritmo actual",
  "alerta_critica": "Si hay algo urgente que atender HOY o null si todo va bien"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            prioridad_del_dia: { type: "string" },
            diagnostico_rapido: { type: "string" },
            acciones_inmediatas: { type: "array", items: { type: "string" } },
            enfoque_sugeridos: { type: "string" },
            meta_realista_hoy: { type: "string" },
            alerta_critica: { type: ["string", "null"] }
          },
          required: ["prioridad_del_dia", "diagnostico_rapido", "acciones_inmediatas", "enfoque_sugeridos", "meta_realista_hoy"]
        }
      });

      setCoaching({ type: 'daily', data: response });
    } catch (error) {
      console.error('Error generando coaching:', error);
      setCoaching({ 
        type: 'daily', 
        error: 'No se pudo generar el coaching. Intenta nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyCoaching = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      
      // Ventas de la semana
      const weekSales = dailySales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= weekStart && saleDate <= weekEnd;
      });
      
      const totalWeekSales = weekSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalWeekTransactions = weekSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const totalWeekSuggested = weekSales.reduce((sum, s) => sum + (s.total_suggested || 0), 0);
      const avgTicketWeek = totalWeekTransactions > 0 ? totalWeekSales / totalWeekTransactions : 0;
      
      // Comparar con semana anterior
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(weekEnd);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      
      const lastWeekSales = dailySales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= lastWeekStart && saleDate <= lastWeekEnd;
      });
      
      const totalLastWeekSales = lastWeekSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);

      // Top performers de la semana
      const weekShifts = shiftRecords.filter(r => {
        const shiftDate = new Date(r.date);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
      });
      
      const performanceByPerson = {};
      weekShifts.forEach(s => {
        const name = s.cashier_name || 'Desconocido';
        if (!performanceByPerson[name]) {
          performanceByPerson[name] = { sales: 0, suggested: 0, shifts: 0 };
        }
        performanceByPerson[name].sales += s.sales || 0;
        performanceByPerson[name].suggested += s.suggested_sales || 0;
        performanceByPerson[name].shifts++;
      });

      const topPerformers = Object.entries(performanceByPerson)
        .sort((a, b) => b[1].sales - a[1].sales)
        .slice(0, 3)
        .map(([name, stats]) => `${name}: ${formatCurrency(stats.sales)} en ${stats.shifts} turnos, ${stats.suggested} sugeridos`);

      const prompt = `Eres un coach experto en ventas retail. Analiza el desempeño de la semana y genera un reporte estratégico.

**DESEMPEÑO DE LA SEMANA (${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}):**
- Venta total: ${formatCurrency(totalWeekSales)}
- Venta semana anterior: ${formatCurrency(totalLastWeekSales)}
- Variación: ${totalLastWeekSales > 0 ? ((totalWeekSales - totalLastWeekSales) / totalLastWeekSales * 100).toFixed(1) : 0}%
- Transacciones: ${totalWeekTransactions}
- Ticket promedio: ${formatCurrency(avgTicketWeek)}
- Sugeridos vendidos: ${totalWeekSuggested}
- Tasa de conversión sugeridos: ${totalWeekTransactions > 0 ? (totalWeekSuggested / totalWeekTransactions * 100).toFixed(1) : 0}%

**TOP PERFORMERS:**
${topPerformers.join('\n')}

**GENERA UN REPORTE SEMANAL CON ESTA ESTRUCTURA JSON:**
{
  "resumen_ejecutivo": "Resumen de cómo fue la semana en 3-4 líneas",
  "puntos_fuertes": [
    "Lo que se hizo bien esta semana (específico)",
    "Otro logro o fortaleza observada",
    "Un tercer punto fuerte si aplica"
  ],
  "areas_de_mejora": [
    "Área crítica a mejorar con acción específica",
    "Segunda oportunidad de mejora",
    "Tercera área si es necesario"
  ],
  "plan_proxima_semana": "Estrategia clara y accionable para la próxima semana (3-4 líneas)",
  "reconocimientos": "Mencionar a personas destacadas y por qué lo hicieron bien",
  "meta_sugerida": "Meta de ventas recomendada para la próxima semana con justificación"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumen_ejecutivo: { type: "string" },
            puntos_fuertes: { type: "array", items: { type: "string" } },
            areas_de_mejora: { type: "array", items: { type: "string" } },
            plan_proxima_semana: { type: "string" },
            reconocimientos: { type: "string" },
            meta_sugerida: { type: "string" }
          },
          required: ["resumen_ejecutivo", "puntos_fuertes", "areas_de_mejora", "plan_proxima_semana"]
        }
      });

      setCoaching({ type: 'weekly', data: response });
    } catch (error) {
      console.error('Error generando coaching semanal:', error);
      setCoaching({ 
        type: 'weekly', 
        error: 'No se pudo generar el reporte. Intenta nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-purple-200/50 shadow-xl">
      <CardHeader className="border-b border-purple-200/30 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-purple-900">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <p className="text-xl font-black">Coaching de Ventas IA</p>
              <p className="text-xs font-normal text-purple-600">Recomendaciones personalizadas basadas en tus datos</p>
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'daily' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('daily');
              setCoaching(null);
            }}
            className={activeTab === 'daily' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'border-purple-200 text-purple-700 hover:bg-purple-50'
            }
          >
            <Zap className="w-4 h-4 mr-2" />
            Coaching Diario
          </Button>
          <Button
            variant={activeTab === 'weekly' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('weekly');
              setCoaching(null);
            }}
            className={activeTab === 'weekly' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'border-purple-200 text-purple-700 hover:bg-purple-50'
            }
          >
            <Calendar className="w-4 h-4 mr-2" />
            Reporte Semanal
          </Button>
        </div>

        {/* Generate Button */}
        {!coaching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <Sparkles className="w-20 h-20 text-purple-400 mx-auto" />
            </motion.div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {activeTab === 'daily' 
                ? '¿Qué necesitas mejorar hoy?' 
                : '¿Cómo fue tu semana?'}
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              {activeTab === 'daily'
                ? 'Genera recomendaciones tácticas basadas en tu desempeño actual y datos históricos.'
                : 'Obtén un análisis completo de la semana con puntos fuertes, áreas de mejora y plan de acción.'}
            </p>
            <Button
              onClick={activeTab === 'daily' ? generateDailyCoaching : generateWeeklyCoaching}
              disabled={loading || !dailySales.length}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Brain className="w-5 h-5" />
                  </motion.div>
                  Analizando datos...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {activeTab === 'daily' ? 'Generar Coaching del Día' : 'Generar Reporte Semanal'}
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Daily Coaching Results */}
        <AnimatePresence>
          {coaching && coaching.type === 'daily' && !coaching.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Prioridad del día */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-5 text-white shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-lg mb-1">🎯 Prioridad de Hoy</h4>
                    <p className="text-white/95 leading-relaxed">{coaching.data.prioridad_del_dia}</p>
                  </div>
                </div>
              </motion.div>

              {/* Diagnóstico */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Diagnóstico Rápido
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{coaching.data.diagnostico_rapido}</p>
              </div>

              {/* Alerta crítica */}
              {coaching.data.alerta_critica && (
                <motion.div
                  animate={{ boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0)', '0 0 0 8px rgba(239, 68, 68, 0.2)', '0 0 0 0 rgba(239, 68, 68, 0)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-red-50 border-2 border-red-400 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-red-900 mb-1">⚠️ Alerta Crítica</h4>
                      <p className="text-red-700 text-sm leading-relaxed">{coaching.data.alerta_critica}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Acciones inmediatas */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200/50">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Acciones Inmediatas
                </h4>
                <div className="space-y-2">
                  {coaching.data.acciones_inmediatas.map((action, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 bg-white/60 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 leading-relaxed">{action}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Enfoque sugeridos */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Enfoque en Sugeridos
                </h4>
                <p className="text-gray-800 text-sm leading-relaxed">{coaching.data.enfoque_sugeridos}</p>
              </div>

              {/* Meta realista */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Meta Realista para Hoy
                </h4>
                <p className="text-gray-800 text-sm leading-relaxed">{coaching.data.meta_realista_hoy}</p>
              </div>

              <Button
                onClick={() => setCoaching(null)}
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Generar Nuevo Coaching
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly Coaching Results */}
        <AnimatePresence>
          {coaching && coaching.type === 'weekly' && !coaching.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Resumen ejecutivo */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 text-white shadow-lg">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Resumen de la Semana
                </h4>
                <p className="text-white/95 leading-relaxed">{coaching.data.resumen_ejecutivo}</p>
              </div>

              {/* Puntos fuertes */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ✅ Puntos Fuertes
                </h4>
                <div className="space-y-2">
                  {coaching.data.puntos_fuertes.map((point, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 bg-white/60 rounded-lg p-3"
                    >
                      <ArrowRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Áreas de mejora */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  🎯 Oportunidades de Mejora
                </h4>
                <div className="space-y-2">
                  {coaching.data.areas_de_mejora.map((area, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 bg-white/60 rounded-lg p-3"
                    >
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 leading-relaxed">{area}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Plan próxima semana */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200/50">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Plan para la Próxima Semana
                </h4>
                <p className="text-gray-800 text-sm leading-relaxed">{coaching.data.plan_proxima_semana}</p>
              </div>

              {/* Reconocimientos */}
              {coaching.data.reconocimientos && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200/50">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    🌟 Reconocimientos
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed">{coaching.data.reconocimientos}</p>
                </div>
              )}

              {/* Meta sugerida */}
              {coaching.data.meta_sugerida && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200/50">
                  <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Meta Sugerida
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed">{coaching.data.meta_sugerida}</p>
                </div>
              )}

              <Button
                onClick={() => setCoaching(null)}
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Generar Nuevo Reporte
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {coaching?.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4">{coaching.error}</p>
            <Button
              onClick={() => setCoaching(null)}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Intentar de Nuevo
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}