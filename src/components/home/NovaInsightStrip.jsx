/**
 * NovaInsightStrip
 * ────────────────────────────────────────────────────────────────────────────
 * Live Nova message area — shows ONLY the 4 "Insight Operativo" messages
 * from the 4 analysis sections (Ventas, Tickets, Transacciones, Sugeridos).
 * Keeps the original aesthetic: flowing text, avatar, typewriter — no boxes.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { buildChartData, computeInsight, SECTION_DEFS } from '@/components/dashboard/computeInsight';
import { useAIInsights } from '@/hooks/useAIInsights';

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

// ─── Typing cursor effect ─────────────────────────────────────────────────────
function TypewriterText({ text, speed = 24, delay = 0, onDone }) {
  const [chars, setChars] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = React.useRef(null);

  useEffect(() => {
    setChars('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const start = setTimeout(() => {
      timerRef.current = setInterval(() => {
        i++;
        setChars(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timerRef.current);
          setDone(true);
          onDone?.();
        }
      }, speed);
    }, delay);
    return () => { clearTimeout(start); clearInterval(timerRef.current); };
  }, [text, speed, delay]);

  return (
    <span>
      {chars}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            display: 'inline-block', width: 1.5, height: '0.85em',
            background: 'currentColor', verticalAlign: 'middle',
            marginLeft: 1.5, borderRadius: 1,
          }}
        />
      )}
    </span>
  );
}

// ─── Mood mapping per insight status ──────────────────────────────────────────
const MOOD = {
  critical: {
    dot: 'rgba(239,68,68,0.75)',
    ring: 'rgba(239,68,68,0.15)',
    label: 'atención',
    labelColor: 'rgba(220,38,38,0.55)',
  },
  warning: {
    dot: '#f59e0b',
    ring: 'rgba(245,158,11,0.15)',
    label: 'observando',
    labelColor: 'rgba(180,83,9,0.55)',
  },
  positive: {
    dot: 'rgba(16,185,129,0.8)',
    ring: 'rgba(16,185,129,0.15)',
    label: 'positivo',
    labelColor: 'rgba(5,150,105,0.55)',
  },
  neutral: {
    dot: '#C21875',
    ring: 'rgba(194,24,117,0.15)',
    label: 'analizando',
    labelColor: 'rgba(194,24,117,0.6)',
  },
};

// ─── Full panel showing all 4 sections as flowing text ────────────────────────
function NovaSectionPanel({ onClose, sections, isAI }) {
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
          width: '100%', maxWidth: 620,
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
              Nova · {isAI ? 'análisis estratégico con IA' : '4 secciones de análisis operativo'}
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
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="#64748b" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable sections — flowing text, no boxes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map((s, i) => {
            const m = MOOD[s.insight.status] || MOOD.neutral;
            return (
              <motion.div
                key={s.metric}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <div style={{ paddingTop: 4, flexShrink: 0 }}>
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.4 }}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: m.dot, boxShadow: `0 0 8px ${m.dot}`,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#C21875',
                    marginBottom: 4,
                  }}>
                    {s.emoji} {s.title}
                  </p>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: '#1e293b',
                    lineHeight: 1.45, marginBottom: 2, letterSpacing: '-0.01em',
                  }}>
                    {s.insight.keyData}
                  </p>
                  <p style={{
                    fontSize: 11.5, fontWeight: 400, color: '#64748b',
                    lineHeight: 1.45, letterSpacing: '-0.005em',
                  }}>
                    {s.insight.behavior}
                  </p>
                  {s.insight.strategicAction && (
                    <div style={{
                      marginTop: 6, padding: '8px 10px',
                      borderRadius: 10,
                      background: 'rgba(194,24,117,0.06)',
                      border: '1px solid rgba(194,24,117,0.12)',
                    }}>
                      <p style={{
                        fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: '#C21875', marginBottom: 3,
                      }}>
                        🎯 Acción estratégica
                      </p>
                      <p style={{
                        fontSize: 11.5, fontWeight: 500, color: '#1e293b',
                        lineHeight: 1.4,
                      }}>
                        {s.insight.strategicAction}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 28px 18px',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 9.5, color: '#d1d5db', fontWeight: 450 }}>
            Nova · {isAI ? 'análisis estratégico generado con IA' : 'análisis con datos reales'}
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

  // AI-powered deep insights (instant local fallback while AI loads)
  const { sections, isAI } = useAIInsights(dailySales);

  // Rotate through the 4 sections
  const [idx, setIdx] = useState(0);
  const [line1Done, setLine1Done] = useState(false);
  useEffect(() => { setIdx(0); setLine1Done(false); }, [sections]);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % sections.length);
      setLine1Done(false);
    }, 8000);
    return () => clearInterval(t);
  }, [sections.length]);

  useEffect(() => { setLine1Done(false); }, [idx]);

  const current = sections[idx];
  if (!current) return null;

  const mood = MOOD[current.insight.status] || MOOD.neutral;
  const dotCount = sections.length;

  return (
    <>
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
            animate={{ opacity: [0, 0.5, 0], scale: [0.75, 1.4, 0.75] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
            style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `1.5px solid ${mood.dot}`, pointerEvents: 'none',
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
            <NovaAvatar size={38} />
          </motion.div>
        </div>

        {/* ── TEXT ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Section micro-label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: mood.dot, flexShrink: 0,
                  boxShadow: `0 0 6px ${mood.dot}80`,
                }}
              />
              <span style={{
                fontSize: 9, fontWeight: 650,
                letterSpacing: '0.11em', textTransform: 'uppercase',
                color: '#C21875',
              }}>
                {current.emoji} {current.title} · Nova {mood.label}
              </span>
              {isAI && (
                <span style={{
                  fontSize: 7.5, fontWeight: 700,
                  padding: '1.5px 5px', borderRadius: 4,
                  background: 'linear-gradient(135deg, #C21875, #8A0F54)',
                  color: '#fff', letterSpacing: '0.05em',
                  lineHeight: 1, display: 'inline-flex', alignItems: 'center',
                }}>
                  IA
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Insight text — keyData + behavior */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <p style={{
                fontSize: 13, fontWeight: 570,
                color: '#1a1a2e', lineHeight: 1.42,
                letterSpacing: '-0.014em', marginBottom: 2,
                whiteSpace: 'pre-wrap',
              }}>
                <TypewriterText
                  text={current.insight.keyData}
                  speed={21}
                  onDone={() => setLine1Done(true)}
                />
              </p>
              <AnimatePresence>
                {line1Done && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.08 }}
                    style={{
                      fontSize: 11.5, fontWeight: 400,
                      color: '#94a3b8', lineHeight: 1.45,
                      letterSpacing: '-0.008em',
                    }}
                  >
                    {current.insight.behavior}
                  </motion.p>
                )}
                {line1Done && current.insight.strategicAction && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.16 }}
                    style={{
                      fontSize: 10.5, fontWeight: 600,
                      color: '#C21875', lineHeight: 1.4,
                      marginTop: 3, letterSpacing: '-0.008em',
                    }}
                  >
                    🎯 {current.insight.strategicAction}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Dot navigation — 4 dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3.5 }}
            className="hidden sm:flex">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setLine1Done(false); }}
                style={{
                  height: 4, borderRadius: 99, border: 'none',
                  cursor: 'pointer', padding: 0,
                  width: i === idx % dotCount ? 18 : 4,
                  background: i === idx % dotCount ? mood.dot : 'rgba(0,0,0,0.09)',
                  transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            ))}
          </div>

          {/* CTA Button */}
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
              letterSpacing: '-0.008em',
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
            Ver análisis
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
            isAI={isAI}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}