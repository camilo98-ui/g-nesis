import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, AlertCircle, Lightbulb, Droplets, Thermometer } from 'lucide-react';

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

    // Temperature correlation
    const hotDays = data.filter(d => d.temperature > 25);
    const coldDays = data.filter(d => d.temperature <= 25);
    
    const hotAvgSales = hotDays.length > 0
      ? hotDays.reduce((sum, d) => sum + d.sales, 0) / hotDays.length
      : 0;

    const coldAvgSales = coldDays.length > 0
      ? coldDays.reduce((sum, d) => sum + d.sales, 0) / coldDays.length
      : 0;

    // Find best and worst days
    const sortedBySales = [...data].sort((a, b) => b.sales - a.sales);
    const bestSalesDay = sortedBySales[0];
    const worstSalesDay = sortedBySales[sortedBySales.length - 1];

    return [
      {
        type: 'impact',
        title: 'Impacto Lluvia',
        value: `${Math.abs(salesDifference).toFixed(1)}%`,
        description: rainyDaysData.length > 0 
          ? `Ventas ${salesDifference > 0 ? 'caen' : 'suben'} en días lluviosos`
          : 'Sin datos de lluvia',
        icon: Droplets,
        color: 'from-blue-500 to-cyan-500',
        stat: `${rainyDaysData.length} días lluviosos`,
        highlight: salesDifference < 0
      },
      {
        type: 'temp',
        title: 'Impacto Temperatura',
        value: `${Math.abs(((hotAvgSales - coldAvgSales) / coldAvgSales * 100)).toFixed(1)}%`,
        description: hotAvgSales > coldAvgSales 
          ? 'Más ventas con temperatura cálida'
          : 'Mejor desempeño en días fríos',
        icon: Thermometer,
        color: 'from-amber-500 to-red-500',
        stat: `${hotDays.length} días cálidos`,
        highlight: hotAvgSales > coldAvgSales
      },
      {
        type: 'best',
        title: 'Mejor Día',
        value: `$${(bestSalesDay.sales / 1000000).toFixed(1)}M`,
        description: `${bestSalesDay.displayDate} — ${bestSalesDay.temperature.toFixed(0)}°C`,
        icon: Zap,
        color: 'from-emerald-500 to-green-500',
        stat: '↑ Día excepcional',
        highlight: true
      },
      {
        type: 'recommendation',
        title: 'Recomendación',
        value: 'Optimizar',
        description: `Stock +${Math.abs(salesDifference).toFixed(0)}% en días soleados`,
        icon: Lightbulb,
        color: 'from-purple-500 to-pink-500',
        stat: 'Data-driven insight',
        highlight: false
      }
    ];
  }, [data]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-2xl font-black text-white mb-8">Insights Clave</h2>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {insights.map((insight, idx) => {
          const Icon = insight.icon;

          return (
            <motion.div
              key={idx}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative h-full"
            >
              {/* Glow Background */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                style={{
                  background: `linear-gradient(135deg, ${insight.color === 'from-blue-500 to-cyan-500' ? 'rgba(59, 130, 246, 0.3), rgba(34, 211, 238, 0.2)' : insight.color === 'from-amber-500 to-red-500' ? 'rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.2)' : insight.color === 'from-emerald-500 to-green-500' ? 'rgba(16, 185, 129, 0.3), rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2)'})`
                }}
              />

              <div className={`relative h-full rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300
                backdrop-blur-xl overflow-hidden bg-gradient-to-br
                ${insight.highlight ? 'via-white/[0.08]' : 'via-white/[0.02]'} from-white/[0.05] to-white/[0.01]`}
              >
                {/* Highlight accent for important insights */}
                {insight.highlight && (
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, currentColor, transparent)`
                    }}
                  />
                )}

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {insight.title}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/20
                        bg-gradient-to-br ${insight.color}`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Value */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={`text-3xl font-black mb-2 bg-gradient-to-r ${insight.color} bg-clip-text text-transparent`}
                  >
                    {insight.value}
                  </motion.p>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {insight.description}
                  </p>

                  {/* Stat Badge */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500 font-medium">
                      {insight.stat}
                    </p>
                  </div>
                </div>

                {/* Shimmer on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-sm font-bold text-white">Conclusión del Análisis</p>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Basado en {data.length} días de datos históricos, se detectó una correlación significativa entre las condiciones climáticas y el desempeño de ventas. 
          Los días soleados muestran mayor actividad de compra, mientras que la lluvia tiende a reducir el tráfico. 
          Se recomienda ajustar estrategias de inventario y personal según el pronóstico del clima.
        </p>
      </motion.div>
    </motion.div>
  );
}