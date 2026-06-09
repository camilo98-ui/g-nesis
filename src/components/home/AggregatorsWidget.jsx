import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHANNEL_META = {
  'Al Paso':           { color: '#E91E8C', emoji: '🏠' },
  'Rappi':             { color: '#FF3B30', emoji: '🛵' },
  'Didi':              { color: '#FF9500', emoji: '🚗' },
  'Domicilios Propios':{ color: '#5856D6', emoji: '📦' },
  'iFood':             { color: '#EA1D2C', emoji: '🍔' },
};
const FALLBACK_COLORS = ['#E91E8C','#FF6CAB','#FF9500','#5856D6','#34C759','#AF52DE'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || { color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length], emoji: '📊' };
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
  const handleOpen = () => navigate(storeCode ? `/AggregatorsView?store=${encodeURIComponent(storeCode)}` : '/AggregatorsView');

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }}
      onClick={handleOpen}
      style={{
        borderRadius: 16,
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(233,30,140,0.12)',
        boxShadow: '0 2px 12px rgba(233,30,140,0.07)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Label */}
      <div style={{ flexShrink:0 }}>
        <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', color:'#E91E8C', margin:0, marginBottom:1 }}>Agregadores</p>
        <p style={{ fontSize:11, fontWeight:900, color:'#1a1a2e', margin:0, letterSpacing:'-0.02em' }}>
          {totalVentas > 1 ? fmtCOP(totalVentas) : `${channels.length} canales`}
        </p>
      </div>

      {/* Dot bars */}
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
        {channels.slice(0,5).map((c) => (
          <div key={c.channel} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1 }}>
            <div style={{ width:'100%', height:5, borderRadius:99, background:`${c.meta.color}15`, overflow:'hidden' }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${c.pct}%` }}
                transition={{ duration:0.7, ease:[0.23,1,0.32,1] }}
                style={{ height:5, borderRadius:99, background:c.meta.color }}
              />
            </div>
            <span style={{ fontSize:8, fontWeight:700, color:c.meta.color }}>{c.pct.toFixed(0)}%</span>
            <span style={{ fontSize:7, color:'#94a3b8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
              {c.channel.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      <ChevronRight style={{color:'#E91E8C',width:12,height:12,opacity:0.5,flexShrink:0}}/>
    </motion.div>
  );
}