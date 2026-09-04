import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, PieChart as PieIcon, TrendingUp, BarChart3, ChevronDown, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PremiumSection, CustomTooltip } from './RadarShared';

export function MonthlyEvolution({ brandStats, monthlyData }) {
  const Icon = Activity;
  const [modeOpen, setModeOpen] = useState(false);
  const [mode, setMode] = useState('mes');
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const tomasData = useMemo(() => {
    const dates = {};
    brandStats.forEach(b => b.txnSeries.forEach(r => {
      if (!dates[r.date]) dates[r.date] = { month: format(parseISO(r.date), 'd MMM yy', { locale: es }) };
      dates[r.date][b.brand] = (dates[r.date][b.brand] || 0) + r.txn;
    }));
    return Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [brandStats]);

  const toggleBrand = (brand) =>
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  const visibleBrands = selectedBrands.length ? brandStats.filter(b => selectedBrands.includes(b.brand)) : brandStats;
  const chartData = mode === 'tomas' ? tomasData : monthlyData;
  const enoughData = (mode === 'tomas' ? tomasData.length : monthlyData.length) >= 1;
  const modeLabel = mode === 'tomas' ? 'Por Tomas' : 'Por Mes';
  const brandsLabel = selectedBrands.length
    ? `${selectedBrands.length} ${selectedBrands.length === 1 ? 'marca' : 'marcas'}`
    : 'Todos';
  const subLabel = mode === 'tomas' ? `${tomasData.length} tomas registradas` : `${monthlyData.length} meses registrados`;

  const dropdownStyle = {
    background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 12px 40px rgba(194,24,117,0.15)'
  };

  return (
    <PremiumSection title="Evolución Mensual de Transacciones" sub={subLabel}
      tip="Evolución de las transacciones por marca, por mes o por cada toma. Selecciona las marcas que quieras comparar."
      delay={0.14} className="lg:col-span-3" icon={Icon}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {/* Selector de modo: por mes / por tomas */}
        <div className="relative">
          <button onClick={() => { setModeOpen(o => !o); setBrandsOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-800 transition-all glass-card">
            {modeLabel}
            <ChevronDown className="w-3.5 h-3.5 text-rose-400" style={{ transform: modeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
          </button>
          <AnimatePresence>
            {modeOpen && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }} className="absolute top-full left-0 mt-2 z-50 w-40 rounded-2xl p-1.5" style={dropdownStyle}>
                {['mes', 'tomas'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setModeOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-rose-50/60 transition-all">
                    {m === 'mes' ? 'Por Mes' : 'Por Tomas'}
                    {mode === m && <Check className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selector múltiple de marcas */}
        <div className="relative">
          <button onClick={() => { setBrandsOpen(o => !o); setModeOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-800 transition-all glass-card">
            {brandsLabel}
            <ChevronDown className="w-3.5 h-3.5 text-rose-400" style={{ transform: brandsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
          </button>
          <AnimatePresence>
            {brandsOpen && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }} className="absolute top-full right-0 mt-2 z-50 w-64 max-h-64 overflow-y-auto rounded-2xl p-1.5" style={dropdownStyle}>
                <button onClick={() => { setSelectedBrands([]); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-rose-50/60 transition-all">
                  Todas las marcas
                  {!selectedBrands.length && <Check className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>}
                </button>
                {brandStats.map(b => (
                  <button key={b.brand} onClick={() => toggleBrand(b.brand)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-rose-50/60 transition-all">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }}/>
                    <span className="flex-1 text-left truncate">{b.brand}</span>
                    {selectedBrands.includes(b.brand) && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C21875' }}/>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3">
        {brandStats.map(b => {
          const visible = !selectedBrands.length || selectedBrands.includes(b.brand);
          return (
            <button key={b.brand} onClick={() => toggleBrand(b.brand)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
              style={{ background: `${b.color}08`, opacity: visible ? 1 : 0.35 }}>
              <div className="w-2 h-2 rounded-full" style={{ background: b.color }}/>
              <span className="text-[10px] font-semibold text-slate-500">{b.brand}</span>
            </button>
          );
        })}
      </div>
      {enoughData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              {visibleBrands.map(b => (
                <linearGradient key={b.brand} id={`ag_${b.brand.replace(/[^a-z0-9]/gi,'_')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={b.color} stopOpacity={0.18}/>
                  <stop offset="100%" stopColor={b.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={28}/>
            <Tooltip content={<CustomTooltip/>}/>
            {visibleBrands.map(b => (
              <Area key={b.brand} type="monotone" dataKey={b.brand} name={b.brand}
                stroke={b.color} strokeWidth={2.5} fill={`url(#ag_${b.brand.replace(/[^a-z0-9]/gi,'_')})`}
                dot={{ fill: b.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center gap-2">
          <Activity className="w-6 h-6" style={{ color: '#fda4af' }}/>
          <p className="text-xs text-slate-300">Registra 2 tomas por marca para ver la evolución</p>
        </div>
      )}
    </PremiumSection>
  );
}

export function MarketShareDonut({ pieData, totalAll }) {
  return (
    <PremiumSection title="Cuota de Mercado" tip="Participación % de cada marca sobre el total de transacciones estimadas." delay={0.18} className="lg:col-span-2" icon={PieIcon}>
      {pieData.length >= 2 ? (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  {pieData.map((entry, i) => (
                    <linearGradient key={i} id={`donut_${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} strokeWidth={3} stroke="#fff" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={`url(#donut_${i})`}/>)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 12px 40px rgba(194,24,117,0.15)', fontSize: 11 }}>
                      <p style={{ color: d.color, fontWeight: 800, marginBottom: 4 }}>{d.name}</p>
                      <p style={{ color: '#64748b' }}>{((d.value/totalAll)*100).toFixed(1)}% · {d.value.toLocaleString('es-CO')} txn</p>
                    </div>
                  );
                }}/>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Total</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">{totalAll.toLocaleString('es-CO')}</p>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-50/50 transition-all">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}40` }}/>
                <span className="text-[11px] font-semibold text-slate-600 flex-1 truncate">{d.name}</span>
                <span className="text-[11px] font-black tabular-nums" style={{ color: d.color }}>{((d.value / totalAll) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-52 flex items-center justify-center"><p className="text-xs text-slate-300 text-center">2+ marcas con datos para ver cuota</p></div>
      )}
    </PremiumSection>
  );
}

export function GrowthTrendChart({ growthTimelineData, brandStats }) {
  if (growthTimelineData.length === 0) return null;
  return (
    <PremiumSection title="Tendencia de Crecimiento %" sub="Variación % entre tomas consecutivas"
      tip="Cómo está cambiando el ritmo de crecimiento de cada marca. Línea positiva = acelerando, negativa = desacelerando."
      delay={0.22} icon={TrendingUp}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={growthTimelineData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false}/>
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={32}/>
          <ReferenceLine y={0} stroke="#fda4af" strokeDasharray="5 4" strokeWidth={1}/>
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)}%`}/>}/>
          {brandStats.map(b => (
            <Line key={b.brand} type="monotone" dataKey={b.brand} name={b.brand}
              stroke={b.color} strokeWidth={2.5} dot={{ fill: b.color, r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </PremiumSection>
  );
}

export function ShareEvolutionChart({ monthlyData, brandStats }) {
  if (monthlyData.length <= 1) return null;
  const shareData = monthlyData.map(m => {
    const total = brandStats.reduce((s, b) => s + (m[b.brand] || 0), 0) || 1;
    const entry = { month: m.month };
    brandStats.forEach(b => { entry[b.brand] = parseFloat(((m[b.brand] || 0) / total * 100).toFixed(1)); });
    return entry;
  });

  return (
    <PremiumSection title="Evolución Cuota de Mercado" sub="% share mensual por marca"
      tip="Cómo ha cambiado la participación de cada marca mes a mes. Áreas que se ensanchan = ganando share."
      delay={0.24} icon={BarChart3}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={shareData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false}/>
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={32}/>
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)}%`}/>}/>
          {brandStats.map(b => (
            <Area key={b.brand} type="monotone" dataKey={b.brand} name={b.brand}
              stackId="1" stroke={b.color} strokeWidth={2} fill={b.color} fillOpacity={0.4}/>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </PremiumSection>
  );
}