/**
 * useAIInsights.js
 * ────────────────────────────────────────────────────────────────────────────
 * Replaces local statistical analysis with AI-powered deep insights.
 * Calls InvokeLLM with full store data + pre-computed stats, asking for
 * next-level analysis: anomaly detection, cross-metric correlations,
 * hidden patterns, and quantified strategic actions.
 * Falls back to local computeInsight instantly while AI loads.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { buildChartData, computeInsight, SECTION_DEFS } from '@/components/dashboard/computeInsight';

export function useAIInsights(dailySales = []) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastSignature = useRef('');

  // Instant local fallback (always available)
  const localSections = useMemo(() => {
    const chartData = buildChartData(dailySales);
    return SECTION_DEFS.map((def) => ({
      ...def,
      insight: computeInsight(chartData, def.metric),
    }));
  }, [dailySales]);

  // Detect data changes to trigger AI re-analysis
  const dataSignature = useMemo(() => {
    if (!dailySales || dailySales.length === 0) return '';
    return dailySales.map(d => `${d.date}:${d.total_sales || 0}`).join('|');
  }, [dailySales]);

  useEffect(() => {
    if (!dailySales || dailySales.length === 0) return;
    if (dataSignature === lastSignature.current) return;
    lastSignature.current = dataSignature;

    let cancelled = false;
    setLoading(true);

    const chartData = buildChartData(dailySales);

    // Pre-compute stats for the LLM context
    const stats = SECTION_DEFS.map(def => {
      const insight = computeInsight(chartData, def.metric);
      return { metric: def.metric, title: def.title, ...insight };
    });

    const totalSales = chartData.reduce((s, d) => s + (d.ventas || 0), 0);
    const totalTickets = chartData.reduce((s, d) => s + (d.tickets || 0), 0);
    const totalTransactions = chartData.reduce((s, d) => s + (d.transactions || 0), 0);
    const totalSuggested = chartData.reduce((s, d) => s + (d.suggested || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const dailyBreakdown = chartData.map(d =>
      `${d.fullDate}: Ventas=$${Math.round(d.ventas).toLocaleString('es-CO')}, Tickets=${d.tickets}, Transacciones=${d.transactions}, TicketPromedio=$${Math.round(d.ticketPromedio).toLocaleString('es-CO')}, Sugeridos=${d.suggested}`
    ).join('\n');

    const statsSummary = stats.map(s =>
      `${s.title} [${s.metric}]: ${s.keyData} | ${s.behavior} | Status: ${s.status}`
    ).join('\n');

    const prompt = `Eres Nova, un analista de retail de ÉLITE especializado en heladerías Popsy en Colombia. Analiza los siguientes datos operativos reales de una tienda y genera 4 insights DE OTRO NIVEL — NO análisis básicos de "subió/bajó X%".

Quiero el tipo de análisis que haría un consultor senior de McKinsey o un data scientist de retail top: detección de anomalías estadísticas (desviaciones estándar), patrones ocultos por día de la semana, correlaciones CRUZADAS entre métricas (ej: ¿cuándo sube el ticket promedio bajan las transacciones?), riesgos emergentes, saturación de demanda, cuellos de botella, y oportunidades cuantificadas con impacto financiero real en pesos colombianos.

DATOS DEL PERÍODO (${chartData.length} días):
- Venta total: $${Math.round(totalSales).toLocaleString('es-CO')}
- Tickets totales: ${totalTickets.toLocaleString('es-CO')}
- Transacciones totales: ${totalTransactions.toLocaleString('es-CO')}
- Sugeridos totales: ${totalSuggested.toLocaleString('es-CO')}
- Ticket promedio: $${Math.round(avgTicket).toLocaleString('es-CO')}

DATOS POR DÍA:
${dailyBreakdown}

ESTADÍSTICAS PRE-COMPUTADAS:
${statsSummary}

GENERA EXACTAMENTE 4 INSIGHTS (uno por métrica: "ventas", "ticketPromedio", "transactions", "suggested"). Cada insight debe incluir:
- metric: exactamente uno de: ventas | ticketPromedio | transactions | suggested
- emoji: un emoji representativo
- title: título corto
- keyData: Un titular POTENTE con números específicos y un hallazgo NO OBVIO (máx 130 caracteres). Ej: "Anomalía 3.2σ: $2.3M de pérdida concentrada en 2 franjas de bajo tráfico"
- behavior: Análisis profundo del PORQUÉ, correlaciones cruzadas con OTRAS métricas, patrones detectados, contexto estratégico (máx 320 caracteres). Menciona números reales.
- strategicAction: Una recomendación táctica accionable con impacto cuantificado en pesos o porcentaje (máx 200 caracteres). Ej: "Reasigna 2 cajeros a franja 12-14h: recuperarías ~$1.8M/semana en margen perdido"
- status: "critical" | "warning" | "positive" | "neutral"

REGLAS CRÍTICAS:
1. Usa SOLAMENTE números reales de los datos proporcionados
2. Encuentra patrones que NO son obvios a simple vista
3. Cruza métricas: relaciona ventas con tickets, transacciones con sugeridos, etc.
4. Si detectas una anomalía estadística, menciona la desviación estándar
5. Cuantifica SIEMPRE el impacto financiero de cada hallazgo y acción
6. Responde en español colombiano, tono ejecutivo y directo`;

    base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                emoji: { type: "string" },
                title: { type: "string" },
                keyData: { type: "string" },
                behavior: { type: "string" },
                strategicAction: { type: "string" },
                status: { type: "string" }
              }
            }
          }
        }
      }
    }).then((res) => {
      if (cancelled) return;
      try {
        const data = typeof res === 'string' ? JSON.parse(res) : res;
        if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
          const mapped = SECTION_DEFS.map(def => {
            const aiMatch = data.insights.find(i => i.metric === def.metric);
            if (aiMatch) {
              return {
                ...def,
                insight: {
                  keyData: aiMatch.keyData || '',
                  behavior: aiMatch.behavior || '',
                  status: ['critical', 'warning', 'positive', 'neutral'].includes(aiMatch.status) ? aiMatch.status : 'neutral',
                  strategicAction: aiMatch.strategicAction || '',
                }
              };
            }
            return localSections.find(s => s.metric === def.metric) || { ...def, insight: computeInsight(chartData, def.metric) };
          });
          setAiData(mapped);
        }
      } catch (e) {
        // fallback to local — already set as default
      }
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [dataSignature]);

  const sections = aiData || localSections;
  return { sections, isAI: !!aiData, aiLoading: loading };
}