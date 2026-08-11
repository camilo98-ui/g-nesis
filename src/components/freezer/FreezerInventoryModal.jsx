import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Snowflake, Package, Repeat, Layers, IceCream } from 'lucide-react';

const SNOWFLAKE_GRADIENTS = [
  'from-cyan-400 to-blue-500',
  'from-pink-400 to-rose-500',
  'from-purple-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-fuchsia-400 to-pink-500',
];

export default function FreezerInventoryModal({
  open,
  onClose,
  storeCode,
  storeName,
  allSlots = [],
  availableFreezers = [1, 2, 3],
  freezerDimensions = {},
}) {
  // Computar resumen por nevera
  const freezerSummaries = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return [];

    return availableFreezers.map((num, idx) => {
      const freezerSlots = allSlots.filter(
        (s) => s.store_id === `${storeCode}_F${num}`
      );

      // Solo slots frontales (F) = cubetas visibles. Los traseros (T) son respuesto.
      const frontSlots = freezerSlots.filter((s) => (s.slot_type || 'F') === 'F');

      const filledSlots = frontSlots.filter(
        (s) => !s.is_empty && s.flavor_name && s.flavor_name.trim() !== ''
      );

      // Conteo por sabor (case-insensitive) — solo frontales
      const flavorCounts = {};
      filledSlots.forEach((s) => {
        const key = s.flavor_name.toLowerCase().trim();
        if (!flavorCounts[key]) {
          flavorCounts[key] = { name: s.flavor_name, count: 0, color: s.color };
        }
        flavorCounts[key].count += 1;
      });

      const flavorList = Object.values(flavorCounts).sort((a, b) => b.count - a.count);
      const uniqueFlavors = flavorList.length;
      const totalCubetas = filledSlots.length;
      const repeatedFlavors = flavorList.filter((f) => f.count > 1);
      const repeatedCount = repeatedFlavors.length;
      const repeatedCubetas = repeatedFlavors.reduce((sum, f) => sum + f.count, 0);

      // Capacidad real = slots frontales en BD; fallback a dimensiones de grid
      const dims = freezerDimensions[num] || { rows: 7, cols: 5 };
      const gridCapacity = dims.rows * dims.cols;
      const capacity = frontSlots.length > 0 ? frontSlots.length : gridCapacity;
      const occupancy = capacity > 0 ? Math.round((totalCubetas / capacity) * 100) : 0;

      return {
        num,
        gradient: SNOWFLAKE_GRADIENTS[idx % SNOWFLAKE_GRADIENTS.length],
        uniqueFlavors,
        totalCubetas,
        capacity,
        occupancy,
        repeatedCount,
        repeatedCubetas,
        flavorList,
        repeatedFlavors,
      };
    });
  }, [allSlots, availableFreezers, storeCode, freezerDimensions]);

  // Totales globales
  const totals = useMemo(() => {
    const totalCubetas = freezerSummaries.reduce((s, f) => s + f.totalCubetas, 0);
    const uniqueFlavors = new Set();
    freezerSummaries.forEach((f) => f.flavorList.forEach((fl) => uniqueFlavors.add(fl.name.toLowerCase())));
    const repeatedCount = freezerSummaries.reduce((s, f) => s + f.repeatedCount, 0);
    return {
      totalCubetas,
      uniqueFlavors: uniqueFlavors.size,
      repeatedCount,
    };
  }, [freezerSummaries]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <IceCream className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold leading-tight">Inventario de Neveras</h2>
                    {storeCode && (
                      <p className="text-white/80 text-xs mt-0.5">
                        {storeCode}{storeName ? ` · ${storeName}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Resumen global */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white text-2xl font-bold tabular-nums">{totals.totalCubetas}</p>
                  <p className="text-white/80 text-[10px] uppercase tracking-wide font-semibold">Cubetas</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white text-2xl font-bold tabular-nums">{totals.uniqueFlavors}</p>
                  <p className="text-white/80 text-[10px] uppercase tracking-wide font-semibold">Sabores</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white text-2xl font-bold tabular-nums">{totals.repeatedCount}</p>
                  <p className="text-white/80 text-[10px] uppercase tracking-wide font-semibold">Repetidos</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-rose-50/30 to-white">
              {freezerSummaries.length === 0 ? (
                <div className="text-center py-12">
                  <Snowflake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No hay datos de neveras disponibles</p>
                </div>
              ) : (
                freezerSummaries.map((fz, idx) => (
                  <motion.div
                    key={fz.num}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden"
                  >
                    {/* Cabecera de nevera */}
                    <div className={`bg-gradient-to-r ${fz.gradient} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center">
                          <Snowflake className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base leading-tight">Nevera #{fz.num}</h3>
                          <p className="text-white/80 text-xs">{fz.totalCubetas} / {fz.capacity} cubetas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-white/25 rounded-lg px-2.5 py-1">
                          <span className="text-white font-bold text-lg tabular-nums">{fz.uniqueFlavors}</span>
                          <span className="text-white/80 text-xs ml-1">sabores</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats rápidas */}
                    <div className="grid grid-cols-3 gap-2 px-4 pt-3">
                      <div className="flex items-center gap-2 bg-rose-50 rounded-lg px-2.5 py-2">
                        <Package className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="leading-tight">
                          <p className="text-[10px] text-gray-500 font-medium">Cubetas</p>
                          <p className="text-sm font-bold text-gray-800 tabular-nums">{fz.totalCubetas}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-2.5 py-2">
                        <Repeat className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="leading-tight">
                          <p className="text-[10px] text-gray-500 font-medium">Repetidos</p>
                          <p className="text-sm font-bold text-gray-800 tabular-nums">{fz.repeatedCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-2.5 py-2">
                        <Layers className="w-4 h-4 text-purple-500 shrink-0" />
                        <div className="leading-tight">
                          <p className="text-[10px] text-gray-500 font-medium">Ocupación</p>
                          <p className="text-sm font-bold text-gray-800 tabular-nums">{fz.occupancy}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Barra de ocupación */}
                    <div className="px-4 pt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fz.occupancy}%` }}
                          transition={{ delay: 0.15 + idx * 0.06, duration: 0.5 }}
                          className={`h-full bg-gradient-to-r ${fz.gradient} rounded-full`}
                        />
                      </div>
                    </div>

                    {/* Sabores repetidos destacados */}
                    {fz.repeatedFlavors.length > 0 && (
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Repeat className="w-3 h-3" />
                          Sabores repetidos ({fz.repeatedCount})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {fz.repeatedFlavors.map((fl, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full pl-2 pr-2.5 py-1"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: fl.color || '#FFB5C5' }}
                              />
                              <span className="text-xs font-medium text-gray-700">{fl.name}</span>
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full px-1.5">
                                {fl.count}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista completa de sabores */}
                    {fz.flavorList.length > 0 ? (
                      <div className="px-4 pb-4 pt-2">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Todos los sabores
                        </p>
                        <div className="space-y-1">
                          {fz.flavorList.map((fl, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-rose-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5"
                                  style={{ background: fl.color || '#FFB5C5' }}
                                />
                                <span className="text-gray-700 font-medium truncate">{fl.name}</span>
                              </div>
                              <span
                                className={`tabular-nums font-bold px-1.5 py-0.5 rounded ${
                                  fl.count > 1
                                    ? 'text-amber-600 bg-amber-50'
                                    : 'text-gray-500 bg-gray-50'
                                }`}
                              >
                                {fl.count}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 pb-4 pt-2 text-center">
                        <p className="text-xs text-gray-400 py-3">Nevera vacía</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}