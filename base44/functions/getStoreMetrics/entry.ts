import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = await req.json();
    
    if (!store_id) {
      return Response.json({ error: 'store_id required' }, { status: 400 });
    }

    // Fetch all required data in parallel
    const [dailySales, budgets, weatherData, shiftRecords, cashiers] = await Promise.all([
      base44.entities.DailySales.filter({ store_id }),
      base44.entities.Budget.filter({ store_id }),
      fetchWeather(),
      base44.entities.ShiftRecord.filter({ store_id }),
      base44.entities.Cashier.filter({ store_id, is_active: true })
    ]);

    // Calculate current month metrics
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const currentMonthSales = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= monthStart && saleDate <= now;
    });

    const monthTotals = currentMonthSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });

    // Get current budget - MISMO FILTRO que Dashboard
    const currentBudget = budgets.find(b => 
      Number(b.month) === now.getMonth() + 1 && 
      Number(b.year) === now.getFullYear() &&
      b.is_active === true
    ) || budgets.find(b => 
      Number(b.month) === now.getMonth() + 1 && 
      Number(b.year) === now.getFullYear()
    ) || {};

    // Calculate today's sales
    const today = format(now, 'yyyy-MM-dd');
    const todayData = dailySales.find(s => {
      const saleDate = s.date?.split('T')[0] || s.date;
      return saleDate === today;
    }) || {};

    // Calculate projections
    const daysElapsed = differenceInDays(now, monthStart) + 1;
    const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const daysRemaining = totalDaysInMonth - daysElapsed;
    
    const dailyAvg = daysElapsed > 0 ? monthTotals.sales / daysElapsed : 0;
    const projectedSales = monthTotals.sales + (dailyAvg * daysRemaining);
    const salesGap = currentBudget.sales_budget ? currentBudget.sales_budget - monthTotals.sales : 0;

    // Latest weather
    const latestWeather = weatherData?.history ? 
      getLatestWeatherRecord(weatherData.history) : null;

    return Response.json({
      store_id,
      today: {
        date: today,
        sales: todayData.total_sales || 0,
        transactions: todayData.total_transactions || 0,
        tickets: todayData.total_tickets || 0,
        suggested: todayData.total_suggested || 0,
        avgTicket: todayData.total_transactions > 0 ? todayData.total_sales / todayData.total_transactions : 0
      },
      month: {
        sales: monthTotals.sales,
        transactions: monthTotals.transactions,
        tickets: monthTotals.tickets,
        suggested: monthTotals.suggested,
        avgTicket: monthTotals.transactions > 0 ? monthTotals.sales / monthTotals.transactions : 0,
        daysElapsed,
        totalDays: totalDaysInMonth,
        daysRemaining
      },
      projections: {
        projectedSales,
        dailyAverage: dailyAvg,
        salesGap,
        requiredDailySales: daysRemaining > 0 ? salesGap / daysRemaining : 0,
        onTrack: projectedSales >= (currentBudget.sales_budget || 0) * 0.95
      },
      budget: {
        sales_budget: currentBudget.sales_budget || 0,
        tickets_budget: currentBudget.tickets_budget || 0,
        transactions_budget: currentBudget.transactions_budget || 0,
        suggested_budget: currentBudget.suggested_budget || 0,
        sales_gap: currentBudget.sales_gap || null,
        is_active: currentBudget.is_active || false,
        compliance: currentBudget.sales_budget ? 
          Math.round((monthTotals.sales / currentBudget.sales_budget) * 100) : 0,
        source: 'Budget entity'
      },
      weather: latestWeather ? {
        temperature: latestWeather.temperature_mean,
        temperature_max: latestWeather.temperature_max,
        temperature_min: latestWeather.temperature_min,
        precipitation: latestWeather.precipitation_sum,
        humidity: latestWeather.relative_humidity_2m_mean
      } : null,
      team: {
        activeEmployees: cashiers.length,
        topPerformers: cashiers.slice(0, 3).map(c => ({
          name: c.name,
          position: c.position
        }))
      },
      metrics: {
        traffic: monthTotals.transactions,
        conversionRate: monthTotals.transactions > 0 ? 
          (monthTotals.sales / monthTotals.transactions / 1000).toFixed(1) : 0,
        suggestedPenetration: monthTotals.transactions > 0 ?
          (monthTotals.suggested / monthTotals.transactions * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error in getStoreMetrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchWeather() {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);

    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=4.6097&longitude=-74.0817&start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}&daily=weathercode,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&timezone=America%2FBogota`
    );
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Weather fetch error:', e);
    return null;
  }
}

function getLatestWeatherRecord(history) {
  if (!history || !history.time || history.time.length === 0) return null;
  
  const lastIdx = history.time.length - 1;
  return {
    date: history.time[lastIdx],
    temperature_mean: history.temperature_2m_mean?.[lastIdx] ?? 0,
    temperature_max: history.temperature_2m_max?.[lastIdx] ?? 0,
    temperature_min: history.temperature_2m_min?.[lastIdx] ?? 0,
    precipitation_sum: history.precipitation_sum?.[lastIdx] ?? 0,
    relative_humidity_2m_mean: history.relative_humidity_2m_mean?.[lastIdx] ?? 0,
    weathercode: history.weathercode?.[lastIdx] ?? 0
  };
}