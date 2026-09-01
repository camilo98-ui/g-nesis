import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SectionCard from './SectionCard';
import { fmtInt } from './gerenteUtils';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function HourTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.18)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      <p style={{ color: '#C21875' }} className="font-bold">Tx: {fmtInt(v)}</p>
    </div>
  );
}

export default function HourlyTransactions({ hourlyData, stores, selectedStore, onSelectStore }) {
  const [viewMode, setViewMode] = useState('total');

  const chartData = useMemo(() => {
    return HOURS.map(h => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      shortHour: `${h}h`,
      transactions: viewMode === 'total'
        ? (hourlyData?.[h] || 0)
        : Math.round((hourlyData?.[h] || 0) / (hourlyData?.daysElapsed || 1)),
    }));
  }, [hourlyData, viewMode]);

  const maxVal = Math.max(...chartData.map(d => d.transactions), 1);

  return (
    <SectionCard
      icon={Clock}
      title="Transacciones por Hora"
      subtitle={selectedStore ? `Tienda: ${selectedStore}` : 'Todas las tiendas'}
      color="#06b6d4"
      delay={0.35}
      right={
        <div className="flex items-center gap-2">
          <select
            value={selectedStore || ''}
            onChange={e => onSelectStore?.(e.target.value)}
            className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 focus:outline-none focus:border-cyan-300 bg-white"
          >
            <option value="">Todas las tiendas</option>
            {stores.map(s => (
              <option key={s.code} value={s.code}>{s.code}</option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
            {['total', 'promedio'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-2 py-0.5 rounded-md text-[9px] font-bold transition-all"
                style={{
                  background: viewMode === m ? '#fff' : 'transparent',
                  color: viewMode === m ? '#06b6d4' : '#94a3b8',
                  boxShadow: viewMode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}>
                {m === 'total' ? 'Total' : 'Prom/día'}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {chartData.every(d => d.transactions === 0) ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Clock style={{ width: 20, height: 20, color: '#cbd5e1' }} />
          <p className="text-[11px] text-slate-400">Sin datos de transacciones por hora para este período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.06)" vertical={false} />
            <XAxis dataKey="shortHour" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtInt} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
            <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(6,182,212,0.04)' }} />
            <Bar dataKey="transactions" name="Transacciones" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((d, i) => {
                const intensity = 0.3 + (d.transactions / maxVal) * 0.7;
                return <Cell key={i} fill={`rgba(6,182,212,${intensity.toFixed(2)})`} />;
              })}
              <LabelList dataKey="transactions" position="top" formatter={fmtInt} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}