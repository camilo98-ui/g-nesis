import { motion } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, LabelList } from 'recharts';
import { PremiumSection } from './RadarShared';
import { POPSY_COLOR, fmtInt } from './radarModel';

const QUADRANTS = [
  { key: 'threat', label: '🚀 AMENAZA', x: 'right', y: 'top', color: '#e11d48' },
  { key: 'watch', label: '👀 VIGILANCIA', x: 'left', y: 'top', color: '#f59e0b' },
  { key: 'opportunity', label: '💎 OPORTUNIDAD', x: 'right', y: 'bottom', color: '#8b5cf6' },
  { key: 'low', label: '💤 BAJA PRIORIDAD', x: 'left', y: 'bottom', color: '#94a3b8' },
];

export default function QuadrantMatrix({ model }) {
  const { quadrant, refX, periodLabel, prevPeriodLabel } = model;
  const points = quadrant.filter((b) => b.y != null);
  const withY = quadrant.filter((b) => b.y == null && b.x > 0);

  return (
    <PremiumSection
      title="08 · Matriz de Competitividad"
      sub={`Volumen vs crecimiento · ${periodLabel} vs ${prevPeriodLabel}`}
      tip="Eje X: volumen de transacciones observadas. Eje Y: crecimiento vs periodo anterior. Burbuja grande = alta participación observada. POPSY destacado en magenta."
      delay={0.3} icon={Grid3x3}>
      {points.length < 2 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-300">
            {quadrant.length === 0
              ? 'Sin marcas con datos en el periodo.'
              : 'Se necesitan datos del periodo anterior para calcular el crecimiento y ubicar las marcas en la matriz.'}
          </p>
        </div>
      ) : (
        <div className="relative h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 28, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" />
              <XAxis type="number" dataKey="x" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                label={{ value: 'Volumen de transacciones', position: 'insideBottom', offset: -6, style: { fontSize: 9, fill: '#94a3b8', fontWeight: 600 } }} />
              <YAxis type="number" dataKey="y" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`}
                label={{ value: 'Crecimiento %', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#94a3b8', fontWeight: 600 } }} />
              <ZAxis type="number" dataKey="share" range={[90, 420]} />
              {refX > 0 && <ReferenceLine x={refX} stroke="#fda4af" strokeDasharray="5 4" />}
              <ReferenceLine y={0} stroke="#fda4af" strokeDasharray="5 4" />
              <Tooltip cursor={{ strokeDasharray: '3 6', stroke: 'rgba(194,24,117,0.2)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: `1px solid ${d.color}30`, borderRadius: 14, padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', fontSize: 11 }}>
                      <p style={{ color: d.color, fontWeight: 800, marginBottom: 4 }}>{d.name}{d.isPopsy ? ' (nosotros)' : ''}</p>
                      <p style={{ color: '#94a3b8' }}>Volumen: <b style={{ color: '#475569' }}>{fmtInt(d.x)} txn</b></p>
                      <p style={{ color: '#94a3b8' }}>Crecimiento: <b style={{ color: d.y >= 0 ? '#10b981' : '#e11d48' }}>{d.y >= 0 ? '+' : ''}{d.y.toFixed(1)}%</b></p>
                      <p style={{ color: '#94a3b8' }}>Participación: <b style={{ color: '#475569' }}>{d.share?.toFixed(1)}%</b></p>
                    </div>
                  );
                }} />
              <Scatter data={points} fill="#C21875">
                {points.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={d.isPopsy ? 0.95 : 0.75} stroke={d.isPopsy ? POPSY_COLOR : 'none'} strokeWidth={d.isPopsy ? 2 : 0} />)}
                <LabelList dataKey="name" position="top" style={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          {/* Etiquetas de cuadrante */}
          {QUADRANTS.map((q) => (
            <span key={q.key}
              className="absolute text-[8px] font-black tracking-widest pointer-events-none px-2 py-1 rounded-lg"
              style={{
                color: q.color, background: 'rgba(255,255,255,0.85)', border: `1px solid ${q.color}22`,
                top: q.y === 'top' ? 8 : undefined, bottom: q.y === 'bottom' ? 40 : undefined,
                right: q.x === 'right' ? 30 : undefined, left: q.x === 'left' ? 12 : undefined,
              }}>
              {q.label}
            </span>
          ))}
        </div>
      )}
      {withY.length > 0 && (
        <p className="text-[9px] text-slate-400 mt-2">
          {withY.map((b) => b.name).join(', ')} {withY.length === 1 ? 'no tiene' : 'no tienen'} datos del periodo anterior para calcular crecimiento.
        </p>
      )}
    </PremiumSection>
  );
}