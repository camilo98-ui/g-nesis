import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Trash2, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Calendar, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];

function extractCode(name) {
  if (!name) return name;
  const m = String(name).toUpperCase().match(/(BTA|TUNJA|BOGOTA)\s*(\d+)/);
  if (m) {
    const prefix = m[1] === 'BOGOTA' ? 'BTA' : m[1];
    return `${prefix} ${m[2]}`;
  }
  return String(name).replace(/\s*\([^)]*\)/g, '').trim();
}

function parseExcel(XLSX, arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (rows.length < 2) return [];

  const records = [];
  // Row 0 is the sub-header (skip), rows 1+ are store data
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const storeRaw = row['HORA'] || row[Object.keys(row)[0]];
    if (!storeRaw || String(storeRaw).trim() === '') continue;

    const parseVal = (v) => {
      if (v === null || v === undefined || v === -1) return 0;
      const n = parseInt(v);
      return isNaN(n) || n < 0 ? 0 : n;
    };

    const rec = {
      store_name: String(storeRaw).trim(),
      store_code: extractCode(String(storeRaw).trim()),
      hour_9:  parseVal(row['9']  ?? row[9]),
      hour_10: parseVal(row['10'] ?? row[10]),
      hour_11: parseVal(row['11'] ?? row[11]),
      hour_12: parseVal(row['12'] ?? row[12]),
      hour_13: parseVal(row['13'] ?? row[13]),
      hour_14: parseVal(row['14'] ?? row[14]),
      hour_15: parseVal(row['15'] ?? row[15]),
      hour_16: parseVal(row['16'] ?? row[16]),
      hour_17: parseVal(row['17'] ?? row[17]),
      hour_18: parseVal(row['18'] ?? row[18]),
      hour_19: parseVal(row['19'] ?? row[19]),
      hour_20: parseVal(row['20'] ?? row[20]),
      hour_21: parseVal(row['21'] ?? row[21]),
      hour_22: parseVal(row['22'] ?? row[22]),
    };
    rec.total = HOURS.reduce((s, h) => s + (rec[`hour_${h}`] || 0), 0);
    records.push(rec);
  }
  return records;
}

export default function ManagerPanel({ onBack, allRecords, refetch }) {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Cargas históricas agrupadas por mes/año
  const history = React.useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, stores: [], ids: [] };
      map[key].stores.push(r.store_name);
      map[key].ids.push(r.id);
    });
    return Object.values(map).sort((a, b) => b.year - a.year || b.month - a.month);
  }, [allRecords]);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStatus('idle');
    setMessage('');
    // Preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const XLSX = await import('xlsx');
      const recs = parseExcel(XLSX, ev.target.result);
      setPreview(recs);
    };
    reader.readAsArrayBuffer(f);
  };

  const handleUpload = async () => {
    if (!file || !month || !year) return;
    setStatus('uploading');
    setMessage('Procesando...');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const XLSX = await import('xlsx');
      const recs = parseExcel(XLSX, ev.target.result);

      if (recs.length === 0) {
        setStatus('error');
        setMessage('No se encontraron registros en el archivo.');
        return;
      }

      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Eliminar registros anteriores para ese mes/año
      const existing = allRecords.filter(r => r.month === monthNum && r.year === yearNum);
      for (const rec of existing) {
        await base44.entities.StoreTransactions.delete(rec.id);
      }

      const toInsert = recs.map(r => ({
        ...r,
        month: monthNum,
        year: yearNum,
        uploaded_at: new Date().toISOString(),
      }));

      await base44.entities.StoreTransactions.bulkCreate(toInsert);
      await refetch();
      qc.invalidateQueries({ queryKey: ['storeTransactions'] });

      setStatus('success');
      setMessage(`✅ ${recs.length} tiendas cargadas para ${MONTHS[monthNum - 1]} ${yearNum}`);
      setFile(null);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (item) => {
    for (const id of item.ids) {
      await base44.entities.StoreTransactions.delete(id);
    }
    await refetch();
    qc.invalidateQueries({ queryKey: ['storeTransactions'] });
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-5 sticky top-0 z-10 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-black text-xl">Panel de Carga — Gerente</h1>
            <p className="text-slate-400 text-xs">Gestión de reportes de transacciones por hora</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-600" /> Cargar nuevo reporte
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">Mes</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">Año</label>
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
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-slate-900 bg-slate-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            {file ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{preview.length} tiendas detectadas</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-500">Clic para seleccionar archivo Excel</p>
                <p className="text-xs text-slate-400 mt-1">Formato: columnas 9–22 por hora, filas por tienda</p>
              </>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-slate-600 mb-2">Vista previa ({preview.length} tiendas):</p>
              <div className="space-y-1">
                {preview.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-700 py-1 border-b border-slate-100">
                    <span className="font-medium">{r.store_code}</span>
                    <span className="text-slate-500">{r.store_name.substring(0, 40)}...</span>
                    <span className="font-bold text-slate-900">{r.total.toLocaleString()} txn</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-xl p-3 text-sm flex items-center gap-2 ${
                status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {status === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
               status === 'success' ? <CheckCircle className="w-4 h-4" /> :
               <AlertCircle className="w-4 h-4" />}
              {message}
            </motion.div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className="w-full mt-5 bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-xl font-bold"
          >
            {status === 'uploading' ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</span>
            ) : 'Cargar Reporte'}
          </Button>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" /> Historial de cargas
          </h2>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No hay reportes cargados aún</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={`${item.year}-${item.month}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{MONTHS[item.month - 1]} {item.year}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.stores.length} tiendas cargadas</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-slate-900">¿Eliminar carga?</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Se eliminará el reporte de <strong>{MONTHS[confirmDelete.month - 1]} {confirmDelete.year}</strong> con {confirmDelete.stores.length} tiendas.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Cancelar</Button>
                <Button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}