import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

function StatusBar({ label, value, threshold, inverse = false }) {
  if (value == null) return null;
  const pctVal = value * 100;
  const good = inverse ? pctVal <= threshold : pctVal >= threshold;
  const color = good ? 'bg-emerald-500' : pctVal >= threshold * 0.85 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = good ? 'text-emerald-700' : 'text-red-600';
  const width = Math.min(Math.abs(pctVal), 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-600 font-medium">{label}</span>
        <span className={`text-sm font-black ${textColor}`}>{pct(value)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function OtrosGastosPanel({ otrosGastos }) {
  const [open, setOpen] = useState(false);
  if (!otrosGastos) return null;

  let parsed = {};
  try { parsed = JSON.parse(otrosGastos); } catch { return null; }

  const entries = Object.entries(parsed).filter(([, v]) => v && v > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Ver desglose de gastos ({entries.length} partidas)
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1.5 overflow-hidden"
          >
            {entries.sort((a, b) => b[1] - a[1]).map(([name, val]) => (
              <div key={name} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-600 truncate max-w-[70%]">{name}</span>
                <span className="text-xs font-semibold text-slate-800">{pct(val)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const upper = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const bta = upper.match(/\bBTA\s*(\d+)/);
  if (bta) return `BTA ${bta[1]}`;
  const tunja = upper.match(/\bTUNJA\s*(\d+)/);
  if (tunja) return `TUNJA ${tunja[1]}`;
  const bogota = upper.match(/\bBOGOTA\s*(\d+)/);
  if (bogota) return `BOGOTA ${bogota[1]}`;
  const bog = upper.match(/\bBOG\s*(\d+)/);
  if (bog) return `BOGOTA ${bog[1]}`;
  return null;
}

export default function PYGModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear];

  const { data: record, isLoading } = useQuery({
    queryKey: ['pyg', storeCode, month, year],
    queryFn: async () => {
      if (!storeCode) return null;
      const all = await base44.entities.PYGReport.filter({ month: parseInt(month), year: parseInt(year) });
      return all.find(r => String(r.store_code || '').trim().toUpperCase() === storeCode.toUpperCase()) || null;
    },
    enabled: !!storeCode && !!month && !!year,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">P&G Tienda</h2>
              <p className="text-white/70 text-xs">{storeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Selector mes/año */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Mes</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Año</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !record ? (
            <div className="text-center py-16 text-slate-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-700">Sin datos de P&G</p>
              <p className="text-sm mt-1 text-slate-400">{MONTHS[parseInt(month) - 1]} {year}</p>
              <p className="text-xs mt-2 text-slate-400">El gerente puede cargarlos desde el menú principal</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Resumen ejecutivo */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 text-center ${
                    record.margen_ebitda >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className="text-xs text-slate-500 font-medium mb-1">Margen EBITDA</p>
                  <p className={`text-2xl font-black ${record.margen_ebitda >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {pct(record.margen_ebitda)}
                  </p>
                  {record.margen_ebitda >= 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mt-1" />
                    : <TrendingDown className="w-4 h-4 text-red-500 mx-auto mt-1" />}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center"
                >
                  <p className="text-xs text-slate-500 font-medium mb-1">Gastos % Venta</p>
                  <p className={`text-2xl font-black ${
                    record.gastos_pct_venta > 0.45 ? 'text-red-600' : record.gastos_pct_venta > 0.35 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {pct(record.gastos_pct_venta)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Meta &lt; 40%</p>
                </motion.div>
              </div>

              {/* Costos */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Estructura de Costos</p>
                <StatusBar label="Costo Real" value={record.cost_real} threshold={0} inverse />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Costo Teórico</span>
                  <span className="font-semibold text-slate-700">{pct(record.cost_teorico)}</span>
                </div>
                {record.cost_real != null && record.cost_teorico != null && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 ${
                    record.cost_real <= record.cost_teorico
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {record.cost_real <= record.cost_teorico
                      ? <TrendingDown className="w-3.5 h-3.5" />
                      : <TrendingUp className="w-3.5 h-3.5" />}
                    {record.cost_real <= record.cost_teorico
                      ? `Bajo costo teórico por ${pct(record.cost_teorico - record.cost_real)}`
                      : `Sobre costo teórico por ${pct(record.cost_real - record.cost_teorico)}`}
                  </div>
                )}
              </div>

              {/* Gastos principales */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Principales Gastos</p>
                <StatusBar label="Costo Personal" value={record.costo_personal} threshold={0.25} inverse />
                <StatusBar label="Arriendos" value={record.arriendos} threshold={0.15} inverse />
                {record.administracion != null && <StatusBar label="Administración" value={record.administracion} threshold={0.05} inverse />}
                {record.servicios_publicos != null && <StatusBar label="Servicios Públicos" value={record.servicios_publicos} threshold={0.05} inverse />}
                {record.impuestos != null && <StatusBar label="Impuestos" value={record.impuestos} threshold={0.03} inverse />}

                <OtrosGastosPanel otrosGastos={record.otros_gastos} />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}