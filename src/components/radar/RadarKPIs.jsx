import { motion } from 'framer-motion';
import { BarChart3, Crown, TrendingUp, Layers } from 'lucide-react';
import { InfoTooltip } from './RadarShared';

export default function RadarKPIs({ brandStats, brands, records, topBrand, fastestGrowing }) {
  const kpis = [
    { label: 'Total Transacciones', value: brandStats.reduce((s, b) => s + b.total, 0).toLocaleString('es-CO'), sub: `${records.length} tomas`, color: '#C21875', tip: 'Suma de todas las transacciones estimadas.', icon: BarChart3 },
    { label: 'Marcas Monitoreadas', value: brands.length, sub: `${brandStats.filter(b=>!b.onlyOneReading).length} con datos completos`, color: '#e11d48', tip: 'Marcas monitoreadas actualmente.', icon: Layers },
    { label: 'Líder del Período', value: topBrand?.brand || '—', sub: topBrand ? `${topBrand.total.toLocaleString('es-CO')} txn` : '—', color: '#C21875', tip: 'Marca con más transacciones acumuladas.', icon: Crown },
    { label: 'Mayor Crecimiento', value: fastestGrowing?.growth > 0 ? `+${fastestGrowing.growth.toFixed(0)}%` : '—', sub: fastestGrowing?.growth > 0 ? fastestGrowing.brand : '—', color: '#e11d48', tip: 'Crecimiento entre penúltima y última toma.', icon: TrendingUp }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.04, duration: 0.5, ease: [0.23,1,0.32,1] }}
            className="glass-card card-accent-top relative overflow-hidden rounded-2xl p-5 hover-lift">
            {/* Top gradient strip */}
            <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }}/>
            {/* Glow accent */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${kpi.color}30 0%, transparent 70%)` }}/>
            <div className="flex items-start justify-between mb-3 relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${kpi.color}15, ${kpi.color}05)`, border: `1px solid ${kpi.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }}/>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{kpi.label}</p>
              </div>
              <InfoTooltip text={kpi.tip}/>
            </div>
            <p className="text-2xl font-black tracking-tight truncate relative" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate font-medium">{kpi.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}