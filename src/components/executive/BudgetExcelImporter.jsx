import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { BASE_STORES } from '@/components/StoreManager';
import { format, getDaysInMonth } from 'date-fns';

// Normalizar texto para comparación (sin tildes, mayúsculas, sin espacios extra)
const normalize = (str = '') =>
  str.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();

// Palabras clave por tienda para matching robusto
const STORE_KEYWORDS = {
  'BTA 78': ['plaza imperial 2', 'imperial 2', 'bta 78', 'bogota 78', '78'],
  'BTA 18': ['plaza imperial', 'imperial', 'bta 18', 'bogota 18', '18'],
  'BTA 21': ['centro chia', 'chia', 'bta 21', 'bogota 21', '21'],
  'BTA 96': ['av chile', 'chile', 'gran ahorrar', 'ahorrar', 'bta 96', 'bogota 96', 'bogota 27', '96', '27'],
  'BTA 52': ['centro suba', 'suba', 'bta 52', 'bogota 52', '52'],
  'BTA 94': ['eco plaza', 'ecoplaza', 'bta 94', 'bogota 94', 'bogota 56', '94', '56'],
  'BTA 62': ['fontanar', 'bta 62', 'bogota 62', '62'],
  'BTA 93': ['colina', 'parque la colina', 'bta 93', 'bogota 93', 'bogota 66', '93', '66'],
  'BTA 95': ['casa blanca', 'casablanca', 'bta 95', 'bogota 95', 'bogota 71', '95', '71'],
  'BTA 85': ['mansion cajica', 'cajica', 'bta 85', 'bogota 85', '85'],
  'TUNJA 1': ['unicentro', 'tunja 1', 'tunja1'],
  'TUNJA 2': ['viva tunja', 'biva tunja', 'tunja 2', 'tunja2'],
};

const matchStore = (cellValue) => {
  if (!cellValue) return null;
  const normalized = normalize(String(cellValue));
  if (!normalized) return null;

  // Intentar extraer número de "BOGOTA XX" o "BTA XX" directamente del texto original
  const bogotaNumMatch = String(cellValue).match(/(?:bogota|bta)\s*(\d+)/i);
  if (bogotaNumMatch) {
    const num = bogotaNumMatch[1];
    for (const store of BASE_STORES) {
      const storeNum = store.code.replace(/[^0-9]/g, '');
      if (storeNum === num) return store;
    }
  }

  // Tunja directo
  const tunjaMatch = String(cellValue).match(/tunja\s*(\d+)/i);
  if (tunjaMatch) {
    const found = BASE_STORES.find(s => s.code === `TUNJA ${tunjaMatch[1]}`);
    if (found) return found;
  }

  for (const store of BASE_STORES) {
    const keywords = STORE_KEYWORDS[store.code] || [];
    // Exact keyword match
    for (const kw of keywords) {
      if (normalized === kw) return store;
    }
    // Contains keyword (longer keywords first to avoid false positives)
    const sortedKw = [...keywords].sort((a, b) => b.length - a.length);
    for (const kw of sortedKw) {
      if (kw.length >= 4 && normalized.includes(kw)) return store;
    }
  }
  return null;
};

