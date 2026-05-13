import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function ProjectionCard({ currentSales = 1700000, targetSales = 1800000, delay = 0 }) {
  const percentage = Math.min(100, Math.round((currentSales / targetSales) * 100));
  const remaining = Math.max(0, targetSales - currentSales);
  
  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.13em]">Proyección de Cierre</p>
          <p className="text-[11px] text-slate-300 mt-0.5 font-medium">Meta de ventas hoy</p>
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl" style={{ background: '#FAE8E6' }}>
          <p className="text-[9px] text-gray-500 font-medium mb-1">Voy en</p>
          <p className="text-[18px] font-black tabular-nums" style={{ color: '#F5A8A0' }}>
            {percentage}%
          </p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: '#F3F3F3' }}>
          <p className="text-[9px] text-gray-500 font-medium mb-1">Falta cerrar</p>
          <p className="text-[14px] font-bold text-gray-600">
            {fmt(remaining)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full" style={{ background: '#EFEFEF' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.3, duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="h-full rounded-full"
            style={{
              background: percentage >= 80
                ? 'linear-gradient(90deg, #F5A8A0, #F5D5D1)'
                : percentage >= 50
                ? 'linear-gradient(90deg, #F5A8A0, #F5C9C1)'
                : 'linear-gradient(90deg, #F5A8A0, #F5B8B0)',
            }}
          />
        </div>
      </div>

      {/* Target info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-gray-400 font-medium">Meta de cierre</p>
          <p className="text-[12px] font-bold text-gray-600 mt-0.5">{fmt(targetSales)}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: '#FAE8E6' }}>
          <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#F5A8A0' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#F5A8A0' }}>
            {Math.round(((targetSales - currentSales) / currentSales) * 100)}% para meta
          </span>
        </div>
      </div>
    </motion.div>
  );
}