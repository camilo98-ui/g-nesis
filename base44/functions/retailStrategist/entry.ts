import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Benchmarks retail Colombia
const BENCHMARKS = {
  ticketPromedio: { min: 35000, max: 48000, std: 41000 },
  transaccionesHora: { min: 12, max: 18, std: 15 },
  conversion: { min: 0.032, max: 0.048, std: 0.04 },
  margenBruto: { min: 0.42, max: 0.48, std: 0.45 },
  eficienciaLaboral: { min: 120, max: 145, std: 132 }
};

// Análisis locales sin API
function analyzeStoreMetrics(salesData, budgetData, shiftsData, cashierData) {
  if (!salesData || salesData.length === 0) {
    return { error: 'Sin datos de ventas para analizar' };
  }

  const sorted = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date));
  const hoy = sorted[0];
  const ayer = sorted[1] || hoy;
  const ultimos7 = sorted.slice(0, 7);
  const ultimos30 = sorted.slice(0, 30);

  // Cálculos críticos
  const ventasHoy = hoy.total_sales || 0;
  const ventasAyer = ayer.total_sales || hoy.total_sales;
  const deltaVentas = Math.round(((ventasHoy - ventasAyer) / ventasAyer) * 100);

  const ticketHoy = hoy.total_transactions > 0 ? ventasHoy / hoy.total_transactions : 0;
  const ticketAyer = ayer.total_transactions > 0 ? ventasAyer / ayer.total_transactions : 0;
  const deltaTicket = Math.round(((ticketHoy - ticketAyer) / ticketAyer) * 100);

  const transaccionesHoy = hoy.total_transactions || 0;
  const transaccionesAyer = ayer.total_transactions || 0;
  const deltaTransacciones = Math.round(((transaccionesHoy - transaccionesAyer) / transaccionesAyer) * 100);

  // Promedios 7 días
  const promedio7 = ultimos7.reduce((sum, d) => sum + d.total_sales, 0) / ultimos7.length;
  const desvio7 = Math.sqrt(
    ultimos7.reduce((sum, d) => sum + Math.pow(d.total_sales - promedio7, 2), 0) / ultimos7.length
  );
  const zscore = (ventasHoy - promedio7) / desvio7;

  // Promedios 30 días
  const promedio30 = ultimos30.reduce((sum, d) => sum + d.total_sales, 0) / ultimos30.length;
  const deltaTendencia30 = Math.round(((ventasHoy - promedio30) / promedio30) * 100);

  // Análisis de sugeridos
  const sugeridosHoy = hoy.total_suggested || 0;
  const tasaSugeridos = transaccionesHoy > 0 ? (sugeridosHoy / transaccionesHoy * 100).toFixed(1) : 0;

  // Detección de anomalías
  const anomalias = [];
  if (Math.abs(zscore) > 2) {
    anomalias.push(`Z-score extremo: ${zscore.toFixed(2)} (${zscore > 0 ? 'MUY ALTO' : 'MUY BAJO'})`);
  }
  if (ticketHoy > BENCHMARKS.ticketPromedio.max * 1.2) {
    anomalias.push(`Ticket ${((ticketHoy / BENCHMARKS.ticketPromedio.max) * 100).toFixed(0)}% por encima del máximo benchmark`);
  }
  if (ticketHoy < BENCHMARKS.ticketPromedio.min * 0.8) {
    anomalias.push(`Ticket ${((ticketHoy / BENCHMARKS.ticketPromedio.min) * 100).toFixed(0)}% por debajo del mínimo benchmark`);
  }

  // Forecast 7 días
  const trendRate = (ventasHoy - promedio30) / promedio30;
  const forecast7 = Math.round(promedio30 * (1 + trendRate * 0.85));

  // Impacto en budget
  let impactoBudget = '';
  if (budgetData && budgetData.length > 0) {
    const activeBudget = budgetData.find(b => b.is_active);
    if (activeBudget) {
      const cumplimiento = (ventasHoy / (activeBudget.sales_budget / 30)) * 100;
      impactoBudget = `Cumplimiento diario: ${cumplimiento.toFixed(1)}% (Meta: $${(activeBudget.sales_budget / 1000000).toFixed(2)}M)`;
    }
  }

  return {
    ventas: {
      hoy: ventasHoy,
      delta: deltaVentas,
      promedio7d: Math.round(promedio7),
      promedio30d: Math.round(promedio30),
      deltaTendencia30d: deltaTendencia30,
      forecast7d: forecast7
    },
    tickets: {
      promedio: Math.round(ticketHoy),
      delta: deltaTicket,
      vs_benchmark: {
        bajo: ticketHoy < BENCHMARKS.ticketPromedio.min ? true : false,
        alto: ticketHoy > BENCHMARKS.ticketPromedio.max ? true : false,
        percentil: ((ticketHoy - BENCHMARKS.ticketPromedio.min) / (BENCHMARKS.ticketPromedio.max - BENCHMARKS.ticketPromedio.min) * 100).toFixed(0)
      }
    },
    transacciones: {
      hoy: transaccionesHoy,
      delta: deltaTransacciones,
      tasaSugeridos: tasaSugeridos
    },
    estadisticas: {
      zscore: zscore.toFixed(2),
      desvio: Math.round(desvio7),
      anomalias: anomalias
    },
    budget: impactoBudget,
    team: {
      activos: cashierData ? cashierData.filter(c => c.is_active).length : 0
    }
  };
}

