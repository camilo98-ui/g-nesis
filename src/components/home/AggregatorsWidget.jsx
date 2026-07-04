import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const CHANNEL_META = {
  'Al Paso': { color: '#E91E8C', emoji: '🏃' },
  'Rappi': { color: '#FF3B30', emoji: '🛵' },
  'Didi': { color: '#FF6CAB', emoji: '🍦' },
  'Domicilios Propios': { color: '#AF52DE', emoji: '🏠' },
  'iFood': { color: '#EA1D2C', emoji: '🍕' }
};
const FALLBACK_COLORS = ['#E91E8C', '#FF6CAB', '#FF9EC9', '#AF52DE', '#FB7185', '#F9A8D4'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || { color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length], emoji: '📦' };
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const u = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const bta = u.match(/\bBTA\s*(\d+)/);if (bta) return `BTA ${bta[1]}`;
  const tunja = u.match(/\bTUNJA\s*(\d+)/);if (tunja) return `TUNJA ${tunja[1]}`;
  return storeId;
}

const fmtCOP = (v) => v ?
new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v)) :
'$0';

// Donut SVG component
function DonutChart({ channels, size = 80 }) {
  const cx = size / 2,cy = size / 2;
  const r = size * 0.36,innerR = size * 0.22;
  const circumference = 2 * Math.PI * r;
  const totalPct = channels.reduce((s, c) => s + c.pct, 0) || 100;

  let accumulated = 0;
  const segments = channels.map((c, i) => {
    const pct = c.pct / totalPct;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = circumference * (0.25 - accumulated); // start from top
    accumulated += pct;
    return { ...c, dash, gap, offset, index: i };
  });

  const top = channels[0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(233,30,140,0.06)" strokeWidth={size * 0.14} />
      {/* Segments */}
      {segments.map((seg) =>
      <motion.circle
        key={seg.channel}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.meta.color}
        strokeWidth={size * 0.14}
        strokeDasharray={`${seg.dash} ${seg.gap}`}
        strokeDashoffset={seg.offset}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${seg.dash} ${seg.gap}` }}
        transition={{ delay: seg.index * 0.1 + 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />

      )}
      {/* Center label */}
      <text x={cx} y={cy - size * 0.02} textAnchor="middle" style={{ fontSize: size * 0.24, fontWeight: 900, fill: '#E91E8C', fontFamily: 'Inter Tight, Inter, system-ui' }}>
        {top?.pct.toFixed(0)}%
      </text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" style={{ fontSize: size * 0.10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Inter Tight, Inter, system-ui' }}>
        {top?.channel.split(' ')[0]}
      </text>
    </svg>);

}

export default function AggregatorsWidget({ storeId }) {
  const storeCode = storeId ? extractStoreCode(storeId) : null;
  const navigate = useNavigate();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['agg-widget', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter((r) => String(r.store_code || '').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000
  });

  const channels = useMemo(() => {
    let latestKey = null;
    allRecords.forEach((r) => {
      const key = r.month && r.year ?
      `${r.year}-${String(r.month).padStart(2, '0')}` :
      r.uploaded_at ? (() => {const d = new Date(r.uploaded_at);return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;})() : '';
      if (key && (!latestKey || key > latestKey)) latestKey = key;
    });
    const records = latestKey ? allRecords.filter((r) => {
      const key = r.month && r.year ?
      `${r.year}-${String(r.month).padStart(2, '0')}` :
      r.uploaded_at ? (() => {const d = new Date(r.uploaded_at);return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;})() : '';
      return key === latestKey;
    }) : allRecords;

    const agg = {};
    records.forEach((r) => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0, participation: 0, count: 0 };
      agg[ch].total_sales += r.total_sales || 0;
      const rawPart = r.participation || 0;
      agg[ch].participation += rawPart > 1 ? rawPart : rawPart * 100;
      agg[ch].count += 1;
    });
    const arr = Object.values(agg);
    const totalSalesSum = arr.reduce((s, d) => s + d.total_sales, 0);
    const hasSalesData = totalSalesSum > arr.length;
    if (hasSalesData) {
      arr.sort((a, b) => b.total_sales - a.total_sales);
      return arr.map((d, i) => ({ ...d, pct: totalSalesSum > 0 ? d.total_sales / totalSalesSum * 100 : 0, meta: getMeta(d.channel, i) }));
    } else {
      arr.forEach((d) => {d.participation = d.participation / d.count;});
      const totalPart = arr.reduce((s, d) => s + d.participation, 0);
      arr.sort((a, b) => b.participation - a.participation);
      return arr.map((d, i) => ({ ...d, pct: totalPart > 0 ? d.participation / totalPart * 100 : d.participation, meta: getMeta(d.channel, i) }));
    }
  }, [allRecords]);

  if (isLoading || channels.length === 0) return null;

  const totalVentas = channels.reduce((s, c) => s + c.total_sales, 0);
  const handleOpen = () => navigate(storeCode ? `/AggregatorsView?store=${encodeURIComponent(storeCode)}` : '/AggregatorsView');

  return null;



























































































}