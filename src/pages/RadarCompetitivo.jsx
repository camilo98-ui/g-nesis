import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, PieChart, Pie, LineChart, Line, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, ReferenceLine, Legend
} from 'recharts';
import { Plus, X, TrendingUp, TrendingDown, Minus, Activity, ChevronRight, Zap, ArrowLeft, History, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import SidebarNav from '@/components/SidebarNav';

// ── PALETTE ──────────────────────────────────────────────────────────────────
const AUTO_COLORS = ['#e11d48','#C21875','#f43f5e','#fb7185','#ec4899','#f472b6','#db2777','#be185d','#fda4af','#f9a8d4'];
const SOFT_PINK = '#fff0f5';
const CARD = { background: '#ffffff', border: '1px solid #fce7f3', boxShadow: '0 1px 12px rgba(194,24,117,0.06), 0 1px 3px rgba(0,0,0,0.03)', borderRadius: 20 };

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getInitial(name) { return name ? name.trim()[0].toUpperCase() : '?'; }

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black cursor-help select-none"
        style={{ background: 'rgba(225,29,72,0.08)', color: '#e11d48', border: '1px solid rgba(225,29,72,0.18)' }}>?</span>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-2xl p-3 text-xs text-slate-500 leading-relaxed"
            style={{ background: '#fff', border: '1px solid #fce7f3', boxShadow: '0 8px 32px rgba(194,24,117,0.12)' }}>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return <span className="text-xs text-slate-300 font-medium">—</span>;
  const pos = pct > 0, neu = pct === 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${neu ? 'text-slate-400' : pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {neu ? <Minus className="w-2.5 h-2.5"/> : pos ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// Soft tooltip for all charts
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #fce7f3', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 32px rgba(194,24,117,0.12)', fontSize: 11 }}>
      {label && <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.color || p.stroke, flexShrink: 0 }}/>
          <span style={{ color: '#475569', fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: p.color || p.stroke, fontWeight: 800, marginLeft: 4 }}>
            {formatter ? formatter(p.value) : p.value?.toLocaleString('es-CO')}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── NUEVA TOMA MODAL ──────────────────────────────────────────────────────────
function NuevaTomaModa({ open, onClose, onSave, brands, records }) {
  const [competition, setCompetition] = useState('');
  const [serial, setSerial] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [observations, setObservations] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);

  const allBrands = brands.length > 0 ? brands : [];
  const prevRecord = competition && records
    ? [...records].filter(r => r.competition === competition).sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;
  const preview = serial && prevRecord ? Math.max(0, Number(serial) - (prevRecord.serial || 0)) : null;

  const addBrand = () => { if (newBrandInput.trim()) { setCompetition(newBrandInput.trim()); setShowNewBrand(false); setNewBrandInput(''); } };
  const reset = () => { setCompetition(''); setSerial(''); setDate(format(new Date(), 'yyyy-MM-dd')); setObservations(''); setNewBrandInput(''); setShowNewBrand(false); };
  const submit = () => {
    if (!competition || !serial || !date) return;
    const week = `${parseISO(date).getFullYear()}-S${String(getISOWeek(parseISO(date))).padStart(2, '0')}`;
    const colorIdx = allBrands.indexOf(competition);
    const color = AUTO_COLORS[colorIdx >= 0 ? colorIdx % AUTO_COLORS.length : allBrands.length % AUTO_COLORS.length];
    onSave({ competition, serial: Number(serial), date, week, observations, color, transactions: preview || 0 });
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { reset(); onClose(); }}/>
          <motion.div className="relative z-10 w-full max-w-sm rounded-3xl p-6 bg-white"
            style={{ boxShadow: '0 20px 60px rgba(194,24,117,0.15)', border: '1px solid #fce7f3' }}
            initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-lg font-black text-slate-800">Nueva Toma</h2>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-rose-50 transition-all">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Competencia</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBrands.map((b, i) => (
                    <button key={b} onClick={() => setCompetition(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: competition === b ? `${AUTO_COLORS[i % AUTO_COLORS.length]}12` : '#fafafa', border: `1px solid ${competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] + '30' : '#f1f5f9'}`, color: competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] : '#64748b' }}>
                      {b}
                    </button>
                  ))}
                  <button onClick={() => setShowNewBrand(!showNewBrand)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-400 transition-all"
                    style={{ background: '#fafafa', border: '1px dashed #fce7f3' }}>+ Nueva</button>
                </div>
                {showNewBrand && (
                  <div className="flex gap-2">
                    <input value={newBrandInput} onChange={e => setNewBrandInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBrand()}
                      placeholder="Nombre de la marca..." className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: '#fafafa', border: '1px solid #fce7f3' }} autoFocus/>
                    <button onClick={addBrand} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#C21875' }}>OK</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Serial de Factura <span className="text-rose-300 font-semibold normal-case tracking-normal">· solo los últimos 4 dígitos</span></label>
                <input type="number" value={serial} onChange={e => setSerial(e.target.value)} placeholder="Ej: 1240" maxLength={4}
                  className="w-full px-4 py-3 rounded-2xl text-lg font-bold text-slate-800 outline-none transition-all"
                  style={{ background: '#fafafa', border: '1px solid #fce7f3', letterSpacing: '0.04em' }}
                  onFocus={e => e.target.style.borderColor = '#fda4af'} onBlur={e => e.target.style.borderColor = '#fce7f3'}/>
                {prevRecord && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <span>Última toma:</span><span className="font-semibold text-slate-600">{prevRecord.serial?.toLocaleString('es-CO')}</span>
                    <span>·</span><span>{format(parseISO(prevRecord.date), 'd MMM', { locale: es })}</span>
                  </p>
                )}
              </div>
              <AnimatePresence>
                {preview !== null && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #fff0f5, #fff)', border: '1px solid #fda4af30' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">Transacciones estimadas</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#C21875' }}>{preview.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#fff0f5' }}>
                      <Activity className="w-5 h-5" style={{ color: '#C21875' }}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none"
                  style={{ background: '#fafafa', border: '1px solid #fce7f3' }}/>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Observaciones <span className="font-normal text-slate-300">· opcional</span></label>
                <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={2} placeholder="Contexto adicional..."
                  className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none resize-none"
                  style={{ background: '#fafafa', border: '1px solid #fce7f3' }}/>
              </div>
              <button onClick={submit} disabled={!competition || !serial || !date}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 4px 20px rgba(194,24,117,0.25)' }}>
                Registrar Toma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── HISTORIAL MODAL ───────────────────────────────────────────────────────────
function HistorialModal({ open, onClose, records, brandMap, onDelete, onEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [editSerial, setEditSerial] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editObs, setEditObs] = useState('');
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const startEdit = r => { setEditingId(r.id); setEditSerial(String(r.serial)); setEditDate(r.date); setEditObs(r.observations || ''); };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = r => { onEdit(r.id, { serial: Number(editSerial), date: editDate, observations: editObs }); setEditingId(null); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}/>
          <motion.div className="relative z-10 w-full max-w-lg rounded-3xl bg-white flex flex-col"
            style={{ maxHeight: '85vh', boxShadow: '0 20px 60px rgba(194,24,117,0.15)', border: '1px solid #fce7f3' }}
            initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}>
            <div className="flex items-center justify-between p-5 border-b border-rose-50 flex-shrink-0">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-lg font-black text-slate-800">Historial de Tomas</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-rose-50 transition-all"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sorted.length === 0 && <p className="text-sm text-slate-300 text-center py-8">Sin tomas registradas.</p>}
              {sorted.map(r => {
                const color = brandMap[r.competition] || '#C21875';
                const isEditing = editingId === r.id;
                return (
                  <div key={r.id} className="rounded-2xl p-4 transition-all"
                    style={{ background: isEditing ? '#fff0f5' : '#fafafa', border: `1px solid ${isEditing ? '#fda4af50' : '#f1f5f9'}` }}>
                    {!isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: color }}>{getInitial(r.competition)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-700">{r.competition}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>#{r.serial?.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-400">{r.date}</span>
                            {r.transactions > 0 && <span className="text-xs font-semibold" style={{ color }}>+{r.transactions.toLocaleString('es-CO')} txn</span>}
                            {r.observations && <span className="text-xs text-slate-400 italic truncate max-w-xs">{r.observations}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(r)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-400 hover:bg-indigo-50 transition-all"><Pencil className="w-3.5 h-3.5"/></button>
                          <button onClick={() => onDelete(r.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: color }}>{getInitial(r.competition)}</div>
                          <span className="text-sm font-bold text-slate-700">{r.competition}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serial</label><input type="number" value={editSerial} onChange={e => setEditSerial(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none" style={{ background: '#fff', border: '1px solid #fce7f3' }}/></div>
                          <div><label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fecha</label><input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #fce7f3' }}/></div>
                        </div>
                        <div><label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Observaciones</label><input value={editObs} onChange={e => setEditObs(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #fce7f3' }}/></div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(r)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#C21875,#e11d48)' }}>Guardar</button>
                          <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-50 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SECTION WRAPPER ───────────────────────────────────────────────────────────
function Section({ title, sub, tip, children, delay = 0, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45, ease: [0.23,1,0.32,1] }}
      className={className} style={CARD}>
      <div className="p-5 pb-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[9px] font-black tracking-[0.18em] uppercase text-slate-400">{title}</p>
          {tip && <InfoTooltip text={tip}/>}
        </div>
        {sub && <p className="text-[10px] text-slate-300 mb-1">{sub}</p>}
      </div>
      <div className="p-5 pt-3">{children}</div>
    </motion.div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUserId(u?.id)).catch(() => {});
  }, []);

  const { data: records = [] } = useQuery({
    queryKey: ['competitiveRecords', currentUserId],
    queryFn: () => base44.entities.CompetitiveRecord.filter({ created_by_id: currentUserId }, '-date', 500),
    enabled: !!currentUserId
  });

  const remove = useMutation({ mutationFn: id => base44.entities.CompetitiveRecord.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.CompetitiveRecord.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const create = useMutation({ mutationFn: data => base44.entities.CompetitiveRecord.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); } });

  const brandMap = useMemo(() => {
    const map = {};
    records.forEach(r => { if (!map[r.competition]) map[r.competition] = AUTO_COLORS[Object.keys(map).length % AUTO_COLORS.length]; });
    return map;
  }, [records]);
  const brands = Object.keys(brandMap);

  const brandStats = useMemo(() => {
    return brands.map(brand => {
      const sorted = [...records].filter(r => r.competition === brand).sort((a, b) => new Date(a.date) - new Date(b.date));
      const txnSeries = sorted.map((r, i) => {
        if (i === 0) return { ...r, txn: null };
        return { ...r, txn: Math.max(0, r.serial - sorted[i-1].serial) };
      }).filter(r => r.txn !== null);
      const total = txnSeries.reduce((s, r) => s + r.txn, 0);
      const lastTxn = txnSeries[txnSeries.length - 1]?.txn || 0;
      const prevTxn = txnSeries[txnSeries.length - 2]?.txn || 0;
      const growth = prevTxn > 0 ? ((lastTxn - prevTxn) / prevTxn) * 100 : 0;
      const color = brandMap[brand];
      // Growth series: % change per period
      const growthSeries = txnSeries.slice(1).map((r, i) => {
        const prev = txnSeries[i].txn;
        return { date: r.date, pct: prev > 0 ? ((r.txn - prev) / prev) * 100 : 0 };
      });
      return { brand, color, total, lastTxn, growth, txnSeries, growthSeries, count: sorted.length, onlyOneReading: sorted.length === 1 };
    }).sort((a, b) => b.total - a.total);
  }, [records, brands, brandMap]);

  const totalAll = Math.max(brandStats.reduce((s, b) => s + b.total, 0), 1);

  // Monthly aggregated data
  const monthlyData = useMemo(() => {
    const months = {};
    brandStats.forEach(b => {
      b.txnSeries.forEach(r => {
        const key = r.date.substring(0, 7);
        const label = format(parseISO(r.date), 'MMM yy', { locale: es });
        if (!months[key]) months[key] = { month: label, key };
        months[key][b.brand] = (months[key][b.brand] || 0) + r.txn;
      });
    });
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
  }, [brandStats]);

  // Growth % per period per brand (for line chart)
  const growthTimelineData = useMemo(() => {
    const periods = {};
    brandStats.forEach(b => {
      b.growthSeries.forEach(g => {
        const key = g.date.substring(0, 7);
        const label = format(parseISO(g.date), 'MMM yy', { locale: es });
        if (!periods[key]) periods[key] = { month: label, key };
        periods[key][b.brand] = parseFloat(g.pct.toFixed(1));
      });
    });
    return Object.values(periods).sort((a, b) => a.key.localeCompare(b.key));
  }, [brandStats]);

  // Velocity: last 3 readings avg growth rate per brand
  const velocityData = brandStats.filter(b => b.growthSeries.length > 0).map(b => ({
    brand: b.brand, color: b.color,
    avg: b.growthSeries.length > 0 ? b.growthSeries.reduce((s, g) => s + g.pct, 0) / b.growthSeries.length : 0,
    last: b.growth
  }));

  const topBrand = brandStats[0];
  const fastestGrowing = [...brandStats].sort((a, b) => b.growth - a.growth)[0];
  const insights = [
    fastestGrowing?.growth > 5 && `${fastestGrowing.brand} incrementó su actividad ${fastestGrowing.growth.toFixed(0)}% en la última toma.`,
    topBrand && `${topBrand.brand} lidera con ${topBrand.total.toLocaleString('es-CO')} transacciones estimadas.`,
    brandStats.some(b => b.growth < -10) && `${brandStats.find(b => b.growth < -10)?.brand} presenta desaceleración comercial.`,
    brandStats.length >= 3 && 'Alta presión competitiva en el entorno.'
  ].filter(Boolean);

  const lastReadingData = brandStats.filter(b => !b.onlyOneReading).map(b => ({ brand: b.brand, value: b.lastTxn, color: b.color }));
  const pieData = brandStats.filter(b => b.total > 0).map(b => ({ name: b.brand, value: b.total, color: b.color }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <SidebarNav />
      <div className="flex-1 relative z-10 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-all">
              <ArrowLeft className="w-4 h-4"/>
            </Link>
            <div>
              <p className="text-[9px] font-black tracking-[0.24em] uppercase mb-0.5" style={{ color: '#C21875' }}>POPSY · INTEL COMERCIAL</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Radar <span style={{ color: '#C21875' }}>Competitivo</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHistorialOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
              style={{ border: '1px solid #fce7f3', background: '#fff' }}>
              <History className="w-3.5 h-3.5"/> Historial
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
              <span className="text-[9px] font-bold text-emerald-500 tracking-wider">ACTIVO</span>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 4px 16px rgba(194,24,117,0.22)' }}>
              <Plus className="w-3.5 h-3.5"/> Nueva Toma
            </button>
          </div>
        </motion.div>

        {/* ── NOVA BANNER ── */}
        {insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            className="mb-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #fff0f5, #fff)', border: '1px solid #fda4af30', boxShadow: '0 2px 12px rgba(194,24,117,0.06)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff0f5' }}>
              <Zap className="w-4 h-4" style={{ color: '#C21875' }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black tracking-widest uppercase mb-0.5" style={{ color: '#C21875' }}>NOVA AI · ANÁLISIS AUTOMÁTICO</p>
              <p className="text-sm font-medium text-slate-600 truncate">{insights[0]}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-200 flex-shrink-0"/>
          </motion.div>
        )}

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5" style={{ background: '#fff0f5' }}>
              <Activity className="w-8 h-8" style={{ color: '#C21875' }}/>
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">Sin datos de inteligencia</h3>
            <p className="text-sm text-slate-300 max-w-xs mb-6 leading-relaxed">Registra la primera toma de seriales para activar el radar de mercado.</p>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }}>
              <Plus className="w-4 h-4"/> Registrar Primera Toma
            </button>
          </div>
        ) : (
          <>
            {/* ── ROW 1: KPI SUMMARY ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Transacciones', value: brandStats.reduce((s, b) => s + b.total, 0).toLocaleString('es-CO'), sub: `${records.length} tomas`, color: '#C21875', tip: 'Suma de todas las transacciones estimadas.' },
                { label: 'Marcas', value: brands.length, sub: `${brandStats.filter(b=>!b.onlyOneReading).length} completas`, color: '#e11d48', tip: 'Marcas monitoreadas actualmente.' },
                { label: 'Líder del Período', value: topBrand?.brand || '—', sub: topBrand ? `${topBrand.total.toLocaleString('es-CO')} txn` : '—', color: '#C21875', tip: 'Marca con más transacciones acumuladas.' },
                { label: 'Mayor Crecimiento', value: fastestGrowing?.growth > 0 ? `+${fastestGrowing.growth.toFixed(0)}%` : '—', sub: fastestGrowing?.growth > 0 ? fastestGrowing.brand : '—', color: '#e11d48', tip: 'Crecimiento entre penúltima y última toma.' }
              ].map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.04 }}
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #fce7f3', boxShadow: '0 1px 12px rgba(194,24,117,0.05)' }}>
                  <div className="absolute top-0 right-0 left-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${kpi.color}40, ${kpi.color}80, ${kpi.color}40)` }}/>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-300">{kpi.label}</p>
                    <InfoTooltip text={kpi.tip}/>
                  </div>
                  <p className="text-xl font-black tracking-tight truncate" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 truncate">{kpi.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── ROW 2: TENDENCIA MENSUAL + CUOTA ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

              {/* Área mensual */}
              <Section title="Evolución Mensual de Transacciones" sub={`${monthlyData.length} meses registrados`}
                tip="Evolución mes a mes de las transacciones por marca. Permite detectar marcas en aceleración o caída."
                delay={0.14} className="lg:col-span-3">
                <div className="flex flex-wrap gap-3 mb-3">
                  {brandStats.map(b => (
                    <div key={b.brand} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: b.color }}/>
                      <span className="text-[10px] font-semibold text-slate-400">{b.brand}</span>
                    </div>
                  ))}
                </div>
                {monthlyData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                      <defs>
                        {brandStats.map(b => (
                          <linearGradient key={b.brand} id={`ag_${b.brand.replace(/[^a-z0-9]/gi,'_')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={b.color} stopOpacity={0.12}/>
                            <stop offset="100%" stopColor={b.color} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false}/>
                      <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#e2e8f0', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={28}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      {brandStats.map(b => (
                        <Area key={b.brand} type="monotone" dataKey={b.brand} name={b.brand}
                          stroke={b.color} strokeWidth={2} fill={`url(#ag_${b.brand.replace(/[^a-z0-9]/gi,'_')})`}
                          dot={{ fill: b.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}/>
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center gap-2">
                    <Activity className="w-6 h-6" style={{ color: '#fda4af' }}/>
                    <p className="text-xs text-slate-300">Registra 2 tomas por marca para ver la evolución</p>
                  </div>
                )}
              </Section>

              {/* Cuota donut */}
              <Section title="Cuota de Mercado" tip="Participación % de cada marca sobre el total de transacciones estimadas." delay={0.18} className="lg:col-span-2">
                {pieData.length >= 2 ? (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} strokeWidth={3} stroke="#fff">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: '#fff', border: '1px solid #fce7f3', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 32px rgba(194,24,117,0.12)', fontSize: 11 }}>
                              <p style={{ color: d.color, fontWeight: 800 }}>{d.name}</p>
                              <p style={{ color: '#94a3b8' }}>{((d.value/totalAll)*100).toFixed(1)}% · {d.value.toLocaleString('es-CO')} txn</p>
                            </div>
                          );
                        }}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-1">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }}/>
                          <span className="text-[10px] font-semibold text-slate-500 flex-1 truncate">{d.name}</span>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: d.color }}>{((d.value / totalAll) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center"><p className="text-xs text-slate-300 text-center">2+ marcas con datos para ver cuota</p></div>
                )}
              </Section>
            </div>

            {/* ── ROW 3: TENDENCIA DE CRECIMIENTO (líneas) ── */}
            {growthTimelineData.length > 0 && (
              <Section title="Tendencia de Crecimiento %" sub="Variación % entre tomas consecutivas por marca"
                tip="Cómo está cambiando el ritmo de crecimiento de cada marca. Línea positiva = acelerando, negativa = desacelerando."
                delay={0.22} className="mb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={growthTimelineData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#e2e8f0', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={32}/>
                    <ReferenceLine y={0} stroke="#fda4af" strokeDasharray="4 3" strokeWidth={1}/>
                    <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)}%`}/>}/>
                    {brandStats.map(b => (
                      <Line key={b.brand} type="monotone" dataKey={b.brand} name={b.brand}
                        stroke={b.color} strokeWidth={2} dot={{ fill: b.color, r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}/>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* ── ROW 4: BARRAS POR MES + ÚLTIMA TOMA ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

              <Section title="Transacciones por Mes" sub="Comparación mensual entre marcas"
                tip="Barras agrupadas por mes. Compara la actividad de cada marca en cada período."
                delay={0.26}>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyData} barCategoryGap="30%" barGap={2} margin={{ top: 0, right: 4, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false}/>
                      <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#e2e8f0', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={24}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      {brandStats.map(b => (
                        <Bar key={b.brand} dataKey={b.brand} name={b.brand} fill={b.color} radius={[4, 4, 0, 0]} maxBarSize={22}/>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos mensuales</p></div>
                )}
              </Section>

              <Section title="Última Toma · Transacciones" sub="Actividad más reciente por marca"
                tip="Transacciones de la última toma de cada marca. Indica quién fue más activo recientemente."
                delay={0.30}>
                {lastReadingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={lastReadingData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" horizontal={false}/>
                      <XAxis type="number" tick={{ fill: '#e2e8f0', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                      <YAxis type="category" dataKey="brand" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={64}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" name="Última toma" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {lastReadingData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center"><p className="text-xs text-slate-300">Registra 2 tomas para comparar</p></div>
                )}
              </Section>
            </div>

            {/* ── ROW 5: VELOCIDAD DE CRECIMIENTO + RANKING ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

              {/* Velocidad promedio de crecimiento */}
              <Section title="Velocidad de Crecimiento Promedio" sub="Tasa de crecimiento promedio histórica vs. última toma"
                tip="Compara la tasa de crecimiento promedio de toda la historia vs. el crecimiento de la última toma. Detecta marcas acelerando o frenando."
                delay={0.34}>
                {velocityData.length > 0 ? (
                  <div className="space-y-3 mt-1">
                    {velocityData.map((b, i) => {
                      const maxVal = Math.max(...velocityData.map(v => Math.abs(v.avg)), ...velocityData.map(v => Math.abs(v.last)), 10);
                      const avgPct = Math.abs(b.avg) / maxVal * 100;
                      const lastPct = Math.abs(b.last) / maxVal * 100;
                      return (
                        <div key={b.brand} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-white text-[9px]" style={{ background: b.color }}>{getInitial(b.brand)}</div>
                              <span className="text-xs font-bold text-slate-600">{b.brand}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] text-slate-400">Prom: <span className="font-bold" style={{ color: b.color }}>{b.avg >= 0 ? '+' : ''}{b.avg.toFixed(1)}%</span></span>
                              <TrendBadge pct={b.last}/>
                            </div>
                          </div>
                          {/* Dual bar */}
                          <div className="flex flex-col gap-0.5">
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#fce7f3' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${avgPct}%` }} transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                                style={{ height: '100%', borderRadius: 9999, background: `${b.color}60` }}/>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#fce7f3' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${lastPct}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.06 }}
                                style={{ height: '100%', borderRadius: 9999, background: b.color }}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: '#fda4af60' }}/><span className="text-[9px] text-slate-300">Promedio histórico</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: '#C21875' }}/><span className="text-[9px] text-slate-300">Última toma</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos de crecimiento</p></div>
                )}
              </Section>

              {/* Participación acumulada */}
              <Section title="Participación Acumulada" sub="% del total de transacciones por marca"
                tip="Del 100% de transacciones detectadas, cuánto representa cada marca. La barra más larga es el líder de tráfico."
                delay={0.38}>
                <div className="space-y-2.5 mt-1">
                  {brandStats.map((b, i) => {
                    const pct = (b.total / totalAll) * 100;
                    return (
                      <div key={b.brand}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-white text-[9px]" style={{ background: b.color }}>{getInitial(b.brand)}</div>
                            <span className="text-xs font-semibold text-slate-600">{b.brand}</span>
                            {i === 0 && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: '#f59e0b' }}>LÍDER</span>}
                          </div>
                          {b.onlyOneReading
                            ? <span className="text-[9px] text-slate-300 italic">2ª toma pendiente</span>
                            : <span className="text-xs font-black tabular-nums" style={{ color: b.color }}>{pct.toFixed(1)}%</span>}
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#fce7f3' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: b.onlyOneReading ? '2%' : `${Math.max(pct, 1)}%` }}
                            transition={{ duration: 1.1, delay: 0.4 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                            style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}80, ${b.color})` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>

            {/* ── ROW 6: AI INSIGHTS ── */}
            {insights.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #fff0f5, #fff)', border: '1px solid #fda4af20', boxShadow: '0 1px 12px rgba(194,24,117,0.05)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#C21875' }}>Insights Automáticos · Nova AI</p>
                  <InfoTooltip text="Alertas generadas automáticamente: marcas en aceleración, desaceleración o alta presión competitiva."/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #fce7f3' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#C21875,#e11d48)' }}>{i+1}</div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        <HistorialModal open={historialOpen} onClose={() => setHistorialOpen(false)} records={records} brandMap={brandMap}
          onDelete={id => remove.mutate(id)} onEdit={(id, data) => update.mutate({ id, data })}/>
        <NuevaTomaModa open={modalOpen} onClose={() => setModalOpen(false)} onSave={data => create.mutate(data)} brands={brands} records={records}/>
      </div>
    </div>
  );
}