import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';

export default function StoresTable({
  sortedStores, sortConfig, handleSort, dateRange,
  formatShort, formatCurrency, formatKPI,
  getStoreStatus, getStoreSuggestion,
  setSelectedStoreDetail, setHoveredStoreForChart,
  gregorianMode
}) {
  return (
    <div id="stores-table" className="mb-8">
      <div className="bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10">
              <th onClick={() => handleSort('name')} className="sticky left-0 bg-slate-950/80 backdrop-blur-xl z-10 text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer border-r border-white/10">
                <div className="flex items-center gap-2">Tienda {sortConfig.key==='name'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}</div>
              </th>
              <th onClick={() => handleSort('dailyBudget')} className="text-center py-3 px-3 text-[10px] font-bold text-orange-400 uppercase tracking-wider cursor-pointer bg-orange-500/5">
                <div className="flex flex-col items-center gap-1">
                  <span>PPT Día</span>
                  <span className="text-[8px] text-slate-500 normal-case">{gregorianMode?'Gregoriano':'Semana Retail'}</span>
                  {sortConfig.key==='dailyBudget'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}
                </div>
              </th>
              <th onClick={() => handleSort('weekCompliance')} className="text-center py-3 px-3 text-[10px] font-bold text-purple-400 uppercase tracking-wider cursor-pointer bg-purple-500/5">
                <div className="flex flex-col items-center gap-1">
                  <span>Real Semana</span>
                  <span className="text-[8px] text-slate-500 normal-case">Venta Actual</span>
                  {sortConfig.key==='weekCompliance'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}
                </div>
              </th>
              <th onClick={() => handleSort('weekProjection')} className="text-center py-3 px-3 text-[10px] font-bold text-pink-400 uppercase tracking-wider cursor-pointer bg-pink-500/5">
                <div className="flex flex-col items-center gap-1">
                  <span>Proy Semana</span>
                  {sortConfig.key==='weekProjection'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}
                </div>
              </th>
              <th onClick={() => handleSort('sales')} className="text-center py-3 px-3 text-[10px] font-bold text-blue-400 uppercase tracking-wider cursor-pointer bg-blue-500/5">
                <div className="flex flex-col items-center gap-1">
                  <span>Real Mes</span>
                  <span className="text-[8px] text-slate-500 normal-case">Acumulado</span>
                  {sortConfig.key==='sales'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}
                </div>
              </th>
              <th onClick={() => handleSort('monthProjection')} className="text-center py-3 px-3 text-[10px] font-bold text-emerald-400 uppercase tracking-wider cursor-pointer bg-emerald-500/5">
                <div className="flex flex-col items-center gap-1">
                  <span>Proy Mes</span>
                  <span className="text-[8px] text-slate-500 normal-case">Cierre Estimado</span>
                  {sortConfig.key==='monthProjection'&&(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStores.map((store) => (
              <tr
                key={store.code}
                onClick={() => store.hasData && setSelectedStoreDetail(store)}
                onMouseEnter={() => store.hasData && setHoveredStoreForChart(store)}
                onMouseLeave={() => setHoveredStoreForChart(null)}
                className={`border-b border-white/5 ${store.hasData ? 'cursor-pointer hover:bg-white/5' : ''} transition-colors`}
              >
                <td className="sticky left-0 bg-slate-950/90 backdrop-blur-xl z-10 py-3 px-3 border-r border-white/10">
                  <p className={`font-bold text-xs ${!store.hasData ? 'text-slate-600' : 'text-white'}`}>{store.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{store.code}</p>
                </td>
                <td className="py-3 px-3 text-center">
                  {!store.hasData ? <span className="text-xs text-slate-500">—</span> : (
                    <div>
                      <p className="font-black text-orange-400 text-base tabular-nums">{formatShort(store.dailyBudget)}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">meta hoy</p>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {!store.hasData ? <span className="text-xs text-slate-500">—</span> : (
                    <div>
                      <p className="font-black text-purple-400 text-base tabular-nums">{formatShort(store.weekTotalSales)}</p>
                      <p className={`text-xs font-bold mt-0.5 tabular-nums ${store.weekCompliance>=100?'text-emerald-400':store.weekCompliance>=70?'text-amber-400':'text-red-400'}`}>
                        {store.weekCompliance.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {!store.hasData ? <span className="text-xs text-slate-500">—</span> : (
                    <div>
                      <p className="font-black text-pink-400 text-base tabular-nums">{formatShort(store.weekProjection)}</p>
                      <p className={`text-xs font-bold mt-0.5 tabular-nums ${store.weekProjectionCompliance>=100?'text-emerald-400':store.weekProjectionCompliance>=90?'text-amber-400':'text-red-400'}`}>
                        {store.weekProjectionCompliance.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {!store.hasData ? <span className="text-xs text-slate-500">—</span> : (
                    <div>
                      <p className="font-black text-blue-400 text-base tabular-nums">{formatShort(store.monthTotalSales)}</p>
                      <p className={`text-xs font-bold mt-0.5 tabular-nums ${store.salesCompliance>=100?'text-emerald-400':store.salesCompliance>=90?'text-amber-400':'text-red-400'}`}>
                        {store.salesCompliance.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-center group relative">
                  {!store.hasData ? <span className="text-xs text-slate-500">—</span> : (
                    <div className="relative">
                      {store.monthProjectionCompliance >= 100 && (
                        <motion.div className="absolute -inset-3 bg-emerald-500/25 blur-xl rounded-lg" animate={{opacity:[0.3,0.5,0.3]}} transition={{duration:6,repeat:Infinity}}/>
                      )}
                      <p className={`font-black text-base tabular-nums relative z-10 ${store.monthProjectionCompliance>=100?'text-emerald-400':store.monthProjectionCompliance>=96?'text-amber-400':'text-red-400'}`}>
                        {formatShort(store.monthProjection)}
                      </p>
                      <p className={`text-xs font-bold mt-0.5 tabular-nums relative z-10 ${store.monthProjectionCompliance>=100?'text-emerald-400':store.monthProjectionCompliance>=96?'text-amber-400':'text-red-400'}`}>
                        {store.monthProjectionCompliance.toFixed(0)}%
                      </p>
                      <motion.div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute right-2 top-full mt-2 bg-slate-900/98 border border-white/30 rounded-xl p-3 shadow-2xl z-50 w-52" initial={{y:-10,opacity:0}} whileHover={{y:0,opacity:1}} transition={{duration:0.2}}>
                        <p className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2">{store.name} · <span className={getStoreStatus(store).color}>{getStoreStatus(store).text}</span></p>
                        <p className="text-[10px] text-amber-300 font-semibold">{getStoreSuggestion(store)}</p>
                        {store.salesCompliance < 90 && <p className="text-[9px] text-red-400 font-bold mt-1">Brecha: {formatCurrency(store.gap)}</p>}
                      </motion.div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}