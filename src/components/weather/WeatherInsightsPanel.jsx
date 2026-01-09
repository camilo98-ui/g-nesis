import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';

export default function WeatherInsightsPanel({ data, kpis, dateRange }) {
  const insights = useMemo(() => {
    if (data.length === 0) return [];

    const rainyDaysData = data.filter(d => d.precipitation > 1);
    const sunnyDaysData = data.filter(d => d.precipitation <= 1);

    const rainyAvgSales = rainyDaysData.length > 0 
      ? rainyDaysData.reduce((sum, d) => sum + d.sales, 0) / rainyDaysData.length 
      : 0;

    const sunnyAvgSales = sunnyDaysData.length > 0
      ? sunnyDaysData.reduce((sum, d) => sum + d.sales, 0) / sunnyDaysData.length
      : 0;

    const salesDifference = ((sunnyAvgSales - rainyAvgSales) / rainyAvgSales) * 100 || 0;

    // Find best and worst days
    const sortedByTemp = [...data].sort((a, b) => b.temperature - a.temperature);
    const hottest = sortedByTemp[0];
    const coldest = sortedByTemp[sortedByTemp.length - 1];

    const sortedBySales = [...data].sort((a, b) => b.sales - a.sales);
    const bestSalesDay = sortedBySales[0];
    const worstSalesDay = sortedBySales[sortedBySales.length - 1];

    return [
      {
        type: 'impact',
        title: 'Impacto de Lluvia',
        value: `${Math.abs(salesDifference).toFixed(1)}%`,
        description: rainyDaysData.length > 0 
          ? `Las ventas ${salesDifference > 0 ? 'disminuyen' : 'aumentan'} cuando llueve`
          : 'Sin datos de lluvia',
        icon: TrendingDown,
        color: 'text-red-400',
        gradient: 'from-red-500/10 to-pink-500/10'
      },
      {
        type: 'best',
        title: 'Mejor Día',
        value: `$${(bestSalesDay.sales / 1000000).toFixed(1)}M`,
        description: `${bestSalesDay.displayDate} - ${bestSalesDay.temperature.toFixed(0)}°C`,
        icon: Zap,
        color: 'text-emerald-400',
        gradient: 'from-emerald-500/10 to-green-500/10'
      },
      {
        type: 'worst',
        title: 'Peor Día',
        value: `$${(worstSalesDay.sales / 1000000).toFixed(1)}M`,
        description: `${worstSalesDay.displayDate} - ${worstSalesDay.temperature.toFixed(0)}°C`,
        icon: AlertCircle,
        color: 'text-amber-400',
        gradient: 'from-amber-500/10 to-orange-500/10'
      },
      {
        type: 'recommendation',
        title: 'Recomendación',
        value: 'Optimizar',
        description: `Aumentar inventario en días soleados (+${salesDifference.toFixed(0)}%)`,
        icon: Lightbulb,
        color: 'text-blue-400',
        gradient: 'from-blue-500/10 to-cyan-500/10'
      }
    ];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-black text-white mb-6">Insights Clave</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -2 }}
              className={`group relative bg-gradient-to-br ${insight.gradient} backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-default`}
            >
              {/* Glow background */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {insight.title}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${insight.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`text-2xl font-black ${insight.color} mb-2`}
                >
                  {insight.value}
                </motion.p>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
                  style={{ animation: 'shimmer 3s infinite' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-center"
      >
        <p className="text-xs text-slate-400">
          Basado en análisis de {data.length} días de datos históricos
        </p>
      </motion.div>
    </motion.div>
  );
}