import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radar, ArrowUpRight, ArrowDownRight, Minus, ChevronRight, Activity } from 'lucide-react';
import { AUTO_COLORS } from '@/components/radar/RadarShared';

const fmtN = (n) => n?.toLocaleString('es-CO') ?? '0';

export default function RadarPulseCard({ storeId }) {
  const { data: allRecords = [] } = useQuery({
    queryKey: ['competitiveRecords', storeId],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 500),
    enabled: !!storeId,
  });

  const records = useMemo(
    () => storeId ? allRecords.filter(r => !r.store_id || r.store_id === storeId) : allRecords,
    [allRecords, storeId]
  );

  const stats = useMemo(() => {
    if (!records.length) return null;

    const brandMap = {};
    records.forEach(r => {
      if (!brandMap[r.competition]) brandMap[r.competition] = AUTO_COLORS[Object.keys(brandMap).length % AUTO_COLORS.length];
    });
    const brands = Object.keys(brandMap);

    const brandStats = brands.map(brand => {
      const sorted = [...records].filter(r => r.competition === brand).sort((a, b) => new Date(a.date) - new Date(b.date));
      const txnSeries = sorted.map((r, i) => {
        if (i === 0) return null;
        return { ...r, txn: Math.max(0, r.serial - sorted[i - 1].serial) };
      }).filter(Boolean);
      const total = txnSeries.reduce((s, r) => s + r.txn, 0);
      const lastTxn = txnSeries[txnSeries.length - 1]?.txn || 0;
      const prevTxn = txnSeries[txnSeries.length - 2]?.txn || 0;
      const growth = prevTxn > 0 ? ((lastTxn - prevTxn) / prevTxn) * 100 : 0;
      return { brand, color: brandMap[brand], total, lastTxn, growth, count: sorted.length };
    }).sort((a, b) => b.total - a.total);

    const totalTxns = brandStats.reduce((s, b) => s + b.total, 0);
    const topBrand = brandStats[0];
    const fastest = [...brandStats].sort((a, b) => b.growth - a.growth)[0];

    const lastDate = records[0]?.date;
    let lastLabel = '';
    try { lastLabel = lastDate ? new Date(lastDate + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''; } catch {}

    return { brandStats, totalTxns, topBrand, fastest, brandCount: brands.length, lastLabel };
  }, [records]);

  // Empty state
  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center">
        <Link to="/RadarCompetitivo" className="block w-full">
          <div
            className="rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-lg transition-all h-full"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(124,58,237,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))', border: '1px solid rgba(124,58,237,0.12)' }}>
              <Radar className="w-5 h-5" style={{ color: '#7c3aed' }} />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-1">Radar</p>
              <p className="text-[11px] font-bold text-slate-600 mb-0.5">Sin tomas</p>
              <p className="text-[9px] text-slate-400">Registrar competencia</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </Link>
      </motion.div>
    );
  }

  const { brandStats, totalTxns, topBrand, fastest, brandCount, lastLabel } = stats;
  const fastGrowth = fastest?.growth || 0;
  const GrowthIcon = fastGrowth > 1 ? ArrowUpRight : fastGrowth < -1 ? ArrowDownRight : Minus;
  const growthColor = fastGrowth > 1 ? '#059669' : fastGrowth < -1 ? '#e11d48' : '#94a3b8';

  // Mini donut segments
  const R = 16, C = 2 * Math.PI * R;
  let offset = 0;
  const segments = brandStats.filter(b => b.total > 0).map(b => {
    const pct = totalTxns > 0 ? b.total / totalTxns : 0;
    const dash = pct * C;
    const seg = { color: b.color, dash, offset, pct };
    offset += dash;
    return seg;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-center justify-center">
      <Link to="/RadarCompetitivo" className="block w-full group">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl overflow-hidden h-full flex flex-col"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(124,58,237,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
          }}>

          {/* Ambient top glow */}
          <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

          <div className="relative z-10 p-3 flex flex-col items-center gap-2 flex-1">
            {/* Header */}
            <div className="flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">Entorno</p>
            </div>

            {/* Donut */}
            <div className="relative">
              <svg width="50" height="50" viewBox="0 0 50 50" className="-rotate-90">
                <circle cx="25" cy="25" r={R} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                {segments.map((s, i) => (
                  <circle key={i} cx="25" cy="25" r={R} fill="none" stroke={s.color} strokeWidth="5"
                    strokeDasharray={`${s.dash} ${C}`} strokeDashoffset={-s.offset} strokeLinecap="round" />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[7px] font-bold text-slate-400 leading-none">Total</span>
                <span className="text-[9px] font-black text-slate-700 tabular-nums leading-none mt-0.5">{fmtN(totalTxns)}</span>
              </div>
            </div>

            {/* Growth badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md"
              style={{ background: `${growthColor}10`, border: `1px solid ${growthColor}20` }}>
              <GrowthIcon className="w-2.5 h-2.5" style={{ color: growthColor }} />
              <span className="text-[8px] font-bold tabular-nums" style={{ color: growthColor }}>
                {fastGrowth > 0 ? '+' : ''}{fastGrowth.toFixed(0)}%
              </span>
            </div>

            {/* Brand ranking — vertical */}
            <div className="w-full space-y-1 mt-0.5">
              {brandStats.slice(0, 4).map((b) => {
                const pct = totalTxns > 0 ? (b.total / totalTxns * 100) : 0;
                return (
                  <div key={b.brand} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-[8px] font-semibold text-slate-500 truncate flex-1 min-w-0">{b.brand}</span>
                    <span className="text-[7px] text-slate-400 tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="w-full flex items-center justify-between mt-auto pt-1.5" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <span className="text-[7px] font-semibold text-slate-400 truncate">
                {topBrand ? topBrand.brand : '—'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-violet-500 transition-colors" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}