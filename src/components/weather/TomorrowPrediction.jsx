import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, CloudSun, CloudLightning,
  TrendingUp, TrendingDown, Calendar, Sparkles, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const getWeatherInfo = (code) => {
  if (code === 0) return { icon: Sun, label: 'Despejado', color: 'text-amber-500', bg: 'from-amber-50 to-yellow-100' };
  if (code >= 1 && code <= 2) return { icon: CloudSun, label: 'Parcialmente nublado', color: 'text-sky-500', bg: 'from-sky-50 to-blue-100' };
  if (code === 3) return { icon: Cloud, label: 'Nublado', color: 'text-gray-500', bg: 'from-gray-100 to-slate-200' };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: 'Lluvia', color: 'text-blue-500', bg: 'from-blue-100 to-indigo-200' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Aguacero', color: 'text-blue-600', bg: 'from-blue-200 to-indigo-300' };
  if (code >= 95 && code <= 99) return { icon: CloudLightning, label: 'Tormenta', color: 'text-purple-600', bg: 'from-purple-100 to-indigo-200' };
  return { icon: CloudSun, label: 'Variable', color: 'text-sky-500', bg: 'from-sky-50 to-blue-100' };
};

const getWeatherType = (code) => {
  if (code === 0 || (code >= 1 && code <= 2)) return 'warm';
  if (code >= 51 && code <= 99) return 'rainy';
  return 'cloudy';
};

export default function TomorrowPrediction({ weatherData, dailySales = [], loading }) {
  const prediction = useMemo(() => {
    if (!weatherData?.forecast || !weatherData?.history) return null;
    
    const tomorrow = weatherData.forecast;
    const tomorrowIdx = 1; // Índice 0 es hoy, 1 es mañana
    
    if (!tomorrow.time?.[tomorrowIdx]) return null;
    
    const tempMax = tomorrow.temperature_2m_max?.[tomorrowIdx];
    const tempMin = tomorrow.temperature_2m_min?.[tomorrowIdx];
    const rainProb = tomorrow.precipitation_probability_max?.[tomorrowIdx] || 0;
    const weatherCode = tomorrow.weathercode?.[tomorrowIdx];
    const weatherInfo = getWeatherInfo(weatherCode);
    const weatherType = getWeatherType(weatherCode);
    
    // Calcular impacto esperado basado en historial
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    // Agrupar ventas históricas por tipo de clima
    const historicalSales = { warm: [], rainy: [], cloudy: [] };
    weatherData.history.time?.forEach((date, idx) => {
      const code = weatherData.history.weathercode?.[idx];
      const type = getWeatherType(code);
      const sales = salesByDate[date];
      if (sales) historicalSales[type].push(sales);
    });
    
    // Calcular promedio por tipo
    const allSales = Object.values(historicalSales).flat();
    const overallAvg = allSales.length ? allSales.reduce((a, b) => a + b, 0) / allSales.length : 0;
    
    const typeAvg = historicalSales[weatherType].length 
      ? historicalSales[weatherType].reduce((a, b) => a + b, 0) / historicalSales[weatherType].length 
      : overallAvg;
    
    const expectedImpact = overallAvg ? ((typeAvg - overallAvg) / overallAvg) * 100 : 0;
    
    // Generar recomendación
    let recommendation = '';
    if (weatherType === 'warm' && tempMax >= 25) {
      recommendation = `🌡️ Se esperan ${Math.round(tempMax)}°C, prepara mayor stock de conos, vasos y malteadas. Refuerza personal para la tarde.`;
    } else if (weatherType === 'rainy' || rainProb > 50) {
      recommendation = `🌧️ Probabilidad de lluvia del ${rainProb}%. Activa promociones de domicilios y prepara alternativas calientes.`;
    } else if (weatherType === 'cloudy') {
      recommendation = `☁️ Día templado esperado. Enfócate en familias con combos y promociones de especialidades.`;
    } else {
      recommendation = `☀️ Buen clima previsto. Aprovecha para promocionar productos de temporada en el punto.`;
    }
    
    return {
      date: tomorrow.time[tomorrowIdx],
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      rainProb,
      weatherInfo,
      weatherType,
      expectedImpact: Math.round(expectedImpact),
      expectedSales: typeAvg,
      recommendation
    };
  }, [weatherData, dailySales]);

  if (!prediction) {
    return (
      <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Calendar className="w-10 h-10 text-violet-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Cargando predicción...</p>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = prediction.weatherInfo.icon;
  const isPositive = prediction.expectedImpact >= 0;

  return (
    <Card className={`bg-gradient-to-br ${prediction.weatherInfo.bg} border-0 shadow-lg overflow-hidden relative`}>
      {/* Decorative sparkles */}
      <div className="absolute top-2 right-2">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-violet-300 opacity-50" />
        </motion.div>
      </div>
      
      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Predicción para Mañana</h3>
            <p className="text-xs text-gray-500 capitalize">
              {format(new Date(prediction.date), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        {/* Weather Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: prediction.weatherInfo.icon === Sun ? [0, 10, -10, 0] : 0
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <WeatherIcon className={`w-14 h-14 ${prediction.weatherInfo.color}`} />
            </motion.div>
            <div>
              <p className={`font-medium ${prediction.weatherInfo.color}`}>{prediction.weatherInfo.label}</p>
              <p className="text-2xl font-black text-gray-800">
                {prediction.tempMin}° / {prediction.tempMax}°C
              </p>
            </div>
          </div>
          
          {/* Impact Badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-center px-3 py-2 rounded-xl ${
              isPositive ? 'bg-green-100' : 'bg-amber-100'
            }`}
          >
            <div className={`flex items-center gap-1 justify-center ${isPositive ? 'text-green-700' : 'text-amber-700'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-lg font-bold">{isPositive ? '+' : ''}{prediction.expectedImpact}%</span>
            </div>
            <p className="text-[10px] text-gray-600">impacto esperado</p>
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <CloudRain className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-800">{prediction.rainProb}%</p>
            <p className="text-[10px] text-gray-500">Prob. lluvia</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-800">
              ${(prediction.expectedSales / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] text-gray-500">Venta esperada</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 text-center">
            {isPositive ? (
              <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            )}
            <p className="text-sm font-bold text-gray-800">
              {isPositive ? 'Favorable' : 'Preparar'}
            </p>
            <p className="text-[10px] text-gray-500">Pronóstico</p>
          </div>
        </div>

        {/* Recommendation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur rounded-xl p-4"
        >
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">
                Recomendación para el Jefe de Punto
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {prediction.recommendation}
              </p>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}