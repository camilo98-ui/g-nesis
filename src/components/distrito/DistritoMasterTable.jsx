import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

const fmt = (v) => {
  if (v == null || isNaN(v)) return '—';
  const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtPct = (v) => (v == null || isNaN(v) ? '—' : `${v.toFixed(1)}%`);
const statusColor = (c) => c >= 100 ? '#10b981' : c >= 95 ? '#f59e0b' : c > 0 ? '#e11d48' : '#94a3b8';
const statusLabel = (c) => c >= 100 ? 'Cumple' : c >= 95 ? 'En riesgo' : c > 0 ? 'Crítico' : 'Sin datos';

export default function DistritoMasterTable({ stores, onStoreClick, onExport }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'compliance', dir: 'desc' });

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const aVal = a[sort.key]; const bVal = b[sort.key];
    if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
    return ((aVal || 0) - (bVal || 0)) * dir;
  });

  const toggleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'desc' });
  };

  const SortHeader = ({ k, label, align = 'right' }) => (
    <th className={`px-3 py-2.5 cursor-pointer select-none hover:bg-rose-50/50 transition-colors ${align === 'left' ? 'text-left' : 'text-right'}`}
      onClick={() => toggleSort(k)}>
      <div className={`flex items-center gap-1 ${align === 'left' ? '' : 'justify-end'}`}>
        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        {sort.key === k && (sort.dir === 'asc'
          ? <ArrowUp className="w-2.5 h-2.5 text-rose-400" />
          : <ArrowDown className="w-2.5 h-2.5 text-rose-400" />)}
      </div>
    </th>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-black text-slate-700">Tabla Maestra de Tiendas</p>
          <p className="text-[10px] text-slate-400">{filtered.length} tiendas · click en una fila para ver detalle</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tienda..." className="pl-8 h-8 w-40 text-xs bg-white/60 border-slate-200" />
          </div>
          <button onClick={onExport}
            className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 text-emerald-600 text-xs font-bold transition-all">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/50">
            <tr>
              <SortHeader k="name" label="Tienda" align="left" />
              <SortHeader k="totalSales" label="Ventas" />
              <SortHeader k="monthlyBudget" label="PPT" />
              <SortHeader k="compliance" label="Cumpl." />
              <SortHeader k="gap" label="Gap" />
              <SortHeader k="avgTicket" label="Ticket" />
              <SortHeader k="totalTransactions" label="Txn" />
              <SortHeader k="participation" label="Part." />
              <SortHeader k="compliance" label="Estado" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const color = statusColor(s.compliance);
              return (
                <motion.tr key={s.code}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                  onClick={() => onStoreClick(s)}
                  className="border-b border-slate-50 hover:bg-rose-50/30 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-7 rounded-full" style={{ background: color }} />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{s.name}</p>
                        <p className="text-[9px] text-slate-400">{s.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-700">{fmt(s.totalSales)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmt(s.monthlyBudget)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-black tabular-nums" style={{ color }}>{fmtPct(s.compliance)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: s.gap >= 0 ? '#10b981' : '#e11d48' }}>
                    {s.gap >= 0 ? '+' : ''}{fmt(s.gap)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmt(s.avgTicket)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{(s.totalTransactions || 0).toLocaleString('es-CO')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmtPct(s.participation)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}15`, color }}>
                      {statusLabel(s.compliance)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}