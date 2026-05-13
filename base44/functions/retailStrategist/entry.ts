import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Eres NOVA, un analista BI retail de ELITE absoluto. Eres la mejor máquina de análisis de números y patrones en retail. PUNTO.

IDENTIDAD CRÍTICA:
- Eres frío, matemático, implacable con datos
- Tu lenguaje es puro: números, percentiles, deviaciones estándar
- NO emocional. NO motivacional. PURO ANÁLISIS.
- Hablas como director financiero de cadena de 500+ tiendas

OBLIGACIONES ABSOLUTAS EN CADA RESPUESTA:
1. MÍNIMO 5-8 números o porcentajes específicos (no nebuloso)
2. Cálculos concretos: deltas %, tasa de crecimiento, impactos $
3. Proyecciones matemáticas (si vende X, tendería a Y)
4. Benchmarks: "retail estándar Colombia: X%", "competencia: Y%"
5. Anomalías detectadas: "rango esperado 8-12%, actual 5.2% = CRÍTICO"
6. ROI o impacto cuantificable de cada recomendación

CUANDO RESPONDES:
- Abre con número más crítico (formato: "CRÍTICO: -8.3% vs tendencia")
- Desglosa cada variable: ventas, tickets, transacciones, eficiencia
- Calcula causa probable: "La caída de 8.3% = 60% menos tickets + 15% ticket menor + 25% de efectivo incobrable"
- Recomienda CON IMPACTO: "Reajustar horarios reduciría costo 12.4% = $2.1M/mes"
- Cierra con probabilidad de éxito: "Cumplimiento esperado con cambio: 91% (vs actual 74%)"

ESTILO NOVA:
- "Venta cayó 12%. Causa: ticket down 8%, tráfico down 4%. Forecast próximos 7d: -15% si no ajustamos. ROI de acción X: +$850K."
- NUNCA: "Las ventas bajaron, hay que motivar."

BENCHMARK RETAIL COLOMBIA ESTÁNDAR:
- Ticket promedio: $35K-$48K
- Transacciones por hora: 12-18
- Conversión: 3.2%-4.8%
- Margen bruto: 42%-48%
- Eficiencia laboral: 120-145 pesos/hora vendida

SIN EXCEPCIÓN:
- Si pregunta es genérica, usa benchmarks reales
- Si tiene datos, haz análisis brutal de esos datos
- SIEMPRE en formato analista BI profesional
- NUNCA chatbot amigable

Eres máquina de análisis. Punto. Habla números, causa, solución, impacto.`;

async function invokeGemini(prompt, context = '') {
  try {
    const fullPrompt = context 
      ? `${SYSTEM_PROMPT}\n\nDATOS TIENDA:\n${context}\n\nANÁLISIS: ${prompt}`
      : `${SYSTEM_PROMPT}\n\nPREGUNTA: ${prompt}\n\nUSA BENCHMARKS RETAIL COLOMBIA si no hay datos específicos.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENAI_API_KEY')
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, selectedStore, selectedRole } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Construir contexto de datos si hay tienda seleccionada
    let context = '';
    
    if (selectedStore) {
      const [todaySales, budget, cashiers, shifts] = await Promise.all([
        base44.entities.DailySales.filter({ store_id: selectedStore }).catch(() => []),
        base44.entities.Budget.filter({ store_id: selectedStore }).catch(() => []),
        base44.entities.Cashier.filter({ store_id: selectedStore, is_active: true }).catch(() => []),
        base44.entities.Shift.filter({ store_id: selectedStore }).catch(() => [])
      ]);

      // Construir contexto inteligente
      if (todaySales.length > 0) {
        const sorted = todaySales.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = sorted[0];
        const prev = sorted[1];
        
        if (latest) {
          const salesChange = prev ? 
            Math.round((latest.total_sales - prev.total_sales) / prev.total_sales * 100) : 0;
          const ticketAvg = latest.total_transactions > 0 ?
            Math.round(latest.total_sales / latest.total_transactions) : 0;
          
          context += `DATOS ACTUALES TIENDA:\n`;
          context += `- Ventas hoy: $${(latest.total_sales / 1000000).toFixed(2)}M\n`;
          context += `- Cambio vs ayer: ${salesChange > 0 ? '+' : ''}${salesChange}%\n`;
          context += `- Transacciones: ${latest.total_transactions}\n`;
          context += `- Ticket promedio: $${(ticketAvg / 1000).toFixed(1)}K\n`;
          
          if (sorted.length > 1) {
            const avg7d = sorted.slice(0, 7).reduce((s, d) => s + d.total_sales, 0) / Math.min(7, sorted.length);
            const trend = latest.total_sales > avg7d ? 'POSITIVA' : 'NEGATIVA';
            context += `- Tendencia 7d: ${trend} (promedio: $${(avg7d / 1000000).toFixed(2)}M)\n`;
          }
        }
      }

      if (budget.length > 0) {
        const activeBudget = budget.find(b => b.is_active);
        if (activeBudget) {
          context += `\nPRESUPUESTO ACTIVO:\n`;
          context += `- Meta ventas: $${(activeBudget.sales_budget / 1000000).toFixed(2)}M\n`;
          context += `- Brecha actual: $${(activeBudget.sales_gap / 1000000).toFixed(2)}M\n`;
        }
      }

      context += `\nEQUIPO: ${cashiers.length} colaboradores activos\n`;
    }

    const response = await invokeGemini(prompt, context);
    
    return Response.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error.message || 'Error procesando solicitud',
      success: false
    }, { status: 500 });
  }
});