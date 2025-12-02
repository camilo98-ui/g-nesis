import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CloudRain, Sun, Cloud, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Regiones principales de Colombia con coordenadas
const COLOMBIA_REGIONS = [
  { id: 'bogota', name: 'Bogotá', lat: 4.6097, lon: -74.0817, x: 48, y: 52 },
  { id: 'medellin', name: 'Medellín', lat: 6.2442, lon: -75.5812, x: 38, y: 38 },
  { id: 'cali', name: 'Cali', lat: 3.4516, lon: -76.5320, x: 32, y: 62 },
  { id: 'barranquilla', name: 'Barranquilla', lat: 10.9685, lon: -74.7813, x: 45, y: 12 },
  { id: 'cartagena', name: 'Cartagena', lat: 10.3910, lon: -75.4794, x: 38, y: 15 },
  { id: 'bucaramanga', name: 'Bucaramanga', lat: 7.1254, lon: -73.1198, x: 55, y: 32 },
  { id: 'tunja', name: 'Tunja', lat: 5.5353, lon: -73.3678, x: 55, y: 45 },
  { id: 'villavicencio', name: 'Villavicencio', lat: 4.1420, lon: -73.6266, x: 58, y: 55 },
];

const getWeatherType = (code, precipitation) => {
  if (precipitation > 5 || (code >= 51 && code <= 99)) return 'rainy';
  if (code <= 2 && precipitation < 1) return 'sunny';
  return 'cloudy';
};

const getWeatherEmoji = (type) => {
  switch(type) {
    case 'sunny': return '☀️';
    case 'rainy': return '🌧️';
    default: return '⛅';
  }
};

const getWeatherColor = (type) => {
  switch(type) {
    case 'sunny': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' };
    case 'rainy': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  }
};

