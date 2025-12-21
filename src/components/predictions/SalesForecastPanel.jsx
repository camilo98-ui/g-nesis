import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Brain, Sparkles, Calendar, AlertTriangle, 
  CheckCircle, Loader2, RefreshCw, BarChart3, Target
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Area, AreaChart, Bar, BarChart
} from 'recharts';
import { addDays, format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesForecastPanel({ storeId, storeName, allStores = false }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  // Cargar datos históricos (últimos 30 días)
  const { data: historicalSales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.list(),
    enabled: !!storeId || allStores
  });

  // Filtrar datos relevantes
  const relevantSales = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return historicalSales
      .filter(s => {
        const d = new Date(s.date);
        const matchStore = allStores || s.store_id === storeId;
        return matchStore && d >= thirtyDaysAgo && !isNaN(d.getTime());
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [historicalSales, storeId, allStores]);

  // Agrupar por día si es análisis de zona
  const dailyAggregated = useMemo(() => {
    if (!allStores) return relevantSales;
    
    const grouped = {};
    relevantSales.forEach(s => {
      if (!grouped[s.date]) {
        grouped[s.date] = { date: s.date, total_sales: 0, total_tickets: 0, total_transactions: 0 };
      }
      grouped[s.date].total_sales += s.total_sales || 0;
      grouped[s.date].total_tickets += s.total_tickets || 0;
      grouped[s.date].total_transactions += s.total_transactions || 0;
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [relevantSales, allStores]);

  // Calcular precisión de pronósticos anteriores
  const calculateAccuracy = () => {
    if (!forecast || !dailyAggregated.length) return null;
    
    const last7Days = dailyAggregated.slice(-7);
    if (last7Days.length < 7) return null;
    
    const totalReal = last7Days.reduce((sum, d) => sum + d.total_sales, 0);
    const avgReal = totalReal / 7;
    const avgForecast = forecast.daily_forecast || 0;
    
    const error = Math.abs(avgReal - avgForecast) / avgReal;
    const accuracyPercent = Math.max(0, (1 - error) * 100);
    
    return accuracyPercent;
  };

  // Generar pronóstico con IA
  const generateForecast = async () => {
    if (loading || dailyAggregated.length < 7) return;
    setLoading(true);
    
    try {
      // Preparar datos para el análisis
      const recentData = dailyAggregated.slice(-21); // Últimos 21 días
      const totalSales = recentData.reduce((sum, d) => sum + d.total_sales, 0);
      const avgDaily = totalSales / recentData.length;
      const maxSales = Math.max(...recentData.map(d => d.total_sales));
      const minSales = Math.min(...recentData.map(d => d.total_sales));
      
      // Calcular tendencia
      const firstWeek = recentData.slice(0, 7).reduce((sum, d) => sum + d.total_sales, 0) / 7;
      const lastWeek = recentData.slice(-7).reduce((sum, d) => sum + d.total_sales, 0) / 7;
      const trend = ((lastWeek - firstWeek) / firstWeek) * 100;
      
      // Día de la semana con más ventas
      const dayOfWeekSales = {};
      recentData.forEach(d => {
        const dayName = format(new Date(d.date), 'EEEE', { locale: es });
        if (!dayOfWeekSales[dayName]) dayOfWeekSales[dayName] = [];
        dayOfWeekSales[dayName].push(d.total_sales);
      });
      const avgByDay = Object.entries(dayOfWeekSales).map(([day, sales]) => ({
        day,
        avg: sales.reduce((a, b) => a + b, 0) / sales.length
      }));
      const bestDay = avgByDay.sort((a, b) => b.avg - a.avg)[0];
      
      const formatCurrency = (v) => `$${(v/1000000).toFixed(2)}M`;
      
      const prompt = `Eres un analista experto de ventas de Popsy. Analiza estos datos históricos y genera un pronóstico de ventas para los próximos 7 días.

DATOS HISTÓRICOS (últimos 21 días):
${allStores ? '- Análisis de ZONA COMPLETA (todas las tiendas)' : `- Tienda: ${storeName}`}
- Venta promedio diaria: ${formatCurrency(avgDaily)}
- Venta máxima: ${formatCurrency(maxSales)}
- Venta mínima: ${formatCurrency(minSales)}
- Tendencia última semana: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%
- Mejor día: ${bestDay.day} (${formatCurrency(bestDay.avg)})

VENTAS POR DÍA (últimos 7 días):
${recentData.slice(-7).map(d => `${format(new Date(d.date), 'dd/MM (EEE)', { locale: es })}: ${formatCurrency(d.total_sales)}`).join('\n')}

INSTRUCCIONES:
1. Considera la estacionalidad semanal (qué días venden más)
2. Aplica la tendencia observada
3. Ajusta por factores externos (fin de mes, temporada, etc.)
4. Genera pronóstico para cada uno de los próximos 7 días
5. Identifica riesgos y oportunidades

Genera un pronóstico realista y accionable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_forecast: {
              type: "number",
              description: "Pronóstico de venta diaria promedio para los próximos 7 días"
            },
            forecast_7_days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_name: { type: "string" },
                  estimated_sales: { type: "number" },
                  confidence: { type: "string", enum: ["alta", "media", "baja"] }
                }
              }
            },
            weekly_total: {
              type: "number",
              description: "Total estimado para la semana"
            },
            trend_direction: {
              type: "string",
              enum: ["ascendente", "estable", "descendente"]
            },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            },
            opportunities: {
              type: "array",
              items: { type: "string" }
            },
            recommendation: {
              type: "string",
              description: "Recomendación principal para maximizar ventas"
            }
          }
        }
      });
      
      // Agregar fechas reales a los pronósticos
      const forecastWithDates = result.forecast_7_days.map((f, idx) => ({
        ...f,
        date: format(addDays(new Date(), idx + 1), 'yyyy-MM-dd'),
        formatted_date: format(addDays(new Date(), idx + 1), 'dd/MM'),
        full_date: format(addDays(new Date(), idx + 1), 'EEE dd MMM', { locale: es })
      }));
      
      setForecast({
        ...result,
        forecast_7_days: forecastWithDates,
        generated_at: new Date().toISOString()
      });
      
      // Calcular precisión si hay datos
      const acc = calculateAccuracy();
      if (acc) setAccuracy(acc);
      
    } catch (e) {
      console.error('Error generando pronóstico:', e);
    }
    setLoading(false);
  };

  // Generar pronóstico al montar el componente
  useEffect(() => {
    if (dailyAggregated.length >= 7 && !forecast) {
      generateForecast();
    }
  }, [dailyAggregated.length]);

  // Preparar datos para gráfica comparativa
  const chartData = useMemo(() => {
    if (!forecast) return [];
    
    // Últimos 7 días reales
    const historical = dailyAggregated.slice(-7).map(d => ({
      date: format(new Date(d.date), 'dd/MM'),
      full_date: format(new Date(d.date), 'EEE dd MMM', { locale: es }),
      real: d.total_sales,
      tipo: 'real'
    }));
    
    // Próximos 7 días proyectados
    const projected = forecast.forecast_7_days.map(f => ({
      date: f.formatted_date,
      full_date: f.full_date,
      proyectado: f.estimated_sales,
      tipo: 'proyectado',
      confianza: f.confidence
    }));
    
    return [...historical, ...projected];
  }, [forecast, dailyAggregated]);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0 
  }).format(Math.round(v));

  if (dailyAggregated.length < 7) {
    return (
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">
            Se necesitan al menos 7 días de datos históricos para generar pronósticos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Pronóstico IA - Próximos 7 Días
            {forecast && (
              <span className="text-xs font-normal text-gray-500">
                ({allStores ? 'Zona Completa' : storeName})
              </span>
            )}
          </CardTitle>
          <Button
            onClick={generateForecast}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {loading && !forecast ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-12 h-12 mx-auto text-purple-500" />
              </motion.div>
              <p className="text-gray-600 mt-4">Analizando patrones de ventas...</p>
            </motion.div>
          ) : forecast ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* KPIs del Pronóstico */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Promedio Diario</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(forecast.daily_forecast)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Total Semana</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(forecast.weekly_total)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Tendencia</span>
                  </div>
                  <p className="text-lg font-bold text-green-900 capitalize">
                    {forecast.trend_direction === 'ascendente' ? '📈' : forecast.trend_direction === 'descendente' ? '📉' : '➡️'}
                    {' '}{forecast.trend_direction}
                  </p>
                </div>

                {accuracy && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Precisión</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {accuracy.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Gráfica Comparativa */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  Histórico vs Pronóstico
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="proyectadoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.full_date || label}
                      formatter={(v, name) => {
                        if (name === 'Real') return [formatCurrency(v), '💰 Real'];
                        if (name === 'Proyectado') return [formatCurrency(v), '🔮 Proyectado'];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="real" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#realGradient)"
                      name="Real"
                      connectNulls
                    />
                    <Area 
                      type="monotone" 
                      dataKey="proyectado" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      fill="url(#proyectadoGradient)"
                      name="Proyectado"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Detalle por Día */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pronóstico Detallado</h4>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {forecast.forecast_7_days.map((day, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-white rounded-lg p-3 text-center border-2 ${
                        day.confidence === 'alta' ? 'border-green-200' :
                        day.confidence === 'media' ? 'border-amber-200' :
                        'border-red-200'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-1">{day.day_name}</p>
                      <p className="text-xs text-gray-400 mb-2">{day.formatted_date}</p>
                      <p className="text-base font-bold text-gray-900">
                        ${(day.estimated_sales/1000000).toFixed(1)}M
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        day.confidence === 'alta' ? 'bg-green-100 text-green-700' :
                        day.confidence === 'media' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {day.confidence}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Riesgos y Oportunidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecast.risk_factors?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <h4 className="text-sm font-semibold text-red-700">Factores de Riesgo</h4>
                    </div>
                    <ul className="space-y-2">
                      {forecast.risk_factors.map((risk, idx) => (
                        <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {forecast.opportunities?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-green-700">Oportunidades</h4>
                    </div>
                    <ul className="space-y-2">
                      {forecast.opportunities.map((opp, idx) => (
                        <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recomendación Principal */}
              {forecast.recommendation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-purple-900 mb-1">
                        Recomendación Principal
                      </h4>
                      <p className="text-sm text-purple-800">{forecast.recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400 text-center">
                Pronóstico generado: {format(new Date(forecast.generated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}