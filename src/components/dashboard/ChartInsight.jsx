import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ChartInsight({ data, metric, formatCurrency, comparisonData = null }) {
  const insight = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filtrar datos válidos (mayores a 0)
    const validData = data.filter(d => {
      const value = d[metric] || d.ventas || d.sales || 0;
      return value > 0;
    });

    if (validData.length === 0) return null;

    // Calcular promedio
    const values = validData.map(d => d[metric] || d.ventas || d.sales || 0);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Último valor
    const lastValue = values[values.length - 1];
    const lastVsPrev = values.length > 1 ? lastValue - values[values.length - 2] : 0;
    const lastVsAvg = lastValue - average;
    const lastVsAvgPct = average > 0 ? (lastVsAvg / average * 100) : 0;

    // Detectar picos (valores > 115% del promedio)
    const peaks = validData.filter((d, i) => {
      const value = d[metric] || d.ventas || d.sales || 0;
      return value > average * 1.15;
    });

    // Detectar caídas (valores < 70% del promedio)
    const drops = validData.filter((d, i) => {
      const value = d[metric] || d.ventas || d.sales || 0;
      return value < average * 0.7 && value > 0;
    });

    // Detectar tendencia general (últimos 3 días vs primeros 3 días)
    const firstThree = values.slice(0, 3);
    const lastThree = values.slice(-3);
    const firstAvg = firstThree.reduce((a, b) => a + b, 0) / firstThree.length;
    const lastAvg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
    const trendPct = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg * 100) : 0;

    // Detectar si hay días sin datos al final
    const allDataPoints = data.length;
    const validDataPoints = validData.length;
    const missingDays = allDataPoints - validDataPoints;
    const hasMissingRecent = data[data.length - 1]?.[metric] === 0 || !data[data.length - 1]?.[metric];

    // Generar el insight
    let keyData = '';
    let behavior = '';
    let action = '';
    let status = 'neutral'; // neutral, positive, warning, critical

    // Determinar estado y mensaje
    if (hasMissingRecent && missingDays > 0) {
      status = 'critical';
      keyData = `Faltan datos de ${missingDays} día${missingDays > 1 ? 's' : ''}`;
      behavior = 'Se detecta ausencia de información en días recientes, lo que impide análisis completo y puede indicar falla en carga de datos o cierre operativo.';
      action = 'Validar operación inmediatamente y asegurar carga de datos diaria.';
    } else if (trendPct > 10) {
      status = 'positive';
      keyData = `Promedio del período: ${formatCurrency(average)}`;
      behavior = `Tendencia creciente del ${trendPct.toFixed(1)}% en los últimos días. ${peaks.length > 0 ? `Detectados ${peaks.length} pico${peaks.length > 1 ? 's' : ''} por encima del promedio.` : ''}`;
      action = 'Documentar qué estrategias generaron el crecimiento y replicarlas consistentemente.';
    } else if (trendPct < -10) {
      status = 'warning';
      keyData = `Promedio del período: ${formatCurrency(average)}`;
      behavior = `Tendencia a la baja del ${Math.abs(trendPct).toFixed(1)}%. ${drops.length > 0 ? `${drops.length} día${drops.length > 1 ? 's' : ''} con caídas significativas detectadas.` : ''}`;
      action = 'Analizar causas de la caída y activar plan de reactivación urgente.';
    } else if (lastVsAvgPct > 15) {
      status = 'positive';
      keyData = `Promedio del período: ${formatCurrency(average)}`;
      behavior = `El último día registró ${formatCurrency(lastValue)}, superando el promedio en ${lastVsAvgPct.toFixed(0)}%. Desempeño destacado.`;
      action = 'Identificar factores de éxito del día para replicarlos.';
    } else if (lastVsAvgPct < -15) {
      status = 'warning';
      keyData = `Promedio del período: ${formatCurrency(average)}`;
      behavior = `El último día está ${Math.abs(lastVsAvgPct).toFixed(0)}% por debajo del promedio (${formatCurrency(lastValue)} vs ${formatCurrency(average)}).`;
      action = 'Revisar operación del día, identificar problemas y corregir para mañana.';
    } else {
      status = 'neutral';
      keyData = `Promedio del período: ${formatCurrency(average)}`;
      behavior = `Comportamiento estable. ${peaks.length > 0 ? `${peaks.length} día${peaks.length > 1 ? 's' : ''} destacado${peaks.length > 1 ? 's' : ''}.` : 'Sin variaciones significativas.'} ${drops.length > 0 ? `${drops.length} día${drops.length > 1 ? 's' : ''} con bajo rendimiento.` : ''}`;
      action = 'Mantener consistencia y buscar oportunidades de mejora incremental.';
    }

    return {
      keyData,
      behavior,
      action,
      status,
      average,
      lastValue,
      trendPct
    };
  }, [data, metric, formatCurrency, comparisonData]);

  if (!insight) return null;

  const statusConfig = {
    positive: {
      icon: CheckCircle2,
      bgColor: 'from-emerald-50/60 to-green-50/40',
      borderColor: 'border-emerald-200/50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-800'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'from-amber-50/60 to-orange-50/40',
      borderColor: 'border-amber-200/50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-800'
    },
    critical: {
      icon: AlertTriangle,
      bgColor: 'from-red-50/60 to-rose-50/40',
      borderColor: 'border-red-200/50',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    },
    neutral: {
      icon: Lightbulb,
      bgColor: 'from-slate-50/60 to-gray-50/40',
      borderColor: 'border-slate-200/50',
      iconColor: 'text-slate-600',
      textColor: 'text-slate-800'
    }
  };

  const config = statusConfig[insight.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`mt-3 bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-xl px-4 py-3 shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/50 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${config.textColor} mb-1 flex items-center gap-1.5`}>
            <span>📊</span> Insight Operativo
          </p>
          <div className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
            <p className="font-semibold">{insight.keyData}</p>
            <p>{insight.behavior}</p>
            <p className="font-medium text-gray-900 pt-1 border-t border-gray-200/50">
              ⚡ Acción: {insight.action}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}