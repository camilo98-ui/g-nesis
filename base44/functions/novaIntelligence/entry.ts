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
    
    // Detect anomalies and generate proactive insights
    const anomalies = detectAnomalies(pageData);
    const proactiveInsights = generateProactiveInsights(pageData, anomalies);

    // Build executive analysis prompt with deep reasoning
    const analysisPrompt = `You are NOVA, an elite business intelligence system operating at world-class analytical sophistication.

YOUR IDENTITY:
- Chief Financial & Operations Analyst
- Executive Intelligence Engine
- Strategic Business Advisor
- Predictive Analytics Specialist
- Operational Diagnostician

CORE PRINCIPLES — YOU MUST FOLLOW THESE STRICTLY:
1. NEVER give shallow generic answers
2. ALWAYS compare periods (daily, weekly, monthly trends)
3. ALWAYS quantify with specific numbers and percentages
4. ALWAYS explain the "why" behind numbers
5. ALWAYS identify cause-and-effect relationships
6. ALWAYS assess operational and financial implications
7. ALWAYS provide specific, actionable recommendations
8. ALWAYS think critically before responding

ANALYTICAL DEPTH REQUIREMENT:
Bad answer: "Sales increased."
Good answer: "Sales increased 12.4% vs. previous month, driven primarily by premium product participation during peak hours (4-8pm). However, EBITDA margin contracted 210 basis points due to labor cost concentration and ingredient inflation, requiring menu price optimization."

ANALYSIS FRAMEWORK YOU MUST USE:
1. Extract core metrics → Analyze patterns → Compare periods
2. Identify anomalies → Determine root causes → Assess impact
3. Evaluate operational health → Detect risks → Highlight opportunities
4. Generate strategic recommendations → Forecast outcomes

DEEP ANALYSIS COMPETENCIES:
✓ EBITDA interpretation and margin analysis
✓ KPI interdependencies (PPT → Brecha → Proyección chain)
✓ Anomaly detection (variance >10% = investigate)
✓ Historical pattern recognition
✓ Operational efficiency metrics
✓ Financial risk assessment
✓ Predictive forecasting
✓ Strategic opportunity identification

DETECTED ANOMALIES & PROACTIVE INSIGHTS:
${proactiveInsights}

BUSINESS DATA CONTEXT:
${analyticContext}

USER QUESTION:
"${userQuery}"

RESPONSE REQUIREMENTS:
1. **Opening**: Direct, insightful answer with key number
2. **Context**: What data shows + how it compares
3. **Deep Analysis**: Root causes, patterns, implications
4. **Anomalies**: Unusual behaviors or deviations
5. **Financial Impact**: EBITDA, profitability, cash implications
6. **Operational Assessment**: Health status and risks
7. **Strategic Recommendations**: Specific, actionable improvements
8. **Forecast**: Expected outcomes if recommendations followed

TONE & STYLE:
- Professional yet accessible
- Quantified and data-driven
- Strategic and forward-thinking
- Proactive in flagging risks
- Executive-level language
- Natural and intelligent conversation

Remember: You are NOT a basic chatbot. You are the central intelligence system of this business. Think deeply. Reason clearly. Communicate powerfully.`;

    // Use advanced Claude model with extended thinking capability
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      model: 'claude_sonnet_4_6'
    });

    return Response.json({ 
      analysis: response,
      anomalies,
      proactiveInsights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Nova Intelligence Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function detectAnomalies(pageData) {
  const anomalies = [];

  if (!pageData) return anomalies;

  // Daily compliance anomalies
  if (pageData.cumplimiento_diario !== null && pageData.cumplimiento_diario < 80) {
    anomalies.push({
      type: 'CRITICAL',
      metric: 'Daily Compliance',
      value: `${pageData.cumplimiento_diario}%`,
      threshold: '80%',
      message: 'Daily sales compliance critically below target — immediate intervention required'
    });
  }

  // Ticket average anomaly
  if (pageData.ticket_promedio_hoy && pageData.ticket_promedio_hoy < 50000) {
    anomalies.push({
      type: 'WARNING',
      metric: 'Ticket Average',
      value: `$${(pageData.ticket_promedio_hoy/1000).toFixed(0)}K`,
      threshold: '$50K',
      message: 'Average ticket below healthy threshold — opportunity to upsell or revise pricing'
    });
  }

  // Monthly gap anomaly
  if (pageData.brecha_mes !== null && pageData.brecha_mes < 0) {
    const gapPct = pageData.monthlyBudget ? Math.abs(pageData.brecha_mes / pageData.monthlyBudget * 100) : 0;
    anomalies.push({
      type: 'CRITICAL',
      metric: 'Monthly Gap',
      value: `$${Math.abs(pageData.brecha_mes/1000).toFixed(0)}K (${gapPct.toFixed(1)}%)`,
      threshold: 'Positive',
      message: `Cumulative sales lag behind PPT by ${gapPct.toFixed(1)}% — recovery required in remaining days`
    });
  }

  // Projection anomaly
  if (pageData.cumplimiento_proyeccion !== null && pageData.cumplimiento_proyeccion < 100) {
    anomalies.push({
      type: 'WARNING',
      metric: 'Month-End Projection',
      value: `${pageData.cumplimiento_proyeccion.toFixed(1)}%`,
      threshold: '100%',
      message: `Projected shortfall of ${(100 - pageData.cumplimiento_proyeccion).toFixed(1)}% — strategic intervention needed`
    });
  }

  // Daily variation anomaly
  if (pageData.variacion_vs_ayer !== null && pageData.variacion_vs_ayer < -15) {
    anomalies.push({
      type: 'WARNING',
      metric: 'Daily Variation',
      value: `${pageData.variacion_vs_ayer.toFixed(1)}%`,
      threshold: '-15%',
      message: 'Sales dropped significantly versus yesterday — investigate cause'
    });
  }

  return anomalies;
}

function generateProactiveInsights(pageData, anomalies) {
  const insights = [];

  if (!pageData) return insights;

  // Strong performance insight
  if (pageData.cumplimiento_diario > 110 && pageData.ticket_promedio_hoy > 80000) {
    insights.push('⭐ Exceptional daily performance: Both compliance and ticket average exceed targets significantly. Analyze successful tactics for replication.');
  }

  // Suggested sales insight
  if (pageData.total_suggested && pageData.total_suggested < 30) {
    insights.push('⚠️ Low suggested sales volume: Only ' + pageData.total_suggested + ' units. Staff coaching needed on upselling techniques.');
  }

  // Trend analysis insight
  if (pageData.trend_7d && pageData.trend_7d > 5) {
    insights.push('📈 Positive weekly trend: ' + pageData.trend_7d.toFixed(1) + '% growth. Momentum should be leveraged through expanded promotion.');
  } else if (pageData.trend_7d && pageData.trend_7d < -5) {
    insights.push('📉 Negative weekly trend: ' + pageData.trend_7d.toFixed(1) + '% decline. Root cause analysis required urgently.');
  }

  // EBITDA insight
  if (pageData.pyg_ebitda_margin && pageData.pyg_ebitda_margin < 20) {
    insights.push('💹 EBITDA margin below healthy range (' + pageData.pyg_ebitda_margin + '%): Cost structure review required. Focus on labor and ingredient efficiency.');
  }

  // Personnel cost insight
  if (pageData.pyg_cost_personal && pageData.pyg_cost_personal > 24) {
    insights.push('👥 Personnel costs elevated (' + pageData.pyg_cost_personal + '%). Staffing optimization and productivity enhancement needed.');
  }

  return {
    criticalAnomalies: anomalies.filter(a => a.type === 'CRITICAL').length,
    warningAnomalies: anomalies.filter(a => a.type === 'WARNING').length,
    proactiveOpportunities: insights,
    fullAnomalies: anomalies
  };
}

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