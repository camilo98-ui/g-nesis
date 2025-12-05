import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, Calendar, Users, TrendingUp, Loader2, 
  CheckCircle, Star, Sun, CloudRain, Cloud
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfWeek, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CashierAssignmentSuggestion({ storeId, cashiers, shiftRecords }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Analizar datos históricos para identificar mejores días
  const salesAnalysis = useMemo(() => {
    if (!shiftRecords?.length) return null;

    // Agrupar ventas por día de la semana
    const dayStats = {};
    DAYS.forEach((_, idx) => {
      dayStats[idx] = { sales: 0, count: 0, bestCashiers: {} };
    });

    shiftRecords.forEach(record => {
      const date = new Date(record.date);
      const dayOfWeek = getDay(date);
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que Lunes = 0
      
      dayStats[adjustedDay].sales += record.sales || 0;
      dayStats[adjustedDay].count += 1;

      // Trackear rendimiento de cajeros por día
      if (record.cashier_id) {
        if (!dayStats[adjustedDay].bestCashiers[record.cashier_id]) {
          dayStats[adjustedDay].bestCashiers[record.cashier_id] = { sales: 0, count: 0 };
        }
        dayStats[adjustedDay].bestCashiers[record.cashier_id].sales += record.sales || 0;
        dayStats[adjustedDay].bestCashiers[record.cashier_id].count += 1;
      }
    });

    // Calcular promedios y ranking por día
    const analysis = DAYS.map((name, idx) => {
      const stats = dayStats[idx];
      const avgSales = stats.count > 0 ? stats.sales / stats.count : 0;
      
      // Ordenar cajeros por rendimiento promedio en este día
      const cashierRanking = Object.entries(stats.bestCashiers)
        .map(([cashierId, data]) => ({
          cashierId,
          avgSales: data.count > 0 ? data.sales / data.count : 0,
          shifts: data.count
        }))
        .sort((a, b) => b.avgSales - a.avgSales);

      return {
        day: name,
        dayIndex: idx,
        avgSales,
        totalShifts: stats.count,
        isHighDemand: avgSales > 0,
        cashierRanking
      };
    });

    // Identificar días de alta demanda (top 3 por ventas promedio)
    const sorted = [...analysis].sort((a, b) => b.avgSales - a.avgSales);
    sorted.forEach((day, idx) => {
      const original = analysis.find(d => d.dayIndex === day.dayIndex);
      original.demandRank = idx + 1;
      original.isHighDemand = idx < 3;
    });

    return analysis;
  }, [shiftRecords]);

  // Generar sugerencias con IA
  const generateSuggestions = async () => {
    if (!salesAnalysis || !cashiers?.length) return;
    
    setIsGenerating(true);
    
    try {
      // Preparar datos para el LLM
      const cashierData = cashiers.map(c => ({
        id: c.id,
        name: c.name,
        isActive: c.is_active !== false
      }));

      const prompt = `
Eres un experto en gestión de personal para una heladería. Basándote en los siguientes datos de ventas históricas por día de la semana y rendimiento de cajeros, sugiere la asignación óptima de cajeros para cada día.

DATOS DE VENTAS POR DÍA:
${salesAnalysis.map(d => `${d.day}: Venta promedio $${(d.avgSales/1000).toFixed(0)}K, ${d.totalShifts} turnos históricos, Ranking demanda: ${d.demandRank}`).join('\n')}

CAJEROS DISPONIBLES:
${cashierData.filter(c => c.isActive).map(c => c.name).join(', ')}

RENDIMIENTO HISTÓRICO DE CAJEROS POR DÍA:
${salesAnalysis.map(d => {
  const top3 = d.cashierRanking.slice(0, 3);
  const topNames = top3.map(r => {
    const cashier = cashiers.find(c => c.id === r.cashierId);
    return cashier ? `${cashier.name} ($${(r.avgSales/1000).toFixed(0)}K prom)` : null;
  }).filter(Boolean);
  return `${d.day}: ${topNames.length ? topNames.join(', ') : 'Sin datos suficientes'}`;
}).join('\n')}

Genera una sugerencia de asignación donde los mejores cajeros estén en los días de mayor venta. Incluye para cada día: 2-3 cajeros recomendados y una breve justificación.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  recommended_cashiers: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reason: { type: "string" },
                  priority: { type: "string", enum: ["alta", "media", "baja"] }
                }
              }
            },
            general_insights: { type: "string" }
          }
        }
      });

      setSuggestions(response);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
    
    setIsGenerating(false);
  };

  const getPriorityColor = (priority) => {
    if (priority === 'alta') return 'from-rose-500 to-pink-500';
    if (priority === 'media') return 'from-amber-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getPriorityBg = (priority) => {
    if (priority === 'alta') return 'bg-rose-50 border-rose-200';
    if (priority === 'media') return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-violet-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-violet-500" />
            </motion.div>
            Sugerencia IA - Asignación de Cajeros
          </div>
          <Button
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating || !salesAnalysis}
            className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Generar
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Vista previa de datos */}
        {!showSuggestions && salesAnalysis && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 mb-3">
              📊 Días de mayor demanda basado en histórico de ventas:
            </p>
            <div className="grid grid-cols-7 gap-1">
              {salesAnalysis.map((day, idx) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-2 rounded-lg text-center ${
                    day.demandRank <= 2 ? 'bg-rose-100 border border-rose-200' :
                    day.demandRank <= 4 ? 'bg-amber-100 border border-amber-200' :
                    'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <p className="text-[10px] font-bold text-gray-600">{day.day.slice(0, 3)}</p>
                  <p className={`text-xs font-black ${
                    day.demandRank <= 2 ? 'text-rose-600' :
                    day.demandRank <= 4 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {day.demandRank <= 2 ? '🔥' : day.demandRank <= 4 ? '📈' : '📊'}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias generadas */}
        <AnimatePresence>
          {showSuggestions && suggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {suggestions.general_insights && (
                <div className="bg-white/80 rounded-lg p-3 border border-violet-200 mb-4">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-violet-600">💡 Insight:</span> {suggestions.general_insights}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.suggestions?.map((sug, idx) => (
                  <motion.div
                    key={sug.day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-3 rounded-xl border ${getPriorityBg(sug.priority)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-gray-800">{sug.day}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getPriorityColor(sug.priority)}`}>
                        {sug.priority}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {sug.recommended_cashiers?.map((name, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="font-medium">{name}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">{sug.reason}</p>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="w-full text-xs text-violet-600"
              >
                Ver datos base
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}