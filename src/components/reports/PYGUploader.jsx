import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

function extractStoreCode(raw) {
  if (!raw) return null;
  const str = String(raw).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const bta = str.match(/\bBTA\s*(\d+)/);
  if (bta) return `BTA ${bta[1]}`;
  const tunja = str.match(/\bTUNJA\s*(\d+)/);
  if (tunja) return `TUNJA ${tunja[1]}`;
  const bogota = str.match(/\bBOGOTA\s*(\d+)/);
  if (bogota) return `BOGOTA ${bogota[1]}`;
  return null;
}

function cleanKey(key) {
  return String(key || '').replace(/\xa0/g, ' ').trim().toLowerCase();
}

function findValue(row, ...keywords) {
  for (const [key, val] of Object.entries(row)) {
    const k = cleanKey(key);
    if (keywords.some(kw => k.includes(kw))) {
      return typeof val === 'number' ? val : null;
    }
  }
  return null;
}

function parsePYGExcel(XLSX, arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const records = [];
  for (const row of rows) {
    const storeRaw = row['Nombre Punto de Venta'] || row['nombre punto de venta'] || Object.values(row)[0];
    const storeCode = extractStoreCode(storeRaw);
    if (!storeCode) continue;

    // Extraer partidas principales
    const costReal     = findValue(row, '% costo real');
    const costTeorico  = findValue(row, '% costo te');
    const margenEbitda = findValue(row, 'margen ebitda', 'ebitda');
    const gastosPct    = findValue(row, 'gastos % de venta', 'gastos %');
    const costoPersonal = findValue(row, 'costo personal');
    const arriendos    = findValue(row, 'arriendos');
    const admin        = findValue(row, 'administraci');
    const servicios    = findValue(row, 'servicios p');
    const impuestos    = findValue(row, 'impuestos');

    // Guardar el resto de partidas como JSON
    const MAIN_KEYS = ['nombre punto de venta', '% costo real', '% costo te', 'margen ebitda', 'ebitda',
      'gastos % de venta', 'gastos %', 'costo personal', 'arriendos', 'administraci', 'servicios p', 'impuestos'];

    const otrosGastos = {};
    for (const [key, val] of Object.entries(row)) {
      const k = cleanKey(key);
      if (val !== null && typeof val === 'number' && !MAIN_KEYS.some(mk => k.includes(mk))) {
        const cleanName = String(key).replace(/\xa0/g, ' ').trim();
        otrosGastos[cleanName] = val;
      }
    }

    records.push({
      store_code: storeCode,
      cost_real: costReal,
      cost_teorico: costTeorico,
      margen_ebitda: margenEbitda,
      gastos_pct_venta: gastosPct,
      costo_personal: costoPersonal,
      arriendos,
      administracion: admin,
      servicios_publicos: servicios,
      impuestos,
      otros_gastos: JSON.stringify(otrosGastos),
    });
  }
  return records;
}

export default function PYGUploader({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const fileRef = useRef();

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const handleUpload = async () => {
    if (!file || !month || !year) return;
    setStatus('parsing');
    setMessage('Analizando archivo...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const XLSX = await import('xlsx');
      const records = parsePYGExcel(XLSX, e.target.result);

      if (records.length === 0) {
        setStatus('error');
        setMessage('No se encontraron datos. Verifica que la primera columna tenga "Nombre Punto de Venta" con códigos tipo BTA 52.');
        return;
      }

      setStatus('uploading');
      setMessage(`Guardando ${records.length} registros...`);

      const reportId = `pyg_${year}_${month}_${Date.now()}`;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Borrar registros anteriores del mismo mes/año
      const existing = await base44.entities.PYGReport.filter({ month: monthNum, year: yearNum });
      for (const rec of existing) {
        await base44.entities.PYGReport.delete(rec.id);
      }

      const toInsert = records.map(r => ({ ...r, month: monthNum, year: yearNum, report_id: reportId }));
      await base44.entities.PYGReport.bulkCreate(toInsert);

      const stores = [...new Set(records.map(r => r.store_code))];
      setStatus('success');
      setMessage(`✅ ${records.length} tiendas · ${MONTHS[monthNum - 1]} ${yearNum} · ${stores.join(', ')}`);
      onSuccess?.();
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Cargar P&G</h2>
              <p className="text-white/70 text-xs">Solo Gerente · Formato .xlsx</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Selector de mes y año */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Mes del reporte</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Año</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { setFile(e.target.files?.[0]); setStatus('idle'); setMessage(''); }} />
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
                <p className="text-xs text-slate-400 mt-1">Reporte P&G exportado del sistema</p>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
            <p className="font-semibold mb-1">Formato esperado:</p>
            <p>Col 1: Nombre Punto de Venta (ej: BTA 52 (CC CENTRO SUBA).)</p>
            <p>Cols siguientes: % Costo real, Margen EBITDA, Costo Personal…</p>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3 text-sm flex items-start gap-2 ${
                status === 'error' ? 'bg-red-50 text-red-700' :
                status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
              }`}>
              {status === 'uploading' || status === 'parsing'
                ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
                : status === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{message}</span>
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !month || !year || status === 'parsing' || status === 'uploading'}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {status === 'parsing' || status === 'uploading'
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Procesando...</span>
                : status === 'success' ? 'Listo ✅' : 'Cargar P&G'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}