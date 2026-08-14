import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';
import { X, Save, Check, Smile, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { getNPSStatus } from './NPSGauge';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getSessionDistrict() {
  try {
    const raw = localStorage.getItem('popsySession');
    if (!raw) return '';
    const s = JSON.parse(raw);
    return s.district || '';
  } catch {
    return '';
  }
}

// Flexible column name matching
function pick(row, keys) {
  for (const k of Object.keys(row)) {
    const norm = k.toLowerCase().trim();
    if (keys.some((key) => norm === key || norm.includes(key))) return row[k];
  }
  return null;
}

function normalizeCode(v) {
  if (v == null) return '';
  return String(v).toUpperCase().replace(/\s+/g, ' ').trim();
}

export default function NPSUploadModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const district = getSessionDistrict();
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [parsed, setParsed] = useState([]); // [{ store_code, score, name, ok }]
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date', 1000),
    staleTime: 60 * 60 * 1000,
    enabled: open,
  });

  const { data: allNps = [] } = useQuery({
    queryKey: ['all-nps'],
    queryFn: () => base44.entities.StoreNPS.list('-created_date', 500),
    staleTime: 30 * 1000,
    enabled: open,
  });

  const districtStores = useMemo(
    () => allStores.filter((s) => (s.district || 'BOGOTA NOROCCIDENTE') === district),
    [allStores, district]
  );

  const storeByCode = useMemo(() => {
    const m = {};
    districtStores.forEach((s) => { m[normalizeCode(s.code)] = s; });
    return m;
  }, [districtStores]);

  // Existing NPS for the selected month/year, keyed by store_code
  const existingByCode = useMemo(() => {
    const m = {};
    allNps.forEach((r) => {
      if (Number(r.month) === selMonth && Number(r.year) === selYear) {
        m[normalizeCode(r.store_code)] = r;
      }
    });
    return m;
  }, [allNps, selMonth, selYear]);

  const handleFile = async (file) => {
    setParseError('');
    setParsed([]);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { setParseError('El archivo está vacío.'); return; }

      const result = rows.map((row) => {
        const codeRaw = pick(row, ['tienda', 'store_code', 'codigo', 'cod', 'cod_tienda']) || pick(row, ['bta']);
        const scoreRaw = pick(row, ['nps', 'score', 'puntaje', 'calificacion']);
        const code = normalizeCode(codeRaw);
        const score = Math.max(0, Math.min(10, Number(String(scoreRaw).replace(',', '.')) || 0));
        const store = storeByCode[code];
        return {
          store_code: code,
          score,
          name: store?.name || code,
          matched: !!store,
        };
      }).filter((r) => r.store_code);

      if (!result.length) {
        setParseError('No se encontraron columnas de tienda y NPS. Usa columnas: Tienda, NPS.');
        return;
      }
      setParsed(result);
    } catch (e) {
      setParseError('No se pudo leer el archivo Excel. Verifica el formato.');
    }
  };

  const matchedCount = parsed.filter((p) => p.matched).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const row of parsed) {
        if (!row.matched || !row.score) continue;
        const existing = existingByCode[row.store_code];
        const payload = { store_code: row.store_code, score: row.score, month: selMonth, year: selYear };
        try {
          if (existing) await base44.entities.StoreNPS.update(existing.id, payload);
          else await base44.entities.StoreNPS.create(payload);
          results.push({ code: row.store_code, ok: true });
        } catch (e) {
          results.push({ code: row.store_code, ok: false });
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-nps'] });
      queryClient.invalidateQueries({ queryKey: ['store-nps'] });
      setSaved(true);
      setTimeout(() => { setSaved(false); setParsed([]); setFileName(''); onClose(); }, 1200);
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,184,148,0.12)' }}>
                  <Smile className="w-4.5 h-4.5" style={{ color: '#00B894', width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Cargar NPS desde Excel</h2>
                  <p className="text-[11px] text-slate-400">{district || 'Distrito'} · {districtStores.length} tiendas</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Month / Year selector */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mes</label>
                  <select
                    value={selMonth}
                    onChange={(e) => setSelMonth(Number(e.target.value))}
                    className="w-full h-9 mt-1 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-800 focus:border-rose-400 focus:outline-none bg-white"
                  >
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Año</label>
                  <input
                    type="number"
                    value={selYear}
                    onChange={(e) => setSelYear(Number(e.target.value))}
                    className="w-full h-9 mt-1 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-center text-slate-800 focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload area */}
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                />
                <div className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-300 transition-colors px-6 py-8 text-center bg-slate-50/60">
                  <FileSpreadsheet className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">
                    {fileName || 'Selecciona el archivo Excel'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Columnas esperadas: <b>Tienda</b> (código) y <b>NPS</b> (0-10)
                  </p>
                </div>
              </label>

              {parseError && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-rose-600">{parseError}</p>
                </div>
              )}

              {/* Preview */}
              {parsed.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Vista previa · {matchedCount}/{parsed.length} coincidencias
                    </p>
                    <span className="text-[11px] text-slate-400">{MONTHS[selMonth - 1]} {selYear}</span>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {parsed.map((row, i) => {
                      const status = getNPSStatus(row.score);
                      return (
                        <div key={i} className={`px-3 py-2 rounded-xl flex items-center gap-2.5 ${row.matched ? 'bg-white' : 'bg-rose-50/60'}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${status.color}15` }}>
                            {row.score > 0 ? status.face : '➖'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-slate-800 truncate">{row.store_code} · {row.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {row.matched ? 'Tienda del distrito' : 'No coincide con ninguna tienda'}
                            </p>
                          </div>
                          <span className="text-[13px] font-black tabular-nums text-slate-800">
                            {row.score.toFixed(1).replace('.', ',')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                {parsed.length > 0 ? `${matchedCount} tiendas se actualizarán` : 'Sube un Excel para continuar'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100">
                  Cancelar
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || matchedCount === 0}
                  className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
                  {saveMutation.isPending
                    ? <><Save className="w-3.5 h-3.5" /> Guardando…</>
                    : saved
                      ? <><Check className="w-3.5 h-3.5" /> Guardado</>
                      : <><Upload className="w-3.5 h-3.5" /> Cargar {matchedCount} NPS</>}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}