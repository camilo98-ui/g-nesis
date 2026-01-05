import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo administradores pueden ajustar presupuestos' }, { status: 403 });
    }

    const { month, year } = await req.json();
    
    // Obtener todas las tiendas activas
    const stores = await base44.asServiceRole.entities.Store.filter({ is_active: true });
    
    // Obtener presupuestos del mes actual
    const currentBudgets = await base44.asServiceRole.entities.Budget.filter({ 
      month, 
      year,
      is_active: true 
    });
    
    // Obtener ventas del mes para análisis de rendimiento
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const allSales = await base44.asServiceRole.entities.DailySales.list();
    
    const results = [];
    
    for (const store of stores) {
      // Encontrar presupuesto de esta tienda
      const budget = currentBudgets.find(b => b.store_id === store.code);
      if (!budget) continue;
      
      // Calcular ventas del mes
      const storeSales = allSales.filter(s => {
        const saleDate = new Date(s.date);
        return s.store_id === store.code && saleDate >= startDate && saleDate <= endDate;
      });
      
      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const performance = budget.sales_budget > 0 ? (totalSales / budget.sales_budget) * 100 : 0;
      
      // Clasificar tienda y determinar incremento
      let classification = '';
      let dailyIncrementPercentage = 0;
      
      if (performance >= 110) {
        classification = 'Excelente';
        dailyIncrementPercentage = 0.08; // 8% incremental diario para crear colchón grande
      } else if (performance >= 100) {
        classification = 'Muy Bien';
        dailyIncrementPercentage = 0.05; // 5% incremental
      } else if (performance >= 90) {
        classification = 'Bien';
        dailyIncrementPercentage = 0.03; // 3% incremental
      } else if (performance >= 80) {
        classification = 'Regular';
        dailyIncrementPercentage = 0.015; // 1.5% incremental
      } else {
        classification = 'Necesita Mejorar';
        dailyIncrementPercentage = 0; // Sin incremento, 100% del promedio
      }
      
      // Calcular días del mes siguiente
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      
      // Presupuesto base diario
      const dailyBase = budget.sales_budget / daysInNextMonth;
      
      // Obtener o crear presupuestos diarios con incremento progresivo
      const dailyBudgets = await base44.asServiceRole.entities.DailyBudget.filter({
        store_id: store.code,
        month: nextMonth,
        year: nextYear
      });
      
      let totalNewBudget = 0;
      
      for (let day = 1; day <= daysInNextMonth; day++) {
        const date = new Date(nextYear, nextMonth - 1, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Incremento progresivo: cada día suma un poco más
        const incrementMultiplier = day / daysInNextMonth; // De 0 a 1
        const dailyIncrement = dailyBase * dailyIncrementPercentage * incrementMultiplier;
        const adjustedDailyBudget = Math.round(dailyBase + dailyIncrement);
        
        totalNewBudget += adjustedDailyBudget;
        
        // Buscar si existe presupuesto para este día
        const existingDaily = dailyBudgets.find(db => db.date === dateStr);
        
        if (existingDaily) {
          await base44.asServiceRole.entities.DailyBudget.update(existingDaily.id, {
            sales_budget: adjustedDailyBudget
          });
        } else {
          await base44.asServiceRole.entities.DailyBudget.create({
            store_id: store.code,
            date: dateStr,
            month: nextMonth,
            year: nextYear,
            sales_budget: adjustedDailyBudget,
            tickets_budget: Math.round((adjustedDailyBudget / (budget.sales_budget || 1)) * (budget.tickets_budget || 0)),
            transactions_budget: Math.round((adjustedDailyBudget / (budget.sales_budget || 1)) * (budget.transactions_budget || 0)),
            suggested_budget: Math.round((adjustedDailyBudget / (budget.sales_budget || 1)) * (budget.suggested_budget || 0))
          });
        }
      }
      
      // Crear o actualizar presupuesto mensual
      const nextMonthBudgets = await base44.asServiceRole.entities.Budget.filter({
        store_id: store.code,
        month: nextMonth,
        year: nextYear
      });
      
      if (nextMonthBudgets.length > 0) {
        await base44.asServiceRole.entities.Budget.update(nextMonthBudgets[0].id, {
          sales_budget: totalNewBudget,
          is_active: true
        });
      } else {
        await base44.asServiceRole.entities.Budget.create({
          store_id: store.code,
          month: nextMonth,
          year: nextYear,
          sales_budget: totalNewBudget,
          tickets_budget: budget.tickets_budget,
          transactions_budget: budget.transactions_budget,
          suggested_budget: budget.suggested_budget,
          is_active: true
        });
      }
      
      results.push({
        store: store.code,
        storeName: store.name,
        performance: performance.toFixed(1),
        classification,
        currentBudget: budget.sales_budget,
        newMonthlyBudget: totalNewBudget,
        increase: ((totalNewBudget - budget.sales_budget) / budget.sales_budget * 100).toFixed(1),
        dailyIncrementPercentage: (dailyIncrementPercentage * 100).toFixed(1)
      });
    }
    
    return Response.json({
      success: true,
      message: `Presupuestos ajustados automáticamente para ${results.length} tiendas`,
      results: results.sort((a, b) => b.performance - a.performance)
    });
    
  } catch (error) {
    console.error('Error ajustando presupuestos:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});