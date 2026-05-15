import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id, store_code } = await req.json();

    if (!store_id && !store_code) {
      return Response.json({ error: 'store_id or store_code required' }, { status: 400 });
    }

    const alerts = [];

    // 1. Verificar si está por debajo del presupuesto diario
    const today = new Date().toISOString().split('T')[0];
    const dailySales = await base44.entities.DailySales.filter({
      store_id: store_id,
      date: today
    });

    const dailyBudgets = await base44.entities.DailyBudget.filter({
      store_id: store_id,
      date: today
    });

    if (dailySales.length > 0 && dailyBudgets.length > 0) {
      const sales = dailySales[0];
      const budget = dailyBudgets[0];
      const variance = ((sales.total_sales || 0) - (budget.daily_budget || 0)) / (budget.daily_budget || 1);

      if (variance < -0.1) { // Más de 10% por debajo
        const gap = (budget.daily_budget || 0) - (sales.total_sales || 0);
        alerts.push({
          type: 'budget_warning',
          severity: variance < -0.2 ? 'critical' : 'warning',
          title: 'Presupuesto en Riesgo',
          message: `Estás ${Math.abs((variance * 100)).toFixed(0)}% por debajo de la meta diaria. Diferencia: $${(gap / 1000000).toFixed(1)}M`,
          data: {
            current_sales: sales.total_sales,
            daily_budget: budget.daily_budget,
            gap: gap,
            variance_pct: (variance * 100).toFixed(1)
          }
        });
      }
    }

    // 2. Verificar cajeros destacados (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const shiftRecords = await base44.entities.ShiftRecord.filter({
      store_id: store_id
    });

    const recentShifts = shiftRecords.filter(s => {
      const shiftDate = new Date(s.date).toISOString().split('T')[0];
      return shiftDate >= yesterdayStr;
    });

    if (recentShifts.length > 0) {
      const salesByCollaborator = {};
      
      recentShifts.forEach(shift => {
        const cashierId = shift.cashier_id;
        if (!salesByCollaborator[cashierId]) {
          salesByCollaborator[cashierId] = {
            name: shift.cashier_name || 'Colaborador',
            total_sales: 0,
            shifts: 0,
            avg_ticket: 0,
            total_tickets: 0
          };
        }
        salesByCollaborator[cashierId].total_sales += shift.sales || 0;
        salesByCollaborator[cashierId].shifts += 1;
        salesByCollaborator[cashierId].total_tickets += shift.tickets || 0;
      });

      // Calcular promedio general
      const avgSales = Object.values(salesByCollaborator).reduce((sum, c) => sum + c.total_sales, 0) / Math.max(Object.keys(salesByCollaborator).length, 1);
      const thresholdPercentage = 1.25; // 25% por encima del promedio

      Object.entries(salesByCollaborator).forEach(([id, collaborator]) => {
        if (collaborator.total_sales > avgSales * thresholdPercentage) {
          collaborator.avg_ticket = collaborator.total_tickets > 0 ? collaborator.total_sales / collaborator.total_tickets : 0;
          const exceeding = collaborator.total_sales - (avgSales * thresholdPercentage);
          
          alerts.push({
            type: 'top_performer',
            severity: 'positive',
            title: 'Cajero Destacado',
            message: `${collaborator.name} destaca con $${(collaborator.total_sales / 1000000).toFixed(1)}M · Ticket: $${(collaborator.avg_ticket / 1000).toFixed(0)}K · ${collaborator.shifts} turno(s)`,
            data: {
              cashier_name: collaborator.name,
              total_sales: collaborator.total_sales,
              avg_ticket: collaborator.avg_ticket,
              shifts: collaborator.shifts,
              exceeding_by: exceeding
            }
          });
        }
      });
    }

    return Response.json({
      store_id,
      store_code,
      timestamp: new Date().toISOString(),
      alert_count: alerts.length,
      alerts: alerts
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});