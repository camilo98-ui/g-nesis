import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MAGENTA = '#f0147c';
const NEON_BLUE = '#38bdf8';
const NEON_PURPLE = '#a78bfa';
const NEON_AMBER = '#fbbf24';
const NEON_GREEN = '#34d399';

function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], c = points[i];
    const cpx = (p.x + c.x) / 2;
    d += ` C ${cpx} ${p.y}, ${cpx} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

// ─── Sparkline card with big stat ─────────────────────────────────────────────
function MetricSparkCard({ label, dataKey, data, color, target, lowerIsBetter }) {
  const [hov, setHov] = React.useState(null);
  const vals = data.map(d => d[dataKey]).filter(v => v != null);
  if (vals.length === 0) return null;

  const last = vals[vals.length - 1];
  const prev = vals.length >= 2 ? vals[vals.length - 2] : null;
  const delta = prev != null ? last - prev : null;
  const trend = vals.length >= 3 ? last - vals[0] : null;
  const isGood = delta == null ? null : (lowerIsBetter ? delta <= 0 : delta >= 0);
  const best = lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
  const worst = lowerIsBetter ? Math.max(...vals) : Math.min(...vals);
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;

  // Sparkline
  const W = 220, H = 64;
  const padL = 4, padR = 4, padT = 8, padB = 8;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const minV = Math.min(...vals) - 2, maxV = Math.max(...vals) + 2;
  const toX = (i) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));

  const pts = data.map((d, i) => ({
    x: toX(i), y: d[dataKey] != null ? toY(d[dataKey]) : null, val: d[dataKey], mes: d.mes
  })).filter(p => p.val != null);

  const linePath = buildSmoothPath(pts);
  const areaPath = pts.length >= 2
    ? linePath + ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`
    : '';

  const gradId = `spk_${dataKey.replace(/\W/g, '_')}`;
  const statusColor = isGood == null ? '#64748b' : isGood ? NEON_GREEN : '#f87171';

  // Target line
  const targetY = target != null ? toY(target) : null;
  const onTarget = target != null ? (lowerIsBetter ? last <= target : last >= target) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: 'rgba(10,16,34,0.95)', border: `1px solid ${color}25` }}>

      {/* Ambient color bleed */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 60%)` }} />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: `${color}99` }}>{label}</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black leading-none tracking-tight" style={{ color }}>
              {last.toFixed(1)}%
            </span>
            {delta != null && (
              <span className="flex items-center gap-0.5 text-xs font-black mb-0.5"
                style={{ color: statusColor }}>
                {delta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : delta < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {delta > 0 ? '+' : ''}{delta.toFixed(1)}pp
              </span>
            )}
          </div>
        </div>
        {onTarget != null && (
          <div className="px-2 py-1 rounded-full text-[9px] font-black"
            style={{ background: onTarget ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: onTarget ? NEON_GREEN : '#f87171', border: `1px solid ${onTarget ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
            {onTarget ? '✓ META' : '✗ META'}
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="relative z-10" onMouseLeave={() => setHov(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`${gradId}_glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Target band */}
          {targetY != null && (
            <line x1={padL} y1={targetY} x2={W - padR} y2={targetY}
              stroke={onTarget ? NEON_GREEN : '#f87171'} strokeWidth="1"
              strokeDasharray="4 3" strokeOpacity="0.4" />
          )}

          {/* Area */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
          {/* Line */}
          {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2"
            strokeLinecap="round" filter={`url(#${gradId}_glow)`} />}

          {/* Hover dots + tooltip */}
          {pts.map((p, i) => {
            const isH = hov === i;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={isH ? 5 : 2.5}
                  fill={isH ? color : '#0a1020'} stroke={color} strokeWidth={isH ? 2 : 1.5} />
                {isH && (
                  <>
                    <line x1={p.x} y1={padT} x2={p.x} y2={padT + chartH}
                      stroke={color} strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.3" />
                    <rect x={Math.max(padL, Math.min(p.x - 22, W - padR - 44))} y={padT - 2}
                      width={44} height={20} rx="5" fill="#060d1b" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
                    <text x={Math.max(padL + 22, Math.min(p.x, W - padR - 22))} y={padT + 12}
                      textAnchor="middle" fontSize="9.5" fontWeight="900" fill={color}>
                      {p.val.toFixed(1)}%
                    </text>
                  </>
                )}
                <circle cx={p.x} cy={p.y} r="12" fill="transparent"
                  onMouseEnter={() => setHov(i)} style={{ cursor: 'crosshair' }} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: 'Promedio', val: avg.toFixed(1) + '%' },
          { label: lowerIsBetter ? 'Mínimo ↓' : 'Máximo ↑', val: best.toFixed(1) + '%' },
          { label: 'Variación', val: trend != null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}pp` : '—' },
        ].map((s, i) => (
          <div key={i} className="rounded-lg p-2 text-center"
            style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <p className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">{s.label}</p>
            <p className="text-[11px] font-black" style={{ color }}>{s.val}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Monthly Heat Map ──────────────────────────────────────────────────────────
function MonthHeatMap({ data, selectedMonth }) {
  const [hov, setHov] = React.useState(null);

  const metrics = [
    { key: 'EBITDA',   label: 'EBITDA',      color: MAGENTA,     good: v => v >= 25, target: 25, lowerIsBetter: false },
    { key: 'C.Real',   label: 'C. Prod.',    color: NEON_BLUE,   good: v => v <= 30, target: 30, lowerIsBetter: true },
    { key: 'Personal', label: 'Personal',    color: NEON_PURPLE, good: v => v <= 22, target: 22, lowerIsBetter: true },
    { key: 'Gastos',   label: 'Gastos',      color: NEON_AMBER,  good: v => v <= 40, target: 40, lowerIsBetter: true },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[580px]">
        {/* Month headers */}
        <div className="flex gap-1 mb-2 pl-20">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] font-black uppercase"
              style={{ color: d.month === selectedMonth ? '#f1f5f9' : '#475569' }}>
              {d.mes}
              {d.month === selectedMonth && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: MAGENTA }} />}
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {metrics.map((m, mi) => (
          <div key={m.key} className="flex items-center gap-1 mb-1.5">
            {/* Label */}
            <div className="w-20 flex-shrink-0 text-right pr-3">
              <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: m.color }}>{m.label}</p>
              <p className="text-[8px] text-slate-600">{m.lowerIsBetter ? '↓' : '↑'} {m.target}%</p>
            </div>
            {/* Cells */}
            {data.map((d, di) => {
              const v = d[m.key];
              if (v == null) {
                return (
                  <div key={di} className="flex-1 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.06)' }}>
                    <span className="text-[9px] text-slate-700">—</span>
                  </div>
                );
              }
              const good = m.good(v);
              const isHov = hov === `${mi}_${di}`;
              const isSel = d.month === selectedMonth;

              // Heat intensity
              const all = data.map(x => x[m.key]).filter(Boolean);
              const lo = Math.min(...all), hi = Math.max(...all);
              const norm = hi > lo ? (v - lo) / (hi - lo) : 0.5;
              const intensity = m.lowerIsBetter ? 1 - norm : norm;

              return (
                <div key={di}
                  className="flex-1 h-9 rounded-lg flex items-center justify-center relative cursor-pointer transition-all"
                  style={{
                    background: good
                      ? `rgba(52,211,153,${0.06 + intensity * 0.18})`
                      : `rgba(248,113,113,${0.06 + (1 - intensity) * 0.18})`,
                    border: isSel
                      ? `1.5px solid ${m.color}60`
                      : isHov
                        ? `1px solid ${good ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`
                        : '1px solid rgba(148,163,184,0.06)',
                    boxShadow: isSel ? `0 0 10px ${m.color}20` : 'none',
                  }}
                  onMouseEnter={() => setHov(`${mi}_${di}`)}
                  onMouseLeave={() => setHov(null)}>
                  <span className="text-[10px] font-black"
                    style={{ color: good ? NEON_GREEN : '#f87171' }}>
                    {v.toFixed(1)}
                  </span>
                  {isHov && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 pointer-events-none"
                      style={{ background: '#060d1b', border: `1px solid ${m.color}40`, borderRadius: 8, padding: '4px 8px', whiteSpace: 'nowrap' }}>
                      <p className="text-[9px] font-black" style={{ color: m.color }}>{m.label}: {v.toFixed(2)}%</p>
                      <p className="text-[8px] text-slate-500">{d.mes} · {good ? '✓ En meta' : '✗ Fuera'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Score bar */}
        <div className="flex items-center gap-1 mt-3 pl-20">
          {data.map((d, di) => {
            const scores = metrics.map(m => {
              const v = d[m.key];
              if (v == null) return null;
              return m.good(v) ? 1 : 0;
            }).filter(v => v != null);
            const pct = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
            const isSel = d.month === selectedMonth;
            return (
              <div key={di} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: pct != null ? `${pct * 100}%` : '0%',
                      background: pct == null ? '#334155' : pct >= 0.75 ? NEON_GREEN : pct >= 0.5 ? NEON_AMBER : '#f87171',
                    }} />
                </div>
                {pct != null && (
                  <p className="text-[8px] font-black" style={{ color: isSel ? '#f1f5f9' : '#475569' }}>
                    {Math.round(pct * 100)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[8px] text-slate-600 mt-1 pl-20">Score global (% de métricas en meta)</p>
      </div>
    </div>
  );
}

// ─── Stacked Area Panorama ─────────────────────────────────────────────────────
function StackedPanorama({ data }) {
  const [hovIdx, setHovIdx] = React.useState(null);
  const [focusKey, setFocusKey] = React.useState(null);

  const metrics = [
    { key: 'EBITDA',   label: 'EBITDA',   color: MAGENTA,      lowerIsBetter: false },
    { key: 'C.Real',   label: 'C.Real',   color: NEON_BLUE,    lowerIsBetter: true },
    { key: 'Personal', label: 'Personal', color: NEON_PURPLE,  lowerIsBetter: true },
    { key: 'Gastos',   label: 'Gastos',   color: NEON_AMBER,   lowerIsBetter: true },
  ];

  const W = 700, H = 320;
  const padL = 46, padR = 30, padT = 28, padB = 52;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  const allVals = metrics.flatMap(m => data.map(d => d[m.key]).filter(v => v != null));
  if (allVals.length === 0) return null;
  const minV = Math.max(0, Math.min(...allVals) - 3);
  const maxV = Math.max(...allVals) + 5;

  const toX = (i) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));
  const ticks = 5;

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {metrics.map(m => {
          const isFocus = focusKey === m.key;
          const lastVal = [...data].reverse().find(d => d[m.key] != null)?.[m.key];
          const firstVal = data.find(d => d[m.key] != null)?.[m.key];
          const trend = lastVal != null && firstVal != null ? lastVal - firstVal : null;
          return (
            <button key={m.key}
              onClick={() => setFocusKey(focusKey === m.key ? null : m.key)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all"
              style={{
                background: isFocus ? `${m.color}18` : 'rgba(148,163,184,0.05)',
                border: `1.5px solid ${isFocus ? m.color + '50' : 'rgba(148,163,184,0.1)'}`,
                boxShadow: isFocus ? `0 0 20px ${m.color}20` : 'none',
              }}>
              <div className="flex flex-col gap-0.5">
                <div className="w-5 h-[2px] rounded-full" style={{ background: m.color }} />
                <div className="w-3 h-[2px] rounded-full ml-1" style={{ background: m.color, opacity: 0.4 }} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black" style={{ color: isFocus ? m.color : '#94a3b8' }}>{m.label}</p>
                {lastVal != null && (
                  <p className="text-[9px]" style={{ color: isFocus ? m.color + 'bb' : '#475569' }}>
                    {lastVal.toFixed(1)}%
                    {trend != null && <span> {trend > 0 ? '▲' : trend < 0 ? '▼' : '='}{Math.abs(trend).toFixed(1)}</span>}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          {metrics.map(m => (
            <React.Fragment key={m.key}>
              <linearGradient id={`sp_fill_${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0" />
              </linearGradient>
              <filter id={`sp_glow_${m.key}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </React.Fragment>
          ))}
        </defs>

        {/* Grid & Y axis */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = minV + (maxV - minV) * (i / ticks);
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="rgba(148,163,184,0.07)" strokeWidth="1" strokeDasharray="3 7" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(148,163,184,0.3)" fontWeight="600">
                {Math.round(v)}%
              </text>
            </g>
          );
        })}

        {/* Hover column */}
        {hovIdx != null && (
          <rect x={toX(hovIdx) - chartW / data.length / 2} y={padT} width={chartW / data.length} height={chartH}
            fill="rgba(255,255,255,0.015)" rx="4" />
        )}
        {hovIdx != null && (
          <line x1={toX(hovIdx)} y1={padT} x2={toX(hovIdx)} y2={padT + chartH}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        )}

        {/* Areas + Lines */}
        {metrics.map(m => {
          const isActive = focusKey == null || focusKey === m.key;
          const pts = data.map((d, i) => ({
            x: toX(i), y: d[m.key] != null ? toY(d[m.key]) : null, val: d[m.key]
          })).filter(p => p.val != null);
          if (pts.length < 2) return null;
          const lp = buildSmoothPath(pts);
          const ap = lp + ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;

          return (
            <g key={m.key} style={{ opacity: isActive ? 1 : 0.1, transition: 'opacity 0.3s' }}>
              <path d={ap} fill={`url(#sp_fill_${m.key})`} />
              <path d={lp} fill="none" stroke={m.color} strokeWidth={focusKey === m.key ? 3 : 2}
                strokeLinecap="round" filter={`url(#sp_glow_${m.key})`} />
            </g>
          );
        })}

        {/* End-point value labels */}
        {metrics.map(m => {
          const isActive = focusKey == null || focusKey === m.key;
          const lastD = [...data].reverse().find(d => d[m.key] != null);
          if (!lastD) return null;
          const i = data.indexOf(lastD);
          const x = toX(i);
          const y = toY(lastD[m.key]);
          return (
            <g key={m.key} style={{ opacity: isActive ? 1 : 0.1, transition: 'opacity 0.3s' }}>
              <circle cx={x} cy={y} r="4" fill={m.color} />
              <text x={x + 7} y={y + 4} fontSize="9" fontWeight="900" fill={m.color}>
                {lastD[m.key].toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - padB + 16} textAnchor="middle" fontSize="9.5" fontWeight="700"
            fill={hovIdx === i ? '#f1f5f9' : 'rgba(100,116,139,0.6)'}>
            {d.mes}
          </text>
        ))}

        {/* Hover tooltip */}
        {hovIdx != null && (() => {
          const x = toX(hovIdx);
          const active = metrics.filter(m => !focusKey || focusKey === m.key);
          const panelH = 16 + active.length * 18 + 6;
          const panelW = 118;
          const px = Math.max(padL, Math.min(x - panelW / 2, W - padR - panelW));
          const py = padT;
          return (
            <g>
              <rect x={px} y={py} width={panelW} height={panelH} rx="8"
                fill="rgba(6,13,27,0.96)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
              <text x={px + 10} y={py + 13} fontSize="8" fontWeight="900" fill="rgba(148,163,184,0.5)">
                {data[hovIdx]?.mes}
              </text>
              {active.map((m, li) => {
                const v = data[hovIdx]?.[m.key];
                if (v == null) return null;
                return (
                  <g key={m.key}>
                    <circle cx={px + 11} cy={py + 22 + li * 18} r="3.5" fill={m.color} />
                    <text x={px + 20} y={py + 27 + li * 18} fontSize="10" fontWeight="700" fill={m.color}>
                      {m.label} {v.toFixed(1)}%
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect key={i} x={toX(i) - chartW / data.length / 2} y={padT}
            width={chartW / data.length} height={chartH + padB}
            fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)} />
        ))}
      </svg>
    </div>
  );
}

// ─── EBITDA vs Costs Correlation ───────────────────────────────────────────────
function CorrelationPanel({ data }) {
  const [hov, setHov] = React.useState(null);

  const pairs = [
    { x: 'Personal', y: 'EBITDA', xLabel: 'Personal %', yLabel: 'EBITDA %',
      xColor: NEON_PURPLE, yColor: MAGENTA,
      desc: 'Correlación inversa — Personal ↑ presiona EBITDA ↓' },
    { x: 'C.Real', y: 'EBITDA', xLabel: 'Costo Real %', yLabel: 'EBITDA %',
      xColor: NEON_BLUE, yColor: MAGENTA,
      desc: 'Cada punto de costo real reduce 1pp el EBITDA' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pairs.map((pair, pi) => {
        const pts = data.filter(d => d[pair.x] != null && d[pair.y] != null);
        if (pts.length < 2) return null;

        const W = 260, H = 200, pad = 36;
        const xVals = pts.map(p => p[pair.x]);
        const yVals = pts.map(p => p[pair.y]);
        const xMin = Math.min(...xVals) - 2, xMax = Math.max(...xVals) + 2;
        const yMin = Math.min(...yVals) - 2, yMax = Math.max(...yVals) + 2;
        const toX = v => pad + (v - xMin) / (xMax - xMin) * (W - pad * 2);
        const toY = v => (H - pad) - (v - yMin) / (yMax - yMin) * (H - pad * 2);

        // Trend line (linear regression)
        const n = pts.length;
        const sumX = pts.reduce((s, p) => s + p[pair.x], 0);
        const sumY = pts.reduce((s, p) => s + p[pair.y], 0);
        const sumXY = pts.reduce((s, p) => s + p[pair.x] * p[pair.y], 0);
        const sumXX = pts.reduce((s, p) => s + p[pair.x] ** 2, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2);
        const intercept = (sumY - slope * sumX) / n;
        const regY1 = slope * xMin + intercept;
        const regY2 = slope * xMax + intercept;

        const corrColor = slope < 0 ? '#f87171' : NEON_GREEN;

        return (
          <div key={pi} className="rounded-2xl p-4"
            style={{ background: 'rgba(10,16,34,0.95)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(148,163,184,0.5)' }}>Correlación</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black" style={{ color: pair.xColor }}>{pair.xLabel}</span>
              <span className="text-[10px] text-slate-600">→</span>
              <span className="text-xs font-black" style={{ color: pair.yColor }}>{pair.yLabel}</span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} width="100%">
              <defs>
                <filter id={`corr_glow_${pi}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Grid */}
              {[0.25, 0.5, 0.75].map((t, i) => (
                <g key={i}>
                  <line x1={pad} y1={pad + (H - pad * 2) * t} x2={W - pad} y2={pad + (H - pad * 2) * t}
                    stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
                  <line x1={pad + (W - pad * 2) * t} y1={pad} x2={pad + (W - pad * 2) * t} y2={H - pad}
                    stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
                </g>
              ))}

              {/* Regression line */}
              <line x1={toX(xMin)} y1={toY(regY1)} x2={toX(xMax)} y2={toY(regY2)}
                stroke={corrColor} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.5"
                filter={`url(#corr_glow_${pi})`} />

              {/* Data points */}
              {pts.map((p, i) => {
                const isH = hov === `${pi}_${i}`;
                return (
                  <g key={i} style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHov(`${pi}_${i}`)} onMouseLeave={() => setHov(null)}>
                    {isH && <circle cx={toX(p[pair.x])} cy={toY(p[pair.y])} r="10" fill={MAGENTA} opacity="0.12" />}
                    <circle cx={toX(p[pair.x])} cy={toY(p[pair.y])} r={isH ? 6 : 4}
                      fill={isH ? MAGENTA : 'rgba(240,20,124,0.7)'} stroke={MAGENTA} strokeWidth={isH ? 2 : 1} />
                    {isH && (
                      <>
                        <rect x={toX(p[pair.x]) - 30} y={toY(p[pair.y]) - 30} width={60} height={22} rx="5"
                          fill="#060d1b" stroke={MAGENTA} strokeWidth="1" strokeOpacity="0.5" />
                        <text x={toX(p[pair.x])} y={toY(p[pair.y]) - 14}
                          textAnchor="middle" fontSize="8.5" fontWeight="900" fill={MAGENTA}>
                          {p.mes}: {p[pair.y].toFixed(1)}%
                        </text>
                      </>
                    )}
                    {/* Mes label */}
                    <text x={toX(p[pair.x])} y={toY(p[pair.y]) - 8}
                      textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.35)" fontWeight="700">
                      {p.mes}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="8.5" fill="rgba(148,163,184,0.4)" fontWeight="700">
                {pair.xLabel}
              </text>
              <text x={10} y={H / 2} textAnchor="middle" fontSize="8.5" fill="rgba(148,163,184,0.4)" fontWeight="700"
                transform={`rotate(-90, 10, ${H / 2})`}>
                {pair.yLabel}
              </text>
            </svg>

            <p className="text-[9px] text-slate-600 mt-2 leading-relaxed">{pair.desc}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full" style={{ background: corrColor }} />
              <p className="text-[9px] font-black" style={{ color: corrColor }}>
                Pendiente: {slope.toFixed(2)} pp/pp
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Trends Panel ─────────────────────────────────────────────────────────
export default function PYGTrendsPanel({ trendData, selectedMonth }) {
  if (trendData.length < 2) {
    return (
      <div className="text-center py-16 text-slate-600">
        <p>Necesitas al menos 2 meses de datos para ver tendencias</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* 4 Sparkline cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricSparkCard label="EBITDA" dataKey="EBITDA" data={trendData} color={MAGENTA} target={25} lowerIsBetter={false} />
        <MetricSparkCard label="Costo Real" dataKey="C.Real" data={trendData} color={NEON_BLUE} target={30} lowerIsBetter={true} />
        <MetricSparkCard label="Personal" dataKey="Personal" data={trendData} color={NEON_PURPLE} target={22} lowerIsBetter={true} />
        <MetricSparkCard label="Gastos" dataKey="Gastos" data={trendData} color={NEON_AMBER} target={40} lowerIsBetter={true} />
      </div>

      {/* Panorama — multi-line with focus toggle */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(10,16,34,0.95)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="mb-5">
          <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Panorama Anual</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Haz clic en una métrica para enfocarla · Hover para ver valores</p>
        </div>
        <StackedPanorama data={trendData} />
      </div>

      {/* Heat map */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(10,16,34,0.95)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="mb-4">
          <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Mapa de Calor Mensual</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Verde = en meta · Rojo = fuera de meta · Intensidad = alejamiento del promedio</p>
        </div>
        <MonthHeatMap data={trendData} selectedMonth={selectedMonth} />
      </div>

      {/* Correlation scatter */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(10,16,34,0.95)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="mb-4">
          <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Análisis de Correlación</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Relación entre costos y EBITDA — línea de tendencia con pendiente estimada</p>
        </div>
        <CorrelationPanel data={trendData} />
      </div>

    </div>
  );
}