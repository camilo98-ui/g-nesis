import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ChartInsight({ data, metric, formatCurrency, comparisonData = null }) {
  const insight = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        keyData: 'Sin datos disponibles',
        behavior: 'No hay información para analizar en el período seleccionado.',
        action: 'Verificar que existan registros de ventas para este período.',
        status: 'critical'
      };
    }

    // Filtrar datos válidos (mayores a 0)
    const validData = data.filter(d => {
      const value = d[metric] || d.ventas || d.sales || 0;
      return value > 0;
    });

    if (validData.length === 0) {
      return {
        keyData: 'No hay ventas registradas',
        behavior: 'Todos los días del período muestran cero ventas, lo que indica ausencia total de operación o falla en carga de datos.',
        action: 'URGENTE: Validar operación de la tienda y sistema de registro de ventas.',
        status: 'critical'
      };
    }

    // Calcular promedio y total
    const values = validData.map(d => d[metric] || d.ventas || d.sales || 0);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const total = values.reduce((a, b) => a + b, 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
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

    // Detectar tendencia general
    const firstThree = values.slice(0, Math.min(3, values.length));
    const lastThree = values.slice(-Math.min(3, values.length));
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

    // Determinar estado y mensaje - SIEMPRE mostrar datos útiles
    if (hasMissingRecent && missingDays > 0) {
      status = 'critical';
      keyData = `Total período: ${formatCurrency(total)} • Faltan ${missingDays} día${missingDays > 1 ? 's' : ''}`;
      behavior = `Promedio diario: ${formatCurrency(average)}. Se detecta ausencia de información en días recientes, lo que puede indicar falla en carga de datos.`;
      action = 'Validar operación y asegurar carga de datos diaria.';
    } else if (trendPct > 10) {
      status = 'positive';
      keyData = `Total: ${formatCurrency(total)} • Promedio: ${formatCurrency(average)}/día`;
      behavior = `Crecimiento del ${trendPct.toFixed(1)}% en últimos días. Mejor día: ${formatCurrency(maxValue)}. ${peaks.length > 0 ? `${peaks.length} día${peaks.length > 1 ? 's' : ''} excepcional${peaks.length > 1 ? 'es' : ''}.` : ''}`;
      action = 'Replicar estrategias exitosas del mejor día.';
    } else if (trendPct < -10) {
      status = 'warning';
      keyData = `Total: ${formatCurrency(total)} • Promedio: ${formatCurrency(average)}/día`;
      behavior = `Caída del ${Math.abs(trendPct).toFixed(1)}%. Mejor día: ${formatCurrency(maxValue)}, peor: ${formatCurrency(minValue)}. ${drops.length > 0 ? `${drops.length} día${drops.length > 1 ? 's' : ''} crítico${drops.length > 1 ? 's' : ''}.` : ''}`;
      action = 'Plan de reactivación urgente: analizar causas y corregir.';
    } else if (lastVsAvgPct > 15) {
      status = 'positive';
      keyData = `Total: ${formatCurrency(total)} • Promedio: ${formatCurrency(average)}/día`;
      behavior = `Último día excepcional: ${formatCurrency(lastValue)} (${lastVsAvgPct.toFixed(0)}% sobre promedio). Rango: ${formatCurrency(minValue)} - ${formatCurrency(maxValue)}.`;
      action = 'Documentar qué se hizo diferente ayer y replicarlo.';
    } else if (lastVsAvgPct < -15) {
      status = 'warning';
      keyData = `Total: ${formatCurrency(total)} • Promedio: ${formatCurrency(average)}/día`;
      behavior = `Último día bajo: ${formatCurrency(lastValue)} (${Math.abs(lastVsAvgPct).toFixed(0)}% bajo promedio). Máximo alcanzado: ${formatCurrency(maxValue)}.`;
      action = 'Revisar causas del bajo rendimiento de ayer y corregir hoy.';
    } else {
      status = 'neutral';
      keyData = `Total: ${formatCurrency(total)} • Promedio: ${formatCurrency(average)}/día`;
      behavior = `Desempeño estable. Rango: ${formatCurrency(minValue)} - ${formatCurrency(maxValue)}. ${peaks.length > 0 ? `${peaks.length} día${peaks.length > 1 ? 's' : ''} destacado${peaks.length > 1 ? 's' : ''}.` : ''} ${drops.length > 0 ? `${drops.length} día${drops.length > 1 ? 's' : ''} bajo.` : ''}`;
      action = 'Buscar incremento del 10-15% replicando mejores prácticas.';
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