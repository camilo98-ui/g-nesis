import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  parseISO, isWithinInterval, startOfMonth, endOfMonth,
  subDays, differenceInCalendarDays, format
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  fmtM, fmtCOP, TARGETS, getStoreStatus, calcPerformanceScore
} from './gerenteUtils';

const PALETTE = ['#C21875', '#e91e8c', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function useGerenteData(district, startDate, endDate) {
  const [selectedHourlyStore, setSelectedHourlyStore] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  /* ── Date constants ── */
  const dc = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return {
      now, currentMonth, currentYear, prevMonth, prevYear,
      monthStart: startOfMonth(now), monthEnd: endOfMonth(now),
      daysElapsed: now.getDate(), daysInMonth: endOfMonth(now).getDate(),
    };
  }, []);

  const daysInRange = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);

  /* ── Data fetching ── */
  const q1 = useQuery({ queryKey: ['gerente-daily-sales'], queryFn: () => base44.entities.DailySales.list('-date', 5000), staleTime: 3 * 60 * 1000 });
  const q2 = useQuery({ queryKey: ['gerente-budgets', dc.currentMonth, dc.currentYear], queryFn: () => base44.entities.Budget.filter({ month: dc.currentMonth, year: dc.currentYear }), staleTime: 10 * 60 * 1000 });
  const q3 = useQuery({ queryKey: ['gerente-pyg'], queryFn: () => base44.entities.PYGReport.list('-created_date', 500), staleTime: 10 * 60 * 1000 });
  const q4 = useQuery({ queryKey: ['all-stores'], queryFn: () => base44.entities.Store.list('-created_date', 1000), staleTime: 60 * 60 * 1000 });
  const q5 = useQuery({ queryKey: ['gerente-nps'], queryFn: () => base44.entities.StoreNPS.list('-created_date', 500), staleTime: 10 * 60 * 1000 });
  const q6 = useQuery({ queryKey: ['gerente-hourly-tx', dc.currentMonth, dc.currentYear], queryFn: () => base44.entities.StoreTransactions.filter({ month: dc.currentMonth, year: dc.currentYear }), staleTime: 10 * 60 * 1000 });
  const q7 = useQuery({ queryKey: ['gerente-aggregators-all'], queryFn: () => base44.entities.AggregatorsData.list('-created_date', 2000), staleTime: 10 * 60 * 1000 });
  const q8 = useQuery({ queryKey: ['gerente-sales-reports', dc.currentMonth, dc.currentYear], queryFn: () => base44.entities.SalesReport.filter({ month: dc.currentMonth, year: dc.currentYear }), staleTime: 10 * 60 * 1000 });

  const allDailySales = q1.data || [];
  const allBudgets = q2.data || [];
  const allPYG = q3.data || [];
  const storeEntities = q4.data || [];
  const allNPS = q5.data || [];
  const allHourlyTx = q6.data || [];
  const allAggregators = q7.data || [];
  const allSalesReports = q8.data || [];

  const isLoading = q1.isLoading || q4.isLoading;

  const refresh = useCallback(() => {
    q1.refetch(); q2.refetch(); q3.refetch(); q4.refetch();
    q5.refetch(); q6.refetch(); q7.refetch(); q8.refetch();
    setLastUpdate(new Date());
  }, [q1, q2, q3, q4, q5, q6, q7, q8]);

  /* ── Filter stores by district ── */
  const stores = useMemo(() => {
    let s = storeEntities.filter(x => x.is_active !== false);
    if (district) s = s.filter(x => (x.district || '').toUpperCase() === district.toUpperCase());
    return s;
  }, [storeEntities, district]);

  /* ── Lookup maps ── */
  const lookups = useMemo(() => {
    const budgetByCode = {};
    allBudgets.forEach(b => { budgetByCode[(b.store_id || '').trim()] = b; });

    const pygByCode = {};
    const prevPygByCode = {};
    allPYG.forEach(p => {
      const k = (p.store_code || '').trim();
      if (p.month === dc.currentMonth && p.year === dc.currentYear) pygByCode[k] = p;
      else if (p.month === dc.prevMonth && p.year === dc.prevYear) prevPygByCode[k] = p;
    });
    // Fallback: use latest if no current month data
    allPYG.forEach(p => {
      const k = (p.store_code || '').trim();
      if (!pygByCode[k]) {
        if (!pygByCode[k] || new Date(p.created_date) > new Date(pygByCode[k].created_date)) pygByCode[k] = p;
      }
    });

    const currentNpsByCode = {};
    const prevNpsByCode = {};
    allNPS.forEach(n => {
      const k = (n.store_code || '').trim();
      if (n.month === dc.currentMonth && n.year === dc.currentYear) currentNpsByCode[k] = n.score;
      else if (n.month === dc.prevMonth && n.year === dc.prevYear) prevNpsByCode[k] = n.score;
    });

    return { budgetByCode, pygByCode, prevPygByCode, currentNpsByCode, prevNpsByCode };
  }, [allBudgets, allPYG, allNPS, dc.currentMonth, dc.currentYear, dc.prevMonth, dc.prevYear]);

  /* ── Group DailySales by store code ── */
  const salesByCode = useMemo(() => {
    const map = {};
    allDailySales.forEach(d => {
      const k = (d.store_id || '').trim();
      (map[k] = map[k] || []).push(d);
    });
    return map;
  }, [allDailySales]);

  /* ── Compute per-store data ── */
  const storeData = useMemo(() => {
    const rangeInterval = { start: startDate, end: endDate };
    const prevStart = subDays(startDate, daysInRange);
    const prevEnd = subDays(startDate, 1);
    const prevInterval = { start: prevStart, end: prevEnd };
    const monthInterval = { start: dc.monthStart, end: dc.now };

    const filterByInterval = (arr, interval) => arr.filter(d => {
      try { return isWithinInterval(parseISO(d.date), interval); } catch { return false; }
    });

    // First pass: raw metrics
    const rawData = stores.map((store, i) => {
      const code = (store.code || '').trim();
      const allSales = salesByCode[code] || [];

      const rangeArr = filterByInterval(allSales, rangeInterval);
      const prevRangeArr = filterByInterval(allSales, prevInterval);
      const monthArr = filterByInterval(allSales, monthInterval);

      const rangeSales = rangeArr.reduce((s, d) => s + (d.total_sales || 0), 0);
      const rangeTx = rangeArr.reduce((s, d) => s + (d.total_transactions || 0), 0);
      const prevRangeSales = prevRangeArr.reduce((s, d) => s + (d.total_sales || 0), 0);
      const prevRangeTx = prevRangeArr.reduce((s, d) => s + (d.total_transactions || 0), 0);
      const monthSales = monthArr.reduce((s, d) => s + (d.total_sales || 0), 0);

      const monthlyBudget = lookups.budgetByCode[code]?.sales_budget || 0;
      const pyg = lookups.pygByCode[code] || null;
      const prevPyg = lookups.prevPygByCode[code] || null;
      const nps = lookups.currentNpsByCode[code] ?? null;
      const prevNps = lookups.prevNpsByCode[code] ?? null;

      const avgDailyMonth = dc.daysElapsed > 0 ? monthSales / dc.daysElapsed : 0;
      const projection = monthSales + avgDailyMonth * (dc.daysInMonth - dc.daysElapsed);
      const compliance = monthlyBudget > 0 ? (monthSales / monthlyBudget) * 100 : null;
      const projCompliance = monthlyBudget > 0 ? (projection / monthlyBudget) * 100 : null;
      const avgTicket = rangeTx > 0 ? rangeSales / rangeTx : 0;
      const prevAvgTicket = prevRangeTx > 0 ? prevRangeSales / prevRangeTx : 0;

      const hasData = monthSales > 0 || rangeSales > 0;
      const hasBudget = monthlyBudget > 0;
      const hasPYG = pyg != null;
      const hasNPS = nps != null;

      const salesVar = prevRangeSales > 0 ? ((rangeSales - prevRangeSales) / prevRangeSales) * 100 : null;
      const txVar = prevRangeTx > 0 ? ((rangeTx - prevRangeTx) / prevRangeTx) * 100 : null;
      const ticketVar = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : null;
      const ebitdaVar = (pyg?.margen_ebitda != null && prevPyg?.margen_ebitda != null)
        ? (pyg.margen_ebitda * 100) - (prevPyg.margen_ebitda * 100) : null;
      const npsVar = (nps != null && prevNps != null) ? nps - prevNps : null;

      const status = getStoreStatus(compliance, hasData);
      const color = PALETTE[i % PALETTE.length];
      const shortName = store.code || `T${i + 1}`;
      const name = store.name || shortName;

      return {
        code, name, shortName, color,
        rangeSales, rangeTx, prevRangeSales, prevRangeTx, monthSales, monthlyBudget,
        projection, compliance, projCompliance, avgTicket,
        ebitda: pyg?.margen_ebitda != null ? pyg.margen_ebitda * 100 : null,
        pyg, nps, hasData, hasBudget, hasPYG, hasNPS,
        salesVar, txVar, ticketVar, ebitdaVar, npsVar,
        status, performanceScore: 0, score: 0,
      };
    });

    // Compute district averages for performance score
    const withData = rawData.filter(d => d.hasData);
    const totalTx = withData.reduce((s, d) => s + d.rangeTx, 0);
    const totalSales = withData.reduce((s, d) => s + d.rangeSales, 0);
    const districtAvg = {
      avgTx: withData.length > 0 ? totalTx / withData.length : 0,
      avgTicket: totalTx > 0 ? totalSales / totalTx : 0,
    };

    // Second pass: add performance scores
    return rawData.map(d => {
      const score = d.hasData ? calcPerformanceScore(d, districtAvg) : 0;
      return { ...d, performanceScore: score, score };
    });
  }, [stores, salesByCode, lookups, startDate, endDate, daysInRange, dc.monthStart, dc.now, dc.daysElapsed, dc.daysInMonth]);

  /* ── District totals ── */
  const districtTotals = useMemo(() => {
    const totalRangeSales = storeData.reduce((s, d) => s + d.rangeSales, 0);
    const totalMonthSales = storeData.reduce((s, d) => s + d.monthSales, 0);
    const totalBudget = storeData.reduce((s, d) => s + d.monthlyBudget, 0);
    const totalProjection = storeData.reduce((s, d) => s + d.projection, 0);
    const totalRangeTx = storeData.reduce((s, d) => s + d.rangeTx, 0);
    const prevTotalRangeSales = storeData.reduce((s, d) => s + d.prevRangeSales, 0);
    const prevTotalRangeTx = storeData.reduce((s, d) => s + d.prevRangeTx, 0);
    const compliance = totalBudget > 0 ? (totalMonthSales / totalBudget) * 100 : null;
    const projCompliance = totalBudget > 0 ? (totalProjection / totalBudget) * 100 : null;

    let ebitdaNum = 0, ebitdaDen = 0;
    storeData.forEach(d => {
      if (d.pyg?.margen_ebitda != null && d.monthSales > 0) { ebitdaNum += d.pyg.margen_ebitda * d.monthSales; ebitdaDen += d.monthSales; }
    });
    const ebitda = ebitdaDen > 0 ? (ebitdaNum / ebitdaDen) * 100 : null;

    const avgTicket = totalRangeTx > 0 ? totalRangeSales / totalRangeTx : 0;
    const npsScores = storeData.filter(d => d.nps != null).map(d => d.nps);
    const avgNPS = npsScores.length > 0 ? npsScores.reduce((s, n) => s + n, 0) / npsScores.length : null;
    const hasData = storeData.some(d => d.hasData);

    return {
      totalRangeSales, totalMonthSales, totalBudget, totalProjection, totalRangeTx,
      prevTotalRangeSales, prevTotalRangeTx, compliance, projCompliance, ebitda, avgTicket, avgNPS, hasData,
      storesCount: storeData.length,
    };
  }, [storeData]);

  /* ── Variations ── */
  const variations = useMemo(() => {
    const salesVar = districtTotals.prevTotalRangeSales > 0
      ? ((districtTotals.totalRangeSales - districtTotals.prevTotalRangeSales) / districtTotals.prevTotalRangeSales) * 100 : null;
    const txVar = districtTotals.prevTotalRangeTx > 0
      ? ((districtTotals.totalRangeTx - districtTotals.prevTotalRangeTx) / districtTotals.prevTotalRangeTx) * 100 : null;
    const prevAvgTicket = districtTotals.prevTotalRangeTx > 0
      ? districtTotals.prevTotalRangeSales / districtTotals.prevTotalRangeTx : 0;
    const ticketVar = prevAvgTicket > 0 ? ((districtTotals.avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : null;

    let ebitdaVarNum = 0, ebitdaVarDen = 0;
    storeData.forEach(d => {
      if (d.ebitdaVar != null && d.monthSales > 0) { ebitdaVarNum += d.ebitdaVar * d.monthSales; ebitdaVarDen += d.monthSales; }
    });
    const ebitdaVar = ebitdaVarDen > 0 ? ebitdaVarNum / ebitdaVarDen : null;

    const npsVars = storeData.filter(d => d.npsVar != null);
    const npsVar = npsVars.length > 0 ? npsVars.reduce((s, d) => s + d.npsVar, 0) / npsVars.length : null;

    return { salesVar, txVar, ticketVar, ebitdaVar, npsVar };
  }, [districtTotals, storeData]);

  /* ── Hourly data ── */
  const hourlyData = useMemo(() => {
    const codes = new Set(stores.map(s => (s.code || '').trim()));
    const records = allHourlyTx.filter(r => {
      const code = (r.store_code || '').trim();
      if (!codes.has(code)) return false;
      if (selectedHourlyStore && code !== selectedHourlyStore) return false;
      return true;
    });
    const result = { daysElapsed: dc.daysElapsed };
    HOURS.forEach(h => { result[h] = 0; });
    records.forEach(r => { HOURS.forEach(h => { result[h] += r[`hour_${h}`] || 0; }); });
    return result;
  }, [allHourlyTx, stores, selectedHourlyStore, dc.daysElapsed]);

  /* ── Info status ── */
  const { infoSources, infoIndex } = useMemo(() => {
    const total = stores.length;
    const codes = new Set(stores.map(s => (s.code || '').trim()));

    const count = (arr, codeField, filterFn) => {
      const seen = new Set();
      arr.forEach(r => {
        const code = (r[codeField] || '').trim();
        if (codes.has(code) && !seen.has(code) && (!filterFn || filterFn(r))) seen.add(code);
      });
      return seen.size;
    };

    const sources = [
      { name: 'PPT Excel', loaded: count(allBudgets, 'store_id'), total, status: '' },
      { name: 'KPIs Participación', loaded: count(allSalesReports, 'store_code'), total, status: '' },
      { name: 'Agregadores', loaded: count(allAggregators, 'store_code'), total, status: '' },
      { name: 'P&G Upload', loaded: count(allPYG, 'store_code'), total, status: '' },
      { name: 'NPS Distrito', loaded: count(allNPS, 'store_code', n => n.month === dc.currentMonth && n.year === dc.currentYear), total, status: '' },
      { name: 'Txn por Hora', loaded: count(allHourlyTx, 'store_code'), total, status: '' },
    ];

    sources.forEach(s => {
      s.status = s.loaded === total ? 'completo' : s.loaded > 0 ? 'parcial' : 'pendiente';
    });

    const totalLoaded = sources.reduce((s, src) => s + src.loaded, 0);
    const totalPossible = sources.reduce((s, src) => s + src.total, 0);
    const index = totalPossible > 0 ? (totalLoaded / totalPossible) * 100 : 0;

    return { infoSources: sources, infoIndex: index };
  }, [stores, allBudgets, allSalesReports, allAggregators, allPYG, allNPS, allHourlyTx, dc.currentMonth, dc.currentYear]);

  /* ── Attention items ── */
  const attentionItems = useMemo(() => {
    if (storeData.length === 0) return [];
    const items = [];

    storeData.filter(s => s.status?.priority === 4).forEach(s => {
      items.push({
        code: s.code, name: s.name, status: 'CRÍTICO', color: '#ef4444',
        metrics: [
          { label: 'Cumpl.', value: `${(s.compliance ?? 0).toFixed(0)}%`, color: '#ef4444' },
          { label: 'EBITDA', value: s.pyg?.margen_ebitda != null ? `${(s.pyg.margen_ebitda * 100).toFixed(1)}%` : '—' },
          { label: 'NPS', value: s.nps != null ? s.nps.toFixed(0) : '—' },
          { label: 'Tx', value: s.txVar != null ? `${s.txVar >= 0 ? '+' : ''}${s.txVar.toFixed(0)}%` : '—', color: s.txVar != null && s.txVar < 0 ? '#ef4444' : '#10b981' },
        ],
      });
    });

    storeData.filter(s => s.status?.priority === 2).forEach(s => {
      items.push({
        code: s.code, name: s.name, status: 'EN RIESGO', color: '#f59e0b',
        metrics: [
          { label: 'Cumpl.', value: `${(s.compliance ?? 0).toFixed(0)}%`, color: '#f59e0b' },
          { label: 'EBITDA', value: s.pyg?.margen_ebitda != null ? `${(s.pyg.margen_ebitda * 100).toFixed(1)}%` : '—' },
          { label: 'NPS', value: s.nps != null ? s.nps.toFixed(0) : '—' },
          { label: 'Ticket', value: s.avgTicket > 0 ? fmtM(s.avgTicket) : '—' },
        ],
      });
    });

    storeData.filter(s => s.status?.priority === 5).forEach(s => {
      items.push({
        code: s.code, name: s.name, status: 'SIN INFO', color: '#94a3b8',
        metrics: [{ label: 'Estado', value: 'Pendiente' }],
      });
    });

    const pgPending = storeData.filter(s => !s.hasPYG).length;
    if (pgPending > 0) {
      items.push({
        code: null, name: 'P&G Pendiente', status: 'PENDIENTE', color: '#f59e0b',
        metrics: [{ label: 'Tiendas', value: `${pgPending}` }, { label: 'De', value: `${storeData.length}` }],
      });
    }

    return items;
  }, [storeData]);

  /* ── Drivers ── */
  const drivers = useMemo(() => {
    const positive = [];
    const negative = [];

    const addDriver = (label, value, detail, isPositive) => {
      (isPositive ? positive : negative).push({ label, value, detail });
    };

    if (variations.salesVar != null) {
      addDriver('Ventas del período', `${variations.salesVar >= 0 ? '+' : ''}${variations.salesVar.toFixed(1)}%`, 'vs período anterior', variations.salesVar >= 0);
    }
    if (variations.ticketVar != null) {
      addDriver('Ticket promedio', `${variations.ticketVar >= 0 ? '+' : ''}${variations.ticketVar.toFixed(1)}%`, 'vs período anterior', variations.ticketVar >= 0);
    }
    if (variations.txVar != null) {
      addDriver('Transacciones', `${variations.txVar >= 0 ? '+' : ''}${variations.txVar.toFixed(1)}%`, 'vs período anterior', variations.txVar >= 0);
    }
    if (variations.ebitdaVar != null) {
      addDriver('EBITDA', `${variations.ebitdaVar >= 0 ? '+' : ''}${variations.ebitdaVar.toFixed(1)} pp`, 'vs mes anterior', variations.ebitdaVar >= 0);
    }
    if (variations.npsVar != null) {
      addDriver('NPS Distrito', `${variations.npsVar >= 0 ? '+' : ''}${variations.npsVar.toFixed(0)} pts`, 'vs mes anterior', variations.npsVar >= 0);
    }

    const underBudget = storeData.filter(s => s.hasData && (s.compliance ?? 0) < 100).length;
    if (underBudget > 0) addDriver('Tiendas bajo presupuesto', `${underBudget} de ${storeData.length}`, 'requieren atención', false);
    const overBudget = storeData.filter(s => s.hasData && (s.compliance ?? 0) >= 100).length;
    if (overBudget > 0) addDriver('Tiendas sobre presupuesto', `${overBudget}`, 'superando meta', true);
    const sinInfo = storeData.filter(s => !s.hasData).length;
    if (sinInfo > 0) addDriver('Tiendas sin información', `${sinInfo}`, 'sin ventas cargadas', false);

    return { positive, negative };
  }, [variations, storeData]);

  /* ── Ranking ── */
  const ranking = useMemo(() => {
    return [...storeData]
      .filter(s => s.hasData)
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .map(s => ({ code: s.code, name: s.name, score: s.performanceScore, color: s.color, status: s.status }));
  }, [storeData]);

  /* ── Insight ── */
  const insight = useMemo(() => {
    if (!districtTotals.hasData) return null;
    const opportunities = [];

    if (districtTotals.avgTicket > 0 && districtTotals.totalRangeTx > 0) {
      const ticketGap = Math.max(0, (TARGETS.ticket - districtTotals.avgTicket) * districtTotals.totalRangeTx);
      if (ticketGap > 0) {
        const monthlyGap = ticketGap * (dc.daysInMonth / daysInRange);
        opportunities.push({
          text: `Si todas las tiendas alcanzan el ticket promedio objetivo de ${fmtCOP(TARGETS.ticket)}, el distrito podría incrementar aproximadamente ${fmtM(monthlyGap)} en ventas mensuales.`,
          impactLabel: `+${fmtM(monthlyGap)} oportunidad`,
          impactValue: monthlyGap,
        });
      }
    }

    if (districtTotals.totalBudget > 0 && districtTotals.totalMonthSales < districtTotals.totalBudget) {
      const gap = districtTotals.totalBudget - districtTotals.totalMonthSales;
      opportunities.push({
        text: `El distrito tiene una brecha de ${fmtM(gap)} frente al presupuesto mensual. Concentrar esfuerzos en las tiendas con menor cumplimiento podría cerrar esta brecha.`,
        impactLabel: `${fmtM(gap)} brecha`,
        impactValue: gap,
      });
    }

    if (districtTotals.avgNPS != null && districtTotals.avgNPS < TARGETS.nps) {
      const npsGap = TARGETS.nps - districtTotals.avgNPS;
      opportunities.push({
        text: `El NPS del distrito está ${npsGap.toFixed(0)} puntos por debajo del objetivo (${TARGETS.nps}). Mejorar la experiencia del cliente en las tiendas con menor NPS podría incrementar la fidelización.`,
        impactLabel: `${npsGap.toFixed(0)} pts de brecha`,
        impactValue: npsGap,
      });
    }

    if (districtTotals.ebitda != null && districtTotals.ebitda < TARGETS.ebitda) {
      const ebitdaGap = TARGETS.ebitda - districtTotals.ebitda;
      opportunities.push({
        text: `El EBITDA del distrito está ${ebitdaGap.toFixed(1)} puntos por debajo del objetivo (${TARGETS.ebitda}%). Optimizar costos en las tiendas con menor margen podría mejorar la rentabilidad.`,
        impactLabel: `${ebitdaGap.toFixed(1)} pp de brecha`,
        impactValue: ebitdaGap,
      });
    }

    opportunities.sort((a, b) => (b.impactValue || 0) - (a.impactValue || 0));
    return opportunities[0] || null;
  }, [districtTotals, daysInRange, dc.daysInMonth]);

  /* ── Aggregators data ── */
  const aggregatorsByStore = useMemo(() => {
    const map = {};
    const storeCodes = new Set(stores.map(s => (s.code || '').trim()));
    allAggregators.forEach(a => {
      if (a.month !== dc.currentMonth || a.year !== dc.currentYear) return;
      const code = (a.store_code || '').trim();
      if (!storeCodes.has(code)) return;
      if (!map[code]) map[code] = [];
      map[code].push({ channel: (a.channel || '').trim(), participation: a.participation || 0, total_sales: a.total_sales || 0 });
    });
    return map;
  }, [allAggregators, stores, dc.currentMonth, dc.currentYear]);

  const aggregatorsChannels = useMemo(() => {
    const set = new Set();
    Object.values(aggregatorsByStore).forEach(arr => arr.forEach(a => set.add(a.channel)));
    return Array.from(set).sort();
  }, [aggregatorsByStore]);

  const aggregatorsTrend = useMemo(() => {
    const byMonth = {};
    const storeCodes = new Set(stores.map(s => (s.code || '').trim()));
    allAggregators.forEach(a => {
      const code = (a.store_code || '').trim();
      if (!storeCodes.has(code)) return;
      const key = `${a.year}-${String(a.month).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { key, year: a.year, month: a.month, channels: {} };
      const ch = (a.channel || '').trim();
      if (!byMonth[key].channels[ch]) byMonth[key].channels[ch] = { participation: 0, total_sales: 0, count: 0 };
      byMonth[key].channels[ch].participation += a.participation || 0;
      byMonth[key].channels[ch].total_sales += a.total_sales || 0;
      byMonth[key].channels[ch].count++;
    });
    return Object.values(byMonth)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(m => {
        const result = { label: format(new Date(m.year, m.month - 1, 1), 'MMM yy', { locale: es }) };
        Object.keys(m.channels).forEach(ch => {
          result[ch] = m.channels[ch].count > 0 ? (m.channels[ch].participation / m.channels[ch].count) * 100 : 0;
        });
        return result;
      });
  }, [allAggregators, stores]);

  /* ── Daily trend for district ── */
  const dailyTrend = useMemo(() => {
    const rangeInterval = { start: startDate, end: endDate };
    const byDate = {};
    const storeCodes = new Set(stores.map(s => (s.code || '').trim()));
    allDailySales.forEach(d => {
      try { if (!isWithinInterval(parseISO(d.date), rangeInterval)) return; } catch { return; }
      const code = (d.store_id || '').trim();
      if (!storeCodes.has(code)) return;
      const dt = d.date;
      if (!byDate[dt]) byDate[dt] = { date: dt, sales: 0, tx: 0 };
      byDate[dt].sales += d.total_sales || 0;
      byDate[dt].tx += d.total_transactions || 0;
    });
    return Object.values(byDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        ...d,
        label: format(parseISO(d.date), 'dd MMM', { locale: es }),
        avgTicket: d.tx > 0 ? d.sales / d.tx : 0,
      }));
  }, [allDailySales, stores, startDate, endDate]);

  /* ── KPIs array ── */
  const kpis = useMemo(() => {
    if (!districtTotals.hasData && storeData.length === 0) return [];
    return [
      { key: 'ventas', label: 'Ventas', value: fmtM(districtTotals.totalMonthSales), metaLabel: 'Meta', meta: fmtM(districtTotals.totalBudget), compliance: districtTotals.compliance, variation: variations.salesVar, variationType: 'pct', color: '#C21875', icon: 'DollarSign' },
      { key: 'proyeccion', label: 'Proyección Cierre', value: fmtM(districtTotals.totalProjection), metaLabel: 'Meta', meta: fmtM(districtTotals.totalBudget), compliance: districtTotals.projCompliance, variation: null, variationType: 'pct', color: '#10b981', icon: 'TrendingUp' },
      { key: 'cumplimiento', label: 'Cumplimiento', value: districtTotals.compliance != null ? `${districtTotals.compliance.toFixed(1)}%` : '—', metaLabel: 'Meta', meta: '100%', compliance: districtTotals.compliance, variation: null, variationType: 'pp', color: '#0ea5e9', icon: 'Target' },
      { key: 'ebitda', label: 'EBITDA Distrito', value: districtTotals.ebitda != null ? `${districtTotals.ebitda.toFixed(1)}%` : '—', metaLabel: 'Meta', meta: `${TARGETS.ebitda}%`, compliance: districtTotals.ebitda != null ? (districtTotals.ebitda / TARGETS.ebitda * 100) : null, variation: variations.ebitdaVar, variationType: 'pp', color: '#8b5cf6', icon: 'Zap' },
      { key: 'ticket', label: 'Ticket Promedio', value: fmtM(districtTotals.avgTicket), metaLabel: 'Meta', meta: fmtM(TARGETS.ticket), compliance: districtTotals.avgTicket > 0 ? (districtTotals.avgTicket / TARGETS.ticket * 100) : null, variation: variations.ticketVar, variationType: 'pct', color: '#f59e0b', icon: 'Receipt' },
      { key: 'nps', label: 'NPS Distrito', value: districtTotals.avgNPS != null ? districtTotals.avgNPS.toFixed(0) : '—', metaLabel: 'Meta', meta: `${TARGETS.nps}`, compliance: districtTotals.avgNPS != null ? (districtTotals.avgNPS / TARGETS.nps * 100) : null, variation: variations.npsVar, variationType: 'pts', color: '#ec4899', icon: 'Smile' },
    ];
  }, [districtTotals, variations]);

  return {
    isLoading, lastUpdate, refresh,
    stores: stores.map(s => ({ code: s.code, name: s.name })),
    storeData, districtTotals, variations, hourlyData,
    infoSources, infoIndex, attentionItems, drivers, ranking, insight, kpis,
    selectedHourlyStore, setSelectedHourlyStore,
    aggregatorsByStore, aggregatorsChannels, aggregatorsTrend, dailyTrend,
  };
}