import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Database } from 'lucide-react';
import SectionCard from './SectionCard';

function StatusBadge({ status }) {
  const config = {
    completo: { label: 'Completo', color: '#10b981', icon: CheckCircle2 },
    parcial: { label: 'Parcial', color: '#f59e0b', icon: AlertCircle },
    pendiente: { label: 'Pendiente', color: '#ef4444', icon: XCircle },
  };
  const c = config[status] || config.pendiente;
  const Icon = c.icon;
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: c.color + '12' }}>
      <Icon style={{ width: 11, height: 11, color: c.color }} />
      <span className="text-[9px] font-bold" style={{ color: c.color }}>{c.label}</span>
    </div>
  );
}

export default function InfoStatusCard({ sources, infoIndex }) {
  const indexColor = infoIndex >= 90 ? '#10b981' : infoIndex >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <SectionCard icon={Database} title="Estado de Información" subtitle="Carga de datos por fuente" color="#0ea5e9" delay={0.2}>
      <div className="space-y-0.5">
        {sources.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.04 }}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <p className="flex-1 text-[11px] font-bold text-slate-600">{s.name}</p>
            <p className="text-[11px] font-bold tabular-nums text-slate-500 flex-shrink-0">{s.loaded}/{s.total}</p>
            <div className="flex-shrink-0" style={{ minWidth: 72 }}>
              <StatusBadge status={s.status} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Índice de información del distrito</p>
          <p className="text-[18px] font-black tabular-nums" style={{ color: indexColor }}>{infoIndex.toFixed(0)}%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: indexColor + '12' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(infoIndex, 100)}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: indexColor }}
          />
        </div>
      </div>
    </SectionCard>
  );
}