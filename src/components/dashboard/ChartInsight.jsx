import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ChartInsight({ data, metric, formatCurrency, comparisonData = null }) {
  // Siempre formatear como pesos COP colombianos completos
  const fmt = (val) => {
    if (!val && val !== 0) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));
  };

  const insight = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        keyData: 'Sin datos disponibles',
        behavior: 'No hay información para analizar en el período seleccionado.',
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
        behavior: 'Todos los días del período muestran $0 en ventas.',
        status: 'critical'
      };
    }

    // Calcular métricas detalladas
    const values = validData.map(d => d[metric] || d.ventas || d.sales || 0);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const total = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxDay = validData.find(d => (d[metric] || d.ventas || d.sales) === max);
    const minDay = validData.find(d => (d[metric] || d.ventas || d.sales) === min);
    
    // Desviación estándar
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / average * 100);

    // Último valor
    const lastValue = values[values.length - 1];
    const lastDay = validData[validData.length - 1];
    const lastVsPrev = values.length > 1 ? lastValue - values[values.length - 2] : 0;
    const lastVsAvg = lastValue - average;
    const lastVsAvgPct = average > 0 ? (lastVsAvg / average * 100) : 0;

    // Identificar días problemáticos (bajo rendimiento < 85% del promedio)
    const underperformingDays = validData
      .map((d, i) => {
        const value = d[metric] || d.ventas || d.sales || 0;
        const pct = average > 0 ? (value / average * 100) : 0;
        return { ...d, value, pct, index: i };
      })
      .filter(d => d.pct < 85)
      .sort((a, b) => a.value - b.value);

    // Identificar días top (> 115% del promedio)
    const topDays = validData
      .map((d, i) => {
        const value = d[metric] || d.ventas || d.sales || 0;
        const pct = average > 0 ? (value / average * 100) : 0;
        return { ...d, value, pct, index: i };
      })
      .filter(d => d.pct > 115)
      .sort((a, b) => b.value - a.value);

    // Detectar tendencia (últimos 40% vs primeros 40%)
    const splitPoint = Math.floor(values.length * 0.4);
    const firstSegment = values.slice(0, splitPoint);
    const lastSegment = values.slice(-splitPoint);
    const firstAvg = firstSegment.reduce((a, b) => a + b, 0) / firstSegment.length;
    const lastAvg = lastSegment.reduce((a, b) => a + b, 0) / lastSegment.length;
    const trendPct = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg * 100) : 0;
    const trendDiff = lastAvg - firstAvg;

    // Calcular pérdida por días bajos
    const lostRevenue = underperformingDays.reduce((sum, d) => sum + (average - d.value), 0);

    // Generar el insight numérico profundo
    let keyData = '';
    let behavior = '';
    let status = 'neutral';

    const allDataPoints = data.length;
    const validDataPoints = validData.length;
    const missingPct = allDataPoints > 0 ? ((allDataPoints - validDataPoints) / allDataPoints * 100) : 0;

    if (missingPct > 50) {
      status = 'warning';
      keyData = `${validDataPoints}/${allDataPoints} días registrados (${(100-missingPct).toFixed(0)}% de cobertura)`;
      behavior = `Promedio: ${fmt(average)} • Total: ${fmt(total)} • Rango: ${fmt(min)} - ${fmt(max)} (amplitud: ${fmt(max - min)})`;
    } else if (trendPct > 10) {
      status = 'positive';
      keyData = `Crecimiento: +${trendPct.toFixed(1)}% (${fmt(trendDiff)} adicionales)`;
      behavior = `Promedio período: ${fmt(average)} • Total: ${fmt(total)} • Último día: ${fmt(lastValue)} (${lastVsAvgPct > 0 ? '+' : ''}${lastVsAvgPct.toFixed(1)}% vs promedio) • ${topDays.length} días destacados generaron ${fmt(topDays.reduce((s, d) => s + d.value, 0))} (${(topDays.reduce((s, d) => s + d.value, 0) / total * 100).toFixed(0)}% del total)`;
    } else if (trendPct < -10) {
      status = 'warning';
      keyData = `Caída: ${trendPct.toFixed(1)}% (${fmt(Math.abs(trendDiff))} menos)`;
      const worstDaysInfo = underperformingDays.slice(0, 3)
        .map(d => `${d.fullDate || d.date || `día ${d.index+1}`}: ${fmt(d.value)} (${(d.pct).toFixed(0)}%)`)
        .join(' • ');
      behavior = `Promedio: ${fmt(average)} vs máximo: ${fmt(max)} • ${underperformingDays.length} días bajo rendimiento (< 85%) generaron pérdida estimada de ${fmt(lostRevenue)} • Peores días: ${worstDaysInfo || 'N/A'} • Variabilidad: ${coefficientOfVariation.toFixed(0)}% CV`;
    } else if (Math.abs(lastVsAvgPct) > 15) {
      status = lastVsAvgPct > 0 ? 'positive' : 'warning';
      keyData = `Último día: ${fmt(lastValue)} (${lastVsAvgPct > 0 ? '+' : ''}${lastVsAvgPct.toFixed(1)}% vs promedio)`;
      behavior = `Promedio período: ${fmt(average)} • Total acumulado: ${fmt(total)} • Día máximo: ${fmt(max)} (${maxDay?.fullDate || maxDay?.date || 'N/A'}) • Día mínimo: ${fmt(min)} (${minDay?.fullDate || minDay?.date || 'N/A'}) • Variación estándar: ±${fmt(stdDev)}`;
    } else {
      status = 'neutral';
      keyData = `Promedio: ${fmt(average)} • Desviación: ±${fmt(stdDev)} (${coefficientOfVariation.toFixed(0)}% CV)`;
      const performanceDetails = underperformingDays.length > 0 
        ? `${underperformingDays.length} días débiles dejaron de generar ${fmt(lostRevenue)} • ` 
        : '';
      behavior = `Total período: ${fmt(total)} en ${validDataPoints} días • Rango: ${fmt(min)} - ${fmt(max)} • ${performanceDetails}Último registro: ${fmt(lastValue)} (${lastDay?.fullDate || lastDay?.date || 'N/A'})`;
    }

    return {
      keyData,
      behavior,
      status,
      average,
      lastValue,
      trendPct,
      underperformingDays,
      topDays
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
            <p className="font-bold text-gray-900">{insight.keyData}</p>
            <p className="text-[11px] leading-snug">{insight.behavior}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}