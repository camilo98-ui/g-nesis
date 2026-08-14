import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { getNPSStatus } from '@/components/nps/NPSGauge';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Tarjeta única de NPS: score de la tienda + promedio del distrito + tendencia mensual.
export default function NPSSummaryCard({ storeCode, district }) {
  const now = new Date();

  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date', 1000),
    staleTime: 60 * 60 * 1000,
  });
  const { data: allNps = [] } = useQuery({
    queryKey: ['all-nps'],
    queryFn: () => base44.entities.StoreNPS.list('-created_date', 1000),
    staleTime: 5 * 60 * 1000,
  });

  const districtCodes = useMemo(() => {
    const codes = allStores
      .filter((s) => (s.district || 'BOGOTA NOROCCIDENTE') === district)
      .map((s) => s.code);
    return codes.length > 0 ? codes : (storeCode ? [storeCode] : []);
  }, [allStores, district, storeCode]);

  // Score vigente de la tienda
  const storeRecs = allNps.filter((r) => r.store_code === storeCode);
  const current =
    storeRecs.find((r) => Number(r.month) === now.getMonth() + 1 && Number(r.year) === now.getFullYear()) ||
    [...storeRecs].sort((a, b) => (b.year - a.year) || (b.month - a.month))[0] ||
    null;
  const score = current?.score ?? 0;
  const status = getNPSStatus(score);

  // Promedio vigente del distrito
  const latestByStore = useMemo(() => {
    const map = {};
    allNps.forEach((r) => {
      if (!districtCodes.includes(r.store_code)) return;
      const isCur = Number(r.month) === now.getMonth() + 1 && Number(r.year) === now.getFullYear();
      const prev = map[r.store_code];
      if (!prev) map[r.store_code] = { rec: r, current: isCur };
      else if (isCur && !prev.current) map[r.store_code] = { rec: r, current: true };
      else if (isCur === prev.current && new Date(r.created_date) > new Date(prev.rec.created_date))
        map[r.store_code] = { rec: r, current: prev.current };
    });
    return Object.values(map).map((v) => v.rec);
  }, [allNps, districtCodes]);

  const dScores = latestByStore.map((r) => Number(r.score) || 0).filter((s) => s > 0);
  const dAvg = dScores.length ? dScores.reduce((a, b) => a + b, 0) / dScores.length : 0;
  const dStatus = getNPSStatus(dAvg);

  // Tendencia mensual del distrito (últimos 8 meses con dato)
  const trend = useMemo(() => {
    const map = {};
    allNps.forEach((r) => {
      if (!districtCodes.includes(r.store_code)) return;
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { y: r.year, m: r.month, sum: 0, n: 0 };
      if (r.score > 0) { map[key].sum += r.score; map[key].n += 1; }
    });
    return Object.values(map)
      .sort((a, b) => (a.y - b.y) || (a.m - b.m))
      .slice(-8)
      .map((v) => ({ label: MONTHS[v.m - 1], value: v.n ? +(v.sum / v.n).toFixed(2) : null }))
      .filter((v) => v.value != null);
  }, [allNps, districtCodes]);

  const scoreStr = current ? score.toFixed(1).replace('.', ',') : '—';
  const avgStr = dScores.length ? dAvg.toFixed(1).replace('.', ',') : '—';

  return (
    <div
      className="rounded-2xl p-4 hover-lift flex flex-col"
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="label-premium">NPS · Distrito</p>
        <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: status.color }}>
          {current ? status.label : 'Sin dato'}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'radial-gradient(circle at 50% 35%, #FFE08A 0%, #F59E0B 100%)', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}
        >
          {status.face}
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black tabular-nums" style={{ color: status.textColor }}>{scoreStr}</span>
            <span className="text-[10px] font-semibold text-slate-400">/10</span>
          </div>
          <p className="text-[8.5px] text-slate-400 font-medium">Tu tienda</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg font-black tabular-nums" style={{ color: dStatus.textColor }}>{avgStr}</span>
          <p className="text-[8.5px] text-slate-400 font-medium">Promedio</p>
        </div>
      </div>

      {/* Tendencia mensual NPS */}
      <div className="h-12 -mx-1">
        {trend.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
              <XAxis dataKey="label" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #eee' }} formatter={(v) => [v, 'NPS']} />
              <Line type="monotone" dataKey="value" stroke="#C21875" strokeWidth={2} dot={{ r: 2, fill: '#C21875' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[9px] text-slate-300">Sin historial suficiente</div>
        )}
      </div>
    </div>
  );
}