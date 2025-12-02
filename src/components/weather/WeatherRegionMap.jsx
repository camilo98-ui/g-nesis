import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CloudRain, Sun, Cloud, Loader2, TrendingUp, TrendingDown, RefreshCw, Droplets, Wind, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Regiones principales de Colombia con coordenadas para el mapa
const COLOMBIA_REGIONS = [
  { id: 'bogota', name: 'Bogotá D.C.', lat: 4.6097, lon: -74.0817, mapX: 265, mapY: 320 },
  { id: 'medellin', name: 'Medellín', lat: 6.2442, lon: -75.5812, mapX: 220, mapY: 240 },
  { id: 'cali', name: 'Cali', lat: 3.4516, lon: -76.5320, mapX: 195, mapY: 380 },
  { id: 'barranquilla', name: 'Barranquilla', lat: 10.9685, lon: -74.7813, mapX: 250, mapY: 80 },
  { id: 'cartagena', name: 'Cartagena', lat: 10.3910, lon: -75.4794, mapX: 210, mapY: 95 },
  { id: 'bucaramanga', name: 'Bucaramanga', lat: 7.1254, lon: -73.1198, mapX: 300, mapY: 200 },
  { id: 'tunja', name: 'Tunja', lat: 5.5353, lon: -73.3678, mapX: 295, mapY: 280 },
  { id: 'villavicencio', name: 'Villavicencio', lat: 4.1420, lon: -73.6266, mapX: 310, mapY: 340 },
  { id: 'pereira', name: 'Pereira', lat: 4.8087, lon: -75.6906, mapX: 215, mapY: 305 },
  { id: 'cucuta', name: 'Cúcuta', lat: 7.8939, lon: -72.5078, mapX: 330, mapY: 175 },
];

const getWeatherIcon = (type, size = 24) => {
  const iconProps = { size, strokeWidth: 2 };
  switch(type) {
    case 'sunny': return <Sun {...iconProps} className="text-amber-500" />;
    case 'rainy': return <CloudRain {...iconProps} className="text-blue-500" />;
    case 'cloudy': return <Cloud {...iconProps} className="text-gray-400" />;
    default: return <Cloud {...iconProps} className="text-gray-400" />;
  }
};

const getWeatherBg = (type) => {
  switch(type) {
    case 'sunny': return 'from-amber-400 to-yellow-300';
    case 'rainy': return 'from-blue-500 to-cyan-400';
    default: return 'from-gray-400 to-slate-300';
  }
};