function generateNOVAAnalysis(metrics, prompt) {
  if (metrics.error) {
    return metrics.error;
  }

  const v = metrics.ventas;
  const t = metrics.tickets;
  const tr = metrics.transacciones;
  const e = metrics.estadisticas;

  let analysis = '';

  // Abertura crítica
  if (Math.abs(v.delta) > 10) {
    analysis += `🚨 CRÍTICO: Ventas ${v.delta > 0 ? '+' : ''}${v.delta}% vs ayer\n`;
  } else if (Math.abs(v.delta) > 5) {
    analysis += `⚠️ ALERTA: Ventas ${v.delta > 0 ? '+' : ''}${v.delta}% vs ayer\n`;
  } else {
    analysis += `✅ Ventas ${v.delta > 0 ? '+' : ''}${v.delta}% vs ayer\n`;
  }

  // Desglose de variables
  analysis += `\n📊 DESGLOSE CAUSAL:\n`;
  analysis += `• Transacciones: ${v.delta > 0 && tr.delta < 0 ? '↓' : v.delta > 0 && tr.delta > 0 ? '↑' : '→'} ${tr.delta > 0 ? '+' : ''}${tr.delta}% (${tr.hoy} txn)\n`;
  analysis += `• Ticket promedio: ${t.delta > 0 ? '↑' : t.delta < 0 ? '↓' : '→'} ${t.delta > 0 ? '+' : ''}${t.delta}% ($${(t.promedio/1000).toFixed(1)}K vs benchmark $${(BENCHMARKS.ticketPromedio.std/1000).toFixed(0)}K)\n`;
  analysis += `• Sugeridos: ${tr.tasaSugeridos}% de tasa de venta\n`;

  // Anomalías
  if (e.anomalias.length > 0) {
    analysis += `\n⚡ ANOMALÍAS DETECTADAS:\n`;
    e.anomalias.forEach(a => analysis += `• ${a}\n`);
  }

  // Tendencia
  analysis += `\n📈 TENDENCIA:\n`;
  analysis += `• Últimos 7d: Promedio $${(v.promedio7d/1000000).toFixed(2)}M (${v.deltaTendencia30d > 0 ? '+' : ''}${v.deltaTendencia30d}% vs mes)\n`;
  analysis += `• Z-score: ${e.zscore} ${Math.abs(parseFloat(e.zscore)) > 2 ? '(EXTREMO)' : '(Normal)'}\n`;
  analysis += `• Forecast 7d: $${(v.forecast7d/1000000).toFixed(2)}M ${v.forecast7d > v.promedio7d ? '↑' : '↓'}\n`;

  // Recomendaciones
  analysis += `\n💡 RECOMENDACIONES:\n`;
  if (tr.tasaSugeridos < 15) {
    analysis += `• Tasa sugeridos baja (${tr.tasaSugeridos}%). Impacto potencial: +3.2-4.8% ventas si aumenta a 25%\n`;
  }
  if (t.vs_benchmark.bajo) {
    analysis += `• Ticket bajo. Acciones: upsell, combos, premium. ROI esperado: +$${Math.round(t.promedio * 0.12 * tr.hoy / 1000000)}M\n`;
  }
  if (Math.abs(parseFloat(e.zscore)) > 2) {
    analysis += `• Investigar causa de variación extrema. Patrón no esperado.\n`;
  }

  if (metrics.budget) {
    analysis += `\n📋 PRESUPUESTO:\n• ${metrics.budget}\n`;
  }

  // Probabilidad de éxito
  const probExito = Math.min(95, Math.max(60, 70 + (v.delta * 0.5) + (t.delta * 0.3)));
  analysis += `\n✓ Probabilidad de cumplimiento con acciones: ${probExito.toFixed(0)}%\n`;

  return analysis;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, selectedStore } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    let analysis = '';
    
    if (selectedStore) {
      const [salesData, budgetData, cashierData] = await Promise.all([
        base44.entities.DailySales.filter({ store_id: selectedStore }).catch(() => []),
        base44.entities.Budget.filter({ store_id: selectedStore }).catch(() => []),
        base44.entities.Cashier.filter({ store_id: selectedStore }).catch(() => [])
      ]);

      // Análisis local puro
      const metrics = analyzeStoreMetrics(salesData, budgetData, null, cashierData);
      analysis = generateNOVAAnalysis(metrics, prompt);
    } else {
      analysis = `NOVA requiere tienda seleccionada para análisis. Selecciona una tienda para comenzar.`;
    }
    
    return Response.json({
      success: true,
      response: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error.message || 'Error procesando análisis',
      success: false
    }, { status: 500 });
  }
});