import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { Table2, Download, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PremiumSection } from './RadarShared';
import { POPSY_COLOR, fmtInt } from './radarModel';

const RESULT_STYLE = {
  GANA: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
  PIERDE: { color: '#e11d48', bg: 'rgba(225,29,72,0.07)', border: 'rgba(225,29,72,0.16)' },
  CERCA: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  'SIN DATO': { color: '#94a3b8', bg: '#fafafa', border: '#f1f5f9' },
};

export default function TakesDetailTable({ model }) {
  const { detailRows, activeComps, nameOf, periodLabel } = model;
  const [expanded, setExpanded] = useState(null);
  const comps = detailRows.length ? detailRows[0].comps.map((c) => ({ key: c.key, name: c.name })) : [];

  const exportExcel = () => {
    const rows = detailRows.map((r) => {
      const base = {
        'Toma': r.takeIndex, 'Fecha': r.date, 'Tienda': r.storeId, 'Ciudad': r.city,
        'POPSY': r.popsy ?? 'Sin dato',
      };
      comps.forEach((c) => { base[c.name] = r.comps.find((x) => x.key === c.key)?.txn ?? 'Sin dato'; });
      base['Total Competencia'] = Math.round(r.compSum);
      base['Promedio Competencia'] = r.avg == null ? '—' : Math.round(r.avg);
      base['Diferencia POPSY vs Promedio'] = r.diff == null ? '—' : Math.round(r.diff);
      base['Resultado'] = r.result;
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Radar Competitivo');
    XLSX.writeFile(wb, `Radar_Competitivo_${periodLabel.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <PremiumSection
      title="11 · Detalle por Tomas"
      sub={`Histórico completo · ${periodLabel}`}
      tip="Cada fila es una toma: la comparación de transacciones observadas de POPSY contra sus competidores en esa tienda y fecha. Haz clic para ver el detalle por marca."
      delay={0.4} className="mb-2"
      icon={Table2}
      right={detailRows.length > 0 ? (
        <button onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-90 btn-glow"
          style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)' }}>
          <Download className="w-3 h-3" /> Excel
        </button>
      ) : null}>
      {detailRows.length === 0 ? (
        <div className="py-8 text-center"><p className="text-xs text-slate-300">No hay tomas con datos en el periodo seleccionado.</p></div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(194,24,117,0.08)' }}>
                <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Toma</th>
                <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Fecha</th>
                <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Tienda</th>
                <th className="text-right py-2.5 px-2 font-bold uppercase tracking-wider text-[9px]" style={{ color: POPSY_COLOR }}>POPSY</th>
                {comps.map((c) => (
                  <th key={c.key} className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">{c.name}</th>
                ))}
                <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Total Comp.</th>
                <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Dif. vs Prom.</th>
                <th className="text-center py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((r, i) => {
                const st = RESULT_STYLE[r.result] || RESULT_STYLE['SIN DATO'];
                const isOpen = expanded === i;
                return (
                  <Fragment key={i}>
                    <tr onClick={() => setExpanded(isOpen ? null : i)}
                      className="cursor-pointer transition-all hover:bg-rose-50/40"
                      style={{ borderBottom: '1px solid rgba(194,24,117,0.04)' }}>
                      <td className="py-3 px-2">
                        <span className="flex items-center gap-1 font-bold text-slate-500">
                          <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          Toma {r.takeIndex}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-semibold">{r.date}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-700">{r.storeId}</span>
                        <span className="text-[8px] text-slate-300 ml-1.5">{r.city}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-black tabular-nums" style={{ color: POPSY_COLOR }}>{r.popsy == null ? '—' : fmtInt(r.popsy)}</td>
                      {comps.map((c) => {
                        const v = r.comps.find((x) => x.key === c.key)?.txn;
                        return <td key={c.key} className="py-3 px-2 text-right font-bold text-slate-500 tabular-nums">{v == null ? '—' : fmtInt(v)}</td>;
                      })}
                      <td className="py-3 px-2 text-right font-bold text-slate-500 tabular-nums">{fmtInt(r.compSum)}</td>
                      <td className="py-3 px-2 text-right font-bold tabular-nums"
                        style={{ color: r.diff == null ? '#cbd5e1' : r.diff > 0 ? '#10b981' : r.diff < 0 ? '#e11d48' : '#f59e0b' }}>
                        {r.diff == null ? '—' : `${r.diff > 0 ? '+' : ''}${fmtInt(r.diff)}`}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2 py-1 rounded-full text-[9px] font-black"
                          style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{r.result}</span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={comps.length + 7} className="pb-3 px-2">
                          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(194,24,117,0.03)', border: '1px solid rgba(194,24,117,0.08)' }}>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Duelo por marca · {r.storeId} · {r.date}</p>
                            {r.comps.map((c) => {
                              const win = r.popsy != null && c.txn != null && r.popsy > c.txn;
                              const tie = r.popsy != null && c.txn != null && Math.abs(r.popsy - c.txn) <= Math.max(r.popsy, c.txn, 1) * 0.05;
                              return (
                                <div key={c.key} className="flex items-center justify-between text-[10px] font-semibold px-1">
                                  <span className="text-slate-500">POPSY vs {c.name}</span>
                                  <span className="tabular-nums" style={{ color: POPSY_COLOR }}>{fmtInt(r.popsy ?? 0)}</span>
                                  <span className="text-slate-300">vs</span>
                                  <span className="tabular-nums" style={{ color: c.color }}>{fmtInt(c.txn ?? 0)}</span>
                                  <span className="w-20 text-right font-black"
                                    style={{ color: tie ? '#f59e0b' : win ? '#10b981' : '#e11d48' }}>
                                    {tie ? 'muy cerca' : win ? 'ganamos' : 'perdimos'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PremiumSection>
  );
}