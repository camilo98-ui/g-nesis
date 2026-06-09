import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, TrendingUp, Crown, Sparkles, ArrowUpRight } from 'lucide-react';

/* ── helpers ── */
const fmtCOP = (v) => v
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v))
  : '$0';

const CHANNEL_META = {
  'Al Paso':           { color: '#E91E8C', emoji: '🏠', gradient: 'linear-gradient(135deg,#E91E8C,#FF6CAB)' },
  'Rappi':             { color: '#FF3B30', emoji: '🛵', gradient: 'linear-gradient(135deg,#FF3B30,#FF6B6B)' },
  'Didi':              { color: '#FF9500', emoji: '🚗', gradient: 'linear-gradient(135deg,#FF9500,#FFCC02)' },
  'Domicilios Propios':{ color: '#5856D6', emoji: '📦', gradient: 'linear-gradient(135deg,#5856D6,#AF52DE)' },
  'iFood':             { color: '#EA1D2C', emoji: '🍔', gradient: 'linear-gradient(135deg,#EA1D2C,#f87171)' },
};
const FALLBACK_COLORS = ['#E91E8C','#FF6CAB','#FF9500','#5856D6','#34C759','#AF52DE'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || {
    color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    emoji: '📊',
    gradient: `linear-gradient(135deg,${FALLBACK_COLORS[idx % FALLBACK_COLORS.length]},${FALLBACK_COLORS[(idx+1) % FALLBACK_COLORS.length]})`,
  };
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const u = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const bta = u.match(/\bBTA\s*(\d+)/); if (bta) return `BTA ${bta[1]}`;
  const tunja = u.match(/\bTUNJA\s*(\d+)/); if (tunja) return `TUNJA ${tunja[1]}`;
  const bogota = u.match(/\bBOGOTA\s*(\d+)/); if (bogota) return `BOGOTA ${bogota[1]}`;
  return storeId;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ── Mini sparkline ── */
function Sparkline() {
  const pts = [40,55,48,62,58,70,65,80,75,88,82,95];
  const W=80, H=36, padX=2, padY=4;
  const max=Math.max(...pts), min=Math.min(...pts), range=max-min||1;
  const toX=(i)=>padX+i/(pts.length-1)*(W-padX*2);
  const toY=(v)=>H-padY-(v-min)/range*(H-padY*2);
  const coords=pts.map((v,i)=>[toX(i),toY(v)]);
  let d=`M${coords[0][0]},${coords[0][1]}`;
  for(let i=0;i<coords.length-1;i++){
    const p1=coords[i],p2=coords[i+1];
    const cpx=(p1[0]+p2[0])/2;
    d+=` C${cpx},${p1[1]} ${cpx},${p2[1]} ${p2[0]},${p2[1]}`;
  }
  const [lx,ly]=coords[coords.length-1];
  const area=`${d} L${lx},${H} L${coords[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-9" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={d} stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill="white"/>
      <circle cx={lx} cy={ly} r="5" fill="white" opacity="0.2"/>
    </svg>
  );
}

/* ════════════════════════════════════════ MAIN ════════════════════════════════════════ */
export default function AggregatorsView() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  const storeCode = storeParam ? extractStoreCode(storeParam) : null;

  const [selectedMonth, setSelectedMonth] = useState(null);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['aggregators-view', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter(r => String(r.store_code||'').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
  });

  const availableMonths = useMemo(() => {
    const seen = new Set(), list = [];
    allRecords.forEach(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      if (key && !seen.has(key)) { seen.add(key); list.push({ key, month: r.month || new Date(r.uploaded_at||Date.now()).getMonth()+1, year: r.year || new Date(r.uploaded_at||Date.now()).getFullYear() }); }
    });
    return list.sort((a,b)=>b.key.localeCompare(a.key));
  }, [allRecords]);

  const activeKey = selectedMonth || availableMonths[0]?.key || null;
  const activeMonthObj = availableMonths.find(m=>m.key===activeKey);

  const records = useMemo(() => {
    if (!activeKey) return allRecords;
    return allRecords.filter(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      return key === activeKey;
    });
  }, [allRecords, activeKey]);

  const channels = useMemo(() => {
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
      return arr.map((d,i) => ({
        ...d,
        pct: totalSalesSum > 0 ? (d.total_sales / totalSalesSum * 100) : 0,
        meta: getMeta(d.channel, i),
      }));
    } else {
      arr.forEach(d => { d.participation = d.participation / d.count; });
      const totalPart = arr.reduce((s,d) => s + d.participation, 0);
      arr.sort((a,b) => b.participation - a.participation);
      return arr.map((d,i) => ({
        ...d,
        total_sales: 0,
        pct: totalPart > 0 ? (d.participation / totalPart * 100) : d.participation,
        meta: getMeta(d.channel, i),
      }));
    }
  }, [records]);

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const leader = channels[0];
  const monthLabel = activeMonthObj ? `${MONTHS[activeMonthObj.month-1]} ${activeMonthObj.year}` : 'Reciente';
  const displayStore = storeCode || 'Todas';
  const donutData = channels.map(c => ({ name: c.channel, value: c.total_sales > 1 ? c.total_sales : c.pct, color: c.meta.color }));

  const updatedAt = (() => {
    const now = new Date();
    return now.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  })();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#FFFFFF',
      fontFamily: "'Inter Tight','Inter',system-ui,sans-serif",
      overflowY: 'auto',
      zIndex: 9999,
    }}>

      {/* ── HEADER ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '18px 16px 14px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(233,30,140,0.08)',
      }}>
        <div className="flex items-center justify-between w-full">
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            style={{
              width: 36, height: 36,
              borderRadius: 14,
              background: 'rgba(233,30,140,0.08)',
              border: '1px solid rgba(233,30,140,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ color:'#E91E8C', width:18, height:18 }} />
          </button>

          {/* Title */}
          <div className="text-center">
            <p style={{ fontSize: 17, fontWeight: 900, color: '#1C1C1E', letterSpacing: '-0.03em', margin: 0 }}>Agregadores</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginTop: 2 }}>Participación por canal · {displayStore}</p>
          </div>

          {/* Trending icon */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 14,
            background: 'linear-gradient(135deg,#E91E8C,#AF52DE)',
            boxShadow: '0 4px 16px rgba(233,30,140,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp style={{ color:'#fff', width:16, height:16 }} />
          </div>
        </div>

        {/* Month selector */}
        {availableMonths.length > 1 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginTop:12, paddingBottom:2 }}>
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: m.key === activeKey ? 'linear-gradient(135deg,#E91E8C,#AF52DE)' : 'rgba(233,30,140,0.07)',
                  color: m.key === activeKey ? '#fff' : '#E91E8C',
                  boxShadow: m.key === activeKey ? '0 4px 12px rgba(233,30,140,0.3)' : 'none',
                }}>
                {MONTHS[m.month-1]} {m.year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {isLoading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding: '120px 0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2.5px solid #FFB3D9',
              borderTopColor: '#E91E8C',
              animation: 'spin 0.8s linear infinite',
            }}/>
          </div>
        ) : channels.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 0', gap:12 }}>
            <div style={{ width:64, height:64, borderRadius:24, background:'rgba(233,30,140,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp style={{color:'#E91E8C',width:28,height:28,opacity:0.4}}/>
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:'#636366' }}>Sin datos de agregadores</p>
            <p style={{ fontSize:12, color:'#AEAEB2', textAlign:'center' }}>Carga el archivo Excel desde el panel del gerente</p>
          </div>
        ) : (
          <>
            {/* ══ 1. HERO KPI ══ */}
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.05, duration:0.5, ease:[0.23,1,0.32,1] }}
              style={{
                borderRadius: 24,
                padding: '24px 22px 20px',
                background: 'radial-gradient(ellipse 120% 100% at 50% -10%, #FFD6EC 0%, #FFF0F9 45%, #F8F0FF 80%, #EEF0FF 100%)',
                border: '1px solid rgba(233,30,140,0.18)',
                boxShadow: '0 8px 40px rgba(233,30,140,0.12), 0 2px 8px rgba(233,30,140,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Soft glow blob top-right */}
              <div style={{
                position:'absolute', top:-40, right:-30, width:160, height:160,
                borderRadius:'50%',
                background:'radial-gradient(circle,rgba(233,30,140,0.15) 0%,transparent 70%)',
                filter:'blur(20px)',
                pointerEvents:'none',
              }}/>

              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(233,30,140,0.55)', margin:0, marginBottom:6 }}>
                    Venta Total · {monthLabel}
                  </p>
                  <p style={{ fontSize: totalVentas > 1 ? 34 : 22, fontWeight:900, color:'#1C1C1E', lineHeight:1.1, letterSpacing:'-0.04em', margin:0 }}>
                    {totalVentas > 1 ? fmtCOP(totalVentas) : 'Ver canales ↓'}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:4,
                      padding:'3px 8px', borderRadius:8,
                      background:'rgba(52,199,89,0.12)',
                    }}>
                      <ArrowUpRight style={{color:'#34C759',width:12,height:12}}/>
                      <span style={{ fontSize:11, fontWeight:800, color:'#34C759' }}>+8.4%</span>
                    </div>
                    <span style={{ fontSize:10, color:'#8E8E93', fontWeight:500 }}>vs período anterior</span>
                  </div>
                </div>
                <Sparkline />
              </div>

              <div style={{ position:'relative', zIndex:1, marginTop:16, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                <span style={{ fontSize:10, fontWeight:600, color:'#8E8E93' }}>{channels.length} canales activos</span>
              </div>
            </motion.div>

            {/* ══ 2. DONUT CHART ══ */}
            <motion.div
              initial={{ opacity:0, scale:0.97 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.14, duration:0.5, ease:[0.23,1,0.32,1] }}
              style={{
                borderRadius: 24,
                padding: '22px 20px 20px',
                background: '#FFFFFF',
                border: '1px solid rgba(233,30,140,0.1)',
                boxShadow: '0 4px 24px rgba(233,30,140,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{
                  width:30, height:30, borderRadius:10,
                  background:'rgba(233,30,140,0.09)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Crown style={{color:'#E91E8C',width:14,height:14}}/>
                </div>
                <p style={{ fontSize:14, fontWeight:900, color:'#1C1C1E', letterSpacing:'-0.02em', margin:0 }}>Distribución por Canal</p>
              </div>

              {/* Donut */}
              <div style={{ position:'relative', height:220 }}>
                {/* Glow behind donut */}
                <div style={{
                  position:'absolute', top:'50%', left:'50%',
                  transform:'translate(-50%,-50%)',
                  width:200, height:200, borderRadius:'50%',
                  background:'radial-gradient(circle,rgba(233,30,140,0.18) 30%,transparent 70%)',
                  filter:'blur(24px)',
                  pointerEvents:'none',
                }}/>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={72} outerRadius={100}
                      dataKey="value"
                      paddingAngle={2}
                      stroke="none"
                      animationBegin={200}
                      animationDuration={900}
                    >
                      {donutData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip
                      formatter={(v,n) => [fmtCOP(v), n]}
                      contentStyle={{
                        borderRadius:14, border:'1px solid rgba(233,30,140,0.12)',
                        background:'rgba(255,255,255,0.98)',
                        boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
                        fontSize:12, fontWeight:600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position:'absolute', inset:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  pointerEvents:'none',
                }}>
                  {leader && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <Crown style={{color:'#E91E8C',width:14,height:14}}/>
                      <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#8E8E93', margin:0 }}>Canal Líder</p>
                      <p style={{ fontSize:13, fontWeight:900, color:'#1C1C1E', margin:0, letterSpacing:'-0.02em' }}>{leader.channel}</p>
                      <p style={{ fontSize:18, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.04em' }}>{leader.pct.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 16px', marginTop:8 }}>
                {channels.map((c) => (
                  <div key={c.channel} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:c.meta.color, flexShrink:0 }}/>
                    <span style={{ fontSize:10, fontWeight:600, color:'#636366' }}>{c.channel}</span>
                    <span style={{ fontSize:10, fontWeight:900, color:c.meta.color, fontVariantNumeric:'tabular-nums' }}>{c.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ══ 3. RANKING CANALES ══ */}
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.22, duration:0.5, ease:[0.23,1,0.32,1] }}
            >
              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', color:'#AEAEB2', marginBottom:12, paddingLeft:4 }}>
                Ranking por Canal
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {channels.map((c, i) => (
                  <motion.div
                    key={c.channel}
                    initial={{ opacity:0, x:-16 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: 0.28 + i*0.07, duration:0.4, ease:[0.23,1,0.32,1] }}
                    style={{
                      borderRadius: 20,
                      padding: '16px 16px 14px',
                      background: '#FFFFFF',
                      border: `1px solid ${c.meta.color}20`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.04), 0 1px 4px ${c.meta.color}18`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Left accent */}
                    <div style={{
                      position:'absolute', left:0, top:12, bottom:12,
                      width:4, borderRadius:'0 4px 4px 0',
                      background: c.meta.gradient,
                    }}/>

                    <div style={{ paddingLeft:12, display:'flex', alignItems:'center', gap:12 }}>
                      {/* Icon circle */}
                      <div style={{
                        width:44, height:44,
                        borderRadius:16,
                        background:`${c.meta.color}10`,
                        border:`1.5px solid ${c.meta.color}20`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0,
                        fontSize:22,
                      }}>
                        {c.meta.emoji}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                          <p style={{ fontSize:14, fontWeight:900, color:'#1C1C1E', margin:0, letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.channel}
                          </p>
                          <p style={{ fontSize:18, fontWeight:900, color:c.meta.color, margin:0, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums', flexShrink:0, marginLeft:8 }}>
                            {c.pct.toFixed(1)}%
                          </p>
                        </div>
                        <p style={{ fontSize:11, fontWeight:600, color:'#8E8E93', margin:'0 0 8px 0' }}>
                          {c.total_sales > 1 ? fmtCOP(c.total_sales) : `Participación: ${c.pct.toFixed(1)}%`}
                        </p>
                        {/* Progress bar */}
                        <div style={{ width:'100%', height:6, borderRadius:99, background:`${c.meta.color}15` }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${c.pct}%` }}
                            transition={{ delay:0.4+i*0.07, duration:0.9, ease:[0.23,1,0.32,1] }}
                            style={{ height:6, borderRadius:99, background:c.meta.gradient }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ══ 4. AI INSIGHT ══ */}
            {leader && (
              <motion.div
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.55, duration:0.5, ease:[0.23,1,0.32,1] }}
                style={{
                  borderRadius: 20,
                  padding: '18px 18px',
                  background: 'linear-gradient(135deg,rgba(233,30,140,0.05) 0%,rgba(175,82,222,0.06) 100%)',
                  border: '1px solid rgba(233,30,140,0.12)',
                  boxShadow: '0 4px 20px rgba(233,30,140,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%',
                  background:'rgba(233,30,140,0.08)', filter:'blur(20px)', pointerEvents:'none',
                }}/>
                <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{
                    width:36, height:36, borderRadius:12, flexShrink:0,
                    background:'linear-gradient(135deg,#E91E8C,#AF52DE)',
                    boxShadow:'0 4px 14px rgba(233,30,140,0.35)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Sparkles style={{color:'#fff',width:16,height:16}}/>
                  </div>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', color:'#E91E8C', margin:'0 0 6px 0' }}>
                      Insight Comercial · Nova AI
                    </p>
                    <p style={{ fontSize:13, fontWeight:500, color:'#3C3C43', lineHeight:1.55, margin:0 }}>
                      <span style={{ fontWeight:900, color:'#1C1C1E' }}>{leader.channel}</span> concentra el{' '}
                      <span style={{ color:'#E91E8C', fontWeight:800 }}>{leader.pct.toFixed(1)}%</span> de las ventas del punto.
                      {channels[1] && (
                        <> <span style={{ fontWeight:900, color:'#1C1C1E' }}>{channels[1].channel}</span> representa una oportunidad importante con{' '}
                        <span style={{ color:channels[1].meta.color, fontWeight:800 }}>{channels[1].pct.toFixed(1)}%</span> de participación.</>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ 5. TABLA EJECUTIVA ══ */}
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.65, duration:0.5, ease:[0.23,1,0.32,1] }}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                background: '#FFFFFF',
                border: '1px solid rgba(233,30,140,0.09)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Header row */}
              <div style={{
                padding:'12px 16px',
                display:'flex', alignItems:'center',
                background:'linear-gradient(135deg,rgba(233,30,140,0.05),rgba(175,82,222,0.03))',
                borderBottom:'1px solid rgba(233,30,140,0.08)',
              }}>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', color:'#AEAEB2', flex:'1', margin:0 }}>Canal</p>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', color:'#AEAEB2', width:100, textAlign:'right', margin:0 }}>Venta</p>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.18em', color:'#AEAEB2', width:48, textAlign:'right', margin:0 }}>Part.</p>
              </div>
              {/* Data rows */}
              {channels.map((c,i) => (
                <motion.div
                  key={c.channel}
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  transition={{ delay:0.7+i*0.04 }}
                  style={{
                    padding:'13px 16px',
                    display:'flex', alignItems:'center',
                    borderBottom: i < channels.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:c.meta.color, flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight:600, color:'#3C3C43', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.channel}</span>
                  </div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#1C1C1E', width:100, textAlign:'right', margin:0, fontVariantNumeric:'tabular-nums' }}>
                    {c.total_sales > 1 ? fmtCOP(c.total_sales) : '—'}
                  </p>
                  <p style={{ fontSize:13, fontWeight:900, color:c.meta.color, width:48, textAlign:'right', margin:0, fontVariantNumeric:'tabular-nums' }}>
                    {c.pct.toFixed(1)}%
                  </p>
                </motion.div>
              ))}
              {/* Total */}
              <div style={{
                padding:'13px 16px',
                display:'flex', alignItems:'center',
                background:'linear-gradient(135deg,rgba(233,30,140,0.04),rgba(175,82,222,0.03))',
              }}>
                <p style={{ fontSize:12, fontWeight:900, color:'#1C1C1E', flex:1, margin:0 }}>Total</p>
                <p style={{ fontSize:13, fontWeight:900, color:'#1C1C1E', width:100, textAlign:'right', margin:0, fontVariantNumeric:'tabular-nums' }}>
                  {fmtCOP(totalVentas)}
                </p>
                <p style={{ fontSize:13, fontWeight:900, color:'#E91E8C', width:48, textAlign:'right', margin:0 }}>100%</p>
              </div>
            </motion.div>

            {/* ══ 6. FOOTER ══ */}
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:0.8, duration:0.4 }}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 4px 0' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:7, height:7, borderRadius:'50%',
                  background:'#34C759',
                  boxShadow:'0 0 8px rgba(52,199,89,0.7)',
                }}/>
                <p style={{ fontSize:10, color:'#AEAEB2', fontWeight:500, margin:0 }}>Datos en tiempo real</p>
              </div>
              <p style={{ fontSize:10, color:'#C7C7CC', fontWeight:500, margin:0 }}>{updatedAt}</p>
            </motion.div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}