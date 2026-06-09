import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extraer código de tienda desde encabezados del Excel
// Soporta: "BTA 21", "BOGOTA 66", "Bogotá 66", "BTA21", etc.
function extractStoreCode(headerStr) {
  if (!headerStr) return null;
  const str = String(headerStr).toUpperCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quitar tildes
  const btaMatch = str.match(/\bBTA\s*(\d+)/);
  if (btaMatch) return `BTA ${btaMatch[1]}`;
  const tunjaMatch = str.match(/\bTUNJA\s*(\d+)/);
  if (tunjaMatch) return `TUNJA ${tunjaMatch[1]}`;
  // BOGOTA / BOG / BOGOTA con o sin tilde
  const bogotaMatch = str.match(/\bBOGOTA\s*(\d+)/);
  if (bogotaMatch) return `BOGOTA ${bogotaMatch[1]}`;
  const bogMatch = str.match(/\bBOG\s*(\d+)/);
  if (bogMatch) return `BOGOTA ${bogMatch[1]}`;
  return null;
}

// Parsear el Excel de agregadores
// Soporta dos formatos:
// Formato A (clásico): primera fila = tiendas, primera columna = canal, celdas = % participación
// Formato B (nuevo):   columnas Mes(tienda), Canal, SubCanal, VentaBruta
//   Ejemplo: { Mes: 'BTA 18 (CC...)', col_1: 'Al Paso', col_2: 'Total', May: 159594020 }
function parseAggregatorsExcel(XLSX, arrayBuffer, month, year) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (jsonRows.length === 0) return [];

  const reportId = `agg_${Date.now()}`;
  const uploadedAt = new Date().toISOString();
  const records = [];

  const parseNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const n = parseFloat(String(val).replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  // Detectar formato B: primera fila tiene columna "Mes" (o similar) con nombre de tienda
  const firstRow = jsonRows[0];
  const keys = Object.keys(firstRow);
  const firstKey = keys[0];
  const firstVal = String(firstRow[firstKey] || '');
  const isFormatB = firstVal.toLowerCase().includes('punto de venta') || 
                    extractStoreCode(firstVal) !== null ||
                    firstKey === 'Mes';

  if (isFormatB) {
    // Formato B: cada fila es { Mes: tienda, col_1: canal, col_2: subcanal, May/col: venta }
    // Saltar la primera fila si es la fila de etiquetas (ej: "Punto de Venta", "Canal", "SubCanal", "Venta Bruta")
    const isHeaderRow = (row) => {
      const v = String(row[firstKey] || '').toLowerCase();
      return v.includes('punto de venta') || v.includes('tienda') || v === 'mes';
    };
    const dataRows = isHeaderRow(firstRow) ? jsonRows.slice(1) : jsonRows;

    // Columna de venta bruta: buscar la que tenga el mayor valor numérico (descartando participaciones 0-1)
    // El archivo tiene columnas duplicadas "May" → xlsx las renombra "May" y "May_1" o similar
    const ventaKey = keys.slice(2).reduce((best, k) => {
      const maxVal = dataRows.reduce((m, row) => Math.max(m, parseNum(row[k]) || 0), 0);
      const bestVal = best ? dataRows.reduce((m, row) => Math.max(m, parseNum(row[best]) || 0), 0) : 0;
      return maxVal > bestVal ? k : best;
    }, null) || keys[3];

    // Propagación: si Mes está vacío, usar la última tienda vista
    let lastStore = null;
    for (const row of dataRows) {
      const storeRaw = row[firstKey] ? String(row[firstKey]).trim() : null;
      const storeCode = storeRaw ? extractStoreCode(storeRaw) : null;
      if (storeCode) lastStore = storeCode;
      if (!lastStore) continue;

      // Tomar canal y subcanal
      const canal = row[keys[1]] ? String(row[keys[1]]).trim() : null;
      const subcanal = row[keys[2]] ? String(row[keys[2]]).trim() : null;
      if (!canal || canal.toLowerCase() === 'canal') continue;

      // Saltar filas de totales de tienda (canal = 'Total' sin subcanal)
      const isStoreTotal = canal.toLowerCase() === 'total' && !subcanal;
      if (isStoreTotal) continue;

      // Canal: si subcanal es 'Total' o vacío, usar solo el canal; si no, combinar
      const channel = subcanal && subcanal.toLowerCase() !== 'total' ? `${canal} - ${subcanal}` : canal;

      const rawVenta = parseNum(row[ventaKey]);
      if (rawVenta === null || rawVenta === 0) continue;

      records.push({
        store_code: lastStore,
        channel,
        participation: 0, // se calcula después
        total_sales: rawVenta,
        report_id: reportId,
        uploaded_at: uploadedAt,
        month,
        year,
      });
    }

    // Calcular participación por tienda
    const storeTotal = {};
    for (const r of records) {
      storeTotal[r.store_code] = (storeTotal[r.store_code] || 0) + r.total_sales;
    }
    for (const r of records) {
      r.participation = storeTotal[r.store_code] > 0 ? r.total_sales / storeTotal[r.store_code] : 0;
    }

    return records;
  }

  // Formato A clásico (filas = canal, columnas = tiendas)
  const rawRows = XLSX.utils.sheet_to_json(XLSX.read(arrayBuffer, { type: 'array' }).Sheets[workbook.SheetNames[0]], { header: 1, defval: null });
  if (rawRows.length < 2) return [];
  const headerRow = rawRows[0];
  let dataStartRow = 1;
  if (rawRows[1] && String(rawRows[1][0] || '').toLowerCase().includes('canal')) dataStartRow = 2;

  const storeGroups = {};
  const storeSeen = {};
  for (let col = 1; col < headerRow.length; col++) {
    const code = extractStoreCode(headerRow[col]);
    if (!code) {
      for (let back = col - 1; back >= 1; back--) {
        const backCode = extractStoreCode(headerRow[back]);
        if (backCode && storeGroups[backCode] && storeGroups[backCode].colVenta === null) {
          storeGroups[backCode].colVenta = col; break;
        }
        if (backCode) break;
      }
      continue;
    }
    if (!storeSeen[code]) { storeSeen[code] = 0; storeGroups[code] = { colPart: null, colVenta: null }; }
    storeSeen[code]++;
    if (storeSeen[code] === 1) storeGroups[code].colPart = col;
    else storeGroups[code].colVenta = col;
  }

  for (let row = dataStartRow; row < rawRows.length; row++) {
    const rowData = rawRows[row];
    if (!rowData || !rowData[0]) continue;
    const channel = String(rowData[0]).trim();
    if (!channel || channel.toLowerCase() === 'canal') continue;
    for (const [storeCode, { colPart, colVenta }] of Object.entries(storeGroups)) {
      if (colPart === null) continue;
      const rawPart = parseNum(rowData[colPart]);
      const rawVenta = colVenta !== null ? parseNum(rowData[colVenta]) : null;
      if (rawPart === null && rawVenta === null) continue;
      records.push({
        store_code: storeCode,
        channel,
        participation: rawPart !== null ? (rawPart > 1 ? rawPart / 100 : rawPart) : 0,
        total_sales: rawVenta || 0,
        report_id: reportId,
        uploaded_at: uploadedAt,
        month,
        year,
      });
    }
  }

  return records;
}

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function AggregatorsUploader({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('parsing');
    setMessage('Analizando archivo...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const XLSX = await import('xlsx');
      const records = parseAggregatorsExcel(XLSX, e.target.result, selectedMonth, selectedYear);

      if (records.length === 0) {
        setStatus('error');
        setMessage('No se encontraron datos. Verifica que la primera fila tenga códigos de tienda (BTA 21, TUNJA 1, etc.) y la columna izquierda tenga los canales (Al Paso, Didi, Rappi...).');
        return;
      }

      setStatus('uploading');
      setProgress({ current: 0, total: records.length });
      setMessage(`Guardando ${records.length} registros...`);

      try {
        // Borrar registros anteriores
        const existing = await base44.entities.AggregatorsData.list();
        for (const rec of existing) {
          await base44.entities.AggregatorsData.delete(rec.id);
        }

        const chunkSize = 50;
        let inserted = 0;
        for (let i = 0; i < records.length; i += chunkSize) {
          await base44.entities.AggregatorsData.bulkCreate(records.slice(i, i + chunkSize));
          inserted += Math.min(chunkSize, records.length - i);
          setProgress({ current: inserted, total: records.length });
        }

        const storesDetected = [...new Set(records.map(r => r.store_code))];
        setStatus('success');
        setMessage(`✅ ${inserted} registros · Tiendas: ${storesDetected.join(', ')}`);
        onSuccess?.();
      } catch (err) {
        setStatus('error');
        setMessage(`Error: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Cargar Agregadores</h2>
              <p className="text-white/70 text-xs">Solo Gerente · Formato .xlsx</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Selector de mes y año */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mes del reporte</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-orange-400 bg-white"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Año</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-orange-400 bg-white"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-orange-400 bg-slate-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            {file ? (
              <div>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">Haz clic para seleccionar el archivo</p>
                <p className="text-xs text-slate-400 mt-1">Archivo de participación por canal/agregador</p>
              </div>
            )}
          </div>

          <div className="bg-orange-50 rounded-xl p-3 text-xs text-orange-700">
            <p className="font-semibold mb-1">Formato esperado:</p>
            <p>Primera columna: canal (Al Paso, Rappi, Didi…)</p>
            <p>Columnas siguientes: una por tienda (BTA 21, BTA 52…)</p>
            <p>Valores: % participación (ej: 0.94 = 94%)</p>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3 text-sm flex items-start gap-2 ${
                status === 'error' ? 'bg-red-50 text-red-700' :
                status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                'bg-blue-50 text-blue-700'
              }`}
            >
              {status === 'uploading' || status === 'parsing'
                ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
                : status === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{message}</span>
            </motion.div>
          )}

          {status === 'uploading' && progress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progreso</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || status === 'parsing' || status === 'uploading'}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {status === 'parsing' || status === 'uploading' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </span>
              ) : status === 'success' ? 'Listo ✅' : 'Cargar Archivo'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}