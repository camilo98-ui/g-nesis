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
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        analyzeSheet(rows);
      } catch (err) {
        toast.error('No se pudo leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const analyzeSheet = (rows) => {
    const foundStores = [];
    const parseErrors = [];
    let detectedMonth = now.getMonth() + 1;
    let detectedYear = now.getFullYear();

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

    // Identificar fila de encabezados y columnas relevantes
    let headerRowIdx = -1;
    let colStore = -1, colMonthly = -1, colDaily = -1, colTicket = -1, colTransactions = -1;

    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      let foundInRow = false;
      for (let j = 0; j < row.length; j++) {
        const h = normalize(String(row[j] || ''));
        if (!h) continue;

        if (colStore === -1 && (h.includes('tienda') || h.includes('store') || h.includes('punto') || h.includes('local') || h.includes('sede'))) {
          colStore = j; foundInRow = true;
        }
        // Presupuesto mensual de ventas
        if (colMonthly === -1 && (
          h.includes('ppto mes') || h.includes('ppt mes') || h.includes('presupuesto mes') ||
          h.includes('budget mes') || h.includes('meta mes') || h.includes('ventas mes') ||
          (h.includes('mes') && !h.includes('ticket') && !h.includes('trx') && !h.includes('trans')) ||
          h === 'ppto' || h === 'presupuesto' || h === 'budget'
        )) {
          colMonthly = j; foundInRow = true;
        }
        // PPT diario de ventas
        if (colDaily === -1 && (
          h.includes('ppto dia') || h.includes('ppt dia') || h.includes('diario') || h.includes('daily') ||
          h.includes('dia') && h.includes('venta')
        )) {
          colDaily = j; foundInRow = true;
        }
        // PPT Ticket promedio
        if (colTicket === -1 && (
          h.includes('ticket') || h.includes('tkt') || h.includes('promedio') && h.includes('venta')
        )) {
          colTicket = j; foundInRow = true;
        }
        // PPT Transacciones
        if (colTransactions === -1 && (
          h.includes('transacc') || h.includes('trx') || h.includes('txn') ||
          h.includes('transac') || h.includes('operac')
        )) {
          colTransactions = j; foundInRow = true;
        }
      }
      if (foundInRow && headerRowIdx === -1) {
        headerRowIdx = i;
        break;
      }
    }

    const dataStartRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    // Escanear filas de datos
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

      // Buscar tienda en la fila
      let storeMatch = null;
      if (colStore >= 0) {
        storeMatch = matchStore(row[colStore]);
        // Si no matchea en la columna de tienda, buscar en toda la fila
        if (!storeMatch) {
          for (const cell of row) {
            storeMatch = matchStore(cell);
            if (storeMatch) break;
          }
        }
      } else {
        for (const cell of row) {
          storeMatch = matchStore(cell);
          if (storeMatch) break;
        }
      }

      if (!storeMatch) continue;

      // Obtener valores numéricos de la fila
      let rowSalesVal = colMonthly >= 0 ? parseNum(row[colMonthly]) : null;
      let rowDailyVal = colDaily >= 0 ? parseNum(row[colDaily]) : null;
      let ticketVal = colTicket >= 0 ? parseNum(row[colTicket]) : null;
      let transactionsVal = colTransactions >= 0 ? parseNum(row[colTransactions]) : null;

      // Si no hay columnas identificadas, buscar el número más grande de la fila (>100k = ventas)
      if (rowSalesVal === null && rowDailyVal === null) {
        const nums = [];
        for (const cell of row) {
          const n = parseNum(cell);
          if (n && n > 100_000) nums.push(n);
        }
        if (nums.length > 0) {
          nums.sort((a, b) => b - a);
          rowSalesVal = nums[0];
        }
      }

      if (!rowSalesVal && !rowDailyVal) continue;

      // El valor que viene puede ser diario o mensual.
      // Si el valor es "pequeño" (< 2M para una tienda de ~$300K/día) probablemente es diario → sumar.
      // Si es grande (> presupuesto de un solo día * 2) probablemente ya es mensual → usar directo.
      const valueToAdd = rowSalesVal || rowDailyVal;

      const existing = foundStores.find(s => s.store.code === storeMatch.code);
      if (!existing) {
        foundStores.push({
          store: storeMatch,
          accumulatedSales: valueToAdd,
          rowCount: 1,
          ticket: ticketVal,
          transactions: transactionsVal,
        });
      } else {
        // Acumular: si ya existe la tienda, sumar el valor (puede ser más de una fila por día)
        existing.accumulatedSales = (existing.accumulatedSales || 0) + valueToAdd;
        existing.rowCount = (existing.rowCount || 1) + 1;
        if (ticketVal && !existing.ticket) existing.ticket = ticketVal;
        if (transactionsVal) existing.transactions = (existing.transactions || 0) + transactionsVal;
      }
    }

    // Post-proceso: convertir accumulatedSales a monthly/daily
    for (const item of foundStores) {
      const accumulated = item.accumulatedSales || 0;
      // Si acumulamos múltiples filas (días), es la suma de días → ese ES el mensual
      // Si solo hay 1 fila y el valor parece diario (< 5M), multiplicar por días del mes
      if (item.rowCount === 1 && accumulated < 5_000_000) {
        // Parece valor de un solo día → multiplicar
        item.monthly = Math.round(accumulated * daysInMonth);
      } else {
        // Ya es la suma de todos los días = mensual
        item.monthly = Math.round(accumulated);
      }
      item.daily = Math.round(item.monthly / daysInMonth);
    }

    // Modo libre: si no encontramos suficientes, escanear toda la hoja acumulando por tienda
    if (foundStores.length < 6) {
      const freeAccum = {};
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let storeFound = null;
        let rowVal = 0;

        for (const cell of row) {
          const s = matchStore(cell);
          if (s) storeFound = s;
          const n = parseNum(cell);
          if (n && n > 100_000) rowVal = Math.max(rowVal, n);
        }

        if (storeFound && rowVal > 0) {
          if (!freeAccum[storeFound.code]) {
            freeAccum[storeFound.code] = { store: storeFound, total: 0, rows: 0 };
          }
          freeAccum[storeFound.code].total += rowVal;
          freeAccum[storeFound.code].rows += 1;
        }
      }

      for (const acc of Object.values(freeAccum)) {
        const alreadyFound = foundStores.find(s => s.store.code === acc.store.code);
        if (!alreadyFound) {
          const monthly = acc.rows === 1 && acc.total < 5_000_000
            ? Math.round(acc.total * daysInMonth)
            : Math.round(acc.total);
          foundStores.push({
            store: acc.store,
            monthly,
            daily: Math.round(monthly / daysInMonth),
            ticket: null,
            transactions: null,
          });
        }
      }
    }

    if (foundStores.length === 0) {
      toast.error('No se encontraron tiendas ni valores en el archivo. Verifica el formato.');
      return;
    }

    // Advertir si faltan tiendas
    const foundCodes = new Set(foundStores.map(s => s.store.code));
    const missing = BASE_STORES.filter(s => !foundCodes.has(s.code));
    if (missing.length > 0) {
      parseErrors.push(`⚠️ No se encontraron ${missing.length} tiendas: ${missing.map(s => s.displayName).join(', ')}`);
    }

    setParsedData({ month: detectedMonth, year: detectedYear, daysInMonth, stores: foundStores });
    setErrors(parseErrors);
    setStep('preview');
  };

  // ── GUARDAR EN BD ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!parsedData) return;
    setStep('saving');
    let count = 0;

    for (const item of parsedData.stores) {
      try {
        const existing = await base44.entities.Budget.filter({
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year
        });

        const budgetData = {
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year,
          sales_budget: item.monthly,                          // mensual directo del Excel
          tickets_budget: item.ticket || 0,                   // PPT ticket promedio
          transactions_budget: item.transactions || 0,         // PPT transacciones del mes
          suggested_budget: 0,
          is_active: true
        };

        if (existing.length > 0) {
          await base44.entities.Budget.update(existing[0].id, budgetData);
        } else {
          await base44.entities.Budget.create(budgetData);
        }

        // Guardar DailyBudget
        try {
          const today = format(new Date(parsedData.year, parsedData.month - 1, new Date().getDate()), 'yyyy-MM-dd');
          const existingDaily = await base44.entities.DailyBudget.filter({ store_id: item.store.code, date: today });
          const dailyData = { store_id: item.store.code, date: today, budget_amount: item.daily, month: parsedData.month, year: parsedData.year };
          if (existingDaily.length > 0) {
            await base44.entities.DailyBudget.update(existingDaily[0].id, dailyData);
          } else {
            await base44.entities.DailyBudget.create(dailyData);
          }
        } catch (_) {}

        count++;
        setSavedCount(count);
      } catch (err) {
        console.warn(`Error guardando ${item.store.code}:`, err);
      }
    }

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
                    {parsedData.daysInMonth} días · PPT diario = presupuesto mensual ÷ {parsedData.daysInMonth}
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