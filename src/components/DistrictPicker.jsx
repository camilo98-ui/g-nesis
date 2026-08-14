import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Paso 1 del login: selector limpio de distrito antes de elegir tienda.
export default function DistrictPicker({ selectedDistrict, onDistrictChange }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.Store.list('-created_date', 1000)
      .then((stores) => {
        const set = new Set();
        stores.forEach((s) => {
          if (s.district) set.add(s.district);
        });
        // Incluir siempre el distrito base por defecto aunque no venga en DB
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

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-[10px] font-bold">1</span>
          Selecciona tu distrito
        </label>
        {selectedDistrict && (
          <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {selectedDistrict}
          </span>
        )}
      </div>

      {districts.length > 6 && (
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar distrito..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-white/80 border-2 border-rose-200/60 rounded-xl focus:border-rose-400 outline-none placeholder:text-slate-400 font-medium"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-rose-400" /> Cargando distritos...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {filtered.map((d) => {
            const sel = selectedDistrict === d;
            return (
              <motion.button
                key={d}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onDistrictChange(d)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold border-2 transition-all ${
                  sel
                    ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white border-pink-300 shadow-md shadow-rose-200/50'
                    : 'bg-white/80 border-rose-200/60 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${sel ? 'text-white' : 'text-rose-400'}`} />
                <span className="truncate flex-1">{d}</span>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
              No se encontró "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}