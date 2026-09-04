import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Activity, History, Calendar, ChevronDown, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import SidebarNav from '@/components/SidebarNav';
import { AUTO_COLORS } from '@/components/radar/RadarShared';
import { NuevaTomaModal, HistorialModal } from '@/components/radar/RadarModals';
import { MonthlyEvolution, MarketShareDonut } from '@/components/radar/RadarTrendCharts';
import { CompetitiveTable } from '@/components/radar/RadarTableInsights';
import BrandSummaryCards from '@/components/radar/BrandSummaryCards';
import GrowthVelocityCards from '@/components/radar/GrowthVelocityCards';
import ParticipationColumnChart from '@/components/radar/ParticipationColumnChart';
import RadarFooter from '@/components/radar/RadarFooter';

const POPSY_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const qc = useQueryClient();

  const session = (() => { try { return JSON.parse(localStorage.getItem('popsySession') || '{}'); } catch { return {}; } })();
  const activeStore = session.store || '';

  const { data: allRecords = [] } = useQuery({
    queryKey: ['competitiveRecords'],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 500)
  });

  const records = activeStore
    ? allRecords.filter(r => !r.store_id || r.store_id === activeStore)
    : allRecords;

  const availableMonths = useMemo(() => {
    const set = new Set(records.map(r => (r.date || '').substring(0, 7)).filter(Boolean));
    return [...set].sort().reverse().map(key => ({
      key,
      label: format(parseISO(`${key}-01`), 'MMMM yyyy', { locale: es })
    }));
  }, [allRecords, activeStore]);

  const scopedRecords = useMemo(
    () => selectedMonthKey ? records.filter(r => (r.date || '').substring(0, 7) === selectedMonthKey) : records,
    [allRecords, activeStore, selectedMonthKey]);

  const remove = useMutation({ mutationFn: id => base44.entities.CompetitiveRecord.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.CompetitiveRecord.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['competitiveRecords'] }) });
  const create = useMutation({
    mutationFn: data => base44.entities.CompetitiveRecord.create({ ...data, store_id: activeStore }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); }
  });

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
      const growthSeries = txnSeries.slice(1).map((r, i) => {
        const prev = txnSeries[i].txn;
        return { date: r.date, pct: prev > 0 ? ((r.txn - prev) / prev) * 100 : 0 };
      });
      return { brand, color, total, lastTxn, growth, txnSeries, growthSeries, count: sorted.length, onlyOneReading: sorted.length === 1 };
    }).sort((a, b) => b.total - a.total);
  }, [records, brands, brandMap]);

  const scopedStats = useMemo(() => {
    if (!selectedMonthKey) return brandStats;
    return brandStats.map(b => {
      const txnSeries = b.txnSeries.filter(r => (r.date || '').substring(0, 7) === selectedMonthKey);
      if (!txnSeries.length) return null;
      const total = txnSeries.reduce((s, r) => s + r.txn, 0);
      const lastTxn = txnSeries[txnSeries.length - 1]?.txn || 0;
      const prevTxn = txnSeries[txnSeries.length - 2]?.txn || 0;
      const growth = prevTxn > 0 ? ((lastTxn - prevTxn) / prevTxn) * 100 : 0;
      const growthSeries = txnSeries.slice(1).map((r, i) => {
        const prev = txnSeries[i].txn;
        return { date: r.date, pct: prev > 0 ? ((r.txn - prev) / prev) * 100 : 0 };
      });
      return { ...b, txnSeries, total, lastTxn, growth, growthSeries, count: txnSeries.length };
    }).filter(Boolean).sort((a, b) => b.total - a.total);
  }, [brandStats, selectedMonthKey]);

  const totalAll = Math.max(scopedStats.reduce((s, b) => s + b.total, 0), 1);

  const monthlyData = useMemo(() => {
    const months = {};
    scopedStats.forEach(b => {
      b.txnSeries.forEach(r => {
        const key = r.date.substring(0, 7);
        const label = format(parseISO(r.date), 'MMM yy', { locale: es });
        if (!months[key]) months[key] = { month: label, key };
        months[key][b.brand] = (months[key][b.brand] || 0) + r.txn;
      });
    });
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
  }, [scopedStats]);

  const pieData = scopedStats.filter(b => b.total > 0).map(b => ({ name: b.brand, value: b.total, color: b.color }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <SidebarNav />
      <div className="flex-1 relative z-10 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen">

        {/* ── PREMIUM HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23,1,0.32,1] }}
          className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/"
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: '#ffffff', boxShadow: '0 4px 16px rgba(194,24,117,0.12)', border: '1px solid rgba(194,24,117,0.08)' }}>
              <img src={POPSY_LOGO} alt="Popsy" className="w-9 h-9 object-contain"/>
            </Link>
            <div>
              <p className="text-lg font-black text-slate-800 tracking-tight leading-none">Popsy</p>
              <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-rose-400 mt-1">El placer de hacer tu día</p>
            </div>
          </div>

          <div className="text-center flex-1 min-w-0 order-last xl:order-none">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Transacciones por Toma</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Evolución, participación y crecimiento del mercado competitivo</p>
            <p className="hidden xl:block italic text-[11px] text-rose-300 mt-1" style={{ fontFamily: 'Georgia, serif' }}>✦ Más momentos felices</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button onClick={() => setMonthOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all glass-card">
                <Calendar className="w-3.5 h-3.5"/>
                <span className="capitalize">{selectedMonthKey ? availableMonths.find(m => m.key === selectedMonthKey)?.label : 'Todos los meses'}</span>
                <ChevronDown className="w-3 h-3 text-rose-400" style={{ transform: monthOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
              </button>
              <AnimatePresence>
                {monthOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18 }} className="absolute top-full right-0 mt-2 z-50 w-48 max-h-64 overflow-y-auto rounded-2xl p-1.5"
                    style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 12px 40px rgba(194,24,117,0.15)' }}>
                    <button onClick={() => { setSelectedMonthKey(null); setMonthOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-rose-50/60 transition-all">
                      Todos los meses
                      {!selectedMonthKey && <Check className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>}
                    </button>
                    {availableMonths.map(m => (
                      <button key={m.key} onClick={() => { setSelectedMonthKey(m.key); setMonthOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-rose-50/60 capitalize">
                        {m.label}
                        {selectedMonthKey === m.key && <Check className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setHistorialOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all glass-card">
              <History className="w-3.5 h-3.5"/> Historial
            </button>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 btn-glow"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 6px 20px rgba(194,24,117,0.3)' }}>
              <Plus className="w-3.5 h-3.5"/> Nueva Toma
            </button>
          </div>
        </motion.div>

        {records.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.1), rgba(194,24,117,0.03))', border: '1px solid rgba(194,24,117,0.08)' }}>
              <Activity className="w-10 h-10" style={{ color: '#C21875' }}/>
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-2">Sin datos de inteligencia</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">Registra la primera toma de seriales para activar el radar de mercado.</p>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-glow"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 6px 20px rgba(194,24,117,0.3)' }}>
              <Plus className="w-4 h-4"/> Registrar Primera Toma
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── ROW 1: BRAND SUMMARY CARDS ── */}
            <BrandSummaryCards brandStats={scopedStats}/>

            {/* ── ROW 2: EVOLUTION CHART + MARKET SHARE DONUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2 min-w-0">
                <MonthlyEvolution brandStats={scopedStats} monthlyData={monthlyData}/>
              </div>
              <MarketShareDonut pieData={pieData} totalAll={totalAll}/>
            </div>

            {/* ── ROW 3: GROWTH VELOCITY CARDS + PARTICIPATION CHART ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2 min-w-0">
                <GrowthVelocityCards brandStats={scopedStats}/>
              </div>
              <ParticipationColumnChart brandStats={scopedStats} totalAll={totalAll}/>
            </div>

            {/* ── ROW 4: COMPETITIVE TABLE ── */}
            <CompetitiveTable brandStats={scopedStats} totalAll={totalAll}/>

            {/* ── FOOTER ── */}
            <RadarFooter/>
          </>
        )}

        <HistorialModal open={historialOpen} onClose={() => setHistorialOpen(false)} records={records} brandMap={brandMap}
          onDelete={id => remove.mutate(id)} onEdit={(id, data) => update.mutate({ id, data })}/>
        <NuevaTomaModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={data => create.mutate(data)} brands={brands} records={records}/>
      </div>
    </div>
  );
}