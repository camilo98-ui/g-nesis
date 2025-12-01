import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Simulated weather data (in production, this would come from a weather API)
const generateWeatherData = (salesData) => {
  const weatherTypes = ['sunny', 'cloudy', 'rainy', 'hot'];
  
  return salesData.map((day, i) => {
    const weather = weatherTypes[i % 4];
    const baseImpact = weather === 'sunny' ? 15 : weather === 'hot' ? 20 : weather === 'rainy' ? -20 : -5;
    const randomVariation = (Math.random() - 0.5) * 10;
    
    return {
      ...day,
      weather,
      weatherImpact: baseImpact + randomVariation,
      temperature: weather === 'hot' ? 32 : weather === 'sunny' ? 28 : weather === 'rainy' ? 18 : 22,
    };
  });
};

const WeatherIcon = ({ type, size = 16 }) => {
  const iconClass = `w-${size/4} h-${size/4}`;
  switch(type) {
    case 'sunny': return <Sun className={iconClass} style={{color: '#fbbf24'}} />;
    case 'rainy': return <CloudRain className={iconClass} style={{color: '#60a5fa'}} />;
    case 'hot': return <Thermometer className={iconClass} style={{color: '#ef4444'}} />;
    default: return <Cloud className={iconClass} style={{color: '#9ca3af'}} />;
  }
};

export default function WeatherImpactChart({ dailyTrend = [], formatCurrency }) {
  const weatherData = useMemo(() => generateWeatherData(dailyTrend), [dailyTrend]);

  const weatherStats = useMemo(() => {
    const grouped = { sunny: [], rainy: [], cloudy: [], hot: [] };
    weatherData.forEach(d => {
      if (grouped[d.weather]) grouped[d.weather].push(d.sales || 0);
    });
    
    return Object.entries(grouped).map(([type, sales]) => ({
      type,
      avgSales: sales.length ? sales.reduce((a, b) => a + b, 0) / sales.length : 0,
      count: sales.length
    }));
  }, [weatherData]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Cloud className="w-4 h-4 text-sky-500" />
          </motion.div>
          Impacto del Clima en Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {weatherStats.map((stat) => (
            <motion.div
              key={stat.type}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 text-center"
            >
              <WeatherIcon type={stat.type} size={20} />
              <p className="text-xs text-gray-500 mt-1 capitalize">{stat.type === 'sunny' ? 'Soleado' : stat.type === 'rainy' ? 'Lluvioso' : stat.type === 'hot' ? 'Caluroso' : 'Nublado'}</p>
              <p className="text-sm font-bold text-gray-700">
                {stat.avgSales > 0 ? `+${((stat.avgSales / 1000000) * 100).toFixed(0)}%` : '0%'}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <YAxis yAxisId="right" orientation="right" domain={[-30, 30]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <WeatherIcon type={data.weather} size={12} />
                        <span className="capitalize">{data.weather}</span>
                        <span className="text-gray-400">| {data.temperature}°C</span>
                      </div>
                      <p className="font-bold">Ventas: {formatCurrency?.(data.sales) || data.sales}</p>
                      <p className={data.weatherImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Impacto: {data.weatherImpact >= 0 ? '+' : ''}{data.weatherImpact.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
              <Bar yAxisId="left" dataKey="sales" fill="#a5b4fc" radius={[4, 4, 0, 0]} name="Ventas" />
              <Line yAxisId="right" type="monotone" dataKey="weatherImpact" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="Impacto %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-gray-400 mt-2 bg-sky-50 p-2 rounded-lg">
          💡 Los días soleados y calurosos aumentan las ventas de helados en promedio un 15-20%
        </p>
      </CardContent>
    </Card>
  );
}