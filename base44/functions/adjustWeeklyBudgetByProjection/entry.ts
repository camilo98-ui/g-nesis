import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = await req.json();

    if (!store_id) {
      return Response.json({ error: 'store_id es requerido' }, { status: 400 });
    }

    // Obtener fecha actual
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Calcular inicio y fin de semana (Lunes a Domingo)
    const startOfWeek = new Date(today);
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Si es domingo, retroceder 6 días
    startOfWeek.setDate(today.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    endOfWeek.setHours(23, 59, 59, 999);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // Obtener ventas de la semana
    const allSales = await base44.asServiceRole.entities.DailySales.filter({ store_id });
    const weekSales = allSales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfWeek && saleDate <= today;
    });

    const currentWeekSales = weekSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);

    // Obtener presupuestos diarios de la semana
    const allBudgets = await base44.asServiceRole.entities.DailyBudget.filter({ store_id });
    const weekBudgets = allBudgets.filter(b => {
      const budgetDate = new Date(b.date);
      return budgetDate >= startOfWeek && budgetDate <= endOfWeek;
    });

    const weekBudgetTotal = weekBudgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0);

    // Calcular días transcurridos y restantes
    const daysElapsed = daysSinceMonday + 1; // +1 porque hoy cuenta
    const daysRemaining = 7 - daysElapsed;

    // Calcular proyección
    // Asumir que fines de semana venden más (sábado y domingo)
    const dailyAverage = daysElapsed > 0 ? currentWeekSales / daysElapsed : 0;
    
    // Calcular cuántos días de fin de semana quedan
    const futureDays = [];
    for (let i = 1; i <= daysRemaining; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const futureDay = futureDate.getDay();
      futureDays.push({
        date: formatDate(futureDate),
        isWeekend: futureDay === 0 || futureDay === 6,
        dayOfWeek: futureDay
      });
    }

    const weekendDaysRemaining = futureDays.filter(d => d.isWeekend).length;
    const weekdayDaysRemaining = daysRemaining - weekendDaysRemaining;

    // Proyección ajustada (fin de semana +40% más ventas)
    const weekdayAvg = dailyAverage * 0.9;
    const weekendAvg = dailyAverage * 1.4;
    const projectedSales = currentWeekSales + (weekdayAvg * weekdayDaysRemaining) + (weekendAvg * weekendDaysRemaining);

    const projectedPercentage = weekBudgetTotal > 0 ? (projectedSales / weekBudgetTotal) * 100 : 0;

    // Si proyecta por encima del 100%, ajustar presupuestos
    if (projectedPercentage > 100) {
      // Nuevo presupuesto semanal = proyección con margen de seguridad del 3%
      const newWeekBudget = projectedSales * 1.03;
      const incrementPercentage = ((newWeekBudget / weekBudgetTotal) - 1) * 100;

      // Redistribuir el incremento solo en los días restantes
      const remainingBudget = weekBudgets
        .filter(b => new Date(b.date) > today)
        .reduce((sum, b) => sum + (b.budget_amount || 0), 0);

      const newRemainingBudget = newWeekBudget - currentWeekSales;

      // Calcular multiplicadores para días restantes
      const totalMultiplier = futureDays.reduce((sum, d) => {
        const mult = d.isWeekend ? 1.4 : d.dayOfWeek === 5 ? 1.25 : 1;
        return sum + mult;
      }, 0);

      // Actualizar presupuestos de días futuros
      const updatedBudgets = [];
      for (const futureDay of futureDays) {
        const dayMultiplier = futureDay.isWeekend ? 1.4 : futureDay.dayOfWeek === 5 ? 1.25 : 1;
        const newDailyBudget = totalMultiplier > 0 ? Math.round((newRemainingBudget / totalMultiplier) * dayMultiplier) : 0;

        const existingBudget = weekBudgets.find(b => b.date === futureDay.date);
        if (existingBudget) {
          await base44.asServiceRole.entities.DailyBudget.update(existingBudget.id, {
            budget_amount: newDailyBudget
          });
          updatedBudgets.push({ date: futureDay.date, old: existingBudget.budget_amount, new: newDailyBudget });
        }
      }

      return Response.json({
        success: true,
        adjusted: true,
        weekRange: {
          start: formatDate(startOfWeek),
          end: formatDate(endOfWeek)
        },
        currentWeekSales,
        weekBudgetTotal,
        projectedSales: Math.round(projectedSales),
        projectedPercentage: Math.round(projectedPercentage),
        newWeekBudget: Math.round(newWeekBudget),
        incrementPercentage: Math.round(incrementPercentage * 10) / 10,
        daysElapsed,
        daysRemaining,
        updatedBudgets
      });
    } else {
      return Response.json({
        success: true,
        adjusted: false,
        reason: 'Proyección por debajo del 100%, no se requiere ajuste',
        weekRange: {
          start: formatDate(startOfWeek),
          end: formatDate(endOfWeek)
        },
        currentWeekSales,
        weekBudgetTotal,
        projectedSales: Math.round(projectedSales),
        projectedPercentage: Math.round(projectedPercentage),
        daysElapsed,
        daysRemaining
      });
    }
  } catch (error) {
    console.error('Error adjusting weekly budget:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});