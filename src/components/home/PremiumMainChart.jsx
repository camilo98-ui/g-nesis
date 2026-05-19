import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${Math.round(n / 1_000)}K`
    : `$${Math.round(n)}`;

// Smooth Catmull-Rom → SVG cubic bezier
function catmullRomPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ data, x, y, chartH, PAD_B }) {
  if (!data) return null;
  const TIP_W = 130, TIP_H = 68;
  // Keep tooltip inside chart bounds
  const tx = Math.min(Math.max(x - TIP_W / 2, 0), 700 - TIP_W);
  const ty = y - TIP_H - 10 < 0 ? y + 12 : y - TIP_H - 10;
  return (
    <g>
      <foreignObject x={tx} y={ty} width={TIP_W} height={TIP_H} style={{ overflow: 'visible' }}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            background: 'rgba(15,23,42,0.95)',
            borderRadius: 10,
            padding: '7px 10px',
            border: '1px solid rgba(236,72,153,0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontSize: 10,
            color: '#e2e8f0',
            whiteSpace: 'nowrap'
          }}>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{data.label}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94a3b8' }}>Venta:</span>
            <span style={{ fontWeight: 700, color: '#ec4899' }}>{fmt(data.value)}</span>
          </div>
          {data.budget > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Meta:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{fmt(data.budget)}</span>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

// ── Main Chart ────────────────────────────────────────────────────────────────
export default function PremiumMainChart({ dailySales = [], activeBudget = null, dailyBudgets = [] }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const { pts, maxVal, avgVal, budgetVal, peakIdx } = useMemo(() => {
    if (!dailySales.length) return { pts: [], maxVal: 1, avgVal: 0, budgetVal: 0, peakIdx: -1 };

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const allDays = eachDayOfInterval({ start: monthStart, end: now });

    // Map sales by date
    const salesMap = {};
    dailySales.forEach((d) => { if (d.date) salesMap[d.date] = d.total_sales || 0; });

    // Daily budget map
    const budgetMap = {};
    dailyBudgets.forEach((db) => { if (db.date && db.sales_budget) budgetMap[db.date] = db.sales_budget; });

    const monthlyBudget = activeBudget?.sales_budget || 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyDefault = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;

    const pts = allDays.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return {
        label: format(d, 'd MMM', { locale: es }),
        day: format(d, 'd'),
        value: salesMap[key] || 0,
        budget: budgetMap[key] || dailyDefault,
      };
    });

    const values = pts.map((p) => p.value).filter((v) => v > 0);
    const avgVal = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const maxVal = Math.max(...values, dailyDefault * 1.1, 1);
    const peakIdx = pts.reduce((mi, p, i) => (p.value > pts[mi].value ? i : mi), 0);

    return { pts, maxVal, avgVal, budgetVal: dailyDefault, peakIdx };
  }, [dailySales, activeBudget, dailyBudgets]);

  // Derived metrics
  const metrics = useMemo(() => {
    if (!pts.length) return null;
    const withData = pts.filter((p) => p.value > 0);
    const total = withData.reduce((s, p) => s + p.value, 0);
    const latest = withData[withData.length - 1];
    const prev = withData[withData.length - 2];
    const change = latest && prev && prev.value > 0
      ? ((latest.value - prev.value) / prev.value * 100).toFixed(1)
      : null;
    const complianceAvg = budgetVal > 0 && withData.length > 0
      ? (withData.reduce((s, p) => s + p.value, 0) / withData.reduce((s, p) => s + p.budget, 0) * 100).toFixed(1)
      : null;
    return { total, latest, prev, change, complianceAvg, daysWithData: withData.length };
  }, [pts, budgetVal]);

  // SVG dimensions
  const W = 700, H = 220;
  const PAD_L = 52, PAD_R = 48, PAD_T = 28, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const toX = (i) => PAD_L + (i / Math.max(pts.length - 1, 1)) * chartW;
  const toY = (v) => PAD_T + chartH - (v / maxVal) * chartH;

  const barW = Math.max(4, chartW / Math.max(pts.length, 1) - 3);
  const lineCoords = pts.map((p, i) => [toX(i), toY(p.value)]);
  const linePath = catmullRomPath(lineCoords.filter((_, i) => pts[i].value > 0));
  // Area path (fill below line)
  const areaCoords = pts.map((p, i) => [toX(i), p.value > 0 ? toY(p.value) : PAD_T + chartH]);
  const firstNonZero = areaCoords.findIndex((_, i) => pts[i].value > 0);
  const lastNonZero = pts.map((p) => p.value > 0).lastIndexOf(true);
  let areaPath = '';
  if (firstNonZero >= 0 && lastNonZero >= 0) {
    const filtered = pts.map((p, i) => [toX(i), toY(p.value)]).filter((_, i) => pts[i].value > 0);
    const filteredIdxs = pts.map((p, i) => ({ p, i })).filter(({ p }) => p.value > 0).map(({ i }) => i);
    const lx = toX(filteredIdxs[filteredIdxs.length - 1]);
    const rx = toX(filteredIdxs[0]);
    areaPath = catmullRomPath(filtered) + ` L${lx},${PAD_T + chartH} L${rx},${PAD_T + chartH} Z`;
  }

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((t) => ({
    val: maxVal * t,
    y: toY(maxVal * t),
  }));

  const avgY = toY(avgVal);
  const budgetY = budgetVal > 0 ? toY(budgetVal) : null;

  if (!pts.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 lg:mb-6 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-wrap gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">Ventas del Mes</p>
          <p className="text-[13px] font-black text-slate-800" style={{ letterSpacing: '-0.02em' }}>
            {metrics ? fmt(metrics.total) : '—'} acumulado
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {metrics?.change != null && (
            <span className={`flex items-center gap-1 font-semibold ${parseFloat(metrics.change) >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
              {parseFloat(metrics.change) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {metrics.change > 0 ? '+' : ''}{metrics.change}% vs ayer
            </span>
          )}
          {metrics?.complianceAvg && budgetVal > 0 && (
            <span className="text-slate-400 font-medium">{metrics.complianceAvg}% cumpl.</span>
          )}
          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ec4899' }} />
              <span className="text-slate-400">Ventas</span>
            </div>
            {budgetVal > 0 && (
              <div className="flex items-center gap-1">
                <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                <span className="text-slate-400">Meta</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
              <span className="text-slate-400">Prom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          style={{ display: 'block', minWidth: 320 }}
          onMouseLeave={() => setHoverIdx(null)}>

          <defs>
            <linearGradient id="pmcAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#ec4899" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pmcBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="pmcBarGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C21875" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="pmcBarGradPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#be185d" stopOpacity="1" />
              <stop offset="100%" stopColor="#C21875" stopOpacity="0.85" />
            </linearGradient>
            <filter id="pmcGlow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Y-axis grid lines */}
          {yTicks.map(({ val, y }) => (
            <g key={val}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke={val === 0 ? '#e2e8f0' : '#f1f5f9'} strokeWidth={val === 0 ? 1 : 0.8}
                strokeDasharray={val === 0 ? '' : '4 4'} />
              <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8" fontFamily="system-ui">
                {fmt(val)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {pts.map((p, i) => {
            if (p.value === 0) return null;
            const bh = Math.max((p.value / maxVal) * chartH, 5);
            const bx = toX(i) - barW / 2;
            const by = PAD_T + chartH - bh;
            const isPeak = i === peakIdx;
            const isHov = i === hoverIdx;
            const grad = isPeak ? 'url(#pmcBarGradPeak)' : isHov ? 'url(#pmcBarGradHover)' : 'url(#pmcBarGrad)';
            return (
              <rect
                key={i}
                x={bx} y={by} width={barW} height={bh}
                rx={3} ry={3}
                fill={grad}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                opacity={hoverIdx !== null && !isHov && !isPeak ? 0.55 : 1}
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}

          {/* Area fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#pmcAreaGrad)" />
          )}

          {/* Smooth line */}
          {linePath && (
            <path d={linePath} fill="none" stroke="#ec4899" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round" filter="url(#pmcGlow)" />
          )}

          {/* AVG line */}
          {avgVal > 0 && (
            <g>
              <line x1={PAD_L} y1={avgY} x2={W - PAD_R} y2={avgY}
                stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7} />
              <rect x={W - PAD_R + 2} y={avgY - 8} width={28} height={16} rx={4} fill="#94a3b8" opacity={0.85} />
              <text x={W - PAD_R + 16} y={avgY + 4} textAnchor="middle" fontSize={7.5} fill="#fff" fontWeight="700">AVG</text>
            </g>
          )}

          {/* Budget/Meta line */}
          {budgetY !== null && budgetVal > 0 && (
            <g>
              <line x1={PAD_L} y1={budgetY} x2={W - PAD_R} y2={budgetY}
                stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.8} />
              <rect x={W - PAD_R + 2} y={budgetY - 8} width={32} height={16} rx={4} fill="#10b981" opacity={0.85} />
              <text x={W - PAD_R + 18} y={budgetY + 4} textAnchor="middle" fontSize={7.5} fill="#fff" fontWeight="700">META</text>
            </g>
          )}

          {/* Peak label */}
          {peakIdx >= 0 && pts[peakIdx]?.value > 0 && (() => {
            const px = toX(peakIdx);
            const py = toY(pts[peakIdx].value);
            const labelW = 68, labelH = 22;
            const lx = Math.min(Math.max(px - labelW / 2, PAD_L), W - PAD_R - labelW);
            return (
              <g filter="url(#pmcGlow)">
                <rect x={lx} y={py - labelH - 6} width={labelW} height={labelH} rx={8}
                  fill="url(#pmcBarGradPeak)" />
                <text x={lx + labelW / 2} y={py - labelH - 6 + 14} textAnchor="middle"
                  fontSize={11} fontWeight="800" fill="#fff" fontFamily="system-ui">
                  {fmt(pts[peakIdx].value)}
                </text>
                {/* connector dot */}
                <circle cx={px} cy={py} r={4} fill="#be185d" />
                <circle cx={px} cy={py} r={7} fill="#be185d" opacity={0.2} />
              </g>
            );
          })()}

          {/* Hover dots */}
          {pts.map((p, i) => {
            if (p.value === 0 || i === peakIdx) return null;
            const cx = toX(i), cy = toY(p.value);
            return (
              <circle key={i} cx={cx} cy={cy} r={hoverIdx === i ? 5 : 3}
                fill="#ec4899" opacity={hoverIdx === i ? 1 : 0}
                style={{ transition: 'r 0.15s, opacity 0.15s', pointerEvents: 'none' }} />
            );
          })}

          {/* X-axis labels — show every N */}
          {pts.map((p, i) => {
            const step = pts.length <= 10 ? 1 : pts.length <= 20 ? 2 : 3;
            if (i % step !== 0) return null;
            return (
              <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9}
                fill={i === hoverIdx ? '#C21875' : '#94a3b8'} fontFamily="system-ui">
                {p.day}
              </text>
            );
          })}

          {/* Hover tooltip */}
          {hoverIdx !== null && pts[hoverIdx]?.value > 0 && (
            <ChartTooltip
              data={pts[hoverIdx]}
              x={toX(hoverIdx)}
              y={toY(pts[hoverIdx].value)}
              chartH={chartH}
              PAD_B={PAD_B}
            />
          )}

          {/* Invisible hover targets */}
          {pts.map((p, i) => (
            <rect key={i}
              x={toX(i) - chartW / pts.length / 2}
              y={PAD_T}
              width={chartW / pts.length}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              style={{ cursor: p.value > 0 ? 'pointer' : 'default' }}
            />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}