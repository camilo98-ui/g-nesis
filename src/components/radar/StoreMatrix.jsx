import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { PremiumSection } from './RadarShared';
import { fmtInt } from './radarModel';

const CELL = {
  win: { icon: '🟢', label: 'Ganamos', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
  lose: { icon: '🔴', label: 'Perdemos', color: '#e11d48', bg: 'rgba(225,29,72,0.07)', border: 'rgba(225,29,72,0.16)' },
  tie: { icon: '🟡', label: 'Muy cerca', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  nodata: { icon: '—', label: 'Sin datos', color: '#cbd5e1', bg: '#fafafa', border: '#f1f5f9' },
};

export default function StoreMatrix({ model }) {
  const { storeMatrix, activeComps, nameOf, periodLabel } = model;
  const comps = storeMatrix.length ? storeMatrix[0].cells.map((c) => ({ key: c.key, name: c.name })) : [];

  return (
    <PremiumSection
      title="07 · Mapa Competitivo por Tienda"
      sub={`Resultado del duelo directo por tienda · ${periodLabel}`}
      tip="Cada celda compara las transacciones observadas de POPSY contra ese competidor en esa tienda, usando solo tomas donde ambos fueron registrados."
      delay={0.26} icon={Store}>
      {storeMatrix.length === 0 || comps.length === 0 ? (
        <div className="py-8 text-center"><p className="text-xs text-slate-300">Sin tomas con POPSY y competidores registrados en el periodo.</p></div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(194,24,117,0.08)' }}>
                <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Tienda</th>
                {comps.map((c) => (
                  <th key={c.key} className="text-center py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeMatrix.map((s) => (
                <tr key={s.storeId} style={{ borderBottom: '1px solid rgba(194,24,117,0.04)' }}>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">{s.storeId}</span>
                      <span className="text-[8px] font-semibold text-slate-300">{s.city}</span>
                    </div>
                  </td>
                  {s.cells.map((c) => {
                    const cfg = CELL[c.status];
                    return (
                      <td key={c.key} className="py-2.5 px-2 text-center" title={c.status === 'nodata' ? 'Sin tomas comparables' : `POPSY ${fmtInt(c.popsy)} vs ${c.name} ${fmtInt(c.comp)}`}>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 9 }}>
                          {cfg.icon} {c.status === 'nodata' ? '' : cfg.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-rose-50">
            {['win', 'tie', 'lose', 'nodata'].map((k) => (
              <span key={k} className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                {CELL[k].icon} {k === 'win' ? 'POPSY gana' : k === 'lose' ? 'POPSY pierde' : k === 'tie' ? 'Muy cerca (±5%)' : 'Sin tomas comparables'}
              </span>
            ))}
          </div>
        </div>
      )}
    </PremiumSection>
  );
}