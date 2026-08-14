import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Smile, Info, Save, Check, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import NPSGauge, { getNPSStatus } from '@/components/nps/NPSGauge';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function normalizeCode(v) {
  if (v == null) return '';
  return String(v).toUpperCase().replace(/\s+/g, ' ').trim();
}

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

export default function NPS() {
  const queryClient = useQueryClient();
  const district = getSessionDistrict();
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const [view, setView] = useState('distrito'); // 'distrito' | 'tienda'
  const [trendYear, setTrendYear] = useState(curYear);

  const { data: allStores = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list('-created_date', 1000),
    staleTime: 60 * 60 * 1000,
  });

  const { data: allNps = [], isLoading } = useQuery({
    queryKey: ['all-nps'],
    queryFn: () => base44.entities.StoreNPS.list('-created_date', 500),
    staleTime: 60 * 1000,
  });

  const districtStores = useMemo(
    () => allStores.filter((s) => (s.district || 'BOGOTA NOROCCIDENTE') === district),
    [allStores, district]
  );

  // NPS vigente por tienda (mes actual, o el último registrado)
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

  const scores = districtStores
    .map((s) => Number(npsByStore[s.code]?.rec?.score) || 0)
    .filter((v) => v > 0);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Tendencia mensual del distrito (promedio) + líneas por tienda, para el año seleccionado
  const trendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const districtCodes = districtStores.map((s) => normalizeCode(s.code));
    return months.map((m) => {
      const entry = { month: MONTHS[m - 1] };
      let sum = 0, count = 0;
      districtCodes.forEach((code) => {
        const recs = allNps.filter((r) => normalizeCode(r.store_code) === code && Number(r.month) === m && Number(r.year) === trendYear);
        if (recs.length) {
          const latest = recs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
          const v = Number(latest.score);
          if (v > 0) { sum += v; count++; }
        }
      });
      entry['Distrito'] = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
      return entry;
    });
  }, [allNps, districtStores, trendYear]);

  const hasTrendData = trendData.some((d) => d['Distrito'] != null);

  const availableYears = useMemo(() => {
    const yrs = new Set(allNps.map((r) => Number(r.year)).filter(Boolean));
    yrs.add(curYear);
    return Array.from(yrs).sort((a, b) => b - a);
  }, [allNps, curYear]);

  const saveMutation = useMutation({
    mutationFn: async ({ storeCode, score }) => {
      const existing = npsByStore[storeCode]?.rec;
      const payload = { store_code: storeCode, score: Number(score), month: curMonth, year: curYear };
      if (existing) return base44.entities.StoreNPS.update(existing.id, payload);
      return base44.entities.StoreNPS.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-nps'] }),
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Salud del Distrito</h1>
          <Info className="w-4 h-4 text-slate-400" />
        </div>
        {/* Toggle Distrito / Tienda */}
        <div className="inline-flex p-1 rounded-full bg-slate-100 shadow-inner">
          {['distrito', 'tienda'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                view === v ? 'bg-white text-slate-900 shadow' : 'text-slate-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Gauge card */}
      <div
        className="rounded-2xl p-6 mb-5 flex flex-col items-center"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
      >
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : (
          <NPSGauge score={avg} size={260} label={view === 'distrito' ? 'Promedio del Distrito' : 'Resumen'} />
        )}
        <p className="text-[11px] text-slate-400 mt-2">
          Rangos: 6–9 Bueno · 5–6 Estable · &lt;5 Malo
        </p>
      </div>

      {/* Tendencia mensual NPS */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-800">Tendencia NPS del Distrito</h2>
          </div>
          <select
            value={trendYear}
            onChange={(e) => setTrendYear(Number(e.target.value))}
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:border-rose-400 focus:outline-none bg-white"
          >
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {!hasTrendData ? (
          <p className="py-10 text-center text-sm text-slate-400">Sin datos de NPS para {trendYear}.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                formatter={(v) => v == null ? '—' : Number(v).toFixed(1)}
                labelStyle={{ fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey="Distrito"
                stroke="#C21875"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#C21875' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla de tiendas para subir NPS */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
      >
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">NPS por tienda · {district || 'Distrito'}</h2>
          <span className="text-[11px] text-slate-400">{districtStores.length} tiendas</span>
        </div>

        <div className="divide-y divide-slate-50">
          {districtStores.length === 0 && !isLoading && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No hay tiendas en este distrito.</p>
          )}
          {districtStores.map((store) => {
            const rec = npsByStore[store.code]?.rec;
            const score = rec ? Number(rec.score) : 0;
            const status = getNPSStatus(score);
            const isCurrent = npsByStore[store.code]?.current;
            return (
              <NPSRow
                key={store.id}
                store={store}
                score={score}
                status={status}
                isCurrent={isCurrent}
                saving={saveMutation.isPending}
                onSave={(val) => saveMutation.mutate({ storeCode: store.code, score: val })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NPSRow({ store, score, status, isCurrent, saving, onSave }) {
  const [val, setVal] = useState(score ? String(score) : '');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => { setVal(score ? String(score) : ''); }, [score]);

  const handleSave = () => {
    const n = Math.max(0, Math.min(10, Number(val) || 0));
    if (!n) return;
    onSave(n);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${status.color}15` }}>
        {score > 0 ? status.face : '➖'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{store.code} · {store.name}</p>
        <p className="text-[11px] text-slate-400">
          {score > 0 ? `NPS ${score.toFixed(1).replace('.', ',')}/10 · ${status.label}${isCurrent ? ' · mes actual' : ''}` : 'Sin NPS registrado'}
        </p>
      </div>
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="0-10"
        className="w-20 h-9 px-2 rounded-lg border border-slate-200 text-sm font-bold text-center text-slate-800 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
      />
      <button
        onClick={handleSave}
        disabled={saving || !val}
        className="h-9 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40"
      >
        {saved ? <><Check className="w-3.5 h-3.5" /> Listo</> : <><Save className="w-3.5 h-3.5" /> Subir</>}
      </button>
    </div>
  );
}