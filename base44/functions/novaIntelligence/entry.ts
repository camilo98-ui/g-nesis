import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userQuery, storeCode, pageData, businessContext } = await req.json();

    if (!userQuery || !storeCode) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Aggregate business intelligence context
    const analyticContext = buildAnalyticContext(pageData, businessContext);

    // Build executive analysis prompt
    const analysisPrompt = `You are Nova, an elite business intelligence engine operating at the highest level of analytical sophistication.

Your role:
- Chief Financial & Operations Analyst
- Strategic Business Advisor
- Data-Driven Intelligence Engine
- Predictive Analytics Specialist

CORE COMPETENCIES:
✓ Deep KPI Analysis (PPT, Brecha, Proyecciones, EBITDA, Márgenes)
✓ Sales Pattern Recognition & Trend Forecasting
✓ Anomaly Detection & Risk Identification
✓ Historical Comparative Analysis (Month-over-Month, Year-over-Year)
✓ Financial Interpretation & Margin Analysis
✓ Operational Diagnostics
✓ Strategic Recommendation Generation
✓ Executive-Level Communication

COMMUNICATION STYLE:
- Grounded in data and numbers
- Clear cause-and-effect analysis
- Professional yet approachable
- Proactive in identifying risks
- Strategic in recommendations
- Always explain reasoning

STORE DATA & ANALYTICS:
${analyticContext}

USER QUERY:
"${userQuery}"

ANALYSIS REQUIREMENTS:
1. Identify the core business question or issue
2. Extract relevant KPIs and metrics from available data
3. Compare against historical periods (if data available)
4. Detect trends, patterns, or anomalies
5. Calculate impact metrics (% change, variance from target)
6. Identify root causes or contributing factors
7. Assess operational health and risk level
8. Generate actionable recommendations
9. Provide financial or strategic implications

RESPONSE STRUCTURE:
- **Executive Summary**: Direct answer to the question
- **Key Metrics**: Relevant KPIs with numbers
- **Trend Analysis**: Historical comparison and patterns
- **Anomalies**: Unusual patterns or deviations
- **Root Cause**: What's driving the numbers
- **Risk Assessment**: Operational or financial risks
- **Strategic Recommendations**: Actionable next steps
- **Impact Forecast**: Expected outcomes if recommendations are followed

Remember: You are the intelligence engine of this business. Think like a CFO, act like a analyst, communicate like an executive advisor.`;

    // Use advanced Claude model for sophisticated reasoning
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      model: 'claude_sonnet_4_6'  // Advanced reasoning model
    });

    return Response.json({ 
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Nova Intelligence Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildAnalyticContext(pageData, businessContext) {
  const fmt = (n) => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(n)) : '$0';
  
  if (!pageData) return 'No business data available.';

  let context = `CURRENT BUSINESS STATE — ${pageData.storeCode || 'Store'}\n`;
  context += `═══════════════════════════════════════════════════════════\n\n`;

  // Daily Performance
  if (pageData.venta_hoy != null) {
    context += `📊 TODAY'S PERFORMANCE:\n`;
    context += `  • Daily Sales: ${fmt(pageData.venta_hoy)}\n`;
    context += `  • Transactions: ${pageData.transacciones_hoy || 0}\n`;
    context += `  • Avg Ticket: ${fmt(pageData.ticket_promedio_hoy || 0)}\n`;
    context += `  • Daily Target: ${fmt(pageData.ppt_dia || 0)}\n`;
    context += `  • Compliance: ${pageData.cumplimiento_diario || '—'}%\n`;
    context += `  • YoY Variation: ${pageData.variacion_vs_ayer || '—'}%\n\n`;
  }

  // Budget Status
  if (pageData.presupuesto_mes) {
    context += `💰 BUDGET & FINANCIAL STATUS:\n`;
    context += `  • Monthly Budget: ${fmt(pageData.presupuesto_mes)}\n`;
    context += `  • Accumulated Sales: ${fmt(pageData.ventas_acumuladas || 0)}\n`;
    context += `  • Accumulated Budget: ${fmt(pageData.presupuesto_mes || 0)}\n`;
    context += `  • Monthly Gap: ${fmt(pageData.brecha_mes || 0)}\n`;
    context += `  • Month-End Projection: ${fmt(pageData.proyeccion_cierre || 0)}\n`;
    context += `  • Projected Compliance: ${pageData.cumplimiento_proyeccion?.toFixed(1) || '—'}%\n\n`;
  }

  // Historical Trends
  if (pageData.sales_7d_total) {
    context += `📈 7-DAY HISTORICAL TRENDS:\n`;
    context += `  • Total: ${fmt(pageData.sales_7d_total)}\n`;
    context += `  • Daily Average: ${fmt(pageData.sales_7d_avg)}\n`;
    context += `  • Peak Day: ${fmt(pageData.sales_7d_max)}\n`;
    context += `  • Lowest Day: ${fmt(pageData.sales_7d_min)}\n`;
    context += `  • Trend: ${pageData.trend_7d || '—'}%\n\n`;
  }

  // Product Mix
  if (pageData.top_products || pageData.top_5_products_list) {
    context += `🛍️ PRODUCT INTELLIGENCE:\n`;
    context += `  • Top Products: ${pageData.top_5_products_list || pageData.top_products || '—'}\n`;
    context += `  • Top 5 Participation: ${pageData.top_5_products_participation || '—'}%\n`;
    context += `  • Total Product Count: ${pageData.top_products_count || '—'}\n\n`;
  }

  // Financial Indicators (P&G)
  if (pageData.pyg_ebitda_margin) {
    context += `💹 FINANCIAL INDICATORS (P&G):\n`;
    context += `  • EBITDA Margin: ${pageData.pyg_ebitda_margin}% (Target: ≥25%)\n`;
    context += `  • Real Cost: ${pageData.pyg_cost_real || '—'}%\n`;
    context += `  • Theoretical Cost: ${pageData.pyg_cost_teorico || '—'}%\n`;
    context += `  • Personnel Cost: ${pageData.pyg_cost_personal || '—'}% (Target: ≤22%)\n`;
    context += `  • Operating Expenses: ${pageData.pyg_gastos_venta || '—'}%\n\n`;
  }

  // Suggested Sales
  if (pageData.top_5_products_participation) {
    context += `🎯 SUGGESTED SALES ANALYSIS:\n`;
    context += `  • Today's Suggested: ${pageData.total_suggested || 0} units\n`;
    context += `  • Participation: ${pageData.top_5_products_participation}% of sales\n\n`;
  }

  // Risk Indicators
  context += `⚠️ OPERATIONAL HEALTH:\n`;
  if (pageData.cumplimiento_diario < 80) {
    context += `  • ⛔ Daily Compliance Below 80% — REQUIRES ATTENTION\n`;
  }
  if (pageData.brecha_mes < 0) {
    context += `  • ⛔ Monthly Gap Negative — Below Cumulative Target\n`;
  }
  if (pageData.cumplimiento_proyeccion < 100) {
    context += `  • ⚠️ Month-End Projection Below 100% — Shortfall Risk\n`;
  }
  context += `\n═══════════════════════════════════════════════════════════\n`;

  return context;
}