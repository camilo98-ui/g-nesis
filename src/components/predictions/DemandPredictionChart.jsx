import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, Calendar, Sun, CloudRain, Sparkles, 
  Users, Package, AlertTriangle, ChevronRight, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar
} from 'recharts';
import { format, addDays, subDays, parseISO, getDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Nombres de días en español
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DemandPredictionChart({ storeId, formatCurrency }) {
  const [forecastDays, setForecastDays] = useState(7);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch historical sales
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Fetch budget
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', storeId],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Fetch weather forecast
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=4.6097&longitude=-74.0817&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FBogota&forecast_days=14`
        );
        const data = await response.json();
        setWeatherForecast(data.daily);
      } catch (e) {
        console.error('Error fetching forecast:', e);
      }
    };
    fetchWeather();
  }, []);

  // Calculate predictions using ML-like approach
  const predictions = useMemo(() => {
    if (!dailySales.length) return [];

    // Group historical data by day of week
    const dayOfWeekStats = {};
    for (let i = 0; i < 7; i++) {
      dayOfWeekStats[i] = { sales: [], temps: [], precip: [] };
    }

    dailySales.forEach(sale => {
      const date = parseISO(sale.date?.split('T')[0] || sale.date);
      const dayOfWeek = getDay(date);
      dayOfWeekStats[dayOfWeek].sales.push(sale.total_sales || 0);
    });

    // Calculate averages per day of week
    const dayAverages = {};
    Object.keys(dayOfWeekStats).forEach(day => {
      const sales = dayOfWeekStats[day].sales;
      dayAverages[day] = sales.length > 0 
        ? sales.reduce((a, b) => a + b, 0) / sales.length 
        : 0;
    });

    // Weather impact multipliers (based on ice cream business patterns)
    const getWeatherMultiplier = (temp, precipProb) => {
      let multiplier = 1;
      // Temperature impact: warmer = more sales
      if (temp >= 25) multiplier *= 1.2;
      else if (temp >= 22) multiplier *= 1.1;
      else if (temp <= 15) multiplier *= 0.8;
      
      // Rain impact: reduces sales
      if (precipProb >= 80) multiplier *= 0.7;
      else if (precipProb >= 50) multiplier *= 0.85;
      else if (precipProb <= 20) multiplier *= 1.05;
      
      return multiplier;
    };

    // Seasonality factor (month-based)
    const getSeasonalityFactor = (date) => {
      const month = date.getMonth();
      // Holidays and special seasons for ice cream
      if (month === 11) return 1.3; // December
      if (month === 0) return 1.2;  // January
      if (month === 3 || month === 9) return 1.1; // April, October (vacations)
      if (month === 5 || month === 6) return 0.9; // June-July (cooler months in Colombia highlands)
      return 1;
    };

    // Recent trend factor
    const recentSales = dailySales
      .filter(s => {
        const d = parseISO(s.date?.split('T')[0] || s.date);
        return d >= subDays(new Date(), 14);
      })
      .map(s => s.total_sales || 0);
    
    const recentAvg = recentSales.length > 0 
      ? recentSales.reduce((a, b) => a + b, 0) / recentSales.length 
      : 0;
    const overallAvg = dailySales.reduce((a, b) => a + (b.total_sales || 0), 0) / dailySales.length;
    const trendFactor = overallAvg > 0 ? recentAvg / overallAvg : 1;

    // Generate predictions
    const result = [];
    for (let i = 0; i < forecastDays; i++) {
      const date = addDays(new Date(), i + 1);
      const dayOfWeek = getDay(date);
      const basePredict = dayAverages[dayOfWeek] || overallAvg;
      
      // Get weather data if available
      let weatherMultiplier = 1;
      let temp = null;
      let precipProb = null;
      if (weatherForecast?.time && i < weatherForecast.time.length) {
        temp = weatherForecast.temperature_2m_max?.[i] || 20;
        precipProb = weatherForecast.precipitation_probability_max?.[i] || 30;
        weatherMultiplier = getWeatherMultiplier(temp, precipProb);
      }

      const seasonality = getSeasonalityFactor(date);
      const predicted = basePredict * weatherMultiplier * seasonality * Math.min(Math.max(trendFactor, 0.8), 1.2);
      
      // Calculate confidence (higher when we have more data)
      const dataPoints = dayOfWeekStats[dayOfWeek].sales.length;
      const confidence = Math.min(95, 60 + dataPoints * 5);
      
      // Calculate range
      const variance = dayOfWeekStats[dayOfWeek].sales.length > 1
        ? Math.sqrt(dayOfWeekStats[dayOfWeek].sales.reduce((sum, v) => sum + Math.pow(v - basePredict, 2), 0) / dayOfWeekStats[dayOfWeek].sales.length)
        : basePredict * 0.15;
      
      result.push({
        date: format(date, 'yyyy-MM-dd'),
        dateLabel: format(date, 'EEE dd', { locale: es }),
        fullDate: format(date, 'EEEE dd MMM', { locale: es }),
        dayName: DAY_NAMES[dayOfWeek],
        predicted: Math.round(predicted),
        predictedLow: Math.round(predicted - variance),
        predictedHigh: Math.round(predicted + variance),
        confidence,
        temperature: temp,
        precipProb,
        weatherMultiplier,
        seasonality,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        weatherIcon: precipProb > 50 ? '🌧️' : temp >= 24 ? '☀️' : '⛅'
      });
    }

    return result;
  }, [dailySales, forecastDays, weatherForecast]);

  // Staffing recommendations based on predictions
  const staffingRecommendations = useMemo(() => {
    if (!predictions.length) return [];
    
    const avgPrediction = predictions.reduce((a, b) => a + b.predicted, 0) / predictions.length;
    
    return predictions.map(p => {
      const ratio = p.predicted / avgPrediction;
      let staff = 2; // base
      if (ratio >= 1.3) staff = 4;
      else if (ratio >= 1.1) staff = 3;
      else if (ratio <= 0.7) staff = 1;
      
      return {
        ...p,
        recommendedStaff: staff,
        intensity: ratio >= 1.2 ? 'high' : ratio <= 0.8 ? 'low' : 'normal'
      };
    });
  }, [predictions]);

  // Calculate total projected and compare with budget
  const monthProjection = useMemo(() => {
    const now = new Date();
    const currentBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear());
    const totalProjected = predictions.reduce((sum, p) => sum + p.predicted, 0);
    
    // Get current month sales so far
    const monthStart = startOfMonth(now);
    const currentMonthSales = dailySales
      .filter(s => parseISO(s.date?.split('T')[0] || s.date) >= monthStart)
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);
    
    return {
      projected: totalProjected,
      budget: currentBudget?.sales_budget || 0,
      currentSales: currentMonthSales,
      estimatedTotal: currentMonthSales + totalProjected
    };
  }, [predictions, budgets, dailySales]);

  if (!storeId) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border-0 shadow-xl overflow-hidden">
        <CardContent className="p-5 relative">
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">Predicción de Demanda</h2>
                <p className="text-white/70 text-sm">IA + Clima + Estacionalidad</p>
              </div>
            </div>

            <div className="flex gap-2">
              {[7, 14].map(days => (
                <Button
                  key={days}
                  variant={forecastDays === days ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setForecastDays(days)}
                  className={forecastDays === days 
                    ? "bg-white text-purple-600" 
                    : "text-white hover:bg-white/20"
                  }
                >
                  {days} días
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Ventas Proyectadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictions}>
                <defs>
                  <linearGradient id="predictionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c4b5fd" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl border border-purple-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{data?.weatherIcon}</span>
                          <span className="font-bold text-gray-800">{data?.fullDate}</span>
                        </div>
                        <p className="text-purple-600 font-bold text-lg">{formatCurrency(data?.predicted)}</p>
                        <p className="text-xs text-gray-500">
                          Rango: {formatCurrency(data?.predictedLow)} - {formatCurrency(data?.predictedHigh)}
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                          <p className="flex justify-between">
                            <span>🌡️ Temperatura:</span>
                            <span className="font-medium">{data?.temperature}°C</span>
                          </p>
                          <p className="flex justify-between">
                            <span>🌧️ Prob. lluvia:</span>
                            <span className="font-medium">{data?.precipProb}%</span>
                          </p>
                          <p className="flex justify-between">
                            <span>📊 Confianza:</span>
                            <span className="font-medium text-purple-600">{data?.confidence}%</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="predictedHigh"
                  stroke="transparent"
                  fill="url(#rangeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#predictionGrad)"
                  dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
                <Bar dataKey="predicted" fill="#8b5cf6" opacity={0.1} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Day cards */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {predictions.slice(0, 7).map((p, idx) => (
              <motion.div
                key={p.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className={`flex-shrink-0 w-24 p-3 rounded-xl text-center cursor-pointer ${
                  p.isWeekend 
                    ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200' 
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="text-lg">{p.weatherIcon}</span>
                <p className="text-[10px] text-gray-500 mt-1">{p.dayName.slice(0, 3)}</p>
                <p className="text-xs font-bold text-gray-700">{format(parseISO(p.date), 'dd')}</p>
                <p className="text-sm font-black text-purple-600 mt-1">
                  ${(p.predicted/1000000).toFixed(1)}M
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staffing & Resource Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Staffing */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Recomendación de Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staffingRecommendations.slice(0, 5).map((day, idx) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span>{day.weatherIcon}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-700">{day.dayName}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(day.date), 'dd MMM')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      day.intensity === 'high' ? 'bg-red-100 text-red-700' :
                      day.intensity === 'low' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {day.recommendedStaff} cajeros
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alert */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Planificación de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">Proyección {forecastDays} días</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">
                      {formatCurrency(predictions.reduce((s, p) => s + p.predicted, 0))}
                    </p>
                    <p className="text-xs text-amber-600/70 mt-1">
                      Promedio diario: {formatCurrency(predictions.reduce((s, p) => s + p.predicted, 0) / forecastDays)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">Días de alta demanda esperados</p>
                <div className="flex flex-wrap gap-1">
                  {predictions.filter(p => p.predicted > predictions.reduce((s, x) => s + x.predicted, 0) / predictions.length * 1.1).map(p => (
                    <Badge key={p.date} className="bg-purple-100 text-purple-700 text-xs">
                      {p.weatherIcon} {p.dayName.slice(0, 3)} {format(parseISO(p.date), 'dd')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded-lg">
                💡 Se recomienda aumentar inventario de sabores top en días de alta demanda
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}