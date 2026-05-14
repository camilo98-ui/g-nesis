import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';

export function calculateBudgetData(activeBudget, dailySales, dailyBudgets = [], storeId = null) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  if (!activeBudget?.sales_budget) {
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const currentWeekNumber = weeks.findIndex((w) => {
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
    }) + 1;
    return { 
      noBudget: true, 
      currentWeekNumber, 
      totalWeeks: weeks.length, 
      remainingDays: eachDayOfInterval({ start: now, end: monthEnd }).length, 
      currentWeekStart, 
      currentWeekEnd, 
      monthStart, 
      monthEnd,
      excelBudgetForToday: 0
    };
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

  let filteredSales = storeId ? dailySales.filter((s) => s.store_id === storeId) : dailySales;

  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  const fullCurrentRetailWeekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const salesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const countByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const ninetyDaysAgoForAvg = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  filteredSales.forEach((s) => {
    try {
      const saleDate = parseISO(s.date);
      if (saleDate < ninetyDaysAgoForAvg || saleDate >= now) return;
      const dayOfWeek = saleDate.getDay();
      if (s.total_sales && s.total_sales > 0) { salesByDayOfWeek[dayOfWeek] += s.total_sales; countByDayOfWeek[dayOfWeek]++; }
    } catch {}
  });

  const avgByDayOfWeek = salesByDayOfWeek.map((sum, idx) => countByDayOfWeek[idx] > 0 ? sum / countByDayOfWeek[idx] : 0);
  const totalWeeklyAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
  const weightByDayOfWeek = avgByDayOfWeek.map((avg) => totalWeeklyAvg > 0 ? avg / totalWeeklyAvg : 1 / 7);

  const adjustedMonthlyBudget = activeBudget.sales_budget;
  const dailyBaseBudget = adjustedMonthlyBudget / daysInMonth;

  const getDailyBudget = (date) => {
    if (!dailyBaseBudget || dailyBaseBudget <= 0) return 0;
    if (totalWeeklyAvg === 0) return dailyBaseBudget;
    const dayOfWeek = date.getDay();
    if (countByDayOfWeek[dayOfWeek] >= 3) {
      const totalHistoricalAvg = avgByDayOfWeek.reduce((a, b) => a + b, 0);
      const monthlyHistoricalProjection = totalHistoricalAvg * (daysInMonth / 7);
      if (monthlyHistoricalProjection <= 0) return dailyBaseBudget;
      const scaleFactor = adjustedMonthlyBudget / monthlyHistoricalProjection;
      const calculatedBudget = avgByDayOfWeek[dayOfWeek] * scaleFactor;
      return Math.min(calculatedBudget > 0 ? calculatedBudget : dailyBaseBudget, dailyBaseBudget * 1.5);
    } else {
      const weight = weightByDayOfWeek[dayOfWeek];
      if (!weight || weight <= 0) return dailyBaseBudget;
      const weeklyBudget = dailyBaseBudget * 7;
      const calculatedBudget = weeklyBudget * weight;
      return Math.min(calculatedBudget > 0 ? calculatedBudget : dailyBaseBudget, dailyBaseBudget * 1.5);
    }
  };

  const todaySales = filteredSales.find((s) => { try { return isSameDay(parseISO(s.date), now); } catch { return false; } });
  const todayActualSales = todaySales?.total_sales || 0;

  const salesUntilYesterday = filteredSales.filter((s) => {
    try { const saleDate = parseISO(s.date); return saleDate < now && saleDate >= monthStart && saleDate <= monthEnd; } catch { return false; }
  }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const daysUntilYesterday = eachDayOfInterval({ start: monthStart, end: yesterday });
  const budgetUntilYesterday = daysUntilYesterday.reduce((sum, day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const excelRec = dailyBudgets?.find((db) => (db.date?.split('T')[0] || db.date) === dayStr);
    return sum + (excelRec?.budget_amount > 0 ? excelRec.budget_amount : getDailyBudget(day));
  }, 0);
  const accumulatedGap = budgetUntilYesterday - salesUntilYesterday;
  const remainingDays = eachDayOfInterval({ start: now, end: monthEnd }).length;
  const remainingBudget = adjustedMonthlyBudget - salesUntilYesterday - todayActualSales;

  const todayStr = format(now, 'yyyy-MM-dd');
  const excelRec = dailyBudgets?.find((db) => db.store_id === storeId && (db.date?.split('T')[0] || db.date) === todayStr);
  const excelBudgetForToday = excelRec?.budget_amount > 0 ? excelRec.budget_amount : activeBudget.sales_budget / daysInMonth;

  const manualGap = activeBudget.sales_gap !== undefined && activeBudget.sales_gap !== null ? activeBudget.sales_gap : null;
  const effectiveGap = manualGap !== null ? manualGap : -accumulatedGap;

  const targetDayOfWeek = now.getDay();
  const todayWeight = weightByDayOfWeek[targetDayOfWeek] || (1 / 7);
  const dayMultiplier = todayWeight * 7;
  const gapPerDay = accumulatedGap > 0 && remainingDays > 0 ? accumulatedGap / remainingDays : 0;
  const recoveryToday = gapPerDay * dayMultiplier;
  const adjustedDailyBudget = excelBudgetForToday + recoveryToday;
  const gapRecoveryIncrement = recoveryToday;
  const incrementPct = excelBudgetForToday > 0 ? Math.round(recoveryToday / excelBudgetForToday * 100) : 0;

  const currentWeekNumber = weeks.findIndex((w) => {
    const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
    return isWithinInterval(currentWeekStart, { start: w, end: weekEnd });
  }) + 1;

  const currentWeekSales = filteredSales.filter((s) => {
    try { return isWithinInterval(parseISO(s.date), { start: currentWeekStart, end: currentWeekEnd }); } catch { return false; }
  }).reduce((sum, s) => sum + (s.total_sales || 0), 0);

  const weeklyBudget = fullCurrentRetailWeekDays.reduce((sum, day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const excelRec = dailyBudgets?.find((db) => (db.date?.split('T')[0] || db.date) === dayStr);
    return sum + (excelRec?.budget_amount > 0 ? excelRec.budget_amount : getDailyBudget(day));
  }, 0);

  const totalMonthSales = salesUntilYesterday + todayActualSales;
  const daysWithSales = filteredSales.filter(s => {
    try {
      const sd = parseISO(s.date);
      return sd >= monthStart && sd <= now && (s.total_sales || 0) > 0;
    } catch { return false; }
  }).length;
  const daysElapsedCalendar = eachDayOfInterval({ start: monthStart, end: now }).length;
  const effectiveDays = daysWithSales > 0 ? daysWithSales : daysElapsedCalendar;
  const monthAvgDailySales = effectiveDays > 0 ? totalMonthSales / effectiveDays : 0;
  const daysRemainingMonth = daysInMonth - daysElapsedCalendar;
  const monthProjection = totalMonthSales + (monthAvgDailySales * Math.max(daysRemainingMonth, 0));
  const monthProjectionCompliance = adjustedMonthlyBudget > 0 ? monthProjection / adjustedMonthlyBudget * 100 : 0;

  return {
    adjustedDailyBudget, todayActualSales, accumulatedGap, remainingDays, remainingBudget, salesUntilYesterday, budgetUntilYesterday, incrementPct,
    daysElapsed: daysElapsedCalendar,
    compliance: budgetUntilYesterday > 0 ? salesUntilYesterday / budgetUntilYesterday * 100 : 0,
    todayCompliance: adjustedDailyBudget > 0 ? todayActualSales / adjustedDailyBudget * 100 : 0,
    currentWeekNumber, totalWeeks: weeks.length, currentWeekSales, weeklyBudget,
    weeklyCompliance: weeklyBudget > 0 ? currentWeekSales / weeklyBudget * 100 : 0,
    totalMonthSales, avgDailySales: monthAvgDailySales, monthProjection, monthProjectionCompliance,
    monthlyBudget: adjustedMonthlyBudget,
    excelBudgetForToday, gapRecoveryIncrement, monthStart, monthEnd, getDailyBudget, noBudget: false
  };
}