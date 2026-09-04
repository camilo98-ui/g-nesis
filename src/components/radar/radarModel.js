// ─────────────────────────────────────────────────────────────
// RADAR COMPETITIVO · MODELO DE CÁLCULO (puro, sin UI)
// Trabaja sobre los registros existentes de CompetitiveRecord.
// NO modifica la captura: solo normaliza y agrega para análisis.
// ─────────────────────────────────────────────────────────────

export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const POPSY_COLOR = '#C21875';
export const COMP_COLORS = ['#0891b2', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e',
  '#6366f1', '#14b8a6', '#fb7185', '#a855f7', '#eab308'];

const CITY_BY_PREFIX = {
  BTA: 'Bogotá', CHI: 'Chía', CAL: 'Cali', MED: 'Medellín', CTG: 'Cartagena',
  BAQ: 'Barranquilla', SMR: 'Santa Marta', VIL: 'Villavicencio', IBG: 'Ibagué',
  PER: 'Pereira', MAN: 'Manizales', ARM: 'Armenia', CUC: 'Cúcuta',
  BUC: 'Bucaramanga', NEV: 'Neiva', SOA: 'Soacha',
};

export const POPSY_KEY = '__POPSY__';

export const normBrandKey = (name) => (name || '').trim().toUpperCase().replace(/\s+/g, ' ');
export const isPopsyKey = (key) => (key || '').includes('POPSY');

export const storeCityKey = (storeId) => {
  const m = (storeId || '').trim().toUpperCase().match(/^[A-ZÁÉÍÓÚÑ]+/);
  return m ? m[0] : '—';
};
export const storeCityLabel = (storeId) => CITY_BY_PREFIX[storeCityKey(storeId)] || storeCityKey(storeId);

