import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Database } from 'lucide-react';
import SectionCard from './SectionCard';

function AlertCard({ item, delay }) {
  const c = item.color;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md"
      style={{
        background: `linear-gradient(90deg, ${c}06 0%, rgba(255,255,255,0.98) 60%)`,
        border: `1px solid ${c}15`,
      }}
    >
      {/* Status badge */}
      <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider"
        style={{ background: c, color: '#fff', minWidth: 64, textAlign: 'center' }}>
        {item.status}
      </div>

      {/* Store info */}
      <div className="flex-shrink-0 min-w-0" style={{ minWidth: 80 }}>
        <p className="text-[12px] font-black text-slate-700 truncate">{item.name}</p>
        {item.code && <p className="text-[9px] text-slate-400">{item.code}</p>}
      </div>

      {/* Metrics */}
      <div className="flex-1 flex items-center gap-3 lg:gap-5 justify-end overflow-x-auto">
        {item.metrics.map((m, i) => (
          <div key={i} className="text-center flex-shrink-0">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{m.label}</p>
            <p className="text-[13px] font-black tabular-nums" style={{ color: m.color || '#475569' }}>{m.value}</p>
          </div>
        ))}
      </div>

      <ChevronRight style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
    </motion.div>
  );
}

export default function AttentionSection({ items }) {
  if (!items || items.length === 0) {
    return (
      <SectionCard icon={AlertTriangle} title="Lo que Requiere Atención" subtitle="Indicadores y tiendas que necesitan intervención" color="#ef4444" delay={0.15}>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <AlertTriangle style={{ color: '#10b981', width: 18, height: 18 }} />
          </div>
          <p className="text-[12px] font-bold text-slate-500">Todas las tiendas están operando normalmente</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={AlertTriangle} title="Lo que Requiere Atención" subtitle="Indicadores y tiendas que necesitan intervención" color="#ef4444" delay={0.15}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <AlertCard key={`${item.code || 'pending'}-${i}`} item={item} delay={0.2 + i * 0.06} />
        ))}
      </div>
    </SectionCard>
  );
}