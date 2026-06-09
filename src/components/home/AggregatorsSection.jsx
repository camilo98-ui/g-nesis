import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Truck, ChevronDown, BarChart3, PieChart as PieIcon } from 'lucide-react';

const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
};

const CHANNEL_COLORS = {
  'Al Paso': '#10b981',
  'Rappi': '#ef4444',
  'Didi': '#f97316',
  'Domicilios Propios': '#8b5cf6',
  'iFood': '#e91e8c',
};
const FALLBACK_COLORS = ['#C21875','#6366f1','#0ea5e9','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316','#ec4899'];

function getChannelColor(channel, idx) {
  return CHANNEL_COLORS[channel] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-medium shadow-xl"
      style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.18)', backdropFilter: 'blur(20px)' }}>
      <p className="font-bold text-slate-600 mb-0.5">{d.name || d.payload?.channel || d.payload?.name}</p>
      <p style={{ color: d.fill || d.color || '#C21875' }}>
        {typeof d.value === 'number' && d.value < 2 ? `${(d.value * 100).toFixed(1)}%` : fmtM(d.value)}
      </p>
    </div>
  );
}

export default function AggregatorsSection() {
  const [selectedMonth, setSelectedMonth] = useState(null); // null = más reciente
  const [selectedStore, setSelectedStore] = useState('todas');
  const [chartMode, setChartMode] = useState('pie'); // 'pie' | 'bar'
  const [expanded, setExpanded] = useState(false);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['aggregators-all'],
    queryFn: () => base44.entities.AggregatorsData.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Extraer meses/años disponibles
  const availableMonths = useMemo(() => {
    const seen = new Set();
    const list = [];
    allRecords.forEach(r => {
      if (r.month && r.year) {
        const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
        if (!seen.has(key)) { seen.add(key); list.push({ month: r.month, year: r.year, key }); }
      } else {
        // sin mes/año: agrupar por uploaded_at
        const d = r.uploaded_at ? new Date(r.uploaded_at) : null;
        if (d) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          if (!seen.has(key)) { seen.add(key); list.push({ month: d.getMonth()+1, year: d.getFullYear(), key }); }
        }
      }
    });
    return list.sort((a, b) => b.key.localeCompare(a.key));
  }, [allRecords]);

  const activeMonthKey = selectedMonth || availableMonths[0]?.key || null;
  const activeMonthObj = availableMonths.find(m => m.key === activeMonthKey);

  // Tiendas disponibles en el mes activo
  const storesInMonth = useMemo(() => {
    if (!activeMonthKey) return [];
    const filtered = allRecords.filter(r => {
      const mk = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d = new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      return mk === activeMonthKey;
    });
    return [...new Set(filtered.map(r => r.store_code).filter(Boolean))].sort();
  }, [allRecords, activeMonthKey]);

  // Registros filtrados
  const filtered = useMemo(() => {
    if (!activeMonthKey) return allRecords;
    return allRecords.filter(r => {
      const mk = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d = new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      if (mk !== activeMonthKey) return false;
      if (selectedStore !== 'todas' && r.store_code !== selectedStore) return false;
      return true;
    });
  }, [allRecords, activeMonthKey, selectedStore]);

  // Agregar por canal
  const channelData = useMemo(() => {
    const agg = {};
    filtered.forEach(r => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0, count: 0 };
      agg[ch].total_sales += r.total_sales || 0;
      agg[ch].count += 1;
    });
    const arr = Object.values(agg).sort((a, b) => b.total_sales - a.total_sales);
    const total = arr.reduce((s, d) => s + d.total_sales, 0);
    return arr.map((d, i) => ({
      ...d,
      pct: total > 0 ? (d.total_sales / total) : 0,
      color: getChannelColor(d.channel, i),
      name: d.channel,
      value: d.total_sales,
    }));
  }, [filtered]);

  // Agregar por tienda (solo si selectedStore=todas)
  const storeChannelData = useMemo(() => {
    if (selectedStore !== 'todas') return [];
    const agg = {};
    filtered.forEach(r => {
      const sc = r.store_code || 'Otro';
      if (!agg[sc]) agg[sc] = { name: sc, total_sales: 0 };
      agg[sc].total_sales += r.total_sales || 0;
    });
    return Object.values(agg).sort((a, b) => b.total_sales - a.total_sales).slice(0, 10).map((d, i) => ({
      ...d, value: d.total_sales, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length]
    }));
  }, [filtered, selectedStore]);

  const totalVentas = channelData.reduce((s, d) => s + d.total_sales, 0);

  if (isLoading) {
    return (
      <div className="rounded-2xl p-8 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(247,151,0,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allRecords.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(247,151,0,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
        <Truck className="w-10 h-10 mx-auto mb-2 text-orange-300" />
        <p className="text-[13px] font-semibold text-slate-500">Sin datos de agregadores cargados</p>
        <p className="text-[11px] text-slate-400 mt-1">Usa el botón "Agregadores" del menú para subir el archivo Excel</p>
      </div>
    );
  }

  const monthLabel = activeMonthObj ? `${MONTHS[activeMonthObj.month - 1]} ${activeMonthObj.year}` : 'Reciente';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.07), 0 1px 6px rgba(247,151,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      {/* ── HEADER ── */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.045)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 3px 10px rgba(249,115,22,0.3)' }}>
            <Truck style={{ color: '#fff', width: 14, height: 14 }} />
          </div>
          <div>
            <p className="text-[14px] font-black text-slate-700" style={{ letterSpacing: '-0.02em' }}>Canales de Venta</p>
            <p className="text-[10px] text-slate-400 font-medium">Participación de agregadores · {monthLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mes selector */}
          {availableMonths.length > 1 && (
            <select
              value={activeMonthKey || ''}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer"
              style={{ borderColor: 'rgba(249,115,22,0.3)', color: '#f97316', background: 'rgba(249,115,22,0.06)' }}
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{MONTHS[m.month-1]} {m.year}</option>
              ))}
            </select>
          )}

          {/* Tienda selector */}
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer"
            style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#64748b', background: 'rgba(0,0,0,0.03)' }}
          >
            <option value="todas">Todas las tiendas</option>
            {storesInMonth.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Chart mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            {[{ mode: 'pie', Icon: PieIcon }, { mode: 'bar', Icon: BarChart3 }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setChartMode(mode)}
                className="w-7 h-7 flex items-center justify-center transition-all"
                style={{
                  background: chartMode === mode ? '#f97316' : 'transparent',
                  color: chartMode === mode ? '#fff' : '#94a3b8',
                }}>
                <Icon style={{ width: 12, height: 12 }} />
              </button>
            ))}
          </div>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
            style={{ background: 'rgba(249,115,22,0.07)', color: '#f97316', border: '1px solid rgba(249,115,22,0.15)' }}>
            {expanded ? 'Menos' : 'Ver todo'}
            <ChevronDown style={{ width: 10, height: 10, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-5">

        {channelData.length === 0 ? (
          <div className="text-center py-10">
            <Truck className="w-8 h-8 mx-auto mb-2 text-orange-200" />
            <p className="text-[12px] text-slate-400">Sin datos para este período/tienda</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── KPI pills ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {channelData.slice(0, 4).map((ch, i) => (
                <motion.div key={ch.channel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl p-3"
                  style={{ background: `${ch.color}0a`, border: `1px solid ${ch.color}20` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] truncate" style={{ color: ch.color }}>{ch.channel}</p>
                  </div>
                  <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: ch.color, letterSpacing: '-0.03em' }}>
                    {(ch.pct * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{fmtM(ch.total_sales)}</p>
                </motion.div>
              ))}
            </div>

            {/* ── MAIN CHART ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">

              {/* Left: Pie or Bar */}
              <div style={{ height: 220 }}>
                {chartMode === 'pie' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                        dataKey="total_sales" nameKey="channel" paddingAngle={2} stroke="none">
                        {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelData} margin={{ top: 14, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                      <XAxis dataKey="channel" tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={fmtM} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.04)' }} />
                      <Bar dataKey="total_sales" radius={[5, 5, 0, 0]} maxBarSize={52}>
                        {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                        <LabelList dataKey="total_sales" position="top" formatter={fmtM} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Right: channel legend + bars */}
              <div className="space-y-2">
                {channelData.map((ch, i) => (
                  <div key={ch.channel}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">{ch.channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">{fmtM(ch.total_sales)}</span>
                        <span className="text-[11px] font-black tabular-nums" style={{ color: ch.color }}>{(ch.pct * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: `${ch.color}18` }}>
                      <motion.div className="h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${ch.pct * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                        style={{ background: `linear-gradient(90deg, ${ch.color}, ${ch.color}cc)` }} />
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Total venta canales</span>
                  <span className="text-[13px] font-black text-slate-700 tabular-nums">{fmtM(totalVentas)}</span>
                </div>
              </div>
            </div>

            {/* ── EXPANDED: By Store ── */}
            <AnimatePresence>
              {expanded && selectedStore === 'todas' && storeChannelData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">Venta total por tienda</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={storeChannelData} margin={{ top: 14, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtM} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={46} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.04)' }} />
                        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={48}>
                          {storeChannelData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          <LabelList dataKey="value" position="top" formatter={fmtM} style={{ fontSize: 7, fontWeight: 700, fill: '#64748b' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </motion.div>
  );
}