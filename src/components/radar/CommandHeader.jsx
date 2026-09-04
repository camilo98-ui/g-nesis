import { motion } from 'framer-motion';
import { Store, Calendar, CalendarDays, Users, RotateCcw, Radar } from 'lucide-react';
import { MONTHS_ES } from './radarModel';

function Sel({ icon: Icon, label, value, onChange, options, disabled, wide }) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <label className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-rose-300 w-full"
        style={{ background: '#fafafa', border: '1px solid #fce7f3', minWidth: wide ? 0 : 96 }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function CommandHeader({ filters, setFilters, options, months, view, setView, onReset }) {
  const monthSel = filters.month !== 'ALL';

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl p-4 mb-4">

      {/* Título del centro de comando */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 pb-3 border-b border-rose-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
            <Radar className="w-4 h-4" style={{ color: '#C21875' }} />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">Centro de comando competitivo</p>
            <p className="text-sm font-black text-slate-800 tracking-tight">
              {filters.storeId === 'ALL' ? 'Red completa' : filters.storeId}
              <span className="text-slate-300 font-bold"> · </span>
              <span className="text-premium">{monthSel ? `${MONTHS_ES[filters.month - 1]} ${filters.year}` : `Año ${filters.year}`}</span>
            </p>
          </div>
        </div>
        <div className="flex rounded-xl p-0.5" style={{ background: '#f8fafc', border: '1px solid #fce7f3' }}>
          <button onClick={() => setView('takes')} disabled={!monthSel}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${view === 'takes' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            style={view === 'takes' ? { background: 'linear-gradient(135deg, #C21875, #e11d48)' } : {}}>
            <CalendarDays className="w-3 h-3" /> Por Tomas
          </button>
          <button onClick={() => setView('monthly')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${view === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            style={view === 'monthly' ? { background: 'linear-gradient(135deg, #C21875, #e11d48)' } : {}}>
            <Calendar className="w-3 h-3" /> Mensual
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-[2] min-w-[150px]">
          <Sel icon={Store} label="Tienda" value={filters.storeId} disabled={!options.stores.length}
            onChange={(v) => setFilters({ storeId: v })}
            options={[{ value: 'ALL', label: 'Todas las tiendas' }, ...options.stores.map((s) => ({ value: s, label: s }))]} />
        </div>
        <div className="flex-1 min-w-[80px] max-w-[110px]">
          <Sel icon={Calendar} label="Año" value={filters.year} disabled={!options.years.length}
            onChange={(v) => setFilters({ year: Number(v) })}
            options={(options.years.length ? options.years : [new Date().getFullYear()]).map((y) => ({ value: y, label: String(y) }))} />
        </div>
        <div className="flex-1 min-w-[110px] max-w-[140px]">
          <Sel icon={CalendarDays} label="Mes" value={filters.month} disabled={!months.length}
            onChange={(v) => setFilters({ month: v === 'ALL' ? 'ALL' : Number(v) })}
            options={[{ value: 'ALL', label: 'Todo el año' }, ...months.map((m) => ({ value: m, label: MONTHS_ES[m - 1] }))]} />
        </div>
        <div className="flex-[2] min-w-[130px]">
          <Sel icon={Users} label="Competidores" value={filters.brand} disabled={!options.brands.length}
            onChange={(v) => setFilters({ brand: v })}
            options={[{ value: 'ALL', label: 'Todos' }, ...options.brands.map((b) => ({ value: b.key, label: b.name }))]} />
        </div>
        <button onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all mb-0">
          <RotateCcw className="w-3 h-3" /> Restablecer
        </button>
      </div>
    </motion.div>
  );
}