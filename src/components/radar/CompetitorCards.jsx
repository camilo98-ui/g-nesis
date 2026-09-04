import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Crown, Layers } from 'lucide-react';
import { getInitial } from './RadarShared';

const STATUS_CONFIG = {
  lider: { label: 'LÍDER', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  creciendo: { label: 'CRECIENDO', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
  estable: { label: 'ESTABLE', color: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.12)' },
  caida: { label: 'DESACELERANDO', color: '#e11d48', bg: 'rgba(225,29,72,0.06)', border: 'rgba(225,29,72,0.15)' },
  pendiente: { label: 'SIN DATOS', color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.12)' }
};

function getStatus(brand, isTopBrand) {
  if (brand.onlyOneReading) return 'pendiente';
  if (isTopBrand) return 'lider';
  if (brand.growth > 5) return 'creciendo';
  if (brand.growth < -5) return 'caida';
  return 'estable';
}

export default function CompetitorCards({ brandStats, totalAll }) {
  return null;























































































}