/**
 * StockSummaryModal
 * Shows a count of each flavor across all freezers for the current store.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function StockSummaryModal({ open, onClose, allSlots = [], storeName, totalCapacity = 0 }) {
  const { flavorCounts, totalFilled } = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return { flavorCounts: [], totalFilled: 0 };

    const counts = {};
    let filled = 0;

    allSlots.forEach((slot) => {
      if (slot.is_empty || !slot.flavor_name) return;
      filled++;
      const key = slot.flavor_name.trim();
      if (!counts[key]) {
        counts[key] = {
          name: slot.flavor_name,
          color: slot.color || '#FFB5C5',
          type: slot.flavor_type || '',
          count: 0,
          frontCount: 0,
          backCount: 0,
        };
      }
      counts[key].count++;
      if (slot.slot_type === 'T') counts[key].backCount++;
      else counts[key].frontCount++;
    });

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return { flavorCounts: sorted, totalFilled: filled };
  }, [allSlots]);

  const totalEmpty = totalCapacity > 0 ? Math.max(0, totalCapacity - totalFilled) : allSlots.filter((s) => s.is_empty || !s.flavor_name).length;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: 'rgba(8,8,18,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 540,
            maxHeight: '85vh',
            display: 'flex', flexDirection: 'column',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.98)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 8px 32px rgba(194,24,117,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 780, color: '#C21875', letterSpacing: '-0.02em' }}>
                📦 Stock de Sabores
              </h2>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                {storeName ? `${storeName} · ` : ''}{flavorCounts.length} sabores distintos · {totalFilled}/{totalCapacity || totalFilled} posiciones
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} color="#64748b" />
            </button>
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'flex', gap: 10, padding: '14px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(194,24,117,0.07)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#C21875', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sabores únicos</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>{flavorCounts.length}</p>
            </div>
            <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(194,24,117,0.04)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#C21875', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Llenas</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>{totalFilled}</p>
            </div>
            <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(148,163,184,0.08)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vacías</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>{totalEmpty}</p>
            </div>
          </div>

          {/* Flavor list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 20px' }}>
            {flavorCounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 8 }}>🧊</p>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>No hay sabores cargados en las neveras</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {flavorCounts.map((flavor, i) => (
                  <motion.div
                    key={flavor.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(248,250,252,0.8)',
                      border: '1px solid rgba(226,232,240,0.6)',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, ${flavor.color}ff, ${flavor.color}cc)`,
                      boxShadow: `0 2px 8px ${flavor.color}40`,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', letterSpacing: '-0.01em' }}>
                        {flavor.name}
                      </p>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                        Frontal: {flavor.frontCount} · Trasero: {flavor.backCount}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px', borderRadius: 10,
                      background: 'rgba(194,24,117,0.08)',
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#C21875' }}>
                        {flavor.count}
                      </span>
                      <span style={{ fontSize: 9, color: '#C21875', fontWeight: 600 }}>
                        CR
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}