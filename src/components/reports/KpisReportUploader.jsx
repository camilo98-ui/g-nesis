import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// xlsx imported dynamically to avoid React conflicts

function extractStoreCode(tiendaStr) {
  if (!tiendaStr) return null;
  const str = String(tiendaStr).toUpperCase().trim();
  // Extraer número de la tienda
  const btaMatch = str.match(/BTA\s*(\d+)/);
  if (btaMatch) return `BTA ${btaMatch[1]}`;
  const tunjaMatch = str.match(/TUNJA\s*(\d+)/);
  if (tunjaMatch) return `TUNJA ${tunjaMatch[1]}`;
  // BOGOTA XX → guardar como BOGOTA XX (igual que el selector)
  const bogotaMatch = str.match(/BOGOTA\s*(\d+)/);
  if (bogotaMatch) return `BOGOTA ${bogotaMatch[1]}`;
  return null;
}

function parseKpisExcel(rows, monthNum, yearNum) {
  const records = [];
  const reportId = `kpis_${yearNum}_${monthNum}_${Date.now()}`;
  const uploadedAt = new Date().toISOString();

  if (!rows || rows.length < 2) return records;

  // Detectar si la fila 0 tiene headers semánticos (TIENDA, DEPARTAMENTO...)
  // o si es un formato "Resumen de ventas / col_1 / col_2..." donde los datos empiezan en fila 1
  // con la primera columna siendo la tienda y las siguientes departamento, sección, descripción, venta, unds, part
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map(c => String(c ?? '').toUpperCase()).join('|');
    if (joined.includes('TIENDA') && joined.includes('DEPARTAMENTO')) {
      headerRowIdx = i;
      break;
    }
  }

  let iTienda, iDept, iSec, iDesc, iVenta, iUnits, iPart, dataStartRow;

  if (headerRowIdx !== -1) {
    // Formato estándar con fila de headers
    const headerRow = rows[headerRowIdx];
    const colMap = {};
    headerRow.forEach((h, idx) => {
      if (h != null) colMap[String(h).toUpperCase().trim()] = idx;
    });
    const findCol = (...keys) => {
      for (const k of keys) {
        if (colMap[k] !== undefined) return colMap[k];
        const found = Object.keys(colMap).find(h => h.includes(k));
        if (found !== undefined) return colMap[found];
      }
      return -1;
    };
    iTienda = findCol('TIENDA', 'PUNTO');
    iDept   = findCol('DEPARTAMENTO', 'DEPART');
    iSec    = findCol('SECCION', 'SECCIÓN', 'SECCI');
    iDesc   = findCol('DESCRIPCION', 'DESCRIPCIÓN', 'DESCRIP');
    iPart   = findCol('PARTICIPACION', 'PARTICIPACIÓN', 'PART');
    iVenta  = findCol('VENTA BRUTA', 'VENTA', 'MONTO', 'SALES');
    iUnits  = findCol('UNDS', 'UNIDADES', 'UNIDAD', 'UNITS', 'QTY', 'CANT');
    dataStartRow = headerRowIdx + 1;
  } else {
    // Formato alternativo: fila 0 = "Resumen de ventas | col_1 | col_2 | col_3 | col_4 | col_5 | col_6"
    // Datos desde fila 1: TIENDA(0) | DEPARTAMENTO(1) | SECCION(2) | DESCRIPCION(3) | VENTA(4) | UNDS(5) | PART(6)
    // Detectar por la primera fila de datos que tenga extractStoreCode válido
    const firstDataRow = rows[1];
    if (firstDataRow && extractStoreCode(String(firstDataRow[0] ?? ''))) {
      iTienda = 0; iDept = 1; iSec = 2; iDesc = 3; iVenta = 4; iUnits = 5; iPart = 6;
      dataStartRow = 1;
    } else {
      return records; // No se pudo detectar el formato
    }
  }

  if (iTienda === -1 || iDept === -1) return records;

  // Propagate values downward (tabla dinámica leaves blanks for repeated values)
  let currentTienda = null;
  let currentDept   = null;
  let currentSec    = null;

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawTienda = row[iTienda];
    const rawDept   = row[iDept];
    const rawSec    = iSec !== -1 ? row[iSec] : null;
    const rawDesc   = iDesc !== -1 ? row[iDesc] : null;
    const rawVenta  = iVenta !== -1 ? row[iVenta] : null;
    const rawPart   = iPart !== -1 ? row[iPart] : null;
    const rawUnits  = iUnits !== -1 ? row[iUnits] : null;

    // Update propagated values when non-null
    if (rawTienda != null && String(rawTienda).trim() !== '') {
      const extracted = extractStoreCode(String(rawTienda));
      if (extracted) {
        currentTienda = extracted;
        currentDept = null;
        currentSec = null;
      }
    }
    if (rawDept != null && String(rawDept).trim() !== '') {
      currentDept = String(rawDept).trim();
      currentSec = null;
    }
    if (rawSec != null && String(rawSec).trim() !== '') {
      currentSec = String(rawSec).trim();
    }

    // Skip total rows (no description, or description contains "Total")
    const desc = rawDesc != null ? String(rawDesc).trim() : '';
    if (!desc || desc.toUpperCase().startsWith('TOTAL')) continue;

    // Skip if no store or department
    if (!currentTienda || !currentDept) continue;

    // Skip rows that look like subtotals (no product description but has sales)
    const ventaNum = parseFloat(String(rawVenta ?? 0).replace(/[^0-9.-]/g, '')) || 0;
    const unitsNum = rawUnits != null && rawUnits !== '' ? (parseFloat(String(rawUnits).replace(/[^0-9.-]/g, '')) || null) : null;
    let partNum    = parseFloat(String(rawPart ?? 0).replace(/[^0-9.-]/g, '')) || 0;
    if (partNum > 0 && partNum <= 1) partNum = partNum * 100;

    records.push({
      store_code: currentTienda,
      report_id: reportId,
      uploaded_at: uploadedAt,
      department: currentDept,
      section: currentSec || '',
      product: desc,
      level: 'product',
      participation: partNum,
      total_sales: ventaNum,
      total_transactions: 0,
      units_sold: unitsNum,
      month: monthNum,
      year: yearNum,
    });
  }
  return records;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function KpisReportUploader({ onClose, onSuccess }) {
  const now = new Date();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setStatus('error');
      setMessage(`Formato no válido: "${f.name}". Solo se aceptan archivos .xlsx o .xls`);
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('parsing');
    setMessage('Analizando archivo...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      // Debug: loguear estructura del archivo
      console.log('🔍 Fila 0:', rows[0]);
      console.log('🔍 Fila 1:', rows[1]);
      console.log('🔍 Fila 2:', rows[2]);

      const records = parseKpisExcel(rows, selectedMonth, selectedYear);
      if (records.length === 0) {
        const row0 = rows[0]?.map(c => String(c ?? '')).join(' | ') || 'vacía';
        const row1 = rows[1]?.map(c => String(c ?? '')).join(' | ') || 'vacía';
        setStatus('error');
        setMessage(`No se encontraron datos. Fila 0: [${row0}] — Fila 1: [${row1}]`);
        return;
      }

      setMessage(`✅ ${records.length} filas detectadas, subiendo...`);

      setStatus('uploading');
      setMessage(`Eliminando datos anteriores del mismo período...`);
      setProgress({ current: 0, total: records.length });

      try {
        // 1. Borrar registros anteriores del mismo mes/año
        // Traer todos y filtrar en cliente (evita problemas con floats en DB)
        setMessage(`Buscando registros anteriores del período...`);
        const allExisting = await base44.entities.SalesReport.list('-uploaded_at', 10000);
        const toDelete = allExisting.filter(r => Number(r.month) === selectedMonth && Number(r.year) === selectedYear);
        if (toDelete.length > 0) {
          setMessage(`Eliminando ${toDelete.length} registros anteriores...`);
          // Borrar de a 5 en paralelo con pausa entre lotes
          const deleteChunkSize = 5;
          for (let i = 0; i < toDelete.length; i += deleteChunkSize) {
            const chunk = toDelete.slice(i, i + deleteChunkSize);
            await Promise.all(chunk.map(r => base44.entities.SalesReport.delete(r.id)));
            await new Promise(r => setTimeout(r, 200));
          }
        }

        // 2. Insertar en chunks de 50, uno a la vez con pausa
        const chunkSize = 50;
        let totalInserted = 0;
        for (let i = 0; i < records.length; i += chunkSize) {
          const chunk = records.slice(i, i + chunkSize);
          await base44.entities.SalesReport.bulkCreate(chunk);
          totalInserted += chunk.length;
          setProgress({ current: totalInserted, total: records.length });
          setMessage(`Subiendo... ${totalInserted}/${records.length} registros`);
          await new Promise(r => setTimeout(r, 300));
        }
        setStatus('success');
        setMessage(`✅ ${totalInserted} productos cargados correctamente.`);
        onSuccess?.();
      } catch (err) {
        setStatus('error');
        setMessage(`Error al guardar: ${err.message}`);
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Cargar KPIs Participación</h2>
              <p className="text-white/70 text-xs">Solo Gerente · Formato .xlsx</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
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
                <p className="text-xs text-slate-400 mt-1">Solo archivos .xlsx</p>
              </div>
            )}
          </div>

          {/* Selector Mes/Año */}
          <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-indigo-700">📅 ¿A qué mes corresponde este reporte?</p>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {MONTHS.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-28 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-indigo-500">Columnas: Departamento · Sección · Descripción · Tienda · Participación · Venta</p>
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
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || status === 'parsing' || status === 'uploading'}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
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