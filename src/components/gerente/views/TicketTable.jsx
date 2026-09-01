import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Search, ChevronDown } from 'lucide-react';
import SectionCard from '../SectionCard';
import { fmtM, fmtCOP, TARGETS, getStoreStatus } from '../gerenteUtils';

export default function TicketTable({ storeData, districtTotals, mode }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('avgTicket');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    let result = storeData.filter(s => s.hasData);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null || isNaN(av)) av = -1;
      if (bv == null || isNaN(bv)) bv = -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [storeData, search, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (mode === 'global') {
    const avgTicket = districtTotals.avgTicket || 0;
    const target = TARGETS.ticket;
    const compliance = avgTicket > 0 ? (avgTicket / target * 100) : 0;
    const gap = avgTicket > 0 ? target - avgTicket : 0;
    const bestStore = [...storeData].filter(s => s.hasData).sort((a, b) => b.avgTicket - a.avgTicket)[0];
    const worstStore = [...storeData].filter(s => s.hasData).sort((a, b) => a.avgTicket - b.avgTicket)[0];

    return (
      <SectionCard icon={Receipt} title="Ticket Promedio — Distrito" subtitle="Resumen consolidado" color="#f59e0b">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main metric */}
          <div className="lg:col-span-1 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(255,255,255,0.98) 55%)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Receipt style={{ color: '#f59e0b', width: 15, height: 15 }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Promedio</p>
            </div>
            <p className="text-[36px] font-black tabular-nums leading-none mb-2" style={{ color: '#f59e0b', letterSpacing: '-0.03em' }}>{fmtCOP(avgTicket)}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400">Meta: <span className="font-bold text-slate-600">{fmtCOP(target)}</span></span>
              <span className="text-[11px] font-black" style={{ color: compliance >= 100 ? '#10b981' : '#f59e0b' }}>{compliance.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(compliance, 100)}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: '#f59e0b' }} />
            </div>
            {gap > 0 && <p className="text-[10px] text-slate-400 mt-2">Brecha: <span className="font-bold text-red-400">{fmtCOP(gap)}</span></p>}
          </div>

          {/* Best and worst */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestStore && (
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.98) 55%)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Mejor Ticket</p>
                </div>
                <p className="text-[12px] font-black text-slate-700 mb-1">{bestStore.name}</p>
                <p className="text-[24px] font-black tabular-nums" style={{ color: '#10b981', letterSpacing: '-0.03em' }}>{fmtCOP(bestStore.avgTicket)}</p>
              </div>
            )}
            {worstStore && (
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.98) 55%)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-500">Menor Ticket</p>
                </div>
                <p className="text-[12px] font-black text-slate-700 mb-1">{worstStore.name}</p>
                <p className="text-[24px] font-black tabular-nums" style={{ color: '#ef4444', letterSpacing: '-0.03em' }}>{fmtCOP(worstStore.avgTicket)}</p>
              </div>
            )}
            <div className="rounded-2xl p-4 sm:col-span-2" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Oportunidad de Mejora</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {gap > 0
                  ? `Si todas las tiendas alcanzan el ticket objetivo de ${fmtCOP(target)}, el distrito podría incrementar aproximadamente ${fmtM(gap * districtTotals.totalRangeTx)} en ventas del período.`
                  : 'El ticket promedio del distrito está alineado o por encima de la meta. ¡Excelente trabajo!'}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={Receipt}
      title="Ticket Promedio por Tienda"
      subtitle={`${filtered.length} tiendas con datos`}
      color="#f59e0b"
      right={
        <div className="relative">
          <Search style={{ width: 12, height: 12, color: '#94a3b8', position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tienda..."
            className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 focus:border-amber-300 focus:outline-none w-32 lg:w-40"
          />
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Receipt style={{ width: 24, height: 24, color: '#cbd5e1' }} />
          <p className="text-[12px] text-slate-400">No hay datos de ticket promedio para mostrar</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  { key: 'name', label: 'Tienda', sortable: true },
                  { key: 'avgTicket', label: 'Ticket Prom.', sortable: true },
                  { key: 'compliance', label: 'Cumpl. PPT', sortable: true },
                  { key: 'rangeTx', label: 'Transacciones', sortable: true },
                  { key: 'rangeSales', label: 'Ventas', sortable: true },
                  { key: 'status', label: 'Estado', sortable: false },
                ].map(col => (
                  <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                    className={`text-left py-2.5 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 ${col.sortable ? 'cursor-pointer hover:text-slate-600' : ''}`}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && <ChevronDown style={{ width: 10, height: 10 }} className={sortDir === 'asc' ? 'rotate-180' : ''} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((store, i) => {
                const ticketCompliance = store.avgTicket > 0 ? (store.avgTicket / TARGETS.ticket * 100) : 0;
                const status = getStoreStatus(store.compliance, store.hasData);
                return (
                  <motion.tr
                    key={store.code || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 + i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <p className="text-[12px] font-black text-slate-700 truncate" style={{ maxWidth: 120 }}>{store.name}</p>
                      <p className="text-[8px] text-slate-400">{store.code}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-[13px] font-black tabular-nums text-slate-700">{fmtCOP(store.avgTicket)}</p>
                      <div className="mt-1 h-1 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(ticketCompliance, 100)}%`, background: ticketCompliance >= 100 ? '#10b981' : '#f59e0b' }} />
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[12px] font-bold tabular-nums" style={{ color: (store.compliance ?? 0) >= 100 ? '#10b981' : (store.compliance ?? 0) >= 80 ? '#f59e0b' : '#ef4444' }}>
                      {(store.compliance ?? 0).toFixed(0)}%
                    </td>
                    <td className="py-3 px-2 text-[12px] font-semibold tabular-nums text-slate-500">
                      {store.rangeTx > 0 ? store.rangeTx.toLocaleString('es-CO') : '—'}
                    </td>
                    <td className="py-3 px-2 text-[12px] font-bold tabular-nums text-slate-600">{fmtM(store.rangeSales)}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}