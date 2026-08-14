import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getNPSStatus } from './NPSGauge';

// Card compacta para el Home: promedio NPS del distrito + comparación con la tienda.
export default function StoreNPSAverageCard({ district, storeCode }) {
  const now = new Date();
  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date', 1000),
    staleTime: 60 * 60 * 1000,
  });
  const { data: allNps = [] } = useQuery({
    queryKey: ['all-nps'],
    queryFn: () => base44.entities.StoreNPS.list('-created_date', 500),
    staleTime: 5 * 60 * 1000,
  });

  const districtStoreCodes = React.useMemo(() => {
    const codes = allStores.filter((s) => (s.district || 'BOGOTA NOROCCIDENTE') === district).map((s) => s.code);
    return codes.length > 0 ? codes : (storeCode ? [storeCode] : []);
  }, [allStores, district, storeCode]);

  // NPS vigente (mes actual) o último registrado por tienda del distrito
  const latestByStore = React.useMemo(() => {
    const map = {};
    allNps.forEach((r) => {
      if (!districtStoreCodes.includes(r.store_code)) return;
      const isCurrent = Number(r.month) === now.getMonth() + 1 && Number(r.year) === now.getFullYear();
      const prev = map[r.store_code];
      if (!prev) { map[r.store_code] = { rec: r, current: isCurrent }; }
      else if (isCurrent && !prev.current) { map[r.store_code] = { rec: r, current: true }; }
      else if (isCurrent === prev.current && new Date(r.created_date) > new Date(prev.rec.created_date)) {
        map[r.store_code] = { rec: r, current: prev.current };
      }
    });
    return Object.values(map).map((v) => v.rec);
  }, [allNps, districtStoreCodes]);

  const scores = latestByStore.map((r) => Number(r.score) || 0).filter((s) => s > 0);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const status = getNPSStatus(avg);
  const avgStr = scores.length > 0 ? avg.toFixed(1).replace('.', ',') : '—';

  const storeScore = (() => {
    const rec = latestByStore.find((r) => r.store_code === storeCode);
    return rec ? Number(rec.score) || 0 : 0;
  })();

  return (
    <div
      className="rounded-2xl p-4 hover-lift flex flex-col"
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="label-premium">NPS · Promedio Distrito</p>
        <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: status.color }}>
          {scores.length > 0 ? status.label : 'Sin dato'}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-1 my-1">
        {/* Mini gauge */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle
              cx="28" cy="28" r="22" fill="none" stroke={status.color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(avg / 10) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base">{status.face}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: status.textColor }}>{avgStr}</span>
            <span className="text-[11px] font-semibold text-slate-400">/10</span>
          </div>
          <p className="text-[8.5px] text-slate-400 font-medium">{scores.length} tiendas con NPS</p>
        </div>
      </div>

      <div className="rounded-lg px-2 py-1.5" style={{ background: `${status.color}10`, border: `1px solid ${status.color}20` }}>
        <div className="flex items-center justify-between">
          <span className="text-[8.5px] font-bold" style={{ color: status.color }}>Tu tienda</span>
          <span className="text-[10px] font-black tabular-nums" style={{ color: storeScore > 0 ? status.textColor : '#cbd5e1' }}>
            {storeScore > 0 ? storeScore.toFixed(1).replace('.', ',') : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}