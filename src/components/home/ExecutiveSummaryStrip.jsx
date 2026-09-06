/**
 * ExecutiveSummaryStrip
 * ────────────────────────────────────────────────────────────────────────────
 * Resumen ejecutivo narrado para la tarjeta hero del Home.
 * Auto-obtiene sus propios datos (DailySales + Budget activo) para la tienda
 * seleccionada, independiente del filtro de fechas del dashboard, y construye
 * un párrafo tipo consultor: venta hoy vs PPT, brecha acumulada, proyección
 * de cierre y ritmo diario requerido.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { calculateBudgetData } from '@/lib/budgetCalculations';
import { Sparkles, TrendingUp, TrendingDown, Target } from 'lucide-react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtPct = (n) => `${(n || 0).toFixed(0)}%`;

export default function ExecutiveSummaryStrip({ storeCode, district }) {
  const [imgUrl, setImgUrl] = useState(null);

  // ── Nova avatar (fondo blanco removido) ──
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = d.data;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          if (r > 220 && g > 220 && b > 220) { px[i + 3] = 0; }
          else if (r > 180 && g > 180 && b > 180) {
            px[i + 3] = Math.round(255 * (1 - ((r + g + b) / 3 - 180) / 75));
          }
        }
        ctx.putImageData(d, 0, 0);
        setImgUrl(canvas.toDataURL());
      } catch { setImgUrl(MASCOT_IMG); }
    };
    img.onerror = () => setImgUrl(MASCOT_IMG);
    img.src = MASCOT_IMG;
  }, []);

  // ── Datos propios: DailySales + Budget + DailyBudget de la tienda ──
  const { data: dailySales = [] } = useQuery({
    queryKey: ['exec-summary-daily', storeCode],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeCode }, '-date', 60),
    enabled: !!storeCode,
    staleTime: 60 * 1000,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['exec-summary-budget', storeCode],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeCode }),
    enabled: !!storeCode,
    staleTime: 60 * 1000,
  });

  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['exec-summary-dailybudget', storeCode],
    queryFn: () => base44.entities.DailyBudget.filter({ store_id: storeCode }),
    enabled: !!storeCode,
    staleTime: 60 * 1000,
  });

  // Budget activo del mes actual
  const activeBudget = useMemo(() => {
    if (!budgets.length) return null;
    const now = new Date();
    const m = now.getMonth() + 1, y = now.getFullYear();
    return budgets.find((b) => b.month === m && b.year === y && b.is_active)
      || budgets.find((b) => b.month === m && b.year === y)
      || budgets.find((b) => b.is_active)
      || budgets[0];
  }, [budgets]);

  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) return null;
    return calculateBudgetData(activeBudget, dailySales, dailyBudgets, storeCode);
  }, [activeBudget, dailySales, dailyBudgets, storeCode]);

  const summary = useMemo(() => {
    const sorted = [...dailySales].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];
    const todaySales = latest?.total_sales || 0;
    const todayTxn = latest?.total_transactions || 0;
    const todayTicket = todayTxn > 0 ? todaySales / todayTxn : 0;
    const lastDate = latest?.date;

    const pptHoy = budgetData?.excelBudgetForToday || (budgetData?.monthlyBudget ? budgetData.monthlyBudget / 30 : 0);
    const monthlyBudget = budgetData?.monthlyBudget || 0;
    const salesAcum = budgetData?.salesUntilYesterday || 0;
    const budgetAcum = budgetData?.budgetUntilYesterday || 0;
    const gap = salesAcum - budgetAcum;
    const projPct = budgetData?.monthProjectionCompliance ?? 0;
    const projCierre = budgetData?.monthProjection || 0;
    const remainingDays = budgetData?.remainingDays ?? 0;
    const remainingBudget = budgetData?.remainingBudget ?? 0;
    const dailyReq = remainingDays > 0 ? remainingBudget / remainingDays : 0;

    const dailyCompliance = pptHoy > 0 ? (todaySales / pptHoy * 100) : 0;
    const isPos = gap >= 0;

    // ── Construcción del párrafo narrado ──
    let headline = '';
    let body = '';
    let status = 'neutral';

    if (!dailySales.length) {
      headline = 'Sin datos de venta diaria registrados para esta tienda.';
      body = 'Carga el reporte de ventas del día para activar el resumen ejecutivo en vivo.';
      status = 'critical';
    } else if (!budgetData || monthlyBudget === 0) {
      // Hay ventas pero no hay presupuesto definido
      const prev = sorted[1];
      const vsAyer = prev ? ((todaySales - (prev.total_sales || 0)) / (prev.total_sales || 1) * 100) : 0;
      headline = `Hoy ${lastDate ? `(${lastDate}) ` : ''}vendiste ${fmtCOP(todaySales)} en ${todayTxn} transacciones${prev ? ` (${vsAyer >= 0 ? '+' : ''}${fmtPct(vsAyer)} vs ayer)` : ''}.`;
      status = vsAyer >= 0 ? 'positive' : 'critical';
      body = `Sin presupuesto mensual definido — carga el PPT para activar la proyección de cumplimiento y la brecha del mes. Ticket promedio: ${fmtCOP(todayTicket)}.`;
    } else {
      headline = `Hoy ${lastDate ? `(${lastDate}) ` : ''}vendiste ${fmtCOP(todaySales)} vs meta diaria ${fmtCOP(pptHoy)} (${fmtPct(dailyCompliance)} de cumplimiento).`;
      status = dailyCompliance >= 100 ? 'positive' : dailyCompliance >= 85 ? 'neutral' : 'critical';

      const gapTxt = isPos
        ? `Vas ${fmtCOP(Math.abs(gap))} sobre la meta acumulada del mes`
        : `Brecha acumulada del mes: ${fmtCOP(Math.abs(gap))} bajo la meta`;

      const projTxt = monthlyBudget > 0
        ? `Proyectas cerrar el mes en ${fmtPct(projPct)} de cumplimiento (${fmtCOP(projCierre)} de ${fmtCOP(monthlyBudget)})`
        : 'Sin presupuesto mensual definido para proyectar';

      const reqTxt = (remainingDays > 0 && dailyReq > 0)
        ? ` · necesitas ${fmtCOP(dailyReq)}/día durante los ${remainingDays} días restantes para alcanzar la meta`
        : '';

      const ticketTxt = todayTicket > 0 ? ` · ticket promedio ${fmtCOP(todayTicket)} en ${todayTxn} transacciones` : '';

      body = `${gapTxt}. ${projTxt}${reqTxt}${ticketTxt}`;
    }

    return { headline, body, status, todayTicket, todayTxn, lastDate };
  }, [dailySales, budgetData]);

  const mood = {
    critical: { dot: 'rgba(239,68,68,0.8)', ring: 'rgba(239,68,68,0.15)', label: 'atención', icon: TrendingDown, color: '#dc2626' },
    warning: { dot: '#f59e0b', ring: 'rgba(245,158,11,0.15)', label: 'observando', icon: Target, color: '#d97706' },
    positive: { dot: 'rgba(16,185,129,0.85)', ring: 'rgba(16,185,129,0.15)', label: 'positivo', icon: TrendingUp, color: '#059669' },
    neutral: { dot: '#C21875', ring: 'rgba(194,24,117,0.15)', label: 'analizando', icon: Sparkles, color: '#C21875' },
  }[summary.status];

  const MoodIcon = mood.icon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%', minWidth: 0 }}>
      {/* ── AVATAR ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.85, 1.2, 0.85] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            background: `radial-gradient(circle, ${mood.ring} 0%, transparent 72%)`,
            filter: 'blur(12px)', pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'relative', zIndex: 1,
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(145deg, #fff6fb, #fce7f3)',
            border: '1.5px solid rgba(244,114,182,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 20px rgba(194,24,117,0.12), 0 0 0 3px ${mood.ring}, inset 0 1px 0 rgba(255,255,255,0.95)`,
          }}
        >
          <img
            src={imgUrl || MASCOT_IMG}
            alt="Nova"
            style={{ width: 38, height: 38, objectFit: 'contain', opacity: imgUrl ? 1 : 0, transition: 'opacity 0.3s' }}
          />
        </motion.div>
      </div>

      {/* ── TEXTO NARRADO ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: '50%', background: mood.dot, boxShadow: `0 0 6px ${mood.dot}80`, flexShrink: 0 }}
          />
          <span style={{ fontSize: 9, fontWeight: 650, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#C21875' }}>
            <MoodIcon style={{ width: 10, height: 10, display: 'inline', marginRight: 2, verticalAlign: 'middle' }} />
            Resumen ejecutivo · Nova {mood.label}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={summary.headline}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
              fontSize: 14.5, fontWeight: 700, color: '#0f172a',
              lineHeight: 1.4, letterSpacing: '-0.014em', marginBottom: 3,
            }}
          >
            {summary.headline}
          </motion.p>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            fontSize: 12, fontWeight: 450, color: '#64748b',
            lineHeight: 1.45, letterSpacing: '-0.008em',
          }}
        >
          {summary.body}
        </motion.p>
      </div>
    </div>
  );
}