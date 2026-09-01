import React, { useState, useMemo } from 'react';
import { Truck, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie, LineChart, Line } from 'recharts';
import SectionCard from '../SectionCard';

const CHANNEL_COLORS = {
  'Rappi': '#C21875',
  'Didi': '#e91e8c',
  'Al Paso': '#0ea5e9',
  'Domicilios Propios': '#10b981',
  'Uber Eats': '#6366f1',
  'iFood': '#f59e0b',
  'PedidosYa': '#8b5cf6',
};
const FALLBACK_COLORS = ['#C21875', '#e91e8c', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function getChannelColor(channel, idx) {
  return CHANNEL_COLORS[channel] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || p.color }}>
          {p.name}: {typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AggregatorsView({ aggregatorsByStore, aggregatorsChannels, aggregatorsTrend, stores, mode }) {
  const [selectedChannels, setSelectedChannels] = useState([]);

  const allChannels = aggregatorsChannels;
  const activeChannels = selectedChannels.length > 0 ? selectedChannels : allChannels;

  const toggleChannel = (ch) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  // Per-store chart data
  const storeChartData = useMemo(() => {
    return stores.map(s => {
      const data = { name: s.code };
      const storeAgg = aggregatorsByStore[s.code] || [];
      activeChannels.forEach(ch => {
        const record = storeAgg.find(a => a.channel === ch);
        data[ch] = record ? +(record.participation * 100).toFixed(1) : 0;
      });
      return data;
    }).filter(d => Object.keys(d).length > 1);
  }, [stores, aggregatorsByStore, activeChannels]);

  // Global donut data
  const donutData = useMemo(() => {
    const channelTotals = {};
    let totalSales = 0;
    Object.values(aggregatorsByStore).forEach(arr => {
      arr.forEach(a => {
        if (!activeChannels.includes(a.channel)) return;
        channelTotals[a.channel] = (channelTotals[a.channel] || 0) + (a.total_sales || 0);
        totalSales += a.total_sales || 0;
      });
    });
    return Object.entries(channelTotals)
      .map(([channel, sales]) => ({ name: channel, value: sales, pct: totalSales > 0 ? (sales / totalSales * 100) : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [aggregatorsByStore, activeChannels]);

  const hasData = Object.keys(aggregatorsByStore).length > 0;

  return (
    <div className="space-y-4">
      {/* Channel filter */}
      {allChannels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-1.5 mr-1">
            <Filter style={{ width: 13, height: 13, color: '#94a3b8' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canales:</span>
          </div>
          <button onClick={() => setSelectedChannels([])}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: selectedChannels.length === 0 ? 'rgba(194,24,117,0.1)' : 'transparent',
              color: selectedChannels.length === 0 ? '#C21875' : '#94a3b8',
              border: '1px solid ' + (selectedChannels.length === 0 ? 'rgba(194,24,117,0.2)' : 'transparent'),
            }}>
            Todos
          </button>
          {allChannels.map((ch, i) => {
            const color = getChannelColor(ch, i);
            const isActive = selectedChannels.includes(ch);
            return (
              <button key={ch} onClick={() => toggleChannel(ch)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: isActive ? `${color}12` : 'transparent',
                  color: isActive ? color : '#94a3b8',
                  border: '1px solid ' + (isActive ? `${color}25` : 'transparent'),
                }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                {ch}
              </button>
            );
          })}
        </div>
      )}

      {!hasData ? (
        <SectionCard icon={Truck} title="Agregadores" subtitle="Sin datos de agregadores cargados" color="#f97316">
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Truck style={{ width: 24, height: 24, color: '#cbd5e1' }} />
            <p className="text-[12px] text-slate-400">No hay datos de agregadores para el período seleccionado</p>
          </div>
        </SectionCard>
      ) : mode === 'global' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut chart */}
          <SectionCard icon={Truck} title="Participación por Canal" subtitle="Distribución de ventas del distrito" color="#f97316">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={getChannelColor(entry.name, i)} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span className="text-[10px] font-bold text-slate-500">
                      {value} — {donutData.find(d => d.name === value)?.pct.toFixed(1)}%
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Trend chart */}
          <SectionCard icon={Truck} title="Tendencia de Agregadores" subtitle="Evolución mensual por canal" color="#8b5cf6">
            {aggregatorsTrend.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Truck style={{ width: 20, height: 20, color: '#cbd5e1' }} />
                <p className="text-[11px] text-slate-400">Se necesitan al menos 2 meses de datos para mostrar tendencia</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={aggregatorsTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" formatter={(v) => <span className="text-[10px] font-bold text-slate-500">{v}</span>} />
                  {activeChannels.map((ch, i) => (
                    <Line key={ch} type="monotone" dataKey={ch} stroke={getChannelColor(ch, i)} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1.5 }} activeDot={{ r: 5 }} animationDuration={800} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>
      ) : (
        <SectionCard icon={Truck} title="Participación de Agregadores por Tienda" subtitle={`${storeChartData.length} tiendas · ${activeChannels.length} canal(es) visible(s)`} color="#f97316">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={storeChartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(249,115,22,0.04)' }} />
              <Legend iconType="circle" formatter={(v) => <span className="text-[10px] font-bold text-slate-500">{v}</span>} />
              {activeChannels.map((ch, i) => (
                <Bar key={ch} dataKey={ch} stackId="a" fill={getChannelColor(ch, i)} radius={i === activeChannels.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]} maxBarSize={48} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
}