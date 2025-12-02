import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, 
  Droplets, Wind, Thermometer, Eye, Calendar, Loader2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mapear código de clima a icono y descripción
const getWeatherInfo = (code) => {
  if (code === 0) return { icon: Sun, label: 'Despejado', color: 'text-amber-500', bg: 'from-amber-50 to-yellow-100' };
  if (code >= 1 && code <= 2) return { icon: CloudSun, label: 'Parcialmente nublado', color: 'text-sky-500', bg: 'from-sky-50 to-blue-100' };
  if (code === 3) return { icon: Cloud, label: 'Nublado', color: 'text-gray-500', bg: 'from-gray-100 to-slate-200' };
  if (code >= 45 && code <= 48) return { icon: Cloud, label: 'Neblina', color: 'text-gray-400', bg: 'from-gray-100 to-slate-200' };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: 'Lluvia', color: 'text-blue-500', bg: 'from-blue-100 to-indigo-200' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: 'Nieve', color: 'text-cyan-500', bg: 'from-cyan-50 to-blue-100' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Aguacero', color: 'text-blue-600', bg: 'from-blue-200 to-indigo-300' };
  if (code >= 95 && code <= 99) return { icon: CloudLightning, label: 'Tormenta', color: 'text-purple-600', bg: 'from-purple-100 to-indigo-200' };
  return { icon: CloudSun, label: 'Variable', color: 'text-sky-500', bg: 'from-sky-50 to-blue-100' };
};

// Generar mensaje inteligente
const getSmartMessage = (temp, humidity, rainProb, uvIndex) => {
  const messages = [];
  
  if (temp >= 25) {
    messages.push('🍦 Clima cálido ideal para ventas de conos, vasos y malteadas frías.');
  } else if (temp >= 18 && temp < 25) {
    messages.push('☀️ Temperatura agradable, buen día para promociones de sundaes y especialidades.');
  } else {
    messages.push('🧥 Día fresco, promociona bebidas calientes y postres reconfortantes.');
  }
  
  if (rainProb > 60) {
    messages.push('🌧️ Alta probabilidad de lluvia, prepara promociones para domicilios.');
  } else if (rainProb > 30) {
    messages.push('☁️ Posible lluvia, ten paraguas para clientes y enfócate en el punto.');
  }
  
  if (uvIndex >= 6) {
    messages.push('☀️ UV alto, los clientes buscarán refrescarse - oportunidad para bebidas frías.');
  }
  
  if (humidity > 80) {
    messages.push('💧 Humedad alta, los helados serán más apetecidos.');
  }
  
  return messages.slice(0, 2).join(' ');
};

export default function TodayWeatherCard({ weatherData, loading }) {
  const [showWeekView, setShowWeekView] = useState(false);
  
  const current = weatherData?.current;
  const history = weatherData?.history;
  
  if (loading || !current) {
    return (
      <Card className="bg-gradient-to-br from-sky-50 to-blue-100 border-0 shadow-lg overflow-hidden">
        <CardContent className="p-6 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  const weatherInfo = getWeatherInfo(current.weather_code);
  const WeatherIcon = weatherInfo.icon;
  const smartMessage = getSmartMessage(
    current.temperature_2m,
    current.relative_humidity_2m,
    current.precipitation_probability || 0,
    current.uv_index || 0
  );

  return (
    <Card className={`bg-gradient-to-br ${weatherInfo.bg} border-0 shadow-lg overflow-hidden relative`}>
      {/* Decorative clouds */}
      <div className="absolute top-0 right-0 opacity-10">
        <Cloud className="w-32 h-32 -mt-8 -mr-8" />
      </div>
      <div className="absolute bottom-0 left-0 opacity-10">
        <Cloud className="w-24 h-24 -mb-6 -ml-6" />
      </div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">Clima Actual • Bogotá</p>
            <h2 className="text-4xl font-black text-gray-800">
              {Math.round(current.temperature_2m)}°C
            </h2>
            <p className={`text-sm font-medium ${weatherInfo.color}`}>{weatherInfo.label}</p>
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: weatherInfo.icon === Sun ? [0, 10, -10, 0] : 0
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <WeatherIcon className={`w-16 h-16 ${weatherInfo.color}`} />
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/60 backdrop-blur rounded-xl p-2 text-center"
          >
            <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">{current.relative_humidity_2m}%</p>
            <p className="text-[10px] text-gray-500">Humedad</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/60 backdrop-blur rounded-xl p-2 text-center"
          >
            <CloudRain className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">{current.precipitation_probability || 0}%</p>
            <p className="text-[10px] text-gray-500">Prob. Lluvia</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/60 backdrop-blur rounded-xl p-2 text-center"
          >
            <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">{current.uv_index?.toFixed(1) || 'N/A'}</p>
            <p className="text-[10px] text-gray-500">Índice UV</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/60 backdrop-blur rounded-xl p-2 text-center"
          >
            <Thermometer className="w-4 h-4 text-rose-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800">
              {current.temperature_2m >= 22 ? 'Cálido' : current.temperature_2m >= 16 ? 'Templado' : 'Fresco'}
            </p>
            <p className="text-[10px] text-gray-500">Sensación</p>
          </motion.div>
        </div>

        {/* Smart Message */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur rounded-xl p-3 mb-3"
        >
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-bold text-sky-600">💡 Recomendación:</span> {smartMessage}
          </p>
        </motion.div>

        {/* Week View Toggle */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowWeekView(!showWeekView)}
          className="w-full bg-white/60 hover:bg-white/80 border-white/50 gap-2"
        >
          <Calendar className="w-4 h-4" />
          {showWeekView ? 'Ocultar últimos 7 días' : 'Ver análisis de los últimos 7 días'}
        </Button>

        {/* Week History */}
        <AnimatePresence>
          {showWeekView && history && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="grid grid-cols-7 gap-1">
                {history.time?.slice(-7).map((date, idx) => {
                  const temp = history.temperature_2m_mean?.[history.time.length - 7 + idx];
                  const code = history.weathercode?.[history.time.length - 7 + idx];
                  const info = getWeatherInfo(code);
                  const Icon = info.icon;
                  return (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/70 rounded-lg p-2 text-center"
                    >
                      <p className="text-[10px] text-gray-500 font-medium">
                        {new Date(date).toLocaleDateString('es', { weekday: 'short' })}
                      </p>
                      <Icon className={`w-5 h-5 mx-auto my-1 ${info.color}`} />
                      <p className="text-sm font-bold text-gray-800">{Math.round(temp)}°</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}