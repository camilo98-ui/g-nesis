import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function MiniLineChart({ data = [], color = '#ff4f93' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / range) * (H * 0.7) - H * 0.1,
    }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `${color}22`);
    grad.addColorStop(1, `${color}00`);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dotted projection: last point to extrapolated end
    const last = pts[pts.length - 1];
    const secondLast = pts[pts.length - 2];
    const slope = (last.y - secondLast.y) / (last.x - secondLast.x);
    const projX = W + 20;
    const projY = last.y + slope * (projX - last.x);
    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(Math.min(projX, W), Math.max(projY, 4));
    ctx.strokeStyle = `${color}66`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot at last point
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = `${color}22`;
    ctx.fill();
  }, [data, color]);

  return <canvas ref={canvasRef} width={320} height={64} style={{ width: '100%', height: 64 }} />;
}

export default function HeroProjectionCard({ todaySales = [], budget = [], salesChange = 0 }) {
  const sorted = [...todaySales].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sparkData = sorted.map(d => d.total_sales || 0);

  const totalSales = sorted.reduce((s, d) => s + (d.total_sales || 0), 0);
  const totalBudget = budget.reduce((s, b) => s + (b.sales_budget || 0), 0);
  const pct = totalBudget > 0 ? Math.round((totalSales / totalBudget) * 100) : null;
  const isAbove = pct != null && pct >= 100;
  const changeAbs = Math.abs(salesChange);
  const isPos = salesChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-3xl mb-8 overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(255,79,147,0.10)',
        boxShadow: '0 2px 24px rgba(255,79,147,0.06), 0 1px 4px rgba(0,0,0,0.04)',
      }}>
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — KPI principal */}
        <div className="flex-1 p-7 lg:p-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-4"
            style={{ color: '#8b95a7' }}>
            Proyección de cierre
          </p>

          <div className="flex items-end gap-3 mb-2">
            <span className="text-[52px] font-black leading-none tracking-tight"
              style={{ color: '#1f2937' }}>
              {pct != null ? `${pct}%` : '—'}
            </span>
            {changeAbs > 0 && (
              <span className="mb-2 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: isPos ? 'rgba(255,79,147,0.08)' : 'rgba(139,149,167,0.1)',
                  color: isPos ? '#ff4f93' : '#8b95a7'
                }}>
                {isPos ? '+' : '-'}{changeAbs}% vs ayer
              </span>
            )}
          </div>

          <p className="text-[13px] font-medium mb-6" style={{ color: '#8b95a7' }}>
            {isAbove
              ? 'Estás por encima de la meta · sigue el ritmo'
              : pct != null
              ? 'Si mantienes este ritmo cerrarías sobre meta'
              : 'Registra ventas para ver tu proyección'}
          </p>

          {/* Mini chart */}
          <div className="opacity-90">
            <MiniLineChart data={sparkData.length > 1 ? sparkData : [2, 3, 3.5, 4, 3.8, 5, 4.8]} color="#ff4f93" />
          </div>
        </div>

        {/* RIGHT — Progress */}
        <div className="lg:w-52 p-7 lg:p-8 flex flex-col justify-center"
          style={{ borderLeft: '1px solid rgba(255,79,147,0.08)' }}>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-5"
            style={{ color: '#8b95a7' }}>
            Cumplimiento
          </p>
          <span className="text-[36px] font-black leading-none mb-4"
            style={{ color: '#1f2937' }}>
            {pct != null ? `${Math.min(pct, 100)}%` : '—'}
          </span>
          {/* Bar */}
          <div className="rounded-full overflow-hidden mb-2"
            style={{ height: 6, background: 'rgba(255,79,147,0.10)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct ?? 62, 100)}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ffd6e5, #ff4f93)' }} />
          </div>
          <p className="text-[11px]" style={{ color: '#8b95a7' }}>
            {totalBudget > 0
              ? `$${(totalSales / 1e6).toFixed(1)}M de $${(totalBudget / 1e6).toFixed(1)}M`
              : 'Sin presupuesto asignado'}
          </p>
        </div>

      </div>
    </motion.div>
  );
}