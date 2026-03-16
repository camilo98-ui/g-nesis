import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { STORES, getDisplayName } from '@/components/StoreSelector';
import { BASE_STORES } from '@/components/StoreManager';
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, format } from 'date-fns';
import { TrendingUp, TrendingDown, ArrowRight, Target, BarChart3, Zap } from 'lucide-react';

const fmt = (v) => {
  if (!v || isNaN(v)) return '$0';
  if (v >= 1000000000) return `$${(v / 1000000000).toFixed(2)}B`;
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('es-CO')}`;
};

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function GerenteHomePanel() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = now.getDate();

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerenteHomeSales'],
    queryFn: () => base44.entities.DailySales.list(),
    staleTime: 5 * 60 * 1000
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerenteHomeBudgets'],
    queryFn: () => base44.entities.Budget.list(),
    staleTime: 10 * 60 * 1000
  });

  const { data: zoneBudgets = [] } = useQuery({
    queryKey: ['gerenteZoneBudgets'],
    queryFn: () => base44.entities.ZoneBudget.filter({ zone_name: 'Bogotá Noroccidente' }),
    staleTime: 10 * 60 * 1000
  });

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const storesData = useMemo(() => {
    return STORES.map(store => {
      const storeSales = allDailySales.filter(s => {
        try {
          const d = parseISO(s.date);
          return s.store_id === store.code && d >= monthStart && d <= now;
        } catch { return false; }
      });

      const totalSales = storeSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTransactions = storeSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);

      const activeBudget = allBudgets.find(b => b.store_id === store.code && b.is_active === true);
      const budget = activeBudget || allBudgets.find(b => b.store_id === store.code && b.month === currentMonth && b.year === currentYear);
      const salesBudget = budget?.sales_budget || 0;

      const avgDaily = daysElapsed > 0 ? totalSales / daysElapsed : 0;
      const projection = totalSales + avgDaily * (daysInMonth - daysElapsed);
      const compliance = salesBudget > 0 ? (totalSales / salesBudget) * 100 : 0;
      const projCompliance = salesBudget > 0 ? (projection / salesBudget) * 100 : 0;
      const hasData = totalSales > 0;

      let status = 'ok';
      if (!hasData) status = 'nodata';
      else if (compliance < 70) status = 'critical';
      else if (compliance < 90) status = 'warning';

      return {
        code: store.code,
        name: getDisplayName(store.code),
        totalSales,
        salesBudget,
        projection,
        compliance,
        projCompliance,
        gap: salesBudget - totalSales,
        hasData,
        status,
        avgTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        totalTransactions
      };
    });
  }, [allDailySales, allBudgets, daysElapsed, daysInMonth]);

  const zoneTotals = useMemo(() => {
    const stores = storesData.filter(s => s.hasData);
    const totalSales = stores.reduce((s, x) => s + x.totalSales, 0);
    const totalBudget = stores.reduce((s, x) => s + x.salesBudget, 0);
    const totalProjection = stores.reduce((s, x) => s + x.projection, 0);
    const activeZoneBudget = zoneBudgets.find(b => b.is_active) || zoneBudgets.find(b => b.month === currentMonth && b.year === currentYear);
    const zoneBudgetVal = activeZoneBudget?.sales_budget || totalBudget;
    const compliance = zoneBudgetVal > 0 ? (totalSales / zoneBudgetVal) * 100 : 0;
    const projCompliance = zoneBudgetVal > 0 ? (totalProjection / zoneBudgetVal) * 100 : 0;
    return { totalSales, totalBudget: zoneBudgetVal, totalProjection, compliance, projCompliance, storesCount: stores.length };
  }, [storesData, zoneBudgets]);

  const statusCounts = useMemo(() => ({
    ok: storesData.filter(s => s.status === 'ok').length,
    warning: storesData.filter(s => s.status === 'warning').length,
    critical: storesData.filter(s => s.status === 'critical').length,
    nodata: storesData.filter(s => s.status === 'nodata').length,
  }), [storesData]);

  const sortedStores = useMemo(() => {
    return [...storesData]
      .filter(s => s.hasData)
      .sort((a, b) => a.compliance - b.compliance);
  }, [storesData]);

  const statusColor = (s) => {
    if (s === 'critical') return 'text-red-400';
    if (s === 'warning') return 'text-amber-400';
    if (s === 'ok') return 'text-emerald-400';
    return 'text-slate-500';
  };

  const barColor = (c) => {
    if (c >= 100) return 'bg-emerald-400';
    if (c >= 90) return 'bg-blue-400';
    if (c >= 70) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const zoneStatus = zoneTotals.compliance >= 100 ? 'En Meta' : zoneTotals.compliance >= 85 ? 'En Ritmo' : zoneTotals.compliance >= 70 ? 'En Riesgo' : 'Crítico';
  const zoneStatusColor = zoneTotals.compliance >= 100 ? 'text-emerald-400' : zoneTotals.compliance >= 85 ? 'text-blue-400' : zoneTotals.compliance >= 70 ? 'text-amber-400' : 'text-red-400';
  const zoneBorderColor = zoneTotals.compliance >= 100 ? 'border-emerald-500/30' : zoneTotals.compliance >= 85 ? 'border-blue-500/30' : zoneTotals.compliance >= 70 ? 'border-amber-500/30' : 'border-red-500/40';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* ZONA TOTAL */}
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border ${zoneBorderColor} overflow-hidden`}>
        {/* Header zona */}
        <div className="px-5 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Bogotá Noroccidente · {format(now, 'MMMM yyyy')}</p>
              <p className={`text-2xl font-black tabular-nums text-white`}>{fmt(zoneTotals.totalSales)}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                zoneTotals.compliance >= 100 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                zoneTotals.compliance >= 85 ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' :
                zoneTotals.compliance >= 70 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                'bg-red-500/15 text-red-400 border-red-500/25'
              }`}>
                {zoneStatus}
              </span>
              <p className="text-xs text-slate-500 mt-1">PPT: {fmt(zoneTotals.totalBudget)}</p>
            </div>
          </div>

          {/* Barra cumplimiento real */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">Venta real</span>
              <span className={`font-black ${zoneStatusColor}`}>{zoneTotals.compliance.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor(zoneTotals.compliance)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(zoneTotals.compliance, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Barra proyección */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500">Proyección cierre</span>
              <span className={`font-bold ${zoneTotals.projCompliance >= 100 ? 'text-emerald-400' : zoneTotals.projCompliance >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
                {fmt(zoneTotals.totalProjection)} · {zoneTotals.projCompliance.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full opacity-50 ${zoneTotals.projCompliance >= 100 ? 'bg-emerald-400' : zoneTotals.projCompliance >= 90 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 6px)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(zoneTotals.projCompliance, 100)}%` }}
                transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Métricas resumen */}
        <div className="grid grid-cols-4 divide-x divide-white/6">
          {[
            { label: 'Tiendas', value: `${statusCounts.ok}/${zoneTotals.storesCount}`, sub: 'en meta', color: 'text-emerald-400' },
            { label: 'Críticas', value: statusCounts.critical, sub: `+ ${statusCounts.warning} en riesgo`, color: statusCounts.critical > 0 ? 'text-red-400' : 'text-slate-400' },
            { label: 'Brecha', value: fmt(Math.max(0, zoneTotals.totalBudget - zoneTotals.totalSales)), sub: 'vs PPT', color: 'text-rose-300' },
            { label: 'Día', value: `${daysElapsed}/${daysInMonth}`, sub: `${(daysElapsed/daysInMonth*100).toFixed(0)}% avanzado`, color: 'text-slate-300' },
          ].map((m, i) => (
            <div key={i} className="px-3 py-2.5 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{m.label}</p>
              <p className={`text-sm font-black tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TIENDAS LIST */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Status por Tienda</p>
          <div className="flex items-center gap-2 text-[9px] font-bold">
            <span className="text-emerald-400">● Meta</span>
            <span className="text-amber-400">● Riesgo</span>
            <span className="text-red-400">● Crítico</span>
          </div>
        </div>

        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
          {sortedStores.map((store, i) => (
            <motion.div
              key={store.code}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="px-4 py-2.5 hover:bg-white/4 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Indicador */}
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                  store.status === 'ok' ? 'bg-emerald-400' :
                  store.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                }`} />

                {/* Nombre */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white truncate">{store.name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-black tabular-nums ${
                        store.compliance >= 100 ? 'text-emerald-400' :
                        store.compliance >= 90 ? 'text-blue-400' :
                        store.compliance >= 70 ? 'text-amber-400' : 'text-red-400'
                      }`}>{store.compliance.toFixed(0)}%</span>
                      <span className="text-[10px] text-slate-500 tabular-nums">{fmt(store.totalSales)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <MiniBar value={store.totalSales} max={store.salesBudget} color={barColor(store.compliance)} />
                    </div>
                    <span className={`text-[9px] font-medium flex-shrink-0 ${
                      store.projCompliance >= 100 ? 'text-emerald-400/70' :
                      store.projCompliance >= 90 ? 'text-amber-400/70' : 'text-red-400/70'
                    }`}>
                      Proy: {store.projCompliance.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {sortedStores.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-slate-500">Cargando datos...</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA → Panel Ejecutivo */}
      <Link to={createPageUrl('ExecutiveDashboard')}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Panel Ejecutivo Completo</p>
              <p className="text-[10px] text-slate-400">Análisis detallado · Gráficas · Comparables</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </motion.div>
      </Link>
    </motion.div>
  );
}