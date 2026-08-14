import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save, Check, Smile } from 'lucide-react';
import { getNPSStatus } from './NPSGauge';

function getSessionDistrict() {
  try {
    const raw = localStorage.getItem('popsySession');
    if (!raw) return '';
    const s = JSON.parse(raw);
    return s.district || '';
  } catch {
    return '';
  }
}

export default function NPSUploadModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const district = getSessionDistrict();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const [saved, setSaved] = useState(false);

  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date', 1000),
    staleTime: 60 * 60 * 1000,
    enabled: open,
  });

  const { data: allNps = [], isLoading } = useQuery({
    queryKey: ['all-nps'],
    queryFn: () => base44.entities.StoreNPS.list('-created_date', 500),
    staleTime: 30 * 1000,
    enabled: open,
  });

  const districtStores = useMemo(
    () => allStores.filter((s) => (s.district || 'BOGOTA NOROCCIDENTE') === district),
    [allStores, district]
  );

  // Map current NPS record per store
  const npsByStore = useMemo(() => {
    const map = {};
    allNps.forEach((r) => {
      const prev = map[r.store_code];
      const isCurrent = Number(r.month) === curMonth && Number(r.year) === curYear;
      if (!prev) { map[r.store_code] = { rec: r, current: isCurrent }; return; }
      if (isCurrent && !prev.current) { map[r.store_code] = { rec: r, current: true }; return; }
      if (isCurrent === prev.current && new Date(r.created_date) > new Date(prev.rec.created_date)) {
        map[r.store_code] = { rec: r, current: prev.current };
      }
    });
    return map;
  }, [allNps, curMonth, curYear]);

  // Draft scores keyed by store code
  const [draft, setDraft] = useState({});
  const setVal = (code, v) => setDraft((d) => ({ ...d, [code]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ops = Object.entries(draft)
        .filter(([, v]) => v !== '' && !isNaN(Number(v)))
        .map(([code, v]) => ({ code, score: Math.max(0, Math.min(10, Number(v))) }));
      const results = [];
      for (const { code, score } of ops) {
        const existing = npsByStore[code]?.rec;
        const payload = { store_code: code, score, month: curMonth, year: curYear };
        try {
          if (existing) await base44.entities.StoreNPS.update(existing.id, payload);
          else await base44.entities.StoreNPS.create(payload);
          results.push({ code, ok: true });
        } catch (e) {
          results.push({ code, ok: false });
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-nps'] });
      queryClient.invalidateQueries({ queryKey: ['store-nps'] });
      setDraft({});
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    },
  });

  const filledCount = Object.values(draft).filter((v) => v !== '' && !isNaN(Number(v))).length;
  const storedCount = districtStores.filter((s) => npsByStore[s.code]?.current).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,184,148,0.12)' }}>
                  <Smile className="w-4.5 h-4.5" style={{ color: '#00B894', width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Cargar NPS del Distrito</h2>
                  <p className="text-[11px] text-slate-400">{district || 'Distrito'} · {districtStores.length} tiendas · {storedCount} con NPS del mes</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-rose-400 rounded-full animate-spin" />
                </div>
              ) : districtStores.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No hay tiendas en este distrito.</p>
              ) : (
                <div className="space-y-1.5">
                  {districtStores.map((store) => {
                    const rec = npsByStore[store.code]?.rec;
                    const score = rec ? Number(rec.score) : 0;
                    const status = getNPSStatus(score);
                    const isCurrent = npsByStore[store.code]?.current;
                    const val = draft[store.code] ?? (score ? String(score) : '');
                    return (
                      <div key={store.id} className="px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50/80 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${status.color}15` }}>
                          {score > 0 ? status.face : '➖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-slate-800 truncate">{store.code} · {store.name}</p>
                          <p className="text-[10.5px] text-slate-400">
                            {score > 0
                              ? `Actual: ${score.toFixed(1).replace('.', ',')}${isCurrent ? ' · mes vigente' : ''}`
                              : 'Sin NPS'}
                          </p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={val}
                          onChange={(e) => setVal(store.code, e.target.value)}
                          placeholder="0-10"
                          className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-[13px] font-bold text-center text-slate-800 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                {filledCount > 0 ? `${filledCount} por guardar` : 'Ingresa los puntajes (0-10)'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100">
                  Cancelar
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || filledCount === 0}
                  className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
                  {saveMutation.isPending
                    ? <><Save className="w-3.5 h-3.5" /> Guardando…</>
                    : saved
                      ? <><Check className="w-3.5 h-3.5" /> Guardado</>
                      : <><Save className="w-3.5 h-3.5" /> Guardar NPS</>}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}