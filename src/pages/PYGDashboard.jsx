import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, ArrowLeft, Loader2, Search, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PYGModal from '@/components/reports/PYGModal';
import { STORES } from '@/components/StoreSelector';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

function getEbitdaStatus(val) {
  if (val == null) return { color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', label: 'Sin datos', icon: null };
  if (val >= 0.10) return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Saludable', icon: 'good' };
  if (val >= 0) return { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'En riesgo', icon: 'warn' };
  return { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Crítico', icon: 'bad' };
}

function StoreCard({ store, record, hasData, onClick }) {
  const status = getEbitdaStatus(record?.margen_ebitda);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 p-4 shadow-sm transition-all ${
        hasData ? status.bg : 'bg-white border-slate-200'
      }`}
    >
      {/* Store code badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-lg">
          {store.code}
        </div>
        {hasData ? (
          status.icon === 'good' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
          status.icon === 'warn' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
          <TrendingDown className="w-5 h-5 text-red-500" />
        ) : (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Sin datos</span>
        )}
      </div>

      {/* Store name */}
      <p className="text-sm font-bold text-slate-700 leading-tight mb-3 min-h-[36px]">
        {store.displayName || store.name}
      </p>

      {/* Metrics */}
      {hasData ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">EBITDA</span>
            <span className={`text-base font-black ${status.color}`}>
              {pct(record.margen_ebitda)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Gastos</span>
            <span className={`text-sm font-semibold ${
              record.gastos_pct_venta > 0.45 ? 'text-red-600' :
              record.gastos_pct_venta > 0.35 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {pct(record.gastos_pct_venta)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Costo Real</span>
            <span className="text-sm font-semibold text-slate-700">{pct(record.cost_real)}</span>
          </div>
          <div className={`text-center mt-2 py-1 rounded-lg text-xs font-bold ${status.bg} ${status.color}`}>
            {status.label}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-slate-300">
          <BarChart3 className="w-8 h-8 mb-1" />
          <p className="text-xs text-slate-400">Toca para ver detalles</p>
        </div>
      )}
    </motion.div>
  );
}

export default function PYGDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);

  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear];

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-all', month, year],
    queryFn: () => base44.entities.PYGReport.filter({ month: parseInt(month), year: parseInt(year) }),
  });

  // Map store code -> record
  const recordsByCode = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      if (r.store_code) map[r.store_code.trim().toUpperCase()] = r;
    });
    return map;
  }, [allRecords]);

  const filteredStores = useMemo(() => {
    const term = search.toLowerCase().trim();
    return STORES.filter(s =>
      !term ||
      s.code.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term) ||
      (s.displayName || '').toLowerCase().includes(term)
    );
  }, [search]);

  // Summary stats
  const stats = useMemo(() => {
    const withData = STORES.filter(s => recordsByCode[s.code.toUpperCase()]);
    const healthy = withData.filter(s => (recordsByCode[s.code.toUpperCase()]?.margen_ebitda || 0) >= 0.10);
    const atRisk = withData.filter(s => {
      const e = recordsByCode[s.code.toUpperCase()]?.margen_ebitda || 0;
      return e >= 0 && e < 0.10;
    });
    const critical = withData.filter(s => (recordsByCode[s.code.toUpperCase()]?.margen_ebitda || 0) < 0);
    return { total: STORES.length, withData: withData.length, healthy: healthy.length, atRisk: atRisk.length, critical: critical.length };
  }, [recordsByCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-emerald-900 text-white px-4 py-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight">Dashboard P&G</h1>
            <p className="text-white/60 text-sm">Estado de Profit & Loss por tienda</p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-32 bg-white/10 border-white/20 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-24 bg-white/10 border-white/20 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tiendas con datos', value: stats.withData, sub: `de ${stats.total}`, color: 'text-slate-700', bg: 'bg-white' },
            { label: 'Saludables', value: stats.healthy, sub: 'EBITDA ≥ 10%', color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'En riesgo', value: stats.atRisk, sub: 'EBITDA 0-10%', color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Críticas', value: stats.critical, sub: 'EBITDA negativo', color: 'text-red-700', bg: 'bg-red-50' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm p-4 text-center`}>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-sm font-semibold text-slate-600">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tienda..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white shadow-sm"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Store grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredStores.map((store, i) => {
              const code = store.code.toUpperCase();
              const record = recordsByCode[code];
              return (
                <motion.div key={store.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <StoreCard
                    store={store}
                    record={record}
                    hasData={!!record}
                    onClick={() => setSelectedStore(store.code)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* PYG Modal */}
      <AnimatePresence>
        {selectedStore && (
          <PYGModal
            storeId={selectedStore}
            onClose={() => setSelectedStore(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}