export default function WeatherRegionMap({ dateRange, dailySales, formatCurrency }) {
  const [regionWeather, setRegionWeather] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Fetch weather for all regions
  const fetchRegionsWeather = async () => {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const results = {};
    
    try {
      await Promise.all(COLOMBIA_REGIONS.map(async (region) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,precipitation_probability,weather_code&timezone=America%2FBogota`
          );
          const data = await res.json();
          
          const weatherCode = data.current?.weather_code || 0;
          const precipitation = data.current?.precipitation_probability || 0;
          const weatherType = getWeatherType(weatherCode, precipitation > 50 ? 10 : 0);
          
          results[region.id] = {
            temp: Math.round(data.current?.temperature_2m || 0),
            weatherType,
            precipitation: precipitation
          };
        } catch (e) {
          results[region.id] = { temp: 18, weatherType: 'cloudy', precipitation: 0 };
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
  }, []);

  // Calcular impacto en ventas para Bogotá vs otras ciudades
  const salesImpactAnalysis = useMemo(() => {
    const validSales = dailySales.filter(s => s.total_sales > 0);
    if (!validSales.length) return null;
    
    const totalSales = validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const avgSales = totalSales / validSales.length;
    
    // Determinar si hubo lluvia en el período
    const bogotaWeather = regionWeather['bogota'];
    const wasRainy = bogotaWeather?.weatherType === 'rainy';
    
    // Buscar ciudades con mejor clima
    const betterWeatherCities = COLOMBIA_REGIONS.filter(r => 
      r.id !== 'bogota' && regionWeather[r.id]?.weatherType === 'sunny'
    );
    
    return {
      totalSales,
      avgSales,
      wasRainy,
      betterWeatherCities,
      potentialLoss: wasRainy ? avgSales * 0.2 : 0
    };
  }, [dailySales, regionWeather]);

  return (
    <Card className="bg-white shadow-lg border-0 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Mapa Climático de Colombia
          </CardTitle>
          <button 
            onClick={fetchRegionsWeather}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Clima actual por región - Haz clic en una ciudad para más detalles
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map Container */}
          <div className="relative bg-gradient-to-br from-emerald-50/50 to-sky-50/50 rounded-2xl p-4 min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-2xl">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            )}
            
            {/* Colombia Map SVG Simplified */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Colombia outline simplified */}
              <path 
                d="M30 5 L55 8 L65 15 L70 25 L68 35 L62 45 L58 55 L55 65 L48 75 L40 80 L30 78 L22 70 L18 58 L20 45 L25 30 L28 18 Z"
                fill="#e8f5e9"
                stroke="#4caf50"
                strokeWidth="0.5"
                opacity="0.6"
              />
              
              {/* Region markers */}
              {COLOMBIA_REGIONS.map((region) => {
                const weather = regionWeather[region.id];
                const colors = getWeatherColor(weather?.weatherType || 'cloudy');
                const isSelected = selectedRegion === region.id;
                
                return (
                  <g key={region.id} className="cursor-pointer">
                    <motion.circle
                      cx={region.x}
                      cy={region.y}
                      r={isSelected ? 6 : 4}
                      className={`${colors.bg} ${colors.border}`}
                      fill={weather?.weatherType === 'sunny' ? '#fbbf24' : weather?.weatherType === 'rainy' ? '#3b82f6' : '#9ca3af'}
                      stroke="#fff"
                      strokeWidth="1"
                      onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                      whileHover={{ scale: 1.3 }}
                      animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                      transition={isSelected ? { duration: 1, repeat: Infinity } : {}}
                    />
                    <text 
                      x={region.x} 
                      y={region.y - 7} 
                      textAnchor="middle" 
                      className="text-[4px] fill-gray-600 font-medium"
                    >
                      {region.name}
                    </text>
                    <text 
                      x={region.x} 
                      y={region.y + 10} 
                      textAnchor="middle" 
                      className="text-[5px] fill-gray-800 font-bold"
                    >
                      {weather?.temp || '--'}°
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg p-2 text-[10px] space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Soleado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Lluvioso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span>Nublado</span>
              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-4">
            {/* Selected Region Detail */}
            {selectedRegion && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">
                    {getWeatherEmoji(regionWeather[selectedRegion]?.weatherType || 'cloudy')}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {COLOMBIA_REGIONS.find(r => r.id === selectedRegion)?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {regionWeather[selectedRegion]?.temp || '--'}°C | 
                      Prob. lluvia: {regionWeather[selectedRegion]?.precipitation || 0}%
                    </p>
                  </div>
                </div>
                
                {selectedRegion === 'bogota' && salesImpactAnalysis && (
                  <div className="bg-white rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2">Impacto en ventas hoy:</p>
                    {salesImpactAnalysis.wasRainy ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-bold">
                          Posible pérdida: {formatCurrency(salesImpactAnalysis.potentialLoss)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">Clima favorable para ventas</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Weather Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              {COLOMBIA_REGIONS.slice(0, 6).map((region) => {
                const weather = regionWeather[region.id];
                const colors = getWeatherColor(weather?.weatherType || 'cloudy');
                
                return (
                  <motion.div
                    key={region.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    onClick={() => setSelectedRegion(region.id)}
                    className={`${colors.bg} rounded-xl p-3 cursor-pointer border ${colors.border} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium ${colors.text}`}>{region.name}</p>
                        <p className="text-lg font-bold text-gray-800">{weather?.temp || '--'}°C</p>
                      </div>
                      <span className="text-2xl">{getWeatherEmoji(weather?.weatherType)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bogotá vs Other Cities Comparison */}
            {salesImpactAnalysis && regionWeather['bogota'] && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-500" />
                  Análisis Comparativo
                </h4>
                
                {salesImpactAnalysis.wasRainy ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      🌧️ <strong>Bogotá está lloviendo</strong> mientras otras ciudades tienen mejor clima:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {salesImpactAnalysis.betterWeatherCities.length > 0 ? (
                        salesImpactAnalysis.betterWeatherCities.map(city => (
                          <span key={city.id} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            ☀️ {city.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Clima similar en todas las ciudades</span>
                      )}
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 mt-2">
                      <p className="text-xs text-red-700">
                        <strong>💰 Estimación:</strong> La lluvia podría reducir ventas entre 15-25% (~{formatCurrency(salesImpactAnalysis.potentialLoss)})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      ☀️ <strong>Buen clima en Bogotá</strong> - Condiciones favorables para las ventas
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}