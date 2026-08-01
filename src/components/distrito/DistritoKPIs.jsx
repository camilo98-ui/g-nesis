import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Target, Gauge, Zap, ShoppingBag, Store, Award, AlertTriangle } from 'lucide-react';

const fmt = (v) => {
  if (v == null || isNaN(v)) return '$0';
  const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
};
const fmtPct = (v) => (v == null || isNaN(v) ? '—' : `${v.toFixed(1)}%`);

function TrendMini({ vsYesterday, vsLastWeek }) {
  const items = [
    { label: 'Ayer', val: vsYesterday },
    { label: 'Sem.', val: vsLastWeek },
  ];
  return (
    <div className="flex items-center gap-2 mt-1.5">
      {items.map((it, i) => {
        const isUp = it.val > 0; const isFlat = it.val === 0 || it.val == null;
        const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
        const color = isFlat ? '#94a3b8' : isUp ? '#10b981' : '#e11d48';
        return (
          <div key={i} className="flex items-center gap-0.5">
            <Icon className="w-2.5 h-2.5" style={{ color }} />
            <span className="text-[9px] font-bold tabular-nums" style={{ color }}>
              {isFlat ? '0%' : `${isUp ? '+' : ''}${it.val.toFixed(1)}%`}
            </span>
            <span className="text-[8px] text-slate-300 mr-1">{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DistritoKPIs({ totals }) {
  const kpis = [
    { label: 'Ventas Totales', value: fmt(totals.totalSales), icon: DollarSign, color: '#C21875',
      vsYesterday: totals.vsYesterday, vsLastWeek: totals.vsLastWeek },
    { label: 'Presupuesto Total', value: fmt(totals.totalBudget), icon: Target, color: '#6366f1' },
    { label: 'Cumplimiento Global', value: fmtPct(totals.compliance), icon: Gauge, color: totals.compliance >= 95 ? '#10b981' : totals.compliance >= 80 ? '#f59e0b' : '#e11d48' },
    { label: 'Gap Global', value: fmt(totals.gap), icon: totals.gap >= 0 ? TrendingUp : TrendingDown, color: totals.gap >= 0 ? '#10b981' : '#e11d48' },
    { label: 'Proyección Cierre', value: fmt(totals.projection), icon: TrendingUp, color: totals.projCompliance >= 95 ? '#10b981' : '#f59e0b' },
    { label: 'Ticket Promedio', value: fmt(totals.avgTicket), icon: Zap, color: '#a78bfa' },
    { label: 'Transacciones', value: (totals.totalTransactions || 0).toLocaleString('es-CO'), icon: ShoppingBag, color: '#0ea5e9' },
    { label: 'Venta Prom./Tienda', value: fmt(totals.avgPerStore), icon: Store, color: '#f59e0b' },
    { label: 'Tiendas ≥ Meta', value: `${totals.overBudget} / ${totals.totalStores}`, icon: Award, color: '#10b981' },
    { label: 'Tiendas Bajo Meta', value: `${totals.underBudget}`, icon: AlertTriangle, color: '#e11d48' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + i * 0.03, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card card-accent-top relative overflow-hidden rounded-2xl p-4 hover-lift">
            <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${kpi.color}40 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-2 relative">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{kpi.label}</p>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: `${kpi.color}12`, border: `1px solid ${kpi.color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-xl font-black tabular-nums relative" style={{ color: kpi.color }}>{kpi.value}</p>
            {(kpi.vsYesterday != null || kpi.vsLastWeek != null) && (
              <TrendMini vsYesterday={kpi.vsYesterday} vsLastWeek={kpi.vsLastWeek} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}