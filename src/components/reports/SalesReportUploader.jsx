import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

function parseStoreCodeFromHeader(headerText) {
  if (!headerText) return null;
  const text = String(headerText).toUpperCase();
  const match = text.match(/\b(BTA\s*\d+|TUNJA\s*\d+|BOGOTA\s*\d+)\b/);
  return match ? match[1].replace(/\s+/, ' ') : null;
}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      resolve(rows);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function detectFormat(rows) {
  if (!rows || rows.length < 2) return 'unknown';
  const hasStoreName = (rows[2] || []).some(cell => {
    if (!cell) return false;
    const txt = String(cell).toUpperCase();
    return txt.includes('BTA') || txt.includes('TUNJA');
  });
  if (hasStoreName) return 'kpis';

  const headerRow = rows[1] || [];
  const storeInHeader = headerRow.some(cell => parseStoreCodeFromHeader(cell));
  if (storeInHeader) return 'participacion';

  return 'kpis';
}

function parseKpisFormat(rows) {
  const sectionRow = rows[0] || [];
  const productRow = rows[1] || [];
  const dataRows = rows.slice(2);

  const deptBoundaries = [];
  for (let c = 1; c < sectionRow.length; c++) {
    const cell = sectionRow[c];
    if (cell && String(cell).startsWith('Total ')) {
      const deptName = String(cell).replace('Total ', '').trim();
      deptBoundaries.push({ name: deptName, endCol: c });
    }
  }

  let prevEnd = 0;
  deptBoundaries.forEach((d) => {
    d.startCol = prevEnd + 1;
    prevEnd = d.endCol;
  });

  const colMeta = [];
  for (let c = 1; c < productRow.length; c++) {
    const dept = deptBoundaries.find(d => c >= d.startCol && c <= d.endCol);
    const deptName = dept ? dept.name : '';
    const sectionCell = sectionRow[c];
    const productCell = productRow[c];
    colMeta[c] = {
      department: deptName,
      section: (sectionCell && !String(sectionCell).startsWith('Total')) ? String(sectionCell).trim() : '',
      product: (productCell && !String(productCell).startsWith('Total')) ? String(productCell).trim() : '',
      isTotal: (sectionCell && String(sectionCell).startsWith('Total')) || (productCell && String(productCell).startsWith('Total')),
    };
  }

  const records = [];
  const reportId = `report_${Date.now()}`;
  const uploadedAt = new Date().toISOString();

  dataRows.forEach(row => {
    if (!row || !row[0]) return;
    const storeRaw = String(row[0]).trim();
    const codeMatch = storeRaw.match(/\b(BTA\s*\d+|TUNJA\s*\d+)\b/i);
    if (!codeMatch) return;
    const storeCode = codeMatch[1].replace(/\s+/, ' ').toUpperCase();

    const deptMap = {};
    for (let c = 1; c < row.length; c++) {
      const meta = colMeta[c];
      if (!meta || meta.isTotal || !meta.department) continue;
      const val = row[c];
      if (val === null || val === undefined || val === '') continue;
      const numVal = parseFloat(val);
      if (isNaN(numVal) || numVal <= 0) continue;

      const { department, section, product } = meta;
      if (!deptMap[department]) deptMap[department] = {};
      const sectionKey = section || '__root__';
      if (!deptMap[department][sectionKey]) {
        deptMap[department][sectionKey] = { section, products: [] };
      }
      if (product) {
        deptMap[department][sectionKey].products.push({ product, participation: numVal * 100 });
      }
    }

    Object.entries(deptMap).forEach(([dept, sections]) => {
      let deptTotal = 0;
      Object.values(sections).forEach(s => {
        s.products.forEach(p => deptTotal += p.participation);
      });

      records.push({
        store_code: storeCode, uploaded_at: uploadedAt, report_id: reportId,
        department: dept, section: '', product: '', level: 'department',
        total_sales: 0, total_transactions: 0,
        participation: Math.round(deptTotal * 100) / 100,
      });

      Object.entries(sections).forEach(([, sData]) => {
        const sectionName = sData.section;
        const sectionTotal = sData.products.reduce((a, p) => a + p.participation, 0);

        if (sectionName) {
          records.push({
            store_code: storeCode, uploaded_at: uploadedAt, report_id: reportId,
            department: dept, section: sectionName, product: '', level: 'section',
            total_sales: 0, total_transactions: 0,
            participation: Math.round(sectionTotal * 100) / 100,
          });
        }

        sData.products.forEach(p => {
          records.push({
            store_code: storeCode, uploaded_at: uploadedAt, report_id: reportId,
            department: dept, section: sectionName, product: p.product, level: 'product',
            total_sales: 0, total_transactions: 0,
            participation: Math.round(p.participation * 10000) / 10000,
          });
        });
      });
    });
  });

  return records;
}

