import { PremiumSection } from './RadarShared';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { Trophy } from 'lucide-react';

const LeaderTick = ({ x, y, payload, index }) => (
  <g>
    <text x={x} y={y + 12} textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="700">{payload.value}</text>
    {index === 0 && (
      <g>
        <rect x={x - 17} y={y + 18} width="34" height="13" rx="6.5" fill="#F59E0B"/>
        <text x={x} y={y + 27.5} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" letterSpacing="0.1em">LÍDER</text>
      </g>
    )}
  </g>
);

export default function ParticipationColumnChart({ brandStats, totalAll }) {
  const data = (brandStats || []).map(b => ({
    name: b.brand, pct: (b.total / totalAll) * 100, color: b.color
  })).filter(d => d.pct > 0);

  return (
    <PremiumSection title="Participación Acumulada" sub="% del total de transacciones por marca"
      tip="Del 100% de transacciones detectadas, cuánto representa cada marca. La barra más alta es el líder de tráfico."
      delay={0.34} className="h-full" icon={Trophy}>
      {data.length ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 18, right: 4, bottom: 0, left: -14 }}>
            <defs>
              {data.map((d, i) => (
                <linearGradient key={i} id={`pcol_${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={d.color} stopOpacity={1}/>
                  <stop offset="100%" stopColor={d.color} stopOpacity={0.7}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false}/>
            <XAxis dataKey="name" interval={0} tick={LeaderTick} tickLine={false} axisLine={false} height={40}/>
            <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={36}/>
            <Tooltip cursor={{ fill: 'rgba(194,24,117,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 12px 40px rgba(194,24,117,0.15)', fontSize: 11 }}>
                    <p style={{ color: d.color, fontWeight: 800, marginBottom: 4 }}>{d.name}</p>
                    <p style={{ color: '#64748b' }}>Cuota: <b style={{ color: '#475569' }}>{d.pct.toFixed(1)}%</b></p>
                  </div>
                );
              }}/>
            <Bar dataKey="pct" radius={[8, 8, 0, 0]} maxBarSize={42}>
              {data.map((d, i) => <Cell key={i} fill={`url(#pcol_${i})`}/>)}
              <LabelList dataKey="pct" position="top" formatter={v => `${v.toFixed(1)}%`}
                style={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos de participación</p></div>
      )}
    </PremiumSection>
  );
}