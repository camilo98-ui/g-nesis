import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, TrendingUp, AlertCircle, Lightbulb, Target } from 'lucide-react';

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
        bgColor: 'from-red-500/10 to-red-600/5',
        iconBg: 'bg-red-500/20',
        metric: `${rainyDaysData.length} días lluviosos`
      },
      {
        type: 'best',
        title: 'Mejor Día',
        value: `$${(bestSalesDay.sales / 1000000).toFixed(2)}M`,
        description: bestSalesDay.displayDate,
        icon: Zap,
        color: 'text-emerald-400',
        bgColor: 'from-emerald-500/10 to-green-600/5',
        iconBg: 'bg-emerald-500/20',
        metric: `+${((bestSalesDay.sales / (data.reduce((s, d) => s + d.sales, 0) / data.length)) * 100 - 100).toFixed(1)}% vs promedio`,
        temp: `${bestSalesDay.temperature.toFixed(0)}°C`
      },
      {
        type: 'worst',
        title: 'Peor Día',
        value: `$${(worstSalesDay.sales / 1000000).toFixed(2)}M`,
        description: worstSalesDay.displayDate,
        icon: AlertCircle,
        color: 'text-amber-400',
        bgColor: 'from-amber-500/10 to-orange-600/5',
        iconBg: 'bg-amber-500/20',
        metric: `${((worstSalesDay.sales / (data.reduce((s, d) => s + d.sales, 0) / data.length)) * 100 - 100).toFixed(1)}% vs promedio`,
        temp: `${worstSalesDay.temperature.toFixed(0)}°C`
      },
      {
        type: 'recommendation',
        title: 'Recomendación',
        value: 'Optimizar',
        description: `Aumentar inventario en días soleados`,
        icon: Lightbulb,
        color: 'text-blue-400',
        bgColor: 'from-blue-500/10 to-cyan-600/5',
        iconBg: 'bg-blue-500/20',
        metric: `+${Math.abs(salesDifference).toFixed(0)}% potencial`
      }
    ];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-400" />
        Insights Clave
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className={`group relative rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-xl overflow-hidden`}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`
              }}
            >
              {/* Gradient Border Glow */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-gradient-to-br ${insight.bgColor}`} />

              {/* Animated Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.1), transparent 50%)`
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {insight.title}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${insight.color} ${insight.iconBg}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
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

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {insight.description}
                </p>

                {/* Metric Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${insight.iconBg} ${insight.color}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  {insight.metric}
                </motion.div>

                {insight.temp && (
                  <div className="mt-2 text-xs text-slate-500">
                    Temperatura: {insight.temp}
                  </div>
                )}
              </div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10"
                  style={{ animation: 'shimmer 3s infinite' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl text-center"
      >
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-300">Análisis de {data.length} días</span> basado en datos históricos de clima y ventas
        </p>
      </motion.div>
    </motion.div>
  );
}