import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { BASE_STORES } from '@/components/StoreManager';
import { format, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Normalizar texto para comparación (sin tildes, mayúsculas, sin espacios extra)
const normalize = (str = '') =>
  str.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();

// Intentar identificar a qué tienda pertenece un nombre del Excel
const matchStore = (cellValue) => {
  if (!cellValue) return null;
  const normalized = normalize(cellValue);
  
  for (const store of BASE_STORES) {
    // Comparar con código exacto
    if (normalize(store.code) === normalized) return store;
    // Comparar con displayName
    if (normalize(store.displayName) === normalized) return store;
    // Comparar con name
    if (normalize(store.name) === normalized) return store;
    // Comparar si el valor contiene el número del código (ej: "11" en "BTA 11")
    const codeNum = store.code.replace(/[^0-9]/g, '');
    if (codeNum && normalized === codeNum) return store;
    // Fuzzy: si el nombre del store está contenido en el valor o viceversa
    const dispNorm = normalize(store.displayName);
    if (dispNorm && (normalized.includes(dispNorm) || dispNorm.includes(normalized))) return store;
  }
  return null;
};

// Parsear valor numérico de una celda (puede venir como string con $, comas, puntos)
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/[\$\s,]/g, '').replace(/\./g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export default function BudgetExcelImporter({ onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | preview | saving | done
  const [parsedData, setParsedData] = useState(null); // { month, year, stores: [{store, monthly, daily}] }
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
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

    // Intentar detectar mes/año en las primeras filas
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      for (const cell of rows[i]) {
        const cellStr = cell?.toString() || '';
        // Buscar patrón de fecha ej "Marzo 2026", "03/2026", "2026-03"
        const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        for (let m = 0; m < monthNames.length; m++) {
          if (normalize(cellStr).includes(monthNames[m])) {
            detectedMonth = m + 1;
            const yearMatch = cellStr.match(/20\d{2}/);
            if (yearMatch) detectedYear = parseInt(yearMatch[0]);
            break;
          }
        }
        // Formato numérico MM/YYYY o YYYY-MM
        const numMatch = cellStr.match(/(?:(\d{1,2})\/|(\d{4})-(\d{2}))(20\d{2}|\d{2})/);
        if (numMatch) {
          // intentar extraer
        }
      }
    }

    const daysInMonth = getDaysInMonth(new Date(detectedYear, detectedMonth - 1));

    // Identificar columnas: buscamos cabeceras con "tienda", "store", "presupuesto", "mes", "dia", "diario"
    let headerRowIdx = -1;
    let colStore = -1, colMonthly = -1, colDaily = -1;

    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        const h = normalize(row[j]);
        if (colStore === -1 && (h.includes('tienda') || h.includes('store') || h.includes('punto') || h.includes('local'))) {
          colStore = j; headerRowIdx = i;
        }
        if (colMonthly === -1 && (h.includes('mes') || h.includes('mensual') || h.includes('month') || h.includes('presupuesto') || h.includes('ppto') || h.includes('budget'))) {
          colMonthly = j; if (headerRowIdx === -1) headerRowIdx = i;
        }
        if (colDaily === -1 && (h.includes('dia') || h.includes('diario') || h.includes('daily') || h.includes('ppt dia') || h.includes('pptd'))) {
          colDaily = j; if (headerRowIdx === -1) headerRowIdx = i;
        }
      }
      if (headerRowIdx !== -1) break;
    }

    // Si no encontramos cabeceras de columna, intentar estrategia por fila: cada fila = tienda
    const dataStartRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => c === '' || c === null)) continue;

      let storeMatch = null;
      let monthlyVal = null;
      let dailyVal = null;

      if (colStore >= 0) {
        storeMatch = matchStore(row[colStore]);
      } else {
        // Buscar en cualquier celda de la fila una tienda
        for (const cell of row) {
          storeMatch = matchStore(cell);
          if (storeMatch) break;
        }
      }

      if (!storeMatch) continue;

      // Presupuesto mensual
      if (colMonthly >= 0) {
        monthlyVal = parseNum(row[colMonthly]);
      } else {
        // Tomar el primer número grande de la fila (> 1M)
        for (const cell of row) {
          const n = parseNum(cell);
          if (n && n > 1_000_000) { monthlyVal = n; break; }
        }
      }

      // Presupuesto diario
      if (colDaily >= 0) {
        dailyVal = parseNum(row[colDaily]);
      } else if (monthlyVal) {
        // Calcular como mensual / días del mes
        dailyVal = Math.round(monthlyVal / daysInMonth);
      }

      if (!monthlyVal && !dailyVal) {
        parseErrors.push(`Fila ${i + 1}: Se encontró "${storeMatch.displayName}" pero sin valores numéricos`);
        continue;
      }

      // Si viene diario pero no mensual, calcular mensual
      if (dailyVal && !monthlyVal) monthlyVal = dailyVal * daysInMonth;
      // Si viene mensual pero no diario, calcular diario
      if (monthlyVal && !dailyVal) dailyVal = Math.round(monthlyVal / daysInMonth);

      // Evitar duplicados
      const existing = foundStores.find(s => s.store.code === storeMatch.code);
      if (!existing) {
        foundStores.push({ store: storeMatch, monthly: monthlyVal, daily: dailyVal });
      }
    }

    // Si no encontramos nada por columnas, intentar modo "libre": escanear toda la hoja
    if (foundStores.length === 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let storeFound = null;
        let numFound = null;

        for (let j = 0; j < row.length; j++) {
          const s = matchStore(row[j]);
          if (s) storeFound = s;
          const n = parseNum(row[j]);
          if (n && n > 500_000) numFound = n; // umbral mínimo de medio millón
        }

        if (storeFound && numFound) {
          const existing = foundStores.find(s => s.store.code === storeFound.code);
          if (!existing) {
            foundStores.push({
              store: storeFound,
              monthly: numFound,
              daily: Math.round(numFound / daysInMonth)
            });
          }
        }
      }
    }

    if (foundStores.length === 0) {
      toast.error('No se encontraron tiendas ni valores en el archivo. Verifica el formato.');
      return;
    }

    setParsedData({ month: detectedMonth, year: detectedYear, daysInMonth, stores: foundStores });
    setErrors(parseErrors);
    setStep('preview');
  };

  // ── GUARDAR EN BD ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!parsedData) return;
    setSaving(true);
    setStep('saving');
    let count = 0;

    for (const item of parsedData.stores) {
      try {
        // Buscar si ya existe presupuesto para esta tienda/mes/año
        const existing = await base44.entities.Budget.filter({
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year
        });

        const budgetData = {
          store_id: item.store.code,
          month: parsedData.month,
          year: parsedData.year,
          sales_budget: item.monthly,
          tickets_budget: 0,
          transactions_budget: 0,
          suggested_budget: 0,
          is_active: true
        };

        if (existing.length > 0) {
          await base44.entities.Budget.update(existing[0].id, budgetData);
        } else {
          await base44.entities.Budget.create(budgetData);
        }

        // También guardar presupuesto diario en DailyBudget si existe la entidad
        try {
          const today = format(new Date(parsedData.year, parsedData.month - 1, new Date().getDate()), 'yyyy-MM-dd');
          const existingDaily = await base44.entities.DailyBudget.filter({
            store_id: item.store.code,
            date: today
          });
          const dailyData = {
            store_id: item.store.code,
            date: today,
            sales_budget: item.daily,
            month: parsedData.month,
            year: parsedData.year
          };
          if (existingDaily.length > 0) {
            await base44.entities.DailyBudget.update(existingDaily[0].id, dailyData);
          } else {
            await base44.entities.DailyBudget.create(dailyData);
          }
        } catch (_) {
          // DailyBudget puede no existir, continuar
        }

        count++;
        setSavedCount(count);
      } catch (err) {
        console.warn(`Error guardando ${item.store.code}:`, err);
      }
    }

    // Invalidar todas las queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['allBudgets'] });
    queryClient.invalidateQueries({ queryKey: ['genesis_budgets'] });
    queryClient.invalidateQueries({ queryKey: ['gerenteHomeBudgets'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dailyBudgets'] });

    setSaving(false);
    setStep('done');
    toast.success(`✅ ${count} tiendas actualizadas con presupuesto`);
  };

  const fmtCOP = (v) => v ? `$${Math.round(v).toLocaleString('es-CO')}` : '–';
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-white/15 overflow-hidden max-h-[90vh] flex flex-col"
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
              <p className="text-[10px] text-slate-400">Carga el archivo y la app detecta las tiendas automáticamente</p>
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
              {/* Zona de carga */}
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

              {/* Instrucciones de formato */}
              <div className="rounded-xl border border-white/8 p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-blue-300">Formatos aceptados</p>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <p>• <span className="text-white font-semibold">Columnas:</span> El archivo puede tener columnas "Tienda", "Presupuesto Mes" y opcionalmente "PPT Día"</p>
                  <p>• <span className="text-white font-semibold">Nombres de tienda:</span> Puede usar el código (ej: BTA 62), nombre corto (ej: FONTANAR) o nombre completo</p>
                  <p>• <span className="text-white font-semibold">Valores:</span> Los valores numéricos pueden incluir $, puntos o comas (ej: $12.500.000)</p>
                  <p>• <span className="text-white font-semibold">PPT Diario:</span> Si no está en el archivo, se calcula como presupuesto mensual ÷ días del mes</p>
                  <p>• <span className="text-white font-semibold">Mes:</span> Si el archivo dice "Marzo 2026" en alguna celda se detecta automáticamente</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && parsedData && (
            <div className="space-y-4">
              {/* Resumen de detección */}
              <div className="rounded-xl border border-emerald-500/25 p-4 flex items-center gap-3"
                style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">
                    {parsedData.stores.length} tiendas detectadas · {monthNames[parsedData.month - 1]} {parsedData.year}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {parsedData.daysInMonth} días en el mes · PPT diario = mensual ÷ {parsedData.daysInMonth}
                  </p>
                </div>
              </div>

              {/* Metodología redistribución */}
              <div className="rounded-xl border border-indigo-500/20 p-4" style={{ background: 'rgba(99,102,241,0.07)' }}>
                <p className="text-[11px] font-bold text-indigo-300 mb-1">📊 Metodología de análisis de brecha</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Cuando una tienda tenga déficit (ventas &lt; meta), la app calculará automáticamente el
                  <span className="text-white font-semibold"> PPT diario dinámico</span> como:
                  <span className="text-amber-300"> (Presupuesto Mensual − Ventas acumuladas) ÷ Días restantes</span>.
                  Así el objetivo se redistribuye cada día para que la tienda pueda cumplir al cierre del mes.
                </p>
              </div>

              {/* Errores / advertencias */}
              {errors.length > 0 && (
                <div className="rounded-xl border border-amber-500/25 p-4" style={{ background: 'rgba(245,158,11,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-bold text-amber-300">Advertencias ({errors.length})</p>
                  </div>
                  <div className="space-y-1">
                    {errors.map((e, i) => <p key={i} className="text-[10px] text-slate-400">{e}</p>)}
                  </div>
                </div>
              )}

              {/* Tabla de tiendas detectadas */}
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/8">
                  <span className="col-span-5">Tienda</span>
                  <span className="col-span-4 text-right">Presupuesto Mes</span>
                  <span className="col-span-3 text-right">PPT Día</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {parsedData.stores.map((item, i) => (
                    <motion.div
                      key={item.store.code}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-12 px-4 py-3 hover:bg-white/3 transition-colors"
                    >
                      <div className="col-span-5">
                        <p className="text-xs font-bold text-white">{item.store.displayName}</p>
                        <p className="text-[9px] text-slate-500">{item.store.code}</p>
                      </div>
                      <div className="col-span-4 text-right">
                        <p className="text-xs font-black text-emerald-400 tabular-nums">{fmtCOP(item.monthly)}</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-xs font-bold text-amber-300 tabular-nums">{fmtCOP(item.daily)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Totales */}
                <div className="grid grid-cols-12 px-4 py-3 border-t border-white/10 bg-white/3">
                  <div className="col-span-5">
                    <p className="text-xs font-black text-white">TOTAL ZONA</p>
                  </div>
                  <div className="col-span-4 text-right">
                    <p className="text-xs font-black text-emerald-300 tabular-nums">
                      {fmtCOP(parsedData.stores.reduce((s, x) => s + (x.monthly || 0), 0))}
                    </p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className="text-xs font-black text-amber-200 tabular-nums">
                      {fmtCOP(parsedData.stores.reduce((s, x) => s + (x.daily || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tiendas no encontradas */}
              {(() => {
                const foundCodes = new Set(parsedData.stores.map(s => s.store.code));
                const missing = BASE_STORES.filter(s => !foundCodes.has(s.code));
                if (!missing.length) return null;
                return (
                  <div className="rounded-xl border border-slate-700 p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-[10px] text-slate-500 mb-1">Tiendas sin datos en el archivo ({missing.length}):</p>
                    <p className="text-[10px] text-slate-600">{missing.map(s => s.displayName).join(' · ')}</p>
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
              <p className="text-slate-400 text-sm">
                {savedCount} tiendas con presupuesto mensual y PPT diario configurados
              </p>
              <p className="text-[11px] text-slate-500">
                El dashboard ahora usará estos valores y redistribuirá automáticamente cuando haya déficit
              </p>
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
              <Button onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
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