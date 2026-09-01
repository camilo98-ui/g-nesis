import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Settings2, ChevronDown } from 'lucide-react';
import SectionCard from './SectionCard';
import { fmtM, fmtInt, getStoreStatus } from './gerenteUtils';

const COLUMNS = [
  { key: 'name', label: 'Tienda', sortable: true, minWidth: 120 },
  { key: 'rangeSales', label: 'Ventas', sortable: true, format: 'currency', minWidth: 90 },
  { key: 'compliance', label: 'Cumpl.', sortable: true, format: 'pct', minWidth: 70 },
  { key: 'ebitda', label: 'EBITDA', sortable: true, format: 'pct', minWidth: 70 },
  { key: 'nps', label: 'NPS', sortable: true, format: 'num', minWidth: 50 },
  { key: 'rangeTx', label: 'Trans.', sortable: true, format: 'int', minWidth: 70 },
  { key: 'avgTicket', label: 'Ticket', sortable: true, format: 'currency', minWidth: 80 },
  { key: 'score', label: 'Score', sortable: true, format: 'num', minWidth: 60 },
  { key: 'status', label: 'Estado', sortable: true, format: 'status', minWidth: 90 },
];

function formatCell(col, store) {
  const val = store[col.key];
  if (col.format === 'status') {
    const status = getStoreStatus(store.compliance, store.hasData);
    return (
      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap"
        style={{ background: status.bg, color: status.color }}>
        {status.label}
      </span>
    );
  }
  if (val == null || (typeof val === 'number' && isNaN(val)) || val === 0 && !store.hasData && col.key !== 'status') {
    return <span className="text-slate-300 text-[10px]">—</span>;
  }
  if (col.format === 'currency') return fmtM(val);
  if (col.format === 'pct') return `${val.toFixed(0)}%`;
  if (col.format === 'int') return fmtInt(val);
  if (col.format === 'num') return Math.round(val).toString();
  return val;
}

export default function StoresTable({ stores, onStoreClick }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('rangeSales');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCols, setVisibleCols] = useState(COLUMNS.map(c => c.key));
  const [showColSettings, setShowColSettings] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let result = [...stores];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'ebitda') { av = a.pyg?.margen_ebitda != null ? a.pyg.margen_ebitda * 100 : -1; bv = b.pyg?.margen_ebitda != null ? b.pyg.margen_ebitda * 100 : -1; }
      if (sortKey === 'status') { av = a.status?.priority ?? 99; bv = b.status?.priority ?? 99; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av == null || isNaN(av)) av = -1;
      if (bv == null || isNaN(bv)) bv = -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [stores, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const activeCols = COLUMNS.filter(c => visibleCols.includes(c.key));

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <SectionCard
      icon={Search}
      title="Desempeño de Tiendas"
      subtitle={`${filtered.length} tiendas · Ordenar por ${COLUMNS.find(c => c.key === sortKey)?.label || ''}`}
      color="#6366f1"
      delay={0.25}
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search style={{ width: 12, height: 12, color: '#94a3b8', position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar tienda..."
              className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 focus:border-pink-300 focus:outline-none w-32 lg:w-40"
            />
          </div>
          <button onClick={() => setShowColSettings(s => !s)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors relative">
            <Settings2 style={{ width: 13, height: 13, color: '#64748b' }} />
            {showColSettings && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-100 p-2 min-w-[140px]">
                {COLUMNS.map(c => (
                  <label key={c.key} className="flex items-center gap-2 py-1 cursor-pointer text-[10px] font-medium text-slate-600">
                    <input type="checkbox" checked={visibleCols.includes(c.key)}
                      onChange={() => setVisibleCols(v => v.includes(c.key) ? v.filter(k => k !== c.key) : [...v, c.key])} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <Download style={{ width: 13, height: 13, color: '#64748b' }} />
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100">
              {activeCols.map(col => (
                <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                  className={`text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 ${col.sortable ? 'cursor-pointer hover:text-slate-600' : ''}`}
                  style={{ minWidth: col.minWidth }}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && <ChevronDown style={{ width: 10, height: 10 }} className={sortDir === 'asc' ? 'rotate-180' : ''} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((store, i) => (
              <motion.tr
                key={store.code || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                onClick={() => onStoreClick?.(store)}
                className="border-b border-slate-50 hover:bg-pink-50/30 cursor-pointer transition-colors"
              >
                {activeCols.map(col => (
                  <td key={col.key} className="py-2.5 px-2 text-[11px] font-semibold text-slate-600">
                    {col.key === 'name' ? (
                      <div>
                        <p className="font-black text-slate-700 truncate" style={{ maxWidth: 120 }}>{store.name}</p>
                        <p className="text-[8px] text-slate-400">{store.code}</p>
                      </div>
                    ) : (
                      <span className="tabular-nums">{formatCell(col, store)}</span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-400">
            Mostrando {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 disabled:opacity-30 hover:bg-slate-50">←</button>
            <span className="text-[10px] font-bold text-slate-500 px-2">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 disabled:opacity-30 hover:bg-slate-50">→</button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}