import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, PieChart, Pie, LineChart, Line
} from 'recharts';
import { Plus, X, TrendingUp, TrendingDown, Minus, Activity, ChevronRight, Zap, ArrowLeft, History, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { format, parseISO, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// Paleta rosa/magenta suave — coherente con el dashboard Popsy
const AUTO_COLORS = ['#C21875','#e11d48','#9333ea','#2563eb','#0891b2','#059669','#d97706','#db2777','#7c3aed','#ea580c'];
const SOFT_BG = 'rgba(255,255,255,0.92)';
const CARD_SHADOW = '0 2px 16px rgba(194,24,117,0.06), 0 1px 4px rgba(0,0,0,0.04)';
const CARD_BORDER = '1px solid rgba(194,24,117,0.09)';

function getInitial(name) {
  return name ? name.trim()[0].toUpperCase() : '?';
}

function BrandDot({ color, size = 8 }) {
  return <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, background: color }} />;
}

function BrandBadge({ name, color }) {
  return (
    <div className="flex items-center justify-center rounded-xl font-black text-white text-sm w-9 h-9 flex-shrink-0"
      style={{ background: color, fontSize: 15 }}>
      {getInitial(name)}
    </div>
  );
}

function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return <span className="text-xs text-slate-300 font-medium">—</span>;
  const pos = pct > 0;
  const neu = pct === 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold tabular-nums ${neu ? 'text-slate-400' : pos ? 'text-emerald-500' : 'text-rose-500'}`}>
      {neu ? <Minus className="w-3 h-3"/> : pos ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black cursor-help select-none"
        style={{ background: 'rgba(194,24,117,0.1)', color: '#C21875', border: '1px solid rgba(194,24,117,0.2)' }}>?</span>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-xl p-3 text-xs text-slate-600 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(194,24,117,0.2)' }}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── NUEVA TOMA MODAL ────────────────────────────────────────────────────────
function NuevaTomaModa({ open, onClose, onSave, brands, records }) {
  const [competition, setCompetition] = useState('');
  const [serial, setSerial] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [observations, setObservations] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);

  const allBrands = brands.length > 0 ? brands : ['McDonald\'s', 'KFC', 'Mimos', 'GoYurt'];

  // Calculate preview transactions
  const prevRecord = competition && records
    ? [...records]
        .filter(r => r.competition === competition)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const preview = serial && prevRecord
    ? Math.max(0, Number(serial) - (prevRecord.serial || 0))
    : null;

  const addBrand = () => {
    if (newBrandInput.trim()) {
      setCompetition(newBrandInput.trim());
      setShowNewBrand(false);
      setNewBrandInput('');
    }
  };

  const reset = () => {
    setCompetition(''); setSerial(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    setObservations(''); setNewBrandInput(''); setShowNewBrand(false);
  };

  const submit = () => {
    if (!competition || !serial || !date) return;
    const week = `${parseISO(date).getFullYear()}-S${String(getISOWeek(parseISO(date))).padStart(2,'0')}`;
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
            style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.1)' }}
            initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.23,1,0.32,1] }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Nueva Toma</h2>
              </div>
              <button onClick={() => { reset(); onClose(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-4">
              {/* Competition selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Competencia</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBrands.map((b, i) => (
                    <button key={b} onClick={() => setCompetition(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: competition === b ? `${AUTO_COLORS[i % AUTO_COLORS.length]}15` : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] + '40' : 'rgba(0,0,0,0.07)'}`,
                        color: competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] : '#64748b'
                      }}>
                      {b}
                    </button>
                  ))}
                  <button onClick={() => setShowNewBrand(!showNewBrand)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px dashed rgba(0,0,0,0.12)' }}>
                    + Nueva
                  </button>
                </div>
                {showNewBrand && (
                  <div className="flex gap-2">
                    <input value={newBrandInput} onChange={e => setNewBrandInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addBrand()}
                      placeholder="Nombre de la marca..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} autoFocus/>
                    <button onClick={addBrand}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#C21875' }}>
                      Agregar
                    </button>
                  </div>
                )}
              </div>

              {/* Serial */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Serial de Factura</label>
                <input type="number" value={serial} onChange={e => setSerial(e.target.value)}
                  placeholder="Ej: 001240"
                  className="w-full px-4 py-3 rounded-2xl text-base font-bold text-slate-800 outline-none transition-all"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', letterSpacing: '0.04em' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(194,24,117,0.35)'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}/>
                {prevRecord && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <span>Última toma:</span>
                    <span className="font-semibold text-slate-600">{prevRecord.serial?.toLocaleString('es-CO')}</span>
                    <span>·</span>
                    <span>{format(parseISO(prevRecord.date), 'd MMM', { locale: es })}</span>
                  </p>
                )}
              </div>

              {/* Auto-calculated preview */}
              <AnimatePresence>
                {preview !== null && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-3.5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.06), rgba(194,24,117,0.03))', border: '1px solid rgba(194,24,117,0.15)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Transacciones estimadas</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#C21875', letterSpacing: '-0.03em' }}>
                        {preview.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.1)' }}>
                      <Activity className="w-5 h-5" style={{ color: '#C21875' }}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}/>
              </div>

              {/* Observations */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Observaciones <span className="font-normal text-slate-300">· opcional</span></label>
                <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={2}
                  placeholder="Contexto adicional..."
                  className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none resize-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}/>
              </div>

              <button onClick={submit} disabled={!competition || !serial || !date}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }}>
                Registrar Toma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── HISTORIAL MODAL ────────────────────────────────────────────────────────
