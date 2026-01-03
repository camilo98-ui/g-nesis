import React from 'react';

/**
 * Genera un insight contextual + recomendación ejecutiva para tooltips de gráficas
 * @param {string} chartType - Tipo de gráfica ('sales_vs_budget', 'stores_vs_ppt', 'top_performers', etc.)
 * @param {object} data - Datos del punto/contexto de la gráfica
 * @param {object} zoneData - Datos globales de la zona
 * @returns {object} { insight, recommendation, priority }
 */
export function generateChartInsight(chartType, data, zoneData) {
  const { 
    sales = 0, 
    budget = 0, 
    compliance = 0,
    storeName = '',
    weekCompliance = 0,
    criticalStoresCount = 0,
    totalGap = 0,
    trend = 'stable'
  } = data;

  const { 
    zoneSales = 0, 
    zoneBudget = 0, 
    zoneCompliance = 0 
  } = zoneData || {};

  let insight = '';
  let recommendation = '';
  let priority = false;

  // Detectar si hay situación crítica
  if (compliance < 85 || weekCompliance < 85 || zoneCompliance < 85 || trend === 'negative') {
    priority = true;
  }

  switch (chartType) {
    case 'sales_vs_budget':
      const gapPercentage = budget > 0 ? ((budget - sales) / budget) * 100 : 0;
      const isAbove = sales >= budget;
      
      if (isAbove) {
        insight = `La zona supera la meta en ${((sales / budget - 1) * 100).toFixed(1)}%. Desempeño positivo y consistente en la semana.`;
        recommendation = 'Sostener impulso comercial y reconocer equipos destacados';
      } else if (compliance >= 85) {
        insight = `La zona alcanza un ${compliance.toFixed(0)}% del presupuesto. Tendencia positiva, gap de ${gapPercentage.toFixed(0)}% por cerrar.`;
        recommendation = 'Reforzar activaciones comerciales en días de menor tráfico';
      } else {
        insight = `⚠️ Cumplimiento del ${compliance.toFixed(0)}%. Gap significativo concentrado en días débiles.`;
        recommendation = '⚠️ Acción prioritaria: activar plan de refuerzo inmediato en turnos críticos';
        priority = true;
      }
      break;

    case 'stores_vs_ppt':
      if (criticalStoresCount >= 4) {
        insight = `⚠️ ${criticalStoresCount} tiendas por debajo del 80% de cumplimiento, concentrando ${totalGap}M del gap total.`;
        recommendation = '⚠️ Acción prioritaria: intervenir tiendas críticas con metas diarias y seguimiento cercano';
        priority = true;
      } else if (criticalStoresCount > 0) {
        insight = `${criticalStoresCount} tiendas requieren atención. El resto de la zona mantiene desempeño estable.`;
        recommendation = 'Priorizar acompañamiento en tiendas bajo 85% de cumplimiento';
      } else {
        insight = 'Zona equilibrada. Todas las tiendas operan sobre el 80% de cumplimiento semanal.';
        recommendation = 'Impulsar iniciativas de mejora continua en tiendas 85-95%';
      }
      break;

    case 'top_performers':
      insight = `${data.topStoresCount || 5} tiendas lideran con cumplimiento promedio de ${data.avgCompliance?.toFixed(1) || 0}%.`;
      recommendation = 'Documentar y escalar mejores prácticas a tiendas en desarrollo';
      break;

    case 'store_detail':
      if (weekCompliance < 80) {
        insight = `⚠️ ${storeName} con ${weekCompliance.toFixed(0)}% semanal. Desempeño crítico que requiere intervención.`;
        recommendation = '⚠️ Acción prioritaria: revisión de turnos, dotación y estrategia comercial';
        priority = true;
      } else if (weekCompliance < 90) {
        insight = `${storeName} alcanza ${weekCompliance.toFixed(0)}% semanal. A 10 puntos de la meta, con potencial de cierre.`;
        recommendation = 'Reforzar horas pico y activar incentivo de corto plazo';
      } else {
        insight = `${storeName} supera la meta con ${weekCompliance.toFixed(0)}% de cumplimiento. Desempeño destacado.`;
        recommendation = 'Reconocer al equipo y documentar factores de éxito';
      }
      break;

    case 'daily_sales':
      const dayCompliance = budget > 0 ? (sales / budget) * 100 : 0;
      if (dayCompliance < 85) {
        insight = `⚠️ Venta del día en ${dayCompliance.toFixed(0)}%. Gap de ${((budget - sales) / 1000000).toFixed(1)}M vs presupuesto.`;
        recommendation = '⚠️ Acción prioritaria: activar cobertura en horas valle y reforzar turno actual';
        priority = true;
      } else if (dayCompliance < 100) {
        insight = `Día en ${dayCompliance.toFixed(0)}% de cumplimiento. Cerca de meta con ${((budget - sales) / 1000000).toFixed(1)}M por cerrar.`;
        recommendation = 'Impulsar cierre fuerte en últimas horas del día';
      } else {
        insight = `Día exitoso superando meta en ${((sales / budget - 1) * 100).toFixed(1)}%. Desempeño sobresaliente.`;
        recommendation = 'Sostener operación y preparar mañana con el mismo impulso';
      }
      break;

    case 'compliance_distribution':
      insight = `Distribución: ${data.positiveCount || 0} en meta, ${data.alertCount || 0} en alerta, ${data.criticalCount || 0} críticas.`;
      if (data.criticalCount >= 3) {
        recommendation = '⚠️ Acción prioritaria: plan de recuperación para tiendas rojas con metas semanales';
        priority = true;
      } else {
        recommendation = 'Continuar seguimiento cercano y acelerar tiendas en alerta';
      }
      break;

    default:
      insight = 'Datos en análisis. Consulta el detalle para mayor contexto.';
      recommendation = 'Revisar métricas individuales y tendencias semanales';
  }

  return { insight, recommendation, priority };
}

/**
 * Componente de Tooltip personalizado para gráficas ejecutivas
 */
export default function ExecutiveChartTooltip({ active, payload, chartType, zoneData }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload || {};
  const { insight, recommendation, priority } = generateChartInsight(chartType, data, zoneData);

  return (
    <div className="bg-slate-900/98 backdrop-blur-xl border-2 border-white/20 rounded-xl p-4 shadow-2xl max-w-xs">
      {/* Título del tooltip */}
      <div className="border-b border-white/10 pb-2 mb-3">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {data.date || data.name || data.fullDate || 'Detalle'}
        </p>
      </div>

      {/* Valores principales */}
      <div className="space-y-1.5 mb-3 text-xs">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-bold text-white" style={{ color: entry.color }}>
              {typeof entry.value === 'number' 
                ? entry.value > 1000 
                  ? `$${(entry.value).toFixed(1)}M`
                  : entry.value.toFixed(0)
                : entry.value}
            </span>
          </div>
        ))}
      </div>

      {/* Insight contextual */}
      <div className="border-t border-white/10 pt-3">
        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">
          📊 Insight
        </p>
        <p className="text-xs text-slate-200 leading-relaxed">
          {insight}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook para generar tooltip props compatibles con Recharts
 */
export function useExecutiveTooltip(chartType, zoneData) {
  return {
    content: ({ active, payload }) => (
      <ExecutiveChartTooltip 
        active={active} 
        payload={payload} 
        chartType={chartType}
        zoneData={zoneData}
      />
    ),
    cursor: { fill: 'rgba(255,255,255,0.05)' },
    wrapperStyle: { outline: 'none' }
  };
}