/**
 * computeInsight.js
 * Shared insight-generation logic used by both ChartInsight (DetailPanel sections)
 * and NovaInsightStrip (live messages).
 *
 * buildChartData(dailySales) → array of per-day objects with keys:
 *   { date, fullDate, ventas, tickets, ticketPromedio, transactions, suggested }
 *
 * computeInsight(data, metric) → { keyData, behavior, status }
 *   metric is one of: 'ventas' | 'ticketPromedio' | 'transactions' | 'suggested'
 */

export function buildChartData(dailySales = []) {
  if (!dailySales || dailySales.length === 0) return [];
  const sorted = [...dailySales].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted.map((dayData, idx) => {
    const day = dayData.date ? new Date(dayData.date) : new Date();
    const transactions = dayData.total_transactions || 0;
    const sales = dayData.total_sales || 0;
    return {
      date: day.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      fullDate: day.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }),
      ventas: sales,
      tickets: dayData.total_tickets || 0,
      ticketPromedio: transactions > 0 ? sales / transactions : 0,
      transactions,
      suggested: dayData.total_suggested || 0,
      index: idx,
    };
  });
}

export function computeInsight(data = [], metric = 'ventas') {
  if (!data || data.length === 0) {
    return {
      keyData: 'Sin datos disponibles',
      behavior: 'No hay información para analizar en el período seleccionado.',
      status: 'critical',
    };
  }

  const isCurrency = !['transactions', 'suggested', 'tickets'].includes(metric);
  const fmt = (val) => {
    if (!val && val !== 0) return isCurrency ? '$0' : '0';
    if (isCurrency) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(Math.round(val));
    }
    return Math.round(val).toLocaleString('es-CO') + ' tcs';
  };

  const validData = data.filter((d) => {
    const value = d[metric] || d.ventas || d.sales || 0;
    return value > 0;
  });

  if (validData.length === 0) {
    return {
      keyData: 'No hay ventas registradas',
      behavior: 'Todos los días del período muestran $0 en ventas.',
      status: 'critical',
    };
  }

  const values = validData.map((d) => d[metric] || d.ventas || d.sales || 0);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxDay = validData.find((d) => (d[metric] || d.ventas || d.sales) === max);
  const minDay = validData.find((d) => (d[metric] || d.ventas || d.sales) === min);

  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = average > 0 ? (stdDev / average * 100) : 0;

  const lastValue = values[values.length - 1];
  const lastDay = validData[validData.length - 1];
  const lastVsAvg = lastValue - average;
  const lastVsAvgPct = average > 0 ? (lastVsAvg / average * 100) : 0;

  const underperformingDays = validData
    .map((d, i) => {
      const value = d[metric] || d.ventas || d.sales || 0;
      const pct = average > 0 ? (value / average * 100) : 0;
      return { ...d, value, pct, index: i };
    })
    .filter((d) => d.pct < 85)
    .sort((a, b) => a.value - b.value);

  const topDays = validData
    .map((d, i) => {
      const value = d[metric] || d.ventas || d.sales || 0;
      const pct = average > 0 ? (value / average * 100) : 0;
      return { ...d, value, pct, index: i };
    })
    .filter((d) => d.pct > 115)
    .sort((a, b) => b.value - a.value);

  const splitPoint = Math.floor(values.length * 0.4);
  const firstSegment = values.slice(0, splitPoint);
  const lastSegment = values.slice(-splitPoint);
  const firstAvg = firstSegment.length > 0 ? firstSegment.reduce((a, b) => a + b, 0) / firstSegment.length : 0;
  const lastAvg = lastSegment.length > 0 ? lastSegment.reduce((a, b) => a + b, 0) / lastSegment.length : 0;
  const trendPct = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg * 100) : 0;
  const trendDiff = lastAvg - firstAvg;

  const lostRevenue = underperformingDays.reduce((sum, d) => sum + (average - d.value), 0);

  let keyData = '';
  let behavior = '';
  let status = 'neutral';

  const allDataPoints = data.length;
  const validDataPoints = validData.length;
  const missingPct = allDataPoints > 0 ? ((allDataPoints - validDataPoints) / allDataPoints * 100) : 0;

  if (missingPct > 50) {
    status = 'warning';
    keyData = `${validDataPoints}/${allDataPoints} días registrados (${(100 - missingPct).toFixed(0)}% de cobertura)`;
    behavior = `Promedio: ${fmt(average)} • Total: ${fmt(total)} • Rango: ${fmt(min)} - ${fmt(max)} (amplitud: ${fmt(max - min)})`;
  } else if (trendPct > 10) {
    status = 'positive';
    keyData = `Crecimiento: +${trendPct.toFixed(1)}% (${fmt(trendDiff)} adicionales)`;
    const topTotal = topDays.reduce((s, d) => s + d.value, 0);
    behavior = `Promedio período: ${fmt(average)} • Total: ${fmt(total)} • Último día: ${fmt(lastValue)} (${lastVsAvgPct > 0 ? '+' : ''}${lastVsAvgPct.toFixed(1)}% vs promedio) • ${topDays.length} días destacados generaron ${fmt(topTotal)} (${total > 0 ? (topTotal / total * 100).toFixed(0) : 0}% del total)`;
  } else if (trendPct < -10) {
    status = 'warning';
    keyData = `Caída: ${trendPct.toFixed(1)}% (${fmt(Math.abs(trendDiff))} menos)`;
    const worstDaysInfo = underperformingDays.slice(0, 3)
      .map((d) => `${d.fullDate || d.date || `día ${d.index + 1}`}: ${fmt(d.value)} (${(d.pct).toFixed(0)}%)`)
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

  return { keyData, behavior, status };
}

export const SECTION_DEFS = [
  { metric: 'ventas', emoji: '💰', title: 'Análisis de Ventas' },
  { metric: 'ticketPromedio', emoji: '🎫', title: 'Análisis de Tickets' },
  { metric: 'transactions', emoji: '⚡', title: 'Análisis de Transacciones' },
  { metric: 'suggested', emoji: '🎁', title: 'Análisis de Sugeridos' },
];