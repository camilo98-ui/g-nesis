import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fmtVariation } from './gerenteUtils';

function KPICard({ label, value, metaLabel, meta, compliance, variation, variationType, color, icon: Icon, delay, onClick }) {
  const varText = fmtVariation(variation, variationType);
  const isPositive = (variation || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${color}05 0%, rgba(255,255,255,0.98) 55%)`,
        border: `1px solid ${color}12`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-center justify-between mb-3 relative">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          {Icon && <Icon style={{ color, width: 15, height: 15 }} />}
        </div>
        {varText && (
          <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg"
            style={{ background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {isPositive
              ? <ArrowUpRight style={{ width: 11, height: 11, color: '#10b981' }} />
              : <ArrowDownRight style={{ width: 11, height: 11, color: '#ef4444' }} />}
            <span className="text-[10px] font-black" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
              {varText}
            </span>
          </div>
        )}
      </div>

      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">{label}</p>
      <p className="text-[26px] font-black tabular-nums leading-none mb-3" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-400 font-medium">
          {metaLabel}: <span className="font-bold text-slate-600">{meta}</span>
        </span>
        {compliance != null && (
          <span className="text-[11px] font-black tabular-nums" style={{ color }}>{compliance.toFixed(0)}%</span>
        )}
      </div>

      {compliance != null && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(compliance, 0), 100)}%` }}
            transition={{ delay: delay + 0.2, duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function ExecutiveKPIs({ kpis }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
      {kpis.map((kpi, i) => (
        <KPICard key={kpi.key} {...kpi} delay={0.05 + i * 0.05} />
      ))}
    </div>
  );
}