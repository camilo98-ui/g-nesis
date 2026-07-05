import { motion } from 'framer-motion';
import { Grid3x3, BarChart3, Zap, Gauge, Trophy } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, BarChart, Bar } from 'recharts';
import { PremiumSection, CustomTooltip, TrendBadge, getInitial } from './RadarShared';

export function MomentumMatrix({ brandStats, totalAll }) {
  const eligible = brandStats.filter(b => !b.onlyOneReading);
  if (eligible.length < 2) return null;

  const scatterData = eligible.map(b => ({
    name: b.brand, x: b.total, y: b.growth, z: (b.total / totalAll) * 100, color: b.color
  }));

  return (
    <PremiumSection title="Matriz de Momentum" sub="Volumen vs. Crecimiento — tamaño = cuota de mercado"
      tip="Posición estratégica de cada marca: eje X = volumen total, eje Y = crecimiento reciente. Esquina superior derecha = alta amenaza. Tamaño = cuota."
      delay={0.28} className="mb-4" icon={Grid3x3}>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 12, left: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)"/>
          <XAxis type="number" dataKey="x" name="Volumen" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} label={{ value: 'Volumen transacciones', position: 'insideBottom', offset: -4, style: { fontSize: 9, fill: '#94a3b8', fontWeight: 600 } }}/>
          <YAxis type="number" dataKey="y" name="Crecimiento %" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} label={{ value: 'Crecimiento %', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#94a3b8', fontWeight: 600 } }}/>
          <ZAxis type="number" dataKey="z" range={[80, 460]}/>
          <ReferenceLine y={0} stroke="#fda4af" strokeDasharray="5 4"/>
          <Tooltip
            cursor={{ strokeDasharray: '3 6', stroke: 'rgba(194,24,117,0.2)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 12px 40px rgba(194,24,117,0.15)', fontSize: 11 }}>
                  <p style={{ color: d.color, fontWeight: 800, marginBottom: 6 }}>{d.name}</p>
                  <p style={{ color: '#94a3b8' }}>Vol: <b style={{ color: '#475569' }}>{d.x.toLocaleString('es-CO')}</b></p>
                  <p style={{ color: '#94a3b8' }}>Crec: <b style={{ color: d.y >= 0 ? '#10b981' : '#e11d48' }}>{d.y >= 0 ? '+' : ''}{d.y.toFixed(1)}%</b></p>
                  <p style={{ color: '#94a3b8' }}>Share: <b style={{ color: '#475569' }}>{d.z.toFixed(1)}%</b></p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData} fill="#C21875">
            {scatterData.map((d, i) => <Cell key={i} fill={d.color}/>)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </PremiumSection>
  );
}

