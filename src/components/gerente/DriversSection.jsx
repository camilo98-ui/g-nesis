import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import SectionCard from './SectionCard';

function DriverItem({ item, isPositive, delay }) {
  const c = isPositive ? '#10b981' : '#ef4444';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? -8 : 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: c + '12' }}>
        <Icon style={{ width: 12, height: 12, color: c }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-600 truncate">{item.label}</p>
        {item.detail && <p className="text-[9px] text-slate-400">{item.detail}</p>}
      </div>
      <p className="text-[14px] font-black tabular-nums flex-shrink-0" style={{ color: c }}>
        {item.value}
      </p>
    </motion.div>
  );
}

export default function DriversSection({ drivers }) {
  const positive = drivers?.positive || [];
  const negative = drivers?.negative || [];

  return (
    <SectionCard icon={TrendingUp} title="Drivers del Distrito" subtitle="Factores que impulsan o afectan el resultado" color="#8b5cf6" delay={0.3}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positive drivers */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Drivers Positivos</p>
          </div>
          <div>
            {positive.length > 0 ? positive.map((d, i) => (
              <DriverItem key={i} item={d} isPositive delay={0.35 + i * 0.06} />
            )) : (
              <p className="text-[10px] text-slate-300 py-4 text-center">Sin drivers positivos identificados</p>
            )}
          </div>
        </div>

        {/* Negative drivers */}
        <div className="lg:border-l lg:border-slate-100 lg:pl-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Drivers Negativos</p>
          </div>
          <div>
            {negative.length > 0 ? negative.map((d, i) => (
              <DriverItem key={i} item={d} isPositive={false} delay={0.35 + i * 0.06} />
            )) : (
              <p className="text-[10px] text-slate-300 py-4 text-center">Sin drivers negativos identificados</p>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}