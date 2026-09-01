import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks, subMonths,
} from 'date-fns';
import {
  Calendar, RefreshCw, Activity, Zap, Truck, BarChart3, Receipt,
  Store, Globe, ChevronDown, CalendarDays,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useGerenteData } from '@/components/gerente/useGerenteData';
import PYGView from '@/components/gerente/views/PYGView';
import AggregatorsView from '@/components/gerente/views/AggregatorsView';
import SalesView from '@/components/gerente/views/SalesView';
import TicketTable from '@/components/gerente/views/TicketTable';

const now0 = new Date();

const TABS = [
  { key: 'pyg', label: 'P&G / Rentabilidad', icon: Zap, color: '#10b981' },
  { key: 'aggregators', label: 'Agregadores', icon: Truck, color: '#f97316' },
  { key: 'sales', label: 'Ventas & Ticket', icon: BarChart3, color: '#C21875' },
  { key: 'ticket', label: 'Tabla Ticket', icon: Receipt, color: '#f59e0b' },
];

export default function GerenteDashboard() {
  const [startDate, setStartDate] = useState(startOfMonth(now0));
  const [endDate, setEndDate] = useState(now0);
  const [calOpen, setCalOpen] = useState(false);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [mode, setMode] = useState('tiendas'); // 'tiendas' | 'global'
  const [activeTab, setActiveTab] = useState('pyg');
  const [monthOpen, setMonthOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now0, i);
      opts.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: format(d, 'MMMM yyyy', { locale: es }) });
    }
    return opts;
  }, []);

  const activeMonthMatch = monthOptions.find(m =>
    startOfMonth(new Date(m.year, m.month - 1, 1)).getTime() === startOfMonth(startDate).getTime() &&
    (endOfMonth(new Date(m.year, m.month - 1, 1)).getTime() === endOfMonth(endDate).getTime() ||
      (m.year === now0.getFullYear() && m.month === now0.getMonth() + 1 && endDate.getTime() === now0.getTime()))
  );
  const activeMonthLabel = activeMonthMatch ? activeMonthMatch.label : 'Rango personalizado';

  const selectMonth = (opt) => {
    const s = startOfMonth(new Date(opt.year, opt.month - 1, 1));
    const e = (opt.year === now0.getFullYear() && opt.month === now0.getMonth() + 1) ? now0 : endOfMonth(new Date(opt.year, opt.month - 1, 1));
    setStartDate(s);
    setEndDate(e);
    setMonthOpen(false);
  };

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

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'pyg':
        return <PYGView storeData={data.storeData} districtTotals={data.districtTotals} mode={mode} />;
      case 'aggregators':
        return <AggregatorsView aggregatorsByStore={data.aggregatorsByStore} aggregatorsChannels={data.aggregatorsChannels} aggregatorsTrend={data.aggregatorsTrend} stores={data.stores} mode={mode} />;
      case 'sales':
        return <SalesView storeData={data.storeData} districtTotals={data.districtTotals} dailyTrend={data.dailyTrend} mode={mode} />;
      case 'ticket':
        return <TicketTable storeData={data.storeData} districtTotals={data.districtTotals} mode={mode} />;
      default:
        return null;
    }
  };

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
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(194,24,117,0.1)' }}>
            {presets.map(p => (
              <button key={p.label} onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: isPresetActive(p) ? 'rgba(194,24,117,0.1)' : 'transparent', color: isPresetActive(p) ? '#C21875' : '#94a3b8' }}>
                {p.label}
              </button>
            ))}
          </div>

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

          <button onClick={data.refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #C21875, #e91e8c)', color: '#fff', border: '1px solid rgba(194,24,117,0.3)' }}>
            <RefreshCw style={{ width: 12, height: 12 }} />
            Actualizar
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600">Datos actualizados</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ TOGGLE: Tiendas | Global + Mes ═══ */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          <button onClick={() => setMode('tiendas')}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-bold transition-all"
            style={{
              background: mode === 'tiendas' ? '#fff' : 'transparent',
              color: mode === 'tiendas' ? '#C21875' : '#94a3b8',
              boxShadow: mode === 'tiendas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            <Store style={{ width: 14, height: 14 }} />
            Tiendas
          </button>
          <button onClick={() => setMode('global')}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-bold transition-all"
            style={{
              background: mode === 'global' ? '#fff' : 'transparent',
              color: mode === 'global' ? '#C21875' : '#94a3b8',
              boxShadow: mode === 'global' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            <Globe style={{ width: 14, height: 14 }} />
            Global
          </button>
        </div>

        {/* Month dropdown */}
        <Popover open={monthOpen} onOpenChange={setMonthOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
              style={{
                background: 'rgba(255,255,255,0.9)',
                color: '#C21875',
                border: '1px solid rgba(194,24,117,0.2)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
              <CalendarDays style={{ width: 14, height: 14 }} />
              {activeMonthLabel}
              <ChevronDown style={{ width: 12, height: 12 }} className={monthOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">Seleccionar mes</p>
            <div className="max-h-64 overflow-y-auto">
              {monthOptions.map(opt => {
                const isActive = activeMonthMatch && activeMonthMatch.year === opt.year && activeMonthMatch.month === opt.month;
                return (
                  <button key={`${opt.year}-${opt.month}`} onClick={() => selectMonth(opt)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
                    style={{
                      background: isActive ? 'rgba(194,24,117,0.08)' : 'transparent',
                      color: isActive ? '#C21875' : '#64748b',
                    }}>
                    <span className="capitalize">{opt.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
              style={{
                background: activeTab === tab.key ? `${tab.color}0f` : 'rgba(255,255,255,0.8)',
                color: activeTab === tab.key ? tab.color : '#64748b',
                border: activeTab === tab.key ? `1px solid ${tab.color}20` : '1px solid rgba(226,232,240,0.8)',
                boxShadow: activeTab === tab.key ? `0 2px 8px ${tab.color}08` : 'none',
              }}>
              <Icon style={{ width: 14, height: 14 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ ACTIVE VIEW ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${mode}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}