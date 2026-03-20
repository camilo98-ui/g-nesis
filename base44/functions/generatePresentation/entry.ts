import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, storeName, month, year } = await req.json();

    // Obtener access token de Google Slides
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googleslides");

    // Obtener datos de ventas y presupuesto
    const dailySales = await base44.asServiceRole.entities.DailySales.filter({ store_id: storeId });
    const budgets = await base44.asServiceRole.entities.Budget.filter({ store_id: storeId });
    const cashiers = await base44.asServiceRole.entities.Cashier.filter({ store_id: storeId });
    const shiftRecords = await base44.asServiceRole.entities.ShiftRecord.filter({ store_id: storeId });

    // Filtrar datos del mes especificado
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    const monthSales = dailySales.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const currentBudget = budgets.find(b => b.month === currentMonth && b.year === currentYear) || {};

    // Calcular métricas principales
    const totalSales = monthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const totalTickets = monthSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
    const totalTransactions = monthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const totalSuggested = monthSales.reduce((sum, s) => sum + (s.total_suggested || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const budgetCompliance = currentBudget.sales_budget > 0 ? (totalSales / currentBudget.sales_budget * 100).toFixed(1) : 0;
    const remainingBudget = (currentBudget.sales_budget || 0) - totalSales;

    // Análisis de tendencia (primera vs segunda mitad del mes)
    const midPoint = Math.floor(monthSales.length / 2);
    const firstHalf = monthSales.slice(0, midPoint);
    const secondHalf = monthSales.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.total_sales, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.total_sales, 0) / secondHalf.length;
    const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100).toFixed(1) : 0;

    // Día con mejor y peor desempeño
    const bestDay = monthSales.reduce((max, s) => s.total_sales > (max?.total_sales || 0) ? s : max, null);
    const worstDay = monthSales.filter(s => s.total_sales > 0).reduce((min, s) => s.total_sales < (min?.total_sales || Infinity) ? s : min, null);

    // Top 5 cajeros con estadísticas detalladas
    const cashierStats = {};
    shiftRecords.forEach(r => {
      if (!cashierStats[r.cashier_id]) {
        cashierStats[r.cashier_id] = { sales: 0, transactions: 0, tickets: 0, shifts: 0 };
      }
      cashierStats[r.cashier_id].sales += r.sales || 0;
      cashierStats[r.cashier_id].transactions += r.transactions || 0;
      cashierStats[r.cashier_id].tickets += r.tickets || 0;
      cashierStats[r.cashier_id].shifts += 1;
    });

    const topCashiers = Object.entries(cashierStats)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .map(([id, stats]) => {
        const cashier = cashiers.find(c => c.id === id);
        return { 
          name: cashier?.name || 'Unknown', 
          sales: stats.sales,
          avgTicket: stats.transactions > 0 ? stats.sales / stats.transactions : 0,
          shifts: stats.shifts
        };
      });

    // Generar insights con IA
    const insightsPrompt = `Analiza los siguientes datos de ventas y genera 3 insights accionables:
    - Ventas totales: $${totalSales.toLocaleString('es-CO')}
    - Cumplimiento: ${budgetCompliance}%
    - Ticket promedio: $${Math.round(avgTicket).toLocaleString('es-CO')}
    - Tendencia: ${trendPercentage > 0 ? 'Crecimiento' : 'Decrecimiento'} del ${Math.abs(trendPercentage)}%
    - Mejor día: ${bestDay ? new Date(bestDay.date).toLocaleDateString('es-CO') : 'N/A'} con $${(bestDay?.total_sales || 0).toLocaleString('es-CO')}
    
    Proporciona insights breves y accionables en español, en formato de lista.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: insightsPrompt
    });

    const insights = aiResponse || 'Análisis en progreso...';

    // Crear presentación en Google Slides
    const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Reporte Ejecutivo ${storeName} - ${currentMonth}/${currentYear}`
      })
    });

    const presentation = await createResponse.json();
    const presentationId = presentation.presentationId;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Crear slides con contenido
    const allRequests = [
      // Eliminar slide por defecto
      { deleteObject: { objectId: presentation.slides[0].objectId } },
    ];

    // Crear los 5 slides
    for (let i = 1; i <= 5; i++) {
      allRequests.push({
        createSlide: {
          objectId: `slide${i}`,
          slideLayoutReference: { predefinedLayout: 'BLANK' }
        }
      });
    }

    // Función para crear shape con texto
    const addTextBox = (slideId, id, x, y, w, h, text, size, bold, color) => {
      allRequests.push({
        createShape: {
          objectId: id,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: { height: { magnitude: h, unit: 'PT' }, width: { magnitude: w, unit: 'PT' } },
            transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'PT' }
          }
        }
      });
      allRequests.push({ insertText: { objectId: id, text } });
      allRequests.push({
        updateTextStyle: {
          objectId: id,
          style: { 
            fontSize: { magnitude: size, unit: 'PT' }, 
            bold, 
            foregroundColor: { opaqueColor: { rgbColor: color } } 
          },
          fields: 'fontSize,bold,foregroundColor'
        }
      });
    };

    // Fondos
    allRequests.push({ updatePageProperties: { objectId: 'slide1', pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.95, green: 0.3, blue: 0.6 } } } } }, fields: 'pageBackgroundFill' } });
    
    // SLIDE 1 - Portada
    addTextBox('slide1', 'txt1a', 50, 150, 620, 100, 'REPORTE EJECUTIVO DE VENTAS', 44, true, { red: 1, green: 1, blue: 1 });
    addTextBox('slide1', 'txt1b', 50, 270, 620, 80, `${storeName}\n${monthNames[currentMonth - 1]} ${currentYear}`, 28, false, { red: 1, green: 1, blue: 1 });
    addTextBox('slide1', 'txt1c', 50, 420, 620, 30, `Generado: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, false, { red: 0.9, green: 0.9, blue: 0.9 });

    // SLIDE 2 - Resumen
    addTextBox('slide2', 'txt2a', 50, 30, 620, 50, '📊 RESUMEN EJECUTIVO', 32, true, { red: 0.95, green: 0.3, blue: 0.6 });
    addTextBox('slide2', 'txt2b', 50, 120, 300, 80, `💰 VENTAS TOTALES\n$${totalSales.toLocaleString('es-CO')}`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });
    addTextBox('slide2', 'txt2c', 370, 120, 300, 80, `🎯 CUMPLIMIENTO\n${budgetCompliance}%`, 18, false, { red: parseFloat(budgetCompliance) >= 100 ? 0.1 : 0.8, green: parseFloat(budgetCompliance) >= 100 ? 0.6 : 0.3, blue: 0.2 });
    addTextBox('slide2', 'txt2d', 50, 220, 300, 80, `🧾 TICKET PROMEDIO\n$${Math.round(avgTicket).toLocaleString('es-CO')}`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });
    addTextBox('slide2', 'txt2e', 370, 220, 300, 80, `🔢 TRANSACCIONES\n${totalTransactions.toLocaleString('es-CO')}`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });
    addTextBox('slide2', 'txt2f', 50, 320, 300, 80, `⭐ SUGERIDOS\n${totalSuggested.toLocaleString('es-CO')}`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });
    addTextBox('slide2', 'txt2g', 370, 320, 300, 80, `📈 META DEL MES\n$${(currentBudget.sales_budget || 0).toLocaleString('es-CO')}`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });

    // SLIDE 3 - Tendencia
    addTextBox('slide3', 'txt3a', 50, 30, 620, 50, '📈 ANÁLISIS DE TENDENCIA', 32, true, { red: 0.95, green: 0.3, blue: 0.6 });
    addTextBox('slide3', 'txt3b', 50, 120, 620, 100, `Tendencia del Período: ${trendPercentage > 0 ? '↗️ Crecimiento' : '↘️ Decrecimiento'} del ${Math.abs(trendPercentage)}%\n\nComparativa entre primera y segunda mitad del mes muestra ${trendPercentage > 0 ? 'una aceleración positiva' : 'necesidad de reactivación'}.`, 18, false, { red: 0.2, green: 0.2, blue: 0.2 });
    addTextBox('slide3', 'txt3c', 50, 250, 300, 100, `🏆 MEJOR DÍA\n${bestDay ? new Date(bestDay.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }) : 'N/A'}\n$${(bestDay?.total_sales || 0).toLocaleString('es-CO')}`, 16, false, { red: 0.1, green: 0.6, blue: 0.2 });
    addTextBox('slide3', 'txt3d', 370, 250, 300, 100, `⚠️ DÍA MÁS BAJO\n${worstDay ? new Date(worstDay.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }) : 'N/A'}\n$${(worstDay?.total_sales || 0).toLocaleString('es-CO')}`, 16, false, { red: 0.8, green: 0.3, blue: 0.2 });
    addTextBox('slide3', 'txt3e', 50, 380, 620, 60, `📊 Por alcanzar: $${remainingBudget > 0 ? remainingBudget.toLocaleString('es-CO') : '0'} ${remainingBudget > 0 ? '(meta aún no alcanzada)' : '(¡Meta superada!)'}`, 16, false, { red: 0.3, green: 0.3, blue: 0.3 });

    // SLIDE 4 - Top Performers
    const performersText = topCashiers.length > 0 ? 
      topCashiers.map((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} ${c.name}\n   💰 Ventas: $${c.sales.toLocaleString('es-CO')}\n   🧾 Ticket Promedio: $${Math.round(c.avgTicket).toLocaleString('es-CO')}\n   📅 Turnos: ${c.shifts}\n`;
      }).join('\n')
      : 'No hay datos de cajeros disponibles';
    
    addTextBox('slide4', 'txt4a', 50, 30, 620, 50, '🏆 TOP PERFORMERS DEL MES', 32, true, { red: 0.95, green: 0.3, blue: 0.6 });
    addTextBox('slide4', 'txt4b', 50, 120, 620, 320, performersText, 16, false, { red: 0.2, green: 0.2, blue: 0.2 });

    // SLIDE 5 - Insights
    allRequests.push({ updatePageProperties: { objectId: 'slide5', pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.98, green: 0.95, blue: 1 } } } } }, fields: 'pageBackgroundFill' } });
    addTextBox('slide5', 'txt5a', 50, 30, 620, 50, '💡 INSIGHTS Y RECOMENDACIONES', 32, true, { red: 0.5, green: 0.2, blue: 0.8 });
    addTextBox('slide5', 'txt5b', 50, 120, 620, 320, insights, 14, false, { red: 0.2, green: 0.2, blue: 0.2 });

    // Ejecutar todo en un solo batch
    await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: allRequests })
    });

    // Retornar URL de la presentación
    return Response.json({
      success: true,
      presentationId,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      title: `Reporte ${storeName} - ${currentMonth}/${currentYear}`
    });

  } catch (error) {
    console.error('Error generating presentation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});