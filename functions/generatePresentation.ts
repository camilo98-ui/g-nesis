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
    });

    const currentBudget = budgets.find(b => b.month === currentMonth && b.year === currentYear) || {};

    // Calcular métricas
    const totalSales = monthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const totalTickets = monthSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
    const totalTransactions = monthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const totalSuggested = monthSales.reduce((sum, s) => sum + (s.total_suggested || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    const budgetCompliance = currentBudget.sales_budget > 0 ? (totalSales / currentBudget.sales_budget * 100).toFixed(1) : 0;

    // Top 5 cajeros
    const cashierSales = {};
    shiftRecords.forEach(r => {
      if (!cashierSales[r.cashier_id]) cashierSales[r.cashier_id] = 0;
      cashierSales[r.cashier_id] += r.sales || 0;
    });

    const topCashiers = Object.entries(cashierSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, sales]) => {
        const cashier = cashiers.find(c => c.id === id);
        return { name: cashier?.name || 'Unknown', sales };
      });

    // Crear presentación en Google Slides
    const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Reporte ${storeName} - ${currentMonth}/${currentYear}`
      })
    });

    const presentation = await createResponse.json();
    const presentationId = presentation.presentationId;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Eliminar slide por defecto y crear nuevos slides con contenido
    const requests = [
      // Eliminar slide por defecto
      {
        deleteObject: {
          objectId: presentation.slides[0].objectId
        }
      },
      // Slide 1 - Portada
      {
        createSlide: {
          objectId: 'slide1',
          slideLayoutReference: { predefinedLayout: 'TITLE' }
        }
      },
      // Slide 2 - Resumen
      {
        createSlide: {
          objectId: 'slide2',
          slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
        }
      },
      // Slide 3 - Top Cajeros
      {
        createSlide: {
          objectId: 'slide3',
          slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
        }
      }
    ];

    // Primera actualización - crear slides
    const createSlidesResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    });

    await createSlidesResponse.json();

    // Obtener presentación actualizada con los slides creados
    const updatedPresentationResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const updatedPresentation = await updatedPresentationResponse.json();

    // Preparar requests de contenido con los IDs reales
    const slide1 = updatedPresentation.slides[0];
    const slide2 = updatedPresentation.slides[1];
    const slide3 = updatedPresentation.slides[2];

    const contentRequests = [
      // Contenido Slide 1 - Portada
      {
        insertText: {
          objectId: slide1.pageElements.find(e => e.shape?.placeholder?.type === 'CENTERED_TITLE')?.objectId,
          text: `Reporte de Ventas\n${storeName}`
        }
      },
      {
        insertText: {
          objectId: slide1.pageElements.find(e => e.shape?.placeholder?.type === 'SUBTITLE')?.objectId,
          text: `${monthNames[currentMonth - 1]} ${currentYear}\nGenerado: ${new Date().toLocaleDateString('es-CO')}`
        }
      },
      // Contenido Slide 2 - Resumen
      {
        insertText: {
          objectId: slide2.pageElements.find(e => e.shape?.placeholder?.type === 'TITLE')?.objectId,
          text: '📊 Resumen Ejecutivo'
        }
      },
      {
        insertText: {
          objectId: slide2.pageElements.find(e => e.shape?.placeholder?.type === 'BODY')?.objectId,
          text: `💰 Ventas Totales: $${totalSales.toLocaleString('es-CO')}\n\n` +
                `🎯 Cumplimiento de Meta: ${budgetCompliance}%\n\n` +
                `🧾 Ticket Promedio: $${Math.round(avgTicket).toLocaleString('es-CO')}\n\n` +
                `🔢 Total Transacciones: ${totalTransactions.toLocaleString('es-CO')}\n\n` +
                `⭐ Sugeridos Vendidos: ${totalSuggested.toLocaleString('es-CO')}\n\n` +
                `📈 Meta del Mes: $${(currentBudget.sales_budget || 0).toLocaleString('es-CO')}`
        }
      },
      // Contenido Slide 3 - Top Cajeros
      {
        insertText: {
          objectId: slide3.pageElements.find(e => e.shape?.placeholder?.type === 'TITLE')?.objectId,
          text: '🏆 Top 5 Cajeros del Mes'
        }
      },
      {
        insertText: {
          objectId: slide3.pageElements.find(e => e.shape?.placeholder?.type === 'BODY')?.objectId,
          text: topCashiers.length > 0 ? 
            topCashiers.map((c, i) => `${i + 1}. ${c.name}: $${c.sales.toLocaleString('es-CO')}`).join('\n\n')
            : 'No hay datos de cajeros disponibles'
        }
      }
    ];

    // Segunda actualización - agregar contenido
    await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: contentRequests })
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