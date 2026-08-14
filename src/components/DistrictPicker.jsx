import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, Check, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Selector premium de distrito (dropdown con búsqueda) — Paso 01 del login.
export default function DistrictPicker({ selectedDistrict, onDistrictChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Store.list('-created_date', 1000)
      .then((stores) => {
        const set = new Set();
        stores.forEach((s) => { if (s.district) set.add(s.district); });
        set.add('BOGOTA NOROCCIDENTE');
        setDistricts(Array.from(set).sort());
      })
      .catch(() => setDistricts(['BOGOTA NOROCCIDENTE']))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return districts;
    const t = search.toLowerCase().trim();
    return districts.filter((d) => d.toLowerCase().includes(t));
  }, [districts, search]);

  const handleSelect = (d) => {
    onDistrictChange(d);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 px-4 rounded-xl border-2 flex items-center justify-between transition-all bg-white/80 backdrop-blur-sm ${selectedDistrict ? 'border-rose-400 shadow-sm shadow-rose-100' : 'border-rose-200/60 hover:border-rose-300'}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedDistrict ? 'text-rose-500' : 'text-slate-400'}`} />
          <span className={`text-sm font-semibold truncate ${selectedDistrict ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedDistrict || 'Selecciona tu distrito'}
          </span>
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          {selectedDistrict && <Check className="w-4 h-4 text-rose-500" strokeWidth={3} />}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-rose-100 p-2.5"
            >
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar distrito..."
                  className="w-full h-9 pl-9 pr-3 text-sm bg-rose-50/50 border border-rose-100 rounded-lg focus:border-rose-300 focus:outline-none placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-rose-400" /> Cargando distritos...
                  </div>
                ) : filtered.map((d) => {
                  const sel = selectedDistrict === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelect(d)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${sel ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 font-bold' : 'text-slate-700 hover:bg-rose-50/60 font-medium'}`}
                    >
                      <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${sel ? 'text-rose-500' : 'text-slate-300'}`} />
                      <span className="truncate flex-1">{d}</span>
                      {sel && <Check className="w-4 h-4 text-rose-500" strokeWidth={3} />}
                    </button>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">No se encontró "{search}"</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}