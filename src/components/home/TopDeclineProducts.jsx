import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, GlassWater } from 'lucide-react';

const fmt = (v) => '$' + Math.round(v || 0).toLocaleString('es-CO');

// Filtro de categoría Malteadas (mismo criterio que SalesReportView)
const isMalteada = (name) => {
  const n = (name || '').toLowerCase();
  return /malt/i.test(n) && !/cookie/i.test(n) && !/gallet/i.test(n) && !/cj/i.test(n) && !/granizado/i.test(n);
};

export default function TopDeclineProducts({ salesReports = [] }) {
  const { topDecline } = useMemo(() => {
    if (!salesReports.length) return { topDecline: [] };

    // Encontrar el reporte más reciente
    const latestUploadedAt = salesReports.reduce((max, r) => r.uploaded_at > max ? r.uploaded_at : max, '');
    const latestReportId = salesReports.find((r) => r.uploaded_at === latestUploadedAt)?.report_id;
    const current = (latestReportId ? salesReports.filter((r) => r.report_id === latestReportId) : salesReports)
      .filter((r) => isMalteada(`${r.product || ''} ${r.section || ''} ${r.department || ''}`));

    // Determinar mes/año anterior
    const currentMonth = current[0]?.month;
    const currentYear = current[0]?.year;
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear = currentYear - 1; }

    const prevRecords = salesReports.filter((r) => r.month === prevMonth && r.year === prevYear)
      .filter((r) => isMalteada(`${r.product || ''} ${r.section || ''} ${r.department || ''}`));

    // Mapa de ventas por producto — período anterior
    const prevSalesMap = {};
    prevRecords.forEach((r) => {
      const key = r.product || r.section || '';
      if (key) prevSalesMap[key] = (prevSalesMap[key] || 0) + (r.total_sales || 0);
    });

    // Mapa de ventas por producto — período actual
    const currSalesMap = {};
    current.forEach((r) => {
      const key = r.product || r.section || '';
      if (key) currSalesMap[key] = (currSalesMap[key] || 0) + (r.total_sales || 0);
    });

    // Calcular decrecimientos
    const declines = [];
    Object.keys(currSalesMap).forEach((key) => {
      const prev = prevSalesMap[key];
      const curr = currSalesMap[key];
      // Solo mostrar si hubo ventas significativas en el período anterior
      if (prev && prev > 0 && curr > 0 && prev >= curr * 0.1) {
        const growth = ((curr - prev) / prev) * 100;
        if (growth < 0) {
          declines.push({ product: key, growth, prevSales: prev, currSales: curr });
        }
      }
    });

    declines.sort((a, b) => a.growth - b.growth);
    return { topDecline: declines.slice(0, 3) };
  }, [salesReports]);

  const CARD_STYLE = {
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.65)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
  };

  if (!topDecline.length) return null;

  const colors = ['#C21875', '#E91E63', '#D81B60'];

  const severityLabel = (g) => {
    const a = Math.abs(g);
    if (a >= 40) return 'CRÍTICO';
    if (a >= 25) return 'ALTO';
    return 'MEDIO';
  };

  return (
    <div className="mb-4 lg:mb-7">
      <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <GlassWater style={{ width: 16, height: 16, color: '#C21875' }} />
          <p className="text-[13px] sm:text-[14px] font-black text-slate-800">Malteadas en Declive</p>
        </div>
        <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
          Top {topDecline.length} más críticas
        </span>
      </div>
      <motion.div
        id="decline-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {topDecline.map((item, i) => {
          const color = colors[i] || '#94a3b8';
          const severity = severityLabel(item.growth);
          return (
            <div key={item.product}
              className="rounded-2xl p-4 hover-lift flex flex-col gap-0"
              style={CARD_STYLE}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="label-premium">Declive #{i + 1}</p>
                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
                  <AlertTriangle style={{ width: 9, height: 9, display: 'inline', marginRight: 2 }} />
                  {severity}
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight mb-1 truncate" title={item.product}>
                {item.product}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-xl sm:text-[26px] font-black leading-none tabular-nums" style={{ color }}>
                  {item.growth.toFixed(1)}%
                </p>
                <TrendingDown style={{ width: 16, height: 16, color, marginBottom: 2 }} />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mb-2">
                {fmt(item.currSales)} <span className="text-slate-300">vs {fmt(item.prevSales)}</span>
              </p>
              <div className="flex items-end gap-1 h-12 mt-1 mb-2">
                {[item.prevSales, item.currSales].map((v, idx) => {
                  const max = Math.max(item.prevSales, item.currSales, 1);
                  const pct = Math.max(v / max * 100, 8);
                  return (
                    <div key={idx} className="flex-1 rounded-t-md"
                      style={{ height: `${pct}%`, background: idx === 0 ? `${color}28` : color }} />
                  );
                })}
              </div>
              <div className="rounded-lg px-2 py-1.5 flex items-center gap-1.5"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <span className="text-[9px] font-bold flex-1" style={{ color }}>
                  ↓ Caída del {Math.abs(item.growth).toFixed(1)}% vs mes anterior
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}