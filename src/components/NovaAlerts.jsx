import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, CheckCircle2, X, Bell } from 'lucide-react';

export default function NovaAlerts({ alerts = [], onDismiss }) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  const handleDismiss = (id) => {
    setVisibleAlerts(prev => prev.filter(a => a.id !== id));
    onDismiss?.(id);
  };

  const getAlertIcon = (type, severity) => {
    if (type === 'top_performer') return TrendingUp;
    if (severity === 'critical') return AlertCircle;
    if (severity === 'positive') return CheckCircle2;
    return Bell;
  };

  const getAlertColor = (type, severity) => {
    if (type === 'top_performer') return '#10b981'; // green
    if (severity === 'critical') return '#ef4444'; // red
    if (severity === 'warning') return '#f59e0b'; // orange
    return '#3b82f6'; // blue
  };

  return (
    <div className="fixed bottom-32 right-4 z-[9998] flex flex-col gap-2 max-w-xs pointer-events-none">
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type, alert.severity);
          const color = getAlertColor(alert.type, alert.severity);

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 400, y: 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden shadow-lg pointer-events-auto"
              style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${color}20`,
              }}
            >
              <div className="p-3.5 flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}15` }}
                >
                  <Icon style={{ color, width: 16, height: 16 }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{alert.title}</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{alert.message}</p>
                </div>

                {/* Close */}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 hover:bg-black/5 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 6, ease: 'linear' }}
                style={{
                  height: 2,
                  background: color,
                  originX: 0,
                }}
                onAnimationComplete={() => handleDismiss(alert.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}