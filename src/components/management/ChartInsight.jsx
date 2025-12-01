import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';

export default function ChartInsight({ data, type = 'sales', formatCurrency }) {
  const insight = useMemo(() => {
    if (!data || data.length < 2) return null;

    const values = data.map(d => d.sales || d.value || d.tickets || d.transactions || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    // Tendencia (comparar primera mitad con segunda mitad)
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    // Variabilidad
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = (stdDev / avg) * 100;

    // Días específicos
    const bestDay = data[maxIndex];
    const worstDay = data[minIndex];

    let trendIcon = Minus;
    let trendColor = 'text-gray-500';
    let trendText = 'estable';
    
    if (trendPercent > 5) {
      trendIcon = TrendingUp;
      trendColor = 'text-green-600';
      trendText = 'al alza';
    } else if (trendPercent < -5) {
      trendIcon = TrendingDown;
      trendColor = 'text-red-500';
      trendText = 'a la baja';
    }

    return {
      total,
      avg,
      max,
      min,
      trendPercent,
      trendIcon,
      trendColor,
      trendText,
      coeffOfVariation,
      bestDay,
      worstDay,
      isStable: coeffOfVariation < 20,
      isVolatile: coeffOfVariation > 40
    };
  }, [data]);

  if (!insight) return null;

  const TrendIcon = insight.trendIcon;

  const getTypeSpecificInsight = () => {
    switch (type) {
      case 'sales':
        return (
          <>
            <span className="font-bold">Ventas {insight.trendText}</span> con tendencia del{' '}
            <span className={`font-bold ${insight.trendColor}`}>
              {insight.trendPercent >= 0 ? '+' : ''}{insight.trendPercent.toFixed(1)}%
            </span>.{' '}
            Mejor día: <span className="font-bold text-green-600">{insight.bestDay?.fullDate || insight.bestDay?.date}</span> ({formatCurrency?.(insight.max) || insight.max}).{' '}
            {insight.isVolatile && 'Alta variabilidad entre días. '}
            {insight.isStable && 'Comportamiento consistente. '}
            Promedio diario: <span className="font-bold">{formatCurrency?.(insight.avg) || Math.round(insight.avg)}</span>.
          </>
        );
      
      case 'ticket':
        return (
          <>
            <span className="font-bold">Ticket promedio {insight.trendText}</span> ({insight.trendPercent >= 0 ? '+' : ''}{insight.trendPercent.toFixed(1)}%).{' '}
            Rango: {formatCurrency?.(insight.min)} - {formatCurrency?.(insight.max)}.{' '}
            {insight.isStable ? 'Los clientes mantienen un gasto similar cada día.' : 'Existe variación significativa en el ticket.'}
            {' '}Media: <span className="font-bold">{formatCurrency?.(insight.avg)}</span>.
          </>
        );
      
      case 'transactions':
        return (
          <>
            <span className="font-bold">Transacciones {insight.trendText}</span> ({insight.trendPercent >= 0 ? '+' : ''}{insight.trendPercent.toFixed(1)}%).{' '}
            Pico de <span className="font-bold text-green-600">{Math.round(insight.max)}</span> transacciones el {insight.bestDay?.fullDate || insight.bestDay?.date}.{' '}
            {insight.isVolatile ? 'El tráfico varía mucho entre días.' : 'Flujo de clientes relativamente constante.'}
            {' '}Promedio: <span className="font-bold">{Math.round(insight.avg)}</span> transacciones/día.
          </>
        );
      
      case 'distribution':
        return (
          <>
            <span className="font-bold">Distribución de ventas:</span>{' '}
            El ticket promedio representa el <span className="font-bold">{((insight.avg / insight.max) * 100).toFixed(0)}%</span> del mejor día.{' '}
            {insight.coeffOfVariation > 30 
              ? 'Hay días con rendimiento muy diferente, identifica qué los hace especiales.' 
              : 'El rendimiento es bastante uniforme entre días.'}
          </>
        );
      
      default:
        return (
          <>
            Tendencia {insight.trendText} ({insight.trendPercent >= 0 ? '+' : ''}{insight.trendPercent.toFixed(1)}%).
            Promedio: {formatCurrency?.(insight.avg) || Math.round(insight.avg)}.
          </>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-2.5 border border-amber-100"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {getTypeSpecificInsight()}
        </p>
        <TrendIcon className={`w-4 h-4 flex-shrink-0 ${insight.trendColor}`} />
      </div>
    </motion.div>
  );
}