// Animated Weather Icon Component
const AnimatedWeatherIcon = ({ type, size = 32 }) => {
  if (type === 'sunny') {
    return (
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        className="relative"
      >
        <Sun size={size} className="text-amber-500 drop-shadow-lg" />
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sun size={size} className="text-yellow-300 blur-sm" />
        </motion.div>
      </motion.div>
    );
  }
  
  if (type === 'rainy') {
    return (
      <div className="relative">
        <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <CloudRain size={size} className="text-blue-500 drop-shadow-lg" />
        </motion.div>
        {/* Rain drops */}
        <motion.div
          className="absolute -bottom-1 left-1/2 w-1 h-2 bg-blue-400 rounded-full"
          animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute -bottom-1 left-1/3 w-1 h-2 bg-blue-400 rounded-full"
          animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    );
  }
  
  return (
    <motion.div animate={{ x: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
      <Cloud size={size} className="text-gray-400 drop-shadow-lg" />
    </motion.div>
  );
};

export default function WeatherRegionMap({ dateRange, dailySales, formatCurrency }) {
  const [regionWeather, setRegionWeather] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('bogota');
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Fetch weather for all regions
  const fetchRegionsWeather = async () => {
    setLoading(true);
    const results = {};
    
    try {
      await Promise.all(COLOMBIA_REGIONS.map(async (region) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=America%2FBogota`
          );
          const data = await res.json();
          
          const weatherCode = data.current?.weather_code || 0;
          const precipProb = data.current?.precipitation_probability || 0;
          
          // Lógica corregida basada en códigos WMO
          let weatherType = 'cloudy';
          if (weatherCode === 0 || weatherCode === 1) weatherType = 'sunny'; // Despejado o mayormente despejado
          else if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) weatherType = 'cloudy'; // Nublado o niebla
          else if (weatherCode >= 51) weatherType = 'rainy'; // Cualquier tipo de precipitación
          
          results[region.id] = {
            temp: Math.round(data.current?.temperature_2m || 0),
            humidity: data.current?.relative_humidity_2m || 0,
            precipProb: precipProb,
            windSpeed: Math.round(data.current?.wind_speed_10m || 0),
            weatherType,
            weatherCode
          };
        } catch (e) {
          results[region.id] = { temp: 18, weatherType: 'cloudy', humidity: 70, precipProb: 50, windSpeed: 10 };
        }
      }));
      
      setRegionWeather(results);
    } catch (error) {
      console.error('Error fetching regions weather:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionsWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchRegionsWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Calcular impacto en ventas
  const salesImpact = useMemo(() => {
    const validSales = dailySales.filter(s => s.total_sales > 0);
    if (!validSales.length) return null;
    
    const totalSales = validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const avgSales = totalSales / validSales.length;
    
    const bogotaWeather = regionWeather['bogota'];
    const isRainy = bogotaWeather?.weatherType === 'rainy';
    const estimatedLoss = isRainy ? avgSales * 0.18 : 0;
    const estimatedGain = bogotaWeather?.weatherType === 'sunny' ? avgSales * 0.12 : 0;
    
    return { avgSales, isRainy, estimatedLoss, estimatedGain, totalSales };
  }, [dailySales, regionWeather]);

  const selectedWeather = regionWeather[selectedRegion];
  const selectedCity = COLOMBIA_REGIONS.find(r => r.id === selectedRegion);

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <MapPin className="w-5 h-5" />
            </motion.div>
            Clima en Tiempo Real - Colombia
          </CardTitle>
          <motion.button 
            onClick={fetchRegionsWeather}
            disabled={loading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-5 gap-0">
          {/* Map Container - 3 columns */}
          <div className="lg:col-span-3 relative bg-gradient-to-br from-sky-100 via-emerald-50 to-teal-100 min-h-[450px] p-4">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-10 h-10 text-emerald-500" />
                </motion.div>
              </div>
            )}
            
            {/* Colombia Map SVG */}
            <svg viewBox="0 0 450 520" className="w-full h-full drop-shadow-lg">
              {/* Map background gradient */}
              <defs>
                <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d1fae5" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2"/>
                </filter>
              </defs>
              
              {/* Colombia simplified outline */}
              <path 
                d="M180 50 L250 40 L300 50 L340 70 L360 100 L370 150 L360 200 L340 250 L330 300 
                   L320 350 L300 400 L270 440 L230 470 L190 480 L150 470 L120 440 L100 400 
                   L90 350 L100 300 L120 250 L140 200 L150 150 L160 100 Z"
                fill="url(#mapGradient)"
                stroke="#10b981"
                strokeWidth="2"
                filter="url(#shadow)"
              />
              
              {/* Department boundaries (simplified) */}
              <path d="M200 100 L280 120 L260 180 L200 160 Z" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3"/>
              <path d="M160 200 L250 180 L280 280 L200 300 L140 260 Z" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3"/>
              <path d="M180 320 L280 300 L300 400 L220 420 L150 380 Z" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3"/>
              
              {/* Ocean */}
              <path 
                d="M80 50 L180 50 L160 100 L150 150 L100 200 L70 180 L60 120 Z"
                fill="#bfdbfe"
                opacity="0.5"
              />
              
              {/* City markers with weather */}
              {COLOMBIA_REGIONS.map((region) => {
                const weather = regionWeather[region.id];
                const isSelected = selectedRegion === region.id;
                const isHovered = hoveredRegion === region.id;
                
                return (
                  <g key={region.id}>
                    {/* Pulse effect for selected */}
                    {isSelected && (
                      <motion.circle
                        cx={region.mapX}
                        cy={region.mapY}
                        r={25}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        initial={{ r: 15, opacity: 1 }}
                        animate={{ r: 35, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    
                    {/* Weather background circle */}
                    <motion.circle
                      cx={region.mapX}
                      cy={region.mapY}
                      r={isSelected ? 22 : isHovered ? 20 : 16}
                      className={`cursor-pointer transition-all duration-300`}
                      fill={weather?.weatherType === 'sunny' ? '#fef3c7' : weather?.weatherType === 'rainy' ? '#dbeafe' : '#f3f4f6'}
                      stroke={isSelected ? '#10b981' : '#fff'}
                      strokeWidth={isSelected ? 3 : 2}
                      onClick={() => setSelectedRegion(region.id)}
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      whileHover={{ scale: 1.2 }}
                      filter="url(#shadow)"
                    />
                    
                    {/* Weather icon */}
                    <foreignObject 
                      x={region.mapX - 10} 
                      y={region.mapY - 10} 
                      width="20" 
                      height="20"
                      className="pointer-events-none"
                    >
                      <div className="flex items-center justify-center w-full h-full">
                        {weather?.weatherType === 'sunny' && <Sun size={16} className="text-amber-500" />}
                        {weather?.weatherType === 'rainy' && <CloudRain size={16} className="text-blue-500" />}
                        {weather?.weatherType === 'cloudy' && <Cloud size={16} className="text-gray-400" />}
                      </div>
                    </foreignObject>
                    
                    {/* City label */}
                    <text 
                      x={region.mapX} 
                      y={region.mapY + 32} 
                      textAnchor="middle" 
                      className="text-[10px] fill-gray-700 font-semibold pointer-events-none"
                    >
                      {region.name.split(' ')[0]}
                    </text>
                    
                    {/* Temperature */}
                    <text 
                      x={region.mapX} 
                      y={region.mapY + 44} 
                      textAnchor="middle" 
                      className="text-[11px] fill-gray-900 font-bold pointer-events-none"
                    >
                      {weather?.temp || '--'}°C
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Info Panel - 2 columns */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-gray-100 p-4 space-y-4">
            {/* Selected City Weather */}
            <AnimatePresence mode="wait">
              {selectedWeather && selectedCity && (
                <motion.div
                  key={selectedRegion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-gradient-to-br ${getWeatherBg(selectedWeather.weatherType)} rounded-2xl p-5 text-white shadow-xl`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedCity.name}</h3>
                      <p className="text-white/80 text-sm">Clima actual</p>
                    </div>
                    <AnimatedWeatherIcon type={selectedWeather.weatherType} size={48} />
                  </div>
                  
                  <div className="text-5xl font-bold mb-4">{selectedWeather.temp}°C</div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/20 rounded-xl p-2 text-center">
                      <Droplets className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs opacity-80">Humedad</p>
                      <p className="font-bold">{selectedWeather.humidity}%</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-2 text-center">
                      <CloudRain className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs opacity-80">Prob. Lluvia</p>
                      <p className="font-bold">{selectedWeather.precipProb}%</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-2 text-center">
                      <Wind className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs opacity-80">Viento</p>
                      <p className="font-bold">{selectedWeather.windSpeed} km/h</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sales Impact Analysis */}
            {salesImpact && selectedRegion === 'bogota' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-4 shadow-lg border"
              >
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Impacto en Ventas - Bogotá
                </h4>
                
                {salesImpact.isRainy ? (
                  <div className="space-y-3">
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <div className="flex items-center gap-2 text-red-700 mb-1">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-semibold">Alerta de lluvia</span>
                      </div>
                      <p className="text-sm text-red-600">
                        Pérdida estimada: <strong>{formatCurrency(salesImpact.estimatedLoss)}</strong>
                      </p>
                      <p className="text-xs text-red-500 mt-1">~18% menos vs promedio</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Tip: Activa promociones de "día lluvioso" para mitigar el impacto
                    </p>
                  </div>
                ) : regionWeather['bogota']?.weatherType === 'sunny' ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">Clima favorable</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Ganancia esperada: <strong>+{formatCurrency(salesImpact.estimatedGain)}</strong>
                      </p>
                      <p className="text-xs text-green-500 mt-1">~12% más vs promedio</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      ☀️ Aprovecha el buen clima para promocionar productos premium
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3 border">
                    <p className="text-sm text-gray-600">
                      Clima neutral - Ventas esperadas dentro del promedio
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Weather Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resumen rápido</h4>
              <div className="grid grid-cols-3 gap-2">
                {['sunny', 'cloudy', 'rainy'].map(type => {
                  const count = Object.values(regionWeather).filter(w => w.weatherType === type).length;
                  return (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      className={`rounded-xl p-3 text-center ${
                        type === 'sunny' ? 'bg-amber-50 border-amber-200' :
                        type === 'rainy' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      } border`}
                    >
                      <AnimatedWeatherIcon type={type} size={24} />
                      <p className="text-lg font-bold text-gray-800 mt-1">{count}</p>
                      <p className="text-[10px] text-gray-500">ciudades</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}