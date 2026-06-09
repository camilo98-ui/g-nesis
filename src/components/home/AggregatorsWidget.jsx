import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const CHANNEL_META = {
  'Al Paso':            { color: '#E91E8C' },
  'Rappi':              { color: '#FF3B30' },
  'Didi':               { color: '#FF6CAB' },
  'Domicilios Propios': { color: '#AF52DE' },
  'iFood':              { color: '#EA1D2C' },
};
const FALLBACK_COLORS = ['#E91E8C','#FF6CAB','#FF9EC9','#F472B6','#FB7185','#F9A8D4'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || { color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length] };
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
  const topChannel = channels[0];
  const avgPct = channels.length > 0 ? (channels.reduce((s,c) => s + c.pct, 0) / channels.length) : 0;
  const maxPct = Math.max(...channels.map(c => c.pct), 1);
  const BAR_HEIGHT = 80;

  const handleOpen = () => navigate(storeCode ? `/AggregatorsView?store=${encodeURIComponent(storeCode)}` : '/AggregatorsView');

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45 }}
      onClick={handleOpen}
      style={{
        borderRadius: 24,
        padding: '16px 18px 14px',
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(233,30,140,0.10)',
        boxShadow: '0 4px 24px rgba(233,30,140,0.08), inset 0 1px 0 #fff',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient top glow */}
      <div style={{
        position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(233,30,140,0.07) 0%, transparent 70%)',
        pointerEvents:'none',
      }}/>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, position:'relative', zIndex:1 }}>
        <div>
          <p style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color:'#94a3b8', margin:0, marginBottom:2 }}>
            Canales de Venta
          </p>
          <p style={{ fontSize:10, color:'#94a3b8', margin:0, fontWeight:500 }}>Participación por canal</p>
        </div>
        {totalVentas > 1 && (
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', color:'#E91E8C', margin:0, marginBottom:1 }}>Total</p>
            <p style={{ fontSize:14, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.03em' }}>{fmtCOP(totalVentas)}</p>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height: BAR_HEIGHT + 28, marginBottom:12, position:'relative', zIndex:1 }}>
        {channels.slice(0,6).map((c, i) => {
          const barH = Math.max((c.pct / maxPct) * BAR_HEIGHT, 8);
          const color = c.meta.color;
          return (
            <div key={c.channel} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height: BAR_HEIGHT + 28, gap:4 }}>
              {/* Bar */}
              <div style={{ width:'100%', height: BAR_HEIGHT, display:'flex', alignItems:'flex-end' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ delay: i * 0.07, duration: 0.7, ease: [0.23,1,0.32,1] }}
                  style={{
                    width: '100%',
                    borderRadius: '10px 10px 6px 6px',
                    background: `linear-gradient(180deg, ${color}dd 0%, ${color}88 100%)`,
                    boxShadow: `0 4px 12px ${color}30`,
                  }}
                />
              </div>
              {/* Label */}
              <span style={{ fontSize:8, fontWeight:600, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%', textAlign:'center' }}>
                {c.channel.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* KPI pills */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, position:'relative', zIndex:1 }}>
        {/* Top canal */}
        <div style={{ borderRadius:12, padding:'8px 10px', background:'rgba(233,30,140,0.05)', border:'1px solid rgba(233,30,140,0.10)' }}>
          <p style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#94a3b8', margin:0, marginBottom:2 }}>Canal Top</p>
          <p style={{ fontSize:11, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.02em', lineHeight:1.1 }}>
            {topChannel?.pct.toFixed(1)}%
          </p>
          <p style={{ fontSize:8, color:'#94a3b8', margin:0, fontWeight:500, marginTop:1 }}>{topChannel?.channel.split(' ')[0]}</p>
        </div>

        {/* Promedio */}
        <div style={{ borderRadius:12, padding:'8px 10px', background:'rgba(233,30,140,0.05)', border:'1px solid rgba(233,30,140,0.10)' }}>
          <p style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#94a3b8', margin:0, marginBottom:2 }}>Promedio</p>
          <p style={{ fontSize:11, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.02em', lineHeight:1.1 }}>
            {avgPct.toFixed(1)}%
          </p>
          <p style={{ fontSize:8, color:'#94a3b8', margin:0, fontWeight:500, marginTop:1 }}>por canal</p>
        </div>

        {/* Canales */}
        <div style={{ borderRadius:12, padding:'8px 10px', background:'rgba(233,30,140,0.05)', border:'1px solid rgba(233,30,140,0.10)' }}>
          <p style={{ fontSize:7, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#94a3b8', margin:0, marginBottom:2 }}>Canales</p>
          <p style={{ fontSize:11, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.02em', lineHeight:1.1 }}>
            {channels.length}
          </p>
          <p style={{ fontSize:8, color:'#94a3b8', margin:0, fontWeight:500, marginTop:1 }}>activos</p>
        </div>
      </div>
    </motion.div>
  );
}