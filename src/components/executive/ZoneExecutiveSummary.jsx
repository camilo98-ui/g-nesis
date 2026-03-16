import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target, ArrowUp, ArrowDown } from 'lucide-react';

const fmt = (v) => {
  if (!v || isNaN(v)) return '$0';
  if (v >= 1000000000) return `$${(v / 1000000000).toFixed(2)}B`;
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('es-CO')}`;
};

const pct = (v) => isNaN(v) ? '0%' : `${v.toFixed(1)}%`;

function ProgressBar({ value, max, color, animated = true }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 130) : 0;
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pctVal, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

function StatusBadge({ compliance }) {
  if (compliance >= 100) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ EN META</span>;
  if (compliance >= 90) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">~ CERCA</span>;
  if (compliance >= 70) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">⚠ RIESGO</span>;
  if (compliance > 0) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">✕ CRÍTICO</span>;
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">— SIN DATOS</span>;
}

export default function ZoneExecutiveSummary({ storesAnalysis, monthlyTotals, dynamicTotals, onStoreClick }) {
  const zoneSales = monthlyTotals.totalSales;
  const zoneBudget = monthlyTotals.totalBudget;
  const zoneProjection = monthlyTotals.totalProjection;
  const zoneCompliance = zoneBudget > 0 ? (zoneSales / zoneBudget) * 100 : 0;
  const projCompliance = zoneBudget > 0 ? (zoneProjection / zoneBudget) * 100 : 0;
  const gap = Math.max(0, zoneBudget - zoneSales);

  const storesWithData = storesAnalysis.filter(s => s.hasData);
  const storesSorted = [...storesAnalysis].sort((a, b) => {
    if (!a.hasData && b.hasData) return 1;
    if (a.hasData && !b.hasData) return -1;
    return a.salesCompliance - b.salesCompliance;
  });

  return (
    <div className="space-y-5">
      {/* ZONA TOTAL - Panel principal */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header zona */}
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Zona · Mes Acumulado</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-black text-white tabular-nums">{fmt(zoneSales)}</span>
                <StatusBadge compliance={zoneCompliance} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">Presupuesto mes</p>
              <p className="text-xl font-black text-slate-300 tabular-nums">{fmt(zoneBudget)}</p>
            </div>
          </div>

          {/* Barra principal venta vs presupuesto */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">Venta real</span>
              <span className={`text-sm font-black tabular-nums ${zoneCompliance >= 100 ? 'text-emerald-400' : zoneCompliance >= 85 ? 'text-amber-400' : 'text-red-400'}`}>
                {pct(zoneCompliance)} del PPT
              </span>
            </div>
            <div className="w-full h-3 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${zoneCompliance >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : zoneCompliance >= 85 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(zoneCompliance, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Barra proyección cierre mes */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">Proyección cierre mes</span>
              <span className={`text-sm font-black tabular-nums ${projCompliance >= 100 ? 'text-emerald-400' : projCompliance >= 92 ? 'text-amber-400' : 'text-red-400'}`}>
                {fmt(zoneProjection)} · {pct(projCompliance)}
              </span>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full opacity-60 ${projCompliance >= 100 ? 'bg-emerald-400' : projCompliance >= 92 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 6px)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(projCompliance, 100)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Métricas rápidas de zona */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/8">
          {[
            {
              label: 'Brecha vs PPT',
              value: fmt(gap),
              sub: gap <= 0 ? '¡Sin brecha!' : `Faltan ${pct(100 - zoneCompliance)}`,
              color: gap <= 0 ? 'text-emerald-400' : 'text-red-400'
            },
            {
              label: 'Tiendas en meta',
              value: `${storesWithData.filter(s => s.salesCompliance >= 100).length}/${storesWithData.length}`,
              sub: `${storesWithData.filter(s => s.status === 'critical').length} críticas`,
              color: 'text-white'
            },
            {
              label: 'Ticket Promedio',
              value: fmt(dynamicTotals.avgTicket),
              sub: 'Zona total',
              color: 'text-purple-300'
            },
            {
              label: 'Venta Promedio/Día',
              value: fmt(dynamicTotals.avgDailySales),
              sub: `${dynamicTotals.daysElapsedInRange} días registrados`,
              color: 'text-blue-300'
            }
          ].map((m, i) => (
            <div key={i} className="px-4 py-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-lg font-black tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* TIENDAS - Grid de cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Status por Tienda</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="text-emerald-400">● En Meta</span>
            <span className="text-amber-400">● Riesgo</span>
            <span className="text-red-400">● Crítico</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {storesSorted.map((store, i) => {
            const compliance = store.salesCompliance;
            const projPct = store.salesBudget > 0 ? (store.monthProjection / store.salesBudget) * 100 : 0;
            const borderColor = !store.hasData ? 'border-white/5' :
              compliance >= 100 ? 'border-emerald-500/30' :
              compliance >= 90 ? 'border-amber-500/30' :
              compliance >= 70 ? 'border-orange-500/30' : 'border-red-500/40';
            const bgColor = !store.hasData ? 'from-slate-800/40 to-slate-900/40' :
              compliance >= 100 ? 'from-emerald-900/20 to-slate-900/40' :
              compliance >= 90 ? 'from-amber-900/20 to-slate-900/40' :
              compliance >= 70 ? 'from-orange-900/20 to-slate-900/40' : 'from-red-900/25 to-slate-900/40';

            return (
              <motion.div
                key={store.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => store.hasData && onStoreClick(store)}
                className={`bg-gradient-to-br ${bgColor} backdrop-blur-sm rounded-xl border ${borderColor} p-4 ${store.hasData ? 'cursor-pointer hover:brightness-110' : 'opacity-50'} transition-all`}
              >
                {/* Nombre y badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-white text-sm leading-tight">{store.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{store.code}</p>
                  </div>
                  <StatusBadge compliance={store.hasData ? compliance : -1} />
                </div>

                {!store.hasData ? (
                  <p className="text-xs text-slate-600 text-center py-2">Sin datos registrados</p>
                ) : (
                  <>
                    {/* Venta real vs presupuesto */}
                    <div className="flex justify-between items-end mb-1.5">
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">Venta Real Mes</p>
                        <p className="text-xl font-black text-white tabular-nums">{fmt(store.monthTotalSales)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 mb-0.5">PPT Mes</p>
                        <p className="text-sm font-bold text-slate-400 tabular-nums">{fmt(store.salesBudget)}</p>
                      </div>
                    </div>

                    {/* Barra cumplimiento */}
                    <div className="mb-3">
                      <ProgressBar
                        value={store.monthTotalSales}
                        max={store.salesBudget}
                        color={compliance >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                          compliance >= 90 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                          compliance >= 70 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                          'bg-gradient-to-r from-red-500 to-red-400'}
                      />
                      <div className="flex justify-between mt-1">
                        <span className={`text-xs font-black tabular-nums ${compliance >= 100 ? 'text-emerald-400' : compliance >= 90 ? 'text-amber-400' : compliance >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
                          {pct(compliance)}
                        </span>
                        {store.gap > 0 && (
                          <span className="text-[10px] text-slate-500">Falta {fmt(store.gap)}</span>
                        )}
                      </div>
                    </div>

                    {/* Proyección cierre */}
                    <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500">Proyección cierre</p>
                        <p className={`text-sm font-black tabular-nums ${projPct >= 100 ? 'text-emerald-400' : projPct >= 93 ? 'text-amber-400' : 'text-red-400'}`}>
                          {fmt(store.monthProjection)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">vs PPT</p>
                        <div className="flex items-center gap-1 justify-end">
                          {projPct >= 100 ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-red-400" />}
                          <span className={`text-sm font-black tabular-nums ${projPct >= 100 ? 'text-emerald-400' : projPct >= 93 ? 'text-amber-400' : 'text-red-400'}`}>
                            {pct(projPct)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}