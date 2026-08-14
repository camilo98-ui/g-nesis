import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getNPSStatus } from './NPSGauge';

// Card compacta para el Home: muestra el NPS actual de la tienda con carita + status.
export default function StoreNPSStatusCard({ storeCode }) {
  const now = new Date();
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['store-nps', storeCode],
    queryFn: () => base44.entities.StoreNPS.filter({ store_code: storeCode }),
    enabled: !!storeCode,
    staleTime: 5 * 60 * 1000,
  });

  // NPS del mes vigente; si no hay, el último registrado
  const current =
    records.find((r) => Number(r.month) === now.getMonth() + 1 && Number(r.year) === now.getFullYear()) ||
    [...records].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] ||
    null;

  const score = current?.score ?? 0;
  const status = getNPSStatus(score);
  const scoreStr = current ? score.toFixed(1).replace('.', ',') : '—';

  return (
    <div
      className="rounded-2xl p-4 hover-lift flex flex-col items-center justify-center text-center"
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <p className="label-premium">NPS · Tienda</p>
        <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: status.color }}>
          {current ? status.label : 'Sin dato'}
        </span>
      </div>

      {isLoading ? (
        <div className="h-16 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Carita */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-1 mt-1"
            style={{ background: `radial-gradient(circle at 50% 35%, #FFE08A 0%, #F59E0B 100%)`, border: '2px solid #fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}
          >
            {status.face}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: status.textColor }}>{scoreStr}</span>
            <span className="text-[11px] font-semibold text-slate-400">/10</span>
          </div>
          <span
            className="mt-1.5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide text-white"
            style={{ background: status.color, opacity: current ? 1 : 0.4 }}
          >
            {current ? status.label : '—'}
          </span>
          <p className="text-[8px] text-slate-300 mt-1.5 font-medium">
            {current ? `Actualizado · ${new Date(current.created_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}` : 'Esperando carga del gerente'}
          </p>
        </>
      )}
    </div>
  );
}