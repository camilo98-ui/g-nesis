import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Cloud, TrendingUp, TrendingDown, Lightbulb, IceCream } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

// Mapear código de clima a tipo
const getWeatherType = (code) => {
  if (code === 0 || (code >= 1 && code <= 2)) return 'warm'; // Soleado/parcial
  if (code >= 51 && code <= 99) return 'rainy'; // Lluvia
  return 'cloudy'; // Nublado
};

export default function WeatherInsightsCards({ weatherData, dailySales = [] }) {
  const insights = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) {
      return {
        warm: { impact: 0, days: 0, avgSales: 0 },
        rainy: { impact: 0, days: 0, avgSales: 0 },
        cloudy: { impact: 0, days: 0, avgSales: 0 }
      };
    }
    
    // Crear mapa de ventas por fecha
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    // Agrupar por tipo de clima
    const grouped = { warm: [], rainy: [], cloudy: [] };
    
    weatherData.history.time.forEach((date, idx) => {
      const code = weatherData.history.weathercode?.[idx];
      const type = getWeatherType(code);
      const sales = salesByDate[date];
      if (sales) {
        grouped[type].push(sales);
      }
    });
    
    // Calcular promedios y comparar con general
    const allSales = Object.values(grouped).flat();
    const overallAvg = allSales.length ? allSales.reduce((a, b) => a + b, 0) / allSales.length : 0;
    
    const calculate = (arr) => {
      if (!arr.length) return { impact: 0, days: 0, avgSales: 0 };
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const impact = overallAvg ? ((avg - overallAvg) / overallAvg) * 100 : 0;
      return { impact: Math.round(impact), days: arr.length, avgSales: avg };
    };
    
    return {
      warm: calculate(grouped.warm),
      rainy: calculate(grouped.rainy),
      cloudy: calculate(grouped.cloudy)
    };
  }, [weatherData, dailySales]);

  const cards = [
    {
      type: 'warm',
      title: 'Días Cálidos',
      subtitle: 'Soleados y parcialmente nublados',
      icon: Sun,
      color: 'amber',
      gradient: 'from-amber-50 to-yellow-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      recommendations: [
        '🍦 Aumenta exhibición de conos y vasos',
        '🥤 Promociona malteadas y bebidas frías',
        '👥 Refuerza personal en horas pico (12-3pm)'
      ]
    },
    {
      type: 'rainy',
      title: 'Días Lluviosos',
      subtitle: 'Con precipitaciones',
      icon: CloudRain,
      color: 'blue',
      gradient: 'from-blue-50 to-indigo-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      recommendations: [
        '🏠 Activa promociones de domicilios',
        '☕ Destaca productos calientes',
        '📱 Impulsa pedidos por app/web'
      ]
    },
    {
      type: 'cloudy',
      title: 'Días Templados',
      subtitle: 'Nublados sin lluvia',
      icon: Cloud,
      color: 'slate',
      gradient: 'from-slate-50 to-gray-100',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      recommendations: [
        '🎂 Promociona tortas y especialidades',
        '👨‍👩‍👧‍👦 Enfócate en familias',
        '🍨 Ofrece combos de sundaes'
      ]
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const data = insights[card.type];
        const isPositive = data.impact >= 0;
        
        return (
          <motion.div
            key={card.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className={`bg-gradient-to-br ${card.gradient} border-0 shadow-lg h-full overflow-hidden relative`}>
              {/* Decorative icon */}
              <div className="absolute top-0 right-0 opacity-10">
                <Icon className="w-24 h-24 -mt-6 -mr-6" />
              </div>
              
              <CardContent className="p-5 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                        <motion.div
                          animate={{ rotate: card.type === 'warm' ? [0, 10, -10, 0] : 0 }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Icon className={`w-5 h-5 ${card.iconColor}`} />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{card.title}</h3>
                        <p className="text-[10px] text-gray-500">{card.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Impact Badge */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-sm font-bold">{isPositive ? '+' : ''}{data.impact}%</span>
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{data.days}</p>
                    <p className="text-[10px] text-gray-500">días registrados</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">
                      ${(data.avgSales / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-[10px] text-gray-500">venta promedio</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white/70 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Recomendaciones</p>
                  </div>
                  <ul className="space-y-1.5">
                    {card.recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + i * 0.05 }}
                        className="text-xs text-gray-700 leading-relaxed"
                      >
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}