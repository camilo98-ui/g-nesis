import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { AUTO_COLORS, getInitial } from './RadarShared';

export function NuevaTomaModal({ open, onClose, onSave, brands, records }) {
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => { reset(); onClose(); }}/>
          <motion.div className="relative z-10 w-full max-w-sm rounded-3xl p-6 bg-white"
            style={{ boxShadow: '0 24px 80px rgba(194,24,117,0.2)', border: '1px solid rgba(194,24,117,0.1)' }}
            initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-xl font-black text-slate-800">Nueva Toma</h2>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-rose-50 transition-all">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Competencia</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBrands.map((b, i) => (
                    <button key={b} onClick={() => setCompetition(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
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
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Serial de Factura</label>
                <input type="number" value={serial} onChange={e => setSerial(e.target.value)} placeholder="Ej: 001240"
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
                    style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.06), #fff)', border: '1px solid rgba(194,24,117,0.1)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Transacciones estimadas</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#C21875' }}>{preview.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)' }}>
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
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30 btn-glow"
                style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 6px 24px rgba(194,24,117,0.3)' }}>
                <Plus className="w-4 h-4 inline mr-1"/> Registrar Toma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HistorialModal({ open, onClose, records, brandMap, onDelete, onEdit }) {
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}/>
          <motion.div className="relative z-10 w-full max-w-lg rounded-3xl bg-white flex flex-col"
            style={{ maxHeight: '85vh', boxShadow: '0 24px 80px rgba(194,24,117,0.2)', border: '1px solid rgba(194,24,117,0.1)' }}
            initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}>
            <div className="flex items-center justify-between p-5 border-b border-rose-50 flex-shrink-0">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-xl font-black text-slate-800">Historial de Tomas</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-rose-50 transition-all"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sorted.length === 0 && <p className="text-sm text-slate-300 text-center py-8">Sin tomas registradas.</p>}
              {sorted.map(r => {
                const color = brandMap[r.competition] || '#C21875';
                const isEditing = editingId === r.id;
                return (
                  <div key={r.id} className="rounded-2xl p-4 transition-all hover-lift"
                    style={{ background: isEditing ? 'rgba(194,24,117,0.04)' : '#fafafa', border: `1px solid ${isEditing ? 'rgba(194,24,117,0.12)' : '#f1f5f9'}` }}>
                    {!isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}>{getInitial(r.competition)}</div>
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