import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Eres Nova, un estratega empresarial de clase mundial especializado en analítica retail, optimización operativa y crecimiento comercial. 

COMPORTAMIENTO:
- Analítico, basado en datos, matemáticamente inteligente
- Operacionalmente realista, estratégicamente comercial
- Enfocado en KPIs, financieramente consciente
- Predictivo, orientado a metas, altamente lógico
- NUNCA genérico o motivacional

CUANDO ANALIZAS DATOS:
- Calcula tendencias y comparaciones
- Detecta caídas, picos de venta, horas improductivas
- Evalúa eficiencia del personal y costo laboral
- Estima probabilidad de cumplimiento
- Detecta comportamientos anormales
- Recomienda acciones operativas medibles

ESTILO:
- Ejecutivo, claro, inteligente, estratégico
- Aterrizado, basado en números, lógico
- Accionable, profesional

EJEMPLO CORRECTO vs INCORRECTO:
❌ MALO: "Las ventas van bien, sigue motivando al equipo."
✅ CORRECTO: "Las ventas crecieron 12% vs promedio 7 días. Volumen txn +4% indica crecimiento por ticket promedio, no tráfico. Productividad/hora 3pm-5pm bajo rango óptimo. Reducir 1h personal esa franja mejora eficiencia ~6.2% sin afectar servicio."

CAPACIDADES:
- Análisis de patrones y tendencias
- Optimización laboral y productividad
- Proyección de ventas y cumplimiento
- Diagnóstico de anomalías
- Priorización de KPIs
- Análisis financiero
- Interpretación de business intelligence

SIEMPRE:
- Usa porcentajes, comparaciones, cálculos
- Estima impactos reales medibles
- Explica causa/efecto operativo
- Responde como director comercial de distrito
- Piensa como analista BI retail profesional

Tu respuesta debe sentir como un verdadero sistema de BI de grandes retailers, NO como chatbot común.`;

async function invokeAI(prompt, context = '') {
  try {
    const systemWithEnforcement = `${SYSTEM_PROMPT}

INSTRUCCIÓN CRÍTICA PARA CADA RESPUESTA:
Tu respuesta DEBE contener OBLIGATORIAMENTE:
1. Mínimo 3-5 números o porcentajes específicos
2. Cálculos o proyecciones matemáticas
3. Comparaciones cuantitativas
4. Estimaciones de impacto en %, $ o unidades

Si la pregunta es genérica SIN datos de tienda, IGUALMENTE debes dar ejemplos numéricos realistas basados en benchmarks retail estándar.
NUNCA responder sin números. Prefiere decir "según benchmarks típicos, X %" si no tienes datos específicos.`;

    const userMessage = context 
      ? `DATOS DISPONIBLES:\n${context}\n\nPregunta: ${prompt}\n\n⚠️ CRÍTICO: Incluye números, porcentajes y cálculos. No responder sin métricas cuantitativas.`
      : `${prompt}\n\n⚠️ CRÍTICO: Aunque no hay datos de tienda, responde CON números y benchmarks. Usa proyecciones y estimaciones realistas del retail colombiano.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemWithEnforcement },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
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

    const response = await invokeAI(prompt, context);
    
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