export function MonthlyBarsChart({ monthlyData, brandStats }) {
  return (
    <PremiumSection title="Transacciones por Mes" sub="Comparación mensual entre marcas"
      tip="Barras agrupadas por mes. Compara la actividad de cada marca en cada período."
      delay={0.26} icon={BarChart3}>
      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barCategoryGap="30%" barGap={3} margin={{ top: 0, right: 4, bottom: 0, left: -12 }}>
            <defs>
              {brandStats.map(b => (
                <linearGradient key={b.brand} id={`bar_${b.brand.replace(/[^a-z0-9]/gi,'_')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={b.color} stopOpacity={1}/>
                  <stop offset="100%" stopColor={b.color} stopOpacity={0.65}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={24}/>
            <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(194,24,117,0.03)' }}/>
            {brandStats.map(b => (
              <Bar key={b.brand} dataKey={b.brand} name={b.brand} fill={`url(#bar_${b.brand.replace(/[^a-z0-9]/gi,'_')})`} radius={[6, 6, 0, 0]} maxBarSize={24}/>
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos mensuales</p></div>
      )}
    </PremiumSection>
  );
}

export function LastReadingChart({ lastReadingData }) {
  return (
    <PremiumSection title="Última Toma · Transacciones" sub="Actividad más reciente por marca"
      tip="Transacciones de la última toma de cada marca. Indica quién fue más activo recientemente."
      delay={0.30} icon={Zap}>
      {lastReadingData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={lastReadingData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <defs>
              {lastReadingData.map((entry, i) => (
                <linearGradient key={i} id={`hbar_${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.7}/>
                  <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" horizontal={false}/>
            <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
            <YAxis type="category" dataKey="brand" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={64}/>
            <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(194,24,117,0.03)' }}/>
            <Bar dataKey="value" name="Última toma" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {lastReadingData.map((entry, i) => <Cell key={i} fill={`url(#hbar_${i})`}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center"><p className="text-xs text-slate-300">Registra 2 tomas para comparar</p></div>
      )}
    </PremiumSection>
  );
}

export function VelocityRanking({ velocityData }) {
  return (
    <PremiumSection title="Velocidad de Crecimiento Promedio" sub="Tasa promedio histórica vs. última toma"
      tip="Compara la tasa de crecimiento promedio de toda la historia vs. el crecimiento de la última toma. Detecta marcas acelerando o frenando."
      delay={0.34} icon={Gauge}>
      {velocityData.length > 0 ? (
        <div className="space-y-3.5 mt-1">
          {velocityData.map((b, i) => {
            const maxVal = Math.max(...velocityData.map(v => Math.abs(v.avg)), ...velocityData.map(v => Math.abs(v.last)), 10);
            const avgPct = Math.abs(b.avg) / maxVal * 100;
            const lastPct = Math.abs(b.last) / maxVal * 100;
            return (
              <div key={b.brand} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-[10px]" style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}40` }}>{getInitial(b.brand)}</div>
                    <span className="text-xs font-bold text-slate-600">{b.brand}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-400">Prom: <span className="font-bold" style={{ color: b.color }}>{b.avg >= 0 ? '+' : ''}{b.avg.toFixed(1)}%</span></span>
                    <TrendBadge pct={b.last}/>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${avgPct}%` }} transition={{ duration: 1, delay: 0.4 + i * 0.06, ease: [0.23,1,0.32,1] }}
                      style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}50, ${b.color}80)` }}/>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${lastPct}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.06, ease: [0.23,1,0.32,1] }}
                      style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}, ${b.color})` }}/>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 border-t border-rose-50">
            <div className="flex items-center gap-1.5"><div className="w-4 h-1.5 rounded-full" style={{ background: 'rgba(194,24,117,0.4)' }}/><span className="text-[9px] text-slate-400">Promedio histórico</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-1.5 rounded-full" style={{ background: '#C21875' }}/><span className="text-[9px] text-slate-400">Última toma</span></div>
          </div>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos de crecimiento</p></div>
      )}
    </PremiumSection>
  );
}

export function ParticipationRanking({ brandStats, totalAll }) {
  return (
    <PremiumSection title="Participación Acumulada" sub="% del total de transacciones por marca"
      tip="Del 100% de transacciones detectadas, cuánto representa cada marca. La barra más larga es el líder de tráfico."
      delay={0.38} icon={Trophy}>
      <div className="space-y-3 mt-1">
        {brandStats.map((b, i) => {
          const pct = (b.total / totalAll) * 100;
          return (
            <div key={b.brand}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-[10px]" style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}40` }}>{getInitial(b.brand)}</div>
                  <span className="text-xs font-semibold text-slate-600">{b.brand}</span>
                  {i === 0 && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>LÍDER</span>}
                </div>
                {b.onlyOneReading
                  ? <span className="text-[9px] text-slate-300 italic">2ª toma pendiente</span>
                  : <span className="text-xs font-black tabular-nums" style={{ color: b.color }}>{pct.toFixed(1)}%</span>}
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: b.onlyOneReading ? '2%' : `${Math.max(pct, 1)}%` }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}90, ${b.color})` }}/>
              </div>
            </div>
          );
        })}
      </div>
    </PremiumSection>
  );
}