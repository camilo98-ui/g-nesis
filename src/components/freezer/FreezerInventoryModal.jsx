import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Snowflake } from 'lucide-react';

// Agrupa slots con sabor por nombre (case-insensitive) y devuelve lista ordenada
function groupByFlavor(slots) {
  const counts = {};
  slots.forEach((s) => {
    if (!s.flavor_name || s.flavor_name.trim() === '' || s.is_empty) return;
    const key = s.flavor_name.toLowerCase().trim();
    if (!counts[key]) counts[key] = { name: s.flavor_name.trim(), count: 0 };
    counts[key].count += 1;
  });
  return Object.values(counts).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

export default function FreezerInventoryModal({
  open,
  onClose,
  storeCode,
  storeName,
  allSlots = [],
  availableFreezers = [1, 2, 3],
}) {
  // Conteo por nevera dividido en sección Frontales (F) y Traseros (T)
  const freezerSummaries = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return [];

    return availableFreezers.map((num) => {
      const freezerSlots = allSlots.filter(
        (s) => s.store_id === `${storeCode}_F${num}`
      );

      const frontSlots = freezerSlots.filter((s) => (s.slot_type || 'F') === 'F');
      const backSlots = freezerSlots.filter((s) => s.slot_type === 'T');

      const frontList = groupByFlavor(frontSlots);
      const backList = groupByFlavor(backSlots);
      const frontTotal = frontList.reduce((s, f) => s + f.count, 0);
      const backTotal = backList.reduce((s, f) => s + f.count, 0);

      return {
        num,
        frontList,
        backList,
        frontTotal,
        backTotal,
        total: frontTotal + backTotal,
      };
    });
  }, [allSlots, availableFreezers, storeCode]);

  // Totales globales
  const totals = useMemo(() => {
    let frontTotal = 0, backTotal = 0;
    const allFlavors = {};
    freezerSummaries.forEach((f) => {
      frontTotal += f.frontTotal;
      backTotal += f.backTotal;
      [...f.frontList, ...f.backList].forEach((fl) => {
        const k = fl.name.toLowerCase();
        allFlavors[k] = (allFlavors[k] || 0) + fl.count;
      });
    });
    return {
      frontTotal,
      backTotal,
      total: frontTotal + backTotal,
      uniqueFlavors: Object.keys(allFlavors).length,
    };
  }, [freezerSummaries]);

  const renderFlavorRow = (fl, i) => (
    <div key={i} className="flex items-center justify-between px-4 py-2">
      <span className="text-sm text-slate-700 font-medium truncate">{fl.name}</span>
      <span className="text-sm font-bold text-slate-900 tabular-nums">{fl.count}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Snowflake className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-slate-900 text-lg font-bold leading-tight">Inventario de Neveras</h2>
                  {storeCode && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {storeCode}{storeName ? ` · ${storeName}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Resumen global */}
            <div className="px-6 py-3 flex items-center gap-6 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totals.total}</span>
                <span className="text-xs text-slate-400 font-medium">total</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totals.frontTotal}</span>
                <span className="text-xs text-slate-400 font-medium">frontales</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totals.backTotal}</span>
                <span className="text-xs text-slate-400 font-medium">traseros</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totals.uniqueFlavors}</span>
                <span className="text-xs text-slate-400 font-medium">sabores</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {freezerSummaries.length === 0 ? (
                <div className="text-center py-12">
                  <Snowflake className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No hay datos de neveras disponibles</p>
                </div>
              ) : (
                freezerSummaries.map((fz) => (
                  <div key={fz.num} className="border border-slate-100 rounded-xl overflow-hidden">
                    {/* Cabecera de nevera con total */}
                    <div className="px-4 py-3 flex items-center justify-between bg-slate-50/70">
                      <div className="flex items-center gap-2.5">
                        <Snowflake className="w-4 h-4 text-slate-400" />
                        <h3 className="text-slate-800 font-semibold text-sm">Nevera #{fz.num}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 tabular-nums">
                        Total: {fz.total}
                      </span>
                    </div>

                    {/* Sección Frontales */}
                    <div className="border-t border-slate-100">
                      <div className="px-4 py-2 flex items-center justify-between bg-slate-50/40">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Frontales</span>
                        <span className="text-xs font-semibold text-slate-500 tabular-nums">{fz.frontTotal}</span>
                      </div>
                      {fz.frontList.length > 0 ? (
                        <div className="divide-y divide-slate-50">{fz.frontList.map(renderFlavorRow)}</div>
                      ) : (
                        <p className="px-4 py-3 text-xs text-slate-400">Sin cubetas frontales</p>
                      )}
                    </div>

                    {/* Sección Traseros */}
                    <div className="border-t border-slate-100">
                      <div className="px-4 py-2 flex items-center justify-between bg-slate-50/40">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Traseros</span>
                        <span className="text-xs font-semibold text-slate-500 tabular-nums">{fz.backTotal}</span>
                      </div>
                      {fz.backList.length > 0 ? (
                        <div className="divide-y divide-slate-50">{fz.backList.map(renderFlavorRow)}</div>
                      ) : (
                        <p className="px-4 py-3 text-xs text-slate-400">Sin cubetas traseras</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}