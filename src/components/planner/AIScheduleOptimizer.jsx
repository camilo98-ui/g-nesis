import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, TrendingUp, AlertTriangle, Users, DollarSign, 
  Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
  ThermometerSun, Zap, Target, Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AIScheduleOptimizer({ storeId, currentWeek, shifts, cashiers, sales, budgets, onDayScheduleClick }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Obtener datos históricos (últimas 4 semanas)
  const { data: historicalShifts = [] } = useQuery({
    queryKey: ['historicalShifts', storeId],
    queryFn: async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4);
      const allShifts = await base44.entities.Shift.filter({ store_id: storeId });
      return allShifts.filter(s => new Date(s.date) >= fourWeeksAgo);
    },
    enabled: !!storeId
  });

  const { data: historicalSales = [] } = useQuery({
    queryKey: ['historicalDailySales', storeId],
    queryFn: async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4);
      const allSales = await base44.entities.DailySales.filter({ store_id: storeId });
      return allSales.filter(s => new Date(s.date) >= fourWeeksAgo);
    },
    enabled: !!storeId
  });

  const { data: historicalShiftRecords = [] } = useQuery({
    queryKey: ['historicalShiftRecords', storeId],
    queryFn: async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4);
      const allRecords = await base44.entities.ShiftRecord.filter({ store_id: storeId });
      return allRecords.filter(r => new Date(r.date) >= fourWeeksAgo);
    },
    enabled: !!storeId
  });

  const { data: weatherData = [] } = useQuery({
    queryKey: ['weatherHistory', storeId],
    queryFn: async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4);
      const allWeather = await base44.entities.WeatherHistory.filter({ store_id: storeId });
      return allWeather.filter(w => new Date(w.date) >= fourWeeksAgo);
    },
    enabled: !!storeId
  });

  // Calcular estadísticas de la semana actual
  const weekStats = useMemo(() => {
    if (!shifts.length) return null;

    const weekDays = eachDayOfInterval({
      start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
      end: endOfWeek(currentWeek, { weekStartsOn: 1 })
    });

    const dayStats = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayShifts = shifts.filter(s => s.date === dayStr);
      const totalHours = dayShifts.reduce((sum, shift) => {
        if (shift.role === 'descanso') return sum;
        const [startH, startM] = (shift.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (shift.end_time || '17:30').split(':').map(Number);
        return sum + ((endH + endM/60) - (startH + startM/60));
      }, 0);

      const daySales = sales.find(s => s.date === dayStr);
      const dayBudget = budgets.find(b => b.date === dayStr);

      return {
        date: dayStr,
        day: format(day, 'EEEE', { locale: es }),
        shifts: dayShifts.length,
        hours: totalHours,
        sales: daySales?.total_sales || 0,
        budget: dayBudget?.budget_amount || 0,
        staff: dayShifts.filter(s => s.role !== 'descanso').length
      };
    });

    return {
      totalShifts: shifts.length,
      totalHours: dayStats.reduce((sum, d) => sum + d.hours, 0),
      avgStaffPerDay: (dayStats.reduce((sum, d) => sum + d.staff, 0) / 7).toFixed(1),
      days: dayStats
    };
  }, [shifts, sales, budgets, currentWeek]);

  const runAIAnalysis = async () => {
    if (!storeId || historicalShifts.length === 0) {
      toast.error('No hay suficientes datos históricos');
      return;
    }

    setAnalyzing(true);

    try {
      // Preparar resumen de datos históricos
      const historicalSummary = {
        weeks: 4,
        totalShifts: historicalShifts.length,
        avgShiftsPerWeek: (historicalShifts.length / 4).toFixed(1),
        salesByDay: {},
        shiftsPerDay: {},
        weatherImpact: []
      };

      // Agrupar ventas por día de la semana
      historicalSales.forEach(sale => {
        const day = format(new Date(sale.date), 'EEEE', { locale: es });
        if (!historicalSummary.salesByDay[day]) {
          historicalSummary.salesByDay[day] = { count: 0, total: 0, avg: 0 };
        }
        historicalSummary.salesByDay[day].count++;
        historicalSummary.salesByDay[day].total += sale.total_sales || 0;
      });

      Object.keys(historicalSummary.salesByDay).forEach(day => {
        const data = historicalSummary.salesByDay[day];
        data.avg = Math.round(data.total / data.count);
      });

      // Agrupar turnos por día de la semana
      historicalShifts.forEach(shift => {
        const day = format(new Date(shift.date), 'EEEE', { locale: es });
        if (!historicalSummary.shiftsPerDay[day]) {
          historicalSummary.shiftsPerDay[day] = { count: 0, totalHours: 0 };
        }
        historicalSummary.shiftsPerDay[day].count++;
        if (shift.role !== 'descanso') {
          const [startH, startM] = (shift.start_time || '09:30').split(':').map(Number);
          const [endH, endM] = (shift.end_time || '17:30').split(':').map(Number);
          historicalSummary.shiftsPerDay[day].totalHours += ((endH + endM/60) - (startH + startM/60));
        }
      });

      // Analizar impacto del clima
      if (weatherData.length > 0) {
        const weatherSummary = weatherData.reduce((acc, w) => {
          const temp = w.temperature_mean || 0;
          const sales = w.total_sales || 0;
          if (temp > 25) {
            acc.hotDays.count++;
            acc.hotDays.totalSales += sales;
          } else if (temp < 15) {
            acc.coldDays.count++;
            acc.coldDays.totalSales += sales;
          } else {
            acc.moderateDays.count++;
            acc.moderateDays.totalSales += sales;
          }
          return acc;
        }, { hotDays: { count: 0, totalSales: 0 }, coldDays: { count: 0, totalSales: 0 }, moderateDays: { count: 0, totalSales: 0 } });

        historicalSummary.weatherImpact = [
          { condition: 'Días calurosos (>25°C)', count: weatherSummary.hotDays.count, avgSales: weatherSummary.hotDays.count > 0 ? Math.round(weatherSummary.hotDays.totalSales / weatherSummary.hotDays.count) : 0 },
          { condition: 'Días fríos (<15°C)', count: weatherSummary.coldDays.count, avgSales: weatherSummary.coldDays.count > 0 ? Math.round(weatherSummary.coldDays.totalSales / weatherSummary.coldDays.count) : 0 },
          { condition: 'Días templados (15-25°C)', count: weatherSummary.moderateDays.count, avgSales: weatherSummary.moderateDays.count > 0 ? Math.round(weatherSummary.moderateDays.totalSales / weatherSummary.moderateDays.count) : 0 }
        ];
      }

      // Datos de la semana actual
      const currentWeekData = {
        week: format(currentWeek, "'Semana' w - MMM yyyy", { locale: es }),
        stats: weekStats,
        cashiers: cashiers.length
      };

      const prompt = `Eres un experto en optimización de horarios para Popsy. Analiza los siguientes datos y proporciona recomendaciones INCLUYENDO PROPUESTA DE HORARIOS:

**DATOS HISTÓRICOS (últimas 4 semanas):**
- Total de turnos: ${historicalSummary.totalShifts}
- Promedio de turnos por semana: ${historicalSummary.avgShiftsPerWeek}

**Ventas promedio por día de la semana:**
${Object.entries(historicalSummary.salesByDay).map(([day, data]) => `- ${day}: $${data.avg.toLocaleString()} (${data.count} registros)`).join('\n')}

**Turnos históricos por día de la semana:**
${Object.entries(historicalSummary.shiftsPerDay).map(([day, data]) => `- ${day}: ${data.count} turnos, ${data.totalHours.toFixed(1)} horas totales`).join('\n')}

${historicalSummary.weatherImpact.length > 0 ? `**Impacto del clima en ventas:**
${historicalSummary.weatherImpact.map(w => `- ${w.condition}: ${w.count} días, promedio $${w.avgSales.toLocaleString()}`).join('\n')}` : ''}

**SEMANA ACTUAL (${currentWeekData.week}):**
- Total de turnos programados: ${currentWeekData.stats?.totalShifts || 0}
- Total de horas: ${currentWeekData.stats?.totalHours.toFixed(1) || 0}h
- Promedio de personal por día: ${currentWeekData.stats?.avgStaffPerDay || 0}
- Colaboradores disponibles: ${currentWeekData.cashiers}

**Desglose por día de la semana actual:**
${weekStats?.days.map(d => `- ${d.day}: ${d.shifts} turnos, ${d.hours.toFixed(1)}h, ${d.staff} personas`).join('\n') || ''}

**RESTRICCIONES LABORALES:**
- Jornada máxima semanal: 44 horas
- Incluir 1 día de descanso por semana
- Horarios operativos típicos: 9:30 AM a 9:00 PM

Proporciona tu análisis en el siguiente formato JSON (sin markdown, solo JSON puro):
{
  "demand_forecast": [
    {
      "day": "lunes",
      "predicted_demand": "alta/media/baja",
      "recommended_staff": 5,
      "reason": "Explicación breve",
      "proposed_schedules": [
        {
          "shift": "Turno 1",
          "start_time": "09:30",
          "end_time": "17:30",
          "role": "caja",
          "hours": 8
        }
      ]
    }
  ],
  "optimization_suggestions": [
    {
      "type": "warning/info/success",
      "title": "Título corto",
      "description": "Descripción detallada",
      "action": "Acción recomendada"
    }
  ],
  "cost_analysis": {
    "overstaffed_days": ["lunes", "martes"],
    "understaffed_days": ["viernes", "sábado"],
    "estimated_savings": 500000,
    "priority_actions": ["Acción 1", "Acción 2"]
  },
  "summary": "Resumen ejecutivo breve (2-3 líneas)"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            demand_forecast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  predicted_demand: { type: 'string' },
                  recommended_staff: { type: 'number' },
                  reason: { type: 'string' },
                  proposed_schedules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        shift: { type: 'string' },
                        start_time: { type: 'string' },
                        end_time: { type: 'string' },
                        role: { type: 'string' },
                        hours: { type: 'number' }
                      }
                    }
                  }
                }
              }
            },
            optimization_suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            },
            cost_analysis: {
              type: 'object',
              properties: {
                overstaffed_days: { type: 'array', items: { type: 'string' } },
                understaffed_days: { type: 'array', items: { type: 'string' } },
                estimated_savings: { type: 'number' },
                priority_actions: { type: 'array', items: { type: 'string' } }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setAnalysis(result);
      toast.success('Análisis completado');
    } catch (error) {
      console.error('Error en análisis IA:', error);
      toast.error('Error al analizar datos');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSuggestionIcon = (type) => {
    switch(type) {
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Sparkles;
    }
  };

  const getSuggestionColor = (type) => {
    switch(type) {
      case 'warning': return 'from-red-400 to-orange-400';
      case 'success': return 'from-green-400 to-emerald-400';
      default: return 'from-blue-400 to-cyan-400';
    }
  };

  const getDemandColor = (demand) => {
    switch(demand?.toLowerCase()) {
      case 'alta': return 'text-red-600 bg-red-100';
      case 'media': return 'text-amber-600 bg-amber-100';
      case 'baja': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!storeId) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Optimizador IA de Horarios
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-white/80 text-xs">Análisis inteligente basado en datos históricos</p>
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Estado inicial */}
              {!analysis && !analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-purple-500" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">¿Cómo está tu planeación esta semana?</h4>
                  <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                    Analiza patrones históricos de ventas, clima y asistencia para optimizar tu horario
                  </p>
                  <Button
                    onClick={runAIAnalysis}
                    disabled={historicalShifts.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analizar con IA
                  </Button>
                  {historicalShifts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">Se requieren datos históricos</p>
                  )}
                </motion.div>
              )}

              {/* Analizando */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Analizando datos históricos...</p>
                  <p className="text-sm text-gray-500">Esto puede tomar unos segundos</p>
                </motion.div>
              )}

              {/* Resultados */}
              {analysis && !analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Resumen */}
                  <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      Resumen Ejecutivo
                    </h4>
                    <p className="text-sm text-gray-700">{analysis.summary}</p>
                  </div>

                  {/* Predicción de demanda */}
                  {analysis.demand_forecast && analysis.demand_forecast.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Predicción de Demanda por Día
                      </h4>
                      <div className="space-y-2">
                        {analysis.demand_forecast.map((forecast, idx) => {
                          const dayDate = weekStats?.days.find(d => 
                            d.day.toLowerCase() === forecast.day.toLowerCase()
                          )?.date;
                          
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => {
                                if (dayDate && onDayScheduleClick) {
                                  setSelectedDay(forecast.day);
                                  onDayScheduleClick(dayDate, forecast.recommended_staff);
                                }
                              }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-all hover:shadow-md"
                            >
                              <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                 <Calendar className="w-4 h-4 text-gray-500" />
                                 <span className="font-bold text-gray-800 capitalize">{forecast.day}</span>
                                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getDemandColor(forecast.predicted_demand)}`}>
                                   {forecast.predicted_demand}
                                 </span>
                                 {selectedDay === forecast.day && (
                                   <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                     Seleccionado
                                   </span>
                                 )}
                               </div>
                               <p className="text-xs text-gray-600 mb-2">{forecast.reason}</p>

                               {/* Horarios propuestos */}
                               {forecast.proposed_schedules && forecast.proposed_schedules.length > 0 && (
                                 <div className="mt-2 space-y-1">
                                   <p className="text-xs font-bold text-gray-700">Horarios propuestos:</p>
                                   {forecast.proposed_schedules.map((schedule, schedIdx) => (
                                     <div key={schedIdx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1">
                                       <Clock className="w-3 h-3 text-blue-500" />
                                       <span className="font-medium">{schedule.shift}:</span>
                                       <span className="text-gray-600">{schedule.start_time} - {schedule.end_time}</span>
                                       <span className="text-gray-500">({schedule.hours}h)</span>
                                       <span className="text-purple-600 ml-auto">{schedule.role}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}
                              </div>
                              <div className="flex flex-col items-center gap-1">
                               <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                                 <Users className="w-4 h-4 text-blue-600" />
                                 <span className="font-bold text-blue-600">{forecast.recommended_staff}</span>
                               </div>
                               {forecast.proposed_schedules && (
                                 <span className="text-xs text-gray-500">
                                   {forecast.proposed_schedules.reduce((sum, s) => sum + s.hours, 0)}h
                                 </span>
                               )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Análisis de costos */}
                  {analysis.cost_analysis && (
                    <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Análisis de Costos y Eficiencia
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {analysis.cost_analysis.overstaffed_days?.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-red-600 font-medium mb-1">Sobrepersonal</p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.cost_analysis.overstaffed_days.map((day, idx) => (
                                <span key={idx} className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full capitalize">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {analysis.cost_analysis.understaffed_days?.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">Falta de personal</p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.cost_analysis.understaffed_days.map((day, idx) => (
                                <span key={idx} className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full capitalize">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {analysis.cost_analysis.estimated_savings > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                          <p className="text-xs text-green-600 font-medium mb-1">Ahorro potencial estimado</p>
                          <p className="text-2xl font-black text-green-600">
                            ${analysis.cost_analysis.estimated_savings.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {analysis.cost_analysis.priority_actions?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-2">Acciones prioritarias:</p>
                          <ul className="space-y-1">
                            {analysis.cost_analysis.priority_actions.map((action, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sugerencias de optimización */}
                  {analysis.optimization_suggestions && analysis.optimization_suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Sugerencias de Optimización
                      </h4>
                      {analysis.optimization_suggestions.map((suggestion, idx) => {
                        const Icon = getSuggestionIcon(suggestion.type);
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-xl p-4 border-l-4 border-purple-400 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getSuggestionColor(suggestion.type)} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-800 mb-1">{suggestion.title}</h5>
                                <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                                <div className="bg-purple-50 rounded-lg p-2">
                                  <p className="text-xs text-purple-700 font-medium">
                                    💡 {suggestion.action}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Botón para re-analizar */}
                  <Button
                    onClick={runAIAnalysis}
                    variant="outline"
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Re-analizar horarios
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}