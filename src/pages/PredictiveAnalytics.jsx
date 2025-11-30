import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { 
  ArrowLeft, Brain, TrendingUp, Users, Sparkles, Calendar,
  Clock, Target, Zap, RefreshCw, ChevronRight, AlertCircle,
  Sun, Moon, Cloud, Thermometer, Gift, DollarSign, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart, ReferenceLine
} from 'recharts';
import { format, addDays, startOfWeek, endOfWeek, subWeeks, getDay, getHours } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PredictiveAnalytics() {
  const [selectedStore, setSelectedStore] = useState('');
  const [activeTab, setActiveTab] = useState('predictions');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
    setAiInsights(null);
  };

  // Fetch historical data
  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecordsPredictive', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySalesPredictive', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgetsPredictive', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiersPredictive', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Calculate historical patterns
  const historicalPatterns = useMemo(() => {
    if (shiftRecords.length === 0) return null;

    // Sales by day of week
    const dayPatterns = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const shiftPatterns = { morning: [], afternoon: [], night: [] };
    
    shiftRecords.forEach(record => {
      const date = new Date(record.date);
      const dayOfWeek = getDay(date);
      dayPatterns[dayOfWeek].push(record.sales || 0);
      
      if (record.shift) {
        shiftPatterns[record.shift].push(record.sales || 0);
      }
    });

    // Calculate averages
    const dayAverages = Object.entries(dayPatterns).map(([day, sales]) => ({
      day: parseInt(day),
      dayName: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day],
      avgSales: sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0,
      count: sales.length
    }));

    const shiftAverages = Object.entries(shiftPatterns).map(([shift, sales]) => ({
      shift,
      shiftName: shift === 'morning' ? 'Mañana' : shift === 'afternoon' ? 'Tarde' : 'Noche',
      avgSales: sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0,
      count: sales.length
    }));

    // Peak identification
    const sortedDays = [...dayAverages].sort((a, b) => b.avgSales - a.avgSales);
    const peakDays = sortedDays.slice(0, 2);
    const lowDays = sortedDays.slice(-2);

    const sortedShifts = [...shiftAverages].sort((a, b) => b.avgSales - a.avgSales);
    const peakShift = sortedShifts[0];

    return { dayAverages, shiftAverages, peakDays, lowDays, peakShift };
  }, [shiftRecords]);

  // Generate predictions for next 7 days
  const predictions = useMemo(() => {
    if (!historicalPatterns) return [];

    const next7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = getDay(date);
      const dayData = historicalPatterns.dayAverages.find(d => d.day === dayOfWeek);
      
      // Apply seasonality factor (weekend boost)
      let seasonalityFactor = 1;
      if (dayOfWeek === 0 || dayOfWeek === 6) seasonalityFactor = 1.15;
      if (dayOfWeek === 5) seasonalityFactor = 1.1;

      // Random variation for realism
      const variation = 0.95 + Math.random() * 0.1;

      const predictedSales = (dayData?.avgSales || 0) * seasonalityFactor * variation;
      
      // Confidence based on data count
      const confidence = Math.min(95, 60 + (dayData?.count || 0) * 2);

      next7Days.push({
        date,
        dateStr: format(date, 'EEE dd', { locale: es }),
        fullDate: format(date, 'yyyy-MM-dd'),
        dayName: dayData?.dayName || '',
        predictedSales,
        lowerBound: predictedSales * 0.85,
        upperBound: predictedSales * 1.15,
        confidence,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    return next7Days;
  }, [historicalPatterns]);

  // Staff recommendations
  const staffRecommendations = useMemo(() => {
    if (!historicalPatterns || predictions.length === 0) return [];

    return predictions.map(day => {
      const salesLevel = day.predictedSales;
      let recommendedStaff = 2; // Minimum
      let shiftDistribution = { morning: 1, afternoon: 1, night: 1 };

      if (salesLevel > 2000000) {
        recommendedStaff = 4;
        shiftDistribution = { morning: 2, afternoon: 2, night: 1 };
      } else if (salesLevel > 1500000) {
        recommendedStaff = 3;
        shiftDistribution = { morning: 1, afternoon: 2, night: 1 };
      } else if (salesLevel > 1000000) {
        recommendedStaff = 3;
        shiftDistribution = { morning: 1, afternoon: 1, night: 1 };
      }

      // Weekend adjustment
      if (day.isWeekend) {
        recommendedStaff += 1;
        shiftDistribution.afternoon += 1;
      }

      return {
        ...day,
        recommendedStaff,
        shiftDistribution,
        peakHours: day.isWeekend ? '14:00 - 18:00' : '12:00 - 14:00'
      };
    });
  }, [historicalPatterns, predictions]);

  // Run AI analysis
  const runAIAnalysis = async () => {
    if (!selectedStore || shiftRecords.length < 5) return;
    
    setIsAnalyzing(true);
    
    try {
      // Prepare data summary for AI
      const totalSales = shiftRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
      const avgTicket = shiftRecords.reduce((sum, r) => sum + (r.sales || 0), 0) / 
                       Math.max(1, shiftRecords.reduce((sum, r) => sum + (r.tickets || 0), 0));
      const avgSuggested = shiftRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0) / shiftRecords.length;
      
      const peakDayNames = historicalPatterns?.peakDays.map(d => d.dayName).join(', ') || '';
      const lowDayNames = historicalPatterns?.lowDays.map(d => d.dayName).join(', ') || '';
      const peakShiftName = historicalPatterns?.peakShift?.shiftName || '';

      const prompt = `Eres un experto en análisis de retail y heladerías. Analiza estos datos de la tienda ${selectedStore}:

DATOS HISTÓRICOS:
- Total registros: ${shiftRecords.length} turnos
- Ventas promedio por turno: $${(totalSales / shiftRecords.length).toLocaleString('es-CO')} COP
- Ticket promedio: $${avgTicket.toLocaleString('es-CO')} COP
- Promedio sugeridos vendidos: ${avgSuggested.toFixed(1)} por turno
- Días de mayor venta: ${peakDayNames}
- Días de menor venta: ${lowDayNames}
- Turno más productivo: ${peakShiftName}

PREDICCIÓN PRÓXIMOS 7 DÍAS:
${predictions.slice(0, 3).map(p => `- ${p.dateStr}: $${p.predictedSales.toLocaleString('es-CO')} COP estimado`).join('\n')}

Proporciona análisis en formato JSON con:
1. "salesForecast": Predicción detallada y factores que afectan ventas
2. "staffStrategy": Estrategia de personal óptima con horarios específicos
3. "promotions": 3 promociones personalizadas para aumentar ticket promedio
4. "patterns": Patrones de compra identificados
5. "opportunities": 3 oportunidades de mejora específicas
6. "risks": 2 riesgos a monitorear`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            salesForecast: { type: "string" },
            staffStrategy: { type: "string" },
            promotions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  expectedImpact: { type: "string" },
                  bestTime: { type: "string" }
                }
              }
            },
            patterns: { type: "string" },
            opportunities: {
              type: "array",
              items: { type: "string" }
            },
            risks: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAiInsights(response);
    } catch (error) {
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(v);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-purple-100">
                <ArrowLeft className="w-5 h-5 text-purple-600" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-7 h-7 text-purple-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Análisis Predictivo IA</h1>
              </div>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            {selectedStore && (
              <Button
                onClick={runAIAnalysis}
                disabled={isAnalyzing || shiftRecords.length < 5}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-2"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Analizar con IA
              </Button>
            )}
          </div>
        </div>

        {selectedStore ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="text-xs text-gray-500">Datos analizados</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{shiftRecords.length}</p>
                <p className="text-xs text-gray-400">registros históricos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-gray-500">Próx. 7 días</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(predictions.reduce((sum, p) => sum + p.predictedSales, 0))}
                </p>
                <p className="text-xs text-gray-400">ventas estimadas</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-gray-500">Mejor día</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {historicalPatterns?.peakDays[0]?.dayName || '-'}
                </p>
                <p className="text-xs text-gray-400">mayor venta histórica</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-xs text-gray-500">Turno top</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {historicalPatterns?.peakShift?.shiftName || '-'}
                </p>
                <p className="text-xs text-gray-400">más productivo</p>
              </motion.div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white/80 p-1 rounded-xl grid grid-cols-3 w-full max-w-lg mx-auto">
                <TabsTrigger value="predictions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Predicciones
                </TabsTrigger>
                <TabsTrigger value="staff" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg gap-1">
                  <Users className="w-4 h-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="promotions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg gap-1">
                  <Gift className="w-4 h-4" />
                  Promociones
                </TabsTrigger>
              </TabsList>

              {/* Predictions Tab */}
              <TabsContent value="predictions" className="space-y-6">
                {/* Prediction Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      Predicción de Ventas - Próximos 7 días
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={predictions}>
                        <defs>
                          <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateStr" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(v, name) => [formatCurrency(v), name === 'predictedSales' ? 'Predicción' : name]}
                          labelFormatter={(l) => `Fecha: ${l}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="upperBound" 
                          stroke="transparent" 
                          fill="#e9d5ff" 
                          fillOpacity={0.5}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lowerBound" 
                          stroke="transparent" 
                          fill="#fff" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predictedSales" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    
                    {/* Prediction cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
                      {predictions.map((pred, idx) => (
                        <motion.div
                          key={pred.fullDate}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-xl text-center ${pred.isWeekend ? 'bg-purple-100' : 'bg-gray-50'}`}
                        >
                          <p className="text-xs font-medium text-gray-500">{pred.dateStr}</p>
                          <p className="text-sm font-bold text-gray-800">{formatCurrency(pred.predictedSales)}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-purple-500 h-1 rounded-full" 
                                style={{ width: `${pred.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">{pred.confidence}%</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Historical Patterns */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Ventas por Día de la Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={historicalPatterns?.dayAverages || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="dayName" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Bar dataKey="avgSales" fill="#c4b5fd" radius={[4, 4, 0, 0]}>
                            {historicalPatterns?.dayAverages.map((entry, index) => (
                              <motion.rect
                                key={index}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: index * 0.1 }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Ventas por Turno</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={historicalPatterns?.shiftAverages || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="shiftName" type="category" tick={{ fontSize: 11 }} width={60} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Bar dataKey="avgSales" radius={[0, 4, 4, 0]}>
                            {historicalPatterns?.shiftAverages.map((entry, index) => (
                              <motion.rect
                                key={index}
                                fill={['#fcd34d', '#60a5fa', '#a78bfa'][index]}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: index * 0.1 }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                {aiInsights && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          Análisis IA - Pronóstico de Ventas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{aiInsights.salesForecast}</p>
                        
                        <div className="mt-4 p-3 bg-white rounded-xl">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            Patrones Identificados
                          </h4>
                          <p className="text-sm text-gray-600">{aiInsights.patterns}</p>
                        </div>

                        {aiInsights.risks?.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl">
                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Riesgos a Monitorear
                            </h4>
                            <ul className="text-sm text-red-700 space-y-1">
                              {aiInsights.risks.map((risk, i) => (
                                <li key={i}>• {risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              {/* Staff Tab */}
              <TabsContent value="staff" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-blue-500" />
                      Recomendaciones de Personal - Próximos 7 días
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {staffRecommendations.map((day, idx) => (
                      <motion.div
                        key={day.fullDate}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border ${day.isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{day.dateStr}</span>
                              {day.isWeekend && <Badge className="bg-blue-100 text-blue-700">Fin de semana</Badge>}
                            </div>
                            <p className="text-sm text-gray-500">Venta estimada: {formatCurrency(day.predictedSales)}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                                <span className="text-xl font-bold text-blue-600">{day.recommendedStaff}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">personas</p>
                            </div>
                            
                            <div className="hidden md:flex gap-2">
                              <div className="text-center px-3 py-2 bg-yellow-100 rounded-lg">
                                <Sun className="w-4 h-4 text-yellow-600 mx-auto" />
                                <p className="text-xs font-medium text-yellow-700">{day.shiftDistribution.morning}</p>
                              </div>
                              <div className="text-center px-3 py-2 bg-orange-100 rounded-lg">
                                <Cloud className="w-4 h-4 text-orange-600 mx-auto" />
                                <p className="text-xs font-medium text-orange-700">{day.shiftDistribution.afternoon}</p>
                              </div>
                              <div className="text-center px-3 py-2 bg-indigo-100 rounded-lg">
                                <Moon className="w-4 h-4 text-indigo-600 mx-auto" />
                                <p className="text-xs font-medium text-indigo-700">{day.shiftDistribution.night}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Horas pico: <strong>{day.peakHours}</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>Reforzar personal en turno tarde</span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Staff Strategy */}
                {aiInsights && (
                  <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        Estrategia de Personal IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{aiInsights.staffStrategy}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Available Staff */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Equipo Disponible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {cashiers.filter(c => c.is_active !== false).slice(0, 8).map((cashier, idx) => (
                        <div key={cashier.id} className="p-3 bg-gray-50 rounded-xl text-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                            {cashier.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{cashier.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Promotions Tab */}
              <TabsContent value="promotions" className="space-y-6">
                {/* AI Promotions */}
                {aiInsights?.promotions ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {aiInsights.promotions.map((promo, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-full">
                          <CardHeader className="pb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                              <Gift className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-lg">{promo.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-gray-600">{promo.description}</p>
                            
                            <div className="p-2 bg-green-50 rounded-lg">
                              <p className="text-xs text-green-700">
                                <strong>Impacto esperado:</strong> {promo.expectedImpact}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Mejor momento: {promo.bestTime}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                      <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Promociones Personalizadas</h3>
                      <p className="text-gray-500 mb-4">Ejecuta el análisis IA para obtener recomendaciones de promociones basadas en patrones de compra</p>
                      <Button onClick={runAIAnalysis} disabled={isAnalyzing} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-2">
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generar Promociones IA
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Opportunities */}
                {aiInsights?.opportunities && (
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Oportunidades de Mejora
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiInsights.opportunities.map((opp, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-white rounded-xl"
                          >
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-600 font-bold text-sm">{idx + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700">{opp}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ticket Average Strategies */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Estrategias para Aumentar Ticket Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Venta Sugestiva', desc: 'Ofrecer toppings y extras en cada venta', impact: '+15% ticket' },
                        { title: 'Combos Premium', desc: 'Crear combos con productos de mayor margen', impact: '+20% ticket' },
                        { title: 'Upsizing', desc: 'Sugerir tamaño grande por diferencia mínima', impact: '+10% ticket' },
                        { title: 'Producto del Día', desc: 'Destacar un producto premium diariamente', impact: '+12% ticket' }
                      ].map((strategy, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{strategy.title}</h4>
                            <Badge className="bg-green-100 text-green-700">{strategy.impact}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{strategy.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🧠
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para ver predicciones y análisis con IA</p>
          </div>
        )}
      </div>
    </div>
  );
}