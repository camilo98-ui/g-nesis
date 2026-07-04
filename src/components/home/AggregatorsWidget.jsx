import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const CHANNEL_META = {
  'Al Paso':            { color: '#E91E8C', emoji: '🏃' },
  'Rappi':              { color: '#FF3B30', emoji: '🛵' },
  'Didi':               { color: '#FF6CAB', emoji: '🍦' },
  'Domicilios Propios': { color: '#AF52DE', emoji: '🏠' },
  'iFood':              { color: '#EA1D2C', emoji: '🍕' },
};
const FALLBACK_COLORS = ['#E91E8C','#FF6CAB','#FF9EC9','#AF52DE','#FB7185','#F9A8D4'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || { color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length], emoji: '📦' };
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const u = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const bta = u.match(/\bBTA\s*(\d+)/); if (bta) return `BTA ${bta[1]}`;
  const tunja = u.match(/\bTUNJA\s*(\d+)/); if (tunja) return `TUNJA ${tunja[1]}`;
  return storeId;
}

const fmtCOP = (v) => v
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v))
  : '$0';

// Donut SVG component
function DonutChart({ channels, size = 80 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36, innerR = size * 0.22;
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
      {segments.map((seg) => (
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
          transition={{ delay: seg.index * 0.1 + 0.2, duration: 0.8, ease: [0.23,1,0.32,1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      {/* Center label */}
      <text x={cx} y={cy - size * 0.02} textAnchor="middle" style={{ fontSize: size * 0.24, fontWeight: 900, fill: '#E91E8C', fontFamily: 'Inter Tight, Inter, system-ui' }}>
        {top?.pct.toFixed(0)}%
      </text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" style={{ fontSize: size * 0.10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Inter Tight, Inter, system-ui' }}>
        {top?.channel.split(' ')[0]}
      </text>
    </svg>
  );
}

export default function AggregatorsWidget({ storeId }) {
  const storeCode = storeId ? extractStoreCode(storeId) : null;
  const navigate = useNavigate();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['agg-widget', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter(r => String(r.store_code||'').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
  });

  const channels = useMemo(() => {
    let latestKey = null;
    allRecords.forEach(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      if (key && (!latestKey || key > latestKey)) latestKey = key;
    });
    const records = latestKey ? allRecords.filter(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      return key === latestKey;
    }) : allRecords;

    const agg = {};
    records.forEach(r => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0, participation: 0, count: 0 };
      agg[ch].total_sales += r.total_sales || 0;
      const rawPart = r.participation || 0;
      agg[ch].participation += rawPart > 1 ? rawPart : rawPart * 100;
      agg[ch].count += 1;
    });
    const arr = Object.values(agg);
    const totalSalesSum = arr.reduce((s,d) => s + d.total_sales, 0);
    const hasSalesData = totalSalesSum > arr.length;
    if (hasSalesData) {
      arr.sort((a,b) => b.total_sales - a.total_sales);
      return arr.map((d,i) => ({ ...d, pct: totalSalesSum > 0 ? (d.total_sales / totalSalesSum * 100) : 0, meta: getMeta(d.channel, i) }));
    } else {
      arr.forEach(d => { d.participation = d.participation / d.count; });
      const totalPart = arr.reduce((s,d) => s + d.participation, 0);
      arr.sort((a,b) => b.participation - a.participation);
      return arr.map((d,i) => ({ ...d, pct: totalPart > 0 ? (d.participation / totalPart * 100) : d.participation, meta: getMeta(d.channel, i) }));
    }
  }, [allRecords]);

  if (isLoading || channels.length === 0) return null;

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const handleOpen = () => navigate(storeCode ? `/AggregatorsView?store=${encodeURIComponent(storeCode)}` : '/AggregatorsView');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23,1,0.32,1] }}
      onClick={handleOpen}
      style={{
        borderRadius: 20,
        background: 'rgba(255,255,255,0.93)',
        border: '1px solid rgba(233,30,140,0.10)',
        boxShadow: '0 4px 24px rgba(233,30,140,0.08), inset 0 1px 0 #fff',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient glow top-right */}
      <div style={{
        position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(233,30,140,0.06) 0%, transparent 70%)',
        pointerEvents:'none',
      }}/>
      <div style={{
        position:'absolute', bottom:-40, left:-40, width:140, height:140, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(175,82,222,0.05) 0%, transparent 70%)',
        pointerEvents:'none',
      }}/>

      {/* Header strip */}
      <div style={{ padding:'14px 16px 0', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:8, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color:'#94a3b8', margin:0, marginBottom:2 }}>
              Canales de Venta
            </p>
            <p style={{ fontSize:8, fontWeight:500, color:'#cbd5e1', margin:0 }}>Participación por canal</p>
          </div>
          {totalVentas > 1 && (
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#E91E8C', margin:0, marginBottom:1 }}>Total</p>
              <p style={{ fontSize:12, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.03em', lineHeight:1 }}>{fmtCOP(totalVentas)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Body: donut left + channel list right */}
      <div style={{ display:'flex', gap:12, padding:'12px 16px 14px', alignItems:'center', position:'relative', zIndex:1 }}>
        
        {/* Donut */}
        <div style={{ flexShrink:0 }}>
          <DonutChart channels={channels} size={92} />
        </div>

        {/* Channel rows */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5, minWidth:0 }}>
          {channels.slice(0, 5).map((c, i) => (
            <motion.div
              key={c.channel}
              initial={{ opacity:0, x:8 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.4 }}
              style={{ display:'flex', alignItems:'center', gap:6 }}
            >
              {/* Dot */}
              <div style={{ width:6, height:6, borderRadius:'50%', background:c.meta.color, flexShrink:0, boxShadow:`0 0 6px ${c.meta.color}60` }} />
              {/* Name */}
              <p style={{ fontSize:9, fontWeight:600, color:'#64748b', margin:0, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {c.channel}
              </p>
              {/* Bar track */}
              <div style={{ width:48, height:4, borderRadius:4, background:'rgba(233,30,140,0.07)', flexShrink:0, overflow:'hidden' }}>
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${c.pct}%` }}
                  transition={{ delay: i * 0.06 + 0.4, duration: 0.7, ease:[0.23,1,0.32,1] }}
                  style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg, ${c.meta.color}cc, ${c.meta.color}88)` }}
                />
              </div>
              {/* Pct */}
              <p style={{ fontSize:9, fontWeight:800, color:c.meta.color, margin:0, minWidth:28, textAlign:'right', letterSpacing:'-0.01em' }}>
                {c.pct.toFixed(1)}%
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{ height:2, background:'linear-gradient(90deg, transparent, rgba(233,30,140,0.20), rgba(175,82,222,0.15), transparent)' }} />
    </motion.div>
  );
}