function HistorialModal({ open, onClose, records, brandMap, onDelete, onEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [editSerial, setEditSerial] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editObs, setEditObs] = useState('');

  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditSerial(String(r.serial));
    setEditDate(r.date);
    setEditObs(r.observations || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (r) => {
    onEdit(r.id, { serial: Number(editSerial), date: editDate, observations: editObs });
    setEditingId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}/>
          <motion.div className="relative z-10 w-full max-w-lg rounded-3xl bg-white flex flex-col"
            style={{ maxHeight: '85vh', boxShadow: '0 8px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.1)' }}
            initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.23,1,0.32,1] }}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Historial de Tomas</h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sorted.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Sin tomas registradas.</p>
              )}
              {sorted.map(r => {
                const color = brandMap[r.competition] || '#C21875';
                const isEditing = editingId === r.id;
                return (
                  <div key={r.id} className="rounded-2xl p-4 transition-all"
                    style={{ background: isEditing ? 'rgba(194,24,117,0.03)' : '#f8fafc', border: `1px solid ${isEditing ? 'rgba(194,24,117,0.2)' : '#e2e8f0'}` }}>
                    {!isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                          style={{ background: color }}>{getInitial(r.competition)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800">{r.competition}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                              #{r.serial?.toLocaleString('es-CO')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-400">{r.date}</span>
                            {r.week && <span className="text-xs text-slate-300">{r.week}</span>}
                            {r.transactions > 0 && <span className="text-xs font-semibold" style={{ color }}>+{r.transactions.toLocaleString('es-CO')} txn</span>}
                            {r.observations && <span className="text-xs text-slate-400 italic truncate max-w-xs">{r.observations}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(r)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                            <Pencil className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => onDelete(r.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0" style={{ background: color }}>
                            {getInitial(r.competition)}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{r.competition}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serial</label>
                            <input type="number" value={editSerial} onChange={e => setEditSerial(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
                              style={{ background: '#fff', border: '1px solid #e2e8f0' }}/>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fecha</label>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: '#fff', border: '1px solid #e2e8f0' }}/>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Observaciones</label>
                          <input value={editObs} onChange={e => setEditObs(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: '#fff', border: '1px solid #e2e8f0' }}/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(r)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
                            style={{ background: 'linear-gradient(135deg,#C21875,#e11d7a)' }}>Guardar</button>
                          <button onClick={cancelEdit}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['competitiveRecords'],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 500)
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.CompetitiveRecord.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] })
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompetitiveRecord.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] })
  });

  const create = useMutation({
    mutationFn: (data) => base44.entities.CompetitiveRecord.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); }
  });

  // Derive brands + colors
  const brandMap = useMemo(() => {
    const map = {};
    records.forEach((r, i) => {
      if (!map[r.competition]) {
        map[r.competition] = r.color || AUTO_COLORS[Object.keys(map).length % AUTO_COLORS.length];
      }
    });
    return map;
  }, [records]);
  const brands = Object.keys(brandMap);

  // Per-brand stats: for each brand, get sorted records and compute transactions between consecutive
  const brandStats = useMemo(() => {
    return brands.map(brand => {
      const sorted = [...records]
        .filter(r => r.competition === brand)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const txnSeries = sorted.map((r, i) => {
        if (i === 0) return { ...r, txn: null };
        const prev = sorted[i - 1];
        return { ...r, txn: Math.max(0, r.serial - prev.serial) };
      }).filter(r => r.txn !== null);

      const total = txnSeries.reduce((s, r) => s + r.txn, 0);
      const lastTxn = txnSeries[txnSeries.length - 1]?.txn || 0;
      const prevTxn = txnSeries[txnSeries.length - 2]?.txn || 0;
      const growth = prevTxn > 0 ? ((lastTxn - prevTxn) / prevTxn) * 100 : 0;
      const color = brandMap[brand];
      return { brand, color, total, lastTxn, growth, txnSeries, count: sorted.length, onlyOneReading: sorted.length === 1 };
    }).sort((a, b) => b.total - a.total);
  }, [records, brands, brandMap]);

  const totalTxns = brandStats.reduce((s, b) => s + b.total, 0);
  const totalAll = totalTxns || 1;

  // Monthly trend data - grouped by YYYY-MM with readable month names
  const monthlyData = useMemo(() => {
    const months = {};
    brandStats.forEach(b => {
      b.txnSeries.forEach(r => {
        const monthKey = r.date.substring(0, 7);
        const monthLabel = format(parseISO(r.date), 'MMM yy', { locale: es });
        if (!months[monthKey]) months[monthKey] = { month: monthLabel, key: monthKey };
        months[monthKey][b.brand] = (months[monthKey][b.brand] || 0) + r.txn;
      });
    });
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
  }, [brandStats]);

  const topBrand = brandStats[0];
  const fastestGrowing = [...brandStats].sort((a, b) => b.growth - a.growth)[0];
  const insights = [
    fastestGrowing && fastestGrowing.growth > 5 && `${fastestGrowing.brand} incrementó su actividad ${fastestGrowing.growth.toFixed(0)}% en la última toma.`,
    topBrand && `${topBrand.brand} lidera con ${topBrand.total.toLocaleString('es-CO')} transacciones estimadas.`,
    brandStats.some(b => b.growth < -10) && `${brandStats.find(b => b.growth < -10)?.brand} presenta desaceleración comercial.`,
    brandStats.length >= 3 && 'Alta presión competitiva detectada en el entorno.'
  ].filter(Boolean);

  const activeInsight = insights[0] || 'Sin datos suficientes para generar análisis.';

  // Last-reading comparison data for bar chart
  const lastReadingData = brandStats
    .filter(b => !b.onlyOneReading)
    .map(b => ({ brand: b.brand, value: b.lastTxn, color: b.color }));

  // Pie data
  const pieData = brandStats
    .filter(b => b.total > 0)
    .map(b => ({ name: b.brand, value: b.total, color: b.color }));

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all">
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white/80 transition-all"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
              <History className="w-3.5 h-3.5"/> Historial
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px rgba(52,211,153,0.7)' }}/>
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider">ACTIVO</span>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 2px 12px rgba(194,24,117,0.25)' }}>
              <Plus className="w-3.5 h-3.5"/> Nueva Toma
            </button>
          </div>
        </motion.div>

        {/* ── NOVA BANNER ── */}
        {insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            className="mb-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: SOFT_BG, border: '1px solid rgba(194,24,117,0.12)', boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(194,24,117,0.08)' }}>
              <Zap className="w-4 h-4" style={{ color: '#C21875' }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8.5px] font-black tracking-widest uppercase mb-0.5" style={{ color: '#C21875' }}>NOVA AI · ANÁLISIS AUTOMÁTICO</p>
              <p className="text-sm font-medium text-slate-600 truncate">{activeInsight}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0"/>
          </motion.div>
        )}

        {records.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(194,24,117,0.07)', border: '1px solid rgba(194,24,117,0.12)' }}>
              <Activity className="w-8 h-8" style={{ color: '#C21875' }}/>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Sin datos de inteligencia</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">
              Registra la primera toma de seriales para activar el radar de mercado.
            </p>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }}>
              <Plus className="w-4 h-4"/> Registrar Primera Toma
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── ROW 1: KPI CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: 'Total Transacciones', value: totalTxns.toLocaleString('es-CO'),
                  sub: `${records.length} tomas registradas`,
                  color: '#C21875', icon: Activity,
                  tip: 'Suma de todas las transacciones estimadas de todos los competidores registrados. Se calcula restando seriales consecutivos.'
                },
                {
                  label: 'Marcas Monitoreadas', value: brands.length,
                  sub: `${brandStats.filter(b=>!b.onlyOneReading).length} con datos completos`,
                  color: '#9333ea', icon: Zap,
                  tip: 'Cantidad de marcas de competencia que estás monitoreando actualmente.'
                },
                {
                  label: 'Líder del Período', value: topBrand?.brand || '—',
                  sub: topBrand ? `${topBrand.total.toLocaleString('es-CO')} txn totales` : 'Sin datos',
                  color: '#e11d48', icon: TrendingUp,
                  tip: 'La marca con mayor volumen de transacciones estimadas en el período total de seguimiento.'
                },
                {
                  label: 'Mayor Crecimiento', value: fastestGrowing && fastestGrowing.growth > 0 ? `+${fastestGrowing.growth.toFixed(0)}%` : '—',
                  sub: fastestGrowing && fastestGrowing.growth > 0 ? fastestGrowing.brand : 'Sin tendencia',
                  color: '#059669', icon: TrendingUp,
                  tip: 'Marca que más creció entre su penúltima y última toma. Un número alto indica que esa marca está acelerando su actividad.'
                }
              ].map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.04 }}
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-6 translate-x-6"
                    style={{ background: kpi.color }}/>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}12` }}>
                      <kpi.icon className="w-4 h-4" style={{ color: kpi.color }}/>
                    </div>
                    <InfoTooltip text={kpi.tip}/>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{kpi.label}</p>
                  <p className="text-xl font-black tracking-tight truncate" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── ROW 2: ÁREA MENSUAL + PIE CHART ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

              {/* Tendencia mensual — área */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="lg:col-span-3 rounded-2xl p-5"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Evolución Mensual de Transacciones</p>
                  <InfoTooltip text="Línea de evolución mensual de cada marca. Te permite ver si una marca está creciendo o bajando su actividad mes a mes. Las fechas muestran el mes en que se registró la toma."/>
                </div>
                <div className="flex flex-wrap gap-3 mb-3 mt-1">
                  {brandStats.map(b => (
                    <div key={b.brand} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: b.color }}/>
                      <span className="text-[10px] font-semibold text-slate-500">{b.brand}</span>
                    </div>
                  ))}
                </div>
                {monthlyData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        {brandStats.map(b => (
                          <linearGradient key={b.brand} id={`ag_${b.brand.replace(/[^a-z0-9]/gi,'_')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={b.color} stopOpacity={0.18}/>
                            <stop offset="100%" stopColor={b.color} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.07)" vertical={false}/>
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={32}/>
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.15)', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                        cursor={{ stroke: 'rgba(194,24,117,0.15)', strokeWidth: 1 }}
                        formatter={(val, name) => [val?.toLocaleString('es-CO') + ' txn', name]}
                      />
                      {brandStats.map(b => (
                        <Area key={b.brand} type="monotone" dataKey={b.brand}
                          stroke={b.color} strokeWidth={2.5}
                          fill={`url(#ag_${b.brand.replace(/[^a-z0-9]/gi,'_')})`}
                          dot={{ fill: b.color, r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}/>
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.07)' }}>
                      <Activity className="w-5 h-5" style={{ color: '#C21875' }}/>
                    </div>
                    <p className="text-xs text-slate-300 text-center">Registra 2 tomas por marca para ver la evolución</p>
                  </div>
                )}
              </motion.div>

              {/* Cuota de mercado — donut */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                className="lg:col-span-2 rounded-2xl p-5 flex flex-col"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Cuota de Mercado</p>
                  <InfoTooltip text="Qué porcentaje del total de transacciones detectadas representa cada marca. Cuanto más grande el trozo, más activa esa marca en el entorno."/>
                </div>
                {pieData.length >= 2 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={44} outerRadius={72}
                          strokeWidth={2} stroke="#fff">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.15)', borderRadius: 12, fontSize: 11 }}
                          formatter={(val, name) => [`${((val/totalAll)*100).toFixed(1)}% · ${val.toLocaleString('es-CO')} txn`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-1">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }}/>
                          <span className="text-[10px] font-semibold text-slate-600 flex-1 truncate">{d.name}</span>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: d.color }}>
                            {((d.value / totalAll) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-slate-300 text-center">2+ marcas con datos para ver cuota</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── ROW 3: BARRAS POR MES + ÚLTIMA TOMA ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

              {/* Barras agrupadas por mes */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                className="rounded-2xl p-5"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Transacciones por Mes</p>
                  <InfoTooltip text="Barras agrupadas por mes. Cada color es una marca. Permite comparar cuál fue más activa en cada mes específico del año."/>
                </div>
                <p className="text-[10px] text-slate-300 mb-3">Comparación mensual · {monthlyData.length} meses registrados</p>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyData} barCategoryGap="28%" barGap={1}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.07)" vertical={false}/>
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={28}/>
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.15)', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                        cursor={{ fill: 'rgba(194,24,117,0.04)' }}
                        formatter={(val, name) => [val?.toLocaleString('es-CO') + ' txn', name]}
                      />
                      {brandStats.map(b => (
                        <Bar key={b.brand} dataKey={b.brand} fill={b.color} radius={[3, 3, 0, 0]} maxBarSize={28}/>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center">
                    <p className="text-xs text-slate-300">Sin datos mensuales aún</p>
                  </div>
                )}
              </motion.div>

              {/* Comparación última toma */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
                className="rounded-2xl p-5"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Última Toma · Transacciones</p>
                  <InfoTooltip text="Cuántas transacciones registró cada marca en su toma más reciente. Te dice quién fue más activo en el período más reciente que monitoreaste."/>
                </div>
                <p className="text-[10px] text-slate-300 mb-3">Actividad en el período más reciente por marca</p>
                {lastReadingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={lastReadingData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.07)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                      <YAxis type="category" dataKey="brand" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={70}/>
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,24,117,0.15)', borderRadius: 12, fontSize: 11 }}
                        formatter={(val, name) => [val?.toLocaleString('es-CO') + ' txn', 'Última toma']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {lastReadingData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center">
                    <p className="text-xs text-slate-300">Registra 2 tomas para comparar</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── ROW 4: PARTICIPACIÓN + RANKING ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

              {/* Barras de participación */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                className="rounded-2xl p-5"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Participación Acumulada</p>
                  <InfoTooltip text="Del 100% de todas las transacciones detectadas en el período total, ¿cuánto representa cada marca? La barra más larga es el líder de tráfico en la zona."/>
                </div>
                <div className="space-y-3 mt-4">
                  {brandStats.map((b, i) => {
                    const pct = totalAll > 1 ? (b.total / totalAll) * 100 : 0;
                    return (
                      <div key={b.brand}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-white text-[9px]"
                              style={{ background: b.color }}>{getInitial(b.brand)}</div>
                            <span className="text-xs font-semibold text-slate-700">{b.brand}</span>
                            {i === 0 && <span className="text-[7px] font-black px-1 py-0.5 rounded-full text-white" style={{ background: '#f59e0b' }}>LÍDER</span>}
                          </div>
                          {b.onlyOneReading
                            ? <span className="text-[9px] text-slate-300 italic">2ª toma pendiente</span>
                            : <span className="text-xs font-black tabular-nums" style={{ color: b.color }}>{pct.toFixed(1)}%</span>}
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.07)' }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: b.onlyOneReading ? '2%' : `${Math.max(pct, 1)}%` }}
                            transition={{ duration: 1.1, delay: 0.4 + i * 0.08, ease: [0.23,1,0.32,1] }}
                            style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}90, ${b.color})` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tarjetas de marca */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                className="rounded-2xl p-5"
                style={{ background: SOFT_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">Resumen por Marca</p>
                  <InfoTooltip text="Vista consolidada de cada marca: total de transacciones acumuladas, número de tomas realizadas, y tendencia respecto a la toma anterior."/>
                </div>
                <div className="space-y-2">
                  {brandStats.map((b, i) => (
                    <div key={b.brand} className="flex items-center gap-3 rounded-xl p-2.5"
                      style={{ background: `${b.color}06`, border: `1px solid ${b.color}14` }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${b.color}cc, ${b.color})` }}>
                        {getInitial(b.brand)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700 truncate">{b.brand}</span>
                          <span className="text-[8px] font-black text-slate-300">·</span>
                          <span className="text-[9px] text-slate-400">{b.count} toma{b.count !== 1 ? 's' : ''}</span>
                        </div>
                        {b.onlyOneReading
                          ? <p className="text-[9px] text-slate-300 italic">Registra 2ª toma</p>
                          : <p className="text-[9px] text-slate-400">Últ. toma: <span className="font-bold text-slate-600">{b.lastTxn.toLocaleString('es-CO')} txn</span></p>
                        }
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {!b.onlyOneReading && (
                          <>
                            <span className="text-sm font-black tabular-nums" style={{ color: b.color }}>
                              {b.total.toLocaleString('es-CO')}
                            </span>
                            <TrendBadge pct={b.growth}/>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── ROW 5: AI INSIGHTS ── */}
            {insights.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.04), rgba(233,29,72,0.03))', border: '1px solid rgba(194,24,117,0.10)', boxShadow: CARD_SHADOW }}>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#C21875' }}>Insights Automáticos · Nova AI</p>
                  <InfoTooltip text="Alertas y análisis generados automáticamente. Detecta marcas en aceleración, desaceleración o presión competitiva alta en tu entorno."/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(194,24,117,0.08)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#C21875,#e11d48)' }}>{i+1}</div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <HistorialModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        records={records}
        brandMap={brandMap}
        onDelete={(id) => remove.mutate(id)}
        onEdit={(id, data) => update.mutate({ id, data })}
      />

      <NuevaTomaModa
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={data => create.mutate(data)}
        brands={brands}
        records={records}
      />
    </div>
  );
}