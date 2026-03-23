import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Solo procesar create y update eventos de DailySales
    if (event.entity_name !== 'DailySales' || !['create', 'update'].includes(event.type)) {
      return Response.json({ success: true, skipped: true });
    }

    const dailySales = data;
    if (!dailySales || !dailySales.store_id || !dailySales.date) {
      return Response.json({ success: true, skipped: true });
    }

    // Obtener presupuesto del día (DailyBudget)
    const dateStr = dailySales.date?.split('T')[0] || dailySales.date;
    const dailyBudgets = await base44.entities.DailyBudget.filter({
      store_id: dailySales.store_id,
      date: dateStr
    });

    const dailyBudget = dailyBudgets?.[0];
    if (!dailyBudget || !dailyBudget.budget_amount) {
      console.log(`No daily budget found for ${dailySales.store_id} on ${dateStr}`);
      return Response.json({ success: true, skipped: true });
    }

    // Calcular la diferencia (venta - presupuesto)
    // Si venta < presupuesto, la diferencia es negativa (brecha)
    const ventaDelDia = dailySales.total_sales || 0;
    const presupuestoDelDia = dailyBudget.budget_amount;
    const diferenciaDelDia = ventaDelDia - presupuestoDelDia;

    console.log(`Store: ${dailySales.store_id}, Date: ${dateStr}, Sale: ${ventaDelDia}, Budget: ${presupuestoDelDia}, Diff: ${diferenciaDelDia}`);

    // Si la diferencia es negativa, sumarla a la brecha (gap)
    if (diferenciaDelDia < 0) {
      // Obtener el budget activo del mes actual
      const now = new Date(dateStr);
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const budgets = await base44.entities.Budget.filter({
        store_id: dailySales.store_id,
        month: month,
        year: year
      });

      const budget = budgets?.[0];
      if (!budget) {
        console.log(`No budget found for ${dailySales.store_id} in month ${month}/${year}`);
        return Response.json({ success: true, skipped: true });
      }

      // Sumar la diferencia negativa a la brecha existente
      const currentGap = budget.sales_gap || 0;
      const newGap = currentGap + diferenciaDelDia; // diferenciaDelDia es negativo, así suma correctamente

      // Actualizar el sales_gap en el Budget
      await base44.entities.Budget.update(budget.id, {
        sales_gap: newGap
      });

      console.log(`Updated gap for ${dailySales.store_id}: ${currentGap} → ${newGap} (added ${diferenciaDelDia})`);
      return Response.json({ 
        success: true, 
        updated: true,
        storeId: dailySales.store_id,
        date: dateStr,
        previousGap: currentGap,
        newGap: newGap,
        dailyDifference: diferenciaDelDia
      });
    }

    return Response.json({ success: true, skipped: true, reason: 'No negative difference' });
  } catch (error) {
    console.error('Error updating budget gap:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});