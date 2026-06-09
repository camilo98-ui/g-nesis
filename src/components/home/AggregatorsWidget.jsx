import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronRight, Crown } from 'lucide-react';
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
    // Get latest month
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
      return arr.map((d,i) => ({ ...d, total_sales: 0, pct: totalPart > 0 ? (d.participation / totalPart * 100) : d.participation, meta: getMeta(d.channel, i) }));
    }
  }, [allRecords]);

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const leader = channels[0];
  const donutData = channels.map(c => ({ name: c.channel, value: c.total_sales > 1 ? c.total_sales : c.pct, color: c.meta.color }));

  const handleOpen = () => {
    const url = storeCode ? `/AggregatorsView?store=${encodeURIComponent(storeCode)}` : '/AggregatorsView';
    navigate(url);
  };

  if (isLoading) {
    return (
      <div style={{
        borderRadius: 20, padding: '18px 16px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(233,30,140,0.1)',
        boxShadow: '0 4px 20px rgba(233,30,140,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120,
      }}>
        <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid #FFB3D9', borderTopColor:'#E91E8C', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.5, ease:[0.23,1,0.32,1] }}
      onClick={handleOpen}
      style={{
        borderRadius: 20,
        padding: '16px',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(233,30,140,0.12)',
        boxShadow: '0 4px 24px rgba(233,30,140,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Soft pink glow top-right */}
      <div style={{
        position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(233,30,140,0.1) 0%,transparent 70%)',
        filter:'blur(20px)', pointerEvents:'none',
      }}/>

      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:12 }}>

        {/* Donut mini */}
        <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)', width:60, height:60, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(233,30,140,0.12) 30%,transparent 70%)',
            filter:'blur(10px)', pointerEvents:'none',
          }}/>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={22} outerRadius={34}
                dataKey="value" paddingAngle={2} stroke="none">
                {donutData.map((d,i) => <Cell key={i} fill={d.color}/>)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center */}
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', pointerEvents:'none',
          }}>
            <Crown style={{color:'#E91E8C',width:9,height:9}}/>
            <span style={{ fontSize:9, fontWeight:900, color:'#E91E8C', lineHeight:1.1 }}>
              {leader?.pct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:22, height:22, borderRadius:7, background:'rgba(233,30,140,0.09)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp style={{color:'#E91E8C',width:11,height:11}}/>
              </div>
              <div>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', color:'#E91E8C', margin:0 }}>Agregadores</p>
                <p style={{ fontSize:11, fontWeight:900, color:'#1C1C1E', margin:0, letterSpacing:'-0.02em', lineHeight:1.1 }}>
                  {totalVentas > 1 ? fmtCOP(totalVentas) : `${channels.length} canales`}
                </p>
              </div>
            </div>
            <ChevronRight style={{color:'#E91E8C',width:14,height:14,opacity:0.6,flexShrink:0}}/>
          </div>

          {/* Channel pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {channels.slice(0,4).map((c,i) => (
              <div key={c.channel} style={{
                display:'flex', alignItems:'center', gap:3,
                padding:'2px 7px', borderRadius:99,
                background:`${c.meta.color}10`,
                border:`1px solid ${c.meta.color}20`,
              }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:c.meta.color, flexShrink:0 }}/>
                <span style={{ fontSize:9, fontWeight:700, color:c.meta.color }}>{c.channel.split(' ')[0]}</span>
                <span style={{ fontSize:9, fontWeight:900, color:c.meta.color }}>{c.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>

          {/* Mini progress bars */}
          <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:7 }}>
            {channels.slice(0,3).map((c,i) => (
              <div key={c.channel} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:8, fontWeight:600, color:'#8E8E93', width:36, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.channel.split(' ')[0]}
                </span>
                <div style={{ flex:1, height:4, borderRadius:99, background:`${c.meta.color}12` }}>
                  <motion.div
                    initial={{ width:0 }}
                    animate={{ width:`${c.pct}%` }}
                    transition={{ delay:0.3+i*0.08, duration:0.8, ease:[0.23,1,0.32,1] }}
                    style={{ height:4, borderRadius:99, background:c.meta.color }}
                  />
                </div>
                <span style={{ fontSize:8, fontWeight:900, color:c.meta.color, width:28, textAlign:'right', flexShrink:0 }}>
                  {c.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}