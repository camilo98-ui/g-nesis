import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
n >= 1_000_000 ?
`$${(n / 1_000_000).toFixed(1)}M` :
n >= 1_000 ?
`$${Math.round(n / 1_000)}K` :
`$${Math.round(n)}`;

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
  const TIP_W = 130,TIP_H = 68;
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
          {data.budget > 0 &&
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Meta:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{fmt(data.budget)}</span>
            </div>
          }
        </div>
      </foreignObject>
    </g>);

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
    dailySales.forEach((d) => {if (d.date) salesMap[d.date] = d.total_sales || 0;});

    // Daily budget map
    const budgetMap = {};
    dailyBudgets.forEach((db) => {if (db.date && db.sales_budget) budgetMap[db.date] = db.sales_budget;});

    const monthlyBudget = activeBudget?.sales_budget || 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyDefault = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;

    const pts = allDays.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return {
        label: format(d, 'd MMM', { locale: es }),
        day: format(d, 'd'),
        value: salesMap[key] || 0,
        budget: budgetMap[key] || dailyDefault
      };
    });

    const values = pts.map((p) => p.value).filter((v) => v > 0);
    const avgVal = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const maxVal = Math.max(...values, dailyDefault * 1.1, 1);
    const peakIdx = pts.reduce((mi, p, i) => p.value > pts[mi].value ? i : mi, 0);

    return { pts, maxVal, avgVal, budgetVal: dailyDefault, peakIdx };
  }, [dailySales, activeBudget, dailyBudgets]);

  // Derived metrics
  const metrics = useMemo(() => {
    if (!pts.length) return null;
    const withData = pts.filter((p) => p.value > 0);
    const total = withData.reduce((s, p) => s + p.value, 0);
    const latest = withData[withData.length - 1];
    const prev = withData[withData.length - 2];
    const change = latest && prev && prev.value > 0 ?
    ((latest.value - prev.value) / prev.value * 100).toFixed(1) :
    null;
    const complianceAvg = budgetVal > 0 && withData.length > 0 ?
    (withData.reduce((s, p) => s + p.value, 0) / withData.reduce((s, p) => s + p.budget, 0) * 100).toFixed(1) :
    null;
    return { total, latest, prev, change, complianceAvg, daysWithData: withData.length };
  }, [pts, budgetVal]);

  // SVG dimensions
  const W = 700,H = 220;
  const PAD_L = 52,PAD_R = 48,PAD_T = 28,PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const toX = (i) => PAD_L + i / Math.max(pts.length - 1, 1) * chartW;
  const toY = (v) => PAD_T + chartH - v / maxVal * chartH;

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
    y: toY(maxVal * t)
  }));

  const avgY = toY(avgVal);
  const budgetY = budgetVal > 0 ? toY(budgetVal) : null;

  if (!pts.length) return null;

  return null;



























































































































































































































}