import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks, subMonths,
} from 'date-fns';
import {
  Calendar, RefreshCw, DollarSign, TrendingUp, Target,
  Zap, Receipt, Smile, Activity,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useGerenteData } from '@/components/gerente/useGerenteData';
import ExecutiveKPIs from '@/components/gerente/ExecutiveKPIs';
import AttentionSection from '@/components/gerente/AttentionSection';
import InfoStatusCard from '@/components/gerente/InfoStatusCard';
import StoresTable from '@/components/gerente/StoresTable';
import DriversSection from '@/components/gerente/DriversSection';
import HourlyTransactions from '@/components/gerente/HourlyTransactions';
import IntegralRanking from '@/components/gerente/IntegralRanking';
import InsightOfTheDay from '@/components/gerente/InsightOfTheDay';

const ICON_MAP = { DollarSign, TrendingUp, Target, Zap, Receipt, Smile };

const now0 = new Date();

export default function GerenteDashboard() {
  const [startDate, setStartDate] = useState(startOfMonth(now0));
  const [endDate, setEndDate] = useState(now0);
  const [calOpen, setCalOpen] = useState(false);
  const [pickingEnd, setPickingEnd] = useState(false);

  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('popsySession') || '{}'); } catch { return {}; }
  }, []);
  const district = session.district;

  const data = useGerenteData(district, startDate, endDate);

  const presets = useMemo(() => [
    { label: 'Mes actual', start: startOfMonth(now0), end: now0 },
    { label: 'Semana actual', start: startOfWeek(now0, { weekStartsOn: 1 }), end: now0 },
    { label: 'Semana anterior', start: subWeeks(startOfWeek(now0, { weekStartsOn: 1 }), 1), end: endOfWeek(subWeeks(startOfWeek(now0, { weekStartsOn: 1 }), 1), { weekStartsOn: 1 }) },
    { label: 'Mes anterior', start: startOfMonth(subMonths(now0, 1)), end: endOfMonth(subMonths(now0, 1)) },
  ], []);

  const isPresetActive = (p) => format(startDate, 'ddMMyyyy') === format(p.start, 'ddMMyyyy') && format(endDate, 'ddMMyyyy') === format(p.end, 'ddMMyyyy');

  const kpisWithIcons = data.kpis.map(k => ({ ...k, icon: ICON_MAP[k.icon] || Activity }));

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5 pb-8" style={{ maxWidth: 1500, margin: '0 auto' }}>
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(194,24,117,0.06) 0%, rgba(255,255,255,0.96) 50%)',
          border: '1px solid rgba(194,24,117,0.1)',
          boxShadow: '0 2px 12px rgba(194,24,117,0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(194,24,117,0.1)', border: '1px solid rgba(194,24,117,0.18)' }}>
            <Activity style={{ color: '#C21875', width: 18, height: 18 }} />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-slate-700 uppercase tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Distrito {district || 'Todas'}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {data.storeData.length} tiendas · Actualizado {format(data.lastUpdate, 'HH:mm', { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Presets */}
          <div className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(194,24,117,0.1)' }}>
            {presets.map(p => (
              <button key={p.label} onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: isPresetActive(p) ? 'rgba(194,24,117,0.1)' : 'transparent', color: isPresetActive(p) ? '#C21875' : '#94a3b8' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold rounded-xl h-8"
                style={{ borderColor: 'rgba(194,24,117,0.2)', color: '#C21875' }}>
                <Calendar style={{ width: 12, height: 12 }} />
                {format(startDate, 'dd MMM', { locale: es })} – {format(endDate, 'dd MMM', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <p className="text-[11px] font-bold text-slate-500 mb-2">{pickingEnd ? 'Fecha fin' : 'Fecha inicio'}</p>
              <CalendarComponent mode="single" selected={pickingEnd ? endDate : startDate}
                onSelect={(d) => { if (!d) return; if (!pickingEnd) { setStartDate(d); setPickingEnd(true); } else { setEndDate(d); setPickingEnd(false); setCalOpen(false); } }}
                locale={es} className="rounded-md border" />
            </PopoverContent>
          </Popover>

          {/* Refresh */}
          <button onClick={data.refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #C21875, #e91e8c)', color: '#fff', border: '1px solid rgba(194,24,117,0.3)' }}>
            <RefreshCw style={{ width: 12, height: 12 }} />
            Actualizar
          </button>

          {/* Updated indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600">Datos actualizados</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ EXECUTIVE KPIs ═══ */}
      <ExecutiveKPIs kpis={kpisWithIcons} />

      {/* ═══ ATTENTION + INFO STATUS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AttentionSection items={data.attentionItems} />
        </div>
        <InfoStatusCard sources={data.infoSources} infoIndex={data.infoIndex} />
      </div>

      {/* ═══ STORES TABLE ═══ */}
      <StoresTable stores={data.storeData} onStoreClick={() => {}} />

      {/* ═══ DRIVERS ═══ */}
      <DriversSection drivers={data.drivers} />

      {/* ═══ HOURLY + RANKING ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HourlyTransactions
            hourlyData={data.hourlyData}
            stores={data.stores}
            selectedStore={data.selectedHourlyStore}
            onSelectStore={data.setSelectedHourlyStore}
          />
        </div>
        <IntegralRanking ranking={data.ranking} />
      </div>

      {/* ═══ INSIGHT OF THE DAY ═══ */}
      <InsightOfTheDay insight={data.insight} />
    </div>
  );
}