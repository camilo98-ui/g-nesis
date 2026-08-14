import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Snowflake } from 'lucide-react';

export default function FreezerInventoryModal({
  open,
  onClose,
  storeCode,
  storeName,
  allSlots = [],
  availableFreezers = [1, 2, 3],
}) {
  // Conteo exacto por nevera: todos los slots con sabor (frontales + traseros) agrupados por nombre
  const freezerSummaries = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return [];

    return availableFreezers.map((num) => {
      const freezerSlots = allSlots.filter(
        (s) => s.store_id === `${storeCode}_F${num}`
      );

      // Solo slots frontales (F) = lo que se muestra en el mapa. Los traseros (T) son respuesto.
      const filled = freezerSlots
        .filter((s) => (s.slot_type || 'F') === 'F')
        .filter((s) => !s.is_empty && s.flavor_name && s.flavor_name.trim() !== '');

      // Agrupar por nombre (case-insensitive)
      const counts = {};
      filled.forEach((s) => {
        const key = s.flavor_name.toLowerCase().trim();
        if (!counts[key]) counts[key] = { name: s.flavor_name.trim(), count: 0 };
        counts[key].count += 1;
      });

      const flavorList = Object.values(counts).sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name)
      );

      return {
        num,
        total: filled.length,
        uniqueFlavors: flavorList.length,
        flavorList,
      };
    });
  }, [allSlots, availableFreezers, storeCode]);

  // Totales globales
  const totals = useMemo(() => {
    const totalCubetas = freezerSummaries.reduce((s, f) => s + f.total, 0);
    const allFlavors = {};
    freezerSummaries.forEach((f) =>
      f.flavorList.forEach((fl) => {
        const k = fl.name.toLowerCase();
        allFlavors[k] = (allFlavors[k] || 0) + fl.count;
      })
    );
    return {
      totalCubetas,
      uniqueFlavors: Object.keys(allFlavors).length,
    };
  }, [freezerSummaries]);

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
            {/* Header minimalista */}
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

            {/* Resumen global sobrio */}
            <div className="px-6 py-3 flex items-center gap-6 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totals.totalCubetas}</span>
                <span className="text-xs text-slate-400 font-medium">cubetas</span>
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
                    {/* Cabecera de nevera */}
                    <div className="px-4 py-3 flex items-center justify-between bg-slate-50/70">
                      <div className="flex items-center gap-2.5">
                        <Snowflake className="w-4 h-4 text-slate-400" />
                        <h3 className="text-slate-800 font-semibold text-sm">Nevera #{fz.num}</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-medium tabular-nums">
                        {fz.total} cubetas · {fz.uniqueFlavors} sabores
                      </span>
                    </div>

                    {/* Lista exacta de sabores */}
                    {fz.flavorList.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {fz.flavorList.map((fl, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <span className="text-sm text-slate-700 font-medium truncate">
                              {fl.name}
                            </span>
                            <span className="text-sm font-bold text-slate-900 tabular-nums">
                              {fl.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-400">Nevera vacía</p>
                      </div>
                    )}
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