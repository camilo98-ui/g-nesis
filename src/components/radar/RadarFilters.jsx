import { motion } from 'framer-motion';
import { Filter, RotateCcw } from 'lucide-react';
import { MONTHS_ES, storeCityLabel } from './radarModel';

function Sel({ label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-rose-300"
        style={{ background: '#fafafa', border: '1px solid #fce7f3', minWidth: 90 }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function RadarFilters({ filters, setFilters, options, takes, hasData, onReset }) {
  const monthSel = filters.month !== 'ALL';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl p-4 mb-4 flex items-end gap-3 flex-wrap">
      <div className="flex items-center gap-2 pr-3 pb-2 border-r border-rose-50">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
          <Filter className="w-3.5 h-3.5" style={{ color: '#C21875' }} />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">Filtros Globales</p>
          <p className="text-[10px] text-slate-300 font-medium">afectan todo el dashboard</p>
        </div>
      </div>

      <Sel label="Año" value={filters.year} disabled={!hasData}
        onChange={(v) => setFilters({ year: Number(v) })}
        options={(options.years.length ? options.years : [new Date().getFullYear()]).map((y) => ({ value: y, label: String(y) }))} />

      <Sel label="Mes" value={filters.month} disabled={!hasData}
        onChange={(v) => setFilters({ month: v === 'ALL' ? 'ALL' : Number(v), take: 'ALL' })}
        options={[{ value: 'ALL', label: 'Todos' }, ...MONTHS_ES.map((m, i) => ({ value: i + 1, label: m }))]} />

      <Sel label="Toma" value={filters.take} disabled={!hasData || !monthSel || takes.length === 0}
        onChange={(v) => setFilters({ take: v === 'ALL' ? 'ALL' : Number(v) })}
        options={[{ value: 'ALL', label: 'Todas' }, ...takes.map((t) => ({ value: t, label: `Toma ${t}` }))]} />

      <Sel label="Tienda" value={filters.storeId} disabled={!hasData}
        onChange={(v) => setFilters({ storeId: v })}
        options={[{ value: 'ALL', label: 'Todas las tiendas' }, ...options.stores.map((s) => ({ value: s, label: s }))]} />

      <Sel label="Ciudad" value={filters.city} disabled={!hasData}
        onChange={(v) => setFilters({ city: v })}
        options={[{ value: 'ALL', label: 'Todas las ciudades' }, ...options.cities.map((c) => ({ value: c, label: storeCityLabel(c) }))]} />

      <Sel label="Competidor" value={filters.brand} disabled={!hasData}
        onChange={(v) => setFilters({ brand: v })}
        options={[{ value: 'ALL', label: 'Todos' }, ...options.brands.map((b) => ({ value: b.key, label: b.name }))]} />

      <button onClick={onReset}
        className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all mb-0">
        <RotateCcw className="w-3 h-3" /> Restablecer
      </button>
    </motion.div>
  );
}