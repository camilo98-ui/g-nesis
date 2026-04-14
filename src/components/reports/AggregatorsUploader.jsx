import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extraer código de tienda desde encabezados del Excel (e.g. "BTA 21 (CC CENTRO CHIA)." → "BTA 21")
function extractStoreCode(headerStr) {
  if (!headerStr) return null;
  const str = String(headerStr).toUpperCase().trim();
  const btaMatch = str.match(/BTA\s*(\d+)/);
  if (btaMatch) return `BTA ${btaMatch[1]}`;
  const tunjaMatch = str.match(/TUNJA\s*(\d+)/);
  if (tunjaMatch) return `TUNJA ${tunjaMatch[1]}`;
  const bogotaMatch = str.match(/BOGOTA\s*(\d+)/);
  if (bogotaMatch) return `BOGOTA ${bogotaMatch[1]}`;
  return null;
}

// Parsear el Excel de agregadores
// Estructura esperada:
//   Fila 0: [PdV / Canal, BTA 21, BTA 21, BTA 52, BTA 52, ...] ← tienda repetida 2 veces por canal
//   Fila 1: [Canal,       % Part., Venta,  % Part., Venta, ...]  ← sub-encabezado
//   Fila 2+: datos
//
// Por cada tienda hay DOS columnas: la primera es % participación, la segunda es venta bruta.
// Se combinan en un solo registro por tienda+canal.
function parseAggregatorsExcel(XLSX, arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  if (jsonRows.length < 3) return [];

  const headerRow = jsonRows[0]; // fila con códigos de tienda
  const subRow = jsonRows[1];    // fila con "% Part." / "Venta Bruta"
  const dataStartRow = 2;

  const parseNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? null : n;
  };

  const isPartLabel = (val) => {
    if (!val) return false;
    const s = String(val).toLowerCase();
    return s.includes('part') || s.includes('%');
  };

  const isVentaLabel = (val) => {
    if (!val) return false;
    const s = String(val).toLowerCase();
    return s.includes('venta') || s.includes('bruta') || s.includes('gros') || s.includes('vta');
  };

  // Construir grupos: para cada tienda encontrar su colPart y colVenta
  // El header repite el código de tienda dos veces (una por columna)
  const storeGroups = {}; // { storeCode: { colPart, colVenta } }
  
  for (let col = 1; col < headerRow.length; col++) {
    const code = extractStoreCode(headerRow[col]);
    if (!code) continue;

    const subLabel = subRow[col];
    
    if (!storeGroups[code]) {
      storeGroups[code] = { colPart: null, colVenta: null };
    }

    if (isVentaLabel(subLabel)) {
      storeGroups[code].colVenta = col;
    } else {
      // % Part. o sin etiqueta → es la columna de participación
      storeGroups[code].colPart = col;
    }
  }

  // Fallback: si las etiquetas no ayudaron, asumir primera columna = %, segunda = venta
  for (const code of Object.keys(storeGroups)) {
    const g = storeGroups[code];
    if (g.colPart !== null && g.colVenta === null) {
      // Buscar la siguiente columna sin código de tienda como venta
      const nextCol = g.colPart + 1;
      if (nextCol < headerRow.length && !extractStoreCode(headerRow[nextCol])) {
        g.colVenta = nextCol;
      }
    }
  }

  const reportId = `agg_${Date.now()}`;
  const uploadedAt = new Date().toISOString();
  const records = [];

  for (let row = dataStartRow; row < jsonRows.length; row++) {
    const rowData = jsonRows[row];
    if (!rowData || !rowData[0]) continue;
    const channel = String(rowData[0]).trim();
    if (!channel) continue;

    for (const [storeCode, { colPart, colVenta }] of Object.entries(storeGroups)) {
      if (colPart === null) continue;

      const rawPart = parseNum(rowData[colPart]);
      const rawVenta = colVenta !== null ? parseNum(rowData[colVenta]) : null;
      if (rawPart === null && rawVenta === null) continue;

      // Normalizar participación: si viene como 94.5 → 0.945, si viene como 0.945 → dejarlo
      const participation = rawPart !== null ? (rawPart > 1 ? rawPart / 100 : rawPart) : 0;

      records.push({
        store_code: storeCode,
        channel,
        participation,       // 0-1
        total_sales: rawVenta || 0,
        report_id: reportId,
        uploaded_at: uploadedAt,
      });
    }
  }

  return records;
}

export default function AggregatorsUploader({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
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
      const records = parseAggregatorsExcel(XLSX, e.target.result);

      if (records.length === 0) {
        setStatus('error');
        setMessage('No se encontraron datos válidos. El archivo debe tener: columna "PdV" con canales, y columnas por tienda con códigos BTA/TUNJA.');
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

        setStatus('success');
        setMessage(`✅ ${inserted} registros de ${[...new Set(records.map(r => r.store_code))].length} tiendas cargados.`);
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