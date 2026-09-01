/* ── Formatters ── */
export const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${Math.round(abs)}`;
};
export const fmtPct = (n) => (n == null || isNaN(n) ? '—' : `${n.toFixed(1)}%`);
export const fmtInt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('es-CO'));
export const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(n || 0));

/* ── Targets (configurable defaults) ── */
export const TARGETS = {
  ebitda: 27,
  nps: 85,
  ticket: 22000,
  compliance: 100,
};

/* ── Status configuration ── */
export const STATUS_CONFIG = {
  excelente: { label: 'Excelente', color: '#10b981', bg: 'rgba(16,185,129,0.1)', priority: 0 },
  bueno:     { label: 'Bueno',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', priority: 1 },
  riesgo:    { label: 'En riesgo', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', priority: 2 },
  atencion:  { label: 'Atención',  color: '#f97316', bg: 'rgba(249,115,22,0.1)', priority: 3 },
  critico:   { label: 'Crítico',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  priority: 4 },
  sin_info:  { label: 'Sin info',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', priority: 5 },
};

export function getStoreStatus(compliance, hasData) {
  if (!hasData) return STATUS_CONFIG.sin_info;
  const c = compliance ?? 0;
  if (c >= 95) return STATUS_CONFIG.excelente;
  if (c >= 85) return STATUS_CONFIG.bueno;
  if (c >= 70) return STATUS_CONFIG.riesgo;
  if (c >= 50) return STATUS_CONFIG.atencion;
  return STATUS_CONFIG.critico;
}

/* ── Performance Score (configurable weights) ── */
export const SCORE_WEIGHTS = {
  compliance: 0.30,
  ebitda: 0.20,
  nps: 0.15,
  transactions: 0.15,
  ticket: 0.10,
  other: 0.10,
};

export function calcPerformanceScore(store, districtAvg) {
  if (!store.hasData) return 0;
  const compliance = Math.min(store.compliance ?? 0, 100);
  const ebitda = store.pyg?.margen_ebitda != null ? Math.min((store.pyg.margen_ebitda * 100) / TARGETS.ebitda * 100, 100) : 0;
  const nps = store.nps != null ? Math.min(store.nps / 10 * 100, 100) : 0;
  const tx = districtAvg?.avgTx > 0 ? Math.min((store.rangeTx || 0) / districtAvg.avgTx * 100, 100) : 0;
  const ticket = districtAvg?.avgTicket > 0 ? Math.min((store.avgTicket || 0) / districtAvg.avgTicket * 100, 100) : 0;
  const other = (compliance + ebitda) / 2;

  return Math.round(
    compliance * SCORE_WEIGHTS.compliance +
    ebitda * SCORE_WEIGHTS.ebitda +
    nps * SCORE_WEIGHTS.nps +
    tx * SCORE_WEIGHTS.transactions +
    ticket * SCORE_WEIGHTS.ticket +
    other * SCORE_WEIGHTS.other
  );
}

/* ── Variation formatter ── */
export function fmtVariation(val, type) {
  if (val == null || isNaN(val)) return null;
  const sign = val >= 0 ? '+' : '';
  if (type === 'pp') return `${sign}${val.toFixed(1)} pp`;
  if (type === 'pts') return `${sign}${val.toFixed(0)} pts`;
  return `${sign}${val.toFixed(1)}%`;
}