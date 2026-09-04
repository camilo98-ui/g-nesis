import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Activity, ArrowLeft, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import SidebarNav from '@/components/SidebarNav';
import { NuevaTomaModal, HistorialModal } from '@/components/radar/RadarModals';
import { AUTO_COLORS } from '@/components/radar/RadarShared';
import RadarFilters from '@/components/radar/RadarFilters';
import PositionHero from '@/components/radar/PositionHero';
import TakesEvolution from '@/components/radar/TakesEvolution';
import DuelsSection from '@/components/radar/DuelsSection';
import ThreatRadar from '@/components/radar/ThreatRadar';
import ShareSection from '@/components/radar/ShareSection';
import StoreMatrix from '@/components/radar/StoreMatrix';
import QuadrantMatrix from '@/components/radar/QuadrantMatrix';
import ExecutivePanel from '@/components/radar/ExecutivePanel';
import TakesDetailTable from '@/components/radar/TakesDetailTable';
import {
  buildReadings, buildFilterOptions, takesForFilters, computeDashboard,
} from '@/components/radar/radarModel';

const Skeleton = ({ h = 180, className = '' }) => (
  <div className={`glass-card rounded-2xl overflow-hidden relative ${className}`}>
    <div className="w-full shimmer" style={{ height: h, background: '#fce7f3' }} />
  </div>
);

export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [filtersOverride, setFiltersOverride] = useState(null);
  const qc = useQueryClient();

  const session = (() => { try { return JSON.parse(localStorage.getItem('popsySession') || '{}'); } catch { return {}; } })();
  const activeStore = session.store || '';

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['competitiveRecords'],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 500)
  });

  // Registros visibles para el líder de tienda (captura e historial sin cambios)
  const records = activeStore
    ? allRecords.filter(r => !r.store_id || r.store_id === activeStore)
    : allRecords;

  const remove = useMutation({ mutationFn: id => base44.entities.CompetitiveRecord.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.CompetitiveRecord.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const create = useMutation({
    mutationFn: data => base44.entities.CompetitiveRecord.create({ ...data, store_id: activeStore }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); }
  });

  // ── Modelo de análisis (lecturas normalizadas con transacciones por serial) ──
  const readings = useMemo(() => buildReadings(allRecords), [allRecords]);
  const options = useMemo(() => buildFilterOptions(readings), [readings]);

  const defaultFilters = useMemo(() => {
    const years = options.years;
    const year = years[0] ?? new Date().getFullYear();
    const months = [...new Set(readings.filter(r => r.year === year).map(r => r.month))].sort((a, b) => a - b);
    const month = months.length ? months[months.length - 1] : 'ALL';
    return { year, month, take: 'ALL', storeId: activeStore || 'ALL', city: 'ALL', brand: 'ALL' };
  }, [options.years, readings, activeStore]);

  const filters = filtersOverride || defaultFilters;

  const setFilters = (patch) => {
    const base = { ...filters, ...patch };
    if (patch.year !== undefined && patch.year !== filters.year) {
      const months = [...new Set(readings.filter(r => r.year === base.year).map(r => r.month))].sort((a, b) => a - b);
      base.month = months.length ? months[months.length - 1] : 'ALL';
      base.take = 'ALL';
    }
    if (patch.month !== undefined || patch.storeId !== undefined || patch.city !== undefined) base.take = 'ALL';
    setFiltersOverride(base);
  };

  const takes = useMemo(() => takesForFilters(readings, filters), [readings, filters]);
  const model = useMemo(() => computeDashboard(readings, filters), [readings, filters]);

  const brands = useMemo(() => [...new Set(records.map(r => r.competition).filter(Boolean))], [records]);
  const brandMap = useMemo(() => {
    const map = {};
    records.forEach(r => { if (!map[r.competition]) map[r.competition] = AUTO_COLORS[Object.keys(map).length % AUTO_COLORS.length]; });
    return map;
  }, [records]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <SidebarNav />
      <div className="flex-1 relative z-10 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: '#C21875' }} />
                </div>
                <p className="text-[9px] font-black tracking-[0.24em] uppercase text-slate-500">POPSY · INTELIGENCIA COMPETITIVA</p>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Radar <span className="text-premium" style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Competitivo</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHistorialOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all glass-card">
              <History className="w-3.5 h-3.5" /> Historial
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider">ACTIVO</span>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 btn-glow"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 6px 20px rgba(194,24,117,0.3)' }}>
              <Plus className="w-3.5 h-3.5" /> Nueva Toma
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton h={72} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Skeleton h={210} />
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={118} />)}
              </div>
            </div>
            <Skeleton h={300} />
            <Skeleton h={240} />
          </div>
        ) : readings.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="glass-card rounded-3xl flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.1), rgba(194,24,117,0.03))', border: '1px solid rgba(194,24,117,0.08)' }}>
              <Activity className="w-10 h-10" style={{ color: '#C21875' }} />
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-2">Sin datos de inteligencia</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">Registra la primera toma de seriales para activar el radar de mercado.</p>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-glow"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 6px 20px rgba(194,24,117,0.3)' }}>
              <Plus className="w-4 h-4" /> Registrar Primera Toma
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── FILTROS GLOBALES ── */}
            <RadarFilters filters={filters} setFilters={setFilters} options={options} takes={takes}
              hasData={readings.length > 0} onReset={() => setFiltersOverride(null)} />

            {/* 01-02 · POSICIÓN COMPETITIVA + KPIs */}
            <PositionHero model={model} />

            {/* 03 · EVOLUCIÓN POR TOMAS / MENSUAL */}
            <div className="mb-4">
              <TakesEvolution model={model} />
            </div>

            {/* 04 · DUELOS + 05 · RADAR DE AMENAZAS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              <DuelsSection model={model} />
              <ThreatRadar model={model} />
            </div>

            {/* 06 · PARTICIPACIÓN + 07 · MAPA POR TIENDA */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              <ShareSection model={model} />
              <StoreMatrix model={model} />
            </div>

            {/* 08 · MATRIZ DE COMPETITIVIDAD */}
            <div className="mb-4">
              <QuadrantMatrix model={model} />
            </div>

            {/* 09-10 · LECTURA EJECUTIVA + RECOMENDACIÓN */}
            <ExecutivePanel model={model} />

            {/* 11 · DETALLE POR TOMAS */}
            <TakesDetailTable model={model} />
          </>
        )}

        <HistorialModal open={historialOpen} onClose={() => setHistorialOpen(false)} records={records} brandMap={brandMap}
          onDelete={id => remove.mutate(id)} onEdit={(id, data) => update.mutate({ id, data })} />
        <NuevaTomaModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={data => create.mutate(data)} brands={brands} records={records} />
      </div>
    </div>
  );
}