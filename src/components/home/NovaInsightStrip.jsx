/**
 * NovaInsightStrip
 * ────────────────────────────────────────────────────────────────────────────
 * Live Nova message area — shows ONLY the 4 "Insight Operativo" messages
 * from the 4 analysis sections (Ventas, Tickets, Transacciones, Sugeridos).
 * Nothing else. Rotates through the 4 sections automatically.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { buildChartData, computeInsight, SECTION_DEFS } from '@/components/dashboard/computeInsight';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// ─── Nova Avatar — renders mascot image removing white background ─────────────
function NovaAvatar({ size = 44 }) {
  const [imgUrl, setImgUrl] = useState(null);

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
      } catch {
        setImgUrl(MASCOT_IMG);
      }
    };
    img.onerror = () => setImgUrl(MASCOT_IMG);
    img.src = MASCOT_IMG;
  }, []);

  return (
    <img
      src={imgUrl || MASCOT_IMG}
      alt="Nova"
      style={{
        width: size, height: size,
        display: 'block', objectFit: 'contain',
        opacity: imgUrl ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    />
  );
}

// ─── Insight message card matching the "Insight Operativo" style ──────────────
const STATUS_STYLES = {
  positive: { bg: 'rgba(236,253,245,0.8)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2, iconColor: '#059669', label: '#047857' },
  warning: { bg: 'rgba(255,251,235,0.85)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, iconColor: '#d97706', label: '#92400e' },
  critical: { bg: 'rgba(255,241,242,0.9)', border: 'rgba(244,63,94,0.25)', icon: AlertTriangle, iconColor: '#e11d48', label: '#9f1239' },
  neutral: { bg: 'rgba(248,250,252,0.85)', border: 'rgba(100,116,139,0.2)', icon: Lightbulb, iconColor: '#64748b', label: '#475569' },
};

function InsightMessage({ section, insight }) {
  const config = STATUS_STYLES[insight.status] || STATUS_STYLES.neutral;
  const Icon = config.icon;

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(255,255,255,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: 15, height: 15, color: config.iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: config.label,
          marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span>📊</span> Insight Operativo
        </p>
        <p style={{
          fontSize: 12.5, fontWeight: 700, color: '#1a202c',
          lineHeight: 1.35, marginBottom: 3,
        }}>
          {insight.keyData}
        </p>
        <p style={{
          fontSize: 11, fontWeight: 400, color: '#4a5568',
          lineHeight: 1.4,
        }}>
          {insight.behavior}
        </p>
      </div>
    </div>
  );
}

// ─── Full panel showing all 4 sections ────────────────────────────────────────
function NovaSectionPanel({ onClose, sections }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        background: 'rgba(8,8,18,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(80px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 60px 140px rgba(0,0,0,0.18), 0 16px 48px rgba(194,24,117,0.07)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 46, height: 46, borderRadius: 16,
              background: 'linear-gradient(145deg, #fff0f8, #fce7f3)',
              border: '1px solid rgba(244,114,182,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(194,24,117,0.12)',
            }}
          >
            <NovaAvatar size={36} />
          </motion.div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 780, color: '#0f172a', letterSpacing: '-0.03em' }}>
              Insights en vivo
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              Nova · 4 secciones de análisis operativo
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 12,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: 'rgba(0,0,0,0.048)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X style={{ width: 14, height: 14, color: '#64748b' }} />
          </button>
        </div>

        {/* Scrollable sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((s, i) => (
            <motion.div
              key={s.metric}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', letterSpacing: '-0.01em' }}>
                  {s.title}
                </p>
              </div>
              <InsightMessage section={s} insight={s.insight} />
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 28px 18px',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 9.5, color: '#d1d5db', fontWeight: 450 }}>
            Nova · análisis generado con datos reales de la operación
          </p>
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C21875' }} />
            <p style={{ fontSize: 9, color: '#C21875', fontWeight: 600, letterSpacing: '0.05em' }}>
              EN VIVO
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function NovaInsightStrip({ dailySales = [] }) {
  const [showPanel, setShowPanel] = useState(false);

  // Build the 4 section insights from dailySales
  const sections = useMemo(() => {
    const chartData = buildChartData(dailySales);
    return SECTION_DEFS.map((def) => ({
      ...def,
      insight: computeInsight(chartData, def.metric),
    }));
  }, [dailySales]);

  // Rotate through the 4 sections
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [sections]);
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % sections.length);
    }, 7000);
    return () => clearInterval(t);
  }, [sections.length]);

  const current = sections[idx];
  if (!current) return null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', minWidth: 0 }}>

        {/* ── AVATAR ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.85, 1.2, 0.85] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(194,24,117,0.15) 0%, transparent 72%)',
              filter: 'blur(12px)', pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(145deg, #fff6fb, #fce7f3)',
              border: '1.5px solid rgba(244,114,182,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(194,24,117,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            <NovaAvatar size={36} />
          </motion.div>
        </div>

        {/* ── SECTION + INSIGHT ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Section header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#C21875', flexShrink: 0,
                  boxShadow: '0 0 6px rgba(194,24,117,0.5)',
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 650, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'rgba(194,24,117,0.6)' }}>
                Nova · en vivo
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Insight card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`insight-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <InsightMessage section={current} insight={current.insight} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── DOT NAV + CTA ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Dot navigation — 4 dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3.5 }} className="hidden sm:flex">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  height: 4, borderRadius: 99, border: 'none',
                  cursor: 'pointer', padding: 0,
                  width: i === idx ? 18 : 4,
                  background: i === idx ? '#C21875' : 'rgba(0,0,0,0.09)',
                  transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            ))}
          </div>

          <motion.button
            onClick={() => setShowPanel(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10.5, fontWeight: 640,
              padding: '7px 13px', borderRadius: 12,
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#64748b',
              background: 'rgba(0,0,0,0.045)',
              outline: '1px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#C21875';
              e.currentTarget.style.background = 'rgba(194,24,117,0.07)';
              e.currentTarget.style.outline = '1px solid rgba(194,24,117,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'rgba(0,0,0,0.045)';
              e.currentTarget.style.outline = '1px solid transparent';
            }}
          >
            Ver todo
            <ArrowRight style={{ width: 9.5, height: 9.5 }} />
          </motion.button>
        </div>
      </div>

      {/* ── FULL PANEL ── */}
      {showPanel && createPortal(
        <AnimatePresence>
          <NovaSectionPanel
            key="nova-panel"
            onClose={() => setShowPanel(false)}
            sections={sections}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}