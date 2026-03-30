import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Mapa de columnas del xlsx a códigos de tienda
// Row 1 (index 1): nombres de tiendas en cols 1,4,7,10,13,16,19,22,25,28,31,34
const STORE_COL_MAP = [
  { colIndex: 1, codeKey: 'BTA 18' },
  { colIndex: 4, codeKey: 'BTA 21' },
  { colIndex: 7, codeKey: 'BTA 27' },
  { colIndex: 10, codeKey: 'BTA 52' },
  { colIndex: 13, codeKey: 'BTA 56' },
  { colIndex: 16, codeKey: 'BTA 62' },
  { colIndex: 19, codeKey: 'BTA 66' },
  { colIndex: 22, codeKey: 'BTA 71' },
  { colIndex: 25, codeKey: 'BTA 78' },
  { colIndex: 28, codeKey: 'BTA 85' },
  { colIndex: 31, codeKey: 'TUNJA 1' },
  { colIndex: 34, codeKey: 'TUNJA 2' },
];

function parseStoreCodeFromHeader(headerText) {
  if (!headerText) return null;
  const text = String(headerText).toUpperCase();
  // Extraer código tipo "BTA 18", "TUNJA 1", etc.
  const match = text.match(/\b(BTA\s*\d+|TUNJA\s*\d+)\b/);
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

function determineLevel(rows, rowIdx) {
  // Nivel basado en indentación/repetición de la misma fila en dos filas consecutivas
  // Row[2] = headers de columnas
  // Data starts at row[3] (index 3)
  // Heurística: si la siguiente fila tiene el mismo texto en col[0], es departamento
  // Verificamos con el patrón real del archivo:
  // - Row aparece una vez con totales = Departamento
  // - Row aparece repetida debajo = Sección
  // - Rows con productos debajo = Producto
  // Usaremos una lógica basada en si hay filas hijas con el mismo inicio
  return 'product'; // se calculará en el parseado completo
}

export default function SalesReportUploader({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, parsing, uploading, success, error
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

    // Fila 1 (idx=1): tiendas en cols 1,4,7...
    // Fila 2 (idx=2): "Etiquetas de fila", Suma de Venta, Suma de Transacciones, Suma de Participación (x12 tiendas)
    // Fila 3+ (idx>=3): datos

    // Detectar tiendas dinámicamente desde fila 1
    const headerRow = rows[1] || [];
    const storeColumns = [];
    for (let c = 0; c < headerRow.length; c++) {
      const code = parseStoreCodeFromHeader(headerRow[c]);
      if (code) {
        storeColumns.push({ colIndex: c, code });
      }
    }

    if (storeColumns.length === 0) {
      setStatus('error');
      setMessage('No se encontraron tiendas en el archivo. Verifica el formato.');
      return;
    }

    // Construir jerarquía de departamento/sección/producto
    // La estructura del xlsx tiene: Departamento, Sección (repetida), Productos
    // Determinamos nivel por: si la fila siguiente repite el mismo valor en col[0] = es Departamento
    // Si la fila anterior con el mismo texto ya fue vista = Sección
    // El resto = Producto
    const dataRows = rows.slice(3); // skip rows 0,1,2
    // Filtrar filas "Total general" o vacías
    const validRows = dataRows.filter(r => {
      const label = r[0];
      if (!label) return false;
      if (String(label).toLowerCase().includes('total general')) return false;
      return true;
    });

    // Detectar jerarquía: en el xlsx original:
    // Nivel Departamento: fila que se repite exactamente igual en la siguiente posición
    // Nivel Sección: fila que aparece después de un departamento y se repite
    // Nivel Producto: filas con datos únicos debajo de sección
    // Simplificación: usamos el hecho de que departamentos y secciones se repiten 2 veces
    const seen = {};
    const levelMap = {};
    for (let i = 0; i < validRows.length; i++) {
      const label = String(validRows[i][0] || '').trim();
      if (!label) continue;
      seen[label] = (seen[label] || 0) + 1;
    }

    // Labels con count >= 2 son departamento o sección
    // Labels con count == 1 son productos
    // Para distinguir dept vs section: en el xlsx, la primera ocurrencia es dept, la segunda es section (repite el nombre)
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

    // Ahora construir registros por tienda
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
        const salesVal = row[colIndex];
        const transVal = row[colIndex + 1];
        const partVal = row[colIndex + 2];

        const sales = parseFloat(salesVal) || 0;
        const transactions = parseInt(transVal) || 0;
        const participation = parseFloat(partVal) || 0;

        if (sales === 0 && transactions === 0) continue;

        records.push({
          store_code: code,
          uploaded_at: uploadedAt,
          report_id: reportId,
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

    if (records.length === 0) {
      setStatus('error');
      setMessage('No se encontraron datos en el archivo.');
      return;
    }

    // Borrar registros anteriores y subir nuevos
    setStatus('uploading');
    setMessage('Eliminando datos anteriores...');

    try {
      const existing = await base44.entities.SalesReport.list();
      if (existing.length > 0) {
        // Borrar en chunks de 10
        for (let i = 0; i < existing.length; i += 10) {
          const chunk = existing.slice(i, i + 10);
          await Promise.all(chunk.map(r => base44.entities.SalesReport.delete(r.id)));
        }
      }

      setMessage(`Guardando ${records.length} registros...`);
      setProgress({ current: 0, total: records.length });

      // Subir en chunks de 50
      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await base44.entities.SalesReport.bulkCreate(chunk);
        setProgress({ current: Math.min(i + chunkSize, records.length), total: records.length });
      }

      setStatus('success');
      setMessage(`✅ ${records.length} registros cargados para ${storeColumns.length} tiendas.`);
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
        {/* Header */}
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
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
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

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Formato esperado:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Fila 2: nombres de tiendas por columna</li>
              <li>Fila 3: Venta, Transacciones, Participación por tienda</li>
              <li>Datos desde fila 4: Departamento → Sección → Producto</li>
            </ul>
          </div>

          {/* Status */}
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
              {status === 'uploading' || status === 'parsing' ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" /> :
               status === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
               <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{message}</span>
            </motion.div>
          )}

          {/* Progress */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
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