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

  // Build header map (normalize: trim, uppercase) → column index
  const headerRow = rows[0];
  const colMap = {};
  headerRow.forEach((h, idx) => {
    if (h != null) colMap[String(h).toUpperCase().trim()] = idx;
  });

  // Accept both Spanish and possible variants
  const findCol = (...keys) => {
    for (const k of keys) {
      // exact match first
      if (colMap[k] !== undefined) return colMap[k];
      // partial match (trim already applied in colMap keys)
      const found = Object.keys(colMap).find(h => h.includes(k));
      if (found !== undefined) return colMap[found];
    }
    return -1;
  };

  const iDept   = findCol('DEPARTAMENTO', 'DEPART');
  const iSec    = findCol('SECCION', 'SECCIÓN', 'SECCI');
  const iDesc   = findCol('DESCRIPCION', 'DESCRIPCIÓN', 'DESCRIP');
  const iTienda = findCol('TIENDA', 'PUNTO');
  const iPart   = findCol('PARTICIPACION', 'PARTICIPACIÓN', 'PART');
  const iVenta  = findCol('VENTA', 'MONTO', 'SALES');
  const iUnits  = findCol('CANTIDAD', 'UNIDAD', 'UNIDADES', 'UNITS', 'QTY');

  if (iTienda === -1 || iDept === -1) return records;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const tienda = row[iTienda];
    const dept   = iDept  !== -1 ? row[iDept]  : null;
    const seccion= iSec   !== -1 ? row[iSec]   : null;
    const desc   = iDesc  !== -1 ? row[iDesc]  : null;
    const part   = iPart  !== -1 ? row[iPart]  : null;
    const venta  = iVenta !== -1 ? row[iVenta] : null;
    const units  = iUnits !== -1 ? row[iUnits] : null;

    if (!tienda || !dept) continue;
    const storeCode = extractStoreCode(tienda);
    if (!storeCode) continue;

    const ventaNum = parseFloat(String(venta ?? 0).replace(/[^0-9.-]/g, '')) || 0;
    let partNum    = parseFloat(String(part  ?? 0).replace(/[^0-9.-]/g, '')) || 0;
    // Si la participación viene como fracción (0..1), convertir a porcentaje
    if (partNum > 0 && partNum <= 1) partNum = partNum * 100;

    records.push({
      store_code: storeCode,
      report_id: reportId,
      uploaded_at: uploadedAt,
      department: String(dept).trim(),
      section: seccion ? String(seccion).trim() : '',
      product: desc ? String(desc).trim() : '',
      level: 'product',
      participation: partNum,
      total_sales: ventaNum,
      total_transactions: 0,
      units_sold: units != null ? (parseFloat(String(units).replace(/[^0-9.-]/g, '')) || 0) : null,
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
    if (f && f.name.endsWith('.xlsx')) {
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
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      const records = parseKpisExcel(rows, selectedMonth, selectedYear);
      if (records.length === 0) {
        const headers = rows[0]?.filter(Boolean).join(', ') || 'ninguna';
        setStatus('error');
        setMessage(`No se encontraron datos válidos. Columnas detectadas: [${headers}]. Se necesitan: TIENDA, DEPARTAMENTO, DESCRIPCION, VENTA.`);
        return;
      }

      setStatus('uploading');
      setMessage(`Procesando ${records.length} registros en servidor...`);
      setProgress({ current: 0, total: records.length });

      try {
        const chunkSize = 50;
        let totalInserted = 0;
        for (let i = 0; i < records.length; i += chunkSize) {
          const chunk = records.slice(i, i + chunkSize);
          await base44.entities.SalesReport.bulkCreate(chunk);
          totalInserted += chunk.length;
          setProgress({ current: totalInserted, total: records.length });
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
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
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