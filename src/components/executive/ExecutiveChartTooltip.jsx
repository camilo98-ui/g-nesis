import React from 'react';

/**
 * Genera un insight contextual + recomendación ejecutiva para tooltips de gráficas
 * @param {string} chartType - Tipo de gráfica ('sales_vs_budget', 'stores_vs_ppt', 'top_performers', etc.)
 * @param {object} data - Datos del punto/contexto de la gráfica
 * @param {object} zoneData - Datos globales de la zona (incluyendo storesAnalysis)
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
    trend = 'stable',
    date = ''
  } = data;

  const { 
    zoneSales = 0, 
    zoneBudget = 0, 
    zoneCompliance = 0,
    storesAnalysis = []
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
      const gapValue = (budget - sales);
      const gapPercentage = budget > 0 ? ((budget - sales) / budget) * 100 : 0;
      const isAbove = sales >= budget;
      
      // Analizar tiendas que afectan el resultado del día
      const criticalStores = storesAnalysis.filter(s => s.hasData && s.weekCompliance < 80);
      const topContributors = [...storesAnalysis]
        .filter(s => s.hasData)
        .sort((a, b) => b.weekTotalSales - a.weekTotalSales)
        .slice(0, 3);
      const bottomPerformers = [...storesAnalysis]
        .filter(s => s.hasData && s.weekCompliance < 90)
        .sort((a, b) => a.weekCompliance - b.weekCompliance)
        .slice(0, 2);
      
      if (isAbove) {
        const topStoresText = topContributors.map(s => `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%)`).join(', ');
        insight = `✅ Meta superada por $${(sales - budget).toFixed(1)}M (+${((sales / budget - 1) * 100).toFixed(1)}%). Liderado por: ${topStoresText}. ${storesAnalysis.filter(s => s.weekCompliance >= 100).length} tiendas sobre el 100%.`;
        recommendation = 'Sostener impulso y documentar prácticas ganadoras';
      } else if (compliance >= 85) {
        const worstText = bottomPerformers.map(s => `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%)`).join(', ');
        insight = `${compliance.toFixed(0)}% de cumplimiento. Gap: $${gapValue.toFixed(1)}M (${gapPercentage.toFixed(0)}%). ${bottomPerformers.length} tiendas lastre: ${worstText}. ${storesAnalysis.filter(s => s.weekCompliance >= 100).length} tiendas compensan.`;
        recommendation = 'Reforzar tiendas bajo 90% con activaciones comerciales';
      } else {
        const criticalText = criticalStores.slice(0, 3).map(s => `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%, -$${(s.gap / 1000000).toFixed(1)}M)`).join(', ');
        insight = `⚠️ ${compliance.toFixed(0)}% cumplimiento. Gap crítico: $${gapValue.toFixed(1)}M. ${criticalStores.length} tiendas rojas arrastran: ${criticalText}. Solo ${storesAnalysis.filter(s => s.weekCompliance >= 100).length} compensan.`;
        recommendation = '⚠️ Intervención inmediata en tiendas <80% con refuerzo operativo';
        priority = true;
      }
      break;

    case 'stores_vs_ppt':
      const criticalList = storesAnalysis
        .filter(s => s.hasData && s.weekCompliance < 80)
        .sort((a, b) => a.weekCompliance - b.weekCompliance);
      const alertList = storesAnalysis
        .filter(s => s.hasData && s.weekCompliance >= 80 && s.weekCompliance < 90);
      const metaList = storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 100);
      
      if (criticalList.length >= 4) {
        const worstStores = criticalList.slice(0, 3).map(s => 
          `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%, -$${(s.gap / 1000000).toFixed(1)}M)`
        ).join(', ');
        const totalCriticalGap = criticalList.reduce((sum, s) => sum + Math.max(0, s.gap), 0) / 1000000;
        insight = `⚠️ ${criticalList.length} tiendas críticas concentran $${totalCriticalGap.toFixed(1)}M del gap. Peores: ${worstStores}. ${metaList.length} en meta vs ${criticalList.length} en rojo.`;
        recommendation = '⚠️ Plan de choque: supervisión diaria en tiendas rojas + refuerzo operativo';
        priority = true;
      } else if (criticalList.length > 0) {
        const needAttention = [...criticalList, ...alertList].slice(0, 3).map(s => 
          `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%)`
        ).join(', ');
        insight = `${criticalList.length} críticas + ${alertList.length} en alerta. Foco en: ${needAttention}. ${metaList.length} tiendas sostienen la zona (${(metaList.length / storesAnalysis.filter(s => s.hasData).length * 100).toFixed(0)}%).`;
        recommendation = 'Acompañamiento semanal en tiendas <85% con metas progresivas';
      } else {
        const topThree = [...storesAnalysis].filter(s => s.hasData).sort((a, b) => b.weekCompliance - a.weekCompliance).slice(0, 3)
          .map(s => `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%)`).join(', ');
        insight = `✅ Zona balanceada. ${metaList.length} tiendas sobre meta (${(metaList.length / storesAnalysis.filter(s => s.hasData).length * 100).toFixed(0)}%). Líderes: ${topThree}.`;
        recommendation = 'Escalar mejores prácticas desde top performers a tiendas 85-95%';
      }
      break;

    case 'top_performers':
      const topStores = storesAnalysis
        .filter(s => s.hasData && s.weekCompliance >= 90)
        .sort((a, b) => b.weekCompliance - a.weekCompliance)
        .slice(0, 5);
      const topStoresText = topStores.map(s => 
        `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%, $${(s.weekTotalSales / 1000000).toFixed(1)}M)`
      ).join(', ');
      const totalTopSales = topStores.reduce((sum, s) => sum + s.weekTotalSales, 0) / 1000000;
      const avgTop = topStores.reduce((sum, s) => sum + s.weekCompliance, 0) / topStores.length;
      
      insight = `${topStores.length} líderes aportan $${totalTopSales.toFixed(1)}M con ${avgTop.toFixed(0)}% promedio. Detalle: ${topStoresText}.`;
      recommendation = 'Documentar y replicar estrategias de tiendas top en zona';
      break;

    case 'store_detail':
      const storeData = storesAnalysis.find(s => s.name === storeName);
      if (weekCompliance < 80) {
        const gapAmount = storeData ? (storeData.gap / 1000000).toFixed(1) : 0;
        const avgTicket = storeData ? storeData.weekAvgTicket.toFixed(0) : 0;
        insight = `⚠️ ${storeName}: ${weekCompliance.toFixed(0)}% semanal, -$${gapAmount}M vs meta. Ticket: $${avgTicket}. ${storeData?.weekTotalTransactions || 0} transacciones. Necesita intervención urgente.`;
        recommendation = '⚠️ Revisión de turnos, dotación, mix y estrategia comercial';
        priority = true;
      } else if (weekCompliance < 90) {
        const remaining = storeData ? ((storeData.weeklyBudget - storeData.weekTotalSales) / 1000000).toFixed(1) : 0;
        insight = `${storeName}: ${weekCompliance.toFixed(0)}% semanal. Faltan $${remaining}M para meta (10 puntos). ${storeData?.weekTotalTransactions || 0} trx, ticket $${storeData?.weekAvgTicket.toFixed(0) || 0}.`;
        recommendation = 'Reforzar horas pico y activar incentivo de corto plazo';
      } else {
        const excess = storeData ? ((storeData.weekTotalSales - storeData.weeklyBudget) / 1000000).toFixed(1) : 0;
        insight = `✅ ${storeName}: ${weekCompliance.toFixed(0)}% semanal, +$${excess}M sobre meta. ${storeData?.weekTotalTransactions || 0} trx, ticket $${storeData?.weekAvgTicket.toFixed(0) || 0}. Líder de zona.`;
        recommendation = 'Reconocer equipo y documentar factores de éxito para replicar';
      }
      break;

    case 'daily_sales':
      const dayCompliance = budget > 0 ? (sales / budget) * 100 : 0;
      const dayGap = (budget - sales) / 1000000;
      
      // Identificar tiendas que más contribuyeron ese día
      const dayWorstStores = [...storesAnalysis]
        .filter(s => s.hasData)
        .sort((a, b) => a.weekCompliance - b.weekCompliance)
        .slice(0, 3)
        .map(s => `${s.name.split(' ')[1]} (${s.weekCompliance.toFixed(0)}%)`)
        .join(', ');
      
      if (dayCompliance < 85) {
        insight = `⚠️ Día en ${dayCompliance.toFixed(0)}%. Gap: $${dayGap.toFixed(1)}M (${((dayGap / budget) * 100).toFixed(0)}%). Tiendas que arrastran: ${dayWorstStores}.`;
        recommendation = '⚠️ Activar cobertura en horas valle y reforzar turno actual';
        priority = true;
      } else if (dayCompliance < 100) {
        insight = `Día ${dayCompliance.toFixed(0)}% de meta. Faltan $${dayGap.toFixed(1)}M. Tiendas críticas: ${dayWorstStores}. ${storesAnalysis.filter(s => s.weekCompliance >= 100).length} tiendas compensan.`;
        recommendation = 'Impulsar cierre fuerte en últimas horas del día';
      } else {
        const dayExcess = ((sales - budget) / 1000000).toFixed(1);
        insight = `✅ Día exitoso: ${dayCompliance.toFixed(0)}% (+$${dayExcess}M sobre meta). ${storesAnalysis.filter(s => s.weekCompliance >= 100).length} tiendas sobre el 100%.`;
        recommendation = 'Sostener operación y replicar estrategia mañana';
      }
      break;

    case 'compliance_distribution':
      const positiveStores = storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 90);
      const alertStores = storesAnalysis.filter(s => s.hasData && s.weekCompliance >= 70 && s.weekCompliance < 90);
      const criticalStoresArr = storesAnalysis.filter(s => s.hasData && s.weekCompliance < 70);
      
      const criticalNames = criticalStoresArr.slice(0, 2).map(s => s.name.split(' ')[1]).join(', ');
      insight = `${positiveStores.length} en meta (${(positiveStores.length / storesAnalysis.filter(s => s.hasData).length * 100).toFixed(0)}%), ${alertStores.length} en alerta, ${criticalStoresArr.length} críticas${criticalStoresArr.length > 0 ? ` (${criticalNames})` : ''}.`;
      if (criticalStoresArr.length >= 3) {
        recommendation = '⚠️ Plan de recuperación para tiendas rojas con metas semanales';
        priority = true;
      } else {
        recommendation = 'Seguimiento cercano y acelerar tiendas en alerta';
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