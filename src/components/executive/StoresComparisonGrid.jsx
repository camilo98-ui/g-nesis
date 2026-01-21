import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function StoresComparisonGrid({ stores, onStoreSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {stores.map((store, idx) => {
        const compliance = store.budget > 0 ? (store.sales / store.budget) * 100 : 0;
        const isAboveTarget = compliance >= 100;
        const isMedium = compliance >= 85;

        return (
          <motion.button
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStoreSelect(store)}
            className={`relative overflow-hidden rounded-lg p-3 border backdrop-blur-xl text-left transition-all ${
              isAboveTarget
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-500/60'
                : isMedium
                ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30 hover:border-amber-500/60'
                : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30 hover:border-red-500/60'
            }`}
          >
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">{store.name}</h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-400">Venta</span>
                  <span className="text-sm font-bold text-white">
                    ${(store.sales / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-400">PPT</span>
                  <span className="text-sm font-bold text-slate-400">
                    ${(store.budget / 1000000).toFixed(1)}M
                  </span>
                </div>

                <div className="pt-1 border-t border-white/10">
                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden mb-0.5">
                    <motion.div
                      className={`h-full rounded-full ${
                        isAboveTarget ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(compliance, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className={`text-xs font-bold tabular-nums ${
                    isAboveTarget ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {compliance.toFixed(1)}%
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 pt-1">
                  {store.transactionCount.toLocaleString('es-CO')} TCs • ${(store.avgTicket).toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}