// Parsear valor numérico de una celda
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  // Formato colombiano: puntos como separador de miles, coma como decimal
  const cleaned = val.toString()
    .replace(/[\$\s]/g, '')
    .replace(/\./g, '')   // quitar puntos (miles)
    .replace(/,/g, '.');  // coma → punto decimal
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export default function BudgetExcelImporter({ onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload');
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  const now = new Date();

  // ── PARSEAR EXCEL ──────────────────────────────────────────────────────────
  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Leer con encabezados para detectar columnas por nombre
        const rowsWithHeaders = XLSX.utils.sheet_to_json(ws, { defval: null });
        // También leer como array para el parser genérico
        const rowsRaw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        analyzeSheet(rowsRaw, rowsWithHeaders);
      } catch (err) {
        toast.error('No se pudo leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const analyzeSheet = (rows, rowsWithHeaders = []) => {
    const parseErrors = [];
    let detectedMonth = now.getMonth() + 1;
    let detectedYear = now.getFullYear();

    // ── ESTRATEGIA 0: Formato PdV+FECHA+PRESUPUESTO DIA (el Excel real)
    // Una fila por tienda por día: PdV, FECHA, PRESUPUESTO DIA, TRANSACCIONES DIA, TICKET PROMEDIO DIA
    if (rowsWithHeaders.length > 0) {
      const firstRow = rowsWithHeaders[0];
      const keys = Object.keys(firstRow).map(k => normalize(k));
      const hasPdv = keys.some(k => k.includes('pdv') || k.includes('punto') || k.includes('tienda'));
      const hasFecha = keys.some(k => k.includes('fecha') || k.includes('date'));
      const hasPpto = keys.some(k => k.includes('presupuesto') || k.includes('ppto') || k.includes('ppt'));

      if (hasPdv && hasFecha && hasPpto) {
        // Encontrar los nombres exactos de las columnas clave
        const allKeys = Object.keys(firstRow);
        const pdvKey = allKeys.find(k => normalize(k).includes('pdv') || normalize(k).includes('punto') || normalize(k).includes('tienda'));
        const fechaKey = allKeys.find(k => normalize(k).includes('fecha') || normalize(k).includes('date'));
        const pptoKey = allKeys.find(k => normalize(k).includes('presupuesto') || normalize(k).includes('ppto') || normalize(k).includes('ppt'));
        const trxKey = allKeys.find(k => normalize(k).includes('transacc') || normalize(k).includes('trx') || normalize(k).includes('txn'));
        const ticketKey = allKeys.find(k => normalize(k).includes('ticket') || normalize(k).includes('tkt'));

        const storeData = {};

        for (const row of rowsWithHeaders) {
          const storeMatch = matchStore(row[pdvKey]);
          if (!storeMatch) {
            console.warn(`⚠️ No se pudo emparejar tienda:`, row[pdvKey]);
            continue;
          }

          // Parsear fecha
          let fechaVal = row[fechaKey];
          let dateStr = null;
          let dayNum = null;
          let rowMonth = null;
          let rowYear = null;

          if (fechaVal instanceof Date) {
            dateStr = format(fechaVal, 'yyyy-MM-dd');
            dayNum = fechaVal.getDate();
            rowMonth = fechaVal.getMonth() + 1;
            rowYear = fechaVal.getFullYear();
          } else if (typeof fechaVal === 'string') {
            // "2026-03-23 00:00:00" o "2026-03-23"
            const match = fechaVal.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              rowYear = parseInt(match[1]);
              rowMonth = parseInt(match[2]);
              dayNum = parseInt(match[3]);
              dateStr = `${match[1]}-${match[2]}-${match[3]}`;
            }
          } else if (typeof fechaVal === 'number' && fechaVal > 40000) {
            // Número de serie Excel
            const d = new Date((fechaVal - 25569) * 86400 * 1000);
            dateStr = format(d, 'yyyy-MM-dd');
            dayNum = d.getDate();
            rowMonth = d.getMonth() + 1;
            rowYear = d.getFullYear();
          }

          if (!dateStr || !dayNum) continue;

          // Actualizar mes/año detectado
          if (rowMonth) detectedMonth = rowMonth;
          if (rowYear) detectedYear = rowYear;

          const pptoVal = parseNum(row[pptoKey]);
          if (!pptoVal || pptoVal <= 0) continue;

          const code = storeMatch.code;
          if (!storeData[code]) {
            storeData[code] = {
              store: storeMatch,
              dailyAmounts: {},    // { 'yyyy-MM-dd': amount }
              ticket: null,
              transactions: null,
              monthly: 0
            };
          }

          storeData[code].dailyAmounts[dateStr] = Math.round(pptoVal);

          // Ticket y transacciones: guardar el del día de hoy o promedio
          if (ticketKey && row[ticketKey]) {
            const t = parseNum(row[ticketKey]);
            if (t && !storeData[code].ticket) storeData[code].ticket = Math.round(t);
          }
          if (trxKey && row[trxKey]) {
            const t = parseNum(row[trxKey]);
            if (t) storeData[code].transactions = (storeData[code].transactions || 0) + Math.round(t);
          }
        }

        const foundStores = Object.values(storeData).map(item => {
          const daily = item.dailyAmounts;
          item.monthly = Math.round(Object.values(daily).reduce((a, b) => a + b, 0));
          item.hasDailyBreakdown = true;
          // Convertir dailyAmounts de { 'yyyy-MM-dd': val } a { dayNum: val } para compatibilidad
          item.dailyByDate = daily;
          item.daily = item.monthly / Object.keys(daily).length || 1;
          // Guardar rango de fechas del Excel para cálculo de brecha
          const dates = Object.keys(daily).sort();
          item.minDate = dates[0];
          item.maxDate = dates[dates.length - 1];
          return item;
        });

        console.log(`✅ Detectadas ${foundStores.length} tiendas en formato PdV+FECHA:`, foundStores.map(s => s.store.code));

        const daysInMonth = getDaysInMonth(new Date(detectedYear, detectedMonth - 1));

        if (foundStores.length > 0) {
          const foundCodes = new Set(foundStores.map(s => s.store.code));
          const missing = BASE_STORES.filter(s => !foundCodes.has(s.code));
          if (missing.length > 0) {
            parseErrors.push(`⚠️ No se encontraron ${missing.length} tiendas: ${missing.map(s => s.displayName).join(', ')}`);
          }
          setParsedData({ month: detectedMonth, year: detectedYear, daysInMonth, stores: foundStores, hasDailyBreakdown: true, formatType: 'pdv-fecha' });
          setErrors(parseErrors);
          setStep('preview');
          return; // ✅ Salir - ya tenemos los datos
        }
      }
    }

    // Detectar mes/año en las primeras filas
    const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    for (let i = 0; i < Math.min(8, rows.length); i++) {
      for (const cell of rows[i]) {
        const cellStr = String(cell || '');
        for (let m = 0; m < monthNames.length; m++) {
          if (normalize(cellStr).includes(monthNames[m])) {
            detectedMonth = m + 1;
            const yearMatch = cellStr.match(/20\d{2}/);
            if (yearMatch) detectedYear = parseInt(yearMatch[0]);
            break;
          }
        }
      }
    }

    const daysInMonth = getDaysInMonth(new Date(detectedYear, detectedMonth - 1));

    // ── ESTRATEGIA 1: Formato HORIZONTAL (filas = tiendas, columnas = días)
    // Detectar si hay una fila de encabezado con números del 1 al 31
    let headerRowIdx = -1;
    let dayColumns = {}; // { dayNumber: colIndex }
    let storeCol = -1;
    let monthlyCol = -1;
    let ticketCol = -1;
    let transactionsCol = -1;

    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      const dayColsFound = {};
      let dayCount = 0;
      let storeColFound = -1;
      let monthlyColFound = -1;
      let ticketColFound = -1;
      let transColFound = -1;

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellStr = String(cell || '').trim();
        const cellNorm = normalize(cellStr);

        // Detectar columna de tienda
        if (storeColFound === -1 && (cellNorm.includes('tienda') || cellNorm.includes('punto') || cellNorm.includes('store') || cellNorm.includes('local') || cellNorm.includes('sede'))) {
          storeColFound = j;
        }

        // Detectar columna de presupuesto mensual
        if (monthlyColFound === -1 && (
          cellNorm.includes('ppto mes') || cellNorm.includes('ppt mes') || cellNorm.includes('presupuesto mes') ||
          cellNorm.includes('total mes') || cellNorm.includes('budget mes') || cellNorm.includes('meta mes') ||
          cellNorm === 'ppto' || cellNorm === 'presupuesto' || cellNorm === 'budget' || cellNorm === 'total'
        )) {
          monthlyColFound = j;
        }

        // Detectar columna de ticket
        if (ticketColFound === -1 && (cellNorm.includes('ticket') || cellNorm.includes('tkt'))) {
          ticketColFound = j;
        }

        // Detectar columna de transacciones
        if (transColFound === -1 && (cellNorm.includes('transacc') || cellNorm.includes('trx') || cellNorm.includes('txn'))) {
          transColFound = j;
        }

        // Detectar columna de día (número entre 1 y 31, o fecha con el día)
        const numVal = parseFloat(cellStr);
        if (!isNaN(numVal) && numVal >= 1 && numVal <= 31 && Number.isInteger(numVal)) {
          dayColsFound[numVal] = j;
          dayCount++;
        }
        // También detectar fechas tipo "01/03/2026" o "2026-03-01"
        const dateMatch = cellStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/) || cellStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (dateMatch) {
          let d;
          try {
            d = new Date(cellStr);
            if (!isNaN(d) && d.getMonth() + 1 === detectedMonth) {
              dayColsFound[d.getDate()] = j;
              dayCount++;
            }
          } catch {}
        }
      }

      // Si encontramos ≥15 columnas de días, es formato horizontal
      if (dayCount >= 15) {
        headerRowIdx = i;
        dayColumns = dayColsFound;
        storeCol = storeColFound;
        monthlyCol = monthlyColFound;
        ticketCol = ticketColFound;
        transactionsCol = transColFound;
        break;
      }
    }

    // ── ESTRATEGIA 2: Formato VERTICAL (filas = días, columnas = tiendas)
    // Detectar si hay una columna de fechas/días y columnas por tienda
    let isVertical = false;
    let verticalDayCol = -1;
    let verticalStoreColumns = {}; // { storeCode: colIndex }
    let verticalHeaderRow = -1;

    if (headerRowIdx === -1) {
      // Buscar fila de encabezado que contenga nombres de tiendas
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i];
        const storesInRow = {};
        let storesFound = 0;

        for (let j = 0; j < row.length; j++) {
          const s = matchStore(row[j]);
          if (s) {
            storesInRow[s.code] = j;
            storesFound++;
          }
        }

        if (storesFound >= 3) {
          verticalHeaderRow = i;
          verticalStoreColumns = storesInRow;
          isVertical = true;

          // Buscar columna de día/fecha en esa fila o las anteriores
          for (let j = 0; j < row.length; j++) {
            const h = normalize(String(row[j] || ''));
            if (h.includes('dia') || h.includes('fecha') || h.includes('day') || h.includes('date')) {
              verticalDayCol = j;
              break;
            }
          }
          if (verticalDayCol === -1) verticalDayCol = 0; // asumir primera columna
          break;
        }
      }
    }

    // ── PARSE según estrategia detectada
    // { storeCode: { monthly, ticket, transactions, dailyAmounts: {1: val, 2: val, ...} } }
    const storeData = {};

    if (headerRowIdx !== -1 && Object.keys(dayColumns).length >= 15) {
      // FORMATO HORIZONTAL: cada fila es una tienda, columnas son días
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

        // Detectar tienda en la fila
        let storeMatch = null;
        if (storeCol >= 0) storeMatch = matchStore(row[storeCol]);
        if (!storeMatch) {
          for (const cell of row) {
            storeMatch = matchStore(cell);
            if (storeMatch) break;
          }
        }
        if (!storeMatch) continue;

        const code = storeMatch.code;
        if (!storeData[code]) storeData[code] = { store: storeMatch, dailyAmounts: {}, monthly: 0, ticket: null, transactions: null };

        // Leer presupuesto de cada día
        for (const [dayNum, colIdx] of Object.entries(dayColumns)) {
          const val = parseNum(row[colIdx]);
          if (val && val > 0) {
            storeData[code].dailyAmounts[dayNum] = val;
          }
        }

        // Leer mensual, ticket, transacciones si existen
        if (monthlyCol >= 0) {
          const v = parseNum(row[monthlyCol]);
          if (v) storeData[code].monthly = v;
        }
        if (ticketCol >= 0) {
          const v = parseNum(row[ticketCol]);
          if (v) storeData[code].ticket = v;
        }
        if (transactionsCol >= 0) {
          const v = parseNum(row[transactionsCol]);
          if (v) storeData[code].transactions = v;
        }
      }
    } else if (isVertical) {
      // FORMATO VERTICAL: cada fila es un día, columnas son tiendas
      for (let i = verticalHeaderRow + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

        // Detectar número de día en esta fila
        const dayCell = String(row[verticalDayCol] || '').trim();
        let dayNum = null;

        // Intentar parsear como número directo (1-31)
        const numVal = parseFloat(dayCell);
        if (!isNaN(numVal) && numVal >= 1 && numVal <= 31) {
          dayNum = Math.round(numVal);
        }
        // Intentar parsear como fecha
        if (!dayNum) {
          const dateMatch = dayCell.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
          if (dateMatch) {
            try {
              const d = new Date(dayCell);
              if (!isNaN(d)) dayNum = d.getDate();
            } catch {}
          }
        }
        // Si la primera celda es un número Excel de fecha
        if (!dayNum && typeof row[verticalDayCol] === 'number' && row[verticalDayCol] > 40000) {
          try {
            const d = new Date((row[verticalDayCol] - 25569) * 86400 * 1000);
            if (d.getMonth() + 1 === detectedMonth) dayNum = d.getDate();
          } catch {}
        }

        if (!dayNum) continue;

        // Leer el valor de cada tienda en esta fila
        for (const [code, colIdx] of Object.entries(verticalStoreColumns)) {
          const val = parseNum(row[colIdx]);
          if (val && val > 0) {
            const storeObj = BASE_STORES.find(s => s.code === code);
            if (!storeData[code]) storeData[code] = { store: storeObj, dailyAmounts: {}, monthly: 0, ticket: null, transactions: null };
            storeData[code].dailyAmounts[dayNum] = val;
          }
        }
      }
    } else {
      // ESTRATEGIA 3: Fallback - acumular por tienda (comportamiento anterior)
      const fallbackAccum = {};
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        let storeFound = null;
        let rowVal = 0;
        let ticketVal = null;
        let transVal = null;

        for (let j = 0; j < row.length; j++) {
          const s = matchStore(row[j]);
          if (s) storeFound = s;
          const n = parseNum(row[j]);
          if (n && n > 50_000) rowVal = Math.max(rowVal, n);
        }

        if (storeFound && rowVal > 0) {
          if (!fallbackAccum[storeFound.code]) {
            fallbackAccum[storeFound.code] = { store: storeFound, total: 0, rowCount: 0, ticket: null, transactions: null };
          }
          fallbackAccum[storeFound.code].total += rowVal;
          fallbackAccum[storeFound.code].rowCount++;
        }
      }

      for (const acc of Object.values(fallbackAccum)) {
        const monthly = acc.rowCount > 1 ? Math.round(acc.total) : Math.round(acc.total < 5_000_000 ? acc.total * daysInMonth : acc.total);
        storeData[acc.store.code] = {
          store: acc.store,
          monthly,
          ticket: acc.ticket,
          transactions: acc.transactions,
          dailyAmounts: {}
        };
      }
    }

    // ── Post-proceso: calcular monthly y daily para cada tienda
    const foundStores = [];
    for (const item of Object.values(storeData)) {
      const dailyKeys = Object.keys(item.dailyAmounts);

      if (dailyKeys.length >= 20) {
        // Tenemos presupuestos diarios individuales del Excel ✅
        item.monthly = item.monthly || Object.values(item.dailyAmounts).reduce((a, b) => a + b, 0);
        item.hasDailyBreakdown = true;
      } else {
        // No tenemos diarios individuales - calcular con distribución uniforme
        item.hasDailyBreakdown = false;
        if (!item.monthly || item.monthly === 0) {
          item.monthly = Object.values(item.dailyAmounts).reduce((a, b) => a + b, 0);
          if (item.monthly < 5_000_000 && dailyKeys.length === 1) {
            item.monthly = item.monthly * daysInMonth;
          }
        }
        // Rellenar dailyAmounts con distribución uniforme
        const dailyVal = Math.round(item.monthly / daysInMonth);
        for (let d = 1; d <= daysInMonth; d++) {
          if (!item.dailyAmounts[d]) item.dailyAmounts[d] = dailyVal;
        }
      }

      item.daily = Math.round(item.monthly / daysInMonth);
      foundStores.push(item);
    }

    if (foundStores.length === 0) {
      toast.error('No se encontraron tiendas ni valores en el archivo. Verifica el formato.');
      return;
    }

    const foundCodes = new Set(foundStores.map(s => s.store.code));
    const missing = BASE_STORES.filter(s => !foundCodes.has(s.code));
    if (missing.length > 0) {
      parseErrors.push(`⚠️ No se encontraron ${missing.length} tiendas: ${missing.map(s => s.displayName).join(', ')}`);
    }

    const hasDailyBreakdown = foundStores.some(s => s.hasDailyBreakdown);
    setParsedData({ month: detectedMonth, year: detectedYear, daysInMonth, stores: foundStores, hasDailyBreakdown });
    setErrors(parseErrors);
    setStep('preview');
  };

  // ── GUARDAR EN BD ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!parsedData) return;
    setStep('saving');
    let count = 0;

    console.log(`🚀 Iniciando guardado de ${parsedData.stores.length} tiendas...`);

    for (let idx = 0; idx < parsedData.stores.length; idx++) {
      const item = parsedData.stores[idx];
      
      try {
        console.log(`⏳ Guardando tienda ${idx + 1}/${parsedData.stores.length}: ${item.store.code}`);
        
        // Delay de 2.5 segundos entre cada tienda para evitar rate limit
        if (idx > 0) await new Promise(r => setTimeout(r, 2500));

        // ── 1. Guardar/actualizar Budget
        const existing = await base44.entities.Budget.filter({
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year
        });
        
        await new Promise(r => setTimeout(r, 500));

        const budgetData = {
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year,
          sales_budget: item.monthly,
          tickets_budget: item.ticket || 0,
          transactions_budget: item.transactions || 0,
          suggested_budget: 0,
          is_active: true
        };

        if (existing.length > 0) {
          await base44.entities.Budget.update(existing[0].id, budgetData);
        } else {
          await base44.entities.Budget.create(budgetData);
        }

        await new Promise(r => setTimeout(r, 800));

        // ── 2. Guardar DailyBudget
        const existingDailyRecords = await base44.entities.DailyBudget.filter({ store_id: item.store.code });
        await new Promise(r => setTimeout(r, 300));
        
        const existingByDate = {};
        for (const rec of existingDailyRecords) {
          const dateKey = rec.date?.split('T')[0] || rec.date;
          existingByDate[dateKey] = rec;
        }

        if (parsedData.formatType === 'pdv-fecha' && item.dailyByDate) {
          const hoy = new Date();
          const hoyStr = format(hoy, 'yyyy-MM-dd');
          
          let salesUntilToday = 0;
          let budgetUntilToday = 0;
          const datesSorted = Object.keys(item.dailyByDate).sort();
          
          // Buscar ventas reales
          try {
            const dailySalesRecs = await base44.entities.DailySales.filter({ store_id: item.store.code });
            for (const rec of dailySalesRecs) {
              const recDate = rec.date?.split('T')[0] || rec.date;
              if (recDate <= hoyStr) {
                salesUntilToday += rec.total_sales || 0;
              }
            }
          } catch (_) {}

          await new Promise(r => setTimeout(r, 300));

          for (const dateStr of datesSorted) {
            if (dateStr <= hoyStr) {
              budgetUntilToday += item.dailyByDate[dateStr] || 0;
            }
          }

          const gap = budgetUntilToday - salesUntilToday;
          const remainingDays = datesSorted.filter(d => d > hoyStr).length;
          const adjustmentPerDay = gap > 0 && remainingDays > 0 ? Math.ceil(gap / remainingDays) : 0;

          // Guardar cada DailyBudget con delay
          for (const [dateStr, budgetAmount] of Object.entries(item.dailyByDate)) {
            if (!budgetAmount) continue;
            
            const finalAmount = dateStr > hoyStr && adjustmentPerDay > 0
              ? budgetAmount + adjustmentPerDay
              : budgetAmount;

            const dailyData = { store_id: item.store.code, date: dateStr, budget_amount: Math.round(finalAmount) };
            if (existingByDate[dateStr]) {
              await base44.entities.DailyBudget.update(existingByDate[dateStr].id, dailyData);
            } else {
              await base44.entities.DailyBudget.create(dailyData);
            }
            // Pequeño delay entre cada DailyBudget
            await new Promise(r => setTimeout(r, 50));
          }
        }

        count++;
        setSavedCount(count);
        console.log(`✅ ${item.store.code} guardada (${count}/${parsedData.stores.length})`);

      } catch (err) {
        console.error(`❌ Error guardando ${item.store.code}:`, err);
      }
    }

    console.log(`🎉 Completado: ${count} tiendas guardadas de ${parsedData.stores.length}`);

    queryClient.invalidateQueries({ queryKey: ['allBudgets'] });
    queryClient.invalidateQueries({ queryKey: ['genesis_budgets'] });
    queryClient.invalidateQueries({ queryKey: ['gerenteHomeBudgets'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dailyBudgets'] });

    setStep('done');
    toast.success(`✅ ${count} tiendas actualizadas con presupuesto`);
  };

  const fmtCOP = (v) => v ? `$${Math.round(v).toLocaleString('es-CO')}` : '–';
  const fmtNum = (v) => v ? Math.round(v).toLocaleString('es-CO') : '–';
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const hasTicket = parsedData?.stores.some(s => s.ticket);
  const hasTransactions = parsedData?.stores.some(s => s.transactions);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-white/15 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#0f172a' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/25 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Importar Presupuesto desde Excel</p>
              <p className="text-[10px] text-slate-400">Detecta automáticamente las {BASE_STORES.length} tiendas</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-10 text-center cursor-pointer transition-all group"
                style={{ background: 'rgba(16,185,129,0.04)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) parseExcel(file);
                }}
              >
                <Upload className="w-12 h-12 text-emerald-500/50 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
                <p className="text-white font-bold text-base mb-1">Arrastra el archivo aquí o haz clic</p>
                <p className="text-slate-500 text-xs">Soporta .xlsx, .xls, .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) parseExcel(e.target.files[0]); }}
                />
              </div>

              <div className="rounded-xl border border-white/8 p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-blue-300">Columnas reconocidas</p>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <p>• <span className="text-white font-semibold">Tienda:</span> Nombre, código (BTA 62), número (62) o alias (FONTANAR, COLINA…)</p>
                  <p>• <span className="text-white font-semibold">Presupuesto Mes / PPT Mes:</span> Ventas totales del mes (se toma directo)</p>
                  <p>• <span className="text-white font-semibold">PPT Día:</span> Si no está, se calcula automáticamente (mensual ÷ días)</p>
                  <p>• <span className="text-white font-semibold">Ticket / TKT:</span> PPT ticket promedio mensual</p>
                  <p>• <span className="text-white font-semibold">Transacciones / TRX:</span> Meta de transacciones del mes</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && parsedData && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="rounded-xl border border-emerald-500/25 p-4 flex items-center gap-3"
                style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    {parsedData.stores.length} de {BASE_STORES.length} tiendas detectadas · {monthNames[parsedData.month - 1]} {parsedData.year}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {parsedData.daysInMonth} días · {parsedData.hasDailyBreakdown ? '✅ PPT diario individual detectado por día' : 'PPT diario = presupuesto mensual ÷ ' + parsedData.daysInMonth}
                  </p>
                </div>
                {parsedData.stores.length < BASE_STORES.length && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300">{BASE_STORES.length - parsedData.stores.length} faltantes</span>
                  </div>
                )}
              </div>

              {/* Errores / advertencias */}
              {errors.length > 0 && (
                <div className="rounded-xl border border-amber-500/25 p-4" style={{ background: 'rgba(245,158,11,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-bold text-amber-300">Advertencias</p>
                  </div>
                  <div className="space-y-1">
                    {errors.map((e, i) => <p key={i} className="text-[10px] text-slate-400">{e}</p>)}
                  </div>
                </div>
              )}

              {/* Tabla */}
              {(() => {
                const cols = hasTicket && hasTransactions ? '3fr 2fr 1.5fr 1.5fr'
                  : hasTicket || hasTransactions ? '3fr 2fr 1.5fr'
                  : '4fr 3fr';
                const totalMonthly = parsedData.stores.reduce((s, x) => s + (x.monthly || 0), 0);
                return (
                  <div className="rounded-xl border border-white/8 overflow-hidden">
                    <div className="grid px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/8"
                      style={{ gridTemplateColumns: cols }}>
                      <span>Tienda</span>
                      <span className="text-right">PPT Mes Ventas</span>
                      {hasTicket && <span className="text-right">PPT Ticket</span>}
                      {hasTransactions && <span className="text-right">PPT Trx Mes</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {parsedData.stores.map((item, i) => (
                        <motion.div
                          key={item.store.code}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="grid px-4 py-3 hover:bg-white/3 transition-colors"
                          style={{ gridTemplateColumns: cols }}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{item.store.displayName}</p>
                            <p className="text-[9px] text-slate-500">{item.store.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-400 tabular-nums">{fmtCOP(item.monthly)}</p>
                          </div>
                          {hasTicket && (
                            <div className="text-right">
                              <p className="text-xs font-bold text-purple-300 tabular-nums">{fmtCOP(item.ticket)}</p>
                            </div>
                          )}
                          {hasTransactions && (
                            <div className="text-right">
                              <p className="text-xs font-bold text-blue-300 tabular-nums">{fmtNum(item.transactions)}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {/* Totales */}
                    <div className="grid px-4 py-3 border-t border-white/10 bg-white/3"
                      style={{ gridTemplateColumns: cols }}>
                      <p className="text-xs font-black text-white">TOTAL ZONA ({parsedData.stores.length} tiendas)</p>
                      <p className="text-xs font-black text-emerald-300 tabular-nums text-right">
                        {fmtCOP(totalMonthly)}
                      </p>
                      {hasTicket && (
                        <p className="text-xs font-black text-purple-200 tabular-nums text-right">–</p>
                      )}
                      {hasTransactions && (
                        <p className="text-xs font-black text-blue-200 tabular-nums text-right">
                          {fmtNum(parsedData.stores.reduce((s, x) => s + (x.transactions || 0), 0))}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tiendas no encontradas */}
              {(() => {
                const foundCodes = new Set(parsedData.stores.map(s => s.store.code));
                const missing = BASE_STORES.filter(s => !foundCodes.has(s.code));
                if (!missing.length) return null;
                return (
                  <div className="rounded-xl border border-red-500/20 p-3" style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <p className="text-[10px] font-bold text-red-400 mb-1">Tiendas no encontradas en el archivo ({missing.length}):</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {missing.map(s => (
                        <span key={s.code} className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-0.5 rounded">{s.displayName}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP: SAVING */}
          {step === 'saving' && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
              <p className="text-white font-bold">Guardando presupuestos...</p>
              <p className="text-slate-400 text-sm">{savedCount} de {parsedData?.stores.length} tiendas</p>
              <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-400 rounded-full"
                  animate={{ width: `${parsedData?.stores.length ? (savedCount / parsedData.stores.length) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && (
            <div className="py-16 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <p className="text-xl font-black text-white">¡Presupuestos actualizados!</p>
              <p className="text-slate-400 text-sm">{savedCount} tiendas guardadas</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {step === 'upload' && (
            <p className="text-[10px] text-slate-600">Los presupuestos se guardan por tienda, mes y año</p>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => { setStep('upload'); setParsedData(null); setErrors([]); }}
                className="text-sm text-slate-400 hover:text-white transition-colors">
                ← Cargar otro archivo
              </button>
              <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
                Guardar {parsedData.stores.length} tiendas →
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
              Cerrar y ver resultados
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}