export const fmtInt = (v) => Math.round(v || 0).toLocaleString('es-CO');
export const fmtPct = (v, dec = 1) => (v == null || isNaN(v)) ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(dec)}%`;

// ── Construcción de lecturas ────────────────────────────────
// Transacciones = serial actual − serial anterior de la misma
// marca y tienda (misma lógica de captura, recalculada).
export function buildReadings(records) {
  const groups = new Map();
  const nameFreq = new Map();

  (records || []).forEach((r) => {
    const storeId = (r.store_id || '').trim() || 'SIN TIENDA';
    const brandKey = normBrandKey(r.competition);
    if (!brandKey) return;
    const fk = `${storeId}||${brandKey}`;
    if (!groups.has(fk)) groups.set(fk, []);
    groups.get(fk).push({
      id: r.id,
      storeId,
      brandKey,
      date: (r.date || '').substring(0, 10),
      serial: Number(r.serial) || 0,
      observations: r.observations || '',
    });
    if (!nameFreq.has(brandKey)) nameFreq.set(brandKey, new Map());
    const fm = nameFreq.get(brandKey);
    const raw = (r.competition || '').trim();
    fm.set(raw, (fm.get(raw) || 0) + 1);
  });

  // Nombre de visualización: la variante más frecuente (agrupa 'goyurt' / 'GOYURT')
  const brandDisplay = {};
  nameFreq.forEach((fm, key) => {
    let best = '', bestN = -1;
    fm.forEach((n, name) => { if (n > bestN) { best = name; bestN = n; } });
    brandDisplay[key] = isPopsyKey(key) ? 'POPSY' : best;
  });

  // Serie por marca+tienda con transacciones calculadas
  const readings = [];
  groups.forEach((arr) => {
    arr.sort((a, b) => a.date.localeCompare(b.date) || a.serial - b.serial);
    arr.forEach((rd, i) => {
      readings.push({
        ...rd,
        txn: i > 0 ? Math.max(0, rd.serial - arr[i - 1].serial) : null,
      });
    });
  });

  // Numeración de toma (1..n) por tienda dentro de cada mes
  const perSM = new Map();
  readings.forEach((rd) => {
    const k = `${rd.storeId}|${rd.date.substring(0, 7)}`;
    if (!perSM.has(k)) perSM.set(k, new Set());
    perSM.get(k).add(rd.date);
  });
  const takeIdx = new Map();
  perSM.forEach((dates, k) => {
    [...dates].sort().forEach((d, i) => takeIdx.set(`${k}|${d}`, i + 1));
  });

  return readings.map((rd) => {
    const monthKey = rd.date.substring(0, 7);
    return {
      ...rd,
      brandName: brandDisplay[rd.brandKey] || rd.brandKey,
      monthKey,
      year: Number(monthKey.substring(0, 4)),
      month: Number(monthKey.substring(5, 7)),
      takeIndex: takeIdx.get(`${rd.storeId}|${monthKey}|${rd.date}`) || null,
    };
  });
}

// ── Opciones para filtros ────────────────────────────────────
export function buildFilterOptions(readings) {
  const years = [...new Set(readings.map((r) => r.year))].filter(Boolean).sort((a, b) => b - a);
  const stores = [...new Set(readings.map((r) => r.storeId))].sort();
  const cities = [...new Set(stores.map(storeCityKey))].sort();
  const brands = {};
  readings.forEach((r) => {
    if (!isPopsyKey(r.brandKey)) brands[r.brandKey] = r.brandName;
  });
  return { years, stores, cities, brands: Object.entries(brands).map(([key, name]) => ({ key, name })) };
}

export function takesForFilters(readings, filters) {
  return [...new Set(readings
    .filter((r) => r.year === filters.year && r.month === filters.month
      && (filters.storeId === 'ALL' || r.storeId === filters.storeId)
      && (filters.city === 'ALL' || storeCityKey(r.storeId) === filters.city))
    .map((r) => r.takeIndex))]
    .filter(Boolean).sort((a, b) => a - b);
}

// ── Dashboard completo ───────────────────────────────────────
export function computeDashboard(readings, filters) {
  const scoped = readings.filter((rd) =>
    (filters.storeId === 'ALL' || rd.storeId === filters.storeId)
    && (filters.city === 'ALL' || storeCityKey(rd.storeId) === filters.city));

  const monthSel = filters.month !== 'ALL';
  const takeSel = monthSel && filters.take !== 'ALL';

  const inCur = (rd) => rd.year === filters.year
    && (!monthSel || rd.month === filters.month)
    && (!takeSel || rd.takeIndex === filters.take);

  const inPrev = (rd) => {
    if (takeSel) return rd.year === filters.year && rd.month === filters.month && rd.takeIndex === filters.take - 1;
    if (monthSel) {
      let m = filters.month - 1, y = filters.year;
      if (m === 0) { m = 12; y -= 1; }
      return rd.year === y && rd.month === m;
    }
    return rd.year === filters.year - 1;
  };

  const isP = (rd) => isPopsyKey(rd.brandKey);
  const brandAllowed = (rd) => isP(rd) || filters.brand === 'ALL' || rd.brandKey === filters.brand;

  const curAll = scoped.filter((rd) => inCur(rd) && brandAllowed(rd));
  const prevAll = scoped.filter((rd) => inPrev(rd) && brandAllowed(rd));
  const cur = curAll.filter((rd) => rd.txn != null);
  const prev = prevAll.filter((rd) => rd.txn != null);

  // Universo de competidores (activos según filtro de competidor)
  const compKeys = [...new Set(scoped.filter((r) => !isP(r)).map((r) => r.brandKey))];
  const activeComps = filters.brand === 'ALL' ? compKeys : compKeys.filter((k) => k === filters.brand);

  const sumBy = (arr, pred) => arr.reduce((s, rd) => (pred(rd) ? s + (rd.txn || 0) : s), 0);

  const popsyTotal = sumBy(cur, isP);
  const popsyPrev = sumBy(prev, isP);
  const popsyGrowth = popsyPrev > 0 ? ((popsyTotal - popsyPrev) / popsyPrev) * 100 : null;

  const compTotals = {}, compPrevTotals = {};
  activeComps.forEach((k) => {
    compTotals[k] = sumBy(cur, (rd) => rd.brandKey === k);
    compPrevTotals[k] = sumBy(prev, (rd) => rd.brandKey === k);
  });
  const compTotal = activeComps.reduce((s, k) => s + compTotals[k], 0);
  const compPrevTotal = activeComps.reduce((s, k) => s + compPrevTotals[k], 0);
  const compGrowth = compPrevTotal > 0 ? ((compTotal - compPrevTotal) / compPrevTotal) * 100 : null;

  // Colores: competidores ordenados por volumen (POPSY siempre magenta)
  const compsByVolume = [...activeComps].sort((a, b) => (compTotals[b] || 0) - (compTotals[a] || 0));
  const colorOf = {};
  compsByVolume.forEach((k, i) => { colorOf[k] = COMP_COLORS[i % COMP_COLORS.length]; });
  const nameOf = {};
  activeComps.forEach((k) => {
    const rd = scoped.find((r) => r.brandKey === k);
    nameOf[k] = rd ? rd.brandName : k;
  });

  // ── Observaciones: (tienda, fecha) → valores por marca ──
  const obs = new Map();
  cur.forEach((rd) => {
    const k = `${rd.storeId}|${rd.date}`;
    if (!obs.has(k)) obs.set(k, { storeId: rd.storeId, date: rd.date, takeIndex: rd.takeIndex, values: {} });
    const o = obs.get(k);
    const vk = isP(rd) ? POPSY_KEY : rd.brandKey;
    o.values[vk] = (o.values[vk] || 0) + rd.txn;
  });

  // ── Tomas ganadas (POPSY vs ritmo promedio de competidores) ──
  let won = 0, lost = 0, near = 0;
  obs.forEach((o) => {
    const p = o.values[POPSY_KEY];
    const cv = activeComps.map((k) => o.values[k]).filter((v) => v != null);
    if (p == null || cv.length === 0) return;
    const avg = cv.reduce((a, b) => a + b, 0) / cv.length;
    if (p > avg * 1.05) won++;
    else if (p < avg * 0.95) lost++;
    else near++;
  });
  const totalComparisons = won + lost + near;
  const winRatio = totalComparisons > 0 ? won / totalComparisons : null;

  // ── Duelos POPSY vs cada competidor (observaciones comunes) ──
  const duels = activeComps.map((k) => {
    let pt = 0, ct = 0, n = 0, last = null;
    obs.forEach((o) => {
      const p = o.values[POPSY_KEY];
      const c = o.values[k];
      if (p == null || c == null) return;
      pt += p; ct += c; n++;
      if (!last || o.date > last.date) last = { date: o.date, p, c };
    });
    const diff = pt - ct;
    let winner = null;
    if (n > 0) {
      if (pt === ct) winner = 'tie';
      else if (ct === 0 || pt / ct > 1.05) winner = 'popsy';
      else if (pt === 0 || ct / pt > 1.05) winner = 'comp';
      else winner = 'tie';
    }
    const marginPct = ct > 0 ? (diff / ct) * 100 : (pt > 0 ? 100 : null);
    return {
      key: k, name: nameOf[k], color: colorOf[k],
      popsy: pt, comp: ct, obs: n, diff,
      marginPct, winner,
      last: last ? { ...last, result: last.p > last.c ? 'popsy' : last.p < last.c ? 'comp' : 'tie' } : null,
    };
  }).sort((a, b) => (b.popsy + b.comp) - (a.popsy + a.comp));

  // ── Serie por tomas del mes seleccionado ──
  const takes = [...new Set(cur.filter((rd) => monthSel).map((rd) => rd.takeIndex))].filter(Boolean).sort((a, b) => a - b);
  const takesSeries = takes.map((t) => {
    const rows = cur.filter((rd) => rd.takeIndex === t);
    const entry = { take: t, label: `Toma ${t}`, date: rows[0]?.date };
    const pRows = rows.filter(isP);
    if (pRows.length) entry[POPSY_KEY] = pRows.reduce((s, r) => s + r.txn, 0);
    activeComps.forEach((k) => {
      const bRows = rows.filter((r) => r.brandKey === k);
      if (bRows.length) entry[k] = bRows.reduce((s, r) => s + r.txn, 0);
    });
    return entry;
  });

  // ── Serie mensual (año seleccionado) ──
  const yearTx = scoped.filter((rd) => rd.year === filters.year && rd.txn != null && brandAllowed(rd));
  const monthsWithData = [...new Set(yearTx.map((rd) => rd.month))].sort((a, b) => a - b);
  const monthlySeries = monthsWithData.map((m) => {
    const rows = yearTx.filter((rd) => rd.month === m);
    const entry = { month: m, label: MONTHS_ES[m - 1] };
    const pRows = rows.filter(isP);
    if (pRows.length) entry[POPSY_KEY] = pRows.reduce((s, r) => s + r.txn, 0);
    activeComps.forEach((k) => {
      const bRows = rows.filter((r) => r.brandKey === k);
      if (bRows.length) entry[k] = bRows.reduce((s, r) => s + r.txn, 0);
    });
    return entry;
  });

  // ── Detección de cruces (toma a toma) ──
  const crossings = [];
  if (takesSeries.length >= 2) {
    activeComps.forEach((k) => {
      for (let i = 1; i < takesSeries.length; i++) {
        const a = takesSeries[i - 1], b = takesSeries[i];
        if (a[POPSY_KEY] == null || a[k] == null || b[POPSY_KEY] == null || b[k] == null) continue;
        if (a[k] > a[POPSY_KEY] && b[k] < b[POPSY_KEY]) {
          let streak = 0;
          for (let j = i - 1; j >= 0; j--) {
            if (takesSeries[j][k] != null && takesSeries[j][POPSY_KEY] != null && takesSeries[j][k] > takesSeries[j][POPSY_KEY]) streak++;
            else break;
          }
          crossings.push({ type: 'up', key: k, name: nameOf[k], color: colorOf[k], take: b.take, streak });
        } else if (a[k] < a[POPSY_KEY] && b[k] > b[POPSY_KEY]) {
          crossings.push({ type: 'down', key: k, name: nameOf[k], color: colorOf[k], take: b.take });
        }
      }
    });
  }

  // ── Participación en transacciones observadas ──
  const totalObsCur = popsyTotal + compTotal;
  const totalObsPrev = popsyPrev + compPrevTotal;
  const shareRows = [
    { key: POPSY_KEY, name: 'POPSY', color: POPSY_COLOR, isPopsy: true, curr: popsyTotal, prev: popsyPrev },
    ...activeComps.map((k) => ({ key: k, name: nameOf[k], color: colorOf[k], isPopsy: false, curr: compTotals[k], prev: compPrevTotals[k] })),
  ].map((b) => ({
    ...b,
    currPct: totalObsCur > 0 ? (b.curr / totalObsCur) * 100 : null,
    prevPct: totalObsPrev > 0 ? (b.prev / totalObsPrev) * 100 : null,
  })).sort((a, b) => (b.currPct ?? -1) - (a.currPct ?? -1));

  // ── Mapa competitivo por tienda ──
  const storesInPeriod = [...new Set(cur.map((rd) => rd.storeId))];
  const storeMatrix = storesInPeriod.map((st) => {
    const cells = activeComps.map((k) => {
      let pt = 0, ct = 0, n = 0;
      obs.forEach((o) => {
        if (o.storeId !== st) return;
        const p = o.values[POPSY_KEY];
        const c = o.values[k];
        if (p == null || c == null) return;
        pt += p; ct += c; n++;
      });
      if (n === 0) return { key: k, name: nameOf[k], color: colorOf[k], status: 'nodata', popsy: 0, comp: 0, marginPct: null };
      const status = pt > ct * 1.05 ? 'win' : pt < ct * 0.95 ? 'lose' : 'tie';
      return { key: k, name: nameOf[k], color: colorOf[k], status, popsy: pt, comp: ct, marginPct: ct > 0 ? ((pt - ct) / ct) * 100 : (pt > 0 ? 100 : null) };
    });
    return { storeId: st, city: storeCityLabel(st), cells };
  }).sort((a, b) => a.storeId.localeCompare(b.storeId));

  // ── Matriz de competitividad (volumen vs crecimiento) ──
  const volumes = activeComps.map((k) => compTotals[k]).filter((v) => v > 0).sort((a, b) => a - b);
  const refX = volumes.length ? volumes[Math.floor(volumes.length / 2)] : 0;
  const quadrant = [
    { key: POPSY_KEY, name: 'POPSY', color: POPSY_COLOR, isPopsy: true, x: popsyTotal, y: popsyGrowth, share: totalObsCur > 0 ? (popsyTotal / totalObsCur) * 100 : 0 },
    ...activeComps.map((k) => {
      const t = compTotals[k], p = compPrevTotals[k];
      return {
        key: k, name: nameOf[k], color: colorOf[k], isPopsy: false, x: t,
        y: p > 0 ? ((t - p) / p) * 100 : null,
        share: totalObsCur > 0 ? (t / totalObsCur) * 100 : 0,
      };
    }),
  ].filter((b) => b.x > 0 || b.y != null);

  // ── Radar de amenazas ──
  const medianVolume = volumes.length ? volumes[Math.floor(volumes.length / 2)] : 0;
  const threats = activeComps.map((k) => {
    const total = compTotals[k];
    const prevTotal = compPrevTotals[k];
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
    const duel = duels.find((d) => d.key === k);
    const highVolume = total >= medianVolume && total > 0;
    const losing = duel && duel.winner === 'comp';
    const winning = duel && duel.winner === 'popsy';

    let level = 'watch';
    if (losing && (growth == null || growth >= 0) && highVolume) level = 'threat';
    else if (losing && growth != null && growth >= 10) level = 'threat';
    else if (growth != null && growth <= -15) level = 'opportunity';
    else if (winning && growth != null && growth < 0) level = 'opportunity';

    let reason;
    if (level === 'threat') {
      reason = growth != null && growth > 0
        ? `Supera a POPSY por ${fmtPct(Math.abs(duel.marginPct)).replace('+', '')} y creció ${fmtPct(growth)} vs periodo anterior.`
        : `Supera a POPSY por ${Math.abs(duel.marginPct || 0).toFixed(1)}% manteniendo alto volumen transaccional.`;
    } else if (level === 'opportunity') {
      reason = growth != null && growth < 0
        ? `Desacelera ${Math.abs(growth).toFixed(1)}% vs periodo anterior${winning ? ' y POPSY la supera en el duelo directo' : ''}.`
        : `POPSY la supera por ${Math.abs(duel?.marginPct || 0).toFixed(1)}% en el duelo directo.`;
    } else {
      reason = highVolume
        ? `Alto volumen (${fmtInt(total)} txn), pero comportamiento estable frente a POPSY.`
        : `Ritmo cercano al de POPSY (diferencia de ${Math.abs(duel?.marginPct ?? 0).toFixed(1)}% en el duelo).`;
    }

    // Crecimiento entre últimas dos tomas del mes
    const ts = takesSeries.filter((e) => e[k] != null);
    const takeGrowth = ts.length >= 2 ? ((ts[ts.length - 1][k] - ts[ts.length - 2][k]) / Math.max(ts[ts.length - 2][k], 1)) * 100 : null;

    return { key: k, name: nameOf[k], color: colorOf[k], total, growth, takeGrowth, duel, level, reason };
  });

  // ── Principal competidor ──
  const mainComp = compsByVolume.filter((k) => compTotals[k] > 0)
    .map((k) => ({ key: k, name: nameOf[k], color: colorOf[k], total: compTotals[k], share: compTotal > 0 ? (compTotals[k] / compTotal) * 100 : null }))[0] || null;

  // ── Posición competitiva ──
  const compAvg = activeComps.length > 0 ? compTotal / activeComps.length : 0;
  const advantagePct = compAvg > 0 ? ((popsyTotal - compAvg) / compAvg) * 100 : null;
  const verdict = winRatio == null ? null : winRatio >= 0.6 ? 'winning' : winRatio <= 0.4 ? 'losing' : 'close';

  let heroText = null;
  if (totalComparisons > 0) {
    const monthName = monthSel ? MONTHS_ES[filters.month - 1] : `${filters.year}`;
    heroText = `En ${totalComparisons} toma${totalComparisons !== 1 ? 's' : ''} comparable${totalComparisons !== 1 ? 's' : ''} de ${monthName}, POPSY superó el ritmo transaccional promedio de sus competidores en ${won}${near > 0 ? `, con ${near} demasiado reñida${near !== 1 ? 's' : ''} para definir un ganador` : ''}.`;
  } else if (popsyTotal === 0 && compTotal > 0) {
    heroText = 'No se registraron tomas de POPSY en el periodo seleccionado. Registra los seriales de POPSY para activar la comparación.';
  }

  // ── Etiquetas de periodo ──
  const periodLabel = takeSel
    ? `${MONTHS_ES[filters.month - 1]} ${filters.year} · Toma ${filters.take}`
    : monthSel ? `${MONTHS_ES[filters.month - 1]} ${filters.year}` : `${filters.year}`;
  const comparisonLabel = takeSel
    ? `vs Toma ${filters.take - 1}` : monthSel
      ? (() => { let m = filters.month - 1, y = filters.year; if (m === 0) { m = 12; y -= 1; } return `vs ${MONTHS_ES[m - 1]} ${y}`; })()
      : `vs ${filters.year - 1}`;
  const prevPeriodLabel = takeSel
    ? `Toma ${filters.take - 1}` : monthSel
      ? (() => { let m = filters.month - 1, y = filters.year; if (m === 0) { m = 12; y -= 1; } return `${MONTHS_ES[m - 1]} ${y}`; })()
      : `${filters.year - 1}`;

  // ── Detalle por tomas ──
  const detailRows = [...obs.values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.storeId.localeCompare(b.storeId))
    .map((o) => {
      const p = o.values[POPSY_KEY];
      const compEntries = activeComps.map((k) => ({ key: k, name: nameOf[k], color: colorOf[k], txn: o.values[k] })).filter((e) => e.txn != null);
      const compSum = compEntries.reduce((s, e) => s + e.txn, 0);
      const avg = compEntries.length ? compSum / compEntries.length : null;
      const diff = (p != null && avg != null) ? p - avg : null;
      const result = (p == null || avg == null) ? 'SIN DATO'
        : p > avg * 1.05 ? 'GANA' : p < avg * 0.95 ? 'PIERDE' : 'CERCA';
      return { storeId: o.storeId, city: storeCityLabel(o.storeId), date: o.date, takeIndex: o.takeIndex, popsy: p, comps: compEntries, compSum, avg, diff, result };
    });

  return {
    insufficient: cur.length === 0,
    noPopsy: popsyTotal === 0 && cur.length > 0,
    filters, monthSel, takeSel,
    periodLabel, comparisonLabel, prevPeriodLabel,
    activeComps, nameOf, colorOf,
    popsy: { total: popsyTotal, prev: popsyPrev, growth: popsyGrowth },
    competition: { total: compTotal, prev: compPrevTotal, growth: compGrowth, avgPerBrand: compAvg },
    participation: totalObsCur > 0 ? (popsyTotal / totalObsCur) * 100 : null,
    hero: { verdict, advantagePct, text: heroText, won, lost, near, totalComparisons },
    mainComp,
    duels,
    takesSeries, monthlySeries, crossings,
    shareRows,
    storeMatrix,
    quadrant, refX,
    threats,
    detailRows,
    readingsInScope: scoped,
  };
}

// ── Narrativa determinista (fallback si la IA no responde) ──
export function buildFallbackNarrative(m) {
  if (m.insufficient) {
    return {
      lectura: 'No hay información suficiente para generar una conclusión. Registra tomas en el periodo seleccionado.',
      recomendacion: 'No hay información suficiente para generar una recomendación.',
    };
  }
  const L = [];
  if (m.hero.verdict === 'winning') L.push(`POPSY muestra una posición competitiva favorable en ${m.periodLabel}, ganando ${m.hero.won} de ${m.hero.totalComparisons} tomas comparables contra el ritmo promedio de sus competidores.`);
  else if (m.hero.verdict === 'losing') L.push(`POPSY presenta desventaja competitiva en ${m.periodLabel}: perdió ${m.hero.lost} de ${m.hero.totalComparisons} tomas comparables frente al ritmo promedio de sus competidores.`);
  else L.push(`La competencia está muy cerca en ${m.periodLabel}: POPSY ganó ${m.hero.won} de ${m.hero.totalComparisons} tomas comparables.`);
  if (m.mainComp) L.push(`La principal presión proviene de ${m.mainComp.name}, con ${fmtInt(m.mainComp.total)} transacciones observadas.`);
  const op = m.threats.find((t) => t.level === 'opportunity');
  if (op) L.push(`${op.name} presenta desaceleración, generando una oportunidad para POPSY.`);
  const losingStores = m.storeMatrix
    .filter((s) => s.cells.filter((c) => c.status === 'lose').length > s.cells.filter((c) => c.status === 'win').length)
    .map((s) => s.storeId);
  if (losingStores.length) L.push(`Las mayores brechas negativas se concentran en ${losingStores.slice(0, 4).join(', ')}.`);

  const R = [];
  const threat = m.threats.find((t) => t.level === 'threat');
  if (threat) R.push(`Priorizar acciones comerciales frente a ${threat.name}, que combina alto volumen con dinámica desfavorable para POPSY.`);
  if (losingStores.length) R.push(`Concentrar refuerzos comerciales en ${losingStores.slice(0, 3).join(', ')}, donde la brecha frente a la competencia es mayor.`);
  if (op) R.push(`Capitalizar la desaceleración de ${op.name} con activaciones dirigidas en las tiendas donde comparten ubicación.`);
  if (!R.length) R.push(`Mantener el plan comercial actual: POPSY sostiene una posición competitiva estable en el periodo.`);

  return { lectura: L.join(' '), recomendacion: R.join(' ') };
}