function parseParticipacionFormat(rows) {
  const headerRow = rows[1] || [];
  const storeColumns = [];
  for (let c = 0; c < headerRow.length; c++) {
    const code = parseStoreCodeFromHeader(headerRow[c]);
    if (code) storeColumns.push({ colIndex: c, code });
  }
  if (storeColumns.length === 0) return [];

  const dataRows = rows.slice(3);
  const validRows = dataRows.filter(r => {
    const label = r[0];
    if (!label) return false;
    if (String(label).toLowerCase().includes('total general')) return false;
    return true;
  });

  const seen = {};
  const levelMap = {};
  for (let i = 0; i < validRows.length; i++) {
    const label = String(validRows[i][0] || '').trim();
    if (!label) continue;
    seen[label] = (seen[label] || 0) + 1;
  }

  const firstOccurrence = {};
  for (let i = 0; i < validRows.length; i++) {
    const label = String(validRows[i][0] || '').trim();
    if (!label) continue;
    if (firstOccurrence[label] === undefined) {
      firstOccurrence[label] = i;
      levelMap[`${i}`] = seen[label] >= 2 ? 'department' : 'product';
    } else {
      levelMap[`${i}`] = 'section';
    }
  }

  const records = [];
  const reportId = `report_${Date.now()}`;
  const uploadedAt = new Date().toISOString();
  let currentDept = '';
  let currentSection = '';

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    const label = String(row[0] || '').trim();
    if (!label) continue;
    const level = levelMap[`${i}`];
    if (level === 'department') currentDept = label;
    else if (level === 'section') currentSection = label;

    for (const { colIndex, code } of storeColumns) {
      const sales = parseFloat(row[colIndex]) || 0;
      const transactions = parseInt(row[colIndex + 1]) || 0;
      const participation = parseFloat(row[colIndex + 2]) || 0;
      if (sales === 0 && transactions === 0) continue;
      records.push({
        store_code: code, uploaded_at: uploadedAt, report_id: reportId,
        department: currentDept,
        section: level === 'section' ? label : (level === 'product' ? currentSection : ''),
        product: level === 'product' ? label : '',
        level,
        total_sales: Math.round(sales),
        total_transactions: transactions,
        participation: Math.round(participation * 100) / 100,
      });
    }
  }
  return records;
}

export default function SalesReportUploader({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
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

    const rows = await parseXlsx(file);
    const fmt = detectFormat(rows);
    setMessage(`Formato detectado: ${fmt === 'kpis' ? 'Resumen KPIs' : 'Participación'}. Procesando...`);

    let records = fmt === 'kpis' ? parseKpisFormat(rows) : parseParticipacionFormat(rows);

    if (records.length === 0) {
      setStatus('error');
      setMessage('No se encontraron datos en el archivo. Verifica el formato.');
      return;
    }

    setStatus('uploading');
    setMessage('Eliminando datos anteriores...');

    try {
      const existing = await base44.entities.SalesReport.list();
      for (let i = 0; i < existing.length; i += 10) {
        const chunk = existing.slice(i, i + 10);
        await Promise.all(chunk.map(r => base44.entities.SalesReport.delete(r.id)));
      }

      setMessage(`Guardando ${records.length} registros...`);
      setProgress({ current: 0, total: records.length });

      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        await base44.entities.SalesReport.bulkCreate(records.slice(i, i + chunkSize));
        setProgress({ current: Math.min(i + chunkSize, records.length), total: records.length });
      }

      setStatus('success');
      setMessage(`✅ ${records.length} registros cargados exitosamente.`);
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setMessage(`Error al guardar: ${err.message}`);
    }
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
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Cargar Reporte de Ventas</h2>
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
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
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

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Formatos soportados:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li><strong>Resumen KPIs</strong>: filas = tiendas, columnas = productos/secciones</li>
              <li><strong>Participación</strong>: filas = jerarquía, columnas = tiendas con venta/trans/%</li>
            </ul>
            <p className="mt-1 text-blue-500">El formato se detecta automáticamente.</p>
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
                  className="h-full bg-gradient-to-r from-slate-500 to-slate-700 rounded-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || status === 'parsing' || status === 'uploading'}
              className="flex-1 bg-slate-700 hover:bg-slate-800 text-white"
            >
              {status === 'parsing' || status === 'uploading' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </span>
              ) : status === 'success' ? 'Listo ✅' : 'Cargar Reporte'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}